/**
 * AI 主题生成器（Phase 4 升级：对话式迭代）
 *
 * idle → 用户输入描述 → 流式生成 ThemeDefinition JSON
 * → renderTheme → 预览即时更新 → 用户对话微调 → 循环迭代
 */
import { useRef, useState } from "react";
import {
  Sparkles,
  Loader2,
  AlertCircle,
  Square,
  Send,
  MessageCircle,
  CheckCircle2,
  Wand2,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  generateThemeStream,
  refineTheme,
  refineDescription,
} from "../../services/ai/aiService";
import { isAiConfigured, openAiSettings } from "../../services/ai/aiConfig";
import { validateThemeJson } from "../../services/ai/aiPrompts";
import type { ThemeDefinition } from "../../store/themes/builtInThemes";
import "./AiThemeGenerator.css";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface AiThemeGeneratorProps {
  /** 生成/微调完成回调（CSS + definition），父组件据此保存 */
  onGenerated: (css: string, definition?: ThemeDefinition) => void;
  /** 预览 CSS 实时更新 */
  onPreviewCss: (css: string) => void;
  /** AI 建议的主题名称 */
  onNameSuggestion: (name: string) => void;
}

const PLACEHOLDER = `描述你想要的主题风格,例如:
- 暖色调,适合育儿类文章,圆角柔和,标题用粉色
- 极简黑白,科技感,代码块深色背景,引用带左侧粗边框
- 莫兰迪色系,低饱和度,文艺清新,大段距,适合散文`;

type Step = "idle" | "generating" | "ready" | "refining";

export function AiThemeGenerator({
  onGenerated,
  onPreviewCss,
  onNameSuggestion,
}: AiThemeGeneratorProps) {
  const [step, setStep] = useState<Step>("idle");
  const [description, setDescription] = useState("");
  const [refiningDesc, setRefiningDesc] = useState(false);
  const [streamText, setStreamText] = useState("");
  const [refineInput, setRefineInput] = useState("");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);

  /** 当前 Theme JSON 字符串（用于后续微调） */
  const currentJsonRef = useRef<string>("");
  /** 当前 definition 对象 */
  const definitionRef = useRef<Record<string, unknown> | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const logRef = useRef<HTMLPreElement>(null);

  // ---- 处理生成/微调结果 ----
  const processResult = async (raw: string) => {
    const parsed = validateThemeJson(raw);
    if (parsed) {
      try {
        currentJsonRef.current = JSON.stringify(parsed);
        definitionRef.current = parsed;

        const { renderTheme } = await import("@wemd/core");
        const def = parsed as unknown as ThemeDefinition;
        const css = renderTheme(def);

        onPreviewCss(css);
        onGenerated(css, def);

        // 建议名称
        const name = def.meta?.name || "";
        if (name) onNameSuggestion(name);

        return true;
      } catch (e) {
        console.error("renderTheme failed:", e);
        toast.error("主题渲染失败，请重试");
        return false;
      }
    } else {
      toast.success("主题生成成功,已填入编辑区（检测到自由格式输出）");
      onGenerated(raw);
      return false;
    }
  };

  // ---- 初始生成 ----
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

    setStep("generating");
    setStreamText("");
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const raw = await generateThemeStream(
        { description: desc, useJson: true },
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

      const ok = await processResult(raw);
      if (ok) {
        setChatHistory([{ role: "user", content: desc }]);
        setStep("ready");
      } else {
        setStep("idle");
      }
      setStreamText("");
    } catch (e) {
      if ((e as Error).name === "AbortError") {
        toast("已停止生成", { icon: "⏹️" });
      } else {
        toast.error(`生成失败: ${(e as Error).message || String(e)}`);
      }
      setStep("idle");
    } finally {
      abortRef.current = null;
    }
  };

  const handleStop = () => {
    abortRef.current?.abort();
  };

  // ---- 对话微调 ----
  const handleRefine = async () => {
    const feedback = refineInput.trim();
    if (!feedback) return;
    if (!currentJsonRef.current) {
      toast.error("当前没有主题数据，请先生成");
      return;
    }
    if (!isAiConfigured()) {
      toast.error("请先配置 AI 模型");
      openAiSettings();
      return;
    }

    setStep("refining");
    setRefineInput("");

    setChatHistory((prev) => [...prev, { role: "user", content: feedback }]);

    try {
      const raw = await refineTheme({
        currentJson: currentJsonRef.current,
        feedback,
      });

      const ok = await processResult(raw);
      if (ok) {
        toast.success("已按你的意见调整");
        setChatHistory((prev) => [
          ...prev,
          { role: "assistant", content: "已调整 ✅" },
        ]);
      } else {
        setChatHistory((prev) => [
          ...prev,
          { role: "assistant", content: "调整中遇到问题，请重试" },
        ]);
      }
    } catch (e) {
      toast.error(`调整失败: ${(e as Error).message || String(e)}`);
      setChatHistory((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `调整失败: ${(e as Error).message || String(e)}`,
        },
      ]);
    } finally {
      setStep("ready");
    }
  };

  const handleRefineKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleRefine();
    }
  };

  // ---- AI 润色描述 ----
  const handleRefineDescription = async () => {
    const text = description.trim();
    if (!text) return;
    if (!isAiConfigured()) {
      toast.error("请先配置 AI 模型");
      openAiSettings();
      return;
    }
    setRefiningDesc(true);
    try {
      const refined = await refineDescription(text);
      setDescription(refined);
      toast.success("已整理为专业描述");
    } catch (e) {
      toast.error(`整理失败: ${(e as Error).message || String(e)}`);
    } finally {
      setRefiningDesc(false);
    }
  };

  // ---- 重新生成 ----
  const handleRegenerate = () => {
    setStep("idle");
    setChatHistory([]);
    setStreamText("");
    currentJsonRef.current = "";
    definitionRef.current = null;
  };

  // ---- Render ----
  return (
    <div className="ai-theme-generator">
      {/* === idle: 初始输入 === */}
      {step === "idle" && (
        <>
          <div className="ai-theme-field">
            <label>描述你想要的主题风格</label>
            <textarea
              className="ai-theme-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={PLACEHOLDER}
              rows={6}
              spellCheck={false}
            />
            {description.trim() && (
              <button
                type="button"
                className="ai-polish-btn"
                onClick={handleRefineDescription}
                disabled={refiningDesc}
              >
                {refiningDesc ? (
                  <Loader2 size={13} className="spinning" />
                ) : (
                  <Wand2 size={13} />
                )}
                AI 润色
              </button>
            )}
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

          <div className="ai-theme-actions">
            <button
              type="button"
              className="ai-theme-generate-btn"
              onClick={handleGenerate}
              disabled={!description.trim()}
            >
              <Sparkles size={16} />
              生成主题
            </button>
          </div>
        </>
      )}

      {/* === generating: 流式输出 === */}
      {step === "generating" && (
        <>
          <div className="ai-stream-panel">
            <div className="ai-stream-header">
              <span className="ai-stream-title">
                <Loader2 size={13} className="spinning" />
                AI 正在设计主题...
              </span>
              <button
                type="button"
                className="ai-stream-stop"
                onClick={handleStop}
                title="停止生成"
              >
                <Square size={12} /> 停止
              </button>
            </div>
            <pre ref={logRef} className="ai-stream-content">
              {streamText || "等待 AI 响应..."}
              <span className="ai-stream-cursor">▋</span>
            </pre>
          </div>
        </>
      )}

      {/* === ready / refining: 对话微调 === */}
      {(step === "ready" || step === "refining") && (
        <>
          {/* 状态栏 */}
          <div className="ai-ready-banner">
            <CheckCircle2 size={15} className="ai-ready-icon" />
            <span>主题已生成，预览在上方。不满意？告诉 AI 怎么改：</span>
            <button
              type="button"
              className="ai-regenerate-link"
              onClick={handleRegenerate}
            >
              重新生成
            </button>
          </div>

          {/* 对话历史 */}
          {chatHistory.length > 0 && (
            <div className="ai-chat-history">
              {chatHistory.map((msg, i) => (
                <div
                  key={i}
                  className={`ai-chat-bubble ${msg.role === "user" ? "ai-chat-user" : "ai-chat-assistant"}`}
                >
                  <span className="ai-chat-role">
                    {msg.role === "user" ? (
                      <MessageCircle size={12} />
                    ) : (
                      <Sparkles size={12} />
                    )}
                  </span>
                  <span className="ai-chat-text">{msg.content}</span>
                </div>
              ))}
            </div>
          )}

          {/* 微调输入 */}
          <div className="ai-refine-row">
            <input
              className="ai-refine-input"
              value={refineInput}
              onChange={(e) => setRefineInput(e.target.value)}
              onKeyDown={handleRefineKeyDown}
              placeholder="告诉 AI 你想怎么调整，例如：标题太暗了、字号大一点..."
              disabled={step === "refining"}
              autoFocus
            />
            <button
              type="button"
              className="ai-refine-send"
              onClick={handleRefine}
              disabled={step === "refining" || !refineInput.trim()}
              title="发送"
            >
              {step === "refining" ? (
                <Loader2 size={15} className="spinning" />
              ) : (
                <Send size={15} />
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
