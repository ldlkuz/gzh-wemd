# 产物布局规范（Artifact Layout）

本文件是 **skill 全部产物存放位置与文件结构的唯一权威约定**。所有阶段产物、schema、脚本输入输出都必须遵循本规范，避免多主题产物相互混淆。

> 核心原则：**共享资源与主题数据分离**；**每个主题独立成目录**，其全部产物（State、编译中间件、最终交付物）都收在同一个主题目录下，互不干扰。

---

## 1. 目录总览

```text
wemd-theme-designer/
├── schema/                    # 共享 Schema（规范，不随主题变化）
├── registry/components.json   # 组件注册表（共享，43 个组件权威定义）
├── prompts/                   # 各阶段 Prompt（共享）
├── css-compiler/prompts/      # 编译阶段 Prompt（共享）
├── reference/                 # 参考文档（共享，含本文件）
├── scripts/                   # 脚本（共享，输入输出走 themes/）
├── themes/                    # ★ 主题产物库，每个主题一个目录
│   └── {theme-name}/          #   见 §3
└── SKILL.md / README.md / skill.json
```

---

## 2. 共享 Schema（`schema/`）

所有阶段输出格式的 JSON Schema 集中存放，与主题数据分离。**Schema 是规范，不随主题变化，只读不写。**

| 文件                                    | 阶段       | 校验对象                  |
| --------------------------------------- | ---------- | ------------------------- |
| `schema/brand_state.schema.json`        | Stage 1    | `brand_state.json`        |
| `schema/concept_state.schema.json`      | Stage 2    | `concept_state.json`      |
| `schema/visual_language.schema.json`    | Stage 3    | `visual_language.json`    |
| `schema/component_strategy.schema.json` | Stage 4    | `component_strategy.json` |
| `schema/skeleton_intent.schema.json`    | Stage 4.5  | `skeleton_intent.json`    |
| `schema/component_mapping.schema.json`  | Stage 5    | `component_mapping.json`  |
| `schema/CreativeTheme.schema.json`      | 创意层聚合 | 创意阶段整体设计稿        |
| `schema/BrandVisualTheme.schema.json`   | 最终规范   | `BrandVisualTheme.json`   |

> 参考示例 `reference/example/demo-theme.json` 不在 `schema/` 内，它是数据示例而非规范。

---

## 3. 主题目录（`themes/{theme-name}/`）

每个主题在 `themes/` 下独立成目录，**全程产物隔离**。AI 产出的 State、脚本的中间产物、最终交付物都收在其中。

```text
themes/{theme-name}/
├── states/                       # 【AI 产出】工作记忆（6 个 State JSON）
│   ├── brand_state.json          #   Stage 1
│   ├── concept_state.json        #   Stage 2（含选中的视觉母题）
│   ├── visual_language.json      #   Stage 3
│   ├── component_strategy.json   #   Stage 4
│   ├── skeleton_intent.json      #   Stage 4.5（形）
│   └── component_mapping.json    #   Stage 5（皮）
├── BrandVisualTheme.json         # 【Assembler 产物】最终主题规范（产品交付物）
├── css/
│   └── {theme-name}.css          # 【Compiler 产物】完整 CSS
├── preview/
│   └── {theme-name}-preview.html # 【Compiler 产物】开发预览
├── publish/
│   └── {theme-name}.html         # 【Compiler 产物】公众号发布
├── package/                      # 【打包中间产物】pack-theme.cjs 输出
│   ├── manifest.json
│   ├── brand.md
│   ├── styles/components.css
│   └── templates/<id>.html       #   骨架模板（compile-skeleton 展开）
└── {theme-name}.wemd-theme       # 【最终交付物】可导入主程序的主题包
```

### 3.1 各阶段产物 → 路径 → Schema 对照

| 阶段      | 产物文件                                                | 校验 Schema                                   |
| --------- | ------------------------------------------------------- | --------------------------------------------- |
| Stage 1   | `themes/{theme-name}/states/brand_state.json`           | `schema/brand_state.schema.json`              |
| Stage 2   | `themes/{theme-name}/states/concept_state.json`         | `schema/concept_state.schema.json`            |
| Stage 3   | `themes/{theme-name}/states/visual_language.json`       | `schema/visual_language.schema.json`          |
| Stage 4   | `themes/{theme-name}/states/component_strategy.json`    | `schema/component_strategy.schema.json`       |
| Stage 4.5 | `themes/{theme-name}/states/skeleton_intent.json`       | `schema/skeleton_intent.schema.json`          |
| Stage 5   | `themes/{theme-name}/states/component_mapping.json`     | `schema/component_mapping.schema.json`        |
| Assembler | `themes/{theme-name}/BrandVisualTheme.json`             | `schema/BrandVisualTheme.schema.json`         |
| Compiler  | `themes/{theme-name}/css/{theme-name}.css`              | —                                             |
| Compiler  | `themes/{theme-name}/preview/{theme-name}-preview.html` | —                                             |
| Compiler  | `themes/{theme-name}/publish/{theme-name}.html`         | —                                             |
| Stage 7   | `themes/{theme-name}/package/*`                         | `schema/BrandVisualTheme.schema.json`（复核） |
| Stage 7   | `themes/{theme-name}/{theme-name}.wemd-theme`           | `reference/theme-packing.md`                  |

### 3.2 目录职责划分

| 目录                         | 谁写                      | 生命周期                             |
| ---------------------------- | ------------------------- | ------------------------------------ |
| `states/`                    | AI（各阶段）              | 主题工作记忆，可随时重建，不随包交付 |
| `BrandVisualTheme.json`      | Assembler                 | 产品交付物之一，随主题保留           |
| `css/` `preview/` `publish/` | Compiler 脚本             | 中间产物，可重新编译                 |
| `package/`                   | pack-theme.cjs            | 打包中间件，可重新生成               |
| `{theme-name}.wemd-theme`    | 用户手动 Compress-Archive | **最终交付物**，可导入主程序         |

---

## 4. theme-name 命名规则

`theme-name` 贯穿全程，是主题目录名、CSS 文件名、变体名（`data-variant`）、主题包名。

- 格式：小写 ASCII 字母 + 数字，多个词用连字符 `-` 连接。如 `intelligent-precision`、`cangre-audit`。
- 来源：通常在流程开始由用户/前期确定，代表品牌与用途。中文品牌名须先转拼音或取英文简称。
- 唯一性：`themes/` 下不可重复；新主题若与已有主题同名，须改用不同名，避免覆盖。

---

## 5. 脚本路径约定

脚本输入输出必须遵循本规范，禁止写回共享目录：

| 脚本                                         | 输入                                                                     | 输出                                           |
| -------------------------------------------- | ------------------------------------------------------------------------ | ---------------------------------------------- |
| `scripts/compile-skeleton.cjs`               | `themes/{theme}/states/skeleton_intent.json`                             | `themes/{theme}/package/templates.json`        |
| `scripts/pack-theme.cjs <theme>`             | `themes/{theme}/BrandVisualTheme.json`、`themes/{theme}/css/{theme}.css` | `themes/{theme}/package/`                      |
| `scripts/validate-css-selectors.mjs <theme>` | `themes/{theme}/css/{theme}.css`                                         | 校验结果                                       |
| `scripts/compile-preview.cjs <theme>`        | `themes/{theme}/BrandVisualTheme.json`                                   | `themes/{theme}/preview/`                      |
| `scripts/compile-publish.cjs <theme>`        | `themes/{theme}/BrandVisualTheme.json`                                   | `themes/{theme}/publish/`                      |
| `scripts/extract-dom-snapshot.mjs`           | 主程序 `defaultTemplates`/`slotDefs`                                     | `reference/dom-structure.md`（共享，不随主题） |

> 脚本一律通过 `theme-name` 参数定位主题目录，**不写 `themes/` 之外的任何产物**。

---

## 6. 生命周期与清理

- **States 可丢弃**：`states/` 中的 State 是工作记忆，主题完成后可清理，不影响已交付的 `.wemd-theme`。
- **中间件可重建**：`css/`、`preview/`、`publish/`、`package/` 均可由脚本重新生成。
- **交付物保留**：`BrandVisualTheme.json`、`{theme-name}.wemd-theme` 是核心交付物，长期保留。
- 删除整个主题：直接删除 `themes/{theme-name}/` 目录即可，不影响其他主题与共享资源。
