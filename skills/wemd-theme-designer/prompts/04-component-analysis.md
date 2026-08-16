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

### 第三步：三分类

对全部 43 个组件进行三分类：

| 分类             | 定义                                         | 数量限制  |
| ---------------- | -------------------------------------------- | --------- |
| **brand_anchor** | 直接承载品牌视觉表达的组件，需要深度设计     | 最多 6 个 |
| **content**      | 以内容阅读为主的组件，继承视觉语言但克制表达 | 大部分    |
| **utility**      | 辅助性组件，尽可能隐形                       | 少数      |

### 母题牵引 Anchor（硬规则）

**哪些组件成为 Brand Anchor，必须由视觉母题（`visual_metaphor`）牵引，而不是套用固定组合。**

- 结合 `concept_state.json` 中母题的 `visual_objects` / `material_language`，判断哪些组件最能承载该母题的视觉对象。
- 例如母题含 `measurement` / `grid`（强调刻度与秩序），则 `numbered-heading`、`styled-table`、`timeline` 这类秩序型组件更可能成为 Anchor；母题含 `herb specimens` / `woodcut`，则 `image-grid`、`magazine-cover` 更可能成为 Anchor。
- **不存在"某些组件天然是 Anchor"**。同一个组件（如 `magazine-cover`）在不同母题下的权重可以完全不同。
- 禁止默认把 `magazine-cover`、`hero-banner` 固定选为 Anchor，必须依据当前母题判断。

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

1. Brand Anchor 最多 6 个，不是必须 6 个
2. 每个 Brand Anchor 必须包含 score（0-10）和 reason（翻译理由）
3. `visual_capability` 为空的组件（如 divider）不应作为 Brand Anchor
4. 所有 43 个组件都必须出现在且只出现在一个分类中
5. 深度设计仅限 Brand Anchor（≤6 个）；content/utility 组件只做"克制继承兜底"（继承品牌色 + 间距 + 圆角容器），兜底不算深度设计
