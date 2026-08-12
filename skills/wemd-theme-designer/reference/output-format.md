# 输出格式

本 Skill 有两种输出格式：CreativeTheme（设计稿）和 BrandVisualTheme（主题规范）。

## 第一层输出：CreativeTheme（设计稿）

创意阶段（Stage 1-3）完成后输出的设计稿。不包含任何组件概念，是纯视觉方案。

Schema 见 `output/CreativeTheme.schema.json`。

```json
{
  "schema": "CreativeTheme",

  "brand": {
    "name": "Nova AI",
    "type": "creator",
    "personality": ["experimental", "energetic", "curious"]
  },

  "creative_direction": {
    "concept": "未来科技编辑杂志",
    "visual_story": "通过速度和探索感表达创新",
    "emotional_tone": "兴奋、好奇",
    "visual_keywords": ["dynamic", "bold", "futuristic"]
  },

  "page_design": {
    "hero": {
      "description": "巨大标题突破边界，配合动态几何图形开场",
      "visual_character": ["bold", "dramatic"]
    },
    "content": {
      "description": "杂志式阅读布局，宽松留白，图文交错",
      "visual_character": ["editorial", "spacious"]
    },
    "highlight": {
      "description": "数据成为视觉焦点，用强烈色彩和超大数字制造冲击",
      "visual_character": ["contrast", "dynamic"]
    }
  }
}
```

## 第二层输出：BrandVisualTheme（主题规范）

翻译阶段完成后，由 5 个 State 合并而成的最终主题规范。完整 Schema 见 `output/BrandVisualTheme.schema.json`。

### 字段映射

| Stage State                          | 最终输出字段                                                   |
| ------------------------------------ | -------------------------------------------------------------- |
| `creative/brand_state.json`          | `brand`                                                        |
| `creative/concept_state.json`        | `concept`                                                      |
| `creative/visual_language.json`      | `visual_language`                                              |
| `translator/component_strategy.json` | `component_strategy`                                           |
| `translator/component_mapping.json`  | `components`                                                   |
| —                                    | `design_tokens`（跨阶段受控词汇表，从 component_mapping 提取） |
| —                                    | `metadata`（Assembler 注入）                                   |
| —                                    | `schema`（Assembler 注入）                                     |

### 完整示例

```json
{
  "schema": "BrandVisualTheme",

  "brand": {
    "brand_identity": { "name": "...", "type": "creator" },
    "personality": ["experimental", "energetic", "curious"],
    "audience": ["developers", "technology enthusiasts"],
    "emotion": ["exploration", "future", "speed"],
    "avoid": ["traditional corporate", "formal"],
    "keywords": ["innovation", "breakthrough", "creation"]
  },

  "concept": {
    "concept_name": "Experimental Energy",
    "core_concept": "通过实验感和探索感表达未来创新",
    "visual_keywords": ["dynamic", "bold", "futuristic"],
    "emotional_direction": {
      "primary": "excited",
      "secondary": "curious"
    }
  },

  "visual_language": {
    "color_direction": {
      "contrast": "high",
      "character": "vivid",
      "usage": "accent_driven"
    },
    "typography": { "character": "bold", "hierarchy": "strong" },
    "layout": {
      "composition": "editorial",
      "alignment": "dynamic",
      "density": "medium"
    },
    "shape": { "character": "geometric" },
    "image": { "style": "experimental", "treatment": "dramatic" }
  },

  "component_strategy": {
    "brand_anchor": [
      { "component": "magazine-cover", "score": 10, "reason": "第一视觉印象" },
      { "component": "hero-banner", "score": 9, "reason": "顶部头图" }
    ],
    "content": ["text-card", "section-title", "image-card"],
    "utility": ["divider", "copyright-notice"]
  },

  "components": {
    "brand_anchor": {
      "magazine-cover": {
        "design": {
          "role": "建立文章第一视觉印象",
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
  },

  "design_tokens": {
    "emphasis": { "minimal": 0, "low": 1, "medium": 2, "high": 3 },
    "density": ["compact", "normal", "spacious", "dramatic"],
    "decoration": ["none", "minimal", "restrained", "moderate", "strong"],
    "contrast": ["soft", "normal", "high", "extreme"]
  },

  "metadata": {
    "version": "1.0"
  }
}
```

### 关键设计原则

- 每个顶级字段对应一个独立 State JSON
- `component_strategy` — 三分类列表，`brand_anchor` 包含 score 和 reason
- `components.brand_anchor` — 显式设计，每个 Brand Anchor 单独设计
- `components.content` — 继承设计 + 组件级约束（component_rules）
- `components.utility` — 继承设计 + 最小化约束（component_rules）
- `design_tokens` — 受控词汇表，为 Compiler 提供稳定的语义映射

**只有 Brand Anchor 才允许 AI "放飞"**。Content 和 Utility 继承并克制表达，通过 component_rules 确保安全。

**输出的是设计方向（自然语言描述），不是 CSS 值。** AI 不是在描述"组件长什么样"，而是在描述"在这个品牌里，组件应该承担什么视觉任务"。
