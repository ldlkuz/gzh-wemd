/**
 * 购物小票主题 - 独立骨架（热敏小票 Thermal Receipt）
 *
 * 只有真正需要结构差异的组件才定制骨架：
 * - magazine-cover  票头（店名 + 英文副标 + 虚线 + 一行小字）
 * - section-divider 单号（NO 编号 + 标题 + 底部线）
 * - divider         虚线分隔（★ 星星点缀；中和共享 ::before/::after 防双线）
 * - end-card        会员集章卡（小标签 + 品牌 + 分隔线 + 编号/元信息）
 * 其余组件复用内置默认骨架，由 components-receipt.ts 皮肤差异化。
 * 所有装饰均为真实元素（dash / line / stars / no / label / meta），无伪元素。
 */

export const receiptMagazineCover = (): string =>
  [
    '<section class="wemd-component wemd-magazine-cover" data-component="magazine-cover">',
    '{{#if title}}<section class="wemd-rc-store">{{slot:title}}</section>{{/if}}',
    '{{#if subtitle}}<section class="wemd-rc-sub">{{slot:subtitle}}</section>{{/if}}',
    '<span class="wemd-rc-dash">&nbsp;</span>',
    '{{#if desc}}<p class="wemd-rc-desc">{{slot:desc}}</p>{{/if}}',
    "</section>",
  ].join("\n");

export const receiptSectionDivider = (): string =>
  [
    '<section class="wemd-component wemd-section-divider" data-component="section-divider">',
    '{{#if part}}<span class="wemd-rc-no">{{slot:part}}</span>{{/if}}',
    '{{#if title}}<section class="wemd-rc-title">{{slot:title}}</section>{{/if}}',
    '<span class="wemd-rc-line">&nbsp;</span>',
    "</section>",
  ].join("\n");

export const receiptDivider = (): string =>
  [
    '<section class="wemd-component wemd-divider" data-component="divider">',
    '<section class="wemd-component-body">',
    '<span class="wemd-rc-stars">★ ★ ★ ★ ★</span>',
    "</section>",
    "</section>",
  ].join("\n");

export const receiptEndCard = (): string =>
  [
    '<section class="wemd-component wemd-end-card" data-component="end-card">',
    '{{#if subtitle}}<section class="wemd-rc-label">{{slot:subtitle}}</section>{{/if}}',
    '{{#if title}}<section class="wemd-rc-brand">{{slot:title}}</section>{{/if}}',
    '{{#if body}}<section class="wemd-ec-body">{{slot:body}}</section>{{/if}}',
    '<span class="wemd-rc-line">&nbsp;</span>',
    '{{#if deco}}<section class="wemd-rc-meta">{{slot:deco}}</section>{{/if}}',
    "</section>",
  ].join("\n");

export const receiptTemplates: Record<string, string> = {
  "magazine-cover": receiptMagazineCover(),
  "section-divider": receiptSectionDivider(),
  divider: receiptDivider(),
  "end-card": receiptEndCard(),
};
