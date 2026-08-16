# 主题设计 Skill 验收清单（检查目标）

面向开发者 / Agent 验收 `wemd-theme-designer` 时的体检清单，聚焦**本 skill 特有契约**。逐项勾选，全部通过方视为结构合格。用于交付前自检、阶段性回归、以及日后的持续体检。

> 本清单由一次系统性体检沉淀而来，别名「检查目标」，覆盖六类高频问题：文档与代码漂移、术语重载、阶段衔接、脚本工具链、职责越界、硬编码门禁。

---

## 1. 文档与代码一致性

- [ ] `visual_language` 只有 `color_direction`；任何文档/脚本不得引用 `visual_language.color.palette`、`typography.typefaces.heading` 等不存在字段
- [ ] `design_tokens` 语义是「受控词表（档位）」；文档不得描述为「具体色值/圆角/阴影来源」
- [ ] SKILL.md / README / artifact-layout 的脚本索引与实际 `scripts/` 目录一致，无「废弃脚本被引为权威」的情况
- [ ] schema 字段名与 BrandVisualTheme 实际结构一致（如 `component_strategy.brand_anchor`、`components.focal`）

## 2. 术语一致性

- [ ] `component_strategy.brand_anchor` 只表示「高预算候选池（默认档位）」
- [ ] `components.focal` 只表示「深度设计焦点集」，与 `skeletons` 一一对应
- [ ] 全库无 `components.brand_anchor` 残留（候选池与焦点集已拆分）
- [ ] 概念措辞（prompt / 文档 / 注释）与字段名一致，无「Brand Anchor 组件 = 深度设计」的重载表述

## 3. 阶段间状态衔接

- [ ] Stage 1-3（brand / concept / visual_language）输出字段与 Stage 4 消费字段一致
- [ ] Stage 4（component_strategy）→ 4.5（skeleton_intent）→ 5（component_mapping）状态字段链一致
- [ ] Stage 4.5 决策准则统一为「母题需要 + 焦点有限」，无「必须设计 Anchor」「深度设计仅限 Anchor」门禁话术
- [ ] 各阶段 state 文件符合对应 schema（skeleton_intent ↔ skeleton-design-spec，component_mapping ↔ component_mapping.schema）

## 4. 脚本工具链

- [ ] 每个脚本有对应文档条目，无「文档引用但脚本不存在」或「脚本存在但文档未收录」的漂移
- [ ] 脚本读取的字段名与 schema / BrandVisualTheme 一致（如 pack-theme 读 `component_strategy.brand_anchor`，不读 `components.focal`）
- [ ] 打包产物（manifest.json / 组件 CSS）能被 validate-theme / validate-css-selectors 校验通过

## 5. 职责边界（不越界）

- [ ] JSON Schema / AI prompt 不越权做机械脚本该做的事（组件检索、合并、DOM 生成）
- [ ] 机械脚本不越权做创意决策（如自行决定焦点）、不越权发明数据
- [ ] 三分类（component_strategy）只设默认档位，不代行构图决策（构图由骨架/母题决定）

## 6. 软预算 vs 硬锁

- [ ] 「约 6」等以「软上限」表述，无硬编码数量门禁（如「必须 6 个」「最多 6 个」）
- [ ] 焦点数量由母题 / 骨架决定，非固定 Top N

## 7. 微信兼容性

- [ ] 组件 CSS 无 `::before` / `::after` / `:hover` / 结构伪类 / `@keyframes` / `@media` / `animation` / `+` / `~`（详见 assembler-and-compiler 的 wechat-compatibility）

---

## 使用建议

- **交付前**：逐项过一遍，任何「否」都拦截发布。
- **每次跑完机械链路后**：重点复查第 1、4 类（文档/脚本最易漂移）。
- **新增组件或改造阶段时**：重点复查第 2、3、5 类（术语与职责最易被破坏）。
