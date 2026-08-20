/**
 * 清晰指南 · 主题骨架模板（学习手册风）
 *
 * 设计：按「一本被荧光笔认真学过的手册」全新设计，不沿用旧版翠绿终端风。
 * - 需要结构差异的组件：magazine-cover（封面：胶带+印章+荧光标题）、
 *   section-divider（手写编号+荧光下划线）、divider（手写虚线+✦）。
 * - 其余组件（toc-nav / styled-table / steps / callout-pro / quote-card /
 *   end-card / code-frame 等）复用内置默认骨架，仅靠 components-clear-guide.ts 皮肤差异化。
 *
 * 微信约束：装饰全部真实 DOM 元素（无伪元素、无结构伪类）。
 */

/** 学习手册封面：胶带 + 虚线圆印章 + 荧光标题（真实元素） */
export const clearGuideMagazineCover = (): string =>
  [
    '<section class="wemd-component wemd-magazine-cover" data-component="magazine-cover">',
    '<span class="wemd-cg-tape"></span>',
    '<span class="wemd-cg-stamp">学习<br>手册</span>',
    '{{#if subtitle}}<section class="wemd-cg-kicker">{{slot:subtitle}}</section>{{/if}}',
    '{{#if title}}<section class="wemd-cg-title">{{slot:title}}</section>{{/if}}',
    '{{#if desc}}<section class="wemd-cg-desc">{{slot:desc}}</section>{{/if}}',
    "</section>",
  ].join("\n");

/** 章节头：手写编号 + 荧光下划线标题 */
export const clearGuideSectionDivider = (): string =>
  [
    '<section class="wemd-component wemd-section-divider" data-component="section-divider">',
    '<span class="wemd-cg-no">{{slot:part}}</span>',
    '<section class="wemd-cg-title">{{slot:title}}</section>',
    "</section>",
  ].join("\n");

/** 分隔线：手写虚线 + ✦（真实元素） */
export const clearGuideDivider = (): string =>
  [
    '<section class="wemd-component wemd-divider" data-component="divider">',
    '<div class="wemd-component-body">',
    '<span class="wemd-cg-dvline wemd-cg-dvline-l"></span>',
    '<span class="wemd-cg-glyph">\u2726 \u2726 \u2726</span>',
    '<span class="wemd-cg-dvline wemd-cg-dvline-r"></span>',
    "</div>",
    "</section>",
  ].join("\n");

export const clearGuideTemplates: Record<string, string> = {
  "magazine-cover": clearGuideMagazineCover(),
  "section-divider": clearGuideSectionDivider(),
  divider: clearGuideDivider(),
};
