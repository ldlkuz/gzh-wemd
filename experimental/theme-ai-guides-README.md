# 各主题 AI 排版组件手册 · 项目文档

本文档记录"为每个主题写一份独立的 AI 排版组件手册"这项工作的约定与进度，避免后续忘记。**所有主题手册都以默认主题手册为底稿，在其基础上按主题的专属组件与风格改。**

## 背景与目的

公众号排版工具 wemd 内置了大量组件。原生 markdown 语法会自动适配一批组件（标题 / 引用 / 表格 / 代码块 / 分隔线 / 单图 / 多图），**这部分 AI 直接写 markdown 即可，不需要写 `:::`，也不写进手册**。

另一批是**纯 `:::` 组件**（必须用 `::: 组件id … :::` 包裹），AI 排版时若不知道语法、不知道有哪些可替换槽位，就会用错或漏用。为此为每个主题手写一份**独立的组件手册**，告诉 AI"这个主题有哪些特殊语法、每个长什么样、怎么替换内容"。

## 核心约定（务必遵守）

1. **每个主题一本独立 md**，文件名 `theme-ai-guide-<主题id>.md`，**运行时唯一来源在 `apps/web/public/theme-guides/theme-ai-guide-<id>.md`**（随 web 打包、由 rewriteAgent fetch）。
2. **原生 markdown 零提及细节**：开头/结尾一句话"直接写 markdown 自动适配"带过，不列举 `## > 表格 代码` 等，避免 AI 当枚举清单。
3. **每个主题手册必须自包含全部组件语法**：手册会被单独导出给 AI，AI 看不到"默认主题手册"。所以每份手册都要把该主题**所有**组件（专属 + 默认）完整写一遍，**禁止**写"其余组件遵守默认主题语法"这种引用——默认只存在于人脑记忆，不在 AI 看到的文件里。
4. **每类组件"一个示例块"**，示例用 `::: 组件id` ＋ 按真实槽位逐行展示槽位（占位带 `如…` 真实例子）＋ `:::`，让 AI 照抄替换。
5. **单槽组件写一行内容**（如 divider-fancy / share-card / follow-bar / tag-label / copyright-notice / qr-card），不要用多行占位卷复杂化。
6. **多槽 / 复杂组件按真实槽位排**，槽位来自 `packages/core/src/plugins/component/slotDefs.ts`（`slots`、`item_slots`、`input.source/cardinality`）与专用解析器注释。
7. **不写色系**：颜色由主题皮肤决定，AI 写色无用且会跑偏。
8. **风格用深描、不用数字禁令**（如"≤8个"曾反复被否决），靠"有依据、有正负对照"的风格描述让会设计的 AI 自己懂纪律。

## 组件三分法（判断该不该写进手册）

- **原生自动适配（不写进手册，AI 直接 markdown）**
  - `## 01 …`→numbered-heading、`## 标题`→section-title、` ``` `围栏→code-frame
  - `| 表格 |`→styled-table、`> 引用`→pullquote、`---`→divider、单图→image-card、多图→image-grid
- **dual（原生为主，`:::` 可选）**：styled-table / pullquote / divider / image-card / image-grid
- **纯 `:::`（必须包裹，宣言手册主体）**：见下方"默认主题全量基准清单"

## 默认主题全量基准清单（共 30 个纯 `:::` 组件）

> 默认主题手册 = 这份清单的标准示例。其他主题手册以它为底稿，删去本主题用不到的、按主题偏好增改示例。

- 封面/收束：`magazine-cover`、`hero-banner`、`end-card`
- 章节/结构：`section-divider`、`divider-fancy`、`article-section`、`toc-nav`
- 引用/提示：`quote-card`、`full-quote`、`callout-pro`、`callout`、`cta-card`
- 数据/列表/步骤：`stats-block`、`timeline`、`steps`、`two-column-cards`、`accordion`、`faq`、`resource-list`、`related-posts`
- 图片：`image-text-row`、`image-caption`、`image-compare`
- 品牌/人物/产品：`author-card`、`brand-sign`、`product-card`、`testimonial-card`
- 引导/收尾/系列：`share-card`、`follow-bar`、`qr-card`、`tag-label`、`copyright-notice`、`series-nav`

## 各主题衍生方式

其余主题手册**都从默认主题手册复制，然后**：

1. 改标题与顶部"风格深描"段（依据该主题 `theme .layout.tone` 与 meta 描述，不给色系）。
2. 删去该主题用不到的纯 `:::` 组件。
3. 若该主题 `preferredComponents` 里有默认手册未突出/未包含的组件（如 `stats-block`、`toc-nav`、`code-frame`、`image-card`、`section-divider` 等），补上该组件的标准示例并标注"本主题推荐优先用"。
4. 若主题有专属骨架 / 私有组件（见 `templates-<id>.ts`、`slotDefs-<id>.ts`），补充其专用语法示例。

各主题定义与 `preferredComponents` 出处：
`packages/core/src/builtin-themes/index.ts`（每套主题的 `layout.preferredComponents`）。

## 手册结构模板（统一）

```markdown
# <主题名> · AI 排版组件手册

> 风格：<一段深描，不含色系>。
>
> 原生 markdown 按你所熟悉的方式自由书写即可，系统会全部自动适配，无需任何专用语法。

<按上文分类，每个组件一个小节：用途 + ::: 标准示例块>

---

其余原生组件（普通标题、引用、表格、代码块、分隔线、单图、多图）直接写 markdown 即可自动适配，无需 :::。
```

## 主题改造进度（截至 2026-09-23）

> **当前状态：全部 18 个主题手册均已按"专属 + 全量默认自包含"基准完成。**

| 状态                  | 主题               | 说明                                                                                                     |
| --------------------- | ------------------ | -------------------------------------------------------------------------------------------------------- |
| ✅ 已完成（语法正确） | default            | `theme-ai-guide-default.md` —— 全量 30 组件基准版，作为所有后续主题底稿                                  |
| ✅ 已完成             | data-blueprint     | `theme-ai-guide-data-blueprint.md` —— 无专属骨架，全量默认并突出 stats-block/styled-table/code-frame     |
| ✅ 已完成             | modern-editorial   | `theme-ai-guide-modern-editorial.md` —— 专属 6 个（刊头/编辑号/栏线/大引语/编辑式引语/版权页）+ 全量默认 |
| ✅ 已改造             | eastern-notes      | `theme-ai-guide-eastern-notes.md` —— 专属组件单独列一节 + 全量默认自包含                                 |
| ✅ 已改造             | clear-guide        | `theme-ai-guide-clear-guide.md` —— 专属 3 个（magazine-cover/section-divider/divider）+ 全量默认         |
| ✅ 已改造             | whitespace-gallery | `theme-ai-guide-whitespace-gallery.md` —— 专属 4 个 + 全量默认                                           |
| ✅ 已改造             | academic-paper     | `theme-ai-guide-academic-paper.md` —— 专属 4 个 + 全量默认                                               |
| ✅ 已改造             | knowledge-base     | `theme-ai-guide-knowledge-base.md` —— 专属 4 个 + 全量默认                                               |
| ✅ 已改造             | luxury-gold        | `theme-ai-guide-luxury-gold.md` —— 专属 4 个 + 全量默认                                                  |
| ✅ 已改造             | morandi-forest     | `theme-ai-guide-morandi-forest.md` —— 专属 5 个 + 全量默认                                               |
| ✅ 已改造             | receipt            | `theme-ai-guide-receipt.md` —— 专属 4 个 + 全量默认                                                      |
| ✅ 已改造             | sunset-film        | `theme-ai-guide-sunset-film.md` —— 专属 4 个 + 全量默认                                                  |
| ✅ 已改造             | silent-keynote     | `theme-ai-guide-silent-keynote.md` —— 专属 5 个 + 全量默认                                               |
| ✅ 已改造             | storybook          | `theme-ai-guide-storybook.md` —— 专属 5 个 + 全量默认                                                    |
| ✅ 已改造             | shopping-guide     | `theme-ai-guide-shopping-guide.md` —— 专属 4 个 + 全量默认                                               |
| ✅ 已改造             | food-atlas         | `theme-ai-guide-food-atlas.md` —— 专属 4 个 + 全量默认                                                   |
| ✅ 已改造             | stay-notes         | `theme-ai-guide-stay-notes.md` —— 专属 4 个 + 全量默认                                                   |
| ✅ 已改造             | wanqing            | `theme-ai-guide-wanqing.md` —— 专属 5 个 + 全量默认                                                      |

## 复用提示

- 槽位契约源头：`packages/core/src/plugins/component/slotDefs.ts`
- 编辑器插入组件时自动生成的示例：`packages/core/src/plugins/component/slotSamples.ts`
- 人类版组件导出（UI「导出语法」用，已保留）：`packages/core/src/plugins/component/component-export.ts` 的 `exportThemeComponentGuide`

## 手册来源与接入状态

- **手册来源分两路，不再程序化生成**（`buildAIGuide` / `renderAIAgentComponent` 已删除）：
  - **内置主题**：手写手册唯一来源在 `apps/web/public/theme-guides/theme-ai-guide-<id>.md`（随 web 打包）。
  - **自定义/导入主题**：`ThemeDefinition` 新增 `guide?: string` 字段承载手写手册。
- **web rewriteAgent**：`apps/web/src/services/ai/rewriteAgent.ts` 的 `buildRewriteGuide` —— 内置主题 fetch public 手写手册，自定义主题读 `customDef.guide`；两者皆无时**抛错提示主题缺手册**，不静默降级。`knownIds` 扫描 `::: 组件id`（手写）与 `### 组件id` 两种格式。
- **server**：`apps/server` 的 `/themes/:id/guide` 通过 `loadHandwrittenGuide` 读 public 手写手册，缺册返回 404。server 仅服务内置主题；导入主题不带 server。
- **✅ 唯一来源**：内置主题手册只在 `apps/web/public/theme-guides/`。**改内置主题手册只改这一处。**
- **改自定义主题手册**：在其主题定义（ThemeDefinition）里填 `guide` 字段。
