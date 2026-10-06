import { app, BrowserWindow, session } from "electron";
import { createMenu } from "./menu";
import { registerIpcHandlers } from "./ipc";
import { checkForUpdates, initAutoUpdate } from "./updater";
import { configureAppIdentity, createWindow } from "./window";
import { startWatching, stopWatching } from "./watch/workspaceWatcher";
import { setWorkspaceDir } from "./workspace/state";
import {
  resolveInitialWorkspace,
  writeStoredWorkspace,
} from "./workspace/persistence";
import { autoStartServerIfEnabled } from "./ipc/serverHandlers";

const isDev =
  !app.isPackaged ||
  process.argv.includes("--dev") ||
  !!process.env.ELECTRON_START_URL;

configureAppIdentity();

/**
 * 绕过 CORS 限制,让渲染进程能直接 fetch 任意 AI 厂商 API
 * (DeepSeek/OpenAI/通义/Kimi/智谱 等都不返回 CORS 头,
 *  浏览器环境会被拦截,Electron 主进程改响应头即可绕过)
 */
function setupCorsBypass(): void {
  session.defaultSession.webRequest.onHeadersReceived(
    (details, callback) => {
      const headers = { ...details.responseHeaders };
      // 覆盖 CORS 头,允许任意来源(渲染进程是 file:// 或 http://localhost)
      headers["Access-Control-Allow-Origin"] = ["*"];
      headers["Access-Control-Allow-Methods"] = [
        "GET, POST, PUT, DELETE, OPTIONS",
      ];
      headers["Access-Control-Allow-Headers"] = [
        "Content-Type, Authorization",
      ];
      callback({ responseHeaders: headers });
    },
  );
}

let mainWindow: BrowserWindow | null = null;

const getMainWindow = () => mainWindow;

registerIpcHandlers(getMainWindow);

function openMainWindow(): BrowserWindow {
  mainWindow = createWindow({
    isDev,
    onClosed: () => {
      mainWindow = null;
      stopWatching();
    },
  });
  return mainWindow;
}

app.whenReady().then(() => {
  // 注册 CORS 绕过,让渲染进程能直连任意 AI 厂商 API
  setupCorsBypass();

  // 无需等待后端,直接打开窗口(Electron + 前端直连 AI 厂商)
  openMainWindow();

  // 初始化工作区：优先上次记住的，否则用默认目录（文档/WeMD）并自动创建
  // 这样程序自带一个可用工作区，外部 skill 推送文章时无需关心路径
  const initialWorkspace = resolveInitialWorkspace();
  if (initialWorkspace) {
    setWorkspaceDir(initialWorkspace);
    writeStoredWorkspace(initialWorkspace);
    startWatching(initialWorkspace, getMainWindow);
    // 按偏好自动拉起渲染服务，避免用户忘记开启导致外部推送失败
    void autoStartServerIfEnabled(getMainWindow);
  }

  createMenu(getMainWindow);

  // 初始化自动更新（electron-updater 事件 → IPC），启动约 3 秒后静默检查一次
  initAutoUpdate(getMainWindow);
  setTimeout(() => {
    checkForUpdates(getMainWindow);
  }, 3000);

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      openMainWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
