# ④ Decoration Layer（装饰层）

> 角色：**设计组合师**
> 回答：**AI 决定"用什么装饰"，而不是"怎么写 CSS"**
> 位置：Logic Layer（输出 Design Blueprint）→ **Decoration Layer（组合选择）** → Application Layer（确定性 CSS 映射）

---

## 概述

Decoration Layer 是 Design Pipeline 中新增的"组合层"。它的核心思想是：

**AI 不再发明 CSS，而是从 Decoration Library 中选择和组合装饰原子。**

每个装饰原子对应一段确定性的 CSS 模板。AI 的责任是：

1. 根据品牌关键词和阅读体验，选择哪些原子适合当前组件
2. 组合多个原子形成完整的装饰方案
3. 调整参数（颜色、大小、间距、对齐、透明度）

Application Layer 不再让 AI 写 CSS，而是将 Decoration Plan 映射为确定的 CSS 输出。

---

## 装饰原子（Decoration Atoms）

### 分类总览

| 类别           | 原子     | 变体数 | 适用组件                 |
| -------------- | -------- | ------ | ------------------------ |
| **Line**       | 线条装饰 | 8      | 标题、引用、卡片、分隔线 |
| **Badge**      | 徽标标记 | 10     | 标题、标签、步骤、状态   |
| **Pattern**    | 背景纹理 | 15     | 横幅、卡片、背景         |
| **Icon**       | 图标装饰 | 20     | 标题、引用、卡片、列表   |
| **Corner**     | 边角装饰 | 8      | 卡片、引用、代码块       |
| **Divider**    | 分隔线   | 10     | 章节分隔、内容分隔       |
| **Background** | 背景效果 | 6      | 横幅、卡片、CTA          |
| **Marker**     | 列表标记 | 6      | 列表、步骤、导航         |

### 装饰原子定义

#### Line（线条）

| id               | 名称   | 描述         | 位置     | CSS 模板                                                                                                                 |
| ---------------- | ------ | ------------ | -------- | ------------------------------------------------------------------------------------------------------------------------ |
| `line-left`      | 左竖线 | 左侧装饰条   | 元素左侧 | `border-left: {width} solid {color}; padding-left: {gap}`                                                                |
| `line-top`       | 上横线 | 顶部装饰线   | 元素顶部 | `border-top: {width} solid {color}; padding-top: {gap}`                                                                  |
| `line-bottom`    | 下横线 | 底部装饰线   | 元素底部 | `border-bottom: {width} solid {color}; padding-bottom: {gap}`                                                            |
| `line-underline` | 下划线 | 文字底部线   | 文本下方 | `<span class="deco-underline">` + `position:absolute; bottom:0; left:0; width:{pct}; height:{width}; background:{color}` |
| `line-double`    | 双线   | 上下双线     | 元素上下 | `border-top + border-bottom`                                                                                             |
| `line-diagonal`  | 斜线   | 对角装饰线   | 元素角落 | 通过 `transform: rotate()` 实现                                                                                          |
| `line-gradient`  | 渐变线 | 渐变色彩线条 | 任意位置 | `background: linear-gradient(...)`                                                                                       |
| `line-dashed`    | 虚线   | 虚线装饰     | 任意位置 | `border-style: dashed`                                                                                                   |

#### Badge（徽标）

| id             | 名称     | 描述            | CSS 模板                                                                                                |
| -------------- | -------- | --------------- | ------------------------------------------------------------------------------------------------------- |
| `badge-number` | 数字序号 | 01, 02 样式编号 | `<span class="deco-badge">{num}</span>` + `background:{color}; color:#fff; border-radius; padding`      |
| `badge-dot`    | 圆点标记 | 小圆点          | `<span class="deco-dot"></span>` + `width:{size}; height:{size}; border-radius:50%; background:{color}` |
| `badge-icon`   | 图标徽标 | 带图标的徽标    | `<span class="deco-badge-icon">{svg/emoji}</span>`                                                      |
| `badge-tag`    | 标签     | 文字标签        | `<span class="deco-tag">{text}</span>` + `background:{color}; padding; border-radius`                   |
| `badge-pill`   | 药丸标记 | 圆角药丸形状    | `border-radius: 999px; background:{color}`                                                              |
| `badge-corner` | 角标     | 右上角角标      | `position:absolute; top:0; right:0;` + 三角/矩形                                                        |
| `badge-ribbon` | 缎带     | 缎带式标记      | 通过 `::before` 替代方案：物理 `<span>` + `skewX` 变形                                                  |
| `badge-circle` | 圆形徽标 | 圆形序号        | `<span class="deco-circle">{num}</span>` + `width:{size}; height:{size}; border-radius:50%;`            |
| `badge-stroke` | 描边徽标 | 仅描边无填充    | `border: {width} solid {color}; color: {color}; background: transparent`                                |
| `badge-glow`   | 发光徽标 | 带发光效果      | `box-shadow: 0 0 {radius} {color}`                                                                      |

#### Pattern（纹理）

| id                    | 名称   | 描述         | CSS 模板                                                                      |
| --------------------- | ------ | ------------ | ----------------------------------------------------------------------------- |
| `pattern-grid`        | 网格   | 正方形网格   | `background-image: url("data:image/svg+xml,..."); background-repeat: repeat;` |
| `pattern-dot`         | 点阵   | 圆点阵列     | 同上，用 `<circle>` 替代 `<rect>`                                             |
| `pattern-stripe`      | 条纹   | 斜线条纹     | `background: repeating-linear-gradient(...)`                                  |
| `pattern-hexagon`     | 六边形 | 六边形平铺   | 内联 SVG 六边形平铺                                                           |
| `pattern-wave`        | 波形   | 波浪曲线     | 内联 SVG `<path>` 波形                                                        |
| `pattern-cross`       | 十字   | 十字交叉     | 内联 SVG                                                                      |
| `pattern-triangle`    | 三角   | 三角形阵列   | 内联 SVG                                                                      |
| `pattern-zigzag`      | 锯齿   | 锯齿形       | `background: linear-gradient(...)` + `background-size`                        |
| `pattern-houndstooth` | 千鸟格 | 经典千鸟格   | 内联 SVG 复杂图案                                                             |
| `pattern-plaid`       | 格子   | 苏格兰格纹   | 叠加两层 `repeating-linear-gradient`                                          |
| `pattern-mountain`    | 山脉   | 层叠山脉曲线 | 内联 SVG `<path>` 多层                                                        |
| `pattern-circle`      | 圆圈   | 圆圈阵列     | 内联 SVG                                                                      |
| `pattern-line-h`      | 水平线 | 水平平行线   | `repeating-linear-gradient(0deg, ...)`                                        |
| `pattern-line-v`      | 垂直线 | 垂直平行线   | `repeating-linear-gradient(90deg, ...)`                                       |
| `pattern-noise`       | 噪点   | 细微噪点纹理 | 极小 Base64 PNG 或 CSS 渐变近似                                               |

#### Icon（图标）

| id                 | 名称       | 描述             | CSS 模板                                                                      |
| ------------------ | ---------- | ---------------- | ----------------------------------------------------------------------------- |
| `icon-emoji`       | Emoji 图标 | 用 emoji 做图标  | `<span class="deco-icon">{emoji}</span>`                                      |
| `icon-svg-inline`  | 内联 SVG   | 小尺寸 SVG 图标  | `<span class="deco-icon">{svg}</span>` 或 `background-image: url("data:...")` |
| `icon-brand`       | 品牌图标   | 品牌 Logo 缩小版 | 通过 `manifest.assets` 注册，`var(--wemd-asset-xxx)` 引用                     |
| `icon-arrow`       | 箭头       | 各种箭头         | `<span class="deco-arrow">→</span>`                                           |
| `icon-check`       | 对勾       | 勾选标记         | `<span class="deco-check">✓</span>`                                           |
| `icon-cross`       | 叉号       | 叉号标记         | `<span class="deco-cross">✕</span>`                                           |
| `icon-star`        | 星星       | 星形标记         | `<span class="deco-star">★</span>`                                            |
| `icon-quote`       | 引号       | 大引号装饰       | `<span class="deco-quote">"</span>` + 大字号                                  |
| `icon-number`      | 数字       | 超大数字背景     | `<span class="deco-number">{num}</span>` + `font-size: 3em; opacity: 0.1`     |
| `icon-bullet`      | 圆点       | 列表圆点         | `<span class="deco-bullet">•</span>`                                          |
| `icon-plus`        | 加号       | 加号             | `<span class="deco-plus">+</span>`                                            |
| `icon-minus`       | 减号       | 减号             | `<span class="deco-minus">−</span>`                                           |
| `icon-arrow-right` | 右箭头     | 向右箭头         | 内联 SVG 箭头                                                                 |
| `icon-arrow-left`  | 左箭头     | 向左箭头         | 内联 SVG 箭头                                                                 |
| `icon-chevron`     | 角标箭头   | 小角标箭头       | `›` 或内联 SVG                                                                |
| `icon-heart`       | 心形       | 心形装饰         | `<span class="deco-heart">♥</span>`                                          |
| `icon-circle`      | 空心圆     | 空心圆装饰       | `<span class="deco-circle-outline">○</span>`                                  |
| `icon-diamond`     | 菱形       | 菱形装饰         | `◆` 或内联 SVG                                                                |
| `icon-hash`        | 井号       | 井号装饰         | `<span class="deco-hash">#</span>`                                            |
| `icon-at`          | @符号      | @符号装饰        | `<span class="deco-at">@</span>`                                              |

#### Corner（边角）

| id                   | 名称   | 描述           | CSS 模板                                                |
| -------------------- | ------ | -------------- | ------------------------------------------------------- |
| `corner-rounded`     | 圆角   | 标准圆角       | `border-radius: var(--wemd-border-radius)`              |
| `corner-square`      | 直角   | 无圆角         | `border-radius: 0`                                      |
| `corner-pill`        | 药丸   | 完全圆角       | `border-radius: 999px`                                  |
| `corner-fold`        | 折角   | 右上角折角效果 | 通过 `::before` 替代方案：物理 `<span>` + `border` 三角 |
| `corner-notch`       | 切角   | 切角效果       | `clip-path: polygon(...)`                               |
| `corner-round-left`  | 左圆角 | 仅左侧圆角     | `border-radius: {r} 0 0 {r}`                            |
| `corner-round-right` | 右圆角 | 仅右侧圆角     | `border-radius: 0 {r} {r} 0`                            |
| `corner-soft`        | 柔和   | 极小圆角       | `border-radius: 4px`                                    |

#### Divider（分隔线）

| id                      | 名称       | 描述         | CSS 模板                                                                                                                                                      |
| ----------------------- | ---------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `divider-solid`         | 实线       | 纯色实线     | `border-top: {width} solid {color}`                                                                                                                           |
| `divider-dashed`        | 虚线       | 虚线分隔     | `border-top: {width} dashed {color}`                                                                                                                          |
| `divider-dotted`        | 点线       | 点线分隔     | `border-top: {width} dotted {color}`                                                                                                                          |
| `divider-gradient`      | 渐变线     | 渐变色彩分隔 | `background: linear-gradient(to right, transparent, {color}, transparent); height: {width}`                                                                   |
| `divider-wave`          | 波形       | 波浪分隔线   | 内联 SVG 波形                                                                                                                                                 |
| `divider-pattern`       | 图案线     | 带图案分隔   | 内联 SVG 重复图案                                                                                                                                             |
| `divider-icon`          | 图标线     | 中间带图标   | `<div class="deco-divider"><span class="deco-divider-line"></span><span class="deco-divider-icon">{icon}</span><span class="deco-divider-line"></span></div>` |
| `divider-gradient-icon` | 渐变图标线 | 渐变线+图标  | 同上，线条用渐变                                                                                                                                              |
| `divider-double`        | 双线       | 两条平行线   | `border-top + border-bottom`                                                                                                                                  |
| `divider-thick`         | 粗线       | 粗线条分隔   | `border-top: {width} solid {color}` (width ≥ 3px)                                                                                                             |

#### Background（背景）

| id                   | 名称     | 描述         | CSS 模板                                                                    |
| -------------------- | -------- | ------------ | --------------------------------------------------------------------------- |
| `bg-solid`           | 纯色背景 | 纯色填充     | `background: {color}`                                                       |
| `bg-gradient`        | 渐变背景 | 渐变色彩     | `background: linear-gradient({angle}, {color1}, {color2})`                  |
| `bg-gradient-radial` | 径向渐变 | 从中心扩散   | `background: radial-gradient(circle, {color1}, {color2})`                   |
| `bg-pattern`         | 纹理背景 | 重复纹理     | `background-image: url("data:..."); background-repeat: repeat;`             |
| `bg-soft`            | 柔和背景 | 低透明度填充 | `background: {color}; opacity: 0.05`                                        |
| `bg-card`            | 卡片背景 | 卡片式背景   | `background: {bgCard}; border: 1px solid {border}; border-radius: {radius}` |

#### Marker（列表标记）

| id              | 名称     | 描述         | CSS 模板                                  |
| --------------- | -------- | ------------ | ----------------------------------------- |
| `marker-bullet` | 实心圆点 | 标准列表标记 | `<span class="deco-marker">•</span>`      |
| `marker-circle` | 空心圆   | 空心圆标记   | `<span class="deco-marker">○</span>`      |
| `marker-check`  | 对勾     | 完成标记     | `<span class="deco-marker">✓</span>`      |
| `marker-star`   | 星号     | 星号标记     | `<span class="deco-marker">★</span>`      |
| `marker-arrow`  | 箭头     | 箭头标记     | `<span class="deco-marker">→</span>`      |
| `marker-number` | 数字     | 数字序号标记 | `<span class="deco-marker">{num}.</span>` |

---

## 组合规则

### 每个组件可装饰的位置

```
┌──────────────────────────────────┐
│  corner-top-left    corner-top-right
│                                  │
│  line-left    内容区域    line-right
│                                  │
│  corner-bottom-left corner-bottom-right
│                                  │
│  line-top (上方)                  │
│  badge (左上方)  icon (内联)      │
│  background (整个背景)            │
│  pattern (背景纹理)              │
│  line-bottom (下方)              │
│  divider (底部外部)               │
└──────────────────────────────────┘
```

### 组合约束

| 规则                  | 说明                                                                                                                                                         |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 同一位置不能叠加      | 例如 `line-left` 和 `corner-rounded` 可以共存（不同位置），但 `line-top` 和 `line-double`（都含上横线）不能                                                  |
| 背景互斥              | `bg-solid`, `bg-gradient`, `bg-gradient-radial`, `bg-pattern`, `bg-soft`, `bg-card` 六者只能选其一，但可与 `pattern-*` 叠加（pattern 作为 background-image） |
| 纹理叠加限制          | 同一组件最多 1 个 Pattern + 1 个 Background                                                                                                                  |
| 装饰总数限制          | 软限制，按密度：low≤2、medium≤3、high≤4（不含 Background），超出发 Warning 不阻断                                                                            |
| Badge 独占            | 一个组件只能有一个 Badge 原子                                                                                                                                |
| Corner 与 Border 冲突 | `corner-*` 和 `line-left/right/top/bottom` 定义同一边时冲突                                                                                                  |

### 装饰原子组合示例

```
Heading
├── line-left + badge-number          → 序号标题（左竖线 + 01编号）
├── line-bottom + icon-emoji          → Emoji 标题（底部线 + 前方图标）
├── pattern-dot + bg-soft             → 网格背景标题
├── line-gradient + badge-pill        → 渐变线 + 标签标题
├── line-double + icon-arrow          → 双线 + 箭头装饰标题
├── corner-soft + bg-card             → 卡片式标题
├── line-underline + icon-star        → 下划线 + 星标标题
├── line-left + line-top + badge-number → 左上角标组合
└── line-dashed + icon-brand          → 虚线 + 品牌图标标题
```

---

## 品牌关键词 → 装饰原子映射

### 映射规则

每个品牌关键词关联一组推荐装饰原子。AI 在选择时优先从推荐列表中选择，但也可以跨列表选择（只要不违反品牌约束）。

| 关键词 | 推荐 Line                    | 推荐 Badge                 | 推荐 Pattern                                | 推荐 Icon                         | 推荐 Corner                 | 推荐 Divider                    |
| ------ | ---------------------------- | -------------------------- | ------------------------------------------- | --------------------------------- | --------------------------- | ------------------------------- |
| 专业   | line-left, line-gradient     | badge-number, badge-stroke | pattern-grid, pattern-dot                   | icon-arrow, icon-check            | corner-square, corner-soft  | divider-solid, divider-gradient |
| 科技   | line-gradient, line-double   | badge-glow, badge-number   | pattern-grid, pattern-hexagon               | icon-arrow, icon-chevron          | corner-soft, corner-square  | divider-gradient, divider-wave  |
| 年轻   | line-dashed, line-diagonal   | badge-pill, badge-icon     | pattern-dot, pattern-cross, pattern-zigzag  | icon-emoji, icon-star, icon-heart | corner-pill, corner-rounded | divider-dashed, divider-icon    |
| 高端   | line-left, line-underline    | badge-stroke, badge-number | pattern-houndstooth, pattern-plaid          | icon-brand, icon-diamond          | corner-square, corner-soft  | divider-solid, divider-double   |
| 环保   | line-bottom, line-underline  | badge-dot, badge-circle    | pattern-dot, pattern-wave, pattern-mountain | icon-check, icon-circle           | corner-rounded, corner-soft | divider-wave, divider-gradient  |
| 可信   | line-left, line-bottom       | badge-number, badge-stroke | pattern-grid, pattern-line-h                | icon-check, icon-arrow            | corner-soft, corner-square  | divider-solid, divider-double   |
| 创新   | line-gradient, line-diagonal | badge-glow, badge-icon     | pattern-hexagon, pattern-mountain           | icon-arrow, icon-plus             | corner-pill, corner-rounded | divider-gradient, divider-wave  |
| 温暖   | line-underline, line-bottom  | badge-pill, badge-tag      | pattern-dot, pattern-circle                 | icon-heart, icon-star             | corner-rounded, corner-pill | divider-icon, divider-gradient  |
| 极简   | line-left, line-top          | badge-stroke, badge-dot    | pattern-dot, pattern-grid                   | icon-arrow, icon-chevron          | corner-square, corner-soft  | divider-solid, divider-gradient |
| 国际化 | line-double, line-gradient   | badge-number, badge-stroke | pattern-grid, pattern-dot                   | icon-arrow, icon-chevron          | corner-square, corner-soft  | divider-solid, divider-gradient |
| 稳重   | line-left, line-bottom       | badge-number, badge-stroke | pattern-grid, pattern-line-h                | icon-check, icon-arrow            | corner-square, corner-soft  | divider-solid, divider-double   |
| 活力   | line-dashed, line-diagonal   | badge-pill, badge-glow     | pattern-zigzag, pattern-cross               | icon-star, icon-heart, icon-plus  | corner-pill, corner-rounded | divider-dashed, divider-icon    |
| 理性   | line-left, line-gradient     | badge-number, badge-dot    | pattern-grid, pattern-line-v                | icon-arrow, icon-check            | corner-square, corner-soft  | divider-solid, divider-gradient |
| 治愈   | line-underline, line-bottom  | badge-dot, badge-circle    | pattern-dot, pattern-wave, pattern-circle   | icon-heart, icon-star             | corner-rounded, corner-soft | divider-wave, divider-icon      |
| 匠心   | line-left, line-underline    | badge-number, badge-stroke | pattern-grid, pattern-houndstooth           | icon-diamond, icon-brand          | corner-square, corner-soft  | divider-solid, divider-double   |
| 故事感 | line-underline, line-double  | badge-icon, badge-tag      | pattern-dot, pattern-wave                   | icon-quote, icon-star, icon-emoji | corner-rounded, corner-soft | divider-icon, divider-wave      |
| 文艺   | line-underline, line-left    | badge-icon, badge-dot      | pattern-dot, pattern-wave                   | icon-quote, icon-heart, icon-star | corner-rounded, corner-soft | divider-icon, divider-wave      |
| 商务   | line-left, line-bottom       | badge-number, badge-stroke | pattern-grid, pattern-line-h                | icon-arrow, icon-check            | corner-square, corner-soft  | divider-solid, divider-double   |

### 品牌关键词 → 组件级别装饰推荐

| 关键词 | 装饰组件               | 推荐装饰原子                                 |
| ------ | ---------------------- | -------------------------------------------- |
| 专业   | 标题、引用             | line-left, badge-number, divider-solid       |
| 科技   | 标题、横幅、代码块     | line-gradient, pattern-grid, badge-glow      |
| 年轻   | 标题、卡片、标签       | badge-pill, icon-emoji, corner-pill          |
| 高端   | 标题、引用、品牌签名   | line-left, badge-stroke, pattern-houndstooth |
| 环保   | 标题、引用、分隔线     | line-bottom, pattern-wave, divider-wave      |
| 可信   | 标题、引用、数据统计   | line-left, badge-number, divider-solid       |
| 创新   | 标题、CTA、横幅        | line-gradient, badge-glow, corner-pill       |
| 温暖   | 标题、引用、卡片       | corner-rounded, badge-pill, icon-heart       |
| 极简   | 标题、分隔线           | line-left, divider-solid, badge-dot          |
| 国际化 | 标题、CTA、数据统计    | line-double, badge-number, divider-gradient  |
| 稳重   | 标题、引用、品牌签名   | line-left, line-bottom, divider-solid        |
| 活力   | 标题、CTA、标签        | badge-pill, line-dashed, icon-star           |
| 理性   | 标题、数据统计、代码块 | line-left, pattern-grid, divider-solid       |
| 治愈   | 标题、引用、卡片       | corner-rounded, pattern-dot, icon-heart      |
| 匠心   | 标题、品牌签名、分隔线 | line-left, badge-stroke, divider-double      |
| 故事感 | 标题、引用、卡片       | icon-quote, line-underline, divider-icon     |
| 文艺   | 标题、引用、卡片       | line-underline, icon-quote, corner-rounded   |
| 商务   | 标题、数据统计、CTA    | line-left, badge-number, divider-solid       |

---

## Decoration Layer 在 Pipeline 中的位置

```
┌─ Logic Layer ──────────────────────────────────────┐
│ 输出：Design Blueprint                               │
│  - readingExperience                                │
│  - brandExpression / conceptExpression               │
│  - componentExpression (组件映射表)                  │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─ Constraint Layer ──────────────────────────────────┐
│ 检查：C1-C6（无伪元素检查改为「无装饰冲突」）          │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─ Decoration Layer（新增）────────────────────────────┐
│                                                      │
│  输入：Design Blueprint                               │
│                                                      │
│  ① 品牌关键词 → 过滤可用装饰原子                      │
│     - 3 个关键词 → 取并集                             │
│     - 品牌特定约束（如"只能用六边形"）→ 硬性过滤        │
│                                                      │
│  ② 阅读体验 → 影响装饰密度                            │
│     - 快节奏 → low（≤ 2 个/组件）                      │
│     - 中等节奏 → medium（≤ 3 个/组件）                  │
│     - 慢节奏 → high（≤ 4 个/组件）                      │
│                                                      │
│  ③ 组件映射 → 为每个组件选择装饰原子组合               │
│     - 每个组件从推荐列表中选择                         │
│     - 遵守组合约束（位置不冲突、数量不超限）            │
│                                                      │
│  ④ 输出：Decoration Plan                             │
│     - 每个组件的装饰原子清单 + 参数                    │
│     - 参数：颜色、大小、间距、对齐、透明度              │
│                                                      │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─ Application Layer ─────────────────────────────────┐
│                                                      │
│  输入：Decoration Plan                                │
│                                                      │
│  ① 映射装饰原子 → 确定性 CSS 模板                    │
│     - 每个原子有固定的 CSS 模板                       │
│     - 参数替换（颜色、大小、间距等）                   │
│                                                      │
│  ② 注入装饰 HTML 元素                                │
│     - 根据原子类型生成对应的 `<span>` 元素             │
│     - 注入到组件 HTML 模板中                          │
│                                                      │
│  ③ 输出：完整 variantCss + 组件 HTML                  │
│                                                      │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─ Compiler Layer ────────────────────────────────────┐
│ 编译打包为 .wemd-theme                                │
└──────────────────────────────────────────────────────┘
```

---

## Decoration Plan 输出格式

```yaml
decorationPlan:
  # 品牌约束快照
  brandFilter:
    keywords: ["科技", "创新", "年轻"]
    allowedAtoms:
      [
        "line-gradient",
        "line-dashed",
        "line-diagonal",
        "badge-glow",
        "badge-icon",
        "badge-pill",
        "pattern-grid",
        "pattern-hexagon",
        "pattern-dot",
        "icon-emoji",
        "icon-star",
        "icon-arrow",
        "corner-pill",
        "corner-rounded",
        "corner-soft",
        "divider-gradient",
        "divider-wave",
        "divider-icon",
      ]
    density: "medium" # low: ≤2 atoms/component, medium: ≤3, high: ≤4

  # 组件装饰方案
  components:
    hero-banner:
      variant: "tech-wave"
      atoms:
        - id: "bg-gradient"
          params:
            angle: "135deg"
            color1: "var(--wemd-primary)"
            color2: "var(--wemd-primary-dark)"
        - id: "pattern-grid"
          params:
            size: 20
            stroke: "rgba(255,255,255,0.08)"
        - id: "badge-pill"
          params:
            text: "NEW"
            color: "var(--wemd-accent)"
            fontSize: 13
            paddingX: 12

    section-title:
      variant: "tech-left"
      atoms:
        - id: "line-left"
          params:
            width: 4
            color: "var(--wemd-primary)"
            gap: 12
        - id: "icon-arrow"
          params:
            color: "var(--wemd-primary)"
            size: 16

    divider:
      variant: "wave"
      atoms:
        - id: "divider-wave"
          params:
            color: "var(--wemd-primary)"
            height: 20
            opacity: 0.4
```

---

## 装饰原子 → CSS 模板映射

### 映射原则

每个装饰原子有一个确定的 CSS 模板。模板中的参数用 `{param}` 占位，AI 在 Decoration Plan 中提供参数值。

### 示例映射

```
装饰原子: line-left
CSS 模板:
  .wemd-{component}[data-variant="{variant}"] {
    border-left: {width}px solid {color};
    padding-left: {gap}px;
  }
参数:
  - width: number (2-6, 默认4)
  - color: CSS 变量 (默认 var(--wemd-primary))
  - gap: number (8-20, 默认12)

装饰原子: pattern-hexagon
CSS 模板:
  .wemd-{component}[data-variant="{variant}"] {
    background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='{size}' height='{size}'><polygon points='...' fill='{color}' opacity='{opacity}'/></svg>");
    background-repeat: repeat;
  }
参数:
  - size: number (16-40, 默认24)
  - color: CSS 变量 (默认 var(--wemd-primary))
  - opacity: number (0.02-0.15, 默认0.06)

装饰原子: badge-number
HTML 模板:
  <span class="wemd-{component}-badge">{number}</span>
CSS 模板:
  .wemd-{component}[data-variant="{variant}"] .wemd-{component}-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: {size}px;
    height: {size}px;
    background: {color};
    color: #fff;
    border-radius: {radius}px;
    font-size: {fontSize}px;
    font-weight: 700;
    margin-right: {gap}px;
    flex-shrink: 0;
  }
参数:
  - number: string (如 "01")
  - size: number (20-40, 默认28)
  - color: CSS 变量 (默认 var(--wemd-primary))
  - radius: number (4-999, 默认6)
  - fontSize: number (12-18, 默认14)
  - gap: number (4-16, 默认8)
```

### P0 原子完整 CSS 模板映射

以下为 25 个 P0 原子的完整 CSS 模板定义，覆盖 80% 以上的装饰场景。

---

#### Line 类

**`line-left` — 左竖线**

```
CSS 模板:
  .wemd-{component}[data-variant="{variant}"] {
    border-left: {width}px solid {color};
    padding-left: {gap}px;
  }
参数:
  - width: number (2-6, 默认4)
  - color: CSS 变量 (默认 var(--wemd-primary))
  - gap: number (8-20, 默认12)
场景: 标题、引用、卡片左侧装饰
```

**`line-bottom` — 底横线**

```
CSS 模板:
  .wemd-{component}[data-variant="{variant}"] {
    border-bottom: {width}px solid {color};
    padding-bottom: {gap}px;
  }
参数:
  - width: number (1-4, 默认2)
  - color: CSS 变量 (默认 var(--wemd-primary))
  - gap: number (4-16, 默认8)
场景: 标题底部装饰、分隔效果
```

**`line-underline` — 文字下划线**

```
HTML 模板:
  <span class="wemd-{component}-underline"></span>
CSS 模板:
  .wemd-{component}[data-variant="{variant}"] {
    position: relative;
  }
  .wemd-{component}[data-variant="{variant}"] .wemd-{component}-underline {
    position: absolute;
    bottom: {offset}px;
    left: {left}%;
    width: {width}%;
    height: {lineHeight}px;
    background: {color};
    border-radius: {lineHeight}px;
  }
参数:
  - width: number (30-100, 默认60)
  - color: CSS 变量 (默认 var(--wemd-primary))
  - offset: number (0-8, 默认2)
  - left: number (0-50, 默认0)
  - lineHeight: number (2-6, 默认3)
场景: 标题下方强调线（如品牌 Slogan、大标题）
```

---

#### Badge 类

**`badge-number` — 数字序号**

```
HTML 模板:
  <span class="wemd-{component}-badge">{number}</span>
CSS 模板:
  .wemd-{component}[data-variant="{variant}"] .wemd-{component}-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: {size}px;
    height: {size}px;
    background: {color};
    color: #fff;
    border-radius: {radius}px;
    font-size: {fontSize}px;
    font-weight: 700;
    margin-right: {gap}px;
    flex-shrink: 0;
  }
参数:
  - number: string (如 "01")
  - size: number (20-40, 默认28)
  - color: CSS 变量 (默认 var(--wemd-primary))
  - radius: number (4-999, 默认6)
  - fontSize: number (12-18, 默认14)
  - gap: number (4-16, 默认8)
场景: 步骤序号、列表编号、标题序号
```

**`badge-dot` — 圆点标记**

```
HTML 模板:
  <span class="wemd-{component}-dot"></span>
CSS 模板:
  .wemd-{component}[data-variant="{variant}"] .wemd-{component}-dot {
    display: inline-block;
    width: {size}px;
    height: {size}px;
    border-radius: 50%;
    background: {color};
    margin-right: {gap}px;
    flex-shrink: 0;
    vertical-align: middle;
  }
参数:
  - size: number (6-16, 默认8)
  - color: CSS 变量 (默认 var(--wemd-primary))
  - gap: number (4-12, 默认6)
场景: 列表标记、状态指示器、标题装饰
```

**`badge-pill` — 药丸标记**

```
HTML 模板:
  <span class="wemd-{component}-pill">{text}</span>
CSS 模板:
  .wemd-{component}[data-variant="{variant}"] .wemd-{component}-pill {
    display: inline-block;
    padding: {paddingY}px {paddingX}px;
    background: {color};
    color: #fff;
    border-radius: 999px;
    font-size: {fontSize}px;
    font-weight: {weight};
    line-height: 1.2;
    margin-right: {gap}px;
    vertical-align: middle;
  }
参数:
  - text: string (标签文字)
  - color: CSS 变量 (默认 var(--wemd-accent))
  - paddingX: number (8-20, 默认12)
  - paddingY: number (2-8, 默认4)
  - fontSize: number (11-16, 默认13)
  - weight: string ("400" | "600" | "700", 默认"600")
  - gap: number (4-12, 默认6)
场景: 标签、分类标记、促销标记
```

---

#### Pattern 类（背景纹理）

**`pattern-dot` — 点阵**

```
CSS 模板:
  .wemd-{component}[data-variant="{variant}"] {
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='{size}' height='{size}'%3E%3Ccircle cx='{sizeHalf}' cy='{sizeHalf}' r='{dotRadius}' fill='{color}' opacity='{opacity}'/%3E%3C/svg%3E");
    background-repeat: repeat;
  }
参数:
  - size: number (12-40, 默认20)
  - sizeHalf: internal (size/2)
  - dotRadius: number (1-4, 默认2)
  - color: CSS 变量 (默认 var(--wemd-primary))
  - opacity: number (0.02-0.15, 默认0.06)
场景: 卡片、背景区域微纹理
```

**`pattern-grid` — 网格**

```
CSS 模板:
  .wemd-{component}[data-variant="{variant}"] {
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='{size}' height='{size}'%3E%3Crect width='{size}' height='{size}' fill='none' stroke='{color}' stroke-width='{strokeWidth}' opacity='{opacity}'/%3E%3C/svg%3E");
    background-repeat: repeat;
  }
参数:
  - size: number (16-48, 默认24)
  - color: CSS 变量 (默认 var(--wemd-primary))
  - strokeWidth: number (0.5-2, 默认1)
  - opacity: number (0.02-0.12, 默认0.05)
场景: 科技感背景、卡片纹理
```

**`pattern-hexagon` — 六边形**

```
CSS 模板:
  .wemd-{component}[data-variant="{variant}"] {
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='{size}' height='{size}' viewBox='0 0 24 24'%3E%3Cpolygon points='12 2,22 7,22 17,12 22,2 17,2 7' fill='none' stroke='{color}' stroke-width='{strokeWidth}' opacity='{opacity}'/%3E%3C/svg%3E");
    background-repeat: repeat;
  }
参数:
  - size: number (20-60, 默认32)
  - color: CSS 变量 (默认 var(--wemd-primary))
  - strokeWidth: number (0.5-2, 默认1)
  - opacity: number (0.02-0.12, 默认0.05)
场景: 科技、创新类品牌背景
```

---

#### Icon 类

**`icon-emoji` — Emoji 图标**

```
HTML 模板:
  <span class="wemd-{component}-icon">{emoji}</span>
CSS 模板:
  .wemd-{component}[data-variant="{variant}"] .wemd-{component}-icon {
    display: inline;
    font-size: {size}px;
    margin-right: {gap}px;
    vertical-align: middle;
  }
参数:
  - emoji: string (如 "🚀")
  - size: number (14-48, 默认24)
  - gap: number (4-12, 默认6)
场景: 标题、列表、引用的装饰图标
```

**`icon-arrow` — 箭头**

```
HTML 模板:
  <span class="wemd-{component}-icon">→</span>
CSS 模板:
  .wemd-{component}[data-variant="{variant}"] .wemd-{component}-icon {
    display: inline;
    font-size: {size}px;
    color: {color};
    margin-right: {gap}px;
    vertical-align: middle;
  }
参数:
  - size: number (12-32, 默认18)
  - color: CSS 变量 (默认 var(--wemd-primary))
  - gap: number (4-12, 默认6)
场景: 列表项、导航、CTA 按钮
```

**`icon-star` — 星星**

```
HTML 模板:
  <span class="wemd-{component}-icon">★</span>
CSS 模板:
  .wemd-{component}[data-variant="{variant}"] .wemd-{component}-icon {
    display: inline;
    font-size: {size}px;
    color: {color};
    margin-right: {gap}px;
    vertical-align: middle;
  }
参数:
  - size: number (12-32, 默认18)
  - color: CSS 变量 (默认 var(--wemd-accent))
  - gap: number (4-12, 默认6)
场景: 评分、推荐、高亮内容
```

**`icon-quote` — 引号**

```
HTML 模板:
  <span class="wemd-{component}-quote">{quoteChar}</span>
CSS 模板:
  .wemd-{component}[data-variant="{variant}"] .wemd-{component}-quote {
    display: block;
    font-size: {size}px;
    color: {color};
    line-height: 1;
    opacity: {opacity};
    font-family: {fontFamily};
    margin-bottom: {gap}px;
  }
参数:
  - quoteChar: string ("\"" | "'" | "「" | "『", 默认"\"")
  - size: number (32-80, 默认48)
  - color: CSS 变量 (默认 var(--wemd-primary))
  - opacity: number (0.1-0.4, 默认0.2)
  - gap: number (4-16, 默认8)
  - fontFamily: string ("Georgia, serif" 等, 默认"Georgia, serif")
场景: 引用块、客户评价、推荐语
```

---

#### Corner 类

**`corner-rounded` — 圆角**

```
CSS 模板:
  .wemd-{component}[data-variant="{variant}"] {
    border-radius: {radius}px;
  }
参数:
  - radius: number (8-24, 默认12)
场景: 卡片、引用块、图片容器
```

**`corner-soft` — 柔和圆角**

```
CSS 模板:
  .wemd-{component}[data-variant="{variant}"] {
    border-radius: 4px;
  }
参数:
  - 无参数（固定值4px）
场景: 商务、专业风格的卡片和按钮
```

**`corner-pill` — 药丸圆角**

```
CSS 模板:
  .wemd-{component}[data-variant="{variant}"] {
    border-radius: 999px;
  }
参数:
  - 无参数（固定值999px，完全圆角）
场景: 标签、年轻化卡片、促销标记
```

**`corner-square` — 直角**

```
CSS 模板:
  .wemd-{component}[data-variant="{variant}"] {
    border-radius: 0;
  }
参数:
  - 无参数
场景: 极简风格、硬朗设计
```

---

#### Divider 类

**`divider-solid` — 实线分隔**

```
CSS 模板:
  .wemd-{component}[data-variant="{variant}"] {
    border-top: {width}px solid {color};
    margin: {marginY}px 0;
  }
参数:
  - width: number (1-4, 默认1)
  - color: CSS 变量 (默认 var(--wemd-border))
  - marginY: number (8-32, 默认16)
场景: 段落分隔、章节分隔
```

**`divider-gradient` — 渐变线分隔**

```
CSS 模板:
  .wemd-{component}[data-variant="{variant}"] {
    height: {width}px;
    background: linear-gradient(to right, transparent, {color}, transparent);
    margin: {marginY}px 0;
    border: none;
  }
参数:
  - width: number (1-4, 默认2)
  - color: CSS 变量 (默认 var(--wemd-primary))
  - marginY: number (8-32, 默认16)
场景: 品牌感强的章节分隔
```

**`divider-wave` — 波形分隔**

```
HTML 模板:
  <div class="wemd-{component}-wave"></div>
CSS 模板:
  .wemd-{component}[data-variant="{variant}"] .wemd-{component}-wave {
    height: {height}px;
    background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 24'%3E%3Cpath d='M0,12 Q30,0 60,12 T120,12 T180,12 T240,12 T300,12 T360,12 T420,12 T480,12 T540,12 T600,12 T660,12 T720,12 T780,12 T840,12 T900,12 T960,12 T1020,12 T1080,12 T1140,12 T1200,12' fill='none' stroke='{color}' stroke-width='{strokeWidth}' opacity='{opacity}'/%3E%3C/svg%3E") repeat-x;
    background-size: {svgWidth}px {height}px;
    margin: {marginY}px 0;
  }
参数:
  - height: number (12-32, 默认20)
  - color: CSS 变量 (默认 var(--wemd-primary))
  - strokeWidth: number (1-3, 默认2)
  - opacity: number (0.2-0.6, 默认0.4)
  - svgWidth: number (600-1200, 默认1200)
  - marginY: number (8-32, 默认16)
场景: 创意、年轻品牌的分隔
```

**`divider-icon` — 图标线分隔**

```
HTML 模板:
  <div class="wemd-{component}-divider-icon">
    <span class="wemd-{component}-divider-line"></span>
    <span class="wemd-{component}-divider-char">{icon}</span>
    <span class="wemd-{component}-divider-line"></span>
  </div>
CSS 模板:
  .wemd-{component}[data-variant="{variant}"] .wemd-{component}-divider-icon {
    display: flex;
    align-items: center;
    gap: {gap}px;
    margin: {marginY}px 0;
  }
  .wemd-{component}[data-variant="{variant}"] .wemd-{component}-divider-line {
    flex: 1;
    height: {width}px;
    background: {color};
    opacity: {opacity};
  }
  .wemd-{component}[data-variant="{variant}"] .wemd-{component}-divider-char {
    font-size: {iconSize}px;
    color: {color};
    opacity: {opacity};
    flex-shrink: 0;
  }
参数:
  - icon: string (如 "★"、"◆"、"•")
  - width: number (1-3, 默认1)
  - color: CSS 变量 (默认 var(--wemd-border))
  - opacity: number (0.3-0.8, 默认0.5)
  - gap: number (8-20, 默认12)
  - iconSize: number (12-24, 默认14)
  - marginY: number (8-32, 默认16)
场景: 装饰性章节分隔
```

---

#### Background 类

**`bg-gradient` — 渐变背景**

```
CSS 模板:
  .wemd-{component}[data-variant="{variant}"] {
    background: linear-gradient({angle}, {color1}, {color2});
  }
参数:
  - angle: string (如 "135deg", "to right", "to bottom")
  - color1: CSS 变量 (默认 var(--wemd-primary))
  - color2: CSS 变量 (默认 var(--wemd-primary-dark))
场景: 横幅、CTA、标题背景
```

**`bg-solid` — 纯色背景**

```
CSS 模板:
  .wemd-{component}[data-variant="{variant}"] {
    background: {color};
  }
参数:
  - color: CSS 变量 (默认 var(--wemd-bgCard))
场景: 卡片、代码块、引用背景
```

**`bg-soft` — 柔和背景**

```
CSS 模板:
  .wemd-{component}[data-variant="{variant}"] {
    background: {color};
    opacity: {opacity};
  }
参数:
  - color: CSS 变量 (默认 var(--wemd-primary))
  - opacity: number (0.03-0.1, 默认0.05)
场景: 弱化背景、区分区域
```

**`bg-card` — 卡片背景**

```
CSS 模板:
  .wemd-{component}[data-variant="{variant}"] {
    background: {bgColor};
    border: {borderWidth}px solid {borderColor};
    border-radius: {radius}px;
    padding: {padding}px;
  }
参数:
  - bgColor: CSS 变量 (默认 var(--wemd-bgCard))
  - borderColor: CSS 变量 (默认 var(--wemd-border))
  - borderWidth: number (0-2, 默认1)
  - radius: number (0-16, 默认8)
  - padding: number (12-32, 默认20)
场景: 卡片、引用块、代码块
```

---

## 与现有架构的对比

| 维度     | 旧方案（AI 写 CSS）    | 新方案（Decoration Library） |
| -------- | ---------------------- | ---------------------------- |
| AI 角色  | 设计师 + 画师          | 设计师（选择组合）           |
| CSS 质量 | 不稳定，每次不同       | 确定，模板保证               |
| 品牌约束 | 靠 AI 自觉遵守         | 硬性过滤（只显示允许的原子） |
| 伪元素   | 依赖转换器兜底         | 根本不会出现                 |
| 迭代成本 | 改 CSS 要重跑整个流程  | 改组合即可                   |
| 组合空间 | 无限（但质量不稳定）   | 有限但足够大（几万种组合）   |
| 学习成本 | 低（AI 自由发挥）      | 需理解原子系统               |
| 维护成本 | 高（每次都可能出 bug） | 低（模板稳定）               |

---

## 迁移路径

### 阶段 1（当前）

- 编写 Decoration Library 规范 ✅（本文件）
- 删除伪元素转换器及相关代码
- 更新所有文档

### 阶段 2（近期）

- 实现 P0 装饰原子的 CSS 模板映射
- 在 Application Layer 中实现 Decoration Plan → CSS 的映射器
- 修改 Logic Layer 输出中加入 Decoration Plan

### 阶段 3（中期）

- 实现 P1 装饰原子
- 实现品牌关键词 → 原子过滤的逻辑
- 实现阅读体验 → 装饰密度映射

### 阶段 4（远期）

- 实现 P2 装饰原子
- 全局替换：修改原子定义即可更新所有主题
- 视觉回归测试

---

## 映射引擎设计

映射引擎是 Decoration Layer 的核心组件，负责将 Decoration Plan 转换为实际的 CSS 和 HTML 代码。

### 架构概览

```
Decoration Plan (YAML)
        │
        ▼
┌─ 映射引擎 ──────────────────────────────────────────┐
│                                                       │
│  ① 原子解析器：解析每个原子的 id + params             │
│  ② 模板查找器：从注册表中查找对应的 CSS/HTML 模板     │
│  ③ 参数替换器：将 params 替换模板占位符                │
│  ④ 选择器计算器：生成 {component} + {variant} 选择器  │
│  ⑤ HTML 注入器：将 HTML 装饰元素注入组件模板           │
│  ⑥ CSS 组合器：合并所有原子的 CSS 输出                 │
│                                                       │
└───────────────────────┬───────────────────────────────┘
                        │
                        ▼
              完整 variantCss + 组件 HTML
```

### 类型定义

```typescript
// 映射引擎核心类型

/** 单个装饰原子的参数 */
interface AtomParams {
  [key: string]: string | number;
}

/** Decoration Plan 中的单个原子 */
interface DecorationAtom {
  id: string; // 原子 ID，如 "line-left", "badge-number"
  params: AtomParams;
}

/** 组件装饰方案 */
interface ComponentDecoration {
  variant: string;
  atoms: DecorationAtom[];
}

/** 完整 Decoration Plan */
interface DecorationPlan {
  brandFilter: {
    keywords: string[];
    allowedAtoms: string[];
    density: "low" | "medium" | "high";
  };
  components: Record<string, ComponentDecoration>;
}

/** CSS 模板定义 */
interface CssTemplate {
  type: "css" | "css+html"; // 是否包含 HTML 模板
  css: string; // CSS 模板，含 {param} 占位符
  html?: string; // HTML 模板，含 {param} 占位符
  params: Record<string, ParamDef>;
  selector?: string; // 选择器模板，默认 .wemd-{component}[data-variant="{variant}"]
}

/** 参数定义 */
interface ParamDef {
  type: "number" | "string" | "enum";
  default: string | number;
  min?: number;
  max?: number;
  values?: string[]; // enum 类型的可选值
}
```

### 模板注册表

```typescript
/** 原子注册表：id → CssTemplate */
const atomRegistry: Record<string, CssTemplate> = {
  "line-left": {
    type: "css",
    css: `.wemd-{component}[data-variant="{variant}"] {\n  border-left: {width}px solid {color};\n  padding-left: {gap}px;\n}`,
    params: {
      width: { type: "number", default: 4, min: 2, max: 6 },
      color: { type: "string", default: "var(--wemd-primary)" },
      gap: { type: "number", default: 12, min: 8, max: 20 },
    },
  },
  "badge-number": {
    type: "css+html",
    html: `<span class="wemd-{component}-badge">{number}</span>`,
    css: `.wemd-{component}[data-variant="{variant}"] .wemd-{component}-badge {\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  width: {size}px;\n  height: {size}px;\n  background: {color};\n  color: #fff;\n  border-radius: {radius}px;\n  font-size: {fontSize}px;\n  font-weight: 700;\n  margin-right: {gap}px;\n  flex-shrink: 0;\n}`,
    params: {
      number: { type: "string", default: "01" },
      size: { type: "number", default: 28, min: 20, max: 40 },
      color: { type: "string", default: "var(--wemd-primary)" },
      radius: { type: "number", default: 6, min: 4, max: 999 },
      fontSize: { type: "number", default: 14, min: 12, max: 18 },
      gap: { type: "number", default: 8, min: 4, max: 16 },
    },
  },
  // ... 其他 P0 原子的注册
};
```

### 核心映射流程

```typescript
class DecorationMapper {
  // 注册表
  private registry = atomRegistry;

  /** 主入口：将 Decoration Plan 映射为 CSS + HTML */
  map(plan: DecorationPlan): MapResult {
    const result: MapResult = { css: {}, html: {} };

    for (const [componentName, decoration] of Object.entries(plan.components)) {
      let combinedCss = "";
      let combinedHtml = "";

      for (const atom of decoration.atoms) {
        const template = this.registry[atom.id];
        if (!template) continue;

        // 1. 参数合并：用户参数 + 默认值
        const mergedParams = this.mergeParams(template.params, atom.params);

        // 2. 选择器计算
        const selector = this.resolveSelector(
          template.selector,
          componentName,
          decoration.variant,
        );

        // 3. CSS 模板替换
        const css = this.replaceParams(template.css, {
          ...mergedParams,
          component: componentName,
          variant: decoration.variant,
        });
        combinedCss += `${selector} ${css}\n\n`;

        // 4. HTML 模板替换
        if (template.html) {
          const html = this.replaceParams(template.html, {
            ...mergedParams,
            component: componentName,
            variant: decoration.variant,
          });
          combinedHtml += html + "\n";
        }
      }

      result.css[componentName] = combinedCss.trim();
      result.html[componentName] = combinedHtml.trim();
    }

    return result;
  }

  /** 参数合并：用户参数覆盖默认值 */
  private mergeParams(
    defs: Record<string, ParamDef>,
    userParams: AtomParams,
  ): Record<string, string | number> {
    const merged: Record<string, string | number> = {};
    for (const [key, def] of Object.entries(defs)) {
      merged[key] = userParams[key] ?? def.default;
    }
    return merged;
  }

  /** 选择器解析 */
  private resolveSelector(
    templateSelector: string | undefined,
    component: string,
    variant: string,
  ): string {
    if (templateSelector) {
      return this.replaceParams(templateSelector, { component, variant });
    }
    return `.wemd-${component}[data-variant="${variant}"]`;
  }

  /** 占位符替换 */
  private replaceParams(
    template: string,
    params: Record<string, string | number>,
  ): string {
    let result = template;
    for (const [key, value] of Object.entries(params)) {
      result = result.replace(new RegExp(`\\{${key}\\}`, "g"), String(value));
    }
    return result;
  }
}
```

### 映射结果格式

```typescript
interface MapResult {
  css: Record<string, string>; // componentName → 完整 CSS
  html: Record<string, string>; // componentName → 装饰 HTML
}
```

### 参数验证

映射引擎在参数合并时执行验证：

| 验证类型 | 规则                            | 处理方式                   |
| -------- | ------------------------------- | -------------------------- |
| 类型检查 | number 参数必须为数字           | 不符合则回退到默认值       |
| 范围检查 | number 参数必须在 [min, max] 内 | 超限则截断到边界值         |
| 枚举检查 | enum 参数必须在 values 列表中   | 不符合则回退到默认值       |
| 必填检查 | 无默认值的参数必须提供          | 缺少则抛出警告并跳过该原子 |

---

## 品牌过滤引擎设计

品牌过滤引擎负责根据品牌关键词过滤可用装饰原子，确保设计符合品牌调性。

### 架构概览

```
品牌关键词 ["科技", "创新", "年轻"]
        │
        ▼
┌─ 品牌过滤引擎 ──────────────────────────────────────┐
│                                                       │
│  ① 关键词 → 原子映射表查找                             │
│  ② 取并集：多关键词的原子列表合并                       │
│  ③ 硬性过滤：品牌特定约束（如"只能用六边形"）           │
│  ④ 密度计算：阅读体验 → 装饰密度                       │
│  ⑤ 输出：allowedAtoms + density                        │
│                                                       │
└───────────────────────┬───────────────────────────────┘
                        │
                        ▼
          AllowedAtoms 列表 + 密度级别
```

### 类型定义

```typescript
/** 品牌过滤引擎 */
interface BrandFilterEngine {
  /** 输入：品牌关键词列表 */
  evaluate(keywords: string[], options?: BrandFilterOptions): BrandFilterResult;
}

interface BrandFilterOptions {
  hardFilter?: {
    keyword: string; // 特定关键词
    onlyAtoms: string[]; // 仅允许这些原子
  }[];
  densityOverride?: "low" | "medium" | "high";
}

interface BrandFilterResult {
  allowedAtoms: string[]; // 允许的原子 ID 列表
  density: "low" | "medium" | "high";
  atomCount: {
    line: number;
    badge: number;
    pattern: number;
    icon: number;
    corner: number;
    divider: number;
    background: number;
    marker: number;
  };
}
```

### 映射表实现

```typescript
/** 关键词 → 原子映射表 */
const keywordAtomMap: Record<string, string[]> = {
  专业: [
    "line-left",
    "line-gradient",
    "badge-number",
    "badge-stroke",
    "pattern-grid",
    "pattern-dot",
    "icon-arrow",
    "icon-check",
    "corner-square",
    "corner-soft",
    "divider-solid",
    "divider-gradient",
  ],
  科技: [
    "line-gradient",
    "line-double",
    "badge-glow",
    "badge-number",
    "pattern-grid",
    "pattern-hexagon",
    "icon-arrow",
    "icon-chevron",
    "corner-soft",
    "corner-square",
    "divider-gradient",
    "divider-wave",
  ],
  年轻: [
    "line-dashed",
    "line-diagonal",
    "badge-pill",
    "badge-icon",
    "pattern-dot",
    "pattern-cross",
    "pattern-zigzag",
    "icon-emoji",
    "icon-star",
    "icon-heart",
    "corner-pill",
    "corner-rounded",
    "divider-dashed",
    "divider-icon",
  ],
  // ... 其他关键词
};
```

### 过滤引擎实现

```typescript
class BrandFilterEngineImpl implements BrandFilterEngine {
  private keywordMap = keywordAtomMap;

  evaluate(
    keywords: string[],
    options?: BrandFilterOptions,
  ): BrandFilterResult {
    // 1. 取并集：多关键词的原子列表合并
    const unionSet = new Set<string>();
    for (const kw of keywords) {
      const atoms = this.keywordMap[kw] || [];
      for (const atom of atoms) {
        unionSet.add(atom);
      }
    }

    // 2. 硬性过滤
    let allowed = Array.from(unionSet);
    if (options?.hardFilter) {
      for (const rule of options.hardFilter) {
        if (keywords.includes(rule.keyword)) {
          allowed = allowed.filter((a) => rule.onlyAtoms.includes(a));
        }
      }
    }

    // 3. 补充跨类别基础原子（确保基本功能可用）
    const baseAtoms = [
      "corner-soft",
      "corner-square",
      "corner-rounded",
      "divider-solid",
      "bg-solid",
      "bg-soft",
    ];
    for (const base of baseAtoms) {
      if (!allowed.includes(base)) {
        allowed.push(base);
      }
    }

    // 4. 分类统计
    const atomCount = this.countByCategory(allowed);

    // 5. 密度计算
    const density =
      options?.densityOverride ?? this.calcDensity(keywords, allowed.length);

    return { allowedAtoms: allowed, density, atomCount };
  }

  /** 按类别统计原子数 */
  private countByCategory(atoms: string[]): BrandFilterResult["atomCount"] {
    const categories = [
      "line",
      "badge",
      "pattern",
      "icon",
      "corner",
      "divider",
      "background",
      "marker",
    ];
    const count: Record<string, number> = {};
    for (const cat of categories) count[cat] = 0;

    for (const atom of atoms) {
      const prefix = atom.split("-")[0];
      if (count[prefix] !== undefined) count[prefix]++;
    }
    return count as BrandFilterResult["atomCount"];
  }

  /** 密度计算：根据关键词数量和可用原子总数 */
  private calcDensity(
    keywords: string[],
    totalAtoms: number,
  ): "low" | "medium" | "high" {
    if (keywords.length >= 3 && totalAtoms > 20) return "high";
    if (keywords.length >= 2 && totalAtoms > 12) return "medium";
    return "low";
  }
}
```

### 阅读体验 → 装饰密度映射

| 阅读体验                 | 密度   | 每个组件最大原子数 | 说明                 |
| ------------------------ | ------ | ------------------ | -------------------- |
| 快节奏（快读、标题列表） | low    | ≤ 2                | 减少装饰，防止干扰   |
| 中等节奏（标准文章）     | medium | ≤ 3                | 平衡装饰与内容       |
| 慢节奏（深度阅读）       | high   | ≤ 4                | 允许更多装饰增强体验 |

---

## 组合校验器设计

组合校验器负责验证装饰原子组合是否符合约束规则，在设计阶段提前发现冲突。

### 架构概览

```
Decoration Plan (组件级原子组合)
        │
        ▼
┌─ 组合校验器 ────────────────────────────────────────┐
│                                                       │
│  ① 位置冲突检测：同一位置是否叠加了多个原子             │
│  ② 背景互斥检测：bg-solid/bg-gradient/bg-pattern 冲突  │
│  ③ 数量限制检测：装饰原子总数是否超限                  │
│  ④ Badge 独占检测：一个组件是否只有 1 个 Badge         │
│  ⑤ Corner-Border 冲突检测                            │
│  ⑥ 输出：校验结果 (通过/警告/错误)                    │
│                                                       │
└───────────────────────┬───────────────────────────────┘
                        │
              通过 → 进入映射阶段
              警告 → 允许但记录
              错误 → 要求 AI 重新选择
```

### 类型定义

```typescript
/** 校验结果 */
interface ValidationResult {
  passed: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  summary: string;
}

interface ValidationError {
  code: string; // 如 "POSITION_CONFLICT"
  component: string;
  message: string;
  atoms: string[]; // 冲突的原子 ID
}

interface ValidationWarning {
  code: string; // 如 "DENSITY_HIGH"
  component: string;
  message: string;
  suggestedAction?: string;
}
```

### 位置冲突检测

每个原子占据一个或多个"位置槽位"。同一槽位不能有多个原子。

```typescript
/** 位置槽位定义 */
const POSITION_SLOTS: Record<string, string[]> = {
  // 原子 ID → 占据的槽位
  "line-left": ["border-left"],
  "line-top": ["border-top"],
  "line-bottom": ["border-bottom"],
  "line-underline": ["underline"],
  "line-double": ["border-top", "border-bottom"],
  "line-diagonal": ["corner-top-left"],
  "line-gradient": ["border-left"],
  "line-dashed": ["border-left"],
  "badge-number": ["badge"],
  "badge-dot": ["badge"],
  "badge-icon": ["badge"],
  "badge-tag": ["badge"],
  "badge-pill": ["badge"],
  "badge-corner": ["badge", "corner-top-right"],
  "badge-ribbon": ["badge", "ribbon"],
  "badge-circle": ["badge"],
  "badge-stroke": ["badge"],
  "badge-glow": ["badge"],
  "corner-rounded": ["corner"],
  "corner-square": ["corner"],
  "corner-pill": ["corner"],
  "corner-fold": ["corner", "corner-top-right"],
  "corner-notch": ["corner"],
  "corner-round-left": ["corner-left"],
  "corner-round-right": ["corner-right"],
  "corner-soft": ["corner"],
  "bg-solid": ["background"],
  "bg-gradient": ["background"],
  "bg-gradient-radial": ["background"],
  "bg-pattern": ["background"],
  "bg-soft": ["background"],
  "bg-card": ["background"],
};

/** 位置冲突检测 */
function detectPositionConflicts(atoms: string[]): string[][] {
  const occupied = new Map<string, string[]>();
  const conflicts: string[][] = [];

  for (const atomId of atoms) {
    const slots = POSITION_SLOTS[atomId] || [];
    for (const slot of slots) {
      if (occupied.has(slot)) {
        // 冲突：该槽位已被占据
        conflicts.push([occupied.get(slot)![0], atomId, slot]);
      } else {
        occupied.set(slot, [atomId]);
      }
    }
  }

  return conflicts;
}
```

### 背景互斥检测

```typescript
/** 背景互斥原子组 */
const BACKGROUND_ATOMS = new Set([
  "bg-solid",
  "bg-gradient",
  "bg-gradient-radial",
  "bg-pattern",
  "bg-soft",
  "bg-card",
]);

/** 纹理叠加原子组（可与背景共存） */
const PATTERN_ATOMS = new Set([
  "pattern-dot",
  "pattern-grid",
  "pattern-hexagon",
  "pattern-stripe",
  "pattern-wave",
  "pattern-cross",
  "pattern-triangle",
  "pattern-zigzag",
  "pattern-houndstooth",
  "pattern-plaid",
  "pattern-mountain",
  "pattern-circle",
  "pattern-line-h",
  "pattern-line-v",
  "pattern-noise",
]);

/** 背景互斥检测 */
function detectBackgroundConflict(atoms: string[]): string[] {
  const bgAtoms = atoms.filter((a) => BACKGROUND_ATOMS.has(a));
  if (bgAtoms.length > 1) {
    return bgAtoms; // 多个背景原子冲突
  }
  return [];
}
```

### 组合校验器完整实现

```typescript
class CombinationValidator {
  private densityMap: Record<string, number> = {
    low: 2,
    medium: 3,
    high: 4,
  };

  /** 主入口：校验组件级的原子组合 */
  validate(
    component: string,
    atoms: DecorationAtom[],
    density: "low" | "medium" | "high",
  ): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const atomIds = atoms.map((a) => a.id);

    // 1. 位置冲突检测
    const positionConflicts = detectPositionConflicts(atomIds);
    for (const [a1, a2, slot] of positionConflicts) {
      errors.push({
        code: "POSITION_CONFLICT",
        component,
        message: `原子 "${a1}" 和 "${a2}" 冲突：都占据 "${slot}" 位置`,
        atoms: [a1, a2],
      });
    }

    // 2. 背景互斥检测
    const bgConflict = detectBackgroundConflict(atomIds);
    if (bgConflict.length > 1) {
      errors.push({
        code: "BACKGROUND_MUTEX",
        component,
        message: `背景原子互斥：${bgConflict.join(", ")} 只能选其一`,
        atoms: bgConflict,
      });
    }

    // 3. 纹理叠加限制
    const patternCount = atomIds.filter((a) => PATTERN_ATOMS.has(a)).length;
    if (patternCount > 1) {
      warnings.push({
        code: "PATTERN_OVERLAY",
        component,
        message: `同一组件纹理叠加超过 1 个（${patternCount} 个），可能导致背景过重`,
        suggestedAction: "考虑只保留 1 个纹理原子",
      });
    }

    // 4. 装饰总数限制（软限制，不含 Background）
    const nonBgAtoms = atomIds.filter((a) => !BACKGROUND_ATOMS.has(a));
    const maxAtoms = this.densityMap[density];
    if (nonBgAtoms.length > maxAtoms) {
      warnings.push({
        code: "ATOM_COUNT_EXCEEDED",
        component,
        message: `装饰原子数 ${nonBgAtoms.length} 超过密度 "${density}" 的推荐限制 ${maxAtoms}，注意视觉平衡`,
        suggestedAction: "考虑减少装饰原子或改用更高密度",
      });
    }

    // 5. Badge 独占检测
    const badgeAtoms = atomIds.filter((a) => a.startsWith("badge-"));
    if (badgeAtoms.length > 1) {
      errors.push({
        code: "BADGE_EXCLUSIVE",
        component,
        message: `Badge 原子独占：${badgeAtoms.join(", ")} 只能选其一`,
        atoms: badgeAtoms,
      });
    }

    // 6. Corner-Border 冲突检测
    const cornerAtoms = atomIds.filter((a) => a.startsWith("corner-"));
    const borderAtoms = atomIds.filter((a) =>
      ["line-left", "line-top", "line-bottom", "line-double"].includes(a),
    );
    // 检查是否有 corner 和 border 定义同一边
    // 简化处理：corner 和 left/top/bottom 线共存时发出警告
    if (cornerAtoms.length > 0 && borderAtoms.length > 0) {
      warnings.push({
        code: "CORNER_BORDER_OVERLAP",
        component,
        message: `边角原子和线条原子共存，可能造成视觉冲突`,
        suggestedAction: "确认边角和线条定义在不同边，或移除其中一个",
      });
    }

    const passed = errors.length === 0;
    const summary = passed
      ? `✅ 校验通过（${atoms.length} 个原子）`
      : `❌ 校验失败（${errors.length} 个错误，${warnings.length} 个警告）`;

    return { passed, errors, warnings, summary };
  }
}
```

### 校验器在 Pipeline 中的使用

```typescript
// 在 Decoration Layer 中使用
const validator = new CombinationValidator();

function validateDecorationPlan(plan: DecorationPlan): boolean {
  let allPassed = true;

  for (const [component, decoration] of Object.entries(plan.components)) {
    const result = validator.validate(
      component,
      decoration.atoms,
      plan.brandFilter.density,
    );

    if (!result.passed) {
      allPassed = false;
      console.error(`[组合校验] ${component}: ${result.summary}`);
      for (const err of result.errors) {
        console.error(`  ✕ [${err.code}] ${err.message}`);
      }
    }

    // 警告不阻止流程，但记录
    for (const warn of result.warnings) {
      console.warn(`  ⚠ [${warn.code}] ${warn.message}`);
    }
  }

  return allPassed;
}
```

---

## P1/P2 原子模板概要

### P1 原子（13 个，后续迭代实现）

#### Badge 类

**`badge-corner` — 角标**

```
HTML 模板:
  <span class="wemd-{component}-corner">{text}</span>
CSS 模板:
  .wemd-{component}[data-variant="{variant}"] {
    position: relative;
    overflow: hidden;
  }
  .wemd-{component}[data-variant="{variant}"] .wemd-{component}-corner {
    position: absolute;
    top: 0; right: 0;
    padding: {padding}px {padding*2}px;
    background: {color};
    color: #fff;
    font-size: {fontSize}px;
    transform: rotate(45deg) translate({translateX}px, {translateY}px);
  }
参数: text, color, fontSize, padding
场景: 促销标签、新品标记、角标通知
```

**`badge-ribbon` — 缎带**

```
HTML 模板:
  <div class="wemd-{component}-ribbon">
    <span class="wemd-{component}-ribbon-body">{text}</span>
    <span class="wemd-{component}-ribbon-tail"></span>
  </div>
CSS 模板: 通过物理元素 + skewX 变形模拟缎带效果
参数: text, color, fontSize, height
场景: 促销标记、推荐标记、文章分类
```

**`badge-glow` — 发光徽标**

```
CSS 模板:
  .wemd-{component}[data-variant="{variant}"] .wemd-{component}-glow {
    box-shadow: 0 0 {radius}px {spread}px {color};
  }
参数: radius, spread, color
场景: 高亮标记、重要通知、状态指示
```

#### Pattern 类

**`pattern-stripe` — 条纹（斜线）**

```
CSS 模板:
  .wemd-{component}[data-variant="{variant}"] {
    background: repeating-linear-gradient(
      {angle}deg,
      transparent, transparent {gap}px,
      {color} {gap}px, {color} {gap*2}px
    );
  }
参数: angle (45-135), color, gap, opacity
场景: 警示、促销、现代感背景
```

**`pattern-wave` — 波形**

```
CSS 模板: 内联 SVG `<path>` 实现波形平铺
参数: color, opacity, amplitude, frequency
场景: 柔和、治愈、自然风格背景
```

**`pattern-mountain` — 山脉**

```
CSS 模板: 多层 SVG `<path>` 层叠实现山脉轮廓
参数: color1, color2, color3, opacity
场景: 自然、环保、旅行品牌背景
```

#### Icon 类

**`icon-brand` — 品牌图标**

```
HTML 模板:
  <span class="wemd-{component}-brand">
    <img src="var(--wemd-asset-brand-icon)" alt="">
  </span>
CSS 模板: 通过 manifest.assets 注册，使用 var(--wemd-asset-xxx) 引用
参数: size, margin
场景: 品牌签名、页脚、标题
```

**`icon-diamond` — 菱形**

```
HTML 模板: <span class="wemd-{component}-icon">◆</span>
CSS 模板: 类似 icon-star 的 inline 样式
参数: size, color, gap
场景: 高端、奢华品牌装饰
```

**`icon-heart` — 心形**

```
HTML 模板: <span class="wemd-{component}-icon">♥</span>
CSS 模板: 类似 icon-star 的 inline 样式
参数: size, color, gap
场景: 温暖、治愈、情感类内容
```

#### Corner 类

**`corner-fold` — 折角**

```
HTML 模板:
  <span class="wemd-{component}-fold"></span>
CSS 模板: 通过物理 `<span>` + border 三角模拟折角效果
参数: size, color, bgColor
场景: 卡片、图片、便签风格
```

**`corner-notch` — 切角**

```
CSS 模板:
  .wemd-{component}[data-variant="{variant}"] {
    clip-path: polygon({x1}% 0, 100% 0, 100% {y1}%, {x2}% 100%, 0 100%, 0 {y2}%);
  }
参数: x1, y1, x2, y2 (百分比)
场景: 时尚、现代感卡片设计
```

#### Divider 类

**`divider-dashed` — 虚线分隔**

```
CSS 模板:
  .wemd-{component}[data-variant="{variant}"] {
    border-top: {width}px dashed {color};
    margin: {marginY}px 0;
  }
参数: width, color, marginY
场景: 轻量级分隔、分类分隔
```

**`divider-double` — 双线分隔**

```
CSS 模板:
  .wemd-{component}[data-variant="{variant}"] {
    border-top: {width}px solid {color};
    border-bottom: {width}px solid {color};
    height: {gap}px;
    margin: {marginY}px 0;
  }
参数: width, color, gap, marginY
场景: 强调分隔、章节标题
```

---

### P2 原子（远期实现）

P2 原子为使用频率较低的场景提供补充装饰能力。以下列出每个原子的核心模板思路，具体实现时参照 P0 原子的完整标准。

**Badge 类剩余：**

- `badge-tag` — 标签：`<span>` + `background + padding + border-radius`
- `badge-circle` — 圆形序号：`<span>` + `width=height` + `border-radius: 50%`
- `badge-stroke` — 描边徽标：`border + transparent background`

**Pattern 类剩余：**

- `pattern-cross` — 十字：内联 SVG 十字
- `pattern-triangle` — 三角：内联 SVG 三角
- `pattern-zigzag` — 锯齿：`linear-gradient` 叠加
- `pattern-houndstooth` — 千鸟格：内联 SVG 复杂图案
- `pattern-plaid` — 格子：两层 `repeating-linear-gradient` 叠加
- `pattern-circle` — 圆圈：内联 SVG 圆圈阵列
- `pattern-line-h` — 水平线：`repeating-linear-gradient(0deg)`
- `pattern-line-v` — 垂直线：`repeating-linear-gradient(90deg)`
- `pattern-noise` — 噪点：极小 Base64 PNG 或 CSS 渐变近似

**Icon 类剩余：**

- `icon-cross` — 叉号：`<span class="deco-cross">✕</span>`
- `icon-bullet` — 圆点：`<span class="deco-bullet">•</span>`
- `icon-plus` — 加号：`<span class="deco-plus">+</span>`
- `icon-minus` — 减号：`<span class="deco-minus">−</span>`
- `icon-arrow-right` — 右箭头：内联 SVG 箭头
- `icon-arrow-left` — 左箭头：内联 SVG 箭头
- `icon-chevron` — 角标箭头：`›` 或内联 SVG
- `icon-circle` — 空心圆：`<span class="deco-circle-outline">○</span>`
- `icon-hash` — 井号：`<span class="deco-hash">#</span>`
- `icon-at` — @符号：`<span class="deco-at">@</span>`
- `icon-svg-inline` — 内联 SVG：`<span class="deco-icon">{svg}</span>` 或 `background-image`
- `icon-check` — 对勾：`<span class="deco-check">✓</span>`
- `icon-number` — 超大数字：`<span class="deco-number">{num}</span>` + `font-size: 3em; opacity: 0.1`

**Corner 类剩余：**

- `corner-round-left` — 左圆角：`border-radius: {r} 0 0 {r}`
- `corner-round-right` — 右圆角：`border-radius: 0 {r} {r} 0`

**Divider 类剩余：**

- `divider-dotted` — 点线：`border-top: dotted`
- `divider-pattern` — 图案线：内联 SVG 重复图案
- `divider-gradient-icon` — 渐变图标线：渐变线 + 图标
- `divider-thick` — 粗线：`width ≥ 3px`

**Background 类剩余：**

- `bg-gradient-radial` — 径向渐变：`radial-gradient(circle, ...)`
- `bg-pattern` — 纹理背景：`background-image + repeat`

**Marker 类（全部为 P2）：**

- `marker-bullet` — 实心圆点：`<span>•</span>`
- `marker-circle` — 空心圆：`<span>○</span>`
- `marker-check` — 对勾：`<span>✓</span>`
- `marker-star` — 星号：`<span>★</span>`
- `marker-arrow` — 箭头：`<span>→</span>`
- `marker-number` — 数字：`<span>{num}.</span>`

---

## 附录：原子优先级总览

| 优先级 | 原子数 | 覆盖场景     | 实现时间 |
| ------ | ------ | ------------ | -------- |
| P0     | 25     | 80% 装饰场景 | 当前迭代 |
| P1     | 13     | 15% 装饰场景 | 下个迭代 |
| P2     | 45     | 5% 装饰场景  | 远期     |

**P0 原子覆盖的全部场景：**

- 标题装饰（左竖线、底部线、下划线、图标、序号）
- 卡片外观（圆角、背景、边框、纹理）
- 段落分隔（实线、渐变线、波形、图标线）
- 列表标记（圆点、箭头、星星、序号）
- 引用块（引号、左竖线、柔和背景）
- 横幅（渐变背景、纹理叠加、标签）
- 内容分区（背景色、柔和区分、卡片背景）
