/**
 * Template JSON 类型定义
 *
 * Template JSON 是 AI 生成的结构化排版方案，
 * 由 Renderer 渲染为组件 Markdown（含 ::: 语法）。
 */

/** 排版节点：一个组件 */
export interface LayoutNode {
  /** 组件名（必须是已注册组件） */
  component: string;
  /** 组件属性（对应 ::: type{props} 的 props） */
  props?: Record<string, string | number | boolean>;
  /** 组件内容（结构化数据，由 Renderer 转为 Markdown） */
  content: Record<string, unknown>;
}

/** 杂志化等级 */
export type MagazineLevel = "high" | "medium" | "low";

/** Template JSON 完整结构 */
export interface TemplateJSON {
  /** 模板名称（展示用） */
  name?: string;
  /** 规范版本，当前 1.0 */
  version?: string;
  /** 推荐主题 ID（可不填，跟随用户当前主题） */
  theme?: string;
  /** AI 识别的文章类型 */
  articleType?: string;
  /** 杂志化等级 */
  magazineLevel?: MagazineLevel;
  /** 杂志化理由 */
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

/** Renderer 输出结果 */
export interface RenderResult {
  /** 渲染后的组件 Markdown（含 ::: 语法） */
  markdown: string;
  /** 渲染过程中的警告（如无效组件、越界段落） */
  warnings: string[];
  /** 正文覆盖率（article-section 覆盖的段落数 / 总段落数） */
  coverage: number;
}
