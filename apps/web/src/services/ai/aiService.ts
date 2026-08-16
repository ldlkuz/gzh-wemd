/**
 * AI 服务(前端直连厂商 API)
 *
 * 架构变更:不再通过 NestJS 后端转发,前端直接调用 OpenAI 兼容 API。
 * - Electron 打包模式:主进程注册 CORS 绕过,可直连任意厂商
 * - 浏览器开发模式:受 CORS 限制,仅支持 OpenRouter(允许跨域)
 *
 * 所有 OpenAI 兼容厂商(DeepSeek/OpenAI/通义/Kimi/智谱/OpenRouter/火山/硅基/Ollama)
 * 均遵循 /v1/chat/completions 协议,这里统一构造请求。
 */
import {
  formatAiHttpError,
  getAiConfig,
  validateAiConfig,
  type AiProviderConfig,
} from "./aiConfig";
import { buildTextToMarkdownPrompt } from "./aiPrompts";

export interface TextToMarkdownParams {
  /** 待转换的纯文本 */
  text: string;
  /** 转换模式: full=整篇, selection=选区 */
  mode: "full" | "selection";
  /** 可选附加指令 */
  instruction?: string;
}

/** 规范化 baseUrl:去末尾斜杠 */
function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/+$/, "");
}

/** 构造 chat/completions 请求 URL */
function chatCompletionsUrl(baseUrl: string): string {
  const base = normalizeBaseUrl(baseUrl);
  // DeepSeek 官方 baseUrl 是 https://api.deepseek.com (不带 /v1),
  // 其 chat 端点是 /chat/completions;其他厂商通常 baseUrl 已含 /v1
  // 统一拼接 /chat/completions,DeepSeek 的 /chat/completions 也能用
  if (base.endsWith("/v1")) {
    return `${base}/chat/completions`;
  }
  // 不含 /v1 的情况(如 DeepSeek),补上 /v1
  // 注意:DeepSeek 文档说 https://api.deepseek.com 和 https://api.deepseek.com/v1 等价
  return `${base}/v1/chat/completions`;
}

/** 构造 models 列表请求 URL */
export function modelsListUrl(baseUrl: string): string {
  const base = normalizeBaseUrl(baseUrl);
  if (base.endsWith("/v1")) {
    return `${base}/models`;
  }
  return `${base}/v1/models`;
}

/** 构造请求头 */
function buildHeaders(config: AiProviderConfig): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (config.apiKey.trim()) {
    headers["Authorization"] = `Bearer ${config.apiKey.trim()}`;
  }
  // OpenRouter 推荐带这两个头(排名/统计),其他厂商会忽略
  if (config.baseUrl.includes("openrouter.ai")) {
    headers["HTTP-Referer"] = "https://wemd.app";
    headers["X-Title"] = "WeMD";
  }
  return headers;
}

/**
 * 纯文本 → Markdown
 * 调用 chat/completions(非流式),取完整返回
 */
export async function textToMarkdown(
  params: TextToMarkdownParams,
): Promise<string> {
  const config = getAiConfig();
  const configError = validateAiConfig(config);
  if (configError) {
    throw new Error(configError);
  }

  const systemPrompt = buildTextToMarkdownPrompt(params.mode);
  const userContent = params.instruction
    ? `${params.instruction}\n\n---\n\n${params.text}`
    : params.text;

  const url = chatCompletionsUrl(config.baseUrl);
  const resp = await fetch(url, {
    method: "POST",
    headers: buildHeaders(config),
    body: JSON.stringify({
      model: config.model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ],
      temperature: 0.3,
      stream: false,
    }),
  });

  if (!resp.ok) {
    const errText = await resp.text().catch(() => resp.statusText);
    throw new Error(formatAiHttpError(config.baseUrl, resp.status, errText));
  }

  const data = await resp.json();
  const markdown = data.choices?.[0]?.message?.content?.trim();
  if (!markdown) {
    throw new Error("模型返回内容为空");
  }
  return markdown;
}

/**
 * 测试连接:发一条极短请求验证配置
 */
export async function testConnection(
  config: AiProviderConfig,
): Promise<{ success: boolean; message: string }> {
  const configError = validateAiConfig(config);
  if (configError) {
    return { success: false, message: configError };
  }

  try {
    const url = chatCompletionsUrl(config.baseUrl);
    const resp = await fetch(url, {
      method: "POST",
      headers: buildHeaders(config),
      body: JSON.stringify({
        model: config.model,
        messages: [{ role: "user", content: "你好" }],
        max_tokens: 10,
        stream: false,
      }),
    });

    if (resp.ok) {
      return { success: true, message: "连接成功" };
    }
    const errText = await resp.text().catch(() => resp.statusText);
    return {
      success: false,
      message: formatAiHttpError(config.baseUrl, resp.status, errText),
    };
  } catch (e) {
    return { success: false, message: (e as Error).message || String(e) };
  }
}
