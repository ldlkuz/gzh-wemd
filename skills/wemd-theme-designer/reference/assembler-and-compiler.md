# Assembler & Compiler 阶段

## Assembler：State → 最终输出映射

### 合并规则

1. 每个 State 直接映射到同名顶级字段
2. `component_mapping.json` → `components`（字段名简化）
3. `skeleton_intent.json` → `skeletons`（形，顶层字段，与 `components` 并列）
4. `design_tokens` 是跨阶段的受控词汇表，从 `component_mapping` 提取为独立字段
5. `metadata` 和 `schema` 是固定结构，由 Assembler 直接注入

最终输出是一个完整的 JSON 对象，不是多个文件。完整示例见 `reference/example/demo-theme.json`。

> **回退一致性**：骨架（`skeletons`）是"骨"的可信度开关。
>
> - 骨架合法 → 保留；有对应 `component_mapping` 用自定义 CSS，无则默认 CSS。
> - 骨架非法 → 该组件骨架 + component_mapping 整套回退默认，避免"自定义皮挂到默认骨"的半残状态。

## Compiler：生成阶段

Assembler 输出 `BrandVisualTheme.json` 后，Compiler 将其编译为可预览的 HTML 页面。

### 子阶段划分

```text
子阶段 A — 开发预览（CSS 类版本）
  输出：themes/{theme-name}/preview/{theme-name}-preview.html
  特点：<style> 标签 + #wemd .wemd-* 选择器
  用途：本地调试、验证组件渲染

子阶段 B — 公众号发布（全内联版本）
  输出：themes/{theme-name}/publish/{theme-name}.html
  特点：纯 HTML 片段，全部样式内联
  用途：直接复制到公众号编辑器
```

### 子阶段 A：编译规则

| 输入                 | 输出                                         |
| -------------------- | -------------------------------------------- |
| `visual_language`    | CSS 变量系统（`:root {}`，方向性描述为基础） |
| `design_tokens`      | 受控词表（强调度、密度、装饰、对比度档位）   |
| `skeletons`          | 骨架 Intent → 安全 DOM（Mustache 模板）      |
| `components.focal`   | 每个焦点组件（深度设计焦点集）的完整独立样式 |
| `components.content` | 克制继承的 Content 组件样式                  |
| `components.utility` | 最小化的 Utility 组件样式                    |

### 骨架 Compiler：Intent → 安全 DOM

`BrandVisualTheme.skeletons` 里的骨架 Intent 需先编译为安全 HTML（Mustache 模板），再进入渲染。规则见 `reference/skeleton-design-spec.md` §7：

| 骨架要素            | 推导规则（写死在 Compiler，AI 不命名） | 示例                             |
| ------------------- | -------------------------------------- | -------------------------------- |
| 根容器              | 写死 `wemd-component wemd-{id}`        | `wemd-component wemd-quote-card` |
| group 容器          | `wemd-{abbr}-{groupName}`              | `wemd-qc-main`                   |
| `layout` 容器       | `wemd-{abbr}-{layout}`                 | `wemd-qc-side-rail`              |
| `region=slot`       | `wemd-{abbr}-{slotkey}`                | `wemd-qc-quote`                  |
| `region=decoration` | `wemd-{abbr}-{decName}`                | `wemd-qc-quote-mark`             |
| `region=label`      | `wemd-{abbr}-label`                    | `wemd-qc-label`                  |
| `region=rule`       | `<hr class="wemd-{abbr}-rule">`        | `wemd-qc-rule`                   |

> `abbr` 来源：主程序 `slotDefs.ts`（`getComponentAbbr`）。Compiler 直接 require 主程序编译产物 `slotDefs.js`，与主程序渲染保持一致。骨架只描述结构，class 由此处确定性推导，**AI 不参与命名**。

### CSS 三层组装链：皮如何挂到骨上

`components.*.design.direction` 是自然语言，不能直接变 CSS。Compiler 需三层推导：

```text
visual_language（颜色方向、排版气质、布局密度）     ← 创意阶段
   ↓ 提炼
design_tokens（emphasis / density / decoration / contrast）  ← 受控词汇表
   ↓ 结合 design.direction 的自然语言描述
具体 CSS 值（颜色、字号、间距、圆角、阴影、装饰）   ← Compiler 机械翻译
   ↓ 挂到
骨架 class（wemd-{abbr}-{slot} / wemd-{abbr}-{layout}）  ← 确定性推导
```

- `design.direction` 描述"视觉意图"（如"超大字重标题叠加大胆几何图形"），不是 CSS 值。
- Compiler 读 `visual_language.typography.character`（如 `bold`）决定字号缩放，读 `design_tokens.emphasis`（如 `high`）决定是否加阴影/装饰，最终产出精确 CSS。
- AI 不输出 `padding: 23px` 这类 CSS 值；若骨架 DSL 中出现 CSS 值，Validator 判定非法并整套回退。

### 三分类样式的差异

```
focal（焦点组件）: 边到边突破留白 · 极端对比 · 动态装饰 · 静态动画残留
Content:      标准容器 · 克制装饰 · 可读性优先 · 无动画
Utility:      极简样式 · 低可见度 · 无装饰 · 无动画
```

> **画布约束**：最终载体是微信公众号，内容区约 343px 的单列窄流。所有组件**移动优先**，只生成一种宽度布局，不产生 `@media` 查询。

### 子阶段 B：公众号发布格式转换规则

| 原始 CSS 特性                   | 转换方式                                          |
| ------------------------------- | ------------------------------------------------- |
| CSS 变量 `--wemd-*`             | 展开为具体颜色/值（如 `#00E5FF`）                 |
| `rem` 单位                      | 转为 `px`（基准 16px，如 `1.5rem` → `24px`）      |
| `::before`/`::after` 伪元素     | 转为实际 DOM 子元素（如 `<div>`）                 |
| `@keyframes` 动画               | 移除动画，保留静态样式                            |
| `@media` 查询                   | 以移动端默认值直接内联，移除媒体查询              |
| 外部字体加载（Google Fonts 等） | 替换为系统字体栈                                  |
| CSS 类选择器（`#wemd .wemd-*`） | 转为元素 `style=""` 属性                          |
| `wemd-component` 组件标识       | 保留 `class`、`data-component`、`data-props` 属性 |
| `<style>` 标签                  | 移除，全部样式已内联到各元素                      |
| `<html>/<head>/<body>` 结构     | 移除，仅保留纯 HTML 片段                          |

### 输出位置

- `themes/{theme-name}/preview/{theme-name}-preview.html` — 开发预览（带 `<style>` 标签），可通过 `OpenPreview` 工具直接预览
- `themes/{theme-name}/publish/{theme-name}.html` — 公众号发布（全内联），可直接复制到公众号编辑器

### 输出验证

1. **开发预览格式** → 浏览器打开，逐组件检查渲染是否正确
2. **公众号发布格式** → 复制到公众号编辑器预览，检查：颜色、字体、布局、组件标识

---

## 微信发布兼容性规则 {#wechat-compatibility}

微信公众号内置浏览器 CSS 支持有限，**在 Compiler 生成 CSS 时**，必须遵守以下规则。**这是"禁止 + 替代"策略**：读到微信不支持的表达时，先理解意图（读 `design.direction`），再提供微信兼容的等价替代，而非简单删除导致装饰丢失。完整口径见 `css-compiler/prompts/06-compiler.md`。

### 禁止 → 替代清单

| CSS 特性                                                                    | 原因                       | 微信兼容替代                                                                                                                                                                                                                                                                                       |
| --------------------------------------------------------------------------- | -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `::before` / `::after` 伪元素                                               | 微信不支持，样式静默丢失   | 合并到父元素 `background`（多图层渐变），或改用真实子元素                                                                                                                                                                                                                                          |
| `:hover` 伪类                                                               | 微信不支持，样式静默丢失   | 只保留静态样式，hover 效果直接移除                                                                                                                                                                                                                                                                 |
| `:first-child` / `:last-child` / `:first-of-type` / `:nth-child` 等结构伪类 | 微信不支持，样式静默丢失   | 使用具名 class 选择器（如 `.wemd-hb-title`、`.wemd-qc-quote`）。骨架语义化后每个 slot 有确定的 `wemd-{abbr}-{slot}` class；body slot 组件用 `.wemd-component-body > p` 等。**`.wemd-child-N` 序号 class 已废弃**，结构伪类（如 `> p:first-child`）虽能匹配预览但会被微信清理，**不应用于最终 CSS** |
| `@keyframes` 动画                                                           | 微信不支持，样式静默丢失   | 移除动画，保留静态最终态样式                                                                                                                                                                                                                                                                       |
| `@media` 媒体查询                                                           | 微信非响应式，样式静默丢失 | 以移动端约 343px 默认值直接内联，移除媒体查询块，不产生 @media                                                                                                                                                                                                                                     |
| `animation` / `animation-delay` 属性                                        | 微信不支持，样式静默丢失   | 直接移除                                                                                                                                                                                                                                                                                           |
| `+` 相邻兄弟 / `~` 通用兄弟选择器                                           | 微信不支持，样式静默丢失   | 使用 class 选择器                                                                                                                                                                                                                                                                                  |
| `position` 定位属性                                                         | 微信不支持，样式静默丢失   | 并入常规流布局或父元素背景                                                                                                                                                                                                                                                                         |
| 多栏 grid / 宽幅构图                                                        | 公众号内容区约 343px 单列  | 收敛为单栏流式布局                                                                                                                                                                                                                                                                                 |

### CSS 设计替代方案

**伪元素替代方案**：将 `::before`/`::after` 的装饰效果合并到父元素样式中：

```css
/* ❌ 不兼容 */
#wemd .wemd-magazine-cover::before {
  content: "";
  position: absolute;
  inset: 0;
  background: radial-gradient(...);
}

/* ✅ 兼容 — 合并到父元素 background（不使用 position） */
#wemd .wemd-magazine-cover {
  background: radial-gradient(...), linear-gradient(...);
}
```

**结构伪类替代方案**：用具名 class 替代：

```css
/* ❌ 不兼容 */
#wemd .wemd-quote-card .wemd-component-body > p:first-of-type {
  font-weight: 700;
}

/* ✅ 兼容 — 具名 slot class */
#wemd .wemd-quote-card .wemd-qc-quote {
  font-weight: 700;
}
```

**注意**：完整 CSS（含伪元素、动画等）仍然保留在 `themes/{theme-name}/css/{theme-name}.css` 中，用于开发预览。但所有进入 `themes/{theme-name}/package` 的 CSS 必须先经过 `cleanVariantCss` 清理。
