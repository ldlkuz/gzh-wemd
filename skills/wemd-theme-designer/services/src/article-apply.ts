// ============================================================
// Article Apply — 文章组件套用
// ============================================================
// 将解析后的文章块映射到 WeMD 组件，生成最终 HTML。

import type { ParsedArticle, ArticleBlock } from "./article-parser.ts";

// ── 组件映射规则 ──
const COMPONENT_MAP: Record<string, string> = {
  hero: "hero-banner",
  heading: "heading-2",
  subheading: "heading-3",
  paragraph: "rich-text",
  quote: "quote",
  list: "list",
  image: "image",
  code: "code-block",
  faq: "faq",
  divider: "divider",
  cta: "cta",
  "brand-sign": "brand-sign",
};

// ── 组件模板 ──
const COMPONENT_TEMPLATES: Record<string, (block: ArticleBlock) => string> = {
  "hero-banner": (block) =>
    `<section class="wemd-hero-banner">
      <h1 class="wemd-hero-title">${escapeHtml(block.content)}</h1>
      ${block.level ? `<p class="wemd-hero-subtitle">${getLevelLabel(block.level)}</p>` : ""}
    </section>`,

  "heading-2": (block) =>
    `<h2 class="wemd-heading-2">${escapeHtml(block.content)}</h2>`,

  "heading-3": (block) =>
    `<h3 class="wemd-heading-3">${escapeHtml(block.content)}</h3>`,

  "rich-text": (block) =>
    `<p class="wemd-rich-text">${escapeHtml(block.content)}</p>`,

  quote: (block) =>
    `<blockquote class="wemd-quote">
      <p>${escapeHtml(block.content)}</p>
    </blockquote>`,

  list: (block) => {
    const items = block.items || block.content.split(/[,，、]/);
    return `<ul class="wemd-list">
      ${items.map((item) => `<li>${escapeHtml(item.trim())}</li>`).join("")}
    </ul>`;
  },

  image: (block) =>
    `<figure class="wemd-image">
      <img src="${block.source || ""}" alt="${escapeHtml(block.content || "图片")}" />
      ${block.content ? `<figcaption>${escapeHtml(block.content)}</figcaption>` : ""}
    </figure>`,

  "code-block": (block) =>
    `<pre class="wemd-code-block"><code>${escapeHtml(block.content)}</code></pre>`,

  faq: (block) =>
    `<section class="wemd-faq">
      <details class="wemd-faq-item">
        <summary class="wemd-faq-question">${escapeHtml(block.content.split(" | ")[0] || block.content)}</summary>
        <div class="wemd-faq-answer">${escapeHtml(block.content.split(" | ").slice(1).join(" | "))}</div>
      </details>
    </section>`,

  divider: () => `<hr class="wemd-divider" />`,

  cta: (block) =>
    `<div class="wemd-cta">
      <p>${escapeHtml(block.content)}</p>
      <a class="wemd-cta-button" href="#">了解更多</a>
    </div>`,

  "brand-sign": (block) =>
    `<div class="wemd-brand-sign">
      <p>${escapeHtml(block.content)}</p>
      <p class="wemd-brand-sign-sub">关注我们 · 获取更多</p>
    </div>`,
};

// ── 将解析后的文章块套用到组件 ──
export function applyArticleBlocks(
  article: ParsedArticle,
  brandSystem?: Record<string, unknown>
): string {
  let html = "";

  for (const block of article.blocks) {
    const componentType = COMPONENT_MAP[block.type];
    if (!componentType) {
      // 未知类型，按段落处理
      html += `<p class="wemd-rich-text">${escapeHtml(block.content)}</p>`;
      continue;
    }

    const templateFn = COMPONENT_TEMPLATES[componentType];
    if (templateFn) {
      html += templateFn(block) + "\n";
    }
  }

  // 添加品牌样式
  const brandCss = generateBrandCss(brandSystem);

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(article.title)}</title>
<style>
${brandCss}
</style>
</head>
<body>
<div class="wemd-article">
  ${html}
</div>
</body>
</html>`;
}

// ── 生成合并后的文章 HTML（不含外部样式） ──
export function applyArticleBlocksInline(
  article: ParsedArticle,
  brandSystem?: Record<string, unknown>
): string {
  return applyArticleBlocksInlineWithVariants(article, {});
}

// ── 生成合并后的文章 HTML，按主题变体注入 data-variant ──
// variants: 组件类型 → 变体名（如 { "hero-banner": "hero-featured" }）
// 注入后组件 HTML 可匹配主题 variantCss 的选择器（#wemd .wemd-xxx[data-variant="..."]）
export function applyArticleBlocksInlineWithVariants(
  article: ParsedArticle,
  variants: Record<string, string>
): string {
  let html = "";

  for (const block of article.blocks) {
    const componentType = COMPONENT_MAP[block.type];
    if (!componentType) {
      html += `<p>${escapeHtml(block.content)}</p>`;
      continue;
    }

    const templateFn = COMPONENT_TEMPLATES[componentType];
    if (templateFn) {
      html += injectVariantAttr(templateFn(block), variants[componentType]) + "\n";
    }
  }

  return html;
}

// 给组件根标签注入 data-variant="..." 属性
function injectVariantAttr(html: string, variant?: string): string {
  if (!variant) return html;
  return html.replace(/^<([a-zA-Z][^ >]*)/, (m, tag) => `${tag} data-variant="${variant}"`);
}

// ── 获取块类型对应的组件映射 ──
export function getBlockComponentMapping(blocks: ArticleBlock[]): { block: ArticleBlock; component: string }[] {
  return blocks.map((block) => ({
    block,
    component: COMPONENT_MAP[block.type] || "rich-text",
  }));
}

// ── 辅助函数 ──
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getLevelLabel(level: number): string {
  switch (level) {
    case 1: return "一级标题";
    case 2: return "二级标题";
    case 3: return "三级标题";
    default: return "";
  }
}

function generateBrandCss(brandSystem?: Record<string, unknown>): string {
  if (!brandSystem) return "";

  const tokens = (brandSystem as any).tokens || {};
  const colors = tokens.colors || {};
  const primary = colors["--wemd-primary"] || "#2563EB";
  const textColor = colors["--wemd-text"] || "#333333";
  const bgColor = colors["--wemd-bg"] || "#ffffff";

  return `
.wemd-article {
  max-width: 680px;
  margin: 0 auto;
  padding: 20px 16px;
  font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif;
  color: ${textColor};
  line-height: 1.8;
  font-size: 16px;
}
.wemd-hero-banner {
  text-align: center;
  padding: 2em 1.5em;
  background: linear-gradient(135deg, ${primary}11, ${primary}05);
  border-radius: 12px;
  margin-bottom: 1.5em;
}
.wemd-hero-title {
  font-size: 1.5em;
  font-weight: 700;
  color: ${primary};
  margin-bottom: 0.5em;
}
.wemd-hero-subtitle {
  font-size: 0.9em;
  color: ${textColor}aa;
}
.wemd-heading-2 {
  font-size: 1.25em;
  font-weight: 600;
  margin: 1.5em 0 0.75em;
  padding-left: 0.75em;
  border-left: 3px solid ${primary};
}
.wemd-heading-3 {
  font-size: 1.1em;
  font-weight: 600;
  margin: 1.2em 0 0.6em;
}
.wemd-rich-text {
  margin-bottom: 1em;
  text-indent: 2em;
}
.wemd-quote {
  margin: 1em 0;
  padding: 0.75em 1em;
  background: ${primary}08;
  border-left: 3px solid ${primary};
  border-radius: 0 8px 8px 0;
  font-style: italic;
}
.wemd-list {
  margin: 1em 0;
  padding-left: 1.5em;
}
.wemd-list li {
  margin-bottom: 0.5em;
}
.wemd-image {
  margin: 1.5em 0;
  text-align: center;
}
.wemd-image img {
  max-width: 100%;
  border-radius: 8px;
}
.wemd-image figcaption {
  font-size: 0.85em;
  color: ${textColor}88;
  margin-top: 0.5em;
}
.wemd-code-block {
  background: #f5f5f5;
  padding: 1em;
  border-radius: 8px;
  overflow-x: auto;
  font-size: 0.9em;
  line-height: 1.5;
}
.wemd-faq {
  margin: 1em 0;
}
.wemd-faq-item {
  border: 1px solid ${primary}22;
  border-radius: 8px;
  overflow: hidden;
}
.wemd-faq-question {
  padding: 0.75em 1em;
  background: ${primary}08;
  font-weight: 600;
  cursor: pointer;
}
.wemd-faq-answer {
  padding: 0.75em 1em;
  border-top: 1px solid ${primary}11;
}
.wemd-divider {
  border: none;
  border-top: 1px solid ${textColor}22;
  margin: 2em 0;
}
.wemd-cta {
  text-align: center;
  padding: 2em;
  background: ${primary}08;
  border-radius: 12px;
  margin: 1.5em 0;
}
.wemd-cta-button {
  display: inline-block;
  padding: 0.6em 2em;
  background: ${primary};
  color: #fff;
  border-radius: 6px;
  text-decoration: none;
  margin-top: 1em;
}
.wemd-brand-sign {
  text-align: center;
  padding: 1.5em;
  border-top: 1px solid ${textColor}22;
  margin-top: 2em;
  font-size: 0.9em;
  color: ${textColor}88;
}
.wemd-brand-sign-sub {
  margin-top: 0.5em;
  font-size: 0.9em;
}
`;
}