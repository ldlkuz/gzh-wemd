# V2 MVP 实施方案 —— AI 设计版式

> 范围：在不动现有功能 1（AI 转 MD）和功能 2（AI 主题）代码的前提下，新增功能 3：AI 设计版式。

## 一、目标

让用户"写完文章 → 点一下 → AI 自动建议在哪插什么组件 → 用户逐条采纳"。

不重排原文，只插入组件。1 次 LLM 调用，3-8 秒返回。

## 二、AI 功能矩阵（改完后）

| 功能            | 职责                    | 状态                      |
| --------------- | ----------------------- | ------------------------- |
| AI 转 Markdown  | 纯文本 → Markdown 格式  | 保留原样                  |
| AI 主题         | 自然语言 → CSS          | 保留原样（UI 上不再主推） |
| **AI 设计版式** | **文章 → 智能插入组件** | **新增**                  |

三者职责不重叠：功能 1 管格式，功能 2 管配色，功能 3 管版式。

## 三、核心架构

```
用户文章（原文）
       ↓
AnalysisAgent（1 次 LLM 调用）
       ↓
insertions: [{ at, component, props, body, reason }]
       ↓
Apply（纯代码，插入 ::: 语法到 markdown）
       ↓
方案面板（用户逐条采纳/跳过）
       ↓
新 markdown → 预览
```

## 四、文件清单

### 新增文件

| 文件                                                         | 职责                         | 行数上限 |
| ------------------------------------------------------------ | ---------------------------- | -------- |
| `apps/web/src/services/ai/analysisAgent.ts`                  | AI 分析文章，输出 insertions | ≤500     |
| `apps/web/src/services/ai/applyInsertions.ts`                | 纯代码插入组件语法           | ≤300     |
| `apps/web/src/services/ai/__tests__/applyInsertions.test.ts` | 插入逻辑测试                 | ≤800     |
| `apps/web/src/components/Editor/AiLayoutPanel.tsx`           | 方案面板 UI                  | ≤600     |
| `apps/web/src/components/Editor/AiLayoutPanel.css`           | 样式                         | ≤300     |

### 修改文件

| 文件                                         | 改动                  |
| -------------------------------------------- | --------------------- |
| `apps/web/src/components/Editor/Toolbar.tsx` | 新增"AI 设计版式"按钮 |

不动文件：`aiService.ts`、`aiPrompts.ts`、`aiConfig.ts`、所有主题文件、组件样式。

## 五、关键数据结构

```typescript
interface Insertion {
  at: "文首" | "文末" | `段后:${number}`; // 插入锚点
  component: string; // 9 个组件之一
  props: Record<string, string>; // 组件 props
  body: string; // 组件内容（AI 提炼）
  reason: string; // 给用户看的理由
}

interface AnalysisResult {
  insertions: Insertion[];
}
```

## 六、AI Prompt 设计

System Prompt 包含：

1. 角色：公众号版式设计师
2. 9 个组件的 schema（name + 描述 + props + 适用场景）
3. 输出格式：JSON，必须包含 insertions 数组
4. 约束：不修改原文，只建议插入；最多 5 个插入点；每个必须有 reason

User Prompt：原文 markdown。

temperature: 0.4（稳定但不死板）。

## 七、UI 流程

1. 工具栏新增"AI 设计版式"按钮（紫色 AI 渐变文字）
2. 点击 → Loading（清新风格组件）
3. 返回后弹出方案面板：
   - 列出 N 条建议（at / component / reason）
   - 每条带 [预览] [采纳] [跳过]
   - 底部 [全部采纳] [全部跳过]
4. 采纳后插入对应 `:::` 语法到编辑器
5. 可撤销（Ctrl+Z）

## 八、不做的事

- ❌ 4 层 AI 串行调用（延迟不可接受）
- ❌ 50 个组件（9 个够用）
- ❌ 13 种 Design Language（复用现有 16 套主题）
- ❌ Layout Planner 重排段落（破坏原文）
- ❌ Design Knowledge 知识库（工程量过大）
- ❌ 改动现有 AI 转 MD / AI 主题代码

## 九、验收标准

1. 写一篇含数据/步骤/总结的文章，点 AI 设计版式
2. 3-15 秒内返回 ≤5 条建议
3. 每条建议的 component 必须是 9 个组件之一
4. 逐条采纳后，编辑器对应位置出现 `:::` 语法
5. 预览区组件正确渲染
6. Ctrl+Z 可撤销
7. 现有 86 个测试零回归
