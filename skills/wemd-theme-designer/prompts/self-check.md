# 自检清单

生成完成后，必须逐条检查：

## 需求定义阶段检查

- [ ] 需求定义（Stage 1-2）是否真的没有接触组件概念？
- [ ] 视觉稿（Stage 3a）是否使用了"页面区域"语言而非"组件"语言？
- [ ] `concept_state.json`（含选中的母题）与 `brand_state.json` 是否正确？

## 端到端生成检查

- [ ] 端到端生成（Stage 3b）是否准确理解了视觉稿与母题？
- [ ] Brand Anchor 的选择是否与视觉稿方向一致？
- [ ] 每个焦点组件的视觉是否能从视觉稿/母题中找到源头？

## Brand

- [ ] 这个主题是否能让人感受到品牌人格？
- [ ] 是否准确理解了品牌的核心身份？

## Consistency

- [ ] 不同组件是否像同一个设计系统？
- [ ] 视觉语言是否在所有组件中得到一致映射？

## Hierarchy

- [ ] Brand Anchor 的视觉权重是否明显高于 Content 和 Utility？
- [ ] Brand Anchor 是否真正突出？

## Restraint

- [ ] Content 组件是否足够克制（继承 + component_rules 约束）？
- [ ] Utility 组件是否尽可能隐形（继承 + 最小化约束）？

## Creativity

- [ ] Brand Anchor 是否真正具有独特性？
- [ ] 设计是否超越了"颜色替换"的层面？

## Readability

- [ ] 品牌表达是否影响正常阅读？
- [ ] Content 组件是否保持可读性优先？
- [ ] component_rules 中的 emphasis/decoration 是否合理？

## Necessity

- [ ] 每一个 Brand Anchor 是否都有存在的理由？
- [ ] 是否有"为了品牌而装饰"的情况？

## Mapping Quality

- [ ] 每个 Brand Anchor 的 design.role 是否清晰描述了它在这个品牌中的视觉任务？
- [ ] Brand Anchor 的 design.direction 是否有足够的独特性？
- [ ] `components.content` 和 `components.utility` 是否克制且合理？
- [ ] component_rules 的 override 是否有效限制了继承带来的过度表达？

## Efficiency

- [ ] Brand Anchor 高预算池是否克制、焦点少而准（软上限 ~6，非硬锁）？
- [ ] 深度设计对象是否由母题/焦点驱动（任何档位组件都可因母题需要提权）？是否避免"为了品牌而装饰"？
- [ ] Brand Anchor 的选择是否有充分的品牌理由？

## Design Tokens

- [ ] 所有受控词汇是否在 `design_tokens` 定义范围内？
- [ ] Content/Utility 的 strategy 值是否在推荐范围内？

## 禁止事项检查

- [ ] 没有先想 CSS 再思考品牌
- [ ] 没有给每个组件使用完全相同的设计套路
- [ ] 没有为了体现品牌给所有组件添加装饰
- [ ] 没有强制所有组件使用统一圆角
- [ ] 没有强制所有组件使用品牌色
- [ ] 没有把品牌化理解为颜色替换
- [ ] 没有把参考图直接复制成模板
- [ ] 没有默认设计全部组件为高复杂度
- [ ] 没有为了"完整"牺牲阅读体验
- [ ] 没有让组件本身抢过内容
- [ ] 深度设计没有超出合理范围（焦点少而准，软上限 ~6，除非每个都有强理由）
- [ ] 没有为"体现品牌"而把所有组件都深度设计（是否克制地只设计了焦点组件）
- [ ] 需求定义阶段没有接触组件概念

## 最终输出检查（端到端生成产物）

- [ ] 视觉稿（`preview/vision.html`）已确认，且与需求（brand_state + 母题）一致
- [ ] 自由骨架（`templates/*.html`）：只给有刻意构图理由的组件写，未写组件保持默认
- [ ] 自由骨架三条底线：根元素 `wemd-component wemd-{id}` + `data-component`、只用已注册 slot key、无微信不兼容特性
- [ ] 骨架模板不写 CSS 值（style 属性一律不写）
- [ ] 焦点组件（深度设计）数量克制（软上限 ~6，母题需要时任何档位可提权）
- [ ] CSS（`css/{theme-name}.css`）：覆盖共享样式用同路径同特异性；组件不写外部 margin；容器水平内边距用 `var(--wemd-space-inline)`
- [ ] 主题包（`{theme-name}.wemd-theme`）已生成，可导入主程序

## 编译产物回归检查（playbook §四）

- [ ] **骨架装饰存在**：每个定制骨架组件的装饰元素（badge/glow/line/dot/corner）在骨架模板中出现
- [ ] **配色可读**：深色背景元素配浅色文字、浅色背景元素配深色文字，无深底深字 / 浅底浅字
- [ ] **未定制组件保持默认**：未进入骨架设计的组件无自定义模板、无 CSS 覆盖规则（无主题污染）
- [ ] **无伪元素 / 结构伪类残留**：publish HTML 全内联，不含 `::before`/`::after`/`:hover`/结构伪类/`@keyframes`/`@media`/`animation`/兄弟选择器；CSS 中仅允许存在纯中和规则（`content: none`，存于 components.css）
- [ ] **与视觉稿一致**：焦点组件的颜色/装饰能回溯到已确认的视觉稿（`preview/vision.html`），不另起一套
- [ ] **整篇无背景**：`#wemd` 无 `background-color` / 整篇背景图
- [ ] **微信兼容**：被替代/删除的装饰在 CSS 注释里说明了原因
- [ ] **降级不丢内容**：未声明扩展槽时内容进 desc/body 兜底，不丢数据
- [ ] **无重复装饰**：覆盖「共享伪元素装饰清单」组件（callout-pro/divider/pullquote/steps/faq）时已中和共享 `::before/::after`（`content: none` 存于 components.css）；pullquote 已覆盖共享根元素 `border-left`（非伪元素）；timeline 圆点不自己写 left（依赖共享尺寸无关居中）；导出后同一装饰线/条只出现一条（无双竖条/双线、无额外 `wemd-mat` 物化）
