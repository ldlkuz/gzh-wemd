# ⑥ Feedback Layer（反馈层）

> 角色：**设计质量评估**
> 回答：**设计目标是否实现了？**
> 位置：Compiler Layer（输出 Theme Package）→ **Feedback Layer（评估质量）** → 通过则交付 / 不通过则回退

---

## 概述

Feedback Layer 是 Design Pipeline 中的"质检员"。Compiler 输出 Theme Package 后，Feedback Layer 检查的不只是语法错误（那是 Validator 的职责），而是**设计目标是否真正实现**。

**核心原则：** 语法正确 ≠ 设计达标。Feedback Layer 确保品牌策略中的每个承诺都在最终主题中得到了体现。

---

## 评估维度

```
┌─ Feedback Report ────────────────────────────────────────────────┐
│                                                                   │
│  F1. 品牌一致性评估（Brand Consistency）                             │
│  检查：品牌表达策略中的每个决策是否在最终主题中实现                    │
│                                                                   │
│  F2. 阅读体验评估（Reading Experience）                             │
│  检查：最终主题的视觉表现是否符合阅读体验画像                         │
│                                                                   │
│  F3. 组件覆盖评估（Component Coverage）                             │
│  检查：组件表达映射表中的每个映射是否都被实现了                        │
│                                                                   │
│  F4. 约束遵守评估（Constraint Compliance）                          │
│  检查：最终主题是否遵守了所有约束规则                                │
│                                                                   │
│  F5. 概念一致性评估（Concept Consistency）— 仅 Creator Profile       │
│  检查：最终主题是否一致地体现了视觉概念                              │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

---

## F1. 品牌一致性评估

> 仅 Brand Profile。检查品牌表达策略中的每个决策是否在最终主题中实现。

### 检查项

| 检查项                | 数据来源                          | 通过条件                                              |
| --------------------- | --------------------------------- | ----------------------------------------------------- |
| F1.1 Logo 使用频率    | brandExpression.logo              | Logo 出现在策略定义的 positions 中，不出现在 avoid 中 |
| F1.2 Logo 透明度      | brandExpression.logo.opacity      | variantCss 中 Logo 的 opacity 符合策略定义            |
| F1.3 Slogan 位置      | brandExpression.slogan            | Slogan 出现在策略定义的 positions 中                  |
| F1.4 辅助图形使用     | brandExpression.auxiliaryGraphics | 每个辅助图形出现在对应的组件中                        |
| F1.5 品牌色使用       | brandExpression.colorUsage        | primary/secondary/accent 使用在策略定义的场景中       |
| F1.6 品牌关键词体现   | brandExpression.keywords          | 每个关键词对应的设计表达在组件中可见                  |
| F1.7 品牌元素重复利用 | brandExpression.reuseStrategy     | 每个品牌元素在策略定义的组件中被复用                  |

### 评估示例

```yaml
feedbackF1:
  score: 85 # 0-100 分
  threshold: 70 # 通过阈值
  passed: true # score ≥ threshold
  items:
    - id: "F1.1"
      name: "Logo 使用频率"
      status: "passed"
      detail: "Logo 出现在 hero-banner 和 author-card 中，未出现在禁止的 section-divider"
    - id: "F1.4"
      name: "辅助图形使用"
      status: "failed"
      detail: "六边形网格未映射到 section-title，违反品牌表达策略"
      suggestion: "在 section-title 的 variantCss 中添加六边形网格装饰"
```

---

## F2. 阅读体验评估

> 检查最终主题的视觉表现是否符合阅读体验画像。

### 检查项

| 检查项        | 数据来源                       | 通过条件                                              |
| ------------- | ------------------------------ | ----------------------------------------------------- |
| F2.1 信息密度 | readingExperience.density      | tokens.typography.fontSize 和 spacing 与 density 匹配 |
| F2.2 情绪基调 | readingExperience.emotion      | 颜色方案和装饰风格与情绪基调一致                      |
| F2.3 视觉重心 | readingExperience.visualWeight | 页面布局结构与视觉重心一致                            |
| F2.4 留白     | readingExperience.whitespace   | 组件间距、边距与 whitespace 设置一致                  |

### 检查规则

| density    | fontSize | pagePadding | paragraphMargin |
| ---------- | -------- | ----------- | --------------- |
| `"low"`    | `"17px"` | 24          | 18              |
| `"medium"` | `"16px"` | 20          | 14              |
| `"high"`   | `"15px"` | 16          | 10              |

### 评估示例

```yaml
feedbackF2:
  score: 90
  threshold: 70
  passed: true
  items:
    - id: "F2.1"
      name: "信息密度"
      status: "passed"
      detail: "density=high, fontSize=15px, pagePadding=16, 符合紧凑型配置"
    - id: "F2.2"
      name: "情绪基调"
      status: "passed"
      detail: "颜色方案冷静克制，符合 'calm' 情绪基调"
```

---

## F3. 组件覆盖评估

> 检查组件表达映射表中的每个映射是否都被实现了。

### 检查项

| 检查项                       | 数据来源                      | 通过条件                                     |
| ---------------------------- | ----------------------------- | -------------------------------------------- |
| F3.1 品牌元素→组件映射完整性 | componentExpression           | 每个映射中的 component 都有对应的 variantCss |
| F3.2 概念元素→组件映射完整性 | conceptExpression.mapping     | 每个映射中的 component 都有对应的 variantCss |
| F3.3 装饰映射完整性          | conceptExpression.decorations | 每个装饰元素都在对应的组件中实现             |

### 评估示例

```yaml
feedbackF3:
  score: 75
  threshold: 70
  passed: true
  items:
    - id: "F3.1"
      name: "Logo 形状→组件映射"
      status: "failed"
      detail: "六边形形状映射到 [section-title, timeline, section-divider, tag-label]，但 tag-label 未实现"
      suggestion: "为 tag-label 添加六边形图标装饰的 variantCss"
    - id: "F3.2"
      name: "品牌色→组件应用"
      status: "passed"
      detail: "primary 色已在 hero-banner, callout-pro, stats-block 中正确应用"
```

---

## F4. 约束遵守评估

> 检查最终主题是否遵守了所有约束规则。这也是 Validator 的职责，Feedback Layer 在此做双重确认。

### 检查项

| 检查项             | 数据来源            | 通过条件                                    |
| ------------------ | ------------------- | ------------------------------------------- |
| F4.1 CSS 约束      | Constraint Layer C1 | variantCss 中无伪元素、无动画、无禁止定位等 |
| F4.2 manifest 约束 | Constraint Layer C2 | manifest.json 结构完整，字段类型正确        |
| F4.3 CSS 变量约束  | Constraint Layer C3 | 所有 CSS 变量引用正确                       |
| F4.4 资源约束      | Constraint Layer C4 | 资源安全、大小合规、引用方式正确            |

### 评估示例

```yaml
feedbackF4:
  score: 100
  threshold: 100 # 约束遵守必须满分（硬性要求）
  passed: true
  items:
    - id: "F4.1"
      name: "CSS 约束"
      status: "passed"
      detail: "无伪元素、无动画、无禁止定位"
    - id: "F4.3"
      name: "CSS 变量约束"
      status: "passed"
      detail: "所有 CSS 变量引用正确，无不存在的变量"
```

---

## F5. 概念一致性评估

> 仅 Creator Profile。检查最终主题是否一致地体现了视觉概念。

### 检查项

| 检查项            | 数据来源                      | 通过条件                        |
| ----------------- | ----------------------------- | ------------------------------- |
| F5.1 概念元素覆盖 | conceptExpression.elements    | 至少 60% 的拆解元素在组件中体现 |
| F5.2 概念一致性   | designConcept.metaphor        | 所有定制组件共享同一个视觉概念  |
| F5.3 装饰一致性   | conceptExpression.decorations | 装饰元素风格与概念一致          |

### 评估示例

```yaml
feedbackF5:
  score: 80
  threshold: 60
  passed: true
  items:
    - id: "F5.1"
      name: "概念元素覆盖"
      status: "passed"
      detail: "IDE 概念的 8 个元素中 6 个已映射到组件（覆盖率 75%）"
    - id: "F5.2"
      name: "概念一致性"
      status: "passed"
      detail: "所有定制组件（section-title/cta-card/callout-pro/quote-card）都使用 IDE 设计语言"
```

---

## 评估流程

```
Compiler 输出 Theme Package
         │
         ▼
┌─ Feedback Layer ──────────────────────────────────────┐
│                                                         │
│  ① 加载 Design Blueprint（从 Logic Layer 保存）          │
│                                                         │
│  ② 逐项评估 F1-F5                                       │
│     │                                                   │
│     ├─ F1 品牌一致性（Brand only）                        │
│     ├─ F2 阅读体验                                       │
│     ├─ F3 组件覆盖                                       │
│     ├─ F4 约束遵守（满分通过，否则阻断）                   │
│     └─ F5 概念一致性（Creator only）                      │
│                                                         │
│  ③ 生成 Feedback Report                                  │
│     │                                                   │
│     └─ 是否全部通过？                                     │
│          │              │                                │
│        是              否                                 │
│          │              │                                │
│          ▼              ▼                                 │
│       交付      回退到对应层调整                           │
│                  │                                       │
│                  ├─ F1/F3 未通过 → 回退 Logic Layer       │
│                  ├─ F2 未通过 → 回退 Logic Layer 或       │
│                  │              Application Layer         │
│                  ├─ F4 未通过 → 回退 Constraint Layer     │
│                  │              + Application Layer       │
│                  └─ F5 未通过 → 回退 Logic Layer          │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 回退规则

| 未通过的评估  | 回退到                               | 调整内容                           |
| ------------- | ------------------------------------ | ---------------------------------- |
| F1 品牌一致性 | Logic Layer                          | 重新审视品牌表达策略，调整组件映射 |
| F2 阅读体验   | Logic Layer 或 Application Layer     | 调整视觉语言参数或实现方案         |
| F3 组件覆盖   | Logic Layer                          | 补充遗漏的组件映射                 |
| F4 约束遵守   | Constraint Layer + Application Layer | 修复违反约束的 CSS                 |
| F5 概念一致性 | Logic Layer                          | 重新审视概念元素拆解和映射         |

---

## 设计质量评分卡

### 完整报告格式

```yaml
feedbackReport:
  # 元信息
  themeId: "yunfan-tech-professional"
  evaluatedAt: "2026-08-01T12:00:00Z"

  # 各维度评分
  dimensions:
    brandConsistency:
      score: 85
      threshold: 70
      passed: true
      items:
        - id: "F1.1"
          name: "Logo 使用频率"
          status: "passed"
          detail: "Logo 出现在 hero-banner 和 author-card 中"
        - id: "F1.4"
          name: "辅助图形使用"
          status: "failed"
          detail: "六边形网格未映射到 section-title"
          suggestion: "在 section-title 的 variantCss 中添加六边形网格装饰"

    readingExperience:
      score: 90
      threshold: 70
      passed: true
      items:
        - id: "F2.1"
          name: "信息密度"
          status: "passed"
          detail: "density=high, fontSize=15px"

    componentCoverage:
      score: 75
      threshold: 70
      passed: true
      items:
        - id: "F3.1"
          name: "Logo 形状→组件映射"
          status: "failed"
          detail: "tag-label 未实现六边形装饰"
          suggestion: "为 tag-label 添加六边形图标装饰"

    constraintCompliance:
      score: 100
      threshold: 100
      passed: true
      items:
        - id: "F4.1"
          name: "CSS 约束"
          status: "passed"
          detail: "所有 CSS 约束已遵守"

  # 总体评估
  overall:
    score: 85 # 各维度加权平均
    passed: true # 所有维度都通过
    summary: "品牌一致性有两个小问题，建议修复后交付"
    recommendation: "建议修复 F1.4（六边形网格→section-title）和 F3.1（tag-label 六边形装饰）后重新编译"
```

### 评分算法

```
各维度权重：
  F1 品牌一致性：30%（Brand）/ 0%（Creator）
  F2 阅读体验：20%
  F3 组件覆盖：25%
  F4 约束遵守：25%（必须满分，否则阻断）
  F5 概念一致性：0%（Brand）/ 30%（Creator）

总分 = Σ(维度得分 × 维度权重) / Σ(维度权重)

通过条件：
  - 每个维度的得分 ≥ 该维度的阈值
  - 总分 ≥ 70
  - F4 约束遵守必须满分（100）
```

---

## 与 Validator 和 Self-Check 的区分

| 维度       | Validator                  | Self-Check       | Feedback Layer                                |
| ---------- | -------------------------- | ---------------- | --------------------------------------------- |
| 时机       | Compiler 输出前            | Compiler 输出前  | Compiler 输出后                               |
| 检查对象   | manifest.json + variantCss | 生成过程中的决策 | 最终 Theme Package 与 Design Blueprint 的对比 |
| 检查内容   | 语法正确性、字段完整性     | 流程完整性       | 设计目标达成度                                |
| 判断方式   | 纯规则（程序化）           | AI 自检          | AI 评估 + 规则                                |
| 反馈方式   | 报错阻断                   | 自查清单打勾     | 评分 + 建议 + 回退                            |
| 是否可跳过 | 否                         | 是（建议执行）   | 是（建议执行）                                |

---

## 集成到现有流程

Feedback Layer 的评估可以直接整合到 `self-check.md` 中，作为自检清单的最后一个环节：

```markdown
## G. 设计质量反馈（Feedback Layer）

### G1. 品牌一致性（仅 Brand Profile）

- [ ] Logo 使用频率在策略范围内
- [ ] 辅助图形映射完整
- [ ] 品牌色使用符合策略定义

### G2. 阅读体验

- [ ] fontSize 与 density 匹配
- [ ] 颜色方案与情绪基调一致

### G3. 组件覆盖

- [ ] 所有品牌元素→组件映射已实现
- [ ] 所有概念元素→组件映射已实现

### G4. 约束遵守（双重确认）

- [ ] 所有 CSS 约束已遵守
- [ ] 所有 manifest 约束已遵守
```

---

## 设计质量评分卡模板

AI 在每次生成主题后，输出以下评分卡：

```yaml
## 设计质量评分卡

| 维度 | 得分 | 阈值 | 状态 |
|------|------|------|------|
| 品牌一致性 | 85/100 | 70 | ✅ 通过 |
| 阅读体验 | 90/100 | 70 | ✅ 通过 |
| 组件覆盖 | 75/100 | 70 | ✅ 通过 |
| 约束遵守 | 100/100 | 100 | ✅ 通过 |
| **总分** | **85/100** | **70** | **✅ 通过** |

### 建议改进
1. 六边形网格未映射到 section-title（F1.4）
2. tag-label 未实现六边形装饰（F3.1）

> 建议修复以上问题后重新编译。不影响使用，但建议下次迭代时优化。
```
