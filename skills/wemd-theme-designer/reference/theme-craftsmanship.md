# 主题改造方法论（Skill 版 · Theme Craftsmanship Playbook）

> 依据内置主题（数据蓝天 / 数据蓝图 / 无声发布等）的实际改造流程沉淀，改写为 **wemd-theme-designer skill 可独立使用**的版本：
> 产物路径全部落在 skill 自己的 `themes/{theme-name}/` 目录，不依赖主程序源码结构（packages/core 文件、注册、回归测试代码已移除）。
> 目的：给每套主题提供一份可照做的流程、规则与陷阱清单，避免重复踩坑。

---

## 一、整体流程（四步走）

1. **定场景 → 出视觉稿（HTML）**
   - 先明确主题的应用场景（如数据周报 / 文艺书信 / 教程指南），据此选组件。
   - 产出独立 HTML 视觉稿 `themes/{theme-name}/preview/vision.html`，**以视觉设计为主**，不强约束骨架。
   - 视觉稿中所有装饰必须是真实 DOM / CSS 渐变 / 边框，**不写伪元素**（与微信约束一致）。
   - 用户在浏览器确认视觉气质后，再进入生成。
2. **定骨架（自由模板）**
   - 只给「真正需要结构差异」的组件写骨架模板 `themes/{theme-name}/templates/<id>.html`；其余组件复用默认骨架。
   - 骨架是自由 Mustache 模板（像内置主题），只守三条底线：根元素约定 / Slot 契约 / 微信兼容（无伪元素）。
   - 骨架里新增的装饰用真实元素（如 `wemd-sd-badge` / `wemd-sb-glow`），不要伪元素。
3. **定皮肤（CSS）**
   - 全局皮肤（`#wemd`）+ 组件级差异化，产出 `themes/{theme-name}/css/{theme-name}.css`。
   - 覆盖共享组件样式用「同路径 · 同特异性」选择器（见规则 §1）。
4. **打包 + 回归验证**
   - 打包为 `themes/{theme-name}/{theme-name}.wemd-theme`（可导入主程序的独立主题包）。
   - 产出 `themes/{theme-name}/validation.md` 回归验证报告（见「回归验证要点」），全部通过才交付。

---

## 二、规则与检查点

> 条目分两类：
> - **硬约束（必须遵守）**：技术/微信层面的硬性限制，违反会坏（特异性、无伪元素、不设整篇背景）。
> - **检查点（设计自由，仅验收时核查）**：配色、装饰色属于设计决策，验收时检查可读性与一致性。

### 1. 皮肤覆盖共享组件时，选择器必须「同路径 · 同特异性」（硬约束）
- 共享规则常写 `#wemd .wemd-magazine-cover .wemd-mc-title`（1 ID + 2 class，特异性 0,1,2,0）。
- 主题皮肤若写 `#wemd .wemd-mc-title`（0,1,1,0），**特异性更低** → 内联导出时被共享覆盖，皮肤不生效。
- ✅ 正确：写完整路径 `#wemd .wemd-magazine-cover .wemd-mc-title`（同特异性、源码在后 → 覆盖）。
- ⚠️ 排查信号：改了皮肤但导出样式没变化，先查选择器是否少写了一层容器 class。

### 2. 底色 / 深色配色的检查点（颜色冲撞）（检查点）
- 是否用整块底色、用浅底还是深底、深底上配什么字色，**都是组件 / 主题自己的设计决策**，不在此写死做法。
- 只需在验收时检查一个关注点：**前景与背景是否可读、颜色是否冲突**。
  - 若某元素用了深色背景，确认其文字不是同色系深色（如深蓝底配深墨字不可读）。
  - 若某元素用了浅色 / 白色背景，确认文字不是浅色。
- 典型风险：正文承载类用 `var(--wemd-bg-card)` 整块底色（当 token 把 bgCard 设为深色时会深底深字）；深色强调卡沿用共享 `var(--wemd-text-normal)` 深色字。
  **是去底色、还是强制浅字、还是保留深底，由组件设计决定**，方法论只提示检查。

### 3. #wemd 不设整篇背景（硬约束）
- 项目约束：`#wemd` 不写 `background-color` / 整篇背景图（微信编辑器会设底色）。
- 背景交给公众号编辑器，结构靠组件边框线表达。
- ⚠️ 排查信号：整篇蓝底 / 浅色底 → 检查 `#wemd` 的 `background-image` / `background-color`。

### 4. 装饰一律真实 DOM，无伪元素（硬约束）
- 皮肤 / 骨架里**不要写 `::before` / `::after`** 做装饰。
- 结构伪类（`:nth-child` / `:first-child` / `:last-child` / `:not()`）同样禁用。
- 需要装饰（竖条、光边、序号、图标）时：**在骨架里放真实 `<span>`**（如 `wemd-sb-glow`、`wemd-sd-badge`）。
- 共享默认组件里已有 `::before` 装饰（如 callout 竖条、图标）是**既有机制**：导出时由物化器自动转真实元素。**主题皮肤不需要、也不应该自己再写 `::before`**——重复定义会造成预览/导出不一致或双条叠加。

### 5. 装饰色是组件设计的一部分，是否跟随主题由组件决定（检查点）
- 组件装饰色（如 callout 竖条用 type 语义色，或跟随主题主色 `var(--wemd-primary)`）**属于组件自身设计**。
- 选「跟随主题」还是「固定语义色」，取决于组件想表达什么。
- 方法论只要求：**预览与发布两条链路表现一致**，且颜色不与背景冲突（见第 2 条）。

### 6. 明确哪些组件「保持默认」（硬约束）
- 不是每个组件都要定制。明确清单（如 code-frame 保持默认骨架 + 默认皮肤），皮肤里**不要**覆盖它，避免引入意外样式。
- 回归验证里加一条「未定制组件无主题污染」检查（模板里无该组件、CSS 里无其覆盖规则）。

### 7. 主题级扩展槽（slotDefs）—— 让骨架消费共享槽位之外的额外内容（硬约束）
- **背景**：共享 `slotDefs.ts` 决定了组件能"看到"什么内容（骨架里 `{{slot:key}}` 只能取到共享解析产出的槽）。主题想要额外内容（封面图、作者、日期、编号拆分）时，需在主题中声明扩展槽。
- **机制**：主题可声明 `slotDefs`（组件 id → 追加槽位），解析时扩展槽排在共享槽之前、key 冲突以主题扩展为准（否则图片/行会被共享 desc/body 先吞掉）。
- **降级不丢内容**：未声明扩展槽时，对应内容掉进共享 desc/body 兜底，以正文渲染，不报错不丢数据。
- **样例**：无声发布给 `magazine-cover` 加 `image` 槽（带图封面）、给 `numbered-heading`/`section-title` 加编号拆分（`number-prefix`）。

### 8. 编号拆分（source:"number-prefix"）—— 行首编号单独着色（检查点）
- 从 h2 行首提取编号（如 `## 01 引言` → `01`），剥离 `##` 标记，剩余文本供正文渲染。
- 骨架：`{{#if part}}<span class="wemd-…-num">{{slot:part}}</span>{{/if}}` + `<span class="wemd-…-body">{{slot:body}}</span>`，编号单独着色。
- 无编号标题自动降级：`part` 为空 → 只渲染 body。

### 9. SVG / base64 装饰素材（检查点）
- **背景**：装饰优先 CSS 代码表达。绝大多数视觉（波形、引号、图标、环形、纹理）都能用 CSS 渐变 / 边框 / conic-gradient 表达，优先用 CSS；仅当复杂度超出 CSS 表达力时才引入 SVG / base64 素材（需接受微信兼容不确定性）。
- **合法用法（微信兼容优先）**：
  - `background-image: url("data:image/svg+xml;base64,...")` / `url("data:image/png;base64,...")` —— 皮肤里引用（**必须 base64 或完整百分号编码**，内联导出才不会被 `;` 截断）。
  - 真实 `<svg>` 元素 —— 编辑器预览正常，公众号渲染**不确定**；SVG 颜色**直接写 SVG 属性**（`stroke="#xxx"` / `fill="#xxx"`），CSS 的 `stroke`/`fill`/`color` 内联导出不生效。
- **约束**：SVG 不写脚本、不引外部资源、不嵌 `<image>` 位图伪装矢量；base64 图注意体积（单图 ≤ 2MB，总量 ≤ 15MB）；装饰 SVG 不依赖数据驱动（数据用文字 / CSS 呈现，如 stats-block 环形用 conic-gradient）。

---

## 三、回归验证要点（每套主题必须覆盖，写入 validation.md）

1. **骨架装饰存在**：每个定制骨架组件的装饰元素（badge / glow / line / dot）出现。
2. **颜色冲撞 / 可读性**：深色背景元素配浅色文字（不被共享 `var()` 覆盖成同色系深色）；浅色背景元素配深色文字。**配色由组件设计决定，只锁可读性**。
3. **未定制组件保持默认**：未写模板的组件无自定义模板、CSS 无覆盖规则（无主题污染）。
4. **无伪元素 / 结构伪类残留**（发布后）：`publish/*.html` 全内联，不含 `::before`/`::after`/`:hover`/结构伪类/`@keyframes`/`@media`/`animation`/兄弟选择器；`css/{theme}.css`（= 打包后 components.css）允许存在**纯中和规则**（`::before/::after { content: none }`），其余禁用模式不得出现。
5. **与视觉稿一致**：焦点组件的颜色/装饰能回溯到已确认的视觉稿（`preview/vision.html`），不另起一套。
6. **整篇无背景**：`#wemd` 无 `background-color` / 整篇背景图。
7. **扩展槽渲染（如有）**：断言扩展槽内容落到骨架正确槽位；槽位映射反转时用精确断言锁住。
8. **降级不丢内容**：未声明扩展槽时内容进 desc/body 兜底，不报错不丢数据。
9. **无重复装饰**：覆盖「共享伪元素装饰清单」组件（callout-pro/divider/pullquote/steps/faq）时已中和共享 `::before/::after`（`content: none` 存于 `package/styles/components.css`，打包器自动从 variantCss 剥离）；pullquote 还须覆盖共享根元素 `border-left`（非伪元素）；导出后同一装饰线/条只出现一条（无双竖条/双线、无额外 `wemd-mat` 竖条物化）。

---

## 四、踩坑速查表（下次直接对照）

| 症状 | 根因 | 修法 |
|---|---|---|
| 改了皮肤但导出不变 | 选择器少一层容器 class，特异性低于共享 | 写完整路径 `#wemd .<容器> .<子元素>` |
| 深色背景 + 深色字不可读 | 深色卡沿用了共享 `var(--wemd-text-normal)` 深色字 | 按组件设计决定：深色卡改浅字，或改浅底 |
| 整篇浅蓝/浅色底 | `#wemd` 写了 background-image/color | 改为 `background-image: none`，交给编辑器 |
| 正文卡片有整块底色且不可读 | 共享默认给正文类用 `var(--wemd-bg-card)`（token 为深色时深底深字） | 按设计决定：去底色 or 浅底 or 配浅字 |
| callout 竖条颜色与主题/背景冲突 | 竖条用 type 固定色（或主题色）与卡片配色打架 | 由组件设计定色；验收检查前景/背景可读 |
| 组件竖条出现两条（如 callout-pro / divider） | 共享样式自带 `::before/::after` 装饰（callout-pro 左竖条、divider 左右横线），导出时物化；主题皮肤又用 border-left/border-top 表达同一条，未中和共享伪元素 | 主题用 border 表达该装饰时，写 `#wemd .wemd-xxx::before, #wemd .wemd-xxx::after { content: none }`（原选择器、原样书写）。打包器自动保留进 components.css、从 variantCss 剥离；校验器/导入器已放行纯中和规则（clear-guide / 复古报纸已踩） |
| pullquote / 原生 `>` 出现两条竖条 | 共享 pullquote **根元素**自带 `border-left: 5px`（非伪元素），主题又在 body 加 `border-left: 4px` → 根 + body 双条 | 覆盖根元素：`#wemd .wemd-pullquote { border-left: none; background: transparent; border-radius: 0; padding: 0 }`，只留 body 一条竖条（原生 `>` 也自动识别为 pullquote，同此约束） |
| timeline 红点不在竖线中间 | 共享圆点定位 `left:-27px` 只对 12px 圆点成立；主题改小圆点没重算 left → 圆心偏出竖线（尺寸/定位耦合） | 共享已改尺寸无关居中（`left:-21px`+`translateX(-50%)`）。主题只改 size/color、**不写 left**；自设绝对定位时加 `transform: none`。渲染级验证会校验圆心与线中心偏差 <2px |
| styled-table 主题皮肤不生效（走了共享红表头/灰字） | 共享皮肤旧用**深路径** `.wemd-sbt-table table th/td`（特异性 1,3,1），主题只写 `.wemd-styled-table th`（1,2,1）→ 特异性不足被共享覆盖 | **已在共享层修复**（共享改浅路径，主题浅/深覆盖都能生效）。主题仍可写同路径或深路径 |
| section-title 变卡片（bg+左边条），本想要干净下划线标题 | 共享 section-title 是卡片样式，主题只加了 border-bottom 没清卡片 | 清 `background: transparent; border-left: none; border-radius: 0; padding: 0 0 6px` |
| divider 双线中间多出一条线（三线） | markdown `---` 会在 divider body 内生成 `<hr>`，未隐藏 | **已在共享层修复**（共享 divider 已 `hr { display: none }`）。主题无需处理 |
| magazine-cover 分隔变红条 + 内嵌线 | 共享 `.wemd-mc-divider` 是 4px 红条，主题用作文字分隔未清 | 清 `width: auto; height: auto; background: none; border-radius: 0` |
| divider-fancy label 独占整行、线被挤 | 共享 `.wemd-df-label` width:100%（线嵌 label 内）；主题自定义骨架把线放 label 两侧 | 主题加 `.wemd-df-label { width: auto }` |
| 预览正常导出异常（或反之） | 预览走级联、导出走内联+物化，两条链路 | 两链路都验证 |
| 封面/收场槽位颠倒（eyebrow 变大标题、大标题变小字） | 共享解析 title=首行 / subtitle=次行，范文按"eyebrow 第一行（斜体）+ 大标题第二行（粗体）"写 | 骨架反转使用槽位：eyebrow←`{{slot:title}}`、大标题←`{{slot:subtitle}}`（无声发布已踩） |
| 封面/收场内 strong/em 变主题橙 | 全局 `#wemd em` / `p strong` 规则内联染色 | 封面内 `strong, em { color: inherit }` 继承封面色 |
| styled-table 皮肤不生效（走了默认表头） | 共享皮肤用深路径 `.wemd-sbt-table table th/td`（特异性 1,3,1），通用选择器 `.wemd-styled-table th/td`（1,2,1）特异性不足被覆盖 | 用同深路径 `.wemd-styled-table .wemd-sbt-table table th/td`（见上条） |
| 扩展槽内容被共享槽吞掉（如封面图提取不到） | 扩展槽排在共享 `desc`(paragraph many) 之后解析，图片行已被消费 | 让扩展槽**排在共享槽之前**解析（机制已内置，勿回退） |
| CSS `background` 内联 data URL 被拆散（`url("data:...;base64,...")` 里的分号截断） | 内联化用 `split(";")` 简单切分声明，data URL 内 `;` 被当分隔符 | 切分时跳过 `url(...)` 内分号 |
| SVG 元素 CSS 颜色（`stroke`/`fill` via CSS）内联导出不生效 | SVG 元素 `color`/`stroke` 的 CSS 规则未被内联 | 骨架里 SVG 装饰直接写 SVG 属性颜色（`stroke="#xxx"`），不依赖 CSS（曾踩） |

---

## 五、验收动作

1. 回归验证 `themes/{theme-name}/validation.md` 全部通过。
2. 视觉稿（`preview/vision.html`）与发布产物气质一致。
3. 主题包（`.wemd-theme`）可导入主程序，预览正文、卡片、深色卡、竖条颜色协调。
4. 用「复制到公众号」导出，粘贴到公众号模拟器，确认预览 = 导出（无伪元素残留、颜色一致）。
