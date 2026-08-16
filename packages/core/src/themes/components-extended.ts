/**
 * 公众号组件样式 - 扩展组件库（9 个基础/通用组件）
 *
 * 与 components-default.ts / components-extra.ts 共享同一套 CSS 变量：
 * - --wemd-primary / --wemd-primary-dark / --wemd-primary-light
 * - --wemd-bg-soft / --wemd-bg-card / --wemd-text-strong / --wemd-text-soft / --wemd-border
 *
 * 组件清单（9 个）：
 * article-section / code-block / callout / steps / accordion
 * pullquote / divider / table / image-compare
 *
 * 全部遵循 `.wemd-component-body` CSS 契约（首段即标题、后续段落/列表即内容）。
 * 独立成文件避免 components-extra.ts 超过 500 行红线。
 */

export const componentStylesExtended = `/* === WeMD 扩展组件样式（跟随主题色变量） === */

/* === article-section 正文分区容器 === */
#wemd .wemd-article-section {
  margin: 24px 0;
  padding: 4px 0 22px;
  border-bottom: 1px solid var(--wemd-border-soft, #f0f0f0);
}

#wemd .wemd-article-section .wemd-component-body > p:first-child {
  margin-top: 0;
}

#wemd .wemd-article-section .wemd-component-body > p:last-child {
  margin-bottom: 0;
}

/* === code-block 代码块（Mac 终端窗风格） === */
#wemd .wemd-code-block {
  margin: 20px 0;
  border-radius: 12px;
  overflow: hidden;
  background: #1e1e2e;
  border: 1px solid #3a3a4d;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18);
}

#wemd .wemd-code-block .wemd-component-body {
  margin: 0;
}

/* 标题栏（三色点 + 语言标签） */
#wemd .wemd-cb-window {
  border-radius: 12px;
  overflow: hidden;
}

#wemd .wemd-cb-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background: #2a2a3d;
  border-bottom: 1px solid #3a3a4d;
}

#wemd .wemd-cb-dots {
  display: inline-flex;
  gap: 6px;
  flex-shrink: 0;
}

#wemd .wemd-cb-dot {
  display: inline-block;
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

#wemd .wemd-cb-dot-r { background: #ff5f57; }
#wemd .wemd-cb-dot-y { background: #febc2e; }
#wemd .wemd-cb-dot-g { background: #28c840; }

#wemd .wemd-cb-lang {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.5px;
  color: #a6a6c2;
  font-family: var(--wemd-code-font-family, "SF Mono", Consolas, monospace);
}

/* 代码主体（高特异性覆盖各主题全局 pre/code 的边框、内边距与溢出） */
#wemd .wemd-code-block .wemd-component-body > div.wemd-cb-window > pre {
  margin: 0;
  padding: 0;
  overflow-x: auto;
  border-radius: 0;
  border: none;
  border-top: none;
  background: #1e1e2e;
}

/* 深色底上的横向滑块：让滚动条在 #1e1e2e 背景下可见 */
#wemd .wemd-code-block .wemd-component-body > div.wemd-cb-window > pre::-webkit-scrollbar {
  height: 12px;
}
#wemd .wemd-code-block .wemd-component-body > div.wemd-cb-window > pre::-webkit-scrollbar-track {
  background: #16161f;
  border-radius: 0 0 10px 10px;
}
#wemd .wemd-code-block .wemd-component-body > div.wemd-cb-window > pre::-webkit-scrollbar-thumb {
  background: #3a3a4d;
  border-radius: 6px;
  border: 2px solid #16161f;
}
#wemd .wemd-code-block .wemd-component-body > div.wemd-cb-window > pre::-webkit-scrollbar-thumb:hover {
  background: #4a4a5f;
}
/* Firefox 滚动条 */
#wemd .wemd-code-block .wemd-component-body > div.wemd-cb-window > pre {
  scrollbar-color: #3a3a4d #16161f;
  scrollbar-width: thin;
}

#wemd .wemd-code-block .wemd-component-body > div.wemd-cb-window > pre code,
#wemd .wemd-code-block .wemd-component-body > div.wemd-cb-window > pre code.hljs {
  display: block;
  min-width: max-content;
  font-family: var(--wemd-code-font-family, "SF Mono", Consolas, monospace);
  font-size: 13px;
  line-height: 1.7;
  color: #e4e4ef;
  background: transparent;
  padding: 16px 18px;
  white-space: pre;
  border: none;
}

/* 兼容：无标题栏时（旧结构 p 标题） */
#wemd .wemd-code-block .wemd-component-body > p:first-child {
  margin: 0;
  padding: 10px 16px;
  font-size: 12.5px;
  font-weight: 600;
  letter-spacing: 0.5px;
  color: #a6a6c2;
  background: #2a2a3d;
  border-bottom: 1px solid #3a3a4d;
}

/* 深色终端窗内语法高亮配色（覆盖默认 hljs 浅色配色，保证深底可读） */
#wemd .wemd-code-block .wemd-cb-window code.hljs,
#wemd .wemd-code-block .wemd-cb-window .hljs {
  color: #e4e4ef;
  background: #1e1e2e;
}

#wemd .wemd-code-block .wemd-cb-window .hljs-comment,
#wemd .wemd-code-block .wemd-cb-window .hljs-quote {
  color: #7f7f9e;
  font-style: italic;
}

#wemd .wemd-code-block .wemd-cb-window .hljs-keyword,
#wemd .wemd-code-block .wemd-cb-window .hljs-selector-tag,
#wemd .wemd-code-block .wemd-cb-window .hljs-subst {
  color: #c792ea;
}

#wemd .wemd-code-block .wemd-cb-window .hljs-string,
#wemd .wemd-code-block .wemd-cb-window .hljs-doctag,
#wemd .wemd-code-block .wemd-cb-window .hljs-regexp {
  color: #a5e844;
}

#wemd .wemd-code-block .wemd-cb-window .hljs-number,
#wemd .wemd-code-block .wemd-cb-window .hljs-literal,
#wemd .wemd-code-block .wemd-cb-window .hljs-variable,
#wemd .wemd-code-block .wemd-cb-window .hljs-template-variable {
  color: #ffab70;
}

#wemd .wemd-code-block .wemd-cb-window .hljs-title,
#wemd .wemd-code-block .wemd-cb-window .hljs-section,
#wemd .wemd-code-block .wemd-cb-window .hljs-built_in {
  color: #82aaff;
}

#wemd .wemd-code-block .wemd-cb-window .hljs-attr,
#wemd .wemd-code-block .wemd-cb-window .hljs-attribute,
#wemd .wemd-code-block .wemd-cb-window .hljs-name,
#wemd .wemd-code-block .wemd-cb-window .hljs-tag {
  color: #f07178;
}

#wemd .wemd-code-block .wemd-cb-window .hljs-meta {
  color: #89ddff;
}

/* === callout 提示框 === */
#wemd .wemd-callout {
  margin: 22px 0;
  padding: 14px 16px 14px 18px;
  border-radius: 10px;
  background: var(--wemd-bg-muted, #f0fdf4);
  border-left: 4px solid var(--wemd-primary, #07c160);
}

#wemd .wemd-callout .wemd-component-body > p {
  margin: 0;
  font-size: 15px;
  line-height: 1.8;
  color: var(--wemd-text-normal, #334155);
}

#wemd .wemd-callout .wemd-component-body > p + p {
  margin-top: 8px;
}

#wemd .wemd-callout .wemd-component-body > p:first-child strong {
  color: var(--wemd-primary-dark, #0a8f4a);
}

/* === steps 步骤条 === */
#wemd .wemd-steps {
  margin: 22px 0;
  padding: 20px 20px 6px;
  border-radius: 14px;
  background: var(--wemd-bg-soft, #f7f8fa);
  border: 1px solid var(--wemd-border-soft, #eef0f3);
}

#wemd .wemd-steps .wemd-component-body > p:first-child {
  margin: 0 0 14px;
  font-size: 17px;
  font-weight: 700;
  color: var(--wemd-text-strong, #1a1a1a);
}

#wemd .wemd-steps .wemd-component-body ol,
#wemd .wemd-steps .wemd-component-body ul {
  margin: 0;
  padding: 0;
  list-style: none;
  counter-reset: wemd-step;
}

#wemd .wemd-steps .wemd-component-body li {
  display: flex;
  align-items: center;
  margin: 0 0 14px;
  padding: 10px 12px;
  border-radius: 10px;
  background: var(--wemd-bg-card, #ffffff);
  border: 1px solid var(--wemd-border-soft, #eef0f3);
  font-size: 14.5px;
  line-height: 1.7;
  color: var(--wemd-text-normal, #334155);
}

#wemd .wemd-steps .wemd-component-body li::before {
  counter-increment: wemd-step;
  content: counter(wemd-step);
  flex-shrink: 0;
  width: 26px;
  height: 26px;
  margin-right: 12px;
  border-radius: 50%;
  background: var(--wemd-primary, #07c160);
  color: #ffffff;
  font-size: 13px;
  font-weight: 700;
  line-height: 26px;
  text-align: center;
}

#wemd .wemd-steps .wemd-component-body li strong {
  color: var(--wemd-primary-dark, #0a8f4a);
}

/* 步骤正文作为 flex item 占满剩余宽度，并消除 markdown 段落自带的垂直边距 */
#wemd .wemd-steps .wemd-component-body li section {
  flex: 1;
  min-width: 0;
  margin-top: 0;
  margin-bottom: 0;
}

/* === accordion 折叠面板（微信无交互，静态展开卡片） === */
#wemd .wemd-accordion {
  margin: 22px 0;
  padding: 4px 0;
}

#wemd .wemd-accordion .wemd-component-body > p {
  margin: 0;
}

#wemd .wemd-accordion .wemd-component-body > p.wemd-q {
  margin: 14px 0 0;
  padding: 12px 16px;
  border-radius: 10px 10px 0 0;
  background: var(--wemd-primary-light, #d1fae5);
  color: var(--wemd-primary-dark, #0a8f4a);
  font-size: 15px;
  font-weight: 700;
  line-height: 1.6;
  border-bottom: 1px dashed var(--wemd-border, #e2e8f0);
}

#wemd .wemd-accordion .wemd-component-body > p.wemd-q:first-child {
  margin-top: 0;
}

#wemd .wemd-accordion .wemd-component-body > p.wemd-q::before {
  content: "＋";
  display: inline-block;
  margin-right: 8px;
  color: var(--wemd-primary, #07c160);
  font-weight: 700;
}

#wemd .wemd-accordion .wemd-component-body > p.wemd-q + p {
  margin: 0 0 14px;
  padding: 10px 16px 12px;
  border-radius: 0 0 10px 10px;
  background: var(--wemd-bg-soft, #f7f8fa);
  font-size: 14px;
  line-height: 1.8;
  color: var(--wemd-text-normal, #334155);
}

/* === pullquote 大段引用 === */
#wemd .wemd-pullquote {
  margin: 26px 0;
  padding: 22px 24px;
  border-radius: 14px;
  background: var(--wemd-bg-soft, #f7f8fa);
  border-left: 5px solid var(--wemd-primary, #07c160);
}

#wemd .wemd-pullquote .wemd-component-body > p {
  margin: 0;
  font-size: 17px;
  font-weight: 600;
  line-height: 1.9;
  color: var(--wemd-text-strong, #1a1a1a);
}

#wemd .wemd-pullquote .wemd-component-body > p:first-child::before {
  content: "“";
  color: var(--wemd-primary, #07c160);
  font-size: 30px;
  line-height: 0;
  vertical-align: -8px;
  margin-right: 4px;
}

/* === divider 分隔线（可带文字） === */
#wemd .wemd-divider {
  margin: 26px 0;
}

#wemd .wemd-divider .wemd-component-body {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

#wemd .wemd-divider .wemd-component-body::before {
  content: "";
  flex: 1;
  height: 1px;
  background: var(--wemd-border, #e2e8f0);
}

#wemd .wemd-divider .wemd-component-body::after {
  content: "";
  flex: 1;
  height: 1px;
  background: var(--wemd-border, #e2e8f0);
}

#wemd .wemd-divider .wemd-component-body > p {
  margin: 0;
  padding: 0 16px;
  font-size: 13px;
  color: var(--wemd-text-soft, #64748b);
  white-space: nowrap;
}

#wemd .wemd-divider .wemd-component-body:empty::before {
  content: "";
  flex: 1;
  height: 1px;
  background: var(--wemd-border, #e2e8f0);
}

#wemd .wemd-divider .wemd-component-body:empty::after {
  content: none;
}

/* === table 数据表格 === */
#wemd .wemd-table {
  margin: 24px 0;
}

#wemd .wemd-table .wemd-component-body .table-container table {
  width: 100%;
  border-collapse: collapse;
  border-radius: 8px;
  overflow: hidden;
  font-size: 14px;
}

#wemd .wemd-table .wemd-component-body .table-container table th {
  background: var(--wemd-primary, #07c160);
  color: #ffffff;
  font-weight: 600;
  padding: 11px 14px;
  text-align: left;
  border: none;
}

#wemd .wemd-table .wemd-component-body .table-container table td {
  padding: 10px 14px;
  color: var(--wemd-text-normal, #334155);
  border-bottom: 1px solid var(--wemd-border, #e2e8f0);
  background: var(--wemd-bg-card, #ffffff);
}

#wemd .wemd-table .wemd-component-body .table-container table tbody tr:nth-child(even) td {
  background: var(--wemd-bg-soft, #f7f8fa);
}

/* === image-compare 双图对比 === */
#wemd .wemd-image-compare {
  margin: 24px 0;
}

#wemd .wemd-image-compare .wemd-component-body {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

#wemd .wemd-image-compare .wemd-component-body figure {
  margin: 0;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid var(--wemd-border-soft, #eef0f3);
}

#wemd .wemd-image-compare .wemd-component-body img {
  display: block;
  width: 100%;
  height: auto;
}

#wemd .wemd-image-compare .wemd-component-body figcaption {
  padding: 8px 10px;
  font-size: 12.5px;
  color: var(--wemd-text-soft, #64748b);
  text-align: center;
  background: var(--wemd-bg-soft, #f7f8fa);
}

#wemd .wemd-image-compare .wemd-component-body > p:first-child {
  margin-top: 0;
}
`;
