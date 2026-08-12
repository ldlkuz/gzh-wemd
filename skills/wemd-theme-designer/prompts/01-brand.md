# Stage 1: Brand Interpretation

## 输入

用户输入的品牌信息（名称、类型、人格、资产等）。

## 任务

理解品牌，输出标准化的 Brand State JSON。

## 规则

1. 不要输出大段解释，只输出 JSON
2. 品牌人格用 3-5 个标签表达
3. 情感方向用 3-5 个词表达
4. 避免方向保持简洁

### 提取差异化信号（母题推导的依据）

`industry` 与 `customer` 是必填的差异化信号，必须从用户输入中提取。以下字段用于给后续 Stage 2 的视觉母题推导提供依据：

- `industry`（必填）：所属行业，如 `工业机器人`、`新能源汽车`。
- `customer`（必填）：目标客户，如 `汽车制造企业`、`个人消费者`。
- `product`（可选）：核心产品或服务，从品牌档案提取。
- `desired_impression`（可选）：希望别人怎么看待品牌，从"希望别人怎么看你"提取。
- `existing_assets`（可选）：从上传的 Logo / VI / 官网 / 宣传册中分析已有视觉特征（几何结构、线条、色调、质感）。

> 注意：`industry` 和 `customer` 必须如实提取，不可用泛化词（如统一填 `科技`）替代。它们是母题推导的差异化依据，泛化会导致所有品牌退化成同一母题。

### 创作者模式（`brand_identity.type === "creator"`）的差异化信号重映射

创作者输入极少（如"一个激情的 AI 创作者"），没有真正的行业/客户。此时 `industry` 与 `customer` 的语义必须**重映射为创作语境**，否则母题推导仍会退化为同质化：

- `industry`（必填）→ **创作主题/领域**：创作者做哪类内容，必须具体，如 `AI 工具评测`、`独立设计`、`美妆分享`、`独立游戏开发`。禁止用泛化词（`创作`、`内容`、`自媒体`）替代。
- `customer`（必填）→ **受众/读者**：创作者的读者是谁，如 `独立开发者`、`年轻女性`、`手工艺爱好者`。
- `product`（可选）→ 创作者的代表作/常做内容形态，如 `深度技术长文`、`短视频脚本`、`开箱测评`。
- `desired_impression`（可选）→ 希望读者怎么看自己，如 `行业洞察者`、`亲和伙伴`、`先锋尝鲜者`。
- `existing_assets`（可选）→ 创作者已有的视觉偏好（若提供头像/主页/样张则分析其几何、线条、色调、质感）。

> 创作者模式下，母题推导的主导信号是 **`personality`（人格）+ 创作主题（改写后的 `industry`）+ `emotion`/内容气质 + 受众（改写后的 `customer`）**，而非品牌模式的"行业 + 客户"。

## 输出格式

严格遵循 `creative/brand_state.schema.json`：

```json
{
  "brand_identity": {
    "name": "...",
    "type": "creator"
  },
  "industry": "工业机器人",
  "customer": "汽车制造企业",
  "product": "自动化生产线机器人",
  "desired_impression": ["行业专家", "长期伙伴"],
  "existing_assets": {
    "logo_available": true,
    "geometry": "geometric",
    "line_character": "straight",
    "tone": "cool",
    "material_feel": "technical"
  },
  "personality": ["meticulous", "reliable", "precise"],
  "audience": ["manufacturing executives"],
  "emotion": ["reasonable", "stable", "professional"],
  "avoid": ["internet startup style", "too flashy"],
  "keywords": ["precision", "reliability", "efficiency"]
}
```

（以上 JSON 仅示范字段结构，内容纯示意，请从用户实际输入提取，勿照搬。）
