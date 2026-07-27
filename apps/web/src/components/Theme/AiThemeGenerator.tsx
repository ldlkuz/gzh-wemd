/**
 * AI 主题生成器（Phase 3 升级：JSON 输出）
 *
 * 用户输入自然语言描述 → AI 流式生成 ThemeDefinition JSON
 * → validateThemeJson 校验 → renderTheme 渲染 CSS → 回调
 */
import { useRef, useState } from "react";
import { Sparkles, Loader2, AlertCircle, Square, FileJson } from "lucide-react";
import toast from "react-hot-toast";
import { generateThemeStream } from "../../services/ai/aiService";
import { isAiConfigured, openAiSettings } from "../../services/ai/aiConfig";
import { validateThemeJson } from "../../services/ai/aiPrompts";
import type {
  CustomTheme,
  ThemeDefinition,
} from "../../store/themes/builtInThemes";
import "./AiThemeGenerator.css";

interface AiThemeGeneratorProps {
  builtInThemes: CustomTheme[];
  /** 生成完成回调，CSS 传给父组件；若 AI 返回 JSON 则附带 definition */
  onGenerated: (css: string, definition?: ThemeDefinition) => void;
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
      const raw = await generateThemeStream(
        {
          description: desc,
          useJson: true, // Phase 3: 使用 JSON prompt
        },
        (accumulated) => {
          setStreamText(accumulated);
          requestAnimationFrame(() => {
            if (logRef.current) {
              logRef.current.scrollTop = logRef.current.scrollHeight;
            }
          });
        },
        controller.signal,
      );

      // Phase 3: 尝试解析为 JSON，通过 renderTheme 生成 CSS
      const parsed = validateThemeJson(raw);
      if (parsed) {
        try {
          // 动态导入 renderTheme（避免循环依赖）
          const { renderTheme } = await import("@wemd/core");
          const css = renderTheme(parsed as Parameters<typeof renderTheme>[0]);
          toast.success("主题设计成功,已生成完整 CSS");
          onGenerated(css, parsed as ThemeDefinition);
          setStreamText("");
        } catch {
          // renderTheme 失败時降级为原始文本
          toast.success("主题生成成功,已填入编辑区");
          onGenerated(raw);
        }
      } else {
        // JSON 解析失败，可能是旧格式 CSS，直接传给编辑器
        toast.success("主题生成成功,已填入编辑区（检测到自由格式输出）");
        onGenerated(raw);
        setStreamText("");
      }
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

      {!isAiConfigured() && (
        <div className="ai-theme-warn">
          <AlertCircle size={14} />
          <span>未配置 AI 模型,</span>
          <button
            type="button"
            className="ai-theme-warn-btn"
            onClick={openAiSettings}
          >
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
                  AI 正在设计主题...
                </>
              ) : (
                "生成结果"
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
        <button
          type="button"
          className="ai-theme-generate-btn"
          onClick={handleGenerate}
          disabled={loading || !description.trim()}
        >
          {loading ? (
            <>
              <Loader2 size={16} className="spinning" />
              生成中...
            </>
          ) : (
            <>
              <FileJson size={16} />
              生成主题
            </>
          )}
        </button>
      </div>
    </div>
  );
}
