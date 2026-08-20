/**
 * 留白画册 · 主题皮肤（极简画廊风）
 *
 * 设计语言：一面白墙挂画 ——
 *   纯白底 · 大量留白 · 墨黑 #1a1a1a 主色 · 发丝细线 #e3dfd6 · 鎏金 #b08d57 点缀。
 * 场景：品牌展示 / 作品集 / 设计感内容 / 画廊式长文。
 *
 * 微信约束：
 * - #wemd 不设整篇背景（背景交给公众号编辑器），纸感用极淡渐变表达。
 * - 装饰全部真实 DOM / 边框 / 渐变，无伪元素、无结构伪类；
 *   仅用 `content: none` 中和共享 ::before/::after（避免双线叠加）。
 * - 深色元素均配浅色字（颜色冲撞检查点）。
 * - code-frame 保持内置默认骨架与皮肤（本主题不定制代码块）。
 */

export const componentStylesWhitespaceGallery = `/* === 留白画册：极简画廊 · 全局皮肤 === */

/* 全局：衬线 + 墨黑 + 大留白（不写整篇背景色） */
#wemd {
  color: #1a1a1a;
  font-family: "Noto Serif SC", "Source Han Serif SC", "Songti SC", "STSong", "PingFang SC", serif;
  font-size: 16px;
  line-height: 2.1;
  letter-spacing: 0.03em;
  background-image: none;
}

/* 正文：大字大行距，读起来像印刷物 */
#wemd p {
  margin: 0 0 26px;
  color: #1a1a1a;
  font-size: 16px;
  line-height: 2.1;
  text-align: justify;
}

/* ---- 标题 ---- */
#wemd h1 {
  margin: 30px 0 42px;
  padding: 0 0 26px;
  border: none;
  border-bottom: 1px solid #e3dfd6;
  text-align: center;
}
#wemd h1 .content {
  font-family: "Noto Serif SC", "Source Han Serif SC", "Songti SC", "STSong", serif;
  color: #111111;
  font-size: 30px;
  font-weight: 300;
  line-height: 1.5;
  letter-spacing: 0.06em;
  text-wrap: balance;
}

/* h2：墨黑 + 底部发丝线 */
#wemd h2 {
  margin: 56px 0 24px;
  padding: 0 0 14px;
  border: none;
  border-bottom: 1px solid #e3dfd6;
  text-align: left;
}
#wemd h2 .content {
  font-family: "Noto Serif SC", "Source Han Serif SC", "Songti SC", "STSong", serif;
  color: #111111;
  font-size: 23px;
  font-weight: 400;
  letter-spacing: 0.05em;
  text-wrap: balance;
}

/* 章节标题组件（## 标题）——去掉共享 left-border 卡片皮肤 */
#wemd .wemd-section-title {
  padding: 0;
  background: transparent;
  border-left: none;
  border-radius: 0;
}
#wemd .wemd-section-title .wemd-component-body > h2 {
  margin-top: 52px;
  margin-right: 0;
  margin-bottom: 24px;
  margin-left: 0;
  padding-top: 0;
  padding-right: 0;
  padding-bottom: 14px;
  padding-left: 0;
  border-top: none;
  border-right: none;
  border-bottom: 1px solid #e3dfd6;
  border-left: none;
  font-family: "Noto Serif SC", "Source Han Serif SC", "Songti SC", "STSong", serif;
  font-size: 23px;
  font-weight: 400;
  color: #111111;
  letter-spacing: 0.05em;
  text-align: left;
}

/* h3 / h4：鎏金小标 / 暖灰 */
#wemd h3 {
  margin: 38px 0 18px;
  padding: 0;
  border: none;
  text-align: left;
}
#wemd h3 .content {
  color: #b08d57;
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-wrap: balance;
}
#wemd h4 {
  margin: 28px 0 14px;
  padding: 0;
  border: none;
  text-align: left;
}
#wemd h4 .content {
  color: #6b6b6b;
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0.08em;
}

/* ============================================================
   组件级差异化（覆盖共享组件样式，全部真实元素 / 边框表达）
   ============================================================ */

/* === magazine-cover · 画册封面（骨架定制） === */
#wemd .wemd-magazine-cover {
  position: relative;
  margin: 0 0 44px;
  padding: 58px 30px 48px;
  background: linear-gradient(180deg, #fbfaf7, #f5f2ec);
  border: 1px solid #e3dfd6;
  border-radius: 2px;
  text-align: center;
  overflow: hidden;
}
#wemd .wemd-wg-frame {
  position: absolute;
  top: 12px;
  right: 12px;
  bottom: 12px;
  left: 12px;
  border: 1px solid #e3dfd6;
  pointer-events: none;
}
#wemd .wemd-magazine-cover .wemd-wg-kicker {
  position: relative;
  font-family: "SF Mono", "Cascadia Code", Consolas, Menlo, monospace;
  font-size: 11px;
  letter-spacing: 0.32em;
  text-transform: uppercase;
  color: #b08d57;
}
#wemd .wemd-magazine-cover .wemd-wg-title {
  position: relative;
  margin-top: 22px;
  font-family: "Noto Serif SC", "Source Han Serif SC", "Songti SC", "STSong", serif;
  font-size: 30px;
  font-weight: 300;
  line-height: 1.5;
  letter-spacing: 0.08em;
  color: #111111;
}
#wemd .wemd-magazine-cover .wemd-wg-rule {
  position: relative;
  display: block;
  width: 56px;
  height: 1px;
  margin: 24px auto 0;
  background: #b08d57;
}
#wemd .wemd-magazine-cover .wemd-wg-desc {
  position: relative;
  margin-top: 18px;
  font-size: 13.5px;
  line-height: 2;
  color: #6b6b6b;
}

/* === section-divider · 章节牌（骨架定制） === */
#wemd .wemd-section-divider {
  margin: 52px 0 26px;
  text-align: center;
}
#wemd .wemd-section-divider .wemd-wg-part {
  display: inline-block;
  font-family: "SF Mono", "Cascadia Code", Consolas, Menlo, monospace;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.3em;
  color: #b08d57;
}
#wemd .wemd-section-divider .wemd-wg-title {
  margin-top: 10px;
  font-family: "Noto Serif SC", "Source Han Serif SC", "Songti SC", "STSong", serif;
  font-size: 24px;
  font-weight: 300;
  line-height: 1.5;
  letter-spacing: 0.08em;
  color: #111111;
}
#wemd .wemd-section-divider .wemd-wg-rule {
  display: block;
  width: 48px;
  height: 1px;
  margin: 18px auto 0;
  background: #c9bfae;
}

/* === divider · 发丝线 + 鎏金 ◆（骨架定制） === */
#wemd .wemd-divider {
  margin: 44px 0;
}
#wemd .wemd-divider .wemd-component-body {
  display: flex;
  align-items: center;
  gap: 18px;
}
/* 中和共享 ::before/::after 实线，避免骨架发丝线与其叠加成双线 */
#wemd .wemd-divider .wemd-component-body::before,
#wemd .wemd-divider .wemd-component-body::after {
  content: none;
}
#wemd .wemd-wg-line {
  flex: 1;
  height: 1px;
  background: #e3dfd6;
}
#wemd .wemd-wg-glyph {
  color: #b08d57;
  font-size: 12px;
}

/* === divider-fancy · 画廊装饰线（骨架定制） === */
#wemd .wemd-divider-fancy {
  margin: 44px 0;
}
#wemd .wemd-divider-fancy .wemd-df-label .wemd-df-line {
  height: 1px;
  background: linear-gradient(to right, transparent, #d8d2c6, transparent);
}
#wemd .wemd-divider-fancy .wemd-df-label .wemd-df-dots {
  color: #b08d57;
  font-size: 14px;
  letter-spacing: 0.3em;
}
#wemd .wemd-divider-fancy .wemd-df-label .wemd-df-text {
  font-family: "SF Mono", "Cascadia Code", Consolas, Menlo, monospace;
  font-size: 12px;
  letter-spacing: 0.2em;
  color: #6b6b6b;
  text-transform: uppercase;
}

/* === pullquote · 发丝线框引语（去共享粗条与底色） === */
#wemd .wemd-pullquote {
  margin: 40px 0;
  padding: 30px 24px;
  background: transparent;
  border: 1px solid #e3dfd6;
  border-left: 1px solid #e3dfd6;
  border-radius: 2px;
}
#wemd .wemd-pullquote .wemd-component-body blockquote p {
  font-family: "Noto Serif SC", "Source Han Serif SC", "Songti SC", "STSong", serif;
  font-size: 18px;
  line-height: 2;
  color: #1a1a1a;
  font-weight: 400;
}

/* === quote-card · 画框金句（细框 + 居中衬线，作者鎏金小标） === */
#wemd .wemd-quote-card {
  margin: 40px 0;
  padding: 36px 28px;
  background: transparent;
  border: 1px solid #e3dfd6;
  border-left: 1px solid #e3dfd6;
  border-radius: 2px;
  box-shadow: none;
  text-align: center;
}
#wemd .wemd-quote-card .wemd-qc-quote {
  font-family: "Noto Serif SC", "Source Han Serif SC", "Songti SC", "STSong", serif;
  font-size: 20px;
  line-height: 2;
  color: #111111;
  font-weight: 400;
  letter-spacing: 0.04em;
  text-align: center;
}
#wemd .wemd-quote-card .wemd-qc-author {
  margin-top: 18px;
  font-family: "SF Mono", "Cascadia Code", Consolas, Menlo, monospace;
  font-size: 11px;
  letter-spacing: 0.24em;
  color: #b08d57;
  text-transform: uppercase;
}

/* === full-quote · 大幅引言（暖纸底 + 发丝框，墨字） === */
#wemd .wemd-full-quote {
  margin: 40px 0;
  padding: 38px 28px;
  background: #f7f5f1;
  border: 1px solid #e3dfd6;
  border-radius: 2px;
  text-align: center;
}
#wemd .wemd-full-quote .wemd-fq-text {
  font-family: "Noto Serif SC", "Source Han Serif SC", "Songti SC", "STSong", serif;
  font-size: 19px;
  line-height: 2;
  color: #1a1a1a;
  letter-spacing: 0.04em;
}

/* === text-card · 正文卡片去整块底色，仅暖纸底 + 发丝框 === */
#wemd .wemd-text-card {
  margin: 32px 0;
  padding: 28px 30px;
  background: #fbfaf7;
  border: 1px solid #e3dfd6;
  border-radius: 2px;
  box-shadow: none;
  font-size: 15.5px;
  line-height: 2.1;
  color: #1a1a1a;
}
#wemd .wemd-text-card p {
  margin: 0 0 16px;
  color: #1a1a1a;
}
#wemd .wemd-text-card p b {
  color: #111111;
}

/* === image-card / image-grid / image-compare · 画框画廊 === */
#wemd .wemd-image-card {
  margin: 40px 0;
  padding: 10px;
  background: #ffffff;
  border: 1px solid #e3dfd6;
  border-radius: 2px;
  box-shadow: none;
}
#wemd .wemd-image-card .wemd-ic-image img {
  border-radius: 0;
}
#wemd .wemd-image-card .wemd-ic-caption {
  margin: 12px 4px 4px;
  font-family: "SF Mono", "Cascadia Code", Consolas, Menlo, monospace;
  font-size: 11px;
  letter-spacing: 0.14em;
  color: #9a958d;
}
#wemd .wemd-image-grid {
  margin: 36px 0;
}
#wemd .wemd-image-grid .wemd-component-body p img {
  border: 1px solid #e3dfd6;
  border-radius: 0;
}
#wemd .wemd-image-compare .wemd-component-body figure {
  border: 1px solid #e3dfd6;
  border-radius: 0;
}
#wemd .wemd-image-compare .wemd-component-body figure img {
  border-radius: 0;
}

/* === image-text-row · 图文横排（发丝框） === */
#wemd .wemd-image-text-row {
  margin: 32px 0;
  background: transparent;
  border: 1px solid #e3dfd6;
  border-radius: 2px;
  padding: 18px;
}
#wemd .wemd-image-text-row .wemd-component-body p {
  color: #1a1a1a;
}

/* === image-caption · 画廊图注（鎏金小标） === */
#wemd .wemd-image-caption .wemd-component-body p {
  font-family: "SF Mono", "Cascadia Code", Consolas, Menlo, monospace;
  font-size: 11px;
  letter-spacing: 0.14em;
  color: #9a958d;
  font-style: normal;
}
#wemd .wemd-image-caption .wemd-component-body p em {
  color: #9a958d;
  font-style: normal;
}

/* === stats-block · 数据画廊（发丝框 + tabular 数字） === */
#wemd .wemd-stats-block {
  margin: 36px 0;
  padding: 0;
  background: transparent;
  border: none;
  border-radius: 0;
}
#wemd .wemd-stats-block .wemd-sb-items {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  gap: 14px;
  flex-wrap: wrap;
}
#wemd .wemd-stats-block .wemd-sb-items-item {
  flex: 1;
  min-width: 150px;
  margin: 0;
  padding: 22px 20px;
  background: #fbfaf7;
  border: 1px solid #e3dfd6;
  border-radius: 2px;
  box-shadow: none;
}
#wemd .wemd-stats-block .wemd-sb-items-value {
  color: #111111;
  font-family: "SF Mono", "Cascadia Code", Consolas, Menlo, monospace;
  font-size: 30px;
  font-weight: 400;
  line-height: 1.2;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.02em;
}
#wemd .wemd-stats-block .wemd-sb-items-label {
  margin-top: 8px;
  font-size: 12px;
  letter-spacing: 0.08em;
  color: #9a958d;
  line-height: 1.6;
}

/* === timeline · 画廊时间线（发丝线 + 鎏金点） === */
#wemd .wemd-timeline {
  margin: 32px 0;
  padding: 28px 26px;
  background: transparent;
  border: 1px solid #e3dfd6;
  border-radius: 2px;
}
#wemd .wemd-timeline .wemd-tl-title {
  font-family: "Noto Serif SC", "Source Han Serif SC", "Songti SC", "STSong", serif;
  font-size: 16px;
  font-weight: 600;
  color: #111111;
  letter-spacing: 0.08em;
  margin-bottom: 14px;
}
#wemd .wemd-timeline .wemd-tl-events {
  border-left: 1px solid #e3dfd6;
  margin-left: 6px;
}
#wemd .wemd-timeline .wemd-tl-dot {
  background: #b08d57;
  border: 2px solid #ffffff;
  box-shadow: 0 0 0 2px #e3dfd6;
}
#wemd .wemd-timeline .wemd-tl-text {
  color: #3a3a3a;
}

/* === styled-table · 画廊表格（发丝行线） === */
#wemd .wemd-styled-table .wemd-sbt-table {
  border: 1px solid #e3dfd6;
  border-radius: 2px;
  overflow: hidden;
  background: #ffffff;
}
#wemd .wemd-styled-table .wemd-sbt-table table th {
  background: #fbfaf7;
  color: #111111;
  font-weight: 700;
  text-align: left;
  padding: 13px 16px;
  font-size: 13px;
  letter-spacing: 0.1em;
  border-bottom: 1px solid #e3dfd6;
}
#wemd .wemd-styled-table .wemd-sbt-table table td {
  padding: 13px 16px;
  border-top: 1px solid #efede7;
  font-family: "SF Mono", "Cascadia Code", Consolas, Menlo, monospace;
  font-size: 13px;
  color: #3a3a3a;
}

/* === callout / callout-pro · 画廊提示（发丝框 + 鎏金条） === */
#wemd .wemd-callout {
  margin: 30px 0;
  padding: 20px 22px;
  background: #fbfaf7;
  border: 1px solid #e3dfd6;
  border-left: 3px solid #b08d57;
  border-radius: 2px;
}
#wemd .wemd-callout .wemd-component-body > p {
  color: #3a3a3a;
  font-size: 15px;
  line-height: 2;
}
#wemd .wemd-callout .wemd-component-body > p.wemd-q b,
#wemd .wemd-callout .wemd-component-body > p strong {
  color: #b08d57;
}
#wemd .wemd-callout-pro {
  margin: 30px 0;
  padding: 20px 24px;
  background: #fbfaf7;
  border: 1px solid #e3dfd6;
  border-left: none;
  border-radius: 2px;
  box-shadow: none;
  transform: none;
}
#wemd .wemd-callout-pro .wemd-component-body > p {
  font-size: 15px;
  line-height: 2;
  color: #3a3a3a;
  margin: 0;
}
#wemd .wemd-callout-pro .wemd-component-body > p b {
  color: #111111;
}

/* === steps · 画册步骤（发丝框 + 墨黑序号） === */
#wemd .wemd-steps {
  margin: 28px 0;
  padding: 0;
  background: transparent;
  border: none;
  border-radius: 0;
}
#wemd .wemd-steps .wemd-component-body {
  padding: 0;
}
#wemd .wemd-steps .wemd-component-body > p:first-child {
  font-family: "Noto Serif SC", "Source Han Serif SC", "Songti SC", "STSong", serif;
  font-size: 17px;
  font-weight: 600;
  letter-spacing: 0.08em;
  color: #111111;
  margin: 0 0 16px;
}
#wemd .wemd-steps .wemd-component-body ol,
#wemd .wemd-steps .wemd-component-body ul {
  list-style: none;
  padding: 0;
  margin: 0;
}
#wemd .wemd-steps .wemd-component-body li {
  margin: 0 0 14px;
  padding: 18px 20px 18px 56px;
  background: #fbfaf7;
  border: 1px solid #e3dfd6;
  border-radius: 2px;
  font-size: 15px;
  line-height: 1.95;
  color: #1a1a1a;
}
#wemd .wemd-steps .wemd-component-body li strong {
  color: #b08d57;
}

/* === faq · 画廊问答（发丝框 + 墨黑挂角） === */
#wemd .wemd-faq {
  margin: 32px 0;
}
#wemd .wemd-faq .wemd-component-body {
  border: 1px solid #e3dfd6;
  background: #ffffff;
  box-shadow: none;
  border-radius: 2px;
  padding: 58px 26px 26px;
}
#wemd .wemd-faq .wemd-component-body > p.wemd-q {
  color: #111111;
  font-weight: 600;
}
#wemd .wemd-faq .wemd-component-body > p.wemd-q strong {
  color: #111111;
}
#wemd .wemd-faq .wemd-component-body > p {
  color: #3a3a3a;
}

/* === toc-nav · 画册目录（发丝框 + 鎏金编号） === */
#wemd .wemd-toc-nav {
  margin: 20px 0;
  padding: 26px 28px;
  background: #fbfaf7;
  border: 1px solid #e3dfd6;
  border-radius: 2px;
}
#wemd .wemd-toc-nav .wemd-component-body > p:first-child {
  font-family: "SF Mono", "Cascadia Code", Consolas, Menlo, monospace;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  color: #b08d57;
  margin: 0 0 16px;
}
#wemd .wemd-toc-nav .wemd-component-body ul,
#wemd .wemd-toc-nav .wemd-component-body ol {
  list-style: none;
  padding: 0;
  margin: 0;
}
#wemd .wemd-toc-nav .wemd-component-body li {
  padding: 12px 0;
  border-bottom: 1px dashed #e3dfd6;
  font-size: 15px;
  line-height: 1.8;
  color: #1a1a1a;
}
#wemd .wemd-toc-nav .wemd-component-body li span.toc-num {
  font-family: "SF Mono", "Cascadia Code", Consolas, Menlo, monospace;
  font-size: 11px;
  letter-spacing: 0.1em;
  color: #b08d57;
  min-width: 30px;
}

/* === end-card · 画廊落款（上下发丝线 + 等宽 FIN） === */
#wemd .wemd-end-card {
  margin: 56px 0 8px;
  padding: 44px 24px 40px;
  text-align: center;
  background: transparent;
  border-top: 1px solid #e3dfd6;
  border-bottom: 1px solid #e3dfd6;
  border-radius: 0;
  color: #111111;
}
#wemd .wemd-end-card .wemd-ec-title {
  font-family: "SF Mono", "Cascadia Code", Consolas, Menlo, monospace;
  font-size: 20px;
  font-weight: 400;
  letter-spacing: 0.4em;
  color: #111111;
  text-transform: uppercase;
}
#wemd .wemd-end-card .wemd-ec-subtitle {
  margin-top: 16px;
  font-family: "Noto Serif SC", "Source Han Serif SC", "Songti SC", "STSong", serif;
  font-size: 13px;
  letter-spacing: 0.24em;
  color: #9a958d;
}
#wemd .wemd-end-card .wemd-ec-deco {
  margin-top: 18px;
  font-size: 18px;
  color: #b08d57;
  opacity: 1;
}

/* === share-card · 分享提醒（顶发丝线） === */
#wemd .wemd-share-card {
  margin: 48px 0 28px;
  padding: 26px 16px 22px;
  text-align: center;
  border-top: 1px solid #e3dfd6;
}
#wemd .wemd-share-card .wemd-component-body p {
  color: #9a958d;
  font-size: 13px;
  letter-spacing: 0.08em;
}

/* === hero-banner · 画廊横幅（发丝框 + 大留白） === */
#wemd .wemd-hero-banner {
  margin: 0 0 40px;
  border-radius: 2px;
  border: 1px solid #e3dfd6;
}
#wemd .wemd-hero-banner .wemd-component-body {
  padding: 48px 32px;
  text-align: center;
}
#wemd .wemd-hero-banner .wemd-hb-title {
  font-family: "Noto Serif SC", "Source Han Serif SC", "Songti SC", "STSong", serif;
  font-size: 26px;
  font-weight: 300;
  letter-spacing: 0.06em;
  color: #111111;
  text-align: center;
}
#wemd .wemd-hero-banner .wemd-hb-subtitle {
  font-size: 14px;
  letter-spacing: 0.1em;
  color: #9a958d;
  text-align: center;
}

/* === cta-card · 画廊行动卡（白底发丝框 + 墨黑牌匾，不做按钮状） === */
#wemd .wemd-cta-card {
  margin: 40px 0;
  padding: 38px 28px;
  background: #ffffff;
  border: 1px solid #e3dfd6;
  border-radius: 2px;
  text-align: center;
  color: #111111;
}
#wemd .wemd-cta-card .wemd-cta-title {
  font-family: "Noto Serif SC", "Source Han Serif SC", "Songti SC", "STSong", serif;
  font-size: 19px;
  font-weight: 600;
  letter-spacing: 0.06em;
  color: #111111;
}
#wemd .wemd-cta-card .wemd-cta-body {
  font-size: 14px;
  line-height: 1.9;
  color: #6b6b6b;
}
#wemd .wemd-cta-card .wemd-cta-action {
  display: inline-block;
  padding: 6px 20px;
  background: transparent;
  border: 1px solid #1a1a1a;
  border-radius: 2px;
  font-size: 13px;
  letter-spacing: 0.12em;
  color: #1a1a1a;
  margin: 12px 0 0;
}

/* === follow-bar · 关注条（去按钮化，纯文字提醒） === */
#wemd .wemd-follow-bar {
  margin: 0 0 28px;
  padding: 14px 18px;
  background: #fbfaf7;
  border: 1px solid #e3dfd6;
  border-radius: 2px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #1a1a1a;
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
  font-size: 14px;
  font-weight: 500;
  color: #3a3a3a;
  flex: 1;
}
#wemd .wemd-follow-bar .wemd-component-body > p:first-child strong {
  color: #111111;
  font-weight: 600;
}
#wemd .wemd-follow-bar .wemd-component-body > p:last-child:not(:first-child) {
  margin: 0;
  padding: 0;
  background: transparent;
  border: none;
  border-radius: 0;
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 0.12em;
  color: #b08d57;
  flex-shrink: 0;
}

/* === brand-sign · 画廊品牌落款 === */
#wemd .wemd-brand-sign {
  margin: 40px 0;
  padding: 0;
}
#wemd .wemd-brand-sign .wemd-bs-wrapper {
  padding: 30px 24px;
  border: 1px solid #e3dfd6;
  border-radius: 2px;
  background: #fbfaf7;
}
#wemd .wemd-brand-sign .wemd-bs-brand-name {
  font-family: "Noto Serif SC", "Source Han Serif SC", "Songti SC", "STSong", serif;
  font-size: 22px;
  font-weight: 400;
  letter-spacing: 0.12em;
  color: #111111;
}
#wemd .wemd-brand-sign .wemd-bs-tagline {
  font-size: 13px;
  letter-spacing: 0.08em;
  color: #9a958d;
}
#wemd .wemd-brand-sign .wemd-bs-slogan {
  font-family: "SF Mono", "Cascadia Code", Consolas, Menlo, monospace;
  font-size: 11px;
  letter-spacing: 0.2em;
  color: #b08d57;
}
#wemd .wemd-brand-sign .wemd-bs-logo {
  color: #b08d57;
}
#wemd .wemd-brand-sign .wemd-bs-divider-dot {
  color: #b08d57;
}

/* === copyright-notice · 版权（去左侧条，仅顶发丝线） === */
#wemd .wemd-copyright-notice {
  margin: 28px 0;
  padding: 16px 18px;
  background: transparent;
  border-left: none;
  border-top: 1px solid #efede7;
  border-radius: 0;
  font-size: 12px;
}
#wemd .wemd-copyright-notice .wemd-component-body p {
  font-size: 12px;
  line-height: 1.8;
  color: #9a958d;
}

/* === resource-list / tag-label · 画廊清单与标签 === */
#wemd .wemd-resource-list {
  background: #fbfaf7;
  border: 1px solid #e3dfd6;
  border-radius: 2px;
}
#wemd .wemd-resource-list .wemd-rl-title {
  font-family: "Noto Serif SC", "Source Han Serif SC", "Songti SC", "STSong", serif;
  color: #111111;
}
#wemd .wemd-resource-list .wemd-rl-item {
  background: #ffffff;
  border: 1px solid #e3dfd6;
  border-radius: 2px;
}
#wemd .wemd-tag-label .wemd-component-body > p,
#wemd .wemd-tag-label .wemd-component-body li {
  background: #f7f5f1;
  color: #6b6b6b;
  border: 1px solid #e3dfd6;
  border-radius: 2px;
}
`;
