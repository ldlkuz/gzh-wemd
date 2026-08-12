# Stage 5: Component Mapping（翻译阶段）

## 本阶段任务

将创意阶段的视觉语言翻译成具体的 WeMD 组件设计规范。

## 输入

1. `creative/visual_language.json`（创意阶段的视觉语言）
2. `translator/component_strategy.json`（上一阶段的三分类结果）
3. `registry/components.json`（仅读取 Brand Anchor 对应的组件定义）

## 翻译策略

| 分类             | 翻译方式                                                              |
| ---------------- | --------------------------------------------------------------------- |
| **brand_anchor** | 深度翻译。将创意视觉直接注入组件设计，每个组件单独设计                |
| **content**      | 继承翻译。继承 Visual Language 的整体方向，通过 strategy 控制表达强度 |
| **utility**      | 最小化翻译。继承 Visual Language，但尽可能克制                        |

## 设计规则

1. **只有 Brand Anchor 才允许放飞**，Content/Utility 继承并克制
2. 使用 Design Tokens 受控词汇（emphasis/density/decoration/contrast）
3. component_rules 的目的是**限制**，不是设计
4. 输出的是设计方向（自然语言描述），不是 CSS 值
5. Brand Anchor 的 design.direction 应能从创意视觉中找到源头

## 输出格式

严格遵循 `translator/component_mapping.schema.json`：

```json
{
  "brand_anchor": {
    "magazine-cover": {
      "design": {
        "role": "建立文章第一视觉印象，承载品牌身份和情绪",
        "direction": "全出血封面构图，超大字重标题叠加大胆的几何图形",
        "character": ["bold", "editorial", "asymmetric", "dramatic"]
      }
    }
  },
  "content": {
    "inherit": "visual_language",
    "strategy": {
      "expression": "low",
      "readability": "high",
      "decoration": "restrained"
    },
    "component_rules": {
      "text-card": {
        "category": "content",
        "inherit": "visual_language",
        "override": { "emphasis": "low", "decoration": "none" }
      }
    }
  },
  "utility": {
    "inherit": "visual_language",
    "strategy": {
      "expression": "minimal",
      "attention": "low",
      "decoration": "minimal"
    },
    "component_rules": {
      "divider": {
        "category": "utility",
        "inherit": "visual_language",
        "override": { "attention": "minimal" }
      }
    }
  }
}
```
