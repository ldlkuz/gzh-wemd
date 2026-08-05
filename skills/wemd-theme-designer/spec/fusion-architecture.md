# WeMD 主题设计管道 · 融合架构方案

> 融合策略：**5 层设计管道（设计灵魂）× 工程基础设施（管理骨架）**
> 设计层保留完整创意逻辑，工程层提供项目管理、版本控制、审核流水线。

---

## 一、核心理念

### 设计哲学

```
不是「AI → 主题包」
而是「Project → Design Pipeline → Review → Publish」
```

**主体永远是 Project。** AI 的 5 层设计管道是 Project 流程中的设计引擎，不是最终结果的产出方。

### 系统层级

```
┌─────────────────────────────────────────────────────────┐
│                         Web                             │
│                    审核工作台 / 预览                      │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│                     Service Layer                       │
│  文件操作 · 目录管理 · 版本管理 · 状态校验 · 任务队列     │
│  唯一入口：所有数据操作必须经 Service                     │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│               Design Pipeline（Skill 内部）               │
│                                                         │
│  ┌──────────────────────────────────────────────────┐   │
  │  │ ① Logic Layer       — 设计什么                    │   │
  │  │ ② Constraint Layer   — 哪些能做                   │   │
  │  │ ③ Decoration Layer  — 装饰组合与映射（新增）       │   │
  │  │ ④ Application Layer — 怎么做                      │   │
  │  │ ⑤ Compiler Layer     — 输出主题包                  │   │
  │  │ ⑥ Feedback Layer     — 设计目标实现了没            │   │
  │  └──────────────────────────────────────────────────┘   │
│                                                         │
│  Skill 只负责「输入 → 输出」，不触碰文件系统              │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│                      Project                            │
│  唯一数据主体 · 结构化 JSON · 版本化 · 可审核             │
│  BrandProject / CreatorProject                          │
└─────────────────────────────────────────────────────────┘
```

---

## 二、Project 层（数据主体）

### 2.1 统一项目模型

两种 Profile 共用同一个 Project 结构，仅 `profileType` 字段区分。

```typescript
interface DesignProject {
  // ── 项目元信息 ──
  id: string; // "yunfan-tech"
  name: string; // "云帆科技"
  profileType: "brand" | "creator";
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;

  // ── Profile 数据 ──
  profile: BrandProfile | CreatorProfile; // 用户原始输入

  // ── 设计输出 ──
  designBlueprint: DesignBlueprint | null; // 5 层管道的核心输出
  themePackage: ThemePackage | null; // 编译后的主题包

  // ── 审核与版本 ──
  designMemory: DesignMemory; // 风格决策记忆
  reviewRecords: ReviewRecord[]; // 审核记录
  decisionLog: DecisionLogEntry[]; // 决策日志
}

type ProjectStatus =
  | "profile-collecting" // 收集 Profile 中
  | "profile-confirmed" // Profile 已确认
  | "designing" // 设计管道执行中
  | "blueprint-ready" // Design Blueprint 待审核
  | "blueprint-approved" // Blueprint 已通过
  | "compiling" // 编译中
  | "compiled" // 主题包已生成
  | "reviewing" // 审核中
  | "approved" // 已确认
  | "locked"; // 已锁定（不可修改）
```

### 2.2 BrandProfile（来自现有 SKILL.md 第一步）

```typescript
interface BrandProfile {
  profileType: "brand";
  brandName: string;
  logo: File | null; // 必填
  description: string; // 100~300 字
  keywords: string[]; // 3~5 个
  primaryColor?: string; // #HEX 或 auto
  website?: string;
  slogan?: string;
  brandSpec?: File; // VI 手册 PDF
}
```

### 2.3 CreatorProfile（来自现有 SKILL.md 第一步）

```typescript
interface CreatorProfile {
  profileType: "creator";
  name: string; // 公众号名称
  contentDirection: string; // 科技/AI/投资/情感...
  keywords: string[]; // 3~5 个
  primaryColor?: string; // #HEX 或 auto
  logo?: File | null; // 可选
  reference?: string; // 参考风格
  slogan?: string;
}
```

### 2.4 DesignBlueprint（来自现有 5 层 Logic Layer 输出）

融合现有 design-logic-brand.md 和 design-logic-creator.md 中的核心策略结构：

```typescript
interface DesignBlueprint {
  // ── 阅读体验画像（第三步） ──
  readingExperience: {
    rhythm: "fast" | "medium" | "slow";
    density: "low" | "medium" | "high";
    emotion: string;
    visualWeight: string;
    narrative: string;
    whitespace: string;
    intimacy?: string; // 仅 Creator
  };

  // ── 品牌表达策略 / 概念表达策略（第四步） ──
  expression: BrandExpression | ConceptExpression;

  // ── 组件表达映射表（第五步） ──
  componentExpression: ComponentExpression;

  // ── 视觉语言（第六步） ──
  visualLanguage: {
    colors: Record<string, string>; // 14 色
    typography: TypographyConfig;
    spacing: SpacingConfig;
    border: BorderConfig;
    shadow: ShadowConfig;
  };

  // ── 布局策略（第七步） ──
  layoutStrategy: {
    pageStructure: string;
    paragraphStyle: string;
    hierarchy: string;
    componentFlow: string;
    preferredComponentCount: string;
  };
}
```

### 2.5 DesignMemory（风格决策记忆）

```typescript
interface DesignMemory {
  // 已确认的风格决策
  decisions: Decision[];
  // 已确认的组件风格
  componentStyles: Record<string, string>; // { "hero-banner": "brand-gradient", ... }
  // 设计偏好
  preferences: {
    patternDensity: "low" | "medium" | "high";
    decorationLevel: "minimal" | "moderate" | "rich";
    cornerStyle: "rounded" | "sharp" | "mixed";
  };
  // 被拒绝过的方案（避免重复）
  rejectedApproaches: string[];
}

interface Decision {
  type: "style" | "component" | "color" | "typography" | "layout";
  key: string;
  value: string;
  reason: string;
  confirmedAt: string;
  source: "ai-proposal" | "user-feedback" | "review";
}
```

---

## 三、Service 层（操作唯一入口）

### 3.1 职责边界

```
Service 负责：
  ✅ 读写 JSON 文件
  ✅ 创建目录结构
  ✅ 管理组件版本（不可覆盖已确认版本）
  ✅ Schema 校验（写入前）
  ✅ 写入 review.json / decision-log.json
  ✅ 管理任务队列（inbox / processing / done / failed）
  ✅ 状态流转（draft → reviewing → approved → locked）
  ✅ 调用 Skill（传入结构化数据，接收结构化输出）

Skill 负责：
  ✅ 输入 → 输出（纯逻辑）
  ❌ 不读写文件
  ❌ 不创建目录
  ❌ 不管理版本
  ❌ 不写 review
```

### 3.2 Service 接口

```typescript
interface ProjectService {
  // ── 项目生命周期 ──
  createProject(profile: BrandProfile | CreatorProfile): DesignProject;
  getProject(id: string): DesignProject;
  updateProfile(id: string, profile: Partial<Profile>): DesignProject;
  deleteProject(id: string): void;

  // ── 设计管道触发 ──
  runDesignPipeline(projectId: string): Promise<DesignBlueprint>;
  //  内部调用 Skill → 5 层管道
  //  1. Service 组装输入（Profile + DesignMemory）
  //  2. 调用 Skill（传入结构化数据）
  //  3. Skill 执行 5 层管道，输出 DesignBlueprint
  //  4. Service 保存 DesignBlueprint 到 project 文件

  // ── 编译 ──
  compileTheme(projectId: string): Promise<ThemePackage>;
  //  1. 确保 DesignBlueprint 已审核通过
  //  2. 调用 Skill 的 Compiler 子流程
  //  3. Service 保存 ThemePackage

  // ── 审核 ──
  submitForReview(projectId: string): ReviewRecord;
  approveBlueprint(projectId: string): void;
  rejectBlueprint(projectId: string, feedback: string): void;

  // ── 版本管理 ──
  createComponentVersion(
    projectId: string,
    component: string,
    data: ComponentData,
  ): void;
  getComponentVersions(
    projectId: string,
    component: string,
  ): ComponentVersion[];
  rollbackComponent(
    projectId: string,
    component: string,
    version: number,
  ): void;

  // ── 素材管理 ──
  saveMaterial(
    projectId: string,
    element: string,
    usage: string,
    svg: string,
  ): void;
  getMaterial(projectId: string, element: string, usage: string): string | null;
  getMaterialWorkspace(projectId: string): Material[];
}
```

### 3.3 任务队列

```
workspace/
├── inbox/          # 等待处理的 Task
│   └── task-001.json
├── processing/     # 正在处理
│   └── task-001.json
├── done/           # 已完成
│   └── task-001.json
├── failed/         # 执行失败（含错误日志）
│   └── task-001.json
└── logs/           # 执行日志
    └── task-001.log
```

Task 结构：

```typescript
interface DesignTask {
  taskId: string;
  projectId: string;
  type: "generate-theme" | "regenerate" | "modify-component" | "compile";
  input: Record<string, unknown>;
  status: "pending" | "processing" | "done" | "failed";
  createdAt: string;
  updatedAt: string;
  error?: string;
}
```

---

## 四、5 层设计管道（Skill 内部逻辑）

### 4.1 与现有 SKILL.md 的映射

| 现有 SKILL.md 步骤                     | 融合架构中的位置                | 输出              |
| -------------------------------------- | ------------------------------- | ----------------- |
| 第零步：选择 Profile 模板              | Service 层决定                  | 确定 Project 类型 |
| 第一步：收集 Profile                   | Service 层 → Project            | 保存 Profile      |
| 第二步：关键词推荐                     | Logic Layer                     | 确定关键词        |
| 第三步：阅读体验定义                   | Logic Layer                     | 阅读体验画像      |
| 第四步：品牌表达策略/创造视觉概念      | Logic Layer                     | 表达策略          |
| 第五步：品牌元素→组件映射/概念表达策略 | Logic Layer                     | 组件映射表        |
| 第六步：视觉语言                       | Logic Layer                     | 视觉语言规范      |
| 第七步：布局语言                       | Logic Layer                     | 布局策略          |
| **第八步：约束检查**                   | Constraint Layer                | 合规确认          |
| **第九步：应用层实现**                 | Application Layer               | variantCss + 素材 |
| 第十步：输出 manifest.json             | Compiler Layer                  | manifest.json     |
| 第十一步：自检+质量反馈                | Compiler Layer + Feedback Layer | 质量评分卡        |
| 第十二步：输出交付物                   | Compiler Layer                  | .wemd-theme       |

### 4.2 Skill 的输入/输出契约

```
Skill 输入（由 Service 组装）：
  {
    projectId: string,
    profile: BrandProfile | CreatorProfile,
    designMemory: DesignMemory | null,
    action: "generate-blueprint" | "compile" | "feedback"
  }

Skill 输出（由 Service 保存）：
  {
    projectId: string,
    success: boolean,
    data: DesignBlueprint | ThemePackage | FeedbackReport,
    errors?: string[]
  }
```

### 4.3 5 层管道的执行流程（Skill 内部）

```
                  ┌─────────────────────────────┐
                  │  Service 组装输入              │
                  │  Profile + DesignMemory       │
                  └─────────────┬───────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────┐
│  Logic Layer                                     │
│                                                  │
│  ① 阅读体验定义（第三步）                          │
│  ② 品牌表达策略 / 创造视觉概念（第四步）            │
│  ③ 品牌元素→组件映射 / 概念表达策略（第五步）       │
│  ④ 视觉语言（第六步）                              │
│  ⑤ 布局语言（第七步）                              │
│                                                  │
│  输出：Design Blueprint                           │
└────────────────────┬────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────┐
│  Constraint Layer                                │
│                                                  │
│  C1 微信公众号平台约束检查                         │
│  C2 WeMD 规范约束检查                             │
│  C3 CSS 变量命名约束检查                           │
│  C5 品牌一致性约束检查（Warning）                   │
│  C6 组件合法性约束检查                             │
│                                                  │
│  输出：合规的 Design Blueprint / 打回重试           │
└────────────────────┬────────────────────────────┘
                     │ 通过
                     ▼
┌─────────────────────────────────────────────────┐
│  Application Layer                               │
│                                                  │
│  ① 策略选择矩阵（A-E 方案选择）                    │
│  ② 素材生成与复用（检查工作区 → 生成/复用）        │
│  ③ variantCss 生成                               │
│                                                  │
│  输出：可执行的 CSS + manifest 配置                 │
└────────────────────┬────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────┐
│  Compiler Layer                                  │
│                                                  │
│  ① Manifest Generator：Blueprint → manifest.json │
│  ② CSS Generator：映射 → variantCss               │
│  ③ Validator：自检清单                            │
│  ④ Packager：→ .wemd-theme                       │
│                                                  │
│  输出：Theme Package                              │
└────────────────────┬────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────┐
│  Feedback Layer                                  │
│                                                  │
│  F1 品牌一致性 / F2 阅读体验 / F3 组件覆盖         │
│  F4 约束遵守 / F5 概念一致性（仅 Creator）          │
│                                                  │
│  输出：质量评分卡 + 通过/回退建议                    │
└─────────────────────────────────────────────────┘
```

---

## 五、审核流水线（Review Pipeline）

### 5.1 审核节点

融合架构在两个关键节点插入审核：

```
节点 A：Design Blueprint 审核
  ┌─ Logic Layer 输出 Blueprint ──→ Constraint 检查 ──→ 用户审核 Blueprint
  │                                                      │
  │                                              ┌───────┴───────┐
  │                                              │ 通过 → 进入实现 │
  │                                              │ 驳回 → 回退调整 │
  └──────────────────────────────────────────────┴───────────────┘

节点 B：Theme Package 审核
  ┌─ Compiler 输出 Theme Package ──→ Feedback 评估 ──→ 用户审核主题包
                                                       │
                                               ┌───────┴───────┐
                                               │ 通过 → 交付    │
                                               │ 驳回 → 回退重编 │
                                               └───────────────┘
```

### 5.2 Review Record

```typescript
interface ReviewRecord {
  reviewId: string;
  projectId: string;
  stage: "blueprint" | "theme";
  status: "pending" | "approved" | "rejected";
  score?: number; // 1-100
  feedback?: string; // 修改意见
  reviewedBy: "user" | "ai";
  createdAt: string;
  decidedAt?: string;
}
```

### 5.3 Decision Log

```typescript
interface DecisionLogEntry {
  version: number;
  stage: string;
  decision: "approved" | "rejected" | "revised";
  reason: string;
  timestamp: string;
}
```

---

## 六、版本管理

### 6.1 组件版本

```typescript
interface ComponentVersion {
  version: number;
  component: string; // 组件名
  variant: string;
  variantCss: string;
  createdAt: string;
  createdBy: "ai" | "user";
  status: "draft" | "reviewing" | "approved" | "locked";
  changeLog: string; // 修改说明
  parentVersion?: number; // 基于哪个版本修改
}
```

### 6.2 版本规则

- 每次 AI 修改必须创建新版本，**不能覆盖旧版本**
- 已 `approved` 的版本不可直接修改
- 已 `locked` 的版本不可回退
- 支持回退到任意历史版本

---

## 七、目录结构

```
wechat-brand-studio/
│
├── projects/                          # 所有项目
│   └── {project-id}/                  # 单个项目
│       ├── project.json               # 项目元信息 + 状态
│       ├── profile.json               # BrandProfile / CreatorProfile
│       ├── design-blueprint.json      # 5 层管道输出
│       ├── design-memory.json         # 风格决策记忆
│       │
│       ├── theme/                     # 主题包
│       │   ├── manifest.json
│       │   └── {slug}.wemd-theme
│       │
│       ├── materials/                 # 素材工作区
│       │   └── assets/
│       │       └── {element}-{usage}.svg
│       │
│       ├── reviews/
│       │   ├── blueprint-review.json
│       │   └── theme-review.json
│       │
│       └── decision-log.json
│
├── skills/
│   └── wemd-theme-designer/           # 现有 Skill
│       ├── SKILL.md                   # 主指令（适配融合架构）
│       └── spec/                      # 现有 spec 文件
│           ├── design-logic-brand.md
│           ├── design-logic-creator.md
│           ├── constraint-layer.md
│           ├── application-layer.md
│           ├── feedback-layer.md
│           ├── theme-package-spec.md
│           └── fusion-architecture.md # 本文档
│
├── services/                          # Service 层实现
│   ├── project-service.ts
│   ├── file-service.ts
│   └── task-queue.ts
│
└── workspace/                         # 任务队列
    ├── inbox/
    ├── processing/
    ├── done/
    ├── failed/
    └── logs/
```

---

## 八、数据流总览

### 8.1 完整流程

```
用户录入 Profile
    │
    ▼
Service → project.json + profile.json
    │
    ▼
Service 触发设计管道
    │
    ▼
Service 组装输入（Profile + DesignMemory）
    │
    ▼
Skill 执行 5 层管道
    │
    ├── Logic Layer → Design Blueprint
    ├── Constraint Layer → 合规检查
    ├── Application Layer → 方案 + 素材 + CSS
    ├── Compiler Layer → manifest.json + .wemd-theme
    └── Feedback Layer → 质量评分卡
    │
    ▼
Service 保存输出
    │
    ├── design-blueprint.json
    ├── materials/assets/*.svg
    ├── theme/manifest.json
    └── theme/{slug}.wemd-theme
    │
    ▼
审核流水线
    │
    ├── 用户审核 Blueprint
    │   ├── 通过 → 继续编译
    │   └── 驳回 → Service 触发重设计
    │
    └── 用户审核 Theme Package
        ├── 通过 → 交付（locked）
        └── 驳回 → Service 生成修改 Task → inbox
```

### 8.2 修改流程

```
用户提出修改意见
    │
    ▼
Service 生成 Task → workspace/inbox/
    │
    ▼
Agent 读取 Task
    │
    ├── 读取 project.json
    ├── 读取 design-memory.json
    ├── 读取当前 theme/manifest.json
    └── 读取 review record
    │
    ▼
Agent 调用 Skill（指定 action: "modify"）
    │
    ▼
Skill 只修改指定部分，输出新版本
    │
    ▼
Service 保存新版本（不覆盖旧版本）
    │
    ▼
Task → workspace/done/
    │
    ▼
重新进入审核流水线
```

---

## 九、与现有架构的差异对照

| 维度         | 当前架构          | 融合架构                          |
| ------------ | ----------------- | --------------------------------- |
| 数据主体     | 无（AI 直接输出） | **Project**（结构化持久化）       |
| 文件操作     | AI 直接写文件     | **Service 层**统一管理            |
| 版本管理     | 无（覆盖式生成）  | **版本化**（不可覆盖已确认）      |
| 审核流程     | 无（AI 一次生成） | **Blueprint 审核 + Theme 审核**   |
| 任务队列     | 无                | **inbox/processing/done/failed**  |
| 素材管理     | 工作区文件        | **Service 统一管理**              |
| 设计记忆     | 无                | **Design Memory**（避免重复错误） |
| Creator 路线 | 保留              | **保留**（统一 Project 结构）     |
| 5 层管道     | 保留              | **保留**（作为 Skill 内部逻辑）   |
| 约束检查     | 保留              | **保留**（Constraint Layer）      |
| 质量反馈     | 保留              | **保留**（Feedback Layer）        |

---

## 十、实施建议

### Phase 1：建立 Project + Service 骨架

- 定义所有 TypeScript 类型（Project、Profile、Blueprint 等）
- 实现 Service 层（文件读写、目录管理、Schema 校验）
- 建立 workspace 任务队列目录结构
- 将现有 Profile 收集逻辑迁移到 Service

### Phase 2：嫁接 5 层管道

- 将现有 SKILL.md 中的 5 层管道封装为 Skill 内部逻辑
- 实现 Skill 的输入/输出契约（Service 调用 Skill）
- 保持现有 design-logic-brand.md 和 design-logic-creator.md 不变
- 保持现有 constraint-layer.md、application-layer.md、feedback-layer.md 不变

### Phase 3：审核流水线

- 实现 Blueprint 审核和 Theme 审核节点
- 实现 Review Record 和 Decision Log
- 实现 Design Memory 的读写和利用

### Phase 4：版本管理

- 实现组件版本管理
- 实现版本回退
- 实现已确认版本保护

---

## 十一、检验功能内置化（消除独立检验界面）

### 当前的问题

目前有一个独立的 `theme-validator-web` 检验工具，用户需要：

```
生成主题包 → 拖到检验工具 → 看到40个错误 → 手动修复 → 重新生成
```

这是**事后检验**，不是设计流程的一部分。

### 融合架构的解决方案

检验逻辑被拆解到管道的三层中，**自动执行**，无需用户手动触发：

```
┌─ 设计管道自动检验 ────────────────────────────────────┐
│                                                         │
│  ① Constraint Layer（Blueprint 阶段）                    │
│     ┌────────────────────────────────────────────────┐  │
│     │ C1 公众号平台约束 → 阻断含伪元素/动画的设计      │  │
│     │ C2 WeMD 规范约束  → 阻断结构不完整的 manifest   │  │
│     │ C3 CSS 变量约束   → 阻断 --wemd-color-xxx 等错误 │  │
│     │ C4 素材资源约束   → 阻断危险 SVG / 外链引用      │  │
│     │ C5 品牌一致性约束 → Warning（不阻断）             │  │
│     │ C6 组件合法性约束 → 阻断非法组件名               │  │
│     └────────────────────────────────────────────────┘  │
│     违反 C1/C2/C3/C4/C6 → 直接打回 Logic Layer 调整     │
│     用户看到的是"已通过约束检查"的 Blueprint             │
│                                                         │
│  ② Compiler Layer → Validator（输出阶段）               │
│     ┌────────────────────────────────────────────────┐  │
│     │ manifest 结构校验（sdkVersion/meta/tokens...）  │  │
│     │ 14 色字段完整性校验                              │  │
│     │ typography h1-h4 字号递减校验                    │  │
│     │ CSS 变量存在性校验（无 --hb-title 等未定义变量）   │  │
│     │ variantCss 选择器格式校验                        │  │
│     │ 资源引用方式校验（无 url(assets/...) 直接引用）   │  │
│     └────────────────────────────────────────────────┘  │
│     不通过 → 回退到 Application Layer 修正               │
│     用户看到的是"已通过编译校验"的主题包                  │
│                                                         │
│  ③ Feedback Layer（交付阶段）                            │
│     ┌────────────────────────────────────────────────┐  │
│     │ F1 品牌一致性：Logo 使用频率、辅助图形覆盖       │  │
│     │ F2 阅读体验：fontSize 与 density 匹配           │  │
│     │ F3 组件覆盖：所有映射是否已实现                  │  │
│     │ F4 约束遵守：双重确认（必须满分）                │  │
│     │ F5 概念一致性（仅 Creator）                      │  │
│     └────────────────────────────────────────────────┘  │
│     不通过 → 回退到对应层调整                            │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 对比：检验工具 vs 融合架构

| 维度     | 独立检验工具             | 融合架构（内置检验）           |
| -------- | ------------------------ | ------------------------------ |
| 触发方式 | 用户手动拖入             | **管道自动执行**               |
| 时机     | 生成之后                 | **生成过程中**                 |
| 反馈方式 | 错误列表，用户自行修复   | **自动回退到对应层修正**       |
| 设计质量 | 不检查                   | **Feedback Layer 5 维度评估**  |
| 审核界面 | 需要单独开发             | **复用 Review Pipeline**       |
| 用户操作 | 拖文件 → 看报错 → 手动修 | **审核时直接看到已通过的结果** |

### 结论

**融合架构不需要独立的检验界面。** 检验逻辑已经分布在内置的三层中：

1. **Constraint Layer** 阻断策略层违规 → 用户看到的是"设计方向合规"
2. **Compiler Layer Validator** 阻断实现层违规 → 用户看到的是"语法结构正确"
3. **Feedback Layer** 评估设计质量 → 用户看到的是"设计目标达标"

用户只需要在 **Review Pipeline** 中审核两个节点（Blueprint 审核 + Theme 审核），所有检验结果已经整合在审核界面上，不需要再拖文件到另一个工具。

---

## 十二、关键原则总结

1. **Project 是主体** — 不是 AI 一次性输出，而是项目持续迭代
2. **Service 是唯一入口** — 所有数据操作经 Service，Skill 只管输入→输出
3. **5 层管道是设计灵魂** — 保留完整创意逻辑，不做简化
4. **审核是质量门** — Blueprint 和 Theme 两次审核，确保设计质量
5. **版本是可追溯的** — 每次修改都创建新版本，可回退
6. **Design Memory 是经验积累** — 越用越统一，越用越精准
7. **Creator 和 Brand 平等** — 统一 Project 结构，Profile 类型区分
