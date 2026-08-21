/**
 * 学术论文 · 主题骨架模板（学术期刊风）
 *
 * 设计：按学术期刊的严谨排版规划，只写真正需要结构差异的组件。
 * - magazine-cover（期刊封面：内衬细框 + 朱批小标 + 标题 + 双横线 + 摘要）
 * - section-divider（章节：编号 + 标题 + 双横线）
 * - divider（细线 + § + 细线）
 * - divider-fancy（装饰线：左右细线 + 文字/§，有标签也始终有线）
 * - 其余组件（quote-card / stats-block / timeline / styled-table / steps /
 *   end-card / code-frame 等）复用内置默认骨架，仅靠皮肤差异化。
 *
 * 微信约束：所有装饰均为真实 DOM 元素（无伪元素、无结构伪类）。
 */

/** 期刊封面：内衬细框 + 朱批小标 + 标题 + 双横线 + 摘要（真实元素） */
export const academicPaperMagazineCover = (): string =>
  [
    '<section class="wemd-component wemd-magazine-cover" data-component="magazine-cover">',
    '<span class="wemd-ap-frame">&nbsp;</span>',
    '{{#if subtitle}}<section class="wemd-ap-kicker">{{slot:subtitle}}</section>{{/if}}',
    '{{#if title}}<section class="wemd-ap-title">{{slot:title}}</section>{{/if}}',
    '<span class="wemd-ap-rule">&nbsp;</span>',
    '{{#if desc}}<section class="wemd-ap-desc">{{slot:desc}}</section>{{/if}}',
    "</section>",
  ].join("\n");

/** 章节：编号 + 标题 + 双横线（真实元素） */
export const academicPaperSectionDivider = (): string =>
  [
    '<section class="wemd-component wemd-section-divider" data-component="section-divider">',
    '<span class="wemd-ap-part">{{slot:part}}</span>',
    '<section class="wemd-ap-title">{{slot:title}}</section>',
    '<span class="wemd-ap-rule">&nbsp;</span>',
    "</section>",
  ].join("\n");

/** 分隔线：细线 + § + 细线（真实元素） */
export const academicPaperDivider = (): string =>
  [
    '<section class="wemd-component wemd-divider" data-component="divider">',
    '<div class="wemd-component-body">',
    '<span class="wemd-ap-line wemd-ap-line-l">&nbsp;</span>',
    '<span class="wemd-ap-glyph">\u00A7</span>',
    '<span class="wemd-ap-line wemd-ap-line-r">&nbsp;</span>',
    "</div>",
    "</section>",
  ].join("\n");

/** 装饰分隔线：左右细线 + 文字/§（有标签也始终有线，真实元素） */
export const academicPaperDividerFancy = (): string =>
  [
    '<section class="wemd-component wemd-divider-fancy" data-component="divider-fancy">',
    '<section class="wemd-df-label">',
    '<span class="wemd-df-line wemd-df-line-left">&nbsp;</span>',
    "{{#if label}}",
    '<span class="wemd-df-text">{{slot:label}}</span>',
    "{{else}}",
    '<span class="wemd-ap-glyph">\u00A7</span>',
    "{{/if}}",
    '<span class="wemd-df-line wemd-df-line-right">&nbsp;</span>',
    "</section>",
    "</section>",
  ].join("\n");

export const academicPaperTemplates: Record<string, string> = {
  "magazine-cover": academicPaperMagazineCover(),
  "section-divider": academicPaperSectionDivider(),
  divider: academicPaperDivider(),
  "divider-fancy": academicPaperDividerFancy(),
};
