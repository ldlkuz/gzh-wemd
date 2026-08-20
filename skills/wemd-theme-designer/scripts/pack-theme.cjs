/**
 * pack-theme.cjs — 主题打包
 *
 * 读取 AI 端到端产出（themes/{theme}/manifest.json + css/{theme}.css + templates.json），生成：
 *   - manifest.json（ThemePackageManifest 格式，含组件 variantCss）
 *   - brand.md（品牌描述）
 *   - styles/components.css（完整 CSS，微信兼容清理）
 *
 * 用法：node scripts/pack-theme.cjs [theme-name]
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// ============================================================
// 配置
// ============================================================
const ROOT = path.resolve(__dirname, "..");

// 主题名称（默认 intelligent-precision，可通过命令行参数指定，如 node scripts/pack-theme.cjs mountain-mist）
const THEME_NAME = process.argv[2] || "intelligent-precision";

// 主题目录：themes/{theme-name}/（产物全程按主题隔离，见 reference/artifact-layout.md）
const THEME_DIR = path.join(ROOT, "themes", THEME_NAME);

const CSS_FILE = path.join(THEME_DIR, "css", `${THEME_NAME}.css`);
const MANIFEST_FILE = path.join(THEME_DIR, "manifest.json");
const THEME_PACKAGE_DIR = path.join(THEME_DIR, "package");

// 主题未提供对应 CSS 变量时的回退色
const FALLBACK_COLORS = {
  primary: "#8A6D4F",
  primaryDark: "#6B563F",
  primaryLight: "#C29A6B",
  secondary: "#C29A6B",
  accent: "#B9823E",
  background: "#F7F1E6",
  bgSoft: "#F3EBDA",
  bgCard: "#FFFFFF",
  bgMuted: "#FDFAF3",
  textStrong: "#3E3428",
  textNormal: "#8A7A66",
  textSoft: "#B3A48E",
  border: "#E5DAC6",
  borderSoft: "#C29A6B",
};

// ============================================================
// 辅助：CSS 变量解析器
// ============================================================

/**
 * 从 CSS 中提取 #wemd { ... } 块中的 CSS 变量定义
 */
function extractCssVars(css) {
  const vars = {};
  // 匹配 #wemd { ... } 块
  const match = css.match(/#wemd\s*\{([^}]+)\}/);
  if (!match) return vars;

  const block = match[1];
  const varRegex = /--([\w-]+)\s*:\s*([^;]+);/g;
  let m;
  while ((m = varRegex.exec(block)) !== null) {
    vars[m[1].trim()] = m[2].trim();
  }
  return vars;
}

/**
 * 解析并替换 CSS 中的 var(--xxx) 引用为实际值
 * 支持嵌套 var() 和 fallback 值
 */
function resolveCssVars(css, vars) {
  return css.replace(/var\(\s*--([\w-]+)\s*(?:,\s*([^)]+))?\s*\)/g, (match, name, fallback) => {
    const value = vars[name];
    if (value !== undefined) {
      // 如果值本身也包含 var()，递归解析
      if (value.includes("var(")) {
        return resolveCssVars(value, vars);
      }
      return value;
    }
    // 有 fallback 则用 fallback
    if (fallback !== undefined) {
      return fallback.trim();
    }
    // 没有定义也没有 fallback，保留原样
    return match;
  });
}

/**
 * 清理 CSS 中的微信不兼容特性
 *
 * 微信公众号支持的 CSS 子集有限，不支持以下特性，复制到公众号后样式会静默丢失：
 *   - ::before / ::after 伪元素
 *   - :hover 伪类
 *   - :first-child / :last-child / :first-of-type / :nth-child 等结构伪类
 *   - @keyframes 动画
 *   - animation / animation-delay 属性
 *   - @media 媒体查询
 *   - + 相邻兄弟选择器 / ~ 通用兄弟选择器
 *
 * 采用逐行扫描 + 大括号深度跟踪的方式，确保只移除匹配的规则块，
 * 不会误删其他规则块的内容。
 */
/**
 * 清理 CSS 中的微信不兼容特性
 *
 * @param {string} css - 源 CSS
 * @param {boolean} [preserveNeutralizers=true] - 是否保留「纯中和规则」。
 *   - true（components.css 全量路径）：保留 `::before/::after + content: none`，
 *     与内置主题 `#wemd .wemd-xxx::before { content: none }` 同理，只抑制共享
 *     伪元素装饰（callout-pro 左竖条 / divider 侧线），本身不产生视觉；缺失会
 *     导致预览与导出出现双竖条/双线。
 *   - false（逐组件 variantCss 路径）：剥离中和规则。中和规则只放 components.css
 *     （注入顺序最末）。放 variantCss 会因含 #wemd 导致 normalizeVariantCss 短路，
 *     不再为同组件其他变体规则补 #wemd 前缀 → 特异性不足被共享样式覆盖。
 */
function cleanVariantCss(css, preserveNeutralizers = true) {
  // 选择器中包含这些模式时，整条规则块将被移除。
  // 唯一例外：纯中和规则（::before/::after + 仅 content: none）在 preserveNeutralizers=true 时保留。
  const disallowedSelectorPatterns = [
    /::(before|after)/,                                                                  // 伪元素（中和规则除外）
    /:hover/,                                                                            // 悬停伪类
    /:(first-child|last-child|first-of-type|last-of-type)/,                              // 结构伪类（不含 nth）
    /:nth-child\s*\(/,                                                                   // nth-child
    /:nth-last-child\s*\(/,                                                              // nth-last-child
    /\s[+~]\s/,                                                                          // 相邻/通用兄弟选择器
  ];

  const lines = css.split("\n");
  const result = [];
  let i = 0;

  while (i < lines.length) {
    const trimmed = lines[i].trim();

    // -------------------------------------------------------
    // 跳过 @keyframes / @media 块（含嵌套大括号）
    // -------------------------------------------------------
    if (/@(keyframes|media)\b/.test(trimmed)) {
      i = skipBlock(lines, i);
      continue;
    }

    // -------------------------------------------------------
    // 定位逻辑块：从当前行向前找到含 { 的选择器行（支持多行选择器）
    // -------------------------------------------------------
    let braceLine = -1;
    for (let j = i; j < lines.length; j++) {
      if (lines[j].includes("{")) { braceLine = j; break; }
    }
    if (braceLine === -1) {
      // 无更多规则块，剩余行原样保留（仅清理 animation 行）
      while (i < lines.length) {
        if (!/^\s*(animation|animation-delay)\s*:/.test(lines[i])) {
          result.push(lines[i]);
        }
        i++;
      }
      break;
    }

    // 选择器文本 = 起始行到 { 之前的所有内容
    const selectorText = (
      lines.slice(i, braceLine).join("\n") +
      lines[braceLine].slice(0, lines[braceLine].indexOf("{"))
    ).trim();

    // 块结束 = 从 braceLine 开始括号平衡到 0
    let depth = 0;
    let end = braceLine;
    for (; end < lines.length; end++) {
      for (const ch of lines[end]) {
        if (ch === "{") depth++;
        if (ch === "}") depth--;
      }
      if (depth <= 0) break;
    }
    const blockLines = lines.slice(i, end + 1);

    // 检查选择器是否含禁用模式时先剥离注释：注释里的关键词（如「根 + body」的 +、
    // 说明文字中的 ::before/:hover）不是代码，不该触发整块移除。
    const noCommentSelector = selectorText.replace(/\/\*[\s\S]*?\*\//g, "");
    const hasIssue = disallowedSelectorPatterns.some((p) =>
      p.test(noCommentSelector),
    );
    const isNeutralizer = isPureNeutralizer(selectorText, blockLines);

    if (!hasIssue || (preserveNeutralizers && isNeutralizer)) {
      // 保留：无兼容问题，或（保留模式下）纯中和规则（content: none）
      result.push(...stripAnimationLines(blockLines));
    }
    // 否则整块移除（选择器 + 声明一起）
    i = end + 1;
  }

  // 清理多余空行
  return result.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

/** 跳过整块（@keyframes/@media），返回下一行下标 */
function skipBlock(lines, startIdx) {
  let depth = 0;
  let started = false;
  let i = startIdx;
  while (i < lines.length) {
    for (const ch of lines[i]) {
      if (ch === "{") depth++;
      if (ch === "}") depth--;
    }
    i++;
    if (started && depth === 0) break;
    if (depth > 0) started = true;
  }
  return i;
}

/**
 * 是否为「纯中和规则」：选择器含 ::before/::after，且声明块仅 content: none
 * （可带 !important，与内置主题 eastern-notes 的中和写法一致）。
 * 这类规则不产生视觉，必须保留，否则共享伪元素装饰会在预览/导出时叠加成双。
 */
function isPureNeutralizer(selectorText, blockLines) {
  if (!/::(before|after)/.test(selectorText)) return false;
  const joined = blockLines.join("\n").replace(/\/\*[\s\S]*?\*\//g, "");
  const m = joined.match(/\{([\s\S]*)\}/);
  const body = m ? m[1].replace(/\s+/g, " ").trim() : "";
  return /^content\s*:\s*none\s*(!important)?\s*;?$/.test(body);
}

/** 移除块内的 animation / animation-delay 属性行 */
function stripAnimationLines(blockLines) {
  return blockLines.filter(
    (l) => !/^\s*(animation|animation-delay)\s*:/.test(l),
  );
}

// ============================================================
// 辅助：CSS 选择器转换
// ============================================================

/**
 * 将 #wemd .wemd-xxx 选择器转换为 .wemd-xxx[data-variant="future-frontier"]
 *
 * 注意：`(?!::)` 负向前瞻让「纯中和规则」（#wemd .wemd-xxx::before { content: none }）
 * 保持原选择器不变。中和规则是针对共享伪元素装饰的（非本主题变体样式），
 * 转为 [data-variant] 形式后物化器按 `.wemd-xxx::before` 字面子串匹配不到，
 * 导出时仍会物化共享竖条 → 双竖条。
 */
function convertSelector(css, componentName) {
  const variantName = THEME_NAME;
  const pattern = new RegExp(
    `#wemd\\s+(\\.wemd-${componentName})(?!::)(?=[\\s{,:])`,
    "g",
  );
  return css.replace(pattern, (match, className) => {
    return `${className}[data-variant="${variantName}"]`;
  });
}

// ============================================================
// 辅助：提取组件 CSS
// ============================================================

function extractComponentCss(fullCss, componentName) {
  // 使用 (?=[\s{,:]) 作为词边界，防止 divider 匹配到 divider-fancy
  const selectorPattern = `#wemd\\s+\\.wemd-${componentName}(?=[\\s{,:])`;
  const selectorRegex = new RegExp(selectorPattern);
  const match = selectorRegex.exec(fullCss);
  if (!match) return null;

  const selectorIdx = match.index;

  // 往前找最近的注释块
  let startIdx = selectorIdx;
  const commentEndRegex = /\*\//g;
  let lastCommentEnd = -1;
  let searchPos = 0;
  while (true) {
    commentEndRegex.lastIndex = searchPos;
    const ce = commentEndRegex.exec(fullCss);
    if (!ce || ce.index >= selectorIdx) break;
    lastCommentEnd = ce.index + 2;
    searchPos = ce.index + 1;
  }

  if (lastCommentEnd > 0) {
    const commentStartRegex = /\/\*/g;
    let lastCommentStart = -1;
    searchPos = 0;
    while (true) {
      commentStartRegex.lastIndex = searchPos;
      const cs = commentStartRegex.exec(fullCss);
      if (!cs || cs.index >= selectorIdx) break;
      const endIdx = fullCss.indexOf("*/", cs.index + 2);
      if (endIdx > 0 && endIdx < selectorIdx) {
        lastCommentStart = cs.index;
      }
      searchPos = cs.index + 1;
    }
    startIdx = lastCommentStart >= 0 ? lastCommentStart : Math.max(0, selectorIdx - 200);
  } else {
    startIdx = Math.max(0, selectorIdx - 200);
  }

  // 找到下一个顶级选择器作为结束
  const nextSelectorRegex = /#wemd\s+\.wemd-/g;
  nextSelectorRegex.lastIndex = selectorIdx + 1;
  let endIdx = fullCss.length;
  let nextMatch;
  let nextText;
  while ((nextMatch = nextSelectorRegex.exec(fullCss)) !== null) {
    nextText = fullCss.slice(nextMatch.index, nextMatch.index + 50);
    // 用词边界判断是否为同一组件的后续选择器（如 .wemd-divider 的后续规则行），
    // divider 不应匹配到 divider-fancy：.wemd-divider-fancy 中 .wemd-divider 后是 "-"，
    // 不在 [\s{,:] 中，视为不同组件。
    const sameComp = new RegExp(
      `#wemd\\s+\\.wemd-${componentName}(?=[\\s{,:])`,
    ).test(nextText);
    if (sameComp) continue;
    endIdx = nextMatch.index;
    break;
  }

  // 同时以「下一个分区注释头」（/* =====...）作为结束边界，
  // 避免把下一组件的注释头划进当前组件（如 divider 注释里的 ::before/::after
  // 被带进 stats-block 的 variantCss，导致校验误报伪元素）。
  const sectionRe = /\/\*[ \t]*={2,}/g;
  sectionRe.lastIndex = selectorIdx + 1;
  let secMatch;
  while ((secMatch = sectionRe.exec(fullCss)) !== null) {
    if (secMatch.index < selectorIdx || secMatch.index >= endIdx) break;
    endIdx = secMatch.index;
    break;
  }

  return fullCss.slice(startIdx, endIdx).trim();
}

// ============================================================
// 辅助：CSS 变量引用校验
// ============================================================

/**
 * 扫描 CSS 中引用的 var(--xxx)，返回不在变量集内的未定义变量名集合
 */
function findUndefinedVars(css, vars) {
  const undefinedSet = new Set();
  const varRegex = /var\(\s*--([\w-]+)/g;
  let m;
  while ((m = varRegex.exec(css)) !== null) {
    const name = m[1].trim();
    if (vars[name] === undefined) {
      undefinedSet.add(name);
    }
  }
  return undefinedSet;
}

// ============================================================
// 读取输入
// ============================================================

console.log("📖 读取输入文件...");

const themeManifest = JSON.parse(fs.readFileSync(MANIFEST_FILE, "utf-8"));
const fullCss = fs.readFileSync(CSS_FILE, "utf-8");

// ============================================================
// 打包前校验：CSS 选择器 + 嵌套 var（拦截漂移，避免打包错误主题）
// ============================================================
console.log("🔍 打包前校验 CSS 选择器...");
try {
  execSync(
    `node "${path.join(__dirname, "validate-css-selectors.mjs")}" ${THEME_NAME}`,
    { stdio: "inherit", encoding: "utf-8" },
  );
} catch (e) {
  console.error("\n🚫 打包中止：CSS 选择器校验未通过（见上方错误）。请修正后重试。\n");
  process.exit(1);
}

// 提取 CSS 变量定义
const cssVars = extractCssVars(fullCss);
console.log(`  📊 提取到 ${Object.keys(cssVars).length} 个 CSS 变量定义`);

// ============================================================
// 构建 manifest.json
// ============================================================

console.log("📝 构建 manifest.json...");

// 颜色映射（优先从 CSS 变量推导，回退到默认值）
const cssColorKeys = {
  primary: "wemd-accent-primary",
  primaryDark: "wemd-accent-tertiary",
  primaryLight: "wemd-accent-secondary",
  secondary: "wemd-accent-secondary",
  accent: "wemd-text-tea",
  background: "wemd-bg-base",
  bgSoft: "wemd-bg-section",
  bgCard: "wemd-bg-card",
  bgMuted: "wemd-bg-surface",
  textStrong: "wemd-text-primary",
  textNormal: "wemd-text-secondary",
  textSoft: "wemd-text-muted",
  border: "wemd-border-light",
  borderSoft: "wemd-border-accent",
};
const colorMapping = {};
for (const [token, cssKey] of Object.entries(cssColorKeys)) {
  colorMapping[token] = cssVars[cssKey] || (FALLBACK_COLORS[token] || "#888888");
}

// 排版映射（颜色从 CSS 变量推导）
const headingColor = cssVars["wemd-text-primary"] || "#3E3428";
const typography = {
  fontFamily: cssVars["wemd-font-body"] || "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif",
  fontSize: "16px",
  lineHeight: "1.75",
  letterSpacing: 0,
  heading: {
    h1: { fontSize: 32, color: headingColor, marginTop: 32, marginBottom: 16, fontWeight: "700" },
    h2: { fontSize: 24, color: headingColor, marginTop: 24, marginBottom: 12, fontWeight: "700" },
    h3: { fontSize: 20, color: headingColor, marginTop: 20, marginBottom: 10, fontWeight: "600" },
    h4: { fontSize: 18, color: cssVars["wemd-text-secondary"] || "#8A7A66", marginTop: 16, marginBottom: 8, fontWeight: "600" },
  },
  codeFontFamily: cssVars["wemd-font-mono"] || "'SF Mono', 'Fira Code', 'Consolas', monospace",
};

// 间距映射
const spacing = { pagePadding: 20, paragraphMargin: 16 };

// 边框映射
const border = { radius: 8 };

// 阴影映射
const shadow = {
  enabled: true,
  value: "0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)",
};

// ============================================================
// 提取组件 CSS
// ============================================================

// 从 registry/components.json 按 brand_expression_level 自动分层生成组件清单。
// - high   → 深度设计（品牌视觉/标识强表达）
// - medium → 克制继承（继承品牌色 + 简单装饰）
// - low    → 极简功能（仅可读性 + 品牌色文本）
// 这样任何文章类型都能套主题不裸奔，且无需为每个组件深度设计。
function loadAllComponents() {
  const reg = JSON.parse(
    fs.readFileSync(path.join(ROOT, "registry", "components.json"), "utf8"),
  );
  return reg.map((c) => ({
    id: c.id,
    level: c.brand_expression_level || "medium",
  }));
}

const ALL_COMPONENTS = loadAllComponents();
const COMPONENTS_WITH_CSS = ALL_COMPONENTS.map((c) => c.id);
// 按表达层级分组，供后续按层补充兜底样式
const LEVEL_BY_COMPONENT = Object.fromEntries(
  ALL_COMPONENTS.map((c) => [c.id, c.level]),
);

const components = {};
let undefinedVarErrors = [];

for (const compName of COMPONENTS_WITH_CSS) {
  const rawCss = extractComponentCss(fullCss, compName);
  if (rawCss) {
    // 1. 转换选择器
    const convertedCss = convertSelector(rawCss, compName);
    // 2. 解析 CSS 变量引用（var(--xxx) → 实际值）
    const resolvedCss = resolveCssVars(convertedCss, cssVars);
    // 3. 移除微信不兼容特性（伪元素、结构伪类、@keyframes 等）
    //    完整 CSS 保留在 styles/components.css 中。
    //    variantCss 剥离纯中和规则（content: none）——中和只放 components.css
    //    （注入最末层），放 variantCss 会破坏 normalizeVariantCss 的特异性补全。
    const cleanedCss = cleanVariantCss(resolvedCss, false);
    // 4. 校验未定义 CSS 变量（resolveCssVars 会保留未定义 var() 原样）
    const undefVars = findUndefinedVars(cleanedCss, cssVars);
    if (undefVars.size > 0) {
      undefinedVarErrors.push(
        `  ❌ ${compName} — 引用未定义变量: ${[...undefVars].join(", ")}`,
      );
    }
    // 只有真正提供了 variantCss 的组件才声明 variant。
    // 主程序校验器要求：variant 非空必须配套非空 variantCss（AI 主题不依赖内置预设）。
    // 未提取到 CSS 的组件 variant 留空，走主程序默认内置样式，避免空 variantCss 报错。
    components[compName] = {
      enabled: true,
      variant: cleanedCss.trim() ? THEME_NAME : "",
      variantCss: cleanedCss,
    };
    if (cleanedCss.trim()) {
      console.log(`  ✅ ${compName} — CSS 已提取 (${rawCss.length} chars, var() resolved)`);
    } else {
      console.log(`  ⚠️  ${compName} — 未找到 CSS，variant 留空（走默认样式）`);
    }
  } else {
    console.log(`  ⚠️  ${compName} — 未找到 CSS`);
    components[compName] = {
      enabled: true,
      variant: "",
      variantCss: "",
    };
  }
}

// 若存在未定义 CSS 变量，输出错误并中止打包
if (undefinedVarErrors.length > 0) {
  console.error("\n🚫 打包中止：发现未定义 CSS 变量！");
  console.error(undefinedVarErrors.join("\n"));
  console.error("请先在 CSS 变量系统中定义这些变量，或修正引用。\n");
  process.exit(1);
}

// ============================================================
// 构建 layout 偏好
// ============================================================

const manifestLayout = themeManifest.layout || {};
const preferredComponents = manifestLayout.preferredComponents || [];
const defaultVariants = manifestLayout.defaultVariants || {};
for (const compName of preferredComponents) {
  if (defaultVariants[compName] === undefined) {
    defaultVariants[compName] = THEME_NAME;
  }
}

const tone = Array.isArray(manifestLayout.tone)
  ? manifestLayout.tone
  : ["balanced", "harmonious"];
const density = manifestLayout.density || "medium";

const layout = {
  preferredComponents,
  density,
  tone,
  defaultVariants,
};

// ============================================================
// 构建 manifest
// ============================================================

const brandInfo = themeManifest.brand || {};
const brandNameForMeta = themeManifest.meta?.name || brandInfo.name || "WeMD Theme";
const brandKeywords = themeManifest.meta?.keywords || [];

const manifest = {
  sdkVersion: "1.0.0",
  meta: {
    id: THEME_NAME,
    name: brandNameForMeta,
    description:
      themeManifest.meta?.description ||
      "由 wemd-theme-designer 生成的品牌视觉主题",
    keywords: brandKeywords,
    version: themeManifest.meta?.version || "1.0.0",
  },
  tokens: {
    color: colorMapping,
    typography: typography,
    spacing: spacing,
    border: border,
    shadow: shadow,
  },
  components,
  layout,
  codeTheme: themeManifest.codeTheme || "github-light",
};

// ============================================================
// 构建 brand.md
// ============================================================

console.log("📝 构建 brand.md...");

const brandName = brandInfo.name || brandNameForMeta;
const brandType = brandInfo.type || "product";
const brandPersonality = Array.isArray(brandInfo.personality)
  ? brandInfo.personality.join("、")
  : "calm, artisanal, authentic";
const brandKeywordsMd = Array.isArray(brandInfo.keywords)
  ? brandInfo.keywords.join("、")
  : brandKeywords.join("、");
const brandAudience = Array.isArray(brandInfo.audience)
  ? brandInfo.audience.join("、")
  : "";
const brandEmotion = Array.isArray(brandInfo.emotion)
  ? brandInfo.emotion.join("、")
  : "";
const conceptName = brandInfo.conceptName || "";
const coreConcept = brandInfo.coreConcept || themeManifest.meta?.description || "";

const brandMd = `# ${brandName}

> 品牌类型：${brandType}
> 概念主题：${conceptName}

## 品牌简介

${coreConcept}

## 品牌关键词

${brandKeywordsMd}

## 品牌人格

${brandPersonality}

## 目标受众

${brandAudience}

## 情感方向

${brandEmotion}

---

*主题包生成时间：${new Date().toISOString()}*
*生成器：wemd-theme-designer Stage 7 — Theme Packager*
`;

// ============================================================
// 写入文件
// ============================================================

fs.mkdirSync(THEME_PACKAGE_DIR, { recursive: true });

// manifest.json
const manifestPath = path.join(THEME_PACKAGE_DIR, "manifest.json");
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), "utf-8");
console.log(`  ✅ manifest.json 已写入`);

// brand.md
const brandMdPath = path.join(THEME_PACKAGE_DIR, "brand.md");
fs.writeFileSync(brandMdPath, brandMd, "utf-8");
console.log(`  ✅ brand.md 已写入`);

// styles/components.css（微信兼容版 CSS — 移除伪元素和结构伪类）
const cssOutputPath = path.join(THEME_PACKAGE_DIR, "styles", "components.css");
fs.mkdirSync(path.dirname(cssOutputPath), { recursive: true });
// 同样清理主 CSS，确保微信发布时不会因伪元素/结构伪类导致样式静默丢失
const cleanedFullCss = cleanVariantCss(fullCss);
fs.writeFileSync(cssOutputPath, cleanedFullCss, "utf-8");
console.log(`  ✅ styles/components.css 已写入 (微信兼容清理)`);

// ============================================================
// 骨架模板：templates.json → templates/<id>.html（供主程序 resolveThemeTemplate 消费）
// 主程序加载器从 zip 的 templates/*.html 或 manifest.templates 读取组件骨架，
// 渲染时优先用主题骨架，未提供才回退默认骨架。见 themePackageLoader.ts。
// ============================================================
const templatesJsonPath = path.join(THEME_PACKAGE_DIR, "templates.json");
const templatesOutDir = path.join(THEME_PACKAGE_DIR, "templates");
let skeletonCount = 0;

if (fs.existsSync(templatesJsonPath)) {
  const templates = JSON.parse(fs.readFileSync(templatesJsonPath, "utf-8"));
  fs.mkdirSync(templatesOutDir, { recursive: true });
  for (const [id, html] of Object.entries(templates)) {
    // 仅收集符合主程序加载器命名规则的组件骨架（templates/<id>.html）
    if (typeof html === "string" && /^[a-z][a-z0-9-]*$/.test(id)) {
      fs.writeFileSync(path.join(templatesOutDir, `${id}.html`), html, "utf-8");
      skeletonCount++;
    }
  }
  console.log(`  ✅ templates/*.html 已写入 (${skeletonCount} 个组件骨架)`);
} else {
  console.log(`  ⚠️  未找到 templates.json，跳过骨架打包。请先运行 node scripts/compile-skeleton.cjs`);
}

console.log("");
console.log("✅ 文件生成完成！");
console.log(`   📁 ${THEME_PACKAGE_DIR}`);
console.log("");
console.log("下一步：运行 PowerShell 打包命令");
console.log(`  Compress-Archive -Path "./manifest.json","./brand.md","./styles","./templates" -DestinationPath "../${THEME_NAME}.wemd-theme" -Force`);