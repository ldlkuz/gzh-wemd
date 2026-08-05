# WeMD 主题设计管道 · 产品功能补全方案

> 基于原始参考文档《企业品牌公众号组件工作台开发方案.md》与当前实现对比分析，制定分阶段补全计划。

---

## 一、现状总结

### 已实现的功能

| 模块              | 说明                                                              |
| ----------------- | ----------------------------------------------------------------- |
| 项目 CRUD         | 创建、读取、删除项目                                              |
| 5 层设计管道      | Logic → Constraint → Application → Compiler → Feedback            |
| Service 层        | 文件操作、路径管理、状态流转的唯一入口                            |
| 审核流水线        | 提交、通过、驳回（项目级）                                        |
| 版本管理          | 创建、回退、状态变更（组件级）                                    |
| Design Memory     | 记录风格决策、偏好、拒绝方案                                      |
| 任务队列          | inbox → processing → done → failed                                |
| 品牌/创作者双路线 | 两套 Profile 模板和输入表单                                       |
| ZIP 打包交付      | manifest.json + brand.md + assets/images/                         |
| Web 工作台        | 项目列表、详情、标签页（概览、Blueprint、约束、反馈、版本、审核） |

### 未实现的功能（差距分析）

| #   | 缺失功能                      | 原始参考文档章节   | 影响                                                        |
| --- | ----------------------------- | ------------------ | ----------------------------------------------------------- |
| 1   | **BrandSystem 核心数据**      | 第七节             | 大 — 缺少品牌原则、资产策略、Token 体系的完整工程规范       |
| 2   | **组件级审核**                | 第十一节、第十九节 | 大 — 不能按组件单独审核、修改、对比                         |
| 3   | **组件数据结构完整化**        | 第九节             | 大 — 缺少 sourceHtml、publishHtml、compatibility、assetRefs |
| 4   | **文章套用（Article Apply）** | 第十四节           | 大 — 完整功能缺失                                           |
| 5   | **公众号编译器**              | 第十三节           | 大 — 完整功能缺失                                           |
| 6   | **Schema 校验**               | 第三节、第十五节   | 中 — 缺少正式的数据校验机制                                 |
| 7   | **三栏审核 UI**               | 第十一节           | 中 — 当前是 Tab 布局，缺少左中右三栏                        |
| 8   | **单组件修改**                | 第十节             | 中 — 仅支持全量管道生成，不支持单组件修改                   |
| 9   | **Asset Manifest**            | 第八节             | 中 — 缺少结构化资产清单和 fallback 机制                     |
| 10  | **Skill 独立化**              | 第十五节           | 中 — Skill 逻辑内嵌在 Service 中，未独立                    |
| 11  | **Design Memory 细粒度化**    | 第九节             | 小 — 缺少组件级风格决策记录                                 |
| 12  | **Review Record 组件级**      | 第十九节           | 小 — 缺少 per-component review.json                         |
| 13  | **Decision Log 组件级**       | 第十九节           | 小 — 缺少 per-component decision-log.json                   |

---

## 二、补全策略

### 核心原则

1. **不推翻现有架构** — 5 层设计管道保留不动，BrandSystem 作为 Logic Layer 输入增强
2. **增量开发** — 功能按依赖关系分阶段实现，每个阶段可独立交付
3. **保持 Skill 不碰文件系统** — 新增功能由 Service 层实现，Skill 只做输入→输出
4. **确定性优先** — 公众号编译器、Schema 校验等用确定性代码，不依赖 AI
5. **UI 逐步升级** — 先补功能逻辑，再优化交互体验

### 架构调整

```
当前架构：                   补全后架构：

Profile → 5层管道 → ZIP      BrandSystem ↗ 5层管道 → ZIP
                                    ↓
                              组件生成 → 组件级审核 → 文章套用 → 编译器
```

---

## 三、分阶段实施计划

### Phase 1：BrandSystem + 组件数据结构补全

**目标：** 建立完整的 BrandSystem 工程规范，补全组件数据结构

#### 1.1 BrandSystem 数据类型

在 `core/types.ts` 中新增：

```typescript
// ── BrandSystem — 核心品牌工程规范 ──
export interface BrandSystem {
  brandId: string;
  principles: string[]; // 品牌原则（3-5条）
  tokens: {
    colors: Record<string, string>; // --wemd-xxx
    typography: TypographyConfig;
    spacing: Record<string, number>;
    radius: Record<string, number>;
    border: { width: number; style: string };
  };
  assetPolicy: {
    logoUsage: string; // "cover-footer" | "header-only" | ...
    brandMarkUsage: string; // "small-components" | "decorative" | ...
    patternOpacityMax: number; // 0-1
    patternCoverageMax: number; // 0-1
  };
  componentRules: {
    density: "low" | "medium" | "high";
    tone: string[];
    forbiddenFeatures: string[];
  };
}
```

#### 1.2 完整组件数据结构

```typescript
// ── 完整组件 ──
export interface BrandComponent {
  id: string; // "faq-primary"
  type: string; // "faq" | "hero-banner" | ...
  name: string; // "品牌FAQ"
  status: ComponentStatus; // draft → reviewing → approved → locked
  currentVersion: number;
  approvedVersion: number | null;
  contentSchema: Record<string, unknown>; // 组件内容结构
  assetRefs: string[]; // 引用的资源 ID
  versions: ComponentVersionDetail[];
}

export interface ComponentVersionDetail {
  version: number;
  createdAt: string;
  createdBy: "ai" | "user";
  instruction: string; // 修改指令
  sourceHtml: string; // 内部预览 HTML
  publishHtml: string; // 公众号发布 HTML
  variantCss: string; // 变体样式
  assetRefs: string[];
  compatibility: {
    status: "passed" | "passed-with-warnings" | "failed";
    warnings: string[];
    errors: string[];
  };
}

export type ComponentStatus =
  | "not-generated"
  | "draft"
  | "reviewing"
  | "revision-requested"
  | "approved"
  | "locked";
```

#### 1.3 组件级审核记录

```typescript
// ── 组件审核记录 ──
export interface ComponentReview {
  component: string;
  status: ComponentStatus;
  score?: number;
  reviewer: "human" | "ai";
  comments: string[];
  createdAt: string;
  decidedAt?: string;
}

// ── 组件决策日志 ──
export interface ComponentDecision {
  version: number;
  decision: "approve" | "reject" | "revise";
  reason: string;
  timestamp: string;
}
```

#### 1.4 Asset Manifest

```typescript
export interface AssetManifest {
  assets: BrandAsset[];
}

export interface BrandAsset {
  id: string;
  type:
    | "logo"
    | "brand-mark"
    | "pattern"
    | "divider"
    | "icon"
    | "cover-decoration";
  sourceFormat: "svg" | "png";
  sourcePath: string;
  fallbackPath?: string;
  usage: string[]; // 使用场合
}
```

#### 文件变更清单

| 文件                                   | 变更                                                                                                             |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `core/types.ts`                        | 新增 BrandSystem、BrandComponent、ComponentVersionDetail、ComponentReview、ComponentDecision、AssetManifest 类型 |
| `services/src/file-service.ts`         | 新增组件目录结构（components/{type}/）                                                                           |
| `services/src/project-service.ts`      | 新增组件 CRUD、组件审核、组件决策日志                                                                            |
| `services/src/pipeline/logic-layer.ts` | 新增 BrandSystem 生成逻辑                                                                                        |
| `services/src/server.ts`               | 新增组件级 API 端点                                                                                              |
| `services/public/index.html`           | 新增组件级详情面板                                                                                               |

---

### Phase 2：组件级审核工作台

**目标：** 实现按组件审核、修改、对比、锁定

#### 2.1 后端 API

| 端点                                                | 方法 | 说明                        |
| --------------------------------------------------- | ---- | --------------------------- |
| `/api/projects/:id/components`                      | GET  | 列出所有组件及其状态        |
| `/api/projects/:id/components/:type`                | GET  | 获取组件详情（含版本列表）  |
| `/api/projects/:id/components/:type/review`         | POST | 提交组件审核                |
| `/api/projects/:id/components/:type/review/approve` | POST | 通过组件审核                |
| `/api/projects/:id/components/:type/review/reject`  | POST | 驳回组件审核                |
| `/api/projects/:id/components/:type/versions`       | GET  | 获取组件版本列表            |
| `/api/projects/:id/components/:type/versions/:v`    | GET  | 获取特定版本                |
| `/api/projects/:id/components/:type/modify`         | POST | 提交单组件修改（生成 Task） |
| `/api/projects/:id/components/:type/compare`        | GET  | 版本对比                    |

#### 2.2 前端 UI 升级

从当前 Tab 布局升级为三栏布局：

```
┌────────────────┬────────────────────────┬────────────────────┐
│  组件列表      │       组件预览          │    审核面板         │
│                │                        │                     │
│ hero-banner ✓  │ 手机宽度实时预览        │ 当前版本 v3         │
│ brand-sign  ✓  │                        │ 设计说明            │
│ testimonial △  │                        │ 使用资源            │
│ cta         ✗  │                        │ 兼容检查            │
│ divider     ✗  │                        │ 修改意见输入框      │
│                │                        │                     │
│                │                        │ ┌─────────────────┐ │
│                │                        │ │ 通过 │ 驳回 │ 对比 │
│                │                        │ └─────────────────┘ │
└────────────────┴────────────────────────┴────────────────────┘
```

#### 2.3 版本对比功能

- 并排显示两个版本的 HTML 渲染
- 列出差异：CSS 变化、资源变化、兼容性变化
- 差异表格：

| 项目           | 原值 | 新值             |
| -------------- | ---- | ---------------- |
| Logo 尺寸      | 32px | 24px             |
| Pattern 透明度 | 12%  | 6%               |
| 内容内边距     | 24px | 30px             |
| 资源移除       | —    | pattern-dot-grid |

#### 文件变更清单

| 文件                              | 变更                                             |
| --------------------------------- | ------------------------------------------------ |
| `services/src/server.ts`          | 新增 10 个组件级 API 端点                        |
| `services/src/project-service.ts` | 新增组件审核、版本对比、修改请求                 |
| `services/public/index.html`      | 重构为三栏布局，新增组件列表、预览面板、审核面板 |
| `services/public/style.css`       | 新增三栏布局样式                                 |

---

### Phase 3：单组件修改 + Design Memory 增强

**目标：** 支持用户对单个组件提出修改意见，AI 生成新版本

#### 3.1 单组件修改流程

```
用户修改意见
  ↓
系统读取：BrandSystem + BrandAssets + DesignMemory + 当前组件 + Review Record
  ↓
创建 Task → workspace/inbox/
  ↓
Skill 处理（只返回新版本）
  ↓
新版本保存 → 自动显示对比
  ↓
用户审核 → 接受 / 拒绝 / 继续修改
```

#### 3.2 Skill 接口调整

在 `skill.ts` 中新增 `modify-component` action：

```typescript
export interface SkillInput {
  // ...
  action:
    | "generate-blueprint"
    | "compile"
    | "feedback"
    | "full-pipeline"
    | "modify-component";
  componentInput?: {
    component: string;
    currentVersion: number;
    instruction: string;
    sourceHtml: string;
    variantCss: string;
  };
}
```

#### 3.3 Design Memory 增强

组件级风格决策记录，保存到 `{project}/versions/{component}/design-decisions.json`。

```json
{
  "hero-banner": {
    "style": "hero-minimal",
    "decisions": [
      "使用渐变背景而非纯色",
      "标题字号 32px 加粗",
      "副标题 16px 灰色"
    ]
  },
  "faq": {
    "style": "card-outline",
    "decisions": [
      "减少背景纹样 50%",
      "品牌角标缩小到 20px",
      "答案区域上下留白 24px"
    ]
  }
}
```

#### 文件变更清单

| 文件                                         | 变更                         |
| -------------------------------------------- | ---------------------------- |
| `services/src/skill.ts`                      | 新增 modify-component action |
| `services/src/pipeline/application-layer.ts` | 新增单组件修改逻辑           |
| `services/src/project-service.ts`            | 新增组件级 Design Memory     |
| `services/src/server.ts`                     | 新增单组件修改 API           |
| `services/public/index.html`                 | 新增修改意见输入框           |

---

### Phase 4：文章套用（Article Apply）

**目标：** 用户导入一篇文章，自动套用品牌组件

#### 4.1 流程

```
用户导入 HTML / Markdown 文章
  ↓
文章解析器（确定性代码）
  ↓
识别结构：标题、引用、FAQ、列表、段落、图片
  ↓
组件类型匹配
  ↓
填充品牌组件内容
  ↓
组合完整文章
  ↓
公众号兼容编译
  ↓
输出最终 HTML
```

#### 4.2 文章解析器

确定性代码，不依赖 AI。使用正则和 DOM 解析识别：

| 原文章结构              | 匹配规则 | 品牌组件    |
| ----------------------- | -------- | ----------- |
| `<h1>`                  | 一级标题 | hero-banner |
| `<h2>`                  | 二级标题 | heading-2   |
| `<blockquote>`          | 引用     | quote       |
| `<section class="faq">` | FAQ 结构 | faq         |
| 结尾段落                | 品牌签名 | brand-sign  |

#### 4.3 后端 API

| 端点                                            | 方法 | 说明            |
| ----------------------------------------------- | ---- | --------------- |
| `/api/projects/:id/articles`                    | POST | 导入文章        |
| `/api/projects/:id/articles/:articleId`         | GET  | 获取文章        |
| `/api/projects/:id/articles/:articleId/apply`   | POST | 套用品牌组件    |
| `/api/projects/:id/articles/:articleId/preview` | GET  | 预览套用结果    |
| `/api/projects/:id/articles/:articleId/export`  | GET  | 导出公众号 HTML |

#### 文件变更清单

| 文件                             | 变更                            |
| -------------------------------- | ------------------------------- |
| `services/src/article-parser.ts` | 新增 — 文章解析器（确定性代码） |
| `services/src/article-apply.ts`  | 新增 — 组件套用逻辑             |
| `services/src/server.ts`         | 新增 5 个文章相关 API           |
| `services/public/index.html`     | 新增文章导入和预览界面          |

---

### Phase 5：公众号编译器

**目标：** 确定性代码，将组件编译为公众号兼容的 HTML

#### 5.1 编译流程

```
组件源码
  ↓
结构校验
  ↓
标签白名单过滤（section div p span strong em blockquote img br）
  ↓
CSS 白名单过滤（color font-size font-weight line-height margin padding background 等）
  ↓
样式内联（class → inline style）
  ↓
资源处理（SVG → data URL / PNG fallback）
  ↓
HTML 清理（移除危险属性）
  ↓
兼容性检查
  ↓
输出 publishHtml + 兼容报告
```

#### 5.2 编译输出

每个组件保留两个版本：

- `sourceHtml`：内部预览（可含 class、CSS 变量）
- `publishHtml`：公众号发布（全部内联，无外部依赖）

#### 5.3 兼容报告

```json
{
  "status": "passed-with-warnings",
  "changes": ["SVG 纹样已转换为 data URL", "外部样式已全部内联"],
  "warnings": ["阴影效果在部分客户端可能略有差异"],
  "errors": []
}
```

> 存在 `errors` 时，组件不能进入 `approved` 状态。

#### 文件变更清单

| 文件                                           | 变更                        |
| ---------------------------------------------- | --------------------------- |
| `services/src/compiler/html-whitelist.ts`      | 新增 — HTML 标签白名单      |
| `services/src/compiler/css-whitelist.ts`       | 新增 — CSS 属性白名单       |
| `services/src/compiler/style-inliner.ts`       | 新增 — 样式内联器           |
| `services/src/compiler/asset-processor.ts`     | 新增 — 资源处理（SVG 降级） |
| `services/src/compiler/compatibility-check.ts` | 新增 — 兼容性检查           |
| `services/src/compiler/index.ts`               | 新增 — 编译器入口           |
| `services/src/server.ts`                       | 新增编译触发 API            |

---

### Phase 6：Schema 校验 + 代码质量 ✅ 已完成

**目标：** 建立完整的数据校验机制

#### 6.1 校验规则

- 项目数据：必填字段检查、类型检查、ID 格式、profileType 合法性、状态合法性、时间戳格式、DesignMemory 结构
- 组件数据：必填字段检查、类型合法性、状态合法性、版本号一致性、approvedVersion 有效性、assetRefs 有效性、版本详情检查、contentSchema 检查、review 字段检查
- 版本数据：版本号递增、状态流转合法性、CSS 花括号匹配
- 资源数据：路径存在性、SVG 有效性、恶意内容检查、伪 SVG 检测、ID 唯一性

#### 6.2 实现方式

- 使用简单的校验函数（不引入额外依赖）
- 约束层（Constraint Layer）增强，增加 C4 Schema 校验步骤
- 统一校验入口，支持批量校验
- 便捷的格式化输出用于日志

#### 文件变更清单

| 文件                                          | 变更                                   |
| --------------------------------------------- | -------------------------------------- |
| `services/src/validation/index.ts`            | ✅ 新增 — 校验入口，统一校验接口       |
| `services/src/validation/project-schema.ts`   | ✅ 新增 — 项目 Schema（7 项检查）      |
| `services/src/validation/component-schema.ts` | ✅ 新增 — 组件 Schema（9 项检查）      |
| `services/src/validation/asset-schema.ts`     | ✅ 新增 — 资源 Schema（含 SVG 有效性） |
| `services/src/pipeline/constraint-layer.ts`   | ✅ 增强 — 增加 C4 Schema 校验规则      |

#### 验收项

- [x] 项目数据写入前校验（必填字段、类型、状态）
- [x] 组件数据写入前校验（类型、版本、状态流转）
- [x] 资源数据校验（路径存在性、SVG 有效性）
- [x] 校验失败时有明确错误提示
- [x] 约束层集成 Schema 校验

---

## 四、实施路线图

```
Phase 1 ─── BrandSystem + 组件数据结构
  │  (2-3 天)
  ↓
Phase 2 ─── 组件级审核工作台（三栏 UI）
  │  (2-3 天)
  ↓
Phase 3 ─── 单组件修改 + Design Memory 增强
  │  (1-2 天)
  ↓
Phase 4 ─── 文章套用（Article Apply）
  │  (2-3 天)
  ↓
Phase 5 ─── 公众号编译器
  │  (2-3 天)
  ↓
Phase 6 ─── Schema 校验 + 代码质量 ✅
  │  (已完成)
  ↓
完成 🎉
```

**总估算：** 10-15 天

---

## 五、依赖关系

```
Phase 1 ──────┐
               ├──→ Phase 2 ──→ Phase 3 ──→ Phase 4 ──→ Phase 5
               │
Phase 6 ──────┘ (可并行)
```

- Phase 1 是基础，必须先完成
- Phase 2 依赖 Phase 1 的组件数据结构
- Phase 3 依赖 Phase 2 的审核工作台
- Phase 4 依赖 Phase 1 的 BrandSystem 和组件数据结构
- Phase 5 依赖 Phase 4（文章套用需要编译器输出）
- Phase 6 可与 Phase 2-5 并行

---

## 六、风险与注意事项

| 风险                 | 影响           | 缓解措施                                         |
| -------------------- | -------------- | ------------------------------------------------ |
| 组件级审核增加复杂度 | 开发时间增加   | 先实现核心功能（审核 + 对比），UI 优化后续       |
| 公众号编译器兼容性   | 测试时间长     | 先支持白名单过滤 + 内联，SVG 降级后续            |
| 文章解析器准确率     | 组件映射不准确 | 先支持常见结构（h1/h2/blockquote/faq），后续扩展 |
| 现有代码适配         | 可能需要重构   | 向后兼容，新增接口不影响现有功能                 |

---

## 七、验收标准

### Phase 1 验收

- [ ] 创建项目时生成 BrandSystem
- [ ] 组件数据结构包含 sourceHtml、publishHtml、compatibility
- [ ] 组件级审核记录可保存
- [ ] Asset Manifest 可生成

### Phase 2 验收

- [ ] 三栏布局工作台可运行
- [ ] 组件列表显示所有组件及其状态
- [ ] 组件预览可切换版本
- [ ] 可通过/驳回单个组件
- [ ] 版本对比显示差异

### Phase 3 验收

- [ ] 用户可对单个组件提出修改意见
- [ ] 修改请求生成 Task 进入队列
- [ ] Skill 处理 Task 返回新版本
- [ ] 新版本自动显示对比

### Phase 4 验收

- [ ] 可导入 HTML 文章
- [ ] 文章结构可被解析
- [ ] 组件匹配正确
- [ ] 最终文章可预览

### Phase 5 验收

- [ ] 非法标签被拦截
- [ ] 样式可正确内联
- [ ] SVG 有降级方案
- [ ] 存在错误时组件不可通过审核

### Phase 6 验收 ✅

- [x] 项目数据写入前校验（必填字段、类型、状态）
- [x] 组件数据写入前校验（类型、版本、状态流转）
- [x] 资源数据校验（路径存在性、SVG 有效性、恶意内容检测）
- [x] 校验失败时有明确错误提示
- [x] 约束层集成 Schema 校验（C4）
