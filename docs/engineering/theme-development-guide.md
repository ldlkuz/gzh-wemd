# 主题开发避坑指南（Theme Development Guide）

> 沉淀「故事集 Storybook」等内置主题从设计到落地过程中的真实踩坑与解决方案。
> 每条都是**可复用经验**：现象 → 根因 → 修复 → 涉及文件 → 验证方式。
> 开发新主题前先扫一遍，命中即抄方案，避免重复踩坑。

---

## 目录

1. [实时预览与示例预览的 CSS 链路差异（封面图高度被覆盖）](#1-实时预览与示例预览的-css-链路差异)
2. [首字下沉第三行仍被缩进（正文没包 p）](#2-首字下沉第三行仍被缩进)
3. [首字下沉用「弹性浮高」而非固定 px 高度](#3-首字下沉用弹性浮高而非固定-px-高度)
4. [示例图不要用占位服务（picsum 加载失败）](#4-示例图不要用占位服务)
5. [皮肤覆盖共享组件需中和共享伪元素（双条叠加）](#5-皮肤覆盖共享组件需中和共享伪元素)
6. [主题私有骨架清空共享卡片样式（封面嵌套边框）](#6-主题私有骨架清空共享卡片样式)
7. [公众号插入后首字下沉整体失效（float span 必须在 p 内）](#7-公众号插入后首字下沉整体失效)
8. [公众号图片上叠文字必须用 background-image（position 会被删）](#8-公众号图片上叠文字必须用-background-image)

---

## 1. 实时预览与示例预览的 CSS 链路差异

**现象**
- 封面图在"示例预览"正常铺满整幅封面、文字叠图；在编辑器"实时预览"里只占封面顶部一小段（按图片自然比例），下方留白被深色渐变遮罩填满，看起来像"图片一半被遮住"。
- 两条链路渲染同一份 markdown + 同一份主题 CSS，结果却不同。

**根因**
- 实时预览组件有图片归一化规则（`apps/web/src/components/Preview/MarkdownPreview.css`）：
  ```css
  #wemd img {
    max-width: 100% !important;
    height: auto !important;   /* 覆盖封面图的 height: 100% */
    display: block;
    margin: 10px auto;
  }
  ```
- 示例预览走 iframe（`ThemeLivePreview`），不含这条 app 级规则，所以正常。
- 主题 CSS 里封面图 `height: 100%` 特异性（1 id + 3 class + 1 type）**低于** `#wemd img`（1 id + 1 type），即使主题没有 `!important` 也会被压过。

**修复**
- 封面图高度用**更高特异性选择器 + `!important`** 覆盖（两者都带 `!important` 时比特异性）：
  ```css
  #wemd .wemd-magazine-cover .wemd-sk-cover-img img {
    display: block;
    width: 100%;
    height: 100% !important;
    object-fit: cover;
    margin: 0;
  }
  ```

**涉及文件**
- `apps/web/src/components/Preview/MarkdownPreview.css`（触发源，一般不改）
- `packages/core/src/themes/components-storybook.ts`（修复）

**验证**
- 浏览器实测：实时预览封面图铺满整个 cover 容器、标题文字叠在图上、底部渐变正常。

**通用结论**
- 主题内凡是**需要图片撑满定高容器**（封面、hero、图像卡）的地方，高度都要带 `!important` 防 app 级 `#wemd img { height: auto !important }` 覆盖。

---

## 2. 首字下沉第三行仍被缩进

**现象**
- 首字下沉"雾"明明只有两行高，正文第三行却仍缩进、走不到最左，第四行才回到最左。

**根因**
- `text-card` 的 `body` 槽在走 `paragraph` 源时，用 `<br>` 拼接行并输出**裸文本，不带 `<p>`**（见 `slotParsers.ts` 的 `takeParagraphs`）。
- 因此 `.wemd-sk-lead-body p { line-height: 2 }`（35px）这条规则**匹配不到任何元素**，正文回退继承祖先的 `line-height: 1.8`（31.5px）。
- 下沉字浮高 70px ÷ 31.5px ≈ 2.2 行 → 第三行仍在浮动区里，被缩进。

**修复**
- 骨架给正文显式包 `<p>`，让针对 `p` 的行高/字号规则真正生效：
  ```html
  <section class="wemd-sk-lead-body">
    {{#if dropcap}}<span class="wemd-sk-dropcap">{{slot:dropcap}}</span>{{/if}}
    {{#if body}}<p>{{slot:body}}</p>{{/if}}
  </section>
  ```

**涉及文件**
- `packages/core/src/themes/templates-storybook.ts`

**验证**
- 浏览器实测：`.wemd-sk-lead-body > p` 计算行高变为 35px，正文第三行回到最左。

**通用结论**
- `paragraph` / 需要样式化的槽位，**骨架里必须显式包 `<p>`**，不要直接 `{{slot:body}}` 裸插入，否则 `p` 相关 CSS 全部失效。

---

## 3. 首字下沉用「弹性浮高」而非固定 px 高度

**现象**
- 早期用固定高度方案（`height: 70px; line-height: 70px; overflow: hidden`）做两行下沉字，在预览正常，但在微信 / 不同环境字体度量下容易错位：第三行又缩进、或字形被裁切。换到正常排版示例（`float: left; font-size: 3em; line-height: 1; margin: 2px 8px 0 0`）后稳定。

**根因**
- 固定 px 浮高（如 70px = 两行正文行高）把"行高 × 2"硬编码成像素，一旦环境行高/字号渲染与设计值有偏差，浮动盒高度就脱离"两行"，第三行位置不可控；`overflow: hidden` 还会裁字形。
- 弹性方案：`line-height: 1` 让浮动盒高度 = 字号本身；字号用 `em` 相对正文，浮动高度天然落在"一行 < H < 两行"区间，第 1–2 行绕排、第 3 行自然回左，不依赖精确像素。

**修复**
- 下沉字用**弹性浮高**，字号/行高全用相对值，不写固定 px：
  ```css
  #wemd .wemd-text-card .wemd-sk-lead-body .wemd-sk-dropcap {
    float: left;
    font-size: 3em;     /* 相对正文 17.5px = 52.5px，落在行盒 35px 与两行 70px 之间 */
    line-height: 1;      /* 浮动盒高 = 字号，而非字号 × 行高 */
    margin: 2px 8px 0 0;
    font-weight: 700;
    color: var(--accent, #b5533a);
  }
  ```
- 关键前提：正文行高要先定死（骨架包 `<p>` + 明确 `line-height`），浮高才能对齐"两行"。

**涉及文件**
- `packages/core/src/themes/components-storybook.ts`

**验证**
- 浏览器实测：下沉字盒高 = 字号（≈1.5 行），第 1–2 行绕排、第 3 行确定回左；换到微信模拟器两链路一致。

**通用结论**
- 做"N 行下沉字"：①正文行高定死（包 `<p>`）；②浮动盒用 `line-height: 1` + `em` 字号，让浮高=字号，落在 N 行与 N+1 行行高之间；③不要写固定 px 浮高、不要 `overflow: hidden` 裁字形。

---

## 4. 示例图不要用占位服务

**现象**
- 封面 / 场景图在部分网络环境加载不出来，封面只剩深色遮罩，观感异常。

**根因**
- 示例文档用了 `picsum.photos` 占位图服务，国内网络不稳定/被墙。
- 项目规范要求所有 web 图片使用 trae 生成图端点。

**修复**
- 换成项目统一的生成图 URL（prompt 需 URL 编码）：
  ```
  https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt={prompt}&image_size={image_size}
  ```

**涉及文件**
- `apps/web/public/samples/storybook.md`

**验证**
- 刷新实时预览，封面图正常加载。

**通用结论**
- 主题示例 / 素材一律用 trae 生成图端点，禁止 picsum 等占位服务。

---

## 5. 皮肤覆盖共享组件需中和共享伪元素

**现象**
- 主题皮肤用 `border-left` 表达 callout 竖条后，出现**双竖条**；divider 用 `···` 或单线后出现双横线；pullquote 有共享根竖条残留。

**根因**
- 共享默认组件自带 `::before/::after` 装饰（callout-pro 竖条 / divider 左右线 / pullquote 竖条等）。主题皮肤用 border/背景表达同类装饰时，若不清除共享伪元素，装饰叠加。
- 注：主题皮肤**不要再自己写 `::before/::after`**（违反微信兼容），只负责中和。

**修复**
- 在主题皮肤里中和共享伪元素：
  ```css
  #wemd .wemd-callout-pro::before { content: none; }
  #wemd .wemd-divider .wemd-component-body::before,
  #wemd .wemd-divider .wemd-component-body::after { content: none; }
  ```

**涉及文件**
- `packages/core/src/themes/components-storybook.ts`

**验证**
- 相关组件渲染测试断言无双条/无残留（`defaultThemeDomMatch.test.ts`）。

---

## 6. 主题私有骨架清空共享卡片样式

**现象**
- 用私有骨架重做 `magazine-cover` 后，封面外套了一圈共享卡片边框（border / padding / 圆角 / 居中）。

**根因**
- 共享 `.wemd-magazine-cover` 自带默认卡片样式，私有骨架 / 皮肤未清空。

**修复**
- 主题皮肤清空共享卡片样式，再定义自己的：
  ```css
  #wemd .wemd-magazine-cover {
    margin: 0 0 2.2em;
    padding: 0;
    background: transparent;
    border: none;
    border-radius: 0;
    box-shadow: none;
    text-align: left;
  }
  ```

**涉及文件**
- `packages/core/src/themes/components-storybook.ts`

**验证**
- 渲染测试断言封面根元素无 `border: 1px solid` 残留。

---

## 7. 公众号插入后首字下沉整体失效

**现象**
- 首字下沉在预览（浏览器）正常，但「复制到公众号」粘贴后，首字不再放大/浮动，退化成普通文字。

**根因**
- 骨架把首字 `<span class="wemd-sk-dropcap">` 放在正文 `<p>` 的**兄弟位置**（`<section><span>首字</span><p>正文</p></section>`）。
- 公众号编辑器对**段落内联的 `float`** 保留（`<p><span float>首字</span>正文…</p>`），但对**独立于段落外的浮动 span**（`<p>` 兄弟）会丢弃 float → 下沉失效。
- 对比正常排版示例：首字 span 一定内联在**同一段 `<p>` 开头**，文字紧随其后绕排。

**修复**
- 骨架把首字 span 内联进正文 `<p>` 开头（`<p class="wemd-sk-lead-body"><span class="wemd-sk-dropcap">雾</span>从海上…</p>`），与正常示例结构一致：
  ```html
  {{#if body}}<p class="wemd-sk-lead-body">{{#if dropcap}}<span class="wemd-sk-dropcap">{{slot:dropcap}}</span>{{/if}}{{slot:body}}</p>{{/if}}
  ```
- 相应 CSS：`.wemd-sk-lead-body` 即该 `<p>` 本身（不再用 `.wemd-sk-lead-body p` 后代选择器）。

**涉及文件**
- `packages/core/src/themes/templates-storybook.ts`
- `packages/core/src/themes/components-storybook.ts`

**验证**
- 「复制到公众号」粘贴到公众号模拟器，首字放大 + 两行下沉效果保留。

**通用结论**
- 凡是需要**段落首字下沉**的地方，首字 span 必须内联在正文 `<p>` 内部；公众号对段落外独立浮动元素不友好。
- 模板引擎**不支持嵌套 `{{#if}}`**：内层 `{{#if x}}...{{/if}}` 会以原文输出。首字 span 不包内层条件，直接始终渲染 `<span>{{slot:dropcap}}</span>`（槽为空时 span 为空，不占位）。

---

## 8. 公众号图片上叠文字必须用 background-image

**现象**
- 封面（图片上叠标题/副题）在预览正常，但「复制到公众号」发布后，文字所在区域被遮挡、只剩一半——文字掉到图片下方被裁掉。

**根因**
- 微信公众号编辑器会**删除 CSS `position` 属性**（absolute/relative 全失效）。封面用 `position: absolute` 把文字叠在图上、`img` 绝对定位铺满，一粘贴 position 被删 → 文字回落到图片下方的正常流，看起来像被遮挡。
- 这是微信的硬性限制，不是排版细节问题。

**修复**
- 改用**公众号原生支持的 `background-image`** 方案（135 / 秀米等编辑器封面同款）：
  1. 新增 `image-url` 槽位来源（`slotParsers.ts`），只提取首图 URL 不渲染 `<img>`；
  2. 封面容器 inline 写 `background-image: linear-gradient(底部压暗), url(图床URL)`（渐变叠在图上保证文字可读，渐变在最上层）；
  3. 文字放**正常流**，用 `padding: 46% 24px 28px` 的 `padding-top` 百分比压出图区、锚在底部；
  4. 完全不写 `position`。
  ```html
  <section class="wemd-sk-cover"
    style="background-image:linear-gradient(to top,rgba(15,10,7,.82) 0%,rgba(15,10,7,.06) 100%),url(图床URL);
           background-size:cover,cover;background-position:center,center;background-repeat:no-repeat;">
    <h2 class="wemd-sk-heading">标题</h2>
    <p class="wemd-sk-subtitle">副题</p>
  </section>
  ```
  ```css
  #wemd .wemd-magazine-cover .wemd-sk-cover {
    padding: 46% 24px 28px;   /* padding-top 百分比 = 图区高度（相对容器宽度），background cover 铺满 */
    border-radius: 6px;
    overflow: hidden;
  }
  ```

**涉及文件**
- `packages/core/src/plugins/component/slotTypes.ts` / `slotParsers.ts`（新增 `image-url` 来源）
- `packages/core/src/themes/templates-storybook.ts` / `components-storybook.ts`
- `packages/core/src/themes/templates-shopping-guide.ts` / `components-shopping-guide.ts`

**验证**
- 「复制到公众号」粘贴，封面图片铺满、底部渐变 + 文字叠层保留（两链路一致）。

**通用结论**
- 凡是**图片上叠文字**（封面 / banner / hero），一律用 `background-image` + 渐变叠加 + 正常流文字；**禁止 `position` 叠字**，公众号会删。图片必须是有外链 URL（图床），本地路径无法作 background。
- **悬浮标签（如好物编号 / 价格签）同理**：不写 `position: absolute`。编号作为容器首个内联元素自然落在图片左上角；价格用 `text-align:right` 行锚在底部右下角；图区高度用 `padding-top` 百分比（`&nbsp;` 真实内容防删空元素 + `font-size:0` 隐形）。

---

## 排查速查表

| 现象 | 首查 |
|------|------|
| 封面图只占顶部、下方渐变空白 | 封面图 `height: 100% !important` 是否被 app 级 `#wemd img` 覆盖 |
| 首字下沉第三行仍缩进 | 正文是否包 `<p>`、行高是否定死；浮高是否落在"一行 < H < 两行" |
| 下沉字被裁切 / 微信错位 | 是否用了固定 px 浮高 + overflow hidden（应改 `line-height:1` + em 弹性浮高） |
| 预览下沉正常、公众号插入后失效 | 首字 float span 是否在正文 `<p>` 内联（不能是 `<p>` 兄弟） |
| 预览封面叠字正常、公众号发布后文字被遮挡 | 是否用了 `position` 叠字（公众号会删）→ 改 `background-image` + 渐变 + 正常流文字 |
| 封面图不显示 | 图片 URL 是否占位服务（换 trae 生成图）；background 方案需外链 URL |
| 组件出现双装饰（竖条/横线） | 是否中和共享 `::before/::after` |
| 私有骨架组件套了卡片边框 | 是否清空共享 `.wemd-*` 卡片样式 |

---

## 配套文档

- 方法论（四步走流程）：`docs/engineering/theme-craftsmanship-playbook.md`
- Bug 登记册：`docs/engineering/bug-registry.md`
- 单主题问题清单示例：`docs/engineering/eastern-notes-dev-issues.md`
