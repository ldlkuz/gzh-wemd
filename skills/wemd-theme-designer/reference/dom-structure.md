# 组件 DOM 结构（自动生成 · 权威基准）

> 由 `scripts/extract-dom-snapshot.mjs` 从主程序真源自动生成，**禁止手工维护**。
> 真源：`componentElements.ts`（标准选择器）+ `magazineRenderers.ts`（杂志级输出 class）。
> 生成时间：2026-08-12 21:34:21

## 通用规律

- 组件根节点：`#wemd .wemd-{id}`，并带 `wemd-component` 类。
- **普通组件（hasBody=true）**：body 内走完整 markdown-it 渲染输出原生标签（`<p>/<ul>/<li>/<table>`），再由 `ThemeProcessor.addChildPositionClasses` 将直接子标签附加 `.wemd-child-N`（N 从 1 递增）。**真实 DOM = 原生标签 + `.wemd-child-N` 两者共存**，CSS 用 `.wemd-child-N` 定位更稳。
- **杂志级组件（hasBody=false）**：body 内用具名 class（如 `.wemd-rl-title`）。
- 组件 wrapper 的 `margin-bottom` 由 Stack 规则统一控制，组件 CSS 内不写上下 margin。
- body 内水平内边距统一走 `--wemd-space-inline`，防止内容贴边。

## 组件结构明细

| 组件             | 类型         | body 内真实结构 / 标准选择器                                                                                                                                                                                                                                         |
| ---------------- | ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| magazine-cover   | 具名         | `.wemd-mc-title .wemd-mc-subtitle .wemd-mc-divider .wemd-mc-desc`                                                                                                                                                                                                    |
| hero-banner      | 原生+child-N | `.wemd-child-1 .wemd-child-2 .wemd-child-3（原生: p img）`                                                                                                                                                                                                           |
| product-card     | 具名         | `img .wemd-pc-badge .wemd-pc-header .wemd-pc-title .wemd-pc-subtitle .wemd-pc-description .wemd-pc-price-row .wemd-pc-price .wemd-pc-original .wemd-pc-meta-row .wemd-pc-rating .wemd-pc-sales .wemd-pc-stock .wemd-pc-button .wemd-pc-tags .wemd-pc-tag`            |
| brand-sign       | 具名         | `.wemd-bs-wrapper .wemd-bs-logo .wemd-bs-brand-name .wemd-bs-slogan .wemd-bs-subtext`                                                                                                                                                                                |
| cta-card         | 原生+child-N | `.wemd-child-1 .wemd-child-2 .wemd-child-3（原生: p）`                                                                                                                                                                                                               |
| quote-card       | 原生+child-N | `.wemd-child-1 .wemd-child-2（原生: p）`                                                                                                                                                                                                                             |
| testimonial-card | 具名         | `.wemd-tc-quote .wemd-tc-source .wemd-tc-person img .wemd-tc-person-meta .wemd-tc-name .wemd-tc-title .wemd-tc-company img`                                                                                                                                          |
| full-quote       | 具名         | `.wemd-fq-text`                                                                                                                                                                                                                                                      |
| end-card         | 具名         | `.wemd-ec-title .wemd-ec-subtitle .wemd-ec-deco`                                                                                                                                                                                                                     |
| share-card       | 原生+child-N | `.wemd-child-1（原生: p）`                                                                                                                                                                                                                                           |
| qr-card          | 原生+child-N | `.wemd-child-1 .wemd-child-2 .wemd-child-3（原生: img p）`                                                                                                                                                                                                           |
| follow-bar       | 原生+child-N | `.wemd-child-1 .wemd-child-2（原生: p）`                                                                                                                                                                                                                             |
| stats-block      | 原生+child-N | `.wemd-child-1 .wemd-child-2 .wemd-child-3（原生: p strong）`                                                                                                                                                                                                        |
| callout-pro      | 原生+child-N | `.wemd-child-1 .wemd-child-2（原生: p）`                                                                                                                                                                                                                             |
| author-card      | 原生+child-N | `.wemd-child-1 .wemd-child-2 .wemd-child-3 .wemd-child-4（原生: img p strong em）`                                                                                                                                                                                   |
| section-title    | 原生+child-N | `.wemd-child-1（原生: p）`                                                                                                                                                                                                                                           |
| numbered-heading | 原生+child-N | `.wemd-child-1 .wemd-child-2（原生: p）`                                                                                                                                                                                                                             |
| section-divider  | 具名         | `.wemd-sd-part .wemd-sd-title`                                                                                                                                                                                                                                       |
| image-card       | 具名         | `.wemd-ic-image img .wemd-ic-caption`                                                                                                                                                                                                                                |
| image-text-row   | 原生+child-N | `.wemd-child-1 .wemd-child-2（原生: img p）`                                                                                                                                                                                                                         |
| image-grid       | 原生+child-N | `.wemd-child-1 .wemd-child-2（原生: p li img）`                                                                                                                                                                                                                      |
| image-compare    | 未定义       | （registry 存在但真源未定义，请补 componentElements）                                                                                                                                                                                                                |
| text-card        | 未定义       | （registry 存在但真源未定义，请补 componentElements）                                                                                                                                                                                                                |
| image-caption    | 原生+child-N | `.wemd-child-1 .wemd-child-2（原生: img p）`                                                                                                                                                                                                                         |
| two-column-cards | 具名         | `.wemd-tcc-wrapper .wemd-tcc-item .wemd-tcc-icon .wemd-tcc-title .wemd-tcc-desc`                                                                                                                                                                                     |
| resource-list    | 具名         | `.wemd-rl-title .wemd-rl-subtitle .wemd-rl-items .wemd-rl-item .wemd-rl-idx .wemd-rl-icon .wemd-rl-main .wemd-rl-item-title .wemd-rl-item-desc .wemd-rl-meta .wemd-rl-tag`                                                                                           |
| timeline         | 原生+child-N | `.wemd-child-1 .wemd-child-2 .wemd-child-3（原生: p li strong）`                                                                                                                                                                                                     |
| styled-table     | 原生+child-N | `.wemd-child-1 .wemd-child-2 .wemd-child-3 .wemd-child-4（原生: table p th td）`                                                                                                                                                                                     |
| table            | 未定义       | （registry 存在但真源未定义，请补 componentElements）                                                                                                                                                                                                                |
| faq              | 原生+child-N | `.wemd-child-1 .wemd-child-2（原生: p strong）`                                                                                                                                                                                                                      |
| accordion        | 未定义       | （registry 存在但真源未定义，请补 componentElements）                                                                                                                                                                                                                |
| steps            | 未定义       | （registry 存在但真源未定义，请补 componentElements）                                                                                                                                                                                                                |
| toc-nav          | 原生+child-N | `.wemd-child-1 .wemd-child-2 .wemd-child-3（原生: p li a）`                                                                                                                                                                                                          |
| series-nav       | 具名         | `.wemd-sn-header .wemd-sn-name .wemd-sn-desc .wemd-sn-progress-bar .wemd-sn-nav .wemd-sn-prev .wemd-sn-next .wemd-sn-prev-label .wemd-sn-next-label .wemd-sn-prev-title .wemd-sn-next-title .wemd-sn-articles .wemd-sn-item .wemd-sn-item.current .wemd-sn-item-idx` |
| related-posts    | 原生+child-N | `.wemd-child-1 .wemd-child-2 .wemd-child-3（原生: p li a）`                                                                                                                                                                                                          |
| code-frame       | 原生+child-N | `.wemd-child-1 .wemd-child-2（原生: code p pre）`                                                                                                                                                                                                                    |
| code-block       | 未定义       | （registry 存在但真源未定义，请补 componentElements）                                                                                                                                                                                                                |
| pullquote        | 未定义       | （registry 存在但真源未定义，请补 componentElements）                                                                                                                                                                                                                |
| tag-label        | 原生+child-N | `.wemd-child-1（原生: p）`                                                                                                                                                                                                                                           |
| divider-fancy    | 原生+child-N | `（无直接子元素）`                                                                                                                                                                                                                                                   |
| divider          | 未定义       | （registry 存在但真源未定义，请补 componentElements）                                                                                                                                                                                                                |
| copyright-notice | 原生+child-N | `.wemd-child-1（原生: p）`                                                                                                                                                                                                                                           |
| article-section  | 未定义       | （registry 存在但真源未定义，请补 componentElements）                                                                                                                                                                                                                |

## 杂志级组件具名 class 清单

（由 magazineRenderers.ts 实际输出，供选择器校验引用）

- `wemd-bs-brand-name`
- `wemd-bs-logo`
- `wemd-bs-slogan`
- `wemd-bs-subtext`
- `wemd-bs-wrapper`
- `wemd-ec-deco`
- `wemd-ec-subtitle`
- `wemd-ec-title`
- `wemd-fq-text`
- `wemd-ic-caption`
- `wemd-ic-image`
- `wemd-mc-desc`
- `wemd-mc-divider`
- `wemd-mc-subtitle`
- `wemd-mc-title`
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
- `wemd-rl-icon`
- `wemd-rl-idx`
- `wemd-rl-item`
- `wemd-rl-item-desc`
- `wemd-rl-item-title`
- `wemd-rl-items`
- `wemd-rl-main`
- `wemd-rl-meta`
- `wemd-rl-subtitle`
- `wemd-rl-tag`
- `wemd-rl-title`
- `wemd-sd-part`
- `wemd-sd-title`
- `wemd-sn-articles`
- `wemd-sn-desc`
- `wemd-sn-header`
- `wemd-sn-item-idx`
- `wemd-sn-name`
- `wemd-sn-nav`
- `wemd-sn-next`
- `wemd-sn-next.wemd-sn-empty`
- `wemd-sn-next-label`
- `wemd-sn-next-title`
- `wemd-sn-prev`
- `wemd-sn-prev.wemd-sn-empty`
- `wemd-sn-prev-label`
- `wemd-sn-prev-title`
- `wemd-sn-progress-bar`
- `wemd-tc-avatar`
- `wemd-tc-company`
- `wemd-tc-company-logo`
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

## 关键陷阱

1. **普通组件 body 内 = 原生标签 + `.wemd-child-N` 共存。** `ThemeProcessor.addChildPositionClasses` 会把 body 直接子标签附加 `.wemd-child-N`（预览、导出统一路径）。CSS 用 `.wemd-child-N` 定位更稳，也可用原生标签。
2. **杂志级组件用具名 class。** 写 CSS 时以本文档「具名 class 清单」为准，禁止臆造。
3. 组件容器负责自身水平内边距；Stack 负责上下 margin。
4. 渲染器会给部分文本自动加内联样式（如 `cta-card` 的 `<strong>` 内联深色）。若与主题冲突，需用 `!important` 覆盖。

## 真源未定义组件

以下组件在 registry 中存在但真源 `componentElements.ts` 未定义标准选择器：

- `image-compare`
- `text-card`
- `table`
- `accordion`
- `steps`
- `code-block`
- `pullquote`
- `divider`
- `article-section`

这些组件通常是纯原生渲染（无专用渲染器），body 内直接是原生标签。若需深度样式化，请在 `componentElements.ts` 补充定义。
