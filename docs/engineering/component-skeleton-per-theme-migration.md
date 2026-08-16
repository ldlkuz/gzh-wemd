# 组件骨架随主题迁移 — 主程序实施文档

> 状态：待评审
> 目标：让"切换主题 = 切换整套组件"，每套主题独立携带自己的组件骨架（DOM 结构）；文章标记的组件自动用当前主题的组件渲染，与上一个主题无关。
> 范围：**仅主程序**（`packages/core`，必要时 `apps/web`）。skill 层（`skills/wemd-theme-designer`）本次不动。
> 说明：项目**尚未发布**，无存量主题包袱。所有主题必须带全量 `templates/`，不存在"老主题兜底"。

---

## 0. 背景与决策

### 0.1 问题

现状组件 DOM 由主程序渲染器**写死**：

- 普通组件 → `wemd-component-body` + 自由 markdown（`markdown-it-component.ts`）
- 杂志级组件 → `magazineRenderers.ts` 专用渲染器

主题只能通过 CSS 上色/调间距 → **切主题基本等于换颜色**，形态差异有限。

### 0.2 决策（已与用户确认）

> **骨架 = 随主题**。主题包自带 `templates/<component>.html`，一组件一份骨架；切主题时连 DOM 一起换。文章里 `::: quote-card` 表示"在当前主题里找一个叫 quote-card 的组件来渲染"。

- 主题 A 的 quote-card = 左引号 + 右文字
- 主题 B 的 quote-card = 居中圆卡 + 大引号
- 主题 C 未定制 quote-card → 继承**内置默认骨架**（组件默认实现，非老主题兼容）

**决策 1 — 内置主题升级为同种路线**
内置 12 套主题（`builtin-themes/index.ts`）不再只是 token 提供者，**升级为与 AI 生成主题同种的"主题包 + templates"结构**，也要有自己的组件骨架。同一条渲染链路，无特殊分支。

**决策 2 — AI 排版不填 variant**
AI 排版时不再为每个组件填写 `variant`（不再有 `{ variant: "center" }` 这类输出）。组件渲染形态由**当前主题统一决定**，AI 不参与选择。组件 `variant` 概念保留在内置默认样式层（`variantCss.ts`），但 AI 排版链路移除 variant 输出。（彻底删除 variant 属于后续，本次只去掉"AI 选变体"。）

### 0.3 本次只改主程序，做什么 vs 不做什么

**做**：

1. 主程序"读主题包 templates → 渲染组件骨架；组件未定制则继承内置默认骨架"
2. 内置主题升级为"主题包 + templates"结构（同 AI 生成路线）
3. AI 排版链路移除 variant 输出
4. 清理 `.wemd-child-N` 位置寻址（无存量包袱，一次性收拾干净）

**不做**：skill 生成 templates 的管线、registry Slot 化、skill 编译逻辑、彻底删除 variant 概念。

> 说明：无存量主题，**不设任何兼容层**。没有 `templates/<id>.html` 的组件，用内置默认骨架渲染（`defaultTemplates.ts`）；这不是"照顾老主题"，而是"组件默认实现被主题继承"。`ThemeProcessor` 及 `.wemd-child-N` 一并清理，不做回退。

---

## 1. 目标架构（主程序侧）

### 1.1 渲染链路

```
组件原始 markdown 内容
   ↓
取当前主题的 templates/<id>.html（组件未定制则用内置默认骨架）
   ↓
slot-parser 按 Input Contract 分槽（把内容 map 到 slot:key）
   ↓
template-filler 填充占位符（{{slot:key}} / {{#each}} / {{this.field}}）
   ↓
输出 Slot class 结构（wemd-{abbr}-{slot}）
```

### 1.2 模板格式（Mustache 子集，仅 3 个语法）

```html
<!-- templates/quote-card.html -->
<section class="wemd-component wemd-quote-card" data-component="quote-card">
  <div class="wemd-qc-quote">{{slot:quote}}</div>
  <div class="wemd-qc-author">{{slot:author}}</div>
</section>
```

list 类用 `{{#each}}`：

```html
<section class="wemd-component wemd-stats-block" data-component="stats-block">
  <div class="wemd-sb-items">
    {{#each items}}
    <div class="wemd-sb-item">
      <span class="wemd-sb-value">{{this.value}}</span>
      <span class="wemd-sb-label">{{this.label}}</span>
    </div>
    {{/each}}
  </div>
</section>
```

### 1.3 内置默认骨架（组件默认实现）

- 从现有 `magazineRenderers.ts` 的 DOM 结构**固化**为默认模板（`defaultTemplates.ts`）。
- 作用：**组件默认实现**。主题未定制某组件时，渲染用默认骨架（继承），保证所有主题都有完整组件形态，无需每套主题复制全部 43 个模板。
- 普通组件（原 `wemd-component-body`）默认骨架 = 一个 `wemd-{abbr}-body` 槽，内容走 slot-parser 的 `body` 兜底。

---

## 2. 阶段划分（仅主程序）

> 每阶段跑对应测试，通过再进下一阶段。

### Phase 1 — 分槽器 + 模板填充器（纯函数，无依赖）

新增两个纯函数模块，不接入渲染器，先建立数据能力。

| 文件                                                         | 改动                                                                                |
| ------------------------------------------------------------ | ----------------------------------------------------------------------------------- |
| 新增 `packages/core/src/plugins/component/templateFiller.ts` | 填充器：替换 `{{slot:key}}`、`{{#each}}`、`{{this.field}}`                          |
| 新增 `packages/core/src/plugins/component/slotParsers.ts`    | 通用 slot-parser：按 Input Contract 确定性分槽；list 递归；未归入段落进 `body` 兜底 |

**验收**：新增单测覆盖填充器与分槽器。

### Phase 2 — 内置默认骨架（组件默认实现）

| 文件                                                           | 改动                                                          |
| -------------------------------------------------------------- | ------------------------------------------------------------- |
| 新增 `packages/core/src/plugins/component/defaultTemplates.ts` | 从 `magazineRenderers.ts` 现有 DOM 固化；普通组件给 `body` 槽 |

**验收**：defaultTemplates 覆盖 43 组件（含已具名 + 普通）。

### Phase 3 — 主题包加载 templates

| 文件                                                     | 改动                                                                                              |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `packages/core/src/theme-registry/themePackageLoader.ts` | 解压读 `templates/*.html`；`LoadedThemePackage` 加 `templates: Map<string,string>`；`repack` 回写 |
| `packages/core/src/theme-schema/types.ts`                | 主题包类型加 `templates` 字段                                                                     |

**验收**：`themePackageLoader.test.ts` 通过；round-trip 保留 templates。

### Phase 4 — 渲染器接入骨架

| 文件                                                 | 改动                                                                                                |
| ---------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `packages/core/src/plugins/markdown-it-component.ts` | 统一走"取模板 → 分槽 → 填充"；杂志级组件也走模板（用内置默认），不再直接用 `magazineRenderers` 输出 |
| `packages/core/src`（ThemeProcessor 相关）           | 清理 `.wemd-child-N` 位置寻址逻辑，改为 Slot class 寻址                                             |

**验收**：`markdown-it-component.test.ts` 通过；quote-card/stats-block 渲染出 Slot class；无 `.wemd-child-N` 残留。

### Phase 5 — 内置主题升级为同种路线

内置 12 套主题从"纯 token"升级为"主题包 + templates"，与 AI 生成主题同一条链路。

| 文件                                        | 改动                                                                         |
| ------------------------------------------- | ---------------------------------------------------------------------------- |
| `packages/core/src/builtin-themes/index.ts` | 每套主题提供 `templates`（可引用内置默认骨架，仅在需要的组件上定制专属骨架） |
| `packages/core/src/theme-renderer/index.ts` | 渲染时把内置主题的 templates 纳入同一渲染链路（无特殊分支）                  |

**验收**：内置主题切主题时组件骨架正确；与 AI 主题共用渲染代码路径。

### Phase 6 — AI 排版移除 variant 输出

| 文件                                                 | 改动                                                            |
| ---------------------------------------------------- | --------------------------------------------------------------- |
| `apps/web/src/services/template/componentSchemas.ts` | 移除 `propsExample.variant`；组件 schema 不再引导 AI 填 variant |
| `apps/web/src/services/ai/aiPrompts.ts`              | 排版提示不再要求输出组件 variant                                |
| `apps/web/src/services/template/templatePrompt.ts`   | 同理，移除 variant 约束                                         |
| `apps/web/src/services/template/renderer.ts`         | variant 缺失时用主题默认，不再依赖 AI 传入 variant              |

**验收**：AI 排版输出组件不带 variant；渲染仍正确（用当前主题决定形态）。

### Phase 7 — 前端接入（apps/web）

| 文件                                                  | 改动                                                          |
| ----------------------------------------------------- | ------------------------------------------------------------- |
| 渲染调用链                                            | 把当前主题的 `templates` Map 传入渲染器；组件未定制用内置默认 |
| `apps/web/src/components/Preview/MarkdownPreview.tsx` | 确认切主题触发重新渲染（骨架随主题变）                        |

**验收**：UI 切主题，组件骨架随之变化。

---

## 3. 验收标准（主程序）

- [ ] 主题包带 templates 时，组件按主题骨架渲染（UI 验证）
- [ ] 组件未定制时，用内置默认骨架渲染，不报错
- [ ] 内置主题升级后与 AI 生成主题走同一条渲染链路（无特殊分支）
- [ ] AI 排版输出组件不带 variant，渲染仍正确（用当前主题决定形态）
- [x] `.wemd-child-N` 已清理，无残留（主程序源码 `packages/core/src`、`apps/web/src` 已全量复核）
- [ ] `packages/core` 相关测试全绿
- [ ] slot-parser 对自由 markdown 段落用 `body` 兜底，不丢内容
- [ ] 切主题触发重新渲染，骨架随主题变化

---

## 4. 风险

| 风险                           | 缓解                                            |
| ------------------------------ | ----------------------------------------------- |
| 分槽器对自由 markdown 覆盖不全 | `body` 槽兜底，不丢内容                         |
| 内置主题升级引入回归           | 与 AI 主题共用链路，单测覆盖；阶段推进补测      |
| AI 移除 variant 后渲染缺参     | renderer 用主题默认兜底，不依赖 AI 传入 variant |
| 清理 `.wemd-child-N` 影响渲染  | 无存量数据，单测断言无残留；阶段推进补测        |
| 渲染器改动引入回归             | 阶段推进，每阶段跑测试                          |
| 范围蔓延到 skill               | 文档明确"本次不做"，只做主程序                  |
