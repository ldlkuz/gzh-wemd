import type { BrowserWindow, IpcMainInvokeEvent } from "electron";
import { dialog, ipcMain } from "electron";
import * as fs from "fs";
import { getWorkspaceDir, setWorkspaceDir } from "../workspace/state";
import { writeStoredWorkspace } from "../workspace/persistence";
import { startWatching } from "../watch/workspaceWatcher";
import { restartServerIfRunning } from "./serverHandlers";

export function registerWorkspaceHandlers(
  getWindow: () => BrowserWindow | null,
): void {
  ipcMain.handle("workspace:select", async () => {
    const mainWindow = getWindow();
    if (!mainWindow) return { success: false, error: "Window not initialized" };
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ["openDirectory", "createDirectory"],
      message: "选择 WeMD 工作区文件夹",
    });
    if (result.canceled || result.filePaths.length === 0) {
      return { success: false, canceled: true };
    }
    const dir = result.filePaths[0];
    setWorkspaceDir(dir);
    writeStoredWorkspace(dir);
    startWatching(dir, getWindow);
    // 工作区切换后若渲染服务在跑，重启它以刷新 WEMD_WORKSPACE
    void restartServerIfRunning(getWindow);
    return { success: true, path: dir };
  });

  ipcMain.handle("workspace:current", async () => {
    return { success: true, path: getWorkspaceDir() };
  });

  ipcMain.handle(
    "workspace:set",
    async (_event: IpcMainInvokeEvent, dir: string) => {
      if (!dir || !fs.existsSync(dir)) {
        return { success: false, error: "Directory not found" };
      }
      setWorkspaceDir(dir);
      writeStoredWorkspace(dir);
      startWatching(dir, getWindow);
      // 工作区切换后若渲染服务在跑，重启它以刷新 WEMD_WORKSPACE
      void restartServerIfRunning(getWindow);
      return { success: true, path: dir };
    },
  );
}
