/**
 * 购物小票主题 - 皮肤（热敏小票 Thermal Receipt）
 *
 * 设计：一张刚从收银机撕下的热敏小票。
 * - 墨黑 ink #1f1d1a + 小票红 #cf2323 + 米沙 line #c9c4b5
 * - 等宽字体承载编号/金额/小票语言，中文正文用无衬线
 * - 虚线分隔、点线小票行、红色合计、双色热敏机质感
 * - 无整篇背景（#wemd 交给编辑器）；全部真实 DOM，无伪元素、无按钮式互动
 *
 * 变量策略：所有颜色用硬编码小票色板（热敏小票黑白红辨识度优先，不随主题漂移）。
 */

export const componentStylesReceipt = `/* === 购物小票（热敏小票）组件样式 === */

/* 全局：热敏纸般的中性底 + 墨黑文字，交给编辑器设底色 */
#wemd {
  color: #1f1d1a;
  font-family: "PingFang SC", "Microsoft YaHei", sans-serif;
  font-size: 14px;
  line-height: 1.9;
  letter-spacing: 0.02em;
  background-image: none;
}

#wemd p {
  margin: 0 0 14px;
  color: #1f1d1a;
  font-size: 14px;
  line-height: 1.9;
  text-align: justify;
}

#wemd p b,
#wemd p strong {
  color: #1f1d1a;
  font-weight: 700;
}

#wemd a {
  color: #cf2323;
  text-decoration: none;
  border-bottom: 1px dotted #cf2323;
}

/* === 标题（小票语言） === */
#wemd h1 {
  margin: 24px 0 14px;
  padding: 0 0 8px;
  border-bottom: 2px solid #1f1d1a;
  text-align: center;
}
#wemd h1 .content {
  font-family: "PingFang SC", "Microsoft YaHei", sans-serif;
  font-size: 24px;
  font-weight: 800;
  letter-spacing: 0.12em;
  color: #1f1d1a;
  text-align: center;
}

/* h2：居中 + 上下虚线带（小票栏目标签） */
#wemd h2 {
  margin: 26px 0 12px;
  padding: 6px 0;
  border-top: 1px dashed #c9c4b5;
  border-bottom: 1px dashed #c9c4b5;
  border-left: none;
  border-right: none;
  text-align: center;
}
#wemd h2 .content {
  font-family: "PingFang SC", "Microsoft YaHei", sans-serif;
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: #1f1d1a;
  text-align: center;
}

#wemd h3 {
  margin: 20px 0 10px;
  padding: 0 0 6px;
  border-bottom: 1px dotted #c9c4b5;
}
#wemd h3 .content {
  font-family: "PingFang SC", "Microsoft YaHei", sans-serif;
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 0.06em;
  color: #1f1d1a;
}

#wemd h4 .content {
  font-family: "SF Mono", "Cascadia Code", Consolas, monospace;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.12em;
  color: #cf2323;
}

/* section-title 跟随 h2 虚线带风格 */
#wemd .wemd-section-title {
  margin: 26px 0 12px;
  padding: 6px 0;
  background: transparent;
  border: none;
  border-top: 1px dashed #c9c4b5;
  border-bottom: 1px dashed #c9c4b5;
  border-radius: 0;
  box-shadow: none;
}
#wemd .wemd-section-title .wemd-component-body > h2 {
  margin: 0;
  padding: 0;
  border: none;
}
#wemd .wemd-section-title .wemd-component-body > h2 .content {
  color: #1f1d1a;
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 0.08em;
}

/* === 票头 magazine-cover（店名 + 副标 + 虚线 + 小字） === */
#wemd .wemd-magazine-cover {
  margin: 4px 0 26px;
  padding: 8px 0 16px;
  background: transparent;
  border: none;
  border-bottom: 1px dashed #c9c4b5;
  border-radius: 0;
  text-align: center;
}
#wemd .wemd-magazine-cover .wemd-rc-store {
  font-family: "PingFang SC", "Microsoft YaHei", sans-serif;
  font-size: 26px;
  font-weight: 800;
  letter-spacing: 0.14em;
  color: #1f1d1a;
  text-align: center;
}
#wemd .wemd-magazine-cover .wemd-rc-sub {
  margin-top: 6px;
  font-family: "SF Mono", "Cascadia Code", Consolas, monospace;
  font-size: 11px;
  letter-spacing: 0.22em;
  color: #6b675e;
}
#wemd .wemd-magazine-cover .wemd-rc-dash {
  display: block;
  margin: 12px auto 10px;
  width: 70%;
  border-top: 1px dashed #cf2323;
  font-size: 0;
  line-height: 0;
  overflow: hidden;
}
#wemd .wemd-magazine-cover .wemd-rc-desc {
  margin: 0 auto;
  font-family: "SF Mono", "Cascadia Code", Consolas, monospace;
  font-size: 12px;
  letter-spacing: 0.06em;
  color: #1f1d1a;
  text-align: center;
}

/* === 单号 section-divider === */
#wemd .wemd-section-divider {
  margin: 28px 0 18px;
  padding: 10px 0 0;
  background: transparent;
  border: none;
  border-top: 1px dashed #c9c4b5;
  border-radius: 0;
  text-align: center;
}
#wemd .wemd-section-divider .wemd-rc-no {
  display: block;
  font-family: "SF Mono", "Cascadia Code", Consolas, monospace;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.3em;
  color: #cf2323;
}
#wemd .wemd-section-divider .wemd-rc-title {
  margin-top: 4px;
  font-family: "PingFang SC", "Microsoft YaHei", sans-serif;
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: #1f1d1a;
  text-align: center;
}
#wemd .wemd-section-divider .wemd-rc-line {
  display: block;
  margin: 10px 0 0;
  border-top: 1px dashed #c9c4b5;
  font-size: 0;
  line-height: 0;
  overflow: hidden;
}

/* === divider 虚线分隔（★ 星星） === */
#wemd .wemd-divider {
  margin: 24px 0;
  height: auto;
  display: block;
  text-align: center;
}
#wemd .wemd-divider .wemd-component-body {
  border-top: 1px dashed #c9c4b5;
  text-align: center;
}
#wemd .wemd-divider .wemd-component-body::before,
#wemd .wemd-divider .wemd-component-body::after {
  content: none; /* 中和共享双线，仅保留虚线 */
}
#wemd .wemd-divider .wemd-rc-stars {
  display: inline-block;
  /* 已移除 position: relative —— 公众号会删除 position: relative/absolute，所有装饰已改用正常流/flex+负 margin/border 实现，详见 theme-development-guide.md */
  top: -9px;
  padding: 0 12px;
  font-family: "SF Mono", "Cascadia Code", Consolas, monospace;
  font-size: 11px;
  letter-spacing: 0.28em;
  color: #6b675e;
}

/* === divider-fancy 小票装饰线 === */
#wemd .wemd-divider-fancy {
  margin: 24px 0;
  height: auto;
}
#wemd .wemd-divider-fancy .wemd-df-label {
  border-top: 1px dashed #c9c4b5;
  font-family: "SF Mono", "Cascadia Code", Consolas, monospace;
  font-size: 12px;
  letter-spacing: 0.16em;
  color: #6b675e;
}
#wemd .wemd-divider-fancy .wemd-df-dots {
  color: #cf2323;
  font-size: 16px;
}

/* === 金句（顾客留言票） === */
#wemd .wemd-quote-card {
  margin: 24px 0;
  padding: 18px 20px;
  background: transparent;
  border: 1px dashed #6b675e;
  border-radius: 0;
  box-shadow: none;
  text-align: center;
}
#wemd .wemd-quote-card .wemd-qc-quote {
  font-family: "PingFang SC", "Microsoft YaHei", sans-serif;
  font-size: 16px;
  font-weight: 700;
  line-height: 1.9;
  color: #1f1d1a;
  text-align: center;
}
#wemd .wemd-quote-card .wemd-qc-author {
  display: block;
  margin-top: 10px;
  font-family: "SF Mono", "Cascadia Code", Consolas, monospace;
  font-size: 11px;
  letter-spacing: 0.2em;
  color: #cf2323;
  text-align: center;
}

/* === full-quote 横线票 === */
#wemd .wemd-full-quote {
  margin: 24px 0;
  padding: 16px 0;
  background: transparent;
  border: none;
  border-top: 1px dashed #6b675e;
  border-bottom: 1px dashed #6b675e;
  border-radius: 0;
  box-shadow: none;
  text-align: center;
}
#wemd .wemd-full-quote .wemd-fq-text {
  font-family: "PingFang SC", "Microsoft YaHei", sans-serif;
  font-size: 16px;
  font-weight: 700;
  line-height: 1.9;
  color: #1f1d1a;
  text-align: center;
}
#wemd .wemd-full-quote .wemd-fq-text em {
  color: #cf2323;
  font-style: normal;
}

/* === pullquote 摘录票 === */
#wemd .wemd-pullquote {
  margin: 22px 0;
  padding: 14px 16px;
  background: transparent;
  border: 1px dashed #c9c4b5;
  border-left: 3px solid #cf2323;
  border-radius: 0;
}
#wemd .wemd-pullquote .wemd-component-body blockquote p {
  font-family: "PingFang SC", "Microsoft YaHei", sans-serif;
  font-size: 15px;
  font-weight: 600;
  line-height: 1.9;
  color: #1f1d1a;
}

/* === callout / callout-pro（小票提示条） === */
#wemd .wemd-callout {
  margin: 22px 0;
  padding: 14px 16px;
  background: transparent;
  border: 1px dashed #c9c4b5;
  border-left: 3px solid #cf2323;
  border-radius: 0;
  box-shadow: none;
}
#wemd .wemd-callout .wemd-component-body > p {
  font-size: 14px;
  line-height: 1.9;
  color: #1f1d1a;
}
#wemd .wemd-callout .wemd-component-body > p strong {
  color: #cf2323;
}

#wemd .wemd-callout-pro {
  margin: 22px 0;
  padding: 14px 16px;
  background: transparent;
  border: 1px dashed #c9c4b5;
  border-left: 3px solid #cf2323;
  border-radius: 0;
  box-shadow: none;
  transform: none;
}
#wemd .wemd-callout-pro::before {
  content: none; /* 小票竖条由 border-left 承担 */
}
#wemd .wemd-callout-pro .wemd-component-body > p {
  font-size: 14px;
  line-height: 1.9;
  color: #1f1d1a;
}
#wemd .wemd-callout-pro .wemd-component-body > p b {
  color: #cf2323;
}

/* === text-card 便签条 === */
#wemd .wemd-text-card {
  margin: 22px 0;
  padding: 16px 18px;
  background: transparent;
  border: 1px dashed #c9c4b5;
  border-left: 3px solid #1f1d1a;
  border-radius: 0;
  box-shadow: none;
  font-size: 14px;
  line-height: 1.9;
  color: #1f1d1a;
}

/* === stats-block 数量统计行（点线 + 红色数值右对齐） === */
#wemd .wemd-stats-block {
  margin: 20px 0;
  padding: 0;
  background: transparent;
  border: none;
  border-radius: 0;
}
#wemd .wemd-stats-block .wemd-sb-title {
  margin: 0 0 8px;
  font-family: "SF Mono", "Cascadia Code", Consolas, monospace;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.16em;
  color: #1f1d1a;
}
#wemd .wemd-stats-block .wemd-sb-items {
  list-style: none;
  padding: 0;
  margin: 0;
}
#wemd .wemd-stats-block .wemd-sb-items-item {
  display: flex;
  flex-direction: row-reverse; /* 数值在右（小票金额位），说明在左 */
  justify-content: space-between;
  align-items: baseline;
  margin: 0;
  padding: 7px 0;
  background: transparent;
  border: none;
  border-bottom: 1px dotted #c9c4b5;
  border-radius: 0;
  box-shadow: none;
}
#wemd .wemd-stats-block .wemd-sb-items-item:last-child {
  border-bottom: none;
}
#wemd .wemd-stats-block .wemd-sb-items-value {
  font-family: "SF Mono", "Cascadia Code", Consolas, monospace;
  font-size: 16px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: #cf2323;
}
#wemd .wemd-stats-block .wemd-sb-items-label {
  font-family: "PingFang SC", "Microsoft YaHei", sans-serif;
  font-size: 13px;
  color: #1f1d1a;
}

/* === styled-table 明细表（粗线表头 + 点线行） === */
#wemd .wemd-styled-table {
  margin: 20px 0;
  background: transparent;
  border: none;
  border-top: 2px solid #1f1d1a;
  border-bottom: 1px solid #1f1d1a;
  border-radius: 0;
  overflow: hidden;
  box-shadow: none;
}
#wemd .wemd-styled-table table {
  border: none;
}
#wemd .wemd-styled-table table th {
  padding: 8px 0;
  border-bottom: 1px solid #1f1d1a;
  font-family: "SF Mono", "Cascadia Code", Consolas, monospace;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-align: left;
  color: #1f1d1a;
  background: transparent;
}
#wemd .wemd-styled-table table td {
  padding: 7px 0;
  border-bottom: 1px dotted #c9c4b5;
  font-family: "SF Mono", "Cascadia Code", Consolas, monospace;
  font-size: 13px;
  font-variant-numeric: tabular-nums;
  color: #1f1d1a;
}

/* === timeline 积分明细（红色小方块 + 点线行） === */
#wemd .wemd-timeline {
  margin: 20px 0;
  padding: 0;
  background: transparent;
  border: none;
  border-radius: 0;
}
#wemd .wemd-timeline .wemd-tl-title {
  margin: 0 0 8px;
  font-family: "SF Mono", "Cascadia Code", Consolas, monospace;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.16em;
  color: #1f1d1a;
}
#wemd .wemd-timeline .wemd-tl-events {
  border-left: none;
  margin-left: 0;
  padding: 0;
}
#wemd .wemd-timeline .wemd-tl-item {
  position: static;
  display: flex;
  align-items: baseline;
  gap: 10px;
  padding: 7px 0;
  border-bottom: 1px dotted #c9c4b5;
}
#wemd .wemd-timeline .wemd-tl-item:last-child {
  border-bottom: none;
}
#wemd .wemd-timeline .wemd-tl-dot {
  position: static;
  display: inline-block;
  flex-shrink: 0;
  transform: none; /* 关闭共享圆点尺寸无关居中（本主题用行内布局） */
  width: 7px;
  height: 7px;
  background: #cf2323;
  border: none;
  border-radius: 0;
  box-shadow: none;
}
#wemd .wemd-timeline .wemd-tl-text {
  flex: 1;
  font-family: "SF Mono", "Cascadia Code", Consolas, monospace;
  font-size: 13px;
  color: #1f1d1a;
}

/* === steps 售后流程（点线步骤行） === */
#wemd .wemd-steps {
  margin: 20px 0;
  padding: 0;
  background: transparent;
  border: none;
  border-radius: 0;
}
#wemd .wemd-steps .wemd-component-body > p:first-child {
  margin: 0 0 8px;
  font-family: "SF Mono", "Cascadia Code", Consolas, monospace;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.16em;
  color: #1f1d1a;
}
#wemd .wemd-steps .wemd-component-body li {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin: 0;
  padding: 7px 0;
  background: transparent;
  border: none;
  border-bottom: 1px dotted #c9c4b5;
  border-radius: 0;
  font-family: "SF Mono", "Cascadia Code", Consolas, monospace;
  font-size: 13px;
  line-height: 1.9;
  color: #1f1d1a;
}
#wemd .wemd-steps .wemd-component-body li:last-child {
  border-bottom: none;
}
#wemd .wemd-steps .wemd-component-body li span {
  color: #cf2323;
  font-weight: 700;
}

/* === toc-nav 小票目录 === */
#wemd .wemd-toc-nav {
  margin: 20px 0;
  padding: 12px 0;
  background: transparent;
  border: none;
  border-top: 1px dashed #c9c4b5;
  border-bottom: 1px dashed #c9c4b5;
  border-radius: 0;
  box-shadow: none;
}
#wemd .wemd-toc-nav .wemd-component-body > p:first-child {
  margin: 0 0 8px;
  font-family: "SF Mono", "Cascadia Code", Consolas, monospace;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.24em;
  color: #cf2323;
}
#wemd .wemd-toc-nav .wemd-component-body li {
  padding: 7px 0;
  border-bottom: 1px dotted #c9c4b5;
  font-size: 14px;
  color: #1f1d1a;
}
#wemd .wemd-toc-nav .wemd-component-body li:last-child {
  border-bottom: none;
}
#wemd .wemd-toc-nav .wemd-component-body li span {
  font-family: "SF Mono", "Cascadia Code", Consolas, monospace;
  font-size: 11px;
  letter-spacing: 0.1em;
  color: #cf2323;
  min-width: 30px;
}

/* === faq 问答票 === */
#wemd .wemd-faq {
  margin: 22px 0;
}
#wemd .wemd-faq .wemd-component-body {
  padding: 40px 16px 14px;
  background: transparent;
  border: 1px dashed #c9c4b5;
  border-radius: 0;
  box-shadow: none;
}
#wemd .wemd-faq .wemd-component-body > p {
  font-size: 14px;
  line-height: 1.9;
  color: #1f1d1a;
}
#wemd .wemd-faq .wemd-component-body > p.wemd-q {
  color: #cf2323;
  font-weight: 700;
}

/* === hero-banner 横幅票 === */
#wemd .wemd-hero-banner {
  margin: 4px 0 26px;
  background: transparent;
  border: none;
  border-top: 2px solid #1f1d1a;
  border-bottom: 1px dashed #c9c4b5;
  border-radius: 0;
}
#wemd .wemd-hero-banner .wemd-component-body {
  padding: 30px 20px;
  text-align: center;
}
#wemd .wemd-hero-banner .wemd-hb-title {
  font-family: "PingFang SC", "Microsoft YaHei", sans-serif;
  font-size: 22px;
  font-weight: 800;
  letter-spacing: 0.08em;
  color: #1f1d1a;
  text-align: center;
}
#wemd .wemd-hero-banner .wemd-hb-title strong {
  color: #cf2323;
}
#wemd .wemd-hero-banner .wemd-hb-subtitle {
  font-family: "SF Mono", "Cascadia Code", Consolas, monospace;
  font-size: 13px;
  letter-spacing: 0.08em;
  color: #6b675e;
  text-align: center;
}

/* === cta-card 行动票（去按钮化，红色下划线文字） === */
#wemd .wemd-cta-card {
  margin: 24px 0;
  padding: 16px 0;
  background: transparent;
  border: none;
  border-top: 1px dashed #6b675e;
  border-bottom: 1px dashed #6b675e;
  border-radius: 0;
  text-align: center;
  color: #1f1d1a;
}
#wemd .wemd-cta-card .wemd-cta-title {
  font-family: "PingFang SC", "Microsoft YaHei", sans-serif;
  font-size: 17px;
  font-weight: 800;
  letter-spacing: 0.08em;
  color: #1f1d1a;
  text-align: center;
}
#wemd .wemd-cta-card .wemd-cta-body {
  font-size: 13px;
  line-height: 1.9;
  color: #6b675e;
}
#wemd .wemd-cta-card .wemd-cta-action {
  display: inline-block;
  padding: 4px 0;
  background: transparent;
  border: none;
  border-bottom: 2px solid #cf2323;
  border-radius: 0;
  font-family: "SF Mono", "Cascadia Code", Consolas, monospace;
  font-size: 12px;
  letter-spacing: 0.16em;
  color: #cf2323;
  margin: 8px 0 0;
}

/* === follow-bar 关注小票（同路径同特异性覆盖，去按钮化） === */
#wemd .wemd-follow-bar {
  margin: 0 0 20px;
  padding: 12px 14px;
  background: transparent;
  border: 1px dashed #6b675e;
  border-left: 3px solid #cf2323;
  border-radius: 0;
  color: #1f1d1a;
}
#wemd .wemd-follow-bar .wemd-component-body {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  gap: 10px;
}
#wemd .wemd-follow-bar .wemd-component-body > p:first-child {
  margin: 0;
  flex: 1;
  font-family: "SF Mono", "Cascadia Code", Consolas, monospace;
  font-size: 13px;
  color: #1f1d1a;
}
#wemd .wemd-follow-bar .wemd-component-body > p:first-child strong {
  color: #1f1d1a;
  font-weight: 700;
}
#wemd .wemd-follow-bar .wemd-component-body > p:last-child:not(:first-child) {
  margin: 0;
  flex-shrink: 0;
  background: transparent;
  border: none;
  border-radius: 0;
  font-family: "SF Mono", "Cascadia Code", Consolas, monospace;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.1em;
  color: #cf2323;
}

/* === end-card 会员集章卡（粗框 + 品牌 + 编号） === */
#wemd .wemd-end-card {
  margin: 26px 0;
  padding: 0;
  background: transparent;
  border: 2px solid #1f1d1a;
  border-radius: 0;
  box-shadow: none;
  text-align: center;
}
#wemd .wemd-end-card .wemd-rc-label {
  padding: 10px 0 0;
  font-family: "SF Mono", "Cascadia Code", Consolas, monospace;
  font-size: 12px;
  letter-spacing: 0.24em;
  color: #1f1d1a;
}
#wemd .wemd-end-card .wemd-rc-brand {
  padding: 6px 20px 0;
  font-family: "PingFang SC", "Microsoft YaHei", sans-serif;
  font-size: 20px;
  font-weight: 800;
  letter-spacing: 0.12em;
  color: #1f1d1a;
}
#wemd .wemd-end-card .wemd-rc-brand strong {
  color: #cf2323;
}
#wemd .wemd-end-card .wemd-rc-line {
  display: block;
  margin: 10px 24px 0;
  border-top: 1px dashed #c9c4b5;
  font-size: 0;
  line-height: 0;
  overflow: hidden;
}
#wemd .wemd-end-card .wemd-rc-meta {
  padding: 8px 20px 14px;
  font-family: "SF Mono", "Cascadia Code", Consolas, monospace;
  font-size: 11px;
  letter-spacing: 0.06em;
  color: #6b675e;
}

/* === share-card 分享票 === */
#wemd .wemd-share-card {
  margin: 24px 0 16px;
  padding: 12px 0;
  border-top: 1px dashed #c9c4b5;
  text-align: center;
}
#wemd .wemd-share-card .wemd-component-body p {
  margin: 0;
  font-family: "SF Mono", "Cascadia Code", Consolas, monospace;
  font-size: 13px;
  letter-spacing: 0.08em;
  color: #6b675e;
  text-align: center;
}

/* === brand-sign 落款票 === */
#wemd .wemd-brand-sign {
  margin: 24px 0;
}
#wemd .wemd-brand-sign .wemd-bs-wrapper {
  padding: 20px;
  background: transparent;
  border: 2px solid #1f1d1a;
  border-radius: 0;
}
#wemd .wemd-brand-sign .wemd-bs-brand-name {
  font-family: "PingFang SC", "Microsoft YaHei", sans-serif;
  font-size: 20px;
  font-weight: 800;
  letter-spacing: 0.12em;
  color: #1f1d1a;
}
#wemd .wemd-brand-sign .wemd-bs-tagline {
  font-family: "SF Mono", "Cascadia Code", Consolas, monospace;
  font-size: 12px;
  letter-spacing: 0.08em;
  color: #6b675e;
}
#wemd .wemd-brand-sign .wemd-bs-slogan {
  font-family: "SF Mono", "Cascadia Code", Consolas, monospace;
  font-size: 11px;
  letter-spacing: 0.2em;
  color: #cf2323;
}
#wemd .wemd-brand-sign .wemd-bs-logo {
  color: #1f1d1a;
}
#wemd .wemd-brand-sign .wemd-bs-divider-dot {
  color: #cf2323;
}

/* === copyright 版权小票脚 === */
#wemd .wemd-copyright-notice {
  margin: 18px 0;
  padding: 10px 0;
  background: transparent;
  border: none;
  border-top: 1px dashed #c9c4b5;
  border-left: none;
  border-radius: 0;
}
#wemd .wemd-copyright-notice .wemd-component-body p {
  margin: 0;
  font-family: "SF Mono", "Cascadia Code", Consolas, monospace;
  font-size: 11px;
  line-height: 1.8;
  letter-spacing: 0.06em;
  color: #6b675e;
  text-align: center;
}

/* === tag-label 标签票（虚线胶囊） === */
#wemd .wemd-tag-label .wemd-component-body > p,
#wemd .wemd-tag-label .wemd-component-body > p span {
  display: inline-block;
  margin: 0 6px 6px 0;
  padding: 3px 12px;
  background: transparent;
  border: 1px dashed #6b675e;
  border-radius: 0;
  font-family: "SF Mono", "Cascadia Code", Consolas, monospace;
  font-size: 12px;
  letter-spacing: 0.08em;
  color: #1f1d1a;
}

/* === resource-list 资料票 === */
#wemd .wemd-resource-list {
  margin: 22px 0;
  padding: 16px;
  background: transparent;
  border: 1px dashed #c9c4b5;
  border-radius: 0;
}
#wemd .wemd-resource-list .wemd-rl-title {
  font-family: "PingFang SC", "Microsoft YaHei", sans-serif;
  font-size: 15px;
  font-weight: 700;
  color: #1f1d1a;
}
#wemd .wemd-resource-list .wemd-rl-item {
  background: transparent;
  border: 1px dotted #c9c4b5;
  border-radius: 0;
}
#wemd .wemd-resource-list .wemd-rl-item .wemd-rl-item-title {
  color: #1f1d1a;
}

/* === 图片（墨框小票图） === */
#wemd .wemd-image-card {
  margin: 24px 0;
  padding: 6px;
  background: transparent;
  border: 1px solid #1f1d1a;
  border-radius: 0;
  box-shadow: none;
}
#wemd .wemd-image-card .wemd-ic-image img {
  border-radius: 0;
}
#wemd .wemd-image-card .wemd-ic-caption {
  margin: 10px 2px 2px;
  font-family: "SF Mono", "Cascadia Code", Consolas, monospace;
  font-size: 11px;
  letter-spacing: 0.08em;
  color: #6b675e;
}
#wemd .wemd-image-caption .wemd-component-body p {
  font-family: "SF Mono", "Cascadia Code", Consolas, monospace;
  font-size: 11px;
  letter-spacing: 0.08em;
  color: #6b675e;
}
#wemd .wemd-image-caption .wemd-component-body p em {
  color: #6b675e;
  font-style: normal;
}
#wemd .wemd-image-grid .wemd-component-body p img {
  border: 1px solid #1f1d1a;
  border-radius: 0;
}
#wemd .wemd-image-compare .wemd-component-body figure {
  border: 1px solid #1f1d1a;
  border-radius: 0;
}
#wemd .wemd-image-text-row {
  margin: 22px 0;
  padding: 14px;
  background: transparent;
  border: 1px dashed #c9c4b5;
  border-radius: 0;
}
`;
