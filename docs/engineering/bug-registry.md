# Bug 登记册

> 每次修复特殊 bug 后按模板追加记录。升级前先过一遍，检查是否触碰历史雷区。

---

## BUG-0001: 顶栏按钮样式不统一

- **发现时间**: 2026-07-2x
- **影响范围**: 顶栏所有按钮（复制到公众号、复制 HTML、AI 排版等）
- **现象描述**: "复制到公众号"按钮为绿色背景，"复制 HTML"为纯白背景，字体和阴影不一致
- **根因**: Header.css 中不同按钮使用了不同的样式类，没有统一变量
- **修复方案**: 统一所有按钮为白底 + 2px 边框（`#E0E1E4`）+ 阴影（`0px 0px 20px -20px`），hover 变 `#F2F2F2`，active 缩放 0.95
- **涉及文件**: `apps/web/src/components/Header/Header.css`
- **回归检测**: 顶栏所有按钮视觉一致，无绿色残留
- **关联升级**: 改动 Header 组件时检查按钮样式是否被覆盖

---

## BUG-0002: ThemePanel CSS 全局污染

- **发现时间**: 2026-07-2x
- **影响范围**: 顶栏按钮被 ThemePanel 的样式覆盖
- **现象描述**: ThemePanel.css 中的 `.btn-primary` 样式泄漏到全局，覆盖了顶栏按钮
- **根因**: ThemePanel 的按钮样式没有限定作用域，直接用了全局类名
- **修复方案**: 为 ThemePanel 按钮样式添加 `.theme-panel` 作用域前缀，在 ThemePanelView.tsx 根容器加 `theme-panel` 类
- **涉及文件**: `apps/web/src/components/Theme/ThemePanel.css`、`apps/web/src/components/Theme/ThemePanelView.tsx`
- **回归检测**: 打开主题面板，顶栏按钮样式不受影响
- **关联升级**: 新增面板组件时，所有样式必须限定作用域前缀

---

## BUG-0003: 侧边栏展开/缩回按钮位置错误

- **发现时间**: 2026-07-2x
- **影响范围**: 侧边栏切换交互
- **现象描述**: 侧边栏切换按钮位于页面左侧独立位置，用户要求移至 Markdown 编辑器头部
- **根因**: App.tsx 中独立放置了 `history-toggle` 按钮，未与编辑器头部集成
- **修复方案**: 删除 App.tsx 中的独立按钮，在 MarkdownEditor.tsx 的 `.editor-header` 中添加新按钮，通过 props 透传 `showHistory` 状态和 `onToggleHistory` 函数
- **涉及文件**: `apps/web/src/App.tsx`、`apps/web/src/components/Editor/MarkdownEditor.tsx`、`apps/web/src/components/Workspace/EditorPreviewWorkspace.tsx`
- **回归检测**: 侧边栏切换按钮在编辑器头部，点击可展开/收起历史面板
- **关联升级**: 改动编辑器头部布局时检查按钮是否还在

---

## BUG-0004: 编辑器头部与顶栏左侧未对齐

- **发现时间**: 2026-07-2x
- **影响范围**: 编辑器视觉对齐
- **现象描述**: 编辑器头部左侧与顶栏左侧不在同一垂直线上
- **根因**: `.editor-header` 的 `padding-left` 和外层容器的 `margin` 不匹配
- **修复方案**: 调整 `.editor-header` 的 `padding-left` 为 8px，在 `EditorPreviewWorkspace.css` 中添加 `margin-left: -16px`
- **涉及文件**: `apps/web/src/components/Editor/MarkdownEditor.css`、`apps/web/src/components/Workspace/EditorPreviewWorkspace.css`
- **回归检测**: 编辑器头部左侧与顶栏左侧对齐
- **关联升级**: 改动编辑器或顶栏布局时检查对齐

---

## BUG-0005: 主题预览与实时预览效果不一致

- **发现时间**: 2026-07-2x
- **影响范围**: 主题选择面板的预览框
- **现象描述**: 主题预览框内显示正确，但编辑器右侧实时预览有差异（CSS 变量未展开、伪元素未生效）
- **根因**: ThemeLivePreview 使用 `inlineStyles=true` 导致 CSS 变量被替换为 fallback 值；iframe 内全局 `*` 重置干扰了主题样式
- **修复方案**: 将 `processHtml` 的 `inlineStyles` 参数改为 `false`，移除 iframe 内全局 `* { margin:0; padding:0; box-sizing:border-box }` 重置
- **涉及文件**: `apps/web/src/components/Theme/ThemeLivePreview.tsx`
- **回归检测**: 主题预览框与实时预览效果一致（截图对比）
- **关联升级**: 改动 ThemeLivePreview 或 ThemeProcessor 时检查 inlineStyles 参数

---

## BUG-0006: AI 排版参数断连（读者画像/排版丰富度）

- **发现时间**: 2026-07-2x
- **影响范围**: AI 排版输出质量
- **现象描述**: 用户选择了读者画像和排版丰富度，但 AI 输出没有体现这些参数的影响
- **根因**: `templateAgent.ts` 的 `generateTemplate` 函数没有接收 `audience` 和 `constraints` 参数，`templatePrompt.ts` 也没有注入相关约束
- **修复方案**: 修改 `generateTemplate` 接收 `audience` 和 `constraints` 参数，在 `buildTemplatePrompt` 中注入 `audienceHint` 和 `complexityHint`
- **涉及文件**: `apps/web/src/services/template/templateAgent.ts`、`apps/web/src/services/template/templatePrompt.ts`
- **回归检测**: 分别用"开发者/high"和"小白/low"生成排版，确认输出差异明显
- **关联升级**: 改动 AI 排版 prompt 或 agent 时，确认 audience/constraints 参数链路完整

---

## BUG-0007: 目录重复编号

- **发现时间**: 2026-07-2x
- **影响范围**: 含目录的文章预览
- **现象描述**: 预览模式下目录同时显示 CSS counter 和 `addTocNumbers` 生成的双重编号（如 "1. 1. 引言"）
- **根因**: `ThemeProcessor.ts` 中 `addTocNumbers` 在所有模式下都执行，但预览模式下 CSS counter 也在自动编号
- **修复方案**: 仅在 `inlineStyles=true`（复制/导出模式）时执行 `addTocNumbers`，预览模式依赖 CSS counter
- **涉及文件**: `packages/core/src/ThemeProcessor.ts`
- **回归检测**: 预览模式目录单编号，复制到公众号后目录单编号
- **关联升级**: 改动 ThemeProcessor 的 addTocNumbers 逻辑时检查

---

## BUG-0008: share-card 硬编码"分享/点赞/在看"按钮

- **发现时间**: 2026-07-2x
- **影响范围**: AI 生成的分享卡组件
- **现象描述**: AI 排版输出的 share-card 组件中，硬编码了 `- **分享**- **点赞**- **在看**` 无序列表，粘贴到公众号后这些列表和实际公众号功能不对应
- **根因**: `componentRenderers.ts` 中 `renderShareCard` 函数的 fallback 逻辑，当 content 不完整时自动插入该列表
- **修复方案**: 修改 `renderShareCard`，移除硬编码列表，仅保留 `content.text` 的渲染
- **涉及文件**: `apps/web/src/services/template/componentRenderers.ts`
- **回归检测**: 生成一次含 share-card 的模板，确认 markdown 源码中不包含"分享/点赞/在看"
- **关联升级**: 改动 componentRenderers 时检查是否重新引入硬编码内容

---

## BUG-0009: 预览与复制到公众号样式不一致

- **发现时间**: 2026-07-2x
- **影响范围**: 预览 vs 复制效果
- **现象描述**: 预览中样式正确，但复制到公众号后样式变化；复制 HTML 代码与预览也不一致
- **根因**: 预览使用外部 `<style>` 标签，复制使用全量内联 CSS，两条管线处理逻辑不同导致差异
- **修复方案**: 修改 `MarkdownPreview.tsx`，预览时也展开 CSS 变量并始终使用亮色模式，使预览管线接近复制管线
- **涉及文件**: `apps/web/src/components/Preview/MarkdownPreview.tsx`
- **回归检测**: 预览效果 ≈ 复制到公众号效果 ≈ 复制 HTML 效果（三者截图对比）
- **关联升级**: 改动预览或复制管线时三者对比

---

## BUG-0010: CSS 变量展开中断（三引号问题）

- **发现时间**: 2026-07-2x
- **影响范围**: 组件默认主题 CSS
- **现象描述**: CSS 中 173 个变量仅展开 3 个，`findNextVarStart` 进入永久引号模式
- **根因**: `components-default.ts` 中 `content: """` 三个连续双引号导致 CSS 解析器引号状态机混乱
- **修复方案**: 将 `content: """` 改为 `content: "\u201C"`（Unicode 左引号）
- **涉及文件**: `packages/core/src/themes/components-default.ts`
- **回归检测**: 检查 CSS 变量展开数量是否为全量（grep 计数 var( 对比展开后数量）
- **关联升级**: 新增组件 CSS 时避免在 content 属性中使用裸三引号

---

## BUG-0011: 暗色模式切换影响预览样式

- **发现时间**: 2026-07-2x
- **影响范围**: 预览内容样式
- **现象描述**: 切换 UI 暗色模式后，预览中的文章内容样式也跟着变化
- **根因**: 预览没有固定使用亮色 CSS，跟随了 UI 主题模式
- **修复方案**: `MarkdownPreview.tsx` 中强制使用亮色模式 CSS，不跟随 UI 主题切换
- **涉及文件**: `apps/web/src/components/Preview/MarkdownPreview.tsx`
- **回归检测**: 切换暗色模式，预览内容样式不变
- **关联升级**: 改动预览逻辑时检查暗色模式隔离

---

## BUG-0012: numbered-heading 超出预览框

- **发现时间**: 2026-07-2x
- **影响范围**: numbered-heading 组件渲染
- **现象描述**: `::: numbered-heading{index="01"}标题:::` 渲染后完全超出预览框边界，字号异常大
- **根因**: 组件 CSS 中字号未受容器约束
- **修复方案**: 检查并修正 numbered-heading 的 CSS 字号和容器约束
- **涉及文件**: 组件 CSS 文件
- **回归检测**: numbered-heading 在预览框内正常显示，不超出边界
- **关联升级**: 新增或修改标题类组件时检查字号约束

---

## BUG-0013: Electron 打包未使用缓存

- **发现时间**: 2026-07-2x
- **影响范围**: exe 打包流程
- **现象描述**: 打包 exe 时未使用 `.tmp` 目录中的 Electron 缓存，重新下载 Electron 二进制
- **根因**: 环境变量未指向项目级缓存目录
- **修复方案**: 设置 `ELECTRON_CUSTOM_DIR` 和 `ELECTRON_BUILDER_CACHE` 环境变量指向 `.tmp/electron-cache`
- **涉及文件**: 打包脚本 / 环境变量配置
- **回归检测**: 打包时检查 `.tmp/electron-cache` 是否被读取，无重新下载日志
- **关联升级**: 每次打包前确认环境变量设置

---

## BUG-0014: ThemeProcessor juice 库崩溃

- **发现时间**: 2026-07-2x
- **影响范围**: CSS 内联过程
- **现象描述**: juice 库解析伪元素规则（`::`）时崩溃
- **根因**: juice 库对伪元素和 @-rules 的解析有 bug
- **修复方案**: 完全移除 juice 库，替换为 `inlineAllStylesManually` 函数，跳过伪元素规则（`::`）和 @-rules
- **涉及文件**: `packages/core/src/ThemeProcessor.ts`
- **回归检测**: 含伪元素的 CSS 内联不崩溃，内联后伪元素规则保留在外部样式表
- **关联升级**: 不要重新引入 juice 库

---

## BUG-0015: ThemeProcessor injectVariantCss 空指针

- **发现时间**: 2026-07-2x
- **影响范围**: 主题注入 variant CSS
- **现象描述**: `injectVariantCss` 在 components 字段缺失时报错
- **根因**: `components` 参数没有 null 检查
- **修复方案**: `injectVariantCss` 的 `components` 参数设为可选并加 null 检查
- **涉及文件**: `packages/core/src/index.ts`
- **回归检测**: 主题不含 components 字段时不报错
- **关联升级**: 改动 injectVariantCss 时保留 null 检查

---

## BUG-0016: AiThemeGenerator 错误处理不当

- **发现时间**: 2026-07-2x
- **影响范围**: AI 主题生成
- **现象描述**: AI 主题生成失败时，catch 块把原始 JSON 当作 CSS 传给预览，导致预览崩溃
- **根因**: catch 块没有显示错误信息，而是把 raw JSON 传给了 CSS 预览
- **修复方案**: catch 块显示错误信息，不把 raw JSON 作为 CSS 传递
- **涉及文件**: `apps/web/src/services/ai/AiThemeGenerator.tsx`
- **回归检测**: AI 主题生成失败时显示错误提示，不崩溃
- **关联升级**: 改动 AI 主题生成错误处理时检查

---

## BUG-0017: validateThemeJson 缺少 components 默认值

- **发现时间**: 2026-07-2x
- **影响范围**: AI 主题 JSON 校验
- **现象描述**: AI 生成的主题 JSON 不含 components 字段时，ThemeDefinition 结构不完整
- **根因**: `validateThemeJson` 没有给 components 字段添加默认值
- **修复方案**: `validateThemeJson` 中添加 `components: {}` 默认值
- **涉及文件**: `apps/web/src/services/ai/aiPrompts.ts`
- **回归检测**: AI 主题 JSON 不含 components 时不报错
- **关联升级**: 改动 validateThemeJson 时保留默认值逻辑

---

## 模板：新增 Bug 记录

```markdown
## BUG-XXXX: 简短标题

- **发现时间**: YYYY-MM-DD
- **影响范围**: 哪个功能/模块
- **现象描述**: 用户看到什么、发生了什么
- **根因**: 代码层面的真正原因
- **修复方案**: 改了什么、怎么改的
- **涉及文件**: 文件路径列表
- **回归检测**: 怎么验证这个 bug 没复现
- **关联升级**: 以后改什么时需要检查这个 bug
```
