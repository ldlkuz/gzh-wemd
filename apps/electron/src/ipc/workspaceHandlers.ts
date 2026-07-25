import type { BrowserWindow, IpcMainInvokeEvent } from "electron";
import { dialog, ipcMain } from "electron";
import * as fs from "fs";
import { getWorkspaceDir, setWorkspaceDir } from "../workspace/state";
import { startWatching } from "../watch/workspaceWatcher";

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
    startWatching(dir, getWindow);
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
      startWatching(dir, getWindow);
      return { success: true, path: dir };
    },
  );
}
