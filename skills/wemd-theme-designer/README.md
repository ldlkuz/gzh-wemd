# wemd-theme-designer

**AI 品牌视觉主题设计工具** —— 输入品牌信息，自动生成一套完整的、可直接用于 GZH-WeMD 公众号排版的 `.wemd-theme` 主题包。

> 本 README 面向**使用者/开发者**，介绍 skill 能做什么、怎么跑、产物是什么。
> AI 代理在本 skill 内**执行任务的详细规范**见 [SKILL.md](./SKILL.md)（六个阶段的 Prompt 与状态机）。

---

## 它能做什么

无需手动调 CSS。只需提供品牌信息（名称、介绍、关键词即可），AI 会像"杂志美术总监 + 设计系统工程师"一样，端到端产出：

- **一套独特的视觉语言**（配色 / 字体 / 间距 / 形状 / 装饰方向）
- **约 6 个深度设计的焦点组件**（`components.focal`，软上限；其余组件克制继承）
- **可直接导入 GZH-WeMD 的完整主题包**（`.wemd-theme`）

已用该流程生成的主题示例：

| 主题                      | 视觉母题                            | 产物                                                |
| ------------------------- | ----------------------------------- | --------------------------------------------------- |
| 苍洱财税 · 税务核查档案室 | 税务局核查档案袋（红头文件/牛皮纸） | `themes/cangre-audit/cangre-audit.wemd-theme`       |
| 苍洱科创财税              | 深蓝琥珀 · 政策核查证据链           | `themes/cangre-kechuang/cangre-kechuang.wemd-theme` |

---

## 核心机制：视觉母题（Visual Metaphor）

这是本 skill 区别于"通用 AI 主题生成器"的关键，也是避免"所有科技企业主题长得一样"的解法。

- 从品牌档案的**差异化信号**（行业、客户、人格、`avoid` 避开方向、品牌独特故事）推导出具象的视觉隐喻。
- 例如"苍洱财税"的 `avoid: ["internet startup style", "too flashy"]` + "研发费加计扣除/备查资料" 业务 → 推导出 **"税务局核查档案袋"**（红头文件、核查清单、牛皮纸），而非千篇一律的"深蓝科技渐变"。
- 每个品牌会产出 **3 个风格迥异的母题候选**，由用户在预览后选择其一，再进入视觉设计与组件映射。

---

## 七阶段流程

```text
品牌输入
  │ ═══ 创意阶段：纯视觉创作，无组件约束 ═══
  ↓
Stage 1  品牌解读   → themes/{theme-name}/states/brand_state.json
  ↓
Stage 2  视觉概念   → themes/{theme-name}/states/concept_state.json   ← 用户从 3 个母题候选中选 1 个
  ↓
Stage 3  视觉设计   → themes/{theme-name}/states/visual_language.json
  │ ═══ 翻译阶段：映射到 WeMD 组件 ═══
  ↓
Stage 4  组件分析   → themes/{theme-name}/states/component_strategy.json
  ↓
Stage 4.5 骨架构图   → themes/{theme-name}/states/skeleton_intent.json（形）
  ↓
Stage 5  组件映射   → themes/{theme-name}/states/component_mapping.json（皮）
  ↓
Assembler 合并     → themes/{theme-name}/BrandVisualTheme.json
  ↓
Stage 6  编译（双输出）→ themes/{theme-name}/preview/*.html（开发预览）
  │                      themes/{theme-name}/publish/*.html（公众号发布）
  ↓
Stage 7  打包验证   → themes/{theme-name}/{theme-name}.wemd-theme
```

> 翻译阶段内部拆为**形 / 皮**两个子空间：Stage 4.5（形）只描述组件视觉怎么构图（`skeleton_intent.json`），Stage 5（皮）决定颜色/字体/间距（`component_mapping.json`）。先定形后定皮。

各阶段产物独立成 JSON，AI 每步只读上一个 State + 当前需要的组件，不依赖历史对话。

---

## 组件策略：三分类

系统共 **43 个排版组件**（见 `registry/components.json`），主题生成时按品牌表达力分为三类：

| 分类             | 数量   | 设计投入                                   |
| ---------------- | ------ | ------------------------------------------ |
| **Brand Anchor** | ≤ 6 个 | 深度设计，承载品牌独特视觉，是主题的"门面" |
| **Content**      | 多数   | 克制继承视觉语言，保证一致性与可读性       |
| **Utility**      | 少数   | 极简、低调，不抢内容                       |

> 注：主程序 GZH-WeMD 内置 **44 个组件**（多一个 `callout`），本 skill 的注册表聚焦可用于深度主题设计的 43 个，两者范围不同但相关。

---

## 目录结构

```text
wemd-theme-designer/
├── SKILL.md                 # AI 执行规范（七阶段 Prompt + 状态机）
├── README.md                # 本文件（使用/开发说明）
├── skill.json               # skill 元信息
├── schema/                  # 共享 Schema（规范，不随主题变化）
│   ├── brand_state.schema.json … component_mapping.schema.json
│   ├── CreativeTheme.schema.json      # 创意阶段设计稿 Schema
│   └── BrandVisualTheme.schema.json   # 最终主题规范 Schema
├── prompts/                 # 各阶段 Prompt
│   ├── 01-brand.md … 04-component-analysis.md
│   ├── 04.5-skeleton-composition.md
│   ├── 05-component-mapping.md
│   └── self-check.md
├── css-compiler/prompts/    # Stage 6 编译 Prompt
├── reference/               # 输入/输出格式、Assembler/Compiler、组件检索、打包规则、验收清单
│   └── example/demo-theme.json        # 完整示例（数据示例，非规范）
├── registry/components.json # 43 个组件的权威定义
├── scripts/
│   ├── compile-skeleton.cjs       # Stage 4.5：骨架 Intent → Mustache 模板（class 确定性推导）
│   ├── compile-preview.cjs        # Compiler 子阶段 A：开发预览 HTML
│   ├── compile-publish.cjs        # Compiler 子阶段 B：公众号发布 HTML（微信兼容）
│   ├── pack-theme.cjs             # Stage 7：打包 .wemd-theme（打包前自动校验 CSS）
│   ├── validate-theme.cjs         # Stage 7：校验 manifest
│   ├── validate-css-selectors.mjs# 打包前校验 CSS 选择器 + 嵌套 var（拦截臆造 class）
│   └── extract-dom-snapshot.mjs   # 从主程序真源自动生成 reference/dom-structure.md
└── themes/                  # ★ 主题产物库，每个主题一个目录
    └── {theme-name}/
        ├── states/                 # AI 产出（6 个 State JSON）
        │   ├── brand_state.json
        │   ├── concept_state.json
        │   ├── visual_language.json
        │   ├── component_strategy.json
        │   ├── skeleton_intent.json  # Stage 4.5（形）
        │   └── component_mapping.json # Stage 5（皮）
        ├── BrandVisualTheme.json   # Assembler 产物（最终主题规范）
        ├── css/{theme-name}.css    # Compiler 产物（完整 CSS）
        ├── preview/                # 开发预览 HTML
        │   └── {theme-name}-preview.html
        ├── publish/                # 公众号发布 HTML
        │   └── {theme-name}.html
        ├── package/                # 打包中间产物（manifest/brand.md/styles/templates）
        └── {theme-name}.wemd-theme # 最终主题包（可直接导入主程序）
```

---

## 快速开始

### 生成一个主题

1. 向 AI 提供品牌信息（最简：品牌名 + 100~300 字介绍 + 3~5 个关键词；可选：Logo、品牌主色、官网、Slogan）。
2. AI 按六阶段推进，在 **Stage 2 停下让你从 3 个母题候选中选择 1 个**。
3. 确认母题后，AI 自动完成视觉设计、组件映射、编译与打包。

### 手动打包与验证

```powershell
# 在 skill 目录下执行
node scripts/compile-skeleton.cjs                     # 骨架 Intent → templates.json
node scripts/pack-theme.cjs <theme-name>              # 生成 themes/{theme-name}/package/
node scripts/validate-theme.cjs <theme-name>          # 校验 themes/{theme-name}/package/manifest.json
Compress-Archive -Path "./manifest.json","./brand.md","./styles","./templates" `
  -DestinationPath "..\<theme-name>.wemd-theme" -Force   # 压缩为最终主题包
```

### 导入主程序

将 `.wemd-theme` 主题包导入 GZH-WeMD 后，即可在公众号排版中直接套用该品牌的完整视觉风格。

---

## 关键设计原则

- **创意阶段禁止接触组件**：先谈视觉感受，不谈 title/card/divider。
- **移动窄优先**：最终载体是公众号约 343px 单列窄流，不产宽屏构图与 `@media`。
- **微信兼容**：CSS 不使用 `::before/::after`、`:hover`、结构伪类、`@keyframes`、`animation`、兄弟选择器。
- **克制优先**：Brand Anchor 是高预算焦点池（默认深度设计候选），Content/Utility 保持继承与低调。但母题需要时任何档位都可提权。
