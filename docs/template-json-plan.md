# Template JSON + 卡片组件方案

> 目标：把现有「AI 建议插入组件」升级为「AI 生成完整排版方案」，让 AI 真正做模板，而非拼 HTML。

---

## 一、背景与定位

### 现状

- 已有组件语法 `::: type{props} ... :::`（markdown-it-component 插件）
- 已有 17 套主题 + 4 色 CSS 变量体系（primary / secondary / accent / 背景色）
- 已有 AI 版式设计器（analysisAgent）：两阶段 Plan & Execute，产出 `insertions`（插入建议列表）
- 已有渲染管线：Markdown → HTML → juice 内联 → 微信兼容 HTML

### 痛点

当前 AI 只能「在原文上插入组件」，不能「重新组织全文排版」。结果：

- 头图、章节序号、分栏、装饰带等结构性版式无法生成
- AI 输出受限于原文段落顺序，做不出杂志级排版
- 用户看到的「版式设计」更像「组件推荐」，达不到模板效果

### 目标

让 AI 输出一份 **Template JSON**（描述完整排版结构），由 Renderer 渲染成公众号 HTML。AI 不写 HTML，只写结构化 JSON，Renderer 负责把 JSON 翻译成微信兼容的 `<section>` 嵌套。

```
用户文章 (Markdown)
      ↓
   AI 分析
      ↓
Template JSON（结构化排版方案）
      ↓
  Renderer（JSON → 组件 Markdown）
      ↓
现有渲染管线（Markdown → 微信 HTML）
```

---

## 二、核心架构

### 设计原则

1. **复用现有管线**：Renderer 输出的是「组件 Markdown」（含 `:::` 语法），走现有 markdown-it-component + 主题 CSS + juice 内联，零改造。
2. **AI 只写 JSON**：不写 HTML、不写 CSS，避免 AI 生成脏样式破坏主题一致性。
3. **主题优先**：Template JSON 不含颜色，所有配色由当前主题的 CSS 变量提供，切换主题即换皮。
4. **微信兼容**：Renderer 输出的 HTML 只用 `<section>`、inline style、`data-*` 属性，不用 `<div>`、不用 class（复制时由 juice 内联）。

### 三层架构

```
┌─────────────────────────────────────────────┐
│  Layer 1: Template JSON Schema              │  ← AI 产出的结构化数据
│  (layout: [{component, props, content}])    │
├─────────────────────────────────────────────┤
│  Layer 2: Template Renderer                 │  ← JSON → 组件 Markdown
│  (renderTemplate(template, article))        │
├─────────────────────────────────────────────┤
│  Layer 3: 现有渲染管线                       │  ← Markdown → 微信 HTML
│  (markdown-it + theme CSS + juice + copy)   │
└─────────────────────────────────────────────┘
```

---

## 三、Template JSON 规范

### 完整结构

```jsonc
{
  "name": "夏日清凉周刊",
  "version": "1.0",
  "theme": "morandi-forest", // 推荐主题（用户可换）
  "articleType": "list", // AI 识别的文章类型
  "meta": {
    "title": "七月好物推荐",
    "subtitle": "清凉一夏的 8 件小物",
  },
  "layout": [
    {
      "component": "hero-banner",
      "props": { "variant": "full" },
      "content": {
        "title": "七月好物推荐",
        "subtitle": "清凉一夏的 8 件小物",
        "tag": "JULY PICKS",
      },
    },
    {
      "component": "toc-nav",
      "content": {
        "title": "目录",
        "items": ["冰丝凉席", "便携风扇", "防晒喷雾", "..."],
      },
    },
    {
      "component": "numbered-heading",
      "props": { "index": "01" },
      "content": { "title": "冰丝凉席" },
    },
    {
      "component": "article-section", // 文章正文槽位
      "content": { "fromParagraph": 1, "toParagraph": 3 },
    },
    {
      "component": "quote-card",
      "props": { "author": "用户评价" },
      "content": { "text": "睡了一晚，凉得不想起床。" },
    },
    {
      "component": "article-section",
      "content": { "fromParagraph": 4, "toParagraph": 6 },
    },
    {
      "component": "share-card",
      "content": { "text": "这个清单对你有帮助？" },
    },
  ],
}
```

### 字段说明

| 字段                 | 类型   | 说明                                                           |
| -------------------- | ------ | -------------------------------------------------------------- |
| `name`               | string | 模板名称（展示用）                                             |
| `version`            | string | 规范版本，当前 `1.0`                                           |
| `theme`              | string | 推荐主题 ID（可不填，默认跟随用户当前主题）                    |
| `articleType`        | string | AI 识别的类型（tutorial/story/data/opinion/list/news/product） |
| `meta`               | object | 文章元信息（标题、副标题）                                     |
| `layout`             | array  | 排版节点序列，按顺序渲染                                       |
| `layout[].component` | string | 组件名（必须是已注册组件）                                     |
| `layout[].props`     | object | 组件属性（对应 `::: type{props}` 的 props）                    |
| `layout[].content`   | object | 组件内容（结构化数据，Renderer 负责转成 Markdown）             |

### 组件内容类型

`content` 字段按组件类型有不同的结构：

| 组件               | content 结构                        | 说明                           |
| ------------------ | ----------------------------------- | ------------------------------ |
| `hero-banner`      | `{title, subtitle, tag}`            | 头图区，标题+副标题+标签       |
| `toc-nav`          | `{title, items[]}`                  | 目录，标题+章节列表            |
| `numbered-heading` | `{title}` + props.index             | 序号章节标题                   |
| `section-title`    | `{title}`                           | 普通章节标题                   |
| `quote-card`       | `{text}` + props.author             | 金句卡片                       |
| `stats-block`      | `{title, items[{label, value}]}`    | 数据块                         |
| `callout-pro`      | `{title, body}` + props.type        | 提示框                         |
| `article-section`  | `{fromParagraph, toParagraph}`      | **正文槽位**：引用原文段落范围 |
| `share-card`       | `{text}`                            | 分享引导                       |
| `follow-bar`       | `{text}`                            | 关注引导                       |
| `faq`              | `{title, items[{q, a}]}`            | 常见问题                       |
| `divider-fancy`    | `{}`                                | 装饰分隔线                     |
| `styled-table`     | `{title, markdown}`                 | 表格（保留 markdown 表格语法） |
| `code-frame`       | `{title, code, lang}` + props.title | 代码框                         |

### 正文槽位（关键设计）

`article-section` 是核心创新：它不存正文内容，只存「引用原文哪几段」。

```jsonc
{
  "component": "article-section",
  "content": { "fromParagraph": 1, "toParagraph": 3 },
}
```

Renderer 渲染时，从用户原文中提取第 1~3 段，原样输出为 Markdown。这样：

- AI 不需要复制原文（避免丢内容、避免编造）
- 原文的 Markdown 语法（列表、加粗、代码块）完整保留
- AI 只决定「第几段放哪个位置」，不碰内容本身

---

## 四、Renderer 设计

### 职责

把 Template JSON + 用户原文 → 组件 Markdown（含 `:::` 语法）

### 输入输出

```typescript
// 输入
renderTemplate(template: TemplateJSON, articleMarkdown: string): string

// 输出（组件 Markdown）
::: hero-banner{variant="full"}
# 七月好物推荐

清凉一夏的 8 件小物

JULY PICKS
:::

::: toc-nav
目录

- 冰丝凉席
- 便携风扇
- 防晒喷雾
:::

（这里输出原文第 1~3 段）

::: quote-card{author="用户评价"}
睡了一晚，凉得不想起床。
:::

（这里输出原文第 4~6 段）

::: share-card
这个清单对你有帮助？
:::
```

### 文件结构

```
apps/web/src/services/template/
├── types.ts                  // TemplateJSON 类型定义（≤300 行）
├── renderer.ts               // 核心 Renderer（≤400 行）
├── contentExtractor.ts       // 从原文提取段落范围（≤200 行）
├── componentRenderers.ts     // 各组件的 content → markdown 转换（≤500 行）
└── index.ts                  // 导出
```

### 渲染策略

1. **按 layout 顺序遍历**节点
2. **article-section** 节点：调用 `contentExtractor` 从原文切片，原样输出
3. **其他组件节点**：调用 `componentRenderers[component]` 把 content 转成 `::: type{props}\n{markdown}\n:::` 格式
4. **拼接**所有节点输出，用空行分隔

### contentExtractor 逻辑

```typescript
function extractParagraphs(markdown: string, from: number, to: number): string {
  const paragraphs = markdown.split(/\n\n+/);
  return paragraphs.slice(from - 1, to).join("\n\n");
}
```

---

## 五、AI 生成流程升级

### 现状 vs 目标

| 维度     | 现状（insertions）     | 目标（Template JSON）      |
| -------- | ---------------------- | -------------------------- |
| AI 产出  | 插入建议列表           | 完整排版结构               |
| 原文处理 | 不动原文，只在锚点插入 | 重新组织全文，正文按段引用 |
| 结构能力 | 无法做头图/分栏/装饰带 | 完整版式结构               |
| 用户感知 | "AI 建议我加几个组件"  | "AI 帮我排版了全文"        |

### 升级后的三阶段流程

```
阶段1: 识别文章类型 + 段落分析（Plan）
  ↓ 输出: { type, paragraphCount, keyParagraphs[] }
阶段2: 生成 Template JSON（Generate）
  ↓ 输出: 完整 layout 数组
阶段3: (可选) 用户编辑 Template JSON
  ↓ 输出: 最终 Template JSON
  → Renderer → 预览
```

### AI Prompt 设计要点

**阶段1 Prompt**（复用现有 buildPlanPrompt，扩展段落分析）：

- 识别文章类型（7 种 + unknown）
- 统计段落数量
- 标记关键段落（金句段、数据段、代码段、列表段）

**阶段2 Prompt**（生成 Template JSON）：

- 给 AI 看所选类型的设计模式（复用 designPatterns.ts）
- 给 AI 看可用组件清单 + content 结构
- 要求 AI 输出严格符合 Schema 的 JSON
- 强制使用 `article-section` 引用原文，禁止复制原文内容

### 文件改造

```
apps/web/src/services/ai/
├── analysisAgent.ts          // 保留，作为「轻量插入建议」模式
├── templateAgent.ts          // 新增：生成 Template JSON（≤500 行）
├── templatePrompt.ts         // 新增：Prompt 构建器（≤400 行）
└── designPatterns.ts         // 复用，扩展 content schema 说明
```

---

## 六、模板包格式（可分发）

### 目录结构

```
templates/
├── summer-breeze/
│   ├── template.json         // Template JSON 骨架（不含 articleType/content）
│   ├── preview.png           // 预览图
│   └── README.md             // 模板说明
├── tech-weekly/
│   ├── template.json
│   ├── preview.png
│   └── README.md
└── ...
```

### 模板骨架（template.json）

```jsonc
{
  "name": "夏日清凉",
  "version": "1.0",
  "theme": "morandi-forest",
  "articleType": "list",
  "meta": {},
  "layout": [
    { "component": "hero-banner", "props": {}, "content": {} },
    { "component": "toc-nav", "content": {} },
    {
      "component": "numbered-heading",
      "props": { "index": "01" },
      "content": {},
    },
    {
      "component": "article-section",
      "content": { "fromParagraph": 1, "toParagraph": 2 },
    },
    { "component": "quote-card", "props": { "author": "" }, "content": {} },
    {
      "component": "article-section",
      "content": { "fromParagraph": 3, "toParagraph": 4 },
    },
    { "component": "share-card", "content": {} },
  ],
}
```

### 使用方式

1. **AI 生成**：AI 分析文章后，选一个匹配的模板骨架，填充 content
2. **用户套用**：用户从模板库选一个骨架，AI 自动填充 content
3. **用户自定义**：用户在编辑器里手动编辑 Template JSON（高级模式）

---

## 七、UI 集成方案

### 双模式设计

保留现有「智能插入」模式，新增「完整排版」模式：

```
┌─────────────────────────────────┐
│  AI 版式设计                     │
├─────────────────────────────────┤
│  模式: ○ 智能插入  ● 完整排版    │
│                                 │
│  [分析文章并生成排版]            │
│                                 │
│  识别类型: 清单合集类            │
│  推荐主题: 莫兰迪森林 [套用]     │
│                                 │
│  ┌─ 排版预览 ──────────────┐    │
│  │  hero-banner            │    │
│  │  toc-nav                │    │
│  │  numbered-heading 01    │    │
│  │  article-section (1-2)  │    │
│  │  quote-card             │    │
│  │  article-section (3-4)  │    │
│  │  share-card             │    │
│  └─────────────────────────┘    │
│                                 │
│  [采纳并应用]  [编辑 JSON]      │
└─────────────────────────────────┘
```

### 交互流程

1. 用户点「分析文章并生成排版」
2. AI 生成 Template JSON
3. 右侧预览框实时渲染（Renderer → Markdown → 现有预览）
4. 用户可点「编辑 JSON」直接改结构
5. 点「采纳并应用」把渲染后的 Markdown 写入编辑器

### 文件改造

```
apps/web/src/components/Editor/
├── AiLayoutPanel.tsx          // 扩展：新增「完整排版」模式
├── TemplatePreview.tsx        // 新增：Template JSON 结构预览（≤400 行）
└── TemplateEditor.tsx         // 新增：JSON 编辑器（≤300 行，可选高级功能）
```

---

## 八、实施阶段

### Phase A: Renderer 核心（最小可用）

**目标**：能把 Template JSON 渲染成组件 Markdown，走通完整管线

**产出**：

- `services/template/types.ts` — 类型定义
- `services/template/renderer.ts` — 核心 Renderer
- `services/template/contentExtractor.ts` — 段落提取
- `services/template/componentRenderers.ts` — 组件转换
- 单元测试：给定 Template JSON + 原文，输出正确的组件 Markdown

**验证**：手动构造一份 Template JSON，Renderer 输出能在预览框正确渲染

### Phase B: AI 生成 Template JSON

**目标**：AI 能分析文章并生成符合规范的 Template JSON

**产出**：

- `services/ai/templateAgent.ts` — AI 生成器
- `services/ai/templatePrompt.ts` — Prompt 构建
- 扩展 `designPatterns.ts`：补充 content schema 说明

**验证**：粘贴一篇文章，AI 生成 Template JSON，Renderer 渲染后在预览框看到完整排版

### Phase C: UI 集成

**目标**：用户能在界面里用「完整排版」模式

**产出**：

- 扩展 `AiLayoutPanel.tsx`：双模式切换
- 新增 `TemplatePreview.tsx`：结构预览
- 串联：AI 生成 → 预览 → 采纳写入编辑器

**验证**：完整走通「粘贴文章 → 点按钮 → 看预览 → 采纳」闭环

### Phase D: 模板包（可选，后续迭代）

**目标**：内置几套高质量模板骨架，用户可直接套用

**产出**：

- `templates/` 目录 + 3~5 套模板骨架
- 模板选择 UI
- AI 选模板 + 填充 content 的逻辑

---

## 九、与现有系统的兼容性

### 不破坏现有功能

- **智能插入模式保留**：现有 `analysisAgent` + `insertions` 不动，作为「轻量模式」
- **组件语法不变**：Renderer 输出仍是 `::: type{props} ... :::`，现有插件零改造
- **主题系统不变**：所有配色仍由 `--wemd-*` 变量提供，切换主题即换皮
- **复制到微信不变**：Renderer 输出走现有 `wechatCopyService`，零改造

### 需要新增的组件

为支撑完整排版，需补充几个结构性组件（现有组件库偏「点缀型」，缺「结构型」）：

| 组件               | 用途                       | 优先级              |
| ------------------ | -------------------------- | ------------------- |
| `hero-banner`      | 头图区（标题+副标题+标签） | 高（Phase A）       |
| `article-section`  | 正文槽位（引用原文段落）   | 高（Phase A，核心） |
| `section-title`    | 章节标题（已存在）         | -                   |
| `numbered-heading` | 序号章节标题（已存在）     | -                   |

> 注：`hero-banner` 和 `article-section` 是新增，其余复用现有组件。

---

## 十、风险与对策

| 风险                                  | 对策                                                                             |
| ------------------------------------- | -------------------------------------------------------------------------------- |
| AI 生成的 Template JSON 不合规        | Renderer 做严格 schema 校验，非法节点跳过并提示                                  |
| AI 引用不存在的段落索引               | contentExtractor 做边界检查，越界时 fallback 到全文                              |
| 正文被切碎导致阅读不连贯              | Prompt 强制要求 `article-section` 覆盖全文所有段落，Renderer 校验覆盖率          |
| 模板同质化（都是头图+目录+正文+分享） | designPatterns 为 7 种类型设计不同节奏（如故事类无目录、数据类强化 stats-block） |
| AI 输出 JSON 不稳定                   | 复用现有 JSON 解析容错逻辑（去代码块包裹 + 正则提取）                            |

---

## 十一、验收标准

Phase A 完成后应满足：

1. ✅ 给定 Template JSON + 原文，Renderer 输出合法的组件 Markdown
2. ✅ 输出的 Markdown 在现有预览框正确渲染
3. ✅ 复制到微信公众号后样式正确（含组件样式内联）

Phase B 完成后应满足：4. ✅ AI 能识别文章类型并生成合规的 Template JSON 5. ✅ Template JSON 的 `article-section` 覆盖全文所有段落 6. ✅ 生成的排版符合对应类型的 designPattern 节奏

Phase C 完成后应满足：7. ✅ 用户能在 UI 里切换「完整排版」模式 8. ✅ 预览框实时显示渲染结果 9. ✅ 点「采纳」把结果写入编辑器，原文不丢失

---

## 十二、下一步

1. **请审阅本方案**，确认方向是否符合预期
2. 确认后从 **Phase A（Renderer 核心）** 开始实施
3. Phase A 走通后，再做 Phase B（AI 生成）和 Phase C（UI 集成）
