# Stage 4: Component Analysis（翻译阶段）

## ⚠️ 本阶段是翻译阶段

创意阶段（Stage 1-3）已完成。现在开始将**创意设计方案翻译成 WeMD 组件系统**。

## 输入

1. `themes/{theme-name}/states/visual_language.json`（上一阶段输出的视觉语言）
2. `registry/components.json`（WeMD 组件注册表，43 个组件的定义）

## 翻译任务

### 第一步：理解创意

阅读 `themes/{theme-name}/states/visual_language.json` 中的视觉语言，理解创意阶段设计的视觉感受：

- 色彩方向：什么性格、什么对比度？
- 排版：什么气质、什么层级？
- 布局：什么构图、什么密度？
- 形状：什么性格？
- 图片：什么风格、什么处理方式？

### 第二步：按需检索组件

基于视觉语言的特征，从 Registry 中检索最相关的组件：

1. 匹配 `visual_capability` 是否与视觉语言的情感方向一致
2. 匹配 `brand_expression_level` 是否适合品牌表达强度
3. 根据 `role` 判断是否适合视觉方向

检索目标是找到**能承载创意视觉的组件**，不是匹配所有组件。

### 第三步：三分类（设定默认克制档位，不是设计门禁）

把全部 43 个组件按"母题承载潜力"分成三档，作为**默认的克制档位 / 深度预算上限**。这一档只决定"默认可以做得多大胆"，**不决定哪些组件最终被深度设计**——后者由 Stage 4.5（骨架）按母题与构图焦点决定。

| 档位             | 含义                                         | 默认深度预算    |
| ---------------- | -------------------------------------------- | --------------- |
| **brand_anchor** | 最能承载母题视觉对象的组件，深度设计候选池   | 高（软上限 ~6） |
| **content**      | 以内容阅读为主的组件，继承视觉语言但默认克制 | 中              |
| **utility**      | 辅助性组件，尽可能隐形                       | 低（默认极简）  |

### 母题牵引候选池（硬规则）

**哪些组件进高预算池（brand_anchor），必须由视觉母题（`visual_metaphor`）牵引，而不是套用固定组合。**

- 结合 `concept_state.json` 中母题的 `visual_objects` / `material_language`，判断哪些组件最能承载该母题的视觉对象。
- 例如母题含 `measurement` / `grid`（强调刻度与秩序），则 `numbered-heading`、`styled-table`、`timeline` 这类秩序型组件更可能进高预算池；母题含 `herb specimens` / `woodcut`，则 `image-grid`、`magazine-cover` 更可能进高预算池。
- **不存在"某些组件天然是 Anchor"**。同一个组件（如 `magazine-cover`）在不同母题下的权重可以完全不同。
- 禁止默认把 `magazine-cover`、`hero-banner` 固定选为高预算，必须依据当前母题判断。

### design_tier：结构上的默认对齐（不是门禁）

`registry/components.json` 每个组件带 `design_tier`（A/B/C），标的是**结构上是否值得骨架设计**，与母题无关：

| tier | 含义                       | 默认做法                   |
| ---- | -------------------------- | -------------------------- |
| A    | 构图自由度高，值得骨架设计 | 高预算池的**默认合理范围** |
| B    | 结构固定，骨架默认即可     | 默认骨架 + CSS 皮肤就够了  |
| C    | 纯功能，几乎零设计空间     | 系统默认，不深度设计       |

- 高预算池（brand_anchor）**优先从 A 类里选**——A 类才是骨架设计能真正改变结构的地方，把高预算花在 B/C 上是浪费。
- **母题牵引可覆盖**：母题需要时，B 类组件可因承载母题视觉对象而被提权设计（如"格纸/网格"母题下 `styled-table`、`image-grid`、`resource-list` 这类 B 类秩序型组件）。这不是矛盾，是"结构基线"让步于"母题意志"。
- 收紧方向同理：母题不需要时，A 类组件也可降权保持克制。

### 预算不是锁

- `brand_anchor` ≤6 是**软预算**：提醒"高预算别铺太开，构图焦点要少而准"，不是硬门禁。
- **正式决定"哪些组件真的被深度设计"在 Stage 4.5**，准则只有两条：**母题需要 + 焦点有限**。母题需要时，任何组件都可能提权；无需时，高预算池里的组件也可能降权保持克制。

## 输出格式

严格遵循 `schema/component_strategy.schema.json`。以下仅供说明**输出结构**，其中的组件名纯属示意，**不代表任何固定的 Anchor 组合**——具体哪些组件成为 Anchor，必须由上一阶段的视觉母题（`visual_metaphor`）牵引推导，不得照抄：

```json
{
  "brand_anchor": [
    {
      "component": "magazine-cover",
      "score": 10,
      "reason": "第一视觉印象，承载品牌身份和情绪"
    },
    {
      "component": "hero-banner",
      "score": 9,
      "reason": "顶部头图，制造视觉冲击"
    }
  ],
  "content": ["text-card", "section-title", "numbered-heading", "image-card"],
  "utility": ["divider", "copyright-notice", "article-section"]
}
```

## 规则

1. 三档是**默认克制档位**，不是"谁能被深度设计"的门禁——深度设计的最终决策权在 Stage 4.5（骨架）。
2. `brand_anchor` 软上限 6 个，不是必须 6 个。
3. 每个 `brand_anchor` 必须包含 score（母题承载潜力 0-10）和 reason（母题牵引理由）。
4. `visual_capability` 为空的组件（如 divider）不应进高预算池。
5. 所有 43 个组件都必须出现在且只出现在一个档位中。
6. 档位只设默认深度预算；真正深度设计哪些组件，由 Stage 4.5 按"母题需要 + 焦点有限"决定，母题需要时任何档位的组件都可提权。
