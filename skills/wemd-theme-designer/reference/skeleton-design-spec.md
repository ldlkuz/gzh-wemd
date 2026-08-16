# Skeleton Design Spec — 组件骨架设计规范（v3 · Intent DSL）

> 状态：**DSL 定稿**（可作为实现地基）
> 目标：把「主题如何改变组件结构」从「AI 写 HTML」升级为「AI 描述视觉构图意图，主程序编译成安全 HTML」。
> 核心：**AI 是视觉设计师，不是 HTML 生成器，也不是 CSS 生成器。**
> 分工：**AI = 设计，Compiler = 命名，CSS = 消费。**
> 真源：Slot 契约以 `packages/core/src/plugins/component/slotDefs.ts` 为准；本文档组件清单与之一致。

---

## 0. 三条铁律

1. **只描述"视觉空间如何组织"，不描述"DOM/CSS 怎么实现"**——AI 不写 HTML、不写样式值。
2. **Skeleton DSL 不允许出现任何 CSS 值**（详见 §0.1）。
3. **Slot 固定、Region 可变、HTML 主程序决定。**

### 0.1 禁止任何 CSS 值（硬规则）

Skeleton DSL 只描述视觉结构，**不得出现任何 CSS 值**。包括但不限于：

```
❌ padding   ❌ margin   ❌ font-size   ❌ color   ❌ width   ❌ height
❌ border    ❌ flex     ❌ grid-template-columns   ❌ gap   ❌ align-items
```

Skeleton 只允许描述以下**结构概念**：

```
layout      容器如何组织孩子
group       视觉区域边界
region      区域
slot        内容槽
decoration  装饰
label       标签
rule        分隔线
relation    区域关系
```

> 一旦 AI 输出 CSS 值，视为非法骨架，由 Validator 处理（§8）。

---

## 1. 核心概念：骨架 = 一棵空间树

真正的"骨架"是**一棵嵌套的空间树**：

```text
根容器 (layout)
 ├── 区域 A
 ├── 区域 B (layout)
 │    ├── 区域 B1
 │    └── 区域 B2
 └── 区域 C
```

树中的每个**容器节点**（根 或 group）都有自己的 `layout`，决定它如何组织**直接孩子**。

---

## 2. `layout` 与 `group` 的职责划分（关键）

### 2.1 `layout`：描述"父容器内部如何组织孩子"

`layout` 是**容器节点**（根 或 group）的属性，回答「我的孩子怎么排」。

| 值           | 视觉含义               |
| ------------ | ---------------------- |
| `stack`      | 孩子上下堆叠           |
| `centered`   | 孩子整体居中、单一焦点 |
| `side-rail`  | 左侧竖条 + 右侧主体    |
| `split`      | 左右分栏（对比/并列）  |
| `grid`       | 多卡片网格             |
| `media-text` | 图 + 文并列            |

> `layout` 永远是**容器级**概念，不描述具体 region 内部。它只回答"这群孩子怎么排"。
> （原 v2 的 `top-label` / `hero` / `overlay` 不再作为 layout：`top-label` 可用 group + stack 表达；`hero` 可用 centered + 强装饰表达；`overlay` 归入 `relation`。）

### 2.2 `group`：描述"一个视觉区域的边界"

`group` 是**具有名字的容器节点**，圈定一个视觉区域的边界，并可声明自己的 `layout`。

| 字段      | 含义                                                                       |
| --------- | -------------------------------------------------------------------------- |
| `name`    | 区域边界的语义名（header / main / footer / content / meta / decoration …） |
| `layout`  | 可选。该 group 内部如何组织孩子；缺省继承容器组织方式                      |
| `regions` | 该 group 内的子区域                                                        |

```text
group(main)
    layout: side-rail
    ├── decoration  quote-mark
    └── slot        quote
```

**语义边界**：

- `layout` 描述"父子关系怎么排"（组织方式）。
- `group` 描述"哪里是一个视觉区域"（边界划分）。
- 二者正交：一个 group 既有边界，又有自己组织孩子的方式。

---

## 3. Skeleton Intent 顶层结构

```json
{
  "component": "quote-card",
  "layout": "stack",
  "regions": [
    {
      "type": "group",
      "name": "header",
      "layout": "stack",
      "regions": [{ "type": "label", "name": "quote-label", "text": "QUOTE" }]
    },
    {
      "type": "group",
      "name": "main",
      "layout": "side-rail",
      "regions": [
        { "type": "decoration", "name": "quote-mark", "relation": "overlay" },
        { "type": "slot", "slot": "quote" }
      ]
    },
    { "type": "slot", "slot": "author" }
  ]
}
```

| 字段        | 含义                                         |
| ----------- | -------------------------------------------- |
| `component` | 组件 id（必须存在于注册表）                  |
| `layout`    | 根容器如何组织直接孩子（§2.1）               |
| `regions`   | 根容器的直接子区域列表，顺序即渲染顺序（§4） |

---

## 4. `region` 类型枚举（视觉角色，非 DOM）

| `type`       | 视觉角色             | 必填字段                            | 说明                                      |
| ------------ | -------------------- | ----------------------------------- | ----------------------------------------- |
| `slot`       | 内容区               | `slot`                              | 引用该组件**已注册** slot key（契约固定） |
| `group`      | **视觉区域边界容器** | `name`（+可选 `layout`、`regions`） | 递归组织局部构图，**嵌套深度 ≤ 2 层**     |
| `decoration` | 装饰元素             | `name`                              | 引用预定义装饰（§5）                      |
| `label`      | 标签/角标            | `name`（+可选 `text`）              | 固定文字或引用装饰                        |
| `rule`       | 分隔线               | —                                   | Compiler 映射 `<hr>`                      |

### 4.1 通用 region 附加字段

| 字段       | 取值                                 | 含义                     |
| ---------- | ------------------------------------ | ------------------------ |
| `relation` | `stack`(默认) / `inline` / `overlay` | 与相邻区域的关系         |
| `align`    | `left` / `center` / `right`          | 对齐（构图关系，非样式） |

> `group` 是核心结构单元：**任何需要子组织的视觉分区，都用 group 表达**。根容器的直接子可以是 slot / decoration / label / rule / group 的任意组合。

---

## 5. `decoration` / `label` 的 `name` 预定义集（v1）

| `name`       | 视觉角色   | Compiler 实现（安全 DOM，微信兼容）      |
| ------------ | ---------- | ---------------------------------------- |
| `quote-mark` | 引号装饰   | 真实 `<span>` 物化引号                   |
| `top-bar`    | 顶部短色条 | `<span>` 色条（用 border 而非 position） |
| `dot`        | 圆点       | `<span>` 圆点                            |
| `corner`     | 角标       | `<span>` 角标                            |
| `cap`        | 大写首字母 | `<span>` 首字母                          |

> `overlay` 装饰在微信下 `position:absolute` 不可用，**Compiler 负责安全降级**（退化为行内小装饰），不暴露给 AI。

---

## 6. Slot 进入规则

- 只有 `{"type":"slot","slot":"quote"}` 能引用内容，且 `slot` **必须在该组件 Slot 契约内**（复用 `getBuiltinSlotDef`）。
- `decoration` / `label` 用预定义 `name`，或走 `label.text`（静态装饰文案），**不能自创 slot**。
- list 型 slot（如 `items`）由 Compiler 按 `{{#each}}` 处理，条目字段用 `{{this.field}}`（对应 `item_slots`）。

---

## 7. Compiler 映射规则（Intent → 合法 DOM）

主程序按如下规则生成安全 HTML（这些约束**不暴露给 AI**）：

| Intent                        | 生成规则                                                                               |
| ----------------------------- | -------------------------------------------------------------------------------------- |
| 根容器                        | `<section class="wemd-component wemd-{id}" data-component="{id}">…</section>`          |
| 容器（根 / group）的 `layout` | 依序排列孩子；`side-rail` 外层 `<section class="wemd-{abbr}-rail">` + 内层右侧内容     |
| `region=group`                | `<section class="wemd-{abbr}-{groupName}">` + 递归其 `regions`                         |
| `region=slot`                 | `<section class="wemd-{abbr}-{slotkey}">{{slot:key}}</section>`（list 用 `{{#each}}`） |
| `region=rule`                 | `<hr class="wemd-{abbr}-rule">`                                                        |
| `region=label`                | `<span class="wemd-{abbr}-label">` + 静态文字或 slot                                   |
| `region=decoration`           | 映射到 §5 预定义安全 DOM                                                               |
| `relation=overlay`            | 装饰前置，微信下降级为 inline                                                          |

**标签白名单（Compiler 只能产出这些）：** `section` / `div` / `span` / `p` / `img` / `strong` / `em` / `hr`。
**Hard 禁止：** `position:absolute/fixed`、`::before/::after/::marker`、`display:flex`（除非必要）。

### 7.1 骨架 → class 的确定性命名（AI 不命名）

| 骨架要素            | 推导规则（写死在 Compiler）     | 示例                             |
| ------------------- | ------------------------------- | -------------------------------- |
| 根容器              | 写死 `wemd-component wemd-{id}` | `wemd-component wemd-quote-card` |
| group 容器          | `wemd-{abbr}-{groupName}`       | `wemd-qc-main`                   |
| `layout` 容器       | `wemd-{abbr}-{layout}`          | `wemd-qc-side-rail`              |
| `region=slot`       | `wemd-{abbr}-{slotkey}`         | `wemd-qc-quote`                  |
| `region=decoration` | `wemd-{abbr}-{decName}`         | `wemd-qc-quote-mark`             |
| `region=label`      | `wemd-{abbr}-label`             | `wemd-qc-label`                  |
| `region=rule`       | `<hr class="wemd-{abbr}-rule">` | `wemd-qc-rule`                   |

> `abbr` 来源：主程序 `slotDefs.ts`（`getComponentAbbr` / 各组件 Slot 定义的 `abbr` 字段）。Compiler 直接 require 主程序编译产物 `slotDefs.js`，与主程序渲染保持一致，**AI 不参与命名**。

---

## 8. Validator 规则（触发即丢弃该组件骨架，回退默认）

1. `component` 未注册
2. `layout` 不在 §2.1 枚举内
3. `region.type` 不在 §4 枚举内
4. `slot` 不在该组件契约内
5. `decoration.name` / `label.name` 不在 §5 预定义集内
6. `group` 嵌套深度 > 2 层
7. `relation` / `align` 值非法
8. **出现任何 CSS 值**（含 padding/margin/font-size/color/width/height/border/flex/gap/align-items 等，§0.1）

校验通过后，Compiler 产物存入 `ThemeDefinition.templates[组件id]`，渲染时 `getThemeTemplates` 优先使用；无则回退全局默认骨架。

---

## 9. 示例（验证表达力）

### 示例 A：角落大引号 + 侧栏（group 为核心）

```json
{
  "component": "quote-card",
  "layout": "stack",
  "regions": [
    {
      "type": "group",
      "name": "header",
      "layout": "stack",
      "regions": [{ "type": "label", "name": "quote-label", "text": "QUOTE" }]
    },
    {
      "type": "group",
      "name": "main",
      "layout": "side-rail",
      "regions": [
        { "type": "decoration", "name": "quote-mark", "relation": "overlay" },
        { "type": "slot", "slot": "quote" }
      ]
    },
    { "type": "slot", "slot": "author" }
  ]
}
```

### 示例 B：居中金句（centered + 装饰）

```json
{
  "component": "quote-card",
  "layout": "centered",
  "regions": [
    { "type": "decoration", "name": "quote-mark", "relation": "overlay" },
    { "type": "slot", "slot": "quote" },
    { "type": "slot", "slot": "author" }
  ]
}
```

### 示例 C：左右分栏图文（media-text）

```json
{
  "component": "image-card",
  "layout": "media-text",
  "regions": [
    { "type": "slot", "slot": "image" },
    {
      "type": "group",
      "name": "meta",
      "layout": "stack",
      "regions": [{ "type": "slot", "slot": "caption" }]
    }
  ]
}
```

三种是三种不同构图，全程无 HTML / CSS / 任何 CSS 值。

---

## 10. 组件 Slot 契约速查（Compiler 消费依据，43 个内置组件）

> `abbr` 用于拼 class；`list` 型 slot 的条目字段见 `item_slots`。

### 10.1 magazine 级（专用渲染器）

| 组件(abbr)            | slot keys                      |
| --------------------- | ------------------------------ |
| magazine-cover(mc)    | title, subtitle, divider, desc |
| section-divider(sd)   | part, title                    |
| two-column-cards(tcc) | items(list: icon,title,desc)   |
| full-quote(fq)        | text                           |
| image-card(ic)        | image, caption                 |
| end-card(ec)          | title, subtitle, deco          |
| text-card(tc)         | body                           |

### 10.2 具名复杂组件（专用解析器）

| 组件(abbr)            | slot keys                                                                                                       |
| --------------------- | --------------------------------------------------------------------------------------------------------------- |
| product-card(pc)      | image, badge, title, subtitle, description, price, originalPrice, rating, sales, stock, button, tags(list)      |
| brand-sign(bs)        | brandName, tagline, slogan, subText, style, divider                                                             |
| resource-list(rl)     | title, subtitle, items(list: label,title,desc,meta,tag), numbered, layout                                       |
| testimonial-card(tcq) | avatar, quote, source, name, title, company, companyLogo                                                        |
| series-nav(sn)        | seriesName, current, total, description, prevLabel, prevTitle, nextLabel, nextTitle, items(list: cls,idx,title) |
| related-posts(rp)     | items(list: body)                                                                                               |

### 10.3 具名插槽组件

| 组件(abbr)        | slot keys                |
| ----------------- | ------------------------ |
| hero-banner(hb)   | image, title, subtitle   |
| quote-card(qc)    | quote, author            |
| cta-card(cta)     | title, body, action      |
| timeline(tl)      | title, items(list)       |
| stats-block(sb)   | items(list: value,label) |
| code-frame(cf)    | title, code              |
| divider-fancy(df) | label                    |

### 10.4 单 body 槽组件（走通用渲染）

| 组件(abbr)                                                                                                                                                                                                                                                                                                                                                                         | slot keys |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| callout-pro(cp) / image-grid(ig) / author-card(ac) / follow-bar(fb) / qr-card(qr) / numbered-heading(nh) / section-title(st) / image-text-row(itr) / share-card(sc) / toc-nav(tn) / tag-label(tag) / image-caption(icpt) / copyright-notice(cn) / faq(fq) / article-section(as) / code-block(cb) / steps(stp) / accordion(acc) / pullquote(pq) / divider(dv) / image-compare(icmp) | body      |

### 10.5 表格类（专用 block 槽）

| 组件(abbr)        | slot keys |
| ----------------- | --------- |
| styled-table(sbt) | table     |
| table(tbl)        | table     |

> 注：`full-quote` 与 `faq` 的 abbr 在 slotDefs 中均为 `fq`，属已知历史命名；Compiler 以 slotDefs 实际值为准。

---

## 11. 回退机制

- 主题未为某组件提供 `skeletons` → 用全局默认骨架（`defaultTemplates.ts`）。
- 主题提供了但 Validator 判定非法 → 丢弃该组件骨架，回退默认。
- 骨架与主题 CSS 是一体皮肤：切主题 = 骨架 + CSS 原子切换，整篇重渲染。

---

## 12. 定稿决策记录

| 决策             | 结论                                                                                                                       |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `group` 定位     | **提升为核心结构单元**，骨架 = 一棵空间树                                                                                  |
| `layout` 职责    | 容器级：描述"如何组织直接孩子"                                                                                             |
| `group` 职责     | 区域边界：描述"哪里是一个视觉区域"，可自带 layout                                                                          |
| CSS 值           | **硬禁止**，出现即非法（§0.1）                                                                                             |
| 嵌套深度上限     | group 嵌套 ≤ 2 层                                                                                                          |
| layout 枚举      | stack / centered / side-rail / split / grid / media-text（top-label/hero/overlay 移除，改由 group/centered/relation 表达） |
| `align`          | 保留在 DSL（属构图关系，非样式）                                                                                           |
| 组件×layout 兼容 | 由 Compiler 兜底，非硬拒绝                                                                                                 |

---

（文档结束 · v3 · DSL 定稿）
