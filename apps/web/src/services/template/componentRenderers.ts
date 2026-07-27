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
  const text = content.text || "如果这篇文章对你有帮助";
  return `${text}\n\n- **分享**\n- **点赞**\n- **在看**`;
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
