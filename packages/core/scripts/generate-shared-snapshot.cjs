/**
 * generate-shared-snapshot.cjs — 从主程序构建产物生成「技能包可独立使用」的规则快照
 *
 * 设计（单向生成 + 提交）：主程序是唯一真源，本脚本把真源里的纯数据规则
 * 「复制成自包含 JSON 快照」交付给 skill 侧脚本。skill 运行时不依赖主程序
 * build 产物，只读这份已提交的 JSON。
 *
 * 使用前需先 build core（脚本 require 单个 dist 文件，避免加载整包重依赖）：
 *   pnpm --filter @wemd/core build
 *   node packages/core/scripts/generate-shared-snapshot.cjs
 *
 * 产出（skills/wemd-theme-designer/reference/shared-rules/）：
 *   shorthand-families.json  —— 内联器 SHORTHAND_FAMILIES 纯数据快照（scan-shorthand 消费）
 *   wechat-css-rules.json     —— 微信禁用 CSS 规则的 pattern/flags 快照（layer3 消费）
 *
 * 注意：RegExp 无法直接 JSON 序列化，故微信规则以 { pattern, flags } 形式落盘，
 * 消费方用 new RegExp(pattern, flags) 重建。message/fix 正文亦随快照交付。
 */
const fs = require("fs");
const path = require("path");

const THEME_PROCESSOR_DIST = path.resolve(
  __dirname,
  "../dist/ThemeProcessor.js",
);
const SKILL_REFERENCE_DIR = path.resolve(
  __dirname,
  "../../../skills/wemd-theme-designer/reference/shared-rules",
);

let shorthandFamilies;
try {
  shorthandFamilies = require(THEME_PROCESSOR_DIST).SHORTHAND_FAMILIES;
} catch (err) {
  console.error(
    "❌ 无法加载主程序构建产物，请先执行：pnpm --filter @wemd/core build",
  );
  console.error(`   依赖路径：${THEME_PROCESSOR_DIST}`);
  console.error(`   原始错误：${err.message}`);
  process.exit(1);
}
if (
  !Array.isArray(shorthandFamilies) ||
  shorthandFamilies.length === 0
) {
  console.error("❌ 主程序未正确导出 SHORTHAND_FAMILIES，拒绝生成快照");
  process.exit(1);
}

// ── 快照 1：简写家族表（纯数据） ─────────────────────────────────────────
const shorthandSnapshot = shorthandFamilies.map((fam) => ({
  short: fam.short,
  longhands: [...fam.longhands],
}));

const shorthandFile = path.join(SKILL_REFERENCE_DIR, "shorthand-families.json");
fs.mkdirSync(SKILL_REFERENCE_DIR, { recursive: true });
fs.writeFileSync(
  shorthandFile,
  JSON.stringify(shorthandSnapshot, null, 2) + "\n",
  "utf-8",
);

// ── 快照 2：微信兼容规则（pattern/flags + id + message + fix） ──────────────
// 真源 = whitelist.ts 的 FORBIDDEN_CSS_RULES（12 条）。RegExp 转 source/flags 落盘，
// 消费方用 new RegExp(pattern, flags) 重建，并按 id 引用（不再手抄正则）。
const WHITELIST_DIST = path.resolve(__dirname, "../dist/wechatCompat/whitelist.js");
let forbiddenCssRules;
try {
  forbiddenCssRules = require(WHITELIST_DIST).FORBIDDEN_CSS_RULES;
} catch (err) {
  console.error("❌ 无法加载 whitelist 构建产物，请确认已 build core");
  console.error(`   依赖路径：${WHITELIST_DIST}`);
  process.exit(1);
}
if (!Array.isArray(forbiddenCssRules) || forbiddenCssRules.length === 0) {
  console.error("❌ 主程序未正确导出 FORBIDDEN_CSS_RULES，拒绝生成快照");
  process.exit(1);
}

const wechatRulesFile = path.join(SKILL_REFERENCE_DIR, "wechat-css-rules.json");
const wechatRulesSnapshot = forbiddenCssRules.map((rule) => ({
  id: rule.id,
  pattern: rule.regex.source,
  flags: rule.regex.flags,
  message: rule.message,
  fix: rule.fix,
}));
fs.writeFileSync(
  wechatRulesFile,
  JSON.stringify(wechatRulesSnapshot, null, 2) + "\n",
  "utf-8",
);

// ── 自检：快照与主程序真源逐字一致（防止改了源但没生成/没提交） ─────────
function canonicalFamilies(list) {
  return JSON.stringify(list.map((f) => [f.short, ...f.longhands]));
}
const fromDistFam = canonicalFamilies(shorthandFamilies);
const fromFileFam = canonicalFamilies(
  JSON.parse(fs.readFileSync(shorthandFile, "utf-8")),
);
if (fromDistFam !== fromFileFam) {
  console.error("❌ 自检失败：shorthand 快照与主程序真源不一致");
  process.exit(1);
}

const canonicalRules = (list) =>
  JSON.stringify(list.map((r) => `${r.id}:${r.pattern}|${r.flags}|${r.message}`));
const fromDistRules = canonicalRules(
  forbiddenCssRules.map((r) => ({
    id: r.id,
    pattern: r.regex.source,
    flags: r.regex.flags,
    message: r.message,
  })),
);
const fromFileRules = canonicalRules(
  JSON.parse(fs.readFileSync(wechatRulesFile, "utf-8")),
);
if (fromDistRules !== fromFileRules) {
  console.error("❌ 自检失败：wechat 规则快照与主程序真源不一致");
  process.exit(1);
}

console.log("✅ 快照已生成：");
console.log(`   ${path.relative(process.cwd(), shorthandFile)}（${shorthandSnapshot.length} 家族）`);
console.log(`   ${path.relative(process.cwd(), wechatRulesFile)}（${wechatRulesSnapshot.length} 条规则）`);
console.log("✅ 自检通过：两份快照均与主程序真源逐字一致");