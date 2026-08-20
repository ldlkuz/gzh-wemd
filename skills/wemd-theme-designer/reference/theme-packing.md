# 阶段7：主题打包

将 Compiler 输出的主题文件打包为可导入主程序的 `.wemd-theme` 压缩包。

## 主题包结构

```text
{theme-name}.wemd-theme/
├── manifest.json       # 主题元信息、设计令牌、组件变体 CSS
├── brand.md            # 品牌描述文档
├── styles/
│   └── components.css  # 完整 CSS 样式（经过微信兼容清理）
└── templates/          # 组件骨架模板（可选，未提供则主程序回退默认骨架）
    └── <componentId>.html  # Mustache HTML 骨架，来自 compile-skeleton.cjs 产物
```

## manifest.json 字段说明

| 字段         | 类型   | 说明                                                                                                       |
| ------------ | ------ | ---------------------------------------------------------------------------------------------------------- |
| `sdkVersion` | string | 主题包 SDK 版本号，当前为 `"1.0.0"`                                                                        |
| `meta`       | object | 主题元信息：`id`、`name`、`description`、`keywords`、`version`（来自 AI 产出的 `manifest.json`）            |
| `tokens`     | object | 设计令牌：`color`（颜色映射，从 CSS 变量推导）、`typography`（排版）、`spacing`（间距）、`border`（圆角）、`shadow`（阴影） |
| `components` | object | 组件变体定义：`{componentId: { enabled, variant, variantCss }}`（从 CSS 提取）                              |
| `layout`     | object | 布局偏好：`preferredComponents`、`density`、`tone`、`defaultVariants`（来自 AI 产出的 `manifest.json`）     |
| `codeTheme`  | string | 代码块主题名（来自 AI 产出的 `manifest.json`）                                                              |

## variantCss 生成规则

1. **选择器转换**：`#wemd .wemd-xxx` → `.wemd-xxx[data-variant="theme-name"]`
2. **CSS 变量解析**：`var(--wemd-xxx)` → 递归解析为实际颜色/值
3. **微信兼容性清理**（通过 `cleanVariantCss` 函数执行）：
   - 移除 `:hover` 伪类规则块
   - 移除 `:first-child` / `:last-child` / `:first-of-type` / `:nth-child` 等结构伪类规则块
   - 移除 `@keyframes` 动画块
   - 移除 `@media` 媒体查询块
   - 移除 `animation` / `animation-delay` 属性声明
   - 移除 `+` 相邻兄弟 / `~` 通用兄弟选择器规则块
   - **伪元素规则分两种情况**：
     - 纯中和规则 `::before/::after { content: none }`（仅此声明，可带 `!important`）**保留**——与内置主题一致，只抑制共享组件的伪元素装饰（callout-pro 左竖条 / divider 侧线），本身不产生视觉，物化器遇到 `content: none` 会跳过物化；缺失反而导致预览/导出双装饰
     - 其余 `::before/::after` 装饰规则**移除**
4. **中和规则的落点**：中和规则只保留在 `styles/components.css`（主程序注入顺序最末，最终视觉话语权），**不放** `manifest.components[*].variantCss`：
   - 放 variantCss 会因含 `#wemd` 前缀导致 `normalizeVariantCss` 短路，不再为同组件其他变体规则补 `#wemd` → 特异性不足被共享样式覆盖
   - 转成 `[data-variant]` 形式后物化器按 `.wemd-xxx::before` 字面子串匹配不到 → 导出仍物化共享装饰
5. **组件提取边界**：`extractComponentCss` 以「下一个分区注释头（`/* ====`）」为结束边界，避免把下一组件的注释头划进当前组件（注释里的 `::before/::after` 会被校验器误报）
6. 完整 CSS 保留在 `styles/components.css` 中，同样经过 `cleanVariantCss`（保留中和规则）处理

## 打包流程

1. 运行 `node scripts/compile-skeleton.cjs <theme-name>` 读自由模板 `themes/{theme-name}/templates/*.html`，编译为 `themes/{theme-name}/package/templates.json`（无模板则跳过，主题回退默认骨架）
2. 运行 `node scripts/pack-theme.cjs <theme-name>` 生成中间文件到 `themes/{theme-name}/package/`
   - 打包前自动执行 `scripts/validate-css-selectors.mjs` 校验 CSS 选择器与嵌套 var，校验失败则中止打包
   - 自动把 `templates.json` 展开为 `templates/<id>.html`（供主程序加载）
3. 执行 PowerShell 命令打包：
   ```powershell
   Compress-Archive -Path "./manifest.json","./brand.md","./styles","./templates" -DestinationPath "../{theme-name}.wemd-theme" -Force
   ```
4. 使用 `node scripts/validate-theme.cjs` 验证 manifest.json 规范性

## 打包脚本 (`scripts/pack-theme.cjs`)

核心流程：

1. **读取输入**：`themes/{theme}/manifest.json`（AI 端到端产出：meta / layout / codeTheme / brand）+ `themes/{theme}/css/{theme}.css` + `themes/{theme}/package/templates.json`
2. **打包前校验**：调用 `scripts/validate-css-selectors.mjs`，校验 CSS 是否引用不存在的 `.wemd-xxx` class（臆造 class）、是否出现嵌套 `var(--a, var(--b))` fallback（BUG-0010 雷区）；校验失败立即中止
3. **提取 CSS 变量**：从 `#wemd { ... }` 块解析 CSS 变量定义（数量动态，随主题 CSS 变量系统而定）
4. **构建 manifest**：映射颜色、排版、间距、边框、阴影等设计令牌
5. **提取组件 CSS**：通过 `#wemd .wemd-xxx` 选择器精确定位每个组件的样式块
6. **转换选择器**：将 `#wemd .wemd-xxx` 转为 `.wemd-xxx[data-variant="theme-name"]`
7. **解析 CSS 变量引用**：`var(--xxx)` → 递归替换为实际值
8. **清理微信不兼容特性**：移除伪元素、结构伪类、动画等
9. **写入文件**：`manifest.json`、`brand.md`、`styles/components.css`
10. **展开骨架**：读取 `themes/{theme-name}/package/templates.json`（compile-skeleton.cjs 产物），写入 `templates/<id>.html`；产物缺失则跳过并提示

## DOM 结构权威文档

`reference/dom-structure.md` 是组件 DOM 结构的唯一权威基准，由 `scripts/extract-dom-snapshot.mjs` 从主程序真源（`defaultTemplates.ts` + `slotDefs.ts`）自动生成。写 CSS / 校验选择器前必须查阅，**禁止手工维护**。

## 验证脚本 (`scripts/validate-theme.cjs`)

验证规则：

- 检查 `manifest.json` 结构完整性（必填字段、类型校验）
- 统计组件数量和 variantCss 覆盖率
- 输出验证结果（通过/警告/错误）

## 回归验证脚本（Stage 4 一键执行）

打包并 `validate-theme.cjs` 通过后，再跑两道可复用验证（提炼自主程序测试，对应主程序 VerifyImportFlow.test.ts / defaultThemeDomMatch.test.ts）：

```powershell
# 1) 包级验证：导入器加载 / renderTheme / #wemd 前缀 / 级联顺序 / 伪元素 / 共享装饰中和
node scripts/verify-theme-package.cjs <theme-name>

# 2) 渲染级验证：导出无伪元素/结构伪类/整篇背景、divider 无双线、callout-pro 无双竖条
#    需在 packages/core 下执行（vitest 所在），或仓库根已装 vitest
npx vitest run --config ..\..\skills\wemd-theme-designer\vitest.config.ts
#    限定单个主题：$env:WEMD_THEME="retro-newspaper"; npx vitest run --config ..\..\skills\wemd-theme-designer\vitest.config.ts
```

两道全部通过才算回归验证达标；有未通过项必须先修再交付。

## 输出位置

- `themes/{theme-name}/package/manifest.json` — 主题包核心配置文件
- `themes/{theme-name}/package/brand.md` — 品牌描述文档
- `themes/{theme-name}/package/styles/components.css` — 完整 CSS 样式
- `themes/{theme-name}/package/templates/<id>.html` — 组件骨架模板（可选）
- `themes/{theme-name}/{theme-name}.wemd-theme` — 最终压缩包
