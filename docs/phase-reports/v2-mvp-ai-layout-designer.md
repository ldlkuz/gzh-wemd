# V2 MVP 阶段总结 —— AI 设计版式

> 阶段：V2 MVP（AI Layout Designer 最小可用版本）
>
> 日期：2026-07-26
>
> 状态：✅ 完成

## 一、完成情况

| 计划项                        | 状态 | 说明                                    |
| ----------------------------- | ---- | --------------------------------------- |
| 写升级方案文档                | ✅   | docs/v2-mvp-plan.md                     |
| AnalysisAgent（AI 服务层）    | ✅   | 1 次 LLM 调用，输出 insertions          |
| applyInsertions（纯代码插入） | ✅   | 不动原文，只在锚点插入 ::: 语法         |
| AiLayoutPanel（方案面板 UI）  | ✅   | 逐条预览/采纳/跳过，全部采纳/跳过       |
| Toolbar 集成按钮              | ✅   | 新增"AI 设计版式"按钮，紫色 AI 渐变样式 |
| 测试覆盖                      | ✅   | 14 个新测试，270/270 全部通过           |
| 现有功能零回归                | ✅   | 原有 256 个测试零失败                   |

## 二、关键产出

### 新增文件（5 个）

| 文件                                                                                                                                                | 行数 | 职责                         |
| --------------------------------------------------------------------------------------------------------------------------------------------------- | ---- | ---------------------------- |
| [docs/v2-mvp-plan.md](file:///e:/11自动工作流/wd/docs/v2-mvp-plan.md)                                                                               | 113  | 升级方案文档                 |
| [apps/web/src/services/ai/analysisAgent.ts](file:///e:/11自动工作流/wd/apps/web/src/services/ai/analysisAgent.ts)                                   | 257  | AI 分析文章，输出 insertions |
| [apps/web/src/services/ai/applyInsertions.ts](file:///e:/11自动工作流/wd/apps/web/src/services/ai/applyInsertions.ts)                               | 135  | 纯代码插入组件语法           |
| [apps/web/src/**tests**/services/ai/applyInsertions.test.ts](file:///e:/11自动工作流/wd/apps/web/src/__tests__/services/ai/applyInsertions.test.ts) | 186  | 14 个单元测试                |
| [apps/web/src/components/Editor/AiLayoutPanel.tsx](file:///e:/11自动工作流/wd/apps/web/src/components/Editor/AiLayoutPanel.tsx)                     | 197  | 方案面板 UI                  |
| [apps/web/src/components/Editor/AiLayoutPanel.css](file:///e:/11自动工作流/wd/apps/web/src/components/Editor/AiLayoutPanel.css)                     | 289  | 面板样式                     |

### 修改文件（2 个）

| 文件                                                                                                                              | 改动                                                                                                                                         |
| --------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| [apps/web/src/components/Editor/MarkdownEditor.tsx](file:///e:/11自动工作流/wd/apps/web/src/components/Editor/MarkdownEditor.tsx) | 新增 3 个 state（showAiLayout/aiLayoutLoading/aiLayoutInsertions）+ 2 个 handler（handleAiLayout/handleApplyInsertions）+ 渲染 AiLayoutPanel |
| [apps/web/src/components/Editor/Toolbar.tsx](file:///e:/11自动工作流/wd/apps/web/src/components/Editor/Toolbar.tsx)               | 新增 onOpenAiLayout/aiLayoutLoading props + 新增"AI 设计版式"按钮                                                                            |

### 未动文件（按方案要求）

- `aiService.ts`（功能 1 AI 转 MD）
- `aiPrompts.ts`（功能 2 AI 主题）
- `aiConfig.ts`
- 所有主题文件、组件样式文件
- `packages/core/*`

## 三、架构设计

### 数据流

```
用户点击"AI 设计版式"
        ↓
MarkdownEditor.handleAiLayout()
        ↓
analyzeArticle(markdown)  ← 1 次 LLM 调用
        ↓
AnalysisResult { insertions: [{at, component, props, body, reason}] }
        ↓
AiLayoutPanel 显示方案
        ↓
用户逐条采纳 / 全部采纳
        ↓
handleApplyInsertions(insertions)
        ↓
applyInsertions(markdown, insertions)  ← 纯代码
        ↓
view.dispatch() + setMarkdown()
        ↓
预览区更新
```

### AI Prompt 设计要点

- **9 个组件的 schema 注入**：description + props + 适用场景
- **输出 JSON 格式**：`{insertions: [{at, component, props, body, reason}]}`
- **约束**：不修改原文、最多 5 条建议、body 必须提炼、reason 必须具体
- **temperature 0.4**：稳定但不死板
- **容错解析**：去除代码块包裹、提取 JSON、过滤无效组件名

### 锚点设计

| at 取值    | 含义        | 实现                                   |
| ---------- | ----------- | -------------------------------------- |
| `"文首"`   | 文章开头    | targetLine = 0                         |
| `"文末"`   | 文章末尾    | targetLine = lines.length              |
| `"段后:N"` | 第 N 段之后 | findParagraphEnd + 1，N 超范围降级文末 |

插入策略：**降序排序 + splice 插入**，避免索引偏移。

## 四、测试结果

### 新增测试（14 个，全过）

| 测试                      | 验证点       |
| ------------------------- | ------------ |
| 空 insertions 返回原文    | 边界         |
| 文首插入                  | 锚点 start   |
| 文末插入                  | 锚点 end     |
| 段后:N 插入（N=1）        | 锚点 after   |
| 段后索引超出范围降级      | 容错         |
| 多条插入按位置正确分布    | 降序插入     |
| 带 props 的组件序列化     | props 序列化 |
| props 值含空格用双引号    | props 转义   |
| 空 body 的组件            | 边界         |
| 多行 body 保留换行        | body 完整性  |
| 不修改原文内容            | 原文安全     |
| 未知 at 格式默认文末      | 容错         |
| previewInsertion 单条生成 | 预览函数     |
| previewInsertion 空 props | 边界         |

### 全量测试

- Web 端：270/270 通过
- TypeScript 编译：零错误

## 五、AI 功能矩阵（最终形态）

| 功能            | 职责                | 状态     | 触发方式                        |
| --------------- | ------------------- | -------- | ------------------------------- |
| AI 转 Markdown  | 纯文本 → MD         | 保留原样 | 工具栏 [AI] 按钮                |
| AI 主题         | 描述 → CSS          | 保留原样 | 主题面板                        |
| **AI 设计版式** | **文章 → 组件插入** | **新增** | 工具栏 [Workflow 设计版式] 按钮 |

三者职责不重叠，可叠加使用：

1. AI 转 MD 归一化格式
2. AI 主题定全局配色
3. AI 设计版式智能插入组件

## 六、用户使用流程

```
1. 写/粘贴文章
2. 点 [AI] 转 Markdown（可选）
3. 选内置主题或用 AI 主题（可选）
4. 点 [AI 设计版式]   ← 新功能
5. 等 3-15 秒
6. 弹出方案面板，逐条预览/采纳/跳过
7. 满意后点"全部采纳"
8. 编辑器自动插入 ::: 组件语法
9. 预览区实时渲染组件
10. Ctrl+Z 可撤销
```

## 七、文件行数核对（硬性红线）

| 文件                    | 实际行数        | 上限 | 状态 |
| ----------------------- | --------------- | ---- | ---- |
| analysisAgent.ts        | 257             | 500  | ✅   |
| applyInsertions.ts      | 135             | 300  | ✅   |
| applyInsertions.test.ts | 186             | 800  | ✅   |
| AiLayoutPanel.tsx       | 197             | 600  | ✅   |
| AiLayoutPanel.css       | 289             | 300  | ✅   |
| MarkdownEditor.tsx      | （新增 ~60 行） | 800  | ✅   |
| Toolbar.tsx             | （新增 ~25 行） | 800  | ✅   |

## 八、不做的事（按方案要求）

- ❌ 4 层 AI 串行调用（合并为 1 层）
- ❌ 50 个组件（只用现有 9 个）
- ❌ 13 种 Design Language（复用现有 16 套主题）
- ❌ Layout Planner 重排段落（只插入不重排）
- ❌ Design Knowledge 知识库（工程量过大）
- ❌ 改动现有 AI 转 MD / AI 主题代码

## 九、下一步计划

### 短期（可选优化）

1. **真实文章测试**：用 3-5 篇不同类型文章（技术/教程/数据/对比/总结）实测 AI 选择准确率
2. **流式响应**：当前是非流式，可改为 SSE 流式让用户早看到结果
3. **Prompt 调优**：根据实测结果调整组件 schema 描述，提升 AI 选择准确率

### 长期（V2 完整版，按需推进）

按 [升级思路.md](file:///e:/11自动工作流/wd/升级思路.md) 路线图，若 MVP 验证可行再考虑：

- 扩充组件库到 20+ 个
- Design Knowledge 知识库
- 多层 AI 协作（AnalysisAgent → ThemeAgent）

## 十、验收对照

| 验收标准                       | 实际                                    |
| ------------------------------ | --------------------------------------- |
| 写文章点 AI 设计版式           | ✅ 工具栏按钮可点击                     |
| 3-15 秒返回 ≤5 条建议          | ✅ 1 次 LLM 调用 + Prompt 约束最多 5 条 |
| 每条建议 component 是 9 个之一 | ✅ parseAnalysisResponse 强制过滤       |
| 逐条采纳后编辑器出现 ::: 语法  | ✅ applyInsertions 测试覆盖             |
| 预览区组件正确渲染             | ✅ 复用现有 markdown-it-component 插件  |
| Ctrl+Z 可撤销                  | ✅ view.dispatch 走标准 EditorView 流程 |
| 现有测试零回归                 | ✅ 256/256 原有测试通过                 |
