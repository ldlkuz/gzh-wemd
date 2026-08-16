/**
 * compile-preview.cjs — Compiler 子阶段 A：开发预览 HTML 生成器
 *
 * 读取编译产物（css/{theme}.css + package/templates.json + BrandVisualTheme.json），
 * 用主程序 fillTemplate 填充骨架模板，生成带 <style> 标签的预览 HTML。
 *
 * 用法：node scripts/compile-preview.cjs <theme-name>
 *   输出：themes/{theme-name}/preview/{theme-name}-preview.html
 */
const fs = require("fs");
const path = require("path");

const SKILL_ROOT = path.resolve(__dirname, "..");
const CORE_DIST = path.resolve(SKILL_ROOT, "../../packages/core/dist");

const THEME_NAME = process.argv[2] || "";
if (!THEME_NAME) {
  console.error("❌ 请指定主题名：node scripts/compile-preview.cjs <theme-name>");
  process.exit(1);
}

const THEME_DIR = path.join(SKILL_ROOT, "themes", THEME_NAME);
const CSS_FILE = path.join(THEME_DIR, "css", `${THEME_NAME}.css`);
const TEMPLATES_FILE = path.join(THEME_DIR, "package", "templates.json");
const THEME_JSON = path.join(THEME_DIR, "BrandVisualTheme.json");
const OUT_DIR = path.join(THEME_DIR, "preview");
const OUT_FILE = path.join(OUT_DIR, `${THEME_NAME}-preview.html`);

// 主程序模板填充器（真源，与主程序渲染一致）
const { fillTemplate } = require(path.join(CORE_DIST, "plugins/component/templateFiller.js"));

function load() {
  if (!fs.existsSync(CSS_FILE)) {
    console.error(`❌ 未找到 CSS: ${CSS_FILE}`);
    console.error("   请先完成 CSS 编译（css/{theme}.css）。");
    process.exit(1);
  }
  if (!fs.existsSync(TEMPLATES_FILE)) {
    console.error(`❌ 未找到骨架模板: ${TEMPLATES_FILE}`);
    console.error("   请先运行 node scripts/compile-skeleton.cjs <theme>");
    process.exit(1);
  }
  const css = fs.readFileSync(CSS_FILE, "utf-8");
  const templates = JSON.parse(fs.readFileSync(TEMPLATES_FILE, "utf-8"));
  const theme = JSON.parse(fs.readFileSync(THEME_JSON, "utf-8"));
  return { css, templates, theme };
}

// ============================================================
// 示例 Slot 数据（按主题设计意图填充，用于预览效果）
// ============================================================
function buildSampleData(theme) {
  const brandName =
    theme.brand?.brand_identity?.name || theme.brand?.name || THEME_NAME;
  const concept = theme.concept?.concept_name || "";
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
// 生成预览 HTML
// ============================================================
function generateHtml({ css, templates, theme }) {
  const sample = buildSampleData(theme);
  const abbr = theme.brand?.brand_identity?.name || THEME_NAME;

  // 按 BrandVisualTheme.json 的 brand_anchor 顺序渲染组件
  const anchors = theme.component_strategy?.brand_anchor || [];
  const anchorIds = anchors.length
    ? anchors.map((a) => a.component)
    : Object.keys(templates);

  const sections = [];
  for (const id of anchorIds) {
    if (!templates[id] || !sample[id]) continue;
    const filled = fillTemplate(templates[id], sample[id]);
    sections.push(
      `<div class="preview-item">\n` +
        `<div class="preview-tag">${id}</div>\n` +
        // 主题 CSS 选择器为 #wemd .wemd-xxx，必须用 id="wemd" 容器包裹组件
        `<div class="preview-body"><div id="wemd">${filled}</div></div>\n` +
        `</div>`,
    );
  }

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${abbr} · ${THEME_NAME} 主题预览</title>
<style>
  /* ===== 预览页外壳（仅用于开发预览，不进主题包） ===== */
  * { box-sizing: border-box; }
  body {
    margin: 0;
    padding: 32px 16px;
    background: #f4f1ea;
    font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif;
    color: #333;
  }
  .preview-shell {
    max-width: 420px;
    margin: 0 auto;
  }
  .preview-head {
    text-align: center;
    margin-bottom: 28px;
  }
  .preview-head h1 {
    font-size: 20px;
    margin: 0 0 6px;
    color: #2b2b2b;
  }
  .preview-head p {
    margin: 0;
    font-size: 13px;
    color: #888;
  }
  .preview-item {
    margin-bottom: 24px;
    border-radius: 8px;
    overflow: hidden;
    background: #fff;
    box-shadow: 0 1px 4px rgba(0,0,0,0.08);
  }
  .preview-tag {
    padding: 6px 12px;
    font-size: 11px;
    font-family: "SF Mono", Consolas, monospace;
    color: #6b5b4e;
    background: #f3ebda;
    border-bottom: 1px solid #e5dac6;
  }
  .preview-body #wemd, .preview-body [id="wemd"] {
    /* 预览容器无需额外样式，直接使用主题 CSS */
  }
  /* 内联主题 CSS（编译产物） */
${css.replace(/^/gm, "  ")}
</style>
</head>
<body>
  <div class="preview-shell">
    <div class="preview-head">
      <h1>${abbr}</h1>
      <p>${THEME_NAME} · Compiler 开发预览</p>
    </div>
    ${sections.join("\n    ")}
  </div>
</body>
</html>
`;
}

const { css, templates, theme } = load();
const html = generateHtml({ css, templates, theme });
fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(OUT_FILE, html, "utf-8");
const count = (html.match(/preview-item/g) || []).length;
console.log(`✅ 预览 HTML 已生成：${OUT_FILE}`);
console.log(`   （含 ${count} 个组件骨架预览）`);