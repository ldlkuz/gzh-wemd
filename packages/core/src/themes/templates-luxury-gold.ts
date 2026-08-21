/**
 * 黑金奢华 · 主题骨架模板（黑金荣誉证书风 · 重新设计版）
 *
 * 设计：按「黑金奢华-重新设计」视觉稿落地（黑曜石封面 + 鎏金徽章 +
 * 金属渐变标题 + 双线◆分隔 + 双层金框金句卡）。
 * - magazine-cover（封面：crest 饰带单行 / 圆形「臻」徽章 / kicker=subtitle /
 *   金属渐变标题 / 副题=desc / 双线分隔 / 底部纹样）
 * - section-divider（章节：· 壹 · 编号 + 标题 + 金线）
 * - quote-card（金句卡：顶部镀金饰带 + 双层金框）
 * - divider（金色渐变线 + ◆ + 金色渐变线）
 * - divider-fancy（装饰线：左右金线 + 文字/◆，有标签也始终有线）
 * - 其余组件（stats-block / timeline / styled-table / steps / end-card /
 *   code-frame 等）复用内置默认骨架，仅靠皮肤差异化。
 *
 * 微信约束：所有装饰均为真实 DOM 元素（无伪元素、无结构伪类），
 * 空装饰元素一律带 &nbsp; 防公众号删除。
 */

/** 黑金封面：crest 饰带 + 圆形「臻」徽章 + kicker + 标题 + 副题 + 双线 + 底部纹样（真实元素） */
export const luxuryGoldMagazineCover = (): string =>
  [
    '<section class="wemd-component wemd-magazine-cover" data-component="magazine-cover">',
    '<div class="wemd-lg-badge"><span class="wemd-lg-badge-ch">臻</span></div>',
    '{{#if subtitle}}<section class="wemd-lg-kicker">{{slot:subtitle}}</section>{{/if}}',
    '{{#if title}}<section class="wemd-lg-title">{{slot:title}}</section>{{/if}}',
    '{{#if desc}}<section class="wemd-lg-desc">{{slot:desc}}</section>{{/if}}',
    '<span class="wemd-lg-rule">&nbsp;</span>',
    '<div class="wemd-lg-flourish">',
    '<span class="wemd-lg-sw">&nbsp;</span>',
    '<span class="wemd-lg-d">✦</span>',
    '<span class="wemd-lg-line">&nbsp;</span>',
    '<span class="wemd-lg-d">✦</span>',
    '<span class="wemd-lg-sw">&nbsp;</span>',
    "</div>",
    "</section>",
  ].join("\n");

/** 黑金金句卡：顶部镀金饰带 + 双层金框（真实元素） */
export const luxuryGoldQuoteCard = (): string =>
  [
    '<section class="wemd-component wemd-quote-card" data-component="quote-card">',
    '<span class="wemd-lg-qband">&nbsp;</span>',
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
    '<span class="wemd-lg-rule">&nbsp;</span>',
    "</section>",
  ].join("\n");

/** 分隔线：金色渐变线 + ◆ + 金色渐变线（真实元素） */
export const luxuryGoldDivider = (): string =>
  [
    '<section class="wemd-component wemd-divider" data-component="divider">',
    '<div class="wemd-component-body">',
    '<span class="wemd-lg-line wemd-lg-line-l">&nbsp;</span>',
    '<span class="wemd-lg-glyph">\u25C6</span>',
    '<span class="wemd-lg-line wemd-lg-line-r">&nbsp;</span>',
    "</div>",
    "</section>",
  ].join("\n");

/** 装饰分隔线：左右金线 + 文字/◆（有标签也始终有线，真实元素） */
export const luxuryGoldDividerFancy = (): string =>
  [
    '<section class="wemd-component wemd-divider-fancy" data-component="divider-fancy">',
    '<section class="wemd-df-label">',
    '<span class="wemd-df-line wemd-df-line-left">&nbsp;</span>',
    "{{#if label}}",
    '<span class="wemd-df-text">{{slot:label}}</span>',
    "{{else}}",
    '<span class="wemd-lg-glyph">\u25C6</span>',
    "{{/if}}",
    '<span class="wemd-df-line wemd-df-line-right">&nbsp;</span>',
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
