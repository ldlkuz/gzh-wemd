# 组件 DOM 结构（自动生成 · 权威基准）

> 由 `scripts/extract-dom-snapshot.mjs` 从主程序真源自动生成，**禁止手工维护**。
> 真源：`defaultTemplates.ts`（内置默认骨架 CURATED + slotDefs 通用骨架）+ `slotDefs.ts`（abbr + slot 契约）。
> 主题定制骨架由 `scripts/compile-skeleton.cjs` 产出，结构规则同源。
> 生成时间：2026-08-17 13:17:28

## 通用规律

- 组件根节点：`wemd-component wemd-{id}`（CSS 定位 `#wemd .wemd-{id}`）。
- **命名 slot**：骨架为非 body slot 生成 `wemd-{abbr}-{slot}` 容器（标量为 `<div>`/`<section>`）；list 槽再细分 `wemd-{abbr}-{slot}-item` 与字段 `wemd-{abbr}-{slot}-{field}`。
- **body slot**：`body` 槽生成 `<div class="wemd-component-body">`，内部是 markdown-it 渲染的原生标签（`<p>/<ul>/<li>/<strong>/<pre>/<table>`），CSS 用 `.wemd-component-body > p` 等定位。
- ❌ `.wemd-child-N` 序号 class 已废弃，主程序不再生成。
- 组件容器负责自身水平内边距；上下 margin 由 Stack 规则统一控制。

## 组件结构明细

| 组件 | 槽类型 | 骨架 class 结构 |
|------|--------|-----------------|
| magazine-cover | 具名 slot | `wemd-component wemd-magazine-cover wemd-mc-title wemd-mc-subtitle wemd-mc-divider wemd-mc-desc` |
| hero-banner | body | `wemd-component wemd-hero-banner wemd-component-body wemd-hb-image wemd-hb-title wemd-hb-subtitle` |
| product-card | 具名 slot | `wemd-component wemd-product-card wemd-pc-image wemd-pc-header wemd-pc-badge wemd-pc-title wemd-pc-subtitle wemd-pc-description wemd-pc-price-row wemd-pc-price wemd-pc-original wemd-pc-meta-row wemd-pc-rating wemd-pc-sales wemd-pc-stock wemd-pc-button wemd-pc-tags wemd-pc-tag` |
| brand-sign | 具名 slot | `wemd-component wemd-brand-sign wemd-bs-wrapper wemd-bs-logo wemd-bs-brand-line wemd-bs-brand-name wemd-bs-divider-dot wemd-bs-tagline wemd-bs-slogan wemd-bs-subtext` |
| cta-card | 具名 slot | `wemd-component wemd-cta-card wemd-cta-title wemd-cta-body wemd-cta-action` |
| quote-card | 具名 slot | `wemd-component wemd-quote-card wemd-qc-quote wemd-qc-author` |
| testimonial-card | 具名 slot | `wemd-component wemd-testimonial-card wemd-tc-mark wemd-tc-quote wemd-tc-source wemd-tc-person wemd-tc-avatar wemd-tc-person-meta wemd-tc-name wemd-tc-title wemd-tc-company wemd-tc-company-logo` |
| full-quote | 具名 slot | `wemd-component wemd-full-quote wemd-fq-text` |
| end-card | 具名 slot | `wemd-component wemd-end-card wemd-ec-title wemd-ec-subtitle wemd-ec-deco` |
| share-card | body | `wemd-component wemd-share-card wemd-component-body` |
| qr-card | body | `wemd-component wemd-qr-card wemd-component-body` |
| follow-bar | body | `wemd-component wemd-follow-bar wemd-component-body` |
| stats-block | 具名 slot | `wemd-component wemd-stats-block wemd-sb-items wemd-sb-items-item wemd-sb-items-value wemd-sb-items-label` |
| callout-pro | body | `wemd-component wemd-callout-pro wemd-component-body` |
| author-card | body | `wemd-component wemd-author-card wemd-component-body` |
| section-title | body | `wemd-component wemd-section-title wemd-component-body` |
| numbered-heading | body | `wemd-component wemd-numbered-heading wemd-component-body` |
| section-divider | 具名 slot | `wemd-component wemd-section-divider wemd-sd-part wemd-sd-title` |
| image-card | 具名 slot | `wemd-component wemd-image-card wemd-ic-image wemd-ic-caption` |
| image-text-row | body | `wemd-component wemd-image-text-row wemd-component-body` |
| image-grid | body | `wemd-component wemd-image-grid wemd-component-body` |
| image-compare | body | `wemd-component wemd-image-compare wemd-component-body` |
| text-card | body | `wemd-component wemd-text-card wemd-component-body` |
| image-caption | body | `wemd-component wemd-image-caption wemd-component-body` |
| two-column-cards | 具名 slot | `wemd-component wemd-two-column-cards wemd-tcc-wrapper wemd-tcc-item wemd-tcc-icon wemd-tcc-title wemd-tcc-desc` |
| resource-list | 具名 slot | `wemd-component wemd-resource-list wemd-rl-title wemd-rl-subtitle wemd-rl-items wemd-rl-item wemd-rl-label wemd-rl-main wemd-rl-item-title wemd-rl-item-desc wemd-rl-meta wemd-rl-tag` |
| timeline | 具名 slot | `wemd-component wemd-timeline wemd-tl-title wemd-tl-events wemd-tl-item wemd-tl-dot wemd-tl-text` |
| styled-table | 具名 slot | `wemd-component wemd-styled-table wemd-sbt-table` |
| table | 具名 slot | `wemd-component wemd-table wemd-tbl-table` |
| faq | body | `wemd-component wemd-faq wemd-component-body` |
| accordion | body | `wemd-component wemd-accordion wemd-component-body` |
| steps | body | `wemd-component wemd-steps wemd-component-body` |
| toc-nav | body | `wemd-component wemd-toc-nav wemd-component-body` |
| series-nav | 具名 slot | `wemd-component wemd-series-nav wemd-sn-header wemd-sn-name wemd-sn-desc wemd-sn-progress-bar wemd-sn-progress-fill wemd-sn-articles wemd-sn-item-idx wemd-sn-item-title wemd-sn-nav wemd-sn-prev wemd-sn-prev-empty wemd-sn-prev-label wemd-sn-prev-title wemd-sn-next wemd-sn-next-empty wemd-sn-next-label wemd-sn-next-title` |
| related-posts | 具名 slot | `wemd-component wemd-related-posts wemd-rp-items wemd-rp-items-item wemd-rp-items-body` |
| code-frame | 具名 slot | `wemd-component wemd-code-frame wemd-cf-title wemd-cf-code` |
| code-block | body | `wemd-component wemd-code-block wemd-component-body` |
| pullquote | body | `wemd-component wemd-pullquote wemd-component-body` |
| tag-label | body | `wemd-component wemd-tag-label wemd-component-body` |
| divider-fancy | 具名 slot | `wemd-component wemd-divider-fancy wemd-df-label wemd-df-line wemd-df-line-left wemd-df-text wemd-df-line-right wemd-df-dots` |
| divider | body | `wemd-component wemd-divider wemd-component-body` |
| copyright-notice | body | `wemd-component wemd-copyright-notice wemd-component-body` |
| article-section | body | `wemd-component wemd-article-section wemd-component-body` |

## 骨架 class 清单（全量）

（由 defaultTemplates 实际输出，供选择器校验引用）

- `wemd-accordion`
- `wemd-article-section`
- `wemd-author-card`
- `wemd-brand-sign`
- `wemd-bs-brand-line`
- `wemd-bs-brand-name`
- `wemd-bs-divider-dot`
- `wemd-bs-logo`
- `wemd-bs-slogan`
- `wemd-bs-subtext`
- `wemd-bs-tagline`
- `wemd-bs-wrapper`
- `wemd-callout-pro`
- `wemd-cf-code`
- `wemd-cf-title`
- `wemd-code-block`
- `wemd-code-frame`
- `wemd-component`
- `wemd-component-body`
- `wemd-copyright-notice`
- `wemd-cta-action`
- `wemd-cta-body`
- `wemd-cta-card`
- `wemd-cta-title`
- `wemd-df-dots`
- `wemd-df-label`
- `wemd-df-line`
- `wemd-df-line-left`
- `wemd-df-line-right`
- `wemd-df-text`
- `wemd-divider`
- `wemd-divider-fancy`
- `wemd-ec-deco`
- `wemd-ec-subtitle`
- `wemd-ec-title`
- `wemd-end-card`
- `wemd-faq`
- `wemd-follow-bar`
- `wemd-fq-text`
- `wemd-full-quote`
- `wemd-hb-image`
- `wemd-hb-subtitle`
- `wemd-hb-title`
- `wemd-hero-banner`
- `wemd-ic-caption`
- `wemd-ic-image`
- `wemd-image-caption`
- `wemd-image-card`
- `wemd-image-compare`
- `wemd-image-grid`
- `wemd-image-text-row`
- `wemd-magazine-cover`
- `wemd-mc-desc`
- `wemd-mc-divider`
- `wemd-mc-subtitle`
- `wemd-mc-title`
- `wemd-numbered-heading`
- `wemd-pc-badge`
- `wemd-pc-button`
- `wemd-pc-description`
- `wemd-pc-header`
- `wemd-pc-image`
- `wemd-pc-meta-row`
- `wemd-pc-original`
- `wemd-pc-price`
- `wemd-pc-price-row`
- `wemd-pc-rating`
- `wemd-pc-sales`
- `wemd-pc-stock`
- `wemd-pc-subtitle`
- `wemd-pc-tag`
- `wemd-pc-tags`
- `wemd-pc-title`
- `wemd-product-card`
- `wemd-pullquote`
- `wemd-qc-author`
- `wemd-qc-quote`
- `wemd-qr-card`
- `wemd-quote-card`
- `wemd-related-posts`
- `wemd-resource-list`
- `wemd-rl-item`
- `wemd-rl-item-desc`
- `wemd-rl-item-title`
- `wemd-rl-items`
- `wemd-rl-label`
- `wemd-rl-main`
- `wemd-rl-meta`
- `wemd-rl-subtitle`
- `wemd-rl-tag`
- `wemd-rl-title`
- `wemd-rp-items`
- `wemd-rp-items-body`
- `wemd-rp-items-item`
- `wemd-sb-items`
- `wemd-sb-items-item`
- `wemd-sb-items-label`
- `wemd-sb-items-value`
- `wemd-sbt-table`
- `wemd-sd-part`
- `wemd-sd-title`
- `wemd-section-divider`
- `wemd-section-title`
- `wemd-series-nav`
- `wemd-share-card`
- `wemd-sn-articles`
- `wemd-sn-desc`
- `wemd-sn-header`
- `wemd-sn-item-idx`
- `wemd-sn-item-title`
- `wemd-sn-name`
- `wemd-sn-nav`
- `wemd-sn-next`
- `wemd-sn-next-empty`
- `wemd-sn-next-label`
- `wemd-sn-next-title`
- `wemd-sn-prev`
- `wemd-sn-prev-empty`
- `wemd-sn-prev-label`
- `wemd-sn-prev-title`
- `wemd-sn-progress-bar`
- `wemd-sn-progress-fill`
- `wemd-stats-block`
- `wemd-steps`
- `wemd-styled-table`
- `wemd-table`
- `wemd-tag-label`
- `wemd-tbl-table`
- `wemd-tc-avatar`
- `wemd-tc-company`
- `wemd-tc-company-logo`
- `wemd-tc-mark`
- `wemd-tc-name`
- `wemd-tc-person`
- `wemd-tc-person-meta`
- `wemd-tc-quote`
- `wemd-tc-source`
- `wemd-tc-title`
- `wemd-tcc-desc`
- `wemd-tcc-icon`
- `wemd-tcc-item`
- `wemd-tcc-title`
- `wemd-tcc-wrapper`
- `wemd-testimonial-card`
- `wemd-text-card`
- `wemd-timeline`
- `wemd-tl-dot`
- `wemd-tl-events`
- `wemd-tl-item`
- `wemd-tl-text`
- `wemd-tl-title`
- `wemd-toc-nav`
- `wemd-two-column-cards`

## 关键陷阱

1. **body slot 组件**：`.wemd-component-body` 内部是原生标签，深度样式走 `.wemd-component-body > p` / `ul` / `pre` / `table`。
2. **命名 slot 组件**：直接定位 `wemd-{abbr}-{slot}`，禁止臆造 class。abbr 来自 `slotDefs.ts`，slot 名来自该组件的 slot 定义。
3. 已废弃 `.wemd-child-N`，禁止再写基于序号的选择器。
4. 组件容器负责自身水平内边距；Stack 负责上下 margin。
5. 渲染器会给部分文本自动加内联样式（如 `cta-card` 的 `<strong>` 内联深色）。若与主题冲突，需用 `!important` 覆盖。
