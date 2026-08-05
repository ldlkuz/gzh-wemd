# 自由创作设计逻辑（Creator Design Logic）

> 适用场景：个人博主、自媒体、独立创作者
> 核心理念：**概念驱动的创意表达**
> 设计师的角色：为创作者创造一套独特的视觉语言，就像导演为电影定调

---

## 逻辑总览

```
创作者的内容和个性
  │
  ▼
① 理解创作者
   内容方向、目标读者、个人风格
   没有视觉约束，从零开始创造
   输出：创作者画像
  │
  ▼
② 定义阅读体验
   阅读节奏、信息密度、情绪基调
   基于内容类型和个人风格
   输出：阅读体验画像
  │
  ▼
③ 创造视觉概念 ★ 核心创意步骤
   视觉隐喻："像什么"
   设计概念："为什么长这样"
   输出：概念描述 + 隐喻映射表
  │
  ▼
④ 概念表达策略 ★ 核心新增层
   概念 → 概念有哪些元素
   这些元素 → 映射到哪些组件
   输出：概念元素映射表（无 CSS）
  │
  ▼
⑤ 建立视觉语言
   配色体系（从概念出发）
   字体体系（有个性的字体组合）
   空间体系（呼应概念）
   输出：视觉语言规范
  │
  ▼
⑥ 建立布局语言
   页面节奏（呼应概念）
   组件排列逻辑
   输出：布局策略
  │
  ▼
⑦ 输出 Design Blueprint
   纯策略文档，不含 CSS
   输出：Design Blueprint → Constraint Layer 检查
```

---

## 第一步：理解创作者

### 输入

- 公众号名称（必填）
- 内容方向（必填，从 12 个类目选：科技/AI/投资/情感/生活/摄影/美食/母婴/教育/职场/阅读/旅行）
- 风格关键词 3~5 个（必填，从 18 词清单选）
- 主色（可选，#HEX 或 AI 推荐）
- Logo（可选，没有则 AI 做文字 Logo）
- 参考风格（可选，喜欢的公众号/网站/一句话描述）
- Slogan（可选）

### 输出：创作者画像

```yaml
creator:
  name: AI效率实验室
  contentDirection: AI + 效率
  audience: 职场人
  personality: 专业、直接、不废话
  keywords: [专业, 极简, 科技]
  visualAssets:
    logo: null
    primaryColor: auto
    reference: "喜欢 Apple 官网那种感觉"
```

---

## 第二步：定义阅读体验

### 输入：创作者画像

### 决策维度

| 维度     | 选项                                      | 判断依据                                |
| -------- | ----------------------------------------- | --------------------------------------- |
| 阅读节奏 | 快 / 中 / 慢                              | 内容类型：教程→慢，资讯→快，观点→中     |
| 信息密度 | 高 / 中 / 低                              | 目标读者：职场人→高，大众→中，泛娱乐→低 |
| 情绪基调 | 冷静 / 活力 / 温暖 / 严肃 / 治愈 / 文艺   | 创作者个人风格决定                      |
| 视觉重心 | 上重 / 居中 / 分散 / 无固定               | 创作者想强调什么                        |
| 叙事方式 | 数据驱动 / 故事驱动 / 观点驱动 / 教程驱动 | 内容类型决定                            |
| 亲密感   | 正式 / 亲切 / 朋友 / 导师                 | 创作者与读者的关系                      |

### 输出：阅读体验画像

```yaml
readingExperience:
  rhythm: medium
  density: medium
  emotion: calm
  visualWeight: centered
  narrative: tutorial-driven
  intimacy: professional
  whitespace: balanced
```

---

## 第三步：创造视觉概念 ★ 核心创意步骤

### 输入：创作者画像 + 阅读体验画像

### 3.1 视觉隐喻

AI 的核心创意任务：不是"选颜色"，而是"创造一个视觉故事"。

**视觉隐喻 = 把一种熟悉的事物/体验，映射到公众号排版上**

| 内容方向  | 可能的视觉隐喻 | 概念说明                                            |
| --------- | -------------- | --------------------------------------------------- |
| 科技/AI   | "像 IDE 界面"  | 标题 = 文件命名，代码块 = 代码审查，引用 = 终端输出 |
| 科技/AI   | "像数据仪表盘" | 数字大号，卡片网格，波形装饰                        |
| 投资/财经 | "像金融终端"   | 数字大号，表格密集，红绿配色                        |
| 情感/生活 | "像手账本"     | 手写感字体，贴纸装饰，不规则布局                    |
| 摄影/旅行 | "像明信片集"   | 大图为主，文字覆盖图片，留白多                      |
| 美食/手作 | "像食谱卡片"   | 步骤编号，配料清单，暖色调                          |
| 阅读/文化 | "像图书馆书架" | 分类标签，摘录卡片，安静氛围                        |
| 教育/职场 | "像课堂笔记"   | 标题=课程编号，大纲=目录，callout=老师批注          |

### 3.2 设计概念声明

```yaml
designConcept:
  # 视觉隐喻
  metaphor: "像 IDE 界面"

  # 概念说明
  concept: "把每一篇文章变成一次 Code Review"
  conceptReason: "这是一个 AI 效率公众号，面向职场人。IDE 是程序员最熟悉的界面，把公众号文章设计成 IDE 界面，让读者有沉浸感和熟悉感"

  # 概念来源参考
  reference: "Apple 官网的极简感 + VS Code 的界面语言"
```

### 设计规则

1. 概念必须与内容方向相关
2. 概念必须让用户理解
3. 概念不一定要"像某物"，也可以是一种抽象的感觉
4. 概念驱动后续所有设计决策

---

## 第四步：概念表达策略 ★ 核心新增层

### 这层回答的问题

> **这个视觉概念到底有哪些组成元素？这些元素分别映射到哪些组件？**

例如 IDE 概念：不是"科技感 → 蓝色渐变"，而是"IDE 有哪些具体界面元素"。

### 输入：设计概念

### 4.1 概念元素拆解

把视觉概念拆解成具体的、可见的界面元素：

```yaml
conceptExpression:
  # ═══════════════════════════════════════
  # 概念元素拆解
  # ═══════════════════════════════════════
  # 概念：IDE（集成开发环境）
  elements:
    - name: "Tab" # IDE 顶部的文件标签
      description: "当前打开的文件标签"
      visual: "圆角矩形，品牌色填充，白色文字，右下角小叉号（可选）"

    - name: "Cursor" # 编辑器的光标
      description: "闪烁的竖线，表示当前编辑位置"
      visual: "品牌色 2px 竖线，底部有半透明圆点"

    - name: "Sidebar" # IDE 侧边栏
      description: "文件目录、Git 状态等"
      visual: "左侧窄条，灰底品牌色边框"

    - name: "Line Number" # 代码行号
      description: "编辑器左侧的行号"
      visual: "textSoft 色，等宽字体，右对齐"

    - name: "Syntax Highlight" # 语法高亮配色
      description: "代码中不同颜色的语义标记"
      visual: "keyword=primary, string=secondary, function=accent"

    - name: "Terminal" # IDE 内置终端
      description: "底部命令行"
      visual: "深色背景，等宽字体，绿色前缀符"

    - name: "Comment" # 代码注释
      description: "绿色斜体的注释文字"
      visual: "secondary 色，斜体，// 前缀"

    - name: "Git Status" # Git 状态标记
      description: "文件修改、新增、删除状态"
      visual: "M=蓝色, A=绿色, D=红色 小标记"
```

### 4.2 概念元素 → 组件映射

把拆解出的概念元素，映射到 WeMD 的 35 个组件：

```yaml
# ═══════════════════════════════════════
# 概念元素 → 组件映射
# ═══════════════════════════════════════
mapping:
  # IDE Tab → Section Title
  - element: "Tab"
    component: "section-title"
    expression: "标题像 IDE 的 Tab 标签，圆角矩形背景，品牌色填充，右上角可选小装饰"
    reason: "Section Title 是一个章节的标识，和 Tab 标签的语义一致"

  # IDE Cursor → CTA Button
  - element: "Cursor"
    component: "cta-card"
    expression: "按钮右侧用闪烁光标装饰（CSS 动画基础，仅 hover 时），品牌色竖线"
    reason: "CTA 是用户点击行动的地方，光标暗示'这里可以操作'"

  # IDE Line Number → Heading 编号
  - element: "Line Number"
    component: "numbered-heading"
    expression: "标题编号用等宽字体，textSoft 色，右对齐，像 IDE 行号"
    reason: "Numbered Heading 本身就是编号，和行号视觉功能一致"

  # IDE Syntax Highlight → Tag Label
  - element: "Syntax Highlight"
    component: "tag-label"
    expression: "标签用语法高亮配色：keyword=蓝色, string=绿色, function=橙色"
    reason: "Tag 标签 = 代码中的关键字，语义对应"

  # IDE Terminal → Callout
  - element: "Terminal"
    component: "callout-pro"
    expression: "深色背景，等宽字体，$ 前缀符，像终端输出"
    reason: "Callout 是突出提示，和终端输出的人'系统消息'语义一致"

  # IDE Comment → Quote
  - element: "Comment"
    component: "quote-card"
    expression: "绿色前景，斜体，// 前缀装饰，像代码中的注释"
    reason: "Quote 引用 = 代码中的注释，都是'旁白'性质的内容"

  # IDE Git Status → Stat Block
  - element: "Git Status"
    component: "stats-block"
    expression: "数字用 git 状态色：M=蓝色, A=绿色, D=红色，等宽字体"
    reason: "Stats Block 展示数据，和 Git 状态的数据感一致"

  # IDE Sidebar → TOC Nav
  - element: "Sidebar"
    component: "toc-nav"
    expression: "左侧窄条，灰底，品牌色左边框，像 IDE 侧边栏"
    reason: "TOC 目录导航 = IDE 侧边栏的文件目录，功能一致"
```

### 4.3 概念元素 → 装饰图形

```yaml
# ═══════════════════════════════════════
# 概念元素 → 装饰图形
# ═══════════════════════════════════════
decorations:
  - element: "IDE Grid" # IDE 的背景网格
    usage: "hero-banner 背景"
    style: "浅灰色网格点阵，像 IDE 编辑器的背景网格"

  - element: "Cursor Blink" # 光标闪烁
    usage: "section-divider 装饰"
    style: "品牌色竖线 + 闪烁动画（仅页面内，导出到公众号时为静态）"

  - element: "Minimap" # IDE 右侧缩略图
    usage: "scrollbar 或 progress 装饰"
    style: "右侧彩色条，像 IDE 的 minimap 滚条"
```

### 设计规则

- 概念元素拆解是**创意翻译**的关键步骤
- 不是"科技感 → 蓝色"，而是"IDE → Tab/Cursor/Line Number/Terminal/..."
- 每个概念元素必须有明确的**视觉描述**（颜色、形状、位置）
- 映射到组件时，必须有**原因**（为什么这个元素映射到这个组件）
- 一个概念元素可以映射到多个组件
- 一个组件只能承载一个主要概念元素（避免视觉混乱）

---

## 第五步：建立视觉语言

### 输入：阅读体验画像 + 概念表达策略

### 5.1 配色体系（从概念出发）

```yaml
visualLanguage:
  colorConcept: "IDE 语法高亮配色"
  colorDescription: "VS Code 经典深色主题 + 语法高亮颜色"

  colors:
    primary: "#007ACC" # VS Code 选中蓝
    primaryDark: "#005A9E"
    primaryLight: "#E8F4FD"
    secondary: "#6A9955" # 字符串绿
    accent: "#CE9178" # 函数名橙
    background: "#FFFFFF"
    bgSoft: "#F5F7FA" # 编辑器行号区域
    bgCard: "#FFFFFF"
    bgMuted: "#E8EBF0"
    textStrong: "#1E1E1E" # 代码关键字色
    textNormal: "#333333"
    textSoft: "#6E7681" # 代码注释灰
    border: "#D4D4D4"
    borderSoft: "#E8E8E8"
```

### 5.2 字体体系

```yaml
visualLanguage:
  typography:
    family: "monospace" # 等宽字体呼应 IDE 概念
    familyValue: "'SF Mono', 'JetBrains Mono', 'Consolas', 'Noto Sans SC', monospace"
    fontReason: "等宽字体让读者感受到编程氛围，正文字体选择易读的 Noto Sans SC"
    density: "medium"
    fontSize: "16px"
    lineHeight: "1.75"
    letterSpacing: 0.2
    headingWeight: "700"
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
    radius: 4 # 小圆角（IDE 风格）
    style: solid
  shadow:
    enabled: false # IDE 无阴影
    value: "none"
```

---

## 第六步：建立布局语言

### 输入：阅读体验画像 + 概念表达策略

### 决策

```yaml
layoutStrategy:
  pageStructure: magazine
  paragraphStyle: standard
  hierarchy: strong
  componentFlow: linear
  preferredComponentCount: 6-10
```

---

## 第七步：输出 Design Blueprint

### 输入：所有前面的决策

### 输出：Design Blueprint（纯策略，不含 CSS）

```yaml
designBlueprint:
  designConcept: { ... } # 设计概念声明
  conceptExpression: { ... } # 概念表达策略
  readingExperience: { ... } # 阅读体验画像
  visualLanguage: { ... } # 视觉语言规范
  layoutStrategy: { ... } # 布局策略
```

> **Design Blueprint 是纯策略文档，不包含 CSS 和 manifest.json。**
> 后续由 Constraint Layer 检查合规 → Application Layer 选择实现方案 → Compiler Layer 编译输出最终主题包。

---

## 自由创作的核心原则

1. **概念驱动一切** — 颜色、字体、布局都从同一个设计概念出发
2. **概念元素拆解 > 直接选颜色** — 先拆解概念"有什么元素"，再映射到组件
3. **每个组件造型都有"为什么"** — 来自概念映射表，不是"我觉得好看"
4. **创意性 > 安全性** — 不必拘泥于白色背景、蓝色主色
5. **创作者个性优先** — 设计反映创作者的人物设定
6. **没有 Logo 怎么办？** — 文字排版、首字母、装饰图形

---

## 两套逻辑的核心差异速查

| 维度         | 企业品牌逻辑                             | 自由创作逻辑                                 |
| ------------ | ---------------------------------------- | -------------------------------------------- |
| 出发点       | 品牌已有视觉资产                         | 创作者的内容和个性                           |
| 核心创意步骤 | 品牌表达策略（Logo/Slogan/辅助图形映射） | 概念元素拆解+映射（IDE→Tab/Cursor/Terminal） |
| 设计自由度   | 低（品牌约束）                           | 高（完全自由）                               |
| 配色来源     | 品牌色派生                               | 概念驱动 + AI 推荐                           |
| 字体选择     | 标准无衬线（安全）                       | 有个性的字体组合                             |
| 组件造型     | 4-6 个，克制                             | 6-8 个，大胆                                 |
| brand.md     | ✅ 必须写                                | ❌ 不写                                      |
| Logo 处理    | 必填，内嵌到 assets                      | 可选，没有则文字排版                         |
| 判准         | 品牌一致性                               | 概念一致性                                   |
