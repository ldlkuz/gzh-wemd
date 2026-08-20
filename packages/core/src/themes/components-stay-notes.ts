/**
 * 民宿纪主题 - 皮肤（STAY NOTES）
 *
 * 设计：原木奶油·大地暖调——燕麦米白承载、暖木/陶土主色、鼠尾草绿点缀（业内民宿配色）。
 * - 封面：图 + 底部渐变遮罩 + 腰牌小标 + 大标题叠层
 * - 民宿卡：全幅图 + 木牌编号 + 奶油价格签 + 店名 + 一句推荐 + 位置 + 理由 + 标签
 * - 无整篇背景、无伪元素（仅用 content:none 中和共享伪元素装饰）、无按钮式互动
 */
const BASE = "#f4efe5";      /* 燕麦米白基底 */
const CARD = "#fdfaf3";      /* 奶油白卡 */
const CREAM = "#f7efe1";     /* 暖奶油 */
const WOOD = "#b06a44";      /* 原木/陶土 主色 */
const WOOD_DEEP = "#955431"; /* 深陶土 */
const SAGE = "#8d9a77";      /* 鼠尾草绿 辅助 */
const INK = "#4d3d2f";       /* 可可深字 */
const TEXT = "#71624f";      /* 次级文字 */
const TEXT_SOFT = "#b7a588"; /* 浅棕 */
const LINE = "#e7dfcd";      /* 分割线 */

export const componentStylesStayNotes = `/* === 民宿纪（Stay Notes）组件样式 === */

/* 全局：正文衬线 + 标题宋体，原木奶油承载 */
#wemd {
  font-family: "Noto Serif SC", "Songti SC", "STSong", "Source Han Serif SC", Georgia, serif;
  color: ${TEXT};
  font-size: 15.5px;
  line-height: 1.9;
  letter-spacing: 0.02em;
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
  color: ${WOOD};
  font-weight: 700;
}
#wemd em {
  font-style: normal;
  color: ${INK};
  font-weight: 600;
}
#wemd a {
  color: ${WOOD};
  text-decoration: none;
  border-bottom: 1px solid ${WOOD};
}

/* === 标题（宋体，暖木 / 可可） === */
#wemd h1 .content {
  font-family: "Noto Serif SC", "Songti SC", "STSong", "PingFang SC", serif;
  font-size: 27px;
  font-weight: 700;
  letter-spacing: 0.03em;
  color: ${INK};
}
#wemd h2 .content {
  font-family: "Noto Serif SC", "Songti SC", "STSong", "PingFang SC", serif;
  font-size: 22px;
  font-weight: 700;
  letter-spacing: 0.03em;
  color: ${INK};
}
#wemd h3 .content {
  font-family: "Noto Serif SC", "Songti SC", "STSong", "PingFang SC", serif;
  font-size: 18px;
  font-weight: 700;
  color: ${INK};
}
#wemd h4 .content {
  font-family: "Noto Serif SC", "Songti SC", "STSong", "PingFang SC", serif;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.12em;
  color: ${WOOD};
}
#wemd h1, #wemd h2, #wemd h3, #wemd h4 {
  margin: 38px 0 16px;
}

/* === 列表（保留原生 disc，无伪元素） === */
#wemd ul {
  margin: 1.6em 0;
  padding: 0 0 0 1.3em;
}
#wemd ul li {
  margin-bottom: 0.6em;
  font-size: 15.5px;
  line-height: 2;
  color: ${TEXT};
}

/* === 封面（background-image + 底部渐变，文字正常流锚底部） ===
   公众号会删除 position，禁止绝对定位叠字；封面图用 background-image（图床 URL）+
   底部渐变叠加，文字正常流中靠 padding-top 压出图区、锚在底部。两链路一致。 */
/* 清除共享卡片样式，否则封面外套一圈卡片边框 */
#wemd .wemd-magazine-cover {
  margin: 0 0 2.4em;
  padding: 0;
  background: transparent;
  border: none;
  border-radius: 0;
  box-shadow: none;
  text-align: left;
}
#wemd .wemd-magazine-cover .wemd-st-cover {
  padding: 46% 22px 26px;
  border-radius: 16px;
  overflow: hidden;
}
#wemd .wemd-magazine-cover .wemd-st-sign {
  display: inline-block;
  margin: 0 0 16px;
  padding: 8px 16px;
  background: rgba(143,91,55,0.96);
  color: #f7ead6;
  font-family: "PingFang SC", "Microsoft YaHei", "Noto Sans SC", sans-serif;
  font-size: 11px;
  letter-spacing: 0.24em;
  border-radius: 6px;
  box-shadow: inset 0 -3px 0 rgba(0,0,0,0.18);
  text-align: left;
}
#wemd .wemd-magazine-cover .wemd-st-title {
  margin: 0;
  font-family: "Noto Serif SC", "Songti SC", "STSong", "PingFang SC", serif;
  font-weight: 700;
  font-size: clamp(28px, 6.4vw, 42px);
  line-height: 1.18;
  letter-spacing: 0.04em;
  color: #fbf3e4;
  padding: 0;
  border: none;
  text-shadow: 0 1px 8px rgba(30,20,8,0.35);
}
#wemd .wemd-magazine-cover .wemd-st-title b,
#wemd .wemd-magazine-cover .wemd-st-title strong,
#wemd .wemd-magazine-cover .wemd-st-title em {
  color: inherit;
  font-style: inherit;
}
#wemd .wemd-magazine-cover .wemd-st-caption {
  margin: 16px 0 0;
  max-width: 92%;
  font-size: clamp(13px, 2vw, 15px);
  letter-spacing: 0.06em;
  line-height: 1.9;
  color: rgba(248,238,220,0.9);
  text-align: left;
}
#wemd .wemd-magazine-cover .wemd-st-caption strong,
#wemd .wemd-magazine-cover .wemd-st-caption em {
  color: inherit;
  font-style: inherit;
}

/* === 导语（text-card：顶线 + 小标 + 大字引言） === */
#wemd .wemd-text-card {
  margin: 2em 0 2.4em;
  padding: 22px 22px 22px;
  background: transparent;
  border: none;
  border-radius: 0;
}
#wemd .wemd-text-card .wemd-st-intro-rule {
  display: block;
  width: 34px;
  height: 3px;
  background: ${WOOD};
  border-radius: 3px;
  margin: 0 0 16px;
}
#wemd .wemd-text-card .wemd-st-intro-tag {
  font-family: "PingFang SC", "Microsoft YaHei", "Noto Sans SC", sans-serif;
  font-size: 11.5px;
  letter-spacing: 0.2em;
  color: ${WOOD};
  margin: 0 0 12px;
}
#wemd .wemd-text-card .wemd-st-intro-text {
  margin: 0;
  font-size: 17.5px;
  line-height: 2;
  font-weight: 600;
  color: ${INK};
}
#wemd .wemd-text-card .wemd-st-intro-text strong {
  color: ${WOOD};
}

/* === 民宿卡（image-caption：图 + 木牌编号 + 价格签 + 店名 + 一句推荐 + 理由） ===
   图片作 background-image；编号在正常流顶部左上角，fill 撑出图区，
   价格行 text-align:right 锚底部右下角。全程无 position（公众号兼容）。 */
#wemd .wemd-image-caption {
  margin: 2em 0;
  padding: 0;
  background: transparent;
  border: none;
  border-radius: 0;
  /* 清掉共享 text-align:center，否则编号/价格标签被居中（不挂左上角） */
  text-align: left;
}
#wemd .wemd-image-caption .wemd-st-stay {
  background: ${CARD};
  border: 1px solid ${LINE};
  border-radius: 18px;
  overflow: hidden;
  box-shadow: 0 8px 26px rgba(90,60,25,0.08);
}
#wemd .wemd-image-caption .wemd-st-fig {
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  overflow: hidden;
}
/* 木牌编号：fig 首个内联元素，挂顶部左上角 */
#wemd .wemd-image-caption .wemd-st-no {
  display: inline-block;
  margin: 16px 0 0 16px;
  background: ${WOOD};
  color: #f7ead6;
  font-family: "PingFang SC", "Microsoft YaHei", "Noto Sans SC", sans-serif;
  font-weight: 700;
  font-size: 15px;
  letter-spacing: 0.06em;
  padding: 6px 13px;
  border-radius: 6px;
  box-shadow: inset 0 -3px 0 rgba(0,0,0,0.16), 0 3px 10px rgba(0,0,0,0.18);
}
/* 图区高度：padding-top 百分比相对容器宽度，背景 cover 铺满（无 position 叠字）。
   &nbsp; 为真实内容防公众号删空元素，font-size/line-height 0 隐形 */
#wemd .wemd-image-caption .wemd-st-fill {
  margin: 0;
  font-size: 0;
  line-height: 0;
  padding-top: 54%;
}
#wemd .wemd-image-caption .wemd-st-price-row {
  margin: 0;
  padding: 0 14px 14px;
  text-align: right;
}
/* 奶油价格签 */
#wemd .wemd-image-caption .wemd-st-price {
  display: inline-block;
  background: rgba(250,244,232,0.94);
  color: ${WOOD_DEEP};
  border: 1px solid #e0cfae;
  font-family: "PingFang SC", "Microsoft YaHei", "Noto Sans SC", sans-serif;
  font-weight: 700;
  font-size: 15px;
  padding: 6px 14px;
  border-radius: 30px;
  letter-spacing: 0.04em;
  box-shadow: 0 3px 10px rgba(0,0,0,0.12);
}
#wemd .wemd-image-caption .wemd-st-inner {
  padding: 0 18px 18px;
}
#wemd .wemd-image-caption .wemd-st-name {
  margin: 18px 0 0;
  font-family: "Noto Serif SC", "Songti SC", "STSong", "PingFang SC", serif;
  font-weight: 700;
  font-size: 22px;
  letter-spacing: 0.03em;
  color: ${INK};
  padding: 0;
  border: none;
}
/* 一句推荐：虚线亚麻小签 */
#wemd .wemd-image-caption .wemd-st-slogan {
  display: table;
  margin: 12px 0 0;
  padding: 5px 16px;
  border: 1px dashed #cdb990;
  border-radius: 30px;
  background: #f3ecdd;
  color: ${WOOD_DEEP};
  font-size: 12px;
  letter-spacing: 0.14em;
  text-align: left;
}
#wemd .wemd-image-caption .wemd-st-meta {
  margin: 12px 0 0;
  font-size: 12.5px;
  letter-spacing: 0.02em;
  color: ${TEXT_SOFT};
  text-align: left;
}
#wemd .wemd-image-caption .wemd-st-desc {
  margin: 12px 0 0;
  font-size: 14.5px;
  line-height: 1.9;
  color: ${TEXT};
}
/* 民宿推荐理由里的重点词：暖木加粗 */
#wemd .wemd-image-caption .wemd-st-desc strong {
  color: ${WOOD};
  font-weight: 700;
}
#wemd .wemd-image-caption .wemd-st-tags {
  margin: 14px 0 0;
  font-size: 12px;
  letter-spacing: 0.02em;
  color: ${SAGE};
  text-align: left;
}

/* === 落款（end-card：短线 + 署名 + 日期） === */
#wemd .wemd-end-card {
  margin: 3em 0 1em;
  padding: 0;
  background: transparent;
  border: none;
  border-radius: 0;
}
#wemd .wemd-end-card .wemd-st-signoff {
  padding: 10px 0 0;
  text-align: center;
}
#wemd .wemd-end-card .wemd-st-signoff-rule {
  display: block;
  width: 48px;
  height: 3px;
  background: ${WOOD};
  margin: 0 auto 22px;
  border-radius: 3px;
}
#wemd .wemd-end-card .wemd-st-signoff-name {
  margin: 0;
  font-family: "Noto Serif SC", "Songti SC", "STSong", "PingFang SC", serif;
  font-weight: 700;
  font-size: 16px;
  letter-spacing: 0.28em;
  color: ${INK};
  text-align: center;
}
#wemd .wemd-end-card .wemd-st-signoff-date {
  margin: 12px 0 0;
  font-family: "PingFang SC", "Microsoft YaHei", "Noto Sans SC", sans-serif;
  font-size: 10.5px;
  letter-spacing: 0.28em;
  color: ${TEXT_SOFT};
  text-align: center;
}

/* === 分隔线（divider：细线） === */
#wemd .wemd-divider {
  margin: 2.4em 0;
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

/* === 引用 / 主人话（中和共享伪元素竖条，暖奶油块） === */
#wemd .wemd-pullquote {
  margin: 2.4em 0;
  padding: 0;
  background: transparent;
  border-left: none;
  border-radius: 0;
}
#wemd .wemd-pullquote .wemd-component-body blockquote,
#wemd .wemd-pullquote .wemd-component-body p {
  margin: 0;
  font-size: 17px;
  line-height: 2;
  color: ${INK};
  text-align: center;
}
#wemd .wemd-quote-card {
  margin: 2em 0;
  padding: 0;
  background: transparent;
  border-left: none;
  border-radius: 16px;
}
#wemd .wemd-quote-card .wemd-component-body {
  padding: 24px 22px;
  background: ${CREAM};
  border: 1px solid ${LINE};
  border-radius: 16px;
}
#wemd .wemd-quote-card .wemd-component-body p {
  margin: 0;
  font-size: 15.5px;
  line-height: 1.95;
  color: ${INK};
}
#wemd .wemd-callout-pro::before,
#wemd .wemd-callout::before {
  content: none;
}

/* === 代码 / 表格（暖纸浅底） === */
#wemd pre code.hljs {
  display: block;
  padding: 18px 20px;
  background: ${CREAM};
  color: ${TEXT};
  border: 1px solid ${LINE};
  border-radius: 8px;
  font-size: 13.5px;
  line-height: 1.7;
  white-space: pre;
  overflow-x: auto;
}
#wemd .wemd-styled-table,
#wemd table {
  border-collapse: collapse;
  margin: 2.2em 0;
  width: 100%;
}
#wemd .wemd-styled-table th,
#wemd table th {
  background: ${CREAM};
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