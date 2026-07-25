/**
 * AI 配置存储(本地 localStorage)
 * 前端直连 AI 服务商,配置仅保存在本地
 */

export interface AiProviderConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
}

export type ProviderCategory =
  | "recommended"
  | "domestic"
  | "free-local"
  | "other"
  | "custom";

const STORAGE_KEY = "aiProviderConfig";
const API_KEYS_STORAGE_KEY = "aiProviderApiKeys";
/** 动态拉取的模型列表缓存(按 baseUrl 索引) */
const MODELS_CACHE_KEY = "aiModelsCache";

/** 服务商预设(2026-07 更新,数据来源各厂商官方文档)
 *  models 为该服务商可选模型列表(按推荐度排序,第一个为默认);
 *  留空数组表示纯自定义,用户手动输入。
 *  supportsDynamicFetch=true 表示支持 GET /v1/models 动态拉取模型列表
 */
export interface ProviderPreset {
  name: string;
  category: ProviderCategory;
  baseUrl: string;
  /** 默认模型(models[0]) */
  model: string;
  /** 内置可选模型列表(作为兜底,动态拉取失败时使用) */
  models: string[];
  /** 是否支持通过 GET {baseUrl}/models 动态拉取模型列表 */
  supportsDynamicFetch?: boolean;
  /** 服务商说明(显示在 UI 上) */
  description?: string;
  /** 是否必须填写 API Key */
  apiKeyRequired?: boolean;
}

export const PROVIDER_PRESETS: ProviderPreset[] = [
  // OpenRouter: 300+ 模型聚合平台,含 17 个免费模型(后缀 :free)
  // 支持 GET /api/v1/models 动态拉取,无需 API Key 即可获取清单
  // 来源: https://openrouter.ai/docs#models
  {
    name: "OpenRouter",
    category: "free-local",
    baseUrl: "https://openrouter.ai/api/v1",
    model: "deepseek/deepseek-chat-v3.1:free",
    models: [
      "deepseek/deepseek-chat-v3.1:free",
      "deepseek/deepseek-r1:free",
      "meta-llama/llama-3.3-70b-instruct:free",
      "qwen/qwen-2.5-72b-instruct:free",
      "google/gemini-2.0-flash-exp:free",
    ],
    supportsDynamicFetch: true,
    description: "聚合 300+ 模型,含 17 款免费(无需付费即可使用)",
  },
  // DeepSeek: 官方推荐 base_url 不带 /v1,文档示例 curl https://api.deepseek.com/chat/completions
  // deepseek-chat 2026/07/24 弃用,对应 v4-flash 非思考模式
  // 来源: https://api-docs.deepseek.com/zh-cn/
  {
    name: "DeepSeek",
    category: "recommended",
    baseUrl: "https://api.deepseek.com",
    model: "deepseek-v4-flash",
    models: ["deepseek-v4-flash", "deepseek-v4-pro"],
    supportsDynamicFetch: true,
    description: "国内主流,性价比高,适合大多数用户",
  },
  // OpenAI: 旗舰 gpt-5.5;mini 性价比高($0.75/$4.50 per MTok)
  // 来源: https://platform.openai.com/docs/models
  {
    name: "OpenAI",
    category: "other",
    baseUrl: "https://api.openai.com/v1",
    model: "gpt-5.4-mini",
    models: ["gpt-5.5", "gpt-5.4", "gpt-5.4-mini", "gpt-5.4-nano"],
    supportsDynamicFetch: true,
  },
  // 通义千问: Qwen3.6 系列,max-preview 最强但预览版;plus 稳定;flash 低价
  // 来源: https://help.aliyun.com/zh/model-studio/get-started-with-models (更新 2026-05-20)
  {
    name: "通义千问",
    category: "recommended",
    baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    model: "qwen3.6-max-preview",
    models: ["qwen3.6-max-preview", "qwen3.6-plus", "qwen3.6-flash"],
    supportsDynamicFetch: true,
    description: "阿里云生态,国内接入顺手",
  },
  // Kimi: K2.6 最新旗舰(多模态);K2.5/K2 次之;moonshot-v1 经典系列
  // 来源: https://platform.moonshot.cn/docs/intro + https://platform.kimi.com/docs/pricing/chat
  {
    name: "Kimi",
    category: "recommended",
    baseUrl: "https://api.moonshot.cn/v1",
    model: "kimi-k2.6",
    models: [
      "kimi-k2.6",
      "kimi-k2.5",
      "kimi-k2-0905-preview",
      "kimi-k2-turbo-preview",
      "moonshot-v1-8k",
      "moonshot-v1-32k",
      "moonshot-v1-128k",
    ],
    supportsDynamicFetch: true,
    description: "中文体验好,长文本能力强",
  },
  // 智谱 GLM: glm-5.2 最新旗舰(1M 上下文);glm-4.7-flash 免费
  // 来源: https://docs.bigmodel.cn/cn/guide/start/model-overview + https://open.bigmodel.cn/pricing
  {
    name: "智谱 GLM",
    category: "domestic",
    baseUrl: "https://open.bigmodel.cn/api/paas/v4",
    model: "glm-5.2",
    models: [
      "glm-5.2",
      "glm-5.1",
      "glm-5",
      "glm-5-Turbo",
      "glm-4.7",
      "glm-4.7-flash",
      "glm-4.6",
      "glm-4.5-Air",
    ],
    supportsDynamicFetch: true,
    description: "国内主流模型品牌,有免费/低价档",
  },
  // 火山方舟: OpenAI 兼容接入,模型以 endpoint-id 形式使用
  {
    name: "火山方舟",
    category: "domestic",
    baseUrl: "https://ark.cn-beijing.volces.com/api/v3",
    model: "doubao-seed-1-6-250615",
    models: [
      "doubao-seed-1-6-250615",
      "doubao-1-5-pro-32k-250115",
      "doubao-1-5-lite-32k-250115",
    ],
    supportsDynamicFetch: true,
    description: "字节生态,国内常见企业/开发者入口",
  },
  // 硅基流动: 国内热门聚合平台,支持大量开源/商业模型
  {
    name: "硅基流动",
    category: "domestic",
    baseUrl: "https://api.siliconflow.cn/v1",
    model: "Qwen/Qwen3-8B",
    models: [
      "Qwen/Qwen3-8B",
      "Qwen/Qwen3-32B",
      "deepseek-ai/DeepSeek-V3",
      "deepseek-ai/DeepSeek-R1",
    ],
    supportsDynamicFetch: true,
    description: "国内热门聚合平台,接入大量模型",
  },
  // Ollama: 本地模型服务,默认无需 API Key
  {
    name: "Ollama",
    category: "free-local",
    baseUrl: "http://127.0.0.1:11434/v1",
    model: "qwen3:8b",
    models: ["qwen3:8b", "qwen2.5:7b", "llama3.1:8b"],
    supportsDynamicFetch: true,
    apiKeyRequired: false,
    description: "本地免费运行,适合重视隐私和离线场景",
  },
  {
    name: "自定义",
    category: "custom",
    baseUrl: "",
    model: "",
    models: [],
  },
];

export const DEFAULT_CONFIG: AiProviderConfig = {
  baseUrl: "https://openrouter.ai/api/v1",
  apiKey: "",
  model: "deepseek/deepseek-chat-v3.1:free",
};

/** 动态拉取的模型缓存结构: { baseUrl: { models: [], updatedAt: number } } */
interface ModelsCache {
  [baseUrl: string]: {
    models: string[];
    updatedAt: number;
  };
}

interface ApiKeysStorage {
  [baseUrl: string]: string;
}

function getApiKeysStorage(): ApiKeysStorage {
  try {
    return JSON.parse(localStorage.getItem(API_KEYS_STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveApiKeysStorage(storage: ApiKeysStorage): void {
  localStorage.setItem(API_KEYS_STORAGE_KEY, JSON.stringify(storage));
}

function migrateLegacyApiKey(raw: Partial<AiProviderConfig>): void {
  const legacyApiKey = String(raw.apiKey || "").trim();
  const baseUrl = String(raw.baseUrl || DEFAULT_CONFIG.baseUrl).trim();
  if (!legacyApiKey || !baseUrl) return;

  const normalizedBase = normalizeBaseUrl(baseUrl);
  const storage = getApiKeysStorage();
  if (storage[normalizedBase]) return;

  storage[normalizedBase] = legacyApiKey;
  saveApiKeysStorage(storage);
}

export function getStoredApiKey(baseUrl: string): string {
  const normalizedBase = normalizeBaseUrl(baseUrl || "");
  if (!normalizedBase) return "";
  const storage = getApiKeysStorage();
  return storage[normalizedBase] || "";
}

function setStoredApiKey(baseUrl: string, apiKey: string): void {
  const normalizedBase = normalizeBaseUrl(baseUrl || "");
  if (!normalizedBase) return;

  const storage = getApiKeysStorage();
  const normalizedKey = apiKey.trim();
  if (normalizedKey) {
    storage[normalizedBase] = normalizedKey;
  } else {
    delete storage[normalizedBase];
  }
  saveApiKeysStorage(storage);
}

export function getAiConfig(): AiProviderConfig {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return { ...DEFAULT_CONFIG };
  try {
    const parsed = JSON.parse(raw) as Partial<AiProviderConfig>;
    migrateLegacyApiKey(parsed);
    const { apiKey: _legacyApiKey, ...rest } = parsed;
    const baseUrl = String(rest.baseUrl || DEFAULT_CONFIG.baseUrl);
    return {
      ...DEFAULT_CONFIG,
      ...rest,
      apiKey: getStoredApiKey(baseUrl),
    };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

export function setAiConfig(config: AiProviderConfig): void {
  setStoredApiKey(config.baseUrl, config.apiKey);
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      baseUrl: config.baseUrl,
      model: config.model,
    } satisfies Partial<AiProviderConfig>),
  );
}

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/+$/, "");
}

export function findProviderPresetByBaseUrl(
  baseUrl: string,
): ProviderPreset | undefined {
  const normalized = normalizeBaseUrl(baseUrl);
  return PROVIDER_PRESETS.find(
    (preset) =>
      preset.baseUrl && normalizeBaseUrl(preset.baseUrl) === normalized,
  );
}

function isLocalCompatibleBaseUrl(baseUrl: string): boolean {
  const normalized = normalizeBaseUrl(baseUrl).toLowerCase();
  return /^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?(\/|$)/.test(
    normalized,
  );
}

export function requiresApiKey(config: AiProviderConfig): boolean {
  const preset = findProviderPresetByBaseUrl(config.baseUrl);
  if (preset?.apiKeyRequired === false) return false;
  if (isLocalCompatibleBaseUrl(config.baseUrl)) return false;
  return true;
}

export function validateAiConfig(config: AiProviderConfig): string | null {
  if (!config.baseUrl.trim()) return "请先填写 Base URL";
  if (!config.model.trim()) return "请先填写模型名称";
  if (requiresApiKey(config) && !config.apiKey.trim()) {
    return "请先填写 API Key";
  }
  return null;
}

/** 配置是否已填写 */
export function isAiConfigured(): boolean {
  return validateAiConfig(getAiConfig()) === null;
}

export function isFreeModel(model: string): boolean {
  return model.trim().toLowerCase().includes(":free");
}

export function sortModelsFreeFirst(models: string[]): string[] {
  return [...models].sort((a, b) => {
    const aFree = isFreeModel(a);
    const bFree = isFreeModel(b);
    if (aFree !== bFree) return aFree ? -1 : 1;
    return a.localeCompare(b);
  });
}

/**
 * 动态拉取模型列表(通过 GET {baseUrl}/v1/models)
 * OpenAI 兼容协议的标准端点,OpenRouter/OpenAI/DeepSeek 等均支持
 * 拉取成功后缓存到 localStorage,失败时返回内置预设或空数组
 *
 * CORS 说明:
 * - Electron 打包模式:主进程注册了 CORS 绕过,所有厂商都能拉
 * - 浏览器开发模式:仅 OpenRouter 允许跨域,其他厂商会 CORS 报错
 *   (这是正常的,开发时用 OpenRouter 测试即可)
 */
export async function fetchModels(
  baseUrl: string,
  apiKey?: string,
): Promise<string[]> {
  if (!baseUrl.trim()) return [];

  const normalizedBase = normalizeBaseUrl(baseUrl);
  // 构造 models URL:baseUrl 含 /v1 则直接拼 /models,否则补 /v1/models
  const url = normalizedBase.endsWith("/v1")
    ? `${normalizedBase}/models`
    : `${normalizedBase}/v1/models`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (apiKey?.trim()) {
    headers["Authorization"] = `Bearer ${apiKey.trim()}`;
  }
  // OpenRouter 推荐带 Referer/Title 头
  if (normalizedBase.includes("openrouter.ai")) {
    headers["HTTP-Referer"] = "https://wemd.app";
    headers["X-Title"] = "WeMD";
  }

  const resp = await fetch(url, { headers });
  if (!resp.ok) {
    const errorText = await resp.text().catch(() => resp.statusText);
    throw new Error(formatAiHttpError(baseUrl, resp.status, errorText));
  }

  const data = await resp.json();
  // OpenAI 标准返回格式: { data: [{ id: "model-name", ... }, ...] }
  const models: Array<{ id?: string; name?: string }> = data.data || data.models || data;
  const modelIds = models
    .map((m) => m.id || m.name || "")
    .filter(Boolean)
    ;

  const sortedModelIds = sortModelsFreeFirst(modelIds);

  // 缓存结果
  if (sortedModelIds.length > 0) {
    const cache = getModelsCache();
    cache[normalizedBase] = { models: sortedModelIds, updatedAt: Date.now() };
    saveModelsCache(cache);
  }

  return sortedModelIds;
}

/** 读取某个 baseUrl 的缓存模型列表(用于 UI 快速回显) */
export function getCachedModels(baseUrl: string): string[] {
  const cache = getModelsCache();
  const normalized = normalizeBaseUrl(baseUrl);
  return cache[normalized]?.models ?? [];
}

/** 获取缓存更新时间(用于 UI 显示"X 天前更新") */
export function getModelsCacheTime(baseUrl: string): number | null {
  const cache = getModelsCache();
  const normalized = normalizeBaseUrl(baseUrl);
  return cache[normalized]?.updatedAt ?? null;
}

function getModelsCache(): ModelsCache {
  try {
    return JSON.parse(localStorage.getItem(MODELS_CACHE_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveModelsCache(cache: ModelsCache): void {
  localStorage.setItem(MODELS_CACHE_KEY, JSON.stringify(cache));
}

/** 打开 AI 设置的全局事件(供任意组件触发,Header 监听) */
export const AI_SETTINGS_EVENT = "wemd:open-ai-settings";

export function openAiSettings(): void {
  window.dispatchEvent(new CustomEvent(AI_SETTINGS_EVENT));
}

export function formatAiHttpError(
  baseUrl: string,
  status: number,
  errorText: string,
): string {
  const raw = (errorText || "").trim();
  const preset = findProviderPresetByBaseUrl(baseUrl);
  const providerName = preset?.name || "当前服务商";

  if (status === 401) {
    if (
      providerName === "DeepSeek" ||
      raw.includes("Authentication Fails (governor)") ||
      normalizeBaseUrl(baseUrl).includes("deepseek.com")
    ) {
      return `${providerName} 鉴权失败：请检查 API Key 是否填写正确，或是否误把其他平台的 Key 用在了 DeepSeek 官方接口上。原始信息: ${raw || "HTTP 401"}`;
    }
    return `${providerName} 鉴权失败：请检查 API Key、Base URL 是否与当前服务商匹配。原始信息: ${raw || "HTTP 401"}`;
  }

  if (
    status === 402 &&
    (providerName === "OpenRouter" ||
      normalizeBaseUrl(baseUrl).includes("openrouter.ai"))
  ) {
    return "OpenRouter 额度不足：这通常不是 API Key 错误，而是当前账号没有可用 credits，或当前模型不是免费模型。请优先选择名称带 :free 的模型；只有带 :free 的才是免费模型。也可以到 https://openrouter.ai/settings/credits 检查账号额度。";
  }

  return `HTTP ${status}: ${raw || "请求失败"}`;
}
