# ③ Application Layer（实现层）

> 角色：**实现策略引擎**
> 回答：**如何实现这个设计？**
> 位置：Decoration Layer（装饰组合）→ **Application Layer（选择方案 + 合并装饰 + 产出 CSS）** → Compiler Layer（编译打包）

---

## 概述

Application Layer 是 Design Pipeline 中的"工艺层"。当 Logic Layer 决定了"设计什么"、Constraint Layer 确认了"哪些能做"之后，Application Layer 负责"怎么做"。

**核心原则：** 同一个设计目标可以有多种实现方式。AI 不应该直接生成 CSS，而是先选择实现方案，再生成对应的代码。

---

## 装饰元素处理

### 装饰元素由 Decoration Layer 统一处理

**`::before` / `::after` 伪元素在 WeMD 中禁止使用。** 所有装饰效果已通过 Decoration Library 的原子系统（`<span>` 物理元素）统一处理，详见 [decoration-library.md](decoration-library.md)。

Application Layer 不再负责装饰元素的生成，而是从 Decoration Layer 接收映射结果（`MapResult`），将其与基础组件样式合并：

```
Decoration Layer 输出: MapResult.css[component] + MapResult.html[component]
                              ↓
Application Layer: 合并基础样式 + 装饰样式
                   生成最终 variantCss
```

### 为什么禁止伪元素

微信公众号（X5 Blink 内核）对 `::before` / `::after` 的支持不稳定，在不同版本的微信客户端中表现不一致。为确保所有用户获得一致的阅读体验，WeMD 主题包的生成流程禁止使用伪元素。

### 伪元素转换器（已移除）

WeMD 早期版本包含一个伪元素自动转换器（`pseudo-transformer.ts`），用于将 `::before`/`::after` 转换为物理 HTML 元素。自 Decoration Library 引入后，该转换器已被移除。

**原因：**

- Decoration Library 的原子系统从源头杜绝了伪元素的使用
- AI 不再需要编写 CSS，而是选择装饰原子组合
- 装饰原子直接映射为确定性 CSS 模板，伪元素不会出现

### 不同装饰效果的实现示例

#### 1. 双色块标题（用 `.deco-num` + Flexbox）

**HTML**：

```html
<section class="wemd-section-title" data-variant="dual-color">
  <span class="deco-num">01</span>
  <span class="title-text">简单通用标题</span>
</section>
```

**CSS**：

```css
.wemd-section-title[data-variant="dual-color"] {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 18px;
  font-weight: bold;
  color: var(--wemd-text-primary);
}
.wemd-section-title[data-variant="dual-color"] .deco-num {
  display: inline-block;
  background: var(--wemd-primary);
  color: #fff;
  width: 44px;
  height: 32px;
  line-height: 32px;
  text-align: center;
  border-radius: 4px;
  flex-shrink: 0;
}
```

#### 2. 印章感标题（用 `.deco-bg` 背景装饰）

**HTML**：

```html
<section class="wemd-section-title" data-variant="seal">
  <span class="deco-bg"></span>
  <span class="title-text">秋日的遐想</span>
</section>
```

**CSS**：

```css
.wemd-section-title[data-variant="seal"] {
  position: relative;
  display: inline-block;
  padding: 6px 24px 6px 32px;
  font-size: 20px;
  color: var(--wemd-text-primary);
}
.wemd-section-title[data-variant="seal"] .deco-bg {
  position: absolute;
  top: 0;
  left: 20px;
  right: 8px;
  bottom: 0;
  background: linear-gradient(
    90deg,
    var(--wemd-primary-light),
    var(--wemd-secondary-light)
  );
  border-radius: 20px;
  z-index: -1;
}
```

#### 3. 左竖线标题（用 `border-left`，最简单）

**HTML**：

```html
<section class="wemd-section-title" data-variant="left-line">
  <span class="title-text">AI 科技的发展</span>
</section>
```

**CSS**：

```css
.wemd-section-title[data-variant="left-line"] {
  border-left: 4px solid var(--wemd-primary);
  padding-left: 12px;
  font-size: 20px;
  font-weight: bold;
  color: var(--wemd-text-primary);
}
```

#### 4. 底部装饰线（用 `.deco-underline`）

**HTML**：

```html
<section class="wemd-section-title" data-variant="bottom-line">
  <span class="title-text">产品核心优势</span>
  <span class="deco-underline"></span>
</section>
```

**CSS**：

```css
.wemd-section-title[data-variant="bottom-line"] {
  position: relative;
  display: inline-block;
  font-size: 18px;
  font-weight: bold;
  color: var(--wemd-text-primary);
  padding-bottom: 12px;
}
.wemd-section-title[data-variant="bottom-line"] .deco-underline {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 40%;
  height: 3px;
  background: linear-gradient(
    90deg,
    var(--wemd-primary),
    var(--wemd-secondary)
  );
  border-radius: 2px;
}
```

#### 5. 渐变背景块标题（纯 CSS background，最稳定）

**HTML**：

```html
<section class="wemd-section-title" data-variant="gradient-block">
  <span class="title-text">科技让生活更美好</span>
</section>
```

**CSS**：

```css
.wemd-section-title[data-variant="gradient-block"] {
  display: inline-block;
  padding: 12px 24px;
  font-size: 18px;
  font-weight: bold;
  color: #fff;
  background: linear-gradient(
    135deg,
    var(--wemd-primary),
    var(--wemd-primary-dark)
  );
  border-radius: 8px;
}
```

---

## 实现策略树

```
设计目标：Divider 使用品牌辅助图形
│
├── 方案 A：Inline SVG background-image
│   适用：简单图形（波形、六边形、线条）
│   优点：无额外请求，颜色可调，文件小
│   代码：background-image: url("data:image/svg+xml;utf8,...")
│
├── 方案 B：Base64 PNG background-image
│   适用：复杂图形（Logo、照片级纹理）
│   优点：兼容性好，细节丰富
│   缺点：文件大，颜色不可调
│
├── 方案 C：CSS border-image
│   适用：重复边框图案
│   优点：可拉伸
│   缺点：微信公众号兼容性差（不推荐）
│
├── 方案 D：manifest.assets 注册 + var(--wemd-asset-xxx)
│   适用：跨组件复用的品牌资源
│   优点：统一管理，一处修改全局生效
│   缺点：需要额外注册步骤
│
└── 方案 E：CSS 渐变 + 背景色
    适用：不需要具体图形的纯视觉装饰
    优点：零额外资源，纯 CSS
    缺点：不能展示具体图形
```

---

## 策略选择矩阵

> **公众号原则：** 微信公众号最终输出是内联 HTML，所有资源必须以 data URL 存在。
> 方案 A/B 直接内联到 variantCss，最可靠。方案 D 通过 `var(--wemd-asset-xxx)` 引用，增加间接性。
> **能用 A 就不用 D。** 仅当同一 SVG 在 ≥ 2 个组件复用且体积较大时才用 D。

| 设计目标                 | 约束条件              | 推荐方案                   | 备选方案               | 说明                                               |
| ------------------------ | --------------------- | -------------------------- | ---------------------- | -------------------------------------------------- |
| 装饰性图形（波形、网格） | C4.4: ≤ 500B          | **A. Inline SVG**          | E. CSS 渐变            | 颜色可跟随主题变量，直接内联                       |
| 品牌 Logo                | 公众号需内联          | **A. Inline SVG**          | D. manifest.assets     | 直接内联到 CSS；仅当 ≥ 2 组件复用且 SVG 较大时用 D |
| 复杂纹理（品牌装饰纹理） | C4.4: ≤ 150KB         | **B. Base64 PNG**          | A. Inline SVG          | 直接内联到 CSS                                     |
| 重复图案（网格、点阵）   | C4.3: 需要平铺        | **A. Inline SVG + repeat** | E. CSS 渐变            | SVG 可精确控制图案                                 |
| 图标（≤ 50px）           | C4.4: 需要颜色匹配    | **A. Inline SVG**          | E. CSS                 | 直接内联，颜色用 var(--wemd-xxx)                   |
| 分隔线（Divider）        | C1.6: 不能外部引用    | **E. CSS 渐变/border**     | A. Inline SVG          | 纯 CSS 零额外资源                                  |
| 标题装饰                 | C1.6: 不能外部引用    | **A. Inline SVG**          | E. CSS border-left     | 直接内联到 CSS                                     |
| 背景纹理（全页）         | C5.2: 不干扰文字阅读  | **E. CSS 渐变**            | A. Inline SVG 低透明度 | 渐变性能更好                                       |
| 卡片阴影                 | C1.5: 禁止 filter     | **E. CSS box-shadow**      | —                      | 纯 CSS                                             |
| 按钮样式（CTA）          | C1.3: 禁止 transition | **E. CSS 渐变**            | —                      | 纯 CSS                                             |

---

## 常见设计目标的实现方案

### 1. 背景纹理（Hero Banner / Section 背景）

**设计目标：** 为组件添加品牌风格的背景纹理

**方案选择流程：**

```
需要背景纹理
│
├─ 是纯色渐变？ → 方案 E：CSS 渐变
│   background: linear-gradient(135deg, var(--wemd-primary), var(--wemd-primary-dark));
│
├─ 是几何图案（网格/点阵/条纹）？ → 方案 A：Inline SVG
│   background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='20' height='20'><rect width='20' height='20' fill='none' stroke='var(--wemd-primary)' stroke-opacity='0.1'/></svg>");
│   background-repeat: repeat;
│
├─ 是品牌 Logo 水印？ → 方案 A：Inline SVG（直接内联到 CSS）
│   background-image: url("data:image/svg+xml;base64,...");
│   background-repeat: no-repeat;
│   background-position: center;
│   opacity: 0.05;
│
└─ 是品牌装饰纹理（非文章内容图）？ → 方案 B：Base64 PNG
    background-image: url("data:image/png;base64,...");
```

### 2. 装饰分隔线（Section Divider）

**设计目标：** 在两个章节之间添加品牌风格的视觉分隔

**方案选择流程：**

```
需要分隔线
│
├─ 简单线条？ → 方案 E：CSS border
│   border-bottom: 2px solid var(--wemd-primary);
│   margin: 24px 0;
│
├─ 波形/图案？ → 方案 A：Inline SVG
│   background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 20'><path d='M0,10 Q30,0 60,10 T120,10 T180,10' stroke='var(--wemd-primary)' fill='none'/></svg>");
│   height: 20px;
│   background-repeat: repeat-x;
│
└─ 品牌元素（六边形/Logo 形状）？ → 方案 A 或 D
    单个组件用 → 方案 A：Inline SVG
    跨组件复用 → 方案 D：manifest.assets
```

### 3. 标题装饰（Section Title）

**设计目标：** 为标题添加品牌元素装饰

**方案选择流程：**

```
需要标题装饰
│
├─ 左侧装饰条？ → 方案 E：CSS border-left
│   border-left: 4px solid var(--wemd-primary);
│   padding-left: 12px;
│
├─ 左侧图标？ → 方案 A：Inline SVG（background-position: left center）
│   background-image: url("data:image/svg+xml;utf8,<svg>...</svg>");
│   background-repeat: no-repeat;
│   background-position: left center;
│   padding-left: 28px;
│
├─ 背景色块（像 Tab 标签）？ → 方案 E：CSS background + padding
│   display: inline-block;
│   background: var(--wemd-primary);
│   color: white;
│   padding: 4px 16px;
│   border-radius: var(--wemd-border-radius);
│
└─ 上下装饰线？ → 方案 E：CSS border-top + border-bottom
    border-top: 1px solid var(--wemd-border);
    border-bottom: 1px solid var(--wemd-border);
    padding: 8px 0;
```

### 4. 品牌色应用（Callout / Badge / Tag）

**设计目标：** 在组件中应用品牌色

**方案选择流程：**

```
需要品牌色应用
│
├─ 背景色强调？ → 使用 CSS 变量
│   background: var(--wemd-primary-light);
│   border-left: 4px solid var(--wemd-primary);
│
├─ 文字色强调？ → 使用 CSS 变量
│   color: var(--wemd-primary);
│   font-weight: 700;
│
├─ 渐变背景？ → 方案 E：CSS 渐变
│   background: linear-gradient(135deg, var(--wemd-primary), var(--wemd-primary-dark));
│   color: white;
│
└─ 边框强调？ → 使用 CSS 变量
    border: 1px solid var(--wemd-primary);
    border-radius: var(--wemd-border-radius);
```

### 5. 品牌元素重复利用（跨组件）

**设计目标：** 同一个品牌元素出现在多个组件中

**示例：** 六边形 Logo 形状 → timeline 节点 + divider 纹理 + tag 图标

**实现方案（按 SVG 体积选择）：**

```
SVG 较小（≤ 500B）→ 方案 A：各组件直接内联（简单可靠，公众号兼容）
  每个 variantCss 中各自内联同一份 SVG data URL

SVG 较大（> 500B）→ 方案 D：manifest.assets 注册 + var() 引用
  manifest.assets.images: [{ key: "hexagon-icon", src: "data:image/svg+xml;base64,..." }]
  各组件 CSS: background-image: var(--wemd-asset-hexagon-icon);
```

**方案 A 示例（推荐，SVG ≤ 500B）：**

```css
/* timeline 节点 */
.wemd-timeline[data-variant="brand"] .wemd-timeline-node {
  background-image: url("data:image/svg+xml;base64,...");
  background-size: 12px 12px;
  width: 12px;
  height: 12px;
}

/* divider 纹理 */
.wemd-section-divider[data-variant="brand"] {
  background-image: url("data:image/svg+xml;base64,...");
  background-repeat: repeat-x;
  height: 16px;
}

/* tag 图标 */
.wemd-tag-label[data-variant="brand"] {
  background-image: url("data:image/svg+xml;base64,...");
  background-repeat: no-repeat;
  background-position: left center;
  padding-left: 20px;
}
```

---

## 实现方案选择规则

### 规则 1：最小化外部资源（公众号优先内联）

```
优先顺序：
1. 纯 CSS（渐变、阴影、边框、背景色）→ 零额外资源
2. Inline SVG data URL（直接内联到 variantCss）→ 最可靠，公众号兼容
3. Base64 PNG data URL（直接内联到 variantCss）→ 较大资源
4. manifest.assets 注册 → 仅当同一 SVG ≥ 2 组件复用且体积较大时
```

> **关键：** 微信公众号最终输出是内联 HTML。方案 A/B 直接写在 variantCss 里，
> 导出时随 CSS 内联，最可靠。方案 D 需要 WeMD 导出时转 data URL，增加间接性。

### 规则 2：颜色可调性

```
优先选择可跟随主题变量的方案：
- SVG 中使用 fill="currentColor" 或 fill="var(--wemd-primary)"
- 纯 CSS 直接使用 var(--wemd-xxx)
- 避免硬编码颜色（如 #ff0000）
```

### 规则 3：复用优先

```
如果同一个品牌元素出现在 ≥ 2 个组件中：
  ├── SVG 较小（≤ 500B）？ → 方案 A：各组件直接内联（简单可靠）
  └── SVG 较大（> 500B）？ → 方案 D：manifest.assets 注册 + var() 引用
```

### 规则 4：公众号兼容

```
- 不使用 CSS 动画/过渡 → 导出后失效
- 不使用伪元素 → 公众号不支持
- 不使用外部字体 → 公众号不支持
- 使用系统字体栈 → 兼容性最好
```

---

## 素材生成：从品牌元素/概念元素到 SVG

当选择的实现方案需要生成 SVG 素材时（如方案 A Inline SVG 或方案 D manifest.assets），AI 直接从品牌表达策略/概念表达策略中的具体描述**推理**出 SVG，而不是查预设表。

### 推理链路

```
品牌表达策略中的品牌元素 / 概念表达策略中的概念元素
    │
    ▼
AI 观察元素的视觉特征（形状、颜色、纹理、风格）
    │
    ▼
AI 思考：这个元素在 SVG 中如何表达？
    │
    ├── 形状能否平铺为背景纹理？
    ├── 颜色能否用作渐变？
    ├── 线条能否用作装饰？
    └── 整体风格决定精度和复杂度
    │
    ▼
AI 生成 SVG 并内联到 variantCss
```

### 推理依据

AI 生成素材的唯一依据是品牌表达策略/概念表达策略中的具体描述，不是预设映射表：

- **Brand Profile**：依据 `brandExpression.auxiliaryGraphics[].graphic` 和 `brandExpression.reuseStrategy[]`
  - 品牌辅助图形是"六边形网格" → 观察六边形特征（6 条等边、120°内角），生成六边形平铺纹理
  - 品牌辅助图形是"数据流动线条" → 观察线条特征，生成波形装饰
  - 品牌元素复用策略中定义了"六边形→timeline/divider/tag" → 每个组件生成对应风格的六边形变体

- **Creator Profile**：依据 `conceptExpression.elements[].visual` 和 `conceptExpression.decorations[]`
  - 概念元素 visual 描述为"圆角矩形，品牌色填充，白色文字" → 生成圆角矩形标签 SVG
  - 装饰描述为"浅灰色网格点阵，像 IDE 编辑器的背景网格" → 生成网格点阵 SVG
  - 装饰描述为"品牌色竖线 + 闪烁动画" → 生成竖线 SVG（公众号不支持动画，改为静态）

### 生成技法参考

技法分为两类：**SVG 技法**（用于方案 A Inline SVG）和 **CSS 技法**（用于方案 E 纯 CSS）。选择逻辑如下：

```
需要生成视觉素材
    │
    ├── 是纯颜色效果（渐变、纯色块、阴影）？
    │   → CSS 技法（linear-gradient、box-shadow、border）
    │   → 零额外资源，X5 兼容性最好
    │
    ├── 是简单几何形状（圆形、六边形、线条、图标）？
    │   → SVG 技法（<circle>、<polygon>、<path>、<rect>）
    │   → 小尺寸 Inline SVG，颜色用 var(--wemd-xxx)
    │
    └── 是重复纹理（网格、点阵、平铺图案）？
        → CSS 技法（background-repeat + 小尺寸 Inline SVG）
        → 用 CSS 平铺，不用 SVG <pattern>（X5 内核下 <pattern> 可能偏移）
```

#### SVG 技法（方案 A：Inline SVG）

| 技法                                | 适用场景                     | 说明                                                          | X5 兼容性          |
| ----------------------------------- | ---------------------------- | ------------------------------------------------------------- | ------------------ |
| `<circle>` / `<rect>` / `<ellipse>` | 圆点、方块、圆角标记         | 基本形状，颜色用 `fill="var(--wemd-primary)"`                 | ✅ 良好            |
| `<polygon>`                         | 多边形图标（六边形、三角形） | 用品牌 Logo 的形状特征生成，`points` 属性定义顶点             | ✅ 良好            |
| `<path>`（贝塞尔曲线）              | 波形、装饰线、自定义形状     | `d="M... Q... T..."` 定义曲线，`stroke="var(--wemd-primary)"` | ✅ 良好            |
| `<line>`                            | 简单线条、分隔符             | `x1 y1 x2 y2` 定义起止点                                      | ✅ 良好            |
| 组合使用                            | 复杂图标                     | 多个基本形状叠加，注意总大小 ≤ 500B                           | ⚠️ 复杂 SVG 需测试 |

**注意：** 不要在 SVG 中使用 `<linearGradient>`（X5 内核渲染不稳定），改用 CSS 的 `linear-gradient()` 函数。不要在 SVG 中使用 `<pattern>`（X5 内核平铺可能偏移），改用 CSS `background-repeat` 平铺小 SVG。

#### CSS 技法（方案 E：纯 CSS）

| 技法                         | 适用场景                 | 示例                                                                                 | 说明                                    |
| ---------------------------- | ------------------------ | ------------------------------------------------------------------------------------ | --------------------------------------- |
| `linear-gradient()`          | 渐变背景、渐变装饰条     | `background: linear-gradient(135deg, var(--wemd-primary), var(--wemd-primary-dark))` | 替代 SVG `<linearGradient>`，兼容性更好 |
| `box-shadow`                 | 卡片阴影、按钮立体感     | `box-shadow: 0 4px 12px rgba(0,0,0,0.08)`                                            | 纯 CSS，无额外资源                      |
| `border`                     | 分隔线、装饰条、边框强调 | `border-left: 4px solid var(--wemd-primary)`                                         | 替代伪元素的装饰效果                    |
| `background-repeat` + 小 SVG | 重复纹理（网格、点阵）   | `background-image: url("data:..."); background-repeat: repeat;`                      | 替代 SVG `<pattern>`，更稳定            |
| `border-radius`              | 圆角                     | `border-radius: var(--wemd-border-radius)`                                           | 使用主题变量                            |
| `opacity`                    | 半透明叠加               | `opacity: 0.1`                                                                       | 替代 `filter` 和 `mix-blend-mode`       |

### 透明度与尺寸约束

- 背景装饰元素透明度 ≤ 0.1（不干扰正文阅读）
- 组件装饰元素（如 divider 纹理）透明度 ≤ 0.3
- 图标装饰元素（如 tag 图标）透明度 ≤ 0.5
- 网格间距受品牌密度影响：宽松=24px，适中=16px，紧凑=8px

### 生成示例

```yaml
品牌元素: "六边形 Logo"
形状: "六边形"
品牌色: "#1a56db"
密度: "适中" (16px)

生成素材:
  - 用途: hero-banner 背景纹理
    SVG: 六边形平铺，16px 间距，stroke="var(--wemd-primary)" opacity="0.08"
    内联: background-image url(data:image/svg+xml;utf8,...)

  - 用途: timeline 节点图标
    SVG: 六边形，8px 大小，fill="var(--wemd-primary)"
    内联: 直接作为背景图

  - 用途: section-divider 装饰
    SVG: 六边形阵列，水平排列，opacity="0.15"
    内联: background-image url(data:image/svg+xml;utf8,...)
```

---

## 素材生命周期管理

> 素材一旦由 AI 推理生成，应当保留在当前主题设计工作区中。
> 同主题的后续生成优先复用已有素材，避免每次重新推理导致的偏差。

### 问题背景

当前素材生成每次独立推理，没有缓存机制：

```
第一次生成：品牌元素"六边形" → 推理 SVG → 六边形平铺纹理（16px 间距，stroke 描边）
第二次生成：品牌元素"六边形" → 推理 SVG → 六边形填充纹理（12px 间距，fill 填充）
第三次生成：品牌元素"六边形" → 推理 SVG → 六边形轮廓纹理（20px 间距，虚线描边）
```

每次推理结果不同，导致同主题的素材风格不一致，且无法保证跨次生成的视觉稳定性。

### 解决方案：素材工作区

每个主题设计任务维护一个**素材工作区（Material Workspace）**，素材按品牌元素/概念元素命名，生成后持久化保存。

```
{theme-name}/
└── workspace/
    └── assets/
        ├── hexagon-grid.svg           # 六边形网格纹理
        ├── wave-divider.svg           # 波形分隔线
        ├── hexagon-timeline-node.svg  # 时间线六边形节点
        └── logo-watermark.svg         # Logo 水印
```

### 素材命名规则

素材文件命名采用 `{element}-{usage}.svg` 格式：

| 品牌元素             | 用途                 | 文件名                      |
| -------------------- | -------------------- | --------------------------- |
| 六边形               | hero-banner 背景纹理 | `hexagon-bg.svg`            |
| 六边形               | timeline 节点图标    | `hexagon-timeline-node.svg` |
| 六边形               | section-divider 装饰 | `hexagon-divider.svg`       |
| 波形                 | 分隔线               | `wave-divider.svg`          |
| Logo                 | 水印                 | `logo-watermark.svg`        |
| 网格                 | 背景点阵             | `grid-dots-bg.svg`          |
| 品牌辅助图形         | 标题图标             | `brand-icon-title.svg`      |
| 概念元素（Tab）      | 标题标签             | `tab-label.svg`             |
| 概念元素（Terminal） | Callout 背景         | `terminal-bg.svg`           |

### 生成-保存-复用 流程

```
需要对品牌元素/概念元素生成 SVG 素材
    │
    ▼
检查工作区 assets/ 目录
    │
    ├── 已有同名素材？ → 直接复用（仅按需调整颜色变量）
    │   │
    │   └── 读取已有 SVG，替换 fill/stroke 中的颜色变量
    │       background-image: url("data:image/svg+xml;utf8,<已有 SVG>...")
    │
    └── 无同名素材？ → 推理生成并保存
        │
        ▼
    AI 从品牌元素/概念元素的视觉特征推理 SVG
        │
        ├── 生成 SVG 内容
        ├── 保存到 workspace/assets/{element}-{usage}.svg
        └── 内联到 variantCss 或注册到 manifest.assets
```

### 复用规则

**规则 1：文件名匹配复用**

- 当品牌表达策略/概念表达策略中的元素描述与已有素材文件名匹配时，**必须优先复用**
- 不允许在已有素材的情况下重新生成（除非用户明确要求修改）

**规则 2：颜色变量替换**

- 已有素材中的颜色应使用 `currentColor` 或 `var(--wemd-xxx)` 变量
- 复用时不修改 SVG 结构，仅根据需要调整颜色变量
- 示例：`stroke="var(--wemd-primary)"` 而非 `stroke="#1a56db"`

**规则 3：跨组件复用**

- 如果同一个品牌元素出现在 ≥ 2 个组件中，素材必须注册到 `manifest.assets`
- 各组件通过 `var(--wemd-asset-xxx)` 引用，确保一致
- 不允许分别内联不同版本（会导致视觉不一致）

**规则 4：策略变更时标记过期**

- 当用户修改品牌策略（如更换 Logo、调整关键词）时，受影响的素材标记为"可能过期"
- 标记过期的素材在下次生成时由 AI 判断是否需要重新生成
- 判断依据：素材的视觉特征是否与新策略冲突

### 素材引用方式

同一主题内，所有素材通过以下三种方式引用（策略选择矩阵决定）：

| 引用方式                                           | 适用场景                        | 说明                                     |
| -------------------------------------------------- | ------------------------------- | ---------------------------------------- |
| `url("data:image/svg+xml;base64,...")`             | 默认方式，单组件或小 SVG 跨组件 | 直接内联在 variantCss 中，公众号最可靠   |
| `url("data:image/png;base64,...")`                 | 复杂纹理                        | 直接内联在 variantCss 中                 |
| `manifest.assets.images` + `var(--wemd-asset-xxx)` | 大 SVG（> 500B）在 ≥ 2 组件复用 | 注册后用变量引用，WeMD 导出时转 data URL |

### 设计目标 → 素材生命周期状态

| 品牌元素 | 素材文件                    | 状态      | 依赖策略                  | 过期条件                 |
| -------- | --------------------------- | --------- | ------------------------- | ------------------------ |
| 六边形   | `hexagon-bg.svg`            | ✅ 已生成 | 辅助图形=六边形           | 更换辅助图形             |
| 六边形   | `hexagon-timeline-node.svg` | ✅ 已生成 | reuseStrategy 含 timeline | 移除六边形→timeline 映射 |
| 波形     | `wave-divider.svg`          | ❌ 未生成 | 辅助图形=波形             | —                        |
| Logo     | `logo-watermark.svg`        | ✅ 已生成 | Logo 水印策略             | 更换 Logo                |
| 网格     | `grid-dots-bg.svg`          | ⏸️ 已过期 | 由"科技"改为"温暖"        | 风格关键词变更           |

---

## 生成 variantCss 的规则

### 选择器格式

```css
/* 必须的格式：组件名 + data-variant 属性 */
.wemd-hero-banner[data-variant="brand-wave"] {
  /* ... */
}

/* ❌ 错误：没有 data-variant */
.wemd-hero-banner {
  /* ... */
}

/* ❌ 错误：使用了组件不存在的 class */
.wemd-custom-banner {
  /* ... */
}
```

### CSS 变量引用

```css
/* ✅ 正确：使用 CSS 变量 */
.wemd-hero-banner[data-variant="brand-wave"] {
  background: linear-gradient(
    135deg,
    var(--wemd-primary),
    var(--wemd-primary-dark)
  );
  color: white;
  border-radius: var(--wemd-border-radius);
}

/* ❌ 错误：硬编码颜色 */
.wemd-hero-banner[data-variant="brand-wave"] {
  background: linear-gradient(135deg, #1a56db, #0f3fa0);
  color: white;
  border-radius: 8px;
}
```

### 资源引用

```css
/* ✅ 正确：Inline SVG data URL */
.wemd-section-divider[data-variant="wave"] {
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 20'><path d='M0,10 Q30,0 60,10 T120,10 T180,10' stroke='currentColor' fill='none'/></svg>");
}

/* ✅ 正确：通过 manifest.assets 注册的变量 */
.wemd-timeline[data-variant="brand"] {
  background-image: var(--wemd-asset-hexagon-icon);
}

/* ❌ 错误：直接引用 zip 内路径 */
.wemd-hero-banner {
  background-image: url(assets/images/bg.svg);
}
```

---

## 输出格式

Application Layer 的输出是**可执行的 CSS 代码 + manifest 配置片段**：

```yaml
applicationOutput:
  # 组件变体配置
  components:
    hero-banner:
      enabled: true
      variant: "brand-wave"
      variantCss: |
        .wemd-hero-banner[data-variant="brand-wave"] {
          background: linear-gradient(135deg, var(--wemd-primary), var(--wemd-primary-dark));
          min-height: 200px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: var(--wemd-border-radius);
        }
        .wemd-hero-banner[data-variant="brand-wave"] .wemd-hero-title {
          color: white;
          font-size: 28px;
          font-weight: 700;
        }
    section-divider:
      enabled: true
      variant: "wave"
      variantCss: |
        .wemd-section-divider[data-variant="wave"] {
          background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 20'><path d='M0,10 Q30,0 60,10 T120,10 T180,10' stroke='var(--wemd-primary)' fill='none' stroke-width='2'/></svg>");
          height: 20px;
          background-repeat: repeat-x;
          margin: 24px 0;
        }

  # 资源注册（如有）
  assets:
    images:
      - key: "hexagon-icon"
        src: "data:image/svg+xml;base64,<base64...>"
```

---

## 设计目标 → 实现方案速查表

| 设计目标        | 推荐方案          | CSS 关键属性                                    | 是否需要素材   |
| --------------- | ----------------- | ----------------------------------------------- | -------------- |
| 纯色渐变背景    | E. CSS 渐变       | `background: linear-gradient(...)`              | 否             |
| 几何网格纹理    | A. Inline SVG     | `background-image: url("data:...")` + `repeat`  | 否             |
| 波形分隔线      | A. Inline SVG     | `background-image: url("data:...")`             | 否             |
| 品牌 Logo 水印  | A. Inline SVG     | `background-image: url("data:...")`             | 否（直接内联） |
| 标题左侧装饰条  | E. CSS border     | `border-left: 4px solid`                        | 否             |
| 标题图标        | A. Inline SVG     | `background-image` + `padding-left`             | 否             |
| 卡片阴影        | E. CSS box-shadow | `box-shadow: ...`                               | 否             |
| 标签（Tag）     | E. CSS 背景色     | `background: var(--wemd-primary-light)`         | 否             |
| 时间线图标      | A. Inline SVG     | `background-image: url("data:...")`             | 否（直接内联） |
| 六边形/圆形节点 | A. Inline SVG     | `background-image: url("data:...")`             | 否             |
| 按钮渐变        | E. CSS 渐变       | `background: linear-gradient(...)`              | 否             |
| 引用装饰        | E. CSS border     | `border-left: 4px solid`                        | 否             |
| 圆角卡片        | E. CSS 变量       | `border-radius: var(--wemd-border-radius)`      | 否             |
| 底部品牌声明    | E. CSS 文字       | `font-size: 12px; color: var(--wemd-text-soft)` | 否             |
