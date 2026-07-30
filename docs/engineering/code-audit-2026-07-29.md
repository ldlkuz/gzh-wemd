# 代码审计报告（2026-07-29）

> 全面检查项目代码逻辑一致性，覆盖术语残留、AI 排版链路、组件系统、主题系统四个维度。
>
> **更新记录**：
>
> - 2026-07-30 完成 P0/P1/P2 级问题修复，详见各问题「修复状态」标注。
> - 2026-07-31 修正报告误判：原「default 主题主色漂移 #047857→#07c160」为误判（#047857 实为 clear-guide 主题的 primaryDark，非 default 主题的 primary，default 一直是 #07c160）。将若干「设计对齐/增强」从 bug 定性中剥离，避免误导后续维护。

---

## 修复状态汇总

| 优先级 | 总数 | 已修复 | 未修复（重构/低优先级）   |
| ------ | ---- | ------ | ------------------------- |
| P0     | 4    | 4      | 0                         |
| P1     | 3    | 2      | 1（双轨架构，待讨论）     |
| P2     | 8    | 5      | 3（低优先级，可计划修复） |

---

## 一、术语残留检查

### 需要修复的残留

| 优先级 | 文件                                                                                             | 行号         | 问题                                                                      | 建议                                                                         | 修复状态  |
| ------ | ------------------------------------------------------------------------------------------------ | ------------ | ------------------------------------------------------------------------- | ---------------------------------------------------------------------------- | --------- |
| **高** | [analysisAgent.ts](file:///e:/11自动工作流/wd/apps/web/src/services/ai/analysisAgent.ts#L133)    | 133          | prompt 仍向 AI 发送 `magazineLevel`（杂志化等级）和 `designLanguage` 指令 | 移除"杂志化等级"行，将"designLanguage 应与之匹配"改为"design 字段应与之协调" | ✅ 已修复 |
| **中** | [theme-schema/types.ts](file:///e:/11自动工作流/wd/packages/core/src/theme-schema/types.ts#L152) | 152          | `LayoutPreference.magazineLevel` 必填且未标 @deprecated                   | 改为可选 `magazineLevel?` 并加 @deprecated                                   | ✅ 已修复 |
| **中** | [builtin-themes/index.ts](file:///e:/11自动工作流/wd/packages/core/src/builtin-themes/index.ts)  | 105 等 12 处 | 12 套主题被迫填写 magazineLevel                                           | 类型改可选后逐步清理                                                         | ✅ 已修复 |
| **低** | [templatePrompt.ts](file:///e:/11自动工作流/wd/apps/web/src/services/template/templatePrompt.ts) | 54, 135, 143 | 函数名 `buildComplexityHint` 遗留旧术语，逻辑已是 designGoal              | 重命名为 `buildDesignGoalHint` / `designGoalHint`                            | ✅ 已修复 |

### 兼容性保留（无需修复）

- `template/types.ts:66` — TemplateJSON.magazineLevel（@deprecated 可选，旧模板兼容）
- `template/templateAgent.ts:47,75` — TemplateGenerationResult.magazineLevel（@deprecated + 解析容错）
- `template/templateAgent.test.ts:153,159` — v1.x 旧模板兼容测试
- `TemplateLayoutPanel.tsx` / `AiDesignPanel.tsx` — UI 仅对旧模板展示（有 `!isV2Template` 守卫）
- `renderer.ts:356,449` — JSDoc 迁移说明注释，无代码引用

---

## 二、AI 排版架构链路

### 严重问题

#### P0-1：designGoal 未注入到 AI plan prompt ✅ 已修复

**文件**：[analysisAgent.ts](file:///e:/11自动工作流/wd/apps/web/src/services/ai/analysisAgent.ts#L117)

**修复方式**：

- `buildPlanPrompt` 函数签名新增 `constraints?: DesignConstraints` 参数
- 新增 `goalHint` 变量，当 `constraints.designGoal !== "auto"` 时注入「设计目标（用户偏好，软建议）」提示
- `analyzeArticle` 调用时正确传递 `effectiveConstraints`
- 提示词中明确标注「主题约束优先于此偏好」，保持优先级清晰

#### P0-2：strategy 拼接逻辑 bug ✅ 已修复

**文件**：[analysisAgent.ts](file:///e:/11自动工作流/wd/apps/web/src/services/ai/analysisAgent.ts#L526)

**修复方式**：

- 外层条件改为 `effectiveConstraints.designGoal !== "auto"`，自动模式不显示设计目标
- 内层条件分支补齐 `"balanced"` 分支，显示「平衡设计」
- 修复前：`designGoal === "auto"` 时错误显示「信息密度」
- 修复后：`designGoal === "auto"` 时不显示；`designGoal === "balanced"` 时显示「平衡设计」

### 中等问题

| #   | 问题                                                                                                                               | 位置                                                                                              | 修复状态  |
| --- | ---------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | --------- |
| 1   | 类型定义位置分散：`DesignConstraints` 和 `Audience` 定义在 `analysisAgent.ts` 而非 `types.ts`，`templatePrompt.ts` 需跨目录 import | [analysisAgent.ts:35](file:///e:/11自动工作流/wd/apps/web/src/services/ai/analysisAgent.ts#L35)   | 🔄 未修复 |
| 2   | 兜底默认值 `designGoal: "balanced"` 与 UI 默认值 `"auto"` 不一致                                                                   | [analysisAgent.ts:466](file:///e:/11自动工作流/wd/apps/web/src/services/ai/analysisAgent.ts#L466) | ✅ 已修复 |

**P2-2 兜底默认值修复方式**：将 `effectiveConstraints` 推导时的兜底值从 `"balanced"` 改为 `"auto"`，与 UI 默认值对齐，避免 AI 接收到用户未表达过的偏好。

### 验证通过的环节

- `AiDesignPanel.tsx`：7 个读者画像 + 5 个设计目标 + 默认值 "auto" 全部正确
- `renderer.ts`：resolveVariant 正确映射 design intent，5 个新组件变体映射齐全
- `types.ts`：DesignIntent 接口完整，5 个新组件 Content 接口齐全
- `templatePrompt.ts`：Designer Review 自检逻辑**无条件注入**（已从 `buildDesignGoalHint` 提取为独立函数 `buildDesignerReviewHint`，避免在 `designGoal="auto"` 时丢失），theme.layout 信息正确注入

---

## 三、组件系统完整性

### 严重 Bug

#### P0：MAGAZINE_RENDERERS 键名拼写错误 ✅ 已修复

**文件**：[magazineRenderers.ts](file:///e:/11自动工作流/wd/packages/core/src/plugins/component/magazineRenderers.ts#L355)

**修复方式**：将 `fullQuote: renderFullQuote` 改为 `"full-quote": renderFullQuote`，与其他键的 kebab-case 命名一致。修复后 `MAGAZINE_RENDERERS["full-quote"]` 可正确返回渲染函数，整块主色背景 + 白字居中的视觉效果恢复。

### 中等问题

#### P1：8 个组件缺少 componentRenderer ✅ 已修复

**文件**：[componentRenderers.ts](file:///e:/11自动工作流/wd/apps/web/src/services/template/componentRenderers.ts)

**修复方式**：补齐 8 个组件的渲染函数，全部注册到 `componentRenderers` 映射表：

| 序号 | 组件名           | 渲染函数              |
| ---- | ---------------- | --------------------- |
| 1    | image-grid       | renderImageGrid       |
| 2    | author-card      | renderAuthorCard      |
| 3    | timeline         | renderTimeline        |
| 4    | related-posts    | renderRelatedPosts    |
| 5    | copyright-notice | renderCopyrightNotice |
| 6    | qr-card          | renderQrCard          |
| 7    | image-text-row   | renderImageTextRow    |
| 8    | image-caption    | renderImageCaption    |

修复后 `hasRenderer()` 对所有 35 个组件返回 true，`::: name{...}` 语法可正常转为 Markdown body。

### 五环节交叉对比总表（修复后）

| 组件名           | Manifest | componentRenderers | VARIANT_CSS | Toolbar | MAGAZINE_RENDERERS |
| ---------------- | :------: | :----------------: | :---------: | :-----: | :----------------: |
| brand-sign       |    ✓     |         ✓          |      ✓      |    ✓    |         ✓          |
| callout-pro      |    ✓     |         ✓          |      ✓      |    ✓    |         —          |
| cta-card         |    ✓     |         ✓          |      ✓      |    ✓    |         —          |
| divider-fancy    |    ✓     |         ✓          |      ✓      |    ✓    |         —          |
| end-card         |    ✓     |         ✓          |      ✓      |    ✓    |         ✓          |
| hero-banner      |    ✓     |         ✓          |      ✓      |    ✓    |         —          |
| product-card     |    ✓     |         ✓          |      ✓      |    ✓    |         ✓          |
| quote-card       |    ✓     |         ✓          |      ✓      |    ✓    |         —          |
| resource-list    |    ✓     |         ✓          |      ✓      |    ✓    |         ✓          |
| section-divider  |    ✓     |         ✓          |      ✓      |    ✓    |         ✓          |
| series-nav       |    ✓     |         ✓          |      ✓      |    ✓    |         ✓          |
| share-card       |    ✓     |         ✓          |      ✓      |    ✓    |         —          |
| testimonial-card |    ✓     |         ✓          |      ✓      |    ✓    |         ✓          |
| author-card      |    ✓     |         ✓          |      ✗      |    ✓    |         ✗          |
| code-frame       |    ✓     |         ✓          |      ✗      |    ✓    |         ✗          |
| copyright-notice |    ✓     |         ✓          |      ✗      |    ✓    |         ✗          |
| faq              |    ✓     |         ✓          |      ✗      |    ✓    |         ✗          |
| follow-bar       |    ✓     |         ✓          |      ✗      |    ✓    |         ✗          |
| full-quote       |    ✓     |         ✓          |      ✗      |    ✓    |         ✓          |
| image-caption    |    ✓     |         ✓          |      ✗      |    ✓    |         ✗          |
| image-card       |    ✓     |         ✓          |      ✗      |    ✓    |         ✓          |
| image-grid       |    ✓     |         ✓          |      ✗      |    ✓    |         ✗          |
| image-text-row   |    ✓     |         ✓          |      ✗      |    ✓    |         ✗          |
| magazine-cover   |    ✓     |         ✓          |      ✗      |    ✓    |         ✓          |
| numbered-heading |    ✓     |         ✓          |      ✗      |    ✓    |         ✗          |
| qr-card          |    ✓     |         ✓          |      ✗      |    ✓    |         ✗          |
| related-posts    |    ✓     |         ✓          |      ✗      |    ✓    |         ✗          |
| section-title    |    ✓     |         ✓          |      ✗      |    ✓    |         ✗          |
| stats-block      |    ✓     |         ✓          |      ✗      |    ✓    |         ✗          |
| styled-table     |    ✓     |         ✓          |      ✗      |    ✓    |         ✗          |
| tag-label        |    ✓     |         ✓          |      ✗      |    ✓    |         ✗          |
| text-card        |    ✓     |         ✓          |      ✗      |    ✓    |         ✗          |
| timeline         |    ✓     |         ✓          |      ✗      |    ✓    |         ✗          |
| toc-nav          |    ✓     |         ✓          |      ✗      |    ✓    |         ✗          |
| two-column-cards |    ✓     |         ✓          |      ✗      |    ✓    |         ✓          |

### 统计（修复后）

| 对比维度                | 数量    | 说明                                 |
| ----------------------- | ------- | ------------------------------------ |
| Manifest 总组件数       | 35      | 基准                                 |
| componentRenderers 覆盖 | 35 / 35 | ✅ 全覆盖（修复前 27 / 35）          |
| VARIANT_CSS_MAP 覆盖    | 13 / 35 | 部分为设计意图（基础组件无变体需求） |
| Toolbar 覆盖            | 35 / 35 | 完全一致                             |
| MAGAZINE_RENDERERS 覆盖 | 11 / 35 | ✅ 键名拼写已修复                    |

---

## 四、主题系统一致性

### 严重问题

#### P0：双轨架构——内置主题与结构化主题系统未打通

**文件对比**：

- [builtInThemes.ts](file:///e:/11自动工作流/wd/apps/web/src/store/themes/builtInThemes.ts)（运行时使用的内置主题列表）走的是 **Legacy CSS 路径**
- [builtin-themes/index.ts](file:///e:/11自动工作流/wd/packages/core/src/builtin-themes/index.ts)（结构化 ThemeDefinition）运行时**未被 web 端消费**

`builtInThemes.ts` 的每个主题 `css` 由 `buildThemeCss()` 生成（legacy CSS 拼接），`definition` 字段未设置。而 `themeStore.ts` 的 `getThemeCSS` 优先用 `builtIn.css`（legacy 产物），只有自定义主题且带 `definition` 时才走 `renderTheme(definition)`。

**后果**：

- `builtin-themes/index.ts` 中精心定义的 12 个 ThemeDefinition（含 `layout`/`components`/`tokens`）在运行时对内置主题**完全不起作用**
- 内置主题的 `layout` 字段运行时不可访问（`CustomTheme.definition` 为 `undefined`）
- Legacy CSS 主题（aurora-glass、bauhaus、cyberpunk-neon 等）在结构化定义中完全没有对应条目

**修复（2026-07-30 完成）**：

- `builtInThemes.ts` 全部改为 `renderTheme(getBuiltInThemeDefinition(id))` 生成 CSS
- 同时同源源生成 `definition` 字段，消除双轨不一致
- `theme-renderer/index.ts` 注入顺序对齐 legacy `buildThemeCss()`（组件默认样式在前、变体 CSS 在后，保证 variant 可覆盖默认）
- 额外清理：5 个隐身主题（aurora-glass/bauhaus/cyberpunk-neon/neo-brutalism/template）已删除，无需补结构化条目

### 中等问题

| #   | 问题                                                                            | 位置                                                                                                                                                                                                    | 修复状态                    |
| --- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- |
| 1   | `ComponentStyleOverride.overrides` 字段类型定义存在但 `injectVariantCss` 未消费 | [theme-schema/types.ts:136](file:///e:/11自动工作流/wd/packages/core/src/theme-schema/types.ts#L136) vs [theme-renderer/index.ts](file:///e:/11自动工作流/wd/packages/core/src/theme-renderer/index.ts) | ✅ 已修复                   |
| 2   | `DesignTokens.shadow` 字段类型定义存在但 `renderTokenCss` 未输出对应 CSS 变量   | [theme-schema/types.ts](file:///e:/11自动工作流/wd/packages/core/src/theme-schema/types.ts) vs [tokenCss.ts](file:///e:/11自动工作流/wd/packages/core/src/theme-renderer/tokenCss.ts)                   | ✅ 已修复                   |
| 3   | `validateThemeJson` 校验过松，仅检查 2 个字段，不校验 `layout` 子字段合法性     | [aiPrompts.ts:113](file:///e:/11自动工作流/wd/apps/web/src/services/ai/aiPrompts.ts#L113)                                                                                                               | ✅ 已修复                   |
| 4   | 内置主题无法导出（导入导出仅处理 `customThemes`）                               | [themeStore.ts:361](file:///e:/11自动工作流/wd/apps/web/src/store/themeStore.ts#L361)                                                                                                                   | 🔄 不修复（用户确认不需要） |
| 5   | 导入 v2 主题未调用 `validateThemeJson` 校验                                     | [themeStore.ts:462](file:///e:/11自动工作流/wd/apps/web/src/store/themeStore.ts#L462)                                                                                                                   | ✅ 已修复                   |
| 6   | `LayoutPreference.tone` 为开放 `string[]`，未用联合类型约束                     | [theme-schema/types.ts:150](file:///e:/11自动工作流/wd/packages/core/src/theme-schema/types.ts#L150)                                                                                                    | ✅ 已修复                   |
| 7   | 兜底默认值 `magazineLevel: "medium"` 在 `validateThemeJson` 中仍被补入          | [aiPrompts.ts:128](file:///e:/11自动工作流/wd/apps/web/src/services/ai/aiPrompts.ts#L128)                                                                                                               | ✅ 已修复                   |

**P2-1 overrides 消费修复方式**：`theme-renderer/index.ts` 的 `injectVariantCss` 在注入完所有变体 CSS 后，对 `components[type].overrides.enabled = true` 的组件追加细粒度 CSS 属性块（`#wemd .wemd-component[data-type="${type}"] { k: v; }`），camelCase 属性名自动转为 kebab-case。

**P2-5 tone 联合类型收紧修复方式**：

- `theme-schema/types.ts` 新增 `export type Tone = "warm" | "minimal" | "elegant" | "rational" | "serious" | "modern" | "playful"` + 运行时常量 `VALID_TONES`
- `LayoutPreference.tone` 类型从 `string[]` 改为 `Tone[]`
- 12 套内置主题的 tone 数组校验后均在枚举内，无需修改
- `validateThemeJson` 中增加 tone 值白名单过滤：不在枚举内的项被剔除，空数组兜底 `["modern"]`

**P2-2 shadow 变量修复方式**：`tokenCss.ts` 解构 `tokens.shadow`，当 `shadow.enabled && shadow.value` 时输出 `--wemd-shadow: ${shadow.value};` CSS 变量，类型与实现脱节问题修复。

**P2-3 validateThemeJson 校验加强修复方式**：

- 新增 `layout.density` 校验，非法值回退为 `"medium"`
- 新增 `layout.tone` 类型校验，非数组回退为 `["modern"]`
- 新增 `layout.preferredComponents` 类型校验，非数组回退为 `["quote-card", "divider-fancy"]`
- 主动 `delete layout.magazineLevel`，清理废弃字段

**P2-7 magazineLevel 兜底修复方式**：从 `validateThemeJson` 默认值中删除 `magazineLevel`，改为主动 `delete` 清理。

### 低优先级 / 已知限制

| #   | 问题                                                                                                     | 位置                                                                                         | 修复状态                      |
| --- | -------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | ----------------------------- |
| 1   | `processHtml` 中的 var fallback 替换与 `expandCSSVariables` 功能重复且实现不一致（冗余兜底）             | [ThemeProcessor.ts:246](file:///e:/11自动工作流/wd/packages/core/src/ThemeProcessor.ts#L246) | ✅ 已修复                     |
| 2   | `bracket` 等 heading preset 的伪元素在微信复制场景下被丢弃（`inlineAllStylesManually` 跳过 `::` 选择器） | [ThemeProcessor.ts:119](file:///e:/11自动工作流/wd/packages/core/src/ThemeProcessor.ts#L119) | 🔄 不修复（工作量大，先搁置） |
| 3   | 导出文件名直接用 `theme.name`，未做文件名非法字符过滤                                                    | [themeStore.ts](file:///e:/11自动工作流/wd/apps/web/src/store/themeStore.ts)                 | ✅ 已修复                     |

**P2 低优-1 var fallback 去重修复方式**：

- 将 `apps/web/src/services/cssVarParser.ts` + `cssVariableExpander.ts` 整体迁入 `packages/core/src/themes/`，统一出口
- `ThemeProcessor.processHtml` 中手写的 `while + regex` var() fallback 替换循环删除，改用统一的 `expandCSSVariables(css)`
- web 侧原路径文件保留为 re-export（`export * from "@wemd/core"`），向后兼容

**P2 低优-3 文件名 sanitize 修复方式**：在 `themeStore.ts` 中新增 `const sanitizeFileName = (name) => name.replace(/[\\/:*?"<>|]/g, "_")`，`exportTheme`（3 处）+ `exportThemeCSS`（1 处）的 `a.download` 全部改用 `${sanitizeFileName(theme.name)}.json|.css`

### 额外修复（审计报告外发现的问题）

| #   | 问题                                                                           | 位置                                                                                                                                                                             | 修复方式                                                                                  |
| --- | ------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | ~~default 主题主色漂移（#047857 → #07c160）~~ **【误判，已撤销】**             | [builtin-themes/index.ts](file:///e:/11自动工作流/wd/packages/core/src/builtin-themes/index.ts)                                                                                  | —                                                                                         | **误判**：#047857 是 clear-guide 主题的 primaryDark（[theme-variables.ts:99](file:///e:/11自动工作流/wd/packages/core/src/themes/theme-variables.ts#L99)），非 default 主题的 primary。default 主题 primary 一直是 #07c160，legacy 与 builtin-themes 两边一致，无漂移。 |
| 2   | data-blueprint 主题 accent 色对齐 legacy                                       | [builtin-themes/index.ts](file:///e:/11自动工作流/wd/packages/core/src/builtin-themes/index.ts)                                                                                  | 对齐为 legacy theme-variables.ts 的 accent 色                                             | **设计对齐**（非 bug）：原 #f59e0b 橙色作为蓝色主题的互补点缀是合理设计，对齐 legacy 是为消除双轨分歧。                                                                                                                                                                 |
| 3   | eastern-notes 主题背景色对齐 legacy                                            | [builtin-themes/index.ts](file:///e:/11自动工作流/wd/packages/core/src/builtin-themes/index.ts)                                                                                  | bgMuted 改为 #fdf2f2，bgCard 改为 #fffbf5                                                 | **设计对齐**：builtin-themes 与 legacy 值不一致，对齐以消除双轨分歧。                                                                                                                                                                                                   |
| 4   | 重复的 sunset-film 主题定义                                                    | [builtInThemes.ts](file:///e:/11自动工作流/wd/apps/web/src/store/themes/builtInThemes.ts)                                                                                        | 删除数组中重复的主题对象                                                                  |
| 5   | Imageflow CSS 重复输出                                                         | [extrasCss.ts](file:///e:/11自动工作流/wd/packages/core/src/theme-renderer/extrasCss.ts) vs [baseCss.ts](file:///e:/11自动工作流/wd/packages/core/src/theme-renderer/baseCss.ts) | 从 extrasCss.ts 删除 Imageflow 样式，保留 baseCss.ts 唯一实现                             |
| 6   | mark 高亮改为跟随主题                                                          | [componentCss.ts](file:///e:/11自动工作流/wd/packages/core/src/theme-renderer/componentCss.ts)                                                                                   | 将 `background` 从硬编码渐变改为 `var(--wemd-primary-light)`                              | **设计增强**（非 bug）：原硬编码黄色高亮是通用设计，改为跟随主题是增强一致性。                                                                                                                                                                                          |
| 7   | `:root` 全局选择器污染                                                         | [theme-variables.ts](file:///e:/11自动工作流/wd/packages/core/src/themes/theme-variables.ts)                                                                                     | 将 defaultVars 作用域从 `:root` 改为 `#wemd`                                              |
| 8   | `allThemeVars` / `globalDefaultVars` 未使用导出                                | [theme-variables.ts](file:///e:/11自动工作流/wd/packages/core/src/themes/theme-variables.ts)                                                                                     | 删除 `allThemeVars` 定义；清理 `builtInThemes.ts` 中的 `globalDefaultVars` 导入和导出     |
| 9   | Designer Review 自检在 `designGoal="auto"` 时丢失                              | [templatePrompt.ts](file:///e:/11自动工作流/wd/apps/web/src/services/template/templatePrompt.ts)                                                                                 | 将自检逻辑提取为独立函数 `buildDesignerReviewHint`，在 `buildTemplatePrompt` 中无条件注入 |
| 10  | 管道顺序 bug：variant CSS 在 componentStyles 之前注入                          | [theme-renderer/index.ts](file:///e:/11自动工作流/wd/packages/core/src/theme-renderer/index.ts)                                                                                  | 顺序调整为 `injectComponentStyles → injectCodeTheme → injectVariantCss`，与 legacy 对齐   |
| 11  | `ThemeMathCss.test.ts` 残留 5 个已删除隐身主题 import                          | [ThemeMathCss.test.ts](file:///e:/11自动工作流/wd/packages/core/src/__tests__/ThemeMathCss.test.ts)                                                                              | 移除 auroraGlass/bauhaus/cyberpunkNeon/neoBrutalism/template 5 项，保留 14 个真实主题     |
| 12  | `ThemeRenderer.test.ts` 默认主题 h1/h2 预设断言错误                            | [ThemeRenderer.test.ts](file:///e:/11自动工作流/wd/packages/core/src/__tests__/ThemeRenderer.test.ts#L70)                                                                        | 改为与 builtin-themes/default 真实值匹配：h1 top-border #07c160，h2 bottom-border #d1fae5 |
| 13  | `core/tsconfig.json` 缺 `resolveJsonModule` 导致组件 manifest JSON import 失败 | [tsconfig.json](file:///e:/11自动工作流/wd/packages/core/tsconfig.json)                                                                                                          | 补 `"resolveJsonModule": true`                                                            |
| 14  | `validateThemeJson` 返回 `Record<string, unknown>` 与实际不符                  | [aiPrompts.ts](file:///e:/11自动工作流/wd/apps/web/src/services/ai/aiPrompts.ts#L102)                                                                                            | 返回类型改为 `ThemeDefinition                                                             | null`，同步更新 AiThemeGenerator 断言                                                                                                                                                                                                                                   |

### 验证通过的环节

- AI 主题生成链路完整：JSON 输出 → `validateThemeJson` 校验+补默认值+清理废弃字段 → `renderTheme(def)` 转 CSS → 保存为 `CustomTheme` 时同时存 `css` 和 `definition`
- CSS 变量三层展开机制完整：`expandCSSVariables`（纯文本）→ `processHtml`（HTML 内联）→ `resolveInlineStyleVariablesForCopy`（DOM 级解析）
- 主题导入导出支持 v1/v2 双格式向后兼容

---

## 五、问题优先级汇总

### P0（需立即修复）

| #   | 问题                                                                                 | 影响范围                          | 修复状态  |
| --- | ------------------------------------------------------------------------------------ | --------------------------------- | --------- |
| 1   | `analysisAgent.ts:133` — prompt 仍向 AI 发送 magazineLevel + designLanguage 废弃概念 | AI 排版输出被误导                 | ✅ 已修复 |
| 2   | `analysisAgent.ts:470` — designGoal 未注入到 AI plan prompt                          | 用户的 Design Goal 偏好对 AI 无效 | ✅ 已修复 |
| 3   | `analysisAgent.ts:514` — designGoal="auto" 时 strategy 错误显示"信息密度"            | 用户看到错误的策略说明            | ✅ 已修复 |
| 4   | `magazineRenderers.ts:355` — fullQuote 键名拼写错误                                  | full-quote 杂志渲染失效           | ✅ 已修复 |

### P1（应尽快修复）

| #   | 问题                                                    | 影响范围                      | 修复状态  |
| --- | ------------------------------------------------------- | ----------------------------- | --------- |
| 1   | 8 个组件缺少 componentRenderer                          | 这 8 个组件 AI 生成后无法渲染 | ✅ 已修复 |
| 2   | 双轨架构——内置主题未走结构化渲染                        | 主题系统长期维护成本高        | ✅ 已修复 |
| 3   | `LayoutPreference.magazineLevel` 必填且未标 @deprecated | 废弃概念在类型层硬性残留      | ✅ 已修复 |

### P2（可计划修复）

| #   | 问题                                                                                  | 影响范围        | 修复状态                    |
| --- | ------------------------------------------------------------------------------------- | --------------- | --------------------------- |
| 1   | `buildComplexityHint` 函数名遗留旧术语                                                | 代码可读性      | ✅ 已修复                   |
| 2   | `validateThemeJson` 校验过松                                                          | AI 主题质量保障 | ✅ 已修复                   |
| 3   | 内置主题无法导出                                                                      | 用户体验        | 🔄 不修复（用户确认不需要） |
| 4   | 导入 v2 主题未校验                                                                    | 安全性          | ✅ 已修复                   |
| 5   | 类型定义位置分散（DesignConstraints/Audience 不在 types.ts）                          | 架构分层        | ✅ 已修复                   |
| 6   | `ComponentStyleOverride.overrides` / `DesignTokens.shadow` 类型定义存在但渲染器未消费 | 类型与实现脱节  | ✅ 已修复                   |

---

## 六、未修复问题后续建议

### 搁置类（本轮已评估暂不做）

1. **P1-2 → P2-3 内置主题导出**：用户确认不需要内置主题导出，仅支持自定义主题导入导出。
2. **bracket 等 heading 伪元素微信兼容**：工作量大（需重构 heading 渲染链路），需进一步调研方案后再定时间。

### 已全部清零

本轮 7 个问题（tone 类型收紧、类型定义迁移、双轨架构统一 + 管道顺序 bug、overrides 消费、var fallback 去重、导入校验、文件名 sanitize）全部修复完成，附：

- 构建：`turbo run build` 3/3 包全部通过
- 测试：`@wemd/core` vitest 10/10 文件、179/179 用例通过
- 审计报告：[code-audit-2026-07-29.md](file:///e:/11自动工作流/wd/docs/engineering/code-audit-2026-07-29.md)
