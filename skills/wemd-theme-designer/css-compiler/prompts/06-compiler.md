# Stage 6: CSS Compiler — 编译阶段

## 职责

将 BrandVisualTheme.json 编译为可直接在 WeMD 主程序中使用的 CSS 主题文件。

**核心任务**：

1. 从 `design_tokens` 编译 CSS 变量系统（`#wemd { --wemd-* }`）
2. 从 `visual_language` 编译基础样式（字体、颜色、间距）
3. 从 `components.brand_anchor` 编译每个 Brand Anchor 组件的完整样式
4. 从 `components.content` 编译克制继承的 Content 组件样式
5. 从 `components.utility` 编译最小化的 Utility 组件样式
6. **将自定义 CSS 选择器翻译为 `#wemd .wemd-*` 标准选择器**

## 布局契约（Layout Contract）— 核心约束

AI 在生成 CSS 时，**必须严格遵守以下分层原则**：

### 先定全局，再定组件

```
第 1 层：全局布局参数
  页面宽度、整体密度、组件间距、大块间距

第 2 层：组件视觉设计
  每个组件内部长什么样（颜色、字体、padding、装饰）
```

**组件绝对不要定义"我离下一个组件多远"。间距由全局统一控制。**

### 组件可以决定的

```text
✅ 组件内部 padding
✅ 背景、边框、圆角
✅ 文字颜色、字号、行高
✅ 内部子元素的间距（如 title 和 description 之间的 gap）
✅ 子元素的 flex/grid 布局
✅ 装饰元素（渐变、阴影）
```

### 组件不能决定的

```text
❌ margin-top（组件外部上间距）
❌ margin-bottom（组件外部下间距）
❌ margin（简写，会影响上下间距）
```

唯一例外：`margin-left` / `margin-right` 可以用于水平排列的场景。

### 间距由 Stack 系统统一分配

```css
/* ❌ 错误：组件自己定义外部间距 */
#wemd .wemd-magazine-cover {
  margin-bottom: 2rem; /* ❌ 禁止！间距应由 Stack 控制 */
  margin-top: 1rem; /* ❌ 禁止！ */
  padding: 2rem; /* ✅ 内部间距允许 */
  background: linear-gradient(...); /* ✅ 视觉样式允许 */
}

/* ✅ 正确：组件只管理内部，不碰外部间距 */
#wemd .wemd-magazine-cover {
  padding: 2rem; /* ✅ 内部间距 */
  background: linear-gradient(...); /* ✅ 视觉样式 */
  /* 没有 margin-top, margin-bottom, margin */
}

/* Stack 规则在编译时自动添加最后，所有组件统一使用 */
#wemd > [class] {
  margin-top: 0;
  margin-bottom: var(--wemd-space-component, 1.5rem);
}
```

**重要**：如果某个组件在视觉上需要更大的间距（如全屏 Banner 后的分区标题），仍然**不能**在组件上写 `margin-bottom`。正确做法是：

- 在组件内使用 `padding-top` / `padding-bottom` 增加视觉呼吸空间
- 或使用 `#wemd > .wemd-xxx + .wemd-yyy` 选择器在编译时特殊处理（极少情况）

## 输入

| 文件                           | 来源                                                        |
| ------------------------------ | ----------------------------------------------------------- |
| `output/BrandVisualTheme.json` | Assembler 合并输出                                          |
| `registry/components.json`     | 组件注册表                                                  |
| 主程序提供的标准选择器注册表   | WeMD 标准选择器映射（由主程序维护，skill 不复制其内部实现） |

## 微信兼容：禁止 + 替代策略（核心约束）

微信公众号内置浏览器只支持受限的 CSS 子集。**遇到微信不支持的表达时，你必须提供等价的微信兼容替代，而不是简单删除导致装饰丢失。**

### 核心原则

1. **先理解意图，再找替代** — 某个装饰（如 `::before` 的渐变、动画的强调）想表达什么视觉意图？读 `components.brand_anchor[xxx].design.direction` 找到意图，再用微信支持的 CSS 表达同一意图。
2. **替代优先于删除** — 只有当某个效果**完全没有**微信兼容的等价表达时，才允许删除。
3. **每个被删除或替代的装饰，都要在输出注释里说明原因**，确保可追溯。

### 禁止 → 替代对照表

| ❌ 禁止（微信不支持）                                  | ✅ 微信兼容替代                                           | 说明                                                                                                                                                                                                         |
| ------------------------------------------------------ | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `::before` / `::after` 伪元素装饰                      | 合并到父元素 `background`（多图层渐变），或改用真实子元素 | 伪元素静默丢失，效果合并进父元素保留                                                                                                                                                                         |
| 动画 `@keyframes` / `animation`                        | 删除动画，保留静态最终态样式                              | 无动画，但保留"动画结束后的样子"                                                                                                                                                                             |
| `:hover` 伪类                                          | 删除，只保留静态样式                                      | 移动端无 hover                                                                                                                                                                                               |
| 结构伪类 `:first-child` / `:last-child` / `:nth-child` | 改用命名 class（如 `.wemd-hb-title`）                     | 结构伪类静默丢失，必须具名。**注意**：仅针对 skill 自创的装饰/结构；普通组件（hasBody:true）body 内的结构伪类选择器（如 `> p:first-child`）来自主程序注册表，是主程序 DOM 现状，skill 如实翻译，不在这里禁止 |
| `@media` 媒体查询                                      | 以移动端窄屏默认值直接内联，移除媒体查询块                | 微信非响应式，只有一种宽度                                                                                                                                                                                   |
| `+` / `~` 兄弟选择器                                   | 编译为 Stack 规则或具名 class                             | 兄弟选择器静默丢失                                                                                                                                                                                           |
| `position: absolute` 装饰层                            | 并入常规流布局或父元素背景                                | 微信不支持定位，装饰层失效                                                                                                                                                                                   |
| 多栏 grid / 宽幅构图                                   | 收敛为单栏流式布局                                        | 公众号内容区约 343px 单列                                                                                                                                                                                    |
| 自定义 WebFont                                         | 替换为系统字体栈                                          | 微信只支持系统字体                                                                                                                                                                                           |

### 替代做法的示例

```css
/* ❌ 不兼容：伪元素装饰 */
#wemd .wemd-magazine-cover::before {
  content: "";
  background: radial-gradient(...);
}

/* ✅ 兼容替代：合并到父元素 background，保留同一视觉意图 */
#wemd .wemd-magazine-cover {
  background: radial-gradient(...), linear-gradient(...);
}
```

```css
/* ❌ 不兼容：结构伪类 */
#wemd .wemd-hero-banner .wemd-component-body > p:first-child {
  font-size: 2rem;
}

/* ✅ 兼容替代：具名 class */
#wemd .wemd-hero-banner .wemd-component-body > p.wemd-hb-title {
  font-size: 2rem;
}
```

```css
/* ❌ 不兼容：多栏宽幅 */
#wemd .wemd-stats-block {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
}

/* ✅ 兼容替代：单栏流式，数据上下排布 */
#wemd .wemd-stats-block .wemd-component-body > p {
  display: block;
}
```

## 编译规则

### 1. CSS 变量系统

从 `design_tokens` 和 `visual_language` 编译：

```css
#wemd {
  /* 颜色 tokens */
  --wemd-bg-base: #0A0E1A;
  --wemd-bg-surface: #121626;
  --wemd-accent-primary: #00E5FF;
  --wemd-accent-secondary: #B388FF;
  /* ... */

  /* 字体 tokens */
  --wemd-font-heading: 'Inter', system-ui, sans-serif;
  --wemd-font-body: 'Inter', system-ui, sans-serif;

  /* 间距 tokens — 统一使用 --wemd-space-* 命名 */
  --wemd-space-component: 1.5rem;  /* 组件之间间距（Stack 规则默认值） */
  --wemd-space-section: 3rem;      /* 大块内容之间间距 */
  --wemd-space-block: 2rem;        /* 组件内部区块间距 */
  --wemd-space-inline: 1rem;       /* 卡片容器统一水平内边距 */

  容器内边距契约：
  - 所有卡片/容器类组件（有背景、边框、圆角的 .wemd-xxx）的**水平内边距**必须统一用
    var(--wemd-space-inline)，保证左右边缘对齐。写法示例：`padding: 1.5rem var(--wemd-space-inline) 2rem;`。
  - **垂直内边距**（top/bottom）允许按组件内容高度保留差异，不强制统一。
  - 禁止硬编码水平内边距的具体 px/rem 值（如 1.25rem）；必须引用 var(--wemd-space-inline)。
}
```

### 2. 选择器翻译规则

从预览 CSS 到 WeMD 标准选择器的映射规则。**映射依据：以主程序导出的真实 HTML 为唯一基准（见 `reference/dom-structure.md`），禁止凭记忆臆测 DOM 结构。**

选择器分两类：

- **杂志级组件（无 body）**：body 内元素用具名 class（如 `.wemd-mc-title`），微信兼容。
- **普通组件（有 body）**：body 内由 markdown-it 渲染出原生标签（`<p>/<ul>/<li>/<strong>`），再由 `ThemeProcessor.addChildPositionClasses` 给直接子标签附加序号 class `.wemd-child-N`（N 从 1 递增）。**真实 DOM = 原生标签 + `.wemd-child-N` 两者共存**，CSS 用 `.wemd-child-N` 定位更稳（不是结构伪类）。

> ⚠️ 历史教训：不要写 `> p:first-child` / `> p:nth-child(N)` 这类结构伪类。主程序实际输出的是 `.wemd-child-1` / `.wemd-child-2`，结构伪类既匹配不上真实 DOM，又会被微信兼容清理剥离。翻译前必须先查 `reference/dom-structure.md` 确认该组件的真实结构。

| 预览 CSS 选择器                   | WeMD 标准选择器（真实 DOM）                                                                         |
| --------------------------------- | --------------------------------------------------------------------------------------------------- |
| `.magazine-cover`                 | `#wemd .wemd-magazine-cover`                                                                        |
| `.magazine-cover .cover-title`    | `#wemd .wemd-magazine-cover .wemd-mc-title`                                                         |
| `.magazine-cover .cover-subtitle` | `#wemd .wemd-magazine-cover .wemd-mc-subtitle`                                                      |
| `.magazine-cover .cover-meta`     | `#wemd .wemd-magazine-cover .wemd-mc-desc`                                                          |
| `.hero-banner`                    | `#wemd .wemd-hero-banner`                                                                           |
| `.hero-banner .hero-heading`      | `#wemd .wemd-hero-banner .wemd-component-body .wemd-child-1`                                        |
| `.hero-banner .hero-description`  | `#wemd .wemd-hero-banner .wemd-component-body .wemd-child-2`                                        |
| `.stats-block`                    | `#wemd .wemd-stats-block`                                                                           |
| `.stats-block .stat-number`       | `#wemd .wemd-stats-block .wemd-component-body .wemd-child-2 strong`、`.wemd-child-3 strong`         |
| `.stats-block .stat-label`        | `#wemd .wemd-stats-block .wemd-component-body .wemd-child-2`、`.wemd-child-3`                       |
| `.full-quote`                     | `#wemd .wemd-full-quote`                                                                            |
| `.full-quote blockquote`          | `#wemd .wemd-full-quote .wemd-fq-text`                                                              |
| `.quote-card`                     | `#wemd .wemd-quote-card`                                                                            |
| `.quote-card .qc-quote`           | `#wemd .wemd-quote-card .wemd-component-body .wemd-child-1`                                         |
| `.quote-card .qc-author`          | `#wemd .wemd-quote-card .wemd-component-body .wemd-child-2`                                         |
| `.code-frame`                     | `#wemd .wemd-code-frame`                                                                            |
| `.code-frame pre`                 | `#wemd .wemd-code-frame .wemd-component-body .wemd-child-1 code`                                    |
| `.section-title`                  | `#wemd .wemd-section-title`                                                                         |
| `.section-title` 标题文字         | `#wemd .wemd-section-title .wemd-component-body .wemd-child-1`                                      |
| `.numbered-heading` 编号          | `#wemd .wemd-numbered-heading .wemd-component-body .wemd-child-1`                                   |
| `.numbered-heading` 标题          | `#wemd .wemd-numbered-heading .wemd-component-body .wemd-child-2`                                   |
| `.text-card`                      | `#wemd .wemd-text-card`                                                                             |
| `.text-card` 段落                 | `#wemd .wemd-text-card .wemd-component-body .wemd-child-1`、`.wemd-child-2`                         |
| `.image-text-row` 图              | `#wemd .wemd-image-text-row .wemd-component-body .wemd-child-1`                                     |
| `.image-text-row` 文              | `#wemd .wemd-image-text-row .wemd-component-body .wemd-child-2`                                     |
| `.image-card`                     | `#wemd .wemd-image-card`                                                                            |
| `.image-card .ic-placeholder`     | `#wemd .wemd-image-card .wemd-ic-image`                                                             |
| `.image-card .ic-caption`         | `#wemd .wemd-image-card .wemd-ic-caption`                                                           |
| `.pullquote`                      | `#wemd .wemd-pullquote`                                                                             |
| `.pullquote` 引文                 | `#wemd .wemd-pullquote .wemd-component-body .wemd-child-1`                                          |
| `.code-block`                     | `#wemd .wemd-code-block`                                                                            |
| `.code-block` 代码                | `#wemd .wemd-code-block .wemd-component-body .wemd-child-1 code`                                    |
| `.brand-sign`                     | `#wemd .wemd-brand-sign`                                                                            |
| `.brand-sign .bs-icon`            | `#wemd .wemd-brand-sign .wemd-bs-logo`                                                              |
| `.brand-sign .bs-text`            | `#wemd .wemd-brand-sign .wemd-bs-brand-name`                                                        |
| `.section-divider` 编号           | `#wemd .wemd-section-divider .wemd-sd-part`                                                         |
| `.section-divider` 标题           | `#wemd .wemd-section-divider .wemd-sd-title`                                                        |
| `.product-card` 标题              | `#wemd .wemd-product-card .wemd-pc-title`                                                           |
| `.testimonial-card` 引文          | `#wemd .wemd-testimonial-card .wemd-tc-company`（⚠️ 引文正文在 company，`.wemd-tc-quote` 恒空勿用） |
| `.testimonial-card` 人名          | `#wemd .wemd-testimonial-card .wemd-tc-name`                                                        |
| `.testimonial-card` 身份          | `#wemd .wemd-testimonial-card .wemd-tc-title`                                                       |
| `.testimonial-card` 信息区        | `#wemd .wemd-testimonial-card .wemd-tc-person`                                                      |
| `.accordion` 各项                 | `#wemd .wemd-accordion .wemd-component-body .wemd-child-1` … `.wemd-child-4`（数量可变）            |
| `.cta-card` 标题                  | `#wemd .wemd-cta-card .wemd-component-body .wemd-child-1`                                           |
| `.cta-card` 副文                  | `#wemd .wemd-cta-card .wemd-component-body .wemd-child-2`                                           |
| `.styled-table` 表容器            | `#wemd .wemd-styled-table .wemd-component-body .wemd-child-1`                                       |
| `.divider`                        | `#wemd .wemd-divider`                                                                               |
| `.divider-fancy`                  | `#wemd .wemd-divider-fancy`                                                                         |
| `.copyright-notice`               | `#wemd .wemd-copyright-notice`                                                                      |
| `.end-card` 标题                  | `#wemd .wemd-end-card .wemd-ec-title`                                                               |
| `.end-card` 副文                  | `#wemd .wemd-end-card .wemd-ec-subtitle`                                                            |

> 完整结构与陷阱清单见 `reference/dom-structure.md`。翻译任何组件前先查阅该表。

### 3. 三分类样式差异

```
Brand Anchor: 边到边突破留白 · 极端对比 · 动态装饰 · 静态动画残留
Content:      标准容器 · 克制装饰 · 可读性优先 · 无动画
Utility:      极简样式 · 低可见度 · 无装饰 · 无动画
```

> **画布约束**：最终载体是微信公众号，内容区约 343px 的单列窄流。所有组件**移动优先**，只生成一种宽度布局，不产生 `@media` 查询。

### 4. 输出结构

输出包含以下部分（按顺序）：

1. **CSS 变量系统** — `#wemd` 下的 CSS 自定义属性
2. **基础重置** — 基础样式重置（`#wemd *` 选择器）
3. **Brand Anchor 组件样式** — 按 `component_strategy.brand_anchor` 顺序输出
4. **Content 组件样式** — 按 `component_strategy.content` 顺序输出
5. **Utility 组件样式** — 按 `component_strategy.utility` 顺序输出
6. **Stack 规则** — 组件间距统一分配（`#wemd > [class]`）

## 输出

| 文件                                       | 说明                        |
| ------------------------------------------ | --------------------------- |
| `output/css/{theme-name}.css`              | 编译后的 WeMD 标准 CSS 文件 |
| `output/preview/{theme-name}-preview.html` | 同上但保持预览 HTML 格式    |

## 编译流程

### Step 1: Token Resolver

读取 `design_tokens` 和 `visual_language`，生成 CSS 变量：

```text
design_tokens.emphasis.minimal → --wemd-emphasis-minimal
design_tokens.border_radius.card → --wemd-radius-card
visual_language.color.palette.accent.primary → --wemd-accent-primary
visual_language.typography.typefaces.heading → --wemd-font-heading
```

### Step 2: Base Style

从 `visual_language` 生成基础样式：

- `color` → 背景色、文字色
- `typography` → 字体栈、字重、字号
- `layout` → 间距、最大宽度
- `shape` → 圆角、装饰线

### Step 3: Component Style

按三分类编译组件样式：

- **Brand Anchor** → 从 `components.brand_anchor` 提取设计方向，生成完整 CSS
- **Content** → 继承基础样式，克制装饰
- **Utility** → 最小化样式

### Step 4: Mobile-First 窄屏适配

构建**移动优先**的窄屏单栏布局：

- 所有组件以内容区约 343px 为画布设计，只生成一种宽度布局
- 不产生 `@media` 查询（微信非响应式）
- 多栏/横向排布在此处收敛为单栏流式

## 输出格式

```css
/* ============================================================
   Theme: {theme-name}
   Generated: {timestamp}
   ============================================================ */

/* ============================================================
   CSS Variables (from design_tokens)
   ============================================================ */
#wemd {
  /* 颜色 */
  --wemd-bg-base: ...;
  /* ... */
}

/* ============================================================
   Brand Anchor Components
   ============================================================ */

/* Magazine Cover */
#wemd .wemd-magazine-cover { ... }
#wemd .wemd-magazine-cover .wemd-mc-title { ... }

/* ============================================================
   Content Components
   ============================================================ */

/* Section Title */
#wemd .wemd-section-title { ... }

/* ============================================================
   Utility Components
   ============================================================ */

/* Brand Sign */
#wemd .wemd-brand-sign { ... }

/* ============================================================
   Stack: 组件间距统一由容器控制
   组件不管理自己的外部间距，所有 margin 由 Stack 统一分配。
   ============================================================ */
#wemd > [class] {
  margin-top: 0;
  margin-bottom: var(--wemd-space-component, 1.5rem);
}
```

## 质量检查

编译完成后，检查以下内容：

1. 所有选择器是否以 `#wemd` 开头
2. 所有 `wemd-*` 类名是否与"主程序提供的标准选择器注册表"中定义的一致
3. 是否包含所有 6 个 Brand Anchor 组件的样式
4. 是否包含至少 3 个 Content 组件的样式
5. 是否包含至少 3 个 Utility 组件的样式
6. CSS 变量名是否使用 `--wemd-` 前缀
7. **移动窄屏检查**：是否以内容区约 343px 为画布生成单一窄屏布局（而非桌面宽屏）？是否未产生 `@media` 查询？
8. 是否存在未翻译的自由选择器（如 `.cover-title`）
9. **布局契约检查**：每个组件 wrapper 选择器（`.wemd-xxx`）是否包含 `margin-top`、`margin-bottom` 或 `margin`（非 `margin-left`/`margin-right`）。如果有，**必须删除**，间距由 Stack 规则统一管理
10. **微信替代检查**：是否出现了微信不支持的表达（伪元素、动画、结构伪类、`@media`、兄弟选择器、`position:absolute`）？若出现，是否已按"禁止 → 替代对照表"提供了微信兼容替代，并在注释里说明？（若被删除而非替代，检查是否真的没有等价表达）
11. **窄屏可承载性检查**：是否存在依赖宽幅/多栏才能成立的构图？若有，是否已收敛为单栏流式布局？
12. **容器水平内边距检查**：所有卡片/容器类组件的水平内边距是否统一引用 `var(--wemd-space-inline)`？是否存在硬编码的具体值（1.25rem/1.5rem 等）？若有，必须替换为 `var(--wemd-space-inline)`。
