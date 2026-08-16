/**
 * 公众号组件样式 - 扩展组件库（第一批 + 第二批）
 *
 * 与 components-default.ts 共享同一套 CSS 变量：
 * - --wemd-primary / --wemd-primary-dark / --wemd-primary-light
 * - --wemd-bg-soft / --wemd-text-strong / --wemd-text-soft / --wemd-border
 *
 * 拆分到独立文件避免单文件超过 500 行红线
 *
 * 组件清单（13 个）：
 * - 第一批高频：follow-bar / qr-card / numbered-heading / section-title
 *               image-text-row / hero-banner / share-card / related-posts
 * - 第二批中频：toc-nav / tag-label / image-caption / copyright-notice / styled-table
 */

export const componentStylesExtra = `/* === WeMD 扩展组件样式（跟随主题色变量） === */

/* === follow-bar 顶部关注引导条 === */
#wemd .wemd-follow-bar {
  margin: 0 0 24px 0;
  padding: 12px 16px;
  background: linear-gradient(135deg, var(--wemd-primary, #07c160) 0%, var(--wemd-primary-dark, #0a8f4a) 100%);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #ffffff;
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
  color: #ffffff;
  flex: 1;
}

#wemd .wemd-follow-bar .wemd-component-body > p:first-child strong {
  color: #ffffff;
  font-weight: 600;
}

/* 右侧"关注"按钮（末段，且非唯一的首段——避免单段文案被误渲染成胶囊按钮） */
#wemd .wemd-follow-bar .wemd-component-body > p:last-child:not(:first-child) {
  margin: 0;
  padding: 4px 14px;
  background: rgba(255, 255, 255, 0.25);
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 14px;
  font-size: 12px;
  font-weight: 500;
  color: #ffffff;
  flex-shrink: 0;
}

/* === qr-card 二维码关注卡片（bg-card 背景） === */
#wemd .wemd-qr-card {
  margin: 32px 0;
  padding: 28px 24px;
  background: var(--wemd-bg-card, #ffffff);
  border: 1px solid var(--wemd-border, #e2e8f0);
  border-radius: 12px;
  text-align: center;
}

#wemd .wemd-qr-card .wemd-component-body {
  text-align: center;
}

/* 第一张图作为二维码 */
#wemd .wemd-qr-card .wemd-component-body img:first-child {
  display: block;
  margin: 0 auto 12px auto;
  width: 140px;
  height: 140px;
  border-radius: 8px;
  border: 2px solid #ffffff;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

/* 第一段（图后）作为公众号名称 */
#wemd .wemd-qr-card .wemd-component-body > p:first-child {
  margin: 0 0 6px 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--wemd-text-strong, #1a1a1a);
}

/* 第二段作为 slogan */
#wemd .wemd-qr-card .wemd-component-body > p:nth-child(2) {
  margin: 0;
  font-size: 13px;
  color: var(--wemd-text-soft, #64748b);
  letter-spacing: 0.3px;
}

/* === numbered-heading 序号章节标题 === */
#wemd .wemd-numbered-heading {
  margin: 32px 0 16px 0;
  padding: 0;
  display: flex;
  align-items: baseline;
  gap: 12px;
  border: none;
  background: transparent;
}

#wemd .wemd-numbered-heading .wemd-component-body {
  display: flex;
  align-items: baseline;
  gap: 12px;
  width: 100%;
}

/* 第一段作为大序号（用 accent 点缀色，跳出来） */
#wemd .wemd-numbered-heading .wemd-component-body > p:first-child {
  margin: 0;
  font-size: 36px;
  font-weight: 800;
  line-height: 1;
  color: var(--wemd-accent, #07c160);
  font-family: "SF Mono", Monaco, "Helvetica Neue", sans-serif;
  letter-spacing: -1px;
  flex-shrink: 0;
}

/* 第二段作为标题文字 */
#wemd .wemd-numbered-heading .wemd-component-body > p:nth-child(2) {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: var(--wemd-text-strong, #1a1a1a);
  line-height: 1.3;
  flex: 1;
}

/* === section-title 章节小标题卡片（primary 主色，跟随主题） === */
#wemd .wemd-section-title {
  margin: 28px 0 16px 0;
  padding: 12px 16px;
  background: var(--wemd-bg-muted, #f0fdf4);
  border-left: 4px solid var(--wemd-primary, #07c160);
  border-radius: 0 6px 6px 0;
}

#wemd .wemd-section-title .wemd-component-body > p:first-child {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--wemd-primary, #07c160);
  line-height: 1.4;
}

#wemd .wemd-section-title .wemd-component-body > p:first-child strong {
  color: var(--wemd-primary, #07c160);
}

/* === image-text-row 图文左右混排 === */
#wemd .wemd-image-text-row {
  margin: 24px 0;
  display: flex;
  align-items: center;
  gap: 16px;
  background: var(--wemd-bg-soft, #fafafa);
  border-radius: 10px;
  padding: 16px;
  border: 1px solid var(--wemd-border, #e2e8f0);
}

#wemd .wemd-image-text-row .wemd-component-body {
  display: flex;
  align-items: center;
  gap: 16px;
  width: 100%;
}

/* 第一张图作为左侧图片（兼容独立图片段落被 implicit-figures 包成 figure） */
#wemd .wemd-image-text-row .wemd-component-body figure:first-child img,
#wemd .wemd-image-text-row .wemd-component-body > p img:first-of-type {
  width: 120px;
  height: 120px;
  object-fit: cover;
  border-radius: 8px;
  margin: 0;
  flex-shrink: 0;
}

/* 后续段落作为右侧文字 */
#wemd .wemd-image-text-row .wemd-component-body > p {
  margin: 0;
  flex: 1;
  font-size: 15px;
  line-height: 1.7;
  color: var(--wemd-text-soft, #334155);
}

/* 首个文字段作为标题（用 first-of-type，兼容 figure 先行） */
#wemd .wemd-image-text-row .wemd-component-body > p:first-of-type {
  font-size: 16px;
  font-weight: 600;
  color: var(--wemd-text-strong, #1a1a1a);
  margin-bottom: 4px;
}

/* reversed 变体：图在右文在左 */
#wemd .wemd-image-text-row[data-props*="\\"reversed\\":true"] .wemd-component-body {
  flex-direction: row-reverse;
}

/* === hero-banner 顶部头图 Banner === */
/* 设计约束：基础规则不做背景/字色，全部分派给 variant
   - 语义变量：--hb-title 主标题色 / --hb-sub 副标题色，由各 variant 显式赋值
   - 圆角基础值：calc(var(--wemd-border-radius, 8px) + 4px)，variant 可覆盖单边 */
#wemd .wemd-hero-banner {
  margin: 0 0 32px 0;
  padding: 0;
  border-radius: calc(var(--wemd-border-radius, 8px) + 4px);
  overflow: hidden;
  position: relative;
  min-height: 160px;
  display: flex;
  align-items: center;
  justify-content: center;
}

#wemd .wemd-hero-banner .wemd-component-body {
  padding: 40px 32px;
  text-align: center;
  position: relative;
  z-index: 1;
  width: 100%;
}

/* 主标题（类选择器，与模板 wemd-hb-title 对齐；有背景图时标题不再是首个子元素） */
#wemd .wemd-hero-banner .wemd-component-body > .wemd-hb-title {
  margin: 0 0 10px 0;
  font-size: 26px;
  font-weight: 700;
  color: var(--hb-title, var(--wemd-text-strong, #1a1a1a));
  line-height: 1.3;
  letter-spacing: 1px;
}

/* 副标题（类选择器 wemd-hb-subtitle） */
#wemd .wemd-hero-banner .wemd-component-body > .wemd-hb-subtitle {
  margin: 0;
  font-size: 14px;
  color: var(--hb-sub, var(--wemd-text-soft, #888888));
  letter-spacing: 0.5px;
}

/* 如果第一张是图片，作为背景图 */
#wemd .wemd-hero-banner .wemd-component-body img:first-child {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: -1;
  margin: 0;
}

/* === share-card 引导分享（情感收尾，非按钮） === */
/* 设计原则：公众号内不可点击，不做按钮伪装。顶部细线标记文章收尾，一行走心文字。 */
#wemd .wemd-share-card {
  margin: 40px 0 24px 0;
  padding: 24px 16px 20px 16px;
  text-align: center;
  border-top: 1px solid var(--wemd-border, #e2e8f0);
}

#wemd .wemd-share-card .wemd-component-body {
  text-align: center;
}

/* 第一段作为收尾文字 */
#wemd .wemd-share-card .wemd-component-body > p:first-child {
  margin: 0;
  font-size: 14px;
  color: var(--wemd-text-soft, #888888);
  line-height: 1.6;
}

#wemd .wemd-share-card .wemd-component-body > p:first-child strong {
  color: var(--wemd-primary, #07c160);
  font-weight: 500;
}

/* 隐藏旧版按钮结构（ul/ol/li 不再展示） */
#wemd .wemd-share-card .wemd-component-body ul,
#wemd .wemd-share-card .wemd-component-body ol,
#wemd .wemd-share-card .wemd-component-body li {
  display: none;
}

/* === related-posts 推荐阅读卡片 === */
#wemd .wemd-related-posts {
  margin: 32px 0;
  padding: 20px 24px;
  background: var(--wemd-bg-soft, #fafafa);
  border-radius: 12px;
  border: 1px solid var(--wemd-border, #e2e8f0);
}

/* 推荐条目容器 */
#wemd .wemd-related-posts .wemd-rp-items {
  list-style: none;
  padding: 0;
  margin: 0;
}

#wemd .wemd-related-posts .wemd-rp-items-item {
  list-style: none;
  padding: 8px 0;
  margin: 0;
  border-bottom: 1px dashed var(--wemd-border, #e2e8f0);
  font-size: 14px;
  line-height: 1.6;
}

#wemd .wemd-related-posts .wemd-rp-items-item:last-child {
  border-bottom: none;
}

/* === toc-nav 目录章节导航（primary 主色，跟随主题） === */
#wemd .wemd-toc-nav {
  margin: 24px 0;
  padding: 20px 24px;
  background: var(--wemd-bg-soft, #f7f8fa);
  border-radius: 10px;
  border-left: 3px solid var(--wemd-primary, #07c160);
}

/* 第一段作为目录标题 */
#wemd .wemd-toc-nav .wemd-component-body > p:first-child {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--wemd-text-soft, #64748b);
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

#wemd .wemd-toc-nav .wemd-component-body ul,
#wemd .wemd-toc-nav .wemd-component-body ol {
  list-style: none;
  padding: 0;
  margin: 0;
}

#wemd .wemd-toc-nav .wemd-component-body li {
  list-style: none;
  padding: 6px 0;
  margin: 0;
  font-size: 14px;
  line-height: 1.6;
  color: var(--wemd-text-soft, #334155);
  display: block;
}

/* 序号样式：用 span 包裹序号，兼容微信内联
   序号由 ThemeProcessor.addTocNumbers 注入到 DOM（预览和导出统一路径），
   不再使用 ::before counter（微信会剥离伪元素，且会导致导出时双重编号） */
#wemd .wemd-toc-nav .wemd-component-body li span.toc-num {
  color: var(--wemd-primary, #07c160);
  font-weight: 600;
  font-family: "SF Mono", Monaco, monospace;
  font-size: 13px;
  margin-right: 8px;
}

#wemd .wemd-toc-nav .wemd-component-body li a {
  color: var(--wemd-text-soft, #334155);
  text-decoration: none;
  border-bottom: none;
}

/* === tag-label 关键词标签 === */
#wemd .wemd-tag-label {
  margin: 16px 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  background: transparent;
  border: none;
}

#wemd .wemd-tag-label .wemd-component-body {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  width: 100%;
}

/* 每个段落或列表项作为一个标签（primary 主色，跟随主题） */
#wemd .wemd-tag-label .wemd-component-body > p {
  margin: 0;
  padding: 4px 12px;
  background: var(--wemd-bg-muted, #f0fdf4);
  color: var(--wemd-primary, #07c160);
  border: 1px solid var(--wemd-primary, #07c160);
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  display: inline-block;
}

#wemd .wemd-tag-label .wemd-component-body ul,
#wemd .wemd-tag-label .wemd-component-body ol {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  list-style: none;
  padding: 0;
  margin: 0;
}

#wemd .wemd-tag-label .wemd-component-body li {
  list-style: none;
  padding: 4px 12px;
  background: var(--wemd-bg-muted, #f0fdf4);
  color: var(--wemd-primary, #07c160);
  border: 1px solid var(--wemd-primary, #07c160);
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  margin: 0;
}

/* === image-caption 图片说明图注 === */
#wemd .wemd-image-caption {
  margin: 16px 0;
  padding: 0;
  text-align: center;
  background: transparent;
  border: none;
}

#wemd .wemd-image-caption .wemd-component-body {
  text-align: center;
}

#wemd .wemd-image-caption .wemd-component-body img {
  display: block;
  margin: 0 auto 8px auto;
  border-radius: 6px;
  max-width: 100%;
}

#wemd .wemd-image-caption .wemd-component-body > p {
  margin: 8px 0 0 0;
  font-size: 13px;
  color: var(--wemd-text-soft, #94a3b8);
  letter-spacing: 0.3px;
  font-style: italic;
}

/* === copyright-notice 转载声明 === */
#wemd .wemd-copyright-notice {
  margin: 24px 0;
  padding: 14px 18px;
  background: var(--wemd-bg-soft, #f7f8fa);
  border-left: 3px solid var(--wemd-text-soft, #94a3b8);
  border-radius: 0 6px 6px 0;
  font-size: 13px;
}

#wemd .wemd-copyright-notice .wemd-component-body > p {
  margin: 0;
  font-size: 13px;
  line-height: 1.7;
  color: var(--wemd-text-soft, #64748b);
}

#wemd .wemd-copyright-notice .wemd-component-body > p strong {
  color: var(--wemd-text-strong, #475569);
  font-weight: 600;
}

#wemd .wemd-copyright-notice .wemd-component-body a {
  color: var(--wemd-primary, #07c160);
  text-decoration: none;
  border-bottom: 1px dashed var(--wemd-primary, #07c160);
}

/* === styled-table 美化表格 === */
#wemd .wemd-styled-table {
  margin: 24px 0;
  padding: 0;
  border: none;
  background: transparent;
}

#wemd .wemd-styled-table .wemd-sbt-table table {
  width: 100%;
  border-collapse: collapse;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.06);
}

#wemd .wemd-styled-table .wemd-sbt-table table th {
  background: var(--wemd-primary, #07c160);
  color: #ffffff;
  font-weight: 600;
  padding: 12px 16px;
  text-align: left;
  font-size: 14px;
  border: none;
  letter-spacing: 0.3px;
}

#wemd .wemd-styled-table .wemd-sbt-table table td {
  padding: 10px 16px;
  font-size: 14px;
  color: var(--wemd-text-soft, #334155);
  border-bottom: 1px solid var(--wemd-border, #e2e8f0);
  background: #ffffff;
}

#wemd .wemd-styled-table .wemd-sbt-table table tr:nth-child(even) td {
  background: var(--wemd-bg-soft, #f7f8fa);
}

#wemd .wemd-styled-table .wemd-sbt-table table tr:last-child td {
  border-bottom: none;
}

/* === 新增扩展组件默认样式 === */

/* ---- product-card 产品/商品卡片 ---- */
#wemd .wemd-product-card {
  margin: 24px 0;
  padding: 16px;
  background: var(--wemd-bg-card, #ffffff);
  border: 1px solid var(--wemd-border, #e2e8f0);
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  overflow: hidden;
}

#wemd .wemd-product-card .wemd-pc-image img {
  display: block;
  width: 100%;
  max-height: 320px;
  object-fit: cover;
  border-radius: 12px;
  margin-bottom: 14px;
}

#wemd .wemd-product-card .wemd-pc-header {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 10px;
}

#wemd .wemd-product-card .wemd-pc-badge {
  display: inline-block;
  align-self: flex-start;
  padding: 2px 10px;
  border-radius: 999px;
  background: var(--wemd-accent, #f59e0b);
  color: #fff;
  font-size: 12px;
  font-weight: 500;
  margin-bottom: 6px;
}

#wemd .wemd-product-card .wemd-pc-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--wemd-text-strong, #0f172a);
  line-height: 1.4;
}

#wemd .wemd-product-card .wemd-pc-subtitle {
  font-size: 13px;
  color: var(--wemd-primary, #07c160);
  font-weight: 500;
}

#wemd .wemd-product-card .wemd-pc-description {
  font-size: 14px;
  color: var(--wemd-text-soft, #64748b);
  line-height: 1.7;
  margin: 10px 0 14px;
}

#wemd .wemd-product-card .wemd-pc-price-row {
  display: flex;
  align-items: baseline;
  gap: 10px;
  margin-bottom: 10px;
}

#wemd .wemd-product-card .wemd-pc-price {
  font-size: 26px;
  font-weight: 800;
  color: #ff4d4f;
}

#wemd .wemd-product-card .wemd-pc-original s {
  font-size: 14px;
  color: var(--wemd-text-muted, #94a3b8);
}

#wemd .wemd-product-card .wemd-pc-meta-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 18px;
  font-size: 12.5px;
  color: var(--wemd-text-soft, #64748b);
  margin-bottom: 14px;
}

#wemd .wemd-product-card .wemd-pc-button {
  display: block;
  padding: 12px 20px;
  border-radius: 12px;
  background: linear-gradient(135deg, var(--wemd-primary, #07c160), var(--wemd-primary-dark, #0a8f4a));
  color: #fff;
  text-align: center;
  font-weight: 600;
  font-size: 15px;
  letter-spacing: 1px;
}

#wemd .wemd-product-card .wemd-pc-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 14px;
}

#wemd .wemd-product-card .wemd-pc-tag {
  font-size: 12px;
  color: var(--wemd-primary, #07c160);
  background: var(--wemd-primary-light, #e7f8ef);
  padding: 3px 9px;
  border-radius: 6px;
}

/* ---- brand-sign 品牌签名（默认：纵向居中签名卡） ---- */
#wemd .wemd-brand-sign {
  margin: 32px 0;
  padding: 16px 20px;
}

#wemd .wemd-brand-sign .wemd-bs-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 10px;
  padding: 26px 20px;
  border: 1px solid var(--wemd-border-soft, #e8ebe8);
  border-radius: 14px;
  background: linear-gradient(180deg, var(--wemd-bg-card, #fff), var(--wemd-bg-soft, #f7f8fa));
}

#wemd .wemd-brand-sign .wemd-bs-wrapper[data-divider="false"] {
  border: none;
  background: transparent;
  padding: 12px 0;
}

#wemd .wemd-brand-sign .wemd-bs-wrapper[data-style="inline"] {
  flex-direction: row;
  justify-content: flex-start;
  text-align: left;
  border: none;
  background: transparent;
  padding: 12px 0;
}

#wemd .wemd-brand-sign .wemd-bs-logo {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.08);
  margin-bottom: 4px;
  background-image: var(--wemd-asset-logo, none);
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: 700;
  color: var(--wemd-primary, #07c160);
}

#wemd .wemd-brand-sign .wemd-bs-brand-line {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  flex-wrap: wrap;
}

#wemd .wemd-brand-sign[data-style="inline"] .wemd-bs-brand-line {
  justify-content: flex-start;
}

#wemd .wemd-brand-sign .wemd-bs-brand-name {
  font-size: 20px;
  font-weight: 700;
  color: var(--wemd-text-strong, #0f172a);
  letter-spacing: 0.5px;
}

#wemd .wemd-brand-sign .wemd-bs-tagline {
  font-size: 15px;
  color: var(--wemd-text-soft, #64748b);
  font-weight: 500;
}

#wemd .wemd-brand-sign .wemd-bs-divider-dot {
  color: var(--wemd-primary, #07c160);
  font-size: 16px;
  font-weight: 700;
}

#wemd .wemd-brand-sign .wemd-bs-slogan {
  font-size: 14px;
  color: var(--wemd-primary, #07c160);
  font-weight: 500;
  margin-top: 2px;
}

#wemd .wemd-brand-sign .wemd-bs-subtext {
  font-size: 12px;
  color: var(--wemd-text-muted, #94a3b8);
  font-style: italic;
  padding-top: 12px;
  margin-top: 4px;
  border-top: 1px dashed var(--wemd-border-soft, #e8ebe8);
}

/* 签名卡无 subtext 时去掉上边框，避免孤立虚线 */
#wemd .wemd-brand-sign .wemd-bs-subtext:empty {
  display: none;
}

/* ---- resource-list 资料/步骤清单 ---- */
#wemd .wemd-resource-list {
  margin: 24px 0;
  padding: 18px 20px;
  background: var(--wemd-bg-soft, #f7f8fa);
  border-radius: 14px;
}

#wemd .wemd-resource-list .wemd-rl-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--wemd-text-strong, #0f172a);
  margin-bottom: 6px;
}

#wemd .wemd-resource-list .wemd-rl-subtitle {
  font-size: 13px;
  color: var(--wemd-text-soft, #64748b);
  margin-bottom: 16px;
}

#wemd .wemd-resource-list .wemd-rl-items {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

#wemd .wemd-resource-list .wemd-rl-items[data-layout="compact"] {
  gap: 6px;
}

#wemd .wemd-resource-list .wemd-rl-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  background: #fff;
  border-radius: 10px;
  border: 1px solid var(--wemd-border, #e2e8f0);
}

#wemd .wemd-resource-list .wemd-rl-items[data-layout="compact"] .wemd-rl-item {
  padding: 8px 10px;
}

/* 条目 label（模板类名为 wemd-rl-label）：图标型（emoji）默认样式 */
#wemd .wemd-resource-list .wemd-rl-label {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
}

/* 编号型 label（numbered=true 时序号为圆形徽标） */
#wemd .wemd-resource-list .wemd-rl-items[data-numbered="true"] .wemd-rl-label {
  border-radius: 50%;
  background: var(--wemd-primary, #07c160);
  color: #fff;
  font-size: 13px;
  font-weight: 700;
}

#wemd .wemd-resource-list .wemd-rl-main {
  flex: 1;
  min-width: 0;
}

#wemd .wemd-resource-list .wemd-rl-item-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--wemd-text-strong, #0f172a);
}

#wemd .wemd-resource-list .wemd-rl-item-title a {
  color: inherit;
  text-decoration: none;
}

#wemd .wemd-resource-list .wemd-rl-item-desc {
  font-size: 12.5px;
  color: var(--wemd-text-soft, #64748b);
  margin-top: 3px;
  line-height: 1.5;
}

#wemd .wemd-resource-list .wemd-rl-meta {
  font-size: 12px;
  color: var(--wemd-text-muted, #94a3b8);
  flex-shrink: 0;
}

#wemd .wemd-resource-list .wemd-rl-tag {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 999px;
  background: var(--wemd-accent, #f59e0b);
  color: #fff;
  flex-shrink: 0;
}

/* ---- testimonial-card 名人推荐 ---- */
#wemd .wemd-testimonial-card {
  margin: 32px 0;
  padding: 28px 24px;
  background: linear-gradient(135deg, #ffffff 0%, var(--wemd-bg-soft, #f7f8fa) 100%);
  border-radius: 18px;
  border: 1px solid var(--wemd-border-soft, #e8ebe8);
  position: relative;
}

#wemd .wemd-testimonial-card .wemd-tc-mark {
  position: absolute;
  top: 8px;
  left: 20px;
  font-size: 56px;
  line-height: 1;
  color: var(--wemd-primary-light, #d4f4e1);
  font-family: Georgia, serif;
  pointer-events: none;
}

#wemd .wemd-testimonial-card .wemd-tc-quote {
  font-size: 17px;
  font-weight: 600;
  color: var(--wemd-text-strong, #0f172a);
  line-height: 1.7;
  padding: 0 10px 0 36px;
  margin-bottom: 12px;
  position: relative;
  z-index: 1;
}

#wemd .wemd-testimonial-card .wemd-tc-source {
  font-size: 12.5px;
  color: var(--wemd-text-muted, #94a3b8);
  padding-left: 36px;
  margin-bottom: 18px;
}

#wemd .wemd-testimonial-card .wemd-tc-person {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-left: 36px;
}

#wemd .wemd-testimonial-card .wemd-tc-avatar img {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid var(--wemd-primary-light, #d4f4e1);
}

#wemd .wemd-testimonial-card .wemd-tc-person-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

#wemd .wemd-testimonial-card .wemd-tc-name {
  font-size: 15px;
  font-weight: 700;
  color: var(--wemd-text-strong, #0f172a);
}

#wemd .wemd-testimonial-card .wemd-tc-title {
  font-size: 13px;
  color: var(--wemd-primary, #07c160);
  font-weight: 500;
}

#wemd .wemd-testimonial-card .wemd-tc-company {
  font-size: 12px;
  color: var(--wemd-text-soft, #64748b);
}

#wemd .wemd-testimonial-card .wemd-tc-company-logo img {
  margin-top: 14px;
  margin-left: 36px;
  max-height: 26px;
  opacity: 0.85;
}

/* ---- series-nav 系列文章导航（目录 + 文末连续阅读） ---- */
#wemd .wemd-series-nav {
  margin: 28px 0;
  padding: 20px 20px 14px;
  background: var(--wemd-bg-card, #ffffff);
  border: 1px solid var(--wemd-border, #e2e8f0);
  border-radius: 16px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.03);
}

/* 头部：系列名左对齐 + 进度右对齐（小灰字，避免绿色堆砌） */
#wemd .wemd-series-nav .wemd-sn-header {
  margin-bottom: 14px;
}

#wemd .wemd-series-nav .wemd-sn-name {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  font-size: 17px;
  font-weight: 700;
  color: var(--wemd-text-strong, #0f172a);
}

#wemd .wemd-series-nav .wemd-sn-name small {
  font-weight: 500;
  font-size: 12px;
  color: var(--wemd-text-muted, #94a3b8);
  white-space: nowrap;
}

#wemd .wemd-series-nav .wemd-sn-desc {
  font-size: 13px;
  color: var(--wemd-text-soft, #64748b);
  margin: 6px 0 10px;
}

#wemd .wemd-series-nav .wemd-sn-progress-bar {
  position: relative;
  height: 5px;
  border-radius: 999px;
  background: var(--wemd-bg-soft, #eef0f3);
  overflow: hidden;
}

#wemd .wemd-series-nav .wemd-sn-progress-fill {
  position: absolute;
  inset: 0;
  width: var(--sn-progress, 30%);
  background: linear-gradient(90deg, var(--wemd-primary, #07c160), var(--wemd-primary-dark, #0a8f4a));
  border-radius: inherit;
  transition: width 0.3s ease;
}

/* 目录：扁平行列表（不做内层灰盒） */
#wemd .wemd-series-nav .wemd-sn-articles {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

#wemd .wemd-series-nav .wemd-sn-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 12px;
  border-radius: 10px;
  font-size: 14px;
  color: var(--wemd-text-normal, #333333);
}

#wemd .wemd-series-nav .wemd-sn-item-idx {
  font-size: 12px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: var(--wemd-text-muted, #94a3b8);
  min-width: 22px;
}

/* 标题自带「第X篇」前缀时隐藏左侧序号徽章，避免双重编号 */
#wemd .wemd-series-nav .wemd-sn-item.no-idx .wemd-sn-item-idx {
  display: none;
}

#wemd .wemd-series-nav .wemd-sn-item-title {
  flex: 1;
  line-height: 1.45;
}

/* 已完成篇：标题淡化 + 绿色 ✓（不用删除线，避免叠加显得杂乱） */
#wemd .wemd-series-nav .wemd-sn-item.done {
  color: var(--wemd-text-muted, #94a3b8);
}

#wemd .wemd-series-nav .wemd-sn-item-check {
  font-size: 13px;
  font-weight: 700;
  color: var(--wemd-primary, #07c160);
}

/* 当前篇：背景 + 加粗 + 徽章（≥2 个视觉信号，符合导航设计惯例） */
#wemd .wemd-series-nav .wemd-sn-item.current {
  background: var(--wemd-primary-light, #e7f8ef);
  color: var(--wemd-primary-dark, #0a8f4a);
  font-weight: 600;
}

#wemd .wemd-series-nav .wemd-sn-item-tag {
  padding: 1px 9px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  color: #fff;
  background: var(--wemd-primary, #07c160);
}

#wemd .wemd-series-nav .wemd-sn-item a {
  color: inherit;
  text-decoration: none;
}

/* 文末连续阅读：上一篇 / 下一篇（虚线分隔、紧凑双栏） */
#wemd .wemd-series-nav .wemd-sn-nav {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px dashed var(--wemd-border, #e2e8f0);
}

#wemd .wemd-series-nav .wemd-sn-prev,
#wemd .wemd-series-nav .wemd-sn-next {
  padding: 10px 12px;
  border-radius: 10px;
  background: var(--wemd-bg-soft, #f7f8fa);
}

#wemd .wemd-series-nav .wemd-sn-next {
  text-align: right;
}

/* 无 prev/next 标题（首篇/末篇空态）：整块居中展示空态文案。
   模板根据 prevEmpty/nextEmpty 注入 wemd-sn-prev-empty / wemd-sn-next-empty 类，
   此处用类选择器替代微信不兼容的 :not(:has(...)) */
#wemd .wemd-series-nav .wemd-sn-prev.wemd-sn-prev-empty,
#wemd .wemd-series-nav .wemd-sn-next.wemd-sn-next-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: var(--wemd-text-muted, #94a3b8);
  font-size: 12.5px;
}

#wemd .wemd-series-nav .wemd-sn-prev-label,
#wemd .wemd-series-nav .wemd-sn-next-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--wemd-text-soft, #64748b);
}

#wemd .wemd-series-nav .wemd-sn-prev-title,
#wemd .wemd-series-nav .wemd-sn-next-title {
  margin-top: 2px;
  font-size: 13px;
  font-weight: 600;
  color: var(--wemd-text-strong, #0f172a);
  line-height: 1.4;
}
`;
