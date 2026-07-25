import type { IpcMainInvokeEvent } from "electron";
import { ipcMain, shell } from "electron";
import * as fs from "fs";
import * as path from "path";
import { getWorkspaceDir, isPathInsideWorkspace } from "../workspace/state";

export function registerFolderHandlers(): void {
  ipcMain.handle(
    "folder:create",
    async (_event: IpcMainInvokeEvent, folderPathArg: string) => {
      const workspaceDir = getWorkspaceDir();
      if (!workspaceDir) return { success: false, error: "No workspace" };
      if (!folderPathArg || folderPathArg.trim() === "") {
        return { success: false, error: "文件夹名称不能为空" };
      }

      let targetPath = folderPathArg.trim();
      if (!path.isAbsolute(targetPath)) {
        targetPath = path.join(workspaceDir, targetPath);
      }

      if (!isPathInsideWorkspace(targetPath)) {
        return { success: false, error: "非法路径" };
      }

      if (fs.existsSync(targetPath)) {
        return { success: false, error: "文件夹已存在" };
      }

      try {
        fs.mkdirSync(targetPath, { recursive: true });
        return {
          success: true,
          path: targetPath,
          name: path.basename(targetPath),
        };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },
  );

  ipcMain.handle(
    "folder:rename",
    async (
      _event: IpcMainInvokeEvent,
      payload: { folderPath: string; newName: string },
    ) => {
      const { folderPath, newName } = payload;
      if (!folderPath || !newName)
        return { success: false, error: "Invalid arguments" };
      if (!isPathInsideWorkspace(folderPath))
        return { success: false, error: "非法路径" };

      if (!fs.existsSync(folderPath)) {
        return { success: false, error: "文件夹不存在" };
      }
      const stats = fs.statSync(folderPath);
      if (!stats.isDirectory()) {
        return { success: false, error: "不是文件夹" };
      }

      const safeBaseName = path.basename(newName.trim());
      if (!safeBaseName) {
        return { success: false, error: "文件夹名称不能为空" };
      }

      const dir = path.dirname(folderPath);
      const newPath = path.join(dir, safeBaseName);

      if (!isPathInsideWorkspace(newPath)) {
        return { success: false, error: "非法路径" };
      }

      if (folderPath === newPath) {
        return { success: true, newPath };
      }

      if (fs.existsSync(newPath)) {
        return { success: false, error: "文件夹已存在" };
      }

      try {
        fs.renameSync(folderPath, newPath);
        return { success: true, newPath };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },
  );

  ipcMain.handle(
    "folder:move-folder",
    async (
      _event: IpcMainInvokeEvent,
      payload: { folderPath: string; targetFolder: string },
    ) => {
      const { folderPath, targetFolder } = payload;
      if (!folderPath) return { success: false, error: "Path required" };

      if (!isPathInsideWorkspace(folderPath)) {
        return { success: false, error: "非法路径" };
      }

      if (!fs.existsSync(folderPath)) {
        return { success: false, error: "文件夹不存在" };
      }

      const stats = fs.statSync(folderPath);
      if (!stats.isDirectory()) {
        return { success: false, error: "不是文件夹" };
      }

      const targetDir = targetFolder ? targetFolder : getWorkspaceDir();
      if (!targetDir) return { success: false, error: "No workspace" };

      if (!isPathInsideWorkspace(targetDir)) {
        return { success: false, error: "非法路径" };
      }

      if (!fs.existsSync(targetDir) || !fs.statSync(targetDir).isDirectory()) {
        return { success: false, error: "目标文件夹不存在" };
      }

      const folderName = path.basename(folderPath);
      const newPath = path.join(targetDir, folderName);

      if (folderPath === newPath) return { success: true, newPath };

      const resolvedOld = path.resolve(folderPath);
      const resolvedNew = path.resolve(newPath);
      if (resolvedNew.startsWith(resolvedOld + path.sep)) {
        return { success: false, error: "不能移动到子文件夹" };
      }

      if (fs.existsSync(newPath)) {
        return { success: false, error: "目标位置已存在同名文件夹" };
      }

      try {
        fs.renameSync(folderPath, newPath);
        return { success: true, newPath };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },
  );

  ipcMain.handle(
    "folder:move",
    async (
      _event: IpcMainInvokeEvent,
      payload: { filePath: string; targetFolder: string },
    ) => {
      const { filePath, targetFolder } = payload;
      if (!filePath) return { success: false, error: "File path required" };

      const targetDir = targetFolder ? targetFolder : getWorkspaceDir();
      if (!targetDir) return { success: false, error: "No workspace" };

      if (
        !isPathInsideWorkspace(filePath) ||
        !isPathInsideWorkspace(targetDir)
      ) {
        return { success: false, error: "非法路径" };
      }

      const fileName = path.basename(filePath);
      const newPath = path.join(targetDir, fileName);

      if (filePath === newPath) return { success: true, newPath };

      if (fs.existsSync(newPath)) {
        return { success: false, error: "目标位置已存在同名文件" };
      }

      try {
        fs.renameSync(filePath, newPath);
        return { success: true, newPath };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },
  );

  ipcMain.handle(
    "folder:inspect",
    async (_event: IpcMainInvokeEvent, folderPath: string) => {
      if (!folderPath) return { success: false, error: "Path required" };
      try {
        if (!isPathInsideWorkspace(folderPath)) {
          return { success: false, error: "非法路径" };
        }
        if (!fs.existsSync(folderPath)) {
          return { success: false, error: "文件夹不存在" };
        }
        const stats = fs.statSync(folderPath);
        if (!stats.isDirectory()) {
          return { success: false, error: "不是文件夹" };
        }

        const entries = fs.readdirSync(folderPath, { withFileTypes: true });
        const extraEntries = entries
          .filter((entry) => {
            if (entry.name.startsWith(".")) return true;
            return entry.isFile() && !entry.name.endsWith(".md");
          })
          .map((entry) => entry.name);

        return { success: true, entries: extraEntries };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },
  );

  ipcMain.handle(
    "folder:delete",
    async (
      _event: IpcMainInvokeEvent,
      payload: string | { folderPath: string; recursive?: boolean },
    ) => {
      const folderPath =
        typeof payload === "string" ? payload : payload?.folderPath;
      const recursive =
        typeof payload === "string" ? false : payload?.recursive === true;
      if (!folderPath) return { success: false, error: "Path required" };

      try {
        if (!isPathInsideWorkspace(folderPath)) {
          return { success: false, error: "非法路径" };
        }
        if (!fs.existsSync(folderPath)) {
          return { success: true };
        }

        const stats = fs.statSync(folderPath);
        if (!stats.isDirectory()) {
          return { success: false, error: "不是文件夹" };
        }

        if (recursive) {
          try {
            await shell.trashItem(folderPath);
            return { success: true };
          } catch {
            fs.rmSync(folderPath, { recursive: true, force: true });
            return { success: true };
          }
        }

        const contents = fs.readdirSync(folderPath);
        if (contents.length > 0) {
          return {
            success: false,
            error: "文件夹不为空，请先移出或删除其中的文件",
          };
        }

        fs.rmdirSync(folderPath);
        return { success: true };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },
  );
}
