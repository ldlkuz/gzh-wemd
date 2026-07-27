# WeMD 主题系统 & AI 排版功能现状分析

> 本文梳理项目中**主题管理**和 **AI 排版**两套体系的完整现状，记录功能边界、架构设计和现存问题，为后续整合提供参考。

---

## 一、主题系统（Theme）

### 1.1 定位演变

```
v1  公众号模板 — 选模板=换皮肤，纯视觉
v2  组件跟随主题 — 组件颜色通过 var(--wemd-*) 跟随主题变动，出现兼容问题
v3  现状 — 17 套内置主题 + 自定义主题 + 可视化设计器，但定位模糊
```

### 1.2 数量与分类

| 类别       | 数量  | 详情                                                                                                      |
| ---------- | ----- | --------------------------------------------------------------------------------------------------------- |
| 内置可选   | 12 套 | 默认/数据蓝图/东方笺谱/清晰指南/留白画册/学术论文/知识库/黑金奢华/莫兰迪森林/编辑部手记/购物小票/落日胶片 |
| 内置隐藏   | 5 套  | 极光玻璃/包豪斯/赛博朋克/新粗野主义/主题模板（不可选用，仅兼容历史文章）                                  |
| 用户自定义 | 不限  | 可视化设计 / 手写 CSS / AI 生成 CSS 三种创建方式                                                          |

### 1.3 CSS 组成结构

每套主题 CSS 由 6 层拼接而成（`buildThemeCss()`）：

```
basicTheme               ← 全局基础样式重置（段落/标题/列表/链接/代码块/表格/脚注）
+ themeSpecific           ← 该主题特有样式（颜色、字体、氛围）
+ codeTheme               ← 代码高亮主题（github / github-dark）
+ themeVars（兜底注入）    ← 如果主题不带 --wemd-primary，从 theme-variables.ts 注入 16 套之一
+ componentStylesDefault  ← 组件默认样式
+ componentStylesExtra    ← 额外组件样式
+ componentStylesFaq      ← FAQ 组件样式
+ componentStylesMagazine ← 杂志排版组件样式
```

### 1.4 两套 CSS 变量体系

**A. 组件色变量（theme-variables.ts，16 套）** — 供组件样式引用，实现主题跟随：

```
--wemd-primary / --wemd-primary-dark / --wemd-primary-light
--wemd-secondary / --wemd-accent
--wemd-bg-soft / --wemd-bg-card / --wemd-bg-muted
--wemd-text-strong / --wemd-text-normal / --wemd-text-soft
--wemd-border
```

组件使用方式：`var(--wemd-primary, #07c160)` — 有主题变量就用，没有就 fallback 到微信绿。

**B. 可视化设计器变量（100+ 个）** — 供可视化编辑器 generated CSS 使用：

覆盖全局/标题(h1-h4)/段落/引用/代码/图片/链接/表格/分割线/列表/脚注/提示块/Mermaid。

### 1.5 主题管理功能清单

| 功能          | 入口                | 说明                                          |
| ------------- | ------------------- | --------------------------------------------- |
| 选择/切换主题 | Header → 主题管理   | 打开 ThemePanel，多选一，点击应用             |
| 创建主题      | ThemePanel          | 支持三种模式：可视化设计 / 手写 CSS / AI 生成 |
| 编辑主题      | ThemePanel          | 可视化模式可进入 10 个 Tab 的设计器           |
| 复制主题      | ThemePanel          | 基于现有主题创建副本                          |
| 删除主题      | ThemePanel          | 仅自定义主题可删除                            |
| 导入/导出     | ThemePanel          | JSON 格式导出（含可视化变量），CSS 格式导出   |
| AI 生成主题   | AiThemeGenerator    | 自然语言描述 → 流式生成 CSS                   |
| 实时预览      | ThemeLivePreview    | iframe 隔离预览，CSS 不污染编辑器             |
| 移动端选择    | MobileThemeSelector | 仅展示列表，点击即应用，无编辑功能            |
| 暗色模式      | 全局                | 自动转换 CSS，缓存按 hash 管理                |

### 1.6 核心文件

| 文件                                                 | 用途                       |
| ---------------------------------------------------- | -------------------------- |
| `packages/core/src/themes/`                          | 22 个主题 CSS 源文件       |
| `packages/core/src/ThemeProcessor.ts`                | HTML+CSS 内联处理（juice） |
| `packages/core/src/wechatDarkMode.ts`                | 深色模式 CSS 转换          |
| `apps/web/src/store/themeStore.ts`                   | Zustand 状态管理           |
| `apps/web/src/store/themes/builtInThemes.ts`         | 内置主题拼接逻辑           |
| `apps/web/src/components/Theme/ThemePanel.tsx`       | 主题管理面板               |
| `apps/web/src/components/Theme/ThemePanelView.tsx`   | 面板视图层                 |
| `apps/web/src/components/Theme/ThemeLivePreview.tsx` | iframe 实时预览            |
| `apps/web/src/components/Theme/ThemeDesigner/`       | 可视化设计器（10 分类）    |
| `apps/web/src/components/Theme/AiThemeGenerator.tsx` | AI 主题 CSS 生成器         |

### 1.7 调用链路

```
用户操作 → ThemePanel → themeStore.selectTheme()
    ├─ MarkdownPreview 实时预览（processHtml + <style>）
    ├─ 复制到公众号（processHtml 内联 + 剪贴板）
    └─ 复制 HTML（processHtml + 下载）
```

---

## 二、AI 排版系统

### 2.1 总体架构

AI 排版系统负责**文章的布局设计和组件策略**，与主题系统（负责视觉样式）是两套独立体系。

### 2.2 三层推理流程

```
阶段1（Profile）：分析文章
    ├─ 识别文章类型（tutorial/story/data/opinion/list/news/product）
    ├─ 建立文章画像（category/tone/purpose/depth）
    ├─ 匹配设计语言（5 套之一）
    └─ 生成槽位计划（slotPlan：哪些组件，放头/中/尾，多少个）

阶段2（Execute）：填充组件
    ├─ 按槽位计划逐个生成组件内容
    ├─ 决定插入位置（文首/文末/段后:N）
    └─ 输出 insertions[]
```

### 2.3 Design Language（设计语言，5 套）

| ID              | 名称       | 适合场景           | 杂志化等级 |
| --------------- | ---------- | ------------------ | ---------- |
| `warm-magazine` | 温暖杂志风 | 故事/情感/生活方式 | high       |
| `apple-minimal` | 苹果极简风 | 产品/品牌/商业     | low        |
| `tech-data`     | 技术数据风 | 技术/教程/数据报告 | medium     |
| `editorial`     | 编辑体     | 深度报道/商业分析  | medium     |
| `playful-card`  | 活泼卡片风 | 清单/合集/轻松内容 | high       |

每套 Design Language 包含：

- `tone[]` — 适配的语气
- `categories[]` — 适配的文章类别
- `purposes[]` — 适配的写作目的
- `variantMap` — 推荐的组件变体
- `magazineLevel` — 杂志化等级

匹配算法：tone(+3) + category(+2) + purpose(+2)，最高分当选。

### 2.4 语义推荐系统

在 Profile 阶段之后，基于文章画像做语义推荐：

| 推荐维度                         | 说明                                                         |
| -------------------------------- | ------------------------------------------------------------ |
| `recommendEndingIntent(purpose)` | 根据写作目的推荐结尾意图（e.g. Guide→CTA, Discussion→Share） |
| `recommendCategories(category)`  | 根据内容类别推荐组件清单                                     |
| `recommendComplexity(depth)`     | 根据内容深度推荐排版复杂度                                   |

### 2.5 组件变体系统（Phase 3 已开始）

组件样式通过 `data-variant` 属性隔离不同风格变体：

```
share-card[data-variant="warm"]   → 温暖渐变背景
share-card[data-variant="minimal"] → 极简线条
share-card[data-variant="tech"]   → 科技边框
```

Design Language 的 `variantMap` 决定了每个组件用什么变体。

### 2.6 两种排版模式

| 模式         | 入口                       | 特点                                                   |
| ------------ | -------------------------- | ------------------------------------------------------ |
| **组件插入** | AI 设计面板 → 组件插入 Tab | AI 逐个建议插入位置，用户预览后采纳/跳过，最后批量应用 |
| **杂志排版** | AI 设计面板 → 杂志排版 Tab | AI 一键生成完整 Template JSON，全文预览后整体应用      |

### 2.7 统一 UI 入口（已合并）

```
工具栏 "AI 设计" 按钮（Workflow 图标 + AI 设计 文字）
    └─ AiDesignPanel 统一面板
        ├─ 读者画像选择：普通读者 / 程序员 / 管理者 / 小白
        ├─ 排版复杂度：简洁 / 适中 / 丰富
        ├─ Tab: 组件插入
        └─ Tab: 杂志排版
```

### 2.8 核心文件

| 文件                                                     | 用途                                           |
| -------------------------------------------------------- | ---------------------------------------------- |
| `apps/web/src/services/ai/analysisAgent.ts`              | 多层推理主逻辑（Profile → Plan → Execute）     |
| `apps/web/src/services/ai/articleProfile.ts`             | Article Profile 定义和推断                     |
| `apps/web/src/services/ai/designLanguage.ts`             | 5 套 Design Language 定义和匹配                |
| `apps/web/src/services/ai/semanticMapper.ts`             | 语义推荐（ending/category/complexity）         |
| `apps/web/src/services/ai/designPatterns.ts`             | 7 种文章类型的设计模式（槽位定义）             |
| `apps/web/src/services/ai/applyInsertions.ts`            | 将 insertions 应用到 Markdown 文本             |
| `apps/web/src/services/template/templateAgent.ts`        | Template JSON AI 生成器                        |
| `apps/web/src/services/template/templatePrompt.ts`       | Template 模式 prompt                           |
| `apps/web/src/services/template/renderer.ts`             | Template → Markdown 渲染器                     |
| `apps/web/src/services/template/types.ts`                | Template JSON / LayoutNode 类型                |
| `apps/web/src/components/Editor/AiDesignPanel.tsx`       | 统一 AI 设计面板                               |
| `apps/web/src/components/Editor/AiLayoutPanel.tsx`       | 旧组件插入面板（复用 COMPONENT_LABELS 等导出） |
| `apps/web/src/components/Editor/TemplateLayoutPanel.tsx` | 旧模板排版面板（已被 AiDesignPanel 替代）      |
| `packages/core/src/components/variants/variantCss.ts`    | 组件变体 CSS 定义                              |

---

## 三、两套系统的交集与断层

### 3.1 目前没有连接的地方

| 维度       | 主题（Theme）                | AI 排版（Design Language）   | 关系             |
| ---------- | ---------------------------- | ---------------------------- | ---------------- |
| 颜色体系   | 16 套色变量                  | 不在 prompt 中               | **无关联**       |
| 字体大小   | 100+ 变量可调                | 不知道                       | **无关联**       |
| 氛围基调   | 有（莫兰迪/黑金/赛博朋克等） | 有（Warm/Serious/Modern 等） | **重叠但不互通** |
| 杂志化等级 | 无                           | 有（high/medium/low）        | **无关联**       |
| 组件样式   | 跟随主题色（var(--wemd-\*)） | 通过 variantMap 选变体       | **可能冲突**     |

### 3.2 实际后果

1. **用户选了"A"主题 + AI 给了"B"风格的排版** — 视觉冲突
2. **组件同时受主题色和变体影响** — 叠加后不可预测，兼容性差
3. **用户要的是"品牌一致性"** — 选一次主题后，每篇文章气质连贯，但目前实现不了
4. **AI 不知道主题的存在** — plan/execute prompt 中没有主题上下文

### 3.3 架构冗余

- 主题系统的可视化设计器（100+ CSS 变量、10 Tab）是**项目最复杂的 UI**，但主题本身已从"公众号模板"退化为"调色板"
- AI 主题 CSS 生成器（AiThemeGenerator）与 AI 排版系统（analysisAgent）完全独立，各有自己的 prompt 工程
- Design Language（5 套）和内置主题（17 套）数量、命名、分类体系完全不同

---

## 四、讨论中的整合方向

### 4.1 核心理念

```
主题 = 品牌规范 = 用户长期选择的"视觉身份"
    ├─ 不变的：配色 + 字体 + 氛围基调
    └─ 作为 AI 的输入约束

AI 排版 = 在主题框架内的自由创作
    ├─ 每次可以不同：组件选择、排列、杂志化程度
    └─ 但气质必须在主题基调内
```

### 4.2 待解决的问题

1. **组件是否继续跟随主题色？** — 如果变体系统独立，`var(--wemd-*)` 引用可以去掉
2. **Design Language 和 Theme 如何对应？** — 是合并为统一概念，还是保留为 AI 中间推理层？
3. **17 套主题是否需要精简？** — 当前功能复杂度与使用频率是否匹配？
4. **AI 设计面板如何感知当前主题？** — prompt 中需要注入主题上下文

---

> 文档生成时间：2026-07-27 | 项目分支：feature/component-ecosystem
