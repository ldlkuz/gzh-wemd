/**
 * validate-layout.cjs — 骨架与皮肤「布局完整性」校验（两级结构）
 *
 * 背景：仅依赖合法 class 名（validate-css-selectors）无法发现语义层面的布局脱节，
 * 例如「CSS 没落地骨架声明的布局意图」导致的文字靠右 / 不居中。本校验器
 * 以 skeleton_intent.json（布局意图真源）驱动，核对主题 CSS 是否落地了对应的
 * display / 居中属性，把这类回归从「人工目检」升级为「打包前自动拦截」。
 *
 * 两级结构（先定结构，再检测，不笼统）：
 * ------------------------------------------------------------------
 *  [全局层 Global] —— 与具体组件无关、作用于整篇主题的契约
 *    G1 `#wemd` 根块必须存在（承载 CSS 变量 + 基础重置）
 *    G2 禁止给 `#wemd` 设置 background（微信对根容器背景支持不可靠，段落间露白）
 *    G3 主题若使用 var(--wemd-*)，根块必须定义这些变量（避免引用未定义变量）
 *    说明：不硬编码具体变量名清单，避免与主程序变量真源漂移。以“使用即校验”为准。
 *
 *  [组件层 Component] —— 逐组件核对骨架声明的布局意图
 *    检测粒度：到单个组件 id；承载域 = 该组件皮肤整体（根 + 全部后代节点的声明并集）。
 *    为什么是"组件域聚合"而非"单节点"：
 *      真实主题常把布局意图落在不同节点——根(.wemd-image-compare)、
 *      body(.wemd-component-body)、或 group(.wemd-pc-price-row)；
 *      grid 在微信下会刻意退化为 inline-block / flex-wrap（不能强制 display:grid）。
 *      因此校验器聚合「选择器包含该组件的所有 CSS 块」，在其上断言布局意图是否有落地痕迹，
 *      而不是对某个特定节点写死 display 值。这样既细化到单组件，又不误伤微信兼容设计。
 *
 *    布局意图规格（skeleton-design-spec §2.1 layout 枚举，按微信可行域定义）：
 *      centered    组件皮肤内须有居中痕迹（justify-content/align-items/text-align/margin auto）
 *      side-rail   用左侧 rail / 装饰引线表达即可；无显式侧栏声明时给出 warning（不强制 flex）
 *      split       组件皮肤内须有横向并排机制（flex/inline-block/grid 任一）——error 级
 *      grid        组件皮肤内须有多栏机制（flex-wrap / inline-block / grid-template-columns）——error 级
 *      media-text  组件皮肤内须有横向并列（flex / inline-block）——error 级
 *      stack       默认 block/column，结构自洽，不强校验
 *
 * 用法：node scripts/validate-layout.cjs [theme-name]
 *   默认校验 themes 目录下所有主题；也可指定单个主题名。
 * 退出码：0=通过，1=有 error（供打包脚本 halt）。warning 不阻断。
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const THEMES_DIR = path.join(ROOT, "themes");
const CORE_DIST = path.resolve(ROOT, "..", "..", "packages", "core", "dist");
const { getComponentAbbr } = require(
  path.join(CORE_DIST, "plugins/component/slotDefs.js"),
);

// ============================================================
// 横向并排 / 多栏 / 居中的可行机制（微信兼容域）
// ============================================================
const HORIZONTAL_RE =
  /display\s*:\s*(?:flex|inline-block|grid)|\bgrid-template-columns\s*:/;
const MULTICOLUMN_RE =
  /display\s*:\s*(?:flex|inline-block)|\bflex-wrap\s*:|\bgrid-template-columns\s*:/;
const CENTER_RE =
  /(?:justify-content|align-items|text-align)\s*:|margin(?:-inline)?\s*:\s*[0-9.]+(?:rem|px|em|%)?\s+auto/;

// 布局类型 → 校验规格
//   errorRE : 落地该布局的关键意图；组件域内查不到 → error
//   noteRE  : 可选建议；查不到 → warning（不阻断）
//   msg     : 报错文案
const LAYOUT_SPECS = {
  centered: {
    errorRE: CENTER_RE,
    msg: "组件皮肤内未发现任何居中落地痕迹（justify-content/align-items/text-align/margin auto），居中意图落空",
  },
  split: {
    errorRE: HORIZONTAL_RE,
    msg: "组件皮肤内未发现横向并排机制（display:flex / inline-block / grid），split 布列退化为 block 竖排",
  },
  grid: {
    errorRE: MULTICOLUMN_RE,
    msg: "组件皮肤内未发现多栏机制（flex-wrap / inline-block / grid-template-columns），多卡片网格无法成立",
  },
  "media-text": {
    errorRE: HORIZONTAL_RE,
    msg: "组件皮肤内未发现图文横向并列机制（display:flex / inline-block），media-text 退化为竖排",
  },
  "side-rail": {
    errorRE: null, // 不强制，主题可用装饰引线表达
    noteRE: /(?:display\s*:\s*(?:flex|grid)|border(?:-left)?\s*:)/,
    msg: "未发现显式侧栏或左侧引线（display:flex / border-left），若靠装饰表达可忽略",
  },
  stack: {
    errorRE: null, // block/column 自洽
    msg: null,
  },
};

// ============================================================
// CSS 块解析：产出 [{ selector, decls }]，支持逗号并列选择器
// ============================================================
function parseBlocksRobust(css) {
  const cleaned = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const blocks = [];
  let depth = 0;
  let selStart = -1;
  let declStart = -1;
  let i = 0;
  const n = cleaned.length;

  while (i < n) {
    const ch = cleaned[i];
    if (ch === "{") {
      if (depth === 0) {
        selStart = i;
        declStart = i + 1;
      }
      depth++;
    } else if (ch === "}") {
      depth--;
      if (depth === 0 && selStart >= 0) {
        let selector = cleaned.slice(0, selStart).trim();
        selector = selector.slice(Math.max(0, selector.lastIndexOf("}") + 1)).trim();
        const decls = cleaned.slice(declStart, i);
        if (selector && !selector.startsWith("@")) {
          for (const part of selector.split(",")) {
            const s = part.trim();
            if (s) blocks.push({ selector: s, decls });
          }
        }
        selStart = -1;
        declStart = -1;
      }
    }
    i++;
  }
  return blocks;
}

/** 选取所有"选择器包含指定 wemd class（组件根 / group）"的 CSS 块（该结构单元的皮肤整体） */
function blocksForClass(blocks, wemdClass) {
  const re = new RegExp(`\\.${wemdClass}(?=[\\s.{:#,\\[\\]]|$)`);
  return blocks.filter((b) => re.test(b.selector));
}

/** 收集骨架里所有 group（含嵌套，深度 ≤2），用于下沉到 group 级逐一校验布局意图 */
function collectGroups(regions, out = []) {
  for (const r of regions || []) {
    if (r && r.type === "group") {
      out.push(r);
      collectGroups(r.regions, out);
    }
  }
  return out;
}

// ============================================================
// 全局层校验（G1/G2/G3）
// ============================================================
function validateGlobal(css, blocks) {
  const errors = [];
  const warnings = [];

  const wemdBlock = blocks.find((b) => b.selector.replace(/\s+/g, "") === "#wemd");
  if (!wemdBlock) {
    errors.push("G1 未找到 `#wemd` 根块：主题需用其承载 CSS 变量与基础重置。");
  } else {
    if (/\bbackground(?:-color)?\s*:/.test(wemdBlock.decls)) {
      errors.push(
        "G2 禁止给 `#wemd` 设置 background：微信对根容器背景支持不可靠，段落间会露白。",
      );
    }

    const definedVars = new Set(
      [...wemdBlock.decls.matchAll(/--wemd-[a-zA-Z0-9-]+/g)].map((m) => m[0]),
    );
    const usages = [
      ...new Set([...css.matchAll(/var\(\s*(--wemd-[a-zA-Z0-9-]+)/g)].map((m) => m[1])),
    ];
    const undefinedVars = usages.filter((v) => !definedVars.has(v));
    if (undefinedVars.length > 0) {
      errors.push(
        `G3 引用了根块未定义的 CSS 变量：${undefinedVars.join(", ")}。` +
          `请在 \`#wemd\` 内声明，避免解析为无效值。`,
      );
    }
  }

  return { errors, warnings };
}

// ============================================================
// 组件层校验：对单个组件按布局规格在"组件皮肤整体"上核对
// ============================================================
function checkComponentLayout({ id, component, layout, compDecls, errors, warnings }) {
  const spec = LAYOUT_SPECS[layout] || LAYOUT_SPECS.stack;
  if (!spec.errorRE) return; // stack / side-rail 不做硬校验

  if (!spec.errorRE.test(compDecls)) {
    errors.push(`${id}（layout=${layout}）${spec.msg}。`);
  }
  if (spec.noteRE && !spec.noteRE.test(compDecls)) {
    warnings.push(`${id}（layout=${layout}）${spec.msg}（建议级，可忽略）。`);
  }
}

// ============================================================
// 主题校验
// ============================================================
function validateTheme(themeName) {
  const intentPath = path.join(THEMES_DIR, themeName, "states", "skeleton_intent.json");
  const cssFile = path.join(THEMES_DIR, themeName, "css", `${themeName}.css`);

  if (!fs.existsSync(intentPath)) {
    return { skipped: true, reason: "无 skeleton_intent.json（未走骨架设计，跳过）" };
  }
  if (!fs.existsSync(cssFile)) {
    return { skipped: true, reason: "无 css 产物，跳过" };
  }

  const skeletons = (JSON.parse(fs.readFileSync(intentPath, "utf8")).skeletons) || {};
  const css = fs.readFileSync(cssFile, "utf-8");
  const blocks = parseBlocksRobust(css);

  // ---- 全局层 ----
  const global = validateGlobal(css, blocks);

  // ---- 组件层（根 + 各 group 分别按布局规格，在其皮肤块整体上校验） ----
  const componentErrors = [];
  const componentWarnings = [];
  let checkedNodes = 0;
  for (const [id, skel] of Object.entries(skeletons)) {
    if (!skel || !skel.component) continue;
    const abbr = getComponentAbbr(skel.component);
    const rootClass = `wemd-${skel.component}`;
    const rootDecls = blocksForClass(blocks, rootClass)
      .map((b) => b.decls)
      .join("\n");
    checkComponentLayout({
      id,
      layout: skel.layout || "stack",
      compDecls: rootDecls,
      errors: componentErrors,
      warnings: componentWarnings,
    });
    checkedNodes++;

    // 每个 group：仅当其布局为「独立意图」时才下沉校验。
    //   - stack：透明结构包装，默认 block 自洽 → 跳过
    //   - 与根 layout 相同的 group：其居中/分栏由根统一承载 → 跳过（避免重复/误报，
    //     如 brand-sign + stamp 都是 centered，stamp 靠根 text-align 继承居中）
    //   - side-rail：常靠内部 slot 的 border-left 引线表达，group 壳裸奔是常态 → 有皮肤才给建议
    //   - 其余（如根 stack + group centered / split / media-text / grid）：独立意图
    //     必须由 group 自身皮肤块落地 → 在此校验
    const rootLayout = skel.layout || "stack";
    for (const g of collectGroups(skel.regions)) {
      if (!g.layout || g.layout === "stack") continue; // 透明包装，默认 block 自洽
      if (g.layout === rootLayout) continue; // 由根承载同款布局
      if (g.layout === "side-rail") {
        // side-rail 常由内部引线表达；有皮肤块才做建议级核对
        const scope = blocksForClass(blocks, `wemd-${abbr}-${g.name}`);
        if (scope.length > 0) {
          checkComponentLayout({
            id: `${id}(group.${g.name})`,
            layout: g.layout,
            compDecls: scope.map((b) => b.decls).join("\n"),
            errors: componentErrors,
            warnings: componentWarnings,
          });
          checkedNodes++;
        }
        continue;
      }

      const scope = blocksForClass(blocks, `wemd-${abbr}-${g.name}`);
      if (scope.length === 0) {
        // 独立布局意图的 group 却无任何皮肤选择器：布局需由根或后代节点承载，提醒确认
        componentWarnings.push(
          `${id}(group.${g.name}, layout=${g.layout}): 该 group 无任何 CSS 选择器，` +
            `该独立布局意图需由根节点或后代节点承载，请确认。`,
        );
        continue;
      }
      checkComponentLayout({
        id: `${id}(group.${g.name})`,
        layout: g.layout,
        compDecls: scope.map((b) => b.decls).join("\n"),
        errors: componentErrors,
        warnings: componentWarnings,
      });
      checkedNodes++;
    }
  }

  return {
    errors: [...global.errors, ...componentErrors],
    warnings: [...global.warnings, ...componentWarnings],
    customCount: Object.keys(skeletons).length,
    checkedNodes,
  };
}

// ============================================================
// 主流程
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

let totalErrors = 0;
let totalWarnings = 0;
for (const name of names) {
  if (!name) continue;
  const res = validateTheme(name);
  if (res.skipped) {
    console.log(`  ⚪ ${name} — 跳过（${res.reason}）`);
    continue;
  }
  if (res.errors.length === 0) {
    console.log(
      `  ✅ ${name} — 布局校验通过（${res.customCount} 个自定义骨架，覆盖根与 ${res.checkedNodes} 个布局节点）`,
    );
  } else {
    console.log(`  ❌ ${name} — 布局校验 ${res.errors.length} 个错误：`);
    for (const e of res.errors) console.log(`    ${e}`);
    totalErrors += res.errors.length;
  }
  if (res.warnings && res.warnings.length > 0) {
    console.log(`  ⚠️  ${name} — ${res.warnings.length} 条建议：`);
    for (const w of res.warnings) console.log(`    ${w}`);
    totalWarnings += res.warnings.length;
  }
}

console.log("");
if (totalErrors > 0) {
  console.error(`🚫 布局校验失败：共 ${totalErrors} 个问题。请修正后重新打包。`);
  process.exit(1);
} else {
  console.log(`✅ 全部主题布局校验通过（${totalWarnings} 条建议待关注）。`);
}