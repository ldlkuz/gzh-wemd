# WeMD AI 内容设计系统 — 改造计划书 v2

> 版本：2.0
> 日期：2026-07-27
> 分支：feature/component-ecosystem
> 状态：规划阶段
>
> **核心原则：先让 AI 变聪明，聪明之后再谈生态。**

---

## 一、当前问题

### 1.1 AI 在"填表"而非"设计"

|                | 当前                   | 愿景                        |
| -------------- | ---------------------- | --------------------------- |
| 怎么选组件     | 按文章类型固定分配     | 读懂文章后自主决策          |
| 知道为什么选吗 | 不知道，模板写死了     | 知道（意图 + 语义）         |
| 能换风格吗     | 不能，一个组件一种 CSS | 能（Design Theme 统一驱动） |
| 第三方能贡献吗 | 完全不能               | .wemdc 文件导入             |

当前 `designPatterns.ts` 的 7 套模板：

```
教程类 → hero-banner + toc-nav + numbered-heading + share-card
故事类 → hero-banner + quote-card + share-card
...
```

这不是 AI 设计，这是 AI 在 7 个预置表单里打勾。

### 1.2 组件没有语义

AI 看到的名字是 `share-card`。但它无法知道：

- 这个组件用来完成什么目的？（促进评论？引导分享？号召收藏？）
- 适合什么情绪的文章？（温暖？严肃？理性？）
- 应该放在什么位置？（文末？段落间？）
- 和什么风格搭配？（科技？极简？杂志？）

---

## 二、目标架构

### 2.1 AI 四层推理流程

```
文章原文
    │
    ▼
┌─────────────────────────────────┐
│ 第一层：文章画像 (Article Profile) │  ← 理解文章
│ category + tone + purpose + depth │
└─────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────┐
│ 第二层：设计主题 (Design Theme)    │  ← 全局风格统一
│ Warm / Tech / Minimal / Magazine  │
└─────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────┐
│ 第三层：内容块规划 (Content Plan)  │  ← 决定放什么
│ Title → Quote → Image → Ending   │
└─────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────┐
│ 第四层：视觉变体 (Variant)        │  ← 决定长什么样
│ 基于 Theme 匹配具体 CSS          │
└─────────────────────────────────┘
    │
    ▼
 最终页面
```

### 2.2 组件的三层语义模型

```
Category（内容类别）    →  组件在文章结构中的角色
  Semantic（语义意图）  →  组件要实现的目的
    Variant（视觉变体） →  具体的外观风格
```

示例：

```
Ending（结尾类）
  └── Comment（评论引导）
  │     ├── Minimal（极简）
  │     ├── Magazine（杂志）
  │     └── Warm（温暖）
  └── Share（分享引导）
  │     ├── Simple（简单）
  │     └── Business（商务）
  └── Thanks（致谢）
        ├── Elegant（优雅）
        └── Warm（温暖）
```

这样 AI 的决策路径是：

> "这篇文章是温暖的个人故事，目的促进讨论"
> → 结尾需要 Ending.Comment.Warm
> → 不是随便一个 share-card

### 2.3 设计主题 (Design Theme)

组件不孤立存在，整篇文章统一风格：

```
Theme = WarmMagazine

    magazine-cover        → Warm 风格
    section-divider       → Warm 风格
    quote-card            → Warm 风格
    share-card            → Warm 风格
    end-card              → Warm 风格
          ↑
    全部由 Theme 统一驱动，不是各自为政
```

### 2.4 文章画像 (Article Profile)

```
Category     Tone         Purpose      ReadingDepth
─────────    ───────      ─────────    ────────────
Tech         Warm         Discussion   Quick
AI           Serious      Collect      Medium
Emotion      Rational     Share        Deep
Finance      Luxury       Convert
News         Modern       Guide
Travel       Elegant      Branding
Education    Playful
Business
```

---

## 三、实施路线

### Phase 1：统一内置组件格式（2-3 天）✅ 保留

**目标**：不改功能，把现有 30 个组件迁移到 manifest 模式。

**动什么**：

- 创建 `packages/core/src/components/builtin/` 目录
- 每个组件 = `manifest.json` + `style.css`
- 创建 `ComponentRegistry` 核心类
- CSS 拼接输出与现在完全一致

**不动什么**：

- `::: share-card{...}:::` 语法不变
- 渲染 HTML 结构不变
- 预览效果不变
- 复制到公众号不变
- 现有 CSS 内容不修改

### Phase 2：AI 智能设计（4-5 天）← **核心重点**

**目标**：AI 从"填模板"升级为"理解文章后自主设计"。

**2.1 文章画像 (Article Profile)**

在 `analysisAgent.ts` 的 Stage 1 后插入新分析维度：

```typescript
interface ArticleProfile {
  category: string; // Tech | Emotion | Finance | ...
  tone: string; // Warm | Serious | Rational | ...
  purpose: string; // Discussion | Share | Collect | ...
  readingDepth: string; // Quick | Medium | Deep
}
```

AI 一次调用同时输出 `type` + `profile`：

```json
{
  "type": "story",
  "reason": "第一人称叙述个人经历，有情感转折",
  "profile": {
    "category": "Emotion",
    "tone": "Warm",
    "purpose": "Discussion",
    "depth": "Medium"
  }
}
```

**2.2 组件语义标注**

给 manifest.json 增加语义字段：

```json
{
  "type": "share-card",
  "variant": "default",
  "category": "Ending",
  "semantic": "Share",
  "intent": "discussion",
  "tone": ["warm", "minimal"],
  "articleCategories": ["emotion", "essay"],
  "insertPosition": ["ending"]
}
```

现有组件的分类映射：

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

**2.3 四层推理实现**

改造 `analysisAgent.ts`，不再两阶段，改为四层：

```typescript
async function analyzeArticle(markdown: string): Promise<DesignPlan> {
  // 第1层 + 第2层：一次 LLM 调用
  //   输出：Profile + Theme
  const { profile, theme } = await inferProfileAndTheme(markdown);

  // 第3层：基于 Profile + Theme 规划内容块
  //   可纯代码决策（基于语义规则），也可再调一次 LLM
  const contentPlan = planContentBlocks(markdown, profile, theme);

  // 第4层：基于 Theme 匹配视觉变体
  const variants = matchVariants(contentPlan, theme);

  return { profile, theme, contentPlan, variants };
}
```

**2.4 与现有 AI 的兼容**

- 现有 `designPatterns.ts` 从"规则"降级为"参考建议"，AI 可以越过模板自主决策
- 如果 Profile 识别的置信度 < 0.6，回退到模板逻辑
- 用户可以在 UI 中覆盖 AI 的选择

**产出**：

- AI 不再是填表，而是从文章内容出发做设计决策
- 同一篇文章换不同 Tone 能自动匹配不同组件变体
- 设计模式保留为兜底，不强约束

### Phase 3：变体系统 + Design Theme（3-4 天）

**目标**：同类型多种风格变体，整篇文章风格统一。

**3.1 变体系统**

- `data-variant` 属性注入（`markdown-it-component.ts` 改造）
- CSS 变体选择器：`#wemd .wemd-share-card[data-variant="warm"]`
- `ThemeProcessor.ts` 变体 CSS 动态匹配
- 为 3-5 个高频组件创建示范变体

**3.2 Design Theme**

```
用户/AI 选择一个 Theme（如 Warm）
    ↓
ThemeRegistry 返回该 Theme 下的所有组件变体映射
    ↓
share-card → warm variant
quote-card → warm variant
end-card   → warm variant
```

- Theme 是一个"风格标签集合"：`{ tone: "warm", visual: "magazine", variants: {...} }`
- 组件在自己的 manifest 里声明"我支持哪些 theme"

**3.3 导入机制**

- `.wemdc` 文件解析和校验
- 本地存储持久化
- UI：组件管理面板（查看、导入、启用/禁用）

**产出**：

- 组件变体可用
- Design Theme 驱动全局风格
- 可导入 .wemdc 文件

### Phase 4：组件市场（2-3 天）← **最不急**

- GitHub raw 分发
- 版本检查 + 更新提示
- 市场索引格式
- 组件安全校验

---

## 四、优先级图谱

```
优先级     事项                    依赖
────────────────────────────────────────
  🔴       组件语义层（Category/Semantic）  无 —— 马上可做
  🔴       Article Profile（AI 读懂文章）   无 —— 马上可做
  🔴       四层推理流程                     Profile + 语义层
  🟡       Design Theme               依赖 变体系统
  🟡       变体系统 + .wemdc 导入       依赖 Phase 1
  🟢       组件市场                    依赖 变体系统
```

---

## 五、与升级思路2.md 的对齐

| 升级思路2.md 概念             | 计划中对应位置                     |
| ----------------------------- | ---------------------------------- |
| Category → Semantic → Variant | 组件三层语义模型（2.2）            |
| Intent 比 Component 更重要    | manifest 增加 semantic/intent 字段 |
| Article Profile               | Phase 2.1，四层推理第一层          |
| Design Theme                  | Phase 3.2，全局风格统一            |
| Content Block                 | 语义层，Category 即内容块角色      |
| 四层推理流程                  | Phase 2.3，analysisAgent 改造      |
| AI 内容设计平台               | 长期愿景，Phase 2 是第一步         |

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
├── semanticMapper.ts        ← 语义层 → 组件映射
└── analysisAgent.ts         ← 改造：四层推理

packages/core/src/themes/
└── designThemes.ts          ← Design Theme 定义
```

---

## 八、下一步

1. 审查本计划书，确认 Phase 2 方向
2. 开始 Phase 1（统一内置组件格式，零影响）
3. 完成 Phase 1 后立即启动 Phase 2（AI 智能设计，核心价值）

> **一句话原则**：不要在建商场之前先装修店铺。组件市场是最不着急的事。
