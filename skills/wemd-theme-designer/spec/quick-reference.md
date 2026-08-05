# 快速参考手册

> 跨层高频信息速查，按 AI 决策流组织。
> 详细说明见各层 spec 文档。

---

## 1. 方案 A-E 选择逻辑

```
需要视觉装饰？
  │
  ├── 纯颜色效果（渐变、纯色块、阴影）？
  │   → 方案 E：CSS 渐变/box-shadow/border
  │     零额外资源，X5 兼容性最好
  │
  ├── 简单几何形状（圆形、六边形、线条、图标）？
  │   → 方案 A：Inline SVG
  │     小尺寸 data URL，颜色用 var(--wemd-xxx)
  │
  ├── 跨组件复用的品牌资源（Logo、通用装饰）？
  │   → 方案 D：manifest.assets + var(--wemd-asset-xxx)
  │     统一注册，一处修改全局生效
  │
  ├── 复杂品牌装饰纹理？
  │   → 方案 B：Base64 PNG
  │     仅限品牌装饰，非文章内容图，≤ 150KB
  │
  └── 重复纹理（网格、点阵、平铺图案）？
      → 方案 E：background-repeat + 小尺寸 Inline SVG
        用 CSS 平铺，不用 SVG <pattern>（X5 可能偏移）
```

---

## 2. 设计目标 → 实现方案速查

| 设计目标        | 推荐方案           | CSS 关键属性                                    | 是否需要素材   |
| --------------- | ------------------ | ----------------------------------------------- | -------------- |
| 纯色渐变背景    | E. CSS 渐变        | `background: linear-gradient(...)`              | 否             |
| 几何网格纹理    | A. Inline SVG      | `background-image: url("data:...")` + `repeat`  | 否             |
| 波形分隔线      | A. Inline SVG      | `background-image: url("data:...")`             | 否             |
| 品牌 Logo 水印  | D. manifest.assets | `background-image: var(--wemd-asset-xxx)`       | 是（Logo SVG） |
| 标题左侧装饰条  | E. CSS border      | `border-left: 4px solid`                        | 否             |
| 标题图标        | A. Inline SVG      | `background-image` + `padding-left`             | 否             |
| 卡片阴影        | E. CSS box-shadow  | `box-shadow: ...`                               | 否             |
| 标签（Tag）     | E. CSS 背景色      | `background: var(--wemd-primary-light)`         | 否             |
| 时间线图标      | D. manifest.assets | `background-image: var(--wemd-asset-xxx)`       | 是（图标 SVG） |
| 六边形/圆形节点 | A. Inline SVG      | `background-image: url("data:...")`             | 否             |
| 按钮渐变        | E. CSS 渐变        | `background: linear-gradient(...)`              | 否             |
| 引用装饰        | E. CSS border      | `border-left: 4px solid`                        | 否             |
| 圆角卡片        | E. CSS 变量        | `border-radius: var(--wemd-border-radius)`      | 否             |
| 底部品牌声明    | E. CSS 文字        | `font-size: 12px; color: var(--wemd-text-soft)` | 否             |

---

## 3. 约束速查

### C1. 微信公众号平台约束

| 规则          | 禁止                                            | 替代方案                               |
| ------------- | ----------------------------------------------- | -------------------------------------- |
| C1.1 伪元素   | `::before` / `::after` / `::marker` 等          | `background-image` 内联 SVG 或真实元素 |
| C1.2 结构伪类 | `:first-child` / `:nth-child()` 等              | 具体 class 选择器（如 `.first`）       |
| C1.3 动画过渡 | `@keyframes` / `animation` / `transition`       | 静态 CSS 效果                          |
| C1.4 定位     | `position: fixed` / `sticky`                    | `position: relative` + `margin`        |
| C1.5 滤镜混合 | `backdrop-filter` / `filter` / `mix-blend-mode` | `opacity` + `background-color`         |
| C1.6 外部资源 | `url(http://...)` / `@import`                   | data URL 或 manifest.assets            |
| C1.7 标签注入 | `<script>` / `<style>` / `<iframe>` / `<link>`  | 全部通过 variantCss 写入               |

### C2. WeMD 规范约束

| 规则                       | 要求                                                                                                                                                            |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| C2.1 顶层字段              | `sdkVersion`/`meta`/`tokens`/`components`/`layout`/`assets`/`codeTheme` 七选                                                                                    |
| C2.3 color 14 色           | `primary`/`primaryDark`/`primaryLight`/`secondary`/`accent`/`background`/`bgSoft`/`bgCard`/`bgMuted`/`textStrong`/`textNormal`/`textSoft`/`border`/`borderSoft` |
| C2.4 typography            | `fontFamily`/`fontSize`/`lineHeight`/`letterSpacing`/`codeFontFamily` + h1-h4 各 5 字段                                                                         |
| C2.5 spacing/border/shadow | `pagePadding`(num)/`paragraphMargin`(num) / `radius`(num) / `enabled`(bool)+`value`(str)                                                                        |
| C2.6 components            | variantCss 选择器格式 `.wemd-xxx[data-variant="yyy"]`                                                                                                           |
| C2.7 layout                | `preferredComponents` + `density`(low/medium/high) + `tone`(非空数组)                                                                                           |
| C2.8 assets.images         | `key`(非空) + `src`(以 `data:` 或 `assets/` 开头)                                                                                                               |

### C3. CSS 变量命名

| 错误                      | 正确                                         |
| ------------------------- | -------------------------------------------- |
| `--wemd-color-primary`    | `--wemd-primary`                             |
| `--wemd-color-border`     | `--wemd-border`                              |
| `--wemd-text-color`       | `--wemd-text-normal` 或 `--wemd-text-strong` |
| `--wemd-bg-color`         | `--wemd-bg-soft` 或 `--wemd-bg-card`         |
| `--wemd-border-radius-lg` | `--wemd-border-radius`（无后缀变体）         |
| `--wemd-font-family`      | 变量不存在，直接写 `font-family` 值          |

### C4. 素材资源约束

| 规则          | 限制                                                                       |
| ------------- | -------------------------------------------------------------------------- |
| C4.1 SVG 安全 | 禁止 `<script>` / `<foreignObject>` / `on*=` / `javascript:` / `<!ENTITY>` |
| C4.4 大小     | Inline SVG ≤ 5KB（建议 ≤ 500B），Base64 ≤ 150KB，整个包 ≤ 2MB              |
| C4.5 内容边界 | 不放文章内容图（产品图/实拍图/插画），只放品牌元素/风格装饰                |

### C5. 品牌一致性

| 规则         | 说明                                                                                      |
| ------------ | ----------------------------------------------------------------------------------------- |
| Logo 频率    | 不超过策略定义（如 `frequency: "low"` 只出现在 hero-banner/author-card/copyright-notice） |
| 装饰数量     | 按密度：low≤2、medium≤3、high≤4（不含 Background）                                        |
| 统一几何语言 | 所有装饰基于同一品牌元素（如全部六边形或全部波形）                                        |

### C6. 组件合法性

| 规则         | 说明                                                                           |
| ------------ | ------------------------------------------------------------------------------ |
| 合法组件     | 35 个（见下方清单）                                                            |
| 合法 tone    | `warm` / `minimal` / `elegant` / `rational` / `serious` / `modern` / `playful` |
| 合法 density | `low` / `medium` / `high`                                                      |
| SDK 版本     | `"1.0.0"`                                                                      |

---

## 4. CSS 变量完整表

| 变量                                  | tokens 源                | 示例值                     |
| ------------------------------------- | ------------------------ | -------------------------- |
| `--wemd-primary`                      | color.primary            | `#3b82f6`                  |
| `--wemd-primary-dark`                 | color.primaryDark        | `#2563eb`                  |
| `--wemd-primary-light`                | color.primaryLight       | `#dbeafe`                  |
| `--wemd-secondary`                    | color.secondary          | `#f59e0b`                  |
| `--wemd-accent`                       | color.accent             | `#ef4444`                  |
| `--wemd-bg-soft`                      | color.bgSoft             | `#f9fafb`                  |
| `--wemd-bg-card`                      | color.bgCard             | `#ffffff`                  |
| `--wemd-bg-muted`                     | color.bgMuted            | `#e5e7eb`                  |
| `--wemd-text-strong`                  | color.textStrong         | `#111827`                  |
| `--wemd-text-normal`                  | color.textNormal         | `#374151`                  |
| `--wemd-text-soft`                    | color.textSoft           | `#9ca3af`                  |
| `--wemd-border`                       | color.border             | `#d1d5db`                  |
| `--wemd-border-soft`                  | color.borderSoft         | `#e5e7eb`                  |
| `--wemd-page-padding`                 | spacing.pagePadding      | `16px`                     |
| `--wemd-paragraph-margin`             | spacing.paragraphMargin  | `12px`                     |
| `--wemd-font-size`                    | typography.fontSize      | `16px`                     |
| `--wemd-line-height`                  | typography.lineHeight    | `1.75`                     |
| `--wemd-letter-spacing`               | typography.letterSpacing | `0.5px`                    |
| `--wemd-h1-font-size` ~ `--wemd-h4-*` | typography.heading       | —                          |
| `--wemd-border-radius`                | border.radius            | `8px`                      |
| `--wemd-shadow`                       | shadow.value             | `0 2px 8px rgba(0,0,0,.1)` |
| `--wemd-asset-{key}`                  | assets.images[]          | `url(data:...)`            |

---

## 5. 合法组件清单（35 个）

**default 组（9 个）：**
`quote-card`, `divider-fancy`, `cta-card`, `code-frame`, `callout-pro`, `stats-block`, `image-grid`, `author-card`, `timeline`

**extra 组（13 个）：**
`follow-bar`, `qr-card`, `numbered-heading`, `section-title`, `image-text-row`, `hero-banner`, `share-card`, `related-posts`, `toc-nav`, `tag-label`, `image-caption`, `copyright-notice`, `styled-table`

**faq 组（1 个）：**
`faq`

**magazine 组（18 个，含跨组复用）：**
`magazine-cover`, `section-divider`, `image-card`, `text-card`, `full-quote`, `two-column-cards`, `end-card`, `product-card`, `brand-sign`, `resource-list`, `testimonial-card`, `series-nav`, `share-card`, `quote-card`, `cta-card`, `divider-fancy`, `hero-banner`, `callout-pro`

---

## 6. 常见错误 + 修复对照

| 错误写法                                  | 问题                | 正确写法                                       |
| ----------------------------------------- | ------------------- | ---------------------------------------------- |
| `.card::before { content: ""; }`          | 伪元素公众号不支持  | 用 `background-image` 内联 SVG 替代            |
| `.card:first-child { ... }`               | 结构伪类不支持      | 用 `.card-first` class 选择器                  |
| `transition: all 0.3s`                    | 导出后失效          | 只用静态 CSS                                   |
| `background: url(https://cdn.com/bg.png)` | 外部引用 404        | 内联 data URL 或 manifest.assets               |
| `background: url(assets/images/bg.svg)`   | zip 相对路径 404    | `var(--wemd-asset-bg)` 或 data URL             |
| `.my-class { ... }`                       | 选择器格式错误      | `.wemd-hero-banner[data-variant="my"] { ... }` |
| `var(--wemd-color-primary)`               | 变量名多了 `color-` | `var(--wemd-primary)`                          |
| `var(--wemd-border-radius-lg)`            | 不存在的后缀变体    | `var(--wemd-border-radius)`                    |
| `color: #07c160`                          | 硬编码颜色          | `color: var(--wemd-primary)`                   |
| SVG 中含 `<script>`                       | 安全风险，阻断导入  | 移除所有脚本标签                               |
| 主题包含 `.DS_Store`                      | 垃圾文件            | 打包前清理                                     |

---

## 7. 生成流程检查清单

| 阶段            | 要做什么                            | 关键检查                                      | 涉及文件                                            |
| --------------- | ----------------------------------- | --------------------------------------------- | --------------------------------------------------- |
| 0. 判断 Profile | 判断用户类型                        | Brand / Creator？                             | `profile-templates.md`                              |
| 1. 收集 Profile | 按模板收信息                        | 必填项是否齐全？                              | `profile-templates.md`                              |
| 2. 确认 Profile | 汇总给用户确认                      | 用户说"是"才能继续                            | —                                                   |
| 3. Logic        | 阅读体验 + 品牌表达/概念 + 组件映射 | 是否输出 Design Blueprint？                   | `design-logic-brand.md` / `design-logic-creator.md` |
| 4. Constraint   | 检查 Blueprint 合规性               | 伪元素？动画？外部引用？组件名合法？          | `constraint-layer.md`                               |
| 4.5 Decoration  | 选择装饰原子组合并映射为 CSS/HTML   | 品牌过滤？组合校验？                          | `decoration-library.md`                             |
| 5. Application  | 合并装饰 CSS + 基础样式 + 生成素材  | 装饰 CSS 正确合并？                           | `application-layer.md`                              |
| 6. Compiler     | 生成 manifest + CSS + 校验 + 打包   | 14 色完整？CSS 变量正确？选择器格式？         | `theme-package-spec.md`                             |
| 7. Feedback     | 设计质量评估                        | 品牌一致？阅读体验匹配？组件完整？            | `feedback-layer.md`                                 |
| 8. 交付         | 输出三件套                          | manifest.json + brand.md（可选）+ .wemd-theme | —                                                   |

---

## 8. 方案 A-E 概要

| 方案  | 名称             | 适用                | 优点                   | 缺点                  |
| ----- | ---------------- | ------------------- | ---------------------- | --------------------- |
| **A** | Inline SVG       | 简单几何图形、图标  | 无额外请求，颜色可调   | 复杂图形体积大        |
| **B** | Base64 PNG       | 复杂品牌装饰纹理    | 细节丰富，兼容性好     | 颜色不可调，文件大    |
| **C** | CSS border-image | 重复边框图案        | 可拉伸                 | X5 兼容性差（不推荐） |
| **D** | manifest.assets  | 跨组件复用品牌资源  | 统一管理，全局生效     | 需额外注册步骤        |
| **E** | 纯 CSS           | 渐变/阴影/边框/平铺 | 零额外资源，兼容性最好 | 不能展示具体图形      |
