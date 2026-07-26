/**
 * FAQ 常见问题组件样式
 *
 * 语法：::: faq{title="常见问题" style="card"} ... :::
 *
 * 内容约定：
 * - 每段用 **加粗** 表示问题，后续段落/内容表示回答
 * - 也支持用列表结构
 *
 * 风格变体（style）：
 * - card: 卡片风格（默认）— 带边框、硬阴影、挂角标题、菱形项目符号
 * - simple: 简洁风格 — 纯文本 + 分割线，无卡片容器
 *
 * 配色策略：所有颜色用 CSS 变量 + fallback，跟随主题主色
 */

export const componentStylesFaq = `/* === FAQ 常见问题组件 === */

/* ---------- 通用基础 ---------- */
#wemd .wemd-faq {
  margin: 28px 0;
  box-sizing: border-box;
}

#wemd .wemd-faq .wemd-component-body {
  box-sizing: border-box;
}

/* 问题项通用：用 strong 标记问题 */
#wemd .wemd-faq .wemd-component-body > p strong {
  color: var(--wemd-primary, #07c160);
  font-weight: 600;
  font-size: 15px;
  line-height: 1.6;
}

/* 回答文字 */
#wemd .wemd-faq .wemd-component-body > p:not(:has(strong)) {
  color: var(--wemd-text-soft, #475569);
  font-size: 14px;
  line-height: 1.8;
  margin: 6px 0 0 0;
}

/* 列表场景 */
#wemd .wemd-faq .wemd-component-body ul,
#wemd .wemd-faq .wemd-component-body ol {
  list-style: none;
  padding: 0;
  margin: 0;
}

#wemd .wemd-faq .wemd-component-body li {
  margin: 0;
  padding: 0;
  list-style: none;
}

#wemd .wemd-faq .wemd-component-body li strong {
  color: var(--wemd-primary, #07c160);
  font-weight: 600;
  font-size: 15px;
  display: block;
  margin-bottom: 4px;
}

/* ---------- card 风格（默认） ---------- */
#wemd .wemd-faq {
  padding: 0 15px 8px;
  display: flex;
  justify-content: center;
}

#wemd .wemd-faq .wemd-component-body {
  width: 100%;
  max-width: 640px;
  border: 1px solid var(--wemd-primary, #07c160);
  background: #ffffff;
  box-shadow: 5px 8px 0 rgba(128, 128, 128, 0.08);
  position: relative;
  padding: 17px 18px 18px;
  border-radius: 2px;
}

/* 挂角标题 — body 的 ::before 伪元素，拿自身的 data-title */
#wemd .wemd-faq .wemd-component-body[data-title]::before {
  content: attr(data-title);
  position: absolute;
  top: -1px;
  left: -1px;
  padding: 6px 16px 8px 18px;
  background: var(--wemd-primary, #07c160);
  color: #ffffff;
  font-size: 15px;
  font-weight: 600;
  line-height: 1.5;
  border-radius: 0 0 4px 0;
  letter-spacing: 0.3px;
  pointer-events: none;
  z-index: 2;
  white-space: nowrap;
}

/* 有标题时增加顶部内边距 */
#wemd .wemd-faq .wemd-component-body[data-title] {
  padding-top: 52px;
}

/* 问题项 — 卡片内的每个问答对 */
#wemd .wemd-faq .wemd-component-body > p:has(strong) {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin: 14px 0 0 0;
}

#wemd .wemd-faq .wemd-component-body > p:has(strong) + p {
  margin-left: 22px;
}

/* 菱形项目符号 */
#wemd .wemd-faq .wemd-component-body > p > strong::before {
  content: "";
  display: inline-block;
  width: 7px;
  height: 7px;
  background: var(--wemd-primary, #07c160);
  transform: rotate(45deg);
  margin-right: 10px;
  vertical-align: middle;
  flex-shrink: 0;
}

/* 列表样式下的菱形符号 */
#wemd .wemd-faq .wemd-component-body li {
  margin-top: 14px;
}

#wemd .wemd-faq .wemd-component-body li strong::before {
  content: "";
  display: inline-block;
  width: 7px;
  height: 7px;
  background: var(--wemd-primary, #07c160);
  transform: rotate(45deg);
  margin-right: 10px;
  vertical-align: middle;
}

/* 问答对之间的分割线 */
#wemd .wemd-faq .wemd-component-body > p:has(strong) + p + p:has(strong) {
  margin-top: 18px;
  padding-top: 18px;
  border-top: 1px dashed var(--wemd-border, #e2e8f0);
}

/* ---------- simple 简洁风格 ---------- */
#wemd .wemd-faq[data-style="simple"] {
  padding: 0;
  display: block;
}

#wemd .wemd-faq[data-style="simple"] .wemd-component-body {
  max-width: none;
  border: none;
  background: transparent;
  box-shadow: none;
  padding: 0;
  border-radius: 0;
}

#wemd .wemd-faq[data-style="simple"] .wemd-component-body[data-title]::before {
  display: none;
}

#wemd .wemd-faq[data-style="simple"] .wemd-component-body[data-title] {
  padding-top: 0;
}

/* simple 风格标题 */
#wemd .wemd-faq[data-style="simple"] .wemd-component-body > p:first-child {
  font-size: 18px;
  font-weight: 700;
  color: var(--wemd-text-strong, #1a1a1a);
  margin: 0 0 16px 0;
  padding-bottom: 10px;
  border-bottom: 2px solid var(--wemd-primary, #07c160);
}

#wemd .wemd-faq[data-style="simple"] .wemd-component-body > p:has(strong) {
  display: flex;
  align-items: flex-start;
  gap: 0;
  margin: 16px 0 0 0;
}

#wemd .wemd-faq[data-style="simple"] .wemd-component-body > p:has(strong) + p {
  margin-left: 22px;
}

/* simple 风格菱形符号 */
#wemd .wemd-faq[data-style="simple"] .wemd-component-body > p > strong::before {
  background: var(--wemd-primary, #07c160);
}
`;
