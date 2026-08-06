# WeMD 主题生成器 — 技术文档

> **版本：** 2.1.0 | **架构：** AI Agent + Service Layer + Theme Studio 三层架构
> **核心定位：** Profile 驱动生成，一套生成逻辑，Brand / Creator 两种输入模板
> **文档用途：** 开发辅助文档，记录系统架构、接口、数据结构、设计决策等关键信息

---

## 目录

1. [系统架构总览](#1-系统架构总览)
2. [状态机](#2-状态机)
3. [6 层设计管道](#3-6-层设计管道)
4. [44 种合法组件](#4-44-种合法组件)
5. [API 接口文档](#5-api-接口文档)
6. [核心数据结构](#6-核心数据结构)
7. [文件结构](#7-文件结构)
8. [关键数据流](#8-关键数据流)
9. [开发指南](#9-开发指南)
10. [约束与限制](#10-约束与限制)

---

## 1. 系统架构总览

### 1.1 三层架构

```
┌──────────────────────────────────────────────────────────────────┐
│  Trae Work AI Agent（推理层）                                     │
│                                                                  │
│  ● 读取 SKILL.md（流程控制）                                       │
│  ● 读取 generate-theme.md（推理 prompt，12 阶段推理）              │
│  ● 读取 spec/ 文档（设计逻辑、约束、实现方案）                      │
│  ● 执行品牌分析 → 生成 Design Blueprint → 生成 44 组件 CSS        │
│  ● 通过 HTTP API 保存结果到 Service Layer                         │
│                                                                  │
│  契约：SKILL.md 定义流程，generate-theme.md 定义推理规则            │
│  输出：POST /api/projects/:id/ai-save { blueprint, components }   │
└──────────────────────────┬───────────────────────────────────────┘
                           │ HTTP REST API
┌──────────────────────────▼───────────────────────────────────────┐
│  Service Layer（后端服务层）                                       │
│                                                                  │
│  ● Express HTTP 服务器（端口 3456）                                │
│  ● REST API 集群：项目管理 / 状态管理 / 版本管理 / 审核流水线      │
│  ● 6 层 Pipeline 工具链（已弃用自动生成，改为纯工具链处理 AI 结果） │
│  ● 文件系统操作：项目目录、JSON 读写、ZIP 打包                     │
│  ● 任务队列：基于文件系统的 inbox/processing/done/failed 管理     │
│  ● 文章套用引擎：Markdown 解析 + 主题化 HTML 渲染                 │
│                                                                  │
│  入口：services/src/server.ts                                     │
│  启动：node --experimental-strip-types src/cli.ts server           │
└──────────────────────────┬───────────────────────────────────────┘
                           │ HTTP + 静态文件
┌──────────────────────────▼───────────────────────────────────────┐
│  Theme Studio（前端UI层）                                         │
│                                                                  │
│  ● 品牌资料收集（Brand / Creator Profile 表单）                   │
│  ● 组件编辑（44 种组件预览 + 源码查看 + 修改）                     │
│  ● 审核工作台（Blueprint 审核 + Theme 审核）                      │
│  ● 导出 .wemd-theme 主题包                                       │
│  ● 文章套用：Markdown 粘贴 → 主题化预览                          │
│                                                                  │
│  入口：services/public/index.html                                 │
│  访问：http://127.0.0.1:3456                                     │
└──────────────────────────────────────────────────────────────────┘
```

### 1.2 核心设计原则

| 原则                           | 说明                                                                 |
| ------------------------------ | -------------------------------------------------------------------- |
| **Profile 驱动生成**           | 不区分企业/个人，只关心有没有完整 Profile                            |
| **Service 是唯一入口**         | 所有数据操作必须经 Service，AI Agent 和 Theme Studio 都通过 API 操作 |
| **state.json 是唯一状态源**    | Skill 和 Theme Studio 通过读写 state.json 同步状态                   |
| **版本可追溯**                 | 每次 AI 修改创建新版本，不覆盖旧版本                                 |
| **Design Memory 是经验积累**   | 越用越统一，越用越精准                                               |
| **AI Agent 推理 + Skill 执行** | Agent 负责设计推理，Skill 负责项目管理、状态更新、编译打包           |

### 1.3 技术栈

| 组件     | 技术                                   |
| -------- | -------------------------------------- |
| 后端框架 | Express.js (Node.js)                   |
| 运行时   | Node.js 20+ (experimental strip types) |
| 前端     | 原生 HTML + CSS + JS (无框架依赖)      |
| 打包     | adm-zip                                |
| 类型系统 | TypeScript (渐进式类型)                |
| 包管理   | npm                                    |

---

## 2. 状态机

### 2.1 状态流转

```
                     ┌─────────┐
                     │   NEW   │  ← Skill 创建项目
                     └────┬────┘
                          │ Theme Studio 填写品牌资料
                     ┌────▼────┐
                     │  READY  │  ← Profile 完整
                     └────┬────┘
                          │ AI Agent 检测到 READY，执行推理
                     ┌────▼───────┐
                     │ GENERATING │  ← AI Pipeline 执行中
                     └────┬───────┘
                          │ 推理完成，调用 /ai-save
                     ┌────▼──────┐
                     │  PREVIEW  │  ← 可预览和修改
                     └────┬──────┘
                          │ 用户审核通过
                     ┌────▼───────┐
                     │  APPROVED  │  ← 审核完成
                     └────┬───────┘
                          │ 用户点击导出
                     ┌────▼───────┐
                     │  EXPORTED  │  ← 已导出 .wemd-theme
                     └────────────┘
```

### 2.2 状态文件结构

每个项目对应一个 `state.json`：

```json
{
  "projectId": "yunfan-tech",
  "status": "PREVIEW",
  "progress": {
    "step": 8,
    "total": 8,
    "current": "完成",
    "percent": 100
  },
  "updatedAt": "2026-08-06T10:00:00.000Z"
}
```

### 2.3 状态触发方

| 状态         | 触发方                          | 条件                               |
| ------------ | ------------------------------- | ---------------------------------- |
| `NEW`        | Skill 创建项目                  | `cli.ts create <name> <type>`      |
| `READY`      | Theme Studio 表单提交           | Profile 必填项齐全                 |
| `GENERATING` | Skill 检测到 READY              | 调用 Pipeline 或 AI Agent 执行推理 |
| `PREVIEW`    | Pipeline 完成 / `/ai-save` 调用 | 推理结果保存成功                   |
| `APPROVED`   | Theme Studio 审核操作           | 用户点击"审核通过"                 |
| `EXPORTED`   | Theme Studio 导出操作           | 用户点击"导出"                     |

### 2.4 审核驳回的状态回退

| 驳回阶段       | 回退状态  | 说明                               |
| -------------- | --------- | ---------------------------------- |
| Blueprint 驳回 | `NEW`     | 需要重新收集品牌资料或调整设计方向 |
| Theme 驳回     | `PREVIEW` | 需要修改组件样式后重新审核         |

---

## 3. 6 层设计管道

### 3.1 管道总览

> **重要说明：** Pipeline 自动生成已弃用，AI 推理由 Trae Agent 通过 `generate-theme.md` 推理完成。
> 当前的 Pipeline 代码作为**工具链**保留，用于处理 AI Agent 推理结果的补充操作（如补全基础组件样式、约束检查、质量评估等）。

```
┌─────────────────────────────────────────────────────────────────────┐
│ ① Logic Layer（设计层）—— AI Agent 推理 / 规则引擎 fallback         │
│   回答：应该设计成什么样？                                           │
│   输出：Design Blueprint（纯策略，不含 CSS）                         │
│   文档：design-logic-brand.md, design-logic-creator.md              │
│   文件：logic-layer.ts                                              │
├─────────────────────────────────────────────────────────────────────┤
│ ② Constraint Layer（约束层）—— 代码自动检查                          │
│   回答：哪些设计是公众号/WeMD 不支持的？                              │
│   角色：设计裁判，阻断违规设计                                       │
│   规则：C1-C6 六条约束规则                                          │
│   文件：constraint-layer.ts, spec/constraint-layer.md                │
├─────────────────────────────────────────────────────────────────────┤
│ ③ Decoration Layer（装饰层）—— 代码自动生成                         │
│   回答：每个组件用什么装饰原子？                                     │
│   角色：25 个装饰原子注册表 + 品牌过滤引擎 + 组合校验器 + 映射引擎   │
│   文件：decoration-layer.ts                                          │
├─────────────────────────────────────────────────────────────────────┤
│ ④ Application Layer（实现层）—— 代码自动生成                        │
│   回答：如何实现这个设计？                                           │
│   角色：A-E 方案优先级 + 生成 variantCss + 生成 HTML                 │
│   文件：application-layer.ts, spec/application-layer.md              │
├─────────────────────────────────────────────────────────────────────┤
│ ⑤ Compiler Layer（编译层）—— 代码自动生成                           │
│   回答：如何输出合规的 Theme Package？                                │
│   角色：manifest.json + brand.md + .wemd-theme ZIP                  │
│   文件：compiler-layer.ts, spec/theme-package-spec.md                │
├─────────────────────────────────────────────────────────────────────┤
│ ⑥ Feedback Layer（反馈层）—— 代码自动检查                           │
│   回答：设计目标是否实现了？                                         │
│   角色：5 维度质量评分 + 回退建议                                    │
│   文件：feedback-layer.ts, spec/feedback-layer.md                    │
└─────────────────────────────────────────────────────────────────────┘
```

### 3.2 各层详解

#### ① Logic Layer（设计层）

**当前状态：** AI Agent 推理（通过 `generate-theme.md` + spec 文档驱动），代码层 `logic-layer.ts` 作为 fallback 规则引擎

**AI Agent 推理步骤（generate-theme.md 12 阶段）：**

| 阶段 | 内容                                             | 输出                           |
| ---- | ------------------------------------------------ | ------------------------------ |
| 0    | 判断 Profile 类型 (brand/creator)                | 类型标签                       |
| 1    | 收集品牌资料（已在 Theme Studio 完成）           | BrandProfile / CreatorProfile  |
| 2    | 确认 Profile 完整性                              | 资料确认                       |
| 3    | 定义阅读体验（节奏、密度、情绪、叙事）           | 阅读体验画像                   |
| 4    | 品牌表达策略（Logo/Slogan/辅助图形使用规则）     | 品牌表达策略                   |
| 5    | 品牌元素→组件映射（六边形→timeline/divider/tag） | 组件表达映射表                 |
| 6    | 建立视觉语言（14 色调色板、排版、间距）          | 视觉语言规范                   |
| 7    | 建立布局语言（页面结构、组件流、层次）           | 布局策略                       |
| 8    | 约束检查（自检，确保无违规）                     | 约束检查结果                   |
| 9    | 应用层实现（生成 variantCss + HTML）             | 组件 CSS + HTML                |
| 10   | 自检（self-check.md 清单）                       | 自检结果                       |
| 11   | 保存结果到 Service Layer                         | POST /api/projects/:id/ai-save |

**代码层 fallback（logic-layer.ts）：**

- **关键词→风格映射（KEYWORD_STYLE_MAP）：** 10 个关键词（科技/创新/专业/AI/温暖/简约/文艺/商务/教育/健康），6 维风格（rhythm, density, emotion, visualWeight, narrative, whitespace）
- **关键词→组件映射（KEYWORD_COMPONENT_MAP）：** 10 个关键词，每个 4 个组件推荐
- **关键词→布局映射（KEYWORD_LAYOUT_MAP）：** 4 个关键词（科技/温暖/简约/商务）
- **主色→14 色调色板推导：** lighten/darken 算法
- **品牌/创作者表达策略生成：** 基于关键词合成
- **Design Memory 应用：** 偏好覆盖、拒绝方案过滤、已确认风格复用
- **BrandSystem 生成：** 品牌原则、Token、资产策略、组件规则

#### ② Constraint Layer（约束检查）

**入口：** `checkBlueprintConstraints(blueprint)`

| 规则 | 检查内容                                                       | 阻断级别      | 关键检查点                                                           |
| ---- | -------------------------------------------------------------- | ------------- | -------------------------------------------------------------------- |
| C1   | 微信公众号平台约束（伪元素、动画、fixed/sticky、filter）       | error         | shadow.enabled 必须 false                                            |
| C2   | WeMD 规范约束（组件名、mappedComponents 完整性）               | error         | 每个映射必须有 component/variant/reason                              |
| C3   | CSS 变量命名约束（`--wemd-xxx` 格式，禁止 `--wemd-color-xxx`） | error         | 14 色完整性检查                                                      |
| C4   | Schema 校验（Blueprint 结构完整性、必填字段）                  | error/warning | expression/readingExperience/visualLanguage/componentExpression 必填 |
| C5   | 品牌一致性（Logo 使用频率、brand-sign 组件）                   | warning       | header-only 模式建议增加曝光                                         |
| C6   | 组件合法性（所有组件名必须来自 LEGAL_COMPONENTS）              | error         | 检查 mappedComponents 中的组件名                                     |

**C4 Schema 校验详细检查项：**

- Blueprint 顶层字段：expression, readingExperience, visualLanguage, componentExpression
- expression.type 必须为 brand 或 creator
- readingExperience.tone 和 density 必须存在
- visualLanguage.colors 必须包含 7 个必需颜色（primary, primaryLight, primaryDark, background, surface, textPrimary, textSecondary）
- 颜色值格式校验（#hex 或 rgb/rgba）
- typography 必须包含 headingFont 和 bodyFont
- componentExpression.mappedComponents 不能为空，每个条目必须有 component/variant/reason
- brandSystem 完整性检查（principles, tokens, assetPolicy）

#### ③ Decoration Layer（装饰层）

**核心思想：** AI 决定"用什么装饰"，而不是"怎么写 CSS"

**组件：**

| 组件                           | 职责                                                              |
| ------------------------------ | ----------------------------------------------------------------- |
| `AtomRegistry` (ATOM_REGISTRY) | 25 个装饰原子注册表，每个原子包含 CSS 模板 + HTML 模板 + 参数定义 |
| `BrandFilterEngine`            | 品牌过滤引擎，根据关键词推荐可用原子，控制密度                    |
| `CombinationValidator`         | 组合校验器，检查位置冲突、背景互斥、Badge 独占等                  |
| `DecorationMapper`             | 映射引擎，将原子模板替换为具体 CSS + HTML                         |

**25 个装饰原子分类：**

| 分类       | 原子                                                                                      | 数量 |
| ---------- | ----------------------------------------------------------------------------------------- | ---- |
| Line       | line-left, line-bottom, line-underline, line-top, line-double, line-gradient, line-dashed | 7    |
| Badge      | badge-number, badge-dot, badge-pill, badge-icon, badge-stroke                             | 5    |
| Pattern    | pattern-dot, pattern-grid, pattern-hexagon                                                | 3    |
| Icon       | icon-emoji, icon-arrow, icon-star, icon-quote                                             | 4    |
| Corner     | corner-rounded, corner-soft, corner-pill, corner-square                                   | 4    |
| Divider    | divider-solid, divider-gradient, divider-wave, divider-icon                               | 4    |
| Background | bg-gradient, bg-solid, bg-soft, bg-card                                                   | 4    |

**组合校验规则：**

| 规则                  | 说明                         | 严重程度 |
| --------------------- | ---------------------------- | -------- |
| POSITION_CONFLICT     | 两个原子占据相同位置槽位     | error    |
| BACKGROUND_MUTEX      | 背景原子互斥（只能选一个）   | error    |
| BADGE_EXCLUSIVE       | Badge 原子独占（只能选一个） | error    |
| PATTERN_OVERLAY       | 纹理叠加超过 1 个            | warning  |
| ATOM_COUNT_EXCEEDED   | 装饰原子数超过密度限制       | warning  |
| CORNER_BORDER_OVERLAP | 边角原子和线条原子共存       | warning  |

**关键词→原子映射（KEYWORD_ATOM_MAP）：** 18 个关键词，每个映射到 12-13 个推荐原子

#### ④ Application Layer（实现层）

**入口：** `generateVariants(blueprint)`

**方案优先级（A-E）：**

- A: Decoration Layer 提供了 CSS 映射 → 基础样式 + 装饰样式合并
- B: 硬编码组件 CSS（generateComponentCSS）→ 9 个核心组件有详细 CSS
- C: 基础组件 CSS（generateBaseComponentCSS）→ 通用样式
- D: 通用 fallback CSS → 最小样式

**生成内容：**

- 44 种组件的 variantCss（`#wemd` 包裹，`data-variant` 选择器）
- 44 种组件的 HTML 模板（`generateComponentSourceHtml`，含演示数据）
- 素材描述（`generateMaterialDescription`：Logo SVG、装饰图案）

#### ⑤ Compiler Layer（编译层）

**入口：** `compileTheme(blueprint, variants, materials)`

**输出内容：**

1. **manifest.json** — 主题包清单（sdkVersion, meta, tokens, layout, components, assets）
2. **brand.md** — 品牌语言说明文档（概述、语气、关键词、色彩体系、排版偏好、组件推荐）
3. **.wemd-theme ZIP** — 主题包（manifest.json + brand.md + assets/images/）

**ZIP 包结构：**

```
{slug}.wemd-theme
├── manifest.json
├── brand.md
└── assets/
    └── images/
        ├── logo-main.svg
        ├── pattern-dot.svg
        └── divider-wave.svg
```

**编译警告检查：**

- 组件 CSS 包含 `::before`/`::after` 伪元素
- 组件 CSS 包含 `filter:` 属性
- 组件 CSS 包含 `position:fixed`/`position:sticky`

#### ⑥ Feedback Layer（反馈层）

**入口：** `evaluateQuality(blueprint, constraintPassed, warnings, componentChecks?)`

> `componentChecks` 由 `checkComponentCss(component, variantCss, sourceHtml)` 对每个组件生成，包含选择器格式、硬编码颜色、伪元素、禁止定位、动画、滤镜、CSS 行数、子元素覆盖率 8 项检查结果。`compileFromAIResults()` 会在编译后自动调用此评估。

| 维度                   | 评分范围 | 评估内容                                                                                                                                                       | 权重               |
| ---------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ |
| F1 品牌一致性          | 0-100    | Logo 使用、brand-sign、Slogan 放置                                                                                                                             | 品牌类型附加 10 分 |
| F2 阅读体验            | 0-100    | 字号（14-18px）、行高（1.75）、阅读体验字段完整                                                                                                                | 最多 +50 分        |
| F3 组件覆盖与 CSS 质量 | 0-100    | 44 个组件全覆盖（不足=按比例×60 分）；全覆盖后按 CSS 质量扣分：选择器格式错误/伪元素/禁止定位/动画/滤镜/CSS过短 各扣 3 分，硬编码颜色/子元素覆盖率低 各扣 1 分 | 必须 44/44         |
| F4 约束遵守            | 0-100    | 约束检查是否通过（通过=100，不通过=60）                                                                                                                        | 必须 100           |
| F5 概念一致性          | 0-100    | 仅 Creator Profile：核心隐喻、概念元素、视觉张力                                                                                                               | 可选               |

**阈值：** 各项 ≥ 70/100 且 F4 必须 100/100 才算通过

### 3.3 管道编排步骤

系统存在 **两种执行模式**，由组件生成方式决定：

#### 模式 A：AI Agent 分批生成模式（主模式，推荐）

AI Agent 负责阶段 0-9 的全部推理和组件生成，Pipeline 工具链仅用于编译打包。

```
AI Agent 推理                          Pipeline 工具链
┌──────────────────────────┐          ┌──────────────────────────┐
│ 阶段 0-8：Design Blueprint│          │                          │
│ 阶段 9：分 7 批生成 44 CSS │──ai-save──→│ 接收并保存组件 CSS          │
│   9.1 signature (4 个)    │          │ (appendComponentVersion)  │
│   9.2 heading (4 个)      │          │                          │
│   9.3 container (10 个)   │          │ 进度跟踪                  │
│   9.4 data (9 个)         │          │ (1/7 → 2/7 → ... → 7/7)  │
│   9.5 interactive (6 个)  │          │                          │
│   9.6 code (2 个)         │          │ 最后一批 → 状态 PREVIEW    │
│   9.7 divider (9 个) ←────│──isLast──→│                          │
│                           │  Batch   │                          │
│ 阶段 10：自检              │          │ Compiler Layer            │
│                           │──compile─→│ manifest.json             │
│                           │          │ .wemd-theme ZIP           │
│                           │          │                          │
│                           │          │ Feedback Layer            │
│                           │          │ 质量评分 + 改进建议          │
└──────────────────────────┘          └──────────────────────────┘
```

**进度模型（分批模式）：**

| 阶段                                              | 触发方   | 进度       | 状态       |
| ------------------------------------------------- | -------- | ---------- | ---------- |
| ai-save batch=signature (第 1 批)                 | AI Agent | 1/7 (14%)  | GENERATING |
| ai-save batch=heading (第 2 批)                   | AI Agent | 2/7 (29%)  | GENERATING |
| ai-save batch=container (第 3 批)                 | AI Agent | 3/7 (43%)  | GENERATING |
| ai-save batch=data (第 4 批)                      | AI Agent | 4/7 (57%)  | GENERATING |
| ai-save batch=interactive (第 5 批)               | AI Agent | 5/7 (71%)  | GENERATING |
| ai-save batch=code (第 6 批)                      | AI Agent | 6/7 (86%)  | GENERATING |
| ai-save batch=divider, isLastBatch=true (第 7 批) | AI Agent | 7/7 (100%) | PREVIEW    |

#### 模式 B：Pipeline 自动生成模式（兼容模式，规则引擎备用）

当 AI Agent 不可用时，Pipeline 使用规则引擎（Logic Layer）自动生成。

`runFullPipeline()` 的 6 步执行流程，progress 使用 `TOTAL_STEPS = 8` 计算百分比（step 7 跳过，step 8 为完成标记）：

| 步  | 名称         | 调用                          | 进度（step/total） |
| --- | ------------ | ----------------------------- | ------------------ |
| 1   | 分析品牌     | Logic Layer                   | 1/8 (12.5%)        |
| 2   | 建立设计规范 | Constraint Layer              | 2/8 (25%)          |
| 3   | 生成组件     | Decoration Layer              | 3/8 (37.5%)        |
| 4   | 统一风格     | Application Layer             | 4/8 (50%)          |
| 5   | 生成资源     | Compiler Layer（编译 + 打包） | 5/8 (62.5%)        |
| 6   | 验证主题     | Feedback Layer                | 6/8 (75%)          |
| —   | 完成         | 状态更新为 PREVIEW            | 8/8 (100%)         |

> **注意：** 模式 B 中 `TOTAL_STEPS = 8`，但实际只调用 `updateProgress()` 6 次（step 1-6），完成后直接跳转到 step 8。
> step 7 保留为预留位，当前未使用。此模式生成的组件质量远低于模式 A，仅作为降级方案。

---

## 4. 44 种合法组件

### 4.1 完整列表

```typescript
const LEGAL_COMPONENTS = [
  // 核心组件（11 个）
  "hero-banner", // 开篇大图/品牌展示
  "toc-nav", // 目录导航
  "numbered-heading", // 编号标题
  "section-title", // 段落标题
  "quote-card", // 引用卡片
  "callout-pro", // 高级提示框
  "stats-block", // 数据统计
  "faq", // 常见问题
  "share-card", // 分享卡片
  "cta-card", // 行动号召
  "tag-label", // 标签

  // 装饰组件（5 个）
  "follow-bar", // 关注栏
  "divider-fancy", // 花式分割线
  "styled-table", // 样式表格
  "timeline", // 时间线
  "code-frame", // 代码框架

  // 内容组件（12 个）
  "article-section", // 文章引用
  "magazine-cover", // 杂志封面
  "section-divider", // 章节分割
  "image-card", // 图片卡片
  "text-card", // 文字卡片
  "full-quote", // 完整引用
  "two-column-cards", // 双列卡片
  "end-card", // 结尾卡片
  "product-card", // 产品卡片
  "brand-sign", // 品牌签名
  "resource-list", // 资源列表
  "testimonial-card", // 用户评价

  // 技术组件（5 个）
  "series-nav", // 系列导航
  "code-block", // 代码块
  "image-compare", // 图片对比
  "callout", // 提示框
  "table", // 表格

  // 交互组件（3 个）
  "accordion", // 折叠面板
  "steps", // 步骤
  "divider", // 分割线

  // 引用组件（3 个）
  "pullquote", // 拉引文
  "related-posts", // 相关文章
  "image-grid", // 图片网格

  // 尾部组件（3 个）
  "author-card", // 作者卡片
  "copyright-notice", // 版权声明
  "qr-card", // 二维码卡片

  // 图文组件（2 个）
  "image-text-row", // 图文混排
  "image-caption", // 图片说明
];
```

### 4.2 组件生成策略 — AI 全量分批生成

**核心原则：44 个组件全部由 AI 生成，每个组件独立设计，不使用模板填充。**

#### 4.2.1 为什么分批

44 个组件 × 平均 30 行 CSS ≈ 1300+ 行 CSS，单次 LLM 推理存在两个问题：

- **token 爆炸**：输出超长导致截断或质量下降
- **注意力稀释**：组件越多，AI 对每个组件的设计质量越低

因此按 **7 个原型组分 7 批生成**，每批 AI 聚焦于 2-10 个组件的品牌化设计。

#### 4.2.2 原型组划分

按组件的内容功能分组，同组组件共享设计上下文但各自独立设计：

| 批次 | 原型组        | 组件                                                                                                                            | 数量 | AI 设计重点                                          |
| ---- | ------------- | ------------------------------------------------------------------------------------------------------------------------------- | ---- | ---------------------------------------------------- |
| 1    | `signature`   | hero-banner, magazine-cover, end-card, brand-sign                                                                               | 4    | 品牌渐变、Logo 放置、Slogan 排版、封面构图、结尾签名 |
| 2    | `heading`     | numbered-heading, section-title, section-divider, toc-nav                                                                       | 4    | 标题层级、编号样式、目录结构、章节分隔视觉           |
| 3    | `container`   | text-card, image-card, product-card, testimonial-card, author-card, quote-card, two-column-cards, cta-card, share-card, qr-card | 10   | 卡片框架、内容排版、图片处理、双列布局、行动号召     |
| 4    | `data`        | stats-block, styled-table, table, timeline, resource-list, image-compare, image-grid, image-text-row, image-caption             | 9    | 数据展示、表格条纹、时间线连接线、网格布局、图片标注 |
| 5    | `interactive` | callout, callout-pro, faq, accordion, steps, follow-bar                                                                         | 6    | 交互提示、展开指示器、步骤连接线、关注按钮           |
| 6    | `code`        | code-block, code-frame                                                                                                          | 2    | 代码背景色、语法高亮色、header 栏、圆角处理          |
| 7    | `divider`     | divider-fancy, divider, full-quote, pullquote, article-section, related-posts, series-nav, copyright-notice, tag-label          | 9    | 分割线样式、引用块装饰、标签圆角、导航链接、版权声明 |

#### 4.2.3 品牌基因共享 vs 组件差异

**共享基因（来自 Design Blueprint，所有组件统一）：**

| 基因        | 来源                                       | 统一规则                                           |
| ----------- | ------------------------------------------ | -------------------------------------------------- |
| 14 色调色板 | `visualLanguage.colors`                    | 所有 CSS 用 `var(--wemd-xxx)` 引用，禁止硬编码颜色 |
| 排版规范    | `visualLanguage.typography`                | 标题/正文/代码字体、字号、行高统一                 |
| 间距系统    | `visualLanguage.spacing`                   | 组件内外间距使用统一间距值                         |
| 装饰密度    | `expression.decorationLevel`               | minimal/moderate/rich 全局一致                     |
| 圆角策略    | `visualLanguage.border.radius`             | 卡片、按钮、提示框圆角统一                         |
| 品牌元素    | `expression.logoUsage` / `sloganPlacement` | Logo/Slogan 放置规则统一                           |

**差异化体现在（每个组件对品牌基因的应用方式不同）：**

| 差异维度     | 示例                                                                                                                  |
| ------------ | --------------------------------------------------------------------------------------------------------------------- |
| 主色应用方式 | hero-banner → 渐变背景；stats-block → 数字强调色；callout → 左边框；steps → 连接线；code-block → 不用主色（深色反差） |
| 装饰策略     | hero-banner → 品牌图案背景；timeline → 时间节点圆点；divider-fancy → 图标居中；tag-label → 圆角药丸                   |
| 空间节奏     | hero-banner → 大留白(2.5em)；tag-label → 紧凑(0.3em 0.8em)；code-block → 中等(1.25em)                                 |
| 视觉层级     | numbered-heading → 大号编号+标题；section-title → 纯文字+下划线；toc-nav → 小号列表                                   |
| 内容结构     | two-column-cards → 双列网格；image-grid → 多列网格；stats-block → 三列等分；timeline → 垂直流式                       |

#### 4.2.4 生成流程

```
AI Agent 读取 generate-theme.md
  │
  ├─ 阶段 0-8：推理生成 Design Blueprint（品牌策略、14色、排版、装饰策略）
  │
  ├─ 阶段 9：分 7 批生成 44 个组件 CSS
  │   │
  │   ├─ 9.1 生成 signature 组 (4 个组件)
  │   │   → POST /ai-save { batch: "signature", components: [...] }
  │   │
  │   ├─ 9.2 生成 heading 组 (4 个组件)
  │   │   → POST /ai-save { batch: "heading", components: [...] }
  │   │
  │   ├─ 9.3 生成 container 组 (10 个组件)
  │   │   → POST /ai-save { batch: "container", components: [...] }
  │   │
  │   ├─ 9.4 生成 data 组 (9 个组件)
  │   │   → POST /ai-save { batch: "data", components: [...] }
  │   │
  │   ├─ 9.5 生成 interactive 组 (6 个组件)
  │   │   → POST /ai-save { batch: "interactive", components: [...] }
  │   │
  │   ├─ 9.6 生成 code 组 (2 个组件)
  │   │   → POST /ai-save { batch: "code", components: [...] }
  │   │
  │   └─ 9.7 生成 divider 组 (9 个组件)
  │       → POST /ai-save { batch: "divider", isLastBatch: true, components: [...] }
  │                                                    ↑ 最后一批触发状态 → PREVIEW
  │
  ├─ 阶段 10：自检（self-check.md 清单）
  └─ 阶段 11：完成
```

#### 4.2.5 每批 AI 的输入

| 输入               | 来源                                   | 说明                                                                     |
| ------------------ | -------------------------------------- | ------------------------------------------------------------------------ |
| Design Blueprint   | 阶段 0-8 生成                          | 品牌策略、14色、排版、装饰策略、布局策略                                 |
| 该组组件 HTML 模板 | `generateComponentSourceHtml()`        | 每个组件的 HTML 结构（子元素 class 名、嵌套层级）                        |
| Design Memory      | `design-memory.json`                   | 已确认的风格偏好、被拒绝的方案（避免重复生成）                           |
| 品牌元素映射       | `componentExpression.mappedComponents` | 品牌元素→组件的映射关系（如有）                                          |
| 已生成组件 CSS     | 前几批的结果                           | 确保风格一致性（AI 可参考已生成的 signature 组 CSS 来设计 container 组） |

#### 4.2.6 每个组件的输出要求

每个组件必须包含完整的设计输出：

```json
{
  "type": "hero-banner",
  "variant": "yunfan-hero-gradient",
  "variantCss": "#wemd .wemd-hero-banner[data-variant=\"yunfan-hero-gradient\"] { ... }",
  "sourceHtml": "<section class=\"wemd-hero-banner\" data-variant=\"yunfan-hero-gradient\">...</section>",
  "instruction": "主色渐变背景 + Logo 右上角 + Slogan 副标题，六边形纹理装饰"
}
```

| 字段          | 要求                                                            |
| ------------- | --------------------------------------------------------------- |
| `type`        | 必须来自 LEGAL_COMPONENTS（44 种之一）                          |
| `variant`     | 品牌相关命名（如 `yunfan-hero-gradient`），同原型组内可共享前缀 |
| `variantCss`  | 完整 CSS，`#wemd` 包裹 + `data-variant` 选择器，覆盖所有子元素  |
| `sourceHtml`  | 组件 HTML，含 `data-variant` 属性 + 装饰 DOM 元素               |
| `instruction` | 设计说明：品牌意图 + 设计决策 + 装饰选择理由                    |

#### 4.2.7 CSS 质量校验规则

| 规则                                             | 检查方式                                    | 阻断级别 |
| ------------------------------------------------ | ------------------------------------------- | -------- |
| 选择器格式 `#wemd .wemd-xxx[data-variant="yyy"]` | 正则匹配                                    | error    |
| 颜色使用 `var(--wemd-xxx)`                       | 扫描硬编码 hex/rgb                          | warning  |
| 禁止 `::before`/`::after`                        | 正则匹配                                    | error    |
| 禁止 `position: fixed`/`sticky`                  | 正则匹配                                    | error    |
| 禁止 `@keyframes`/`animation`                    | 正则匹配                                    | error    |
| 禁止 `filter`/`backdrop-filter`                  | 正则匹配                                    | error    |
| 子元素覆盖率                                     | 对比 HTML 模板中的 class 名                 | warning  |
| 装饰元素使用物理 DOM                             | 检查 HTML 中的 `<span class="wemd-*-deco">` | warning  |

#### 4.2.8 与旧策略的对比

| 维度        | 旧策略                                              | 新策略                         |
| ----------- | --------------------------------------------------- | ------------------------------ |
| AI 生成范围 | 4-9 个 mappedComponents                             | 全部 44 个组件                 |
| 非生成组件  | `padding: 1em; color: var(--wemd-textPrimary)` 占位 | 不存在，全部由 AI 设计         |
| 生成方式    | 单次调用，一次性提交                                | 分 7 批，按原型组提交          |
| 品牌一致性  | 仅 4-9 个组件体现品牌                               | 44 个组件全部体现品牌基因      |
| 组件差异    | 35 个组件完全相同                                   | 每个组件独立设计，应用方式不同 |
| CSS 质量    | 9 个有详细 CSS + 35 个一行 CSS                      | 44 个都有完整 CSS              |
| Token 压力  | 单次 ~300 行 CSS                                    | 单次 ~60-300 行 CSS（按批次）  |

### 4.3 组件状态

| 状态                 | 说明                         |
| -------------------- | ---------------------------- |
| `not-generated`      | 未生成（初始状态）           |
| `draft`              | 草稿（已生成但未审核）       |
| `reviewing`          | 审核中                       |
| `revision-requested` | 需要修改                     |
| `approved`           | 已通过审核                   |
| `locked`             | 已锁定（不可修改，不可回退） |
| `failed`             | 生成失败                     |

---

## 5. API 接口文档

### 5.1 项目接口

#### `GET /api/projects` — 项目列表

```json
{
  "projects": [
    {
      "id": "yunfan-tech",
      "name": "云帆科技",
      "profileType": "brand",
      "status": "PREVIEW",
      "createdAt": "2026-08-06T10:00:00.000Z",
      "updatedAt": "2026-08-06T10:30:00.000Z",
      "hasBlueprint": true,
      "hasTheme": true,
      "reviewCount": 1,
      "decisionCount": 3
    }
  ]
}
```

#### `GET /api/projects/:id` — 项目详情

返回完整项目数据，包含 `project`（含 profile、designMemory）、`materials`、`versions`。

#### `POST /api/projects` — 创建项目

```json
// 请求体
{ "name": "云帆科技", "profileType": "brand", "profile": {} }
```

#### `DELETE /api/projects/:id` — 删除项目

### 5.2 状态接口

#### `GET /api/projects/:id/state` — 读取状态

```json
{
  "projectId": "yunfan-tech",
  "status": "PREVIEW",
  "progress": { "step": 8, "total": 8, "current": "完成", "percent": 100 },
  "updatedAt": "2026-08-06T10:00:00.000Z"
}
```

#### `POST /api/projects/:id/state` — 更新状态

```json
{
  "status": "GENERATING",
  "progress": { "step": 1, "total": 8, "current": "分析品牌", "percent": 12 }
}
```

### 5.3 Profile 接口

#### `POST /api/projects/:id/profile` — 更新品牌资料

更新 Profile 后自动将状态变为 `READY`。

```json
// 请求体 — Brand Profile
{
  "brandName": "云帆科技",
  "description": "AI 解决方案提供商",
  "keywords": ["科技", "创新", "专业"],
  "primaryColor": "#2563EB",
  "logo": "assets/logo/logo.svg",
  "slogan": "用 AI 赋能未来"
}

// 请求体 — Creator Profile
{
  "name": "小林的 AI 笔记",
  "contentDirection": "AI 技术科普",
  "keywords": ["AI", "技术", "科普"],
  "primaryColor": "#8B5CF6"
}
```

### 5.4 文件上传接口

#### `POST /api/projects/:id/upload` — 上传资源

```json
// 请求体（base64 方式，避免 multer 依赖）
{
  "type": "logo",
  "fileName": "logo.svg",
  "base64": "...",
  "mimeType": "image/svg+xml"
}
```

| 参数     | 说明                   |
| -------- | ---------------------- |
| type     | `logo` 或 `brandSpec`  |
| fileName | 文件名（含扩展名）     |
| base64   | 文件内容的 base64 编码 |
| mimeType | MIME 类型校验          |

限制：单文件 ≤ 10MB，logo 支持 SVG/PNG/JPEG，brandSpec 仅 PDF。

#### `GET /api/projects/:id/assets/:type/:filename` — 访问资源

### 5.5 AI 推理接口 ⭐（核心）

#### `POST /api/projects/:id/ai-save` — 保存 AI 推理结果（支持分批提交）

**这是 AI Agent 与 Service Layer 交互的核心接口。AI 分 7 批提交 44 个组件的 CSS。**

##### 请求体

```json
{
  "blueprint": {                          // 完整 Design Blueprint（仅第 1 批需要传）
    "readingExperience": { ... },
    "expression": { ... },
    "componentExpression": { ... },
    "visualLanguage": { ... },
    "layoutStrategy": { ... }
  },
  "batch": "signature",                   // 原型组名（见 4.2.2 原型组划分）
  "isLastBatch": false,                   // 是否最后一批（true 时触发状态 → PREVIEW）
  "components": [                         // 该批的组件列表
    {
      "type": "hero-banner",             // 组件名（必须来自 LEGAL_COMPONENTS）
      "variant": "yunfan-hero-gradient",  // 变体名（品牌相关命名）
      "variantCss": "#wemd .wemd-hero-banner[data-variant=\"yunfan-hero-gradient\"] { ... }",
      "sourceHtml": "<section class=\"wemd-hero-banner\" data-variant=\"yunfan-hero-gradient\">...</section>",
      "instruction": "主色渐变背景 + Logo 右上角 + Slogan 副标题，六边形纹理装饰"
    }
  ]
}
```

##### 字段说明

| 字段          | 必填      | 说明                                                                                          |
| ------------- | --------- | --------------------------------------------------------------------------------------------- |
| `blueprint`   | 仅第 1 批 | 完整 Design Blueprint，保存到 `design-blueprint.json`                                         |
| `batch`       | 是        | 原型组名：`signature` / `heading` / `container` / `data` / `interactive` / `code` / `divider` |
| `isLastBatch` | 否        | `true` 时更新状态为 `PREVIEW`；不传或 `false` 时保持 `GENERATING`                             |
| `components`  | 是        | 该批所有组件的 CSS + HTML + 设计说明                                                          |

> **注意：** `changeLog` 字段虽然在 TypeScript 类型中被定义，但实际代码不使用它。组件版本的 changeLog 来自 `instruction` 字段（若未提供则默认为 `"AI 推理生成"`）。

##### 分批提交行为

| 场景     | `batch`       | `isLastBatch` | blueprint | 行为                                                               |
| -------- | ------------- | ------------- | --------- | ------------------------------------------------------------------ |
| 第 1 批  | `"signature"` | `false`       | 传        | 保存 blueprint + 追加组件版本，状态保持 `GENERATING`               |
| 中间批次 | `"container"` | `false`       | 不传      | 仅追加组件版本，状态保持 `GENERATING`                              |
| 最后一批 | `"divider"`   | `true`        | 不传      | 追加组件版本 + 状态更新为 `PREVIEW`                                |
| 单次全量 | 不传          | 不传          | 传        | 保存 blueprint + 追加全部组件 + 状态更新为 `PREVIEW`（兼容旧模式） |

##### 进度跟踪

分批提交时，`state.json` 的 `progress` 反映当前批次：

```json
{
  "status": "GENERATING",
  "progress": {
    "step": 3,
    "total": 7,
    "current": "生成 container 组 (3/7)",
    "percent": 43
  }
}
```

##### 响应

```json
{
  "success": true,
  "saved": {
    "blueprint": true,
    "components": [
      "hero-banner#v1",
      "magazine-cover#v1",
      "end-card#v1",
      "brand-sign#v1"
    ]
  },
  "batch": "signature",
  "batchProgress": { "completed": 1, "total": 7 },
  "message": "已保存蓝图 + 4 个组件 (signature 组 1/7)"
}
```

##### 7 批提交顺序

| 批次 | `batch` 值      | 组件数 | `isLastBatch` |
| ---- | --------------- | ------ | ------------- |
| 1    | `"signature"`   | 4      | `false`       |
| 2    | `"heading"`     | 4      | `false`       |
| 3    | `"container"`   | 10     | `false`       |
| 4    | `"data"`        | 9      | `false`       |
| 5    | `"interactive"` | 6      | `false`       |
| 6    | `"code"`        | 2      | `false`       |
| 7    | `"divider"`     | 9      | `true`        |

### 5.6 审核接口

#### `POST /api/projects/:id/review` — 审核操作

```json
// 请求体
{
  "action": "submit|approve|reject",
  "stage": "blueprint|theme",
  "score": 85,
  "feedback": "..."
}
```

| action    | 行为     | 状态变化                                 |
| --------- | -------- | ---------------------------------------- |
| `submit`  | 提交审核 | 创建审核记录，状态不变                   |
| `approve` | 通过审核 | Blueprint → GENERATING, Theme → APPROVED |
| `reject`  | 驳回审核 | Blueprint → NEW, Theme → PREVIEW         |

### 5.7 组件管理接口

#### `GET /api/projects/:id/components` — 组件列表

返回所有组件及其当前版本信息。

#### `GET /api/projects/:id/components/:type` — 单个组件详情

```json
{
  "component": {
    "id": "hero-banner-abc123",
    "type": "hero-banner",
    "name": "Hero Banner",
    "status": "draft",
    "currentVersion": 2,
    "approvedVersion": null,
    "versions": [ ... ],
    "review": null,
    "decisions": [ ... ]
  }
}
```

#### `POST /api/projects/:id/components` — 创建组件

```json
{ "type": "hero-banner", "name": "开篇大图" }
```

#### `PUT /api/projects/:id/components/:type` — 更新组件

#### `DELETE /api/projects/:id/components/:type` — 删除组件

#### `POST /api/projects/:id/components/:type/versions` — 添加组件版本

```json
{
  "variant": "yunfan-gradient",
  "variantCss": "#wemd .wemd-hero-banner[data-variant=\"yunfan-gradient\"] { ... }",
  "instruction": "AI 生成",
  "sourceHtml": "<section class=\"wemd-hero-banner\" data-variant=\"yunfan-gradient\">...</section>",
  "publishHtml": "",
  "assetRefs": [],
  "createdBy": "ai"
}
```

#### `POST /api/projects/:id/components/:type/review` — 组件审核

**驳回时自动触发 AI 重生：** 当 `status` 为 `rejected` 或 `revision-requested` 时，自动调用 `skill.ts` 的 `modify-component` 生成新版本（保持原 variant 名，不脱离整体方案）。

#### `POST /api/projects/:id/components/:type/modify` — 单组件修改

```json
{ "instruction": "把背景色改为渐变", "variantCss": "...", "sourceHtml": "..." }
```

#### `GET /api/projects/:id/components/:type/memory` — 组件 Design Memory

返回该组件的 Design Memory 记录（style 和 decisions）。

### 5.8 版本管理接口

#### `GET /api/projects/:id/versions` — 所有组件版本列表

#### `POST /api/projects/:id/versions` — 创建版本

```json
{
  "component": "hero-banner",
  "variant": "yunfan-gradient",
  "variantCss": "...",
  "changeLog": "初版",
  "createdBy": "ai"
}
```

#### `POST /api/projects/:id/versions/rollback` — 回退版本

```json
{ "component": "hero-banner", "version": 1, "reason": "用户不满意新版本" }
```

**回退行为：** 不直接覆盖旧版本，而是基于目标版本内容创建新版本（复制 variantCss 等），在 Design Memory 中记录回退原因。

#### `PUT /api/projects/:id/versions/status` — 更新版本状态

```json
{ "component": "hero-banner", "version": 2, "status": "approved" }
```

**状态流转限制：**

- `draft` → `reviewing` → `approved` → `locked`（单向不可逆）
- `locked` 状态不可修改
- `approved` 只能转为 `locked`

### 5.9 蓝图 / 主题接口

#### `GET /api/projects/:id/blueprint` — 读取 Design Blueprint

#### `GET /api/projects/:id/manifest` — 读取 manifest.json

#### `GET /api/projects/:id/download` — 下载 .wemd-theme ZIP

#### `GET /api/projects/:id/branddoc` — 查看 brand.md（已打包在 ZIP 中）

### 5.10 文章套用接口

#### `POST /api/projects/:id/articles/parse` — 解析文章

```json
{ "content": "# 标题\n\n正文内容...", "title": "文章标题" }
```

返回解析后的文章结构（blocks, metadata, mapping）。

#### `POST /api/projects/:id/articles/preview` — 预览文章

将 Markdown 转换为主题化 HTML + 主题 CSS，返回预览数据。

#### `POST /api/projects/:id/articles/apply` — 套用文章

生成完整 HTML 并保存到 `articles/` 目录。返回 `articleId` 和 `html`。

#### `GET /api/projects/:id/articles` — 文章列表

#### `GET /api/projects/:id/articles/:articleId` — 获取单篇文章

### 5.11 初始化接口

#### `POST /api/init` — 初始化工作区

创建 `workspace/` 目录结构（inbox, processing, done, failed, logs）和 `projects/` 目录。

### 5.12 已弃用接口

#### `POST /api/projects/:id/pipeline` — 运行管道（已禁用）

返回 410 Gone，提示改用 `/ai-save` 接口。

---

## 6. 核心数据结构

### 6.1 Design Project

```typescript
interface DesignProject {
  id: string; // 项目 ID（由 name 生成）
  name: string; // 项目名称
  profileType: "brand" | "creator";
  status: ProjectStatus; // NEW | READY | GENERATING | PREVIEW | APPROVED | EXPORTED
  createdAt: string; // ISO 时间戳
  updatedAt: string;
  profile: BrandProfile | CreatorProfile;
  designBlueprint: DesignBlueprint | null;
  themePackage: ThemePackage | null;
  designMemory: DesignMemory;
  reviewRecords: ReviewRecord[];
  decisionLog: DecisionLogEntry[];
}
```

### 6.2 Profile

#### Brand Profile

```typescript
interface BrandProfile {
  profileType: "brand";
  brandName: string;
  logo: File | null; // 企业 Logo
  description: string; // 100-300 字企业介绍
  keywords: string[]; // 3-5 个品牌关键词
  primaryColor?: string; // 品牌主色（#hex）
  website?: string; // 官网 URL
  slogan?: string; // Slogan
  brandSpec?: File; // 品牌规范 PDF
}
```

#### Creator Profile

```typescript
interface CreatorProfile {
  profileType: "creator";
  name: string; // 创作者名称
  contentDirection: string; // 内容方向
  keywords: string[]; // 3-5 个创作关键词
  primaryColor?: string; // 偏好主色
  logo?: File | null; // 个人头像
  reference?: string; // 参考链接
  slogan?: string; // 个人签名
}
```

### 6.3 Design Blueprint

```typescript
interface DesignBlueprint {
  readingExperience: {
    rhythm: "fast" | "medium" | "slow";
    density: "low" | "medium" | "high";
    emotion: string; // 情绪基调，如"前沿科技感"
    visualWeight: string; // 视觉重心，如"轻量锐利"
    narrative: string; // 叙事方式，如"数据驱动"
    whitespace: string; // 留白，如"充足呼吸感"
    intimacy?: string; // 仅 Creator
  };
  expression: BrandExpression | ConceptExpression;
  componentExpression: ComponentExpression;
  visualLanguage: {
    colors: Record<string, string>; // 14 色调色板
    typography: TypographyConfig;
    spacing: SpacingConfig;
    border: BorderConfig;
    shadow: ShadowConfig;
  };
  layoutStrategy: {
    pageStructure: string;
    paragraphStyle: string;
    hierarchy: string;
    componentFlow: string;
    preferredComponentCount: string;
  };
}
```

> **运行时注入字段：** 在 Pipeline 执行过程中，`orchestrator.ts` 会向 blueprint 动态注入两个额外字段：
>
> - `decorationPlan` — Decoration Layer 生成的装饰计划（`DecorationPlan` 类型）
> - `decorationMapResult` — Decoration Layer 的 CSS/HTML 映射结果（`MapResult` 类型）
>   这两个字段用于 Application Layer 的组件生成，不会被持久化到 `design-blueprint.json`（仅在管道运行时内存中存在）。

### 6.4 14 色调色板

| 变量名        | 用途       | 推导规则                       |
| ------------- | ---------- | ------------------------------ |
| primary       | 品牌主色   | 用户提供 / Logo 提取 / AI 推荐 |
| primaryLight  | 主色浅色   | primary 白化 60（RGB 加值）    |
| primaryDark   | 主色深色   | primary 暗化 40（RGB 减值）    |
| secondary     | 辅助色     | RGB 循环移位（g, b, r）        |
| accent        | 强调色     | RGB 循环移位（b, r, g）        |
| background    | 背景色     | 固定 #FFFFFF                   |
| surface       | 卡片背景   | 固定 #F8FAFC                   |
| textPrimary   | 主文字色   | 固定 #1A1A2E                   |
| textSecondary | 辅助文字色 | 固定 #64748B                   |
| textCaption   | 说明文字色 | 固定 #94A3B8                   |
| border        | 边框色     | 固定 #E2E8F0                   |
| divider       | 分割线色   | 固定 #F1F5F9                   |
| success       | 成功色     | 固定 #10B981                   |
| warning       | 警告色     | 固定 #F59E0B                   |

### 6.5 Design Memory

```typescript
interface DesignMemory {
  decisions: Array<{
    type: "style" | "component" | "color" | "typography" | "layout";
    key: string;
    value: string;
    reason: string;
    confirmedAt: string;
    source: "ai-proposal" | "user-feedback" | "review";
  }>;
  componentStyles: Record<string, string>; // { "hero-banner": "yunfan-gradient", ... }
  preferences: {
    patternDensity: "low" | "medium" | "high";
    decorationLevel: "minimal" | "moderate" | "rich";
    cornerStyle: "rounded" | "sharp" | "mixed";
  };
  rejectedApproaches: string[]; // 被拒绝过的方案，避免重复生成
}
```

### 6.6 BrandSystem

```typescript
interface BrandSystem {
  brandId: string; // 品牌 ID
  principles: string[]; // 品牌原则（3-5 条）
  tokens: {
    colors: Record<string, string>; // CSS 变量格式（--wemd-xxx）
    typography: TypographyConfig;
    spacing: Record<string, number>;
    radius: Record<string, number>; // { sm: 4, md: 8, lg: 12, xl: 16 }
    border: { width: number; style: string };
  };
  assetPolicy: {
    logoUsage:
      | "cover-footer"
      | "header-only"
      | "header-and-footer"
      | "every-article-start";
    brandMarkUsage: "small-components" | "decorative" | "heading-only";
    patternOpacityMax: number; // 默认 0.15
    patternCoverageMax: number; // 默认 0.3
  };
  componentRules: {
    density: "low" | "medium" | "high";
    tone: string[];
    forbiddenFeatures: string[]; // ["box-shadow", "position:fixed", "::before", "::after", "filter"]
  };
}
```

### 6.7 组件版本

```typescript
interface ComponentVersionDetail {
  version: number;
  component: string;
  variant: string;
  variantCss: string; // 组件 CSS（#wemd 包裹）
  createdAt: string;
  createdBy: "ai" | "user";
  status: ComponentStatus; // draft | reviewing | approved | locked | revision-requested | failed
  changeLog: string;
  parentVersion?: number;
  instruction: string; // 生成指令/修改说明
  sourceHtml: string; // 组件 HTML 模板
  publishHtml: string; // 发布版 HTML（可手动编辑）
  assetRefs: string[]; // 引用的资源 ID
  compatibility: {
    status: "passed" | "passed-with-warnings" | "failed";
    warnings: string[];
    errors: string[];
  };
}
```

### 6.8 审核记录

```typescript
interface ReviewRecord {
  reviewId: string;
  projectId: string;
  stage: "blueprint" | "theme";
  status: "pending" | "approved" | "rejected";
  score?: number;
  feedback?: string;
  reviewedBy: "user" | "ai";
  createdAt: string;
  decidedAt?: string;
}

interface ComponentReview {
  component: string;
  status: ComponentStatus;
  score?: number;
  reviewer: "human" | "ai";
  comments: string[];
  createdAt: string;
  decidedAt?: string;
}
```

### 6.9 决策日志

```typescript
interface DecisionLogEntry {
  version: number;
  stage: string; // "review-blueprint" | "review-theme" | "rollback-hero-banner"
  decision: "approved" | "rejected" | "revised";
  reason: string;
  timestamp: string;
}

interface ComponentDecision {
  version: number;
  decision: "approve" | "reject" | "revise";
  reason: string;
  timestamp: string;
}
```

### 6.10 任务队列

```typescript
interface DesignTask {
  taskId: string; // ULID
  projectId: string;
  type: "generate-theme" | "regenerate" | "modify-component" | "compile";
  input: Record<string, unknown>;
  status: "pending" | "processing" | "done" | "failed";
  createdAt: string;
  updatedAt: string;
  error?: string;
}
```

### 6.11 管道专用类型

```typescript
interface ConstraintResult {
  passed: boolean;
  errors: ConstraintViolation[];
  warnings: ConstraintViolation[];
}

interface ComponentVariant {
  component: string;
  variant: string;
  variantCss: string;
  reason: string;
}

interface QualityScore {
  brandConsistency: number;
  readingExperience: number;
  componentCoverage: number;
  constraintCompliance: number;
  conceptConsistency?: number; // 仅 Creator
}

interface CompiledTheme {
  manifest: Record<string, unknown>;
  variantCss: Record<string, string>;
  warnings: string[];
  brandDoc: string; // brand.md 内容
  zipPath?: string; // 生成的 .wemd-theme 文件路径
}
```

---

## 7. 文件结构

### 7.1 完整目录

```
skills/wemd-theme-designer/
│
├── skill.json                      # 技能包元数据（触发词 / 能力声明）
├── SKILL.md                        # ★ 主指令文档（流程控制 + 状态机）
├── README.md                       # 本文件
│
├── services/                       # 后端服务
│   ├── package.json
│   ├── tsconfig.json
│   ├── src/
│   │   ├── cli.ts                  # 命令行工具（create / server / pipeline / status 等）
│   │   ├── server.ts               # HTTP 服务 + 全部 REST API（≈ 1000 行）
│   │   ├── skill.ts                # Skill 输入/输出契约（5 种 action）
│   │   ├── project-service.ts      # 项目管理 + 状态管理 + 审核流水线 + 组件 CRUD + 版本管理
│   │   ├── file-service.ts         # 文件系统 + state.json 读写 + 素材管理
│   │   ├── types.ts                # 运行时类型定义（Service 层独立维护）
│   │   ├── utils.ts                # 工具函数（ULID / 颜色 / 时间格式化）
│   │   ├── task-queue.ts           # 任务队列（inbox/processing/done/failed）
│   │   ├── article-parser.ts       # Markdown 文章解析（块级元素识别）
│   │   ├── article-apply.ts        # 文章套用引擎（块→组件映射 + 样式内联）
│   │   │
│   │   ├── pipeline/               # 6 层设计管道（工具链模式）
│   │   │   ├── orchestrator.ts     # 管道编排器（8 步 Pipeline）
│   │   │   ├── pipeline-types.ts   # 管道专用类型（ColorKey, ConstraintResult, ComponentVariant 等）
│   │   │   ├── logic-layer.ts      # Logic Layer（规则引擎 fallback，含 44 组件列表）
│   │   │   ├── constraint-layer.ts # Constraint Layer（C1-C6 约束检查）
│   │   │   ├── decoration-layer.ts # Decoration Layer（25 原子注册表 + 品牌过滤 + 组合校验 + 映射）
│   │   │   ├── application-layer.ts# Application Layer（variantCss + HTML 生成，含 44 组件模板）
│   │   │   ├── compiler-layer.ts   # Compiler Layer（manifest + brand.md + ZIP 打包）
│   │   │   ├── feedback-layer.ts   # Feedback Layer（5 维度质量评分）
│   │   │   ├── decoration-layer.test.ts
│   │   │   └── decoration-layer.comprehensive.test.ts
│   │   │
│   │   ├── compiler/               # 编译工具
│   │   │   ├── style-inliner.ts    # 样式内联
│   │   │   ├── asset-processor.ts  # 资源处理
│   │   │   ├── compatibility-check.ts # 兼容性检查
│   │   │   ├── css-whitelist.ts    # CSS 白名单
│   │   │   └── html-whitelist.ts   # HTML 白名单
│   │   │
│   │   └── validation/             # 校验工具
│   │       ├── index.ts
│   │       ├── project-schema.ts   # 项目 Schema 校验
│   │       ├── component-schema.ts # 组件 Schema 校验
│   │       └── asset-schema.ts     # 资源 Schema 校验
│   │
│   └── public/                     # Theme Studio 前端
│       ├── index.html              # 主界面
│       ├── style.css               # 样式
│       └── app.js                  # 前端逻辑
│
├── core/                           # 核心类型定义
│   ├── types.ts                    # 融合架构的共享数据类型
│   ├── service.ts                  # Service 接口定义
│   ├── review.ts                   # 审核类型
│   └── version.ts                  # 版本管理类型
│
├── prompts/                        # AI Agent 推理 Prompt
│   ├── generate-theme.md           # ★ 核心推理 prompt（12 阶段，AI 推理的完整指引）
│   └── self-check.md               # 自检清单（A~E 5 大章节）
│
├── spec/                           # 设计规范文档
│   ├── fusion-architecture.md      # 融合架构方案
│   ├── architecture-refactor.md    # 架构重构方案
│   ├── design-logic-brand.md       # 企业品牌设计逻辑
│   ├── design-logic-creator.md     # 创作者设计逻辑
│   ├── constraint-layer.md         # 约束层规范（C1-C6 详细说明）
│   ├── application-layer.md        # 应用层规范（A-E 方案优先级）
│   ├── feedback-layer.md           # 反馈层规范（5 维度评分标准）
│   ├── product-completion-plan.md  # 产品完成计划
│   ├── decoration-library.md       # 装饰库规范（25 原子的设计说明）
│   ├── theme-package-spec.md       # 输出规范 + CSS 变量表
│   ├── component-registry.md       # 组件注册表
│   ├── brand-keywords.md           # 18 个关键词 + 推荐组合表
│   ├── quick-reference.md          # 快速参考
│   └── profile-templates.md        # Profile 模板（Brand/Creator 表单字段定义）
│
├── projects/                       # 项目数据（运行时生成）
│   └── {project-name}/
│       ├── project.json            # 项目元信息 + 状态
│       ├── profile.json            # BrandProfile / CreatorProfile
│       ├── state.json              # 状态机文件
│       ├── design-blueprint.json   # Design Blueprint（AI 推理结果）
│       ├── design-memory.json      # 风格决策记忆
│       ├── decision-log.json       # 决策日志
│       ├── components/             # 组件数据（每个组件一个 JSON 文件）
│       │   ├── hero-banner.json
│       │   ├── stats-block.json
│       │   └── ...
│       ├── versions/               # 版本数据（独立文件存储）
│       │   └── hero-banner/
│       │       ├── v1.json
│       │       ├── v2.json
│       │       └── ...
│       ├── reviews/                # 审核记录
│       │   ├── blueprint-review.json
│       │   └── theme-review.json
│       ├── theme/                  # 主题包输出
│       │   ├── manifest.json
│       │   └── {slug}.wemd-theme
│       ├── assets/                 # 上传资源
│       │   ├── logo/logo.svg
│       │   └── brandSpec/spec.pdf
│       ├── materials/              # 素材工作区
│       │   └── assets/*.svg
│       └── articles/               # 套用文章记录
│
└── workspace/                      # 任务队列
    ├── inbox/
    ├── processing/
    ├── done/
    ├── failed/
    └── logs/
```

### 7.2 关键文件映射

| 文件                                         | 职责              | 关键函数                                                                                                 |
| -------------------------------------------- | ----------------- | -------------------------------------------------------------------------------------------------------- |
| `services/src/server.ts`                     | HTTP API 服务     | startServer(), /ai-save, /compile, /articles/\*                                                          |
| `services/src/project-service.ts`            | 项目管理          | createProject(), saveBlueprint(), addComponentVersion(), createComponent(), rollbackComponent()          |
| `services/src/file-service.ts`               | 文件系统          | readJSON(), writeJSON(), getProjectFilePath(), initProjectDir(), readProjectState(), writeProjectState() |
| `services/src/skill.ts`                      | Skill 契约        | runSkill() — 5 种 action (generate-blueprint/compile/feedback/full-pipeline/modify-component)            |
| `services/src/pipeline/orchestrator.ts`      | 管道编排          | runFullPipeline() — 8 步流程                                                                             |
| `services/src/pipeline/logic-layer.ts`       | 规则引擎 fallback | generateDesignBlueprint(), generateBrandSystem(), getLegalComponents()                                   |
| `services/src/pipeline/constraint-layer.ts`  | 约束检查          | checkBlueprintConstraints() — C1-C6                                                                      |
| `services/src/pipeline/decoration-layer.ts`  | 装饰映射          | runDecorationLayer(), BrandFilterEngine, CombinationValidator, DecorationMapper                          |
| `services/src/pipeline/application-layer.ts` | 实现生成          | generateVariants(), generateComponentSourceHtml(), generateMaterialDescription()                         |
| `services/src/pipeline/compiler-layer.ts`    | 编译打包          | compileTheme(), packageThemeZip(), generateBrandDoc()                                                    |
| `services/src/pipeline/feedback-layer.ts`    | 质量评估          | evaluateQuality() — 5 维度评分                                                                           |
| `services/src/cli.ts`                        | CLI 工具          | create/list/status/delete/blueprint/review/task/version/pipeline/server/help/demo                        |
| `services/src/task-queue.ts`                 | 任务队列          | createTask(), getNextTask(), startProcessing(), completeTask(), failTask()                               |
| `services/src/article-parser.ts`             | 文章解析          | parseArticle() — Markdown → 块级元素                                                                     |
| `services/src/article-apply.ts`              | 文章套用          | applyArticleBlocks(), applyArticleBlocksInlineWithVariants()                                             |

---

## 8. 关键数据流

### 8.1 完整生成流程（AI Agent 模式）

```
用户触发 Skill → 创建项目 (NEW)
    │
    ▼
启动 Theme Studio → 用户填写 Profile
    │
    ▼
Theme Studio 提交 Profile → POST /api/projects/:id/profile
    │
    ▼
状态变为 READY
    │
    ▼
AI Agent 检测到 READY
    │
    ├─ 读取 generate-theme.md（推理 prompt，12 阶段）
    ├─ 读取 spec/design-logic-brand.md（品牌分析逻辑）
    ├─ 读取 spec/design-logic-creator.md（创作者分析逻辑）
    ├─ 读取 spec/constraint-layer.md（约束检查规则）
    ├─ 读取 spec/application-layer.md（实现方案选择）
    ├─ 读取 spec/decoration-library.md（装饰原子规范）
    ├─ 读取 spec/theme-package-spec.md（输出规范）
    ├─ 读取 spec/brand-keywords.md（18 个关键词）
    ├─ 读取 spec/component-registry.md（44 组件注册表）
    └─ 读取 self-check.md（自检清单）
    │
    ▼
AI Agent 进行阶段 0-8 推理（生成 Design Blueprint）
    │
    ├─ 阶段 0：判断 Profile 类型 (brand/creator)
    ├─ 阶段 1-2：收集 + 确认 Profile（已在 Theme Studio 完成）
    ├─ 阶段 3：阅读体验定义（节奏、密度、情绪、叙事）
    ├─ 阶段 4：品牌表达策略 / 创造视觉概念
    ├─ 阶段 5：品牌元素→组件映射 / 概念表达策略
    ├─ 阶段 6：建立视觉语言（14 色、排版、间距）
    ├─ 阶段 7：建立布局语言
    ├─ 阶段 8：约束检查（自检，确保无违规）
    │
    ▼
AI Agent 分 7 批生成 44 个组件 CSS（阶段 9）
    │
    ├─ 9.1 signature 组 (4 个)
    │   → POST /ai-save { batch: "signature", blueprint: {...}, components: [...] }
    │   状态保持 GENERATING, progress 1/7
    │
    ├─ 9.2 heading 组 (4 个)
    │   → POST /ai-save { batch: "heading", components: [...] }
    │   状态保持 GENERATING, progress 2/7
    │
    ├─ 9.3 container 组 (10 个)
    │   → POST /ai-save { batch: "container", components: [...] }
    │   状态保持 GENERATING, progress 3/7
    │
    ├─ 9.4 data 组 (9 个)
    │   → POST /ai-save { batch: "data", components: [...] }
    │   状态保持 GENERATING, progress 4/7
    │
    ├─ 9.5 interactive 组 (6 个)
    │   → POST /ai-save { batch: "interactive", components: [...] }
    │   状态保持 GENERATING, progress 5/7
    │
    ├─ 9.6 code 组 (2 个)
    │   → POST /ai-save { batch: "code", components: [...] }
    │   状态保持 GENERATING, progress 6/7
    │
    └─ 9.7 divider 组 (9 个)
        → POST /ai-save { batch: "divider", isLastBatch: true, components: [...] }
        状态更新为 PREVIEW, progress 7/7 (100%)
    │
    ▼
AI Agent 执行阶段 10 自检（self-check.md 清单）
    │
    ▼
Theme Studio 预览全部 44 个组件
    │
    ├─ 审核组件效果 → 逐个通过/驳回
    ├─ 驳回 → POST /components/:type/modify → AI 精修单个组件（不影响其他组件）
    ├─ 全部通过 → POST /review { action: "approve-all" }
    └─ 导出 → POST /compile → 生成 .wemd-theme
```

### 8.2 修改流程

```
用户在 Theme Studio 提出修改意见
    │
    ▼
POST /api/projects/:id/components/:type/modify
    │
    ├─ 读取当前组件最新版本
    ├─ 调用 skill.ts modify-component action
    ├─ AI Agent 重新生成 variantCss + HTML
    └─ 保存为新版本（不覆盖旧版本，保持 variant 名）
    │
    ▼
重新进入审核流程
```

### 8.3 驳回重审流程

```
POST /api/projects/:id/components/:type/review
    │
    ├─ status: "rejected" 或 "revision-requested"
    │   ├─ 读取当前组件最新版本数据
    │   ├─ 调用 skill.ts modify-component
    │   ├─ 传入驳回意见作为 instruction
    │   └─ 保存为新版本（保持原 variant 名，不脱离整体方案）
    │
    └─ status: "approved"
        └─ 标记为已通过，记录决策日志
```

### 8.4 版本回退流程

```
POST /api/projects/:id/versions/rollback
    │
    ├─ 读取目标版本数据
    ├─ 检查目标版本是否 locked（locked 不可回退）
    ├─ 创建新版本（复制目标版本的 variantCss 等）
    └─ 记录决策日志（stage: "rollback-{component}"）
```

### 8.5 文章套用流程

```
用户粘贴 Markdown 文章
    │
    ▼
POST /api/projects/:id/articles/parse
    │
    ├─ Markdown → 块级元素解析（段落、标题、列表、引用、代码块、图片等）
    └─ 块→组件映射（每个块映射到最合适的主题组件）
    │
    ▼
POST /api/projects/:id/articles/preview
    │
    ├─ 读取主题 manifest.json 提取组件变体映射
    ├─ 应用主题 CSS 到文章块
    └─ 返回主题化 HTML + CSS
    │
    ▼
POST /api/projects/:id/articles/apply
    │
    ├─ 生成完整 HTML（含样式内联）
    ├─ 保存到 articles/{articleId}.json
    └─ 返回 articleId 和 HTML
```

---

## 9. 开发指南

### 9.1 启动服务

```bash
# 进入 services 目录
cd skills/wemd-theme-designer/services

# 安装依赖
npm install

# 启动开发服务器（同时打开浏览器）
node --experimental-strip-types src/cli.ts server

# 或直接运行服务器
node --experimental-strip-types src/server.ts

# 创建项目
node --experimental-strip-types src/cli.ts create "项目名称" brand
node --experimental-strip-types src/cli.ts create "项目名称" creator

# 查看项目列表
node --experimental-strip-types src/cli.ts list

# 查看项目状态
node --experimental-strip-types src/cli.ts status <projectId>

# 运行完整演示流程
node --experimental-strip-types src/cli.ts test
```

### 9.2 新增组件

1. 在 `logic-layer.ts` 的 `LEGAL_COMPONENTS` 数组中添加组件名
2. 在 `application-layer.ts` 的 `generateComponentCSS()` 和 `generateBaseComponentCSS()` 中添加 CSS 生成逻辑
3. 在 `application-layer.ts` 的 `generateComponentSourceHtml()` 中添加 HTML 模板和演示数据
4. 更新 `spec/component-registry.md` 注册组件
5. 更新 `generate-theme.md` 中的组件列表

### 9.3 新增关键词

1. 在 `spec/brand-keywords.md` 中添加关键词和推荐组合
2. 在 `generate-theme.md` 的阶段 1 表单中更新关键词列表
3. 在 `logic-layer.ts` 的 `KEYWORD_STYLE_MAP`、`KEYWORD_COMPONENT_MAP`、`KEYWORD_LAYOUT_MAP` 中添加映射
4. 可选：在 `decoration-layer.ts` 的 `KEYWORD_ATOM_MAP` 中添加关键词→原子映射

### 9.4 新增装饰原子

1. 在 `decoration-layer.ts` 的 `ATOM_REGISTRY` 中添加原子定义（CSS 模板 + HTML 模板 + 参数定义）
2. 在 `POSITION_SLOTS` 中注册位置槽位（如果有冲突检测需求）
3. 在 `KEYWORD_ATOM_MAP` 中为相关关键词添加原子引用
4. 更新 `spec/decoration-library.md` 记录原子设计说明

### 9.5 新增约束规则

1. 在 `constraint-layer.ts` 中添加检查函数
2. 在 `checkBlueprintConstraints()` 中注册新规则
3. 在 `spec/constraint-layer.md` 中记录约束规则

### 9.6 新增 API 接口

1. 在 `server.ts` 中添加路由
2. 在 `project-service.ts` 中添加业务逻辑
3. 在 `types.ts` 中定义请求/响应类型

### 9.7 开发规范

| 规则          | 说明                                                                   |
| ------------- | ---------------------------------------------------------------------- |
| 单文件行数    | 业务代码 ≤ 500 行，测试文件 ≤ 800 行，类型定义 ≤ 300 行，组件 ≤ 600 行 |
| 通信协议      | 前端 ↔ 后端：HTTP JSON API                                            |
| 状态管理      | state.json 是唯一状态源，不依赖内存状态                                |
| 版本管理      | 每次修改创建新版本，不覆盖旧版本                                       |
| 版本清理      | 保留所有 approved/locked + 最近 3 个 draft/reviewing 版本              |
| Design Memory | 被拒绝的方案记录在 rejectedApproaches，避免重复生成                    |
| 装饰效果      | 必须使用物理 DOM 元素，禁止伪元素                                      |
| CSS 选择器    | 必须使用 `#wemd .wemd-xxx[data-variant="yyy"]` 格式                    |

### 9.8 调试技巧

```bash
# 查看项目状态
curl http://127.0.0.1:3456/api/projects/{projectId}/state

# 查看 Design Blueprint
curl http://127.0.0.1:3456/api/projects/{projectId}/blueprint

# 查看组件列表
curl http://127.0.0.1:3456/api/projects/{projectId}/components

# 查看组件版本
curl http://127.0.0.1:3456/api/projects/{projectId}/versions

# 下载主题包
curl -O http://127.0.0.1:3456/api/projects/{projectId}/download

# 模拟 AI 保存结果
curl -X POST http://127.0.0.1:3456/api/projects/{projectId}/ai-save \
  -H "Content-Type: application/json" \
  -d '{"blueprint": {...}, "components": [...]}'

# 运行管道（CLI 模式）
node --experimental-strip-types src/cli.ts pipeline <projectId>

# 创建审核记录
node --experimental-strip-types src/cli.ts review <projectId> blueprint submit
node --experimental-strip-types src/cli.ts review <projectId> blueprint approve 85
node --experimental-strip-types src/cli.ts review <projectId> theme reject "颜色需要调整"

# 查看任务队列
node --experimental-strip-types src/cli.ts task stats
```

---

## 10. 约束与限制

### 10.1 微信公众号平台约束

| 约束                          | 说明                                        |
| ----------------------------- | ------------------------------------------- |
| `::before` / `::after`        | 禁止使用伪元素，装饰效果必须用物理 DOM 元素 |
| `:first-child` / `:nth-child` | 禁止使用结构伪类                            |
| `@keyframes` / `animation`    | 禁止使用动画                                |
| `position: fixed` / `sticky`  | 禁止使用                                    |
| `backdrop-filter` / `filter`  | 禁止使用滤镜                                |
| 外部 `url()` 引用             | 禁止引用外部资源                            |
| `<style>` / `<script>`        | 禁止在 HTML 中嵌入                          |
| `@import`                     | 禁止使用                                    |
| `box-shadow`                  | 微信公众号支持有限，建议禁用                |

### 10.2 CSS 变量命名约束

```css
/* ✅ 正确格式 */
--wemd-primary
--wemd-primaryLight
--wemd-border-radius

/* ❌ 错误格式 */
--wemd-color-primary     /* 多了一层 color */
--wemd-border-radius-lg  /* 不存在的后缀 */
--wemd-primaryColor      /* 驼峰命名，应使用 kebab-case */
```

### 10.3 组件 CSS 选择器格式

```css
/* ✅ 正确格式 */
#wemd .wemd-hero-banner[data-variant="yunfan-gradient"] { ... }
#wemd .wemd-hero-banner[data-variant="yunfan-gradient"] .wemd-hero-title { ... }

/* ❌ 错误格式 */
.wemd-hero-banner { ... }                              /* 缺少 #wemd 包裹 */
.wemd-hero-banner[data-variant="yunfan"] { ... }       /* 缺少 #wemd */
#wemd .wemd-hero-banner { ... }                        /* 缺少 data-variant 属性 */
```

### 10.4 版本管理约束

| 规则       | 说明                                                 |
| ---------- | ---------------------------------------------------- |
| 版本锁定   | `locked` 状态不可修改，不可回退                      |
| 审核锁定   | `approved` 状态只能转为 `locked`，不可转为其他状态   |
| 版本清理   | 保留所有 approved/locked 版本，草稿版本保留最近 3 个 |
| 回退策略   | 不直接覆盖，创建新版本（复制目标版本内容）           |
| 版本号计算 | 基于已有版本号最大值 +1                              |

### 10.5 明确不支持的功能

- PPT / Keynote / Word 文档导入
- Figma / Sketch 设计稿导入
- 30 页以上企业文化 / 产品介绍
- 整个官网截图打包
- 企业色以外的多重品牌色系统
- 自定义字体文件（仅支持系统字体）

---

## 附录 A：Skill 输入/输出契约

```typescript
interface SkillInput {
  projectId: string;
  profile: Record<string, unknown>;
  profileType: "brand" | "creator";
  designMemory?: DesignMemory;
  action:
    | "generate-blueprint"
    | "compile"
    | "feedback"
    | "full-pipeline"
    | "modify-component";
  componentInput?: {
    component: string;
    currentVersion: number;
    instruction: string;
    sourceHtml: string;
    variantCss: string;
  };
}

interface SkillOutput {
  projectId: string;
  success: boolean;
  action: SkillInput["action"];
  data: Record<string, unknown> | null;
  errors?: string[];
  warnings?: string[];
  feedback?: {
    scores: Record<string, number>;
    passed: boolean;
    suggestions: string[];
    summary: string;
  };
}
```

## 附录 B：Skill 触发词列表

| 企业方向                 | 创作者方向           |
| ------------------------ | -------------------- |
| 生成企业主题             | 生成创作者主题       |
| 企业品牌主题             | 个人公众号主题       |
| 公司公众号主题           | 自媒体主题           |
| 品牌定制主题             | 个人博客主题         |
| 企业VI 主题              | 创作者主题           |
| 企业官网主题             | 公众号风格主题       |
| 品牌色主题               | 内容创作者主题       |
| 生成品牌主题             | 生成公众号主题       |
| 生成企业公众号主题       | creator theme        |
| 企业定制 WeMD 主题       | personal blog theme  |
| WeMD 企业品牌主题        | WeChat creator theme |
| corporate theme          | —                    |
| brand WeMD theme         | —                    |
| company WeChat theme     | —                    |
| enterprise article theme | —                    |

## 附录 C：Logic Layer 关键词映射表

### 关键词→风格映射

| 关键词 | 节奏   | 密度   | 情绪       | 视觉重量 | 叙事       | 留白       | 装饰级别 | 纹样风格  |
| ------ | ------ | ------ | ---------- | -------- | ---------- | ---------- | -------- | --------- |
| 科技   | fast   | medium | 前沿科技感 | 轻量锐利 | 数据驱动   | 充足呼吸感 | minimal  | geometric |
| 创新   | fast   | medium | 活力创新   | 动感     | 故事化叙事 | 适中       | moderate | geometric |
| 专业   | medium | medium | 专业可信赖 | 稳重     | 逻辑清晰   | 充足       | minimal  | geometric |
| AI     | fast   | medium | 前沿智能   | 轻量科技 | 数据驱动   | 充足呼吸感 | minimal  | geometric |
| 温暖   | slow   | low    | 温暖亲切   | 柔和     | 故事化     | 充裕       | rich     | organic   |
| 简约   | medium | low    | 干净清爽   | 轻盈     | 直白简洁   | 大量留白   | minimal  | minimal   |
| 文艺   | slow   | low    | 文艺雅致   | 细腻     | 散文式     | 充裕诗意   | moderate | organic   |
| 商务   | medium | high   | 专业高效   | 稳重     | 结构化     | 适中       | minimal  | geometric |
| 教育   | medium | medium | 亲和知识   | 平衡     | 循序渐进   | 充足       | moderate | organic   |
| 健康   | slow   | low    | 清新自然   | 柔和     | 娓娓道来   | 充裕       | moderate | organic   |

### 关键词→组件映射

| 关键词 | 推荐组件                                            |
| ------ | --------------------------------------------------- |
| 科技   | hero-banner, stats-block, code-block, image-compare |
| 创新   | hero-banner, timeline, image-compare, callout       |
| 专业   | hero-banner, stats-block, table, accordion          |
| AI     | hero-banner, code-block, image-compare, steps       |
| 温暖   | hero-banner, testimonial-card, brand-sign, divider  |
| 简约   | hero-banner, divider, brand-sign, callout           |
| 文艺   | hero-banner, divider, pullquote, brand-sign         |
| 商务   | hero-banner, stats-block, table, accordion          |
| 教育   | hero-banner, steps, callout, code-block             |
| 健康   | hero-banner, testimonial-card, divider, brand-sign  |

## 附录 D：Architecture Decisions

### D1: 为什么 Pipeline 自动生成已弃用？

- **问题：** 自动 Pipeline 使用规则引擎生成设计，缺乏 AI 的理解和推理能力
- **决策：** 改为由 Trae Agent 通过 `generate-theme.md` 进行推理，Service Layer 仅作为工具链处理 AI 结果
- **影响：** `runFullPipeline()` 保留为工具链，`POST /api/projects/:id/pipeline` 返回 410 Gone

### D2: 为什么组件版本不直接覆盖？

- **问题：** 直接覆盖会导致无法回退，审核历史丢失
- **决策：** 每次修改创建新版本，保留完整的版本历史
- **影响：** 需要版本清理策略（保留 approved/locked + 最近 3 个草稿）

### D3: 为什么装饰效果必须用物理 DOM 元素？

- **问题：** 微信公众号富文本编辑器不支持伪元素（`::before`/`::after`）
- **决策：** 所有装饰效果必须使用 `<span class="wemd-xxx-deco">` 等物理 DOM 元素
- **影响：** Decoration Layer 的原子模板都包含 HTML 模板

### D4: 为什么 AI Agent 推理结果通过 API 保存而非直接写入文件系统？

- **问题：** AI Agent 运行在 Trae Work 环境中，无法直接访问 Service Layer 的文件系统
- **决策：** 通过 HTTP API（`/ai-save`）传递结果，Service Layer 负责持久化
- **影响：** 需要确保 API 的可靠性和幂等性
