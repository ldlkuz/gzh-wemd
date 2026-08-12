# 组件检索机制

阶段 4（翻译阶段）使用 **Component Retrieval** 按需检索，而不是 AI 自己决定读哪些组件。

## Component Registry 的角色

> Component Registry 是 AI 的**实现转换词典**，不是设计素材库。

设计阶段（Stage 1-3）不需要它。翻译阶段（Stage 4-5）用它来匹配"创意视觉 → 可用的组件"。

## 检索步骤

1. 从 `creative/concept_state.json` 提取**用户选中的母题**（`visual_metaphors[]` 中用户选定的那一项）与 `emotional_direction`
2. **将所选母题的 `visual_objects` / `material_language` 作为主要检索关键词**，用于匹配组件
3. 遍历 `registry/components.json`，匹配：
   - `visual_capability` 是否与品牌情感方向一致
   - `brand_expression_level` 是否适合品牌表达强度
   - `role` 是否适合品牌视觉方向
   - **组件能否承载母题的视觉对象**（如母题含 `measurement`/`grid`，天然倾向 `numbered-heading`、`styled-table`、`timeline` 这些强调秩序与刻度的组件）
4. 输出候选组件列表 → 再做三分类

> 母题会自然牵引 Brand Anchor 的选择。例如"精密仪器实验室"母题（强调流程、刻度、秩序）会优先把 `numbered-heading`、`timeline`、`styled-table` 选为 Anchor；而"数据终端"母题会优先 `stats-block`、`styled-table`、"两栏卡片"。同一行业的不同母题 → 不同 Anchor 组合。

## 示例

输入（`visual_metaphors` 中用户选定的那一项 + `visual_keywords`）：

```json
{
  "selected_visual_metaphor": {
    "metaphor_name": "精密仪器实验室",
    "visual_objects": [
      "calibration grids",
      "engineering callouts",
      "precise measurement marks"
    ],
    "material_language": ["machined metal", "glass gauge", "paper blueprint"],
    "motion_character": "calm precise"
  },
  "visual_keywords": ["precise", "technical", "structured"],
  "emotional_direction": { "primary": "reliable", "secondary": "intrigued" }
}
```

> `visual_keywords` 由 Stage 3（视觉设计）基于所选母题推导，阶段 4 可直接使用。

匹配结果（倾向秩序与刻度承载者）：

```json
{
  "candidate_components": [
    "magazine-cover",
    "numbered-heading",
    "styled-table",
    "timeline",
    "stats-block"
  ]
}
```

阶段 5 只读取 Brand Anchor 对应的组件定义（来自 `registry/components.json`），不读全部组件。
