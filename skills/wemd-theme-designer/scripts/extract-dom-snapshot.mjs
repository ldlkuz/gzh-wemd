/**
 * extract-dom-snapshot.mjs — 从单一真源生成组件 DOM 结构权威参考
 *
 * 真源（Single Source of Truth）：
 *   1. packages/core/src/css-translator/componentElements.ts
 *      —— 定义每个组件的标准选择器（wemedSelector）与 hasBody
 *   2. packages/core/src/plugins/component/magazineRenderers.ts
 *      —— 定义杂志级组件实际输出的具名 section class
 *
 * 用法：node scripts/extract-dom-snapshot.mjs
 * 输出：reference/dom-structure.md（自动生成，禁止手工维护）
 *
 * 关键约定（与真实渲染一致）：
 *   - 普通组件（hasBody=true）：body 内走完整 markdown-it 渲染输出原生标签，
 *     再由 ThemeProcessor.addChildPositionClasses 将直接子标签附加 .wemd-child-N。
 *     真实 DOM = 原生标签 + .wemd-child-N（两者共存，CSS 用 child-N 定位更稳）。
 *   - 杂志级组件（hasBody=false）：body 内用具名 section class。
 *   - 组件 wrapper 的上下 margin 由 Stack 规则统一控制，组件 CSS 不写。
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
// 主程序真源路径
const CORE_DIR = path.resolve(
  ROOT,
  "..",
  "..",
  "packages",
  "core",
  "src",
);
const ELEMENTS_TS = path.join(CORE_DIR, "css-translator", "componentElements.ts");
const RENDERERS_TS = path.join(CORE_DIR, "plugins", "component", "magazineRenderers.ts");
const OUT_MD = path.join(ROOT, "reference", "dom-structure.md");
const REGISTRY = path.join(ROOT, "registry", "components.json");

// ============================================================
// 解析 componentElements.ts —— 提取每个组件的标准选择器
// ============================================================
function parseComponentElements(src) {
  // 每个定义块：const NAME: ComponentElementsDef = { ... };
  const blocks = [];
  const re =
    /const\s+(\w+)\s*:\s*ComponentElementsDef\s*=\s*\{([\s\S]*?)\n\};/g;
  let m;
  while ((m = re.exec(src)) !== null) {
    blocks.push({ constName: m[1], body: m[2] });
  }

  const defs = [];
  for (const b of blocks) {
    const type = matchQuoted(b.body, /type\s*:\s*"([^"]+)"/);
    const label = matchQuoted(b.body, /label\s*:\s*"([^"]+)"/);
    const hasBody = /hasBody\s*:\s*true/.test(b.body);
    const containerSelector = matchQuoted(
      b.body,
      /containerSelector\s*:\s*"([^"]+)"/,
    );
    // 提取 elements 数组中的每个 { name: "x", desc: "y", wemdSelector: "z" }
    const elements = [];
    const elRe =
      /\{\s*name\s*:\s*"([^"]+)"\s*,\s*desc\s*:\s*"([^"]*)"\s*,\s*wemdSelector\s*:\s*"((?:[^"\\]|\\.)*)"\s*\}/g;
    let em;
    while ((em = elRe.exec(b.body)) !== null) {
      elements.push({
        name: em[1],
        desc: em[2],
        selector: em[3].replace(/\\"/g, '"'),
      });
    }
    defs.push({ type, label, constName: b.constName, hasBody, containerSelector, elements });
  }
  return defs;
}

function matchQuoted(text, re) {
  const m = text.match(re);
  return m ? m[1] : "";
}

// ============================================================
// 解析 magazineRenderers.ts —— 提取杂志级组件实际输出的具名 class
// ============================================================
function parseMagazineRenderers(src) {
  // 收集所有输出到 HTML 的具名 class（例如 <section class="wemd-rl-item">）
  const classes = new Set();
  const clsRe = /class="(wemd-[a-z0-9-]+(?:\s+(?:current|wemd-sn-empty))?)"/g;
  let m;
  while ((m = clsRe.exec(src)) !== null) {
    classes.add(m[1]);
  }
  return [...classes].sort();
}

// ============================================================
// 生成 Markdown
// ============================================================
function hasBodyByType(defs) {
  const map = {};
  for (const d of defs) map[d.type] = d.hasBody;
  return map;
}

function buildMd(defs, magazineClasses, registry) {
  const lines = [];
  lines.push("# 组件 DOM 结构（自动生成 · 权威基准）");
  lines.push("");
  lines.push(`> 由 \`scripts/extract-dom-snapshot.mjs\` 从主程序真源自动生成，**禁止手工维护**。`);
  lines.push(`> 真源：\`componentElements.ts\`（标准选择器）+ \`magazineRenderers.ts\`（杂志级输出 class）。`);
  lines.push(`> 生成时间：${new Date().toISOString().slice(0, 19).replace("T", " ")}`);
  lines.push("");
  lines.push("## 通用规律");
  lines.push("");
  lines.push("- 组件根节点：`#wemd .wemd-{id}`，并带 `wemd-component` 类。");
  lines.push("- **普通组件（hasBody=true）**：body 内走完整 markdown-it 渲染输出原生标签（`<p>/<ul>/<li>/<table>`），再由 `ThemeProcessor.addChildPositionClasses` 将直接子标签附加 `.wemd-child-N`（N 从 1 递增）。**真实 DOM = 原生标签 + `.wemd-child-N` 两者共存**，CSS 用 `.wemd-child-N` 定位更稳。");
  lines.push("- **杂志级组件（hasBody=false）**：body 内用具名 class（如 `.wemd-rl-title`）。");
  lines.push("- 组件 wrapper 的 `margin-bottom` 由 Stack 规则统一控制，组件 CSS 内不写上下 margin。");
  lines.push("- body 内水平内边距统一走 `--wemd-space-inline`，防止内容贴边。");
  lines.push("");
  lines.push("## 组件结构明细");
  lines.push("");
  lines.push("| 组件 | 类型 | body 内真实结构 / 标准选择器 |");
  lines.push("|------|------|------------------------------|");

  // 按 registry 顺序输出，保证完整
  const regIds = registry.map((r) => r.id).filter(Boolean);
  const defByType = {};
  for (const d of defs) defByType[d.type] = d;

  const allIds = [...new Set([...regIds, ...defs.map((d) => d.type)])];
  for (const id of allIds) {
    const d = defByType[id];
    if (!d) {
      lines.push(`| ${id} | 未定义 | （registry 存在但真源未定义，请补 componentElements） |`);
      continue;
    }
    const kind = d.hasBody ? "原生+child-N" : "具名";
    let detail;
    if (d.hasBody) {
      // 普通组件：真实 DOM 由 addChildPositionClasses 附加 .wemd-child-N
      // 列出语义元素对应的 child-N 定位（用 elements 数量近似，实际按内容动态）
      const namedCount = d.elements.filter(
        (e) => e.name !== "container" && e.name !== "body",
      ).length;
      const childN =
        namedCount > 0
          ? Array.from({ length: namedCount }, (_, i) => `.wemd-child-${i + 1}`).join(" ")
          : "（无直接子元素）";
      // 附加原生标签提示（从 wemdSelector 提取标签名）
      const tags = [];
      for (const e of d.elements) {
        const m = e.selector.match(/\b(p|ul|ol|li|table|th|td|strong|em|img|pre|code|a)\b/g);
        if (m) for (const t of m) if (!tags.includes(t)) tags.push(t);
      }
      detail = childN;
      if (tags.length) detail += `（原生: ${tags.join(" ")}）`;
    } else {
      // 具名 class：从 elements（去掉 container）提取 .wemd-xxx
      const parts = d.elements
        .filter((e) => e.name !== "container")
        .map((e) => e.selector.split(" ").pop() || e.name);
      detail = parts.join(" ");
    }
    lines.push(`| ${id} | ${kind} | \`${detail}\` |`);
  }

  lines.push("");
  lines.push("## 杂志级组件具名 class 清单");
  lines.push("");
  lines.push("（由 magazineRenderers.ts 实际输出，供选择器校验引用）");
  lines.push("");
  for (const c of magazineClasses) {
    lines.push(`- \`${c.replace(/\s+/g, ".")}\``);
  }

  lines.push("");
  lines.push("## 关键陷阱");
  lines.push("");
  lines.push("1. **普通组件 body 内 = 原生标签 + `.wemd-child-N` 共存。** `ThemeProcessor.addChildPositionClasses` 会把 body 直接子标签附加 `.wemd-child-N`（预览、导出统一路径）。CSS 用 `.wemd-child-N` 定位更稳，也可用原生标签。");
  lines.push("2. **杂志级组件用具名 class。** 写 CSS 时以本文档「具名 class 清单」为准，禁止臆造。");
  lines.push("3. 组件容器负责自身水平内边距；Stack 负责上下 margin。");
  lines.push("4. 渲染器会给部分文本自动加内联样式（如 `cta-card` 的 `<strong>` 内联深色）。若与主题冲突，需用 `!important` 覆盖。");
  lines.push("");

  // 追加未定义组件清单
  const undef = registry
    .map((r) => r.id)
    .filter((id) => !defByType[id]);
  if (undef.length) {
    lines.push("## 真源未定义组件");
    lines.push("");
    lines.push("以下组件在 registry 中存在但真源 `componentElements.ts` 未定义标准选择器：");
    lines.push("");
    for (const id of undef) lines.push(`- \`${id}\``);
    lines.push("");
    lines.push("这些组件通常是纯原生渲染（无专用渲染器），body 内直接是原生标签。若需深度样式化，请在 `componentElements.ts` 补充定义。");
    lines.push("");
  }
  return lines.join("\n");
}

// ============================================================
// 主流程
// ============================================================
if (!fs.existsSync(ELEMENTS_TS)) {
  console.error(`❌ 未找到真源文件: ${ELEMENTS_TS}`);
  console.error("   请确认主程序 packages/core 目录结构正确。");
  process.exit(1);
}

const elementsSrc = fs.readFileSync(ELEMENTS_TS, "utf-8");
const renderersSrc = fs.existsSync(RENDERERS_TS)
  ? fs.readFileSync(RENDERERS_TS, "utf-8")
  : "";
const registry = fs.existsSync(REGISTRY)
  ? JSON.parse(fs.readFileSync(REGISTRY, "utf-8"))
  : [];

const defs = parseComponentElements(elementsSrc);
const magazineClasses = parseMagazineRenderers(renderersSrc);

console.log(`📦 解析到 ${defs.length} 个组件定义`);
console.log(`🎨 杂志级具名 class：${magazineClasses.length} 个`);

const md = buildMd(defs, magazineClasses, registry);
fs.mkdirSync(path.dirname(OUT_MD), { recursive: true });
fs.writeFileSync(OUT_MD, md, "utf-8");
console.log(`✅ 已生成: ${OUT_MD}`);
console.log("");
console.log("组件覆盖清单：");
for (const d of defs) {
  console.log(`   ${d.hasBody ? "原生" : "具名"}  ${d.type}`);
}