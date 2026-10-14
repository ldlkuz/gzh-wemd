import { ipcMain, type BrowserWindow } from "electron";
import log from "../logger";
import { exportDiagnostics } from "../diagnostics";

const LEVELS = ["error", "warn", "info", "verbose", "debug", "silly"] as const;
type Level = (typeof LEVELS)[number];

function isLevel(value: unknown): value is Level {
  return typeof value === "string" && (LEVELS as readonly string[]).includes(value);
}

export function registerLogHandlers(
  getWindow: () => BrowserWindow | null,
): void {
  /**
   * 渲染进程日志转发：真实 bug 大多出在渲染层，只记主进程等于没记。
   * 只收白名单级别 + 字符串，避免渲染进程往日志里塞任意对象。
   */
  ipcMain.on("log:write", (_event, level: unknown, message: unknown) => {
    const text = typeof message === "string" ? message : String(message ?? "");
    const effective: Level = isLevel(level) ? level : "info";
    log[effective](`[renderer] ${text}`);
  });

  ipcMain.handle("diagnostics:export", () => exportDiagnostics(getWindow));
}
