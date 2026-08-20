/**
 * 东方笺谱 · 主题皮肤（全局皮肤覆盖 + 组件级差异化）
 *
 * 设计语言：一封信 —— 宣纸为底、宋体为骨、朱砂印为魂。
 * 12 套主题共用一套组件骨架，差异化全靠本文件的颜色 / 字体 / 装饰表达。
 *
 * 多色拼接：朱砂 #a33a2b · 黛蓝 #3d5a63 · 赭石 #8a5a33 · 墨 #2b2622
 *
 * 微信约束：
 * - 卡片结构用真实 border / background 表达（不依赖 absolute 拉伸）。
 * - 组件装饰尽量物化到骨架已有真实元素（wemd-df-line / wemd-df-dots /
 *   wemd-qc-quote / wemd-tl-dot 等）。
 * - 标题菱形 / 引号等由共享物化器（pseudoElementInline）按本文件 CSS
 *   读取并内联到 <span class="wemd-mat">，导出与预览一致。
 */

export const componentStylesEasternNotes = `/* === 东方笺谱：一封信 · 全局皮肤 === */

/* 全局：宋体 + 墨色 + 宣纸底纹。
   约束：项目禁在 #wemd 写 background-color（微信编辑器设底色），
   故纸感用「多层极淡线性/放射渐变」合成纤维纹理，纯 background-image，不写 background-color。 */
#wemd {
  color: #36322f;
  font-family: "Songti SC", "STSong", "Noto Serif CJK SC", "Source Han Serif SC", SimSun, serif;
  font-size: 17px;
  line-height: 2.06;
  letter-spacing: 0.045em;
  background-image:
    radial-gradient(120% 90% at 50% 0%, rgba(255, 252, 244, 0.5) 0%, rgba(255, 252, 244, 0) 60%),
    repeating-linear-gradient(0deg, rgba(120, 100, 70, 0.018) 0 2px, rgba(120, 100, 70, 0) 2px 5px),
    repeating-linear-gradient(90deg, rgba(120, 100, 70, 0.014) 0 3px, rgba(120, 100, 70, 0) 3px 7px);
}

/* 正文 */
#wemd p {
  margin: 0 0 29px;
  color: #36322f;
  font-size: 17px;
  line-height: 2.06;
  text-align: justify;
}

/* ---- 标题 ---- */
#wemd h1 {
  text-align: center;
  border-bottom: none;
}
#wemd h1 .content {
  display: inline-block;
  color: #2b2622;
  font-size: 32px;
  font-weight: 700;
  line-height: 1.5;
  letter-spacing: 0.16em;
  border-bottom: 2px solid #a33a2b;
  padding-bottom: 10px;
  text-wrap: balance;
}

/* h2：居中（从左到右排版的章节标题，不设顶部装饰点） */
#wemd h2 {
  margin: 58px 0 30px;
  padding: 0 8px 0 0;
  border: none;
  text-align: center;
}
#wemd h2 .content {
  color: #a33a2b;
  font-size: 21px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-wrap: balance;
}

/* 章节标题组件（## 标题）——去掉共享 left-border 卡片皮肤，统一居中 */
#wemd .wemd-section-title {
  /* 去掉共享 left-border 卡片皮肤，保留组件外部间距（margin 由共享提供） */
  padding: 0;
  background: transparent;
  border-left: none;
  border-radius: 0;
}
#wemd .wemd-section-title .wemd-component-body > h2 {
  margin-top: 40px;
  margin-right: 0;
  margin-bottom: 26px;
  margin-left: 0;
  padding-top: 0;
  padding-right: 8px;
  padding-bottom: 0;
  padding-left: 0;
  border-top: none;
  border-right: none;
  border-bottom: none;
  border-left: none;
  font-size: 22px;
  font-weight: 700;
  color: #a33a2b;
  letter-spacing: 0.12em;
  text-align: center;
}

/* h3：居中 + 朱砂 */
#wemd h3 {
  margin: 40px 0 21px;
  padding: 0;
  border: none;
  text-align: center;
}
#wemd h3 .content {
  color: #a33a2b;
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-wrap: balance;
}

#wemd h4 {
  margin: 29px 0 14px;
  padding: 0;
  border: none;
}
#wemd h4 .content {
  color: #514841;
  font-size: 16px;
  font-weight: 700;
}

/* ---- 行内强调 ---- */
#wemd strong {
  color: #2b2622;
  font-weight: 700;
  text-decoration: underline;
  text-decoration-color: #d9aaa2;
  text-decoration-thickness: 2px;
  text-underline-offset: 0.18em;
}
#wemd em {
  font-style: normal;
  color: #8a5a33;
  font-weight: 600;
}
#wemd mark {
  padding: 1px 4px;
  color: #4f2822;
  background: #f2e4de;
}
#wemd a {
  color: #8c3025;
  font-weight: 600;
  text-decoration: underline;
  text-decoration-color: #c99087;
  text-underline-offset: 0.22em;
}

/* ---- 引用 ---- */
#wemd blockquote { border: none; }

#wemd .multiquote-1,
#wemd .multiquote-2,
#wemd .multiquote-3 {
  margin: 46px 8px;
  padding: 8px 24px;
  border: none;
  background: transparent;
}
/* 引号装饰由 pullquote 的物化引号承载，此处不再用 ::before（微信导出剥伪元素） */
#wemd .multiquote-1 p,
#wemd .multiquote-2 p,
#wemd .multiquote-3 p {
  margin: 0;
  color: #564c45;
  font-size: 18px;
  line-height: 2;
  text-align: center;
}
#wemd .multiquote-2,
#wemd .multiquote-3,
#wemd .multiquote-1 .multiquote-1 {
  margin: 12px 0 0;
  padding: 8px 0 0;
  border: none;
}

/* ---- 列表 ---- */
#wemd ul,
#wemd ol {
  margin: 22px 0 28px;
  padding-left: 25px;
  color: #a33a2b;
}
#wemd li section {
  margin: 7px 0;
  color: #36322f;
  line-height: 1.88;
}
#wemd ol > li > section {
  padding: 3px 0 9px;
  border-bottom: 1px dotted #bfb4aa;
  background: transparent;
}

/* ---- 表格 ---- */
#wemd .table-container { margin: 34px 0; overflow-x: auto; }
#wemd table {
  width: 100%;
  border-collapse: collapse;
  color: #3d3732;
  background: #faf6f0;
  text-align: left;
}
#wemd table tr th,
#wemd table tr td {
  min-width: 88px;
  padding: 11px 10px;
  border: none;
  border-bottom: 1px solid #cfc6be;
  font-size: 14px;
  line-height: 1.65;
}
#wemd table tr th {
  border-top: 1px solid #5a4e46;
  border-bottom: 2px solid #5a4e46;
  color: #a33a2b;
  background: transparent;
  font-weight: 700;
}
#wemd table tr:nth-child(2n) { background: #efe8da; }

/* ---- 代码 ---- */
#wemd p code,
#wemd li code {
  padding: 2px 6px;
  border: 1px solid #d4cbc3;
  color: #8c3025;
  background: #f2ede4;
  font-family: "SFMono-Regular", Consolas, monospace;
  font-size: 13px;
}
#wemd pre {
  margin: 32px 0;
  border: 1px solid #403a35;
  border-top: 5px solid #a33a2b;
  background: #2e2a27;
  overflow-x: auto;
}
#wemd pre code,
#wemd pre code.hljs {
  display: block;
  min-width: max-content;
  padding: 20px;
  color: #f0ece7;
  background: #2e2a27;
  font-family: "SFMono-Regular", Consolas, monospace;
  font-size: 13px;
  line-height: 1.72;
  white-space: pre;
}

/* ---- 图片 / 图注 ---- */
#wemd figure { margin: 48px 0 54px; break-inside: avoid; }
#wemd img { display: block; max-width: 100%; height: auto; margin: 0 auto; }
#wemd figcaption {
  margin-top: 12px;
  color: #9c9186;
  font-size: 12px;
  line-height: 1.8;
  letter-spacing: 0.08em;
  text-align: right;
}

/* ---- 原生 hr（一般已被 divider 组件接管，兜底原生分隔） ---- */
#wemd hr {
  width: 8px;
  height: 8px;
  margin: 64px auto;
  border: none;
  background: #a33a2b;
}

/* ---- 脚注 / 公式 ---- */
#wemd .footnote-word,
#wemd .footnote-ref { color: #a33a2b; font-weight: 700; }
#wemd .footnotes-sep {
  margin-top: 52px;
  padding-top: 18px;
  border-top: 4px double #4c4640;
}
#wemd .footnote-num { width: 30px; flex-shrink: 0; color: #a33a2b; }
#wemd .footnote-item p { margin: 0; color: #746860; font-size: 13px; text-align: left; }
#wemd .block-equation {
  display: block;
  margin: 32px 0;
  padding: 19px 10px;
  border-top: 1px solid #cfc6be;
  border-bottom: 1px solid #cfc6be;
  text-align: center;
  overflow-x: auto;
}
#wemd .block-equation > svg { max-width: 300% !important; }
#wemd .inline-equation > svg { vertical-align: middle; }

/* ============================================================
   组件级差异化（覆盖共享组件样式，全部用真实元素 / 边框表达）
   ============================================================ */

/* === divider-fancy · 左右线 + 朱砂印章 + 字（主题定制骨架 wemd-df-seal） === */
#wemd .wemd-divider-fancy .wemd-df-label {
  font-size: 14px;
  letter-spacing: 0.3em;
  color: #6b6159;
}
#wemd .wemd-divider-fancy .wemd-df-line {
  background: linear-gradient(to right, transparent, #8a5a33 45%, #a33a2b 55%, transparent);
}
#wemd .wemd-divider-fancy .wemd-df-seal {
  margin: 0 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  background: #a33a2b;
  color: #f8eee6;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0;
  border-radius: 50%;
}
#wemd .wemd-divider-fancy .wemd-df-text {
  margin: 0 6px;
  color: #a33a2b;
  letter-spacing: 0.4em;
}
#wemd .wemd-divider-fancy .wemd-df-dots {
  color: #a33a2b;
  font-size: 20px;
  letter-spacing: 10px;
}

/* === divider · 墨线 + 三色块拼接（主题定制骨架 wemd-dv-*） ===
   装饰由定制骨架的真实 wemd-dv-line / wemd-dv-dot 承载；
   此处 content:none 仅用于抑制共享 divider 的伪元素侧线，避免预览出现双线。
   它不产生任何视觉（不是依赖伪元素画装饰），微信剥掉伪元素后正好无害。 */
#wemd .wemd-divider .wemd-component-body::before,
#wemd .wemd-divider .wemd-component-body::after {
  content: none !important;
}
#wemd .wemd-divider .wemd-component-body {
  display: flex;
  align-items: center;
}
#wemd .wemd-divider .wemd-dv-line {
  flex: 1;
  height: 1px;
  background: #2b2622;
  opacity: 0.55;
}
#wemd .wemd-divider .wemd-dv-dot {
  width: 10px;
  height: 10px;
  margin: 0 5px;
}
#wemd .wemd-divider .wemd-dv-dot-a { background: #a33a2b; transform: rotate(45deg); }
#wemd .wemd-divider .wemd-dv-dot-b { background: #3d5a63; transform: rotate(45deg); }
#wemd .wemd-divider .wemd-dv-dot-c { background: #8a5a33; border-radius: 50%; }

/* 卡片通用纸纹增强（quote-card / callout-pro / steps / text-card）
   background-image 直接做在容器上，不依赖伪元素，符合微信规范 */

/* === quote-card · 上下朱砂线夹金句 + 两侧黛蓝/赭石侧点（定制骨架 wemd-qc-dot） === */
#wemd .wemd-quote-card {
  padding: 34px 40px;
  border-top: 3px solid #a33a2b;
  border-bottom: 3px solid #a33a2b;
  position: relative;
  background-color: rgba(255, 252, 246, 0.5);
  background-image: repeating-linear-gradient(0deg, rgba(120, 100, 70, 0.03) 0 2px, rgba(120, 100, 70, 0) 2px 6px);
}
#wemd .wemd-quote-card .wemd-qc-dot {
  position: absolute;
  top: 50%;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  transform: translateY(-50%);
}
#wemd .wemd-quote-card .wemd-qc-dot-l { left: 14px; background: #3d5a63; }
#wemd .wemd-quote-card .wemd-qc-dot-r { right: 14px; background: #8a5a33; }
#wemd .wemd-quote-card .wemd-qc-quote {
  font-size: 19px;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: #2b2622;
}
#wemd .wemd-quote-card .wemd-qc-dash {
  color: #a33a2b;
  margin-right: 6px;
  letter-spacing: 0.1em;
}
#wemd .wemd-quote-card .wemd-qc-author {
  margin-top: 18px;
  font-size: 13px;
  letter-spacing: 0.35em;
  color: #9c9186;
}

/* === callout-pro · 左朱砂条 + 顶部徽记 === */
#wemd .wemd-callout-pro {
  border: 1px solid #d8cfc0;
  background-color: rgba(255, 252, 246, 0.62);
  background-image: repeating-linear-gradient(0deg, rgba(120, 100, 70, 0.028) 0 2px, rgba(120, 100, 70, 0) 2px 6px);
  box-shadow: none;
}
#wemd .wemd-callout-pro::before {
  background: #a33a2b;
}
/* 类型变体保持共享语义色，仅修正色条与纸色背景的协调 */
#wemd .wemd-callout-pro[data-type="info"]::before { background: #3d5a63; }
#wemd .wemd-callout-pro[data-type="tip"]::before { background: #8a5a33; }
#wemd .wemd-callout-pro .wemd-component-body > p:first-child {
  color: #2b2622;
}
#wemd .wemd-callout-pro .wemd-component-body > p:first-child strong {
  color: #a33a2b;
}
#wemd .wemd-callout-pro .wemd-component-body > p:first-child::before {
  color: #a33a2b;
}
/* callout 列表项：去掉共享的"•"圆点，改用黛蓝细短竖线分隔（更贴信笺、克制） */
#wemd .wemd-callout-pro .wemd-component-body ul li::before {
  content: "";
  position: absolute;
  left: 4px;
  top: 50%;
  width: 6px;
  height: 1px;
  background: #3d5a63;
  transform: translateY(-50%);
  color: transparent;
}
/* 底部赭石短线（主题定制骨架 wemd-cp-foot，多色拼接点睛）
   从卡片内容内边距开始、只留右下角一小段，避免压到左色条、也不延伸超出 */
#wemd .wemd-callout-pro .wemd-cp-foot {
  position: absolute;
  right: 24px;
  bottom: 0;
  width: 34px;
  height: 3px;
  background: #8a5a33;
}

/* === steps · 朱砂圆序号 + 宣纸卡片 === */
#wemd .wemd-steps {
  border: 1px solid #e7dfcf;
  background-color: rgba(255, 252, 246, 0.45);
  background-image: repeating-linear-gradient(0deg, rgba(120, 100, 70, 0.026) 0 2px, rgba(120, 100, 70, 0) 2px 6px);
}
#wemd .wemd-steps .wemd-component-body > p:first-child {
  color: #2b2622;
}
#wemd .wemd-steps .wemd-component-body li {
  background: rgba(255, 253, 249, 0.85);
  border: 1px solid #e7dfcf;
  border-radius: 0;
}
#wemd .wemd-steps .wemd-component-body li::before {
  background: #a33a2b;
  border-radius: 50%;
  font-weight: 700;
}
#wemd .wemd-steps .wemd-component-body li:nth-child(2n)::before {
  background: #3d5a63;
}

/* === cta-card · 朱砂渐变 + 白字 === */
#wemd .wemd-cta-card {
  background: linear-gradient(160deg, #a33a2b 0%, #7e2d21 100%);
  border-radius: 0;
  color: #f8eee6;
  padding: 38px 30px;
}
#wemd .wemd-cta-card .wemd-cta-seal {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(248, 238, 230, 0.16);
  border: 1px solid rgba(248, 238, 230, 0.5);
  color: #f8eee6;
  font-size: 20px;
  margin-bottom: 12px;
}
#wemd .wemd-cta-card .wemd-cta-title {
  color: #f8eee6;
  letter-spacing: 0.12em;
}
#wemd .wemd-cta-card .wemd-cta-body { color: rgba(248, 238, 230, 0.88); }
#wemd .wemd-cta-card .wemd-cta-action {
  background: rgba(248, 238, 230, 0.16);
  border: 1px solid rgba(248, 238, 230, 0.55);
  border-radius: 999px;
  color: #f8eee6;
  letter-spacing: 0.2em;
}
#wemd .wemd-cta-card .wemd-cta-foot {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 4px;
  display: flex;
}
#wemd .wemd-cta-card .wemd-cta-foot-a { flex: 1; background: #3d5a63; }
#wemd .wemd-cta-card .wemd-cta-foot-b { flex: 1; background: #8a5a33; }

/* === pullquote · 大段引用，左上/右下双色直角装饰线 === */
#wemd .wemd-pullquote {
  position: relative;
  background: rgba(255, 252, 246, 0.32);
  margin-top: 52px;
  margin-bottom: 52px;
  padding: 40px 30px;
  border-radius: 0;
  /* 必须用长属性逐个覆盖共享的 border-left: 5px（简写会被内联归一前置、被长属性覆盖） */
  border-top: none;
  border-right: none;
  border-bottom: none;
  border-left: none;
}
#wemd .wemd-pullquote .wemd-pq-corner {
  position: absolute;
  width: 26px;
  height: 26px;
}
#wemd .wemd-pullquote .wemd-pq-corner-tl {
  left: 0;
  top: 0;
  border-top: 3px solid #3d5a63;
  border-left: 3px solid #3d5a63;
}
#wemd .wemd-pullquote .wemd-pq-corner-br {
  right: 0;
  bottom: 0;
  border-bottom: 3px solid #a33a2b;
  border-right: 3px solid #a33a2b;
}
#wemd .wemd-pullquote .wemd-component-body blockquote p:first-child,
#wemd .wemd-pullquote .wemd-component-body > p:first-child {
  margin: 0;
  font-size: 18px;
  line-height: 2.05;
  color: #564c45;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-align: center;
}
/* 定制为双角线后，抑制共享的 ::before 引号（预览与导出一致：只剩角线） */
#wemd .wemd-pullquote .wemd-component-body blockquote p:first-child::before,
#wemd .wemd-pullquote .wemd-component-body > p:first-child::before {
  content: none;
}
#wemd .wemd-pullquote .wemd-component-body > blockquote {
  margin: 0;
  padding: 0;
  border-top: none;
  border-right: none;
  border-bottom: none;
  border-left: none;
  background: transparent;
  border-radius: 0;
}

/* === section-divider · PART 朱砂 + 大标题墨色 === */
#wemd .wemd-section-divider {
  text-align: center;
}
#wemd .wemd-section-divider .wemd-sd-part {
  color: #a33a2b;
  letter-spacing: 0.5em;
}
#wemd .wemd-section-divider .wemd-sd-title {
  color: #2b2622;
  letter-spacing: 0.2em;
}
#wemd .wemd-section-divider .wemd-sd-line {
  margin: 18px auto 0;
  width: 120px;
  height: 4px;
  display: flex;
}
#wemd .wemd-section-divider .wemd-sd-line-a { width: 60px; background: #a33a2b; }
#wemd .wemd-section-divider .wemd-sd-line-b { width: 60px; background: #3d5a63; }

/* === follow-bar · 墨底关注引导（去按钮化：不伪装可点，纯文字提醒） === */
#wemd .wemd-follow-bar {
  background: #2b2622;
  border-radius: 0;
}
#wemd .wemd-follow-bar .wemd-component-body > p:first-child { color: #f2ece4; }
/* 末段"关注"不再做成按钮：去掉背景/边框/圆角，仅朱砂色文字强调，避免误导可点击 */
#wemd .wemd-follow-bar .wemd-component-body > p:last-child:not(:first-child) {
  background: transparent;
  border: none;
  color: #e0a79b;
  font-weight: 500;
  letter-spacing: 0.2em;
}

/* === styled-table / table · 墨线表头 + 朱砂字 === */
#wemd .wemd-styled-table .wemd-sbt-table table th,
#wemd .wemd-table .wemd-component-body table th {
  background: transparent;
  border-top: 2px solid #5a4e46;
  border-bottom: 2px solid #5a4e46;
  color: #a33a2b;
  letter-spacing: 0.12em;
}
#wemd .wemd-styled-table .wemd-sbt-table table td,
#wemd .wemd-table .wemd-component-body table td {
  border-bottom: 1px solid #cfc6be;
  color: #3d3732;
}

/* === timeline · 朱砂竖线 + 纸心圆点 === */
#wemd .wemd-timeline {
  background-color: rgba(255, 252, 246, 0.5);
  background-image: repeating-linear-gradient(0deg, rgba(120, 100, 70, 0.026) 0 2px, rgba(120, 100, 70, 0) 2px 6px);
  border: 1px solid #e7dfcf;
  border-radius: 0;
}
#wemd .wemd-timeline .wemd-tl-events { border-left: 2px solid #a33a2b; }
#wemd .wemd-timeline .wemd-tl-dot {
  background: #f6f1e8;
  border: 2px solid #a33a2b;
}

/* === magazine-cover · 信笺页头封面（印章 + 标题 + 双色线） === */
#wemd .wemd-magazine-cover {
  background-color: #faf6f0;
  background-image: repeating-linear-gradient(0deg, rgba(120, 100, 70, 0.024) 0 2px, rgba(120, 100, 70, 0) 2px 6px);
  border: 1px solid #e7dfcf;
  border-radius: 0;
  box-shadow: none;
  padding: 40px 30px;
}
#wemd .wemd-magazine-cover .wemd-mc-seal {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: 3px;
  background: #a33a2b;
  color: #f8eee6;
  font-size: 17px;
  font-weight: 700;
  margin-bottom: 14px;
  box-shadow: 0 2px 6px rgba(126, 45, 33, 0.28);
}
#wemd .wemd-magazine-cover .wemd-mc-title {
  margin: 0;
  color: #a33a2b;
  font-size: 30px;
  letter-spacing: 0.2em;
}
#wemd .wemd-magazine-cover .wemd-mc-subtitle {
  margin: 8px 0 0 0;
  color: #9c9186;
  font-size: 12px;
  letter-spacing: 0.34em;
  text-transform: uppercase;
}
#wemd .wemd-magazine-cover .wemd-mc-line {
  margin: 22px auto 0;
  width: 160px;
  height: 4px;
  display: flex;
}
#wemd .wemd-magazine-cover .wemd-mc-line-a { width: 46px; background: #a33a2b; }
#wemd .wemd-magazine-cover .wemd-mc-line-b { flex: 1; background: #2b2622; }
#wemd .wemd-magazine-cover .wemd-mc-desc {
  margin: 22px 0 0 0;
  color: #6b6159;
  font-size: 15px;
  line-height: 2;
}
/* 旧字段兜底：无 line 骨架时保持双色分隔 */
#wemd .wemd-magazine-cover .wemd-mc-divider {
  background: linear-gradient(90deg, #a33a2b, #3d5a63);
}

/* === end-card · 文末落款 === */
#wemd .wemd-end-card .wemd-ec-title { color: #a33a2b; letter-spacing: 0.2em; }
#wemd .wemd-end-card .wemd-ec-subtitle { color: #9c9186; }
#wemd .wemd-end-card .wemd-ec-seal {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-top: 18px;
  width: 46px;
  height: 46px;
  background: #a33a2b;
  color: #f8eee6;
  font-size: 24px;
  font-weight: 700;
  letter-spacing: 0;
  border-radius: 3px;
  box-shadow: 0 2px 6px rgba(126, 45, 33, 0.28);
}

/* === accordion 问答块 · 上下堆叠，微信无折叠 === */
#wemd .wemd-accordion .wemd-component-body > p.wemd-q {
  background: #f2e4de;
  color: #7e2d21;
  border-bottom-color: #e7dfcf;
  border-radius: 0;
}
#wemd .wemd-accordion .wemd-component-body > p.wemd-q + p {
  background-color: rgba(255, 252, 246, 0.6);
  background-image: repeating-linear-gradient(0deg, rgba(120, 100, 70, 0.026) 0 2px, rgba(120, 100, 70, 0) 2px 6px);
  color: #6b6159;
  border-radius: 0;
}

/* === text-card · 宣纸卡片 === */
#wemd .wemd-text-card {
  background-color: rgba(255, 252, 246, 0.5);
  background-image: repeating-linear-gradient(0deg, rgba(120, 100, 70, 0.026) 0 2px, rgba(120, 100, 70, 0) 2px 6px);
  border: 1px solid #e7dfcf;
  border-radius: 0;
  box-shadow: none;
}

/* === full-quote · 朱砂底整段引用 === */
#wemd .wemd-full-quote {
  background: #a33a2b;
  border-radius: 0;
}
#wemd .wemd-full-quote .wemd-fq-text { color: #f8eee6; letter-spacing: 0.08em; }
`;
