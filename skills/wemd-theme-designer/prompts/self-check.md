# 自检清单

生成完成后，必须逐条检查：

## 创意阶段检查

- [ ] 创意阶段（Stage 1-3）是否真的没有接触组件概念？
- [ ] Stage 3 的输出是否使用了"页面区域"语言而非"组件"语言？
- [ ] `themes/{theme-name}/states/visual_language.json` 是否没有出现 title/image/card/quote 等组件名称？

## 翻译阶段检查

- [ ] 翻译阶段（Stage 4-5）是否准确理解了创意视觉语言？
- [ ] Brand Anchor 的选择是否与创意视觉方向一致？
- [ ] 每个 Brand Anchor 的 design.direction 是否能从创意视觉中找到源头？

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
- [ ] 创意阶段没有接触组件概念

## 最终输出格式检查

- [ ] 输出是完整的 BrandVisualTheme JSON（包含 schema 字段）
- [ ] `component_strategy` 包含所有 43 个组件，且覆盖三个分类
- [ ] `component_strategy.brand_anchor` 包含 score 和 reason
- [ ] `components.focal` 只包含进入深度设计焦点集的组件（软上限 ~6，由母题/骨架决定）
- [ ] `components.content` 和 `components.utility` 已正确输出
- [ ] `components.content/utility` 包含 component_rules
- [ ] `components.focal`（深度设计焦点集）与 `skeletons` 一一对应，通常为 `component_strategy.brand_anchor` 的子集；母题提权时允许个别 Content/Utility 组件因成为焦点而入选
- [ ] `design_tokens` 已正确输出
- [ ] `metadata.version` 为 "1.0"
- [ ] JSON 格式正确，无遗漏字段
- [ ] design.direction 是自然语言描述，不是 CSS 值
