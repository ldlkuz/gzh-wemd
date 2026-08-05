# ② Constraint Layer（约束层）

> 角色：**设计裁判**
> 回答：**哪些设计是公众号/WeMD 不支持的？**
> 位置：Logic Layer（输出 Design Blueprint）→ **Constraint Layer（检查）** → Application Layer（实现）

---

## 概述

Constraint Layer 是 Design Pipeline 中的"防呆层"。AI 在 Logic Layer 中产生的设计决策，必须先经过 Constraint Layer 检查，确认合规后才能进入 Application Layer 实现。

**核心原则：** 约束层只回答"是否合规"，不回答"是否好看"。它像一个裁判，在设计的每个阶段介入，确保 AI 不会天马行空到公众号/WeMD 不支持的方向。

---

## 约束矩阵

```
┌─────────────────────────────────────────────────────────────┐
│                    约束矩阵 (Constraint Matrix)               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  C1. 微信公众号平台约束  — 微信环境不支持的特性               │
│  C2. WeMD Theme 规范约束  — manifest.json 结构约束           │
│  C3. CSS 变量命名约束  — 变量名必须正确引用                   │
│  C4. 素材资源约束  — SVG/图片/资源的安全和大小限制             │
│  C5. 品牌一致性约束  — 设计不偏离品牌策略                     │
│  C6. 组件合法性约束  — 组件名和 variant 必须在注册表中         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## C1. 微信公众号平台约束

> 微信内嵌浏览器（X5 Blink 内核）对 CSS 的支持有限。以下特性在微信公众号中不可用或表现异常，**必须禁止**。

### C1.1 伪元素（❌ 禁止）

> **策略**：组件 CSS 中禁止使用伪元素。装饰元素已通过 Decoration Library 的原子系统（`<span>` 物理元素）统一处理，详见 [decoration-library.md](decoration-library.md)。

| 伪元素           | 状态    | 说明                             |
| ---------------- | ------- | -------------------------------- |
| `::before`       | ❌ 禁止 | 必须用物理 `<span>` 替代         |
| `::after`        | ❌ 禁止 | 必须用物理 `<span>` 替代         |
| `::marker`       | ❌ 禁止 | 用 `list-style: none` + 手动序号 |
| `::first-letter` | ❌ 禁止 | 用类选择器包裹首字               |
| `::first-line`   | ❌ 禁止 | 用类选择器包裹首行               |
| `::placeholder`  | ❌ 禁止 | 公众号无表单元素                 |
| `::selection`    | ❌ 禁止 | 无需替代                         |

**替代方案：**

AI 应直接在 HTML 中添加装饰元素：

```html
<!-- ✅ 正确：物理 span 替代 ::before -->
<h3 class="wemd-section-title" data-variant="01">
  <span class="wemd-deco-number">01</span>
  标题文字
</h3>
```

```css
/* ✅ 正确：类选择器替代 ::before */
.wemd-section-title[data-variant="01"] .wemd-deco-number {
  background: var(--wemd-primary);
  color: #fff;
  padding: 4px 12px;
  border-radius: 4px;
  margin-right: 12px;
}
```

**注意**：`content: counter(n)` 等动态函数无法在公众号中使用，AI 应避免使用，改用 HTML 中写死序号。

### C1.2 结构伪类（❌ 禁止）

| 禁止              | 原因             |
| ----------------- | ---------------- |
| `:first-child`    | 微信公众号不支持 |
| `:last-child`     | 微信公众号不支持 |
| `:nth-child(n)`   | 微信公众号不支持 |
| `:nth-of-type(n)` | 微信公众号不支持 |
| `:first-of-type`  | 微信公众号不支持 |
| `:last-of-type`   | 微信公众号不支持 |
| `:only-child`     | 微信公众号不支持 |
| `:empty`          | 微信公众号不支持 |

**替代方案：**

- 使用具体 class 选择器（如 `.wemd-card-first`）替代
- 在 variantCss 中为每个元素显式指定样式

### C1.3 动画与过渡（❌ 禁止运行时）

| 禁止             | 原因                                     |
| ---------------- | ---------------------------------------- |
| `@keyframes`     | 微信公众号不支持，且导出为静态文章后失效 |
| `animation`      | 同上                                     |
| `animation-name` | 同上                                     |
| `transition`     | 导出为静态文章后失效                     |

**⚠️ 说明：** 在 WeMD 编辑器中预览时可以保留动画，但**导出到公众号后，所有动画和过渡都会失效**。因此不要在主题包中包含任何动画，以免依赖动画的设计在公众号中无法显示。

**替代方案：**

- 使用静态 CSS 实现视觉效果（渐变、阴影、边框）
- 不需要动画替代方案

### C1.4 定位（❌ 禁止）

| 禁止               | 原因                     |
| ------------------ | ------------------------ |
| `position: fixed`  | 微信公众号不支持固定定位 |
| `position: sticky` | 微信公众号不支持粘性定位 |

**替代方案：**

- 使用 `position: relative` + `margin` 实现布局
- 使用 `display: flex` 或 `display: grid` 实现排列

### C1.5 滤镜与混合（❌ 禁止）

| 禁止              | 原因             |
| ----------------- | ---------------- |
| `backdrop-filter` | 微信公众号不支持 |
| `filter: blur()`  | 微信公众号不支持 |
| `mix-blend-mode`  | 微信公众号不支持 |
| `isolation`       | 微信公众号不支持 |

**替代方案：**

- 使用 `opacity` + `background-color` 实现半透明效果
- 使用渐变（`linear-gradient`）实现颜色过渡

### C1.6 外部资源引用（❌ 禁止）

| 禁止                       | 原因                         |
| -------------------------- | ---------------------------- |
| `url(http://...)`          | 外部资源引用，公众号环境 404 |
| `url(https://...)`         | 同上                         |
| `@import url(http://...)`  | 外部样式引入                 |
| `@import url(https://...)` | 同上                         |

**替代方案：**

- 小装饰 SVG 直接内联为 `url("data:image/svg+xml;utf8,...")`
- 跨组件复用的品牌资源通过 `manifest.assets.images` 注册，用 `var(--wemd-asset-<key>)` 引用

### C1.7 标签注入（❌ 禁止）

| 禁止            | 原因                       |
| --------------- | -------------------------- |
| `<style>` 标签  | 安全风险，可能破坏页面样式 |
| `<script>` 标签 | 安全风险，脚本注入         |
| `<iframe>` 标签 | 安全风险                   |
| `<link>` 标签   | 外部资源引入               |

**替代方案：**

- 所有样式通过 `variantCss` 字段写入
- 所有资源通过 manifest 注册

### C1.8 CSS 单位（⚠️ 注意）

| 单位               | 说明                                          |
| ------------------ | --------------------------------------------- |
| `px`               | ✅ 推荐，兼容性最好                           |
| `%`                | ✅ 推荐，相对父元素                           |
| `em` / `rem`       | ✅ 可用                                       |
| `vw` / `vh`        | ⚠️ 注意：在公众号文章中可能计算异常，建议测试 |
| `ch` / `ex`        | ⚠️ 注意：兼容性一般                           |
| `cm` / `mm` / `in` | ❌ 不推荐，打印单位在屏幕无意义               |

---

## C2. WeMD Theme 规范约束

> manifest.json 的字段结构约束。所有规则来自 `theme-package-spec.md` 和 `ThemeValidator.ts`。

### C2.1 顶层字段

| 字段         | 类型     | 必填 | 约束                                            |
| ------------ | -------- | ---- | ----------------------------------------------- |
| `sdkVersion` | `string` | ✅   | 固定为 `"1.0.0"`                                |
| `meta`       | `object` | ✅   | 必须包含 id/name/description/keywords/version   |
| `tokens`     | `object` | ✅   | 必须包含 color/typography/spacing/border/shadow |
| `components` | `object` | ⚠️   | AI 主题选填，但写了 variant 就必须有 variantCss |
| `layout`     | `object` | ✅   | 必须包含 preferredComponents/density/tone       |
| `assets`     | `object` | ⚠️   | 选填，有图片资源时使用                          |
| `codeTheme`  | `string` | ⚠️   | 只能是 `"github"` 或 `"github-dark"`            |

**禁止：** 顶层字段不能出现 `sdkVersion`/`meta`/`tokens`/`components`/`layout`/`assets`/`codeTheme` 之外的字段。

### C2.2 meta 字段约束

| 字段          | 类型       | 必填 | 约束                              |
| ------------- | ---------- | ---- | --------------------------------- |
| `id`          | `string`   | ✅   | 非空，格式：`{简称}-{关键词缩写}` |
| `name`        | `string`   | ✅   | 非空，格式：`{名称}·{风格}`       |
| `description` | `string`   | ✅   | 非空，一句话描述                  |
| `keywords`    | `string[]` | ✅   | 非空数组                          |
| `version`     | `string`   | ✅   | 语义版本号，如 `"1.0.0"`          |

### C2.3 tokens.color 约束（14 字段全必填）

```
primary, primaryDark, primaryLight, secondary, accent,
background, bgSoft, bgCard, bgMuted,
textStrong, textNormal, textSoft,
border, borderSoft
```

**颜色值约束：**

- 每个值必须是合法 CSS 颜色（hex/rgb/rgba/hsl）
- `textStrong` 对 `background` 的对比度 ≥ 4.5:1（WCAG AA）
- `bgCard` 对 `textStrong` 的对比度 ≥ 4.5:1
- `bgSoft` 和 `background` 必须有肉眼可区分的差异

### C2.4 tokens.typography 约束

| 字段             | 类型     | 必填 | 约束                    |
| ---------------- | -------- | ---- | ----------------------- |
| `fontFamily`     | `string` | ✅   | 非空                    |
| `fontSize`       | `string` | ✅   | 必须带单位，如 `"16px"` |
| `lineHeight`     | `string` | ✅   | 推荐 1.6~1.9            |
| `letterSpacing`  | `number` | ✅   | 数字                    |
| `heading.h1~h4`  | `object` | ✅   | 各 5 个字段必填         |
| `codeFontFamily` | `string` | ✅   | 非空                    |

**heading 子字段（h1-h4 各 5 个必填）：**

- `fontSize`(number)：必须严格递减（h1 > h2 > h3 > h4）
- `color`(string)：合法 CSS 颜色
- `marginTop`(number)：数字
- `marginBottom`(number)：数字
- `fontWeight`(string)：字符串，如 `"700"`

### C2.5 tokens 其他字段约束

| 字段                      | 类型      | 必填 | 约束                                       |
| ------------------------- | --------- | ---- | ------------------------------------------ |
| `spacing.pagePadding`     | `number`  | ✅   | 数字                                       |
| `spacing.paragraphMargin` | `number`  | ✅   | 数字                                       |
| `border.radius`           | `number`  | ✅   | 数字（不是字符串）                         |
| `shadow.enabled`          | `boolean` | ✅   | 布尔值                                     |
| `shadow.value`            | `string`  | ✅   | 非空（即使 enabled=false 也要填 `"none"`） |

### C2.6 components 配置约束

每个组件配置：
| 字段 | 类型 | 必填 | 约束 |
|------|------|------|------|
| `enabled` | `boolean` | ✅ | 布尔值 |
| `variant` | `string` | ⚠️ | 声明 variant 就必须有 variantCss |
| `variantCss` | `string` | ⚠️ | 选择器必须包含 `.wemd-xxx[data-variant="yyy"]` 格式 |
| `overrides` | `Record<string,string>` | ⚠️ | 值是 `Record<string, string>` |

**variantCss 禁止项：**

- 结构伪类（:first-child 等）
- 外链 url()
- `<style>` / `<script>` 标签
- `@keyframes` / `animation` / `backdrop-filter` / `filter` / `position:fixed` / `position:sticky`
- CSS 变量中引用不存在的 `--wemd-xxx` 变量

> **注意**：`::before` / `::after` 伪元素**禁止使用**，必须用物理 `<span>` 元素替代。装饰元素通过 Decoration Library 的原子系统选择组合，详见 [decoration-library.md](decoration-library.md)。

### C2.7 layout 字段约束

| 字段                  | 类型       | 必填 | 约束                                            |
| --------------------- | ---------- | ---- | ----------------------------------------------- |
| `preferredComponents` | `array`    | ✅   | 字符串或 `{name, reason?}` 对象，reason ≤ 50 字 |
| `density`             | `string`   | ✅   | 只能是 `"low"` / `"medium"` / `"high"`          |
| `tone`                | `string[]` | ✅   | 非空数组，合法值见 component-registry.md        |

### C2.8 assets.images 约束

| 字段  | 类型     | 必填 | 约束                                                |
| ----- | -------- | ---- | --------------------------------------------------- |
| `key` | `string` | ✅   | 非空，CSS 中通过 `var(--wemd-asset-{safeKey})` 引用 |
| `src` | `string` | ✅   | 必须以 `"data:"` 或 `"assets/"` 开头                |

**Logo 约束：** 单个 base64 data URL 不超过 150KB（建议用 SVG 或压缩后的 PNG）。

---

## C3. CSS 变量命名约束

> 所有 CSS 变量必须使用 `--wemd-` 前缀的正确命名。常见错误是多了 `color-` 层或使用了不存在的后缀。

### C3.1 正确变量名

| 正确写法                              | 来源                            |
| ------------------------------------- | ------------------------------- |
| `--wemd-primary`                      | tokens.color.primary            |
| `--wemd-primary-dark`                 | tokens.color.primaryDark        |
| `--wemd-primary-light`                | tokens.color.primaryLight       |
| `--wemd-secondary`                    | tokens.color.secondary          |
| `--wemd-accent`                       | tokens.color.accent             |
| `--wemd-bg-soft`                      | tokens.color.bgSoft             |
| `--wemd-bg-card`                      | tokens.color.bgCard             |
| `--wemd-bg-muted`                     | tokens.color.bgMuted            |
| `--wemd-text-strong`                  | tokens.color.textStrong         |
| `--wemd-text-normal`                  | tokens.color.textNormal         |
| `--wemd-text-soft`                    | tokens.color.textSoft           |
| `--wemd-border`                       | tokens.color.border             |
| `--wemd-border-soft`                  | tokens.color.borderSoft         |
| `--wemd-page-padding`                 | tokens.spacing.pagePadding      |
| `--wemd-paragraph-margin`             | tokens.spacing.paragraphMargin  |
| `--wemd-font-size`                    | tokens.typography.fontSize      |
| `--wemd-line-height`                  | tokens.typography.lineHeight    |
| `--wemd-letter-spacing`               | tokens.typography.letterSpacing |
| `--wemd-h1-font-size` ~ `--wemd-h4-*` | tokens.typography.heading       |
| `--wemd-border-radius`                | tokens.border.radius            |
| `--wemd-shadow`                       | tokens.shadow.value             |
| `--wemd-asset-{key}`                  | assets.images                   |

### C3.2 常见错误

| 错误写法                  | 错误原因         | 正确写法                                     |
| ------------------------- | ---------------- | -------------------------------------------- |
| `--wemd-color-primary`    | 多了 `color-` 层 | `--wemd-primary`                             |
| `--wemd-color-border`     | 多了 `color-` 层 | `--wemd-border`                              |
| `--wemd-text-color`       | 变量不存在       | `--wemd-text-normal` 或 `--wemd-text-strong` |
| `--wemd-bg-color`         | 变量不存在       | `--wemd-bg-soft` 或 `--wemd-bg-card`         |
| `--wemd-border-radius-lg` | 不存在的后缀     | `--wemd-border-radius`                       |
| `--wemd-border-radius-sm` | 不存在的后缀     | `--wemd-border-radius`                       |
| `--wemd-primary-alpha`    | 变量不存在       | 使用 `--wemd-primary` + `opacity`            |
| `--wemd-font-family`      | 变量不存在       | 直接写 `font-family` 值                      |

---

## C4. 素材资源约束

> SVG 和图片资源的安全性和大小限制。

### C4.1 SVG 安全检测（❌ 禁止）

以下任意一项出现，直接阻断：

| 禁止项                                            | 风险             |
| ------------------------------------------------- | ---------------- |
| `<script>` 标签                                   | XSS 脚本注入     |
| `<foreignObject>` 标签                            | 可嵌入 HTML/脚本 |
| `onload=` / `onclick=` / `on*=` 属性              | 事件注入         |
| `href="javascript:"` / `xlink:href="javascript:"` | 伪协议注入       |
| `<!ENTITY>` 声明                                  | XXE 外部实体注入 |
| `@import url(http://...)`                         | 外部样式引用     |

### C4.2 伪位图 SVG（⚠️ Warning）

```svg
<!-- ❌ 伪位图：嵌入了 base64 图片的 SVG -->
<svg>
  <image href="data:image/png;base64,iVBORw0KGgo..." />
</svg>
```

**问题：** 不是纯矢量、放大不清晰、体积大。
**建议：** 重绘为纯矢量（`<path>`/`<circle>`/`<rect>` 等），或直接用 PNG 放 assets/images。

### C4.3 资源存储方式（三种合法形式）

| 方式                                  | 适用场景                                           | 示例                                                                               |
| ------------------------------------- | -------------------------------------------------- | ---------------------------------------------------------------------------------- |
| **A. 直接内联 variantCss**            | 组件专属的小装饰 SVG（< 5KB），只给单个组件用      | `background: url("data:image/svg+xml;utf8,...")`                                   |
| **B. manifest.assets + data URL**     | 跨组件复用的资源（品牌 Logo），不依赖 zip 额外文件 | `{ key: "logo", src: "data:image/svg+xml;base64,..." }` → `var(--wemd-asset-logo)` |
| **C. manifest.assets + zip 独立文件** | 资源较多或有 PNG/JPG                               | `{ key: "logo", src: "assets/images/logo.svg" }` + zip 内对应文件                  |

**禁止：** 在 CSS 中直接写 `url(assets/images/xxx)` — 公众号环境不会解析 zip 内相对路径，一定 404。

### C4.4 大小限制

| 资源类型              | 最大大小 | 说明                           |
| --------------------- | -------- | ------------------------------ |
| inline SVG (data URL) | ≤ 5KB    | 建议不超过 500B                |
| 单个 base64 data URL  | ≤ 150KB  | Logo 建议用 SVG 或压缩后的 PNG |
| 整个主题包            | ≤ 2MB    | 含所有资源                     |

### C4.5 内容边界

**不应该放主题包的内容：**

- 产品图、实拍图、正文插画等某篇文章专属的内容图片
- 这些内容应该在 Markdown 里通过图床插入，不是主题的一部分

**应该放主题包的内容：**

- 品牌元素（Logo、装饰图形）
- 使用了这个主题后，每篇文章都要自动出现的风格装饰

---

## C5. 品牌一致性约束

> 这些约束不是硬性语法规则，而是设计质量规则。Constraint Layer 检查时给出 Warning，不阻断。

### C5.1 Logo 使用约束

- Logo 使用频率不超过品牌表达策略定义（如 `frequency: "low"` 表示只在 hero-banner/author-card/copyright-notice 出现）
- Logo 不出现策略中 `avoid` 定义的组件（如 section-divider、tag-label）

### C5.2 装饰约束

- 装饰元素不能干扰正文阅读（背景纹理透明度 ≤ 30%，尺寸不覆盖文字区域）
- 装饰元素数量按密度限制：low≤2、medium≤3、high≤4（不含 Background），超限给出 Warning 不阻断

### C5.3 品牌色使用约束

- 品牌色使用范围不超出策略定义
- `primary` 色用于 CTA、链接、强调色、标题
- `accent` 色极少出现，仅用于特别重要的标记
- 不使用策略未定义的颜色

### C5.4 统一性约束

- 所有组件使用统一的几何语言（如所有装饰都基于六边形，或所有装饰都基于波形）
- 字体选择不超过 2 种（正文 + 标题，可共享同一字体族）

---

## C6. 组件合法性约束

> 组件名和 variant 必须在注册表中存在。

### C6.1 合法组件列表（35 个）

**default 组（9 个）：**
`quote-card`, `divider-fancy`, `cta-card`, `code-frame`, `callout-pro`, `stats-block`, `image-grid`, `author-card`, `timeline`

**extra 组（13 个）：**
`follow-bar`, `qr-card`, `numbered-heading`, `section-title`, `image-text-row`, `hero-banner`, `share-card`, `related-posts`, `toc-nav`, `tag-label`, `image-caption`, `copyright-notice`, `styled-table`

**faq 组（1 个）：**
`faq`

**magazine 组（18 个）：**
`magazine-cover`, `section-divider`, `image-card`, `text-card`, `full-quote`, `two-column-cards`, `end-card`, `product-card`, `brand-sign`, `resource-list`, `testimonial-card`, `series-nav`, `share-card`, `quote-card`, `cta-card`, `divider-fancy`, `hero-banner`, `callout-pro`

### C6.2 合法 tone 值

`warm`, `minimal`, `elegant`, `rational`, `serious`, `modern`, `playful`

### C6.3 合法 density 值

`low`, `medium`, `high`

### C6.4 合法 SDK 版本

`"1.0.0"`

---

## 约束检查流程

### 在 Design Pipeline 中的位置

```
┌─ Logic Layer ──────────────────────────────────────┐
│ 输出：Design Blueprint (品牌表达策略 + 组件表达映射表) │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─ Constraint Layer ──────────────────────────────────┐
│                                                      │
│  ① C1 检查：微信公众号平台约束                        │
│     → Blueprint 中是否有动画/定位/结构伪类等设计？     │
│     → ::before/::after 伪元素 → ❌ 禁止，必须用物理 `<span>` 替代 │
│     → 其他违规 → 打回 Logic Layer 调整                 │
│                                                      │
│  ② C6 检查：组件合法性                               │
│     → 组件名是否都在 LEGAL_COMPONENTS 中？            │
│     → 不在 → 替换为合法组件                           │
│                                                      │
│  ③ C5 检查：品牌一致性                               │
│     → Logo 使用是否在策略范围内？                      │
│     → 装饰是否过多？                                 │
│     → 超出 → 给出 Warning，建议调整                    │
│                                                      │
│  ④ 输出：合规的 Design Blueprint                     │
│                                                      │
└──────────────────────┬──────────────────────────────┘
                       │ 通过
                       ▼
┌─ Decoration Layer ───────────────────────────────────┐
│ 选择装饰原子组合，详见 decoration-library.md            │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─ Application Layer ─────────────────────────────────┐
│ 在实现时，检查 C3 (CSS 变量) + C4 (资源约束)          │
└──────────────────────────────────────────────────────┘
```

### 在 AI 生成流程中的步骤

1. **Logic Layer 完成后**：AI 输出 Design Blueprint（YAML）
2. **Constraint Layer 介入**：AI 逐项检查 C1-C6
3. **违反 C1/C2/C3/C4/C6**：硬性阻断，打回 Logic Layer 调整
4. **违反 C5**：软性 Warning，标记"建议调整"但不阻断
5. **通过后**：进入 Decoration Layer 选择装饰原子组合，再进入 Application Layer 实现

### 检查输出格式

```yaml
constraintCheck:
  passed: true # 是否全部通过
  summary: "2 个 Warning，建议修复后继续"
  checks:
    - id: "C1.1"
      name: "伪元素检查"
      severity: "error" # ::before/::after 禁止，必须用物理元素替代
      status: "passed"
      issues: []
    - id: "C1.2"
      name: "结构伪类检查"
      severity: "error"
      status: "passed"
      issues: []
    - id: "C5.1"
      name: "Logo 使用频率检查"
      severity: "warning"
      status: "failed"
      issues:
        - "Logo 在 section-divider 中出现，违反策略定义"
```

---

## 与 Validator 的区分

| 维度             | Constraint Layer           | Validator（Compiler 内）           |
| ---------------- | -------------------------- | ---------------------------------- |
| 时机             | Logic → Application 之间   | Compiler 输出前                    |
| 检查对象         | Design Blueprint（策略）   | manifest.json + variantCss（代码） |
| 检查内容         | 设计是否可被公众号支持     | 语法是否正确、字段是否完整         |
| 反馈方式         | 打回 Logic 调整 or Warning | 报错阻断，需要修复                 |
| 是否需要 AI 判断 | 部分需要（C5 品牌一致性）  | 不需要（纯规则检查）               |
