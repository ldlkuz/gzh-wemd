/**
 * compile-skeleton.cjs — Skeleton Compiler（自由模板单一路径）
 *
 * 读 themes/{theme}/templates/*.html（AI 像内置主题那样直接写的 Mustache 骨架模板），
 * 逐文件校验三条安全底线（根元素约定 / Slot 契约 / 微信兼容），输出：
 *   package/templates.json（Record<组件id, Mustache HTML 骨架>）
 *
 * 设计（真源来自主程序，AI 不参与命名）：
 * - abbr / slot 契约：直接 require 主程序 `slotDefs.js`（getBuiltinSlotDef / getComponentAbbr）
 * - 未定制组件继承主程序 getDefaultTemplate（唯一真源），不复制逻辑
 * - 产物必须通过 isValidSkeleton（微信兼容 + Slot 契约安全底线）
 *
 * 用法：
 *   node scripts/compile-skeleton.cjs <theme-name>            # 读 themes/{theme}/templates/*.html
 *   node scripts/compile-skeleton.cjs <theme-name> --print    # 只打印编译结果 JSON，不写文件
 */
const fs = require("fs");
const path = require("path");

const SKILL_ROOT = path.resolve(__dirname, "..");

// 主程序真源：abbr + slot 契约 + 默认骨架（skill 只消费、不拥有，避免双源漂移）
const {
  getBuiltinSlotDef,
  getComponentAbbr,
  BUILTIN_SLOT_DEFS,
} = require(path.join(SKILL_ROOT, "../../packages/core/dist/plugins/component/slotDefs.js"));
const { getDefaultTemplate } = require(
  path.join(SKILL_ROOT, "../../packages/core/dist/plugins/component/defaultTemplates.js"),
);

// 微信不支持的 CSS 特性（命中即拒绝）
const FORBIDDEN_POSITION = /position\s*:\s*(?:absolute|fixed)/gi;
const FORBIDDEN_PSEUDO = /::(?:before|after|marker)/g;
const SLOT_USAGE = /\{\{(?:slot:([\w-]+)|#if\s+([\w-]+)|#each\s+([\w-]+)|else)\}\}/g;

// 等价主程序 isValidSkeleton：微信兼容（禁定位/伪元素/根容器约定）+ Slot 契约安全底线
function isValidSkeleton(id, html) {
  if (!html || typeof html !== "string") return false;
  if (FORBIDDEN_POSITION.test(html)) return false;
  if (FORBIDDEN_PSEUDO.test(html)) return false;

  const rootRe = new RegExp(
    `<section[^>]*class="[^"]*\\bwemd-component\\b[^"]*\\bwemd-${id}\\b[^"]*"[^>]*data-component="${id}"[^>]*>`,
  );
  if (!rootRe.test(html)) return false;

  const def = getBuiltinSlotDef(id);
  if (!def) return false;
  const validKeys = new Set(def.slots.map((s) => s.key));
  const usedKeys = new Set();
  let match;
  SLOT_USAGE.lastIndex = 0;
  while ((match = SLOT_USAGE.exec(html)) !== null) {
    const key = match[1] ?? match[2] ?? match[3];
    if (key) usedKeys.add(key);
  }
  for (const key of usedKeys) {
    if (!validKeys.has(key)) return false;
  }
  return true;
}

// 自由模板模式：读 themes/{theme}/templates/*.html
function compileFromFreeTemplates(themeName) {
  const tplDir = path.join(SKILL_ROOT, "themes", themeName, "templates");
  if (!fs.existsSync(tplDir)) return null;
  const files = fs
    .readdirSync(tplDir)
    .filter((f) => f.endsWith(".html"));
  if (!files.length) return null;

  const templates = {};
  const dropped = [];
  let inheritedCount = 0;

  for (const file of files) {
    const id = file.replace(/\.html$/, "");
    const html = fs.readFileSync(path.join(tplDir, file), "utf8").trim();
    if (!isValidSkeleton(id, html)) {
      dropped.push({ id, reason: "未通过 isValidSkeleton（根元素 / Slot 契约 / 微信兼容）" });
      continue;
    }
    templates[id] = html;
  }

  // 未定制组件继承默认骨架（主程序真源）
  for (const def of BUILTIN_SLOT_DEFS) {
    if (templates[def.id]) continue;
    const defaultHtml = getDefaultTemplate(def.id);
    if (defaultHtml) {
      templates[def.id] = defaultHtml;
      inheritedCount++;
    }
  }

  return { templates, customCount: Object.keys(files).length, inheritedCount, dropped };
}

function writeTemplatesJson(themeName, templates, customCount, inheritedCount, dropped) {
  if (process.argv.includes("--print")) {
    console.log(JSON.stringify(templates, null, 2));
    return;
  }
  const outDir = path.join(SKILL_ROOT, "themes", themeName, "package");
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, "templates.json");
  fs.writeFileSync(outPath, JSON.stringify(templates, null, 2), "utf8");
  console.log(
    `✅ 已编译 ${Object.keys(templates).length} 个组件骨架 → ${outPath}`,
  );
  console.log(`   ├─ ${customCount} 个自定义骨架（自由模板）`);
  console.log(`   └─ ${inheritedCount} 个继承默认骨架（消费主程序 getDefaultTemplate）`);

  if (dropped.length) {
    console.log(`\n⚠️  丢弃 ${dropped.length} 个非法骨架：`);
    for (const d of dropped) console.log(`  - ${d.id}: ${d.reason}`);
  }
}

function main() {
  const themeName = process.argv[2] || "intelligent-precision";
  const free = compileFromFreeTemplates(themeName);
  if (!free) {
    console.log("⚠️  未找到 themes/{theme}/templates/*.html，跳过编译（主题回退默认骨架）。");
    return;
  }
  writeTemplatesJson(themeName, free.templates, free.customCount, free.inheritedCount, free.dropped);
}

main();
