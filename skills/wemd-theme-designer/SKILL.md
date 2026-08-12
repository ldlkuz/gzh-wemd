---
name: "wemd-theme-designer"
description: "完整品牌视觉主题设计工具，6 阶段流程：品牌解读→概念创意→视觉设计→组件分析→组件映射→CSS编译。当用户需要为品牌生成完整的视觉主题规范时调用。"
---

# WeMD Brand Visual Theme Designer Skill

## Skill 定位

**核心职责** — AI 是视觉设计师，不是 CSS 工程师：

- 理解品牌，建立视觉语言系统
- 通过 Component Registry 了解系统组件
- 对 Brand Anchor 组件进行深度设计，Content 和 Utility 组件继承并克制表达

**不负责**（由主程序或独立脚本机械执行，AI 设计师不参与其设计/实现细节）：

- 组件级选择器映射（组件名 → DOM class）— 由主程序维护标准选择器注册表
- 主题文件打包为 `.wemd-theme` 压缩包 — 由 skill 内脚本 `scripts/pack-theme.cjs` 机械执行
- 渲染验证和跨浏览器兼容性测试 — 由主程序/独立脚本执行

**本 Skill 内的 Compiler 阶段（Stage 6）负责**：

- 将 BrandVisualTheme 编译为 CSS 变量系统
- 按三分类策略生成组件样式
- 输出开发预览 HTML 和公众号发布 HTML

## 状态流架构

整个流程是 **每一步只读一个小状态 JSON + 当前需要的组件**，不读历史对话。

```text
品牌输入
   ↓
Stage 1 → creative/brand_state.json          ─┐
   ↓                                           │
Stage 2 → creative/concept_state.json          │ 创意阶段
   ↓  ⬅ 用户从 3 个母题候选中选择 1 个          │ 无组件约束
Stage 3 → creative/visual_language.json       ─┘
   ↓
Stage 4 → translator/component_strategy.json  ─┐ 翻译阶段
   ↓                                           │ 组件映射
Stage 5 → translator/component_mapping.json   ─┘
   ↓
Assembler → output/BrandVisualTheme.json
   ↓
Compiler 子阶段A → output/preview/*.html       ⬅ 生成阶段
Compiler 子阶段B → output/publish/*.html
   ↓
Stage 7 → output/{theme-name}.wemd-theme       ⬅ 主题打包
```

> **State 是 AI 的工作记忆，BrandVisualTheme 是产品交付物。**

## 创意阶段 vs 翻译阶段

| 维度         | 创意阶段 (Stage 1-3)         | 翻译阶段 (Stage 4-5)        |
| ------------ | ---------------------------- | --------------------------- |
| 思维模式     | 杂志美术总监                 | 设计系统工程师              |
| 关注点       | 视觉感受、情绪、节奏         | 组件能力、分类、约束        |
| 使用的语言   | 页面区域、视觉焦点、阅读节奏 | title、image、card、divider |
| 是否知道组件 | ❌ 不允许接触组件            | ✅ 必须使用组件             |
| 输出         | `creative/` 下的 State       | `translator/` 下的 State    |

## 整体流程

```text
用户输入品牌信息
      │
      │ ════════════════════════════════════
      │   创意阶段：纯视觉创作，无组件约束
      │ ════════════════════════════════════
      ↓
阶段 1：Brand Interpretation → creative/brand_state.json
      ↓
阶段 2：Visual Concept → creative/concept_state.json
      ↓  ⬅ 用户从 3 个母题候选中选择 1 个（视觉没有唯一答案）
阶段 3：Visual Design → creative/visual_language.json
      │  ⚠️ 本阶段不允许接触任何组件概念
      │
      │ ════════════════════════════════════
      │   翻译阶段：将创意方案映射到 WeMD 组件
      │ ════════════════════════════════════
      ↓
阶段 4：Component Analysis → translator/component_strategy.json
阶段 5：Component Mapping → translator/component_mapping.json
      ↓
Assembler → output/BrandVisualTheme.json
      ↓
自检 ← 对照 prompts/self-check.md
      ↓
Compiler 子阶段 A → output/preview/{theme-name}-preview.html
Compiler 子阶段 B → output/publish/{theme-name}.html
      ↓
阶段 7 主题打包 → output/{theme-name}.wemd-theme
      ↓
Theme Complete ✅
```

## 状态机

| 状态                  | 说明           | 输入                                            | 输出                                          |
| --------------------- | -------------- | ----------------------------------------------- | --------------------------------------------- |
| `NEW`                 | 初始状态       | 无                                              | 品牌输入表单                                  |
| `BRAND_INTERPRETING`  | 阶段 1         | 用户输入                                        | `creative/brand_state.json`                   |
| `CONCEPTING`          | 阶段 2         | `brand_state`                                   | `creative/concept_state.json`（3 个母题候选） |
| `SELECTING_METAPHOR`  | 用户选择母题   | `concept_state`                                 | 选中的母题（写入 `concept_state`）            |
| `VISUAL_DESIGNING`    | 阶段 3         | `concept_state`（已定母题）                     | `creative/visual_language.json`               |
| `ANALYZING`           | 阶段 4         | `visual_language` + `registry/components.json`  | `translator/component_strategy.json`          |
| `COMPONENT_DESIGNING` | 阶段 5         | `visual_language` + `component_strategy`        | `translator/component_mapping.json`           |
| `MERGING`             | Assembler 合并 | 5 个 State                                      | `output/BrandVisualTheme.json`                |
| `SELF_CHECK`          | 自检           | 完整主题                                        | 检查通过/修改                                 |
| `COMPILING_PREVIEW`   | 子阶段 A       | `BrandVisualTheme` + `registry/components.json` | `output/preview/*.html`                       |
| `COMPILING_PUBLISH`   | 子阶段 B       | 开发预览 HTML                                   | `output/publish/*.html`                       |
| `PACKING`             | 阶段 7         | `BrandVisualTheme` + CSS                        | `output/*.wemd-theme`                         |
| `COMPLETE`            | 完成           | —                                               | 全部输出                                      |

## 核心 Prompt 原则

```text
你是一位视觉设计师，不是 CSS 生成器。

阶段 1 — 创意（Stage 1-3）：
  完全不要考虑组件。
  用页面级视觉体验来描述。
  使用"首屏区域""视觉焦点""阅读节奏""强调块"这类词。
  不要使用"标题""图片""卡片""引用""分割线"这类词。

阶段 2 — 翻译（Stage 4-5）：
  现在读取创意产物与组件注册表。
  把创意愿景翻译进 WeMD 组件系统。
  把所有组件划分为三类：
    - Brand Anchor（上限 6 个）：投入深度设计
    - Content（大部分）：一致地继承视觉语言
    - Utility（少数）：保持极简、不抢眼
  只有 Brand Anchor 才允许大胆且有表现力。
```

## 最重要的禁止事项

1. 先想 CSS 再思考品牌
2. 给每个组件使用完全相同的设计套路
3. 为了体现品牌给所有组件添加装饰
4. 强制所有组件使用统一圆角/品牌色
5. 把品牌化理解为颜色替换
6. 把参考图直接复制成模板
7. 默认设计全部组件为高复杂度
8. 让组件本身抢过内容
9. **在创意阶段思考组件**（创意阶段不允许知道组件存在）
10. **在组件 CSS 中使用微信不兼容特性**：`::before`/`::after`、`:hover`、结构伪类（`:first-child`/`:last-child`/`:first-of-type`/`:nth-child`）、`@keyframes`、`@media`、`animation`、`+`/`~` 兄弟选择器。详见 [reference/assembler-and-compiler.md](reference/assembler-and-compiler.md#wechat-compatibility)。
11. **未按"移动窄优先"设计**：最终载体是微信公众号约 343px 的单列窄流。所有阶段（创意→翻译→编译）都不得设计依赖宽幅或多栏才能成立的构图，编译时不产生 `@media` 响应式。创意阶段保持"手机窄长竖纸"画布隐喻，反感任何横向宽屏构图。

## 文件依赖索引

### Prompts（各阶段 Prompt）

| 文件                                  | 用途                           |
| ------------------------------------- | ------------------------------ |
| `prompts/01-brand.md`                 | 阶段 1：品牌解读               |
| `prompts/02-concept.md`               | 阶段 2：视觉概念               |
| `prompts/03-visual-design.md`         | 阶段 3：视觉设计（无组件约束） |
| `prompts/04-component-analysis.md`    | 阶段 4：组件分析               |
| `prompts/05-component-mapping.md`     | 阶段 5：组件映射               |
| `prompts/self-check.md`               | 自检清单                       |
| `css-compiler/prompts/06-compiler.md` | 阶段 6：编译                   |

### Reference（详细规则）

| 文件                                  | 用途                                                   |
| ------------------------------------- | ------------------------------------------------------ |
| `reference/input-format.md`           | 输入格式（必填 / 文件资产 / 可提取 / 可选）            |
| `reference/output-format.md`          | 输出格式（CreativeTheme / BrandVisualTheme JSON 示例） |
| `reference/assembler-and-compiler.md` | Assembler 合并规则 + Compiler 编译规则 + 微信兼容性    |
| `reference/component-retrieval.md`    | 组件检索机制（按需匹配）                               |
| `reference/theme-packing.md`          | 阶段 7 主题打包详细规则                                |

### Registry & Schema

| 文件                                        | 用途                                      |
| ------------------------------------------- | ----------------------------------------- |
| `registry/components.json`                  | 组件注册表（43 个组件的结构化 JSON 定义） |
| `creative/brand_state.schema.json`          | 阶段 1 输出格式                           |
| `creative/concept_state.schema.json`        | 阶段 2 输出格式                           |
| `creative/visual_language.schema.json`      | 阶段 3 输出格式                           |
| `translator/component_strategy.schema.json` | 阶段 4 输出格式                           |
| `translator/component_mapping.schema.json`  | 阶段 5 输出格式                           |
| `output/CreativeTheme.schema.json`          | 创意阶段设计稿 Schema                     |
| `output/BrandVisualTheme.schema.json`       | 最终主题规范 Schema                       |
| `output/example/demo-theme.json`            | 完整示例                                  |

### 脚本

| 文件                                 | 用途                                               |
| ------------------------------------ | -------------------------------------------------- |
| `scripts/pack-theme.cjs`             | 阶段 7：打包脚本（打包前自动校验 CSS）             |
| `scripts/validate-theme.cjs`         | 阶段 7：验证脚本                                   |
| `scripts/export-html.cjs`            | HTML 导出脚本                                      |
| `scripts/validate-css-selectors.mjs` | 打包前校验 CSS 选择器 + 嵌套 var（拦截臆造 class） |
| `scripts/extract-dom-snapshot.mjs`   | 从主程序真源自动生成 `reference/dom-structure.md`  |

## 工作模式

### Creative Mode（创作者模式）

输入最少，AI 自主完成全部推导。例如：`"一个激情的 AI 创作者。"`

创作者模式**同样产出 3 个视觉母题候选**供用户选择（与品牌模式一致），母题推导不依赖行业/客户，而是从**创作者的人格 + 创作主题 + 内容气质 + 受众**推导。Stage 1 会把 `industry` 重映射为创作主题、`customer` 重映射为受众（见 `prompts/01-brand.md`），Stage 2 据此推导母题（见 `prompts/02-concept.md`）。例如"激情的 AI 创作者"可能推出"舞台聚光灯"、"迸发的神经网络"、"实验室白板涂鸦"等不同母题。

### Brand Mode（品牌模式）

输入品牌介绍（100-300 字）+ Logo + 参考资料（可选）。硬约束：Logo 等文件资产不可修改；软约束：品牌人格必须体现；自由区域：视觉设计。

## 最终判断标准

1. **Brand** — 这个主题是否能让人感受到品牌人格？
2. **Consistency** — 不同组件是否像同一个设计系统？
3. **Hierarchy** — Brand Anchor 的视觉权重是否明显高于 Content/Utility？
4. **Restraint** — Content 和 Utility 组件是否足够克制？
5. **Creativity** — Brand Anchor 是否真正具有独特性？
6. **Readability** — 品牌表达是否影响正常阅读？
7. **Necessity** — 每一个 Brand Anchor 是否都有存在的理由？
8. **Efficiency** — Brand Anchor 是否不超过 6 个？
9. **Separation** — 创意阶段是否真的没有接触组件概念？

## 最终目标

> **"一套知道哪些地方应该大胆、哪些地方应该克制，并且整体具有明确品牌人格的视觉系统。"**

**创意阶段自由创作，翻译阶段克制映射。**
