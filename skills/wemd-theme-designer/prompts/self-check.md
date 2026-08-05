# AI 自检清单（Profile 驱动版）

生成主题包前，**必须**逐项检查以下内容。全部通过后才能输出。
自检清单已适配两种 Profile 模板（Brand Profile / Creator Profile）。

---

## A. Profile 完整性（生成前必查，缺一项都不能开始）

### A1. 通用必填项（两种 Profile 都要查）

- [ ] **名称**已提供（企业名称 / 公众号名称）
- [ ] **定位描述**已提供：
  - Brand Profile：企业简介 100~300 字（不在此范围需提醒用户）
  - Creator Profile：内容方向已选定 + 至少一句话描述
- [ ] **风格关键词**已确定：
  - [ ] 在 3~5 个之间（少于 3 问用户加，多于 5 问用户减）
  - [ ] 全部都在 18 个预设清单内（不在的映射到最接近的预设，并说明）
  - [ ] 组合无明显冲突（如：极简 + 活力、温暖 + 稳重），如有冲突已询问用户是否确认

### A2. Brand Profile 专属必填

- [ ] **企业 Logo** 已上传（Brand Profile 的 Logo 是必填项）

### A3. Creator Profile 专属检查

- [ ] **Logo**：已上传 或 用户明确同意不做 Logo（用文字排版替代）
- [ ] 如果用户没有提供主色，AI 推荐的主色已告知用户并获确认

### A4. 可选项检查（两种 Profile 通用）

- [ ] 主色：有就直接用，没有按规则处理（Brand → Logo 提取，Creator → AI 推荐）
- [ ] Slogan（如有）：已记录，将写入 brand.md（仅 Brand Profile）或 hero-banner variantCss 预留空间
- [ ] 参考来源（如有）：官网 URL / 参考风格描述已记录，生成时会参考

---

## B. 品牌表达策略 / 概念表达策略完整性（★ 新增层）

### B1. Brand Profile 专属：品牌表达策略

- [ ] **品牌表达策略已生成**（不含 CSS，纯策略性描述）
- [ ] **Logo 表达策略** 已定义：频率、出现位置、禁止位置
- [ ] **Slogan 表达策略**（如有）：频率、出现位置、禁止位置
- [ ] **辅助图形表达策略**（如有）：每个图形的用法、引用的组件
- [ ] **品牌关键词表达策略**：每个关键词对应的设计表达
- [ ] **品牌元素重复利用策略**：品牌元素跨组件复用（如六边形→timeline/divider/tag）
- [ ] **品牌色使用策略**：primary/secondary/accent 分别用在哪些场景

### B2. Creator Profile 专属：创造视觉概念

- [ ] **视觉隐喻已选择**（如"像 IDE 界面"），与内容方向相关
- [ ] **设计概念声明已撰写**（metaphor + concept + conceptReason）
- [ ] 概念能让用户理解

### B3. 概念表达策略（Creator Profile）

- [ ] **概念元素已拆解**：把视觉概念拆解成具体的界面元素（如 IDE→Tab/Cursor/Line Number/...）
- [ ] **概念元素→组件映射已完成**：每个元素映射到对应组件，附原因
- [ ] **概念元素→装饰图形已定义**（如有）

### B4. 品牌元素→组件表达（Brand Profile）

- [ ] **Logo 形状→组件映射已完成**：形状特征决定哪些组件使用该造型
- [ ] **品牌色→组件应用已完成**：primary/secondary 影响哪些组件
- [ ] **辅助图形→组件装饰已完成**（如有）
- [ ] **Slogan→组件关联已完成**（如有）

## C. 约束层检查（Constraint Layer）

- [ ] 已对照 [spec/constraint-layer.md](../spec/constraint-layer.md) 检查 Design Blueprint
- [ ] 无伪元素设计（::before/::after 等）
- [ ] 无结构伪类设计（:first-child/:nth-child 等）
- [ ] 无动画/过渡设计（@keyframes/animation/transition）
- [ ] 无禁止定位设计（position:fixed/sticky）
- [ ] 无滤镜/混合设计（backdrop-filter/filter/mix-blend-mode）
- [ ] 无外部资源引用设计（url(http://...)）
- [ ] 组件名全部来自 LEGAL_COMPONENTS（35 个）
- [ ] layout.tone 合法值（warm/minimal/elegant/rational/serious/modern/playful）
- [ ] CSS 变量名无 --wemd-color-xxx 等错误写法
- [ ] Logo 使用频率在策略定义范围内
- [ ] 装饰元素不超过 3 个
- [ ] 所有装饰基于同一几何语言

## D. 应用层检查（Application Layer）

- [ ] 已对照 [spec/application-layer.md](../spec/application-layer.md) 选择实现方案
- [ ] 方案 A-E 选择合理（简单图形→A, 品牌资源→D, 纯色效果→E）
- [ ] 素材工作区已检查复用（workspace/assets/ 目录）
- [ ] 新生成素材已保存到工作区
- [ ] 跨组件复用的品牌资源已注册到 manifest.assets
- [ ] **组件 HTML 中装饰元素使用物理 DOM 元素**（`<span class="wemd-xxx-deco">`），无伪元素替代
- [ ] variantCss 选择器格式正确（`.wemd-xxx[data-variant="yyy"]` 或 `.wemd-xxx[data-variant="yyy"] .wemd-xxx-deco`）
- [ ] variantCss 无禁止项（`::before`/`::after`、结构伪类、外链、动画、`fixed` 等）
- [ ] CSS 变量引用正确（--wemd-xxx 格式，无 --wemd-color-xxx 等错误）
- [ ] 资源引用使用 var(--wemd-asset-xxx) 或 data URL，无直接 url(assets/...)

## E. 设计决策是否与关键词对齐

根据 `SKILL.md` 第六步「建立视觉语言」映射表对照：

- [ ] `layout.tone`（2 个值）符合关键词组合特征
- [ ] `layout.density` 符合关键词特征
- [ ] `primary` 主色：
  - Brand Profile → 和用户填写 / Logo 提取一致
  - Creator Profile → 和用户填写 / AI 推荐一致
- [ ] `primaryDark` ≈ primary 暗化 15~25%
- [ ] `primaryLight` ≈ primary 白化 80~90%
- [ ] `secondary` 符合关键词特征（科技→蓝、温暖→橙、文艺→灰绿、高端→灰…）
- [ ] `accent` 和主色有合理对比（冷主色配暖 accent，暖主色配冷 accent）
- [ ] fontFamily 符合关键词特征（衬线/无衬线、圆润/严肃…）
- [ ] fontSize 符合 density（low=17px / medium=16px / high=15px）
- [ ] 写了 variantCss 的组件是「关键词优先定制组件」表里的（4~6 个，不要太多）
- [ ] preferredComponents 里 **所有带 variantCss 的组件** 都用了 `{name, reason}` 对象格式，`reason` ≤50 字

---

## F. manifest 结构合规（Compiler 层会再次校验，这里提前过一遍）

### 检查项 1：sdkVersion

- [ ] `sdkVersion` 字段存在且值为 `"1.0.0"`

### 检查项 2：meta

- [ ] `meta.id` 非空，格式：
  - Brand Profile：`{企业简称}-{关键词缩写}`
  - Creator Profile：`{公众号简称}-{关键词缩写}`
- [ ] `meta.name` 非空（名称 + 风格，如「云帆科技·专业科技风」或「AI效率实验室·极简专业风」）
- [ ] `meta.description` 非空（一句话：定位摘要 + 关键词）
- [ ] `meta.keywords` 数组中包含风格关键词（3~5 个）+ 行业/内容方向词
- [ ] `meta.version` 为 `"1.0.0"`

### 检查项 3：tokens.color（14 个字段）

- [ ] 全部 14 个颜色字段都存在：primary, primaryDark, primaryLight, secondary, accent, background, bgSoft, bgCard, bgMuted, textStrong, textNormal, textSoft, border, borderSoft
- [ ] 每个颜色值都是合法 CSS 颜色（hex/rgb/rgba/hsl）
- [ ] textStrong 对 background 的对比度 ≥ 4.5:1（WCAG AA）
- [ ] bgCard 对 textStrong 的对比度 ≥ 4.5:1
- [ ] bgSoft 和 background 有肉眼可区分（但不刺眼）的差异

### 检查项 4：tokens.typography

- [ ] `fontFamily` 非空
- [ ] `fontSize` 带单位（如 `"16px"`）
- [ ] `lineHeight` 非空（1.6~1.9 之间比较合理）
- [ ] `letterSpacing` 是数字
- [ ] `heading.h1 ~ h4` 全部存在，各有 5 个必填字段（fontSize/color/marginTop/marginBottom/fontWeight）
- [ ] 字号层级：h1 > h2 > h3 > h4（严格递减）
- [ ] `codeFontFamily` 非空

### 检查项 5：tokens 其他

- [ ] `spacing.pagePadding`、`spacing.paragraphMargin` 都是数字
- [ ] `border.radius` 是数字
- [ ] `shadow.enabled` 是布尔值
- [ ] `shadow.value` 非空字符串（即使 `enabled=false` 也要填 `"none"`）

### 检查项 6：components

- [ ] 每个 key 都在 35 个合法组件列表中（见 `spec/component-registry.md`）
- [ ] 每个组件配置的 `enabled` 是布尔值
- [ ] 如果声明了 `variant`，一定同时提供了 `variantCss`（AI 主题不依赖预设）
- [ ] `variantCss` 选择器至少有一个 `.wemd-xxx[data-variant="yyy"]` 格式的选择器
- [ ] `variantCss` 中**没有**伪元素（`::before` / `::after` 等）
- [ ] `variantCss` 中**没有**结构伪类（`:first-child` / `:nth-child()` 等）
- [ ] `variantCss` 中**没有**外链 `url(http://...)`
- [ ] `variantCss` 中**没有** `<style>` / `<script>` 标签
- [ ] `variantCss` 中**没有** `@keyframes` / `animation:` / `backdrop-filter:` / `filter:` / `position:fixed` / `position:sticky`
- [ ] `variantCss` 中引用的 CSS 变量都是 `--wemd-xxx` 格式，且在 `spec/theme-package-spec.md` 变量表中存在
- [ ] 如果有 `overrides`，值是 `Record<string, string>`（如 `{"font-weight": "700"}`）

### 检查项 7：layout

- [ ] `preferredComponents` 是数组，每项要么是字符串（合法组件名），要么是 `{name, reason?}` 对象
- [ ] 对象格式的 `reason` 不超过 50 字
- [ ] `density` 是 `"low"` / `"medium"` / `"high"` 之一
- [ ] `tone` 是非空数组（2 个值，符合关键词映射）

### 检查项 8：assets（可选）

- [ ] 如果 `assets.images` 存在，每项都有 `key`（非空）和 `src`（以 `"data:"` 或 `"assets/"` 开头）
- [ ] Logo 图片若内嵌，单个 base64 data URL 不超过 150KB（建议用 SVG 或压缩后的 PNG）
- [ ] Creator Profile 无 Logo 时，assets 不含图片

### 检查项 9：未知字段

- [ ] 顶层没有 `sdkVersion`/`meta`/`tokens`/`components`/`layout`/`assets`/`codeTheme` 之外的字段

---

## G. brand.md（仅 Brand Profile）

> Creator Profile **跳过此节** — 不生成 brand.md。

- [ ] 结构有 4 节：品牌语气、排版偏好、Slogan（如有）、品牌关键词
- [ ] 品牌语气是中文，2~4 句，不夸张
- [ ] 排版偏好具体提到 2~4 个组件的使用场景
- [ ] Slogan（如有）和用户填写完全一致，不添加不省略
- [ ] 品牌关键词和 manifest.meta.keywords 一致

---

## H. ZIP 输出结构（.wemd-theme）

压缩包内文件结构正确：

- [ ] 根目录有 `manifest.json`
- [ ] `brand.md`（如有）和 `manifest.json` 同级，不在 styles/ 或 assets/ 下
- [ ] Creator Profile 的 ZIP 中**不含** brand.md
- [ ] 没有 `__MACOSX` / `.DS_Store` 等垃圾文件

---

## 特殊提醒

### Brand Profile 专属

- **企业信息对齐**：生成完成后，再看一眼企业简介、关键词、Slogan 是否真的在视觉上体现了
- **Slogan 占位**：如果企业有 Slogan，hero-banner 和 end-card 的 variantCss 空间一定要够
- **Logo 适配**：如果企业 Logo 是深色/浅色，对应背景色一定要提供足够对比度
- **不要过度装饰**：企业主题克制专业 > 花哨创意

### Creator Profile 专属

- **无 Logo 处理**：创作者没有 Logo 时，hero-banner 用大字号文字排版作为视觉焦点
- **内容方向体现**：内容方向（如 AI/情感/摄影）应在组件选择和排版风格上有所体现
- **个人风格自由度**：创作者主题可以比企业主题更大胆，允许非常规配色和排版
- **参考风格尊重**：如果创作者提了参考（如"喜欢 Apple 官网"），生成的主题应明显体现该风格特征
