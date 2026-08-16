const fs = require("fs");
const path = require("path");
const {
  getBuiltinSlotDef,
  getComponentAbbr,
  BUILTIN_SLOT_DEFS,
} = require("../../../packages/core/dist/plugins/component/slotDefs.js");

const ROOT = path.resolve(__dirname, "..");
const THEMES = fs
  .readdirSync(path.join(ROOT, "themes"))
  .filter((d) => fs.statSync(path.join(ROOT, "themes", d)).isDirectory());

const SEVERITY = {
  decoration: "高危害", // 装饰元素缺失 → 视觉元素直接丢失
  container: "中危害", // 结构容器/group → 布局折叠，靠主程序兜底可能仍侥幸可用
  layout: "无害", // 布局标识 class → 仅作标记，无实际样式需求
  "component-name": "无害", // 组件根 class，主程序恒提供
  slot: "无害", // 单槽正文，由主程序 component-body 兜底，或组件默认样式
};

/** 对齐 compile-skeleton.cjs §7.1：由 skeleton 推导「会真实产出」的 wemd class，并标注危害分级 */
function skeletonProducedClasses(skel) {
  const { component, layout, regions } = skel;
  const slotDef = getBuiltinSlotDef(component);
  if (!slotDef) return [];
  const abbr = slotDef.abbr || getComponentAbbr(component);
  // key → { cls, kind }
  const map = new Map();
  const add = (cls, kind = "layout") => {
    if (cls) map.set(cls, { cls, kind });
  };
  add(`wemd-${component}`, "component-name");
  add(`wemd-${abbr}-${layout}`);
  const walk = (regions, depth) => {
    for (const r of regions || []) {
      if (r.type === "slot") {
        // body → wemd-component-body（主程序默认兜底，不算皮肤自定义单元）
        if (r.slot === "body") continue;
        add(`wemd-${abbr}-${r.slot}`, "slot");
      } else if (r.type === "group") {
        add(`wemd-${abbr}-${r.name}`, "container");
        if (r.layout) add(`wemd-${abbr}-${r.layout}`);
        if (depth < 2) walk(r.regions, depth + 1);
      } else if (r.type === "label") {
        add(`wemd-${abbr}-label`, "slot");
      } else if (r.type === "rule") {
        add(`wemd-${abbr}-rule`, "container");
      } else if (r.type === "decoration") {
        const d = DECORATION_DOM[r.name];
        if (d) add(d(abbr).match(/class="([^"]+)"/)[1], "decoration");
      }
    }
  };
  walk(regions, 0);
  return [...map.values()];
}

// 与 compile-skeleton.cjs 相同的预定义装饰 → 安全 DOM
const DECORATION_DOM = {
  "quote-mark": (abbr) => `<span class="wemd-${abbr}-quote-mark">\u201C</span>`,
  "top-bar": (abbr) => `<span class="wemd-${abbr}-top-bar"></span>`,
  dot: (abbr) => `<span class="wemd-${abbr}-dot"></span>`,
  corner: (abbr) => `<span class="wemd-${abbr}-corner"></span>`,
  cap: (abbr) => `<span class="wemd-${abbr}-cap"></span>`,
};

/** 提取 CSS 里用到的 wemd class（含大写驼峰，如 wemd-pc-originalPrice） */
function cssClasses(css) {
  const out = new Set();
  const re = /\.wemd-[A-Za-z0-9-]+/g;
  let m;
  while ((m = re.exec(css)) !== null) out.add(m[0].slice(1));
  return out;
}

const CORE_DIST = path.resolve(ROOT, "../../packages/core/dist");

/** 主程序 injectComponentStyles 注入的组件默认样式（渲染链路恒在，视作皮肤兜底） */
function coreDefaultCss() {
  const files = [
    "themes/components-default",
    "themes/components-extra",
    "themes/components-extended",
    "themes/components-faq",
    "themes/components-magazine",
  ];
  let out = "";
  for (const f of files) {
    try {
      const mod = require(path.join(CORE_DIST, `${f}.js`));
      const val = mod.default ?? Object.values(mod)[0];
      if (typeof val === "string") out += "\n" + val;
    } catch (e) {
      /* 忽略缺失 */
    }
  }
  return out;
}

/** 主题实际皮肤：manifest 各组件 variantCss + package/styles/components.css */
function themeSkinCss(themeDir) {
  const manifestPath = path.join(themeDir, "package", "manifest.json");
  const componentsCss = path.join(themeDir, "package", "styles", "components.css");
  let out = "";
  if (fs.existsSync(manifestPath)) {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    for (const c of Object.values(manifest.components || {})) {
      if (c && typeof c.variantCss === "string") out += "\n" + c.variantCss;
    }
  }
  if (fs.existsSync(componentsCss)) {
    out += "\n" + fs.readFileSync(componentsCss, "utf8");
  }
  return out;
}

let totalHigh = 0;
let totalMid = 0;
let totalLayout = 0;
const coreCss = coreDefaultCss();
const corePresent = cssClasses(coreCss);
console.log(`[render-chain] 主程序注入组件默认样式中出现 ${corePresent.size} 个 wemd class`);

for (const name of THEMES) {
  const themeDir = path.join(ROOT, "themes", name);
  const intentPath = path.join(themeDir, "states", "skeleton_intent.json");
  if (!fs.existsSync(intentPath)) {
    console.log(`⚪ ${name} — 缺骨架，跳过`);
    continue;
  }
  const skeletons = JSON.parse(fs.readFileSync(intentPath, "utf8")).skeletons || {};
  const skinCss = themeSkinCss(themeDir);
  const skinPresent = cssClasses(skinCss);
  // 真实渲染 = 主程序兜底 ∪ 主题皮肤
  const present = new Set([...corePresent, ...skinPresent]);

  const high = [];
  const mid = [];
  const layout = [];
  for (const [id, skel] of Object.entries(skeletons)) {
    for (const { cls, kind } of skeletonProducedClasses(skel)) {
      if (present.has(cls)) continue;
      const note = skinPresent.has(cls) ? "（仅主程序兜底）" : "";
      const rec = `   ${id}: 骨架产出「${cls}」无选择器${note}`;
      if (kind === "decoration") high.push(rec);
      else if (kind === "container") mid.push(rec);
      else layout.push(rec);
    }
  }
  console.log(`\n◆ ${name} — 主题皮肤覆盖 ${skinPresent.size} wemd class，合并主程序后共 ${present.size}`);
  for (const rec of high) console.log(`   🔴${rec}`);
  for (const rec of mid) console.log(`   🟡${rec}`);
  for (const rec of layout) console.log(`   ⚪${rec}`);
  totalHigh += high.length;
  totalMid += mid.length;
  totalLayout += layout.length;
}
console.log(`\n脱节统计——🔴高危害 ${totalHigh} ｜ 🟡中危害 ${totalMid} ｜ ⚪无害布局标识 ${totalLayout}`);
if (totalHigh > 0) console.log("⚠️ 存在高危害脱节：装饰元素将直接缺失，请补齐对应选择器。");