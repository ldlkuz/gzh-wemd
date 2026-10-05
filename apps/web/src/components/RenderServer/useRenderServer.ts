import { useEffect, useState, useCallback } from "react";

export interface RenderServerStatus {
  running: boolean;
  port: number | null;
  error?: string;
}

type RenderServerAPI = {
  start: (payload?: { port?: number }) => Promise<RenderServerStatus>;
  stop: () => Promise<RenderServerStatus>;
  status: () => Promise<RenderServerStatus>;
  onStatusChange: (cb: (s: RenderServerStatus) => void) => unknown;
  removeStatusListener: (h: unknown) => void;
};

export const RENDER_SERVER_DEFAULT_PORT = 8787;

/** 取渲染服务 API：仅 Electron 桌面版有，浏览器环境返回 null */
export function getServerApi(): RenderServerAPI | null {
  return (window.electron?.server as RenderServerAPI) ?? null;
}

/**
 * 渲染服务的共享状态 hook。
 * 供顶部工具栏就地开关按钮与「渲染服务」设置弹窗复用同一份实时状态。
 * 非 Electron 环境 api 为 null，各组件自行降级。
 */
export function useRenderServer() {
  const api = getServerApi();
  const [status, setStatus] = useState<RenderServerStatus>({
    running: false,
    port: null,
  });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!api) return;
    let cancelled = false;
    api
      .status()
      .then((s) => {
        if (!cancelled) setStatus(s);
      })
      .catch(() => {
        /* 主进程尚未就绪时忽略 */
      });
    const handler = api.onStatusChange((s) => {
      if (!cancelled) setStatus(s);
    });
    return () => {
      cancelled = true;
      api.removeStatusListener(handler);
    };
  }, [api]);

  const start = useCallback(async () => {
    if (!api || busy) return;
    setBusy(true);
    try {
      const res = await api.start({ port: RENDER_SERVER_DEFAULT_PORT });
      setStatus(res);
      return res;
    } finally {
      setBusy(false);
    }
  }, [api, busy]);

  const stop = useCallback(async () => {
    if (!api || busy) return;
    setBusy(true);
    try {
      const res = await api.stop();
      setStatus(res);
      return res;
    } finally {
      setBusy(false);
    }
  }, [api, busy]);

  return { api, status, busy, start, stop };
}
