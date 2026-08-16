/**
 * compile-skeleton.cjs — Skeleton Compiler
 *
 * 把 Stage 4.5 产出的 skeleton_intent.json（Intent DSL）编译成
 * ThemeDefinition.templates（Record<组件id, Mustache HTML 骨架>）。
 *
 * 设计（真源来自主程序，AI 不参与命名）：
 * - abbr / slot 契约：直接 require 主程序 `slotDefs.js`（getBuiltinSlotDef / getComponentAbbr）
 * - class 推导：按 skeleton-design-spec.md §7.1 确定性规则（写死在本脚本）
 * - 产物必须通过主程序 validateSkeleton.isValidSkeleton（微信兼容 + Slot 契约安全底线）
 *
 * 用法：
 *   node scripts/compile-skeleton.cjs                            # 默认主题（见下）
 *   node scripts/compile-skeleton.cjs <theme-name>                # 读 themes/{theme}/states/skeleton_intent.json → 输出 themes/{theme}/package/templates.json
 *   node scripts/compile-skeleton.cjs <theme-name> --print        # 只打印编译结果 JSON，不写文件
 *   Skeleton_INTENT=xxx node scripts/compile-skeleton.cjs <theme-name>  # 指定 Intent 输入路径
 */
const fs = require("fs");
const path = require("path");

const SKILL_ROOT = path.resolve(__dirname, "..");
const CORE_DIST = path.resolve(SKILL_ROOT, "../../packages/core/dist");

// 主题名（默认 intelligent-precision，可通过命令行参数指定）
const THEME_NAME = process.argv[2] || "intelligent-precision";

// 主程序真源：abbr + slot 契约 + 默认骨架（skill 只消费、不拥有，避免双源漂移）
const {
  getBuiltinSlotDef,
  getComponentAbbr,
  BUILTIN_SLOT_DEFS,
} = require(path.join(CORE_DIST, "plugins/component/slotDefs.js"));
const { getDefaultTemplate } = require(
  path.join(CORE_DIST, "plugins/component/defaultTemplates.js"),
);

// 微信不支持的 CSS 特性（命中即拒绝，与主程序 validateSkeleton 一致）
// 职责边界：这里是「骨架 HTML」级检查（作用对象是模板里的内联样式片段），
// 只关注骨架安全底线（禁定位 / 禁伪元素）。CSS 产物级（整段样式是否兼容微信）
// 请走 layer3-css-compat-validator 与主程序 whitelist，勿在本脚本重复扩展。
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

// 预定义装饰（skeleton-design-spec.md §5）→ 安全 DOM（微信兼容，无伪元素/绝对定位）
const DECORATION_DOM = {
  "quote-mark": (abbr) => `<span class="wemd-${abbr}-quote-mark">\u201C</span>`,
  "top-bar": (abbr) => `<span class="wemd-${abbr}-top-bar"></span>`,
  dot: (abbr) => `<span class="wemd-${abbr}-dot"></span>`,
  corner: (abbr) => `<span class="wemd-${abbr}-corner"></span>`,
  cap: (abbr) => `<span class="wemd-${abbr}-cap"></span>`,
};

// 根容器（§7）：wemd-component wemd-{id} + layout class（供 CSS 消费）
function renderRoot(componentId, abbr, layout, inner) {
  return (
    `<section class="wemd-component wemd-${componentId} wemd-${abbr}-${layout}" data-component="${componentId}">\n` +
    inner +
    `\n</section>`
  );
}

// 单 region 编译（递归 group，嵌套深度 ≤ 2）
// depth: 根 region 为 0，group 内为 1，禁止再嵌套
function renderRegion(region, abbr, slotDef, depth) {
  switch (region.type) {
    case "slot": {
      const key = region.slot;
      const slot = slotDef.slots.find((s) => s.key === key);
      if (!slot) return ""; // Validator 已在顶层拦截，这里防御
      if (key === "body") {
        return `<div class="wemd-component-body">{{slot:${key}}}</div>`;
      }
      if (slot.type === "list") {
        const fields = slot.item_slots && slot.item_slots.length
          ? slot.item_slots.map((f) => f.key)
          : ["body"];
        const itemInner = fields
          .map((f) => `<div class="wemd-${abbr}-${key}-${f}">{{this.${f}}}</div>`)
          .join("\n");
        return (
          `<section class="wemd-${abbr}-${key}">\n` +
          `{{#each ${key}}}\n` +
          `<div class="wemd-${abbr}-${key}-item">\n${itemInner}\n</div>\n` +
          `{{/each}}\n</section>`
        );
      }
      return `<section class="wemd-${abbr}-${key}">{{slot:${key}}}</section>`;
    }
    case "group": {
      if (depth >= 2) return ""; // 嵌套深度 > 2 层，Validator 拦截
      const inner = (region.regions || [])
        .map((r) => renderRegion(r, abbr, slotDef, depth + 1))
        .filter(Boolean)
        .join("\n");
      // group 语义 class + 可选 layout class
      const layoutCls = region.layout ? ` wemd-${abbr}-${region.layout}` : "";
      return (
        `<section class="wemd-${abbr}-${region.name}${layoutCls}">\n${inner}\n</section>`
      );
    }
    case "decoration": {
      const fn = DECORATION_DOM[region.name];
      return fn ? fn(abbr) : "";
    }
    case "label":
      return `<span class="wemd-${abbr}-label">${region.text || ""}</span>`;
    case "rule":
      return `<hr class="wemd-${abbr}-rule">`;
    default:
      return "";
  }
}

// 编译单个组件骨架 → templates[id]（HTML）
function compileSkeleton(skel) {
  const { component, layout, regions } = skel;
  const slotDef = getBuiltinSlotDef(component);
  if (!slotDef) return null; // 组件未注册，不开放骨架
  const abbr = slotDef.abbr || getComponentAbbr(component);

  const inner = (regions || [])
    .map((r) => renderRegion(r, abbr, slotDef, 0))
    .filter(Boolean)
    .join("\n");

  return renderRoot(component, abbr, layout, inner);
}

// Validator（skeleton-design-spec.md §8）：命中即丢弃该组件骨架
function validateIntent(skel) {
  const { component, layout, regions } = skel;
  if (!component || !layout || !Array.isArray(regions)) return { ok: false, reason: "缺 component/layout/regions" };

  const slotDef = getBuiltinSlotDef(component);
  if (!slotDef) return { ok: false, reason: "组件未注册" };

  const LAYOUTS = new Set(["stack", "centered", "side-rail", "split", "grid", "media-text"]);
  if (!LAYOUTS.has(layout)) return { ok: false, reason: `layout 非法: ${layout}` };

  const validSlots = new Set(slotDef.slots.map((s) => s.key));
  const DECOR_NAMES = new Set(Object.keys(DECORATION_DOM));
  const CSS_VALUE_RE = /(padding|margin|font-size|color|width|height|border|flex|gap|align-items|grid-template-columns)\s*[:=]/;

  const walk = (regions, depth) => {
    if (!Array.isArray(regions)) return { ok: false, reason: "regions 非数组" };
    if (depth > 2) return { ok: false, reason: `group 嵌套超过 2 层` };
    for (const r of regions) {
      if (!r || typeof r !== "object") return { ok: false, reason: "region 非法" };
      const type = r.type;
      if (!["slot", "group", "decoration", "label", "rule"].includes(type)) {
        return { ok: false, reason: `region.type 非法: ${type}` };
      }
      if (type === "slot") {
        if (!validSlots.has(r.slot)) return { ok: false, reason: `slot 未注册: ${r.slot}` };
      } else if (type === "group") {
        if (!r.name || !Array.isArray(r.regions)) return { ok: false, reason: `group 缺 name/regions` };
        if (r.layout && !LAYOUTS.has(r.layout)) return { ok: false, reason: `group.layout 非法: ${r.layout}` };
        const sub = walk(r.regions, depth + 1);
        if (!sub.ok) return sub;
      } else if (type === "decoration") {
        if (!DECOR_NAMES.has(r.name)) return { ok: false, reason: `decoration 未预定义: ${r.name}` };
      } else if (type === "label") {
        if (!r.name) return { ok: false, reason: "label 缺 name" };
      }
      // CSS 值硬禁止（§0.1）
      const json = JSON.stringify(r);
      if (CSS_VALUE_RE.test(json)) return { ok: false, reason: `出现 CSS 值: ${json}` };
    }
    return { ok: true };
  };

  return walk(regions, 0);
}

function main() {
  const intentPath =
    process.env.Skeleton_INTENT ||
    path.join(SKILL_ROOT, "themes", THEME_NAME, "states", "skeleton_intent.json");

  if (!fs.existsSync(intentPath)) {
    console.log("⚠️  未找到 skeleton_intent.json，跳过编译。");
    return;
  }

  const raw = JSON.parse(fs.readFileSync(intentPath, "utf8"));
  const skeletons = raw.skeletons || {};

  const templates = {};
  const dropped = [];

  for (const [id, skel] of Object.entries(skeletons)) {
    const v = validateIntent(skel);
    if (!v.ok) {
      dropped.push({ id, reason: v.reason });
      continue;
    }
    const html = compileSkeleton(skel);
    // 主程序校验：微信兼容 + Slot 契约安全底线
    if (html && isValidSkeleton(id, html)) {
      templates[id] = html;
    } else {
      dropped.push({ id, reason: "未通过主程序 isValidSkeleton" });
    }
  }

  // 全量交付：为所有未自定义（含被丢弃）的组件补全默认骨架。
  // 非焦点组件直接消费主程序 getDefaultTemplate（唯一真源），不复制逻辑，
  // 保证主题包 templates/ 覆盖全部组件、交付物自洽可审查。
  let inheritedCount = 0;
  for (const def of BUILTIN_SLOT_DEFS) {
    if (templates[def.id]) continue;
    const defaultHtml = getDefaultTemplate(def.id);
    if (defaultHtml) {
      templates[def.id] = defaultHtml;
      inheritedCount++;
    }
  }

  if (process.argv.includes("--print")) {
    console.log(JSON.stringify(templates, null, 2));
  } else {
    const outDir = path.join(SKILL_ROOT, "themes", THEME_NAME, "package");
    fs.mkdirSync(outDir, { recursive: true });
    const outPath = path.join(outDir, "templates.json");
    fs.writeFileSync(outPath, JSON.stringify(templates, null, 2), "utf8");
    console.log(
      `✅ 已编译 ${Object.keys(templates).length} 个组件骨架 → ${outPath}`,
    );
    console.log(
      `   ├─ ${Object.keys(skeletons).length} 个自定义骨架（来自 skeleton_intent）`,
    );
    console.log(
      `   └─ ${inheritedCount} 个继承默认骨架（消费主程序 getDefaultTemplate）`,
    );
  }

  if (dropped.length) {
    console.log(`\n⚠️  丢弃 ${dropped.length} 个非法骨架：`);
    for (const d of dropped) console.log(`  - ${d.id}: ${d.reason}`);
  }
}

main();