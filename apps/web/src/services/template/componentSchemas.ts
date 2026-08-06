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
    propsExample: { variant: "center" },
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
    propsExample: { type: "tip", variant: "border" },
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
    description: "关注引导条：引导文案 + 关注按钮",
    example: {
      text: "点击关注，获取更多干货",
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
    description: "时间线组件：标题 + 时间线条目列表（time + event）",
    example: {
      title: "产品发展历程",
      items: [
        { time: "2024-01", event: "项目立项，确定技术方向" },
        { time: "2024-06", event: "v1.0 正式发布" },
        { time: "2025-01", event: "用户突破 10 万" },
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
    propsExample: { variant: "line" },
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
    propsExample: { variant: "centered" },
    example: {
      title: "Thanks",
      subtitle: "感谢阅读 · 期待下次相遇",
    },
  },
  // === 新增扩展组件（产品/品牌/资料/推荐/系列） ===
  {
    component: "product-card",
    description:
      "产品/商品卡片（电商/带货向）：图片 + 标题 + 描述 + 价格/原价折扣 + 评分⭐ + 购买按钮 + 标签",
    propsExample: { variant: "ecommerce" },
    example: {
      image: "https://example.com/product.jpg",
      title: "星空投影灯 Pro",
      subtitle: "居家氛围感神器",
      description: "360° 全景星空投影，支持蓝牙音箱二合一，卧室露营两用品",
      price: "¥399",
      originalPrice: "¥599",
      badge: "限时 限时特惠",
      rating: 4.8,
      sales: "已售 1.2w",
      stock: "仅剩 50 件",
      buttonText: "立即抢购",
      tags: ["顺丰包邮", "七天无理由", "品牌直发"],
    },
  },
  {
    component: "brand-sign",
    description: "品牌签名 Logo 小标：品牌 Logo + 品牌名 + Slogan + 小装饰",
    propsExample: { variant: "inline" },
    example: {
      logo: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
      brandName: "WeMD",
      slogan: "优雅排版，不止所见",
      subText: "© 2026 WeMD Team",
      style: "inline",
      divider: true,
    },
  },
  {
    component: "resource-list",
    description:
      "资料清单/步骤清单：非文章目录，用于资料下载列表、操作N步法、参考书目等外部列表",
    propsExample: { variant: "files" },
    example: {
      title: "配套资料包",
      subtitle: "关注公众号后台回复「vue」即可下载」即可获取",
      numbered: false,
      layout: "comfortable",
      items: [
        {
          type: "file",
          title: "01-Vue3 入门讲义 PDF",
          description: "120 页完整讲义",
          meta: "PDF / 12MB",
          tag: "推荐",
          url: "https://example.com/01.pdf",
        },
        {
          type: "file",
          title: "02-配套源码压缩包",
          description: "12 个章节逐节对应的项目工程",
          meta: "ZIP / 38MB",
          url: "https://example.com/02.zip",
        },
        {
          type: "link",
          title: "03-在线视频课程",
          description: "B站同步视频讲解",
          meta: "免费 / 24 节",
          url: "https://example.com/03",
        },
      ],
    },
  },
  {
    component: "testimonial-card",
    description:
      "名人名言/客户推荐卡：头像 + 人名 + 职位 + 公司 + 名言正文 + 来源 + 公司 Logo 可选",
    propsExample: { variant: "classic" },
    example: {
      avatar: "https://example.com/avatar.jpg",
      name: "史蒂夫·乔布斯",
      title: "联合创始人",
      company: "Apple Inc.",
      quote: "Stay hungry, stay foolish. 求知若饥，虚心若愚。",
      source: "2005 年斯坦福大学毕业演讲",
    },
  },
  {
    component: "series-nav",
    description:
      "系列文章导航：系列名 + 当前第 N 篇/共 X 篇 + 上一篇/下一篇 + 文章列表或进度条",
    propsExample: { variant: "progress" },
    example: {
      seriesName: "Vue3 从 0 到 1",
      currentIndex: 3,
      totalCount: 10,
      description: "本系列 10 篇，带你系统掌握 Vue3 组合式 API 实战",
      articles: [
        { index: 1, title: "初识 Vue3：与 Vue2 的核心区别" },
        { index: 2, title: "Setup 语法糖的正确姿势" },
        { index: 3, title: "Ref 和 Reactive：到底怎么选？", current: true },
        { index: 4, title: "计算属性与侦听器的妙用", current: false },
      ],
      prevArticle: { index: 2, title: "Setup 语法糖的正确姿势" },
      nextArticle: { index: 4, title: "计算属性与侦听器的妙用" },
    },
  },
  // === 补充缺失的组件 schema ===
  {
    component: "image-grid",
    description: "图片画廊/多图网格，展示多张图片",
    propsExample: { variant: "grid" },
    example: {
      title: "夏日旅行记录",
      images: [
        "https://example.com/photo1.jpg",
        "https://example.com/photo2.jpg",
        "https://example.com/photo3.jpg",
      ],
    },
  },
  {
    component: "author-card",
    description: "作者卡片：头像 + 作者名 + 职位/头衔 + 简介",
    propsExample: { variant: "compact" },
    example: {
      avatar: "https://example.com/avatar.jpg",
      name: "张三",
      title: "资深前端工程师",
      bio: "专注前端工程化与可视化方向，分享实战经验。",
    },
  },
  {
    component: "related-posts",
    description: "相关推荐文章列表，文末引导继续阅读",
    propsExample: { variant: "list" },
    example: {
      title: "延伸阅读",
      posts: [
        { title: "Vue3 组合式 API 最佳实践", url: "https://example.com/1" },
        { title: "TypeScript 进阶技巧", url: "https://example.com/2" },
        { title: "前端性能优化指南", url: "https://example.com/3" },
      ],
    },
  },
  {
    component: "copyright-notice",
    description: "版权声明：版权年份 + 作者 + 许可协议，或自定义声明文本",
    propsExample: { variant: "default" },
    example: {
      year: "2026",
      author: "WeMD Team",
      license: "转载请注明出处",
    },
  },
  {
    component: "qr-card",
    description: "二维码卡片：二维码图片 + 标题 + 描述说明",
    propsExample: { variant: "default" },
    example: {
      src: "https://example.com/qrcode.png",
      title: "扫码关注公众号",
      description: "获取更多优质内容，回复「福利」领取资料包",
    },
  },
  {
    component: "image-text-row",
    description: "图文横排：图片 + 文字并排展示",
    propsExample: { variant: "row" },
    example: {
      image: "https://example.com/cover.jpg",
      text: "这里是图片对应的说明文字，与图片横向并排展示。",
    },
  },
  {
    component: "image-caption",
    description: "图片说明：图片 + 斜体说明文字（caption 样式）",
    propsExample: { variant: "default" },
    example: {
      src: "https://example.com/photo.jpg",
      caption: "摄于 2026 年盛夏，海边日落",
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
  // 新增扩展组件
  "product-card",
  "brand-sign",
  "resource-list",
  "testimonial-card",
  "series-nav",
  // 补充可纯文本生成的组件（不含图片资源类）
  "author-card",
  "related-posts",
  "copyright-notice",
];
