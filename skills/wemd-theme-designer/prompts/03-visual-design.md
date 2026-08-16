# Stage 3: Visual Design

## ⚠️ 重要：本阶段不允许接触任何组件概念

本阶段是**纯视觉创作阶段**。

- 不允许出现：title、paragraph、card、image、quote、divider 等组件名称
- 不允许思考"这个设计怎么用组件实现"
- 只描述视觉区域和视觉感受，不描述组件类型

## 输入

读取 `themes/{theme-name}/states/concept_state.json`（上一阶段输出），**重点读取其中用户已选中的 `visual_metaphors[]` 里的那一项母题**。

> `concept_state.json` 的 `visual_metaphors` 是 3 个候选母题数组。上一阶段用户已从中选定 1 个（该选择已写回 `concept_state`）。本阶段只基于**选中的那一项**的 `visual_objects` / `material_language` 推导，忽略其余候选。

## 任务

基于品牌概念与视觉母题，进行自由的页面视觉设计，输出视觉设计方向。

设计时参考 `brand_identity.type`（来自 brand_state），结合品牌介绍和关键词，推导符合该类型气质的视觉方向。

设计时把自己想象成杂志美术总监，但你的画布是手机屏幕——一张窄长、竖着的纸，用户上下滑动阅读。

### 母题溯源约束（硬规则）

本阶段输出的每一个 Design Token，**必须能从所选母题（`visual_metaphors[]` 中用户选中的那一项）的 `visual_objects` / `material_language` 追溯来源**。

- 例如母题为"精密仪器实验室"（`metal` / `glass` / `calibration grids`）：
  - `color_direction` 应推导为冷色、低饱和、高对比（金属与玻璃的质感），而非随意高温色彩
  - `shape` 应推导为 `sharp` / `geometric`（仪器刻度、工程边框），而非 `organic` / `rounded`
  - `layout` 应推导为 `grid` + `strict` + `compact`（格线秩序、高密度），而非自由排版
- 无法从母题追溯来源的 token 不允许出现。**禁止退回行业套路**（如科技=蓝渐变、企业=圆角卡片）。

### 设计维度

1. **页面分区** — 文章可以被分为哪些视觉区域（如：开场区域、正文区域、强调区域、收尾区域）
2. **每个区域的视觉感受** — 色调、节奏、密度、层次感
3. **整体视觉节奏** — 文章纵向滑动的视觉流动感（用户的阅读方式是自上而下滑动，冲击力在垂直方向展开，而非左右多栏）

### 禁止事项

- ❌ 不要使用"标题组件"、"图片组件"、"卡片"等组件语言
- ❌ 不要考虑实现可行性
- ✅ 用"开场区域"、"视觉焦点"、"阅读段落"、"强调区块"等页面语言
- ✅ 描述视觉感受，不是描述结构

## 输出格式

输出到 `themes/{theme-name}/states/visual_language.json`，严格遵循 `schema/visual_language.schema.json`：

```json
{
  "color_direction": {
    "contrast": "high",
    "character": "vivid",
    "usage": "accent_driven"
  },
  "typography": {
    "character": "bold",
    "hierarchy": "strong"
  },
  "layout": {
    "composition": "editorial",
    "alignment": "dynamic",
    "density": "medium"
  },
  "shape": {
    "character": "geometric"
  },
  "image": {
    "style": "experimental",
    "treatment": "dramatic"
  }
}
```

## 设计原则

1. 先有视觉感受，再有视觉语言
2. 描述的是"感觉"，不是"规则"
3. 极端比平庸好
4. 一个清晰的概念胜过十个模糊的方向
