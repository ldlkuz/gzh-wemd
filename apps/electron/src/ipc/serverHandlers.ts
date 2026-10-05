/**
 * Render 渲染服务管理：启动 / 停止 / 查询 HTTP 渲染服务
 *
 * 这个服务由 apps/server 提供（Node http 服务），供外部程序 / skill 通过 HTTP 调用：
 *   - POST /render           传 markdown → 返回可直接粘公众号的 HTML
 *   - GET  /themes/:id/guide 返回该主题的手写组件手册
 * 等。
 *
 * 主进程用 `ELECTRON_RUN_AS_NODE=1` 把 electron 当纯 node 用，spawn 出构建好的
 * server 入口 index.mjs，注入 WEMD_HOST / WEMD_PORT / WEMD_GUIDE_DIR 环境变量。
 * 这样打包进 exe 后无需额外安装 node，也能在用户本机拉起一个本地 HTTP 服务。
 */
import { spawn, type ChildProcess } from "node:child_process";
import { existsSync } from "node:fs";
import * as net from "node:net";
import * as path from "node:path";
import {
  app,
  ipcMain,
  type BrowserWindow,
  type IpcMainInvokeEvent,
} from "electron";

const DEFAULT_HOST = "127.0.0.1";
const DEFAULT_PORT = 8787;

/** 服务运行状态（也是推送给渲染进程的 payload 结构） */
export interface ServerStatus {
  running: boolean;
  port: number | null;
  pid?: number;
  error?: string;
}

// —— 模块级运行时状态（整个主进程存活期内保持）——
let childProcess: ChildProcess | null = null;
let currentPort: number | null = null;
/** 启动 / 运行日志环形缓冲，便于排查 */
const logBuffer: string[] = [];

function pushLog(line: string): void {
  logBuffer.push(line.replace(/\s+$/, ""));
  if (logBuffer.length > 200) logBuffer.shift();
}

/** 解析 server 单文件入口：打包走 resources/server-dist，开发走 apps/server/dist */
function resolveServerEntry(): string {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, "server-dist", "index.mjs");
  }
  // dist/ipc -> 上三级即 apps 目录，再进 server/dist
  return path.resolve(__dirname, "../../../server/dist/index.mjs");
}

/** 手写主题手册目录：打包走 resources/theme-guides，开发回退到源码目录 */
function resolveGuideDir(): string {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, "theme-guides");
  }
  // dist/ipc -> 上四级即仓库根，再进 apps/web/public/theme-guides
  return path.resolve(
    __dirname,
    "../../../../apps/web/public/theme-guides",
  );
}

/** 开发态：server 产物是否已构建（未构建时给出友好提示而非崩溃） */
function serverEntryExists(): boolean {
  try {
    return existsSync(resolveServerEntry());
  } catch {
    return false;
  }
}

/** 单次端口探测：host:port 是否已被监听 */
function probeOnce(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host: DEFAULT_HOST, port });
    const done = (alive: boolean): void => {
      socket.destroy();
      resolve(alive);
    };
    socket.setTimeout(2000);
    socket.once("connect", () => done(true));
    socket.once("error", () => done(false));
    socket.once("timeout", () => done(false));
  });
}

/** 反复探测直到端口可连接或超时（用于等待服务启动完成） */
async function waitForPort(
  port: number,
  timeoutMs = 6000,
): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await probeOnce(port)) return true;
    await new Promise((r) => setTimeout(r, 200));
  }
  return false;
}

/** 子进程是否还活着 */
function isChildAlive(child: ChildProcess | null): boolean {
  return !!child && child.exitCode === null && child.signalCode === null;
}

/** 主动把状态推给渲染进程（preload 用 onStatusChange 监听） */
function broadcast(
  getWindow: () => BrowserWindow | null,
  status: ServerStatus,
): void {
  getWindow()?.webContents.send("server:status", status);
}

/** 结束子进程（幂等） */
function killChild(): void {
  if (isChildAlive(childProcess)) {
    childProcess?.kill();
  }
  childProcess = null;
  currentPort = null;
}

/**
 * 启动渲染服务。重复启动是幂等的：端口已活着则直接返回 running。
 */
async function startServer(
  getWindow: () => BrowserWindow | null,
  requestedPort?: number,
): Promise<ServerStatus> {
  const port =
    requestedPort && Number.isFinite(requestedPort)
      ? Math.trunc(requestedPort)
      : DEFAULT_PORT;

  // 幂等：已在运行且端口活着 → 直接返回
  if (isChildAlive(childProcess) && currentPort && (await probeOnce(port))) {
    return { running: true, port, pid: childProcess?.pid };
  }
  if (childProcess) {
    // 有句柄但端口没活（异常退出残留），清理后重建
    killChild();
  }

  // 开发态友好提示：产物不存在时不要崩溃
  if (!serverEntryExists()) {
    const hint = app.isPackaged
      ? "打包内缺少渲染服务产物"
      : "未找到渲染服务构建产物，请先在 apps/server 目录运行 node build.mjs 构建";
    return { running: false, port: null, error: hint };
  }

  const entry = resolveServerEntry();
  const guideDir = resolveGuideDir();

  const child = spawn(process.execPath, [entry], {
    env: {
      ...process.env,
      // 让 electron 以纯 node 模式运行 server 脚本
      ELECTRON_RUN_AS_NODE: "1",
      WEMD_HOST: DEFAULT_HOST,
      WEMD_PORT: String(port),
      WEMD_GUIDE_DIR: guideDir,
    },
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });
  childProcess = child;

  child.stdout?.on("data", (d) => pushLog(String(d)));
  child.stderr?.on("data", (d) => pushLog(String(d)));
  child.on("error", (err) => {
    pushLog(`[server] spawn 出错：${err.message}`);
  });
  child.on("exit", (code, signal) => {
    pushLog(
      `[server] 进程退出 code=${code} signal=${signal ?? "none"}`
    );
    if (childProcess === child) {
      childProcess = null;
      currentPort = null;
    }
    broadcast(getWindow, { running: false, port: null });
  });

  const started = await waitForPort(port);
  if (started) {
    currentPort = port;
  } else {
    // 启动超时视为失败，释放句柄
    child.kill();
    pushLog(
      `[server] 启动超时：${entry}（端口 ${port} 未监听）最近日志：\n${logBuffer
        .slice(-5)
        .join("\n")}`,
    );
  }

  const status: ServerStatus = {
    running: started,
    port: started ? port : null,
    pid: child.pid,
    error: started
      ? undefined
      : `渲染服务启动失败（端口 ${port} 未监听），详见主进程日志`,
  };
  broadcast(getWindow, status);
  return status;
}

export function registerServerHandlers(
  getWindow: () => BrowserWindow | null,
): void {
  ipcMain.handle(
    "server:start",
    async (
      _event: IpcMainInvokeEvent,
      payload?: { port?: number },
    ): Promise<ServerStatus> => startServer(getWindow, payload?.port),
  );

  ipcMain.handle(
    "server:stop",
    async (): Promise<ServerStatus> => {
      killChild();
      const status: ServerStatus = { running: false, port: null };
      broadcast(getWindow, status);
      return status;
    },
  );

  ipcMain.handle(
    "server:status",
    async (): Promise<ServerStatus> => {
      let running = false;
      let port: number | null = currentPort;
      if (isChildAlive(childProcess) && port !== null) {
        running = await probeOnce(port);
        if (!running) {
          // 句柄在但端口没活：视为异常残留
          killChild();
          port = null;
        }
      } else if (!isChildAlive(childProcess)) {
        port = null;
      }
      return { running, port };
    },
  );

  // 应用退出时兜底清理，避免在用户本机残留孤儿进程
  app.on("will-quit", () => {
    killChild();
  });
}