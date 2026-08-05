# 企业品牌设计逻辑（Brand Design Logic）

> 适用场景：企业、公司、品牌方
> 核心理念：**品牌约束下的视觉翻译**
> 设计师的角色：把企业已有的品牌语言（Logo、主色、VI、品牌元素）翻译成公众号排版

---

## 逻辑总览

```
品牌已有视觉资产
  │
  ▼
① 理解品牌 DNA
   品牌定位、行业性质、目标受众
   提取品牌资产（Logo、Slogan、辅助图形、文化符号）
   输出：品牌画像
  │
  ▼
② 定义阅读体验
   信息密度、阅读节奏、情绪基调
   基于行业惯例和受众预期
   输出：阅读体验画像
  │
  ▼
③ 品牌表达策略 ★ 核心新增层
   品牌资产 → 公众号语境下的表达规则
   Logo 怎么用、Slogan 放哪里、辅助图形映射哪些组件
   输出：品牌表达策略（无 CSS，纯策略）
  │
  ▼
④ 品牌元素 → 组件表达 ★ 核心新增层
   品牌元素决定组件造型，不是行业决定组件
   Logo 形状→装饰、品牌色→强调色应用、辅助图形→组件背景
   输出：组件表达映射表
  │
  ▼
⑤ 建立视觉语言
   配色体系（从品牌色派生 14 色）
   字体体系（品牌字体或推荐系统字体）
   空间体系（品牌调性决定密度）
   输出：视觉语言规范
  │
  ▼
⑥ 建立布局语言
   行业惯例决定页面结构
   品牌表达策略决定组件排列
   输出：布局策略
  │
  ▼
⑦ 输出 Design Blueprint
   纯策略文档，不含 CSS
   输出：Design Blueprint → Constraint Layer 检查
```

---

## 第一步：理解品牌 DNA

### 输入

- 企业名称（必填）
- 企业 Logo（必填）
- 企业简介 100~300 字（必填）
- 品牌关键词 3~5 个（必填，从 18 词清单选）
- 品牌主色（可选，#HEX 或从 Logo 提取）
- 官网 URL（可选，参考风格和配色）
- Slogan（可选）
- VI 手册（可选，PDF）

### AI 的分析任务：从输入中提取品牌资产

不是简单收集字段，而是从企业简介、Logo、VI 中提取**品牌资产清单**：

```yaml
brandAssets:
  # 核心视觉资产
  logo:
    file: uploaded
    type: svg # svg / png / jpg
    shape: hexagon # Logo 形状特征（圆/方/六边形/文字/图形组合）
    colors: ["#1a56db", "#16a34a"] # Logo 配色
    pattern: geometric # Logo 图形风格（geometric/organic/typographic/abstract）

  # 品牌色彩资产
  primaryColor: "#1a56db" # 品牌主色
  colorPalette: ["#1a56db", "#16a34a", "#f59e0b"] # 品牌色板

  # 品牌文字资产
  slogan: "让数据创造价值"
  brandKeywords: [专业, 科技, 创新, 可信]

  # 辅助图形（从 VI 或 Logo 提取）
  auxiliaryGraphics:
    - pattern: "六边形网格" # Logo 中的几何图形
    - element: "数据流动线条" # 品牌视觉中的重复元素

  # 品牌文化符号
  culturalSymbols:
    - "工业4.0"
    - "智能制造"
```

### 输出：品牌画像

```yaml
brand:
  name: 云帆科技
  industry: 工业自动化软件
  audience: 制造业客户
  positioning: 专业、可靠、高效
  assets:
    logo: uploaded
    primaryColor: "#1a56db"
    slogan: "让数据创造价值"
    graphics: [六边形网格, 数据流动线条]
  keywords: [专业, 科技, 创新, 可信]
```

---

## 第二步：定义阅读体验

### 输入：品牌画像

### 决策维度

| 维度     | 选项                           | 判断依据                                   |
| -------- | ------------------------------ | ------------------------------------------ |
| 阅读节奏 | 快 / 中 / 慢                   | 行业惯例：科技资讯→快，深度分析→慢         |
| 信息密度 | 高 / 中 / 低                   | 受众预期：2C 消费者→低，2B 专业→高         |
| 情绪基调 | 冷静 / 活力 / 温暖 / 严肃      | 品牌定位：科技→冷静，消费→活力，金融→严肃  |
| 视觉重心 | 上重 / 居中 / 分散             | 品牌性格：传统→上重，现代→居中             |
| 叙事方式 | 数据驱动 / 故事驱动 / 观点驱动 | 内容类型：SaaS→数据驱动，品牌故事→故事驱动 |
| 信任感   | 数据优先 / 案例优先 / 权威优先 | 行业：金融→权威，科技→数据                 |

### 输出：阅读体验画像

```yaml
readingExperience:
  rhythm: medium # 快/中/慢
  density: high # 高/中/低
  emotion: calm # 冷静/活力/温暖/严肃
  visualWeight: top-heavy # 上重/居中/分散
  narrative: data-first # 数据驱动/故事驱动/观点驱动
  trust: data-first # 数据优先/案例优先/权威优先
  whitespace: compact # 紧凑/适中/宽松
```

---

## 第三步：品牌表达策略 ★ 核心新增层

### 这层回答的问题

> **品牌到底应该怎样出现在公众号里？**

不是"品牌用什么颜色"，而是"品牌元素在公众号阅读场景下，应该以什么形式、什么频率、什么强度出现"。

### 输入：品牌画像（含品牌资产）

### 输出：品牌表达策略

```yaml
brandExpression:
  # ═══════════════════════════════════════
  # Logo 表达策略
  # ═══════════════════════════════════════
  logo:
    frequency: "low" # 出现频率：high/medium/low
    positions: # 允许出现的位置
      - hero-banner # 开篇品牌展示
      - author-card # 作者/品牌信息
      - copyright-notice # 版权声明
    avoid: # 禁止出现的位置
      - section-divider # 分割线不放 Logo
      - tag-label # 标签不放 Logo
    size: medium # 尺寸：large/medium/small
    opacity: 1.0 # 透明度：1.0（实心）
    placement: "hero-banner 右上角，copyright-notice 居中"

  # ═══════════════════════════════════════
  # Slogan 表达策略
  # ═══════════════════════════════════════
  slogan:
    frequency: "medium" # 出现频率：high/medium/low
    positions:
      - hero-banner # 开篇展示
      - end-card # 结尾收尾
      - copyright-notice # 品牌强化
    avoid:
      - section-divider # 分割线不展示 Slogan
      - stats-block # 数据卡片不展示 Slogan
    style: "作为标题下方副标题，字号 14px，半透明"

  # ═══════════════════════════════════════
  # 辅助图形表达策略 ★
  # ═══════════════════════════════════════
  auxiliaryGraphics:
    - graphic: "六边形网格" # 品牌辅助图形
      usage: "background" # 用途：background/border/decoration/icon
      positions: # 引用的组件
        - hero-banner: "背景装饰"
        - section-divider: "分割线纹理"
        - section-title: "标题装饰"
      avoid:
        - code-frame
        - styled-table
      style: "半透明，作为背景纹理，不干扰文字阅读"

    - graphic: "数据流动线条"
      usage: "decoration"
      positions:
        - hero-banner: "底部波形装饰"
        - stats-block: "数字卡片背景"
        - callout-pro: "左侧装饰条"
      style: "用 SVG 内联，#1a56db 30% 透明度"

  # ═══════════════════════════════════════
  # 品牌关键词表达策略 ★
  # ═══════════════════════════════════════
  keywords:
    "专业":
      expression: "克制排版、小圆角、标准字重"
      affectComponents: [所有组件]
    "科技":
      expression: "蓝色渐变、几何装饰、等宽字体点缀"
      affectComponents: [hero-banner, stats-block, callout-pro]
    "创新":
      expression: "非常规布局、对比配色"
      affectComponents: [cta-card, section-title]
    "可信":
      expression: "清晰信息层级、标准间距、低对比度"
      affectComponents: [styled-table, callout-pro]

  # ═══════════════════════════════════════
  # 品牌元素重复利用策略
  # ═══════════════════════════════════════
  reuseStrategy:
    - element: "六边形"
      reuseIn:
        - section-title: "标题左侧六边形图标"
        - timeline: "时间线节点改为六边形"
        - image-card: "图片圆角改为六边形裁切"
        - divider: "六边形纹理"
    - element: "数据流动线条"
      reuseIn:
        - hero-banner: "背景波形"
        - section-divider: "波浪分割线"
        - stats-block: "数字之间的连接线"

  # ═══════════════════════════════════════
  # 品牌色使用策略
  # ═══════════════════════════════════════
  colorUsage:
    primary: "CTA、链接、强调色、标题"
    secondary: "辅助信息、次要强调"
    accent: "极少出现，仅用于特别重要的标记"
    background: "纯白，保持专业感"
```

### 设计规则

- 品牌表达策略**不包含任何 CSS**，只包含策略性描述
- 策略决定了后续所有设计决策的方向
- 策略是"品牌翻译"的结果——把品牌语言翻译成公众号语境下的表达规则
- 例如：腾讯的 Logo 不能到处放，苹果的 Logo 极少出现——这些是品牌策略，不是设计选择

---

## 第四步：品牌元素 → 组件表达 ★ 核心新增层

### 这层回答的问题

> **品牌的每个元素，应该通过哪个 WeMD 组件来表达？**

不是"科技行业用 stats-block"，而是"六边形 Logo 形状可以映射到 timeline 节点、divider 纹理、section-title 图标"。

### 输入：品牌表达策略 + 品牌资产

### 输出：组件表达映射表

```yaml
componentExpression:
  # ═══════════════════════════════════════
  # Logo 形状 → 组件映射
  # ═══════════════════════════════════════
  logoShape:
    shape: "六边形"
    mapping:
      - component: "section-title"
        expression: "标题左侧六边形图标，12px，品牌色填充"
      - component: "timeline"
        expression: "时间线节点改为六边形，8px，品牌色边框"
      - component: "section-divider"
        expression: "六边形纹理作为分割线装饰"
      - component: "image-card"
        expression: "图片四角六边形裁切（可选）"
      - component: "tag-label"
        expression: "标签左侧六边形小标记"

  # ═══════════════════════════════════════
  # 品牌色 → 组件应用
  # ═══════════════════════════════════════
  brandColor:
    primary: "#1a56db"
    mapping:
      - component: "hero-banner"
        expression: "背景渐变（primary → primaryDark），按钮 primary"
      - component: "callout-pro"
        expression: "左侧边框 primary 4px，背景 primaryLight"
      - component: "stats-block"
        expression: "数字值 primary 色，28px 800字重"
      - component: "cta-card"
        expression: "按钮背景 primary，hover primaryDark"
      - component: "section-title"
        expression: "装饰条 primary 色"
      - component: "tag-label"
        expression: "primary 标签，primaryLight 背景"
    secondary: "#16a34a"
    mapping:
      - component: "styled-table"
        expression: "表头背景 secondary 10% 透明度"
      - component: "callout-pro"
        expression: "成功提示场景使用 secondary 色"

  # ═══════════════════════════════════════
  # 辅助图形 → 组件装饰
  # ═══════════════════════════════════════
  auxiliaryGraphics:
    - graphic: "六边形网格"
      mapping:
        - component: "hero-banner"
          expression: "背景半透明六边形网格纹理"
        - component: "section-divider"
          expression: "六边形网格作为分割线图案"
        - component: "copyright-notice"
          expression: "底部六边形网格水印"
    - graphic: "数据流动线条"
      mapping:
        - component: "hero-banner"
          expression: "底部波形线条，品牌色渐变"
        - component: "stats-block"
          expression: "数字卡片之间的连接箭头"
        - component: "section-divider"
          expression: "波形分割线"

  # ═══════════════════════════════════════
  # Slogan → 组件关联
  # ═══════════════════════════════════════
  slogan:
    text: "让数据创造价值"
    mapping:
      - component: "hero-banner"
        expression: "大标题下方副标题，14px，半透明白色"
      - component: "end-card"
        expression: "结尾品牌强调，16px，品牌色"
      - component: "copyright-notice"
        expression: "版权信息上方，12px，textSoft"
```

### 与当前逻辑的对比

```
当前逻辑：
  科技行业 → stats-block
  这是行业决定组件

目标逻辑：
  Logo 是六边形 → timeline 节点用六边形
  品牌色是蓝色 → callout 边框用蓝色
  辅助图形是波形 → divider 用波形
  这是品牌元素决定组件
```

### 设计规则

- 组件不是行业决定的，是**品牌元素决定的**
- 每个品牌元素（Logo 形状、颜色、辅助图形、Slogan）都应该有对应的组件表达
- 一个品牌元素可以映射到多个组件（如六边形 → timeline + divider + tag）
- 一个组件可以承载多个品牌元素（如 hero-banner 承载 Logo + Slogan + 辅助图形）

---

## 第五步：建立视觉语言

### 输入：品牌画像 + 阅读体验画像 + 品牌表达策略 + 组件表达映射表

### 5.1 配色体系

从品牌色派生 14 个 WeMD 颜色字段，**但配色策略来自品牌表达策略**：

```yaml
visualLanguage:
  colors:
    primary: "#1a56db" # 品牌主色
    primaryDark: "#0f3fa0" # primary 暗化 20%
    primaryLight: "#e8effd" # primary 白化 90%
    secondary: "#16a34a" # 品牌辅助色
    accent: "#f59e0b" # 品牌点缀色
    background: "#ffffff" # 品牌背景（通常白色）
    bgSoft: "#f6f8fb" # background 微调
    bgCard: "#ffffff" # 卡片背景
    bgMuted: "#eef2f7" # 灰背景
    textStrong: "#0f172a" # 标题色
    textNormal: "#334155" # 正文色
    textSoft: "#64748b" # 辅助色
    border: "#cbd5e1" # 边框色
    borderSoft: "#e2e8f0" # 柔和边框
```

### 5.2 字体体系

```yaml
visualLanguage:
  typography:
    family: "sans-serif"
    familyValue: "'Inter', 'Noto Sans SC', -apple-system, sans-serif"
    fontReason: "品牌定位专业科技，无衬线字体体现现代感"
    density: "medium"
    fontSize: "16px"
    lineHeight: "1.75"
    letterSpacing: 0.3
    headingWeight: "600"
    headingScale:
      h1: 28
      h2: 22
      h3: 18
      h4: 16
```

### 5.3 空间体系

```yaml
visualLanguage:
  spacing:
    pagePadding: 20
    paragraphMargin: 14
  border:
    radius: 6 # 品牌严谨→小圆角
    style: solid
  shadow:
    enabled: true
    value: "0 2px 8px rgba(26,86,219,0.08)"
```

---

## 第六步：建立布局语言

### 输入：阅读体验画像 + 品牌表达策略

### 决策

```yaml
layoutStrategy:
  pageStructure: standard
  paragraphStyle: compact
  hierarchy: clear
  componentFlow: linear
  preferredComponentCount: 8-12
```

---

## 第七步：输出 Design Blueprint

### 输入：所有前面的决策

### 输出：Design Blueprint（纯策略，不含 CSS）

```yaml
designBlueprint:
  brandExpression: { ... } # 品牌表达策略
  componentExpression: { ... } # 组件表达映射表
  readingExperience: { ... } # 阅读体验画像
  visualLanguage: { ... } # 视觉语言规范
  layoutStrategy: { ... } # 布局策略
```

> **Design Blueprint 是纯策略文档，不包含 CSS 和 manifest.json。**
> 后续由 Constraint Layer 检查合规 → Application Layer 选择实现方案 → Compiler Layer 编译输出最终主题包。

---

## 企业品牌设计的核心原则

1. **品牌资产决定组件表达，不是行业决定组件**
2. **品牌表达策略不含 CSS — 只做策略性决策**
3. **品牌元素可以跨组件复用**（六边形同时出现在 timeline/divider/tag）
4. **品牌一致性 > 创意性**
5. **克制 > 装饰**
6. **Logo 是核心资产，Slogan 是品牌声音**

---

## 与当前 Skill 的差异对照

| 维度     | 当前 Skill                       | 目标架构                                                  |
| -------- | -------------------------------- | --------------------------------------------------------- |
| 第三步   | 翻译品牌概念（颜色映射）         | 品牌表达策略（Logo/Slogan/辅助图形/关键词的完整表达规则） |
| 第四步   | 行业决定组件（科技→stats-block） | 品牌元素决定组件（六边形→timeline/divider/tag）           |
| 组件造型 | 按关键词查表（科技→渐变）        | 按品牌表达策略映射（品牌元素→组件→造型）                  |
| 品牌资产 | 仅 Logo 和主色                   | Logo + 形状 + 辅助图形 + 文化符号 + Slogan 完整资产清单   |
| 决策顺序 | 关键词 → 颜色 → 组件             | 品牌资产 → 表达策略 → 元素映射 → 组件 → 颜色              |
