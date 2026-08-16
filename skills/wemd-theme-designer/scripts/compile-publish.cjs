/**
 * compile-publish.cjs — Compiler 子阶段 B：公众号发布 HTML 生成器
 *
 * 复用主程序 processHtml（全内联器）：
 *  - CSS 变量展开、rem→px、类选择器如 #wemd .wemd-* → style="" 属性
 *  - 移除 <style>/<html>/<head>/<body>，仅保留纯 HTML 片段
 *  - 伪元素装饰物化为真实元素（inlinePseudoElements=true，微信兼容）
 *
 * 用法：node scripts/compile-publish.cjs <theme-name>
 *   输出：themes/{theme-name}/publish/{theme-name}.html
 */
const fs = require("fs");
const path = require("path");

const SKILL_ROOT = path.resolve(__dirname, "..");
const CORE_DIST = path.resolve(SKILL_ROOT, "../../packages/core/dist");

// processHtml 依赖浏览器 DOM（document/window/HTMLElement 等）。
// 主程序在 Electron 渲染进程运行，天然有全局 document；CLI 下需注入 happy-dom。
const HAPPY_DOM = path.resolve(
  SKILL_ROOT,
  "../../packages/core/node_modules/happy-dom",
);
const { Window, GlobalWindow } = require(HAPPY_DOM);
const win = new GlobalWindow();
for (const key of [
  "window",
  "document",
  "HTMLElement",
  "HTMLDivElement",
  "HTMLSpanElement",
  "HTMLTableElement",
  "Element",
  "Node",
  "getComputedStyle",
  "navigator",
]) {
  globalThis[key] = win[key];
}
const THEME_NAME = process.argv[2] || "";
if (!THEME_NAME) {
  console.error("❌ 请指定主题名：node scripts/compile-publish.cjs <theme-name>");
  process.exit(1);
}

const THEME_DIR = path.join(SKILL_ROOT, "themes", THEME_NAME);
const CSS_FILE = path.join(THEME_DIR, "css", `${THEME_NAME}.css`);
const TEMPLATES_FILE = path.join(THEME_DIR, "package", "templates.json");
const THEME_JSON = path.join(THEME_DIR, "BrandVisualTheme.json");
const OUT_DIR = path.join(THEME_DIR, "publish");
const OUT_FILE = path.join(OUT_DIR, `${THEME_NAME}.html`);

// 简写顺序门禁：与主程序内联器 SHORTHAND_FAMILIES 权威表同源，防止「简写覆盖其前长属性」
const { findShorthandIssues } = require("./scan-shorthand.cjs");

// 主程序依赖：模板填充 + 全内联器
const { fillTemplate } = require(path.join(CORE_DIST, "plugins/component/templateFiller.js"));
const { processHtml } = require(path.join(CORE_DIST, "ThemeProcessor.js"));

function load() {
  if (!fs.existsSync(CSS_FILE)) {
    console.error(`❌ 未找到 CSS: ${CSS_FILE}`);
    process.exit(1);
  }
  if (!fs.existsSync(TEMPLATES_FILE)) {
    console.error(`❌ 未找到骨架模板: ${TEMPLATES_FILE}`);
    process.exit(1);
  }
  const css = fs.readFileSync(CSS_FILE, "utf-8");
  const templates = JSON.parse(fs.readFileSync(TEMPLATES_FILE, "utf-8"));
  const theme = JSON.parse(fs.readFileSync(THEME_JSON, "utf-8"));
  return { css, templates, theme };
}

// ============================================================
// 示例 Slot 数据（与 compile-preview 保持一致，构成一篇示例文章）
// ============================================================
function buildSampleData(theme) {
  const brandName =
    theme.brand?.brand_identity?.name || theme.brand?.name || THEME_NAME;
  return {
    "magazine-cover": {
      title: "研发费用加计扣除 · 专项备查资料",
      subtitle: "TAX COMPLIANCE ARCHIVE",
      divider: "",
      desc:
        "依据《国家税务总局公告》要求，按年度归集研发项目立项、人员工时、费用支出等凭证，形成经得起核查的完整档案链。",
    },
    "brand-sign": {
      brandName,
      tagline: "财税合规 · 守护企业行稳致远",
      slogan: "严谨建档 · 留痕可溯 · 核查无忧",
      divider: "",
      subText: "苍洱会计师事务所 · 税务法律咨询",
    },
    "section-title": {
      body: "第一章 · 立项决议与项目界定",
    },
    "numbered-heading": {
      body: "一、研发项目立项备案",
    },
    "resource-list": {
      title: "备查资料 · 核查清单",
      subtitle: "逐项核对，缺一不可",
      items: [
        {
          label: "01",
          title: "立项决议文件",
          desc: "董事会/股东会关于研发项目的立项决议及会议纪要",
          meta: "归集期：2025 年度",
          tag: "必查",
        },
        {
          label: "02",
          title: "研发人员工时表",
          desc: "研发人员考勤与工时分配记录，能否清晰界定研发工时占比",
          meta: "归集期：2025 年度",
          tag: "必查",
        },
        {
          label: "03",
          title: "费用支出凭证",
          desc: "符合规定的发票、银行回单，与研发费用台账一一对应",
          meta: "归集期：2025 年度",
          tag: "抽查",
        },
      ],
    },
    "styled-table": {
      table:
        "<table><thead><tr><th>费用项目</th><th>金额（万元）</th><th>占比</th></tr></thead><tbody><tr><td>人员人工</td><td>86.5</td><td>58%</td></tr><tr><td>直接投入</td><td>42.0</td><td>28%</td></tr><tr><td>折旧摊销</td><td>12.8</td><td>9%</td></tr><tr><td>其他费用</td><td>7.5</td><td>5%</td></tr></tbody></table>",
    },
  };
}

// ============================================================
// 组装组件 HTML + 全内联
// ============================================================
/**
 * 发布产物自检（Render Snapshot 的前置静态断言）
 *
 * 公众号对相对单位 / 浏览器特定特性支持不可靠，产物中一旦出现即属缺陷：
 *  - rem：根字体不可控，间距/字号随根字体缩放 → 应已在主程序 processHtml 内全部转 px
 *  - var(...)：变量未展开会残留，微信不支持
 *  - ::before/::after 伪元素：微信无法正确渲染，需已物化为真实元素
 * 命中即清单列示并 halt，避免问题被打包进 publish 产物。
 */
function assertPublishSafe(html) {
  const issues = [];
  const remMatch = html.match(/(\d+(?:\.\d+)?)\s*rem\b/g);
  if (remMatch) issues.push(`残留 rem 单位 ${remMatch.length} 处：${remMatch.slice(0, 8).join(", ")}${remMatch.length > 8 ? " …" : ""}`);
  const varMatch = html.match(/var\(--[\w-]+\)/g);
  if (varMatch) issues.push(`残留未展开 CSS 变量 ${varMatch.length} 处：${varMatch.slice(0, 8).join(", ")}${varMatch.length > 8 ? " …" : ""}`);
  const pseudoMatch = html.match(/::(before|after)/g);
  if (pseudoMatch) issues.push(`残留伪元素 ${pseudoMatch.length} 处：未物化，微信无法渲染`);
  // 简写顺序门禁：简写不得出现在其同族长属性之后（否则覆盖长属性导致视觉/间距丢失）
  const { scanned, problems } = findShorthandIssues(html);
  if (problems.length > 0) {
    issues.push(
      `简写覆盖其前长属性 ${problems.length} 处（扫描 ${scanned} 个 style）：` +
        problems
          .slice(0, 5)
          .map((p) => `<${p.tag}>·${p.family}`)
          .join(", ") + (problems.length > 5 ? " …" : ""),
    );
  }
  return issues;
}

function renderComponentHtml({ templates, theme }) {
  const sample = buildSampleData(theme);
  const anchors = theme.component_strategy?.brand_anchor || [];
  const anchorIds = anchors.length
    ? anchors.map((a) => a.component)
    : Object.keys(templates);

  // 组件之间用 Stack 间距分隔（微信单列流式布局）
  const parts = [];
  for (const id of anchorIds) {
    if (!templates[id] || !sample[id]) continue;
    const filled = fillTemplate(templates[id], sample[id]);
    parts.push(filled);
  }
  return parts.join("\n");
}

const { css, templates, theme } = load();
const componentHtml = renderComponentHtml({ templates, theme });

// processHtml 会自行包裹 <section id="wemd">，并做全内联 + 微信兼容处理
// rem→px 已在主程序 processHtml 内统一完成（buildWechatPublishHtml 共用同一条链路）
const inlined = processHtml(componentHtml, css, true, true);

const issues = assertPublishSafe(inlined);
if (issues.length > 0) {
  console.error(`\n🚫 发布产物自检未通过（${THEME_NAME}）：`);
  for (const i of issues) console.error(`   - ${i}`);
  process.exit(1);
}

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(OUT_FILE, inlined, "utf-8");
console.log(`✅ 公众号发布 HTML 已生成：${OUT_FILE}`);
console.log(`   字符数：${inlined.length}`);
console.log("   ✅ 发布产物自检通过（无 rem / 无未展开 var / 无伪元素残留）");