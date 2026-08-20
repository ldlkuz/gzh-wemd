---
name: "wemd-theme-designer"
description: "完整品牌视觉主题设计工具，流程：品牌解读→概念创意→视觉设计→视觉稿预览确认→组件分析→骨架构图→组件映射→CSS编译→回归验证→主题打包。当用户需要为品牌/主题生成完整的视觉主题规范（.wemd-theme 主题包）时调用。"
---

# WeMD Brand Visual Theme Designer Skill

## Skill 定位

**核心职责** — AI 是视觉设计师，不是 CSS 工程师：

- 理解品牌，建立视觉语言系统
- 通过 Component Registry 了解系统组件
- 对焦点组件（`components.focal`）进行深度设计，Content 和 Utility 组件继承并克制表达

**不负责**（由主程序或独立脚本机械执行，AI 设计师不参与其设计/实现细节）：

- 组件级选择器映射（组件名 → DOM class）— 由主程序维护标准选择器注册表
- 自由骨架模板的编译校验（根元素 / Slot 契约 / 微信兼容）— 由 `scripts/compile-skeleton.cjs` 机械执行
- 主题文件打包为 `.wemd-theme` 压缩包 — 由 skill 内脚本 `scripts/pack-theme.cjs` 机械执行
- 渲染验证和跨浏览器兼容性测试 — 由主程序/独立脚本执行

**Stage 3b（AI 端到端生成）负责**：

- 产出视觉稿确认后的完整主题：自由骨架模板 + 组件 CSS + 公众号发布 HTML + 主题包
- CSS 编译遵循：同路径同特异性覆盖、微信兼容、配色可读、布局契约（详见 `css-compiler/prompts/06-compiler.md`）

## 状态流架构

整个流程是 **需求定义 → AI 端到端生成 → 回归验证** 三段式。AI 不依赖历史对话，每次只读需求 State + 必要的组件信息。

```text
品牌输入（MBI 表单）
   ↓
Stage 1 → themes/{theme-name}/states/brand_state.json      ┐
   ↓                                           │ 需求定义
Stage 2 → themes/{theme-name}/states/concept_state.json    ┘ 用户从 3 个母题候选中选 1 个
   ↓
Stage 3a → themes/{theme-name}/preview/vision.html  ⬅ 视觉稿（AI 生成，用户预览确认，可调）
   ↓
Stage 3b 【AI 端到端生成】brand_state + 选中母题 → 一次完成：
   ├─ themes/{theme-name}/manifest.json   主题清单（meta/layout/codeTheme/brand，打包读取）
   ├─ themes/{theme-name}/templates/*.html   自由骨架（需要改骨架的组件才写，像内置主题）
   ├─ themes/{theme-name}/css/{name}.css     组件 CSS
   ├─ themes/{theme-name}/publish/{name}.html 公众号发布 HTML
   └─ themes/{theme-name}/{name}.wemd-theme  主题包
   ↓
Stage 4 → themes/{theme-name}/validation.md  ⬅ 回归验证（质量底线）
   ↓
Theme Complete ✅
```

> **State 是 AI 的工作记忆，`.wemd-theme` 主题包是产品交付物。**

## 需求定义 vs 端到端生成

| 维度         | 需求定义 (Stage 1-2)                 | AI 端到端生成 (Stage 3a-3b)             |
| ------------ | ------------------------------------ | --------------------------------------- |
| 思维模式     | 杂志美术总监                         | 设计系统工程师（一次完成）              |
| 关注点       | 品牌人格、母题、视觉气质             | 视觉稿 → 骨架 → CSS → 主题包           |
| 使用的语言   | 页面区域、视觉焦点、阅读节奏         | title、image、card、divider            |
| 是否知道组件 | ❌ 不允许接触组件                    | ✅ 必须使用组件                         |
| 输出         | `states/brand_state.json` + `concept_state.json` | 视觉稿 + 自由骨架模板 + CSS + 主题包 |

> **先视觉后实现（思维纪律）**：AI 先在 Stage 3a 产出视觉稿（`preview/vision.html`）让用户确认气质，再在 Stage 3b 一次性落地组件。视觉与实现是同一套设计语言，不拆成多份中间 JSON。
>
> **形皮分工（贯穿 Stage 3b）**：骨架管"哪里是视觉核心"（每个组件内部视线停在哪），CSS 管"这个核心长什么样"（整套页面什么气质）。两者一对一强绑定：骨架定"填哪里"，CSS 用同一套品牌语言填满骨架的每个结构单元，不让任何骨架宣告的区域落空（有骨无肉）。

## 整体流程

```text
用户打开 input.html 表单填写 → 导出结构化输入 JSON（schema/input.schema.json）
      │  自然语言输入仅兜底，agent 按同一 schema 结构化
      │ ════════════════════════════════════
      │   需求定义：纯视觉创作，无组件约束
      │ ════════════════════════════════════
      ↓
Stage 1：Brand Interpretation → themes/{theme-name}/states/brand_state.json
      ↓
Stage 2：Visual Concept → themes/{theme-name}/states/concept_state.json
      ↓  ⬅ 用户从 3 个母题候选中选择 1 个（视觉没有唯一答案）
      │ ════════════════════════════════════
      │   AI 端到端生成：视觉稿确认 → 一次落地主题
      │ ════════════════════════════════════
      ↓
Stage 3a：Vision Mockup → themes/{theme-name}/preview/vision.html（视觉稿）
      ↓  ⬅ 用户打开 HTML 预览确认视觉气质（可要求调整后重出）
Stage 3b：AI 端到端生成（brand_state + 选中母题 → 一次完成）
      ├─ themes/{theme-name}/templates/*.html    自由骨架（需要改骨架的组件才写）
      ├─ themes/{theme-name}/css/{theme-name}.css  组件 CSS
      ├─ themes/{theme-name}/publish/{theme-name}.html  公众号发布 HTML
      └─ themes/{theme-name}/{theme-name}.wemd-theme  主题包
      ↓  ⬅ 对照 prompts/self-check.md 自检
      │ ════════════════════════════════════
      │   回归验证：质量底线
      │ ════════════════════════════════════
      ↓
Stage 4：Regression Validation → themes/{theme-name}/validation.md
      ↓
Theme Complete ✅
```

## 状态机

| 状态                  | 说明           | 输入                                                                   | 输出                                                            |
| --------------------- | -------------- | ---------------------------------------------------------------------- | --------------------------------------------------------------- |
| `NEW`                 | 初始状态       | 无                                                                     | `input.html` 表单（主入口）→ 导出 `input.schema.json`           |
| `BRAND_INTERPRETING`  | Stage 1        | 用户输入                                                               | `themes/{theme-name}/states/brand_state.json`                   |
| `CONCEPTING`          | Stage 2        | `brand_state`                                                          | `themes/{theme-name}/states/concept_state.json`（3 个母题候选） |
| `SELECTING_METAPHOR`  | 用户选择母题   | `concept_state`                                                        | 选中的母题（写入 `concept_state`）                              |
| `VISION_MOCKING`      | Stage 3a       | `brand_state` + `concept_state`（选中母题）                            | `themes/{theme-name}/preview/vision.html`（视觉稿）             |
| `GENERATING`          | Stage 3b       | `brand_state` + `concept_state` + 确认的视觉稿 + `registry/components.json` | 自由骨架 `templates/*.html` + CSS + 主题包                     |
| `REGRESSION_VALIDATING` | Stage 4      | 生成产物 + playbook 验收清单                                           | `themes/{theme-name}/validation.md`（回归验证报告）             |
| `COMPLETE`            | 完成           | —                                                                      | 全部输出                                                        |

## 核心 Prompt 原则

```text
你是一位视觉设计师，不是 CSS 生成器。

需求定义（Stage 1-2）：
  完全不要考虑组件。
  用页面级视觉体验来描述。
  使用"首屏区域""视觉焦点""阅读节奏""强调块"这类词。
  不要使用"标题""图片""卡片""引用""分割线"这类词。

端到端生成（Stage 3a-3b）：
  读取品牌需求 + 选中母题 + 组件注册表。
  先出视觉稿（preview/vision.html）确认气质，再一次性落地主题。
  组件三档：Brand Anchor（高预算，软上限 ~6）深度设计；Content 继承克制；Utility 极简。
  三档是**默认克制档位**，不是"谁能被设计"的门禁——真正决定权在骨架：母题需要 + 焦点有限。
  骨架写自由 Mustache 模板（像内置主题），只守三条底线：根元素约定 / Slot 契约 / 微信兼容。
  只给有刻意构图理由的组件写骨架；未写模板的组件回退默认骨架，保持克制。
  骨架不写 CSS 值（style 属性一律不写）——那是 CSS 皮肤的职责。
```

## 最重要的禁止事项

1. 先想 CSS 再思考品牌
2. 给每个组件使用完全相同的设计套路
3. 为了体现品牌给所有组件添加装饰
4. 强制所有组件使用统一圆角/品牌色
5. 把品牌化理解为颜色替换
6. 把参考图直接复制成模板
7. 默认设计全部组件为高复杂度
8. 让组件本身抢过内容
9. **在创意阶段思考组件**（创意阶段不允许知道组件存在）
10. **在组件 CSS 中使用微信不兼容特性**：`::before`/`::after`、`:hover`、结构伪类（`:first-child`/`:last-child`/`:first-of-type`/`:nth-child`）、`@keyframes`、`@media`、`animation`、`+`/`~` 兄弟选择器。详见 [css-compiler/prompts/06-compiler.md](css-compiler/prompts/06-compiler.md#wechat-compatibility)。
11. **未按"移动窄优先"设计**：最终载体是微信公众号约 343px 的单列窄流。所有阶段（创意→翻译→编译）都不得设计依赖宽幅或多栏才能成立的构图，编译时不产生 `@media` 响应式。创意阶段保持"手机窄长竖纸"画布隐喻，反感任何横向宽屏构图。
12. **在骨架模板（Stage 3b）中写入任何 CSS 值**：`padding`/`margin`/`font-size`/`color`/`width`/`height`/`border`/`flex`/`gap`/`align-items` 等一律禁止（骨架模板不写 style 属性）。骨架只描述视觉结构。
13. **为没有刻意构图理由的组件硬写骨架**：骨架能力是开放的，但 AI 不一定要写。决策标准是 **母题需要 + 焦点有限**，不是组件档位——母题使它成为本主题构图焦点的组件应设计（无论哪一档）；默认够用则不写，保持克制。
14. **在骨架模板里违反三条底线**：根元素不带 `wemd-component wemd-{id}` + `data-component`；用了未注册的 slot key；写了微信不兼容特性（伪元素 / 结构伪类 / 绝对定位 / 动画 / 媒体查询 / 兄弟选择器）。

## 文件依赖索引

### Prompts（各阶段 Prompt）

| 文件                                   | 用途                           |
| -------------------------------------- | ------------------------------ |
| `prompts/01-brand.md`                  | Stage 1：品牌解读              |
| `prompts/02-concept.md`                | Stage 2：视觉概念（3 母题选 1） |
| `prompts/03.5-vision-mockup.md`        | Stage 3a：视觉稿 HTML（用户预览确认） |
| `prompts/03b-generate.md`              | **Stage 3b：AI 端到端生成**（视觉→骨架→CSS→主题包，一次完成） |
| `prompts/self-check.md`                | 自检清单                       |
| `prompts/06.5-regression.md`           | Stage 4：回归验证（playbook 验收清单） |

> 参考规则（被 03b 端到端生成吸收，保留作细节规范）：
> `prompts/04.5-skeleton-composition.md`（自由骨架模板）、`css-compiler/prompts/06-compiler.md`（编译规则 + 微信兼容）。

### Reference（详细规则）

| 文件                                  | 用途                                                     |
| ------------------------------------- | -------------------------------------------------------- |
| `reference/input-format.md`           | 输入格式（必填 / 文件资产 / 可提取 / 可选）              |
| `reference/artifact-layout.md`        | **产物布局规范（唯一权威）：所有产物存放位置与文件结构** |
| `reference/component-retrieval.md`    | 组件检索机制（按需匹配）                                 |
| `reference/dom-structure.md`          | 主程序组件 DOM 结构（由 extract-dom-snapshot 自动生成）  |
| `reference/theme-craftsmanship.md`    | **主题改造方法论（Skill 版 playbook）：四步走 + 规则检查点 + 踩坑速查表** |
| `reference/theme-packing.md`          | 主题打包详细规则                                        |

### 输入工具与 Schema

| 文件                                    | 用途                                                                      |
| --------------------------------------- | ------------------------------------------------------------------------- |
| `input.html`                            | **主输入入口**：单文件 HTML 表单，按品牌类型引导填写，导出结构化输入 JSON |
| `schema/input.schema.json`              | **输入契约**：Stage 1 消费的输入结构（表单输出严格遵循此 schema）         |
| `registry/components.json`              | 组件注册表（43 个组件的结构化 JSON 定义）                                 |
| `schema/brand_state.schema.json`        | Stage 1 输出格式（需求定义）                                              |
| `schema/concept_state.schema.json`      | Stage 2 输出格式（需求定义，含选中的母题）                                |

### 脚本

| 文件                                 | 用途                                                  |
| ------------------------------------ | ----------------------------------------------------- |
| `scripts/compile-skeleton.cjs`       | 骨架编译：**读自由模板 `templates/*.html`**；输出 `package/templates.json` |
| `scripts/pack-theme.cjs`             | 主题打包（打包前自动校验 CSS）                         |
| `scripts/validate-theme.cjs`         | 主题包 manifest 校验脚本（主程序 ThemeValidator）      |
| `scripts/verify-theme-package.cjs`   | 主题包级验证：导入器加载 / renderTheme / #wemd 前缀 / 级联顺序 / 伪元素 / 共享装饰中和（提炼自主程序 VerifyImportFlow.test.ts） |
| `scripts/verify-theme-render.test.ts`| 渲染级回归验证：导出无伪元素/结构伪类/整篇背景、divider 无双线、callout-pro 无双竖条、pullquote 无双竖条（提炼自主程序 defaultThemeDomMatch.test.ts，经 `vitest.config.ts` 运行） |
| `scripts/generate-publish.test.ts`| 生成公众号发布 HTML（与主程序 wechatPublishHtml 同管线，经 `vitest.publish.config.ts` 运行） |
| `scripts/validate-css-selectors.mjs` | 打包前校验 CSS 选择器 + 嵌套 var（拦截臆造 class）     |
| `scripts/extract-dom-snapshot.mjs`   | 从主程序真源自动生成 `reference/dom-structure.md`      |

> **验证运行方式**（Stage 4 回归验证时逐项执行）：
> ```powershell
> node scripts/verify-theme-package.cjs <theme-name>            # 包级：导入/CSS 组装/前缀/级联/中和
> npx vitest run --config vitest.config.ts                      # 渲染级：导出合规 + 无双装饰（需在 packages/core 下执行，或仓库根 npm 已装 vitest）
> # 重新生成发布 HTML：
> npx vitest run --config vitest.publish.config.ts              # 读 sample.md 写 publish/<theme>.html
> ```

## 工作模式

本 skill 只有**一条流水线**：需求定义（Stage 1-2）→ AI 端到端生成（Stage 3a-3b）→ 回归验证（Stage 4）。品牌、个人创作者、媒体、产品、机构、社区等品牌类型（`brand_identity.type`）只改变 Stage 1/2 的**差异化信号来源**，其后的生成与验证完全一致。

**无论哪种类型，都不需要提前掌握组件清单**：需求定义（Stage 1-2）禁止接触组件，端到端生成（Stage 3b）通过组件注册表**按需检索**，自由写骨架与 CSS，一次产出主题包。

### 按品牌类型自适应的信号来源

Stage 1（品牌解读）与 Stage 2（视觉概念）的母题推导信号，随 `brand_identity.type` 不同而不同：

- **Brand（企业 / 机构 / 产品 / 媒体 / 社区）**：输入品牌介绍（100-300 字）+ 行业 + 目标客户 + Logo/参考资料。母题从 `industry` + `customer` + `personality` + `avoid` + 品牌独特故事推导。硬约束：Logo 等文件资产不可修改；软约束：品牌人格必须体现；自由区域：视觉设计。

- **Creator（个人创作者）**：输入最少，AI 自主完成全部推导，例如 `"一个激情的 AI 创作者。"`。没有真正的行业/客户，Stage 1 把 `industry` 重映射为**创作主题**、`customer` 重映射为**受众**（见 `prompts/01-brand.md`），Stage 2 据此从 `personality + 创作主题 + 内容气质 + 受众` 推导母题（见 `prompts/02-concept.md`）。例如"激情的 AI 创作者"可能推出"舞台聚光灯"、"迸发的神经网络"、"实验室白板涂鸦"等不同母题。

两种类型都**同样产出 3 个视觉母题候选**供用户选择，都走同一套「视觉稿确认 → 端到端生成 → 回归验证」。

## 最终判断标准

1. **Brand** — 这个主题是否能让人感受到品牌人格？
2. **Consistency** — 不同组件是否像同一个设计系统？
3. **Hierarchy** — Brand Anchor 的视觉权重是否明显高于 Content/Utility？
4. **Restraint** — Content 和 Utility 组件是否足够克制？
5. **Creativity** — Brand Anchor 是否真正具有独特性？
6. **Readability** — 品牌表达是否影响正常阅读？
7. **Necessity** — 每一个 Brand Anchor 是否都有存在的理由？
8. **Efficiency** — Brand Anchor 高预算池是否克制、焦点少而准（软上限 ~6，非硬锁）
9. **Separation** — 创意阶段是否真的没有接触组件概念？
10. **Regression** — 回归验证是否全部通过（骨架装饰存在 / 配色可读 / 未定制组件保持默认 / 无伪元素残留 / 两链路一致 / 整篇无背景）？

## 最终目标

> **"一套知道哪些地方应该大胆、哪些地方应该克制，并且整体具有明确品牌人格的视觉系统。"**

**创意阶段自由创作，翻译阶段克制映射。**
