/**
 * 留白画册 · 主题骨架模板（极简画廊风）
 *
 * 设计：按「一面白墙挂画」的留白画册视觉规划，只写真正需要结构差异的组件。
 * - magazine-cover（画册封面：内衬画框 + 英文小标 + 大标题 + 发丝线 + 描述）
 * - section-divider（章节牌：PART 编号 + 标题 + 发丝线）
 * - divider（发丝线 + 鎏金 ◆ + 发丝线）
 * - divider-fancy（画廊装饰线：左右发丝线 + 文字/◆，有标签也始终有线）
 * - 其余组件（quote-card / image-card / stats-block / timeline / styled-table /
 *   steps / end-card / code-frame 等）复用内置默认骨架，仅靠皮肤差异化。
 *
 * 微信约束：所有装饰均为真实 DOM 元素（无伪元素、无结构伪类）。
 */

/** 画册封面：内衬画框 + 英文小标 + 大标题 + 发丝线 + 描述（真实元素） */
export const whitespaceGalleryMagazineCover = (): string =>
  [
    '<section class="wemd-component wemd-magazine-cover" data-component="magazine-cover">',
    '<span class="wemd-wg-frame"></span>',
    '{{#if subtitle}}<section class="wemd-wg-kicker">{{slot:subtitle}}</section>{{/if}}',
    '{{#if title}}<section class="wemd-wg-title">{{slot:title}}</section>{{/if}}',
    '<span class="wemd-wg-rule"></span>',
    '{{#if desc}}<section class="wemd-wg-desc">{{slot:desc}}</section>{{/if}}',
    "</section>",
  ].join("\n");

/** 章节牌：PART 编号 + 标题 + 发丝线（真实元素） */
export const whitespaceGallerySectionDivider = (): string =>
  [
    '<section class="wemd-component wemd-section-divider" data-component="section-divider">',
    '<span class="wemd-wg-part">{{slot:part}}</span>',
    '<section class="wemd-wg-title">{{slot:title}}</section>',
    '<span class="wemd-wg-rule"></span>',
    "</section>",
  ].join("\n");

/** 分隔线：发丝线 + 鎏金 ◆ + 发丝线（真实元素） */
export const whitespaceGalleryDivider = (): string =>
  [
    '<section class="wemd-component wemd-divider" data-component="divider">',
    '<div class="wemd-component-body">',
    '<span class="wemd-wg-line wemd-wg-line-l"></span>',
    '<span class="wemd-wg-glyph">\u25C6</span>',
    '<span class="wemd-wg-line wemd-wg-line-r"></span>',
    "</div>",
    "</section>",
  ].join("\n");

/** 装饰分割线：左右发丝线 + 文字/◆（有标签也始终有线，真实元素） */
export const whitespaceGalleryDividerFancy = (): string =>
  [
    '<section class="wemd-component wemd-divider-fancy" data-component="divider-fancy">',
    '<section class="wemd-df-label">',
    '<span class="wemd-df-line wemd-df-line-left"></span>',
    "{{#if label}}",
    '<span class="wemd-df-text">{{slot:label}}</span>',
    "{{else}}",
    '<span class="wemd-wg-glyph">\u25C6</span>',
    "{{/if}}",
    '<span class="wemd-df-line wemd-df-line-right"></span>',
    "</section>",
    "</section>",
  ].join("\n");

export const whitespaceGalleryTemplates: Record<string, string> = {
  "magazine-cover": whitespaceGalleryMagazineCover(),
  "section-divider": whitespaceGallerySectionDivider(),
  divider: whitespaceGalleryDivider(),
  "divider-fancy": whitespaceGalleryDividerFancy(),
};
