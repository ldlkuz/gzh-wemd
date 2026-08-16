# Skill 骨架接入 — 独立 Skeleton Composition 阶段设计

> 状态：设计定稿（待实现）
> 目标：按方案 ii，在 skill 翻译阶段新增**独立 Skeleton Composition 阶段**，让 AI 专注于组件"形"（骨架构图）的设计，与"皮"（CSS 皮肤）分离。
> 配套规范：骨架 DSL 本身见 `skills/wemd-theme-designer/reference/skeleton-design-spec.md`（**v3 · DSL 定稿**）。本文档只描述如何在 skill 全流程中接入该能力。
> 关键架构决定：**Renderer 不感知 Skeleton Intent**，只消费 `templates`。Intent 在 Compiler 层编译为模板，Renderer 不变。
> 关联文档：主程序侧的骨架随主题迁移实施见 `docs/engineering/component-skeleton-per-theme-migration.md`。本文档聚焦 skill 层（`skills/wemd-theme-designer`）。

---

## 1. 设计定位

把组件的设计拆成两个正交的创作空间：

| 维度              | 关注点                         | 产物                     | 阶段           |
| ----------------- | ------------------------------ | ------------------------ | -------------- |
| 形（Skeleton）    | 组件视觉怎么构图、结构怎么组织 | `skeleton_intent.json`   | 新增 Stage 4.5 |
| 皮（Mapping/CSS） | 颜色、字体、间距、圆角怎么表达 | `component_mapping.json` | 现有 Stage 5   |

**核心原则：**

- **AI = 设计** — AI 只写构图意图 DSL，不写 HTML/CSS/任何 CSS 值。
- **Compiler = 命名** — 从骨架机械推导 class 名，AI 不手写 class。
- **CSS = 消费** — 按骨架 class 挂载样式值。

---

## 2. 完整架构

```text
                    BRAND
                      │
                      ▼
              ┌──────────────┐
              │ Brand / Concept│
              │ "品牌是什么？"  │
              └───────┬──────┘
                      ↓
              ┌──────────────┐
              │Visual Language│
              │ "皮是什么？"   │
              └───────┬──────┘
                      │
             ┌────────┴────────┐
             │                 │
             ▼                 ▼
       Component          Skeleton
       Strategy          Composition
             │                 │
             │          "形是什么？"
             │                 │
             └────────┬────────┘
                      ↓
              Component Mapping
                 "皮怎么挂"
                      ↓
                 Theme JSON
                      │
          ┌───────────┴───────────┐
          ↓                       ↓
     skeletons                components
       （形）                    （皮）
          │                       │
          ▼                       ▼
 Skeleton Compiler          CSS Compiler
          │                       │
          └───────────┬───────────┘
                      ↓
                  Validator
                      ↓
               Theme Templates
                      ↓
                  Renderer
                      ↓
                微信公众号
```

**关键接口边界**：Renderer 不感知 Skeleton Intent。Skeleton Compiler 已把 Intent 编译为 `templates`，Renderer 仍只消费 `templates` + theme CSS。这是一个**漂亮的兼容层**，不要求大规模改造现有渲染器。

---

## 3. 阶段位置与数据流

在 Stage 4 与 Stage 5 之间插入新阶段（编号 **Stage 4.5**）：

```text
Stage 4    Component Analysis → translator/component_strategy.json（三分类）
   ↓
Stage 4.5  Skeleton Composition → translator/skeleton_intent.json   ← 新增
   ↓
Stage 5    Component Mapping → translator/component_mapping.json（皮）
           ★ 输入新增: skeleton_intent（皮的设计有据可依）
   ↓
Assembler  → output/BrandVisualTheme.json
              ├── components（皮）
              └── skeletons（形，新增顶层字段）
   ↓
Skeleton Compiler → Intent → 安全 DOM（Mustache 模板）
CSS Compiler      → Visual Language + Design Tokens + design.direction → CSS
   ↓
Validator → 校验 + 回退处置
   ↓
Theme Templates → Renderer 消费
```

**为什么放在 Mapping 之前**：Compiler 需要先拿到结构（哪几块、什么 class），才能把皮（颜色/间距）正确挂到结构上。先定骨架，Stage 5 的"皮"描述才有据可依。

---

## 4. 新 State：`translator/skeleton_intent.json`

```json
{
  "schema": "SkeletonIntent",
  "note": "v3 DSL：骨架 = 一棵空间树，group 为核心结构单元",
  "skeletons": {
    "quote-card": {
      "component": "quote-card",
      "layout": "stack",
      "regions": [
        {
          "type": "group",
          "name": "header",
          "layout": "stack",
          "regions": [
            { "type": "label", "name": "quote-label", "text": "QUOTE" }
          ]
        },
        {
          "type": "group",
          "name": "main",
          "layout": "side-rail",
          "regions": [
            {
              "type": "decoration",
              "name": "quote-mark",
              "relation": "overlay"
            },
            { "type": "slot", "slot": "quote" }
          ]
        },
        { "type": "slot", "slot": "author" }
      ]
    }
  }
}
```

### 字段与枚举

- `component` — 组件 id，必须存在于组件注册表。
- `layout` — 容器级：描述"如何组织直接孩子"。枚举（v3）：stack / centered / side-rail / split / grid / media-text。
- `regions` — 区域集合，复用 `skeleton-design-spec.md` v3 §4：
  - `slot` — 引用已注册 slot key（契约固定）
  - `group` — **核心结构单元**，提升为一级概念。有 `name`（语义边界名）+ 可选 `layout` + `regions`（递归）。嵌套 ≤ 2 层。
  - `decoration` — 引用预定义装饰（§5）
  - `label` — 标签/角标
  - `rule` — 分隔线
- decorations / labels 的 `name` 复用 v3 §5 预定义集。

**不另造新词**，全部与 `skeleton-design-spec.md` v3 保持一致。

### 4.1 关键设计：group 是核心

skeleton-design-spec.md v3 将 `group` 从"辅助结构"提升为**核心结构单元**。

```text
quote-card skeleton

root (layout: stack)
│
├── group: header (layout: stack)
│    └── label: QUOTE
│
├── group: main (layout: side-rail)
│    ├── decoration: quote-mark (relation: overlay)
│    └── slot: quote
│
└── slot: author
```

`layout` 与 `group` 职责划分：

- **`layout`** 描述"父容器内部如何组织孩子"（容器级）。
- **`group`** 描述"一个视觉区域的边界"（区域边界），可自带 `layout`。

二者正交：一个 group 既有边界，又有自己组织孩子的方式。

---

## 5. 骨架范围（已定：全部组件开放）

### 5.1 总体规则

- 允许**任意组件**提供自定义骨架。
- 未提供骨架的组件 → 回退全局默认骨架（`defaultTemplates.ts`）。
- 提供但 Validator 判定非法 → 丢弃该组件骨架，回退默认。

### 5.2 AI 决策标准：哪些组件该写骨架？

AI 不应为所有组件都写骨架，应按以下标准判断：

| 条件                                                                                                 | 推荐做法                           |
| ---------------------------------------------------------------------------------------------------- | ---------------------------------- |
| 该组件是 **Brand Anchor**（component_strategy 中 score≥7）                                           | **必须**设计骨架。这是"放飞"的体现 |
| 该组件是 Content/Utility，但视觉母题使其**需要特殊构图**（如引用类组件在母题中需要侧栏而非普通堆叠） | **可以**设计骨架                   |
| 该组件是 Content/Utility，且**默认骨架已够用**（无特殊构图需求）                                     | **不写**，留空回退默认             |

**标准总结**：不是"能写就写"，而是"有刻意构图理由才写"。AI 在 skeleton 阶段应说明为每个组件的 skeleton 设计理由，**无理由不产出**。

### 5.3 回退一致性：Skeleton 是"骨"的可信度开关

**关键规则**：skeleton 是可信度开关。只有骨架坏了，皮才跟着一起废。完整决策流：

```text
Skeleton 合法？
│
├── NO
│    ↓
│  Skeleton → 默认
│  Component Mapping → 默认（整套回退）
│
└── YES
     ↓
   Skeleton → 保留
     │
     ├── Mapping 存在
     │      ↓
     │   使用自定义 CSS
     │
     └── Mapping 不存在（或部分缺失）
            ↓
         使用默认 CSS（骨架保留）
```

**理由**：CSS 是按骨架的 class 结构写的。骨架变了，class 名变，CSS 挂不对位置，只会渲染错乱。不如整套回退，保证渲染逻辑干净。

---

## 6. skeletons 存放位置（已定：顶层字段）

`skeletons` 作为 `BrandVisualTheme` 的**顶层字段**，与 `components`（皮）并列。

```text
BrandVisualTheme
 ├── brand
 ├── concept
 ├── visual_language
 ├── component_strategy
 ├── components            ← 皮（现有）
 ├── skeletons             ← 形（新增，skeleton_intent.json 映射而来）
 ├── design_tokens
 ├── metadata
 └── schema
```

**理由**：

1. 骨架与皮肤是两个正交维度，分开更清晰。
2. Compiler / Validator 可独立消费 `skeletons`，无需穿透 `components`。
3. 该位置**不影响** CSS 翻译层难度。

---

## 7. 状态机变更

| 状态                                         | 说明               | 输入                                                                           | 输出                              |
| -------------------------------------------- | ------------------ | ------------------------------------------------------------------------------ | --------------------------------- |
| `SKELETON_COMPOSING`（新增，位于 Stage 4.5） | 为组件设计构图骨架 | `component_strategy` + `visual_language` + `concept_state`（母题） + Slot 契约 | `translator/skeleton_intent.json` |

状态流转：

```text
ANALYZING (Stage 4)
   ↓
SKELETON_COMPOSING (Stage 4.5)   ← 新增
   ↓
COMPONENT_DESIGNING (Stage 5)    ← 输入新增：skeleton_intent
   ↓
MERGING → Assembler
```

---

## 8. Compiler / 翻译层约束（关键设计）

### 8.1 骨架 → class 的确定性推导（AI 不命名）

| 骨架要素            | 推导规则（写死在 Compiler）       | 示例                             |
| ------------------- | --------------------------------- | -------------------------------- |
| 根容器              | 写死 `wemd-component wemd-{abbr}` | `wemd-component wemd-quote-card` |
| group 容器          | `wemd-{abbr}-{groupName}`         | `wemd-qc-main`                   |
| `layout` 容器       | `wemd-{abbr}-{layout}`            | `wemd-qc-side-rail`              |
| `region=slot`       | `wemd-{abbr}-{slotkey}`           | `wemd-qc-quote`                  |
| `region=decoration` | `wemd-{abbr}-{decName}`           | `wemd-qc-quote-mark`             |
| `region=label`      | `wemd-{abbr}-label`               | `wemd-qc-label`                  |
| `region=rule`       | `<hr class="wemd-{abbr}-rule">`   | `wemd-qc-rule`                   |

> `abbr` 来源：组件注册表（`registry/components.json` 中每个组件的 `abbr` 字段）。Compiler 从 registry 读取，**AI 不参与命名**。

### 8.2 CSS 组装链：皮如何挂到骨上

`component_mapping.design.direction` 是**自然语言**，不能直接变 CSS。Compiler 需要三层推导：

```text
visual_language（颜色方向、排版气质、布局密度）   ← 创意阶段
   ↓ 提炼
design_tokens（emphasis / density / decoration / contrast 的语义值）   ← 跨阶段受控词汇表
   ↓ 结合 design.direction 的自然语言描述
具体 CSS 值（颜色、字号、间距、圆角、阴影、装饰语法）   ← Compiler 机械翻译
   ↓ 挂到
骨架 class（wemd-{abbr}-{slot} / wemd-{abbr}-{layout} 等）   ← 确定性推导
```

**设计规则**：

- `design.direction` 描述的是"视觉意图"（如"超大字重标题叠加大胆几何图形"），不是"CSS 值"。
- Compiler 的任务是：读 `visual_language` 的 `typography.character`（如 `bold`）→ 决定字号缩放比例 → 读 `design_tokens` 的 `emphasis: high` → 决定是否加阴影/装饰 → 输出具体 CSS 值。
- `design.direction` 中的自然语言描述，**优先作为 Compiler 的意图参考**，Compiler 最后以 `visual_language` + `design_tokens` 的枚举值产出精确 CSS。

### 8.3 微信兼容（Compiler 负责，不暴露给 AI）

- Compiler 只允许产出白名单标签：`section` / `div` / `span` / `p` / `img` / `strong` / `em` / `hr`。
- Hard 禁止编译进骨架：`position:absolute/fixed`、`::before/::after/::marker`、`display:flex`（除非必要）。
- `overlay` 装饰在微信下 `position:absolute` 不可用，Compiler 自动降级为行内小装饰。

### 8.4 Validator 拦截（触发即回退默认）

复用 `skeleton-design-spec.md` v3 §8 规则：

| 校验项                                                                                                              | 触发时                                                   |
| ------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| 组件未注册 / layout 非法 / region 非法 / slot 不在契约 / decoration 名非法 / group 嵌套 >2 层 / relation·align 非法 | 丢弃该组件的 skeleton 和 component_mapping，全套回退默认 |
| 出现任何 CSS 值（padding / margin / font-size / color / width / height / border / flex / gap 等）                   | 视为非法 skeleton，全套回退默认                          |
| 组件有 skeleton 但无 component_mapping                                                                              | 允许（CSS 用全局默认值，DOM 用自定义骨架）               |
| 组件有 component_mapping 但无 skeleton                                                                              | 允许（CSS 用自定义值，DOM 用默认骨架）                   |

---

## 9. 运行时消费

### 9.1 消费链路

```text
ThemeDefinition.skeletons[组件id]
   ↓
validateSkeleton() 校验
   ↓
   ├─ 合法 → Skeleton Compiler 编译为 templates/<组件id>.html（Mustache 格式）
   └─ 非法/缺失 → 用 defaultTemplates.ts
   ↓
渲染时：getThemeTemplates(组件id) → 取模板 → slot-parser 分槽 → template-filler 填充
```

### 9.2 skill 产物 → 主程序消费的衔接

skill 的 Compiler 负责将 `skeleton_intent.json` 编译为**主程序可直接消费的模板文件**：

| skill 侧                                              | 衔接点                           | 主程序侧                                   |
| ----------------------------------------------------- | -------------------------------- | ------------------------------------------ |
| `skeleton_intent.json`                                | Compiler 编译 Intent → 安全 DOM  | `templates/<组件id>.html`（Mustache 格式） |
| `skeleton_intent` 中的 `layout` / `group` / `regions` | → Class 确定性推导               | 模板中的 `wemd-{abbr}-{slot}` 等 class     |
| Compiler 输出                                         | 存入 `ThemeDefinition.templates` | `themePackageLoader.ts` 解压后读取         |
| 未提供骨架                                            | → 不生成模板文件                 | `defaultTemplates.ts` 兜底                 |

**编译产物格式**（与主程序 `component-skeleton-per-theme-migration.md` 的 Mustache 模板一致）：

```html
<!-- 由 skeleton_intent → Compiler 编译产出（v3 group 版本） -->
<section class="wemd-component wemd-quote-card" data-component="quote-card">
  <section class="wemd-qc-header">
    <span class="wemd-qc-label">QUOTE</span>
  </section>
  <section class="wemd-qc-main wemd-qc-side-rail">
    <span class="wemd-qc-quote-mark">"</span>
    <div class="wemd-qc-quote">{{slot:quote}}</div>
  </section>
  <div class="wemd-qc-author">{{slot:author}}</div>
</section>
```

切主题 = 骨架 + CSS 原子切换，整篇重渲染。

---

## 10. 新增 / 修改文件清单

### 新增

| 文件                                                                | 用途                              |
| ------------------------------------------------------------------- | --------------------------------- |
| `skills/wemd-theme-designer/prompts/04.5-skeleton-composition.md`   | 新阶段 Prompt：为组件设计构图骨架 |
| `skills/wemd-theme-designer/translator/skeleton_intent.schema.json` | 新 State 的格式校验               |

### 修改

| 文件                                                             | 改动                                                                                                                 |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `skills/wemd-theme-designer/SKILL.md`                            | 状态流新增 Stage 4.5；状态机新增 `SKELETON_COMPOSING`；文件依赖索引；禁止事项补充（CSS 值硬禁止、骨架与皮不一致）    |
| `skills/wemd-theme-designer/prompts/05-component-mapping.md`     | 输入新增 `skeleton_intent`；翻译策略中 Brand Anchor 的皮需参考骨架构图                                               |
| `skills/wemd-theme-designer/reference/output-format.md`          | BrandVisualTheme 新增 `skeletons` 顶层字段映射；"5 个 State" → "6 个 State"                                          |
| `skills/wemd-theme-designer/reference/assembler-and-compiler.md` | Assembler 合并规则加入 skeleton_intent；Compiler 加入骨架→DOM 编译、class 确定性推导、CSS 三层组装链、回退一致性规则 |
| `skills/wemd-theme-designer/reference/skeleton-design-spec.md`   | 已升级到 v3（本节不涉及额外修改）                                                                                    |

---

## 11. 落地顺序（后续实现参考）

1. 写 `translator/skeleton_intent.schema.json`（枚举以 v3 DSL 为准）。
2. 写 `prompts/04.5-skeleton-composition.md`（含 AI 决策标准 §5.2 + "无理由不产出"）。
3. 改 `SKILL.md`（状态流 / 状态机 / 文件索引 / 禁止事项）。
4. 改 `prompts/05-component-mapping.md`（输入新增 skeleton_intent）。
5. 改 `reference/assembler-and-compiler.md`（Assembler + Compiler + class 推导 + CSS 三层组装链 + 回退一致性）。
6. 改 `reference/output-format.md`（顶层字段 + 示例 + "6 个 State"）。
7. **主程序侧**：`validateSkeleton.ts` 接入 skeleton_intent；`getThemeTemplates` 消费。

---

## 附录：版本记录

| 版本 | 补丁                                                                                                               |
| ---- | ------------------------------------------------------------------------------------------------------------------ |
| v1   | 初始                                                                                                               |
| v2   | 补 #1 回退一致性、#2 CSS 三层组装链、#3 Stage 5 依赖、#4 AI 决策标准、#5 skill→主程序衔接                          |
| v3   | 全面对齐 v3 DSL：group 提升为核心、layout/group 职责划清、CSS 值硬禁止、架构图澄清、§4.3/§7.4 冲突用决策流程图明确 |

---

（文档结束 · v3）
