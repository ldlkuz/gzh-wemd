/**
 * extract-dom-snapshot.mjs — 从主程序真源生成组件 DOM 结构权威参考
 *
 * 真源（Single Source of Truth）：
 *   1. packages/core/dist/plugins/component/defaultTemplates.js
 *      —— getDefaultTemplate：内置默认骨架（CURATED 精编 + slotDefs 通用骨架）
 *   2. packages/core/dist/plugins/component/slotDefs.js
 *      —— getBuiltinSlotDef / getComponentAbbr：abbr + slot 契约
 *
 * 主题定制骨架由 Skeleton Compiler（scripts/compile-skeleton.cjs）产出，
 * 结构规则与默认骨架同源（wemd-component wemd-{id} + wemd-{abbr}-{slot}）。
 *
 * 用法：node scripts/extract-dom-snapshot.mjs
 * 输出：reference/dom-structure.md（自动生成，禁止手工维护）
 *
 * 关键约定（与真实渲染一致）：
 *   - 组件根：`wemd-component wemd-{id}`（CSS 定位 #wemd .wemd-{id}）。
 *   - 命名 slot：`wemd-{abbr}-{slot}` 容器；list 槽细分 `-item` / `-{field}`。
 *   - body slot：`<div class="wemd-component-body">`，内部为 markdown-it 原生标签。
 *   - ❌ `.wemd-child-N` 序号 class 已废弃，不再生成。
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const require = createRequire(import.meta.url);

// 主程序真源（编译产物）
const CORE_DIST = path.resolve(ROOT, "..", "..", "packages", "core", "dist");
const { getDefaultTemplate } = require(path.join(CORE_DIST, "plugins/component/defaultTemplates.js"));
const { getBuiltinSlotDef, getComponentAbbr } = require(path.join(CORE_DIST, "plugins/component/slotDefs.js"));

const OUT_MD = path.join(ROOT, "reference", "dom-structure.md");
const REGISTRY = path.join(ROOT, "registry", "components.json");

/** 从模板 HTML 提取去重保序的 wemd-* class */
function extractClasses(html) {
  const seen = new Set();
  const out = [];
  const clsRe = /class="([^"]*)"/g;
  let m;
  while ((m = clsRe.exec(html)) !== null) {
    // 先剥离 Mustache 表达式（{{#if}} / {{/if}} 等），保留真实 class token
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
// 生成 Markdown
// ============================================================
function buildMd(registry) {
  const lines = [];
  lines.push("# 组件 DOM 结构（自动生成 · 权威基准）");
  lines.push("");
  lines.push(`> 由 \`scripts/extract-dom-snapshot.mjs\` 从主程序真源自动生成，**禁止手工维护**。`);
  lines.push("> 真源：`defaultTemplates.ts`（内置默认骨架 CURATED + slotDefs 通用骨架）+ `slotDefs.ts`（abbr + slot 契约）。");
  lines.push("> 主题定制骨架由 `scripts/compile-skeleton.cjs` 产出，结构规则同源。");
  lines.push(`> 生成时间：${new Date().toISOString().slice(0, 19).replace("T", " ")}`);
  lines.push("");
  lines.push("## 通用规律");
  lines.push("");
  lines.push("- 组件根节点：`wemd-component wemd-{id}`（CSS 定位 `#wemd .wemd-{id}`）。");
  lines.push("- **命名 slot**：骨架为非 body slot 生成 `wemd-{abbr}-{slot}` 容器（标量为 `<div>`/`<section>`）；list 槽再细分 `wemd-{abbr}-{slot}-item` 与字段 `wemd-{abbr}-{slot}-{field}`。");
  lines.push("- **body slot**：`body` 槽生成 `<div class=\"wemd-component-body\">`，内部是 markdown-it 渲染的原生标签（`<p>/<ul>/<li>/<strong>/<pre>/<table>`），CSS 用 `.wemd-component-body > p` 等定位。");
  lines.push("- ❌ `.wemd-child-N` 序号 class 已废弃，主程序不再生成。");
  lines.push("- 组件容器负责自身水平内边距；上下 margin 由 Stack 规则统一控制。");
  lines.push("");
  lines.push("## 组件结构明细");
  lines.push("");
  lines.push("| 组件 | 槽类型 | 骨架 class 结构 |");
  lines.push("|------|--------|-----------------|");

  const allClasses = new Set();
  const rows = [];
  for (const r of registry) {
    const id = r.id;
    if (!id) continue;
    const html = getDefaultTemplate(id);
    const classes = extractClasses(html);
    for (const c of classes) allClasses.add(c);
    const kind = html.includes("wemd-component-body") ? "body" : "具名 slot";
    rows.push({ id, kind, detail: classes.join(" ") || "（无 wemd-* class）" });
  }

  for (const row of rows) {
    lines.push(`| ${row.id} | ${row.kind} | \`${row.detail}\` |`);
  }

  lines.push("");
  lines.push("## 骨架 class 清单（全量）");
  lines.push("");
  lines.push("（由 defaultTemplates 实际输出，供选择器校验引用）");
  lines.push("");
  for (const c of [...allClasses].sort()) {
    lines.push(`- \`${c}\``);
  }

  lines.push("");
  lines.push("## 关键陷阱");
  lines.push("");
  lines.push("1. **body slot 组件**：`.wemd-component-body` 内部是原生标签，深度样式走 `.wemd-component-body > p` / `ul` / `pre` / `table`。");
  lines.push("2. **命名 slot 组件**：直接定位 `wemd-{abbr}-{slot}`，禁止臆造 class。abbr 来自 `slotDefs.ts`，slot 名来自该组件的 slot 定义。");
  lines.push("3. 已废弃 `.wemd-child-N`，禁止再写基于序号的选择器。");
  lines.push("4. 组件容器负责自身水平内边距；Stack 负责上下 margin。");
  lines.push("5. 渲染器会给部分文本自动加内联样式（如 `cta-card` 的 `<strong>` 内联深色）。若与主题冲突，需用 `!important` 覆盖。");
  lines.push("");
  return lines.join("\n");
}

// ============================================================
// 主流程
// ============================================================
if (!fs.existsSync(REGISTRY)) {
  console.error(`❌ 未找到组件注册表: ${REGISTRY}`);
  process.exit(1);
}
const registry = JSON.parse(fs.readFileSync(REGISTRY, "utf-8"));

const md = buildMd(registry);
fs.mkdirSync(path.dirname(OUT_MD), { recursive: true });
fs.writeFileSync(OUT_MD, md, "utf-8");
console.log(`✅ 已生成: ${OUT_MD}`);
console.log(`   组件：${registry.filter((r) => r.id).length} 个`);