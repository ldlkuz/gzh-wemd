/**
 * layer1-schema-validator.cjs — 可渲染性验证第 1 层：Schema Validation
 *
 * 职责：校验骨架 Intent 的「结构合法性」，即骨架树是否符合 DSL 语法。
 * 这一层只关心「写得对不对」，不关心「引用的东西是否存在」（那是第 2 层契约校验）。
 *
 * 校验点（真源 = reference/skeleton-design-spec.md §8 的 1/2/3/8，§2.1/§4 枚举）：
 *   S1 顶层必须是对象，且含 skeletons 集合（骨架以 id → 骨架对象 给出）
 *   S2 每个骨架对象必须有 component 字段（非空字符串）；注册性在 Layer2 查真源
 *   S3 根容器 layout 必须在枚举内：stack/centered/side-rail/split/grid/media-text
 *   S4 每个 region 必须携带合法 type（slot/group/decoration/label/rule）
 *   S5 region 必填字段存在：
 *        slot       → 必须有 slot 字段（契约引用交给 Layer2）
 *        group      → 必须有 name
 *        decoration → 必须有 name
 *        label      → 必须有 name（text 可选）
 *   S6 group 嵌套层数 ≤ 2（同规范 §0/§4）——越界视为 Schema 非法
 *   S7 relation / align 值非法（relation∈stack|inline|overlay，align∈left|center|right）
 *   S8 骨架任何节点不得出现 CSS 值（padding/margin/font-size/color/width/…硬规则，§0.1）——
 *      对整棵骨架树的 JSON 键做黑名单扫描。
 *
 * 设计：纯函数，无 DOM 副作用。输入骨架对象，输出 { errors, warnings }。
 * 所有规则都基于「枚举值 + 结构存在性」，不需要查注册表，可独立运行、单测。
 *
 * 用法：node validator/layer1-schema-validator.cjs [theme-name]
 *   默认校验 themes 目录下所有主题的 skeleton_intent.json。
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const THEMES_DIR = path.join(ROOT, "themes");

// ============================================================
// DSL 枚举（真源 = skeleton-design-spec.md §2.1 / §4）
// ============================================================
const LAYOUT_ENUM = new Set([
  "stack",
  "centered",
  "side-rail",
  "split",
  "grid",
  "media-text",
]);
const REGION_TYPE_ENUM = new Set([
  "slot",
  "group",
  "decoration",
  "label",
  "rule",
]);
const RELATION_ENUM = new Set(["stack", "inline", "overlay"]);
const ALIGN_ENUM = new Set(["left", "center", "right"]);

/** §0.1 硬禁止的 CSS 键（一旦作为 JSON 键出现即非法） */
const FORBIDDEN_CSS_KEYS = new Set([
  "padding",
  "padding-top",
  "padding-right",
  "padding-bottom",
  "padding-left",
  "margin",
  "margin-top",
  "margin-right",
  "margin-bottom",
  "margin-left",
  "font-size",
  "font-family",
  "font-weight",
  "line-height",
  "color",
  "background",
  "background-color",
  "width",
  "height",
  "border",
  "border-radius",
  "box-shadow",
  "text-align",
  "letter-spacing",
  "display",
  "position",
  "flex",
  "flex-direction",
  "gap",
  "align-items",
  "justify-content",
  "grid-template-columns",
  "border-right",
  "border-left",
  "opacity",
  "transform",
  "overflow",
]);

// ============================================================
// 骨架树遍历
// ============================================================
/** 递归收集所有 region 节点 */
function collectRegions(regions, out = []) {
  for (const r of regions || []) {
    if (r && typeof r === "object") {
      out.push(r);
      if (Array.isArray(r.regions)) collectRegions(r.regions, out);
    }
  }
  return out;
}

/**
 * 递归扫描骨架对象的所有键，命中 CSS 值黑名单即报错（§0.1 硬规则）。
 * decor/text 里的 CSS 值不扫（那是内容文案），只扫「字段名」。
 */
function scanForbiddenCssKeys(node, id, errors, prefix = "skeleton") {
  if (!node || typeof node !== "object") return;
  for (const key of Object.keys(node)) {
    if (FORBIDDEN_CSS_KEYS.has(key)) {
      errors.push({
        code: "S8",
        path: `${id}.${prefix}.${key}`,
        message: `骨架中出现 CSS 值键 "${key}"（§0.1 硬禁止），Skeleton DSL 只允许结构概念，数量调整须交给 skin/CSS。`,
      });
    }
    const val = node[key];
    if (val && typeof val === "object") {
      scanForbiddenCssKeys(
        val,
        id,
        errors,
        Array.isArray(val) ? prefix : `${prefix}.${key}`,
      );
    }
  }
}

// ============================================================
// 单组件骨架校验
// ============================================================
function validateSkeleton(id, skel, sink) {
  const { errors, warnings } = sink;
  if (!skel || typeof skel !== "object") {
    errors.push({
      code: "S1",
      path: id,
      message: "骨架条目不是对象，需为 { component, layout, regions } 结构。",
    });
    return;
  }

  // S2 component 存在
  if (typeof skel.component !== "string" || !skel.component.trim()) {
    errors.push({
      code: "S2",
      path: `${id}.component`,
      message: "骨架缺少 component 字段（组件 id，需为字符串）。",
    });
  }

  // S3 根布局枚举
  const layout = skel.layout;
  if (layout !== undefined && !LAYOUT_ENUM.has(layout)) {
    errors.push({
      code: "S3",
      path: `${id}.layout`,
      message: `layout "${String(layout)}" 不在枚举 [${[...LAYOUT_ENUM].join(" | ")}] 内。`,
    });
  }

  // S4 遍历所有 region 校验 type / 必填字段 / relation / align
  const regions = Array.isArray(skel.regions) ? skel.regions : [];
  collectRegions(regions).forEach((r) => {
    const p = `${id}.region`;

    if (typeof r.type !== "string" || !REGION_TYPE_ENUM.has(r.type)) {
      errors.push({
        code: "S4",
        path: p,
        message: `region.type "${String(r.type)}" 不在枚举 [${[...REGION_TYPE_ENUM].join(" | ")}] 内。`,
      });
      return; // type 非法，下面的必填字段无从谈起
    }

    // S5 必填字段
    if (r.type === "slot" && r.slot === undefined) {
      errors.push({ code: "S5", path: p, message: "slot 型 region 缺少 slot 字段。" });
    }
    if (r.type === "group" && r.name === undefined) {
      errors.push({ code: "S5", path: p, message: "group 型 region 缺少 name 字段。" });
    }
    if (r.type === "decoration" && r.name === undefined) {
      errors.push({
        code: "S5",
        path: p,
        message: "decoration 型 region 缺少 name 字段。",
      });
    }
    if (r.type === "label" && r.name === undefined) {
      errors.push({ code: "S5", path: p, message: "label 型 region 缺少 name 字段。" });
    }

    // S7 relation / align 枚举
    if (r.relation !== undefined && !RELATION_ENUM.has(r.relation)) {
      errors.push({
        code: "S7",
        path: p,
        message: `region.relation "${String(r.relation)}" 不在枚举 [${[...RELATION_ENUM].join(" | ")}] 内。`,
      });
    }
    if (r.align !== undefined && !ALIGN_ENUM.has(r.align)) {
      errors.push({
        code: "S7",
        path: p,
        message: `region.align "${String(r.align)}" 不在枚举 [${[...ALIGN_ENUM].join(" | ")}] 内。`,
      });
    }
  });

  // S6 group 嵌套深度 ≤ 2
  const depthViolation = findDeepGroup(skel.regions, 1);
  if (depthViolation) {
    errors.push({
      code: "S6",
      path: `${id}.regions`,
      message: `group 嵌套深度超过 2 层（最深 ${depthViolation} 层），规范 §0/§4 限制嵌套深度 ≤ 2。`,
    });
  }

  // S8 CSS 值黑名单扫描
  scanForbiddenCssKeys(skel, id, errors, "skeleton");
}

/** 返回超过深度的层数，若都合规返回 0 */
function findDeepGroup(regions, depth) {
  let max = 0;
  for (const r of regions || []) {
    if (r && r.type === "group") {
      if (depth > 2) max = Math.max(max, depth);
      max = Math.max(max, findDeepGroup(r.regions, depth + 1));
    }
  }
  return max;
}

// ============================================================
// 主题级入口
// ============================================================
function validateSchema(skeletons) {
  const errors = [];
  const warnings = [];
  if (!skeletons || typeof skeletons !== "object") {
    errors.push({
      code: "S1",
      path: "skeletons",
      message: "顶层缺少 skeletons 对象，无法进行骨架 Schema 校验。",
    });
    return { errors, warnings };
  }

  for (const [id, skel] of Object.entries(skeletons)) {
    validateSkeleton(id, skel, { errors, warnings });
  }
  return { errors, warnings };
}

// ============================================================
// CLI
// ============================================================
if (require.main === module) {
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
    const intentPath = path.join(THEMES_DIR, name, "states", "skeleton_intent.json");
    if (!fs.existsSync(intentPath)) {
      console.log(`  ⚪ ${name} — 无 skeleton_intent.json，跳过`);
      continue;
    }
    const skeletons = JSON.parse(fs.readFileSync(intentPath, "utf8")).skeletons || {};
    const { errors, warnings } = validateSchema(skeletons);
    if (errors.length === 0) {
      console.log(`  ✅ ${name} — Schema 校验通过（${Object.keys(skeletons).length} 个骨架）`);
    } else {
      console.log(`  ❌ ${name} — Schema ${errors.length} 个错误：`);
      for (const e of errors) console.log(`    [${e.code}] ${e.path}: ${e.message}`);
      totalErrors += errors.length;
    }
    for (const w of warnings) {
      console.log(`    ⚠️ [${w.code}] ${w.path}: ${w.message}`);
      totalWarnings++;
    }
  }

  console.log("");
  if (totalErrors > 0) {
    console.error(`🚫 Schema 校验失败：共 ${totalErrors} 个问题。退出码 1`);
    process.exit(1);
  }
  console.log(`✅ 全部主题 Schema 校验通过（${totalWarnings} 条建议）。`);
}

module.exports = { validateSchema, LAYOUT_ENUM, REGION_TYPE_ENUM };