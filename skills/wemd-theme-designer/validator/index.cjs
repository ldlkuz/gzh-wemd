/**
 * validator/index.cjs — 可渲染性验证统一入口（Run-Book）
 *
 * 串行运行前三层校验，聚合输出。设计目标：
 *   1. 分层可独立运行（各自 plugin；见各 layer 的 CLI 说明）
 *   2. 统一入口一键出「总报告」，供打包脚本 halt
 *   3. 只读不改，任何一层失败均可在构建链路中拦截
 *
 * 层（按序执行，后者依赖前者的「潜台词校验干净」）：
 *   Layer1 Schema Validation        → layer1-schema-validator.cjs
 *     骨架 DSL 结构合法（枚举 / 必填字段 / 嵌套深度 / CSS 值硬禁止）
 *   Layer2 Component Contract       → layer2-contract-validator.cjs
 *     骨架引用存在（注册表 / slot 契约 / decoration 预定义 / class 命名）
 *   Layer3 CSS Compatibility        → layer3-css-compat-validator.cjs
 *     微信不兼容（伪元素 / 结构伪类 / fixed / 动画 / 外链 / nested var / grid）
 *
 * 用法：
 *   node validator/index.cjs [theme-name]     # 指定主题
 *   node validator/index.cjs                  # 全部主题
 * 退出码：0=全部通过，1=任一层有 error。
 */
const fs = require("fs");
const path = require("path");

const l1 = require("./layer1-schema-validator.cjs");
const l2 = require("./layer2-contract-validator.cjs");
const l3 = require("./layer3-css-compat-validator.cjs");

const ROOT = path.resolve(__dirname, "..");
const THEMES_DIR = path.join(ROOT, "themes");

const LAYERS = [
  { name: "L1 Schema", run: (themeName) => runL1(themeName) },
  { name: "L2 组件契约", run: (themeName) => runL2(themeName) },
  { name: "L3 CSS兼容", run: (themeName) => runL3(themeName) },
];

function runL1(themeName) {
  const intentPath = path.join(THEMES_DIR, themeName, "states", "skeleton_intent.json");
  if (!fs.existsSync(intentPath)) return { skipped: true, reason: "无 skeleton_intent.json" };
  const skeletons = JSON.parse(fs.readFileSync(intentPath, "utf8")).skeletons || {};
  return l1.validateSchema(skeletons);
}

function runL2(themeName) {
  const intentPath = path.join(THEMES_DIR, themeName, "states", "skeleton_intent.json");
  if (!fs.existsSync(intentPath)) return { skipped: true, reason: "无 skeleton_intent.json" };
  const skeletons = JSON.parse(fs.readFileSync(intentPath, "utf8")).skeletons || {};
  return l2.validateContractForSkeletons(skeletons);
}

function runL3(themeName) {
  const cssFile = path.join(THEMES_DIR, themeName, "css", `${themeName}.css`);
  if (!fs.existsSync(cssFile)) return { skipped: true, reason: "无 css 产物" };
  const css = fs.readFileSync(cssFile, "utf8");
  const res = l3.validateCssCompatibility(css, themeName);
  // 第 3 层用 code="OK" 标记"无违规"，属正常状态而非建议，聚合时剔除
  res.warnings = res.warnings.filter((w) => w.code !== "OK");
  return res;
}

function validateTheme(themeName) {
  const order = [];
  let errors = 0;
  let warnings = 0;

  for (const layer of LAYERS) {
    const res = layer.run(themeName);
    if (res.skipped) {
      order.push(`${layer.name}: 跳过（${res.reason}）`);
      continue;
    }
    errors += res.errors.length;
    warnings += res.warnings.length;
    const state = res.errors.length === 0 ? "✅" : "❌";
    order.push(`${layer.name}: ${state} ${res.errors.length} 错 / ${res.warnings.length} 警`);
  }
  return { order, errors, warnings, themeName };
}

// ============================================================
// CLI
// ============================================================
const target = process.argv[2] || "";
let names;
if (target) {
  names = [target];
} else {
  names = fs.existsSync(THEMES_DIR)
    ? fs.readdirSync(THEMES_DIR).filter((d) =>
        fs.statSync(path.join(THEMES_DIR, d)).isDirectory(),
      )
    : [];
}

let grandErrors = 0;
let grandWarnings = 0;
const reports = [];
for (const name of names) {
  if (!name) continue;
  const report = validateTheme(name);
  reports.push(report);
  grandErrors += report.errors;
  grandWarnings += report.warnings;
}

console.log("\n════ 可渲染性验证 · 前三层 ════\n");
for (const r of reports) {
  console.log(`\n  ◆ ${r.themeName}（error=${r.errors} warning=${r.warnings}）`);
  for (const line of r.order) console.log(`      ${line}`);
}

console.log(`\n  —— 汇总：${reports.length} 主题，${grandErrors} 错误，${grandWarnings} 建议 ——`);

if (grandErrors > 0) {
  console.log("\n🚫 可渲染性验证失败，请在导出发布前修正。");
  process.exit(1);
}
console.log("\n✅ 前三层可渲染性验证全部通过。");
process.exit(0);