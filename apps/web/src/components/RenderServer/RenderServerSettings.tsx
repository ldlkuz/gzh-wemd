import { useCallback, useState } from "react";
import {
  Loader2,
  Server as ServerIcon,
  Play,
  Square,
  ScrollText,
  Copy,
} from "lucide-react";
import toast from "react-hot-toast";
import { platform } from "../../lib/platformAdapter";
import {
  isAutoOpenArticleEnabled,
  setAutoOpenArticleEnabled,
} from "../../utils/preferences";
import { useRenderServer } from "./useRenderServer";
import "./RenderServerSettings.css";

/** 复制给 AI 的示例提示词（用户只需把 ___ 换成自己的选题） */
const PROMPT_EXAMPLE =
  "用 WeMD 的落日胶片主题，写一篇关于 ___ 的公众号文章，推到 WeMD";

export function RenderServerSettings() {
  const isElectron = platform.isElectron;
  const { api, status, busy, start, stop } = useRenderServer();
  const [logs, setLogs] = useState<string[] | null>(null);
  const [autoOpen, setAutoOpen] = useState(() => isAutoOpenArticleEnabled());

  const handleStart = useCallback(async () => {
    if (!api || busy) return;
    const res = await start();
    if (res?.running) {
      toast.success(`WeMD 接口已启动：http://127.0.0.1:${res.port}`);
    } else if (res?.error) {
      toast.error(res.error);
    } else {
      toast.error("WeMD 接口启动失败");
    }
  }, [api, busy, start]);

  const handleStop = useCallback(async () => {
    if (!api || busy) return;
    await stop();
    toast.success("WeMD 接口已停止");
  }, [api, busy, stop]);

  const handleToggleLogs = useCallback(async () => {
    if (!api) return;
    if (logs) {
      setLogs(null);
      return;
    }
    try {
      const res = await api.getLogs();
      setLogs(res?.logs ?? []);
    } catch {
      toast.error("读取日志失败");
    }
  }, [api, logs]);

  const handleCopyLogs = useCallback(async () => {
    if (!logs) return;
    try {
      await navigator.clipboard.writeText(logs.join("\n"));
      toast.success("日志已复制");
    } catch {
      toast.error("复制失败，请手动选择文本");
    }
  }, [logs]);

  const handleCopyMcp = useCallback(async () => {
    if (!api) return;
    try {
      const config = await api.getMcpConfig();
      await navigator.clipboard.writeText(JSON.stringify(config, null, 2));
      toast.success("MCP 配置已复制，粘贴到 AI 工具的 MCP 设置即可");
    } catch {
      toast.error("复制失败，请手动选择文本");
    }
  }, [api]);

  const handleCopyPrompt = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(PROMPT_EXAMPLE);
      toast.success("提示词已复制，把 ___ 换成你的选题发给 AI 即可");
    } catch {
      toast.error("复制失败，请手动选择文本");
    }
  }, []);

  const handleToggleAutoOpen = useCallback(() => {
    const next = !autoOpen;
    setAutoOpen(next);
    setAutoOpenArticleEnabled(next);
  }, [autoOpen]);

  // 非 Electron 环境：仅提示，不渲染控件
  if (!isElectron || !api) {
    return (
      <div className="render-server settings-empty">
        <div className="render-server-empty">
          <ServerIcon size={20} />
          <span>此功能仅桌面版（WeMD 桌面应用）可用。</span>
        </div>
      </div>
    );
  }

  return (
    <div className="render-server">
      <p className="render-server-desc">
        WeMD 在本机启动一个 HTTP 接口，供外部程序 / AI 工具调用：{" "}
        <code>POST /render</code>（markdown → 微信 HTML）、{" "}
        <code>POST /articles</code>（推送文章到程序）等。
      </p>

      <section className="render-server-block">
        <div className="render-server-block-title">服务状态</div>

        <div className="render-server-status-row">
          <div
            className={`render-server-indicator ${
              status.running ? "is-running" : "is-stopped"
            }`}
          />
          <span className="render-server-state">
            {status.running ? "运行中" : "未运行"}
          </span>
          <span className="render-server-port">
            {status.running && status.port !== null
              ? `端口 ${status.port}`
              : "--"}
          </span>
        </div>

        {status.running && status.port !== null && (
          <div className="render-server-url">
            <span>调用地址：</span>
            <code>http://127.0.0.1:{status.port}/render</code>
          </div>
        )}

        <label className="render-server-pref">
          <input
            type="checkbox"
            checked={autoOpen}
            onChange={handleToggleAutoOpen}
          />
          <span>外部推送文章后，自动在编辑器打开</span>
        </label>

        <div className="render-server-actions">
          {status.running ? (
            <button
              className="render-server-stop-btn"
              onClick={handleStop}
              disabled={busy}
            >
              {busy ? (
                <Loader2 size={14} className="spinning" />
              ) : (
                <Square size={14} />
              )}
              停止服务
            </button>
          ) : (
            <button
              className="render-server-start-btn"
              onClick={handleStart}
              disabled={busy}
            >
              {busy ? (
                <Loader2 size={14} className="spinning" />
              ) : (
                <Play size={14} />
              )}
              启动服务
            </button>
          )}
          <button
            className="render-server-ghost-btn"
            onClick={handleToggleLogs}
          >
            <ScrollText size={14} />
            {logs ? "收起日志" : "查看日志"}
          </button>
        </div>

        {logs && (
          <div className="render-server-logs">
            <div className="render-server-logs-head">
              <span>服务日志（最近 {logs.length} 行）</span>
              <button onClick={handleCopyLogs}>复制</button>
            </div>
            <pre>{logs.length ? logs.join("\n") : "（暂无日志）"}</pre>
          </div>
        )}
      </section>

      <section className="render-server-block">
        <div className="render-server-block-title">接入 AI 工具</div>

        <div className="render-server-mcp">
          <span className="render-server-mcp-text">
            让 Trae / Codex 等 AI 工具直接调用本接口
          </span>
          <button className="render-server-ghost-btn" onClick={handleCopyMcp}>
            <Copy size={14} />
            复制 MCP 配置
          </button>
        </div>

        <ol className="render-server-guide-steps">
          <li>点上方「复制 MCP 配置」</li>
          <li>粘贴到 AI 工具的 MCP 设置（如 Trae：设置 → MCP），保存</li>
          <li>新开一个会话，把下面的提示词发给它</li>
        </ol>

        <div className="render-server-prompt">
          <span className="render-server-prompt-text">{PROMPT_EXAMPLE}</span>
          <button
            className="render-server-ghost-btn"
            onClick={handleCopyPrompt}
          >
            <Copy size={14} />
            复制提示词
          </button>
        </div>
      </section>
    </div>
  );
}
