# 合法组件注册表

> 此文件由 `scripts/sync-skill-spec.mjs` 从 `packages/core/src/theme-registry/componentRegistry.ts` 自动生成。
> 禁止手抄，修改请更新 core 包常量后重新运行脚本。

## 合法组件全集（35 个）

### default 组（9 个）

`quote-card`, `divider-fancy`, `cta-card`, `code-frame`, `callout-pro`, `stats-block`, `image-grid`, `author-card`, `timeline`

### extra 组（13 个）

`follow-bar`, `qr-card`, `numbered-heading`, `section-title`, `image-text-row`, `hero-banner`, `share-card`, `related-posts`, `toc-nav`, `tag-label`, `image-caption`, `copyright-notice`, `styled-table`

### faq 组（1 个）

`faq`

### magazine 组（18 个）

`magazine-cover`, `section-divider`, `image-card`, `text-card`, `full-quote`, `two-column-cards`, `end-card`, `product-card`, `brand-sign`, `resource-list`, `testimonial-card`, `series-nav`, `share-card`, `quote-card`, `cta-card`, `divider-fancy`, `hero-banner`, `callout-pro`

## 轨道 A 内置预设 variant 表（仅供内置主题参考）

| 组件               | 预设 variant                     |
| ------------------ | -------------------------------- |
| `share-card`       | `warm`, `minimal`, `tech`        |
| `quote-card`       | `classic`, `quotation`, `card`   |
| `cta-card`         | `pill`, `banner`, `minimal`      |
| `divider-fancy`    | `line`, `gradient`, `dots`       |
| `hero-banner`      | `center`, `left`, `minimal`      |
| `callout-pro`      | `border`, `bg`, `minimal`        |
| `section-divider`  | `line`, `dots`, `bold`           |
| `end-card`         | `centered`, `minimal`, `warm`    |
| `product-card`     | `ecommerce`, `minimal`, `promo`  |
| `brand-sign`       | `inline`, `stacked`, `signature` |
| `resource-list`    | `files`, `steps`, `minimal`      |
| `testimonial-card` | `classic`, `casual`, `featured`  |
| `series-nav`       | `progress`, `toc`, `breadcrumb`  |

> AI 主题不依赖这些预设 variant。AI 主题必须通过 `variantCss` 字段提供自定义 CSS（轨道 B）。

## 合法 tone 值

`warm`, `minimal`, `elegant`, `rational`, `serious`, `modern`, `playful`

## 合法 density 值

`low`, `medium`, `high`

## 支持的 SDK 版本

`1.0.0`
