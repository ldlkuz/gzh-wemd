/**
 * Template JSON 类型定义
 *
 * Template JSON 是 AI 生成的结构化排版方案，
 * 由 Renderer 渲染为组件 Markdown（含 ::: 语法）。
 *
 * v2.0: 引入 DesignIntent + reason + role，替代 magazineLevel 全局标签。
 * AI 逐节点输出设计意图，Renderer 根据 design 自动推导 variant。
 */

/** 设计意图：AI 对单个节点的视觉表达决策 */
export interface DesignIntent {
  /** 设计目的：这个组件在页面里的角色 */
  purpose?: "headline" | "emphasis" | "transition" | "summary" | "decoration";
  /** 视觉强调程度：high 冲击 / medium 适中 / low 弱化 */
  emphasis?: "high" | "medium" | "low";
  /** 布局方式 */
  layout?: "center" | "left" | "stacked" | "split" | "inline";
  /** 情绪基调 */
  tone?: "professional" | "warm" | "minimal" | "bold" | "playful";
  /** 间距密度 */
  spacing?: "large" | "normal" | "compact";
  /** 字号层级 */
  headlineSize?: "xxl" | "xl" | "lg" | "md";
}

/** 内容角色：稳定的语义层，与 component（可替换实现）解耦 */
export type ContentRole =
  | "opening"
  | "summary"
  | "transition"
  | "evidence"
  | "case"
  | "conclusion"
  | "cta";

/** 排版节点：一个组件 */
export interface LayoutNode {
  /** 组件名（必须是已注册组件） */
  component: string;
  /** 组件属性（对应 ::: type{props} 的 props） */
  props?: Record<string, string | number | boolean>;
  /** 组件内容（结构化数据，由 Renderer 转为 Markdown） */
  content: Record<string, unknown>;
  /** 设计意图：AI 对视觉呈现的决策（v2.0 新增） */
  design?: DesignIntent;
  /** 设计理由：AI 解释为什么这样决策（v2.0 新增，给调试/用户可见） */
  reason?: string;
  /** 内容角色：稳定的语义层标签（v2.0 新增，可选，为未来 role→component 映射预留） */
  role?: ContentRole;
}

/** 杂志化等级（v2.0 起废弃，保留以兼容旧模板） */
export type MagazineLevel = "high" | "medium" | "low";

/** Template JSON 完整结构 */
export interface TemplateJSON {
  /** 模板名称（展示用） */
  name?: string;
  /** 规范版本，v2.0 起 design 字段成为标准 */
  version?: string;
  /** 推荐主题 ID（可不填，跟随用户当前主题） */
  theme?: string;
  /** @deprecated v2.0 起由 design 字段替代，保留以兼容旧模板 */
  articleType?: string;
  /** @deprecated v2.0 起由 design.emphasis 替代 */
  magazineLevel?: MagazineLevel;
  /** @deprecated v2.0 起由 node.reason 替代 */
  magazineReason?: string;
  /** 文章元信息 */
  meta?: {
    title?: string;
    subtitle?: string;
  };
  /** 排版节点序列，按顺序渲染 */
  layout: LayoutNode[];
}

/** article-section 内容：引用原文段落范围 */
export interface ArticleSectionContent {
  /** 起始段落（从 1 起） */
  fromParagraph: number;
  /** 结束段落（包含） */
  toParagraph: number;
}

/** hero-banner 内容 */
export interface HeroBannerContent {
  title?: string;
  subtitle?: string;
  tag?: string;
}

/** toc-nav 内容 */
export interface TocNavContent {
  title?: string;
  items?: string[];
}

/** numbered-heading 内容 */
export interface NumberedHeadingContent {
  title: string;
}

/** section-title 内容 */
export interface SectionTitleContent {
  title: string;
}

/** quote-card 内容 */
export interface QuoteCardContent {
  text: string;
}

/** stats-block 内容 */
export interface StatsBlockContent {
  title?: string;
  items?: Array<{ label: string; value: string }>;
}

/** callout-pro 内容 */
export interface CalloutProContent {
  title?: string;
  body?: string;
}

/** share-card 内容 */
export interface ShareCardContent {
  text?: string;
}

/** follow-bar 内容 */
export interface FollowBarContent {
  text?: string;
  buttonText?: string;
}

/** faq 内容 */
export interface FaqContent {
  title?: string;
  items?: Array<{ q: string; a: string }>;
}

/** divider-fancy 内容 */
export interface DividerFancyContent {
  text?: string;
}

/** styled-table 内容 */
export interface StyledTableContent {
  title?: string;
  /** markdown 表格源码 */
  markdown: string;
}

/** code-frame 内容 */
export interface CodeFrameContent {
  title?: string;
  code: string;
  lang?: string;
}

/** === 杂志级排版组件 === */

/** magazine-cover 杂志封面内容 */
export interface MagazineCoverContent {
  title: string;
  subtitle?: string;
  description?: string;
}

/** section-divider 章节分隔标题内容 */
export interface SectionDividerContent {
  part: string;
  title: string;
}

/** image-card 图片卡片内容 */
export interface ImageCardContent {
  src: string;
  caption?: string;
}

/** text-card 正文卡片内容 */
export interface TextCardContent {
  text: string;
}

/** full-quote 整行引用块内容 */
export interface FullQuoteContent {
  text: string;
}

/** two-column-cards 两栏卡片内容 */
export interface TwoColumnCardsContent {
  items: Array<{
    icon?: string;
    title: string;
    description?: string;
  }>;
}

/** end-card 结尾致谢卡片内容 */
export interface EndCardContent {
  title: string;
  subtitle?: string;
}

/** === 新增组件（SDK 扩展包：产品/品牌/资料/推荐/系列） === */

/** product-card 产品/商品卡片 */
export interface ProductCardContent {
  image?: string;
  title: string;
  subtitle?: string;
  description?: string;
  price: string;
  originalPrice?: string;
  badge?: string;
  rating?: number;
  sales?: string;
  stock?: string;
  buttonText?: string;
  tags?: string[];
}

/** brand-sign 品牌签名 Logo 小标 */
export interface BrandSignContent {
  logo?: string;
  brandName: string;
  slogan?: string;
  subText?: string;
  style?: "inline" | "stacked" | "centered";
  divider?: boolean;
}

/** resource-list 资料清单 / 步骤清单 */
export type ResourceItemType = "file" | "link" | "video" | "step";

export interface ResourceItem {
  type?: ResourceItemType;
  index?: number;
  title: string;
  description?: string;
  meta?: string;
  url?: string;
  tag?: string;
}

export interface ResourceListContent {
  title: string;
  subtitle?: string;
  items: ResourceItem[];
  numbered?: boolean;
  layout?: "compact" | "comfortable";
}

/** testimonial-card 名人名言/客户推荐 */
export interface TestimonialCardContent {
  avatar?: string;
  name: string;
  title?: string;
  company?: string;
  companyLogo?: string;
  quote: string;
  source?: string;
}

/** series-nav 系列文章导航 */
export interface SeriesArticleItem {
  index: number;
  title: string;
  url?: string;
  current?: boolean;
}

export interface SeriesNavContent {
  seriesName: string;
  currentIndex: number;
  totalCount: number;
  description?: string;
  articles: SeriesArticleItem[];
  prevArticle?: SeriesArticleItem;
  nextArticle?: SeriesArticleItem;
}

/** Renderer 输出结果 */
export interface RenderResult {
  /** 渲染后的组件 Markdown（含 ::: 语法） */
  markdown: string;
  /** 渲染过程中的警告（如无效组件、越界段落） */
  warnings: string[];
  /** 正文覆盖率（article-section 覆盖的段落数 / 总段落数） */
  coverage: number;
}
