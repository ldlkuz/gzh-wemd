/**
 * 故事集主题 - 皮肤（STORYBOOK）
 *
 * 设计：像翻开一本装帧精良的小说——纯图片封面叠层文字、暖纸白承载、墨黑衬线正文、
 * 暮霞红作唯一强调色。
 * - 封面：图 + 深色渐变遮罩 + 标题/副题/引子句叠层（遮罩是带背景的空 span，真实元素）
 * - 正文：衬线 + 宽松行高，阅读沉浸；金句/引子/对话用组件承载
 * - 无整篇背景、无伪元素（仅用 content:none 中和共享伪元素装饰）、无按钮式互动
 */
const PAPER = "#f7f2e8";
const INK = "#1f1a16";
const TEXT = "#33291f";
const TEXT_SOFT = "#6b5f50";
const ACCENT = "#b5533a";
const ACCENT_SOFT = "#f0ded5";
const LINE = "#d8cbb2";

export const componentStylesStorybook = `/* === 故事集（Storybook）组件样式 === */

/* 全局：衬线 + 适度行高（沉浸阅读，字号克制让长文放得下） */
#wemd {
  font-family: "Noto Serif SC", "Songti SC", "SimSun", "Source Han Serif SC", Georgia, serif;
  color: ${TEXT};
  font-size: 15.5px;
  line-height: 1.9;
  letter-spacing: 0.03em;
}
#wemd p {
  margin: 0 0 1.5em;
  color: ${TEXT};
  font-size: 15.5px;
  line-height: 1.9;
  text-align: justify;
}
#wemd p b,
#wemd p strong {
  color: ${INK};
  font-weight: 700;
}
#wemd em {
  font-style: normal;
  color: ${ACCENT};
}
#wemd a {
  color: ${ACCENT};
  text-decoration: none;
  border-bottom: 1px solid ${ACCENT};
}

/* === 标题 === */
#wemd h1 {
  margin: 48px 0 22px;
}
#wemd h1 .content {
  font-size: 28px;
  font-weight: 800;
  letter-spacing: 0.05em;
  color: ${INK};
}
#wemd h2 {
  margin: 40px 0 18px;
}
#wemd h2 .content {
  font-size: 23px;
  font-weight: 800;
  letter-spacing: 0.05em;
  color: ${INK};
}
#wemd h3 {
  margin: 32px 0 14px;
}
#wemd h3 .content {
  font-size: 18px;
  font-weight: 700;
  color: ${INK};
}
#wemd h4 {
  margin: 28px 0 12px;
}
#wemd h4 .content {
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.1em;
  color: ${ACCENT};
}

/* === 封面（background-image + 底部渐变，文字正常流锚底部） ===
   公众号会删除 position，禁止绝对定位叠字；封面图用 background-image（图床 URL）+
   底部渐变叠加，文字在正常流中靠 padding-top 压出图区、锚在底部。两链路一致。 */
/* 清除共享卡片样式（border / 卡片底 / padding / 圆角 / 居中），否则封面外套一圈卡片边框 */
#wemd .wemd-magazine-cover {
  margin: 0 0 2.2em;
  padding: 0;
  background: transparent;
  border: none;
  border-radius: 0;
  box-shadow: none;
  text-align: left;
}
/* 图区高度：padding-top 百分比相对容器宽度，背景 cover 铺满；文字正常流接在其后 */
#wemd .wemd-magazine-cover .wemd-sk-cover {
  padding: 46% 24px 28px;
  border-radius: 6px;
  overflow: hidden;
}
#wemd .wemd-magazine-cover .wemd-sk-heading {
  margin: 0;
  color: #f3ecdf;
  font-size: clamp(26px, 5.5vw, 38px);
  font-weight: 800;
  letter-spacing: 0.06em;
  line-height: 1.15;
  text-shadow: 0 2px 24px rgba(0,0,0,0.45);
}
#wemd .wemd-magazine-cover .wemd-sk-heading b,
#wemd .wemd-magazine-cover .wemd-sk-heading strong,
#wemd .wemd-magazine-cover .wemd-sk-heading em {
  color: inherit;
  font-style: inherit;
}
#wemd .wemd-magazine-cover .wemd-sk-subtitle {
  margin: 14px 0 0;
  color: rgba(243,236,223,0.86);
  font-size: clamp(13px, 2vw, 16px);
  letter-spacing: 0.16em;
  text-align: left;
}
#wemd .wemd-magazine-cover .wemd-sk-opening {
  margin: 22px 0 0;
  color: rgba(243,236,223,0.9);
  font-size: clamp(12.5px, 1.6vw, 14.5px);
  line-height: 1.9;
  text-align: left;
}

/* === 引子卡（text-card） === */
#wemd .wemd-text-card {
  margin: 2em 0;
  padding: 26px 24px;
  background: ${PAPER};
  border: 1px solid ${LINE};
  border-radius: 4px;
}
#wemd .wemd-text-card .wemd-sk-lead-kicker {
  display: inline-block;
  font-size: 12.5px;
  letter-spacing: 0.4em;
  color: ${ACCENT};
  margin: 0 0 14px;
}
/* 引子正文基准字号：让 dropcap 的 em 以正文 17.5px 为参照（3em=52.5px≈1.5 行高）。
   注意：骨架里首字 span 内联在正文 <p> 内，.wemd-sk-lead-body 即该 <p> 本身 */
#wemd .wemd-text-card .wemd-sk-lead-body {
  margin: 0;
  font-size: 17.5px;
  line-height: 2;
  color: ${INK};
}
/* 首字下沉：红色大号、恰好两行高（真实 span 承载，非伪元素）。
   采用「弹性浮高」而非固定 px 高度：line-height:1 让浮动盒高度=字号本身，
   font-size:3em（相对正文 17.5px=52.5px）落在正文一行(35px)与两行(70px)之间，
   第 1–2 行自然绕排、第 3 行回到最左。字号/行高全用 em 相对值，
   不受环境字体度量影响，微信/预览两链路一致。 */
#wemd .wemd-text-card .wemd-sk-lead-body .wemd-sk-dropcap {
  float: left;
  font-size: 3em;
  line-height: 1;
  margin: 2px 8px 0 0;
  font-weight: 700;
  color: ${ACCENT};
}

/* === 章节分隔（section-divider：上下结构，章标小字在上 + 章名大字带底线） === */
#wemd .wemd-section-divider {
  /* 下边距按组件基准字号（非章名大字 em），控制底线到正文的间隙 */
  margin: 3em 0 1.8em;
  padding: 0;
  background: transparent;
  border: none;
  border-radius: 0;
}
#wemd .wemd-section-divider .wemd-sk-chapter {
  display: block;
}
#wemd .wemd-section-divider .wemd-sk-chapter-part {
  display: block;
  font-size: 15px;
  letter-spacing: 0.4em;
  color: ${ACCENT};
  margin-bottom: 12px;
}
#wemd .wemd-section-divider .wemd-sk-chapter-title {
  display: block;
  margin: 0;
  font-size: clamp(26px, 4.6vw, 38px);
  font-weight: 700;
  letter-spacing: 0.05em;
  line-height: 1.3;
  color: ${INK};
  padding-bottom: 14px;
  border-bottom: 1px solid ${LINE};
}

/* === 金句（quote-card：居中双线） === */
#wemd .wemd-quote-card {
  margin: 2.6em 0;
  padding: 0;
  background: transparent;
  border: none;
  border-radius: 0;
}
#wemd .wemd-quote-card .wemd-sk-quote {
  padding: 30px 18px 26px;
  text-align: center;
  border-top: 1px solid ${ACCENT};
  border-bottom: 1px solid ${ACCENT};
}
#wemd .wemd-quote-card .wemd-sk-quote-text {
  margin: 0 0 14px;
  font-size: 18.5px;
  line-height: 2;
  font-weight: 600;
  color: ${INK};
  letter-spacing: 0.04em;
  text-align: center;
}
#wemd .wemd-quote-card .wemd-sk-quote-author {
  margin: 0;
  font-size: 12px;
  letter-spacing: 0.34em;
  color: ${TEXT_SOFT};
  text-align: center;
}
#wemd .wemd-quote-card .wemd-sk-quote-author strong {
  color: inherit;
  font-weight: 400;
}

/* === 结尾（end-card） === */
#wemd .wemd-end-card {
  margin: 3.2em 0 1em;
  padding: 0;
  background: transparent;
  border: none;
  border-radius: 0;
}
#wemd .wemd-end-card .wemd-sk-end {
  padding: 10px 0;
  text-align: center;
}
#wemd .wemd-end-card .wemd-sk-end-rule {
  display: block;
  width: 100%;
  height: 1px;
  background: ${LINE};
  font-size: 0;
  line-height: 0;
  overflow: hidden;
}
#wemd .wemd-end-card .wemd-sk-end-mark {
  /* 与章节分隔的章标（壹/贰）同层级：15px、暮霞红、0.4em 字距；
     显式居中，避免被全局 #wemd p { text-align: justify } 拉成左对齐 */
  margin: 14px 0 14px;
  font-size: 15px;
  letter-spacing: 0.4em;
  color: ${ACCENT};
  text-align: center;
}
/* 后记标题（如「后记」）：完 与正文之间的大字标题 */
#wemd .wemd-end-card .wemd-sk-end-heading {
  margin: 0 0 20px;
  font-size: clamp(24px, 4vw, 32px);
  font-weight: 700;
  letter-spacing: 0.12em;
  line-height: 1.4;
  color: ${INK};
  text-align: center;
}
#wemd .wemd-end-card .wemd-sk-end-text {
  margin: 0 auto;
  max-width: 30em;
  font-size: 14.5px;
  line-height: 2;
  color: ${TEXT_SOFT};
  text-align: center;
}
#wemd .wemd-end-card .wemd-sk-end-text strong,
#wemd .wemd-end-card .wemd-sk-end-text em {
  color: inherit;
  font-style: inherit;
}

/* === 原生引用（pullquote：居中无竖条） === */
#wemd .wemd-pullquote {
  margin: 2.4em 0;
  padding: 0;
  background: transparent;
  border-left: none;
  border-radius: 0;
}
#wemd .wemd-pullquote .wemd-component-body {
  text-align: center;
  padding: 24px 18px;
  border-top: 1px solid ${ACCENT};
  border-bottom: 1px solid ${ACCENT};
}
#wemd .wemd-pullquote .wemd-component-body blockquote,
#wemd .wemd-pullquote .wemd-component-body p {
  margin: 0;
  font-size: 17px;
  line-height: 1.9;
  color: ${INK};
  text-align: center;
}

/* === 场景图（image-caption） === */
#wemd .wemd-image-caption {
  margin: 2.4em 0;
  padding: 0;
  background: transparent;
  border: none;
  border-radius: 0;
}
#wemd .wemd-image-caption .wemd-component-body img {
  display: block;
  width: 100%;
  border-radius: 4px;
  box-shadow: 0 14px 40px rgba(31,26,22,0.16);
}
#wemd .wemd-image-caption .wemd-component-body p {
  margin: 12px 0 0;
  font-size: 12.5px;
  letter-spacing: 0.12em;
  color: ${TEXT_SOFT};
  text-align: center;
}

/* === 对话 / 提示（callout：纸面块，无竖条，对齐视觉稿 dialogue） === */
#wemd .wemd-callout {
  margin: 2em 0;
  padding: 0;
  background: transparent;
  border-left: none;
  border-radius: 0;
}
#wemd .wemd-callout .wemd-component-body {
  padding: 26px 24px;
  background: ${PAPER};
  border-left: none;
}
#wemd .wemd-callout .wemd-component-body p {
  margin: 0;
  font-size: 15px;
  line-height: 1.9;
  color: ${TEXT};
}
#wemd .wemd-callout .wemd-component-body p + p {
  margin-top: 14px;
}
/* 说话人小标（对话场景）：callout 内 strong 用作说话人，小字、暮霞红。
   选择器需带 .wemd-component 提升特异性（1,3,2）压过共享扩展规则
   #wemd .wemd-callout .wemd-component-body > p:first-child strong（1,3,2，源码在前），
   否则内联器按特异性应用时会把第一个说话人覆盖成 primaryDark，两人颜色不一致 */
#wemd .wemd-callout.wemd-component .wemd-component-body p strong {
  display: block;
  font-size: 12.5px;
  font-weight: 400;
  letter-spacing: 0.24em;
  color: ${ACCENT} !important;
  margin-bottom: 4px;
}
/* 中和共享 callout-pro 的 ::before 左竖条（本主题用纸面块表达，防双条） */
#wemd .wemd-callout-pro::before {
  content: none;
}

/* === 分隔线（divider：细单线） === */
#wemd .wemd-divider {
  margin: 2.6em 0;
  padding: 0;
  background: transparent;
  border: none;
  border-radius: 0;
}
#wemd .wemd-divider .wemd-component-body {
  height: 1px;
  background: ${LINE};
  color: transparent;
}
#wemd .wemd-divider .wemd-component-body::before,
#wemd .wemd-divider .wemd-component-body::after {
  content: none;
}

/* === 代码（暖纸浅底） === */
#wemd pre code.hljs {
  display: block;
  padding: 18px 20px;
  background: #efe7d6;
  color: #33291f;
  border: 1px solid ${LINE};
  border-radius: 4px;
  font-size: 13.5px;
  line-height: 1.7;
  white-space: pre;
  overflow-x: auto;
}

/* === 表格（暖纸细线） === */
#wemd .wemd-styled-table,
#wemd table {
  border-collapse: collapse;
  margin: 2.2em 0;
  width: 100%;
}
#wemd .wemd-styled-table th,
#wemd table th {
  background: #efe7d6;
  color: ${INK};
  font-weight: 700;
  border: 1px solid ${LINE};
  padding: 10px 12px;
  text-align: left;
}
#wemd .wemd-styled-table td,
#wemd table td {
  border: 1px solid ${LINE};
  padding: 10px 12px;
  color: ${TEXT};
  background: transparent;
}
`;
