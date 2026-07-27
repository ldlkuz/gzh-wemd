# WeMD 组件生态系统 — 改造计划书

> 版本：1.0
> 日期：2026-07-27
> 分支：feature/component-ecosystem
> 状态：规划阶段

---

## 一、背景与动机

### 1.1 现状问题

当前 30 个组件分散在 4 个 CSS 文件 + 5 个注册表中，新增一个组件需要同时修改：

| 步骤 | 文件                    | 内容                          |
| ---- | ----------------------- | ----------------------------- |
| 1    | `components-*.ts`       | CSS 样式                      |
| 2    | `componentSchemas.ts`   | AI 可识别的 content schema    |
| 3    | `componentRenderers.ts` | Template JSON 渲染逻辑        |
| 4    | `analysisAgent.ts`      | `AVAILABLE_COMPONENTS` 白名单 |
| 5    | `AiLayoutPanel.tsx`     | 中文标签映射                  |

**核心痛点**：

- 组件不是自包含的，无法独立分发
- 第三方无法贡献新组件或同类型变体
- AI 无法感知组件的语义信息和风格差异
- 组件样式和渲染逻辑与解析器强耦合

### 1.2 目标愿景

构建一个可扩展的组件生态系统：

```
组件库 = 基础组件类型 × N 个风格变体
         ↓
    同一语义，不同外观
         ↓
   用户 / 第三方可自由导入
```

- 每个组件是**自包含的包**（manifest + CSS + renderer）
- 同类型可有多个风格变体
- AI 可根据文章风格自动选择合适的变体
- 支持从文件 / URL / 组件市场导入

---

## 二、当前架构梳理

### 2.1 组件生命周期

```
定义层（4 个 CSS 文件）
    → Schema 层（componentSchemas.ts）
        → 渲染层（componentRenderers.ts / magazineRenderers.ts）
            → 解析层（markdown-it-component.ts）
                → 后处理层（ThemeProcessor.ts）
```

### 2.2 现有扩展点

| 扩展点            | 位置                    | 方式              | 动态性    |
| ----------------- | ----------------------- | ----------------- | --------- |
| Markdown 解析插件 | `MarkdownParser.ts`     | `.use()` 链式注册 | ❌ 硬编码 |
| 组件 CSS          | 4 个 `components-*.ts`  | 字符串导出        | ❌ 硬编码 |
| 组件 Schema       | `componentSchemas.ts`   | 数组              | ❌ 硬编码 |
| 组件渲染器        | `componentRenderers.ts` | Record 对象       | ❌ 硬编码 |
| 杂志级渲染器      | `magazineRenderers.ts`  | Record 对象       | ❌ 硬编码 |
| AI 白名单         | `AVAILABLE_COMPONENTS`  | 数组              | ❌ 硬编码 |
| 主题变量          | `theme-variables.ts`    | CSS 变量          | ❌ 硬编码 |

**结论：所有扩展点均为编译时硬编码，没有动态注册能力。**

### 2.3 现有组件清单（30 个）

| 文件                     | 数量 | 组件                                                                                                                                                                            |
| ------------------------ | ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `components-default.ts`  | 9    | quote-card, divider-fancy, cta-card, code-frame, callout-pro, stats-block, image-grid, author-card, timeline                                                                    |
| `components-extra.ts`    | 13   | follow-bar, qr-card, numbered-heading, section-title, image-text-row, hero-banner, share-card, related-posts, toc-nav, tag-label, image-caption, copyright-notice, styled-table |
| `components-faq.ts`      | 1    | faq                                                                                                                                                                             |
| `components-magazine.ts` | 7    | magazine-cover, section-divider, image-card, text-card, full-quote, two-column-cards, end-card                                                                                  |

---

## 三、目标架构

### 3.1 组件包格式（.wemdc）

每个组件包是一个包含 `manifest.json` 和 `style.css` 的目录或 zip 包：

```
share-card-neon/
├── manifest.json
└── style.css
```

**manifest.json 规范**：

```json
{
  "type": "share-card",
  "variant": "neon",
  "version": "1.0.0",
  "label": "霓虹分享引导",
  "description": "霓虹灯效果的文末分享引导，适合科技/潮流类文章",
  "author": "community",
  "tags": ["科技", "潮流", "高对比"],
  "schema": {
    "text": {
      "type": "string",
      "description": "收尾感言文字",
      "default": "觉得有用就分享给朋友吧"
    }
  },
  "props": {
    "intensity": {
      "type": "string",
      "enum": ["low", "medium", "high"],
      "default": "medium"
    }
  },
  "magazineLevel": ["high", "medium"],
  "requires": {
    "themeVariables": ["--wemd-primary", "--wemd-bg-soft"]
  }
}
```

**字段说明**：

| 字段            | 必需 | 说明                                                                                  |
| --------------- | ---- | ------------------------------------------------------------------------------------- |
| `type`          | ✅   | 归属的基础组件类型。同一 type 的所有 variant 语义等价（都可作为文章收尾），仅视觉不同 |
| `variant`       | ✅   | 风格变体标识，在 type 内唯一                                                          |
| `version`       | ✅   | 语义化版本                                                                            |
| `label`         | ✅   | 中文标签，展示给用户                                                                  |
| `description`   | ✅   | 详细描述，帮助用户和 AI 选择                                                          |
| `author`        | ✅   | 作者标识                                                                              |
| `tags`          |      | 风格标签，辅助 AI 匹配                                                                |
| `schema`        | ✅   | AI 调用时需要的 content 数据结构                                                      |
| `props`         |      | 组件可配置属性定义                                                                    |
| `magazineLevel` |      | 适用的杂志化等级，空数组或省略表示不限制                                              |
| `requires`      |      | 依赖的 CSS 变量清单，确保主题兼容                                                     |

**style.css 规范**：

- 所有选择器以 `#wemd .wemd-{type}[data-variant="{variant}"]` 为前缀
- 禁止使用 `background-color` 在 `#wemd` 层级
- 禁止外部资源引用（`@import`, `url()` 外链）
- 字体大小 ≥ 14px
- 颜色对比度满足 WCAG AA

示例：

```css
#wemd .wemd-share-card[data-variant="neon"] {
  margin: 40px 0 24px 0;
  padding: 24px 16px;
  text-align: center;
  border-top: 2px solid var(--wemd-primary, #07c160);
  box-shadow: 0 0 20px rgba(7, 193, 96, 0.15);
}

#wemd
  .wemd-share-card[data-variant="neon"]
  .wemd-component-body
  > p:first-child {
  font-size: 15px;
  color: var(--wemd-primary, #07c160);
  text-shadow: 0 0 8px rgba(7, 193, 96, 0.3);
}
```

### 3.2 ComponentRegistry

统一的组件注册中心：

```typescript
class ComponentRegistry {
  // 注册一个组件包
  register(pkg: ComponentPackage): void;

  // 注销
  unregister(type: string, variant: string): void;

  // 获取某个类型的所有变体
  getVariants(type: string): ComponentVariant[];

  // 获取所有已注册的类型
  getTypes(): string[];

  // 获取当前活跃的默认变体
  getDefaultVariant(type: string): ComponentVariant | undefined;

  // 为 AI 生成组件描述
  describeForAi(): string;

  // 获取所有组件 CSS（拼接后注入页面）
  getAllCss(): string;

  // 获取组件的 content schema（供 AI 调用）
  getSchema(type: string, variant: string): ComponentSchema | undefined;
}
```

**注册时机**：

- 内置组件：应用启动时批量注册
- 导入组件：用户操作后调用 `registry.register(pkg)`

### 3.3 渲染流程变更

```
markdown-it-component 解析 ::: share-card{...} :::
    ↓
生成 <section class="wemd-share-card" data-variant="neon">
    ↓
ThemeProcessor 内联样式时：
  1. 读取元素 data-variant 属性
  2. 从 Registry 获取对应 variant 的 CSS
  3. 注入对应选择器的样式
```

### 3.4 AI 集成变革

**之前**：AI 只知道 16 个组件名，按模板槽位分配。

**之后**：AI 感知完整组件生态：

```
可用组件类型 (30):
  share-card (3 个变体):
    - 默认: 一行文字收尾
    - neon: 霓虹灯效果，适合科技/潮流
    - minimal: 极简风格，适合严肃内容
  quote-card (2 个变体):
    - 默认: 左边框引用
    - magazine: 全宽背景引用
  ...
```

AI 选择逻辑从"填表"变成"内容+风格匹配"：

```
1. 文章这里需要收尾引导 → 选 share-card 类型
2. 文章整体风格轻松 → 从 tags 匹配 → 选 neon 变体
3. 如果无匹配 → 使用默认变体
```

### 3.5 导入机制

| 来源         | 方式                     | 格式                   |
| ------------ | ------------------------ | ---------------------- |
| 本地文件     | 拖拽 .wemdc 文件到编辑器 | 单个 zip/目录          |
| 组件市场 URL | 输入 GitHub raw URL      | manifest.json 远程获取 |
| CDN 分发     | manifest 索引文件        | JSON 注册表            |

**导入流程**：

```
.wemdc 文件 / URL
    ↓
解包 / 下载
    ↓
校验 manifest.json + style.css
    ↓
Registry.register()
    ↓
CSS 注入页面 → 即时可用
    ↓
持久化到本地存储 → 下次启动自动加载
```

---

## 四、实施路线

### Phase 1：统一内置组件格式（2-3 天）

**目标**：不改功能，把现有 30 个组件迁移到 manifest 模式。

**工作项**：

1. 创建 `packages/core/src/components/` 目录
2. 每个组件一个目录：`{type}/default/`、`{type}/{variant}/`
3. 每个目录含 `manifest.json` + `style.css`
4. 把现有 4 个 CSS 文件的内容拆解到各组件目录
5. 创建 `ComponentRegistry` 核心类
6. 应用启动时内置组件自动注册
7. 保持现有 API 兼容（`getAllCss()` 拼接输出不变）

**产出**：

- 30 个组件包目录
- `ComponentRegistry` 可工作
- 现有功能完全不受影响

### Phase 2：变体系统 + 导入机制（3-4 天）

**目标**：支持同类型多变体和外部导入。

**工作项**：

1. 实现 `data-variant` 属性注入（`markdown-it-component.ts` 改造）
2. 实现 CSS 选择器变体匹配（`ThemeProcessor.ts` 改造）
3. 实现 `.wemdc` 文件解析和导入
4. 实现本地存储持久化
5. UI：组件管理面板（查看已安装、导入、启用/禁用）
6. 为 2-3 个高频组件创建示范变体（如 share-card-minimal、quote-card-bold）

**产出**：

- 变体系统可用
- 可导入 `.wemdc` 文件
- 管理面板上线

### Phase 3：AI 感知变体（2 天）

**目标**：AI 根据文章风格选择组件变体。

**工作项**：

1. `Registry.describeForAi()` 在 prompt 中注入变体信息
2. AI 的 `analysisAgent` 和 `templateAgent` 支持输出 `variant` 字段
3. `applyInsertions` 和 `renderer` 处理 `variant` 字段
4. 变体匹配启发式规则（基于 tags + magazineLevel）

**产出**：

- AI 可自动选择变体
- 变体信息在 AI prompt 中可见

### Phase 4：组件市场（2-3 天）

**目标**：第三方可发布和安装组件。

**工作项**：

1. 组件市场 manifest 索引格式规范
2. 从 GitHub raw 下载安装
3. 版本检查 + 自动更新提示
4. 组件安全校验（CSS 注入前过滤危险规则）
5. 市场 UI（浏览、搜索、安装）

**产出**：

- 组件市场可用
- 文档：组件开发指南 + API 参考

---

## 五、架构对比

| 维度       | 当前              | 目标                                     |
| ---------- | ----------------- | ---------------------------------------- |
| 组件定位   | 4 个 CSS 文件散装 | 自包含包（manifest + CSS）               |
| 注册方式   | 硬编码 import     | `Registry.register(pkg)` 动态注册        |
| 风格变体   | 不存在            | type + variant 双层体系                  |
| 第三方贡献 | 不可能            | `.wemdc` 文件导入                        |
| AI 感知    | 仅知名称          | 完整 schema + tags + 变体描述            |
| 扩展门槛   | 改 5 个文件       | 写 2 个文件（manifest.json + style.css） |
| 分发方式   | Git 源码          | 组件市场 URL / 本地文件                  |

---

## 六、兼容性保证

- 现有 Markdown 语法（`::: type{props}...:::`）不变
- 现有渲染输出（HTML 结构）不变
- 现有 AI 接口不变（渐进增强 `variant` 可选字段）
- `style.css` 使用 `[data-variant]` 属性选择器隔离，不影响默认行为
- 内置组件保留为"默认变体"，无需额外配置

---

## 七、风险与对策

| 风险                     | 对策                                                               |
| ------------------------ | ------------------------------------------------------------------ |
| CSS 选择器冲突           | `[data-variant]` 属性隔离，variant 命名空间在 type 内唯一          |
| 第三方组件安全           | CSS 注入前过滤 `expression()`/`javascript:`/`@import`/外部 `url()` |
| 变体过多导致 AI 选择困难 | 默认变体 + 启发式匹配兜底，AI 不选就回退默认                       |
| 组件包体积膨胀           | 本地最多缓存 50 个包，按使用频率清理                               |
| 破坏现有功能             | Phase 1 维持 API 兼容，全部旧测试应通过                            |

---

## 八、关键文件清单（Phase 1 新增）

```
packages/core/src/components/
├── registry/
│   ├── ComponentRegistry.ts    ← 核心注册中心
│   ├── packageLoader.ts        ← .wemdc 解析/校验
│   └── cssInjector.ts          ← CSS 动态注入
├── builtin/
│   ├── share-card/
│   │   └── default/
│   │       ├── manifest.json
│   │       └── style.css
│   ├── quote-card/
│   │   └── default/
│   │       ├── manifest.json
│   │       └── style.css
│   └── ...（共 30 个组件）
└── index.ts                    ← 组件系统入口
```

---

## 九、下一步

1. 审查本计划书，确认技术路线
2. 开始 Phase 1：统一内置组件格式
3. 完成 Phase 1 后，在真实文章中测试变体系统
