/**
 * Template JSON 渲染器
 *
 * 把 Template JSON + 用户原文 → 组件 Markdown（含 ::: 语法）
 * 走现有 markdown-it-component + 主题 CSS + juice 内联管线。
 */

import type {
  TemplateJSON,
  LayoutNode,
  RenderResult,
  ArticleSectionContent,
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
 * 渲染 Template JSON 为组件 Markdown
 *
 * @param template Template JSON 结构化排版方案
 * @param article 用户原文 Markdown
 * @returns 渲染结果（markdown + 警告 + 覆盖率）
 */
export function renderTemplate(
  template: TemplateJSON,
  article: string,
): RenderResult {
  const warnings: string[] = [];
  const outputParts: string[] = [];
  const paragraphRanges: Array<{ from: number; to: number }> = [];

  const total = getParagraphCount(article);
  const isFullCardMode = template.magazineLevel === "high";

  for (let i = 0; i < template.layout.length; i++) {
    const node = template.layout[i];

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
        isFullCardMode,
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

  const coverage = total > 0 ? calculateCoverage(article, paragraphRanges) : 1;

  return {
    markdown: outputParts.join("\n\n"),
    warnings,
    coverage,
  };
}

/**
 * 渲染普通组件节点
 */
function renderComponentNode(node: LayoutNode): string {
  const renderer = componentRenderers[node.component];
  if (!renderer) return "";

  try {
    const body = renderer(node.content || {});
    const propsStr = stringifyProps(node.props);
    return wrapComponent(node.component, propsStr, body || " ");
  } catch (e) {
    return "";
  }
}

/**
 * 渲染 article-section 节点
 * 返回渲染后的 markdown 和实际覆盖的段落范围
 */
function renderArticleSection(
  node: LayoutNode,
  article: string,
  total: number,
  warnings: string[],
  isFullCardMode = false,
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

  if (isFullCardMode) {
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
