/**
 * 组件 content schema 说明
 *
 * 用于指导 AI 生成 Template JSON 时，各组件的 content 字段结构。
 * 与 componentRenderers.ts 中的渲染逻辑一一对应。
 */

export interface ComponentContentSchema {
  /** 组件名 */
  component: string;
  /** content 字段类型说明（给 AI 看） */
  description: string;
  /** content JSON 示例（给 AI 看具体结构） */
  example: Record<string, unknown>;
  /** props 示例（可选，常用 props） */
  propsExample?: Record<string, string | number | boolean>;
}

export const COMPONENT_CONTENT_SCHEMAS: ComponentContentSchema[] = [
  {
    component: "hero-banner",
    description: "顶部头图 banner，展示标题和副标题",
    example: {
      title: "文章主标题",
      subtitle: "副标题或摘要",
      tag: "可选标签",
    },
  },
  {
    component: "toc-nav",
    description: "目录导航，列出文章主要章节",
    example: {
      title: "目录",
      items: ["第一章", "第二章", "第三章"],
    },
  },
  {
    component: "numbered-heading",
    description: "带序号的章节标题",
    propsExample: { index: "01" },
    example: {
      title: "章节标题",
    },
  },
  {
    component: "section-title",
    description: "段落小标题，用于分节",
    propsExample: { variant: "default" },
    example: {
      title: "小标题文字",
    },
  },
  {
    component: "quote-card",
    description: "金句/引言卡片，突出显示引用内容",
    propsExample: { author: "作者名" },
    example: {
      text: "金句内容",
    },
  },
  {
    component: "callout-pro",
    description: "提示/警告/信息框，用于突出重要内容",
    propsExample: { type: "tip" },
    example: {
      title: "提示标题",
      body: "提示内容说明",
    },
  },
  {
    component: "stats-block",
    description: "数据统计块，展示关键指标",
    example: {
      title: "核心数据",
      items: [
        { label: "指标一", value: "100" },
        { label: "指标二", value: "200" },
      ],
    },
  },
  {
    component: "faq",
    description: "常见问题解答，折叠展开式",
    example: {
      items: [
        { question: "问题一", answer: "回答内容" },
        { question: "问题二", answer: "回答内容" },
      ],
    },
  },
  {
    component: "share-card",
    description: "分享引导卡片，文末引导互动",
    example: {
      text: "觉得有用就分享给朋友吧",
    },
  },
  {
    component: "cta-card",
    description: "行动号召卡片，引导用户转化",
    propsExample: { buttonText: "立即报名" },
    example: {
      title: "行动号召标题",
      subtitle: "副标题或优惠说明",
      body: "详细说明文字",
    },
  },
  {
    component: "tag-label",
    description: "标签组，展示关键词标签",
    example: {
      tags: ["标签1", "标签2", "标签3"],
    },
  },
  {
    component: "follow-bar",
    description: "关注引导条",
    example: {
      hint: "点击关注，获取更多干货",
      buttonText: "关注",
    },
  },
  {
    component: "divider-fancy",
    description: "装饰性分割线",
    example: {},
  },
  {
    component: "styled-table",
    description: "美化表格（内容为 markdown 表格原文，不建议 AI 生成）",
    example: {
      title: "表格标题",
    },
  },
  {
    component: "timeline",
    description: "时间线组件",
    example: {
      items: [
        { date: "2024-01", title: "事件一", desc: "描述" },
        { date: "2024-02", title: "事件二", desc: "描述" },
      ],
    },
  },
  {
    component: "code-frame",
    description: "代码框（内容为代码原文，不建议 AI 生成）",
    propsExample: { title: "示例代码", lang: "javascript" },
    example: {},
  },
  {
    component: "article-section",
    description: "原文段落引用槽位，从原文提取指定范围的段落",
    example: {
      fromParagraph: 1,
      toParagraph: 3,
    },
  },
  // === 杂志级排版组件 ===
  {
    component: "magazine-cover",
    description: "杂志封面卡片，大标题 + 副标题 + 装饰线 + 描述",
    example: {
      title: "盛夏时光",
      subtitle: "Summer Breeze",
      description: "愿所有美好\n如夏日微风一般如期而至。",
    },
  },
  {
    component: "section-divider",
    description: "章节分隔标题，PART 编号 + 中文标题，居中显示",
    example: {
      part: "PART 01",
      title: "夏日故事",
    },
  },
  {
    component: "image-card",
    description: "图片卡片，白底卡片 + 阴影 + 圆角包裹图片",
    example: {
      src: "https://example.com/image.jpg",
      caption: "图片说明文字",
    },
  },
  {
    component: "text-card",
    description: "正文卡片，白底卡片包裹正文段落",
    example: {
      text: "七月盛夏，阳光透过树叶洒落在地面。\n\n微风轻轻吹过，带来了青草与花朵的香气。",
    },
  },
  {
    component: "full-quote",
    description: "整行引用块，整块主色背景 + 白字 + 居中",
    example: {
      text: "愿这个夏天，所有期待都有回应。",
    },
  },
  {
    component: "two-column-cards",
    description: "两栏卡片，flex 两栏，emoji + 标题 + 描述",
    example: {
      items: [
        { icon: "☀️", title: "阳光", description: "每一天都充满能量" },
        { icon: "🍃", title: "微风", description: "吹散所有烦恼" },
      ],
    },
  },
  {
    component: "end-card",
    description: "结尾致谢卡片，居中 Thanks 样式",
    example: {
      title: "Thanks",
      subtitle: "感谢阅读 · 期待下次相遇",
    },
  },
];

/** 按组件名获取 schema */
export function getComponentSchema(
  component: string,
): ComponentContentSchema | undefined {
  return COMPONENT_CONTENT_SCHEMAS.find((s) => s.component === component);
}

/** AI 可自动生成的组件（排除需要外部资源/用户决策的） */
export const AI_GENERATABLE_COMPONENTS = [
  "hero-banner",
  "toc-nav",
  "numbered-heading",
  "section-title",
  "quote-card",
  "callout-pro",
  "stats-block",
  "faq",
  "share-card",
  "cta-card",
  "tag-label",
  "follow-bar",
  "divider-fancy",
  "article-section",
  "magazine-cover",
  "section-divider",
  "image-card",
  "text-card",
  "full-quote",
  "two-column-cards",
  "end-card",
];
