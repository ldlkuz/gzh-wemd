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

/* 右侧"关注"按钮（第二段或末段） */
#wemd .wemd-follow-bar .wemd-component-body > p:last-child {
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

/* 第一张图作为左侧图片 */
#wemd .wemd-image-text-row .wemd-component-body img:first-child {
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

#wemd .wemd-image-text-row .wemd-component-body > p:first-child {
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
#wemd .wemd-hero-banner {
  margin: 0 0 32px 0;
  padding: 0;
  border-radius: 12px;
  overflow: hidden;
  position: relative;
  background: linear-gradient(135deg, var(--wemd-primary, #07c160) 0%, var(--wemd-primary-dark, #0a8f4a) 100%);
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

/* 第一段作为主标题 */
#wemd .wemd-hero-banner .wemd-component-body > p:first-child {
  margin: 0 0 8px 0;
  font-size: 26px;
  font-weight: 700;
  color: #ffffff;
  line-height: 1.3;
  letter-spacing: 1px;
}

/* 第二段作为副标题 */
#wemd .wemd-hero-banner .wemd-component-body > p:nth-child(2) {
  margin: 0;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.9);
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
#wemd .wemd-share-card .wemd-component-body > p:first-child,
#wemd .wemd-share-card .wemd-component-body > p.wemd-child-1 {
  margin: 0;
  font-size: 14px;
  color: var(--wemd-text-soft, #888888);
  line-height: 1.6;
}

#wemd .wemd-share-card .wemd-component-body > p:first-child strong,
#wemd .wemd-share-card .wemd-component-body > p.wemd-child-1 strong {
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

/* 第一段作为区块标题 */
#wemd .wemd-related-posts .wemd-component-body > p:first-child {
  margin: 0 0 12px 0;
  font-size: 15px;
  font-weight: 600;
  color: var(--wemd-text-strong, #1a1a1a);
  padding-bottom: 8px;
  border-bottom: 1px solid var(--wemd-border, #e2e8f0);
}

#wemd .wemd-related-posts .wemd-component-body > p:first-child strong {
  color: var(--wemd-text-strong, #1a1a1a);
}

/* 列表作为推荐文章列表 */
#wemd .wemd-related-posts .wemd-component-body ul,
#wemd .wemd-related-posts .wemd-component-body ol {
  list-style: none;
  padding: 0;
  margin: 0;
}

#wemd .wemd-related-posts .wemd-component-body li {
  list-style: none;
  padding: 8px 0;
  margin: 0;
  border-bottom: 1px dashed var(--wemd-border, #e2e8f0);
  font-size: 14px;
  line-height: 1.6;
}

#wemd .wemd-related-posts .wemd-component-body li:last-child {
  border-bottom: none;
}

#wemd .wemd-related-posts .wemd-component-body li a {
  color: var(--wemd-text-soft, #334155);
  text-decoration: none;
  border-bottom: none;
  font-weight: 500;
}

#wemd .wemd-related-posts .wemd-component-body li a:hover {
  color: var(--wemd-primary, #07c160);
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
#wemd .wemd-toc-nav .wemd-component-body > p:first-child,
#wemd .wemd-toc-nav .wemd-component-body > p.wemd-child-1 {
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

/* 序号样式：用 span 包裹序号，兼容微信内联 */
#wemd .wemd-toc-nav .wemd-component-body li span.toc-num {
  color: var(--wemd-primary, #07c160);
  font-weight: 600;
  font-family: "SF Mono", Monaco, monospace;
  font-size: 13px;
  margin-right: 8px;
}

/* 兼容旧版（counter 方式，预览用） */
#wemd .wemd-toc-nav .wemd-component-body ul {
  counter-reset: toc;
}

#wemd .wemd-toc-nav .wemd-component-body ul li {
  counter-increment: toc;
}

#wemd .wemd-toc-nav .wemd-component-body ul li::before {
  content: counter(toc, decimal-leading-zero);
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

#wemd .wemd-styled-table .wemd-component-body > p:first-child {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--wemd-text-soft, #64748b);
  letter-spacing: 0.3px;
}

#wemd .wemd-styled-table .wemd-component-body > table {
  width: 100%;
  border-collapse: collapse;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.06);
}

#wemd .wemd-styled-table .wemd-component-body > table th {
  background: var(--wemd-primary, #07c160);
  color: #ffffff;
  font-weight: 600;
  padding: 12px 16px;
  text-align: left;
  font-size: 14px;
  border: none;
  letter-spacing: 0.3px;
}

#wemd .wemd-styled-table .wemd-component-body > table td {
  padding: 10px 16px;
  font-size: 14px;
  color: var(--wemd-text-soft, #334155);
  border-bottom: 1px solid var(--wemd-border, #e2e8f0);
  background: #ffffff;
}

#wemd .wemd-styled-table .wemd-component-body > table tr:nth-child(even) td {
  background: var(--wemd-bg-soft, #f7f8fa);
}

#wemd .wemd-styled-table .wemd-component-body > table tr:last-child td {
  border-bottom: none;
}
`;
