/**
 * 好物种草主题 - 皮肤（SHOPPING GUIDE）
 *
 * 设计：温暖日杂买手感——暖米纸承载、实物摄影、编号标签、珊瑚橘价格签。
 * - 封面：图 + 深色渐变遮罩 + kicker/大标题/副题叠层（遮罩是带背景的空 span，真实元素）
 * - 好物：全幅产品图 + 左上编号标签 + 右下珊瑚橘价格签 + 名称 + 推荐理由
 * - 无整篇背景、无伪元素（仅用 content:none 中和共享伪元素装饰）、无按钮式互动
 */
const PAPER = "#faf6ef";
const PAPER_DEEP = "#f4ecdd";
const INK = "#2a2520";
const TEXT = "#3a332c";
const TEXT_SOFT = "#8a7f72";
const ACCENT = "#d9583b";
const ACCENT_SOFT = "#f6e5dc";
const LINE = "#e5ddd0";

export const componentStylesShoppingGuide = `/* === 好物种草（Shopping Guide）组件样式 === */

/* 全局：正文衬线 + 标题无衬线，暖纸白承载 */
#wemd {
  font-family: "Noto Serif SC", "Songti SC", "SimSun", "Source Han Serif SC", Georgia, serif;
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
  color: ${ACCENT};
  font-weight: 700;
}
#wemd em {
  font-style: normal;
  color: ${INK};
  font-weight: 600;
}
#wemd a {
  color: ${ACCENT};
  text-decoration: none;
  border-bottom: 1px solid ${ACCENT};
}

/* === 标题（无衬线粗黑） === */
#wemd h1 .content {
  font-family: "PingFang SC", "Microsoft YaHei", "Noto Sans SC", sans-serif;
  font-size: 28px;
  font-weight: 800;
  letter-spacing: 0.02em;
  color: ${INK};
}
#wemd h2 .content {
  font-family: "PingFang SC", "Microsoft YaHei", "Noto Sans SC", sans-serif;
  font-size: 23px;
  font-weight: 800;
  letter-spacing: 0.02em;
  color: ${INK};
}
#wemd h3 .content {
  font-family: "PingFang SC", "Microsoft YaHei", "Noto Sans SC", sans-serif;
  font-size: 18px;
  font-weight: 800;
  color: ${INK};
}
#wemd h4 .content {
  font-family: "PingFang SC", "Microsoft YaHei", "Noto Sans SC", sans-serif;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.1em;
  color: ${ACCENT};
}
#wemd h1, #wemd h2, #wemd h3, #wemd h4 {
  margin: 40px 0 16px;
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
  color: ${TEXT_SOFT};
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
/* 图区高度：padding-top 百分比相对容器宽度，背景 cover 铺满；文字正常流接在其后 */
#wemd .wemd-magazine-cover .wemd-sg-cover {
  padding: 52% 24px 30px;
  border-radius: 4px;
  overflow: hidden;
}
#wemd .wemd-magazine-cover .wemd-sg-cover-kicker {
  margin: 0 0 16px;
  font-family: "PingFang SC", "Microsoft YaHei", "Noto Sans SC", sans-serif;
  font-size: 11.5px;
  letter-spacing: 0.42em;
  color: #f2a48c;
  text-align: left;
}
#wemd .wemd-magazine-cover .wemd-sg-cover-title {
  margin: 0;
  font-family: "PingFang SC", "Microsoft YaHei", "Noto Sans SC", sans-serif;
  font-weight: 800;
  font-size: clamp(28px, 6vw, 44px);
  line-height: 1.18;
  letter-spacing: 0.02em;
  color: #f7f1e6;
}
#wemd .wemd-magazine-cover .wemd-sg-cover-title b,
#wemd .wemd-magazine-cover .wemd-sg-cover-title strong,
#wemd .wemd-magazine-cover .wemd-sg-cover-title em {
  color: inherit;
  font-style: inherit;
}
#wemd .wemd-magazine-cover .wemd-sg-cover-sub {
  margin: 14px 0 0;
  font-size: clamp(13px, 2vw, 15px);
  letter-spacing: 0.06em;
  line-height: 1.9;
  color: rgba(247,241,230,0.82);
  text-align: left;
}
#wemd .wemd-magazine-cover .wemd-sg-cover-sub strong,
#wemd .wemd-magazine-cover .wemd-sg-cover-sub em {
  color: inherit;
  font-style: inherit;
}

/* === 引言（text-card：kicker 小标 + 大字引言） === */
#wemd .wemd-text-card {
  margin: 2em 0 2.4em;
  padding: 26px 24px;
  background: ${PAPER};
  border: 1px solid ${LINE};
  border-radius: 4px;
}
#wemd .wemd-text-card .wemd-sg-intro-tag {
  font-family: "PingFang SC", "Microsoft YaHei", "Noto Sans SC", sans-serif;
  font-size: 11px;
  letter-spacing: 0.36em;
  color: ${ACCENT};
  margin: 0 0 14px;
}
#wemd .wemd-text-card .wemd-sg-intro-text {
  margin: 0;
  font-size: 17.5px;
  line-height: 2;
  font-weight: 600;
  color: ${INK};
}
#wemd .wemd-text-card .wemd-sg-intro-text strong {
  color: ${ACCENT};
}

/* === 好物（image-caption：图 + 编号标签 + 价格签 + 名称 + 理由） ===
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
#wemd .wemd-image-caption .wemd-sg-item-fig {
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  overflow: hidden;
  border-radius: 4px;
  box-shadow: 0 14px 40px rgba(42,37,32,0.12);
}
#wemd .wemd-image-caption .wemd-sg-item-no {
  display: inline-block;
  margin: 16px 0 0 16px;
  background: rgba(250,246,239,0.94);
  color: ${ACCENT};
  font-family: "PingFang SC", "Microsoft YaHei", "Noto Sans SC", sans-serif;
  font-weight: 800;
  font-size: 12px;
  letter-spacing: 0.16em;
  padding: 6px 12px;
  border-radius: 2px;
}
/* 图区高度：padding-top 百分比相对容器宽度，背景 cover 铺满（无 position 叠字）。
   &nbsp; 为真实内容防公众号删空元素，font-size/line-height 0 隐形 */
#wemd .wemd-image-caption .wemd-sg-item-fill {
  margin: 0;
  font-size: 0;
  line-height: 0;
  padding-top: 56%;
}
#wemd .wemd-image-caption .wemd-sg-item-price-row {
  margin: 0;
  padding: 0 16px 16px;
  text-align: right;
}
#wemd .wemd-image-caption .wemd-sg-item-price {
  display: inline-block;
  background: ${ACCENT};
  color: #fff;
  font-family: "PingFang SC", "Microsoft YaHei", "Noto Sans SC", sans-serif;
  font-weight: 700;
  font-size: 13.5px;
  padding: 7px 14px;
  border-radius: 2px;
  letter-spacing: 0.04em;
}
#wemd .wemd-image-caption .wemd-sg-item-title {
  margin: 18px 0 0;
  font-family: "PingFang SC", "Microsoft YaHei", "Noto Sans SC", sans-serif;
  font-weight: 800;
  font-size: 21px;
  letter-spacing: 0.02em;
  color: ${INK};
}
#wemd .wemd-image-caption .wemd-sg-item-desc {
  margin: 10px 0 0;
  font-size: 15px;
  line-height: 2;
  color: ${TEXT_SOFT};
}
/* 好物推荐理由里的重点词：墨黑加粗（区别于正文的珊瑚橘 strong） */
#wemd .wemd-image-caption .wemd-sg-item-desc strong {
  color: ${INK};
  font-weight: 700;
}

/* === 落款（end-card：短线 + 署名 + 日期） === */
#wemd .wemd-end-card {
  margin: 3em 0 1em;
  padding: 0;
  background: transparent;
  border: none;
  border-radius: 0;
}
#wemd .wemd-end-card .wemd-sg-signoff {
  padding: 10px 0 0;
  text-align: center;
}
#wemd .wemd-end-card .wemd-sg-signoff-rule {
  display: block;
  width: 52px;
  height: 2px;
  background: ${ACCENT};
  margin: 0 auto 24px;
}
#wemd .wemd-end-card .wemd-sg-signoff-name {
  margin: 0;
  font-family: "PingFang SC", "Microsoft YaHei", "Noto Sans SC", sans-serif;
  font-weight: 800;
  font-size: 15px;
  letter-spacing: 0.3em;
  color: ${INK};
  text-align: center;
}
#wemd .wemd-end-card .wemd-sg-signoff-date {
  margin: 12px 0 0;
  font-family: "PingFang SC", "Microsoft YaHei", "Noto Sans SC", sans-serif;
  font-size: 11px;
  letter-spacing: 0.3em;
  color: ${TEXT_SOFT};
  text-align: center;
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

/* === 引用 / 对话（中和共享伪元素竖条，暖纸块） === */
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
  line-height: 1.9;
  color: ${INK};
  text-align: center;
}
#wemd .wemd-callout {
  margin: 2em 0;
  padding: 0;
  background: transparent;
  border-left: none;
  border-radius: 0;
}
#wemd .wemd-callout .wemd-component-body {
  padding: 22px 24px;
  background: ${PAPER_DEEP};
}
#wemd .wemd-callout .wemd-component-body p {
  margin: 0;
  font-size: 15px;
  line-height: 1.9;
  color: ${TEXT};
}
#wemd .wemd-callout-pro::before {
  content: none;
}

/* === 代码 / 表格（暖纸浅底） === */
#wemd pre code.hljs {
  display: block;
  padding: 18px 20px;
  background: ${PAPER_DEEP};
  color: ${TEXT};
  border: 1px solid ${LINE};
  border-radius: 4px;
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
  background: ${PAPER_DEEP};
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
