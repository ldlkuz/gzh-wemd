---
name: wemd-theme-designer
description: >-
  生成公众号文章主题，基于品牌驱动的 AI 设计管道。当用户想创建企业品牌
  公众号主题、公司公众号文章主题、创作者公众号主题、或品牌定制公众号
  主题时使用。处理项目创建、可视化工作台启动、AI 驱动的 44 个文章组件
  全量生成、以及组件驳回修改工作流。不用于普通 CSS 编辑、非公众号主题
  系统、或一次性样式微调。
---

# WeMD 主题生成器 — 流程控制器

> **Skill 只做 3 件事：创建项目 → 启动 Theme Studio → 检测状态并执行 Pipeline**
>
> 资料收集、组件编辑、审核导出全部在 Theme Studio 中完成。

---

## 触发条件

**Use this skill when:**

- 用户想生成企业品牌主题、公司公众号主题、品牌定制公众号主题
- 用户想生成创作者主题、个人公众号主题、自媒体主题
- 用户说"继续"、"生成"且存在状态为 READY 的主题项目
- Theme Studio 中组件被驳回或发起修改请求，需要 AI 重新设计

**Do NOT use this skill when:**

- 用户只想编辑单个 CSS 文件或做一次性样式调整
- 用户要生成非公众号体系的主题（如 WordPress 主题、Hexo 主题）
- 用户只是查看已有项目状态，不执行任何生成或修改操作
- 没有明确的项目 ID 或项目不存在时

---

## 输入输出定义

### 操作 1：创建项目

- **Input**: 项目名称（字符串）、Profile 类型（`brand` | `creator`）
- **Output**: 项目 ID、state.json（status=NEW）、终端提示"请在 Theme Studio 中填写资料"

### 操作 2：启动 Theme Studio

- **Input**: 无（依赖操作 1 已完成）
- **Output**: HTTP 服务运行在 127.0.0.1:3456、浏览器自动打开

### 操作 3：执行 AI Pipeline

- **Input**: state.json（status=READY）、profile.json（品牌资料）
- **Output**: 44 个组件 CSS、design-blueprint.json、manifest.json、.wemd-theme ZIP、state.json（status=APPROVED）

### 操作 4：处理组件修改任务

- **Input**: revision-tasks 列表（status=pending）、每个任务的 instruction + baseVariantCss
- **Output**: 每个任务对应的新组件版本、task status=completed、state.json（pendingRevisionCount=0）

---

## 状态机

每个项目通过 `state.json` 文件同步状态：

```
NEW → READY → GENERATING → PREVIEW → APPROVED → EXPORTED
```

| 状态         | 含义                     | 触发方                    |
| ------------ | ------------------------ | ------------------------- |
| `NEW`        | 项目刚创建，等待填写资料 | Skill 创建项目            |
| `READY`      | 品牌资料已填写完成       | Theme Studio 表单提交     |
| `GENERATING` | AI Pipeline 执行中       | Skill 检测到 READY 后触发 |
| `PREVIEW`    | 生成完成，可预览和修改   | Pipeline 执行完毕         |
| `APPROVED`   | 用户审核完成             | Theme Studio 审核操作     |
| `EXPORTED`   | 已导出 .wemd-theme       | Theme Studio 导出操作     |

> **状态之外的信号**：`state.json` 还包含两个额外字段，优先级高于状态本身：
>
> - `pendingRevisionCount > 0`：存在待处理的组件修改任务（组件审核驳回 / 用户组件级修改）
> - `nextAction = "handle-revision-tasks"`：明确需要进入组件修改流程
>
> 即使状态是 `PREVIEW`，只要这两个信号出现，Skill 就应优先执行 3.4 节的组件修改任务处理流程，**而不是输出默认提示**。

---

## 第一步：创建项目

用户说"帮我生成企业主题"时，执行：

```bash
cd e:/11自动工作流/wd/skills/wemd-theme-designer/services
node --experimental-strip-types src/cli.ts create <项目名> <brand|creator>
```

这会：

1. 在 `projects/{项目名}/` 下创建目录结构
2. 写入 `state.json`，状态为 `NEW`
3. 初始化 `project.json`、`profile.json` 等文件

---

## 第二步：启动 Theme Studio

项目创建完成后，立即启动 Theme Studio：

```bash
cd e:/11自动工作流/wd/skills/wemd-theme-designer/services
node --experimental-strip-types src/cli.ts server
```

这会：

1. 启动 HTTP 服务（端口 3456）
2. 自动打开浏览器访问 `http://127.0.0.1:3456`

然后告知用户：

> 项目已创建，Theme Studio 已打开。
> 请在浏览器中填写品牌资料，完成后回到这里继续。

**Skill 暂时退出，不再问任何问题。**

---

## 第三步：检测状态并执行 Pipeline

当用户回到 Trae 说"继续"、"生成"或任何相关指令时：

### 3.1 读取项目状态

读取 `projects/{项目名}/state.json`：

```bash
# 通过 API 读取
curl http://127.0.0.1:3456/api/projects/{项目名}/state
```

### 3.2 根据状态决定操作

| 状态         | 操作                                             |
| ------------ | ------------------------------------------------ |
| `NEW`        | 提示："请先在 Theme Studio 中填写品牌资料"       |
| `READY`      | 执行 Pipeline（见 3.3）                          |
| `GENERATING` | 提示："正在生成中，进度 X/Y..."                  |
| `PREVIEW`    | 提示："主题已生成，请在 Theme Studio 中预览"     |
| `APPROVED`   | 提示："主题已审核通过，可在 Theme Studio 中导出" |
| `EXPORTED`   | 提示："主题已导出，可导入 WeMD 使用"             |

#### 3.2.1 组件修改任务信号检测（优先级高于上表）

读取 state.json 后，**先检查以下两个字段**，只要满足其一就跳转到 3.4 节执行，不输出上表的默认提示：

```
if state.pendingRevisionCount > 0  OR  state.nextAction == "handle-revision-tasks":
    → 执行 3.4 "处理组件修改任务"
endif
```

### 3.3 执行 AI Pipeline（分批全量生成）

当状态为 `READY` 时，AI Agent 执行以下流程：

#### 步骤 1：读取推理所需文件

```
prompts/generate-theme.md    — 推理 prompt（12 阶段）
prompts/self-check.md         — 自检清单
spec/design-logic-brand.md    — 品牌分析逻辑
spec/design-logic-creator.md  — 创作者分析逻辑
spec/constraint-layer.md      — 约束检查规则
spec/application-layer.md     — 实现方案选择
spec/decoration-library.md    — 装饰原子规范
spec/theme-package-spec.md    — 输出规范
spec/brand-keywords.md        — 18 个关键词
spec/component-registry.md    — 44 组件注册表
```

#### 步骤 2：执行阶段 0-8 推理

生成 Design Blueprint（品牌策略、14 色、排版、装饰策略、布局策略）。

#### 步骤 3：分 7 批生成 44 个组件 CSS（阶段 9）

按原型组顺序，每批调用 `POST /api/projects/:id/ai-save`：

| 批次 | `batch` 值      | 组件                                                                                                                            | 数量 | `isLastBatch` |
| ---- | --------------- | ------------------------------------------------------------------------------------------------------------------------------- | ---- | ------------- |
| 1    | `"signature"`   | hero-banner, magazine-cover, end-card, brand-sign                                                                               | 4    | `false`       |
| 2    | `"heading"`     | numbered-heading, section-title, section-divider, toc-nav                                                                       | 4    | `false`       |
| 3    | `"container"`   | text-card, image-card, product-card, testimonial-card, author-card, quote-card, two-column-cards, cta-card, share-card, qr-card | 10   | `false`       |
| 4    | `"data"`        | stats-block, styled-table, table, timeline, resource-list, image-compare, image-grid, image-text-row, image-caption             | 9    | `false`       |
| 5    | `"interactive"` | callout, callout-pro, faq, accordion, steps, follow-bar                                                                         | 6    | `false`       |
| 6    | `"code"`        | code-block, code-frame                                                                                                          | 2    | `false`       |
| 7    | `"divider"`     | divider-fancy, divider, full-quote, pullquote, article-section, related-posts, series-nav, copyright-notice, tag-label          | 9    | `true`        |

**第 1 批请求示例：**

```json
POST /api/projects/{项目名}/ai-save
{
  "blueprint": { "readingExperience": {...}, "expression": {...}, ... },
  "batch": "signature",
  "isLastBatch": false,
  "components": [
    {
      "type": "hero-banner",
      "variant": "yunfan-hero-gradient",
      "variantCss": "#wemd .wemd-hero-banner[data-variant=\"yunfan-hero-gradient\"] { ... }",
      "sourceHtml": "<section class=\"wemd-hero-banner\" data-variant=\"yunfan-hero-gradient\">...</section>",
      "instruction": "主色渐变背景 + Logo 右上角 + Slogan 副标题"
    }
  ]
}
```

**第 7 批（最后一批）请求示例：**

```json
POST /api/projects/{项目名}/ai-save
{
  "batch": "divider",
  "isLastBatch": true,
  "components": [ ... 9 个组件 ... ]
}
```

每批保存后，`state.json` 自动更新进度（1/7 → 2/7 → ... → 7/7），最后一批自动切换状态为 `PREVIEW`。

#### 步骤 4：自检

执行 `self-check.md` 清单，确认：

- 44 个组件全部覆盖
- CSS 选择器格式正确
- 无违规属性（`::before`/`::after`/`animation`/`fixed` 等）
- 颜色使用 `var(--wemd-xxx)` 而非硬编码

#### 步骤 5：编译打包

调用 `POST /api/projects/{项目名}/compile`，Service Layer 会：

1. 读取全部 44 个组件最新版本
2. 校验全覆盖（缺少任何组件会报错）
3. 调用 Compiler Layer 生成 manifest.json
4. 打包为 `.wemd-theme` ZIP
5. 状态更新为 `APPROVED`

完成后告知用户：

> 主题生成完成！请回到 Theme Studio 预览和审核。

### 3.4 处理组件修改任务（AI 异步迭代）

当 state.json 中出现 `pendingRevisionCount > 0` 或 `nextAction = "handle-revision-tasks"` 时，说明 Theme Studio 用户对某个或多个组件进行了**审核驳回**或**发起了组件级修改请求**。此时 AI Agent 按以下流程逐个处理：

---

#### 步骤 1：获取待处理任务列表

调用：

```
GET /api/projects/{项目名}/revision-tasks?status=pending
```

返回 `tasks` 数组。每个任务结构：

```json
{
  "taskId": "rev_01J78...",
  "component": "hero-banner",
  "source": "review-reject", // "review-reject" = 审核驳回；"user-modify" = 用户发起修改
  "instruction": "审核驳回，请根据以下意见调整: Logo 太小，Slogan 不够醒目",
  "baseVersion": 1,
  "baseVariant": "tech-gradient-dark", // 驳回重生保持原 variant 名
  "baseVariantCss": "/* 当前版本 CSS */",
  "baseSourceHtml": "<!-- 当前版本 HTML -->",
  "status": "pending"
}
```

记录任务数量 `N`，按数组顺序逐个处理。

---

#### 步骤 2：逐个任务 — 领取 + 推理 + 保存 + 完成

对每个任务执行 **4 步原子流程**：

##### 2a. 领取任务（防止并发重复处理）

```
POST /api/projects/{项目名}/revision-tasks/{taskId}/claim
```

返回的任务 `status` 变为 `"processing"`。若领取失败（已被处理）则跳过。

##### 2b. LLM 组件级推理（核心）

读取 `prompts/generate-theme.md` 中**阶段 11：组件级修改推理**作为推理 prompt，输入：

- 当前任务的 `instruction`（修改指令）
- 当前任务的 `baseVariantCss`（基准 CSS，必须作为修改起点，不能凭空重写）
- 当前任务的 `baseSourceHtml`（基准 HTML）
- 当前任务的 `source`（驳回 or 用户修改）
- `design-blueprint.json`（品牌策略、14 色调色板、排版、装饰策略 — **必须保持整体一致性**）
- 当前组件的历史 Design Memory（`components/{component}` 中的 decisions / rejectedApproaches）

**两种 source 的处理差异**：
| `source` | variant 命名要求 | 变化幅度 |
|---|---|---|
| `review-reject`（驳回重生） | **强制保持原 `baseVariant` 不变**（不脱离整体方案，方便组件映射复用） | 中：必须解决驳回意见，整体风格不漂移 |
| `user-modify`（用户修改） | 允许 AI 重命名（如从 `tech-gradient-dark` → `tech-gradient-v2`），但需延续品牌识别 | 由 instruction 控制 |

**通用规则（强制）**：

1. **必须以 `baseVariantCss` 为修改基准** — 不能完全重写为全新风格，要保持品牌策略一致
2. **所有颜色必须用 `var(--wemd-xxx)`** — 不能引入硬编码颜色
3. **禁止使用 `::before` / `::after` / `animation` / `@keyframes` / `fixed` / `sticky` / `filter` / `backdrop-filter`**
4. **禁止使用绝对定位 `position: absolute`（除非必要且 instruction 明确要求）**
5. **选择器必须为 `.wemd-{组件名}[data-variant="{variant}"]` 格式**，子元素 class 必须使用主程序渲染器的固定 class（见 generate-theme.md 阶段 9.3 组件 HTML 结构参考表），禁止自创 class 名，禁止使用 `:global()` 语法
6. 对 `baseVariantCss` 修改率控制在 **20%-80%** 之间：
   - 修改率 <20% → 驳回意见可能未充分落实
   - 修改率 >80% → 风格漂移，脱离整体方案

##### 2c. 保存为组件新版本

调用：

```json
POST /api/projects/{项目名}/components/{component}/versions
{
  "variant": "{驳回就用 baseVariant，用户修改可新命名}",
  "variantCss": "... AI 推理生成的新 CSS，严格遵守选择器格式 ...",
  "instruction": "{原 instruction，附加 AI 修改摘要，如：增大 Logo 字号 36px→48px，Slogan 改为品牌渐变}",
  "sourceHtml": "... 更新后的 HTML ...",
  "publishHtml": "",
  "createdBy": "ai"
}
```

返回 `version.version` 即新版本号（baseVersion + 1）。

##### 2d. 完成任务

```json
POST /api/projects/{项目名}/revision-tasks/{taskId}/complete
{
  "success": true,
  "outputVersion": {新版本号}
}
```

若失败则 `success: false, error: "原因描述"`。

---

#### 步骤 3：全部完成后自检

所有任务处理完毕后，再次：

```
GET /api/projects/{项目名}/revision-tasks?status=pending
```

若 `count == 0`，说明全部处理完毕。state.json 会自动同步为 `pendingRevisionCount: 0` 且清除 `nextAction`。

告知用户：

> 已完成 {N} 个组件修改任务，请回到 Theme Studio 查看新版本效果。
>
> - 组件 A（vN）：{修改摘要}
> - 组件 B（vM）：{修改摘要}
> - ...

若还有剩余 pending，继续循环步骤 2。

---

## 关键文件

| 文件                                    | 职责                          |
| --------------------------------------- | ----------------------------- |
| `services/src/cli.ts`                   | 命令行工具（create / server） |
| `services/src/server.ts`                | HTTP 服务 + API               |
| `services/src/project-service.ts`       | 项目管理 + 状态管理           |
| `services/src/file-service.ts`          | 文件系统 + state.json 读写    |
| `services/src/pipeline/orchestrator.ts` | 8 步 Pipeline 编排            |
| `services/public/index.html`            | Theme Studio 前端             |
| `projects/{项目名}/state.json`          | 项目状态文件                  |

---

## 注意事项

1. **不要在聊天中收集资料** — Logo、颜色、关键词等表单输入全部在 Theme Studio 完成
2. **不要在聊天中审核组件** — 组件预览和审核在 Theme Studio 完成
3. **导出在工作台完成** — 用户在 Theme Studio 中点击导出，Skill 不参与
4. **state.json 是唯一状态源** — Skill 和 Theme Studio 都通过读写 state.json 同步
5. **Pipeline 每步更新进度** — 通过 `writeProjectState()` 写入 progress，Theme Studio 轮询展示

---

## 失败策略

| 场景                               | 检测方式                              | 处理                                                                                          |
| ---------------------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------- |
| Theme Studio 未启动                | API 调用返回 ECONNREFUSED             | 自动执行 `node src/cli.ts server` 启动服务，等待 2 秒后重试                                   |
| 项目不存在                         | API 返回 404                          | 提示用户："项目 {项目名} 不存在，请先创建项目"，终止流程                                      |
| state.json 读取失败                | API 返回 500 或空数据                 | 提示用户："项目状态异常，请检查 projects/{项目名}/state.json"，终止流程                       |
| 组件编译失败（缺少组件）           | POST /compile 返回 errors             | 根据错误中列出的缺失组件，补充生成后重新编译，最多重试 2 次                                   |
| 组件 CSS 自检失败                  | self-check 发现违规属性               | 逐个修复违规组件（如移除 ::before、硬编码颜色改为 var()），重新提交 /ai-save                  |
| Revision Task 领取失败（已被处理） | POST /claim 返回 status != processing | 跳过该任务，继续处理下一个                                                                    |
| AI 推理生成空 CSS                  | variantCss 为空或过短（<10 行）       | 重新读取 generate-theme.md 阶段 9/12 推理，最多重试 1 次，仍失败则标记 task failed 并告知用户 |
| HTTP 服务端口被占用                | cli.ts server 启动报错 EADDRINUSE     | 提示用户："端口 3456 被占用，请先释放端口或修改 services/src/server.ts 中的 PORT"             |
