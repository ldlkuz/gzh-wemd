/**
 * validate-css-selectors.mjs — 打包前校验主题 CSS 选择器与嵌套 var
 *
 * 校验项：
 *  1. 每个组件 CSS 里引用的 `.wemd-xxx` 具名 class，是否存在于真源
 *     （defaultTemplates.js 内置默认骨架 + slotDefs.js abbr/slot 契约）。
 *     不存在的 => 选择器写错 / 臆造 class，打包前拦截。
 *  2. 普通组件的 CSS 是否误用 `.wemd-child-N`（已废弃的错误结构，现在直接报错）。
 *  3. CSS 中是否出现嵌套 var fallback `var(--a, var(--b))`（BUG-0010 同款雷区，
 *     resolveCssVars 的 fallback 正则会截断，导致变量展开中断）。
 *
 * 用法：node scripts/validate-css-selectors.mjs [themeName]
 *   默认校验 themes 目录下所有主题的 css 产物；也可指定单个主题名（如 videographer）。
 * 退出码：0=通过，1=有错误（供打包脚本 halt）。
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const THEMES_DIR = path.join(ROOT, "themes");
const REGISTRY = path.join(ROOT, "registry", "components.json");
const require = createRequire(import.meta.url);
const CORE_DIST = path.resolve(ROOT, "..", "..", "packages", "core", "dist");
const { getDefaultTemplate } = require(path.join(CORE_DIST, "plugins/component/defaultTemplates.js"));

// ============================================================
// 从真源加载合法 class 集
// ============================================================
function loadValidClasses(themeName) {
  if (!fs.existsSync(REGISTRY)) {
    console.error(`❌ 未找到组件注册表: ${REGISTRY}`);
    process.exit(1);
  }
  const registry = JSON.parse(fs.readFileSync(REGISTRY, "utf-8"));
  const valid = new Set();
  for (const r of registry) {
    if (!r.id) continue;
    const html = getDefaultTemplate(r.id);
    if (!html) continue;
    for (const cls of collectWemdClassesFrom(html)) valid.add(cls);
  }
  // 若指定了主题，把该主题自定义骨架（package/templates.json）也纳入真源，
  // 否则自定义骨架上的 class 会被误判为臆造。
  addThemeTemplateClasses(valid, themeName);
  return valid;
}

/** 将主题自定义骨架 templates.json 中的 wemd-* class 加入合法集 */
function addThemeTemplateClasses(valid, themeName) {
  if (!themeName) return;
  const tplFile = path.join(THEMES_DIR, themeName, "package", "templates.json");
  if (!fs.existsSync(tplFile)) return;
  let templates;
  try {
    templates = JSON.parse(fs.readFileSync(tplFile, "utf-8"));
  } catch {
    return;
  }
  for (const html of Object.values(templates)) {
    for (const cls of collectWemdClassesFrom(html)) valid.add(cls);
  }
}

/** 从模板 HTML 提取所有 wemd-* class（剥离 Mustache 表达式） */
function collectWemdClassesFrom(html) {
  const out = [];
  const seen = new Set();
  const clsRe = /class="([^"]*)"/g;
  let m;
  while ((m = clsRe.exec(html)) !== null) {
    const value = m[1].replace(/\{\{[\s\S]*?\}\}/g, "");
    for (const token of value.split(/\s+/)) {
      if (!token.startsWith("wemd-")) continue;
      if (seen.has(token)) continue;
      seen.add(token);
      out.push(token);
    }
  }
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

// 合法的排版标记 class（非组件 class，由 markdown 语法 em/u/++高亮++ 渲染生成）
const KNOWN_MARKUP_CLASSES = new Set(["wemd-highlight"]);

function validateCss(cssFile, validClasses) {
  const css = fs.readFileSync(cssFile, "utf-8");
  const errors = [];
  const warnings = [];
  const selectors = parseCssSelectors(css);

  for (const sel of selectors) {
    // 检查每个 .wemd-xxx 是否合法
    const clsRe = /\.(wemd-[a-zA-Z0-9-]+)/g;
    let m;
    while ((m = clsRe.exec(sel)) !== null) {
      const cls = m[1];
      if (ALLOWED_UNDEFINED.has(cls)) continue;
      // ⚠️ .wemd-child-N 已废弃，命中即报错
      if (/^wemd-child-\d+$/.test(cls)) {
        errors.push(`  ❌ 已废弃的序号 class \`.${cls}\`（请改用 slot class）: ${sel}`);
        continue;
      }
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
// 收集待校验主题的 CSS 文件：按主题目录扫描 themes/*/css/*.css
const target = process.argv[2] || "";
const cssFiles = [];
function collectThemeCss(themeName) {
  const cssDir = path.join(THEMES_DIR, themeName, "css");
  if (!fs.existsSync(cssDir)) return;
  const cssFile = path.join(cssDir, `${themeName}.css`);
  if (fs.existsSync(cssFile)) cssFiles.push(cssFile);
}

if (target) {
  // 指定主题：校验 themes/{theme}/css/{theme}.css
  collectThemeCss(target);
} else {
  // 默认：扫描全部主题目录
  if (fs.existsSync(THEMES_DIR)) {
    for (const dir of fs.readdirSync(THEMES_DIR)) {
      if (fs.statSync(path.join(THEMES_DIR, dir)).isDirectory()) collectThemeCss(dir);
    }
  }
}

if (cssFiles.length === 0) {
  console.error("❌ 未找到任何主题 CSS 文件（themes/*/css/*.css）");
  process.exit(1);
}

const validClasses = loadValidClasses(target);
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