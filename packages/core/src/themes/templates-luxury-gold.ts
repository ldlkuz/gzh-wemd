/**
 * 黑金奢华 · 主题骨架模板（黑金荣誉证书风）
 *
 * 设计：按黑金奢华自身视觉稿规划，只写真正需要结构差异的组件。
 * - magazine-cover（黑金封面：内衬金框 + 金色小标 + 标题 + 金色分隔 + 描述）
 * - section-divider（章节：编号 + 标题 + 金色渐变线）
 * - divider（金色渐变线 + ◆ + 金色渐变线）
 * - divider-fancy（装饰线：左右金线 + 文字/◆，有标签也始终有线）
 * - 其余组件（quote-card / stats-block / timeline / styled-table / steps /
 *   end-card / code-frame 等）复用内置默认骨架，仅靠皮肤差异化。
 *
 * 微信约束：所有装饰均为真实 DOM 元素（无伪元素、无结构伪类）。
 */

/** 黑金封面：内衬金框 + 四角金饰角 + 金色小标 + 标题 + 金色分隔 + 描述（真实元素） */
export const luxuryGoldMagazineCover = (): string =>
  [
    '<section class="wemd-component wemd-magazine-cover" data-component="magazine-cover">',
    '<span class="wemd-lg-frame"></span>',
    '<span class="wemd-lg-corner wemd-lg-corner-tl"></span>',
    '<span class="wemd-lg-corner wemd-lg-corner-tr"></span>',
    '{{#if subtitle}}<section class="wemd-lg-kicker">{{slot:subtitle}}</section>{{/if}}',
    '{{#if title}}<section class="wemd-lg-title">{{slot:title}}</section>{{/if}}',
    '<span class="wemd-lg-rule"></span>',
    '{{#if desc}}<section class="wemd-lg-desc">{{slot:desc}}</section>{{/if}}',
    '<span class="wemd-lg-corner wemd-lg-corner-bl"></span>',
    '<span class="wemd-lg-corner wemd-lg-corner-br"></span>',
    "</section>",
  ].join("\n");

/** 黑金金句卡：顶部金色引号圆章（真实元素） */
export const luxuryGoldQuoteCard = (): string =>
  [
    '<section class="wemd-component wemd-quote-card" data-component="quote-card">',
    '<span class="wemd-lg-badge">\u201C</span>',
    '<section class="wemd-qc-quote">{{slot:quote}}</section>',
    '{{#if author}}<section class="wemd-qc-author">{{slot:author}}</section>{{/if}}',
    "</section>",
  ].join("\n");

/** 章节：编号 + 标题 + 金色渐变线（真实元素） */
export const luxuryGoldSectionDivider = (): string =>
  [
    '<section class="wemd-component wemd-section-divider" data-component="section-divider">',
    '<span class="wemd-lg-part">{{slot:part}}</span>',
    '<section class="wemd-lg-title">{{slot:title}}</section>',
    '<span class="wemd-lg-rule"></span>',
    "</section>",
  ].join("\n");

/** 分隔线：金色渐变线 + ◆ + 金色渐变线（真实元素） */
export const luxuryGoldDivider = (): string =>
  [
    '<section class="wemd-component wemd-divider" data-component="divider">',
    '<div class="wemd-component-body">',
    '<span class="wemd-lg-line wemd-lg-line-l"></span>',
    '<span class="wemd-lg-glyph">\u25C6</span>',
    '<span class="wemd-lg-line wemd-lg-line-r"></span>',
    "</div>",
    "</section>",
  ].join("\n");

/** 装饰分隔线：左右金线 + 文字/◆（有标签也始终有线，真实元素） */
export const luxuryGoldDividerFancy = (): string =>
  [
    '<section class="wemd-component wemd-divider-fancy" data-component="divider-fancy">',
    '<section class="wemd-df-label">',
    '<span class="wemd-df-line wemd-df-line-left"></span>',
    "{{#if label}}",
    '<span class="wemd-df-text">{{slot:label}}</span>',
    "{{else}}",
    '<span class="wemd-lg-glyph">\u25C6</span>',
    "{{/if}}",
    '<span class="wemd-df-line wemd-df-line-right"></span>',
    "</section>",
    "</section>",
  ].join("\n");

export const luxuryGoldTemplates: Record<string, string> = {
  "magazine-cover": luxuryGoldMagazineCover(),
  "quote-card": luxuryGoldQuoteCard(),
  "section-divider": luxuryGoldSectionDivider(),
  divider: luxuryGoldDivider(),
  "divider-fancy": luxuryGoldDividerFancy(),
};
