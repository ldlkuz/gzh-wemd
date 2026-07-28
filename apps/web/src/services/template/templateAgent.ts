/**
 * Template JSON AI 生成器
 *
 * 单阶段调用 LLM，直接生成 Template JSON。
 * 然后用 validateTemplate 做合法性校验，确保输出可被 Renderer 正确消费。
 */
import {
  formatAiHttpError,
  getAiConfig,
  validateAiConfig,
} from "../ai/aiConfig";
import { buildTemplatePrompt } from "./templatePrompt";
import { renderTemplate, validateTemplate } from "./renderer";
import type { RenderResult } from "./types";
import type { TemplateJSON, LayoutNode } from "./types";
import { getParagraphCount } from "./contentExtractor";
import { AI_GENERATABLE_COMPONENTS } from "./componentSchemas";

import type { MagazineLevel } from "./types";
import type { Audience, DesignConstraints } from "../ai/analysisAgent";

/** AI 生成的原始响应结构 */
interface AiTemplateResponse {
  articleType: string;
  typeReason: string;
  magazineLevel?: string;
  magazineReason?: string;
  layout: LayoutNode[];
}

/** Template 生成结果 */
export interface TemplateGenerationResult {
  /** 生成的 Template JSON（经校验和修复） */
  template: TemplateJSON;
  /** 识别出的文章类型 */
  articleType: string;
  /** 类型识别理由 */
  typeReason: string;
  /** 杂志化等级 */
  magazineLevel: MagazineLevel;
  /** 杂志化理由 */
  magazineReason: string;
  /** 渲染结果（可直接用于预览） */
  rendered: RenderResult;
  /** 校验警告/错误（已修复） */
  warnings: string[];
}

/** 解析 AI 返回的 JSON */
function parseTemplateResponse(content: string): AiTemplateResponse | null {
  let text = content.trim();
  if (text.startsWith("```")) {
    text = text.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");
  }
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;

  try {
    const parsed = JSON.parse(jsonMatch[0]);
    if (!parsed.layout || !Array.isArray(parsed.layout)) return null;

    return {
      articleType:
        typeof parsed.articleType === "string" ? parsed.articleType : "unknown",
      typeReason:
        typeof parsed.typeReason === "string" ? parsed.typeReason : "",
      magazineLevel:
        typeof parsed.magazineLevel === "string"
          ? parsed.magazineLevel
          : undefined,
      magazineReason:
        typeof parsed.magazineReason === "string" ? parsed.magazineReason : "",
      layout: parsed.layout.filter(
        (item: { component?: unknown }) =>
          item.component && typeof item.component === "string",
      ),
    };
  } catch {
    return null;
  }
}

/** 修复 AI 生成的 Template JSON：过滤不支持的组件、修复越界段落等 */
function sanitizeTemplate(
  template: TemplateJSON,
  totalParagraphs: number,
): { template: TemplateJSON; warnings: string[] } {
  const warnings: string[] = [];
  const cleanedLayout: LayoutNode[] = [];

  for (const node of template.layout) {
    // 过滤不支持的组件
    if (!AI_GENERATABLE_COMPONENTS.includes(node.component)) {
      warnings.push(`跳过不支持的组件: ${node.component}`);
      continue;
    }

    // article-section 越界修复
    if (node.component === "article-section") {
      const content = (node.content || {}) as Record<string, unknown>;
      let from = Number(content.fromParagraph) || 1;
      let to = Number(content.toParagraph) || totalParagraphs;

      if (from < 1) {
        warnings.push(`article-section fromParagraph=${from} 越界，修正为 1`);
        from = 1;
      }
      if (to > totalParagraphs) {
        warnings.push(
          `article-section toParagraph=${to} 越界，修正为 ${totalParagraphs}`,
        );
        to = totalParagraphs;
      }
      if (from > to) {
        warnings.push(`article-section from=${from} > to=${to}，跳过`);
        continue;
      }

      cleanedLayout.push({
        ...node,
        content: { fromParagraph: from, toParagraph: to },
      });
    } else {
      cleanedLayout.push(node);
    }
  }

  return {
    template: { ...template, layout: cleanedLayout },
    warnings,
  };
}

/** 规范化 baseUrl：去末尾斜杠 */
function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/+$/, "");
}

/** 构造 chat/completions 请求 URL */
function chatCompletionsUrl(baseUrl: string): string {
  const base = normalizeBaseUrl(baseUrl);
  if (base.endsWith("/v1")) {
    return `${base}/chat/completions`;
  }
  return `${base}/v1/chat/completions`;
}

/** 构造请求头 */
function buildHeaders(apiKey: string, baseUrl: string): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (apiKey.trim()) {
    headers["Authorization"] = `Bearer ${apiKey.trim()}`;
  }
  if (baseUrl.includes("openrouter.ai")) {
    headers["HTTP-Referer"] = "https://wemd.app";
    headers["X-Title"] = "WeMD";
  }
  return headers;
}

/** 单次 LLM 调用 */
async function callLLM(
  systemPrompt: string,
  userContent: string,
  temperature: number,
): Promise<string> {
  const config = getAiConfig();
  const configError = validateAiConfig(config);
  if (configError) {
    throw new Error(configError);
  }

  const url = chatCompletionsUrl(config.baseUrl);
  const resp = await fetch(url, {
    method: "POST",
    headers: buildHeaders(config.apiKey, config.baseUrl),
    body: JSON.stringify({
      model: config.model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ],
      temperature,
      stream: false,
    }),
  });

  if (!resp.ok) {
    const errText = await resp.text().catch(() => resp.statusText);
    throw new Error(formatAiHttpError(config.baseUrl, resp.status, errText));
  }

  const data = await resp.json();
  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new Error("模型返回内容为空");
  }
  return content;
}

/**
 * 生成文章的 Template JSON
 *
 * @param markdown 原文 Markdown
 * @param articleTypeHint 可选，用户指定的文章类型
 * @param themeLayout 可选，当前主题的 layout 偏好（Phase 3 新增）
 */
export async function generateTemplate(
  markdown: string,
  articleTypeHint?: string,
  themeLayout?: import("@wemd/core").LayoutPreference,
  audience?: Audience,
  constraints?: DesignConstraints,
): Promise<TemplateGenerationResult> {
  const totalParagraphs = getParagraphCount(markdown);

  // 文章过短：返回纯 article-section 模板
  if (totalParagraphs < 3 || markdown.length < 100) {
    const template: TemplateJSON = {
      articleType: "unknown",
      magazineLevel: "low",
      magazineReason: "文章过短，不适合杂志化排版",
      layout: [
        {
          component: "article-section",
          content: { fromParagraph: 1, toParagraph: totalParagraphs },
        },
      ],
    };
    const rendered = renderTemplate(template, markdown);
    return {
      template,
      articleType: "unknown",
      typeReason: "文章过短，不适合复杂版式",
      magazineLevel: "low",
      magazineReason: "文章过短，不适合杂志化排版",
      rendered,
      warnings: ["文章过短，使用默认全文模板"],
    };
  }

  const systemPrompt = buildTemplatePrompt(
    totalParagraphs,
    articleTypeHint,
    themeLayout,
    audience,
    constraints,
  );
  const aiContent = await callLLM(systemPrompt, markdown, 0.6);

  const parsed = parseTemplateResponse(aiContent);
  if (!parsed) {
    // AI 返回解析失败：降级为纯 article-section
    const template: TemplateJSON = {
      articleType: "unknown",
      magazineLevel: "medium",
      magazineReason: "AI 返回格式异常，使用默认中等杂志化等级",
      layout: [
        {
          component: "article-section",
          content: { fromParagraph: 1, toParagraph: totalParagraphs },
        },
      ],
    };
    const rendered = renderTemplate(template, markdown);
    return {
      template,
      articleType: "unknown",
      typeReason: "AI 返回格式异常，使用默认全文模板",
      magazineLevel: "medium",
      magazineReason: "AI 返回格式异常，使用默认中等杂志化等级",
      rendered,
      warnings: ["AI 返回格式异常，降级为默认模板"],
    };
  }

  // 规范化 magazineLevel
  const validLevels: MagazineLevel[] = ["high", "medium", "low"];
  const magazineLevel: MagazineLevel = validLevels.includes(
    parsed.magazineLevel as MagazineLevel,
  )
    ? (parsed.magazineLevel as MagazineLevel)
    : "medium";

  // 构造 Template JSON
  let template: TemplateJSON = {
    articleType: parsed.articleType,
    magazineLevel,
    magazineReason: parsed.magazineReason || "",
    meta: {},
    layout: parsed.layout,
  };

  // 修复和清洗
  const sanitized = sanitizeTemplate(template, totalParagraphs);
  template = sanitized.template;
  const allWarnings = [...sanitized.warnings];

  // 合法性校验
  const errors = validateTemplate(template);
  if (errors.length > 0) {
    allWarnings.push(...errors.map((e) => `校验错误: ${e}`));
  }

  // 如果 layout 为空（所有组件都被过滤了），降级为全文
  if (template.layout.length === 0) {
    template = {
      articleType: "unknown",
      magazineLevel: "medium",
      magazineReason: "layout 为空，降级为默认中等杂志化等级",
      layout: [
        {
          component: "article-section",
          content: { fromParagraph: 1, toParagraph: totalParagraphs },
        },
      ],
    };
    allWarnings.push("layout 为空，降级为默认全文模板");
  }

  // 渲染为 Markdown
  const rendered = renderTemplate(template, markdown);

  return {
    template,
    articleType: parsed.articleType,
    typeReason: parsed.typeReason,
    magazineLevel,
    magazineReason: parsed.magazineReason || "",
    rendered,
    warnings: allWarnings,
  };
}
