# WeMD Theme Package 规范（AI 输出规范）

> 本文档是 AI 生成主题包时必须遵守的输出规范。所有内容从 WeMD core 包的 `componentRegistry.ts` 和 `ThemeValidator.ts` 派生，是规范的**单一来源**。

---

## 一、Theme Package 结构

一个完整的 Theme Package 是一个 `.wemd-theme` zip 压缩包，内含以下文件：

```
my-theme.wemd-theme/
├── manifest.json          # 必填：主题包声明
├── styles/
│   └── components.css     # 可选：组件样式微调
├── brand.md               # 可选：品牌语言说明
└── assets/
    └── images/            # 可选：图片资源（自动转为 base64 data URL）
```

---

## 二、manifest.json 完整结构

### 2.1 顶层字段

| 字段         | 类型     | 必填 | 说明                                    |
| ------------ | -------- | ---- | --------------------------------------- |
| `sdkVersion` | `string` | ✅   | 固定为 `"1.0.0"`                        |
| `meta`       | `object` | ✅   | 主题元信息                              |
| `tokens`     | `object` | ✅   | 设计令牌                                |
| `components` | `object` | ⚠️   | 组件配置（AI 主题选填）                 |
| `layout`     | `object` | ✅   | 排版偏好                                |
| `assets`     | `object` | ⚠️   | 主题包资源                              |
| `codeTheme`  | `string` | ⚠️   | 代码高亮：`"github"` 或 `"github-dark"` |

### 2.2 meta 字段

| 字段          | 类型       | 必填 | 说明                            |
| ------------- | ---------- | ---- | ------------------------------- |
| `id`          | `string`   | ✅   | 唯一标识符，如 `"ocean-breeze"` |
| `name`        | `string`   | ✅   | 显示名称，如 `"海风轻拂"`       |
| `description` | `string`   | ✅   | 一句话描述                      |
| `keywords`    | `string[]` | ✅   | 搜索关键词，非空数组            |
| `version`     | `string`   | ✅   | 语义版本号，如 `"1.0.0"`        |

### 2.3 tokens.color（14 个字段，全部必填）

| 字段           | 说明                   |
| -------------- | ---------------------- |
| `primary`      | 主色                   |
| `primaryDark`  | 主色深色（hover/强调） |
| `primaryLight` | 主色浅色（背景/装饰）  |
| `secondary`    | 辅助色                 |
| `accent`       | 点缀色（高亮/重点）    |
| `background`   | 页面背景               |
| `bgSoft`       | 柔和背景               |
| `bgCard`       | 卡片背景               |
| `bgMuted`      | 灰背景                 |
| `textStrong`   | 强文字色（标题）       |
| `textNormal`   | 普通文字色（正文）     |
| `textSoft`     | 弱文字色（辅助信息）   |
| `border`       | 边框色                 |
| `borderSoft`   | 柔和边框               |

### 2.4 tokens.typography（全部必填）

| 字段             | 类型     | 说明                            |
| ---------------- | -------- | ------------------------------- |
| `fontFamily`     | `string` | 正文字体族                      |
| `fontSize`       | `string` | 正文字号，必须带单位如 `"16px"` |
| `lineHeight`     | `string` | 正文行高，如 `"1.75"`           |
| `letterSpacing`  | `number` | 字间距                          |
| `heading`        | `object` | h1-h4 四级标题                  |
| `codeFontFamily` | `string` | 代码字体族                      |

**heading 子字段（h1-h4 各 5 个必填）：**
`fontSize`(number)、`color`(string)、`marginTop`(number)、`marginBottom`(number)、`fontWeight`(string)

### 2.5 tokens 其他

- `spacing`：`pagePadding`(number)、`paragraphMargin`(number)
- `border`：`radius`(number)
- `shadow`：`enabled`(boolean)、`value`(string)

### 2.6 components 配置

每个组件配置结构：

| 字段         | 类型                    | 必填 | 说明                                     |
| ------------ | ----------------------- | ---- | ---------------------------------------- |
| `enabled`    | `boolean`               | ✅   | 是否启用                                 |
| `variant`    | `string`                | ⚠️   | 自定义 variant 名（必须配套 variantCss） |
| `variantCss` | `string`                | ⚠️   | 自定义造型 CSS                           |
| `overrides`  | `Record<string,string>` | ⚠️   | CSS 属性覆盖                             |

合法组件清单见 `spec/component-registry.md`。

### 2.7 layout 字段

| 字段                  | 类型       | 必填 | 说明                                                                   |
| --------------------- | ---------- | ---- | ---------------------------------------------------------------------- |
| `preferredComponents` | `array`    | ✅   | 偏好组件（字符串或 `{name, reason?}` 对象）                            |
| `density`             | `string`   | ✅   | `"low"` / `"medium"` / `"high"`                                        |
| `tone`                | `string[]` | ✅   | 非空数组，合法值：warm/minimal/elegant/rational/serious/modern/playful |

### 2.8 assets.images

| 字段  | 类型     | 必填 | 说明                                                                                                             |
| ----- | -------- | ---- | ---------------------------------------------------------------------------------------------------------------- |
| `key` | `string` | ✅   | 资源 key，CSS 中通过 `var(--wemd-asset-{safeKey})` 引用，`safeKey` = `key` 中非 `[a-zA-Z0-9_-]` 的字符替换为 `-` |
| `src` | `string` | ✅   | 必须以 `"data:"` (内联 base64) 或 `"assets/"` (zip 内独立文件) 开头                                              |

### 2.9 三种合法资源存储形式（主题设计师自由选）

| 方式                                    | 何时用                                                                            | 示例                                                                                                  |
| --------------------------------------- | --------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| **A. 直接内联到 variantCss**            | 组件专属的小装饰 SVG（< 5KB），只给单个组件用                                     | `.wemd-quote-card { background: url("data:image/svg+xml;utf8,<svg>...</svg>"); }`                     |
| **B. manifest.assets + data URL**       | 跨组件复用的资源（如品牌 Logo），想和 manifest JSON 一起交付，不依赖 zip 额外文件 | `{ key: "logo", src: "data:image/svg+xml;base64,PD94..." }` 然后 `var(--wemd-asset-logo)` 引用        |
| **C. manifest.assets + zip 内独立文件** | 资源较多或有 PNG/JPG，希望主题包结构清晰                                          | `{ key: "logo", src: "assets/images/logo.svg" }` + zip 里对应文件，然后 `var(--wemd-asset-logo)` 引用 |

> **注意：不要用 `url(assets/images/xxx)` 直接写在 CSS 里**。公众号环境不会解析 zip 内相对路径，引用一定 404。正确方式是上面 A/B/C 三种，检测工具会对错误写法直接报 Error。

> **什么不该放主题包**：产品图、实拍图、正文插画等**某篇文章专属的内容图片**——请直接在 Markdown 里通过图床插入，不是主题的一部分。主题包里的资源应该是「用了这个主题，每篇文章都要自动出现」的品牌元素/风格装饰。

---

## 三、SVG 安全规则

SVG 是矢量资源，但本质是 XML，可以嵌脚本。主题包对 SVG 做白名单式扫描，出现以下任意一项直接 Error 阻断导入：

- ❌ `<script>`（脚本注入）
- ❌ `<foreignObject>`（可嵌 HTML/脚本）
- ❌ `onload=` / `onclick=` / `on*=`（任意事件属性）
- ❌ `href="javascript:"` / `xlink:href="javascript:"`
- ❌ `<!ENTITY>`（XXE 风险）
- ❌ `@import url(http://...)`（外部引用）

**伪位图 SVG（<image> 嵌 base64 PNG/JPG）** 给 Warning：不是纯矢量、放大不清晰、体积大。建议重绘为纯矢量（<path>/<circle> 等）或直接用 PNG 然后放 assets/images。

---

## 四、AI 主题 Variant 机制（轨道 B）

AI 主题统一走**轨道 B**：所有组件造型通过 `variantCss` 字段自定义。

### 规则

1. **自定义 variant 命名**：任意字符串，建议 `{品牌}-{组件}-{特征}` 格式
2. **必须配套 variantCss**：声明 `variant` 就必须提供 `variantCss`
3. **variantCss 选择器格式**：`.wemd-<组件名>[data-variant="<variant>"]`
4. **不需要定制造型的组件**：只写 `"enabled": true`，不写 variant/variantCss

### 禁止项（Validator 阻断）

| 禁止项                                                     | 原因                                                                      |
| ---------------------------------------------------------- | ------------------------------------------------------------------------- |
| `::before` / `::after` / `::marker` 等伪元素               | 微信公众号不支持                                                          |
| `:first-child` / `:last-child` / `:nth-child()` 等结构伪类 | 微信公众号不支持                                                          |
| `url(http://...)` / `url(https://...)` 外链                | 禁止外部资源，必须内联或放主题包                                          |
| `url(assets/images/...)` 相对路径                          | 公众号环境 404，请改用 `var(--wemd-asset-xxx)` 或直接内联 `url(data:...)` |
| `<style>` / `<script>` 标签                                | 安全风险                                                                  |
| `@import url(http://...)`                                  | 禁止外部样式引入                                                          |

### 必须遵守

- variantCss 选择器必须以 `.wemd-xxx[data-variant="yyy"]` 为前缀
- 图片通过 `var(--wemd-asset-xxx)` 或直接 `url(data:...)` 内联，禁止写死 URL
- 优先使用 CSS 变量，让组件跟随主题颜色

### 与 overrides 的分工

- `variantCss`：整个造型的结构 + 视觉（AI 写完整 CSS 块）
- `overrides`：单个 CSS 属性覆盖（微调用）

---

## 五、完整的 CSS 变量表（tokenCss.ts 实际生成）

| 变量                              | tokens 源                                            | 示例值                               |
| --------------------------------- | ---------------------------------------------------- | ------------------------------------ |
| `--wemd-primary`                  | `tokens.color.primary`                               | `#3b82f6`                            |
| `--wemd-primary-dark`             | `tokens.color.primaryDark`                           | `#2563eb`                            |
| `--wemd-primary-light`            | `tokens.color.primaryLight`                          | `#dbeafe`                            |
| `--wemd-primary-alpha-2/4/6/8/25` | 由 `color.primary` 自动派生半透明色                  | `rgba(59,130,246,.02)`               |
| `--wemd-secondary`                | `tokens.color.secondary`                             | `#f59e0b`                            |
| `--wemd-accent`                   | `tokens.color.accent`                                | `#ef4444`                            |
| `--wemd-bg-soft`                  | `tokens.color.bgSoft`                                | `#f9fafb`                            |
| `--wemd-bg-card`                  | `tokens.color.bgCard`                                | `#ffffff`                            |
| `--wemd-bg-muted`                 | `tokens.color.bgMuted`                               | `#e5e7eb`                            |
| `--wemd-text-strong`              | `tokens.color.textStrong`                            | `#111827`                            |
| `--wemd-text-normal`              | `tokens.color.textNormal`                            | `#374151`                            |
| `--wemd-text-soft`                | `tokens.color.textSoft`                              | `#9ca3af`                            |
| `--wemd-border`                   | `tokens.color.border`                                | `#d1d5db`                            |
| `--wemd-border-soft`              | `tokens.color.borderSoft`                            | `#e5e7eb`                            |
| `--wemd-page-padding`             | `tokens.spacing.pagePadding` + `px`                  | `16px`                               |
| `--wemd-paragraph-margin`         | `tokens.spacing.paragraphMargin` + `px`              | `12px`                               |
| `--wemd-font-size`                | `tokens.typography.fontSize`                         | `16px`                               |
| `--wemd-line-height`              | `tokens.typography.lineHeight`                       | `1.75`                               |
| `--wemd-letter-spacing`           | `tokens.typography.letterSpacing` + `px`             | `0.5px`                              |
| `--wemd-h1-font-size`             | `tokens.typography.heading.h1.fontSize` + `px`       | `28px`                               |
| `--wemd-h1-color`                 | `tokens.typography.heading.h1.color`                 | `#111827`                            |
| `--wemd-h1-margin-top`            | `tokens.typography.heading.h1.marginTop` + `px`      | `24px`                               |
| `--wemd-h1-margin-bottom`         | `tokens.typography.heading.h1.marginBottom` + `px`   | `16px`                               |
| `--wemd-h2-*` ~ `--wemd-h4-*`     | 同上，h2/h3/h4                                       | —                                    |
| `--wemd-border-radius`            | `tokens.border.radius` + `px`                        | `8px`                                |
| `--wemd-shadow`                   | `tokens.shadow.value`（仅 `shadow.enabled=true` 时） | `0 2px 8px rgba(0,0,0,.1)`           |
| `--wemd-asset-{key}`              | `assets.images[]` 的图片 data URL                    | `url(data:image/svg+xml;base64,...)` |

### 常见错误对照

| 错误写法                                                  | 正确写法                                                                    |
| --------------------------------------------------------- | --------------------------------------------------------------------------- |
| `.card::before { ... }`                                   | 用真实元素替代伪元素                                                        |
| `.card:first-child { ... }`                               | 用 `.card-first` class 替代                                                 |
| `url(https://cdn.com/bg.png)`                             | `url("data:image/svg+xml;utf8,...")` 直接内联，或 `var(--wemd-asset-my-bg)` |
| `url(assets/images/logo.svg)` ❌（CSS 中直接写 zip 路径） | 在 manifest 注册 key 后写 `var(--wemd-asset-logo)`，或直接内联 data URL     |
| `.my-card { ... }`                                        | `.wemd-share-card[data-variant="my"] { ... }`                               |
| `var(--wemd-color-primary)` ❌（多了 `color-`）           | `var(--wemd-primary)` ✅                                                    |
| `var(--wemd-color-border)` ❌（多了 `color-`）            | `var(--wemd-border)` ✅                                                     |
| `var(--wemd-text-color)` ❌（变量不存在）                 | `var(--wemd-text-normal)` 或 `var(--wemd-text-strong)` ✅                   |
| `color: #07c160;`（硬编码颜色）                           | `color: var(--wemd-primary);`（跟随主题） ✅                                |

---

## 六、brand.md 写作指南

`brand.md` 是可选文件，内容会被注入 AI 排版 Prompt 的品牌规则块。

建议包含：

1. **品牌语气**：称谓方式、语气风格
2. **排版偏好**：段落组织方式、清单使用习惯
3. **视觉关键词**：风格描述词
4. **组件推荐**：特定场景下推荐使用的组件

示例：

```markdown
## 品牌语气

- 用"你"称呼读者，保持亲切专业的语调
- 段落简短，每段不超过 3 句话

## 排版风格

- 每篇开头用 hero-banner 做视觉引导
- 结尾用 share-card 引导分享

## 品牌关键词

专业、理性、极简、科技感
```

---

## 七、Compiler Pipeline（编译流水线）

> **Compiler Layer 是 6 层架构中的第⑤层，负责将 Design Blueprint 编译为可交付的 .wemd-theme 包。**
> 输入：Logic Layer 的 Design Blueprint + Application Layer 的实现方案选择
> 输出：.wemd-theme 压缩包

### 7.1 编译流程

```
Design Blueprint (来自 Application Layer)
         │
         ▼
  ┌─ Manifest Generator ──────────┐
  │  Blueprint → manifest.json    │
  │  tokens 填充（14 色 + 排版）    │
  │  components 拼装（variantCss）  │
  │  layout 配置（密度/基调）        │
  │  assets 引用（Logo/装饰 SVG）    │
  └────────┬──────────────────────┘
           │
           ▼
  ┌─ CSS Generator ───────────────┐
  │  variantCss 注入 CSS 变量       │
  │  Base64 内联（小 SVG → data URL）│
  │  品牌色替换（currentColor → 品牌色）│
  └────────┬──────────────────────┘
           │
           ▼
  ┌─ Validator ───────────────────┐
  │  manifest 结构校验              │
  │  CSS 变量存在性检查              │
  │  资源存在性检查（assets key → src）│
  │  约束检查（伪元素/动画/外链等）    │
  └────────┬──────────────────────┘
           │
           ▼
  ┌─ Packager ────────────────────┐
  │  manifest.json + brand.md     │
  │  + assets/images/ → ZIP       │
  │  输出 .wemd-theme              │
  └───────────────────────────────┘
```

### 7.2 各步骤详解

#### 7.2.1 Manifest Generator — Blueprint → manifest.json

**输入：** Design Blueprint 中的以下字段

| Blueprint 字段                | → manifest 字段                 | 生成规则                                                             |
| ----------------------------- | ------------------------------- | -------------------------------------------------------------------- |
| `brandExpression.logo`        | `assets.images[]`               | Logo 图片 → base64 data URL，key 为 `"logo"`                         |
| `brandExpression.colorUsage`  | `tokens.color`                  | 按品牌色使用策略填充 14 色                                           |
| `readingExperience`           | `layout.density`, `layout.tone` | readingExperience.density → layout.density；关键词组合 → layout.tone |
| `componentExpression.mapping` | `components{}`                  | 每个映射的组件生成 variant + variantCss                              |
| `layoutStrategy`              | `layout.preferredComponents`    | 策略中的组件列表 + reason                                            |

**manifest 生成模板：**

```json
{
  "sdkVersion": "1.0.0",
  "meta": {
    "id": "{slug}",
    "name": "{主题名称}",
    "description": "{一句话描述：定位摘要 + 关键词}",
    "keywords": ["关键词1", "关键词2", "关键词3", "关键词4", "行业词"],
    "version": "1.0.0"
  },
  "tokens": {
    "color": {
      /* 14 色，从品牌色派生 */
    },
    "typography": {
      /* 字体族 + 字号 + h1-h4 */
    },
    "spacing": { "pagePadding": 20, "paragraphMargin": 16 },
    "border": { "radius": 8 },
    "shadow": { "enabled": true, "value": "0 4px 12px rgba(0,0,0,0.08)" }
  },
  "components": {
    "hero-banner": {
      "enabled": true,
      "variant": "brand-hero-gradient",
      "variantCss": ".wemd-hero-banner[data-variant=\"brand-hero-gradient\"] { ... }"
    }
  },
  "layout": {
    "preferredComponents": [
      { "name": "hero-banner", "reason": "开篇品牌展示" }
    ],
    "density": "medium",
    "tone": ["rational", "modern"]
  },
  "assets": {
    "images": [{ "key": "logo", "src": "data:image/svg+xml;base64,..." }]
  }
}
```

#### 7.2.2 CSS Generator — variantCss 生成规则

**输入：** 组件表达映射表中的每个 `expression` 字段

**生成规则：**

| 映射表字段                                        | CSS 生成方式                                                                         |
| ------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `expression: "背景渐变（primary → primaryDark）"` | `background: linear-gradient(135deg, var(--wemd-primary), var(--wemd-primary-dark))` |
| `expression: "左侧边框 primary 4px"`              | `border-left: 4px solid var(--wemd-primary)`                                         |
| `expression: "品牌色填充"`                        | `fill: var(--wemd-primary)` 或 `background: var(--wemd-primary)`                     |
| `expression: "半透明，textSoft 色"`               | `color: var(--wemd-text-soft); opacity: 0.8`                                         |

**CSS 变量替换规则：**

- 品牌色名称 → `var(--wemd-primary)` / `var(--wemd-secondary)` 等
- 圆角数值 → `var(--wemd-border-radius)`
- 间距数值 → `var(--wemd-page-padding)` / `var(--wemd-paragraph-margin)`
- 阴影 → `var(--wemd-shadow)`
- Logo/装饰 → `var(--wemd-asset-{key})`

**选择器格式（强制）：**

- `.wemd-<组件名>[data-variant="<变体名>"] { ... }`

#### 7.2.3 Base64 内联规则

| 场景                                      | 推荐方式                          | 示例                                                           |
| ----------------------------------------- | --------------------------------- | -------------------------------------------------------------- |
| 组件专属小装饰 SVG（< 5KB，仅单个组件用） | **A. 直接内联到 variantCss**      | `background: url("data:image/svg+xml;utf8,<svg>...</svg>")`    |
| 跨组件复用资源（品牌 Logo、通用装饰）     | **B. manifest.assets + data URL** | `{ key: "logo", src: "data:... " }` → `var(--wemd-asset-logo)` |
| 资源较多或有 PNG/JPG                      | **C. manifest.assets + zip 文件** | `{ key: "bg", src: "assets/images/bg.png" }` + zip 内文件      |

**大小限制：**

- 单个 base64 data URL ≤ 150KB
- 建议小装饰用方式 A，Logo 用方式 B，大图用方式 C

#### 7.2.4 Validator — 输出前自检

在打包前，AI 必须逐项检查以下内容（完整清单见 `prompts/self-check.md`）：

**必检项：**

1. ✅ manifest 顶层字段完整（sdkVersion/meta/tokens/components/layout）
2. ✅ tokens.color 14 色全部存在，对比度满足 WCAG AA
3. ✅ typography h1-h4 各 5 字段完整，字号严格递减
4. ✅ 组件名全部来自 LEGAL_COMPONENTS
5. ✅ variantCss 选择器格式正确（`.wemd-xxx[data-variant="yyy"]`）
6. ✅ variantCss 无禁止项（伪元素、结构伪类、外链、动画、fixed 等）
7. ✅ CSS 变量引用正确（`--wemd-xxx` 格式，无 `--wemd-color-xxx` 等错误）
8. ✅ assets.images 的 key 和 src 有效
9. ✅ 资源引用使用 `var(--wemd-asset-xxx)` 或 data URL，无直接 `url(assets/...)`

**不通过则回退：**

- 结构问题 → 回退到 Manifest Generator 修正
- CSS 问题 → 回退到 CSS Generator 修正
- 约束违反 → 回退到 Constraint Layer 重新检查

#### 7.2.5 Packager — 打包输出

**打包规则：**

1. 根目录必须有 `manifest.json`
2. `brand.md`（如有）与 manifest.json 同级
3. 资源文件放在 `assets/images/` 下（仅方式 C 需要）
4. 禁止包含 `__MACOSX` / `.DS_Store` 等垃圾文件
5. 压缩格式：ZIP，扩展名 `.wemd-theme`

**输出结构：**

```
{slug}.wemd-theme/
├── manifest.json          # 必填
├── brand.md               # 可选（仅 Brand Profile）
└── assets/
    └── images/            # 可选（仅方式 C 的资源）
        └── logo.svg
```

---

### 7.3 Compiler 与各层的交互

```
Logic Layer → Design Blueprint (策略)
     │
     ▼
Constraint Layer → 检查合规 → 通过
     │
     ▼
Application Layer → 实现方案选择 + 素材调用
     │
     ▼
┌─────────────────────────────────────────────────────────┐
│  Compiler Layer                                          │
│                                                          │
│  Manifest Generator: Blueprint 字段 → manifest.json      │
│  CSS Generator: 组件映射 → variantCss + CSS 变量替换     │
│  Validator: 自检清单 → 通过/回退                           │
│  Packager: manifest.json + CSS + assets → .wemd-theme    │
│                                                          │
└─────────────────────────────────────────────────────────┘
     │
     ▼
Feedback Layer → 设计质量评估 → 通过 → 交付
     │
     └── 不通过 → 回退到 Logic/Application
```
