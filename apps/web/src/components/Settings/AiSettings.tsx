import { useState, useEffect, useMemo } from "react";
import { Loader2, CheckCircle2, XCircle, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";
import {
  findProviderPresetByBaseUrl,
  getAiConfig,
  getStoredApiKey,
  setAiConfig,
  PROVIDER_PRESETS,
  fetchModels,
  getCachedModels,
  getModelsCacheTime,
  requiresApiKey,
  sortModelsFreeFirst,
  validateAiConfig,
  type AiProviderConfig,
  type ProviderCategory,
} from "../../services/ai/aiConfig";
import { testConnection } from "../../services/ai/aiService";
import "./AiSettings.css";

const CATEGORY_LABELS: Record<Exclude<ProviderCategory, "custom">, string> = {
  recommended: "推荐使用",
  domestic: "更多国内模型",
  "free-local": "免费与本地",
  other: "其他厂商",
};

export function AiSettings() {
  const [config, setConfig] = useState<AiProviderConfig>(() => getAiConfig());
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  // 动态拉取的模型列表(优先用缓存,无则用预设)
  const [dynamicModels, setDynamicModels] = useState<string[]>(() =>
    getCachedModels(getAiConfig().baseUrl),
  );
  const [fetchingModels, setFetchingModels] = useState(false);
  // 上次拉取时间(用于显示"X 天前更新")
  const [cacheTime, setCacheTime] = useState<number | null>(() =>
    getModelsCacheTime(getAiConfig().baseUrl),
  );

  useEffect(() => {
    setConfig(getAiConfig());
    setTestResult(null);
    setDynamicModels(getCachedModels(getAiConfig().baseUrl));
    setCacheTime(getModelsCacheTime(getAiConfig().baseUrl));
  }, []);

  const handlePresetChange = (name: string) => {
    const preset = PROVIDER_PRESETS.find((p) => p.name === name);
    if (!preset) return;
    // 切换服务商时,读取该 baseUrl 的缓存模型(如果有)
    const newBaseUrl = preset.baseUrl; // 自定义服务商 preset.baseUrl 为空字符串
    const cached = getCachedModels(newBaseUrl);
    setDynamicModels(cached);
    setCacheTime(getModelsCacheTime(newBaseUrl));
    setConfig((prev) => ({
      ...prev,
      // 切换预设时总是覆盖 baseUrl:
      //   - 命中预设(DeepSeek/OpenAI 等)→ 自动填入预设 URL
      //   - 选"自定义" → baseUrl 清空,让用户自己输入
      baseUrl: newBaseUrl,
      apiKey: getStoredApiKey(newBaseUrl),
      // 切换服务商时,若当前 model 在新预设的 models 列表里则保留,否则重置为默认
      model:
        preset.models.length === 0
          ? prev.model
          : preset.models.includes(prev.model)
            ? prev.model
            : preset.model,
    }));
    setTestResult(null);
  };

  /** Base URL 手动改动时,清空动态模型缓存(因为 URL 变了,旧模型不适用) */
  const handleBaseUrlChange = (value: string) => {
    setConfig((prev) => ({
      ...prev,
      baseUrl: value,
      apiKey: getStoredApiKey(value),
    }));
    const cached = getCachedModels(value);
    setDynamicModels(cached);
    setCacheTime(getModelsCacheTime(value));
  };

  /** 根据当前 baseUrl 找到匹配的预设(用于回显服务商下拉框) */
  const currentPreset =
    findProviderPresetByBaseUrl(config.baseUrl) ||
    PROVIDER_PRESETS.find((p) => p.name === "自定义");

  const apiKeyRequired = requiresApiKey(config);

  const presetGroups = useMemo(() => {
    const groups = (Object.keys(CATEGORY_LABELS) as Array<
      Exclude<ProviderCategory, "custom">
    >).map((category) => ({
      category,
      label: CATEGORY_LABELS[category],
      presets: PROVIDER_PRESETS.filter((preset) => preset.category === category),
    }));
    const customPreset = PROVIDER_PRESETS.find((preset) => preset.category === "custom");
    return { groups, customPreset };
  }, []);

  /** 实际显示的模型列表:动态拉取的优先,否则用预设内置 */
  const currentModels = useMemo(() => {
    if (dynamicModels.length > 0) return sortModelsFreeFirst(dynamicModels);
    return sortModelsFreeFirst(currentPreset?.models ?? []);
  }, [dynamicModels, currentPreset]);

  /** 模型列表来源标识:动态拉取 / 内置预设 / 空 */
  const modelsSource = useMemo(() => {
    if (dynamicModels.length > 0) return "fetched";
    if (currentPreset?.models.length) return "builtin";
    return "empty";
  }, [dynamicModels, currentPreset]);

  /** 当前 model 是否在可选列表中(不在则视为自定义输入) */
  const isCustomModel =
    currentModels.length > 0 && !currentModels.includes(config.model);

  /** 是否支持动态刷新模型 */
  const supportsModelRefresh =
    currentPreset?.category === "custom"
      ? !!config.baseUrl.trim()
      : !!currentPreset?.supportsDynamicFetch && !!config.baseUrl.trim();

  const fetchButtonText =
    currentPreset?.name === "Ollama"
      ? "同步本地模型"
      : currentPreset?.category === "custom"
        ? "刷新模型"
        : currentModels.length > 0
          ? "同步最新模型"
          : "刷新模型";

  /** 缓存时间显示文案 */
  const cacheTimeText = useMemo(() => {
    if (!cacheTime) return null;
    const diff = Date.now() - cacheTime;
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "刚刚更新";
    if (minutes < 60) return `${minutes} 分钟前更新`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} 小时前更新`;
    return `${Math.floor(hours / 24)} 天前更新`;
  }, [cacheTime]);

  /** 动态拉取模型列表 */
  const handleFetchModels = async () => {
    if (!config.baseUrl.trim()) {
      toast.error("请先填写 Base URL");
      return;
    }
    setFetchingModels(true);
    try {
      const models = await fetchModels(config.baseUrl, config.apiKey);
      if (models.length === 0) {
        toast.error("未获取到模型列表,可能是服务商不支持");
        return;
      }
      setDynamicModels(models);
      setCacheTime(Date.now());
      setConfig((prev) => ({
        ...prev,
        model:
          !prev.model.trim() || !models.includes(prev.model) ? models[0] : prev.model,
      }));
      toast.success(`已获取 ${models.length} 个模型`);
    } catch (e) {
      toast.error(`获取失败: ${(e as Error).message}`);
    } finally {
      setFetchingModels(false);
    }
  };

  const handleSave = () => {
    const configError = validateAiConfig(config);
    if (configError) {
      toast.error(configError);
      return;
    }
    setAiConfig(config);
    toast.success("AI 配置已保存");
  };

  const handleTest = async () => {
    const configError = validateAiConfig(config);
    if (configError) {
      toast.error(configError);
      return;
    }
    setTesting(true);
    setTestResult(null);
    try {
      // 先保存再测试(测试用最新配置)
      setAiConfig(config);
      const result = await testConnection(config);
      setTestResult(result);
      if (result.success) {
        toast.success("连接成功");
      } else {
        toast.error(`连接失败: ${result.message}`);
      }
    } catch (e) {
      setTestResult({ success: false, message: (e as Error).message });
      toast.error(`连接失败: ${(e as Error).message}`);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="ai-settings">
      <p className="ai-settings-desc">
        以国内主流模型为主,同时保留免费与自定义接入。推荐普通用户先试
        OpenRouter 免费模型或 Ollama 本地模型;常用国内厂商已内置
        DeepSeek、通义、Kimi、智谱、火山方舟、硅基流动。
        配置保存在本地,不会上传。
      </p>

      <div className="ai-settings-field">
        <label>服务商预设</label>
        <select
          value={currentPreset?.name ?? "自定义"}
          onChange={(e) => handlePresetChange(e.target.value)}
        >
          {presetGroups.groups.map(
            ({ category, label, presets }) =>
              presets.length > 0 && (
                <optgroup key={category} label={label}>
                  {presets.map((preset) => (
                    <option key={preset.name} value={preset.name}>
                      {preset.name}
                      {preset.description ? ` - ${preset.description}` : ""}
                    </option>
                  ))}
                </optgroup>
              ),
          )}
          {presetGroups.customPreset && (
            <optgroup label="高级接入">
              <option
                key={presetGroups.customPreset.name}
                value={presetGroups.customPreset.name}
              >
                {presetGroups.customPreset.name}
              </option>
            </optgroup>
          )}
        </select>
      </div>

      <div className="ai-settings-field">
        <label>
          Base URL
          {currentPreset?.name && currentPreset.name !== "自定义" && (
            <span className="ai-settings-url-hint">
              (来自 {currentPreset.name} 预设,可修改)
            </span>
          )}
        </label>
        <input
          type="text"
          value={config.baseUrl}
          onChange={(e) => handleBaseUrlChange(e.target.value)}
          placeholder="https://openrouter.ai/api/v1"
        />
        {currentPreset?.name === "自定义" && (
          <small className="ai-settings-hint">
            填入任意 OpenAI 兼容 API 的 Base URL,填好后点下方"刷新模型"可自动拉取模型列表。
            如果你用的是兼容 OpenAI 协议的平台,一般只需要填 Base URL、API Key 和模型名。
          </small>
        )}
        {currentPreset?.name === "Ollama" && (
          <small className="ai-settings-hint">
            Ollama 本地新增或删除模型后,点下方"同步本地模型"可更新下拉列表。
          </small>
        )}
      </div>

      <div className="ai-settings-field">
        <label>
          API Key
          {!apiKeyRequired && (
            <span className="ai-settings-url-hint">(当前服务可留空)</span>
          )}
        </label>
        <input
          type="password"
          value={config.apiKey}
          onChange={(e) =>
            setConfig((prev) => ({ ...prev, apiKey: e.target.value }))
          }
          placeholder={apiKeyRequired ? "sk-..." : "当前服务可留空"}
        />
        {currentPreset?.name === "OpenRouter" && (
          <small className="ai-settings-hint">
            在{" "}
            <a
              href="https://openrouter.ai/keys"
              target="_blank"
              rel="noreferrer"
            >
              https://openrouter.ai/keys
            </a>{" "}
            注册即可获取 Key。只有模型名称带 <code>:free</code> 的才是免费模型，已在下方优先排到最前面。
          </small>
        )}
        {currentPreset?.name === "Ollama" && (
          <small className="ai-settings-hint">
            本地默认地址为 `http://127.0.0.1:11434/v1`。通常无需 API Key,先在本机启动
            Ollama 并拉取模型后,点"刷新模型"即可。
          </small>
        )}
      </div>

      <div className="ai-settings-field">
        <label>
          模型名称
          {currentModels.length > 0 && (
            <span className="ai-settings-model-hint">
              (共 {currentModels.length} 个可选 ·{" "}
              {modelsSource === "fetched" ? "动态拉取" : "内置预设"})
            </span>
          )}
        </label>
        <div className="ai-settings-model-row">
          {currentModels.length > 0 ? (
            isCustomModel ? (
              <input
                type="text"
                value={config.model}
                onChange={(e) =>
                  setConfig((prev) => ({ ...prev, model: e.target.value }))
                }
                placeholder="输入自定义模型名称"
              />
            ) : (
              <select
                value={config.model}
                onChange={(e) => {
                  if (e.target.value === "__custom__") {
                    setConfig((prev) => ({ ...prev, model: "" }));
                  } else {
                    setConfig((prev) => ({ ...prev, model: e.target.value }));
                  }
                }}
              >
                {currentModels.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
                <option value="__custom__">✎ 自定义输入...</option>
              </select>
            )
          ) : (
            <input
              type="text"
              value={config.model}
              onChange={(e) =>
                setConfig((prev) => ({ ...prev, model: e.target.value }))
              }
              placeholder="输入模型名称"
            />
          )}
          <button
            type="button"
            className="ai-settings-fetch-btn"
            onClick={handleFetchModels}
            disabled={fetchingModels || !supportsModelRefresh}
            title={
              supportsModelRefresh
                ? "从服务商同步最新模型列表"
                : "当前服务不支持自动同步模型列表"
            }
          >
            {fetchingModels ? (
              <Loader2 size={13} className="spinning" />
            ) : (
              <RefreshCw size={13} />
            )}
            {fetchingModels ? "获取中" : fetchButtonText}
          </button>
        </div>
        {isCustomModel && currentModels.length > 0 && (
          <button
            type="button"
            className="ai-settings-reset-model-btn"
            onClick={() =>
              setConfig((prev) => ({
                ...prev,
                model: currentModels[0] || currentPreset?.model || "",
              }))
            }
          >
            ← 返回下拉选择
          </button>
        )}
        {cacheTimeText && (
          <small className="ai-settings-cache-time">{cacheTimeText}</small>
        )}
      </div>

      {testResult && (
        <div
          className={`ai-settings-test-result ${
            testResult.success ? "success" : "error"
          }`}
        >
          {testResult.success ? (
            <CheckCircle2 size={16} />
          ) : (
            <XCircle size={16} />
          )}
          <span>{testResult.message}</span>
        </div>
      )}

      <div className="ai-settings-actions">
        <button
          className="ai-settings-test-btn"
          onClick={handleTest}
          disabled={testing}
        >
          {testing ? (
            <>
              <Loader2 size={14} className="spinning" />
              测试中...
            </>
          ) : (
            "测试连接"
          )}
        </button>
        <button className="ai-settings-save-btn" onClick={handleSave}>
          保存配置
        </button>
      </div>
    </div>
  );
}
