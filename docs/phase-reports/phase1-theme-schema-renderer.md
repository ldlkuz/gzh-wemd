# Phase 1 改造总结：Theme Schema + Renderer

> 完成时间：2026-07-27 | 测试：23/23 全部通过

---

## 一、完成情况

### 1.1 新增文件

| 文件                                                | 行数 | 说明                                            |
| --------------------------------------------------- | ---- | ----------------------------------------------- |
| `packages/core/src/theme-schema/types.ts`           | 157  | ThemeDefinition 四层类型定义                    |
| `packages/core/src/theme-renderer/index.ts`         | 90   | 主渲染器 `renderTheme()` + 变体/代码高亮注入    |
| `packages/core/src/theme-renderer/baseCss.ts`       | 200  | 基础重置样式（所有主题共享）                    |
| `packages/core/src/theme-renderer/tokenCss.ts`      | 69   | DesignToken → CSS 变量块                        |
| `packages/core/src/theme-renderer/typographyCss.ts` | 121  | 段落/标题/列表 + 8 种 heading preset            |
| `packages/core/src/theme-renderer/componentCss.ts`  | 172  | 引用/代码/表格/图片/脚注（var(--wemd-\*) 引用） |
| `packages/core/src/theme-renderer/extrasCss.ts`     | 90   | Callout 提示块 / Mermaid / Imageflow            |
| `packages/core/src/__tests__/ThemeRenderer.test.ts` | 245  | 23 个测试用例                                   |

**合计**：8 个文件，约 1144 行代码。

### 1.2 现有文件修改

无。Phase 1 纯增量，不碰任何现有代码。

---

## 二、关键设计决策

### 2.1 渲染管线（renderTheme）

```
ThemeDefinition JSON
    ├─ renderBaseCss()           → 基础重置（所有主题共享）
    ├─ renderTokenCss()          → #wemd { --wemd-* } 14 个 CSS 变量
    ├─ renderTypographyCss()     → 段落/标题/列表 + heading preset
    ├─ renderComponentCss()      → 引用/代码/表格/图片/脚注
    ├─ injectVariantCss()        → 组件变体 CSS（data-variant 切换）
    ├─ injectCodeTheme()         → 代码高亮主题
    └─ renderExtrasCss()         → Callout / Mermaid / Imageflow

→ 完整 CSS 字符串
```

### 2.2 Heading Preset 系统

支持的 8 种预设（从 ThemeDesigner presets.ts 迁移）：

- `simple` / `left-border` / `bottom-border` / `double-line`
- `boxed` / `bottom-highlight` / `pill` / `bracket`

每个 preset 自动生成正确的 CSS，由 ThemeDefinition 中的 `heading.preset` 字段控制。

### 2.3 组件变体注入

`injectVariantCss()` 扫描 `components` 配置，找出所有 `variant !== "default"` 的组件，从 `variantCss.ts` 动态加载对应 CSS。`enabled: false` 的组件不影响 CSS（只影响 AI 推荐行为）。

### 2.4 向后兼容

- `renderTheme()` 的输出与现有 `buildThemeCss()` 格式兼容
- `ThemeDefinition` 类型可直接作为未来 builtInThemes 的数据格式
- 现有 `CustomTheme.css` 字符串格式的主题不受影响

---

## 三、测试覆盖

| 测试分类     | 用例数 | 验证内容                                     |
| ------------ | ------ | -------------------------------------------- |
| 默认主题渲染 | 13     | CSS 变量、排版、预设、组件、微信兼容         |
| 数据蓝图渲染 | 4      | 科技蓝色系、H1 预设、段落间距、enabled:false |
| 结构完整性   | 3      | meta/tokens/components/layout 字段校验       |
| 语法完整性   | 3      | 大括号平衡、无空规则、引号平衡               |

**验证的两套主题**：默认主题（微信绿）+ 数据蓝图（科技蓝）。

---

## 四、已知限制（Phase 2 解决）

1. **17 套主题尚未迁移** — 目前只有 2 套手动推导的 JSON，其余 15 套仍是 CSS 字符串
2. **代码高亮主题仅支持 GitHub** — `injectCodeTheme()` 硬编码，需要扩展为 ThemeDefinition 字段
3. **变体 CSS 通过 require 动态加载** — 在 Vite ESM 环境下需要用 import 替代
4. **未对接 ThemeProcessor** — `renderTheme()` 的输出尚未接入 `processHtml()` 管线
5. **组件默认样式未注入** — WeMD 30 个组件的 CSS（components-default.ts 等）尚未通过 renderer 注入，Phase 2 需要添加

---

## 五、Phase 2 计划

### 目标：迁移 17 套内置主题 + 简化 UI

### 任务清单

1. **迁移 17 套内置主题**
   - 将 `builtInThemes.ts` 中的每个 CSS 字符串拆解为 `ThemeDefinition` JSON
   - 优先迁移可选的 12 套，隐藏的 5 套标记为 `legacy`
   - 每个主题定义 `layout.preferredComponents` 和 `layout.tone`

2. **完善 ThemeRenderer**
   - 添加 `injectComponentDefaultCss()` — 注入 30 个 WeMD 组件的默认样式
   - 添加代码高亮主题选择（github / github-dark）
   - 将 `require()` 替换为 ESM import

3. **改造 ThemeStore**
   - `CustomTheme` 类型扩展，增加 `definition?: ThemeDefinition`
   - `getThemeCSS()` 改为调用 `renderTheme(definition)` 而非返回 `css` 字符串
   - 向后兼容：legacy 主题（纯 CSS）走旧路径

4. **简化 ThemePanel**
   - 移除"手写 CSS"创建模式
   - 导入导出格式改为 ThemeDefinition JSON
   - 可视化设计器绑定 `DesignTokens` 而非 `DesignerVariables`

5. **测试**
   - 17 套主题渲染测试
   - 渲染一致性测试（对比新旧 CSS）
   - ThemeStore 迁移测试

### 预计影响

- 移除：手写 CSS 模式、`buildThemeCss()` 拼接逻辑
- 修改：`builtInThemes.ts`、`themeStore.ts`、`ThemePanel.tsx`、`ThemePanelView.tsx`
- 新增：17 套 Theme JSON 文件（`builtin-themes/` 目录）

---

> 下一步：等待确认后开始 Phase 2。
