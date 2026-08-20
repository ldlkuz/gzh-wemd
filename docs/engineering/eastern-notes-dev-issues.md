# 东方笺谱（eastern-notes）主题开发问题清单

> 记录「东方笺谱」第二套主题从设计到落地过程中遇到的 22 个问题、
> 每个问题的修复文件与验证方式，用于复盘与防止回归。

## 一、架构与基础

| # | 问题 | 修复文件 | 验证方式 |
|---|------|---------|---------|
| 1 | 每套主题要有独立骨架，无则用默认兜底 | `packages/core/src/themes/template-library.ts`（公共模板片段）、`packages/core/src/themes/templates-eastern-notes.ts`（主题组装）、`packages/core/src/plugins/component/defaultTemplates.ts`（默认兜底） | `pnpm --filter @wemd/core exec vitest run` |
| 2 | 全局皮肤 + 组件级 CSS 的接线 | `packages/core/src/themes/eastern-notes.ts`（主题皮肤）、`packages/core/src/themes/components-eastern-notes.ts`（组件级差异化样式） | 渲染预览 + vitest 全量 |
| 3 | 开发机 node_modules 与 lockfile 不一致 | 无需改代码，执行 `pnpm install` 重装依赖 | dev 服务器（`pnpm dev:web`）正常启动 |

## 二、视觉 / 设计实现类

| # | 问题 | 修复文件 | 验证方式 |
|---|------|---------|---------|
| 4 | 关键组件装饰缺失（magazine-cover 页头、cta-card 红黑渐变+圆形印章、pullquote 双色直角线） | `packages/core/src/themes/template-library.ts` 新增 `magazineCoverSeal` / `ctaCardSealFoot` / `pullquoteCorners` 模板；`packages/core/src/themes/components-eastern-notes.ts` 补样式；`packages/core/src/pseudoElementInline.ts` 的 `materializePullquote` 不再覆盖新装饰 | `packages/core/src/__tests__/defaultThemeDomMatch.test.ts`（新增装饰元素存在与样式的断言） |
| 5 | 分割线效果与预览不一致（原生 `---` 转 divider、无 label 时装饰点不显示） | `packages/core/src/plugins/component/templateFiller.ts` 的 `IF_RE` 支持 `{{else}}` 分支 | `packages/core/src/__tests__/defaultTemplates.test.ts` / `slotParsers.test.ts` |
| 6 | 伪元素装饰改为真实 DOM 子元素（微信公众号物化约束） | `packages/core/src/pseudoElementInline.ts` | 微信兼容相关测试 |
| 7 | pullquote 左侧竖线残留 | `packages/core/src/themes/components-eastern-notes.ts` | `defaultThemeDomMatch.test.ts` 断言左侧竖线清零 |

## 三、公众号排版 / 微信兼容

| # | 问题 | 修复文件 | 验证方式 |
|---|------|---------|---------|
| 8 | 章节与标题统一居中 | `packages/core/src/themes/components-eastern-notes.ts`（h2/h3 居中） | 导出 HTML 目检 |
| 9 | `#` 组件去掉上方红点（从左到右排版语义） | `packages/core/src/themes/components-eastern-notes.ts` | 导出 HTML 目检 |
| 10 | 折叠面板微信不支持，改为上下结构、保留样式、无折叠 | `packages/core/src/themes/templates-eastern-notes.ts` / accordion 模板 | 导出 HTML 目检 |
| 11 | 装饰物化为真实元素（`.wemd-mat`），导出正确 | `packages/core/src/pseudoElementInline.ts`（`parseRule`、各 `materialize*` 函数） | 微信兼容测试 |

## 四、组件级样式问题

| # | 问题 | 修复文件 | 验证方式 |
|---|------|---------|---------|
| 12 | callout-pro 列表项圆点重复、底部短线两边超出内容区 | `packages/core/src/themes/components-eastern-notes.ts`（短线内缩、圆点改细短竖线） | `defaultThemeDomMatch.test.ts` |
| 13 | follow-bar「关注」做成分段按钮，点击无效误导读者 | `packages/core/src/themes/components-extra.ts` + `components-eastern-notes.ts`（去按钮化，纯文字） | `defaultThemeDomMatch.test.ts` 断言无背景/边框/圆角 |
| 14 | code-frame 行首空格缩进不显示 | `packages/core/src/plugins/component/slotParsers.ts`（`analyzeBlock` 保留代码围栏内缩进；`renderCodeBlock` 保留首行缩进） | `slotParsers.test.ts` + 导出含 `&nbsp;` |
| 15 | code-frame 复制到公众号后颜色错乱（黑→米→红→米） | `packages/core/src/ThemeProcessor.ts`（内联按 CSS 特异性排序） | `packages/core/src/__tests__/ThemeProcessor.test.ts` |
| 16a | code-frame 红色上边线不贴合黑色标题条（10px 缝隙） | `packages/core/src/ThemeProcessor.ts`（级联优先级 seq，高特异性简写清除低特异性长属性） | `ThemeProcessor.test.ts`（margin 危险序用例） |
| 16b | code-frame 圆角与外层不一致（硬编码 8px vs 主题 0px） | `packages/core/src/themes/components-default.ts` `.wemd-code-frame` 改用 `var(--wemd-border-radius, 8px)` | 导出 HTML 目检 `border-radius` 跟随主题 token |

## 五、渲染管线 / 级联引擎（通用 bug，非主题专属）

| # | 问题 | 修复文件 | 验证方式 |
|---|------|---------|---------|
| 17 | 内联器未按 CSS 特异性排序，组件级覆盖被全局规则压制 | `packages/core/src/ThemeProcessor.ts` 新增 `selectorSpecificity` + `orderedRules` 按特异性升序应用 | `ThemeProcessor.test.ts` |
| 18 | 简写 vs 长属性级联冲突 | `packages/core/src/ThemeProcessor.ts` `styles` 循环增加 seq，简写重置更低优先级的同家族长属性 | `ThemeProcessor.test.ts`（margin/border/flex/background 危险序用例） |
| 19 | 伪元素物化 `parseRule` 需取最后匹配规则，保证主题覆盖生效 | `packages/core/src/pseudoElementInline.ts` `parseRule` 遍历取最后一个匹配 | 微信兼容测试 |
| 20 | 分槽器把代码围栏内/首行的缩进 trim 掉 | `packages/core/src/plugins/component/slotParsers.ts` | `slotParsers.test.ts` |

## 六、工程 / 测试

| # | 问题 | 修复文件 | 验证方式 |
|---|------|---------|---------|
| 21 | 测试硬编码旧路径失效（`e:\11自动工作流\wd\...`） | `packages/core/src/__tests__/debug-article.test.ts` 改为 `e:\workflow\wd\...` | vitest 全量 |
| 22 | 4 个旧测试断言与真实 CSS 语义相反 | `packages/core/src/__tests__/ThemeProcessor.test.ts` 改为断言「规则后声明的简写重置家族」 | vitest 全量 |

## 回归命令

```powershell
pnpm --filter @wemd/core exec vitest run src/__tests__/ThemeProcessor.test.ts src/__tests__/defaultThemeDomMatch.test.ts src/__tests__/slotParsers.test.ts
```

全量：`pnpm --filter @wemd/core exec vitest run`

## 复盘要点

- 问题集中在三块：主题视觉落地（骨架+装饰+居中）、微信兼容物化约束、以及一个此前未暴露的**内联级联引擎 bug**（后三个 code-frame 问题几乎都源于它）。
- 内联器是否按 CSS 特异性 + 级联优先级处理简写/长属性，是「预览」与「公众号粘贴后」是否一致的关键；建议后续新增组件或主题时，把「导出 = 预览」作为默认回归项。