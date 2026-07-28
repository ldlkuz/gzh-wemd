# 升级回归检查清单

> 每次做较大改动前，逐项过一遍。涉及哪层就检查哪层，不涉及的层跳过。

---

## UI 层

- [ ] 顶栏所有按钮样式统一（白底 + 2px 边框 + 阴影），"复制到公众号"不是绿色
- [ ] 编辑器头部左侧与顶栏左侧对齐
- [ ] 侧边栏切换按钮在编辑器头部，不在页面左侧独立位置
- [ ] 主题预览框与实时预览效果一致（截图对比）
- [ ] ThemePanel 等面板组件的 CSS 不泄漏到全局（有作用域前缀）
- [ ] 暗色模式切换不影响预览内容样式
- [ ] numbered-heading 等标题组件不超出预览框边界

---

## AI 排版层

- [ ] 纯文本输入能自动转换为 Markdown 再排版
- [ ] 读者画像参数生效（开发者/管理者/小白各生成一篇对比）
- [ ] 排版丰富度参数生效（high/medium/low 各生成一篇对比）
- [ ] AI 重新生成时基于原始 Markdown，不是基于已排版内容
- [ ] 杂志排版模式输出不包含已废弃的组件插入模式元素
- [ ] AI 排版不硬编码"分享/点赞/在看"（检查 share-card 输出）
- [ ] AI 输出的 Template JSON 中每个 node 包含 design 和 reason 字段
- [ ] article-section 的 fromParagraph/toParagraph 在有效范围内
- [ ] 所有 article-section 合起来覆盖正文主体内容

---

## 渲染层

- [ ] 预览样式 ≈ 复制到公众号后样式（截图对比）
- [ ] 复制 HTML 代码内容与预览一致
- [ ] 目录不出现双重编号（预览模式 vs 复制模式各检查一次）
- [ ] CSS 变量全量展开（无中断，grep 计数对比）
- [ ] 伪元素规则（::before / ::after）不导致内联崩溃
- [ ] 组件 CSS 中 content 属性不含裸三引号（`"""`）
- [ ] 主题不含 components 字段时不报错（injectVariantCss null 检查）

---

## AI 主题生成层

- [ ] AI 主题生成失败时显示错误提示，不把 raw JSON 当 CSS 传给预览
- [ ] AI 主题 JSON 不含 components 字段时不报错（validateThemeJson 默认值）
- [ ] AI 生成的 CSS 不含 `<script>`、`javascript:`、`expression()`、`@import`、外部 `url()`
- [ ] AI 生成的 CSS 不给 #wemd 设置 background-color
- [ ] AI 生成的 CSS 不设置 width/max-width/margin:auto
- [ ] AI 生成的 CSS 字体大小 ≥ 14px（移动端可读性）

---

## 构建层

- [ ] 打包 exe 时使用 `.tmp/electron-cache` 缓存，不重新下载 Electron
- [ ] 输出 NSIS 安装包 + portable zip 两种格式
- [ ] 应用大小 ~40MB（无后端依赖）
- [ ] Electron 启动无后端初始化延迟
- [ ] 开发模式 `npm run dev` 不启动嵌入式后端

---

## 数据完整性

- [ ] 不使用 placeholder 数据，所有 AI 推理结果为真实输出
- [ ] 组件内容基于原文提炼，不虚构作者/数据/评价
- [ ] 降级逻辑（文章过短/AI 异常/layout 为空）正常工作

---

## 本次升级（方案5：编辑设计引擎）专项检查

> 方案5 改动范围：types.ts / renderer.ts / templatePrompt.ts / templateAgent.ts

- [ ] 旧模板（v1.x，含 magazineLevel）在新 Renderer 中正常渲染（自动迁移）
- [ ] AI 不填 design 字段时，Renderer 自动补全默认值（getDefaultDesign）
- [ ] AI 不填 reason 字段时，不报错
- [ ] resolveVariant() 映射到已有 variant 名称，不产生新 variant 名
- [ ] audience / constraints / themeLayout 参数链路完整（prompt 中有对应注入）
- [ ] TemplateGenerationResult 的 articleType/magazineLevel 等废弃字段保留（不删，避免调用方报错）
- [ ] design 字段缺失时 isFullCardMode 逻辑正确迁移到 design.emphasis
- [ ] 同一篇文章改前改后对比，组件选择和内容提取质量无明显退化
