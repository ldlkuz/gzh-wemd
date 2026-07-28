/**
 * Template JSON 渲染器
 *
 * 把 Template JSON + 用户原文 → 组件 Markdown（含 ::: 语法）
 * 走现有 markdown-it-component + 主题 CSS + juice 内联管线。
 *
 * v2.0: 新增 resolveVariant() 和 getDefaultDesign()，
 * Renderer 根据 node.design 自动推导 variant，AI 不再直接指定 variant。
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
  extractParagraphs,
  calculateCoverage,
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
 * DesignIntent → Variant 映射
 *
 * 根据 design 字段自动选择已有 variant 名称。
 * 映射到现有 variantCss.ts 中已实现的 variant，不产生新 variant。
 */
function resolveVariant(
  component: string,
  design?: DesignIntent,
): string | null {
  if (!design) return null;

  if (component === "hero-banner") {
    if (design.emphasis === "high" && design.layout === "center")
      return "center";
    if (design.layout === "left") return "left";
    if (design.spacing === "compact" || design.emphasis === "low")
      return "minimal";
    return "center";
  }

  if (component === "callout-pro") {
    if (design.emphasis === "high" || design.tone === "bold") return "bg";
    if (design.emphasis === "low" || design.tone === "minimal")
      return "minimal";
    return null; // 默认 border
  }

  if (component === "section-divider") {
    if (design.emphasis === "high" || design.tone === "bold") return "bold";
    if (design.tone === "warm" || design.tone === "playful") return "dots";
    return "line";
  }

  if (component === "end-card") {
    if (design.tone === "warm") return "warm";
    if (design.tone === "minimal" || design.emphasis === "low")
      return "minimal";
    return "centered";
  }

  // 其他组件目前无 variant，日后扩展
  return null;
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

  for (let i = 0; i < tpl.layout.length; i++) {
    const node = tpl.layout[i];

    if (!node.component) {
      warnings.push(`第 ${i + 1} 个节点缺少 component 字段，已跳过`);
      continue;
    }

    if (node.component === ARTICLE_SECTION) {
      const part = renderArticleSection(node, article, total, warnings);
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
 * v2.0: 调用 resolveVariant() 自动注入 variant 到 props。
 * AI 显式指定的 variant 优先，未指定时由 design 推导。
 */
function renderComponentNode(node: LayoutNode): string {
  const renderer = componentRenderers[node.component];
  if (!renderer) return "";

  try {
    const body = renderer(node.content || {});

    // 自动根据 design 解析 variant
    const variant = resolveVariant(node.component, node.design);

    // 合并 props：用户显式指定的优先，没有则用自动解析的 variant
    const mergedProps = { ...(node.props || {}) };
    if (variant && !mergedProps.variant) {
      mergedProps.variant = variant;
    }

    const propsStr = stringifyProps(mergedProps);
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

  let markdown = result.text;

  // 根据 design.emphasis 决定是否卡片化正文
  if (node.design?.emphasis === "high") {
    markdown = wrapComponent("text-card", "", markdown);
  }

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
