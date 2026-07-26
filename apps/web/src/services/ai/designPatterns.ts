/**
 * 公众号版式设计模式库
 *
 * 基于专业排版方法论（层次化组件搭配）+ 竞品调研（模板驱动）预设。
 * AI 阶段1 识别文章类型 → 选对应配方 → 阶段2 在配方框架内填充内容。
 *
 * 7 种类型，对齐行业"七分类"共识（去掉 UGC 型，不需要版式设计）：
 * - tutorial  教程类（步骤化、有代码/操作）
 * - story     故事类（叙事、情感、人物）
 * - data      数据报告类（数据驱动、有图表）
 * - opinion   观点评论类（观点鲜明、有论证）
 * - list      清单合集类（书单/推荐/排行/合集）
 * - news      资讯通知类（活动通知/新闻稿/政策）
 * - product   产品营销类（软广/产品发布/推广）
 *
 * 每个配方按"头/中/尾"三段式 + 组件层次组织，保证搭配合理性。
 */

/** 单个组件槽位：配方中的一个位置 */
export interface ComponentSlot {
  /** 组件名（必须是 AVAILABLE_COMPONENTS 之一） */
  component: string;
  /** 是否必须填充 */
  required: boolean;
  /** 是否可重复（中段组件通常可重复） */
  repeatable: boolean;
  /** 内容提炼规则（指导 AI 阶段2 如何填充 body） */
  extractRule: string;
}

/** 设计模式：一种文章类型的版式配方 */
export interface DesignPattern {
  /** 类型标识 */
  type: string;
  /** 中文标签 */
  label: string;
  /** 什么时候用这个模式（给 AI 识别用） */
  whenToUse: string;
  /** 识别特征（关键词、结构特征） */
  signatures: string[];
  /** 头部组件槽位 */
  head: ComponentSlot[];
  /** 中段组件槽位（按文章实际内容填充，可重复） */
  body: ComponentSlot[];
  /** 尾部组件槽位 */
  tail: ComponentSlot[];
  /** 节奏说明（给 AI 理解整体动线） */
  rhythm: string;
}

/** 4 种设计模式库 */
export const DESIGN_PATTERNS: DesignPattern[] = [
  {
    type: "tutorial",
    label: "教程类",
    whenToUse:
      "文章教读者怎么做某事，有明确步骤、代码示例或操作流程。如技术教程、操作指南、使用说明。",
    signatures: [
      "【核心】教读者完成某事，有可操作步骤",
      "【强特征】含代码块（```）、命令行、或步骤序号（第一步/1.2.3.）",
      "【关键词】如何/怎么/教程/指南/步骤/操作/配置/安装",
      "【区分】不是 product：教程文末带产品介绍，主导仍是教程",
    ],
    rhythm:
      "开头建立预期（目录预览）→ 中段步骤清晰（序号+代码+提示）→ 结尾巩固行动（分享+推荐）",
    head: [
      {
        component: "follow-bar",
        required: false,
        repeatable: false,
        extractRule: "引导文字 + '关注'按钮文字，简洁一句",
      },
      {
        component: "toc-nav",
        required: true,
        repeatable: false,
        extractRule:
          "从文章提取所有章节标题，组织成有序列表。第一段写'目录'，列表项为各章节名",
      },
    ],
    body: [
      {
        component: "numbered-heading",
        required: true,
        repeatable: true,
        extractRule:
          "每个主要章节用此组件。第一段为序号（01/02/03），第二段为章节标题（精炼版，不照抄原文）",
      },
      {
        component: "code-frame",
        required: false,
        repeatable: true,
        extractRule:
          "包裹文章中的代码块。props 设 title 为代码用途说明，body 保留原代码 + 加简短标题段",
      },
      {
        component: "callout-pro",
        required: true,
        repeatable: true,
        extractRule:
          "标记注意事项/坑点/技巧。type 选 tip/warning/danger，body 第一段为标题，第二段为具体说明",
      },
    ],
    tail: [
      {
        component: "share-card",
        required: true,
        repeatable: false,
        extractRule: "引导文字 + 三个按钮（分享/点赞/在看）",
      },
    ],
  },
  {
    type: "story",
    label: "故事类",
    whenToUse:
      "叙事性文章，有人物、情节、情感转折。如个人经历、创业故事、人物专访、案例故事。",
    signatures: [
      "【核心】叙事性内容，有人物+情节+情感",
      "【强特征】第一人称（我/我们）或具体人物视角，有时间线或转折点",
      "【关键词】当时/后来/突然/那一刻/记得/曾经/经历",
      "【区分】不是 opinion：故事重叙事不重论证，即便有观点也是经历自然得出",
    ],
    rhythm:
      "开头氛围营造（头图）→ 中段情感起伏（金句+图文）→ 结尾共鸣（作者+分享）",
    head: [
      {
        component: "hero-banner",
        required: true,
        repeatable: false,
        extractRule:
          "第一段为文章主标题（可精炼），第二段为氛围副标题（点明故事内核）",
      },
    ],
    body: [
      {
        component: "quote-card",
        required: true,
        repeatable: true,
        extractRule:
          "提取故事中的关键金句（人物说的话、感悟、转折点台词）。props 设 author 为说话人",
      },
      {
        component: "section-title",
        required: false,
        repeatable: true,
        extractRule: "故事章节切换处，精炼为短标题（如'转折''低谷''破局'）",
      },
    ],
    tail: [
      {
        component: "share-card",
        required: true,
        repeatable: false,
        extractRule: "引导文字（如'如果这个故事触动了你'）+ 三按钮",
      },
    ],
  },
  {
    type: "data",
    label: "数据报告类",
    whenToUse:
      "以数据论证为主，有统计数字、对比、结论。如行业报告、实验数据、复盘分析、市场调研。",
    signatures: [
      "【核心】以数据论证为主，数字是论据核心",
      "【强特征】含百分比/金额/增长率，有对比表格或统计图表",
      "【关键词】数据/报告/调研/占比/同比增长/环比/达到/突破",
      "【区分】不是 opinion：数据报告用数字说话，观点文用人话说理",
    ],
    rhythm:
      "开头总览（头图+目录）→ 中段数据论证（序号+数据块+表格+结论）→ 结尾结论+来源声明",
    head: [
      {
        component: "hero-banner",
        required: true,
        repeatable: false,
        extractRule: "报告主标题 + 副标题（如'2024 年度数据复盘'）",
      },
      {
        component: "toc-nav",
        required: false,
        repeatable: false,
        extractRule: "提取报告章节，组织成目录列表",
      },
    ],
    body: [
      {
        component: "numbered-heading",
        required: true,
        repeatable: true,
        extractRule: "每个数据章节用此组件，序号 + 章节标题",
      },
      {
        component: "stats-block",
        required: true,
        repeatable: true,
        extractRule:
          "提取关键数据。第一段为小标题（如'核心指标'），列表项为'- 指标名 **数值**'格式",
      },
      {
        component: "styled-table",
        required: false,
        repeatable: true,
        extractRule:
          "文章中的对比表格用此组件。第一段为表格标题，后接 markdown 表格（保留原数据）",
      },
      {
        component: "callout-pro",
        required: true,
        repeatable: true,
        extractRule:
          "标记关键结论/洞察。type 选 tip 或 info，body 为结论标题 + 简要说明",
      },
    ],
    tail: [
      {
        component: "share-card",
        required: true,
        repeatable: false,
        extractRule: "引导文字（如'这份数据对你有帮助？'）+ 三按钮",
      },
    ],
  },
  {
    type: "opinion",
    label: "观点评论类",
    whenToUse:
      "表达个人观点或立场，有论证过程。如行业评论、产品测评、思考总结、热点解读。",
    signatures: [
      "【核心】表达明确观点/立场，有论证过程",
      "【强特征】有论点+论据（举例/引用/对比），非纯叙事",
      "【关键词】我认为/我觉得/本质是/关键在于/其实/真相是/换个角度",
      "【区分】不是 story：观点文重说理不重叙事，即便举例也是为论证服务",
      "【区分】不是 data：观点文数据是辅助，论证才是核心",
    ],
    rhythm:
      "开头亮观点（金句前置）→ 中段论证（小标题+引用+强调）→ 结尾号召（分享+推荐）",
    head: [
      {
        component: "quote-card",
        required: true,
        repeatable: false,
        extractRule:
          "提取文章核心观点作为开篇金句。props 设 author 为作者名（如有）",
      },
    ],
    body: [
      {
        component: "section-title",
        required: true,
        repeatable: true,
        extractRule: "每个论点用此组件，精炼为短标题（如'论点一：xxx'）",
      },
      {
        component: "quote-card",
        required: false,
        repeatable: true,
        extractRule: "引用权威观点或数据支撑论点",
      },
      {
        component: "callout-pro",
        required: true,
        repeatable: true,
        extractRule:
          "强调核心论点。type 选 tip 或 warning，body 为论点标题 + 简要展开",
      },
      {
        component: "stats-block",
        required: false,
        repeatable: true,
        extractRule: "如有数据支撑论点，提取为数据块",
      },
    ],
    tail: [
      {
        component: "share-card",
        required: true,
        repeatable: false,
        extractRule: "引导文字（如'认同这个观点？'）+ 三按钮",
      },
    ],
  },
  {
    type: "list",
    label: "清单合集类",
    whenToUse:
      "整合一类主题的内容清单，无明显主观判断。如书单推荐、电影清单、工具合集、排行榜单、家居百货推荐等。",
    signatures: [
      "【核心】并列罗列多项同类内容，无明显论证",
      "【强特征】有 3 个以上并列项（书/电影/工具/地点等），每项有简短点评",
      "【关键词】推荐/清单/合集/榜单/书单/片单/必备/精选",
      "【区分】不是 product：清单合集客观罗列，产品营销有明确推广目标",
      "【区分】不是 tutorial：清单合集不教操作，只罗列点评",
    ],
    rhythm:
      "开头主题预告（头图+目录）→ 中段逐项展示（序号+图片+点评）→ 结尾分享+推荐",
    head: [
      {
        component: "hero-banner",
        required: true,
        repeatable: false,
        extractRule: "合集主题标题 + 副标题（如'2024 年度好书推荐'）",
      },
      {
        component: "toc-nav",
        required: false,
        repeatable: false,
        extractRule: "提取清单项作为目录列表",
      },
    ],
    body: [
      {
        component: "numbered-heading",
        required: true,
        repeatable: true,
        extractRule:
          "每个清单项用此组件。第一段为序号（01/02/03），第二段为项目名（精炼版）",
      },
      {
        component: "quote-card",
        required: false,
        repeatable: true,
        extractRule:
          "对清单项的金句点评或项目中的亮点引用。props 设 author 为出处（如有）",
      },
      {
        component: "callout-pro",
        required: false,
        repeatable: true,
        extractRule:
          "标记清单项的特殊亮点（如'必读''避坑'）。type 选 tip 或 warning",
      },
    ],
    tail: [
      {
        component: "tag-label",
        required: true,
        repeatable: false,
        extractRule: "提取清单关键词作为标签（如'读书 书单 2024'）",
      },
      {
        component: "share-card",
        required: true,
        repeatable: false,
        extractRule: "引导文字（如'收藏这份清单'）+ 三按钮",
      },
    ],
  },
  {
    type: "news",
    label: "资讯通知类",
    whenToUse:
      "向受众传达信息，无明显论证或叙事。如活动通知、新闻稿、政策传达、会议纪要、发布公告。",
    signatures: [
      "【核心】传达信息，无情感色彩无论证",
      "【强特征】有明确的时间/地点/参与方等要素，格式较正式",
      "【关键词】通知/公告/活动/时间/地点/报名/主办/承办/举办",
      "【区分】不是 product：资讯通知传达事实，产品营销促进转化",
    ],
    rhythm:
      "开头主题+重点（头图+提示）→ 中段信息分块（小标题+表格）→ 结尾来源+分享",
    head: [
      {
        component: "hero-banner",
        required: true,
        repeatable: false,
        extractRule: "通知/活动主题标题 + 副标题（如'2024 年度大会通知'）",
      },
      {
        component: "callout-pro",
        required: true,
        repeatable: false,
        extractRule:
          "重点信息前置提示。type 选 info 或 warning，body 为'重点提示'标题 + 关键信息（时间/地点/截止日期）",
      },
    ],
    body: [
      {
        component: "section-title",
        required: true,
        repeatable: true,
        extractRule: "信息分块小标题（如'活动时间''参与方式''注意事项'）",
      },
      {
        component: "styled-table",
        required: false,
        repeatable: true,
        extractRule:
          "有结构化数据（日程表/规格表/费用表）时用此组件。第一段为表格标题，后接 markdown 表格",
      },
      {
        component: "callout-pro",
        required: false,
        repeatable: true,
        extractRule: "标记注意事项/报名要求。type 选 warning 或 info",
      },
    ],
    tail: [
      {
        component: "share-card",
        required: true,
        repeatable: false,
        extractRule: "引导文字（如'转发给需要的人'）+ 三按钮",
      },
    ],
  },
  {
    type: "product",
    label: "产品营销类",
    whenToUse:
      "推广产品或服务，促进转化。如产品发布、软文推广、功能介绍、促销活动、课程销售。",
    signatures: [
      "【核心】推广产品/服务，有转化引导",
      "【强特征】有产品介绍+卖点+CTA（购买/报名/订阅）",
      "【关键词】产品/功能/优惠/报名/购买/限时/立即/扫码",
      "【区分】不是 tutorial：产品营销介绍功能为卖货，教程教操作为赋能",
      "【区分】不是 list：产品营销聚焦单一产品，清单合集罗列多项",
    ],
    rhythm:
      "开头吸引注意（头图）→ 中段卖点论证（小标题+数据+图文+评价）→ 结尾行动号召",
    head: [
      {
        component: "hero-banner",
        required: true,
        repeatable: false,
        extractRule: "产品主标题 + 卖点副标题（如'XXX 正式发布 · 限时 8 折'）",
      },
    ],
    body: [
      {
        component: "section-title",
        required: true,
        repeatable: true,
        extractRule: "每个卖点用此组件，精炼为短标题（如'核心卖点一：XXX'）",
      },
      {
        component: "stats-block",
        required: true,
        repeatable: true,
        extractRule:
          "提取产品数据卖点。第一段为小标题（如'核心数据'），列表项为'- 指标 **数值**'格式",
      },
      {
        component: "quote-card",
        required: false,
        repeatable: true,
        extractRule:
          "仅当文章原文含真实用户评价时提取。props 设 author 为原文提及的用户名/角色，不可虚构",
      },
      {
        component: "callout-pro",
        required: false,
        repeatable: true,
        extractRule:
          "标记限时优惠/特殊权益。type 选 warning 或 tip，body 为优惠标题 + 说明",
      },
    ],
    tail: [
      {
        component: "cta-card",
        required: true,
        repeatable: false,
        extractRule:
          "行动号召。第一段为号召语，第二段为优惠说明，第三段为按钮文字（如'立即报名'）",
      },
    ],
  },
];

/** 获取所有可用类型标签（用于 AI 阶段1 prompt） */
export const PATTERN_LABELS = DESIGN_PATTERNS.map((p) => ({
  type: p.type,
  label: p.label,
  whenToUse: p.whenToUse,
  signatures: p.signatures,
}));

/** 按类型获取设计模式 */
export function getPattern(type: string): DesignPattern | undefined {
  return DESIGN_PATTERNS.find((p) => p.type === type);
}
