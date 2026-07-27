# Phase 2 改造总结：内置主题迁移 + ThemeStore 对接 + UI 简化

> 完成时间：2026-07-27 | 测试：179/179 全部通过（含新增 92 个 ThemeRenderer 测试）

---

## 一、完成情况

### 1.1 新增文件

| 文件                                                 | 说明                                        |
| ---------------------------------------------------- | ------------------------------------------- |
| `packages/core/src/builtin-themes/index.ts`          | 12 套内置主题的 `ThemeDefinition` JSON 数据 |
| `docs/phase-reports/phase1-theme-schema-renderer.md` | Phase 1 报告（已有，Phase 2 引用）          |

### 1.2 修改文件

| 文件                                               | 改动   | 说明                                                    |
| -------------------------------------------------- | ------ | ------------------------------------------------------- |
| `packages/core/src/theme-schema/types.ts`          | +2 行  | 添加 `codeTheme` 字段                                   |
| `packages/core/src/theme-renderer/index.ts`        | 重写   | 注入 4 份组件默认 CSS + 代码高亮选择 + ESM 导入         |
| `packages/core/src/index.ts`                       | +3 行  | 导出 `renderTheme` / `getBuiltInThemeDefinition` / 类型 |
| `apps/web/src/store/themes/builtInThemes.ts`       | +3 行  | `CustomTheme` 新增 `definition?: ThemeDefinition`       |
| `apps/web/src/store/themeStore.ts`                 | +18 行 | `getThemeCSS` 优先走 `renderTheme` 渲染管线             |
| `apps/web/src/components/Theme/ThemePanelView.tsx` | -13 行 | 移除"手写 CSS"创建模式卡片                              |

### 1.3 测试

| 测试文件                | 用例数  | 状态               |
| ----------------------- | ------- | ------------------ |
| `ThemeRenderer.test.ts` | 92      | 全部通过           |
| 其余 9 个测试文件       | 87      | 全部通过（无回归） |
| **合计**                | **179** | **全部通过**       |

---

## 二、关键变更

### 2.1 ThemeRenderer 完善

```
renderTheme(theme) 渲染管线:
  ├─ renderBaseCss()           → 基础重置
  ├─ renderTokenCss(tokens)    → CSS 变量（14 个 --wemd-*）
  ├─ renderTypographyCss()     → 排版 + 8 种 heading preset
  ├─ renderComponentCss()      → 引用/代码/表格/脚注等
  ├─ injectVariantCss()        → 组件变体
  ├─ injectCodeTheme()         → github / github-dark
  ├─ injectComponentStyles()   → 30 个 WeMD 组件默认样式 ← NEW
  └─ renderExtrasCss()         → Callout / Mermaid
```

### 2.2 12 套内置主题

| #   | ID                   | 名称       | 主色             | codeTheme   |
| --- | -------------------- | ---------- | ---------------- | ----------- |
| 1   | `default`            | 默认主题   | #07c160 微信绿   | github      |
| 2   | `data-blueprint`     | 数据蓝图   | #3b82f6 科技蓝   | github-dark |
| 3   | `eastern-notes`      | 东方笺谱   | #c1272d 朱砂红   | github-dark |
| 4   | `clear-guide`        | 清晰指南   | #10b981 翠绿     | github-dark |
| 5   | `whitespace-gallery` | 留白画册   | #374151 极简灰   | github-dark |
| 6   | `academic-paper`     | 学术论文   | #1a1a2e 学术黑   | github      |
| 7   | `knowledge-base`     | 知识库     | #4a90d9 温和蓝   | github      |
| 8   | `luxury-gold`        | 黑金奢华   | #d4af37 金       | github      |
| 9   | `morandi-forest`     | 莫兰迪森林 | #7a9a7e 莫兰迪绿 | github      |
| 10  | `modern-editorial`   | 编辑部手记 | #2d3436 编辑黑   | github-dark |
| 11  | `receipt`            | 购物小票   | #2d3436 复古黑   | github      |
| 12  | `sunset-film`        | 落日胶片   | #e67e22 暖橙     | github      |

每套主题包含独立的 `layout.preferredComponents` / `layout.tone` / `layout.magazineLevel`，为 Phase 3 的 AI 排版联动做准备。

### 2.3 ThemeStore 渲染管线切换

```
修改前：getThemeCSS(id) → builtInThemes[].css（CSS 字符串）
修改后：getThemeCSS(id) →
        1. getBuiltInThemeDefinition(id) → renderTheme(def)  ← 12 套新格式
        2. builtInThemes[].css                                ← 5 套 legacy 降级
        3. customThemes[].definition → renderTheme(def)        ← 自定义有定义
        4. customThemes[].css                                  ← 自定义纯 CSS 降级
```

### 2.4 ThemePanel 简化

- 创建主题时只显示 2 种模式：**可视化设计** + **AI 生成**
- 移除"手写 CSS"入口（但已有 CSS 模式主题继续兼容）
- AI 生成后仍可在 CSS 编辑器中微调

---

## 三、向后兼容

- **5 套隐藏内置主题**（极光玻璃/包豪斯/赛博朋克/新粗野主义/模板）：保持 CSS 字符串格式，不在主题列表展示
- **已有自定义主题**：CSS 字符串格式继续工作
- **可视化编辑器生成的 designerVariables**：继续通过 `generateCSS()` 渲染
- **编辑器/预览/微信复制**：CSS 来源变更但 `processHtml()` 接口不变

---

## 四、Phase 3 计划

### 目标：AI 主题生成升级 + Design Language 整合 + 组件变体扩展

### 任务

1. **AI 主题生成器改造**：输出 ThemeDefinition JSON 而非 CSS
   - Prompt 改为"设计主题"，输出结构化 JSON
   - `validateThemeDefinition()` 结构校验
   - `renderTheme()` 生成 CSS 预览

2. **AI 排版感知主题**
   - `AiDesignPanel` 打开时读取 `theme.layout`
   - 将 layout 偏好注入 `analysisAgent` prompt
   - 删除独立的 `designLanguage.matchDesignLanguage()` 匹配算法

3. **组件变体扩展**：为更多组件提供变体（quote-card / cta-card / divider-fancy）

4. **主题导出升级**：导出 ThemeDefinition JSON（可导入编辑）

---

> 下一步：等待确认后开始 Phase 3。
