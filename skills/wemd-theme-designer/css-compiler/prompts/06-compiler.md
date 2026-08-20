# CSS 生成规则（Stage 3b 端到端生成 · CSS 部分）

> 本文件是 **CSS 生成规则参考**（被 `prompts/03b-generate.md` 引用）。端到端生成模式下 AI 直接产出 `themes/{theme-name}/css/{theme-name}.css`，本文件的规则决定 CSS 怎么写。

## 职责

产出可直接在 WeMD 主程序中使用的 CSS 主题文件。

**核心任务**：

1. 从主题 token / 视觉稿推导 CSS 变量系统（`#wemd { --wemd-* }`）
2. 生成基础样式（字体、颜色、间距）
3. 生成每个焦点组件的完整样式
4. 生成克制继承的 Content 组件样式
5. 生成最小化的 Utility 组件样式
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

### 皮与骨的契约（填满义务 — 硬规则）

骨架（Stage 4.5）定"**哪里是视觉核心**"，本阶段（皮）定"**这个核心长什么样**"。骨架定"填哪里"，CSS 用**同一套品牌语言**填满骨架的每个结构单元。两者一对一强绑定，嵌套而非对立——CSS 的全局核心不脱离骨架另立一套：主题统一感来自"用同一套语言去填所有骨架"，组件差异性来自骨架选了不同焦点。

```text
1. 对每个在 `templates/*.html` 中有骨架的组件，本篇 CSS 必须完整覆盖其每个结构单元：
   slot 区、group、decoration（top-bar / corner 等）、强调、align。骨架宣告了这些，CSS 就有义务填满，不可落空。
2. 骨架宣告而 CSS 未覆盖 = 该区域是空壳（有骨无肉），属残缺交付。编译后自检时逐组件核对骨架区域都写到了对应规则。
3. 填充方式统一用主题全局品牌语言（格纸纹理、主题强调色、主题字体），不凭空为某个组件发明一套脱离全局的独立视觉。
```

编译前先读 `templates/*.html`，确认每个焦点组件的骨架宣告了哪些结构单元，再逐一落 CSS。

## 输入

| 文件                                        | 来源                                                        |
| ------------------------------------------- | ----------------------------------------------------------- |
| `themes/{theme-name}/preview/vision.html`   | 已确认的视觉稿（气质锚点，决定配色/排版/装饰方向）          |
| `themes/{theme-name}/templates/*.html`      | 自由骨架模板（宣告了每个焦点组件的结构单元）                |
| `themes/{theme-name}/states/concept_state.json` | 选中母题（装饰来源）                                    |
| `registry/components.json`                  | 组件注册表                                                  |
| 主程序提供的标准选择器注册表                | WeMD 标准选择器映射（由主程序维护，skill 不复制其内部实现） |

## 微信兼容：禁止 + 替代策略（核心约束）

微信公众号内置浏览器只支持受限的 CSS 子集。**遇到微信不支持的表达时，你必须提供等价的微信兼容替代，而不是简单删除导致装饰丢失。**

### 核心原则

1. **先理解意图，再找替代** — 某个装饰（如 `::before` 的渐变、动画的强调）想表达什么视觉意图？读 `components.focal[xxx].design.direction` 找到意图，再用微信支持的 CSS 表达同一意图。
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
/* ❌ 不兼容：结构伪类定位标题 */
#wemd .wemd-quote-card .wemd-component-body > p:first-child {
  font-weight: 700;
}

/* ✅ 兼容替代：具名 slot class */
#wemd .wemd-quote-card .wemd-qc-quote {
  font-weight: 700;
}
```

```css
/* ❌ 不兼容：多栏宽幅 */
#wemd .wemd-steps {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
}

/* ✅ 兼容替代：单栏流式，内容上下排布 */
#wemd .wemd-steps .wemd-component-body > p {
  display: block;
}
```

## 覆盖共享组件前：先查「共享伪元素装饰清单」（硬约束）

**共享组件样式（主程序内置）允许用 `::before/::after` 做装饰**（这是既有机制：预览走 CSS 级联，导出由物化器转真实元素）。主题皮肤**不能**自己写 `::before/::after` 添加装饰——但覆盖这些组件时，如果要用 `border`/背景表达同类型装饰，**必须中和共享伪元素**（`content: none`），否则预览/导出出现双条。

### 共享伪元素装饰清单（覆盖这些组件时必须对照）

| 组件 | 共享伪元素装饰 | 主题皮肤的处理 |
|---|---|---|
| `callout-pro` | `::before` 左竖条 + type 图标（p:first-child::before）+ 列表圆点 | 想用 border-left 画竖条 → 中和 `#wemd .wemd-callout-pro::before { content: none }`；type 图标/列表圆点保留共享 |
| `divider` | `.wemd-component-body::before/::after` 左右横线（含 `:empty` 变体） | 想用上下双线/其它 → 中和 `#wemd .wemd-divider .wemd-component-body::before, #wemd .wemd-divider .wemd-component-body::after { content: none }` |
| `pullquote` | **根元素 `border-left: 5px`（非伪元素）** + 引号字形（blockquote 首段 ::before） | 想在 body 画竖条 → 覆盖根元素 `#wemd .wemd-pullquote { border-left: none; background: transparent; border-radius: 0; padding: 0 }`，去掉共享根竖条（否则根 + body 双条）。原生 `>` 引用也自动识别为 pullquote 组件，同样受此约束 |
| `steps` | `li::before` 序号圆点 | 想自绘序号 → 中和 `#wemd .wemd-steps .wemd-component-body li::before` |
| `faq` | `[data-title] .wemd-component-body::before` 标题标记 | 想自绘 → 中和对应 ::before |
| `timeline` | `.wemd-tl-dot` 已做**尺寸无关居中**（`left:-21px` + `translateX(-50%)`，圆心自动落在竖线中心） | 只改 `width/height/color` 即可，**不要自己写 `left`**（会破坏居中）；自设绝对定位布局时须加 `transform: none` |

> **尺寸 / 定位耦合（本类问题的总根源）**：共享组件里某些子元素的**定位值是与尺寸绑定的**（如 timeline 圆点旧版 `left:-27px` 只对 12px 成立）。覆盖这些子元素时，改了尺寸必须同步重算定位，否则装饰错位。**优先依赖共享的尺寸无关居中**（transform 居中），不自己写死 left。
>
> **更多已知共享组件样式（覆盖时须「清」或「补全路径」）**：
> - `styled-table`：共享皮肤**已改浅路径** `.wemd-styled-table th/td`（源头避免特异性脚坑）；主题写同路径或深路径 `.wemd-styled-table .wemd-sbt-table table th/td` 都能覆盖
> - `section-title`：共享是**卡片**（bg + 左边条 + 圆角 + padding），想做成干净下划线标题须清 `background: transparent; border-left: none; border-radius: 0`
> - `divider`：markdown `---` 会在 body 内生成 `<hr>`，**共享已 `hr { display: none }`**（源头避免三线），主题无需处理
> - `magazine-cover .wemd-mc-divider`：共享是 4px 红条（width/height/background），用作文字分隔须清 `width: auto; height: auto; background: none`
> - `divider-fancy .wemd-df-label`：共享 `width:100%`（线嵌 label 内），自定义骨架把线放 label 两侧时须 `width: auto`

> **原则**：主题皮肤覆盖某组件时，先确认「共享装饰 vs 我要表达的装饰」是否同一视觉对象。同一对象 → 用其中一种（共享或自绘），不要叠两种；不覆盖的组件保持默认，共享装饰自然生效。
>
> **中和是"清除"不是"添加"**：`content: none` 清除共享伪元素，不违反"主题不写 ::before"规则（clear-guide / academic-paper / 复古报纸均如此）。
>
> **中和规则的交付链路（打包器自动处理，AI 无需关心落点）**：AI 在主题 CSS 里写 `#wemd .wemd-xxx::before { content: none }`（原选择器、原样书写即可）。pack 打包时：
> - 该中和规则**保留**在 `styles/components.css`（主程序注入顺序最末 → 预览级联胜出 + 物化器取最后匹配跳过 → 无双重装饰）；
> - 从 `manifest.components[*].variantCss` **剥离**（避免 `normalizeVariantCss` 短路、也避免转 `[data-variant]` 后物化器匹配不到）；
> - 主程序校验器/导入器已「注释感知 + 中和感知」，纯 `content: none` 中和规则不再被误判为禁用伪元素。

## 编译规则

### 1. CSS 变量系统

从视觉稿推导 CSS 变量：

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

从预览 CSS 到 WeMD 标准选择器的映射规则。**映射依据：以主程序 Slot 契约（`slotDefs.ts` 的 `abbr` + slot 定义）和 Skeleton Compiler（`scripts/compile-skeleton.cjs`）产出的骨架模板为唯一基准，禁止凭记忆臆测 DOM 结构。**

> **覆盖共享样式 = 同路径 · 同特异性（playbook 硬约束）**：主题皮肤要覆盖主程序共享组件样式时，选择器必须**写完整路径**，与共享规则同路径、同特异性（如共享写 `#wemd .wemd-magazine-cover .wemd-mc-title`，皮肤也必须写 `#wemd .wemd-magazine-cover .wemd-mc-title`）。写短了（如只写 `#wemd .wemd-mc-title`）特异性更低，内联导出按特异性排序时会被共享样式覆盖，**皮肤不生效**。排查信号：改了皮肤但导出样式没变化 → 先查选择器是否少写了一层容器 class。

选择器分三类：

- **组件根**：`#wemd .wemd-{id}`（`id` 即组件名，如 `.wemd-hero-banner`），任何组件都先落到根。
- **命名 slot**：骨架为非 body slot 生成 `<section class="wemd-{abbr}-{slot}">`，CSS 直接定位该 class（如 `.wemd-hb-title`）。list 型 slot 再细分 `.wemd-{abbr}-{slot}-item` 与字段 `.wemd-{abbr}-{slot}-{field}`。
- **body slot**：`body` 槽生成 `<div class="wemd-component-body">`，内部是 markdown-it 渲染的原生标签（`<p>/<ul>/<li>/<strong>/<pre>/<table>`），CSS 用 `.wemd-component-body > p` 等定位。

> ⚠️ 已废弃 `.wemd-child-N` 序号 class。骨架语义化后每个 slot 都有确定的 `wemd-{abbr}-{slot}` class，不再依赖序号定位。仅 body slot 组件保留 `.wemd-component-body`（其内部原生标签结构来自主程序 DOM 现状，可如实翻译）。**禁止为 skill 自创的结构写 `> p:first-child` / `> p:nth-child(N)` 结构伪类**（微信兼容会剥离），一律用具名 class。

| 预览 CSS 选择器                   | WeMD 标准选择器（真源：slotDefs 的 abbr + slot）                                                 |
| --------------------------------- | ------------------------------------------------------------------------------------------------ |
| `.magazine-cover`                 | `#wemd .wemd-magazine-cover`                                                                     |
| `.magazine-cover .cover-title`    | `#wemd .wemd-magazine-cover .wemd-mc-title`                                                      |
| `.magazine-cover .cover-subtitle` | `#wemd .wemd-magazine-cover .wemd-mc-subtitle`                                                   |
| `.magazine-cover .cover-meta`     | `#wemd .wemd-magazine-cover .wemd-mc-desc`                                                       |
| `.hero-banner`                    | `#wemd .wemd-hero-banner`                                                                        |
| `.hero-banner .hero-heading`      | `#wemd .wemd-hero-banner .wemd-hb-title`                                                         |
| `.hero-banner .hero-description`  | `#wemd .wemd-hero-banner .wemd-hb-subtitle`                                                      |
| `.hero-banner .hero-bg`           | `#wemd .wemd-hero-banner .wemd-hb-image`                                                         |
| `.stats-block`                    | `#wemd .wemd-stats-block`                                                                        |
| `.stats-block .stat-number`       | `#wemd .wemd-stats-block .wemd-sb-items-value`                                                   |
| `.stats-block .stat-label`        | `#wemd .wemd-stats-block .wemd-sb-items-label`                                                   |
| `.full-quote`                     | `#wemd .wemd-full-quote`                                                                         |
| `.full-quote blockquote`          | `#wemd .wemd-full-quote .wemd-fq-text`                                                           |
| `.quote-card`                     | `#wemd .wemd-quote-card`                                                                         |
| `.quote-card .qc-quote`           | `#wemd .wemd-quote-card .wemd-qc-quote`                                                          |
| `.quote-card .qc-author`          | `#wemd .wemd-quote-card .wemd-qc-author`                                                         |
| `.code-frame`                     | `#wemd .wemd-code-frame`                                                                         |
| `.code-frame pre`                 | `#wemd .wemd-code-frame .wemd-cf-code`                                                           |
| `.section-title`                  | `#wemd .wemd-section-title`                                                                      |
| `.section-title` 标题文字         | `#wemd .wemd-section-title .wemd-component-body`                                                 |
| `.numbered-heading` 编号/标题     | `#wemd .wemd-numbered-heading .wemd-component-body`                                              |
| `.text-card`                      | `#wemd .wemd-text-card`                                                                          |
| `.text-card` 段落                 | `#wemd .wemd-text-card .wemd-component-body`                                                     |
| `.image-text-row` 图/文           | `#wemd .wemd-image-text-row .wemd-component-body`                                                |
| `.image-card`                     | `#wemd .wemd-image-card`                                                                         |
| `.image-card .ic-placeholder`     | `#wemd .wemd-image-card .wemd-ic-image`                                                          |
| `.image-card .ic-caption`         | `#wemd .wemd-image-card .wemd-ic-caption`                                                        |
| `.pullquote`                      | `#wemd .wemd-pullquote`                                                                          |
| `.pullquote` 引文                 | `#wemd .wemd-pullquote .wemd-component-body`                                                     |
| `.code-block`                     | `#wemd .wemd-code-block`                                                                         |
| `.code-block` 代码                | `#wemd .wemd-code-block .wemd-component-body`                                                    |
| `.brand-sign`                     | `#wemd .wemd-brand-sign`                                                                         |
| `.brand-sign .bs-brand`           | `#wemd .wemd-brand-sign .wemd-bs-brandName`                                                      |
| `.brand-sign .bs-tagline`         | `#wemd .wemd-brand-sign .wemd-bs-tagline`                                                        |
| `.brand-sign .bs-slogan`          | `#wemd .wemd-brand-sign .wemd-bs-slogan`                                                         |
| `.section-divider` 编号           | `#wemd .wemd-section-divider .wemd-sd-part`                                                      |
| `.section-divider` 标题           | `#wemd .wemd-section-divider .wemd-sd-title`                                                     |
| `.product-card` 图片              | `#wemd .wemd-product-card .wemd-pc-image`                                                        |
| `.product-card` 标题              | `#wemd .wemd-product-card .wemd-pc-title`                                                        |
| `.testimonial-card` 引文          | `#wemd .wemd-testimonial-card .wemd-tcq-quote`（⚠️ 引文正文在 quote，`.wemd-tcq-source` 为来源） |
| `.testimonial-card` 人名          | `#wemd .wemd-testimonial-card .wemd-tcq-name`                                                    |
| `.testimonial-card` 身份          | `#wemd .wemd-testimonial-card .wemd-tcq-title`                                                   |
| `.testimonial-card` 信息区        | `#wemd .wemd-testimonial-card .wemd-tcq-company`                                                 |
| `.accordion` 各项                 | `#wemd .wemd-accordion .wemd-component-body`（strong 段为标题、其余段为内容）                    |
| `.cta-card` 标题                  | `#wemd .wemd-cta-card .wemd-cta-title`                                                           |
| `.cta-card` 副文                  | `#wemd .wemd-cta-card .wemd-cta-body`                                                            |
| `.cta-card` 行动                  | `#wemd .wemd-cta-card .wemd-cta-action`                                                          |
| `.styled-table` 表容器            | `#wemd .wemd-styled-table .wemd-sbt-table`                                                       |
| `.divider`                        | `#wemd .wemd-divider`                                                                            |
| `.divider-fancy`                  | `#wemd .wemd-divider-fancy`                                                                      |
| `.divider-fancy` 文字             | `#wemd .wemd-divider-fancy .wemd-df-label`                                                       |
| `.copyright-notice`               | `#wemd .wemd-copyright-notice`                                                                   |
| `.end-card` 标题                  | `#wemd .wemd-end-card .wemd-ec-title`                                                            |
| `.end-card` 副文                  | `#wemd .wemd-end-card .wemd-ec-subtitle`                                                         |

> 骨架 class 由自由模板 + 主程序 `slotDefs.ts` 的 `abbr` 推导；翻译任何组件前先查该组件的 `abbr` 与 slot 定义。

### 3. 三分类样式差异

```
focal（焦点组件）: 边到边突破留白 · 极端对比 · 动态装饰 · 静态动画残留
Content:      标准容器 · 克制装饰 · 可读性优先 · 无动画
Utility:      极简样式 · 低可见度 · 无装饰 · 无动画
```

> **画布约束**：最终载体是微信公众号，内容区约 343px 的单列窄流。所有组件**移动优先**，只生成一种宽度布局，不产生 `@media` 查询。

### 4. 输出结构

输出包含以下部分（按顺序）：

1. **CSS 变量系统** — `#wemd` 下的 CSS 自定义属性
2. **基础重置** — 基础样式重置（`#wemd *` 选择器）
3. **焦点组件样式** — 按焦点（focal）组件顺序输出
4. **Content 组件样式** — 按 Content 档位顺序输出
5. **Utility 组件样式** — 按 Utility 档位顺序输出
6. **Stack 规则** — 组件间距统一分配（`#wemd > [class]`）

## 输出

| 文件                                                    | 说明                        |
| ------------------------------------------------------- | --------------------------- |
| `themes/{theme-name}/css/{theme-name}.css`              | 生成后的 WeMD 标准 CSS 文件 |

## 生成流程（AI 直接产出 CSS 的参考步骤）

### Step 1: Token 推导

从已确认的视觉稿（`preview/vision.html`）与选中母题推导 CSS 变量。**视觉稿里 `:root` 的 CSS 变量定义（`--ink/--paper/--accent` 等）是主要来源**；具体色值由 AI 结合视觉稿气质推导。

```text
视觉稿颜色/对比 → 色彩性格（推导具体色板）
视觉稿排版气质   → 字体气质（推导字重/字号）
视觉稿密度/节奏 → 布局密度（推导间距档位）
```

### Step 2: Base Style

从视觉稿生成基础样式：

- `color` → 背景色、文字色
- `typography` → 字体栈、字重、字号
- `layout` → 间距、最大宽度
- `shape` → 圆角、装饰线

### Step 3: Component Style

按三分类生成组件样式：

- **焦点组件（focal）** → 深度设计，生成完整 CSS
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
   Focal Components
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
3. 是否包含所有焦点组件的样式（数量由焦点组件清单决定，动态检查）
4. 是否包含至少 3 个 Content 组件的样式
5. 是否包含至少 3 个 Utility 组件的样式
6. CSS 变量名是否使用 `--wemd-` 前缀
7. **移动窄屏检查**：是否以内容区约 343px 为画布生成单一窄屏布局（而非桌面宽屏）？是否未产生 `@media` 查询？
8. 是否存在未翻译的自由选择器（如 `.cover-title`）
9. **布局契约检查**：每个组件 wrapper 选择器（`.wemd-xxx`）是否包含 `margin-top`、`margin-bottom` 或 `margin`（非 `margin-left`/`margin-right`）。如果有，**必须删除**，间距由 Stack 规则统一管理
10. **微信替代检查**：是否出现了微信不支持的表达（伪元素、动画、结构伪类、`@media`、兄弟选择器、`position:absolute`）？若出现，是否已按"禁止 → 替代对照表"提供了微信兼容替代，并在注释里说明？（若被删除而非替代，检查是否真的没有等价表达）
11. **窄屏可承载性检查**：是否存在依赖宽幅/多栏才能成立的构图？若有，是否已收敛为单栏流式布局？
12. **容器水平内边距检查**：所有卡片/容器类组件的水平内边距是否统一引用 `var(--wemd-space-inline)`？是否存在硬编码的具体值（1.25rem/1.5rem 等）？若有，必须替换为 `var(--wemd-space-inline)`。
13. **同路径同特异性检查（playbook §1）**：皮肤覆盖共享组件样式的选择器是否写了**完整路径**（`#wemd .wemd-容器 .wemd-子元素`）？是否与共享规则同特异性？写短了会导致内联导出时皮肤被共享覆盖、不生效。
14. **配色可读性检查（playbook §2）**：逐组件核对「前景/背景是否可读、是否撞色」——深色背景元素配浅色文字（不被共享 `var()` 覆盖成同色系深色）；浅色/白色背景元素配深色文字。深底深字、浅底浅字即不可读，必须修正。
15. **无重复装饰检查**：覆盖了「共享伪元素装饰清单」里的组件时，是否中和了对应共享 `::before/::after`（`content: none`）？导出后同一装饰线/条是否只出现一条（无双竖条/双线）？
