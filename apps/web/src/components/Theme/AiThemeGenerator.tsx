/**
 * AI 主题生成器
 * 用户输入自然语言描述,可选基于某内置主题,调用 AI 流式生成 CSS。
 * 生成过程中实时显示 AI 输出的内容,生成完成后调用 onGenerated(css)。
 */
import { useRef, useState } from "react";
import { Sparkles, Loader2, AlertCircle, Square } from "lucide-react";
import toast from "react-hot-toast";
import { generateThemeStream } from "../../services/ai/aiService";
import { isAiConfigured, openAiSettings } from "../../services/ai/aiConfig";
import type { CustomTheme } from "../../store/themes/builtInThemes";
import "./AiThemeGenerator.css";

interface AiThemeGeneratorProps {
  /** 内置主题列表,用于"基础风格"下拉 */
  builtInThemes: CustomTheme[];
  /** 生成完成回调,把 CSS 传给父组件 */
  onGenerated: (css: string) => void;
}

const PLACEHOLDER = `描述你想要的主题风格,例如:
- 暖色调,适合育儿类文章,圆角柔和,标题用粉色
- 极简黑白,科技感,代码块深色背景,引用带左侧粗边框
- 莫兰迪色系,低饱和度,文艺清新,大段距,适合散文`;

export function AiThemeGenerator({
  builtInThemes,
  onGenerated,
}: AiThemeGeneratorProps) {
  const [description, setDescription] = useState("");
  const [baseThemeId, setBaseThemeId] = useState("");
  const [loading, setLoading] = useState(false);
  const [streamText, setStreamText] = useState("");
  const abortRef = useRef<AbortController | null>(null);
  const logRef = useRef<HTMLPreElement>(null);

  const handleGenerate = async () => {
    const desc = description.trim();
    if (!desc) {
      toast.error("请先描述你想要的主题风格");
      return;
    }
    if (!isAiConfigured()) {
      toast.error("请先配置 AI 模型");
      openAiSettings();
      return;
    }

    setLoading(true);
    setStreamText("");
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const baseTheme = builtInThemes.find((t) => t.id === baseThemeId);
      const raw = await generateThemeStream(
        {
          description: desc,
          baseThemeCss: baseTheme?.css,
        },
        (accumulated) => {
          setStreamText(accumulated);
          // 自动滚动到底部
          requestAnimationFrame(() => {
            if (logRef.current) {
              logRef.current.scrollTop = logRef.current.scrollHeight;
            }
          });
        },
        controller.signal,
      );
      toast.success("CSS 生成成功,已填入编辑区,可继续微调");
      onGenerated(raw);
      setStreamText("");
    } catch (e) {
      if ((e as Error).name === "AbortError") {
        toast("已停止生成", { icon: "⏹️" });
      } else {
        const msg = (e as Error).message || String(e);
        toast.error(`生成失败: ${msg}`);
      }
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  };

  const handleStop = () => {
    abortRef.current?.abort();
  };

  return (
    <div className="ai-theme-generator">
      <div className="ai-theme-field">
        <label>描述你想要的主题风格</label>
        <textarea
          className="ai-theme-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={PLACEHOLDER}
          rows={6}
          spellCheck={false}
          disabled={loading}
        />
      </div>

      <div className="ai-theme-field">
        <label>基础风格(可选)</label>
        <select
          className="ai-theme-base"
          value={baseThemeId}
          onChange={(e) => setBaseThemeId(e.target.value)}
          disabled={loading}
        >
          <option value="">不基于任何主题,从零生成</option>
          {builtInThemes.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        <small>选择后,AI 会基于该主题的 CSS 做风格调整</small>
      </div>

      {!isAiConfigured() && (
        <div className="ai-theme-warn">
          <AlertCircle size={14} />
          <span>未配置 AI 模型,</span>
          <button type="button" className="ai-theme-warn-btn" onClick={openAiSettings}>
            前往配置
          </button>
        </div>
      )}

      {(loading || streamText) && (
        <div className="ai-stream-panel">
          <div className="ai-stream-header">
            <span className="ai-stream-title">
              {loading ? (
                <>
                  <Loader2 size={13} className="spinning" />
                  AI 正在生成 CSS...
                </>
              ) : (
                "生成内容"
              )}
            </span>
            {loading && (
              <button
                type="button"
                className="ai-stream-stop"
                onClick={handleStop}
                title="停止生成"
              >
                <Square size={12} /> 停止
              </button>
            )}
          </div>
          <pre ref={logRef} className="ai-stream-content">
            {streamText || "等待 AI 响应..."}
            {loading && <span className="ai-stream-cursor">▋</span>}
          </pre>
        </div>
      )}

      <div className="ai-theme-actions">
        {loading ? (
          <button
            type="button"
            className="ai-theme-generate-btn ai-theme-stop-btn"
            onClick={handleStop}
          >
            <Square size={16} />
            停止生成
          </button>
        ) : (
          <button
            type="button"
            className="ai-theme-generate-btn"
            onClick={handleGenerate}
            disabled={!description.trim()}
          >
            <Sparkles size={16} />
            生成 CSS
          </button>
        )}
      </div>
    </div>
  );
}
