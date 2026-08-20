/**
 * Template JSON 渲染器
 *
 * 把 Template JSON + 用户原文 → 组件 Markdown（含 ::: 语法）
 * 走现有 markdown-it-component + 主题 CSS + juice 内联管线。
 *
 * v2.0: 新增 getDefaultDesign()，AI 未提供 design 时推导默认值。
 * Phase 6: 组件形态由当前主题决定，不再注入 variant；AI 输出不带 variant。
 * 旧模板（v1.x）通过 migrateV1ToV2() 自动迁移。
 */

import type {
  TemplateJSON,
  LayoutNode,
  RenderResult,
  ArticleSectionContent,
  DesignIntent,
} from "./types";
import {
  splitParagraphs,
  extractParagraphs,
  calculateCoverage,
  findUncoveredRanges,
  getParagraphCount,
} from "./contentExtractor";
import {
  componentRenderers,
  hasRenderer,
  stringifyProps,
  wrapComponent,
} from "./componentRenderers";

const ARTICLE_SECTION = "article-section";

/**
 * 基础层组件：有原生 Markdown 语法对应，视觉交给主题 CSS 皮肤。
 * 渲染时直接输出原生 body（不包 `:::`），与"基础层全部去 :::"对齐。
 * 这些组件即使被旧模板/AI 引用，也会渲染为原生结构而非私有语法。
 */
const NATIVE_COMPONENTS = new Set([
  "timeline",
  "related-posts",
  "toc-nav",
  "tag-label",
  "styled-table",
  "stats-block",
  "image-caption",
  "copyright-notice",
  "code-frame",
  "image-grid",
]);

/** 标题类组件：content.title 即替代了原文中对应的 Markdown 标题段 */
const TITLE_COMPONENTS = new Set([
  "section-title",
  "section-divider",
  "numbered-heading",
  "hero-banner",
  "magazine-cover",
]);

/**
 * 归一化文本用于标题段匹配：
 * 去 Markdown 标题前缀、去全部引号、去空白、小写，
 * 容忍 AI 提取 title 时与原文在标点/空白上的细微差异。
 */
function normalizeForMatch(text: string): string {
  return text
    .replace(/^\s*#{1,6}\s+/, "")
    .replace(/["""''']/g, "")
    .replace(/\s+/g, "")
    .toLowerCase();
}

/**
 * 收集 layout 中标题类组件的 title（归一化），
 * 用于识别"已被组件消费、不应再兜底进正文"的标题段。
 */
function collectConsumedTitles(tpl: TemplateJSON): string[] {
  const titles: string[] = [];
  for (const node of tpl.layout) {
    if (TITLE_COMPONENTS.has(node.component)) {
      const title = String(
        (node.content as Record<string, unknown>)?.title ?? "",
      );
      if (title.trim()) titles.push(normalizeForMatch(title));
    }
  }
  return titles;
}

/**
 * 找出文章中被标题组件消费的标题段索引（1-based）。
 * 这些段落已被组件（如 section-title）替代，不应再以原生 `## ` 标题输出。
 */
function findConsumedHeadingIndexes(
  article: string,
  consumedTitleSet: Set<string>,
): number[] {
  const indexes: number[] = [];
  const paragraphs = splitParagraphs(article);
  paragraphs.forEach((p, i) => {
    if (/^\s*#{1,6}\s+/.test(p) && consumedTitleSet.has(normalizeForMatch(p))) {
      indexes.push(i + 1);
    }
  });
  return indexes;
}

/** Markdown 标题段正则：`#` ~ `######` 开头 */
const HEADING_RE = /^\s*(#{1,6})\s+(.+)$/;

/**
 * 基础层标题处理（不依赖 AI，方案 A）：
 * - 已被 AI 标题组件（section-title/hero-banner 等）消费的标题段 → 剔除，
 *   避免与组件标题重复；
 * - 其余标题段 → **保持原生 Markdown 标题语法原样输出**，由解析器渲染成
 *   h1~h6，视觉交给主题 CSS 对原生元素上色。
 *
 * 基础层对齐 md 语法：不再产 `:::` 私有语法包装；`#` 即标题，无需手写组件。
 */
function stripConsumedHeadings(
  markdown: string,
  consumedTitleSet: Set<string>,
): string {
  return markdown
    .split(/\n\s*\n/)
    .filter(
      (p) =>
        !(
          HEADING_RE.test(p) && consumedTitleSet.has(normalizeForMatch(p))
        ),
    )
    .join("\n\n");
}

/** 各组件的默认 DesignIntent（AI 未提供 design 时使用） */
const DEFAULT_DESIGN: Record<string, DesignIntent> = {
  "hero-banner": {
    purpose: "headline",
    emphasis: "high",
    layout: "center",
    tone: "professional",
    spacing: "large",
    headlineSize: "xxl",
  },
  "magazine-cover": {
    purpose: "headline",
    emphasis: "high",
    layout: "center",
    tone: "professional",
    spacing: "large",
    headlineSize: "xxl",
  },
  "section-divider": {
    purpose: "transition",
    emphasis: "medium",
    layout: "center",
    tone: "professional",
    spacing: "normal",
    headlineSize: "xl",
  },
  "section-title": {
    purpose: "transition",
    emphasis: "medium",
    layout: "left",
    tone: "professional",
    spacing: "normal",
    headlineSize: "lg",
  },
  "numbered-heading": {
    purpose: "transition",
    emphasis: "medium",
    layout: "left",
    tone: "professional",
    spacing: "normal",
    headlineSize: "lg",
  },
  "quote-card": {
    purpose: "emphasis",
    emphasis: "medium",
    layout: "left",
    tone: "warm",
    spacing: "normal",
  },
  "full-quote": {
    purpose: "emphasis",
    emphasis: "high",
    layout: "center",
    tone: "bold",
    spacing: "large",
  },
  "stats-block": {
    purpose: "emphasis",
    emphasis: "high",
    layout: "split",
    tone: "bold",
    spacing: "large",
  },
  "callout-pro": {
    purpose: "emphasis",
    emphasis: "medium",
    layout: "left",
    tone: "professional",
    spacing: "normal",
  },
  "cta-card": {
    purpose: "emphasis",
    emphasis: "high",
    layout: "center",
    tone: "bold",
    spacing: "large",
  },
  "toc-nav": {
    purpose: "transition",
    emphasis: "medium",
    layout: "left",
    tone: "professional",
    spacing: "normal",
  },
  "share-card": {
    purpose: "decoration",
    emphasis: "low",
    layout: "center",
    tone: "warm",
    spacing: "normal",
  },
  "end-card": {
    purpose: "summary",
    emphasis: "low",
    layout: "center",
    tone: "warm",
    spacing: "large",
  },
  "article-section": {
    emphasis: "medium",
    layout: "left",
    tone: "minimal",
    spacing: "normal",
  },
  faq: {
    purpose: "emphasis",
    emphasis: "medium",
    layout: "stacked",
    tone: "professional",
    spacing: "normal",
  },
  "two-column-cards": {
    purpose: "emphasis",
    emphasis: "medium",
    layout: "split",
    tone: "professional",
    spacing: "normal",
  },
  "image-card": {
    purpose: "emphasis",
    emphasis: "medium",
    layout: "center",
    tone: "professional",
    spacing: "large",
  },
  "divider-fancy": {
    purpose: "decoration",
    emphasis: "low",
    layout: "center",
    tone: "minimal",
    spacing: "compact",
  },
  "follow-bar": {
    purpose: "emphasis",
    emphasis: "medium",
    layout: "center",
    tone: "professional",
    spacing: "compact",
  },
  "tag-label": {
    purpose: "decoration",
    emphasis: "low",
    layout: "inline",
    tone: "minimal",
    spacing: "compact",
  },
  "code-frame": {
    purpose: "emphasis",
    emphasis: "medium",
    layout: "left",
    tone: "professional",
    spacing: "normal",
  },
  "styled-table": {
    purpose: "emphasis",
    emphasis: "medium",
    layout: "left",
    tone: "professional",
    spacing: "normal",
  },
  // === 新增扩展组件默认设计意图 ===
  "product-card": {
    purpose: "emphasis",
    emphasis: "high",
    layout: "stacked",
    tone: "bold",
    spacing: "normal",
  },
  "brand-sign": {
    purpose: "decoration",
    emphasis: "low",
    layout: "inline",
    tone: "professional",
    spacing: "compact",
  },
  "resource-list": {
    purpose: "summary",
    emphasis: "medium",
    layout: "stacked",
    tone: "professional",
    spacing: "normal",
  },
  "testimonial-card": {
    purpose: "emphasis",
    emphasis: "high",
    layout: "left",
    tone: "warm",
    spacing: "normal",
  },
  "series-nav": {
    purpose: "transition",
    emphasis: "medium",
    layout: "stacked",
    tone: "professional",
    spacing: "normal",
  },
};

/** 当 AI 未提供 design 时，按组件类型推导默认值 */
function getDefaultDesign(component: string): DesignIntent {
  return (
    DEFAULT_DESIGN[component] || {
      emphasis: "medium",
      layout: "left",
      tone: "minimal",
      spacing: "normal",
    }
  );
}

/**
 * 旧模板（v1.x）迁移到 v2.0
 *
 * 为每个 node 补全 design 和 reason 字段。
 * 如果旧模板有 magazineLevel，用它推导 article-section 的 emphasis。
 */
function migrateV1ToV2(template: TemplateJSON): TemplateJSON {
  const isHighMagazine = template.magazineLevel === "high";

  return {
    ...template,
    version: "2.0",
    layout: template.layout.map((node) => ({
      ...node,
      design:
        node.design ||
        (isHighMagazine && node.component === ARTICLE_SECTION
          ? { ...getDefaultDesign(node.component), emphasis: "high" }
          : getDefaultDesign(node.component)),
      reason: node.reason || template.magazineReason || "旧模板迁移",
    })),
  };
}

/**
 * 渲染 Template JSON 为组件 Markdown
 *
 * v2.0: 自动检测模板版本，旧模板（v1.x）先迁移再渲染。
 * isFullCardMode 由 node.design.emphasis 决定，不再依赖全局 magazineLevel。
 *
 * @param template Template JSON 结构化排版方案
 * @param article 用户原文 Markdown
 * @returns 渲染结果（markdown + 警告 + 覆盖率）
 */
export function renderTemplate(
  template: TemplateJSON,
  article: string,
): RenderResult {
  // 旧模板兼容：v1.x 自动迁移到 v2.0
  let tpl = template;
  if (!tpl.version || tpl.version.startsWith("1.")) {
    tpl = migrateV1ToV2(tpl);
  }

  const warnings: string[] = [];
  const outputParts: string[] = [];
  const paragraphRanges: Array<{ from: number; to: number }> = [];

  const total = getParagraphCount(article);

  // 收集被标题组件（section-title 等）消费的标题段。
  // 这些标题段已由组件替代，直接视为"已覆盖"，
  // 避免兜底逻辑把原 `## ` 标题段再次补回正文导致标题重复。
  const consumedTitleSet = new Set(collectConsumedTitles(tpl));
  for (const idx of findConsumedHeadingIndexes(article, consumedTitleSet)) {
    paragraphRanges.push({ from: idx, to: idx });
  }

  for (let i = 0; i < tpl.layout.length; i++) {
    const node = tpl.layout[i];

    if (!node.component) {
      warnings.push(`第 ${i + 1} 个节点缺少 component 字段，已跳过`);
      continue;
    }

    if (node.component === ARTICLE_SECTION) {
      const part = renderArticleSection(
        node,
        article,
        total,
        warnings,
        consumedTitleSet,
      );
      if (part) {
        outputParts.push(part.markdown);
        paragraphRanges.push({ from: part.from, to: part.to });
      }
      continue;
    }

    if (!hasRenderer(node.component)) {
      warnings.push(`未知组件 "${node.component}"，已跳过`);
      continue;
    }

    const markdown = renderComponentNode(node);
    if (markdown) {
      outputParts.push(markdown);
    }
  }

  // 渲染所有显式节点后，检查未覆盖正文段落，自动兜底为 article-section
  // 保证正文一段都不丢（组件抽取不会导致正文丢失）
  const uncoveredRanges = findUncoveredRanges(article, paragraphRanges);
  if (uncoveredRanges.length > 0) {
    for (const range of uncoveredRanges) {
      const part = renderArticleSection(
        {
          component: ARTICLE_SECTION,
          content: { fromParagraph: range.from, toParagraph: range.to },
          design: getDefaultDesign(ARTICLE_SECTION),
          reason: "正文覆盖兜底：自动补全未编排段落",
        },
        article,
        total,
        warnings,
        consumedTitleSet,
      );
      if (part) {
        outputParts.push(part.markdown);
        paragraphRanges.push({ from: part.from, to: part.to });
      }
    }
    warnings.push(
      `补充 ${uncoveredRanges.length} 段未覆盖正文兜底（${uncoveredRanges
        .map((r) => `第${r.from}-${r.to}段`)
        .join("、")}）`,
    );
  }

  const coverage = total > 0 ? calculateCoverage(article, paragraphRanges) : 1;

  return {
    markdown: outputParts.join("\n\n"),
    warnings,
    coverage,
  };
}

/**
 * 渲染普通组件节点
 *
 * Phase 6: 组件形态由当前主题决定，不再注入 variant。
 * node.props 原样透传，AI 输出不带 variant，渲染时用主题默认骨架。
 */
function renderComponentNode(node: LayoutNode): string {
  const renderer = componentRenderers[node.component];
  if (!renderer) return "";

  try {
    const body = renderer(node.content || {});
    // 基础层组件：输出原生 Markdown，不包 ::: 私有语法
    if (NATIVE_COMPONENTS.has(node.component)) {
      return body || "";
    }
    const propsStr = stringifyProps(node.props);
    return wrapComponent(node.component, propsStr, body || " ");
  } catch (e) {
    return "";
  }
}

/**
 * 渲染 article-section 节点
 * 返回渲染后的 markdown 和实际覆盖的段落范围
 *
 * v2.0: 由 node.design.emphasis === "high" 决定是否卡片化正文，
 * 替代旧的 isFullCardMode（magazineLevel === "high"）。
 */
function renderArticleSection(
  node: LayoutNode,
  article: string,
  total: number,
  warnings: string[],
  consumedTitleSet: Set<string>,
): { markdown: string; from: number; to: number } | null {
  const content = (node.content || {}) as unknown as ArticleSectionContent;
  const from = Number(content.fromParagraph) || 1;
  const to = Number(content.toParagraph) || total;

  if (from < 1) {
    warnings.push(`article-section fromParagraph=${from} 小于 1，已修正为 1`);
  }
  if (to > total) {
    warnings.push(
      `article-section toParagraph=${to} 超过总段落数 ${total}，已修正为 ${total}`,
    );
  }

  const result = extractParagraphs(article, from, to);

  if (!result.text) {
    warnings.push(`article-section 段落范围 ${from}-${to} 为空，已跳过`);
    return null;
  }

  // 基础层标题处理：剔除已被 AI 标题组件消费的标题段，其余保持原生 md 语法
  let markdown = stripConsumedHeadings(result.text, consumedTitleSet);

  if (!markdown.trim()) {
    warnings.push(`article-section 段落范围 ${from}-${to} 无正文，已跳过`);
    return null;
  }

  // 基础层不再产任何 ::: 私有语法（包括 text-card 包裹正文）：
  // 正文永远保持原生 Markdown，由解析器 + 主题 CSS 对原生元素上色。
  // 若 AI 需要卡片化正文，应改用真正独立的杂志层组件引用内容区域。

  return {
    markdown,
    from: result.actualFrom,
    to: result.actualTo,
  };
}

/**
 * 校验 Template JSON 是否合法
 * 返回错误信息数组，空数组表示合法
 */
export function validateTemplate(template: TemplateJSON): string[] {
  const errors: string[] = [];

  if (!template || typeof template !== "object") {
    errors.push("template 必须是对象");
    return errors;
  }

  if (!Array.isArray(template.layout)) {
    errors.push("template.layout 必须是数组");
    return errors;
  }

  if (template.layout.length === 0) {
    errors.push("template.layout 不能为空");
  }

  for (let i = 0; i < template.layout.length; i++) {
    const node = template.layout[i];
    const prefix = `layout[${i}]`;

    if (!node.component) {
      errors.push(`${prefix}.component 不能为空`);
      continue;
    }

    if (node.component !== ARTICLE_SECTION && !hasRenderer(node.component)) {
      errors.push(`${prefix}.component "${node.component}" 不支持`);
    }

    if (node.props && typeof node.props !== "object") {
      errors.push(`${prefix}.props 必须是对象`);
    }

    if (!node.content || typeof node.content !== "object") {
      errors.push(`${prefix}.content 必须是对象`);
    }
  }

  return errors;
}
