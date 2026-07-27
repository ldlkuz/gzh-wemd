# Phase 3 总结 —— 变体系统

> 日期：2026-07-27
> 分支：feature/component-ecosystem

---

## 一、完成情况

| 事项                                  | 状态                                                   |
| ------------------------------------- | ------------------------------------------------------ |
| `data-variant` 属性机制               | ✅ 已有（markdown-it-component props → data-\* attrs） |
| 变体 CSS 示范（3 个 share-card 变体） | ✅                                                     |
| `getVariantCss()` 导出                | ✅                                                     |
| 编译通过                              | ✅                                                     |
| 全部测试通过（57 文件 / 306 用例）    | ✅                                                     |

## 二、产出文件

```
packages/core/src/components/
├── variants/
│   └── variantCss.ts          ← 变体 CSS 定义（warm/minimal/tech）
├── components/index.ts        ← getVariantCss() 导出
```

## 三、变体系统原理

### 3.1 data-variant 属性

markdown-it-component 已有机制：组件 props 自动转为 `data-*` 属性。

```markdown
::: share-card{variant="warm"}
如果觉得有用，欢迎分享 ❤️
:::
```

渲染为：

```html
<section class="wemd-share-card" data-variant="warm" ...>
  <section class="wemd-component-body">...</section>
</section>
```

### 3.2 CSS 选择器隔离

变体 CSS 使用 `[data-variant="warm"]` 属性选择器，不影响默认行为：

```css
#wemd .wemd-share-card[data-variant="warm"] {
  border-top: 2px solid var(--wemd-primary);
  background: linear-gradient(...);
}
```

未指定 variant 时使用默认样式，完全向后兼容。

### 3.3 内联兼容

ThemeProcessor 的 `injectComponentStylesManually` 已使用 `querySelectorAll`，天然支持 `[data-variant]` 属性选择器，微信公众号复制后变体样式也能正确内联。

## 四、示范变体

| 变体      | 用途   | 视觉效果                           |
| --------- | ------ | ---------------------------------- |
| `warm`    | 温暖风 | 渐变背景 + 粗主色顶线 + 加强字号   |
| `minimal` | 极简风 | 细线分隔 + 小字灰色                |
| `tech`    | 科技风 | 等宽字体 + 主色渐变背景 + 圆角边框 |

## 五、使用方式

在组件语法中加 `variant` 属性即可：

```markdown
::: share-card{variant="warm"}
喜欢这篇文章？点个赞吧 💚
:::
```

AI 也可在生成 insertions 时指定 variant：

```typescript
{
  component: "share-card",
  props: { variant: "warm" },
  body: "如果这篇文章触动了你...",
}
```
