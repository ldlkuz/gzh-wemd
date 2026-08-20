/**
 * 无声发布主题 - 皮肤（SILENT KEYNOTE）
 *
 * 设计：一场发布会——黑屏开场 + 白场正文 + 黑屏收场。
 * - 正文区在编辑器浅底（深色墨字），每个"舞台卡"（封面/结尾/代码）为深黑面板（浅字）
 * - 唯一强调色 = 荧光橙 #ff4d00（舞台灯光）；两套字体：无衬线正文 + 等宽编号/参数
 * - 无整篇背景、无伪元素、无按钮式互动；装饰为真实元素（topline/note/dots）
 */

const ORANGE = "#ff4d00";
const INK = "#0a0a0c";
const INK_SOFT = "#9a9aa3";
const PAPER = "#fafaf8";
const TEXT = "#18181c";
const TEXT_SOFT = "#6f6f78";
const LINE = "#e6e6e0";

export const componentStylesSilentKeynote = `/* === 无声发布（Silent Keynote）组件样式 === */

/* 全局：正文区浅底深字（编辑器提供白场），组件卡自带给深底 */
#wemd {
  color: ${TEXT};
  font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif;
  font-size: 16px;
  line-height: 1.9;
  letter-spacing: 0.01em;
}

#wemd p {
  margin: 0 0 18px;
  color: ${TEXT};
  font-size: 16px;
  line-height: 1.9;
  text-align: justify;
}

#wemd p b,
#wemd p strong {
  color: ${TEXT};
  font-weight: 700;
}

#wemd em {
  font-style: normal;
  color: ${ORANGE};
  font-weight: 600;
}

#wemd a {
  color: ${ORANGE};
  text-decoration: none;
  border-bottom: 1px solid ${ORANGE};
}

/* === 标题（白场深字 + 橙细线） === */
#wemd h1 .content {
  font-size: 28px;
  font-weight: 900;
  letter-spacing: 0.02em;
  color: ${TEXT};
}
#wemd h1 {
  margin: 28px 0 18px;
  padding: 0 0 12px;
  border-bottom: 1px solid ${LINE};
}

#wemd h2 .content {
  font-size: 22px;
  font-weight: 800;
  letter-spacing: -0.01em;
  color: ${TEXT};
}
#wemd h2 {
  margin: 30px 0 16px;
  padding: 0 0 10px;
  border-bottom: 1px solid ${LINE};
}

#wemd h3 .content {
  font-size: 18px;
  font-weight: 700;
  color: ${TEXT};
}
#wemd h3 {
  margin: 24px 0 12px;
}

#wemd h4 .content {
  font-family: "SF Mono", "Cascadia Code", Consolas, monospace;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.16em;
  color: ${ORANGE};
}

/* === 章节编号拆分（numbered-heading / section-title） === */
#wemd .wemd-numbered-heading,
#wemd .wemd-section-title {
  margin: 34px 0 14px;
  background: transparent;
  border: none;
  border-radius: 0;
  box-shadow: none;
  padding: 0;
}
#wemd .wemd-sk-sec-head {
  display: flex;
  align-items: baseline;
  gap: 12px;
  padding: 0 0 10px;
  border-bottom: 1px solid ${LINE};
}
#wemd .wemd-sk-sec-num {
  font-family: "SF Mono", "Cascadia Code", Consolas, monospace;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: ${ORANGE};
  flex-shrink: 0;
}
#wemd .wemd-sk-sec-body {
  font-size: 21px;
  font-weight: 800;
  letter-spacing: -0.01em;
  color: ${TEXT};
}

/* === 黑屏封面 magazine-cover === */
#wemd .wemd-magazine-cover {
  margin: 4px 0 30px;
  padding: 0;
  background: transparent;
  border: none;
  border-radius: 0;
}
#wemd .wemd-sk-cover {
  padding: 30px 24px 24px;
  background: ${INK};
  color: #f4f4f0;
  text-align: center;
  border-radius: 18px;
  overflow: hidden;
}
#wemd .wemd-sk-topline {
  display: block;
  width: 46px;
  height: 3px;
  margin: 0 auto 22px;
  background: ${ORANGE};
}
#wemd .wemd-sk-eyebrow {
  font-family: "SF Mono", "Cascadia Code", Consolas, monospace;
  font-size: 12px;
  letter-spacing: 0.4em;
  text-transform: uppercase;
  color: ${INK_SOFT};
  margin-bottom: 18px;
}
#wemd .wemd-sk-title {
  font-size: 34px;
  font-weight: 900;
  letter-spacing: -0.02em;
  line-height: 1.15;
  color: #f4f4f0;
}
#wemd .wemd-sk-sub {
  margin-top: 14px;
  font-size: 15px;
  letter-spacing: 0.22em;
  color: ${INK_SOFT};
}
#wemd .wemd-sk-cover-img {
  margin: 26px -8px 0;
  border-radius: 12px;
  overflow: hidden;
}
#wemd .wemd-sk-cover-img img {
  display: block;
  width: 100%;
  max-height: 300px;
  object-fit: cover;
}
#wemd .wemd-sk-note {
  display: block;
  margin-top: 20px;
  font-family: "SF Mono", "Cascadia Code", Consolas, monospace;
  font-size: 9px;
  letter-spacing: 0.34em;
  color: #5a5a66;
}

/* 封面内强调字继承封面色（避免全局 em/strong 橙色染色） */
#wemd .wemd-sk-cover strong,
#wemd .wemd-sk-cover em {
  color: inherit;
  font-weight: inherit;
  font-style: inherit;
}

/* === 黑屏收场 end-card === */
#wemd .wemd-end-card {
  margin: 30px 0 10px;
  padding: 0;
  background: transparent;
  border: none;
  border-radius: 0;
}
#wemd .wemd-sk-end {
  background: ${INK};
  color: #f4f4f0;
  text-align: center;
  padding: 52px 26px 40px;
  border-radius: 18px;
  position: relative;
}
#wemd .wemd-sk-end-line {
  display: block;
  width: 46px;
  height: 3px;
  margin: 0 auto 24px;
  background: ${ORANGE};
}
#wemd .wemd-sk-end-eyebrow {
  font-family: "SF Mono", "Cascadia Code", Consolas, monospace;
  font-size: 11px;
  letter-spacing: 0.36em;
  text-transform: uppercase;
  color: ${INK_SOFT};
}
#wemd .wemd-sk-end-title {
  margin-top: 20px;
  font-size: 28px;
  font-weight: 900;
  letter-spacing: -0.01em;
  line-height: 1.25;
  color: #f4f4f0;
}
#wemd .wemd-sk-end-meta {
  margin-top: 16px;
  font-size: 14px;
  letter-spacing: 0.06em;
  color: ${INK_SOFT};
}

/* 收场内强调字继承（避免全局 em/strong 橙色染色） */
#wemd .wemd-sk-end strong,
#wemd .wemd-sk-end em {
  color: inherit;
  font-weight: inherit;
  font-style: inherit;
}

/* === 无声分隔线 divider === */
#wemd .wemd-divider {
  margin: 34px 0;
  background: transparent;
  border: none;
  border-radius: 0;
}
#wemd .wemd-divider .wemd-component-body {
  text-align: center;
}
/* 无声分隔只用 ··· 圆点，去掉共享 ::before/::after 左右侧线，避免线 + 点 + 线 */
#wemd .wemd-divider .wemd-component-body::before,
#wemd .wemd-divider .wemd-component-body::after {
  content: none;
}
#wemd .wemd-sk-dots {
  font-family: "SF Mono", "Cascadia Code", Consolas, monospace;
  font-size: 14px;
  letter-spacing: 0.5em;
  color: ${ORANGE};
}

/* === 表格（无边框等宽） === */
#wemd .wemd-styled-table table,
#wemd table {
  width: 100%;
  border-collapse: collapse;
  margin: 14px 0 22px;
  border: none;
  box-shadow: none;
}
#wemd .wemd-styled-table th,
#wemd .wemd-styled-table td,
#wemd table th,
#wemd table td {
  border: none;
  border-bottom: 1px solid ${LINE};
  padding: 10px 6px;
  font-family: "SF Mono", "Cascadia Code", Consolas, monospace;
  font-size: 13px;
  text-align: left;
  background: transparent;
}
#wemd .wemd-styled-table th,
#wemd table th {
  color: ${ORANGE};
  font-weight: 700;
  letter-spacing: 0.06em;
}
#wemd .wemd-styled-table td,
#wemd table td {
  color: ${TEXT};
}

/* === 时间线 === */
#wemd .wemd-timeline .wemd-component-body > ul {
  list-style: none;
  padding: 0;
  margin: 10px 0 0;
}
#wemd .wemd-timeline .wemd-component-body li {
  position: relative;
  padding: 0 0 22px 26px;
  font-size: 15px;
  color: ${TEXT};
}
#wemd .wemd-timeline .wemd-component-body li::before {
  content: "";
  position: absolute;
  left: 3px;
  top: 8px;
  width: 9px;
  height: 9px;
  border-radius: 50%;
  border: 2px solid ${ORANGE};
}
#wemd .wemd-timeline .wemd-component-body li b {
  color: ${ORANGE};
  font-family: "SF Mono", "Cascadia Code", Consolas, monospace;
  font-weight: 700;
  margin-right: 8px;
}

/* === 图片 === */
#wemd .wemd-image-card .wemd-ic-image img,
#wemd .wemd-image-grid .wemd-component-body img {
  display: block;
  width: 100%;
  border-radius: 12px;
}
#wemd .wemd-image-card .wemd-ic-caption {
  font-family: "SF Mono", "Cascadia Code", Consolas, monospace;
  font-size: 11px;
  letter-spacing: 0.1em;
  color: ${TEXT_SOFT};
  margin-top: 8px;
}

/* === 引文 === */
#wemd .wemd-quote-card .wemd-component-body > p:first-child {
  font-size: 18px;
  font-weight: 500;
  color: ${TEXT};
  border-left: 2px solid ${ORANGE};
  padding-left: 16px;
}
#wemd .wemd-quote-card .wemd-component-body > p {
  color: ${TEXT_SOFT};
  font-size: 13px;
  text-align: right;
}
#wemd .wemd-full-quote .wemd-fq-text,
#wemd .wemd-pullquote .wemd-component-body > blockquote,
#wemd .wemd-pullquote .wemd-component-body > p {
  font-size: 20px;
  font-weight: 300;
  letter-spacing: 0.04em;
  line-height: 1.8;
  color: ${TEXT};
  text-align: center;
}
/* 无声引用为居中大字，去掉共享 pullquote 根元素 5px 竖条（非伪元素，用 border 覆盖） */
#wemd .wemd-pullquote {
  border-left: none;
  background: transparent;
  border-radius: 0;
  padding: 0;
}

/* === 代码 === */
#wemd .wemd-code-frame .wemd-cf-header {
  border-radius: 10px 10px 0 0;
}
#wemd .wemd-code-frame .wemd-cf-code,
#wemd pre.custom {
  background: ${INK};
  color: #e6edf3;
  border-radius: 0 0 10px 10px;
  font-family: "SF Mono", "Cascadia Code", Consolas, monospace;
  font-size: 13px;
  line-height: 1.7;
}

/* === 提示框 === */
/* 共享 callout-pro 根有 ::before 左竖条，本主题用 body 的 border-left 表达竖条 →
   中和共享竖条，否则根 + body 双竖条。 */
#wemd .wemd-callout-pro::before {
  content: none;
}
/* 共享 callout（非 -pro）根元素自带 border-left:4px（非伪元素），同样用 body 表达 →
   清掉共享根竖条/卡片底/圆角/padding，否则根 + body 双竖条。 */
#wemd .wemd-callout {
  border-left: none;
  background: transparent;
  border-radius: 0;
  padding: 0;
}
#wemd .wemd-callout-pro .wemd-component-body,
#wemd .wemd-callout .wemd-component-body {
  background: transparent;
  border-left: 2px solid ${ORANGE};
  padding: 6px 0 6px 16px;
  color: ${TEXT};
}
#wemd .wemd-callout-pro .wemd-component-body p:first-child,
#wemd .wemd-callout .wemd-component-body p:first-child {
  color: ${ORANGE};
  font-weight: 700;
}

/* === 数据 / 标签 / 行动 === */
#wemd .wemd-stats-block .wemd-component-body .wemd-sb-item-value {
  font-size: 26px;
  font-weight: 900;
  color: ${ORANGE};
  font-family: "SF Mono", "Cascadia Code", Consolas, monospace;
}
#wemd .wemd-tag-label .wemd-component-body {
  font-family: "SF Mono", "Cascadia Code", Consolas, monospace;
  font-size: 12px;
  letter-spacing: 0.12em;
  color: ${ORANGE};
}
#wemd .wemd-cta-card .wemd-component-body {
  background: ${INK};
  color: #f4f4f0;
  border-radius: 14px;
  padding: 26px 22px;
  text-align: center;
}
#wemd .wemd-cta-card .wemd-component-body p {
  color: #f4f4f0;
  text-align: center;
}
#wemd .wemd-cta-card .wemd-component-body p:first-child {
  font-size: 20px;
  font-weight: 800;
}

/* === 目录 / 步骤 / 折叠 === */
#wemd .wemd-toc-nav .wemd-component-body,
#wemd .wemd-steps .wemd-component-body,
#wemd .wemd-accordion .wemd-component-body {
  color: ${TEXT};
}
#wemd .wemd-toc-nav .wemd-component-body li section,
#wemd .wemd-steps .wemd-component-body li section {
  color: ${TEXT};
}

/* === 品牌落款（复用左图右文 inline 布局 + 主题配色） === */
#wemd .wemd-brand-sign .wemd-bs-brand-name {
  color: ${TEXT};
  font-weight: 800;
}
#wemd .wemd-brand-sign .wemd-bs-tagline,
#wemd .wemd-brand-sign .wemd-bs-slogan {
  color: ${ORANGE};
}
#wemd .wemd-brand-sign .wemd-bs-subtext {
  color: ${TEXT_SOFT};
  font-family: "SF Mono", "Cascadia Code", Consolas, monospace;
}

/* === 分享卡片（浅色面板深字） === */
#wemd .wemd-share-card .wemd-component-body {
  color: ${TEXT};
}
#wemd .wemd-share-card .wemd-component-body p:last-child {
  color: ${ORANGE};
  font-weight: 600;
}

/* === follow-bar 关注引导条：白场面板 + 深字 + 橙色强调。
   不复用共享橙色渐变条（否则橙字落在橙底上基本不可见） === */
#wemd .wemd-follow-bar {
  margin: 0 0 24px;
  padding: 14px 16px;
  background: #ffffff;
  border: 1px solid ${LINE};
  border-bottom: 2px solid ${ORANGE};
  border-radius: 0;
  color: ${TEXT};
}
#wemd .wemd-follow-bar .wemd-component-body {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  gap: 12px;
}
#wemd .wemd-follow-bar .wemd-component-body > p:first-child {
  margin: 0;
  flex: 1;
  font-size: 14px;
  color: ${TEXT};
}
#wemd .wemd-follow-bar .wemd-component-body > p:first-child strong {
  color: ${ORANGE};
  font-weight: 700;
}
#wemd .wemd-follow-bar .wemd-component-body > p:last-child:not(:first-child) {
  margin: 0;
  flex-shrink: 0;
  background: transparent;
  border: none;
  border-radius: 0;
  font-family: "SF Mono", "Cascadia Code", Consolas, monospace;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.14em;
  color: ${ORANGE};
}
`;
