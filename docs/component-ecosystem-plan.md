# WeMD AI 内容设计系统 — 计划书 v3

> 版本：3.0
> 日期：2026-07-27
> 分支：feature/component-ecosystem
> 状态：规划阶段

---

## 为什么 WeMD 不一样

**传统编辑器让用户设计页面，WeMD 让 AI 设计内容。**

不是"AI 帮你选组件"，而是 AI 像设计师一样思考：

```
这篇文章写给谁？  →  什么风格合适？  →  哪里该放什么？  →  具体长什么样？
```

Markdown 负责表达内容，AI 负责设计内容，组件只是最终呈现形式。

---

## 一、AI 设计流程

```
文章 + 读者画像
       │
       ▼
  ┌──────────────────────┐
  │ 第1层  读者分析        │  ← 写给谁看？
  │ Audience              │     程序员？小白？管理者？
  └──────────────────────┘
       │
       ▼
  ┌──────────────────────┐
  │ 第2层  文章画像        │  ← 这是什么文章？
  │ Article Profile       │     科技教程？温暖故事？数据报告？
  │ category+tone+purpose │
  └──────────────────────┘
       │
       ▼
  ┌──────────────────────┐
  │ 第3层  设计语言        │  ← 整体什么风格？
  │ Design Language       │     极简？杂志？Apple？少数派？
  └──────────────────────┘
       │
       ▼
  ┌──────────────────────┐
  │ 第4层  内容规划        │  ← 文章结构怎么搭？
  │ Content Plan          │     封面→目录→章节→引用→收尾
  └──────────────────────┘
       │
       ▼
  ┌──────────────────────┐
  │ 第5层  视觉变体        │  ← 每个部分具体长什么样？
  │ Variant Selection     │     基于 Design Language 匹配
  └──────────────────────┘
       │
       ▼
    最终页面
```

### 为什么这样分层

每一层解决一个问题，互不混杂：

| 层级            | 解决的问题 | 举例                                                        |
| --------------- | ---------- | ----------------------------------------------------------- |
| Audience        | 写给谁     | 同一篇 AI 教程，写给程序员用代码+数据，写给小白用流程图+FAQ |
| Profile         | 什么类型   | 情感故事和商业报告需要完全不同的设计策略                    |
| Design Language | 什么风格   | Apple 风和少数派风，即使同一篇文章组件完全不同              |
| Content Plan    | 放什么     | 不是模板分配，而是读完后判断哪里需要封面、哪里需要金句      |
| Variant         | 长什么样   | 同一语义下选择具体视觉表现                                  |

### 每一层怎么实现

| 层级            | 实现方式                                                        |
| --------------- | --------------------------------------------------------------- |
| Audience        | 用户输入/选择（一篇文章的读者是谁，AI 猜不准）                  |
| Profile         | AI 推断（LLM 一次调用，输出 category + tone + purpose + depth） |
| Design Language | AI 推荐 + 用户确认（基于 Profile 匹配）                         |
| Content Plan    | AI 规划（分析文章结构，判断哪里需要什么内容块）                 |
| Variant         | 纯代码匹配（基于 Design Language 从 Registry 选）               |

---

## 二、当前问题

### 2.1 AI 在"填表"而非"设计"

|                | 当前                   | 目标                             |
| -------------- | ---------------------- | -------------------------------- |
| 选组件逻辑     | 文章类型 → 固定模板    | 读者 + 内容 → 自主决策           |
| 知道为什么选吗 | 不知道，模板写死       | 知道（语义 + 意图 + 风格）       |
| 能换风格吗     | 不能，一个组件一种 CSS | 能，Design Language 统一驱动     |
| 面向读者吗     | 不区分                 | 区分（程序员 vs 小白，不同策略） |

当前 `designPatterns.ts` 的问题：

```
教程类 → hero-banner + toc-nav + numbered-heading + share-card
故事类 → hero-banner + quote-card + share-card
```

这是 AI 在 7 个预置表单里打勾。同一篇教程，写给程序员和写给小白用的组件应该截然不同，但模板不区分。

### 2.2 组件没有语义

AI 看到 `share-card`，但不知道它是：

- 用来完成什么目的？
- 适合什么情绪？
- 应该放什么位置？
- 和什么设计语言搭配？

---

## 三、组件的三层语义模型

```
Category（内容类别）    →  组件在文章结构中的角色（Ending / Hero / Highlight / Structure）
  Semantic（语义意图）  →  组件要实现的目的（Comment / Share / Quote / Hint）
    Variant（视觉变体） →  具体外观（Minimal / Magazine / Warm / Tech）
```

**这不是技术架构，这是 AI 的决策路径：**

> "这篇文章是写给管理者的行业洞察，语气理性"
> → 结尾需要 Ending.Share.Business
> → 不是随便一个 share-card

### 现有组件语义映射

| 组件             | Category  | Semantic      | Intent     |
| ---------------- | --------- | ------------- | ---------- |
| magazine-cover   | Hero      | Brand         | branding   |
| section-divider  | Structure | Chapter       | guide      |
| quote-card       | Highlight | Quote         | discussion |
| callout-pro      | Highlight | Hint          | guide      |
| stats-block      | Data      | Stat          | share      |
| share-card       | Ending    | Share/Comment | discussion |
| cta-card         | Ending    | CTA           | convert    |
| end-card         | Ending    | Thanks        | branding   |
| follow-bar       | Header    | Follow        | convert    |
| toc-nav          | Structure | Navigation    | guide      |
| tag-label        | Footer    | Tag           | collect    |
| related-posts    | Footer    | Related       | collect    |
| timeline         | Data      | Timeline      | guide      |
| image-card       | Media     | Image         | collect    |
| two-column-cards | Structure | Compare       | guide      |
| full-quote       | Highlight | Quote         | discussion |
| faq              | Structure | FAQ           | guide      |
| hero-banner      | Hero      | Intro         | branding   |
| numbered-heading | Structure | Section       | guide      |
| section-title    | Structure | Section       | guide      |
| code-frame       | Data      | Code          | guide      |
| divider-fancy    | Structure | Divider       | guide      |
| image-grid       | Media     | Gallery       | collect    |
| image-caption    | Media     | Caption       | collect    |
| image-text-row   | Media     | Layout        | collect    |
| styled-table     | Data      | Table         | guide      |
| author-card      | Footer    | Author        | branding   |
| qr-card          | Footer    | QR            | convert    |
| copyright-notice | Footer    | Legal         | branding   |
| text-card        | Structure | Card          | guide      |

---

## 四、实施路线

### Phase 1：统一内置组件格式（2-3 天）

**目标**：不改功能，把 30 个组件迁移到 manifest 模式。

- 创建 `packages/core/src/components/builtin/`，每个组件 = `manifest.json` + `style.css`
- manifest 包含 category / semantic / intent 等语义字段
- 创建 `ComponentRegistry`，CSS 拼接输出与现在完全一致

**零破坏**：语法、HTML 结构、预览效果、复制到公众号全部不变。

### Phase 2：AI 智能设计（4-5 天）← 核心

**目标**：AI 从"填模板"升级为"理解文章 → 面向读者 → 自主设计"。

**2.1 Audience 输入**

用户可选择/输入读者画像：程序员 / 管理者 / 小白 / 普通读者。AI 据此调整设计策略。

**2.2 Article Profile（文章画像）**

```typescript
interface ArticleProfile {
  category: "Tech" | "Emotion" | "Finance" | "Business" | ...;
  tone: "Warm" | "Serious" | "Rational" | "Elegant" | ...;
  purpose: "Discussion" | "Share" | "Collect" | "Guide" | ...;
  depth: "Quick" | "Medium" | "Deep";
}
```

AI 一次 LLM 调用同时输出 profile + articleType。

**2.3 Design Language（设计语言）**

```typescript
interface DesignLanguage {
  id: string; // "warm-magazine" | "apple-minimal" | "tech-data"
  label: string; // "温暖杂志" | "Apple 极简" | "科技数据"
  tone: string[]; // ["warm", "elegant"]
  suitable: string[]; // 适合的文章类型
  variantMap: Record<string, string>; // 组件 → 变体映射
}
```

AI 基于 Profile 推荐 Design Language，用户确认后统一驱动所有组件。

**2.4 设计约束（Constraints）**

```typescript
interface DesignConstraints {
  maxComponents: number; // 最多插入多少组件（默认 8）
  complexity: "low" | "medium" | "high"; // low=仅封面+收尾
}
```

用户可调，控制组件密度。不需要 imageCount / readingTime 等过度参数。

**2.5 现有设计模式的定位**

`designPatterns.ts` 从"强制规则"降为"兜底参考"：

- AI 优先自主决策
- Profile 置信度 < 0.6 或文章太短时回退到模板
- 用户始终可以覆盖 AI 的选择

### Phase 3：变体系统（3-4 天）

- `data-variant` 属性注入，CSS 变体选择器隔离
- `ThemeProcessor.ts` 变体 CSS 动态匹配
- `.wemdc` 文件导入 + 本地持久化
- UI：组件管理面板

### Phase 4：组件市场（2-3 天）← 最不急

- GitHub raw 分发
- 安全校验（CSS 过滤危险规则）
- 市场索引格式

---

## 五、优先级图谱

```
优先级  事项                          依赖
─────────────────────────────────────────────
  🔴     Phase 2: AI 智能设计            Phase 1
  🔴     语义层（Category/Semantic）      无 —— 马上可做
  🔴     Article Profile                无 —— 马上可做
  🔴     Design Language 框架            Profile + 语义层
  🟡     Audience 输入                  Phase 2 同步
  🟡     Constraints 约束                Phase 2 同步
  🟡     Phase 3: 变体系统 + 导入机制     Phase 1 + 2
  🟢     Phase 4: 组件市场               Phase 3
```

---

## 六、兼容性保证

| 层面               | 说明                         |
| ------------------ | ---------------------------- |
| 现有 Markdown 语法 | `::: type{props}...:::` 不变 |
| 现有渲染 HTML      | 结构不变                     |
| 现有 AI 接口       | 渐进增强，默认行为不变       |
| Phase 1 CSS 拼接   | 输出与现在完全一致           |
| 设计模式           | 保留为兜底，不强约束         |

---

## 七、关键文件清单

```
Phase 1 新增:
packages/core/src/components/
├── registry/
│   ├── ComponentRegistry.ts
│   ├── packageLoader.ts
│   └── cssInjector.ts
├── builtin/（30 个组件，每个 manifest.json + style.css）
└── index.ts

Phase 2 新增/改造:
apps/web/src/services/ai/
├── articleProfile.ts        ← 文章画像分析
├── designLanguage.ts        ← 设计语言定义 + 匹配
├── semanticMapper.ts        ← 语义层 → 组件映射
└── analysisAgent.ts         ← 改造：五层推理
```

---

## 八、设计哲学

```
Markdown 负责表达内容。

AI 负责设计内容。

组件只是最终呈现形式。
```

> 凡是让 AI 更懂文章的改动，优先。
> 凡是只让组件更多的改动，往后排。

---

## 九、下一步

1. 确认 Phase 2 方向
2. 开始 Phase 1（统一格式，零影响）
3. 完成 Phase 1 后立即启动 Phase 2（AI 智能设计）
