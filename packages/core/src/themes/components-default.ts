/**
 * 公众号组件样式 - 默认 Design Language
 *
 * 这些样式作为所有主题的"组件基础样式"，
 * 通过 .wemd-component 和 .wemd-{type} 类名作用域
 *
 * 配色策略（方案 B 轻量版）：
 * - 所有颜色用 CSS 变量 + fallback
 * - 主题可在自己的 CSS 里定义 --wemd-* 变量覆盖配色
 * - 未定义变量的主题自动使用 fallback（微信绿配色）
 *
 * 变量清单：
 * - --wemd-primary: 主色（用于强调、边框、装饰）
 * - --wemd-primary-dark: 主色深色（用于渐变深端）
 * - --wemd-primary-light: 主色浅色（用于渐变浅端、背景 tint）
 * - --wemd-bg-soft: 卡片浅背景
 * - --wemd-text-strong: 强调文字色
 * - --wemd-text-soft: 次要文字色
 * - --wemd-border: 边框色
 */

export const componentStylesDefault = `/* === WeMD 组件样式（默认，跟随主题色变量） === */

/* 组件容器基础样式 */
#wemd .wemd-component {
  margin: 24px 0;
  box-sizing: border-box;
}

#wemd .wemd-component-body {
  box-sizing: border-box;
}

/* === quote-card 金句卡片（primary 主色，跟随主题） === */
#wemd .wemd-quote-card {
  position: relative;
  padding: 28px 24px 20px 24px;
  background: linear-gradient(135deg, var(--wemd-bg-soft, #f7f8fa) 0%, var(--wemd-bg-card, #ffffff) 100%);
  border-left: 4px solid var(--wemd-primary, #07c160);
  border-radius: 8px;
  overflow: hidden;
}

/* 左上角引号水印（primary 色，弱化装饰） */
#wemd .wemd-quote-card::before {
  content: """;
  position: absolute;
  top: -8px;
  left: 12px;
  font-size: 80px;
  line-height: 1;
  color: var(--wemd-primary, #07c160);
  opacity: 0.12;
  font-family: Georgia, serif;
  pointer-events: none;
}

/* body 正常流布局 */
#wemd .wemd-quote-card .wemd-component-body {
  position: relative;
}

/* 金句正文（左对齐，撑满卡片） */
#wemd .wemd-quote-card .wemd-component-body > p:first-child {
  font-size: 17px;
  line-height: 1.75;
  color: var(--wemd-text-strong, #1a1a1a);
  margin: 0 0 12px 0;
  font-weight: 500;
  text-align: left;
}

/* 作者署名（右对齐，像信件落款） */
#wemd .wemd-quote-card[data-props*="author"] .wemd-component-body::after {
  display: block;
  margin-top: 12px;
  padding-top: 8px;
  border-top: 1px dashed var(--wemd-border, #e2e8f0);
  font-size: 13px;
  color: var(--wemd-text-soft, #8a8a8a);
  content: "— " attr(data-props);
  text-align: right;
}

/* === divider-fancy 装饰分割线（primary 主色，跟随主题） === */
#wemd .wemd-divider-fancy {
  text-align: center;
  margin: 32px 0;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

#wemd .wemd-divider-fancy .wemd-component-body {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
}

#wemd .wemd-divider-fancy .wemd-component-body::before,
#wemd .wemd-divider-fancy .wemd-component-body::after {
  content: "";
  flex: 1;
  height: 1px;
  background: linear-gradient(to right, transparent, var(--wemd-primary, #07c160), transparent);
}

#wemd .wemd-divider-fancy .wemd-component-body::before {
  margin-right: 16px;
}

#wemd .wemd-divider-fancy .wemd-component-body::after {
  margin-left: 16px;
}

/* 分割线中间装饰点（primary 色） */
#wemd .wemd-divider-fancy .wemd-component-body:empty::before,
#wemd .wemd-divider-fancy .wemd-component-body:empty::after {
  content: "· · ·";
  flex: none;
  color: var(--wemd-primary, #07c160);
  font-size: 20px;
  letter-spacing: 8px;
  background: none;
  height: auto;
  margin: 0;
}

/* === cta-card 关注引导卡片 === */
#wemd .wemd-cta-card {
  padding: 32px 24px;
  background: linear-gradient(135deg, var(--wemd-primary, #07c160) 0%, var(--wemd-primary-dark, #0a8f4a) 100%);
  border-radius: 12px;
  text-align: center;
  color: #ffffff;
  margin: 32px 0;
}

#wemd .wemd-cta-card .wemd-component-body > p:first-child {
  font-size: 18px;
  font-weight: 600;
  color: #ffffff;
  margin: 0 0 8px 0;
  line-height: 1.5;
}

#wemd .wemd-cta-card .wemd-component-body > p:nth-child(2) {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.9);
  margin: 0 0 16px 0;
}

/* CTA 卡片按钮样式（第二个段落之后的内容渲染为按钮） */
#wemd .wemd-cta-card .wemd-component-body > p:last-child {
  display: inline-block;
  padding: 8px 24px;
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 24px;
  font-size: 14px;
  font-weight: 500;
  margin: 8px 0 0 0;
}

/* === code-frame 代码框（带标题/语言标签） === */
#wemd .wemd-code-frame {
  margin: 24px 0;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--wemd-border, #e2e8f0);
  background: var(--wemd-bg-soft, #f8fafc);
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.06);
}

/* 头部条：标题 + 语言标签 */
#wemd .wemd-code-frame .wemd-component-body > p:first-child {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 0;
  padding: 8px 14px;
  background: var(--wemd-bg-soft, #f1f5f9);
  border-bottom: 1px solid var(--wemd-border, #e2e8f0);
  font-size: 13px;
  color: var(--wemd-text-soft, #475569);
  font-weight: 500;
  font-family: "SF Mono", Monaco, Consolas, monospace;
}

#wemd .wemd-code-frame .wemd-component-body > p:first-child strong {
  color: var(--wemd-text-strong, #1e293b);
  font-weight: 600;
}

/* 代码内容（用代码块语法包裹的内容会自动生成 pre） */
#wemd .wemd-code-frame .wemd-component-body > pre {
  margin: 0;
  border-radius: 0;
  background: var(--wemd-bg-soft, #f8fafc);
}

#wemd .wemd-code-frame .wemd-component-body > pre code {
  display: block;
  padding: 16px;
  background: transparent;
  font-family: "SF Mono", Monaco, Consolas, monospace;
  font-size: 13px;
  line-height: 1.6;
  color: var(--wemd-text-strong, #334155);
  border: none;
}

/* === callout-pro 强化提示框 === */
#wemd .wemd-callout-pro {
  margin: 24px 0;
  padding: 20px 24px;
  border-radius: 12px;
  background: #ffffff;
  border: 1px solid var(--wemd-border, #e2e8f0);
  position: relative;
  overflow: hidden;
  box-shadow: 0 6px 18px rgba(15, 23, 42, 0.06);
}

/* 左侧色条（默认用 primary，语义类型用固定色） */
#wemd .wemd-callout-pro::before {
  content: "";
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background: var(--wemd-primary, #07c160);
}

/* type 变体（固定语义色，不跟随主题，保证语义一致性） */
#wemd .wemd-callout-pro[data-props*="\\"type\\":\\"info\\""]::before { background: #3b82f6; }
#wemd .wemd-callout-pro[data-props*="\\"type\\":\\"success\\""]::before { background: #10b981; }
#wemd .wemd-callout-pro[data-props*="\\"type\\":\\"warning\\""]::before { background: #f59e0b; }
#wemd .wemd-callout-pro[data-props*="\\"type\\":\\"danger\\""]::before { background: #ef4444; }
#wemd .wemd-callout-pro[data-props*="\\"type\\":\\"tip\\""]::before { background: #8b5cf6; }

/* 标题（第一段，含 strong 或纯文本） */
#wemd .wemd-callout-pro .wemd-component-body > p:first-child {
  font-size: 16px;
  font-weight: 600;
  color: var(--wemd-text-strong, #1e293b);
  margin: 0 0 8px 0;
  display: flex;
  align-items: center;
  gap: 6px;
}

/* type 标签前缀 */
#wemd .wemd-callout-pro[data-props*="\\"type\\":\\"info\\""] .wemd-component-body > p:first-child::before { content: "ℹ️"; }
#wemd .wemd-callout-pro[data-props*="\\"type\\":\\"success\\""] .wemd-component-body > p:first-child::before { content: "✅"; }
#wemd .wemd-callout-pro[data-props*="\\"type\\":\\"warning\\""] .wemd-component-body > p:first-child::before { content: "⚠️"; }
#wemd .wemd-callout-pro[data-props*="\\"type\\":\\"danger\\""] .wemd-component-body > p:first-child::before { content: "❌"; }
#wemd .wemd-callout-pro[data-props*="\\"type\\":\\"tip\\""] .wemd-component-body > p:first-child::before { content: "💡"; }

/* 正文段落 */
#wemd .wemd-callout-pro .wemd-component-body > p {
  font-size: 15px;
  line-height: 1.75;
  color: var(--wemd-text-soft, #475569);
  margin: 4px 0;
}

#wemd .wemd-callout-pro .wemd-component-body > p:last-child {
  margin-bottom: 0;
}

/* === stats-block 数据统计块（accent 数字跳出来） === */
#wemd .wemd-stats-block {
  margin: 24px 0;
  padding: 24px;
  background: linear-gradient(135deg, var(--wemd-bg-soft, #f0fdf4) 0%, var(--wemd-bg-card, #ffffff) 100%);
  border-radius: 12px;
  border: 1px solid var(--wemd-primary-light, #d1fae5);
}

/* 第一个段落作为标题 */
#wemd .wemd-stats-block .wemd-component-body > p:first-child {
  font-size: 15px;
  font-weight: 600;
  color: var(--wemd-text-strong, #1a2332);
  margin: 0 0 16px 0;
  letter-spacing: 0.3px;
}

/* 其余段落作为数据条目（每段一行） */
#wemd .wemd-stats-block .wemd-component-body > p:not(:first-child) {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin: 8px 0;
  padding: 8px 12px;
  background: var(--wemd-bg-card, #ffffff);
  border-radius: 6px;
  font-size: 14px;
  color: var(--wemd-text-soft, #334155);
}

/* 段落中的 strong 作为数值高亮（用 accent 点缀色跳出来） */
#wemd .wemd-stats-block .wemd-component-body > p:not(:first-child) strong {
  color: var(--wemd-accent, #07c160);
  font-size: 18px;
  font-weight: 700;
  font-family: "SF Mono", Monaco, Consolas, monospace;
}

/* 列表场景：每条 li 一项 */
#wemd .wemd-stats-block .wemd-component-body ul {
  list-style: none;
  padding: 0;
  margin: 8px 0 0 0;
}

#wemd .wemd-stats-block .wemd-component-body li {
  padding: 8px 12px;
  margin: 6px 0;
  background: rgba(255, 255, 255, 0.7);
  border-radius: 6px;
  color: var(--wemd-text-soft, #334155);
  font-size: 14px;
}

#wemd .wemd-stats-block .wemd-component-body li strong {
  color: var(--wemd-accent, #07c160);
  font-size: 18px;
  font-weight: 700;
  font-family: "SF Mono", Monaco, Consolas, monospace;
}

/* === image-grid 图片网格 === */
#wemd .wemd-image-grid {
  margin: 24px 0;
}

/* 标题段落 */
#wemd .wemd-image-grid .wemd-component-body > p:first-child {
  font-size: 14px;
  color: var(--wemd-text-soft, #64748b);
  text-align: center;
  margin: 0 0 12px 0;
  letter-spacing: 0.3px;
}

/* 用列表项承载图片：每张图片为一项 */
#wemd .wemd-image-grid .wemd-component-body ul,
#wemd .wemd-image-grid .wemd-component-body ol {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  padding: 0;
  list-style: none;
  margin: 0;
}

#wemd .wemd-image-grid .wemd-component-body li {
  margin: 0;
  padding: 0;
  list-style: none;
}

#wemd .wemd-image-grid .wemd-component-body li img {
  width: 100%;
  height: auto;
  display: block;
  border-radius: 6px;
  margin: 0;
}

/* 单图时也居中显示 */
#wemd .wemd-image-grid .wemd-component-body > p > img:only-child {
  display: block;
  margin: 0 auto;
  max-width: 100%;
  border-radius: 6px;
}

/* === author-card 作者卡片 === */
#wemd .wemd-author-card {
  margin: 24px 0;
  padding: 20px 24px;
  background: var(--wemd-bg-soft, #fafafa);
  border-radius: 12px;
  border: 1px solid var(--wemd-border, #e2e8f0);
  display: flex;
  align-items: center;
  gap: 16px;
  box-sizing: border-box;
}

/* 让 body 容器变为 flex 容器（兼容内联结构） */
#wemd .wemd-author-card .wemd-component-body {
  display: flex;
  align-items: center;
  gap: 16px;
  width: 100%;
  flex-wrap: wrap;
}

/* 第一张图片作为头像 */
#wemd .wemd-author-card .wemd-component-body img:first-child {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  object-fit: cover;
  margin: 0;
  flex-shrink: 0;
  border: 2px solid #ffffff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* 第一段作为名称 + 角色容器 */
#wemd .wemd-author-card .wemd-component-body > p:first-child {
  margin: 0;
  flex: 1;
  min-width: 0;
}

#wemd .wemd-author-card .wemd-component-body > p:first-child strong {
  display: block;
  font-size: 17px;
  font-weight: 600;
  color: var(--wemd-text-strong, #1a1a1a);
  margin-bottom: 4px;
}

#wemd .wemd-author-card .wemd-component-body > p:first-child em {
  display: block;
  font-style: normal;
  font-size: 13px;
  color: var(--wemd-text-soft, #64748b);
}

/* 后续段落作为简介 */
#wemd .wemd-author-card .wemd-component-body > p:not(:first-child) {
  font-size: 14px;
  color: var(--wemd-text-soft, #475569);
  line-height: 1.7;
  margin: 0;
  width: 100%;
}

#wemd .wemd-author-card .wemd-component-body > p:last-child {
  margin-top: 8px;
  padding-top: 12px;
  border-top: 1px dashed var(--wemd-border, #e2e8f0);
}

/* === timeline 时间线（primary 主色，跟随主题） === */
#wemd .wemd-timeline {
  margin: 24px 0;
  padding: 20px 24px;
  background: var(--wemd-bg-card, #fafafa);
  border-radius: 12px;
  border: 1px solid var(--wemd-border, #e2e8f0);
}

/* 标题段落 */
#wemd .wemd-timeline .wemd-component-body > p:first-child {
  font-size: 15px;
  font-weight: 600;
  color: var(--wemd-text-strong, #1e293b);
  margin: 0 0 16px 0;
  letter-spacing: 0.3px;
}

/* 列表作为时间线主体 */
#wemd .wemd-timeline .wemd-component-body ul,
#wemd .wemd-timeline .wemd-component-body ol {
  list-style: none;
  padding: 0;
  margin: 0;
  position: relative;
}

/* 竖线（primary 色渐变） */
#wemd .wemd-timeline .wemd-component-body ul::before,
#wemd .wemd-timeline .wemd-component-body ol::before {
  content: "";
  position: absolute;
  left: 7px;
  top: 6px;
  bottom: 6px;
  width: 2px;
  background: linear-gradient(to bottom, var(--wemd-primary, #07c160), var(--wemd-bg-muted, #d1fae5));
  border-radius: 1px;
}

/* 每一项 */
#wemd .wemd-timeline .wemd-component-body li {
  position: relative;
  padding: 8px 0 8px 28px;
  margin: 0;
  color: var(--wemd-text-soft, #334155);
  font-size: 14px;
  line-height: 1.7;
  list-style: none;
}

/* 圆点（primary 边框） */
#wemd .wemd-timeline .wemd-component-body li::before {
  content: "";
  position: absolute;
  left: 2px;
  top: 14px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #ffffff;
  border: 2px solid var(--wemd-primary, #07c160);
  box-sizing: border-box;
  z-index: 1;
}

/* 加粗内容作为节点标题（primary 色） */
#wemd .wemd-timeline .wemd-component-body li strong {
  display: block;
  color: var(--wemd-primary, #07c160);
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 2px;
}

/* li 内 section 不继承默认 li 样式 */
#wemd .wemd-timeline .wemd-component-body li section {
  color: var(--wemd-text-soft, #475569);
  font-weight: 400;
  margin: 0;
  line-height: 1.7;
}
`;
