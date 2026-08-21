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

/* === quote-card 金句卡片（primary 主色，跟随主题） ===
   设计方向 D：上下主色装饰线夹住居中文字，杂志式留白。
   纯原生 border 实现，微信 100% 保留，不依赖 absolute / 伪元素。 */
#wemd .wemd-quote-card {
  margin: 32px 0;
  padding: 28px 16px;
  box-sizing: border-box;
}

/* 金句正文（居中，撑满卡片） */
#wemd .wemd-quote-card .wemd-qc-quote {
  font-size: 17px;
  line-height: 1.75;
  color: var(--wemd-text-strong, #1a1a1a);
  margin: 0;
  font-weight: 500;
  text-align: center;
}

/* 作者署名（居中，像落款） */
#wemd .wemd-quote-card .wemd-qc-author {
  display: block;
  margin-top: 16px;
  font-size: 13px;
  color: var(--wemd-text-soft, #8a8a8a);
  text-align: center;
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

#wemd .wemd-divider-fancy .wemd-df-label {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  font-size: 14px;
  color: var(--wemd-text-soft, #8a8a8a);
  margin: 0;
}

#wemd .wemd-divider-fancy .wemd-df-label .wemd-df-line {
  flex: 1;
  height: 1px;
  background: linear-gradient(to right, transparent, var(--wemd-primary, #07c160), transparent);
  font-size: 0;
  line-height: 0;
  overflow: hidden;
}

#wemd .wemd-divider-fancy .wemd-df-label .wemd-df-line-left {
  margin-right: 16px;
}

#wemd .wemd-divider-fancy .wemd-df-label .wemd-df-line-right {
  margin-left: 16px;
}

/* 分隔线中间装饰点（primary 色） */
#wemd .wemd-divider-fancy .wemd-df-label .wemd-df-dots {
  color: var(--wemd-primary, #07c160);
  font-size: 20px;
  letter-spacing: 8px;
  text-align: center;
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

#wemd .wemd-cta-card .wemd-cta-title {
  font-size: 18px;
  font-weight: 600;
  color: #ffffff;
  margin: 0 0 8px 0;
  line-height: 1.5;
}

#wemd .wemd-cta-card .wemd-cta-body {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.9);
  margin: 0 0 16px 0;
  line-height: 1.7;
}

/* CTA 卡片按钮样式（action 槽，末段文案） */
#wemd .wemd-cta-card .wemd-cta-action {
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
  border-radius: var(--wemd-border-radius, 8px);
  overflow: hidden;
  border: 1px solid var(--wemd-border, #e2e8f0);
  background: var(--wemd-bg-soft, #f8fafc);
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.06);
}

/* 头部条：标题 */
#wemd .wemd-code-frame .wemd-cf-title {
  margin: 0;
  padding: 8px 14px;
  background: var(--wemd-bg-soft, #f1f5f9);
  border-bottom: 1px solid var(--wemd-border, #e2e8f0);
  font-size: 13px;
  color: var(--wemd-text-soft, #475569);
  font-weight: 500;
  font-family: "SF Mono", Monaco, Consolas, monospace;
}

/* 代码内容（用代码块语法包裹的内容会自动生成 pre） */
#wemd .wemd-code-frame .wemd-cf-code pre {
  margin: 0;
  border-radius: 0;
  background: var(--wemd-bg-soft, #f8fafc);
}

#wemd .wemd-code-frame .wemd-cf-code pre code {
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
  border-top: 1px solid var(--wemd-border, #e2e8f0);
  border-right: 1px solid var(--wemd-border, #e2e8f0);
  border-bottom: 1px solid var(--wemd-border, #e2e8f0);
  /* 左侧色条：用 border-left（原生边框，微信 100% 保留，不依赖 ::before/position） */
  border-left: 4px solid var(--wemd-primary, #07c160);
  overflow: hidden;
  box-shadow: 0 6px 18px rgba(15, 23, 42, 0.06);
  /* 注：不设 position:relative —— 公众号会删除 relative/absolute，影响稳定。
     原 ::before 色条已移到 border-left，z-index 语义不再需要。 */
}

/* 左侧色条统一跟随主题主色（border-left-color 已设，见容器规则）。
   不再用 ::before + absolute 色条 span（公众号删 position 会丢）。
   type 语义仅通过标题图标区分，见下方图标规则。 */

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

/* type 标签前缀（图标由渲染期 data-type 注入，物化逻辑见 pseudoElementInline） */
#wemd .wemd-callout-pro[data-type="info"] .wemd-component-body > p:first-child::before { content: "ℹ️"; }
#wemd .wemd-callout-pro[data-type="success"] .wemd-component-body > p:first-child::before { content: "✅"; }
#wemd .wemd-callout-pro[data-type="warning"] .wemd-component-body > p:first-child::before { content: "⚠️"; }
#wemd .wemd-callout-pro[data-type="danger"] .wemd-component-body > p:first-child::before { content: "❌"; }
#wemd .wemd-callout-pro[data-type="tip"] .wemd-component-body > p:first-child::before { content: "💡"; }

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

/* 列表项（用 ::before 自定义绿色圆点，替代微信不支持的 ::marker） */
#wemd .wemd-callout-pro .wemd-component-body ul {
  list-style: none;
  padding-left: 0;
  margin: 8px 0;
}

#wemd .wemd-callout-pro .wemd-component-body ul li {
  display: flex;
  align-items: flex-start;
  padding-left: 0;
  font-size: 15px;
  line-height: 1.75;
  color: var(--wemd-text-soft, #475569);
  margin: 4px 0;
}

/* 列表项圆点：flex 子项 + margin（不用 absolute 定位，公众号删 position 不丢）。
   物化器按此规则生成 span，导出与预览一致 */
#wemd .wemd-callout-pro .wemd-component-body ul li::before {
  content: "•";
  flex: none;
  width: 14px;
  color: var(--wemd-primary, #07c160);
  font-weight: bold;
  font-size: 18px;
  line-height: 1.75;
}

/* === stats-block 数据统计块（accent 数字跳出来） === */
#wemd .wemd-stats-block {
  margin: 24px 0;
  padding: 24px;
  background: linear-gradient(135deg, var(--wemd-bg-soft, #f0fdf4) 0%, var(--wemd-bg-card, #ffffff) 100%);
  border-radius: 12px;
  border: 1px solid var(--wemd-primary-light, #d1fae5);
}

/* 标题（可选，首段纯文字） */
#wemd .wemd-stats-block .wemd-sb-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--wemd-text-strong, #1e293b);
  margin: 0 0 12px 0;
}

/* 数据条目容器 */
#wemd .wemd-stats-block .wemd-sb-items {
  list-style: none;
  padding: 0;
  margin: 0;
}
/* 每条数据一行（value + label 两端对齐） */
#wemd .wemd-stats-block .wemd-sb-items-item {
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

/* 数值高亮（用 accent 点缀色跳出来） */
#wemd .wemd-stats-block .wemd-sb-items-value {
  color: var(--wemd-accent, #07c160);
  font-size: 18px;
  font-weight: 700;
  font-family: "SF Mono", Monaco, Consolas, monospace;
}

/* === image-grid 图片网格 === */
#wemd .wemd-image-grid {
  margin: 24px 0;
}

/* 架构改版后 markdown 渲染为单个 <p> 内多张 <img>（无 ul/ol），p 即网格容器 */
#wemd .wemd-image-grid .wemd-component-body > p {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  margin: 0;
  padding: 0;
  text-align: left;
}

#wemd .wemd-image-grid .wemd-component-body > p img {
  width: 100%;
  height: auto;
  display: block;
  border-radius: 6px;
  margin: 0;
}

/* 兼容：标题段（p 中无图时作为说明文字） */
#wemd .wemd-image-grid .wemd-component-body > p:not(:has(img)) {
  font-size: 14px;
  color: var(--wemd-text-soft, #64748b);
  text-align: center;
  margin: 0 0 12px 0;
  letter-spacing: 0.3px;
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

/* 第一张图片作为头像（兼容独立图片段落被 implicit-figures 包成 figure） */
#wemd .wemd-author-card .wemd-component-body figure:first-child img,
#wemd .wemd-author-card .wemd-component-body > p img:first-of-type {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  object-fit: cover;
  margin: 0;
  flex-shrink: 0;
  border: 2px solid #ffffff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* 首段作为名称 + 角色容器（用 first-of-type，兼容 figure 先行） */
#wemd .wemd-author-card .wemd-component-body > p:first-of-type {
  margin: 0;
  flex: 1;
  min-width: 0;
}

#wemd .wemd-author-card .wemd-component-body > p:first-of-type strong {
  display: block;
  font-size: 17px;
  font-weight: 600;
  color: var(--wemd-text-strong, #1a1a1a);
  margin-bottom: 4px;
}

#wemd .wemd-author-card .wemd-component-body > p:first-of-type em {
  display: block;
  font-style: normal;
  font-size: 13px;
  color: var(--wemd-text-soft, #64748b);
}

/* 后续段落作为简介 */
#wemd .wemd-author-card .wemd-component-body > p:not(:first-of-type) {
  font-size: 14px;
  color: var(--wemd-text-soft, #475569);
  line-height: 1.7;
  margin: 0;
  width: 100%;
}

/* 末段简介顶部分隔线（仅当存在不止一段 p 时，避免单段作者名被误加边框） */
#wemd .wemd-author-card .wemd-component-body > p:last-of-type:not(:first-of-type) {
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
#wemd .wemd-timeline .wemd-tl-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--wemd-text-strong, #1e293b);
  margin: 0 0 16px 0;
  letter-spacing: 0.3px;
}

/* 事件列表作为时间线主体。
   竖线用容器 border-left 实现（纯原生边框，微信 100% 保留）。
   不用绝对定位 span + top/bottom 拉伸：微信会丢弃 span 的 bottom，
   导致竖线高度塌陷为 0 而消失。 */
#wemd .wemd-timeline .wemd-tl-events {
  list-style: none;
  padding: 0 0 0 20px;
  margin: 0;
  border-left: 2px solid var(--wemd-primary, #07c160);
  /* 注：不设 position:relative —— 公众号会删除 relative/absolute。此处仅用 border-left 画竖线即可。 */
}

/* 每一项：flex 行布局，圆点跨竖线居中（公众号保留 flex/负 margin，不依赖 position） */
#wemd .wemd-timeline .wemd-tl-item {
  display: flex;
  align-items: flex-start;
  margin: 0;
  color: var(--wemd-text-soft, #334155);
  font-size: 14px;
  line-height: 1.7;
  list-style: none;
}

#wemd .wemd-timeline .wemd-tl-text {
  flex: 1;
  vertical-align: top;
}

/* 圆点（primary 边框，真实元素以兼容微信）。
   空心圆点定位：flex 子项 + 负 margin-left 向左跨到竖线中心。
   几何：events border-left 2px（中心 x=1）+ padding-left 20px = item 内容起点 x=22；
   圆点宽 12px 半径 6px，margin-left:-27px 让左边缘到 x=22-27=-5 → 圆心落在 x=-5+6=1=竖线中心。
   与圆点尺寸无关（-27 = item起点22 + 圆点半宽6 - 竖线中心1）。文字 flex:1 排右侧，多行正常换行。
   不再用 position:absolute（公众号会删除，导致圆点退回流内变实心绿点错位）。
   注：早期误用 left:-21px / m-26px 会让圆心落到 x=7/2，偏右 6/1px；须精确等于 -27px。 */
#wemd .wemd-timeline .wemd-tl-dot {
  flex: none;
  width: 12px;
  height: 12px;
  margin-top: 5px;
  margin-left: -27px;
  margin-right: 10px;
  border-radius: 50%;
  background: #ffffff;
  border: 2px solid var(--wemd-primary, #07c160);
  box-sizing: border-box;
  font-size: 0;
  line-height: 0;
  overflow: hidden;
}
`;
