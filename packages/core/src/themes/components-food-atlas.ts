/**
 * 美食图谱主题 - 皮肤（FOOD ATLAS）
 *
 * 设计：现代美食推荐风——暖橙主调 + 圆角卡片 + TOP 排名徽章 + 标签
 * - 封面：暖橙标语块 + 大标题叠图（background-image + 右侧压暗渐变，文字正常流）
 * - 美食卡：全幅图 + 左上 TOP 徽章 + 菜名 + 门店 + 标签 + 描述
 * - 无整篇背景、无伪元素（仅用 content:none 中和共享伪元素装饰）、无按钮式互动
 */
const ORANGE = "#e87525";
const ORANGE_DEEP = "#d96a24";
const ORANGE_SOFT = "#fff8f1";
const CREAM = "#fffaf5";
const INK = "#34251d";
const TEXT = "#4a3a2f";
const TEXT_SOFT = "#7b6253";
const LINE = "#f1dfd0";
const TAG_LINE = "#f1c8a6";

export const componentStylesFoodAtlas = `/* === 美食图谱（Food Atlas）组件样式 === */

/* 全局：无衬线正文 + 标题粗黑，暖白承载 */
#wemd {
  font-family: "PingFang SC", "Microsoft YaHei", "Noto Sans SC", -apple-system, sans-serif;
  color: ${TEXT};
  font-size: 15.5px;
  line-height: 1.85;
  letter-spacing: 0.01em;
}
#wemd p {
  margin: 0 0 1.4em;
  color: ${TEXT};
  font-size: 15.5px;
  line-height: 1.85;
  text-align: justify;
}
#wemd p b,
#wemd p strong {
  color: ${ORANGE};
  font-weight: 700;
}
#wemd em {
  font-style: normal;
  color: ${INK};
  font-weight: 600;
}
#wemd a {
  color: ${ORANGE};
  text-decoration: none;
  border-bottom: 1px solid ${ORANGE};
}

/* === 标题（无衬线粗黑，暖橙 / 墨黑） === */
#wemd h1 .content {
  font-family: "PingFang SC", "Microsoft YaHei", "Noto Sans SC", sans-serif;
  font-size: 26px;
  font-weight: 800;
  letter-spacing: 0.02em;
  color: ${INK};
}
#wemd h2 .content {
  font-family: "PingFang SC", "Microsoft YaHei", "Noto Sans SC", sans-serif;
  font-size: 22px;
  font-weight: 800;
  letter-spacing: 0.02em;
  color: ${INK};
}
#wemd h3 .content {
  font-family: "PingFang SC", "Microsoft YaHei", "Noto Sans SC", sans-serif;
  font-size: 18px;
  font-weight: 700;
  color: ${INK};
}
#wemd h4 .content {
  font-family: "PingFang SC", "Microsoft YaHei", "Noto Sans SC", sans-serif;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: ${ORANGE};
}
#wemd h1, #wemd h2, #wemd h3, #wemd h4 {
  margin: 36px 0 16px;
}
#wemd h2, #wemd h3 {
  padding-bottom: 10px;
  border-bottom: 3px solid ${ORANGE};
}

/* === 列表（保留原生 disc，暖橙 marker 由浏览器提供） === */
#wemd ul {
  margin: 1.4em 0;
  padding: 0 0 0 1.3em;
}
#wemd ul li {
  margin-bottom: 0.6em;
  font-size: 15px;
  line-height: 1.9;
  color: ${TEXT_SOFT};
}

/* === 封面（background-image + 右侧压暗渐变，文字正常流锚底部/左侧） ===
   公众号会删除 position，禁止绝对定位叠字；封面图用 background-image +
   右侧渐变压暗，文字正常流中靠 padding-top 压出图区、锚在底部。 */
#wemd .wemd-magazine-cover {
  margin: 0 0 2.2em;
  padding: 0;
  background: transparent;
  border: none;
  border-radius: 0;
  box-shadow: none;
  text-align: left;
}
#wemd .wemd-magazine-cover .wemd-fa-cover {
  padding: 46% 24px 32px;
  border-radius: 16px;
  overflow: hidden;
}
#wemd .wemd-magazine-cover .wemd-fa-hero-eyebrow {
  display: inline-block;
  margin: 0;
  padding: 6px 16px;
  border: 1px solid rgba(255,218,169,0.7);
  border-radius: 30px;
  color: #ffd49b;
  font-family: "PingFang SC", "Microsoft YaHei", sans-serif;
  font-size: 13px;
  letter-spacing: 0.12em;
  text-align: left;
}
#wemd .wemd-magazine-cover .wemd-fa-hero-title {
  margin: 20px 0 12px;
  font-family: "Noto Serif SC", "Songti SC", "STSong", "PingFang SC", serif;
  font-weight: 700;
  font-size: clamp(28px, 6.2vw, 44px);
  line-height: 1.2;
  letter-spacing: 0.04em;
  color: #fff;
  padding: 0;
  border: none;
}
#wemd .wemd-magazine-cover .wemd-fa-hero-title b,
#wemd .wemd-magazine-cover .wemd-fa-hero-title strong,
#wemd .wemd-magazine-cover .wemd-fa-hero-title em {
  color: inherit;
  font-style: inherit;
}
#wemd .wemd-magazine-cover .wemd-fa-hero-desc {
  margin: 16px 0 0;
  max-width: 82%;
  font-size: clamp(13px, 2vw, 15px);
  letter-spacing: 0.04em;
  line-height: 1.85;
  color: rgba(248,238,229,0.92);
  text-align: left;
}
#wemd .wemd-magazine-cover .wemd-fa-hero-desc strong,
#wemd .wemd-magazine-cover .wemd-fa-hero-desc em {
  color: inherit;
  font-style: inherit;
}

/* === 引言（text-card：kicker 暖橙 + 大字引言） === */
#wemd .wemd-text-card {
  margin: 2em 0 2.2em;
  padding: 28px 24px;
  background: ${CREAM};
  border: 1px solid ${LINE};
  border-radius: 16px;
}
#wemd .wemd-text-card .wemd-fa-intro-tag {
  display: inline-block;
  margin: 0 0 14px;
  padding: 4px 12px;
  background: ${ORANGE_SOFT};
  border: 1px solid ${TAG_LINE};
  border-radius: 20px;
  color: ${ORANGE_DEEP};
  font-family: "PingFang SC", "Microsoft YaHei", sans-serif;
  font-size: 12px;
  letter-spacing: 0.1em;
}
#wemd .wemd-text-card .wemd-fa-intro-text {
  margin: 0;
  font-size: 17px;
  line-height: 1.9;
  font-weight: 600;
  color: ${INK};
}
#wemd .wemd-text-card .wemd-fa-intro-text strong {
  color: ${ORANGE};
}

/* === 美食卡（image-caption：图 + TOP 徽章 + 菜名 + 门店 + 标签 + 描述） ===
   图片作 background-image；排名徽章正常流顶部左上角，fill 撑出图区；
   菜名/门店/标签/描述在正常流中。无 position（公众号兼容）。 */
#wemd .wemd-image-caption {
  margin: 2em 0;
  padding: 0;
  background: transparent;
  border: none;
  border-radius: 0;
  text-align: left;
}
#wemd .wemd-image-caption .wemd-fa-dish {
  background: #fff;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 6px 22px rgba(87,52,28,0.1);
}
#wemd .wemd-image-caption .wemd-fa-dish-fig {
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}
#wemd .wemd-image-caption .wemd-fa-dish-rank {
  display: inline-block;
  margin: 16px 0 0 16px;
  background: ${ORANGE};
  color: #fff;
  font-family: Georgia, "Times New Roman", serif;
  font-weight: 700;
  font-size: 15px;
  padding: 5px 15px;
  border-radius: 7px;
  letter-spacing: 0.04em;
}
#wemd .wemd-image-caption .wemd-fa-dish-fill {
  margin: 0;
  font-size: 0;
  line-height: 0;
  padding-top: 52%;
}
#wemd .wemd-image-caption .wemd-fa-dish-name {
  margin: 20px 20px 0;
  font-family: "Noto Serif SC", "Songti SC", "STSong", "PingFang SC", serif;
  font-size: 24px;
  font-weight: 700;
  color: ${INK};
  padding: 0;
  border: none;
}
#wemd .wemd-image-caption .wemd-fa-dish-location {
  margin: 8px 20px 0;
  font-size: 13px;
  line-height: 1.6;
  color: ${ORANGE_DEEP};
  text-align: left;
}
#wemd .wemd-image-caption .wemd-fa-dish-tags {
  margin: 12px 20px 0;
  font-size: 13px;
  line-height: 1.8;
  color: ${ORANGE_DEEP};
  text-align: left;
}
#wemd .wemd-image-caption .wemd-fa-dish-desc {
  margin: 12px 20px 22px;
  font-size: 14.5px;
  line-height: 1.9;
  color: ${TEXT_SOFT};
}
/* 描述里的重点词：墨黑加粗（区别于内联暖橙 strong） */
#wemd .wemd-image-caption .wemd-fa-dish-desc strong {
  color: ${INK};
  font-weight: 700;
}

/* === 落款（end-card：短线 + 署名 + 日期，居中） === */
#wemd .wemd-end-card {
  margin: 3em 0 1em;
  padding: 0;
  background: transparent;
  border: none;
  border-radius: 0;
}
#wemd .wemd-end-card .wemd-fa-signoff {
  padding: 10px 0 0;
  text-align: center;
}
#wemd .wemd-end-card .wemd-fa-signoff-rule {
  display: block;
  width: 54px;
  height: 3px;
  background: ${ORANGE};
  margin: 0 auto 24px;
  border-radius: 5px;
}
#wemd .wemd-end-card .wemd-fa-signoff-name {
  margin: 0;
  font-family: "PingFang SC", "Microsoft YaHei", sans-serif;
  font-weight: 800;
  font-size: 16px;
  letter-spacing: 0.2em;
  color: ${INK};
  text-align: center;
}
#wemd .wemd-end-card .wemd-fa-signoff-date {
  margin: 12px 0 0;
  font-family: "PingFang SC", "Microsoft YaHei", sans-serif;
  font-size: 11px;
  letter-spacing: 0.2em;
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

/* === 引用 / 对话（中和共享伪元素竖条，暖白块） === */
#wemd .wemd-pullquote {
  margin: 2.2em 0;
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
  border-radius: 16px;
}
#wemd .wemd-callout .wemd-component-body {
  padding: 22px 24px;
  background: ${ORANGE_SOFT};
  border: 1px solid ${TAG_LINE};
  border-radius: 16px;
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

/* === 代码 / 表格（暖白浅底） === */
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
  background: ${ORANGE_SOFT};
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