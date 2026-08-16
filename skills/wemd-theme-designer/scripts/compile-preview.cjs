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
  const type = theme.brand?.brand_identity?.type || "enterprise";
  const concept = theme.concept?.concept_name || "";

  // 依品牌类型生成贴合主题的示例内容（游戏/创作者 vs 企业）
  if (type === "creator") {
    return {
      "magazine-cover": {
        title: `${brandName} · 独立游戏开发日志`,
        subtitle: "PIXEL ARCADE DEV LOG",
        divider: "",
        desc:
          "用像素格纸记录每一帧的打磨：从精灵表、调色板到关卡设计，把硬核极客的匠心一点点攒成可玩的冒险世界。",
      },
      "brand-sign": {
        brandName,
        tagline: "像素 · 执念 · 手作",
        slogan: "把每一帧像素，焠成好玩的冒险",
        divider: "",
        subText: "独立游戏开发者 · 复古玩家同好",
      },
      "section-title": {
        body: "第一章 · 从像素种子到可玩世界",
      },
      "numbered-heading": {
        body: "一、精灵表的诞生",
      },
      "resource-list": {
        title: "工坊素材 · 清单",
        subtitle: "逐项打磨，缺一不可",
        items: [
          {
            label: "01",
            title: "精灵表（Sprite Sheet）",
            desc: "主角 4 方向 8 帧奔跑拆帧，统一 16×16 像素格",
            meta: "素材：2026 制作中",
            tag: "核心",
          },
          {
            label: "02",
            title: "调色板（Palette）",
            desc: "限定 16 色暖色系，保证不同场景的视觉一致性",
            meta: "素材：2026 制作中",
            tag: "核心",
          },
          {
            label: "03",
            title: "手柄键位映射",
            desc: "摇杆 + 跳跃 + 交互，匹配复古街机的手感",
            meta: "素材：2026 制作中",
            tag: "调试",
          },
        ],
      },
      "styled-table": {
        table:
          "<table><thead><tr><th>素材</th><th>像素规格</th><th>状态</th></tr></thead><tbody><tr><td>主角精灵</td><td>16×16</td><td>完成</td></tr><tr><td>敌人系列</td><td>16×16</td><td>制作中</td></tr><tr><td>关卡砖块</td><td>32×32</td><td>完成</td></tr><tr><td>UI 图标</td><td>8×8</td><td>待做</td></tr></tbody></table>",
      },
      "image-grid": {
        body:
          '<img src="assets/sprite-hero.jpg" alt="主角精灵" title="主角精灵 16×16" />' +
          '<img src="assets/sprite-slime.jpg" alt="史莱姆" title="史莱姆 16×16" />' +
          '<img src="assets/sprite-sword.jpg" alt="像素剑" title="像素剑 16×16" />' +
          '<img src="assets/sprite-tile.jpg" alt="草地砖块" title="草地砖块 32×32" />',
      },
      "hero-banner": {
        image:
          '<img class="wemd-hb-image" src="assets/sprite-hero.jpg" alt="像素主角" title="像素主角 16×16" />',
        title: "欢迎来到像素工坊",
        subtitle: "PIXEL CRAFTSMANSHIP · 把每一帧像素焠成好玩",
      },
      "product-card": {
        image:
          '<img class="wemd-pc-image" src="assets/sprite-sword.jpg" alt="像素剑" title="像素剑 16×16" />',
        badge: "限定",
        title: "像素勇者之剑",
        subtitle: "16×16 手工打磨",
        description: "四方向八帧拆解，调色板限定 16 色暖色系，硬核像素玩家的随身装备。",
        price: "¥ 128",
        originalPrice: "¥ 168",
        button: "立即拥有",
        tags: [
          { body: "像素" },
          { body: "手作" },
          { body: "限定" },
        ],
      },
      "cta-card": {
        title: "加入玩家族群",
        body: "在像素工坊认领第一件装备，和 1000+ 复古玩家一起打磨冒险。",
        action: "马上出发",
      },
      "quote-card": {
        quote: "像素不是像素点的堆砌，而是匠人对每一帧的执念。",
        author: "—— 工坊匠人札记",
      },
      "testimonial-card": {
        quote: "在这里买到的不只是道具，更是一段能回味的像素冒险。",
        source: "· 社区好评",
        avatar:
          '<img src="assets/sprite-slime.jpg" alt="玩家头像" title="玩家头像" />',
        name: "复古玩家·阿瓦",
        title: "像素同好",
        company: "工坊社区成员",
      },
      "full-quote": {
        text: "把硬核极客的匠心，一点点攒成可玩的冒险世界。",
      },
      "end-card": {
        title: "感谢你的像素时光",
        subtitle: "工坊持续开炉 · 下次冒险见",
        deco: "◆ PIXEL ARCADE ◆",
      },
      "callout-pro": {
        body: "提示：调色板仅限 16 色，超出将导致场景视觉不一致。",
      },
      "stats-block": {
        items: [
          { value: "16", label: "像素格" },
          { value: "4", label: "方向帧" },
          { value: "1000+", label: "同好玩家" },
          { value: "8", label: "关卡" },
        ],
      },
      "share-card": {
        body: "喜欢这期像素工坊日志？分享给同好，一起点亮复古街机的心火。",
      },
      "image-text-row": {
        body:
          '<img src="assets/sprite-tile.jpg" alt="草地砖块" title="草地砖块 32×32" />' +
          "<p>像素砖块是关卡的地基：统一 32×32 规格，保证不同场景的像素密度一致，让每一块都经得起放大细看。</p>",
      },
      "image-compare": {
        body:
          '<img src="assets/sprite-hero.jpg" alt="改版前" title="改版前" />' +
          '<img src="assets/sprite-slime.jpg" alt="改版后" title="改版后" />',
      },
    };
  }

  // 默认（企业/财税，cangre-audit 示例）
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
// 预览页辅助：从主题 CSS 提取设计资产
// ============================================================
function extractThemeVars(css) {
  const vars = {};
  const m = css.match(/#wemd\s*\{([^}]+)\}/);
  if (!m) return vars;
  const re = /--([\w-]+)\s*:\s*([^;]+);/g;
  let match;
  while ((match = re.exec(m[1])) !== null) {
    vars[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, "");
  }
  return vars;
}

function buildSwatches(vars) {
  const groups = [
    { name: "背景 · Background", keys: ["wemd-bg-base", "wemd-bg-surface", "wemd-bg-card"] },
    { name: "强调 · Accent", keys: ["wemd-accent-primary", "wemd-accent-secondary", "wemd-accent-tertiary"] },
    { name: "文字 · Text", keys: ["wemd-text-strong", "wemd-text-normal", "wemd-text-soft"] },
    { name: "边框 · Border", keys: ["wemd-border", "wemd-border-strong"] },
  ];
  return groups
    .map((g) => {
      const items = g.keys.filter((k) => vars[k]).map((k) => {
        const name = k.replace("wemd-", "").replace("-", "·");
        return `<div class="sw"><span class="sw-chip" style="background:${vars[k]}"></span><span class="sw-name">${name}</span><code class="sw-hex">${vars[k]}</code></div>`;
      }).join("");
      return `<div class="sw-group"><div class="sw-group-name">${g.name}</div><div class="sw-list">${items}</div></div>`;
    })
    .join("");
}

function designNote(theme, id) {
  const d = theme.components?.focal?.[id]?.design;
  return d ? d.role : "";
}

// ============================================================
// 生成预览 HTML（主题设计工作台）
// ============================================================
function generateHtml({ css, templates, theme }) {
  const sample = buildSampleData(theme);
  const brandName =
    theme.brand?.brand_identity?.name || theme.brand?.name || THEME_NAME;
  const conceptName = theme.concept?.concept_name || "";
  const metaphorName = theme.concept?.visual_metaphor?.metaphor_name || "";
  const coreConcept = theme.concept?.core_concept || "";
  const keywords = (theme.brand?.keywords || []).slice(0, 6);
  const personality = (theme.brand?.personality || []).slice(0, 6);
  const vars = extractThemeVars(css);
  const swatches = buildSwatches(vars);
  const fontSample = vars["wemd-font-heading"] || "monospace";

  // 按 brand_anchor 顺序渲染焦点组件（含模板 + 示例数据）
  const anchors = theme.component_strategy?.brand_anchor || [];
  const anchorIds = anchors.length
    ? anchors.map((a) => a.component)
    : Object.keys(templates);

  const focalSections = [];
  for (const id of anchorIds) {
    if (!templates[id] || !sample[id]) continue;
    const filled = fillTemplate(templates[id], sample[id]);
    const note = designNote(theme, id);
    focalSections.push(
      `<article class="comp">\n` +
        `  <header class="comp-head">\n` +
        `    <span class="tier tier-focal">FOCAL</span>\n` +
        `    <h3 class="comp-id">${id}</h3>\n` +
        `  </header>\n` +
        (note ? `  <p class="comp-note">${note}</p>\n` : "") +
        `  <div class="comp-body"><div id="wemd">${filled}</div></div>\n` +
        `</article>`,
    );
  }

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${brandName} · ${THEME_NAME} 主题设计工作台</title>
<style>
  /* ===== 工作台外壳（仅开发预览，不进主题包） ===== */
  * { box-sizing: border-box; }
  body {
    margin: 0;
    background: #17171c;
    color: #e8e6e1;
    font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif;
    -webkit-font-smoothing: antialiased;
  }
  .wb {
    max-width: 1180px;
    margin: 0 auto;
    padding: 28px 24px 64px;
  }
  /* 顶栏 */
  .wb-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding-bottom: 20px;
    border-bottom: 1px solid #2c2c34;
    margin-bottom: 24px;
  }
  .wb-brand {
    display: flex;
    align-items: center;
    gap: 14px;
  }
  .wb-logo {
    width: 40px; height: 40px;
    border-radius: 10px;
    background: linear-gradient(135deg, var(--pk-primary,#e8590c), var(--pk-sec,#0b7285));
    display: grid; place-items: center;
    font-weight: 900; color: #fff; font-size: 18px;
  }
  .wb-brand h1 { margin: 0; font-size: 18px; letter-spacing: 0.02em; }
  .wb-brand p { margin: 2px 0 0; font-size: 12px; color: #8b8b96; }
  .wb-meta { text-align: right; font-size: 12px; color: #8b8b96; }

  /* 布局：左设计资产 + 右手机预览 */
  .wb-grid {
    display: grid;
    grid-template-columns: 340px 1fr;
    gap: 24px;
    align-items: start;
  }
  /* 左侧面板 */
  .panel {
    position: sticky;
    top: 20px;
    background: #1f1f26;
    border: 1px solid #2c2c34;
    border-radius: 14px;
    padding: 20px;
  }
  .panel h2 {
    margin: 0 0 4px;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.12em;
    color: #9898a3;
    text-transform: uppercase;
  }
  .panel .sub { margin: 0 0 16px; font-size: 13px; color: #cfcdc6; line-height: 1.6; }
  .panel-sec { margin-bottom: 22px; }
  .panel-sec:last-child { margin-bottom: 0; }
  .tag-row { display: flex; flex-wrap: wrap; gap: 6px; }
  .tag {
    font-size: 11px;
    padding: 3px 9px;
    border-radius: 20px;
    background: #2a2a33;
    color: #b9b7c0;
    border: 1px solid #34343e;
  }
  /* 色板 */
  .sw-group { margin-bottom: 12px; }
  .sw-group:last-child { margin-bottom: 0; }
  .sw-group-name { font-size: 11px; color: #8b8b96; margin-bottom: 6px; }
  .sw-list { display: grid; grid-template-columns: 1fr; gap: 6px; }
  .sw { display: flex; align-items: center; gap: 8px; }
  .sw-chip { width: 22px; height: 22px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.12); flex: 0 0 auto; }
  .sw-name { font-size: 11px; color: #cfcdc6; flex: 1; }
  .sw-hex { font-size: 10px; color: #777783; font-family: "SF Mono", Consolas, monospace; }
  /* 字体预览 */
  .font-preview { font-size: 15px; line-height: 1.7; color: #e8e6e1; padding: 10px; background: #17171c; border-radius: 8px; }
  .font-preview .fn { display: block; font-size: 10px; color: #777783; margin-bottom: 4px; font-family: -apple-system, sans-serif; }

  /* 右侧手机预览 */
  .phone {
    background: #0d0d11;
    border: 1px solid #2c2c34;
    border-radius: 26px;
    padding: 12px;
    box-shadow: 0 20px 60px rgba(0,0,0,0.5);
  }
  .phone-notch {
    width: 120px; height: 22px; margin: 0 auto 10px;
    background: #17171c; border-radius: 20px;
  }
  .phone-screen {
    max-width: 420px;
    margin: 0 auto;
    background: #f5efe0;
    border-radius: 14px;
    overflow: hidden;
  }
  .article-head {
    padding: 18px 16px 14px;
    background: #f5efe0;
    border-bottom: 1px solid #e4dcc8;
  }
  .article-head .a-brand { font-size: 11px; letter-spacing: 0.15em; color: #9a8f7d; text-transform: uppercase; }
  .article-head .a-title { font-size: 17px; font-weight: 800; color: #2b2420; margin-top: 4px; line-height: 1.4; }
  .article-head .a-meta { display: flex; gap: 8px; margin-top: 8px; }
  .article-flow { padding: 14px 10px 24px; }
  .article-flow > #wemd { padding: 0 calc(10px); }
  .comp {
    margin-bottom: 18px;
    background: #24242c;
    border: 1px solid #34343e;
    border-radius: 12px;
    overflow: hidden;
  }
  .comp-head {
    display: flex; align-items: center; gap: 8px;
    padding: 8px 12px;
    background: #1b1b21;
    border-bottom: 1px solid #2c2c34;
  }
  .tier {
    font-size: 9px; font-weight: 800; letter-spacing: 0.1em;
    padding: 2px 7px; border-radius: 4px;
  }
  .tier-focal { background: #e8590c; color: #fff; }
  .tier-content { background: #0b7285; color: #fff; }
  .tier-utility { background: #2a2a33; color: #b9b7c0; }
  .comp-id { margin: 0; font-size: 12px; font-family: "SF Mono", Consolas, monospace; color: #cfcdc6; }
  .comp-note { margin: 0; padding: 8px 12px; font-size: 11px; color: #8b8b96; line-height: 1.5; border-bottom: 1px dashed #34343e; }
  .comp-body { background: #f5efe0; }
  .comp-body #wemd, .comp-body [id="wemd"] { padding: 0 10px; }
  .empty-tip { color: #777783; font-size: 12px; padding: 20px; text-align: center; }

  /* 响应式 */
  @media (max-width: 900px) {
    .wb-grid { grid-template-columns: 1fr; }
    .panel { position: static; }
  }
  /* 内联主题 CSS（编译产物） */
${css.replace(/^/gm, "  ")}
</style>
</head>
<body>
  <div class="wb">
    <header class="wb-top">
      <div class="wb-brand">
        <div class="wb-logo">像</div>
        <div>
          <h1>${brandName}</h1>
          <p>${THEME_NAME} · ${conceptName}</p>
        </div>
      </div>
      <div class="wb-meta">母题：${metaphorName}</div>
    </header>

    <div class="wb-grid">
      <!-- 左：设计资产 -->
      <aside class="panel">
        <section class="panel-sec">
          <h2>概念母题</h2>
          <p class="sub">${coreConcept}</p>
          <div class="tag-row">
            ${keywords.map((k) => `<span class="tag">${k}</span>`).join("")}
          </div>
          <div class="tag-row" style="margin-top:8px">
            ${personality.map((p) => `<span class="tag">${p}</span>`).join("")}
          </div>
        </section>
        <section class="panel-sec">
          <h2>色彩 · Color</h2>
          <div style="margin-top:10px">${swatches}</div>
        </section>
        <section class="panel-sec">
          <h2>字体 · Typography</h2>
          <div class="font-preview" style="font-family:${fontSample}">
            <span class="fn">HEADING / 标题</span>
            Pixel 工房 Abc 012
          </div>
        </section>
      </aside>

      <!-- 右：手机预览 -->
      <main class="phone">
        <div class="phone-notch"></div>
        <div class="phone-screen">
          <div class="article-head">
            <div class="a-brand">${brandName}</div>
            <div class="a-title">${coreConcept.slice(0, 26)}…</div>
            <div class="a-meta">
              <span class="tag" style="background:#e8e0cc;color:#6b5b4e;border-color:#dccfb4">FOCAL × ${focalSections.length}</span>
            </div>
          </div>
          <div class="article-flow">
            ${focalSections.length ? focalSections.join("\n") : `<div class="empty-tip">暂无渲染组件骨架</div>`}
          </div>
        </div>
      </main>
    </div>
  </div>
</body>
</html>
`;
}

const { css, templates, theme } = load();
const html = generateHtml({ css, templates, theme });
fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(OUT_FILE, html, "utf-8");
const count = (html.match(/class="comp-head"/g) || []).length;
console.log(`✅ 预览 HTML 已生成：${OUT_FILE}`);
console.log(`   （含 ${count} 个焦点组件骨架预览）`);