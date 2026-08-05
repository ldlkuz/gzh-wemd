# WeMD Theme Designer 架构重构方案

> 从"Theme Generator"升级为"AI Design Pipeline"
> 五层架构：Logic → Constraint → Application → Compiler → Feedback

---

## 当前问题

当前代码将所有逻辑混在 SKILL.md 和 generate-theme.md 中：

- 设计决策（Logic）和实现策略（Application）耦合在一起
- 约束条件（Constraint）散落在各文档中，没有独立建模
- 素材资源（Material）依赖预设库，AI 查表而非推理，导致"选择器"问题
- 没有反馈回路（Feedback），生成后无法评估设计目标是否达成

---

## 目标架构

```
┌─────────────────────────────────────────────────────┐
│                   Knowledge Layer                     │
│       设计知识 · 行业知识 · 品牌知识 · 公众号知识        │
│                (贯穿所有层的背景知识)                    │
└──────────────┬──────────────────────────┬────────────┘
               │                          │
┌──────────────▼──────────────────────────▼────────────┐
│  ① Logic Layer (设计层)                               │
│  回答：应该设计成什么样？                               │
│  输出：Design Blueprint (纯策略，不含 CSS)              │
│  文件：design-logic-brand.md, design-logic-creator.md  │
└──────────────┬────────────────────────────────────────┘
               │
┌──────────────▼────────────────────────────────────────┐
│  ② Constraint Layer (约束层)                           │
│  回答：哪些设计是公众号/WeMD 不支持的？                  │
│  角色：设计裁判，在 Logic → Application 之间参与决策     │
│  文件：constraint-layer.md                              │
└──────────────┬────────────────────────────────────────┘
               │
┌──────────────▼────────────────────────────────────────┐
│  ③ Application Layer (实现层)                          │
│  回答：如何实现这个设计？                               │
│  角色：选择方案 + 生成素材 + 产出 CSS                   │
│  文件：application-layer.md                             │
└──────────────┬────────────────────────────────────────┘
               │
┌──────────────▼────────────────────────────────────────┐
│  ④ Compiler Layer (编译层)                             │
│  回答：如何输出合规的 Theme Package？                    │
│  角色：Manifest + CSS + Validator → .wemd-theme         │
│  文件：theme-package-spec.md, component-registry.md     │
└──────────────┬────────────────────────────────────────┘
               │
┌──────────────▼────────────────────────────────────────┐
│  ⑤ Feedback Layer (反馈层)                             │
│  回答：设计目标是否实现了？                              │
│  角色：生成后回头评估，不满足则回退到 Logic/Application    │
│  文件：feedback-layer.md                                │
└────────────────────────────────────────────────────────┘
```

---

## 层详解

---

### ① Logic Layer（设计层）— 已完成

**状态：✅ 已完成**

当前文件已覆盖：

- [design-logic-brand.md](design-logic-brand.md) — 企业品牌设计逻辑
- [design-logic-creator.md](design-logic-creator.md) — 自由创作设计逻辑
- SKILL.md 第三步~第五步 — 整合到主流程

**输出：Design Blueprint**

```yaml
designBlueprint:
  # 品牌表达策略（Brand）或 概念表达策略（Creator）
  brandExpression: { ... }
  # 组件表达映射表
  componentExpression: { ... }
  # 阅读体验画像
  readingExperience: { ... }
```

**后续维护：**

- Logic Layer 是核心创意层，未来迭代方向是增加更多品牌分析维度
- 不涉及任何 CSS/实现细节

---

### ② Constraint Layer（约束层）— 已建成

**状态：✅ 已建成**

当前约束条件已独立建模为 `constraint-layer.md`：

- C1. 微信公众号平台约束（伪元素、动画、定位等）
- C2. WeMD Theme 规范约束（manifest 结构、字段类型）
- C3. CSS 变量命名约束（正确/错误写法对照）
- C4. 素材资源约束（SVG 安全、大小限制、内容边界）
- C5. 品牌一致性约束（Logo 频率、装饰数量、统一几何语言）
- C6. 组件合法性约束（35 个合法组件、tone/density/SDK 版本）

**角色：** 在 Logic → Application 之间作为"设计裁判"，检查 Design Blueprint 合规性。

#### 约束分类

```
┌─ Constraint Matrix ──────────────────────────────────┐
│                                                        │
│  C1. 微信公众号平台约束                                   │
│  ├── 不支持 ::before / ::after                          │
│  ├── 不支持 :first-child / :nth-child 等结构伪类        │
│  ├── 不支持 @keyframes / animation                     │
│  ├── 不支持 position: fixed / sticky                   │
│  ├── 不支持 backdrop-filter / filter                   │
│  ├── 不支持外部 url() 引用                              │
│  ├── 不支持 <style> / <script> 标签                    │
│  └── 不支持 @import                                    │
│                                                        │
│  C2. WeMD Theme 规范约束                                 │
│  ├── manifest.json 顶层字段限制                          │
│  ├── tokens 14 色字段必填                               │
│  ├── typography h1-h4 各 5 字段必填                     │
│  ├── spacing / border / shadow 结构必填                  │
│  ├── 组件名必须来自 LEGAL_COMPONENTS                    │
│  ├── variantCss 选择器格式固定                           │
│  └── CSS 变量必须是 --wemd-xxx 格式                     │
│                                                        │
│  C3. CSS 变量命名约束                                    │
│  ├── 正确：--wemd-primary, --wemd-border-radius        │
│  ├── 错误：--wemd-color-primary (多了一层 color)        │
│  └── 错误：--wemd-border-radius-lg (不存在的后缀)       │
│                                                        │
│  C4. 素材资源约束                                        │
│  ├── SVG 内不允许 <script> / onload= / javascript:     │
│  ├── Base64 单图 ≤ 150KB                               │
│  ├── 资源引用三选一：data URL / manifest 内联 / zip 相对路径 │
│  └── 文章内容图不属于主题包                              │
│                                                        │
│  C5. 品牌一致性约束                                      │
│  ├── Logo 使用频率不超过策略定义                          │
│  ├── 装饰不能干扰正文阅读                                 │
│  └── 品牌色使用范围不超出策略定义                          │
│                                                        │
└────────────────────────────────────────────────────────┘
```

#### 在流程中的位置

```
Logic Layer 输出 Design Blueprint
         │
         ▼
  ┌─ Constraint Layer ──┐
  │  检查 Blueprint 中   │
  │  每个设计决策是否     │  ← 如果违反约束，打回 Logic 调整
  │  符合约束 C1-C5      │
  └────────┬────────────┘
           │ 通过
           ▼
  Application Layer
```

**文件：** `spec/constraint-layer.md`

---

### ③ Application Layer（实现层）— 已创建

**状态：🔄 已创建，已整合素材生成**

当前 AI 直接生成 variantCss，没有"选择实现方案"的步骤。

**问题：** 同一个设计目标可以有多种实现方式，AI 应该先选方案再生成。

**解决方案：** 新建 `application-layer.md`，定义每种设计目标的实现策略树，并在其中整合素材生成规则。

#### 实现策略树示例

```
设计目标：Divider 使用品牌辅助图形
│
├── 方案 A：Inline SVG background-image
│   适用：简单图形（波形、六边形、线条）
│   优点：无额外请求，颜色可调
│   代码：background-image: url("data:image/svg+xml;utf8,...")
│
├── 方案 B：Base64 PNG background-image
│   适用：复杂图形（Logo、照片级纹理）
│   优点：兼容性好
│   缺点：文件大，颜色不可调
│
├── 方案 C：CSS border-image
│   适用：重复边框图案
│   优点：可拉伸
│   缺点：微信公众号兼容性差
│
└── 方案 D：manifest.assets 注册 + var(--wemd-asset-xxx)
    适用：跨组件复用的品牌资源
    优点：统一管理，一处修改全局生效
    缺点：需要额外注册步骤
```

#### 实现策略选择规则

| 设计目标                 | 约束条件         | 推荐方案                       | 备选方案   |
| ------------------------ | ---------------- | ------------------------------ | ---------- |
| 装饰性图形（波形、网格） | 简单 SVG，≤ 500B | Inline SVG                     | Base64 PNG |
| 品牌 Logo                | 需要复用         | manifest.assets + var()        | Inline SVG |
| 复杂纹理（照片、渐变）   | 文件大小 ≤ 150KB | Base64 PNG                     | —          |
| 重复图案（网格、点阵）   | 需要平铺         | Inline SVG + background-repeat | —          |
| 图标（大小 ≤ 50px）      | 需要颜色匹配     | Inline SVG + currentColor      | —          |

#### 素材生成（Application Layer 的子步骤）

> 素材生成不再是一个独立的层，而是 Application Layer 的一个子步骤。
> AI 选择方案后，直接从品牌元素/概念元素的描述推理出 SVG，不需要查预设表。

```
方案选定了（如 Inline SVG）
    │
    ▼
AI 观察品牌元素/概念元素的视觉特征
    │
    ├── 形状、颜色、纹理、风格
    │
    ▼
AI 推理 SVG 表达方式
    │
    ├── 六边形 → <polygon> 平铺
    ├── 波形 → <path> 贝塞尔曲线
    └── 品牌色 → <linearGradient>
    │
    ▼
生成 SVG 内联到 variantCss
```

#### 在流程中的位置

```
Constraint Layer 确认 Blueprint 合规
         │
         ▼
  ┌─ Application Layer ──────────────┐
  │  ① 对每个设计目标，                │
  │     从策略树选择最佳方案             │
  │  ② 如需生成 SVG 素材，              │
  │     从品牌元素推理生成               │
  │  ③ 产出 variantCss + manifest 片段  │
  └────────┬──────────────────────────┘
           │
           ▼
  Compiler Layer
```

**文件：** `spec/application-layer.md`

---

### ④ Compiler Layer（编译层）— 部分完成

**状态：🔄 部分完成 — 需整合**

当前已有：

- [theme-package-spec.md](theme-package-spec.md) — manifest 规范
- [component-registry.md](component-registry.md) — 组件注册表
- 程序中的 `validateThemePackageManifest` — 校验器

**需要补充：**

#### 4.1 Compiler Pipeline

```
Design Blueprint (来自 Application Layer)
         │
         ▼
  ┌─ Manifest Generator ──┐
  │  Blueprint → manifest.json │
  │  tokens 填充               │
  │  components 拼装            │
  │  layout 配置                │
  │  assets 引用                │
  └────────┬─────────────────┘
           │
           ▼
  ┌─ CSS Generator ──┐
  │  variantCss 生成    │
  │  CSS 变量替换       │
  │  Base64 内联        │
  └────────┬─────────┘
           │
           ▼
  ┌─ Validator ──┐
  │  manifest 校验  │
  │  CSS 语法检查    │
  │  ️ 资源存在性检查  │
  └────────┬──────┘
           │
           ▼
  ┌─ Packager ──┐
  │  zip 打包      │
  │  .wemd-theme  │
  └──────────────┘
```

#### 4.2 需要补充的规则

- **manifest.json 生成模板**：明确每个字段的生成规则
- **variantCss 生成规则**：从映射表到 CSS 的转换规则
- **Base64 内联规则**：何时 data URL 何时 manifest 注册
- **Validator 集成**：AI 输出前必须调用的校验步骤

**文件：** 更新 `theme-package-spec.md` 增加 Compiler 章节

---

### ⑤ Feedback Layer（反馈层）— 已建成

**状态：✅ 已建成**

已在 `feedback-layer.md` 中定义设计质量评估维度：

- F1. 品牌一致性评估（Logo/品牌色/辅助图形使用是否匹配策略）
- F2. 阅读体验评估（fontSize/spacing 是否与 density 匹配）
- F3. 组件覆盖评估（所有品牌元素→组件映射是否已实现）
- F4. 约束遵守评估（CSS 和 manifest 是否无违规项）
- F5. 概念一致性评估（仅 Creator Profile）

**角色：** Compiler 输出后做最终质量评估，不满足则回退到对应层调整。

#### 评估维度

```
┌─ Feedback Report ─────────────────────────────────────┐
│                                                        │
│  F1. 品牌一致性评估                                      │
│  ├── Logo 使用频率是否在策略定义的范围内？                │
│  ├── 品牌色使用是否符合策略定义？                          │
│  ├── 装饰元素是否过多干扰正文？                           │
│  └── 所有组件是否使用了统一的几何语言？                    │
│                                                        │
│  F2. 阅读体验评估                                        │
│  ├── 信息密度是否符合阅读体验画像？                        │
│  ├── 情绪基调是否匹配？                                  │
│  ├── 留白是否合理？                                      │
│  └── 字体选择是否可读？                                  │
│                                                        │
│  F3. 组件覆盖评估                                        │
│  ├── 品牌元素映射是否完整覆盖？                            │
│  ├── 是否有组件被遗漏（品牌元素应该出现在该组件但没出现）？  │
│  └── 概念元素映射是否完整覆盖？                            │
│                                                        │
│  F4. 约束遵守评估                                        │
│  ├── 所有 CSS 约束是否遵守？                              │
│  ├── 所有 manifest 约束是否遵守？                         │
│  └── 所有资源约束是否遵守？                               │
│                                                        │
└────────────────────────────────────────────────────────┘
```

#### 评估流程

```
Compiler 输出 Theme Package
         │
         ▼
  ┌─ Feedback Layer ──┐
  │  加载 Design        │
  │  Blueprint          │
  │  逐项评估 F1-F4     │
  └────────┬────────────┘
           │
     ┌─────┴─────┐
     │           │
   全部通过    有未通过
     │           │
     ▼           ▼
  交付    回退到 Logic
          Layer 调整
          或 Application
          Layer 换方案
```

#### 设计质量评分卡

```yaml
feedbackReport:
  brandConsistency:
    score: 85/100
    issues:
      - "Logo 在 section-divider 中出现，违反策略定义"
      - "品牌色 primary 在 stats-block 中未使用"
    passed: true # score ≥ 70

  readingExperience:
    score: 90/100
    issues: []
    passed: true

  componentCoverage:
    score: 75/100
    issues:
      - "六边形形状未映射到 tag-label"
    passed: true

  constraintCompliance:
    score: 100/100
    issues: []
    passed: true

  overall:
    passed: true
    summary: "品牌一致性有小问题，建议修复后交付"
```

**文件：** `spec/feedback-layer.md`

---

## 文件映射关系

| 当前文件                  | 所属层 | 状态      | 操作                     |
| ------------------------- | ------ | --------- | ------------------------ |
| `SKILL.md`                | 全层   | ✅ 已更新 | 保持，作为主指令入口     |
| `generate-theme.md`       | 全层   | ✅ 已更新 | 保持，作为生成 prompt    |
| `self-check.md`           | ④⑤     | ✅ 已更新 | 保持，整合 Feedback 检查 |
| `design-logic-brand.md`   | ①      | ✅ 已完成 | 保持                     |
| `design-logic-creator.md` | ①      | ✅ 已完成 | 保持                     |
| `theme-package-spec.md`   | ④      | 🔄 部分   | 补充 Compiler 章节       |
| `component-registry.md`   | ④      | ✅ 已完成 | 保持                     |
| `brand-keywords.md`       | ①      | ✅ 已完成 | 保持                     |
| `profile-templates.md`    | ①      | ✅ 已完成 | 保持                     |
| —                         | ②      | ✅ 已新建 | `constraint-layer.md`    |
| —                         | ③      | ✅ 已新建 | `application-layer.md`   |
| —                         | ⑤      | ✅ 已新建 | `feedback-layer.md`      |

---

## 实施路线图

### Phase 1：约束层

1. 新建 `spec/constraint-layer.md`
2. 从 SKILL.md 和 theme-package-spec.md 中提取所有约束
3. 建立约束矩阵（C1-C5）
4. 更新 generate-theme.md 在阶段 7→8 之间插入约束检查步骤（已实现，对应阶段 8）

### Phase 2：应用层

1. 新建 `spec/application-layer.md`
2. 定义 10+ 种常见设计目标的实现策略树
3. 建立策略选择规则表
4. 更新 SKILL.md 的 Application 步骤

### Phase 3：反馈层

1. 新建 `spec/feedback-layer.md`
2. 定义 F1-F4 评估维度
3. 建立设计质量评分卡
4. 更新 self-check.md 整合 Feedback 检查

### Phase 4：编译器整合

1. 更新 theme-package-spec.md 增加 Compiler Pipeline 章节
2. 明确 manifest.json 生成模板
3. 明确 variantCss 生成规则
4. 更新 Validator 集成步骤

---

## 架构优势

### 1. 职责分离

- Logic Layer 只关心"设计什么"，不关心"怎么实现"
- Application Layer 只关心"怎么实现"，不关心"是否合规"
- Constraint Layer 只关心"是否合规"，不关心"是否好看"
- 每层可独立迭代

### 2. 可测试性

- 每层输出都是结构化数据（YAML/JSON）
- 可以单独测试 Logic Layer 的决策质量
- 可以单独测试 Application Layer 的 CSS 生成
- 可以单独测试 Constraint Layer 的规则检查

### 3. AI 友好

- 每层任务明确，AI 不会混淆"设计"和"实现"
- Constraint Layer 减少 AI 的幻觉空间
- Feedback Layer 提供自我修正机制
- Application Layer 动态生成素材，避免预设库的"选择器"问题

### 4. 可扩展性

- 新增设计逻辑 → 只改 Logic Layer
- 新增平台约束 → 只改 Constraint Layer
- 新增实现方案 → 只改 Application Layer
- 新增素材生成 → 只改 Application Layer 的推理规则

---

## 注意事项

### 对 SKILL.md 的影响

SKILL.md 作为主指令，需要保持对五层的引用，但不需要包含每层的全部细节（太长了）。改为：

```
SKILL.md  →  流程概述 + 每层引用
              │
              ├── Logic Layer → spec/design-logic-brand.md, design-logic-creator.md
              ├── Constraint Layer → spec/constraint-layer.md
              ├── Application Layer → spec/application-layer.md
              ├── Compiler Layer → spec/theme-package-spec.md
              └── Feedback Layer → spec/feedback-layer.md
```

### 对 generate-theme.md 的影响

generate-theme.md 需要更新为五阶段流程（素材生成整合到 Application Layer）：

```
阶段 0：判断 Profile 类型
阶段 1：收集 Profile
阶段 2：确认 Profile
阶段 3：Logic — 阅读体验 + 品牌表达/创造概念 + 组件映射
阶段 4：Constraint — 检查 Blueprint 合规性
阶段 5：Application — 选择实现方案 + 生成素材 + 产出 CSS
阶段 6：Compiler — 生成 manifest + CSS + 校验 + 打包
阶段 7：Feedback — 设计质量评估，不通过则回退
阶段 8：交付
```

---

## 总结

| 维度          | 当前架构                   | 目标架构                                                          |
| ------------- | -------------------------- | ----------------------------------------------------------------- |
| 层数          | 3 层（收集→设计→生成）     | 6 层（Logic→Constraint→Decoration→Application→Compiler→Feedback） |
| 设计决策      | 与 CSS 实现耦合            | 纯策略，不含 CSS                                                  |
| 约束检查      | 散落在各文档中             | 独立建模，作为设计裁判                                            |
| 装饰方案      | AI 直接编写 CSS            | 选择装饰原子组合 + 代码层映射                                     |
| 素材管理      | 无，AI 每次重新生成        | 动态推理生成（整合在 Application Layer）                          |
| 质量反馈      | 无（只有语法校验）         | 设计质量评估 + 回退机制                                           |
| AI 任务复杂度 | 高（同时做设计+实现+合规） | 低（每层专注一件事）                                              |
