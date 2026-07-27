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
import {
  buildTextToMarkdownPrompt,
  buildThemePrompt,
  buildThemeJsonPrompt,
  buildThemeRefinePrompt,
  buildDescriptionRefinePrompt,
  sanitizeCss,
} from "./aiPrompts";

export interface TextToMarkdownParams {
  /** 待转换的纯文本 */
  text: string;
  /** 转换模式: full=整篇, selection=选区 */
  mode: "full" | "selection";
  /** 可选附加指令 */
  instruction?: string;
}

export interface GenerateThemeParams {
  /** 主题风格的自然语言描述 */
  description: string;
  /** 可选:基础主题 CSS,基于此风格调整 */
  baseThemeCss?: string;
  /** Phase 3: 使用 JSON 格式 prompt（输出 ThemeDefinition JSON） */
  useJson?: boolean;
}

export interface RefineThemeParams {
  /** 当前主题 JSON 字符串 */
  currentJson: string;
  /** 用户微调意见 */
  feedback: string;
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

/** 解析 OpenAI SSE 流的一行,提取增量文本 */
function parseSseChunk(line: string): string {
  if (!line.startsWith("data:")) return "";
  const data = line.slice(5).trim();
  if (data === "[DONE]") return "";
  try {
    const parsed = JSON.parse(data);
    // OpenAI 标准格式:choices[0].delta.content
    return parsed.choices?.[0]?.delta?.content ?? "";
  } catch {
    return "";
  }
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

/**
 * 自然语言描述 → 主题 CSS (非流式)
 */
export async function generateTheme(
  params: GenerateThemeParams,
): Promise<string> {
  const config = getAiConfig();
  const configError = validateAiConfig(config);
  if (configError) {
    throw new Error(configError);
  }

  const systemPrompt = params.useJson
    ? buildThemeJsonPrompt()
    : buildThemePrompt();
  const userParts: string[] = [params.description];
  if (params.baseThemeCss?.trim()) {
    userParts.push(
      "--- 基础主题 CSS(请在此基础上调整风格,保留选择器结构)---",
      params.baseThemeCss.trim(),
    );
  }

  const url = chatCompletionsUrl(config.baseUrl);
  const resp = await fetch(url, {
    method: "POST",
    headers: buildHeaders(config),
    body: JSON.stringify({
      model: config.model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userParts.join("\n\n") },
      ],
      temperature: 0.7,
      stream: false,
    }),
  });

  if (!resp.ok) {
    const errText = await resp.text().catch(() => resp.statusText);
    throw new Error(formatAiHttpError(config.baseUrl, resp.status, errText));
  }

  const data = await resp.json();
  const raw = data.choices?.[0]?.message?.content ?? "";
  const css = sanitizeCss(raw);
  if (!css.trim()) {
    throw new Error("模型未返回有效 CSS");
  }
  return css;
}

/**
 * 自然语言描述 → 主题 CSS (流式,实时回调已生成片段)
 *
 * 使用 SSE (Server-Sent Events) 流式接收,
 * 逐 chunk 回调,最终返回清洗后的完整 CSS。
 */
export async function generateThemeStream(
  params: GenerateThemeParams,
  onChunk: (accumulated: string, delta: string) => void,
  signal?: AbortSignal,
): Promise<string> {
  const config = getAiConfig();
  const configError = validateAiConfig(config);
  if (configError) {
    throw new Error(configError);
  }

  const systemPrompt = params.useJson
    ? buildThemeJsonPrompt()
    : buildThemePrompt();
  const userParts: string[] = [params.description];
  if (params.baseThemeCss?.trim()) {
    userParts.push(
      "--- 基础主题 CSS(请在此基础上调整风格,保留选择器结构)---",
      params.baseThemeCss.trim(),
    );
  }

  const url = chatCompletionsUrl(config.baseUrl);
  const resp = await fetch(url, {
    method: "POST",
    headers: buildHeaders(config),
    body: JSON.stringify({
      model: config.model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userParts.join("\n\n") },
      ],
      temperature: 0.7,
      stream: true,
    }),
    signal,
  });

  if (!resp.ok) {
    const errText = await resp.text().catch(() => resp.statusText);
    throw new Error(formatAiHttpError(config.baseUrl, resp.status, errText));
  }

  const reader = resp.body?.getReader();
  if (!reader) {
    // 不支持流式时回退到非流式
    return generateTheme(params);
  }

  const decoder = new TextDecoder();
  let accumulated = "";
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    // SSE 以换行分隔,逐行解析
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? ""; // 最后一行可能不完整,留到下次

    for (const line of lines) {
      const delta = parseSseChunk(line);
      if (delta) {
        accumulated += delta;
        onChunk(accumulated, delta);
      }
    }
  }

  // 处理 buffer 中剩余的最后一行
  if (buffer) {
    const delta = parseSseChunk(buffer);
    if (delta) {
      accumulated += delta;
      onChunk(accumulated, delta);
    }
  }

  // 流式返回的是原始文本,JSON 模式不需要 CSS 清洗
  return params.useJson ? accumulated.trim() : sanitizeCss(accumulated);
}

/**
 * 主题微调：对话式迭代
 * 传入当前 Theme JSON + 用户反馈 → AI 返回修改后的 JSON（非流式）
 */
export async function refineTheme(params: RefineThemeParams): Promise<string> {
  const config = getAiConfig();
  const configError = validateAiConfig(config);
  if (configError) {
    throw new Error(configError);
  }

  const systemPrompt = buildThemeRefinePrompt(
    params.currentJson,
    params.feedback,
  );

  const url = chatCompletionsUrl(config.baseUrl);
  const resp = await fetch(url, {
    method: "POST",
    headers: buildHeaders(config),
    body: JSON.stringify({
      model: config.model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: params.feedback },
      ],
      temperature: 0.5,
      stream: false,
    }),
  });

  if (!resp.ok) {
    const errText = await resp.text().catch(() => resp.statusText);
    throw new Error(formatAiHttpError(config.baseUrl, resp.status, errText));
  }

  const data = await resp.json();
  const raw = data.choices?.[0]?.message?.content ?? "";
  if (!raw.trim()) {
    throw new Error("模型返回内容为空");
  }
  return raw.trim();
}

/**
 * 润色用户主题描述：口语化 → 专业设计术语
 */
export async function refineDescription(userInput: string): Promise<string> {
  const config = getAiConfig();
  const configError = validateAiConfig(config);
  if (configError) {
    throw new Error(configError);
  }

  const systemPrompt = buildDescriptionRefinePrompt(userInput);

  const url = chatCompletionsUrl(config.baseUrl);
  const resp = await fetch(url, {
    method: "POST",
    headers: buildHeaders(config),
    body: JSON.stringify({
      model: config.model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userInput },
      ],
      temperature: 0.5,
      stream: false,
    }),
  });

  if (!resp.ok) {
    const errText = await resp.text().catch(() => resp.statusText);
    throw new Error(formatAiHttpError(config.baseUrl, resp.status, errText));
  }

  const data = await resp.json();
  const result = data.choices?.[0]?.message?.content?.trim();
  if (!result) {
    throw new Error("模型返回内容为空");
  }
  return result;
}
