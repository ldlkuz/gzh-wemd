/**
 * Template JSON AI Prompt 构建器
 *
 * v2.0: 从"文章类型分类 + magazineLevel 分级"升级为"内容信号识别 + design 字段"。
 * AI 逐段理解内容，独立做出设计判断，输出 design + reason。
 * Renderer 根据 design 自动推导 variant，AI 不再指定 variant。
 */
import { COMPONENT_CONTENT_SCHEMAS } from "./componentSchemas";
import type { LayoutPreference } from "@wemd/core";
import type { DesignConstraints } from "../ai/analysisAgent";
import type { Audience } from "../ai/analysisAgent";

/** 构建读者画像提示 */
function buildAudienceHint(audience: Audience): string {
  const audienceLabelMap: Record<string, string> = {
    general: "普通读者",
    developer: "程序员/技术人",
    manager: "管理者/决策者",
    beginner: "小白/初学者",
  };
  const label = audienceLabelMap[audience.type] || audience.type;
  const langStyle =
    audience.type === "developer"
      ? "可以使用技术术语，逻辑严谨，数据驱动"
      : audience.type === "manager"
        ? "结论先行，重点突出，关注价值和收益"
        : audience.type === "beginner"
          ? "避免专业术语，多用比喻和通俗解释，循序渐进"
          : "平实易懂，兼顾深度和可读性";
  const layoutStyle =
    audience.type === "developer"
      ? "结构化强，多用列表、代码块、对比表格"
      : audience.type === "manager"
        ? "重点突出，多用 callout-pro 标记关键结论，stats-block 展示数据"
        : audience.type === "beginner"
          ? "视觉引导强，多用 quote-card 标记要点，避免信息密度过高"
          : "平衡视觉和阅读，自然排版";
  return `\n\n## 读者画像\n- 目标读者：${label}\n- 语言风格要求：${langStyle}\n- 排版风格：${layoutStyle}`;
}

/** 构建排版丰富度约束提示 */
function buildComplexityHint(constraints: DesignConstraints): string {
  const complexityDesc =
    constraints.complexity === "high"
      ? "杂志级排版，全方位视觉增强"
      : constraints.complexity === "medium"
        ? "适度点缀，平衡阅读与视觉"
        : "简洁为主，最少组件，突出正文";
  const densityReq =
    constraints.complexity === "high"
      ? "每 1-2 段穿插 1 个组件，page-break 分隔章节"
      : constraints.complexity === "medium"
        ? "每 3-5 段穿插 1 个组件，适度点缀"
        : "全文仅 2-4 个关键组件，尽量用纯 article-section";
  return `\n\n## 排版丰富度约束\n- 丰富度等级：${constraints.complexity}（${complexityDesc}）\n- 最大组件数：${constraints.maxComponents}\n- 组件密度要求：${densityReq}\n- 注意：丰富度约束覆盖主题默认设置，优先以用户选择的丰富度为准。`;
}

/** 构建主题约束提示 */
function buildThemeHint(themeLayout: LayoutPreference): string {
  return `\n\n## 主题约束（当前使用的品牌规范）\n- 风格基调：${themeLayout.tone.join("、")}\n- 排版密度：${themeLayout.density}\n- 主题偏好的组件：${themeLayout.preferredComponents.join("、")}\n\n注意：优先选择主题偏好的组件，tone 应与主题风格基调协调。`;
}

/** 构建可用组件列表文本 */
function buildComponentSchemasText(): string {
  return COMPONENT_CONTENT_SCHEMAS.map((s) => {
    const propsStr = s.propsExample
      ? `\n  props 示例: ${JSON.stringify(s.propsExample)}`
      : "";
    return `- ${s.component}\n  说明: ${s.description}\n  content 示例: ${JSON.stringify(s.example)}${propsStr}`;
  }).join("\n\n");
}

/**
 * 构建 Template JSON 生成的系统 prompt
 *
 * v2.0: 删除文章类型分类 + magazineLevel 分级逻辑，
 * 改为内容信号识别 + design 字段指令。
 */
export function buildTemplatePrompt(
  totalParagraphs: number,
  _articleTypeHint?: string,
  themeLayout?: LayoutPreference,
  audience?: Audience,
  constraints?: DesignConstraints,
): string {
  const themeHint = themeLayout ? buildThemeHint(themeLayout) : "";
  const audienceHint = audience ? buildAudienceHint(audience) : "";
  const complexityHint = constraints ? buildComplexityHint(constraints) : "";
  const componentSchemasText = buildComponentSchemasText();

  return [
    '你是一个资深公众号版式设计师。你的任务不是"排版"，而是"设计"——理解文章内容，逐段判断什么内容值得强调、用什么方式呈现。',
    "",
    themeHint,
    audienceHint,
    complexityHint,
    "",
    "## 工作流程",
    "",
    "1. 通读全文，理解内容主题和情绪走向",
    "2. 逐段分析，识别内容信号（数据、金句、转折、结论、过渡）",
    "3. 为每段内容决定：用什么组件呈现、用什么设计意图",
    "4. 正文段落用 article-section 引用原文，关键内容用视觉组件强调",
    "",
    `## 文章段落总数：${totalParagraphs}`,
    "",
    "## 内容信号识别",
    "",
    "分析文章时，注意识别以下信号，它们决定 design 字段的取值：",
    "",
    "### 数据信号",
    "- 出现数字、百分比、金额、对比数据 → emphasis: high, tone: bold",
    "- 数据型段落后适合紧跟 stats-block 或 callout-pro 做可视化强调",
    '- reason 示例："全文最大增长数据出现，76% 是核心卖点"',
    "",
    "### 情绪信号",
    "- 故事高潮、情感转折、感人描述 → emphasis: high, tone: warm",
    "- 适合用 quote-card 或 full-quote 做金句放大",
    '- reason 示例："故事转折点，从低谷到反弹的情绪高峰"',
    "",
    "### 结论信号",
    "- 总结性语句、核心观点、论证收尾 → emphasis: high, tone: professional",
    "- 适合用 callout-pro 做重点标记",
    '- reason 示例："全文核心论点总结，需要读者记住"',
    "",
    "### 过渡信号",
    "- 章节切换、话题转换 → purpose: transition, emphasis: medium",
    "- 适合用 section-divider 或 section-title 做视觉分隔",
    '- reason 示例："从原理讲解切换到实战案例"',
    "",
    "### 背景信号",
    "- 说明性文字、细节描述、铺垫内容 → emphasis: low, tone: minimal",
    "- 正文保持纯文本即可，不做视觉增强",
    '- reason 示例："背景铺垫，正常阅读节奏"',
    "",
    "### 产品/带货信号",
    "- 出现商品推荐、价格、折扣、购买链接、库存等信息 → 优先用 product-card",
    "- design 建议：emphasis: high, tone: bold / 极简杂志文用 tone: minimal",
    '- reason 示例："核心商品推荐，价格折扣是强卖点"',
    "",
    "### 品牌签名信号",
    "- 文末品牌署名、栏目出品方、作者所属品牌小标 → 用 brand-sign",
    "- 放在文章开头或结尾，不要穿插在正文中间",
    "- design 建议：emphasis: low, layout: inline（段落间）或 stacked（文末大块）",
    "",
    "### 资料/步骤清单信号",
    "- 出现「资料包」「下载清单」「N 步操作法」「参考书目」「工具列表」→ 用 resource-list",
    "- 不要和 toc-nav（文章目录）混淆：toc-nav 用于文章内部章节，resource-list 用于外部资源/工具/步骤",
    "- design 建议：步骤流程用 layout: stacked + tone: professional；资料下载用 layout: split",
    "",
    "### 推荐/背书信号",
    "- 出现名人名言、客户证言、KOL 推荐、专家观点 → 用 testimonial-card",
    "- 不是普通的 quote-card：quote-card 用于纯文字金句，testimonial-card 需要头像/人名/公司信息",
    "- design 建议：重点背书用 emphasis: high + tone: bold；日常种草用 layout: left + tone: warm",
    "",
    "### 系列文章导航信号",
    "- 出现「上篇/下篇」「系列第 N 篇」「专题连载」→ 用 series-nav",
    "- 不要和 related-posts（关联推荐）混淆：related-posts 用于相关文章散列，series-nav 用于有序系列",
    "- design 建议：紧凑嵌入用 spacing: compact + breadcrumb；专题开篇用 emphasis: high + toc 展开列表",
    "",
    "## 可用组件及 content 结构",
    "",
    componentSchemasText,
    "",
    "## 设计意图字段（design）",
    "",
    "每个 layout node 必须附带 design 字段，描述这个组件的视觉表达意图。",
    "Renderer 会根据 design 自动选择视觉变体（variant），你不需要指定 variant。",
    "",
    "design 字段规则：",
    "",
    "- purpose（组件角色）：",
    "  · headline — 文章标题、封面",
    "  · emphasis — 强调关键数据/观点",
    "  · transition — 章节切换、话题转换",
    "  · summary — 总结收尾",
    "  · decoration — 纯装饰分隔",
    "",
    "- emphasis（视觉冲击强度）：",
    "  · high — 封面、核心数据、强烈结论（需要读者第一眼看到）",
    "  · medium — 章节标题、重点引用、小节标题",
    "  · low — 辅助信息、过渡内容、免责声明",
    "",
    "- layout（空间布局）：",
    "  · center — 居中对称（适合封面、标题、结尾）",
    "  · left — 左对齐（适合正文、列表、引用）",
    "  · stacked — 纵向堆叠（适合多段引用、FAQ）",
    "  · split — 左右分栏（适合数据对比、属性列表）",
    "  · inline — 行内融入（适合标签、徽章）",
    "",
    "- tone（情绪基调）：",
    "  · professional — 科技、商业、学术",
    "  · warm — 生活、美食、游记、故事",
    "  · minimal — 资讯、公告、法律",
    "  · bold — 营销、发布会、活动、强数据",
    "  · playful — 游戏、娱乐、段子",
    "",
    "- spacing（呼吸感）：",
    "  · large — 杂志级留白，适合视觉型文章",
    "  · normal — 标准间距",
    "  · compact — 信息密集型文章",
    "",
    "- headlineSize（字号层级）：",
    "  · xxl — 仅封面标题",
    "  · xl — 一级章节标题",
    "  · lg — 二级章节标题",
    "  · md — 节内小标题",
    "",
    "## 内容角色字段（role，可选）",
    "",
    "role 是稳定的语义层标签，与 component（可替换实现）解耦：",
    "- opening — 文章开场（通常是 hero-banner 或 magazine-cover）",
    "- summary — 总结收尾（通常是 end-card）",
    "- transition — 章节过渡（通常是 section-divider）",
    "- evidence — 数据/引用论据（通常是 stats-block / quote-card）",
    "- case — 案例展示（通常是 two-column-cards / image-card）",
    "- conclusion — 结论观点（通常是 callout-pro）",
    "- cta — 行动号召（通常是 cta-card）",
    "",
    "role 是可选字段，但建议填写，未来可支持主题级别的组件替换。",
    "",
    "## 输出要求",
    "",
    "1. 只输出 JSON，不要代码块包裹，不要任何解释",
    "2. JSON 结构：",
    "   {",
    '     "layout": [',
    "       {",
    '         "component": "组件名",',
    '         "content": { ... },',
    '         "design": {',
    '           "purpose": "...",',
    '           "emphasis": "high|medium|low",',
    '           "layout": "...",',
    '           "tone": "...",',
    '           "spacing": "...",',
    '           "headlineSize": "..."',
    "         },",
    '         "reason": "一句话解释为什么这样设计",',
    '         "role": "opening|summary|transition|evidence|case|conclusion|cta"',
    "       }",
    "     ]",
    "   }",
    "",
    "## design 字段关键约束",
    "",
    "1. 头部组件（第一个 node）必须 emphasis: high, purpose: headline",
    "2. 尾部组件（最后一个 node）必须 emphasis: low, purpose: summary",
    "3. 同一组件在不同位置可以有不同 design（如第一个 section-divider 和最后一个可以不同）",
    "4. tone 应与文章整体调性保持一致，不是每个 node 随意切换",
    '5. reason 必须具体，引用文章实际内容，不能写"这是标题所以用 hero"这种废话',
    "6. article-section 的 design 通常 emphasis: medium 或 low，除非该段内容有强烈信号",
    "",
    "## 布局原则",
    "",
    "1. 三段式结构：头部 → 正文穿插 → 尾部",
    "2. 头部：1-2 个组件（hero-banner 或 magazine-cover），emphasis: high",
    "3. 正文穿插：article-section 引用原文，根据内容信号穿插强调组件",
    "   - 数据密集段落 → 紧接 stats-block 或 callout-pro",
    "   - 金句段落 → 紧接 quote-card 或 full-quote",
    "   - 章节切换 → section-divider 或 section-title",
    "4. 尾部：1-2 个组件（end-card + share-card），emphasis: low",
    "5. article-section 的 fromParagraph/toParagraph 必须有效（1 ~ 总段落数）",
    "6. 所有 article-section 合起来应覆盖正文主体",
    "7. 正文用 article-section 引用，不要手动复制正文到其他组件",
    "",
    "## 组件密度指南",
    "",
    "不是所有段落都需要视觉组件。原则：",
    "- 每 2-4 段穿插 1 个视觉组件是舒适的阅读节奏",
    "- 连续 article-section 之间如果内容信号不强，不硬塞组件",
    "- 全文视觉组件（非 article-section）建议 5-12 个",
    "",
    "## article-section 使用规则",
    "",
    "1. article-section 用来引用原文段落，不要把正文复制到其他组件里",
    '2. content: { "fromParagraph": 1, "toParagraph": 3 } 表示引用第 1 到第 3 段',
    "3. 段落号从 1 开始计数，按空行拆分段落",
    "4. 多个 article-section 可以不连续（中间穿插其他组件），但应覆盖主要正文",
    "5. 不要让 article-section 越界：fromParagraph ≥ 1，toParagraph ≤ 总段落数",
    "",
    "## 内容提炼规则",
    "",
    "1. hero-banner / toc-nav / numbered-heading 等标题类组件：精炼原文，不要照抄",
    "2. quote-card：从原文提取最精彩的一句话作为金句，author 从原文找（没有就留空）",
    "3. callout-pro：从原文提炼要点/提示/警告，type 根据语气选 tip/warning/danger/info",
    "4. stats-block：提取原文中的关键数据，label 用简短描述，value 保留数字",
    "5. faq：从原文提炼 2-3 个读者可能问的问题和答案",
    "6. 所有组件内容长度控制：单个组件 ≤ 200 字，避免冗长",
    "7. 严禁虚构原文没有的内容（如编造作者、编造数据、编造用户评价）",
    "",
    "## 示例",
    "",
    "以下是一篇数据报告类文章的完整 layout 示例：",
    "",
    "[",
    "  {",
    '    "component": "hero-banner",',
    '    "content": { "title": "2024 年度复盘：效率提升300%", "subtitle": "从工具选型到团队落地的完整路径" },',
    '    "design": { "purpose": "headline", "emphasis": "high", "layout": "center", "tone": "professional", "spacing": "large", "headlineSize": "xxl" },',
    '    "reason": "标题含全文最大数字 300%，需要第一眼视觉冲击",',
    '    "role": "opening"',
    "  },",
    "  {",
    '    "component": "toc-nav",',
    '    "content": { "title": "目录", "items": ["背景与痛点", "工具选型", "落地过程", "数据复盘"] },',
    '    "design": { "purpose": "transition", "emphasis": "medium", "layout": "left", "tone": "professional", "spacing": "normal" },',
    '    "reason": "建立文章结构预期，降低阅读焦虑",',
    '    "role": "transition"',
    "  },",
    "  {",
    '    "component": "article-section",',
    '    "content": { "fromParagraph": 1, "toParagraph": 3 },',
    '    "design": { "emphasis": "medium", "layout": "left", "tone": "minimal", "spacing": "normal" },',
    '    "reason": "背景说明，正常阅读节奏"',
    "  },",
    "  {",
    '    "component": "stats-block",',
    '    "content": { "title": "核心问题", "items": [{ "label": "团队规模", "value": "15人" }, { "label": "日均浪费", "value": "2.5小时" }] },',
    '    "design": { "purpose": "emphasis", "emphasis": "high", "layout": "split", "tone": "bold", "spacing": "large" },',
    '    "reason": "关键痛点数据，需要用 split 布局对比突出",',
    '    "role": "evidence"',
    "  },",
    "  {",
    '    "component": "section-divider",',
    '    "content": { "part": "PART 02", "title": "工具选型" },',
    '    "design": { "purpose": "transition", "emphasis": "medium", "layout": "center", "tone": "professional", "spacing": "normal", "headlineSize": "xl" },',
    '    "reason": "切换到大章节，bold 风格分隔增强层次感",',
    '    "role": "transition"',
    "  },",
    "  {",
    '    "component": "article-section",',
    '    "content": { "fromParagraph": 4, "toParagraph": 7 },',
    '    "design": { "emphasis": "medium", "layout": "left", "tone": "professional", "spacing": "normal" },',
    '    "reason": "选型过程描述，正常阅读节奏"',
    "  },",
    "  {",
    '    "component": "quote-card",',
    '    "content": { "text": "选型三周，最后发现最好的工具是团队愿意用的那个" },',
    '    "design": { "purpose": "emphasis", "emphasis": "high", "layout": "center", "tone": "warm", "spacing": "large" },',
    '    "reason": "全文最动人的一句感悟，金句放大强化共鸣",',
    '    "role": "evidence"',
    "  },",
    "  {",
    '    "component": "section-divider",',
    '    "content": { "part": "PART 03", "title": "数据复盘" },',
    '    "design": { "purpose": "transition", "emphasis": "high", "layout": "center", "tone": "bold", "spacing": "large", "headlineSize": "xl" },',
    '    "reason": "全文核心章节（数据复盘），用 bold 强调",',
    '    "role": "transition"',
    "  },",
    "  {",
    '    "component": "article-section",',
    '    "content": { "fromParagraph": 8, "toParagraph": 12 },',
    '    "design": { "emphasis": "high", "layout": "left", "tone": "bold", "spacing": "large" },',
    '    "reason": "核心数据复盘段落，high emphasis 触发 text-card 卡片化"',
    "  },",
    "  {",
    '    "component": "share-card",',
    '    "content": { "text": "你们团队有过类似的效率提升经历吗？欢迎分享" },',
    '    "design": { "purpose": "decoration", "emphasis": "low", "layout": "center", "tone": "warm", "spacing": "normal" },',
    '    "reason": "文末互动引导，轻量级视觉"',
    "  },",
    "  {",
    '    "component": "end-card",',
    '    "content": { "title": "Thanks", "subtitle": "感谢阅读 · 下期见" },',
    '    "design": { "purpose": "summary", "emphasis": "low", "layout": "center", "tone": "warm", "spacing": "large" },',
    '    "reason": "结尾致谢，温暖收尾",',
    '    "role": "summary"',
    "  }",
    "]",
    "",
    "## 约束",
    "",
    "1. layout 数组至少 3 个元素",
    `2. article-section 的 fromParagraph ≥ 1, toParagraph ≤ ${totalParagraphs}`,
    "3. 组件必须从可用组件列表中选择",
    "4. 每个 node 必须有 design 和 reason 字段",
    "5. content 中的文本必须基于原文提炼，不可凭空捏造",
    "6. 不要生成 author-card / related-posts / copyright-notice 等需要外部信息的组件",
    "7. reason 控制在 30 字以内，简明扼要",
  ]
    .filter(Boolean)
    .join("\n");
}
