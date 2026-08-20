# Stage 3b: AI 端到端生成（一次完成：视觉 → 骨架 → CSS → 主题包）

> 位于视觉稿确认（Stage 3a）之后。**不再拆分多阶段、不再产出中间 State JSON**——
> 读取需求与组件注册表，一次把主题做出来。细节规范见下方引用的参考 prompt。

## 输入

1. `themes/{theme-name}/states/brand_state.json`（品牌解读）
2. `themes/{theme-name}/states/concept_state.json`（含用户选中的 `visual_metaphors[]` 那一项）
3. `themes/{theme-name}/preview/vision.html`（用户已确认的视觉稿）
4. `registry/components.json`（组件注册表：abbr / slot 契约 / design_tier）

## 任务：一次性产出五样东西

| 产物 | 路径 | 说明 |
|---|---|---|
| 主题清单 | `themes/{theme-name}/manifest.json` | AI 产出：`meta`（名称/描述/关键词）、`layout`（preferredComponents/density/tone/defaultVariants）、`codeTheme`、`brand`（供 brand.md）——打包脚本读取它 |
| 自由骨架模板 | `themes/{theme-name}/templates/<id>.html` | 需要改骨架的组件才写（像内置主题自由出）；未写组件回退默认骨架 |
| 组件 CSS | `themes/{theme-name}/css/{theme-name}.css` | 完整 CSS（微信兼容、同路径同特异性、配色可读） |
| 公众号发布 HTML | `themes/{theme-name}/publish/{theme-name}.html` | 内联版（对应复制到公众号的最终形态） |
| 主题包 | `themes/{theme-name}/{theme-name}.wemd-theme` | 打包产物，可直接导入主程序 |

> 视觉稿（`preview/vision.html`）是气质锚点：所有组件的视觉都必须能回溯到它，不另起一套。

## 步骤

### 1. 组件策略（母题牵引）

把全部组件按母题承载潜力分三档，作为**默认克制档位**（不是门禁）：

| 档位 | 含义 | 默认预算 |
|---|---|---|
| **brand_anchor** | 最能承载母题视觉对象的组件 | 高（软上限 ~6） |
| **content** | 内容阅读为主，继承视觉语言但克制 | 中 |
| **utility** | 辅助性组件，极简隐形 | 低 |

**母题牵引**：哪些组件进高预算池由视觉母题决定（`visual_objects`/`material_language`），不是固定组合。母题需要时任何档位都可提权为构图焦点。

### 2. 自由骨架（参考 `prompts/04.5-skeleton-composition.md`）

对成为**构图焦点**的组件写 Mustache 骨架模板。**自由写**（结构/class/装饰/嵌套都不受限），只守三条底线：

1. 根元素 `<section class="wemd-component wemd-{id}" data-component="{id}">…</section>`
2. 只用该组件已注册 slot key（`{{slot:key}}` / `{{#if key}}` / `{{#each key}}`）
3. 微信兼容：无伪元素 / 结构伪类 / 绝对定位 / 动画 / 媒体查询 / 兄弟选择器；装饰用真实元素

骨架**不写 CSS 值**（style 属性一律不写）。未定制组件不产模板（回退默认）。

### 3. 组件 CSS（参考 `css-compiler/prompts/06-compiler.md`）

编译 `css/{theme-name}.css`，核心规则：

- 覆盖共享样式用**同路径同特异性**（playbook §1）：完整写 `#wemd .wemd-容器 .wemd-子元素`，否则内联导出被共享覆盖不生效。
- **微信兼容**：无伪元素 / 动画 / 结构伪类 / `@media` / 兄弟选择器 / `position:absolute`；被替代或删除的装饰在注释里说明原因。
- **配色可读**（playbook §2）：深色背景配浅字、浅色背景配深字，逐组件核对不撞色。
- 布局契约：组件不写外部 margin（间距由 Stack 统一分配）；容器水平内边距统一用 `var(--wemd-space-inline)`。
- 骨架宣告的结构单元，CSS 有义务填满（有骨无肉 = 残缺交付）。

### 4. 主题包

按 `reference/theme-packing.md` 打包 `{theme-name}.wemd-theme`（manifest / styles/components.css / templates）。

## 自检

完成后对照 `prompts/self-check.md` 逐条自检；进入 Stage 4 回归验证前先过一遍。

## 铁律

1. 组件视觉必须回溯到已确认的视觉稿，不另起一套。
2. 未定制组件保持默认（皮肤不覆盖、模板不产出），避免意外样式。
3. 骨架三条底线 + CSS 微信兼容 + 配色可读，违反即返工。
