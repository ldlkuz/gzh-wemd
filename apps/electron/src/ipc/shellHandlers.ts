import * as path from "path";
import type { IpcMainInvokeEvent } from "electron";
import { app, ipcMain, shell } from "electron";

function getPluginRootPath(): string {
  // 插件通过 electron-builder 的 extraFiles 释放到安装根目录（用户可见），
  // 而非隐藏的 resources 目录，方便用户按说明手动安装。
  if (app.isPackaged) {
    return path.join(path.dirname(process.execPath), "wechat-plugin");
  }
  return path.resolve(__dirname, "../../../../wechat-plugin");
}

function getPluginInstructionPath(): string {
  return path.join(getPluginRootPath(), "使用说明.md");
}

export function registerShellHandlers(): void {
  ipcMain.handle(
    "shell:openExternal",
    async (_event: IpcMainInvokeEvent, url: string) => {
      if (url && (url.startsWith("http://") || url.startsWith("https://"))) {
        await shell.openExternal(url);
      }
    },
  );

  ipcMain.handle("shell:openPath", async (_event: IpcMainInvokeEvent, targetPath: string) => {
    if (!targetPath) return { success: false, error: "Path is required" };
    const error = await shell.openPath(targetPath);
    return { success: !error, error: error || undefined };
  });

  ipcMain.handle("shell:openPluginDirectory", async () => {
    const pluginPath = getPluginRootPath();
    shell.showItemInFolder(path.join(pluginPath, "manifest.json"));
    return { success: true, path: pluginPath };
  });

  ipcMain.handle("shell:openPluginInstructions", async () => {
    const instructionPath = getPluginInstructionPath();
    const error = await shell.openPath(instructionPath);
    return {
      success: !error,
      path: instructionPath,
      error: error || undefined,
    };
  });
}
