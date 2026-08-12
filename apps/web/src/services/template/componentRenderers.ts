/**
 * 组件内容渲染器
 *
 * 把各组件的 content 对象转为 ::: type{props} ... ::: 格式
 * 每个组件对应一个渲染函数，返回组件 body 的 Markdown 字符串。
 */

import type {
  HeroBannerContent,
  TocNavContent,
  NumberedHeadingContent,
  SectionTitleContent,
  QuoteCardContent,
  StatsBlockContent,
  CalloutProContent,
  ShareCardContent,
  FollowBarContent,
  FaqContent,
  DividerFancyContent,
  StyledTableContent,
  CodeFrameContent,
  MagazineCoverContent,
  SectionDividerContent,
  ImageCardContent,
  TextCardContent,
  FullQuoteContent,
  TwoColumnCardsContent,
  EndCardContent,
  ProductCardContent,
  BrandSignContent,
  ResourceListContent,
  TestimonialCardContent,
  SeriesNavContent,
  ResourceItem,
  ImageGridContent,
  AuthorCardContent,
  TimelineContent,
  RelatedPostsContent,
  CopyrightNoticeContent,
  QrCardContent,
  ImageTextRowContent,
  ImageCaptionContent,
  CtaCardContent,
  TagLabelContent,
  ImageCompareContent,
  TableContent,
  AccordionContent,
  StepsContent,
  CodeBlockContent,
  PullquoteContent,
  DividerContent,
} from "./types";

/**
 * 把 props 对象转为 ::: name{...} 中的 props 字符串
 * 例如 { author: "张三", type: "info" } → 'author="张三" type="info"'
 */
export function stringifyProps(
  props: Record<string, string | number | boolean> | undefined,
): string {
  if (!props || Object.keys(props).length === 0) return "";
  const parts: string[] = [];
  for (const [key, value] of Object.entries(props)) {
    if (typeof value === "boolean") {
      if (value) parts.push(`${key}=true`);
    } else if (typeof value === "number") {
      parts.push(`${key}=${value}`);
    } else {
      const escaped = String(value).replace(/"/g, '\\"');
      parts.push(`${key}="${escaped}"`);
    }
  }
  return parts.join(" ");
}

/**
 * 包裹为组件容器
 */
export function wrapComponent(
  name: string,
  propsStr: string,
  body: string,
): string {
  const head = propsStr ? `::: ${name}{${propsStr}}` : `::: ${name}`;
  return `${head}\n${body}\n:::`;
}

// ── 各组件渲染器 ─────────────────────────────────

export function renderHeroBanner(content: HeroBannerContent): string {
  const lines: string[] = [];
  if (content.title) lines.push(`**${content.title}**`);
  if (content.subtitle) lines.push(content.subtitle);
  if (content.tag) lines.push(`*${content.tag}*`);
  return lines.join("\n\n");
}

export function renderTocNav(content: TocNavContent): string {
  const lines: string[] = [];
  if (content.title) lines.push(content.title);
  if (content.items && content.items.length > 0) {
    lines.push("");
    for (const item of content.items) {
      lines.push(`- ${item}`);
    }
  }
  return lines.join("\n");
}

export function renderNumberedHeading(
  content: NumberedHeadingContent,
  index?: string,
): string {
  const idx = index || "01";
  return `${idx}\n\n${content.title}`;
}

export function renderSectionTitle(content: SectionTitleContent): string {
  return content.title;
}

export function renderQuoteCard(content: QuoteCardContent): string {
  return content.text;
}

export function renderStatsBlock(content: StatsBlockContent): string {
  const lines: string[] = [];
  if (content.title) lines.push(content.title);
  if (content.items && content.items.length > 0) {
    lines.push("");
    for (const item of content.items) {
      lines.push(`- ${item.label} **${item.value}**`);
    }
  }
  return lines.join("\n");
}

export function renderCalloutPro(content: CalloutProContent): string {
  const lines: string[] = [];
  if (content.title) lines.push(`**${content.title}**`);
  if (content.body) {
    lines.push("");
    lines.push(content.body);
  }
  return lines.join("\n");
}

export function renderShareCard(content: ShareCardContent): string {
  return content.text || "如果这篇文章对你有帮助";
}

export function renderFollowBar(content: FollowBarContent): string {
  const text = content.text || "点击上方蓝字关注我们";
  const button = content.buttonText || "关注";
  return `${text}\n\n${button}`;
}

export function renderFaq(content: FaqContent): string {
  const lines: string[] = [];
  if (content.title) lines.push(`**${content.title}**`);
  if (content.items && content.items.length > 0) {
    for (const item of content.items) {
      if (lines.length > 0) lines.push("");
      lines.push(`**${item.q}**`);
      lines.push("");
      lines.push(item.a);
    }
  }
  return lines.join("\n");
}

export function renderDividerFancy(content: DividerFancyContent): string {
  return content.text || "";
}

export function renderStyledTable(content: StyledTableContent): string {
  const lines: string[] = [];
  if (content.title) lines.push(content.title);
  if (content.markdown) {
    lines.push("");
    lines.push(content.markdown);
  }
  return lines.join("\n");
}

export function renderCodeFrame(content: CodeFrameContent): string {
  const lang = content.lang || "text";
  const title = content.title || "代码示例";
  const code = content.code || "";
  return `**${title}** \`${lang}\`\n\n\`\`\`${lang}\n${code}\n\`\`\``;
}

// ── 渲染器注册表 ─────────────────────────────────

export type ComponentRenderer = (content: any) => string;

/**
 * cta-card 行动号召卡片
 * 结构：标题 + 副标题 + 正文 + 按钮文案
 */
function renderCtaCard(content: CtaCardContent): string {
  const lines: string[] = [];
  lines.push(`**${content.title}**`);
  if (content.subtitle) lines.push(content.subtitle);
  if (content.body) lines.push(content.body);
  lines.push(`【${content.buttonText || "立即参与"}】`);
  return lines.join("\n\n");
}

/**
 * tag-label 标签组
 * 结构：标签列表，用 # 号分隔
 */
function renderTagLabel(content: TagLabelContent): string {
  return (content.tags || []).map((t) => `#${t}`).join("  ");
}

export const componentRenderers: Record<string, ComponentRenderer> = {
  "hero-banner": renderHeroBanner,
  "toc-nav": renderTocNav,
  "numbered-heading": (c: NumberedHeadingContent & { index?: string }) =>
    renderNumberedHeading(c, c.index),
  "section-title": renderSectionTitle,
  "quote-card": renderQuoteCard,
  "stats-block": renderStatsBlock,
  "callout-pro": renderCalloutPro,
  "share-card": renderShareCard,
  "follow-bar": renderFollowBar,
  faq: renderFaq,
  "divider-fancy": renderDividerFancy,
  "styled-table": renderStyledTable,
  "code-frame": renderCodeFrame,
  "magazine-cover": renderMagazineCover,
  "section-divider": renderSectionDivider,
  "image-card": renderImageCard,
  "text-card": renderTextCard,
  "full-quote": renderFullQuote,
  "two-column-cards": renderTwoColumnCards,
  "end-card": renderEndCard,
  // 新增扩展组件渲染器
  "product-card": renderProductCard,
  "brand-sign": renderBrandSign,
  "resource-list": renderResourceList,
  "testimonial-card": renderTestimonialCard,
  "series-nav": renderSeriesNav,
  "cta-card": renderCtaCard,
  "tag-label": renderTagLabel,
  // 补充缺失的组件渲染器
  "image-grid": renderImageGrid,
  "author-card": renderAuthorCard,
  timeline: renderTimeline,
  "related-posts": renderRelatedPosts,
  "copyright-notice": renderCopyrightNotice,
  "qr-card": renderQrCard,
  "image-text-row": renderImageTextRow,
  "image-caption": renderImageCaption,
  // 全 43 组件补齐：image-compare / table / accordion / steps / code-block / pullquote / divider
  "image-compare": renderImageCompare,
  table: renderTable,
  accordion: renderAccordion,
  steps: renderSteps,
  "code-block": renderCodeBlock,
  pullquote: renderPullquote,
  divider: renderDivider,
};

/**
 * 检查组件是否有注册的渲染器
 */
export function hasRenderer(component: string): boolean {
  return component in componentRenderers;
}

/* === 杂志级排版组件渲染器 === */

/** magazine-cover 杂志封面 */
function renderMagazineCover(content: MagazineCoverContent): string {
  const lines: string[] = [];
  lines.push(content.title || "");
  if (content.subtitle) {
    lines.push(content.subtitle);
  }
  // 装饰线（用空段落+分隔符方式，CSS 会处理第三段为装饰线）
  lines.push("---");
  if (content.description) {
    lines.push(content.description);
  }
  return lines.join("\n\n");
}

/** section-divider 章节分隔标题 */
function renderSectionDivider(content: SectionDividerContent): string {
  return `${content.part || ""}\n\n${content.title || ""}`;
}

/** image-card 图片卡片 */
function renderImageCard(content: ImageCardContent): string {
  const lines: string[] = [];
  if (content.src) {
    lines.push(`![image](${content.src})`);
  }
  if (content.caption) {
    lines.push(content.caption);
  }
  return lines.join("\n\n");
}

/** text-card 正文卡片 */
function renderTextCard(content: TextCardContent): string {
  return content.text || "";
}

/** full-quote 整行引用块 */
function renderFullQuote(content: FullQuoteContent): string {
  return content.text || "";
}

/** two-column-cards 两栏卡片 */
function renderTwoColumnCards(content: TwoColumnCardsContent): string {
  if (!content.items || content.items.length < 2) {
    return "";
  }
  // 用列表结构：每个列表项是一栏，li 内部用 <br> 分行
  const items = content.items.slice(0, 2);
  const lines = items.map((item) => {
    const parts: string[] = [];
    if (item.icon) parts.push(item.icon);
    parts.push(`**${item.title}**`);
    if (item.description) parts.push(item.description);
    return `- ${parts.join("<br>")}`;
  });
  return lines.join("\n");
}

/** end-card 结尾致谢卡片 */
function renderEndCard(content: EndCardContent): string {
  const lines: string[] = [];
  lines.push(content.title || "");
  if (content.subtitle) {
    lines.push(content.subtitle);
  }
  return lines.join("\n\n");
}

/* === 新增扩展组件渲染器 === */

/**
 * product-card 产品/商品卡片
 * Markdown 结构（段落方式，magazineRenderer 会按顺序取每段）：
 *   段1: ![产品图](image URL)                <- 可选，缺则跳过
 *   段2: 🛒<badge>  **title**  subtitle      <- badge 和标题行
 *   段3: description                         <- 详细描述（可选）
 *   段4: price  ~~originalPrice~~            <- 价格 + 删除线原价
 *   段5: ⭐rating  sales  stock              <- 评分、销量、库存
 *   段6: 【按钮】buttonText                   <- 按钮
 *   段7: 标签1  标签2  标签3                 <- tags 用 空格分隔
 */
function renderProductCard(content: ProductCardContent): string {
  const lines: string[] = [];
  if (content.image) lines.push(`![product](${content.image})`);

  const titleParts: string[] = [];
  if (content.badge) titleParts.push(`【${content.badge}】`);
  titleParts.push(`**${content.title}**`);
  if (content.subtitle) titleParts.push(content.subtitle);
  lines.push(titleParts.join(" "));

  if (content.description) lines.push(content.description);

  const priceParts: string[] = [];
  priceParts.push(`💰 ${content.price}`);
  if (content.originalPrice) priceParts.push(`~~${content.originalPrice}~~`);
  lines.push(priceParts.join("  "));

  const metaParts: string[] = [];
  if (typeof content.rating === "number") {
    const full = Math.round(content.rating);
    const stars = "⭐".repeat(full) + "☆".repeat(Math.max(0, 5 - full));
    metaParts.push(`${stars} ${content.rating.toFixed(1)}`);
  }
  if (content.sales) metaParts.push(`📦 ${content.sales}`);
  if (content.stock) metaParts.push(`🔥 ${content.stock}`);
  if (metaParts.length) lines.push(metaParts.join("   "));

  lines.push(`【${content.buttonText || "立即购买"}】`);

  if (content.tags && content.tags.length) {
    lines.push(content.tags.map((t) => `#${t}`).join("  "));
  }

  return lines.join("\n\n");
}

/**
 * brand-sign 品牌签名 Logo 小标
 * 结构：
 *   段1: ![logo](logo URL)        <- 可选
 *   段2: **brandName**            <- 品牌名
 *   段3: slogan                   <- slogan 可选
 *   段4: style | divider          <- style=inline/stacked/centered, divider=true/false 空格分隔
 *   段5: subText                  <- 小字版权可选
 */
function renderBrandSign(content: BrandSignContent): string {
  const lines: string[] = [];
  lines.push(`**${content.brandName}**`);
  if (content.slogan) lines.push(content.slogan);
  const meta: string[] = [];
  if (content.style) meta.push(`style=${content.style}`);
  if (content.divider) meta.push("divider=true");
  if (meta.length) lines.push(meta.join(" "));
  if (content.subText) lines.push(`*${content.subText}*`);
  return lines.join("\n\n");
}

/**
 * resource-list 资料清单 / 步骤清单
 * 结构：
 *   段1: **title**                <- 标题
 *   段2: subtitle                 <- 副标题 可选
 *   段3: numbered=N  layout=X     <- 元信息
 *   其后每个列表项一行 "- [type|index] title  | description | meta | tag | url"
 *     用列表方式，magazineRenderer 会解析每个 li
 */
function renderResourceList(content: ResourceListContent): string {
  const lines: string[] = [];
  lines.push(`**${content.title}**`);
  if (content.subtitle) lines.push(content.subtitle);
  const meta: string[] = [];
  meta.push(content.numbered ? "numbered=true" : "numbered=false");
  meta.push(`layout=${content.layout || "comfortable"}`);
  lines.push(meta.join(" "));

  lines.push("");
  (content.items || []).forEach((item: ResourceItem, idx) => {
    const tokens: string[] = [];
    const type = item.type || "link";
    const index = typeof item.index === "number" ? item.index : idx + 1;
    tokens.push(`[${type}|${index}]`);
    tokens.push(item.title);
    if (item.description) tokens.push(`|D=${item.description}`);
    if (item.meta) tokens.push(`|M=${item.meta}`);
    if (item.tag) tokens.push(`|T=${item.tag}`);
    if (item.url) tokens.push(`|U=${item.url}`);
    lines.push(`- ${tokens.join(" ")}`);
  });
  return lines.join("\n");
}

/**
 * testimonial-card 名人名言 / 客户推荐
 * 结构：
 *   段1: ![avatar](avatar)        <- 头像 可选
 *   段2: quote                    <- 名言正文（加粗）
 *   段3: "source"                 <- 来源（引用样式）可选
 *   段4: **name**  title          <- 人名 + 职位
 *   段5: company                  <- 公司 可选
 *   段6: ![company-logo](...)     <- 公司 logo 可选
 */
function renderTestimonialCard(content: TestimonialCardContent): string {
  const lines: string[] = [];
  if (content.avatar) lines.push(`![avatar](${content.avatar})`);
  lines.push(`> **${content.quote}**`);
  if (content.source) lines.push(`> —— ${content.source}`);
  const nameLine: string[] = [];
  nameLine.push(`**${content.name}**`);
  if (content.title) nameLine.push(content.title);
  lines.push(nameLine.join("  "));
  if (content.company) lines.push(content.company);
  if (content.companyLogo) lines.push(`![brand](${content.companyLogo})`);
  return lines.join("\n\n");
}

/**
 * series-nav 系列文章导航
 * 结构：
 *   段1: 📚 seriesName  (3/10)   <- 系列名 + 进度
 *   段2: description              <- 系列简介 可选
 *   段3: PREV  第2篇  Setup 语法糖...   <- prev 篇，可选（第1篇没有）
 *   段4: NEXT  第4篇  计算属性...        <- next 篇，可选（最后篇没有）
 *   其后每个列表项一行 "- [1|current] 标题  | url"
 */
function renderSeriesNav(content: SeriesNavContent): string {
  const lines: string[] = [];
  lines.push(
    `📚 **${content.seriesName}**  (第 ${content.currentIndex} / ${content.totalCount} 篇)`,
  );
  if (content.description) lines.push(content.description);
  if (content.prevArticle) {
    lines.push(
      `⬅️ 上一篇：**第${content.prevArticle.index}篇** — ${content.prevArticle.title}`,
    );
  }
  if (content.nextArticle) {
    lines.push(
      `➡️ 下一篇：**第${content.nextArticle.index}篇** — ${content.nextArticle.title}`,
    );
  }
  lines.push("");
  (content.articles || []).forEach((a) => {
    const flag = a.current ? "[CURRENT]" : `[${a.index}]`;
    const urlPart = a.url ? `  |U=${a.url}` : "";
    lines.push(`- ${flag} ${a.title}${urlPart}`);
  });
  return lines.join("\n");
}

/* === 补充缺失的组件渲染器 === */

/** image-grid 图片画廊 */
function renderImageGrid(content: ImageGridContent): string {
  const lines: string[] = [];
  if (content.title) lines.push(content.title);
  lines.push("");
  const images = content.images || [];
  for (const img of images) {
    lines.push(`- ![](${img})`);
  }
  return lines.join("\n");
}

/** author-card 作者卡片 */
function renderAuthorCard(content: AuthorCardContent): string {
  const lines: string[] = [];
  if (content.avatar) lines.push(`![](${content.avatar})`);
  const nameLine: string[] = [`**${content.name || "作者"}**`];
  if (content.title) nameLine.push(`*${content.title}*`);
  lines.push(nameLine.join(" "));
  if (content.bio) lines.push(content.bio);
  return lines.join("\n\n");
}

/** timeline 时间线 */
function renderTimeline(content: TimelineContent): string {
  const lines: string[] = [];
  if (content.title) lines.push(content.title);
  lines.push("");
  const items = content.items || [];
  for (const item of items) {
    lines.push(`- **${item.time || ""}** ${item.event || ""}`);
  }
  return lines.join("\n");
}

/** related-posts 相关推荐 */
function renderRelatedPosts(content: RelatedPostsContent): string {
  const lines: string[] = [];
  if (content.title) lines.push(`**${content.title}**`);
  lines.push("");
  const posts = content.posts || [];
  for (const post of posts) {
    const link = post.url ? `[${post.title}](${post.url})` : post.title;
    lines.push(`- ${link}`);
  }
  return lines.join("\n");
}

/** copyright-notice 版权声明 */
function renderCopyrightNotice(content: CopyrightNoticeContent): string {
  const lines: string[] = [];
  if (content.text) {
    lines.push(content.text);
  } else {
    const year = content.year || new Date().getFullYear();
    const author = content.author || "";
    lines.push(`© ${year} ${author}`.trim());
    if (content.license) lines.push(content.license);
  }
  return lines.join("\n\n");
}

/** qr-card 二维码卡片 */
function renderQrCard(content: QrCardContent): string {
  const lines: string[] = [];
  if (content.src) lines.push(`![](${content.src})`);
  if (content.title) lines.push(`**${content.title}**`);
  if (content.description) lines.push(content.description);
  return lines.join("\n\n");
}

/** image-text-row 图文横排 */
function renderImageTextRow(content: ImageTextRowContent): string {
  const lines: string[] = [];
  if (content.image) lines.push(`![](${content.image})`);
  if (content.text) lines.push(content.text);
  return lines.join("\n\n");
}

/** image-caption 图片说明 */
function renderImageCaption(content: ImageCaptionContent): string {
  const lines: string[] = [];
  if (content.src) lines.push(`![](${content.src})`);
  if (content.caption) lines.push(`*${content.caption}*`);
  return lines.join("\n\n");
}

/** image-compare 图片对比 */
function renderImageCompare(content: ImageCompareContent): string {
  const lines: string[] = [];
  if (content.before) lines.push(`![](${content.before})`);
  if (content.after) lines.push(`![](${content.after})`);
  if (content.caption) lines.push(`*${content.caption}*`);
  return lines.join("\n\n");
}

/** table 原始数据表格 */
function renderTable(content: TableContent): string {
  const lines: string[] = [];
  if (content.title) lines.push(`**${content.title}**`);
  lines.push("");
  if (content.headers && content.headers.length > 0) {
    lines.push(`| ${content.headers.join(" | ")} |`);
    lines.push(`| ${content.headers.map(() => "---").join(" | ")} |`);
  }
  for (const row of content.rows || []) {
    lines.push(`| ${row.cells.join(" | ")} |`);
  }
  return lines.join("\n");
}

/** accordion 折叠面板 */
function renderAccordion(content: AccordionContent): string {
  const lines: string[] = [];
  for (const item of content.items || []) {
    if (lines.length > 0) lines.push("");
    lines.push(`**${item.title}**`);
    lines.push("");
    lines.push(item.body);
  }
  return lines.join("\n");
}

/** steps 步骤说明 */
function renderSteps(content: StepsContent): string {
  const lines: string[] = [];
  if (content.title) lines.push(`**${content.title}**`);
  lines.push("");
  for (const item of content.items || []) {
    lines.push(
      `- **${item.title}**${item.description ? ` — ${item.description}` : ""}`,
    );
  }
  return lines.join("\n");
}

/** code-block 代码块 */
function renderCodeBlock(content: CodeBlockContent): string {
  const lang = content.lang || "text";
  return `\`\`\`${lang}\n${content.code || ""}\n\`\`\``;
}

/** pullquote 拉取引用 */
function renderPullquote(content: PullquoteContent): string {
  const lines: string[] = [];
  lines.push(`> **${content.text}**`);
  if (content.source) lines.push(`> —— ${content.source}`);
  return lines.join("\n\n");
}

/** divider 内容分隔线 */
function renderDivider(content: DividerContent): string {
  return content.text ? `---${content.text}---` : "---";
}
