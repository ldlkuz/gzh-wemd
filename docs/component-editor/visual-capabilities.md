# 组件可视化编辑器 · 能做什么 & 现有代码怎么支持

> 本文只回答两件事：**① 可视化编辑器可以实现哪些功能；② 每一项由现有代码的哪一部分支撑。**
> **不写编辑器自身的实现逻辑**（界面、交互、状态管理都不在这份文档里）。
>
> **证据口径**：每条结论都标注来源。标「**已确认**」的，是在**运行中的代码路径**上读到的；
> 标「**待确认**」的，是还没读到、不靠类型推断下结论的。凡涉及"能不能"的问题，只认机制，不认类型声明。

---

## 摘要：编辑器成立的前提

**可以给主题加槽位，而且这是现行机制，不是待开发的能力。**

- `ThemeDefinition.slotDefs` 是一等字段，**7 个内置主题已经在用**（黑金奢华 / 无声发布 / 故事集 / 购物指南 / 美食图谱 / 民宿手记 / 晚晴）—— `packages/core/src/builtin-themes/index.ts`
- 解析器的原话是"优先返回**当前主题包 slotDefs** 中的追加槽位" —— `packages/core/src/MarkdownParser.ts:54`、`packages/core/src/plugins/markdown-it-component.ts:46`
- 渲染器的原话是"**内置主题与 AI 生成主题共用 `ThemeDefinition.slotDefs`**" —— `packages/core/src/theme-renderer/index.ts:105-111`
- 手册导出会"**+ 主题 slotDefs（主题扩展槽）合并**" —— `packages/core/src/plugins/component/component-export.ts:9`

**所以编辑器真正的边界不是"能不能加槽位"，而是下面第三节列的那几条。**

---

## 一、编辑器能做什么

按"可编辑面"分六组。每条都对应一个**数据落点**（写进主题包里的哪个字段）。

### 1. 主题声明（meta）

| 可视化功能                        | 数据落点                              | 状态                                             |
| --------------------------------- | ------------------------------------- | ------------------------------------------------ |
| 编辑主题名 / 唯一 id / 一句话描述 | `manifest.meta.{id,name,description}` | 已确认（`theme-schema/types.ts` 的 `ThemeMeta`） |

### 2. 设计令牌（tokens）—— 表单控件即可覆盖

| 可视化功能                                                                        | 数据落点                                     | 状态   |
| --------------------------------------------------------------------------------- | -------------------------------------------- | ------ |
| 主色 / 主色深 / 主色浅 / 边框色 / 柔和边框色                                      | `tokens.color`（`ColorTokens`）              | 已确认 |
| 正文字族 / 字号 / 行高 / 代码字体族                                               | `tokens.typography`（`TypographyTokens`）    | 已确认 |
| **h1–h4 分别**：字号 / 颜色 / 上边距 / 下边距 / 字重 / 预设样式 / 是否居中 / 字距 | `tokens.typography.h1..h4`（`HeadingToken`） | 已确认 |
| 页面内边距 / 段落间距                                                             | `tokens.spacing`（`SpacingTokens`）          | 已确认 |
| 通用圆角                                                                          | `tokens.border.radius`（`BorderTokens`）     | 已确认 |
| 阴影开关 + 阴影值                                                                 | `tokens.shadow`（`ShadowTokens`）            | 已确认 |

> 这一组是"全局换肤"，控件成熟、风险最低。

### 3. 组件皮肤（每个组件的视觉覆盖）

| 可视化功能                                                              | 数据落点                         | 状态                                              |
| ----------------------------------------------------------------------- | -------------------------------- | ------------------------------------------------- |
| 每个组件是否启用                                                        | `components.<id>.enabled`        | 已确认（注释："false = AI 不推荐，但渲染不报错"） |
| 选一个**预设变体**（如 share-card 的 warm / minimal / tech）            | `components.<id>.variant`        | 已确认（`ComponentStyleOverride`）                |
| 覆盖少量 CSS 声明（精细化控制）                                         | `components.<id>.overrides`      | 已确认                                            |
| 自定义造型 CSS（**轨道 B**）                                            | `components.<id>.variantCss`     | 已确认                                            |
| 自由 CSS（**轨道 C**，渲染前经 `CssTranslator` 翻译成 WeMD 标准选择器） | `components.<id>.variantCssFree` | 已确认                                            |

> ⚠️ **变体机制、AI 自定义造型、自由 CSS 翻译这三条轨道早已存在**，不是待建能力。
> 所以"编辑器要暴露哪几条轨道、各配什么交互"才是需要设计的部分。

### 4. 组件骨架（结构）

| 可视化功能                                    | 数据落点                                                                              | 状态                                                                    |
| --------------------------------------------- | ------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| 编排某个组件的**结构**（槽位顺序 + 装饰元素） | `manifest.templates.<组件id>`（Mustache HTML），或 zip 里的 `templates/<组件id>.html` | 已确认（`themePackageLoader` 的 `templates: Map<componentId, string>`） |

> ⚠️ 两条硬限制（见第三节）：模板引擎**不支持嵌套 `{{#if}}`**；装饰必须是**真元素**。

### 5. 主题扩展槽（slotDefs）—— 编辑器最有价值的一层

| 可视化功能                   | 数据落点                                                                               | 状态                                                              |
| ---------------------------- | -------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| 给任意**合法组件**追加槽位   | `manifest.slotDefs.<组件id>: SlotDef[]`                                                | 已确认（validator 已知字段白名单含 `slotDefs`；7 个内置主题在用） |
| 槽位的键名 / 语义 / 是否必填 | `SlotDef.{key, semantic, required?}`                                                   | 已确认（`plugins/component/slotTypes.ts`）                        |
| 槽位的内容形态（6 种）       | `SlotDef.type` ∈ `text / image / list / number / code / decorative`                    | 已确认                                                            |
| 槽位的输入来源               | `SlotDef.source`（`paragraph / strong / list / image / …`）                            | **枚举未读全，待确认**                                            |
| 槽位的 CSS class 前缀        | 由组件的 `abbr` 决定：`wemd-<abbr>-<key>`（如 quote-card abbr=`qc` → `wemd-qc-quote`） | 已确认（`slotTypes.ts` 注释）                                     |

> **`abbr` 必给**，否则槽位的 class 生成不出来 —— 这是编辑器必须一并处理的具体细节。

### 6. 版式与资源

| 可视化功能            | 数据落点                                          | 状态                          |
| --------------------- | ------------------------------------------------- | ----------------------------- |
| 版式参数              | `manifest.layout`                                 | **字段未读到，待确认**        |
| 图片类装饰 / 背景图   | `manifest.assets.images`（key → base64 data URL） | 已确认                        |
| 品牌落款文字 / 预览图 | `manifest.brand` / `manifest.preview`             | 已确认（loader 返回结构里有） |

---

## 二、现有代码是怎么支持的

按"编辑 → 生效"的链路，逐段列出支撑代码。

### 2.1 输出格式：程序已经在吃的主题包

| 能力                                                            | 支撑代码                                                                                 |
| --------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| 三个导入入口：`.wemd-theme`(zip) / `.json` manifest / 粘贴 JSON | `packages/core/src/theme-registry/themePackageLoader.ts`（头注释第 1–12 行）             |
| 包内结构：manifest + `templates/*.html` + CSS + 资源            | 同上，`LoadedThemePackage`（第 30–39 行）                                                |
| 往返能力（"导出时往返"）                                        | 同上，`rawZip?: Uint8Array`                                                              |
| 程序侧反向生成 manifest                                         | `apps/web/src/store/themeStore.ts:542`                                                   |
| 导入处理                                                        | `apps/web/src/store/themeStore.ts:669-695`（zip / JSON → loader → 校验 → 合并 → 建主题） |

### 2.2 渲染链路（编辑器预览可以直接复用）

| 能力                                 | 支撑代码                                                                              |
| ------------------------------------ | ------------------------------------------------------------------------------------- |
| 主题 → 完整 CSS                      | `renderTheme(...)`（含轨道 B 的 `variantCss` + components.css）                       |
| 取某主题的有效骨架                   | `getThemeTemplates(themeDefinition)`                                                  |
| 取某主题的有效槽位                   | `getThemeSlotDefs(themeDefinition)`（`theme-renderer/index.ts:105-111`）              |
| 组件 → 骨架选择的优先级              | `plugins/component/defaultTemplates.ts`：精编模板优先 → 否则按 `slotDefs` 生成 → 兜底 |
| 槽位解析与输入契约                   | `plugins/component/slotParsers.ts`、`plugins/component/slotDefs.ts`（共享槽）         |
| 扩展槽与共享 desc 的优先级           | `mergeSlotOverrides`：**扩展槽排在共享 desc 之前解析**（避免内容被兜底吞掉）          |
| 骨架差异 → AI 可读的组件用法         | `plugins/component/skeletonSlotMap.ts`（"弥补 slotDefs 未覆盖的骨架差异"）            |
| 渲染服务与 Web / Electron 预览同管线 | `packages/core/src/render-server.ts:8,46`                                             |

> **关键点**：`@wemd/core` 是**纯函数、无 DOM 副作用**（loader 头注释明写"可被 core / 检测网页 / apps/web 薄封装复用"）
> → 编辑器可以在浏览器里直接复用**同一套渲染管线**，预览所见 = 程序里所见 = 粘到公众号的结果。

### 2.3 校验链路（可以直接当编辑器的实时护栏）

| 能力                                                                                   | 支撑代码                                              |
| -------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| manifest 整体校验 + 已知字段白名单（含 `slotDefs` / `templates` / `layout` / `guide`） | `theme-registry/ThemeValidator.ts:1023-1031`          |
| 组件必须在 `LEGAL_COMPONENTS` 内                                                       | 同上 `:530`（未知组件直接报错）                       |
| 微信合规：结构性伪类 ✗ / 外链 ✗ / 禁用标签 ✗ / 伪元素 ✗                                | 同上 + `wechatCompat/whitelist`                       |
| SVG 安全扫描                                                                           | `theme-registry/ThemeValidator.ts` 的 `scanSvgSafety` |

### 2.4 手册与 AI 侧

| 能力                             | 支撑代码                                                                             |
| -------------------------------- | ------------------------------------------------------------------------------------ |
| 主题手册导出时**合并主题扩展槽** | `plugins/component/component-export.ts:9`（"示例来自 `getComponentSampleMarkdown`"） |
| 手册接口                         | `GET /themes/:id/guide`（MCP 里的 `get_theme_guide`）                                |
| 编辑器产物能否被写作者/AI 看见   | 只要扩展槽进了手册，**写文章的人与 AI 就能发现它的语法**（同上）                     |
| 交付前自检                       | MCP 的 `check_markdown`：目前只做**组件级**未识别检测                                |

### 2.5 一处**现成的先例**（也是当前的真实卡点）

`apps/web/src/store/themeStore.ts:689-695` 有一段注释值得直接照做：

> 主题骨架模板：loader 把 zip 的 `templates/*.html` 提取到 `pkg.templates`（Map），**但不会写回 manifest**。
> 若不合并，渲染器 `getThemeTemplates(themeDefinition)` 取不到，会回退到内置默认骨架，导致主题自定义骨架不生效。

它随后**显式合并回 manifest**：

```ts
manifest.templates = manifest.templates ?? {};
for (const [id, tpl] of pkg.templates) manifest.templates[id] = tpl;
```

**对照 `slotDefs`：这一步只对 `templates` 做了，`slotDefs` 没有。**

但另有一条更省的路：`manifest` 对象在导入处理器里是**整体保留**的（`const manifest = pkg.manifest` → 之后直接 `renderTheme(manifest, …)`），
而所有下游统一读 `getThemeSlotDefs(themeDefinition)` —— **所以只要把 `slotDefs` 写进 `manifest` 本体，链路就自动生效**。
（最后一跳"manifest → themeDefinition"是否整体保留，见第四节待确认项。）

---

## 三、硬边界：做不了什么

| 边界                                                                                                | 依据                                                     |
| --------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| **不能新增组件类型** —— 只能编辑 `LEGAL_COMPONENTS` 那一套                                          | `ThemeValidator.ts:530`：`"${key}" 不是合法组件类型`     |
| **不能发明新的 `source` / `SlotType`** —— 枚举固定                                                  | `plugins/component/slotTypes.ts:13-19`、`:22-46`         |
| **模板不支持嵌套 `{{#if}}`** —— 骨架只能单层条件                                                    | 主题骨架实际约束（写嵌套会原文输出）                     |
| **不能自由 HTML/CSS** —— 伪元素 / 结构性伪类 / 外链 / 禁用标签一律拦掉                              | `wechatCompat/whitelist` + `ThemeValidator`              |
| 例外：**轨道 C（`variantCssFree`）允许自由 CSS**，但必须先经 `CssTranslator` 翻译为 WeMD 标准选择器 | `theme-schema/types.ts` 的 `ComponentStyleOverride` 注释 |

---

## 四、待确认（动手前必须先钉死）

| #   | 待确认项                                                               | 为什么要紧                                                                             |
| --- | ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| 1   | `SlotDef.source` 的**完整枚举**                                        | 决定编辑器能给几种"输入来源"控件                                                       |
| 2   | `manifest.layout` 的**字段清单**                                       | 决定版式面板能做多少                                                                   |
| 3   | `slotDefs` 是否已在 **`ThemePackageManifest` 的 TS 类型**里            | validator 放行只证明**格式接受**；若类型里没有，编辑器导出时会 TS 报错（运行时却能用） |
| 4   | `manifest → themeDefinition` 最后一跳是否**整体保留**（含 `slotDefs`） | 决定"写进 manifest 即自动生效"是否成立                                                 |
| 5   | 导入时是否需要**像 `templates` 那样补一步合并** `slotDefs`             | 决定"独立 slotDefs 文件"这种打包方式要不要支持                                         |
| 6   | `check_markdown` 的**槽位级**反馈（声明了槽却没吃到内容）              | 后续增强点，当前是盲区                                                                 |

---

## 五、关键文件索引

| 用途                                         | 文件                                                                |
| -------------------------------------------- | ------------------------------------------------------------------- |
| 主题包 schema（meta / tokens / 组件覆盖）    | `packages/core/src/theme-schema/types.ts`                           |
| 槽位类型与输入契约                           | `packages/core/src/plugins/component/slotTypes.ts`                  |
| 包校验（字段白名单 / 组件合法性 / 微信合规） | `packages/core/src/theme-registry/ThemeValidator.ts`                |
| 包加载（三个入口 / 返回结构 / 往返）         | `packages/core/src/theme-registry/themePackageLoader.ts`            |
| 主题 → 骨架与槽位                            | `packages/core/src/theme-renderer/index.ts`                         |
| 骨架选择与生成                               | `packages/core/src/plugins/component/defaultTemplates.ts`           |
| 槽位解析与共享槽                             | `packages/core/src/plugins/component/slotParsers.ts`、`slotDefs.ts` |
| 扩展槽优先级                                 | `mergeSlotOverrides`（见 `slotOverrides.test.ts`）                  |
| 手册导出（合并主题扩展槽）                   | `packages/core/src/plugins/component/component-export.ts`           |
| 导入 / 导出（应用侧）                        | `apps/web/src/store/themeStore.ts`                                  |
| 渲染服务（与预览同管线）                     | `packages/core/src/render-server.ts`                                |
