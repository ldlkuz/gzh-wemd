import { useCallback } from "react";
import { Loader2, Server as ServerIcon, Play, Square } from "lucide-react";
import toast from "react-hot-toast";
import { platform } from "../../lib/platformAdapter";
import { useRenderServer } from "./useRenderServer";
import "./RenderServerSettings.css";

export function RenderServerSettings() {
  const isElectron = platform.isElectron;
  const { api, status, busy, start, stop } = useRenderServer();

  const handleStart = useCallback(async () => {
    if (!api || busy) return;
    const res = await start();
    if (res?.running) {
      toast.success(`渲染API已启动：http://127.0.0.1:${res.port}`);
    } else if (res?.error) {
      toast.error(res.error);
    } else {
      toast.error("渲染API启动失败");
    }
  }, [api, busy, start]);

  const handleStop = useCallback(async () => {
    if (!api || busy) return;
    await stop();
    toast.success("渲染API已停止");
  }, [api, busy, stop]);

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
        WeMD 在本机启动一个 HTTP 渲染API，供外部程序 / Skill 调用：{" "}
        <code>POST /render</code>（markdown → 微信 HTML）、{" "}
        <code>GET /themes/:id/guide</code>（主题手册）等。
      </p>

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
      </div>
    </div>
  );
}
