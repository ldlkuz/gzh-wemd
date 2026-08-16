# Stage 5: Component Mapping（翻译阶段）

## 本阶段任务

将创意阶段的视觉语言翻译成具体的 WeMD 组件设计规范。

## 输入

1. `themes/{theme-name}/states/visual_language.json`（创意阶段的视觉语言）
2. `themes/{theme-name}/states/component_strategy.json`（阶段 4 的三分类结果）
3. `themes/{theme-name}/states/skeleton_intent.json`（阶段 4.5 的骨架意图，**形**已定）
4. `registry/components.json`（仅读取 Brand Anchor 对应的组件定义）

> **先形后皮**：本阶段是"皮"。骨架（形）已在 Stage 4.5 定稿，本阶段的颜色/字体/间距必须挂到骨架的 class 结构上。阅读 `skeleton_intent.json` 了解每个组件视觉上怎么构图，再为它设计皮肤。

## 翻译策略

| 分类        | 翻译方式                                                              |
| ----------- | --------------------------------------------------------------------- |
| **focal**   | 深度翻译。将创意视觉直接注入组件设计，每个焦点组件单独设计            |
| **content** | 继承翻译。继承 Visual Language 的整体方向，通过 strategy 控制表达强度 |
| **utility** | 最小化翻译。继承 Visual Language，但尽可能克制                        |

## 皮与骨的契约（CSS 填满骨架，但不另立核心）

骨架（Stage 4.5）定"**哪里是视觉核心**"，CSS（本阶段 + Stage 6）定"**这个核心长什么样**"。两者一对一强绑定，不是"谁满足谁"的对立：

- **骨架定"填哪里"**：每个组件内部焦点放哪、怎么构图（`magazine-cover` 标题居中、`section-title` 侧栏角标）。
- **CSS 定"怎么填"**：无论焦点在哪，都用**同一套品牌语言**（格纸纹理、油墨橙、像素字体）去填它。
- **CSS 的全局核心不脱离骨架另立一套**：主题统一感恰恰来自"用同一套语言去填所有骨架"。每个组件的差异性来自骨架选了不同焦点，整套页面的统一气质来自 CSS 用同一套语言渗透每个骨架。

**填满义务（硬规则）：**

1. 对每个在 `skeleton_intent.json` 中有骨架的组件，本阶段的皮肤必须**完整覆盖其每个结构单元**——slot 区、group、decoration（`top-bar`/`corner` 等）、强调、align。骨架宣告了这些，CSS 就有义务填满，**不可落空**。
2. 骨架宣告而 CSS 未覆盖 = 该区域是空壳（有骨无肉），属残缺交付。
3. 填充方式统一用主题全局品牌语言，不凭空为某个组件发明一套脱离全局的独立视觉。

## 设计规则

1. **焦点集（`components.focal`）是深度设计对象**（默认来自 `component_strategy.brand_anchor` 高预算池），Content/Utility 继承并克制。但母题需要时任何档位都可提权（由 Stage 4.5 骨架决定）
2. 使用 Design Tokens 受控词汇（emphasis/density/decoration/contrast）
3. component_rules 的目的是**限制**，不是设计
4. 输出的是设计方向（自然语言描述），不是 CSS 值
5. 焦点组件（`components.focal` 中）的 design.direction 应能从创意视觉中找到源头
6. **皮挂骨**：本阶段描述的颜色/字体/间距，最后会挂到 Stage 4.5 骨架推导出的 class 上。有刻意构图（`skeleton_intent.json` 中存在骨架）的组件，其 design.direction 应描述"如何为这个骨架的视觉关系上色"，而不是凭空想象一个结构。

## 输出格式

严格遵循 `schema/component_mapping.schema.json`：

```json
{
  "focal": {
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
