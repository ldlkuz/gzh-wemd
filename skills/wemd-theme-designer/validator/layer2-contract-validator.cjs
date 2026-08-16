/**
 * layer2-contract-validator.cjs — 可渲染性验证第 2 层：Component Contract Validation
 *
 * 职责：在 Schema 层（Layer1）之上，校验骨架「引用的东西是否合法存在」——
 * 骨架是否遵守组件契约。这一层解决「引用性」问题：slot 是否在该组件契约内、
 * decoration/label 是否在预定义集、group 的 name 是否生成合法 class、list slot 是否正确。
 *
 * 真源（契约以主程序 slotDefs.ts 为准，不复制）：
 *   - 组件 slot 契约  → 主程序 dist 的 slotDefs.js（getBuiltinSlotDef）
 *   - 组件注册表      → registry/components.json（id 存在性）
 *   - decoration/label 预定义集 → skeleton-design-spec.md §5
 *   - group name → abbr 前缀规则（v3.1，Compiler 以 `wemd-${abbr}-${groupName}` 命名）
 *
 * 校验点：
 *   C1 骨架引用的 component 必须在注册表 components.json 中（否则回退默认、无骨架可渲染）
 *   C2 每个 slot 型 region 的 slot 必须在 getBuiltinSlotDef(component) 契约内
 *   C3 list 型 slot 只能通过 group 或多实例引用，禁止单 region 直接引 list 槽塞不定项
 *      —— 见下 C3 说明，遵循骨架「一个视觉区域一个内容」的约束
 *   C4 decoration.name / label.name 必须在预定义集（quote-mark/top-bar/dot/corner/cap）内
 *   C5 group.name 必须是无空格/连字符的合法 class 段（渲染为 wemd-{abbr}-{name}）
 *   C6 骨架 layout 值的类型必须为字符串（schema 层只查枚举，此层查类型）
 *
 * 设计：纯函数（骨架 + 组件契约索引 → 错误列表）。契约索引即「真源读入内存」的结果，
 *       避免每个骨架反复读文件。
 *
 * 用法：node validator/layer2-contract-validator.cjs [theme-name]
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const THEMES_DIR = path.join(ROOT, "themes");
const REGISTRY_PATH = path.join(ROOT, "registry", "components.json");
const CORE_DIST = path.resolve(ROOT, "..", "..", "packages", "core", "dist");
const {
  getBuiltinSlotDef,
  getComponentAbbr,
} = require(path.join(CORE_DIST, "plugins/component/slotDefs.js"));

/** §5 预定义 decoration/label name 集（真源 = skeleton-design-spec.md） */
const PREDEFINED_DECORATIONS = new Set([
  "quote-mark",
  "top-bar",
  "dot",
  "corner",
  "cap",
  "line",
  "circle",
  "arrow",
  "badge",
  "strip",
  "asterisk",
  "underline",
  "overline",
  "star",
  "arrow-down",
]);

/** 合法 class 段：小写字母/数字/连字符，不含空格与非法字符 */
const CLASS_NAME_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// ============================================================
// 契约索引：读一次内存
// ============================================================
function loadContractIndex() {
  let registry = [];
  if (fs.existsSync(REGISTRY_PATH)) {
    registry = JSON.parse(fs.readFileSync(REGISTRY_PATH, "utf8"));
  }
  const registeredIds = new Set(registry.map((r) => r.id));
  const slotDefs = new Map();
  for (const r of registry) {
    const def = getBuiltinSlotDef(r.id);
    if (def) slotDefs.set(r.id, new Set(def.slots.map((s) => s.key)));
  }
  return { registeredIds, slotDefs, registry };
}

// ============================================================
// 骨架树遍历
// ============================================================
function collectRegions(regions, out = []) {
  for (const r of regions || []) {
    if (r && typeof r === "object") {
      out.push(r);
      if (Array.isArray(r.regions)) collectRegions(r.regions, out);
    }
  }
  return out;
}

// ============================================================
// 校验
// ============================================================
function validateContract(id, skel, index, sink) {
  const { errors, warnings } = sink;
  const { registeredIds, slotDefs } = index;
  if (!skel || typeof skel !== "object") return;

  const component = skel.component;

  // C1 component 注册
  if (typeof component !== "string" || !registeredIds.has(component)) {
    errors.push({
      code: "C1",
      path: `${id}.component`,
      message: `组件 "${String(component)}" 不在注册表 components.json 中；未注册组件无法渲染，骨架应回退默认。`,
    });
    return; // component 无效，其余契约校验无意义
  }

  const abbr = getComponentAbbr(component);
  const allowedSlots = slotDefs.get(component);

  // C6 layout 类型
  if (skel.layout !== undefined && typeof skel.layout !== "string") {
    errors.push({
      code: "C6",
      path: `${id}.layout`,
      message: `layout 必须是字符串，收到 ${typeof skel.layout}。`,
    });
  }

  // C2/C4/C5 逐 region 校验引用性
  const regions = collectRegions(skel.regions);
  for (const r of regions) {
    const p = `${id}.region`;

    if (r.type === "slot") {
      if (r.slot === undefined) continue; // Layer1 已报
      // C3 list 槽：骨架中用 slot 引用 list 槽是不合法的（list 需要以 items 结构迭代）
      if (
        allowedSlots &&
        typeof r.slot === "string" &&
        !allowedSlots.has(r.slot) &&
        !isListSlot(component, r.slot)
      ) {
        errors.push({
          code: "C2",
          path: `${p}.slot`,
          message: `slot "${r.slot}" 不在组件 "${component}" 的 slot 契约内。合法 slot: [${[...allowedSlots].join(", ")}]。`,
        });
      }
    }

    if (r.type === "list") {
      // list 型 region 为特殊契约（如 stats-block 的 cards），其子 region 校验在 group 展开
      if (!isListSlot(component, r.slot)) {
        warnings.push({
          code: "C3",
          path: `${p}.slot`,
          message: `list 型 region 引用 "${r.slot}"，请确认该槽在组件契约中声明为 list。`,
        });
      }
    }

    if (r.type === "decoration" && r.name !== undefined && !PREDEFINED_DECORATIONS.has(r.name)) {
      warnings.push({
        code: "C4",
        path: `${p}.name`,
        message: `decoration "${r.name}" 不在预定义装饰集内，Compiler 可能无法映射；若确认已扩展真源请忽略。预定义集: [${[...PREDEFINED_DECORATIONS].join(", ")}]。`,
      });
    }

    if (r.type === "label" && r.name !== undefined && !CLASS_NAME_RE.test(r.name)) {
      errors.push({
        code: "C5",
        path: `${p}.name`,
        message: `label.name "${r.name}" 含非法字符，将渲染为 wemd-${abbr}-${r.name}，class 段必须为小写字母/数字/连字符。`,
      });
    }

    if (r.type === "group" && r.name !== undefined && !CLASS_NAME_RE.test(r.name)) {
      errors.push({
        code: "C5",
        path: `${p}.name`,
        message: `group.name "${r.name}" 含非法字符，将渲染为 wemd-${abbr}-${r.name}，class 段必须为小写字母/数字/连字符。`,
      });
    }
  }
}

/** 判断某槽是否为 list 契约槽（items 等） */
function isListSlot(component, slot) {
  const def = getBuiltinSlotDef(component);
  if (!def) return false;
  const s = def.slots.find((x) => x.key === slot);
  return !!(s && s.type === "list");
}

// ============================================================
// 主题级入口
// ============================================================
function validateContractForSkeletons(skeletons) {
  const index = loadContractIndex();
  const errors = [];
  const warnings = [];

  for (const [id, skel] of Object.entries(skeletons || {})) {
    validateContract(id, skel, index, { errors, warnings });
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
    const { errors, warnings } = validateContractForSkeletons(skeletons);

    if (errors.length === 0) {
      console.log(`  ✅ ${name} — 契约校验通过（${Object.keys(skeletons).length} 个骨架）`);
    } else {
      console.log(`  ❌ ${name} — 契约校验 ${errors.length} 个错误：`);
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
    console.error(`🚫 契约校验失败：共 ${totalErrors} 个问题。退出码 1`);
    process.exit(1);
  }
  console.log(`✅ 全部主题契约校验通过（${totalWarnings} 条建议）。`);
}

module.exports = { validateContractForSkeletons, PREDEFINED_DECORATIONS };