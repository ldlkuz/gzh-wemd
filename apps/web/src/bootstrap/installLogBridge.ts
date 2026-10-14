// 把渲染进程的报错与 console.error/warn 转发到主进程日志文件。
// 真实 bug 大多出在渲染层，只记主进程等于没记；
// 浏览器版没有 electron.log，installLogBridge 会静默跳过（返回空清理函数）。

export type BridgeLogLevel = "error" | "warn";

/** 单条日志上限：堆栈很长时截断，避免把日志文件撑爆 */
export const MAX_LOG_LENGTH = 4000;

export interface LogBridgeDeps {
  target: Pick<Window, "addEventListener" | "removeEventListener">;
  bridge?: { write?: (level: string, message: string) => void };
  console: Pick<Console, "error" | "warn">;
}

function formatArg(value: unknown): string {
  if (typeof value === "string") return value;
  if (value instanceof Error) {
    return `${value.name}: ${value.message}${value.stack ? `\n${value.stack}` : ""}`;
  }
  try {
    return JSON.stringify(value) ?? String(value);
  } catch {
    return String(value);
  }
}

/** 序列化日志参数并截断（导出供单测使用） */
export function formatLogArgs(args: unknown[]): string {
  const text = args.map(formatArg).join(" ");
  return text.length > MAX_LOG_LENGTH
    ? `${text.slice(0, MAX_LOG_LENGTH)}…[已截断]`
    : text;
}

export function installLogBridge(deps: LogBridgeDeps): () => void {
  const { target, bridge, console: consoleRef } = deps;
  const write = bridge?.write;
  if (!write) return () => {};

  const onError = (event: ErrorEvent) => {
    const stack =
      event.error instanceof Error ? `\n${event.error.stack ?? ""}` : "";
    write("error", `[window.error] ${event.message}${stack}`);
  };

  const onRejection = (event: PromiseRejectionEvent) => {
    write("error", `[unhandledrejection] ${formatLogArgs([event.reason])}`);
  };

  const originalError = consoleRef.error.bind(consoleRef);
  const originalWarn = consoleRef.warn.bind(consoleRef);

  consoleRef.error = (...args: unknown[]) => {
    originalError(...args);
    write("error", formatLogArgs(args));
  };
  consoleRef.warn = (...args: unknown[]) => {
    originalWarn(...args);
    write("warn", formatLogArgs(args));
  };

  target.addEventListener("error", onError);
  target.addEventListener("unhandledrejection", onRejection);

  return () => {
    target.removeEventListener("error", onError);
    target.removeEventListener("unhandledrejection", onRejection);
    consoleRef.error = originalError;
    consoleRef.warn = originalWarn;
  };
}
