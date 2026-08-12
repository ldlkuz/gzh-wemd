# Assembler & Compiler 阶段

## Assembler：State → 最终输出映射

### 合并规则

1. 每个 State 直接映射到同名顶级字段
2. `component_mapping.json` → `components`（字段名简化）
3. `design_tokens` 是跨阶段的受控词汇表，从 `component_mapping` 提取为独立字段
4. `metadata` 和 `schema` 是固定结构，由 Assembler 直接注入

最终输出是一个完整的 JSON 对象，不是多个文件。完整示例见 `output/example/demo-theme.json`。

## Compiler：生成阶段

Assembler 输出 `BrandVisualTheme.json` 后，Compiler 将其编译为可预览的 HTML 页面。

### 子阶段划分

```text
子阶段 A — 开发预览（CSS 类版本）
  输出：output/preview/{theme-name}-preview.html
  特点：<style> 标签 + #wemd .wemd-* 选择器
  用途：本地调试、验证组件渲染

子阶段 B — 公众号发布（全内联版本）
  输出：output/publish/{theme-name}.html
  特点：纯 HTML 片段，全部样式内联
  用途：直接复制到公众号编辑器
```

### 子阶段 A：编译规则

| 输入                      | 输出                                   |
| ------------------------- | -------------------------------------- |
| `visual_language`         | CSS 变量系统（`:root {}`）             |
| `design_tokens`           | 设计语义值（强调度、圆角、阴影、动画） |
| `components.brand_anchor` | 每个 Brand Anchor 的完整独立样式       |
| `components.content`      | 克制继承的 Content 组件样式            |
| `components.utility`      | 最小化的 Utility 组件样式              |

### 三分类样式的差异

```
Brand Anchor: 边到边突破留白 · 极端对比 · 动态装饰 · 静态动画残留
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

- `output/preview/{theme-name}-preview.html` — 开发预览（带 `<style>` 标签），可通过 `OpenPreview` 工具直接预览
- `output/publish/{theme-name}.html` — 公众号发布（全内联），可直接复制到公众号编辑器

### 输出验证

1. **开发预览格式** → 浏览器打开，逐组件检查渲染是否正确
2. **公众号发布格式** → 复制到公众号编辑器预览，检查：颜色、字体、布局、组件标识

---

## 微信发布兼容性规则 {#wechat-compatibility}

微信公众号内置浏览器 CSS 支持有限，**在 Compiler 生成 CSS 时**，必须遵守以下规则。**这是"禁止 + 替代"策略**：读到微信不支持的表达时，先理解意图（读 `design.direction`），再提供微信兼容的等价替代，而非简单删除导致装饰丢失。完整口径见 `css-compiler/prompts/06-compiler.md`。

### 禁止 → 替代清单

| CSS 特性                                                                    | 原因                       | 微信兼容替代                                                                                                                                                                                                                                                                                                                                                        |
| --------------------------------------------------------------------------- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `::before` / `::after` 伪元素                                               | 微信不支持，样式静默丢失   | 合并到父元素 `background`（多图层渐变），或改用真实子元素                                                                                                                                                                                                                                                                                                           |
| `:hover` 伪类                                                               | 微信不支持，样式静默丢失   | 只保留静态样式，hover 效果直接移除                                                                                                                                                                                                                                                                                                                                  |
| `:first-child` / `:last-child` / `:first-of-type` / `:nth-child` 等结构伪类 | 微信不支持，样式静默丢失   | 使用 class 选择器（如 `.wemd-hb-title`、`.wemd-stat-1`，或普通组件 body 内的 `.wemd-child-N`）。**普通组件（hasBody:true）body 内真实 DOM = 原生标签 + `.wemd-child-N` 两者共存**，`.wemd-child-N` 由 `ThemeProcessor.addChildPositionClasses` 附加且微信兼容，定位更稳，优先使用；结构伪类（如 `> p:first-child`）虽能匹配预览但会被微信清理，**不应用于最终 CSS** |
| `@keyframes` 动画                                                           | 微信不支持，样式静默丢失   | 移除动画，保留静态最终态样式                                                                                                                                                                                                                                                                                                                                        |
| `@media` 媒体查询                                                           | 微信非响应式，样式静默丢失 | 以移动端约 343px 默认值直接内联，移除媒体查询块，不产生 @media                                                                                                                                                                                                                                                                                                      |
| `animation` / `animation-delay` 属性                                        | 微信不支持，样式静默丢失   | 直接移除                                                                                                                                                                                                                                                                                                                                                            |
| `+` 相邻兄弟 / `~` 通用兄弟选择器                                           | 微信不支持，样式静默丢失   | 使用 class 选择器                                                                                                                                                                                                                                                                                                                                                   |
| `position` 定位属性                                                         | 微信不支持，样式静默丢失   | 并入常规流布局或父元素背景                                                                                                                                                                                                                                                                                                                                          |
| 多栏 grid / 宽幅构图                                                        | 公众号内容区约 343px 单列  | 收敛为单栏流式布局                                                                                                                                                                                                                                                                                                                                                  |

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
#wemd .wemd-hero-banner .wemd-component-body > p:first-of-type {
  font-size: 2rem;
}

/* ✅ 兼容 */
#wemd .wemd-hero-banner .wemd-component-body > p.wemd-hb-title {
  font-size: 2rem;
}
```

**注意**：完整 CSS（含伪元素、动画等）仍然保留在 `output/css/{theme-name}.css` 中，用于开发预览。但所有进入 `theme-package` 的 CSS 必须先经过 `cleanVariantCss` 清理。
