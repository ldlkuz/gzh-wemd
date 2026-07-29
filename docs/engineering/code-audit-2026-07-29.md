# 代码审计报告（2026-07-29）

> 全面检查项目代码逻辑一致性，覆盖术语残留、AI 排版链路、组件系统、主题系统四个维度。

---

## 一、术语残留检查

### 需要修复的残留

| 优先级 | 文件                                                                                                 | 行号         | 问题                                                                      | 建议                                                                         |
| ------ | ---------------------------------------------------------------------------------------------------- | ------------ | ------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| **高** | [analysisAgent.ts](file:///e:/11自动工作流/wd/apps/web/src/services/ai/analysisAgent.ts#L133)        | 133          | prompt 仍向 AI 发送 `magazineLevel`（杂志化等级）和 `designLanguage` 指令 | 移除"杂志化等级"行，将"designLanguage 应与之匹配"改为"design 字段应与之协调" |
| **中** | [theme-schema/types.ts](file:///e:/11自动工作流/wd/packages/core/src/theme-schema/types.ts#L152)     | 152          | `LayoutPreference.magazineLevel` 必填且未标 @deprecated                   | 改为可选 `magazineLevel?` 并加 @deprecated                                   |
| **中** | [builtin-themes/index.ts](file:///e:/11自动工作流/wd/packages/core/src/builtin-themes/index.ts#L105) | 105 等 12 处 | 12 套主题被迫填写 magazineLevel                                           | 类型改可选后逐步清理                                                         |
| **低** | [templatePrompt.ts](file:///e:/11自动工作流/wd/apps/web/src/services/template/templatePrompt.ts#L54) | 54, 135, 143 | 函数名 `buildComplexityHint` 遗留旧术语，逻辑已是 designGoal              | 重命名为 `buildDesignGoalHint` / `designGoalHint`                            |

### 兼容性保留（无需修复）

- `template/types.ts:66` — TemplateJSON.magazineLevel（@deprecated 可选，旧模板兼容）
- `template/templateAgent.ts:47,75` — TemplateGenerationResult.magazineLevel（@deprecated + 解析容错）
- `template/templateAgent.test.ts:153,159` — v1.x 旧模板兼容测试
- `TemplateLayoutPanel.tsx` / `AiDesignPanel.tsx` — UI 仅对旧模板展示（有 `!isV2Template` 守卫）
- `renderer.ts:356,449` — JSDoc 迁移说明注释，无代码引用

---

## 二、AI 排版架构链路

### 严重问题

#### P0-1：designGoal 未注入到 AI plan prompt

**文件**：[analysisAgent.ts](file:///e:/11自动工作流/wd/apps/web/src/services/ai/analysisAgent.ts#L117)

`buildPlanPrompt` 函数签名只接收 `audience` 和 `themeLayout`，**不接收 constraints**：

```typescript
function buildPlanPrompt(
  audience?: Audience,
  themeLayout?: LayoutPreference,
): string {
```

`analyzeArticle` 调用时也没有传递 constraints。**AI 在规划阶段完全不知道用户的 designGoal 偏好**，designGoal 仅在 strategy 字符串拼接中用于展示给用户看。

与 `templatePrompt.ts` 的 `buildComplexityHint`（正确注入 designGoal）形成对比，两条链路处理不一致。

#### P0-2：strategy 拼接逻辑 bug

**文件**：[analysisAgent.ts](file:///e:/11自动工作流/wd/apps/web/src/services/ai/analysisAgent.ts#L514) 第 514-516 行

```typescript
effectiveConstraints.designGoal !== "balanced"
  ? `设计目标：${... ? "阅读优先" : ... ? "平衡设计" : ... ? "视觉优先" : "信息密度"}`
  : "",
```

当 `designGoal === "auto"` 时（UI 默认值）：

- 外层条件 `"auto" !== "balanced"` 为 true，进入前半分支
- 内层没有 `"auto"` 的判断分支，最终走到 else 显示 **"信息密度"**
- 即用户选择"自动"时，strategy 会错误地显示"设计目标：信息密度"

### 中等问题

| #   | 问题                                                                                                                               | 位置                                                                                              |
| --- | ---------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| 1   | 类型定义位置分散：`DesignConstraints` 和 `Audience` 定义在 `analysisAgent.ts` 而非 `types.ts`，`templatePrompt.ts` 需跨目录 import | [analysisAgent.ts:35](file:///e:/11自动工作流/wd/apps/web/src/services/ai/analysisAgent.ts#L35)   |
| 2   | 兜底默认值 `designGoal: "balanced"` 与 UI 默认值 `"auto"` 不一致                                                                   | [analysisAgent.ts:466](file:///e:/11自动工作流/wd/apps/web/src/services/ai/analysisAgent.ts#L466) |

### 验证通过的环节

- `AiDesignPanel.tsx`：7 个读者画像 + 5 个设计目标 + 默认值 "auto" 全部正确
- `renderer.ts`：resolveVariant 正确映射 design intent，5 个新组件变体映射齐全
- `types.ts`：DesignIntent 接口完整，5 个新组件 Content 接口齐全
- `templatePrompt.ts`：Designer Review 自检逻辑完整，theme.layout 信息正确注入

---

## 三、组件系统完整性

### 严重 Bug

#### P0：MAGAZINE_RENDERERS 键名拼写错误

**文件**：[magazineRenderers.ts](file:///e:/11自动工作流/wd/packages/core/src/plugins/component/magazineRenderers.ts#L355) 第 355 行

```typescript
export const MAGAZINE_RENDERERS: Record<string, (content: string) => string> = {
  "magazine-cover": renderMagazineCover,
  "section-divider": renderSectionDivider,
  "two-column-cards": renderTwoColumnCards,
  fullQuote: renderFullQuote,        // ← BUG: 应为 "full-quote"
  "image-card": renderImageCard,
  ...
};
```

所有其他键均使用 kebab-case，唯独 `fullQuote` 使用了 camelCase。系统通过 `MAGAZINE_RENDERERS["full-quote"]` 查找时返回 `undefined`，full-quote 组件的杂志级 HTML 结构渲染不会被触发，丢失整块主色背景 + 白字居中的视觉效果。

### 中等问题

#### P1：8 个组件缺少 componentRenderer

以下组件在 manifest 中注册、在工具栏中可插入，但在 `componentRenderers.ts` 中没有对应渲染函数：

| 序号 | 组件名           | manifest 路径                         |
| ---- | ---------------- | ------------------------------------- |
| 1    | image-grid       | manifests/default/image-grid.json     |
| 2    | author-card      | manifests/default/author-card.json    |
| 3    | timeline         | manifests/default/timeline.json       |
| 4    | related-posts    | manifests/extra/related-posts.json    |
| 5    | copyright-notice | manifests/extra/copyright-notice.json |
| 6    | qr-card          | manifests/extra/qr-card.json          |
| 7    | image-text-row   | manifests/extra/image-text-row.json   |
| 8    | image-caption    | manifests/extra/image-caption.json    |

这些组件生成 `::: name{...}` 时无法将 content 对象转为 Markdown body，`hasRenderer()` 返回 false。

### 五环节交叉对比总表

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
| author-card      |    ✓     |         ✗          |      ✗      |    ✓    |         ✗          |
| code-frame       |    ✓     |         ✓          |      ✗      |    ✓    |         ✗          |
| copyright-notice |    ✓     |         ✗          |      ✗      |    ✓    |         ✗          |
| faq              |    ✓     |         ✓          |      ✗      |    ✓    |         ✗          |
| follow-bar       |    ✓     |         ✓          |      ✗      |    ✓    |         ✗          |
| full-quote       |    ✓     |         ✓          |      ✗      |    ✓    |    ⚠️ 键名错误     |
| image-caption    |    ✓     |         ✗          |      ✗      |    ✓    |         ✗          |
| image-card       |    ✓     |         ✓          |      ✗      |    ✓    |         ✓          |
| image-grid       |    ✓     |         ✗          |      ✗      |    ✓    |         ✗          |
| image-text-row   |    ✓     |         ✗          |      ✗      |    ✓    |         ✗          |
| magazine-cover   |    ✓     |         ✓          |      ✗      |    ✓    |         ✓          |
| numbered-heading |    ✓     |         ✓          |      ✗      |    ✓    |         ✗          |
| qr-card          |    ✓     |         ✗          |      ✗      |    ✓    |         ✗          |
| related-posts    |    ✓     |         ✗          |      ✗      |    ✓    |         ✗          |
| section-title    |    ✓     |         ✓          |      ✗      |    ✓    |         ✗          |
| stats-block      |    ✓     |         ✓          |      ✗      |    ✓    |         ✗          |
| styled-table     |    ✓     |         ✓          |      ✗      |    ✓    |         ✗          |
| tag-label        |    ✓     |         ✓          |      ✗      |    ✓    |         ✗          |
| text-card        |    ✓     |         ✓          |      ✗      |    ✓    |         ✗          |
| timeline         |    ✓     |         ✗          |      ✗      |    ✓    |         ✗          |
| toc-nav          |    ✓     |         ✓          |      ✗      |    ✓    |         ✗          |
| two-column-cards |    ✓     |         ✓          |      ✗      |    ✓    |         ✓          |

### 统计

| 对比维度                | 数量    | 说明                           |
| ----------------------- | ------- | ------------------------------ |
| Manifest 总组件数       | 35      | 基准                           |
| componentRenderers 覆盖 | 27 / 35 | 缺 8 个                        |
| VARIANT_CSS_MAP 覆盖    | 13 / 35 | 缺 22 个（部分可能为设计意图） |
| Toolbar 覆盖            | 35 / 35 | 完全一致                       |
| MAGAZINE_RENDERERS 覆盖 | 11 / 35 | 其中 1 个键名拼写错误          |

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

### 中等问题

| #   | 问题                                                                            | 位置                                                                                                                                                                                                    |
| --- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `ComponentStyleOverride.overrides` 字段类型定义存在但 `injectVariantCss` 未消费 | [theme-schema/types.ts:136](file:///e:/11自动工作流/wd/packages/core/src/theme-schema/types.ts#L136) vs [theme-renderer/index.ts](file:///e:/11自动工作流/wd/packages/core/src/theme-renderer/index.ts) |
| 2   | `DesignTokens.shadow` 字段类型定义存在但 `renderTokenCss` 未输出对应 CSS 变量   | [theme-schema/types.ts](file:///e:/11自动工作流/wd/packages/core/src/theme-schema/types.ts) vs [tokenCss.ts](file:///e:/11自动工作流/wd/packages/core/src/theme-renderer/tokenCss.ts)                   |
| 3   | `validateThemeJson` 校验过松，仅检查 2 个字段，不校验 `layout` 子字段合法性     | [aiPrompts.ts:113](file:///e:/11自动工作流/wd/apps/web/src/services/ai/aiPrompts.ts#L113)                                                                                                               |
| 4   | 内置主题无法导出（导入导出仅处理 `customThemes`）                               | [themeStore.ts:361](file:///e:/11自动工作流/wd/apps/web/src/store/themeStore.ts#L361)                                                                                                                   |
| 5   | 导入 v2 主题未调用 `validateThemeJson` 校验                                     | [themeStore.ts:462](file:///e:/11自动工作流/wd/apps/web/src/store/themeStore.ts#L462)                                                                                                                   |
| 6   | `LayoutPreference.tone` 为开放 `string[]`，未用联合类型约束                     | [theme-schema/types.ts:150](file:///e:/11自动工作流/wd/packages/core/src/theme-schema/types.ts#L150)                                                                                                    |
| 7   | 兜底默认值 `magazineLevel: "medium"` 在 `validateThemeJson` 中仍被补入          | [aiPrompts.ts:128](file:///e:/11自动工作流/wd/apps/web/src/services/ai/aiPrompts.ts#L128)                                                                                                               |

### 低优先级 / 已知限制

| #   | 问题                                                                                                     | 位置                                                                                         |
| --- | -------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| 1   | `processHtml` 中的 var fallback 替换与 `expandCSSVariables` 功能重复且实现不一致（冗余兜底）             | [ThemeProcessor.ts:246](file:///e:/11自动工作流/wd/packages/core/src/ThemeProcessor.ts#L246) |
| 2   | `bracket` 等 heading preset 的伪元素在微信复制场景下被丢弃（`inlineAllStylesManually` 跳过 `::` 选择器） | [ThemeProcessor.ts:119](file:///e:/11自动工作流/wd/packages/core/src/ThemeProcessor.ts#L119) |
| 3   | 导出文件名直接用 `theme.name`，未做文件名非法字符过滤                                                    | [themeStore.ts](file:///e:/11自动工作流/wd/apps/web/src/store/themeStore.ts)                 |

### 验证通过的环节

- AI 主题生成链路完整：JSON 输出 → `validateThemeJson` 校验+补默认值 → `renderTheme(def)` 转 CSS → 保存为 `CustomTheme` 时同时存 `css` 和 `definition`
- CSS 变量三层展开机制完整：`expandCSSVariables`（纯文本）→ `processHtml`（HTML 内联）→ `resolveInlineStyleVariablesForCopy`（DOM 级解析）
- 主题导入导出支持 v1/v2 双格式向后兼容

---

## 五、问题优先级汇总

### P0（需立即修复）

| #   | 问题                                                                                 | 影响范围                          |
| --- | ------------------------------------------------------------------------------------ | --------------------------------- |
| 1   | `analysisAgent.ts:133` — prompt 仍向 AI 发送 magazineLevel + designLanguage 废弃概念 | AI 排版输出被误导                 |
| 2   | `analysisAgent.ts:470` — designGoal 未注入到 AI plan prompt                          | 用户的 Design Goal 偏好对 AI 无效 |
| 3   | `analysisAgent.ts:514` — designGoal="auto" 时 strategy 错误显示"信息密度"            | 用户看到错误的策略说明            |
| 4   | `magazineRenderers.ts:355` — fullQuote 键名拼写错误                                  | full-quote 杂志渲染失效           |

### P1（应尽快修复）

| #   | 问题                                                    | 影响范围                      |
| --- | ------------------------------------------------------- | ----------------------------- |
| 1   | 8 个组件缺少 componentRenderer                          | 这 8 个组件 AI 生成后无法渲染 |
| 2   | 双轨架构——内置主题未走结构化渲染                        | 主题系统长期维护成本高        |
| 3   | `LayoutPreference.magazineLevel` 必填且未标 @deprecated | 废弃概念在类型层硬性残留      |

### P2（可计划修复）

| #   | 问题                                                                                  | 影响范围        |
| --- | ------------------------------------------------------------------------------------- | --------------- |
| 1   | `buildComplexityHint` 函数名遗留旧术语                                                | 代码可读性      |
| 2   | `validateThemeJson` 校验过松                                                          | AI 主题质量保障 |
| 3   | 内置主题无法导出                                                                      | 用户体验        |
| 4   | 导入 v2 主题未校验                                                                    | 安全性          |
| 5   | 类型定义位置分散（DesignConstraints/Audience 不在 types.ts）                          | 架构分层        |
| 6   | `ComponentStyleOverride.overrides` / `DesignTokens.shadow` 类型定义存在但渲染器未消费 | 类型与实现脱节  |
