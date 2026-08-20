/**
 * verify-theme-package.cjs — 主题包级验证（提炼自主程序 VerifyImportFlow.test.ts）
 *
 * 验证已打包主题能否被主程序正确导入与渲染：
 *   1. loadThemePackageFromZip 能加载 .wemd-theme（导入器放行 content: none 中和规则）
 *   2. renderTheme 组装完整 CSS（大括号平衡）
 *   3. 所有 variantCss 选择器都被补上 #wemd 前缀（normalizeVariantCss 生效）
 *   4. 渲染后 CSS 无「裸露的」（无 #wemd）[data-variant] 选择器
 *   5. variantCss 位于默认组件样式之后（级联顺序正确）
 *   6. variantCss / components.css 无违规伪元素 / 结构伪类（注释感知 + 中和感知）
 *   7. #wemd 无整篇背景
 *   8. 覆盖「共享伪元素装饰清单」组件时，components.css 含 content: none 中和（否则提示）
 *
 * 用法：node scripts/verify-theme-package.cjs [theme-name]
 */
const path = require("path");
const fs = require("fs");

// ============================================================
// 配置
// ============================================================
const ROOT = path.resolve(__dirname, "..");
const CORE_DIST = path.resolve(__dirname, "../../../packages/core/dist");
const THEME_NAME = process.argv[2] || "retro-newspaper";
const THEME_DIR = path.join(ROOT, "themes", THEME_NAME);

const { renderTheme } = require(
  path.join(CORE_DIST, "theme-renderer/index.js"),
);
const { loadThemePackageFromZip } = require(
  path.join(CORE_DIST, "theme-registry/themePackageLoader.js"),
);
const {
  findForbiddenPseudoElement,
  stripCssComments,
} = require(path.join(CORE_DIST, "wechatCompat/whitelist.js"));

// 共享伪元素装饰清单（覆盖这些组件时，若用 border/其它装饰替代共享装饰，必须中和）
// 强制中和的只有 callout-pro / divider（条/线类装饰，最易双条）；
// pullquote 的共享装饰是引号字形、steps/faq 是序号/标记，与 border 不同对象，仅提示。
const SHARED_DECOR_COMPONENTS = {
  "callout-pro": {
    enforce: true,
    neutralizers: ["wemd-callout-pro::before"],
    note: "左竖条 ::before",
  },
  divider: {
    enforce: true,
    neutralizers: [
      "wemd-divider .wemd-component-body::before",
      "wemd-divider .wemd-component-body::after",
    ],
    note: "左右横线 ::before/::after",
  },
  pullquote: {
    enforce: false,
    neutralizers: ["wemd-pullquote"],
    // 根元素 border-left 覆盖（非伪元素）：components.css 中 #wemd .wemd-pullquote
    // 含 border-left: none 即视为已去除共享根竖条
    rootSelector: "wemd-pullquote",
    note: "根元素 border-left:5px（非伪元素）：主题若在 body 另画竖条，需覆盖根元素 border-left:none（渲染级验证把关）",
  },
  steps: {
    enforce: false,
    neutralizers: ["wemd-steps .wemd-component-body li::before"],
    note: "序号 ::before",
  },
  faq: {
    enforce: false,
    neutralizers: ["wemd-faq"],
    note: "标题标记 ::before",
  },
};

// ============================================================
// 报告工具
// ============================================================
const report = [];
let failed = false;

function ok(msg) {
  report.push(`  ✅ ${msg}`);
}
function warn(msg) {
  report.push(`  ⚠️  ${msg}`);
}
function bad(msg) {
  failed = true;
  report.push(`  ❌ ${msg}`);
}

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// ============================================================
// 主流程
// ============================================================
(async () => {
  const zipPath = path.join(THEME_DIR, `${THEME_NAME}.wemd-theme`);
  const manifestFile = path.join(THEME_DIR, "package", "manifest.json");
  const componentsCssFile = path.join(
    THEME_DIR,
    "package",
    "styles",
    "components.css",
  );

  if (!fs.existsSync(manifestFile)) {
    console.error(`❌ 未找到主题清单: ${manifestFile}`);
    process.exit(1);
  }

  const manifest = JSON.parse(fs.readFileSync(manifestFile, "utf-8"));
  const componentsCss = fs.existsSync(componentsCssFile)
    ? fs.readFileSync(componentsCssFile, "utf-8")
    : "";

  console.log(`\n🔍 验证主题包: ${THEME_NAME}\n`);

  // ---------- 1. 导入器加载（zip 存在时） ----------
  console.log("1) 主程序导入器 loadThemePackageFromZip:");
  let templates = new Map();
  if (fs.existsSync(zipPath)) {
    const zipData = fs.readFileSync(zipPath);
    const result = await loadThemePackageFromZip(new Uint8Array(zipData));
    if (!result.ok) {
      bad(`主题包导入失败：${result.errors.map((e) => e.message).join("; ")}`);
    } else {
      ok(`主题包导入成功（${result.value.manifest.meta.name}）`);
      templates = result.value.templates;
    }
  } else {
    warn(`未找到 ${zipPath}，跳过导入器检查（先运行打包）`);
  }

  // ---------- 2. renderTheme 完整 CSS ----------
  console.log("\n2) renderTheme 组装完整 CSS:");
  const fullCss = renderTheme(manifest, { componentsCss });
  ok(`CSS 长度 ${fullCss.length} 字符`);
  const opens = (fullCss.match(/\{/g) || []).length;
  const closes = (fullCss.match(/\}/g) || []).length;
  if (opens === closes) ok(`大括号平衡（${opens} 对）`);
  else bad(`大括号不平衡（{ ${opens} / } ${closes}）`);

  // ---------- 3. variantCss 的 #wemd 前缀 ----------
  console.log("\n3) variantCss 选择器 #wemd 前缀（normalizeVariantCss）:");
  let compWithCss = 0;
  let prefixed = 0;
  for (const [compType, comp] of Object.entries(manifest.components || {})) {
    if (!comp.enabled || !comp.variantCss) continue;
    compWithCss++;
    if (comp.variantCss.includes(`.wemd-${compType}[data-variant`)) {
      const rendered = `#wemd .wemd-${compType}[data-variant="${comp.variant}"]`;
      if (fullCss.includes(rendered)) prefixed++;
      else bad(`组件 ${compType}: 渲染后未找到 ${rendered}`);
    }
  }
  if (prefixed === compWithCss) ok(`${prefixed}/${compWithCss} 个 variantCss 选择器均有 #wemd 前缀`);
  else bad(`${prefixed}/${compWithCss} 个 variantCss 选择器有 #wemd 前缀`);

  // ---------- 4. 无裸露的 [data-variant] 选择器 ----------
  console.log("\n4) 无裸露的（无 #wemd）[data-variant] 选择器:");
  const bareRe = new RegExp(
    `^\\s*\\.wemd-[a-z0-9-]+\\[data-variant`,
    "m",
  );
  if (bareRe.test(fullCss)) bad("渲染后 CSS 存在无 #wemd 的裸组件选择器");
  else ok("无裸选择器");

  // ---------- 5. 级联顺序 ----------
  console.log("\n5) variantCss 位于默认组件样式之后:");
  const defaultIdx = fullCss.indexOf("#wemd .wemd-component");
  const variantIdx = fullCss.indexOf('[data-variant="');
  if (defaultIdx >= 0 && variantIdx > defaultIdx) ok("variantCss 在默认样式之后");
  else if (variantIdx === -1) warn("无 variantCss（所有组件走默认样式）");
  else bad("variantCss 位于默认样式之前（会被覆盖）");

  // ---------- 6. 违规伪元素 / 结构伪类（只扫主题自身 CSS） ----------
  // 主题自身 CSS = manifest.components[*].variantCss + styles/components.css。
  // 完整 renderTheme 输出含主程序共享样式（自带 ::marker / :nth-child 属正常），
  // 不作为主题违规依据。
  console.log("\n6) 无违规伪元素 / 结构伪类（注释感知 + 中和感知）:");
  const themeOwnCss = [
    ...Object.values(manifest.components || {}).map((c) => c.variantCss || ""),
    componentsCss,
  ].join("\n\n");
  const forbiddenPseudo = findForbiddenPseudoElement(themeOwnCss);
  if (forbiddenPseudo) bad(`主题 CSS 含违规伪元素 ${forbiddenPseudo}`);
  else ok("主题 CSS 无违规伪元素（纯 content: none 中和放行）");
  const structural = stripCssComments(themeOwnCss).match(
    /:(first-child|last-child|nth-child|nth-last-child|first-of-type|last-of-type|only-child|only-of-type|empty)\b/i,
  );
  if (structural) bad(`主题 CSS 含结构伪类 ${structural[1]}`);
  else ok("主题 CSS 无结构伪类");

  // ---------- 7. #wemd 无整篇背景 ----------
  console.log("\n7) #wemd 无整篇背景:");
  const wemdBlocks = fullCss.match(/#wemd\s*\{([^{}]*)\}/g) || [];
  let bgHit = false;
  for (const block of wemdBlocks) {
    if (/background(-color)?\s*:/.test(block) && !/background-image\s*:\s*none/.test(block)) {
      bgHit = true;
      break;
    }
  }
  if (bgHit) bad("#wemd 块含 background-color / 整篇背景");
  else ok("#wemd 无整篇背景");

  // ---------- 8. 共享伪元素中和 ----------
  console.log("\n8) 覆盖「共享伪元素装饰清单」组件的中和:");
  const covered = Object.entries(manifest.components || {}).filter(
    ([, c]) => c.enabled && c.variantCss,
  );
  for (const [compType, comp] of covered) {
    const deco = SHARED_DECOR_COMPONENTS[compType];
    if (!deco) continue;
    // 根元素 border-left 覆盖检查（pullquote 等非伪元素共享装饰）
    if (deco.rootSelector) {
      const idx = componentsCss.indexOf(deco.rootSelector);
      const seg = idx === -1 ? "" : componentsCss.slice(idx, idx + 400);
      const rootCleared =
        /\{[^{}]*border-left\s*:\s*none[^{}]*\}/.test(seg) ||
        /\{[^{}]*border-left\s*:\s*0[^{}]*\}/.test(seg);
      if (rootCleared) {
        ok(`${compType} 已覆盖共享根元素 border-left（去除 ${deco.note}）`);
      } else if (deco.enforce) {
        bad(`${compType} 覆盖了但未去除共享根元素 ${deco.note} — 会在根 + 自身双条`);
      } else {
        warn(`${compType} 覆盖但未见根元素 border-left 覆盖（${deco.note}）`);
      }
      continue;
    }
    const neutralizerPattern = new RegExp(
      `\\{[^{}]*content\\s*:\\s*none[^{}]*\\}`,
    );
    const hasNeutralizer = deco.neutralizers.some((sel) => {
      const idx = componentsCss.indexOf(sel);
      if (idx === -1) return false;
      const seg = componentsCss.slice(idx, idx + 400);
      return neutralizerPattern.test(seg);
    });
    if (hasNeutralizer) {
      ok(`${compType} 已在 components.css 中和共享 ${deco.note}`);
    } else if (deco.enforce) {
      bad(
        `${compType} 覆盖了但未在 components.css 中和共享 ${deco.note} — 若用 border 替代装饰会双条`,
      );
    } else {
      warn(`${compType} 覆盖但未中和共享 ${deco.note}（若未替代同对象装饰则无需中和）`);
    }
  }

  // ---------- 骨架模板随包 ----------
  if (templates.size > 0) {
    console.log(`\n9) 骨架模板: ${templates.size} 个随包注入`);
    ok("自定义骨架已随包注入（加载器可获取）");
  }

  console.log("");
  console.log(report.join("\n"));
  console.log("");
  console.log(failed ? "❌ 验证失败，请修正后重新打包。" : "✅ 主题包验证通过！");
  process.exit(failed ? 1 : 0);
})();
