/**
 * Template JSON AI 生成器
 *
 * 单阶段调用 LLM，直接生成 Template JSON。
 * 然后用 validateTemplate 做合法性校验，确保输出可被 Renderer 正确消费。
 *
 * v2.0: AI 输出 design + reason + role 字段，不再输出 articleType/magazineLevel。
 * 旧格式（AI 仍返回 articleType/magazineLevel）会被兼容处理。
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

import type { MagazineLevel, DesignIntent, ContentRole } from "./types";
import type { Audience, DesignConstraints } from "../ai/types";

/** AI 生成的原始响应结构（v2.0） */
interface AiTemplateResponse {
  /** @deprecated v2.0 起 AI 不再输出，兼容旧格式 */
  articleType?: string;
  /** @deprecated v2.0 起 AI 不再输出，兼容旧格式 */
  typeReason?: string;
  /** @deprecated v2.0 起 AI 不再输出，兼容旧格式 */
  magazineLevel?: string;
  /** @deprecated v2.0 起 AI 不再输出，兼容旧格式 */
  magazineReason?: string;
  layout: LayoutNode[];
}

/** Template 生成结果 */
export interface TemplateGenerationResult {
  /** 生成的 Template JSON（经校验和修复） */
  template: TemplateJSON;
  /** @deprecated v2.0 起始终为 "unknown" */
  articleType: string;
  /** @deprecated v2.0 起始终为 "" */
  typeReason: string;
  /** @deprecated v2.0 起始终为 "medium" */
  magazineLevel: MagazineLevel;
  /** @deprecated v2.0 起始终为 "" */
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
      // 兼容旧格式：如果 AI 仍返回这些字段，保留但不使用
      articleType:
        typeof parsed.articleType === "string" ? parsed.articleType : undefined,
      typeReason:
        typeof parsed.typeReason === "string" ? parsed.typeReason : undefined,
      magazineLevel:
        typeof parsed.magazineLevel === "string"
          ? parsed.magazineLevel
          : undefined,
      magazineReason:
        typeof parsed.magazineReason === "string"
          ? parsed.magazineReason
          : undefined,
      layout: parsed.layout.filter(
        (item: { component?: unknown }) =>
          item.component && typeof item.component === "string",
      ),
    };
  } catch {
    return null;
  }
}

/** 合法 role 值列表 */
const VALID_ROLES: ContentRole[] = [
  "opening",
  "summary",
  "transition",
  "evidence",
  "case",
  "conclusion",
  "cta",
];

/** 合法 design 字段值校验 */
const VALID_DESIGN_VALUES = {
  purpose: ["headline", "emphasis", "transition", "summary", "decoration"],
  emphasis: ["high", "medium", "low"],
  layout: ["center", "left", "stacked", "split", "inline"],
  tone: ["professional", "warm", "minimal", "bold", "playful"],
  spacing: ["large", "normal", "compact"],
  headlineSize: ["xxl", "xl", "lg", "md"],
} as const;

/** 清洗 design 字段：移除非法值 */
function sanitizeDesign(design: unknown): DesignIntent | undefined {
  if (!design || typeof design !== "object") return undefined;
  const d = design as Record<string, unknown>;
  const result: DesignIntent = {};
  let hasValid = false;

  for (const [key, validValues] of Object.entries(VALID_DESIGN_VALUES)) {
    if (
      key in d &&
      typeof d[key] === "string" &&
      (validValues as readonly string[]).includes(d[key] as string)
    ) {
      (result as Record<string, unknown>)[key] = d[key];
      hasValid = true;
    }
  }
  return hasValid ? result : undefined;
}

/** 清洗 role 字段 */
function sanitizeRole(role: unknown): ContentRole | undefined {
  if (typeof role === "string" && VALID_ROLES.includes(role as ContentRole)) {
    return role as ContentRole;
  }
  return undefined;
}

/** 修复 AI 生成的 Template JSON：过滤不支持的组件、修复越界段落、清洗 design/role 字段 */
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

    // 清洗 design 字段（v2.0 新增）
    const cleanedDesign = sanitizeDesign(node.design);

    // 清洗 role 字段（v2.0 新增）
    const cleanedRole = sanitizeRole(node.role);

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
        design: cleanedDesign,
        role: cleanedRole,
      });
    } else {
      cleanedLayout.push({
        ...node,
        design: cleanedDesign,
        role: cleanedRole,
      });
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

/** 构造降级模板（文章过短 / AI 异常 / layout 为空） */
function fallbackTemplate(
  totalParagraphs: number,
  reason: string,
): TemplateJSON {
  return {
    version: "2.0",
    layout: [
      {
        component: "article-section",
        content: { fromParagraph: 1, toParagraph: totalParagraphs },
        design: {
          emphasis: "medium",
          layout: "left",
          tone: "minimal",
          spacing: "normal",
        },
        reason,
      },
    ],
  };
}

/** 构造降级结果（保持 TemplateGenerationResult 结构兼容） */
function fallbackResult(
  template: TemplateJSON,
  rendered: RenderResult,
  warnings: string[],
): TemplateGenerationResult {
  return {
    template,
    articleType: "unknown",
    typeReason: "",
    magazineLevel: "medium",
    magazineReason: "",
    rendered,
    warnings,
  };
}

/**
 * 生成文章的 Template JSON
 *
 * v2.0: AI 输出 design + reason + role 字段。
 * 旧格式（AI 返回 articleType/magazineLevel）会被兼容处理。
 *
 * @param markdown 原文 Markdown
 * @param _articleTypeHint 已废弃，保留参数兼容调用方
 * @param themeLayout 可选，当前主题的 layout 偏好
 * @param audience 可选，读者画像
 * @param constraints 可选，设计目标约束（安全上限 + 设计倾向）
 */
export async function generateTemplate(
  markdown: string,
  _articleTypeHint?: string,
  themeLayout?: import("@wemd/core").LayoutPreference,
  audience?: Audience,
  constraints?: DesignConstraints,
): Promise<TemplateGenerationResult> {
  const totalParagraphs = getParagraphCount(markdown);

  // 文章过短：返回纯 article-section 模板
  if (totalParagraphs < 3 || markdown.length < 100) {
    const template = fallbackTemplate(
      totalParagraphs,
      "文章过短，使用纯文本模式",
    );
    const rendered = renderTemplate(template, markdown);
    return fallbackResult(template, rendered, ["文章过短，使用默认全文模板"]);
  }

  const systemPrompt = buildTemplatePrompt(
    totalParagraphs,
    undefined,
    themeLayout,
    audience,
    constraints,
  );
  const aiContent = await callLLM(systemPrompt, markdown, 0.6);

  const parsed = parseTemplateResponse(aiContent);
  if (!parsed) {
    // AI 返回解析失败：降级为纯 article-section
    const template = fallbackTemplate(
      totalParagraphs,
      "AI 返回格式异常，使用默认模板",
    );
    const rendered = renderTemplate(template, markdown);
    return fallbackResult(template, rendered, [
      "AI 返回格式异常，降级为默认模板",
    ]);
  }

  // 构造 Template JSON（v2.0 结构）
  let template: TemplateJSON = {
    version: "2.0",
    layout: parsed.layout,
  };

  // 修复和清洗（含 design/role 字段清洗）
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
    template = fallbackTemplate(totalParagraphs, "layout 为空，使用默认模板");
    allWarnings.push("layout 为空，降级为默认全文模板");
  }

  // 渲染为 Markdown
  const rendered = renderTemplate(template, markdown);

  return fallbackResult(template, rendered, allWarnings);
}
