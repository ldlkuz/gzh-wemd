::: magazine-cover
WeMD 组件完整示范
A COMPLETE GUIDE TO EVERY COMPONENT
---
从封面到结尾，用一篇文章认识 WeMD 的全部组件
:::

`magazine-cover`（杂志封面，杂志层）文章的开篇封面，承载主标题、英文副标题与导读。每个主题都为此组件定制了专属签名骨架——切换主题即可看到封面风格的完整变化。

> 这是 `pullquote` 组件（原生块引用）：用于单行引语强调。本文用一篇连贯的文章完整展示 WeMD 全部组件——基础层组件使用原生 Markdown（渲染端自动识别并套用主题皮肤），杂志层与固定功能块使用 `:::` 标记。每个组件上方都标注了名称、属组与用途。

---

## 01 开场与导航

### section-title 组件

`section-title`（章标题，基础层·原生 `##`）用于给段落划分章节，强调主题。下面这个一级标题背后，正式加载的主题会把它装饰成章节标。

### hero-banner 组件

`hero-banner`（头图横幅，杂志层）通栏横幅，通常放在文章顶部，承载主副标题与导读：

::: hero-banner
**设计之美 · 全组件一次看完**

从封面到结尾，用一篇文章认识 WeMD 的 44 个组件

_示范文章_
:::

### toc-nav 组件

`toc-nav`（目录导航，杂志层）自动整理章节索引，方便读者跳转：

::: toc-nav
目录

- 开场与导航
- 章节与标题
- 卡片与容器
- 数据与信息
- 交互与引导
- 代码与分割
- 结尾与版权
:::

### section-divider 组件

`section-divider`（章节分隔，杂志层）在大章节之间插入醒目的过渡条：

::: section-divider
PART 01
开场与导航
:::

### divider 组件

`divider`（分割线，基础层·原生 `---`）用于段落之间的轻量分隔，上面就是它——一条不带文案的细分隔线。

---

## 02 章节与标题

### numbered-heading 组件

`numbered-heading`（编号标题，基础层·原生 `## 序号 标题`）让章节标题自动带编号：

## 01 为什么需要组件系统

### section-title 组件

再放大一个 `section-title`：当你写普通二级标题时，主题会自动识别并装饰：

## 组件让内容更有结构

### pullquote 组件

`pullquote`（引语，基础层·原生 `>`）用整行引用突出金句，适合放在段首或段尾：

> 形式追随功能，但功能也需要形式的温度。

---

## 03 卡片与容器

### text-card 组件

`text-card`（正文卡片，杂志层）把长段落收进卡片，缓解文字墙的压迫感：

::: text-card
组件系统把内容拆解成独立的语义单元，每个单元有自己的视觉语言和交互意图。一篇文章不再是密密麻麻的文字墙，而是由卡片、引言、时间线、数据块等元素拼装而成的信息建筑。

好的组件设计应当像乐高积木：单独看每块都有意义，组合起来又能搭建出无限可能。
:::

### quote-card 组件

`quote-card`（人物引言卡，杂志层）带署名的人物引言：

::: quote-card{author="设计师箴言"}
约束是创造力的朋友，而非敌人。
:::

### full-quote 组件

`full-quote`（整段引言，杂志层）比极简 pullquote 更完整、占位更大：

::: full-quote
愿每一次创作，都既有结构的力量，也有想象的自由。
:::

### two-column-cards 组件

`two-column-cards`（双栏卡片，杂志层）把两条并列信息并排展示：

::: two-column-cards

- 🎨
  **色彩系统**
  14 色调色板，从主色到文字色层层递进
- 📐
  **排版系统**
  字号、行高、字距、标题层级，统一节奏
:::

### image-card 组件

`image-card`（单图卡片，基础层·原生独占一张图）放一张大图，渲染端识别单张独占图片自动套卡：

![](https://picsum.photos/seed/wemd-design-01/800/450)

### image-grid 组件

`image-grid`（图片网格，基础层·原生连续多张图）多张图片并排，识别连续独占图片行自动套网格（注意两图间不要留空行）：

![](https://picsum.photos/seed/wemd-grid-a/400/300)
![](https://picsum.photos/seed/wemd-grid-b/400/300)

### image-text-row 组件

`image-text-row`（图文横排，杂志层）图片与文字左右排布，信息更紧凑：

::: image-text-row
![](https://picsum.photos/seed/wemd-row-01/400/280)

图文横排让信息更紧凑，适合产品介绍和场景说明。读者无需上下滚动，一眼就能把图片和文字对应起来。
:::

### image-caption 组件

`image-caption`（图注，杂志层）为图片搭配说明文字：

::: image-caption
![](https://picsum.photos/seed/wemd-caption-01/800/400)

_摄于 2026 年盛夏，海边日落 — 光影是天然的调色师。_
:::

### image-compare 组件

`image-compare`（前后对比，杂志层）并排对比两张图，适合"修改前/后"场景：

::: image-compare
![](https://picsum.photos/seed/wemd-compare-before/400/300)

![](https://picsum.photos/seed/wemd-compare-after/400/300)

修改前 · 修改后
:::

---

## 04 数据与信息

### stats-block 组件

`stats-block`（数据统计，杂志层）用图标列表呈现核心指标：

::: stats-block
核心数据

- 组件总数
  **44**
- 原型分组
  **7**
- 色彩变量
  **14**
- CSS 变量
  **31**
:::

### styled-table 组件

`styled-table`（数据表格，基础层·原生表格）用原生 Markdown 表格即可，主题自动加条纹与边框：

| 分组        | 组件数 | 设计重点             |
| ----------- | ------ | -------------------- |
| signature   | 4      | 品牌渐变、Logo 放置  |
| heading     | 4      | 标题层级、编号样式   |
| container   | 10     | 卡片框架、内容排版   |
| data        | 9      | 数据展示、表格条纹   |
| interactive | 6      | 交互提示、展开指示器 |
| code        | 2      | 代码背景、语法高亮   |
| divider     | 9      | 分割线、引用块装饰   |

多写一张原生表格，同样会自动识别为 `styled-table`：

| 组件        | 类型        | 说明     |
| ----------- | ----------- | -------- |
| hero-banner | Hero        | 顶部头图 |
| stats-block | Data        | 数据统计 |
| callout     | Interactive | 提示框   |

### timeline 组件

`timeline`（时间线，杂志层）用竖线时间轴呈现发展历程：

::: timeline
产品发展历程

- **2024-01** 项目立项，确定技术方向
- **2024-06** v1.0 正式发布，覆盖 33 个组件
- **2025-01** 用户突破 10 万，新增杂志级组件
- **2026-08** 组件总数达到 44 个，支持完整主题包
:::

### resource-list 组件

`resource-list`（资料清单，杂志层）罗列配套资料或附件：

::: resource-list
配套资料包

- 📄 组件设计规范 PDF
- 🎨 色彩变量速查表
- 💻 主题模板代码包
- 📐 排版间距参考图
:::

---

## 05 交互与引导

### callout 组件

`callout`（提示框，基础层·杂志层）用图标引导读者注意重点：

::: callout
**小提示**

组件不是越多越好，选择最适合内容的那几个，比堆砌所有组件更有效。
:::

### callout-pro 组件

`callout-pro`（进阶提示框，杂志层）带类型与标题，适合区分 tip/warning：

::: callout-pro{type="tip"}
**使用建议**

- signature 组适合放在文章开头和结尾
- data 组适合穿插在论述段落之间
- interactive 组适合教程和问答类内容
:::

### steps 组件

`steps`（分步引导，基础层·原生有序列表？否，杂志层）一步一步引导操作：

::: steps
操作三步走

1. **选择组件** — 根据内容意图挑选合适的组件类型
2. **填充内容** — 用 Markdown 语法写入组件 body
3. **应用主题** — 导入主题包，组件自动获得品牌化样式
:::

### faq 组件

`faq`（问答折叠，基础层·杂志层）带标题的常见问题块：

::: faq{title="常见问题"}
**组件支持嵌套吗？**

支持。组件内部可以嵌套任意 Markdown 内容，包括其他组件。

**如何自定义组件样式？**

在主题包中为对应组件编写 variantCss，选择器格式为 `.wemd-{组件名}[data-variant="xxx"]`。

**44 个组件都要用吗？**

不需要。按需选择，一篇文章通常使用 8-12 个组件就足够了。
:::

### accordion 组件

`accordion`（折叠面板，杂志层）可逐项展开的手风琴：

::: accordion
**折叠面板一：什么是组件系统？**

组件系统是一种内容组织方式，把文章拆解成独立的语义单元，每个单元有自己的视觉语言。它让内容创作更像搭积木，而不是写流水账。

**折叠面板二：如何选择合适的组件？**

根据内容意图选择：要讲故事用 timeline，要展示数据用 stats-block，要引导行动用 cta-card。组件的 semantic 和 intent 字段可以帮助判断。

**折叠面板三：主题包如何工作？**

主题包包含一套完整的设计语言（色彩、排版、间距）和每个组件的 variantCss。导入后，主程序会把组件 HTML 和主题 CSS 组合渲染出最终样式。
:::

### cta-card 组件

`cta-card`（行动召唤，杂志层）引导用户点击的行动卡片：

::: cta-card
**立即体验 WeMD 设计系统**

44 个组件 · 14 色调色板 · 一键导入主题

点击下方按钮，开启你的专业排版之旅
:::

### share-card 组件

`share-card`（分享提醒，杂志层）鼓励读者转发：

::: share-card
如果这篇文章对你有帮助，欢迎分享给更多需要的朋友。
:::

### qr-card 组件

`qr-card`（二维码卡片，杂志层）放公众号二维码等引导关注：

::: qr-card
![](https://picsum.photos/seed/wemd-qr-01/200/200)

扫码关注公众号

获取更多设计干货和主题更新
:::

### related-posts 组件

`related-posts`（延伸阅读，杂志层）推荐相关文章链接：

::: related-posts
延伸阅读

- [组件设计原则：少即是多](#)
- [色彩系统的构建逻辑](#)
- [从 Markdown 到公众号排版](#)
:::

### series-nav 组件

`series-nav`（系列导航，杂志层）标记当前所属系列与进度：

::: series-nav
设计系统从 0 到 1

- 第一篇：为什么需要设计系统 ✓
- 第二篇：色彩与排版基础 ✓
- 第三篇：组件系统全览 ← 当前
- 第四篇：主题包的构建与导出
:::

### tag-label 组件

`tag-label`（标签行，杂志层·行内）给文章打标签，独占一行：

::: tag-label #设计系统 #公众号排版 #组件化 #WeMD
:::

---

## 06 代码与分割

### code-frame 组件

`code-frame`（代码块，基础层·原生围栏代码）用原生代码栅栏，主题自动加深色底与高亮：

```js
// 主题包结构示例
const theme = {
  meta: { id: "my-theme", name: "我的主题" },
  tokens: {
    color: { primary: "#fe2c55" },
    typography: { fontFamily: "sans-serif" },
  },
  components: {
    "hero-banner": {
      enabled: true,
      variant: "my-style",
      variantCss: ".wemd-hero-banner[data-variant='my-style'] { ... }",
    },
  },
};
```

### divider-fancy 组件

`divider-fancy`（装饰分割线，杂志层）比基础 `divider` 更有装饰感：

::: divider-fancy
:::

### divider 组件

`divider`（分割线，基础层·原生 `---`）再次出现，用于文末轻量分隔：

---

## 07 结尾与版权

### author-card 组件

`author-card`（作者卡，杂志层）展示文章作者信息：

::: author-card
![](https://picsum.photos/seed/wemd-author-01/200/200)

**WeMD Team** _设计工程师_

专注公众号排版与内容设计系统，让每一篇文章都有专业的视觉表达。
:::

### testimonial-card 组件

`testimonial-card`（用户证言，杂志层）展示用户评价：

::: testimonial-card
![](https://picsum.photos/seed/wemd-test-avatar/200/200)

**李明** · 产品经理 · 字节跳动

这套组件系统让我们的内容团队效率提升了 3 倍，排版终于不再是个体力活。
:::

### product-card 组件

`product-card`（产品卡，杂志层）呈现产品价格与卖点：

::: product-card
![](https://picsum.photos/seed/wemd-product-01/400/300)

**WeMD Pro 主题包**

专业版主题，含 44 个组件定制样式

¥99 ~~¥199~~ ⭐4.9

立即购买 | 限时特惠
:::

### article-section 组件

`article-section`（正文段落槽位，杂志层）从原文提取指定段落，保持原文结构：

::: article-section

> 这是文章正文段落引用槽位。article-section 组件用于从原文中提取指定范围的段落，保持原文的排版结构。适合长文章中需要引用大段原文的场景。

当你读到这里，说明已经看完了全部 44 个组件的示范。每个组件都有自己独特的视觉语言和用途，组合在一起就构成了一篇结构清晰、视觉丰富的公众号文章。
:::

### brand-sign 组件

`brand-sign`（品牌落款，杂志层）文末品牌签名：

::: brand-sign
**WeMD** · 让排版更优雅

激发创造，丰富生活
:::

### end-card 组件

`end-card`（结尾卡，杂志层）文章收尾的结语卡片：

::: end-card
Thanks

感谢阅读 · 期待下次相遇

✦
:::

### copyright-notice 组件

`copyright-notice`（版权声明，杂志层）文末版权信息：

::: copyright-notice
© 2026 WeMD Team. 保留所有权利。

本文使用的主题由 WeMD Theme Designer 自动生成。
:::

### follow-bar 组件

`follow-bar`（关注引导条，固定功能块·行内）文中或文末引导关注公众号：

::: follow-bar
点击上方蓝字关注我们，每周获取设计干货

:::