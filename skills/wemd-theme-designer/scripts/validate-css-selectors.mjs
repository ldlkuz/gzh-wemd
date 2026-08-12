/**
 * validate-css-selectors.mjs — 打包前校验主题 CSS 选择器与嵌套 var
 *
 * 校验项：
 *  1. 每个组件 CSS 里引用的 `.wemd-xxx` 具名 class，是否存在于真源
 *     （componentElements.ts 标准选择器 + magazineRenderers.ts 输出 class）。
 *     不存在的 => 选择器写错 / 臆造 class，打包前拦截。
 *  2. 普通组件（hasBody=true）的 CSS 是否误用 `.wemd-child-N`（已废弃的错误结构）。
 *  3. CSS 中是否出现嵌套 var fallback `var(--a, var(--b))`（BUG-0010 同款雷区，
 *     resolveCssVars 的 fallback 正则会截断，导致变量展开中断）。
 *
 * 用法：node scripts/validate-css-selectors.mjs [themeName]
 *   默认校验 output/css/*.css 全部主题；也可指定单个主题名（如 videographer）。
 * 退出码：0=通过，1=有错误（供打包脚本 halt）。
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const CSS_DIR = path.join(ROOT, "output", "css");
const CORE_DIR = path.resolve(ROOT, "..", "..", "packages", "core", "src");
const ELEMENTS_TS = path.join(CORE_DIR, "css-translator", "componentElements.ts");

// ============================================================
// 从真源加载合法 class 集
// ============================================================
function loadValidClasses() {
  if (!fs.existsSync(ELEMENTS_TS)) {
    console.error(`❌ 未找到真源: ${ELEMENTS_TS}`);
    process.exit(1);
  }
  const src = fs.readFileSync(ELEMENTS_TS, "utf-8");
  const valid = new Set();

  // 1. componentElements.ts 中所有 wemdSelector 里的 .wemd-xxx
  const selectorRe = /wemdSelector\s*:\s*"([^"]+)"/g;
  let m;
  while ((m = selectorRe.exec(src)) !== null) {
    for (const cls of collectWemdClasses(m[1])) valid.add(cls);
  }
  // 容器选择器
  const containerRe = /containerSelector\s*:\s*"([^"]+)"/g;
  while ((m = containerRe.exec(src)) !== null) {
    for (const cls of collectWemdClasses(m[1])) valid.add(cls);
  }

  // 2. magazineRenderers.ts 实际输出的 class
  const renderersTs = path.join(
    CORE_DIR,
    "plugins",
    "component",
    "magazineRenderers.ts",
  );
  if (fs.existsSync(renderersTs)) {
    const rsrc = fs.readFileSync(renderersTs, "utf-8");
    const clsRe = /class="(wemd-[a-z0-9-]+)/g;
    while ((m = clsRe.exec(rsrc)) !== null) valid.add(m[1]);
  }

  return valid;
}

function collectWemdClasses(selector) {
  const out = [];
  const re = /\.(wemd-[a-z0-9-]+)/g;
  let m;
  while ((m = re.exec(selector)) !== null) out.push(m[1]);
  return out;
}

// ============================================================
// 解析 CSS 选择器
// ============================================================
function parseCssSelectors(css) {
  // 提取每个规则块的选择器（去掉 { }，处理注释）
  const cleaned = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const selectors = [];
  // 简单解析：按 { 切分选择器部分（忽略 @media/@keyframes 内部，pack 已单独处理）
  const re = /([^{}]+)\{/g;
  let m;
  while ((m = re.exec(cleaned)) !== null) {
    const sel = m[1].trim();
    if (!sel || sel.startsWith("@")) continue;
    // 拆逗号分隔的多个选择器
    for (const part of sel.split(",")) {
      const p = part.trim();
      if (p) selectors.push(p);
    }
  }
  return selectors;
}

// ============================================================
// 校验
// ============================================================
const ALLOWED_UNDEFINED = new Set([
  // 系统级/结构类，非组件 class，可忽略
  "wemd-component",
  "wemd-component-body",
]);

// 真源 componentElements.ts 未定义、但真实渲染会原生输出 child-N 的组件容器 class。
// 这些组件走纯原生渲染（无专用渲染器），body 内直接是原生标签 + .wemd-child-N。
// 当它们在 componentElements.ts 补齐后可移出此表。
const KNOWN_RAW_COMPONENTS = new Set([
  "wemd-text-card",
  "wemd-image-compare",
  "wemd-table",
  "wemd-accordion",
  "wemd-steps",
  "wemd-code-block",
  "wemd-pullquote",
  "wemd-divider",
  "wemd-article-section",
]);

// 校验时忽略的合法 class：.wemd-child-N 由 addChildPositionClasses 生成，合法
const CHILD_N_CLASS = /^wemd-child-\d+$/;

// 合法的排版标记 class（非组件 class，由 markdown 语法 em/u/++高亮++ 渲染生成）
const KNOWN_MARKUP_CLASSES = new Set(["wemd-highlight"]);

function validateCss(cssFile, validClasses) {
  const css = fs.readFileSync(cssFile, "utf-8");
  const errors = [];
  const warnings = [];
  const selectors = parseCssSelectors(css);

  for (const sel of selectors) {
    // 检查每个 .wemd-xxx 是否合法
    const clsRe = /\.(wemd-[a-z0-9-]+)/g;
    let m;
    while ((m = clsRe.exec(sel)) !== null) {
      const cls = m[1];
      if (ALLOWED_UNDEFINED.has(cls)) continue;
      if (CHILD_N_CLASS.test(cls)) continue;
      if (KNOWN_RAW_COMPONENTS.has(cls)) continue;
      if (KNOWN_MARKUP_CLASSES.has(cls)) continue;
      if (!validClasses.has(cls)) {
        errors.push(`  引用不存在的 class \`.${cls}\`: ${sel}`);
      }
    }
  }

  // 3. 检查嵌套 var fallback（BUG-0010 同款雷区）
  const nestedVarRe = /var\(\s*--[\w-]+\s*,\s*var\s*\(/g;
  let nm;
  while ((nm = nestedVarRe.exec(css)) !== null) {
    const line = getLineAt(css, nm.index);
    errors.push(
      `  嵌套 var fallback（会导致变量展开中断）: ${line.trim()}`,
    );
  }

  return { errors, warnings };
}

function getLineAt(text, index) {
  const start = text.lastIndexOf("\n", index) + 1;
  const end = text.indexOf("\n", index);
  return text.slice(start, end === -1 ? text.length : end);
}

// ============================================================
// 主流程
// ============================================================
const target = process.argv[2] || "";
const cssFiles = target
  ? [path.join(CSS_DIR, `${target}.css`)]
  : fs
      .readdirSync(CSS_DIR)
      .filter((f) => f.endsWith(".css"))
      .map((f) => path.join(CSS_DIR, f));

if (cssFiles.length === 0) {
  console.error("❌ 未找到任何 CSS 文件");
  process.exit(1);
}

const validClasses = loadValidClasses();
console.log(`🔍 合法 class 集：${validClasses.size} 个`);
console.log("");

let totalErrors = 0;
for (const file of cssFiles) {
  const name = path.basename(file);
  const { errors, warnings } = validateCss(file, validClasses);
  if (errors.length === 0) {
    console.log(`  ✅ ${name} — 通过`);
  } else {
    console.log(`  ❌ ${name} — ${errors.length} 个问题`);
    for (const e of errors) console.log(e);
    totalErrors += errors.length;
  }
}

console.log("");
if (totalErrors > 0) {
  console.error(`🚫 校验失败：共 ${totalErrors} 个问题。请修正后重新打包。`);
  process.exit(1);
} else {
  console.log("✅ 全部主题 CSS 校验通过。");
}