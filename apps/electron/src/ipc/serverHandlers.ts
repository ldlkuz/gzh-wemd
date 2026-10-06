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
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import * as net from "node:net";
import * as path from "node:path";
import {
  app,
  ipcMain,
  type BrowserWindow,
  type IpcMainInvokeEvent,
} from "electron";
import { getWorkspaceDir } from "../workspace/state";

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
/** 子进程 stdout 行缓冲：data 分片不保证按行对齐，标记行可能被切开 */
let stdoutBuffer = "";
/** 启动 / 运行日志环形缓冲，便于排查 */
const logBuffer: string[] = [];
/** 日志缓冲上限（行） */
const MAX_LOG_LINES = 500;

function pushLog(chunk: string): void {
  // stdout 分片不保证按行对齐，一次 data 可能带多行：按行拆开入缓冲，
  // 保证界面「最近 N 行」计数与实际行数一致。
  for (const raw of chunk.split(/\r?\n/)) {
    const line = raw.replace(/\s+$/, "");
    if (!line) continue;
    logBuffer.push(line);
    if (logBuffer.length > MAX_LOG_LINES) logBuffer.shift();
  }
}

/** 服务偏好文件（记录用户是否希望随程序自动启动） */
function preferenceFile(): string {
  return path.join(app.getPath("userData"), "server.json");
}

/** 读取「随程序自动启动」偏好；无记录时默认开启 */
function readAutoStart(): boolean {
  try {
    const raw = readFileSync(preferenceFile(), "utf-8");
    const parsed = JSON.parse(raw) as { autoStart?: unknown };
    return parsed.autoStart !== false;
  } catch {
    return true;
  }
}

/** 记录「随程序自动启动」偏好：用户主动启动 → true，主动停止 → false */
function writeAutoStart(value: boolean): void {
  try {
    writeFileSync(
      preferenceFile(),
      JSON.stringify({ autoStart: value }, null, 2),
      "utf-8",
    );
  } catch (error) {
    console.error("持久化服务偏好失败:", error);
  }
}

/** 解析 server 单文件入口：打包走 resources/server-dist，开发走 apps/server/dist */
function resolveServerEntry(): string {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, "server-dist", "index.mjs");
  }
  // dist/ipc -> 上三级即 apps 目录，再进 server/dist
  return path.resolve(__dirname, "../../../server/dist/index.mjs");
}

/** 解析 MCP 瘦代理入口：打包走 resources/mcp，开发走 apps/mcp/dist */
function resolveMcpEntry(): string {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, "mcp", "index.mjs");
  }
  // dist/ipc -> 上三级即 apps 目录，再进 mcp/dist
  return path.resolve(__dirname, "../../../mcp/dist/index.mjs");
}

/**
 * 生成可直接粘贴到 MCP 客户端的配置。
 * command 指向当前程序自身（electron.exe / WeMD.exe），配合 ELECTRON_RUN_AS_NODE
 * 把程序当纯 node 用来跑 MCP 入口 —— 用户机器因此无需安装 Node。
 */
function buildMcpConfig(): { mcpServers: Record<string, unknown> } {
  return {
    mcpServers: {
      wemd: {
        command: process.execPath,
        args: [resolveMcpEntry()],
        env: { ELECTRON_RUN_AS_NODE: "1" },
      },
    },
  };
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

/** 反复探测直到端口不再被监听或超时（重启前等待旧进程释放端口） */
async function waitForPortFree(
  port: number,
  timeoutMs = 3000,
): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (!(await probeOnce(port))) return true;
    await new Promise((r) => setTimeout(r, 150));
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

/**
 * 解析 server 输出的一行日志，命中「文章已写入」标记时通知渲染进程自动打开。
 * 标记由 apps/server 的 /articles 端点写入后输出：WEMD_ARTICLE_WRITTEN:<路径>
 * 注意：调用方必须传入**完整的一行**（见 stdout 行缓冲逻辑）。
 */
function notifyWrittenArticle(
  getWindow: () => BrowserWindow | null,
  line: string,
): void {
  const match = line.match(/^WEMD_ARTICLE_WRITTEN:(.+)$/);
  if (!match) return;
  const filePath = match[1].trim();
  if (!filePath) return;
  getWindow()?.webContents.send("article:written", { path: filePath });
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
  const hadChild = !!childProcess;
  if (childProcess) {
    // 有句柄但端口没活（异常退出残留），清理后重建
    killChild();
  }
  // 首次启动时确认端口未被其他程序占用，否则探测会把别人的服务误判成自己的
  if (!hadChild && (await probeOnce(port))) {
    return {
      running: false,
      port: null,
      error: `端口 ${port} 已被其他程序占用，请关闭后重试`,
    };
  }

  // 开发态友好提示：产物不存在时不要崩溃
  if (!serverEntryExists()) {
    const hint = app.isPackaged
      ? "打包内缺少接口服务产物"
      : "未找到接口服务构建产物，请先在 apps/server 目录运行 node build.mjs 构建";
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
      // 当前工作区目录：供 POST /articles 把文章落盘到用户在用的工作区
      WEMD_WORKSPACE: getWorkspaceDir() ?? "",
      // 程序版本：供 GET /health 返回，便于外部确认服务是否匹配
      WEMD_VERSION: app.getVersion(),
    },
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });
  childProcess = child;
  stdoutBuffer = "";

  child.stdout?.on("data", (d) => {
    const text = String(d);
    pushLog(text);
    // 按完整行解析：stdout 分片不保证按行对齐，末段可能被截断，留到下一片
    stdoutBuffer += text;
    const lines = stdoutBuffer.split(/\r?\n/);
    stdoutBuffer = lines.pop() ?? "";
    for (const line of lines) notifyWrittenArticle(getWindow, line);
  });
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
      : `WeMD 接口启动失败（端口 ${port} 未监听），详见主进程日志`,
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
    ): Promise<ServerStatus> => {
      // 用户主动启动 → 记住，之后随程序自动启动
      writeAutoStart(true);
      return startServer(getWindow, payload?.port);
    },
  );

  ipcMain.handle(
    "server:stop",
    async (): Promise<ServerStatus> => {
      // 用户主动停止 → 记住，之后不再自动启动
      writeAutoStart(false);
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

  // 服务运行日志（环形缓冲快照），供界面排查推送失败等问题
  ipcMain.handle(
    "server:logs",
    async (): Promise<{ logs: string[] }> => {
      return { logs: [...logBuffer] };
    },
  );

  // 生成 MCP 客户端配置，供界面「复制 MCP 配置」按钮使用
  ipcMain.handle("server:mcpConfig", async () => buildMcpConfig());

  // 应用退出时兜底清理，避免在用户本机残留孤儿进程
  app.on("will-quit", () => {
    killChild();
  });
}

/**
 * 工作区变更后重启服务，让子进程重新拿到 WEMD_WORKSPACE。
 * 仅在服务运行中时重启；未运行则什么都不做（下次启动自然读到新工作区）。
 */
export async function restartServerIfRunning(
  getWindow: () => BrowserWindow | null,
): Promise<void> {
  if (!isChildAlive(childProcess) || currentPort === null) return;
  const port = currentPort;
  killChild();
  // 等旧进程释放端口，避免新进程 EADDRINUSE
  await waitForPortFree(port);
  await startServer(getWindow, port);
}

/**
 * 程序启动时按偏好自动拉起渲染服务，消除「忘了开服务」导致的推送失败。
 * 用户上次主动停止过则不启动（偏好见 userData/server.json）。
 */
export async function autoStartServerIfEnabled(
  getWindow: () => BrowserWindow | null,
): Promise<void> {
  if (!readAutoStart()) return;
  await startServer(getWindow);
}