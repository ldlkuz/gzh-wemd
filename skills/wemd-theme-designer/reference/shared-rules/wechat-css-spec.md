# 微信页面 CSS 规范（WeChat CSS Spec）

> 状态：**活文档** · 在写主题 / 修组件的过程中会不断增量补全。
> 定位：这是**微信公众号页面怎么写 CSS**的硬性约定（不是 AI 提示词）。
> 适用范围：主题产物 `styles/components.css`（主程序打包后注入 `#wemd` 容器内）。
> 配套：`wechat-css-rules.json`（可机检的硬规则）+ `shorthand-families.json`（简写属性展开）。
> 三条铁律：
> 1. **微信能剥的东西坚决不依赖**（伪元素 / 结构伪类 / fixed / sticky / keyframes / animation）。
> 2. **装饰必须物化**成真实子元素，不能靠 `::before/::after` 画。
> 3. **主题全局控制的归全局，组件级的才是组件级**——凡能被"统一载体"表达的样式，不许在每个组件里重复写。

---

## 1. 页面结构（产出长什么样）

最终注入的是一段**纯 CSS 规则文本**（无 `<style>`/`<script>` 标签），作用域统一挂在 `#wemd` 容器内。

```
#wemd { …全局 token（CSS 变量）… }           ← 全局控制层 · 一切的源头
#wemd h2 { …原生元素皮肤… }                 ← 全局控制层 · 基础层原生皮肤
#wemd .wemd-component { …统一载体…… }       ← 全局控制层 · 组件通用容器
#wemd .wemd-section-title { … }            ← 组件级 · 该组件独有视觉
#wemd .wemd-qc-main { … }                  ← 组件级 · 该组件分槽容器
```

> 顺序即权重关系：全局层在最前（最低优先级），组件级在后（覆盖/强化全局）。同一属性只写一次；组件级只写"该组件特有的"部分。

---

## 2. 主题全局控制层（theme-global）——**优先写这里**

> 判据：**这段样式是否被多个组件 / 多个基础结构共用？** 是 → 放全局，由加载方一次注入；否 → 留组件级。
> 目的：减少重复、保证整篇视觉统一、避免组件各自为政导致"稀烂"。

### 2.1 全局 Token（CSS 变量）——必须建专属命名空间

全部颜色 / 字体 / 间距 / 圆角 / 阴影，先定义为 `--wemd-*` 变量，放在 `#wemd {}` 根。

| Token 族 | 约定键 | 示例 |
| --- | --- | --- |
| 背景 | `--wemd-bg-base / bg-surface / bg-card / bg-soft` | 页面底 / 卡片底 / 高亮 / 浅底 |
| 主色 | `--wemd-accent-primary / secondary / tertiary` | 主色 / 辅色 / 强分隔 |
| 文字 | `--wemd-text-strong / normal / soft` | 标题 / 正文 / 弱信息 |
| 边框 | `--wemd-border / border-strong` | 细线 / 强调线 |
| 字体 | `--wemd-font-heading / body` | 标题栈 / 正文字体栈 |
| 间距 | `--wemd-space-component / section / block / inline` | 组件间距 / 大块 / 块内 / 统一水平内边距 |
| 圆角 | `--wemd-radius-sm / md / lg` | 小 / 中 / 大 |

规则：
- **组件级 CSS 禁止写死色值 / 字体 / 间距数字**，一律引用 `var(--wemd-*)`。
- 组件级若要微调，可用 `calc(var(--wemd-space-inline) * 0.8)` 派生，禁止凭空造数字。

### 2.2 原生元素皮肤（Base Layer · native Markdown）

基础层直接用原生语法输入（`#` 标题 / `>` 引用 / 表格 / 代码栅栏 / `---` / 图片）。这些**不套 `:::`**，渲染端自动识别后套 `wemd-component`，但**视觉皮肤仍由全局原生元素选择器承担**。

| 原生元素 | 全局统一职责 | 归属 |
| --- | --- | --- |
| `h1` | 字号 / 行高 / 主色字体栈 / 强调装饰 | **全局** |
| `h2` | 字号缩放 / 副标题装饰 | **全局** |
| `h3` | 字号缩放 / 三级强调 | **全局** |
| `h4` | 小段落标题 | **全局** |
| `p` | 行高 / 正文字体 / 上下留白 | **全局** |
| `blockquote` | 引线 / 底色 / 圆角 / 引用内 `p` 归零 | **全局** |
| `table / th / td` | 边框 / 表头强化 / 字号 / 单元格 padding | **全局** |
| `pre / code` | 深色底 / 字体栈 / 圆角 / 横向滚动**不裂版** | **全局** |
| `img` | `max-width:100%` / `display:block`（防裂版） | **全局** |
| `ul / ol / li` | 列表重置 / 缩进 / 标记样式 | **全局** |
| `hr` | 分隔线样式 | **全局** |
| `a` | 链接色 / 去下划线倾向 | **全局** |
| `strong / em / del / u / mark` | 行内强调统一 | **全局** |

> 黑体加粗 █ 基础层原生皮肤是"全站通用"，绝不许在任意一个组件里重抄一份 h2/table/blockquote 样式。

### 2.3 组件统一载体（`.wemd-component`）

所有组件（无论基础层还是杂志层）都包在 `<section class="wemd-component wemd-{id}">` 里。以下必须在全局统一，而不是每个组件各写各的：

| 属性 | 全局约定 | 原因 |
| --- | --- | --- |
| `display:block` | 组件一律块级 | 微信行列不友好 |
| `max-width` | 不超容器宽度，防裂版 | 微信窄屏 |
| 内部首尾 margin | `.wemd-component > *` 首尾去掉多余 margin（若有） | 防顶底空隙 |

> **组件外部间距（上下留白）由 Stack 全局规则统一控制，组件级禁止再碰。**
> 实现约定：全局只写一条 `#wemd > [class] { margin-bottom: var(--wemd-space-component); }`，
> `.wemd-component` 载体本身**不写上下 margin**。所有组件（除刻意打破节奏的 end-card 等，配 `data-stack="{section}"` 之外）一律靠这条 Stack 规则拿间距。
> 组件级若写 `margin-top/margin-bottom`，属违规，会与 Stack 打架。

> 打破留白节奏的例外：`end-card` / 大节标题等若需更大间距，用 Stack 支持的 `section` 档（`--wemd-space-section`），**不要**在组件里手写 margin 数值。

### 2.4 行内文本 / 分槽容器归一

- `.wemd-component-body` 以及各 `wemd-{abbr}-{key}` 分槽容器：默认 `margin:0; padding:0`，由组件级决定是否加自家 padding。
- 避免分槽容器继承导致的双重间距（例如组件设了 padding，槽里内容又自带 margin）。

---

## 3. 组件级控制层（component-level）——只写特有视觉

每个组件一段，命名 `#wemd .wemd-{id}`，且**只写该组件区别于全局的部分**：

- 该组件的**背景 / 边框 / 主视觉装饰**（intent 里最想表达的那张"皮"）。
- 该组件的**布局骨架**（stack / side-rail / media-text 等，若与默认不同）。
- 该组件**独有的装饰物**（挂牌条、角标、圆点……用真实子元素物化）。

书写模板：

```css
/* --- {组件中文名}：一句话母题 --- */
#wemd .wemd-{id} {
  background: var(--wemd-bg-surface);
  border: 1px solid var(--wemd-border);
  border-radius: var(--wemd-radius-md);
  /* ↑ 只写"这张皮"，颜色/字体/间距全走 var() */
}
#wemd .wemd-{id} .wemd-component-body {
  /* 该组件槽内才需要的处理，否则不写 */
}
```

---

## 4. 微信硬性兼容（写任何 CSS 前先对着这张表查）

> 机检规则见 `wechat-css-rules.json`，这里讲"为什么 + 怎么绕"。

### 4.1 伪元素 / 结构伪类 —— 全部禁用

| 被剥的东西 | 后果 | 正确绕法 |
| --- | --- | --- |
| `::before / ::after / ::marker / ::first-letter` | 装饰静默丢失 | **物化成真实子元素**（`<span class="wemd-…-mark">"</span>` / `<span class="wemd-…-dot">`） |
| `:first-child / :last-child / :nth-child / :only-child / :empty` | 支持不稳定，选择器可能不命中 | **骨架已物化显式 class**，直接选中类名 |
| 编序号（`counter-reset / counter()`） | 微信不可靠 | 序号由内容的 slot 字段直接进 DOM |

> 骨架 DSL 里 `decoration` / `label` 就是为"物化装饰"服务的；不要用伪元素画引号、圆点、竖条、角标。

### 4.2 定位 / 布局

| 写法 | 状态 | 绕法 |
| --- | --- | --- |
| `position:fixed / sticky` | 微信剥掉 | 只用 `relative / static` |
| `position:absolute` | 微信支持不稳，骨架禁止 | 用真实元素 + 布局（inline-block / block / padding）物化 |
| `display:grid` | 支持有限，需谨慎 | 能用 block / inline-block / table 表达就用；非用不可再 grid，且用兼容兜底 |
| `display:flex` | 现代微信可用，但句式排 | 双栏用 flex 时给足 gap，窄屏需降级为 block |

### 4.3 交互 / 动画

| 写法 | 状态 | 绕法 |
| --- | --- | --- |
| `@keyframes` / `animation` | 剥掉，动画不播 | 纯静态装饰，别指望动效 |
| `transition`（非 hover 必要） | 是否保留由编辑器环境定，公众号阅读态无 hover | 强依赖 hover 的样式在公众号里不可见，要有无 hover 兜底 |
| `details/summary` 交互 | 公众号富文本无原生折叠交互 | 折叠 = 伪交互，样式上做成"展开态"或纯展示 |

### 4.4 效果滤镜

| 写法 | 绕法 |
| --- | --- |
| `backdrop-filter` | `background: rgba()` 半透明模拟 |
| `filter`（含 blur） | 剥掉；如需模糊用 SVG |
| `mix-blend-mode` | 剥掉；用明确的前景/背景配色 |
| 阴影 `box-shadow` | 可用，但太重有性能与兼容风险；能不用则不用 |

### 4.5 资源 / 外链

| 写法 | 绕法 |
| --- | --- |
| `url(https://…)`（CSS 里） | 剥掉 → 404；内联成 `data:` 或走 `var(--wemd-asset-*)` |
| CSS 里直接写相对资源 `assets/...` | 导出后 404；同上 |
| 正文 `<img src="https://…">` | 正文图片本身可以是外链，但**组件装饰图**千万别用外链 url |

### 4.6 摸板（模板 HTML）层面的禁区

- 标签白名单：`section / div / span / p / img / strong / em / hr`（骨架编译器只产出这些）。
- 禁止 `<style>` / `<script>` 出现在产物里。
- 装饰物必须真实存在：引号用 `&#201;`/`"` 字符，圆点用 span，色条用 span/border，角标用 span。

---

## 5. 基础层组件 × 微信注意点（逐组件）

> 这里记录"这个基础组件在微信下特别容易踩 + 正确做法的骨架"。**会随修复不断增量补充。**

### 5.1 表格（styled-table / table）
- 骨架：表头区 `wemd-sbt-table` 用真实 `table/th/td`，**不用伪元素画表头**。
- 微信陷阱：别靠 `:nth-child(odd/even)` 做斑马纹（伪类不支持不稳）；要么不做斑马纹，要么在数据行上物化 `wemd-sbt-row` 交替类。
- 横向溢出：若列多，`table` 外层包一个可横滑容器，`white-space` 控制，忌撑破 `#wemd` 宽度。

### 5.2 标题（section-title / numbered-heading）
- `## 标题` 被识别成 section-title / numbered-heading，套 `.wemd-component-body > h2`。
- 注意：`#wemd .wemd-section-title .wemd-component-body > h2` 要把全局 `h2` 的左竖条 / 内边距**冲掉**（`padding-left:0;border-left:0`），否则双重装饰。
- numbered-heading 的序号**来自内容本身已有编号**（`01` / `第一步`），靠原生检测正则判断，不要用 CSS counter。

### 5.3 引用（pullquote）
- 原生 `> 引用` 套 pullquote，DOM = `.wemd-component-body > blockquote`。
- 引线用 `border-left`、装饰用 `blockquote` 内的真实元素，禁用伪元素画引号。
- 引用内 `blockquote p` 要 `margin:0`，避免双倍留白。

### 5.4 代码块（code-frame / code-block）
- 深色底的代码块，字体走 `--wemd-font-body`（或自有代码栈）。
- `pre` 必须 `overflow-x:auto` + `max-width:100%`，防长行把页面撑破。
- 语法高亮：不要依赖会剥的 filter；直接用 `span` 加 class 着色最稳。

### 5.5 图片（image-card / image-grid / image-text-row / image-compare）
- 若网格 / 对比要并排：优先 `table` 或 `inline-block`（微信稳），少用 grid。
- 底部空隙：`img{display:block}`（防基线留缝）。
- 图片有图注 `figcaption` 时，图注样式组件级；`figcaption` 是全球对齐的（字号/灰字）。

### 5.6 分割线（divider / divider-fancy）
- `---` 套 divider，Global `hr` 已给样式。
- divider-fancy 的左右横线如果非要用伪元素 → 改为**左右 `<span class="wemd-df-line">`**（骨架已物化 `wemd-df-line-left/right`）。

### 5.7 步骤 / 列表（steps / ul / ol）
- steps 序号：**不要用 `counter()`**，序号在渲染端进 DOM（数字文本），CSS 只摆样式。
- 列表项装饰点：用 `list-style` 或每项物化 marker span，别用 `::marker` / `:nth-*`。

---

## 6. 归属判断速查（"这行样式到底归全局还是组件级"）

写任何一条 CSS 前问自己：

```
1. 它是否套在所有 h2 / 所有 table / 所有 blockquote 上？        → 全局
2. 它是否套在「每一个 wemd-component 容器」上（留白/块级/宽度）？ → 全局
3. 它只是这一个组件（section-title）的特殊皮/装饰？              → 组件级
4. 它是一个被多个组件共用的「装饰原语」（圆点/色条/斜体图注）？  → 全局（或全局纯类）
```

**妥协原则**：拿不准归哪，**先归全局**（宁可全局统一，也不要组件各自为政造成"稀烂"）。若后来发现某组件确实要盖掉，再在组件级覆盖，并记录到 §7 增量日志。

---

## 7. 主题全局控制 vs 组件级控制 —— 显式归属矩阵

> 这是 §6 的**具象清单版**：凡是"统一载体 / 基础结构 / 被多组件共用"的 MUST 归全局，组件级一律禁止碰。
> 写每个组件 CSS 前先对照本表，别把下表属性写进 `#wemd .wemd-{id}`。

| 主题全局控制（theme-global） | 归属 | 组件级禁止的理由 |
| --- | --- | --- |
| 全部颜色 / 字体 / 间距 / 圆角 / 阴影 token（`--wemd-*`） | `#wemd {}` 根 | 组件写死不引用 → 换主题即坏 |
| 原生元素皮肤（h1–h4 / p / blockquote / table / pre-code / img / ul-ol / hr / a / strong-em-mark 行内强调） | 全局元素选择器 | 组件里重抄一份 → 双重装饰 / 各组件打架 |
| 组件外部间距（`#wemd > [class] { margin-bottom }`） | Stack 全局规则 | 组件写 margin-top/bottom → 与 Stack 打架、留白失控 |
| 组件载体基础（`display:block; max-width:100%`） | `.wemd-component` | 组件改 display/max-width → 撑破或行列化 |
| 分槽容器归一（`.wemd-component-body` 等默认 `margin:0;padding:0`） | 全局 | 组件各自设 → 双重间距 |
| 表格 / 代码 / 图注 / 列表的基础排版（字号、边框、间隔） | 全局原生选择器 | 组件级重定义 → 不一致 |

**组件级只允许写（MUST NOT 越权）**：
- 该组件的**背景 / 边框 / 圆角 / 主视觉装饰**（"这张皮"）。
- 该组件**特有的布局**（side-rail / split / grid 等骨架差异）。
- 该组件**独有的装饰物**（挂牌条 / 角标 / 步骤点，真实子元素物化）。

**校验断言**（写组件级 CSS 时自检）：
```
1. 我写的是不是什么 var(--wemd-bg/accent/text/border/font/space/radius) 之外的裸色值？ → 违规，改 var()
2. 我写 font-family 了吗？ → 违规，全局已有，删掉
3. 我写 margin-top/bottom 了吗？ → 违规，交给 Stack，删掉
4. 我写 display/max-width 吗？用于该组件特有布局时 → 允许；否则删
5. "这张皮"是不是全局统一的（所有卡片都该有）？→ 是则抽到全局，不是才留组件级
```

---

## 8. 增量日志（活文档 · 每补一条记一条）

| 日期 | 变更 | 组件 / 层 | 说明 |
| --- | --- | --- | --- |
| 2026-08-17 | 建立本文档 | — | 立项：微信页面 CSS 规范 + 全局/组件级边界 |
| 2026-08-17 | 落地 pixel-arcade 全局层 | 全局 | ① 新增代码 token `--wemd-code-bg/text`；② 补齐原生元素皮肤 p/img/pre-code/a/ul-ol/行内强调；③ 新增 `.wemd-component` 统一载体；④ code-frame 改深色整卡避免浅底浅字 |
| 2026-08-17 | 修基础层皮肤 | section-title / numbered-heading / styled-table | numbered-heading 补 `body > h2` 冲掉全局左竖条；styled-table 内表格 margin 归零 |
| 2026-08-17 | 明确 Stack 间距归属 | 全局 | 组件外部间距统一交给 `#wemd > [class]` Stack 规则，`.wemd-component` 载体不再自带上下 margin；组件级禁写 margin |
| 2026-08-17 | 新增归属矩阵 | 全局 | §7 显式列出"主题全局 vs 组件级"边界 + 写向量组件 CSS 前的 5 条校验断言 |

---

## 8. 落地清单（本轮要做的）

- [ ] 瘦身全局层：`#wemd` 抽取全部 token（颜色/字体/间距/圆角）。
- [ ] 全局原生元素皮肤：h1–h4 / p / blockquote / table / pre-code / img / ul-ol / hr / a / 行内强调，**一次写全、禁重复抄进组件**。
- [ ] `.wemd-component` 统一载体（display / margin / 宽度 / 首尾清理）。
- [ ] 逐个基础组件做微信安全改造（对照 §5），并回填 §7 日志。
- [ ] 组件级 CSS 全面引用 `var(--wemd-*)`，不出现写死的色值/间距。
- [ ] 打包主题后，用 `wechat-css-rules.json` 机检产物无违规。