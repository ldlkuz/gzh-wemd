import type { StorageAdapter } from "../StorageAdapter";
import type {
  FileItem,
  StorageAdapterContext,
  StorageInitResult,
} from "../types";
import {
  copyDirectoryRecursive,
  deleteDirectoryRecursive,
  normalizePath,
  resolveDirectoryHandle,
  resolveFileHandle,
  resolveParentAndName,
  scanDirectory,
  splitPath,
} from "./fileSystemAdapterHelpers";

export class FileSystemAdapter implements StorageAdapter {
  readonly type = "filesystem" as const;
  readonly name = "FileSystem Access";
  readonly supportsFolders = true;
  ready = false;
  private directoryHandle: FileSystemDirectoryHandle | null = null;
  private handleKey = "fs-handle";

  // 获取选择的目录名称
  get directoryName(): string | null {
    return this.directoryHandle?.name ?? null;
  }

  async init(context?: StorageAdapterContext): Promise<StorageInitResult> {
    if (!("showDirectoryPicker" in window)) {
      return { ready: false, message: "File System Access API not supported" };
    }

    if (context?.identifier) {
      this.handleKey = `fs-handle-${context.identifier}`;
    }

    if (context?.identifier && !this.directoryHandle) {
      this.directoryHandle = await this.restoreHandle().catch(() => null);
    }

    if (!this.directoryHandle) {
      this.directoryHandle = await window.showDirectoryPicker({
        mode: "readwrite",
      });
      await this.persistHandle(this.directoryHandle);
    }

    const permission = await this.directoryHandle.requestPermission({
      mode: "readwrite",
    });
    this.ready = permission === "granted";
    return { ready: this.ready, message: permission };
  }

  private async persistHandle(handle: FileSystemDirectoryHandle) {
    try {
      const db = await this.openHandleDb();
      const tx = db.transaction("handles", "readwrite");
      await tx.store.put(handle, this.handleKey);
      await tx.done;
    } catch {
      /* ignore */
    }
  }

  private async restoreHandle(): Promise<FileSystemDirectoryHandle | null> {
    const db = await this.openHandleDb();
    const tx = db.transaction("handles", "readonly");
    const handle = await tx.store.get(this.handleKey);
    await tx.done;
    return handle ?? null;
  }

  private async openHandleDb() {
    const { openDB } = await import("idb");
    return openDB("wemd-fs-handles", 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("handles")) {
          db.createObjectStore("handles");
        }
      },
    });
  }

  private ensureHandle() {
    if (!this.directoryHandle)
      throw new Error("Directory handle not initialized");
    return this.directoryHandle;
  }

  /**
   * 递归读取目录，返回树形结构
   */
  async listFiles(): Promise<FileItem[]> {
    const handle = this.ensureHandle();
    return scanDirectory(handle, "");
  }

  async readFile(path: string): Promise<string> {
    const fileHandle = await this.resolveFileHandle(path);
    const file = await fileHandle.getFile();
    return file.text();
  }

  async writeFile(path: string, content: string): Promise<void> {
    const fileHandle = await this.resolveFileHandle(path, true);
    const writable = await fileHandle.createWritable();
    await writable.write(content);
    await writable.close();
  }

  async deleteFile(path: string): Promise<void> {
    const { parent, name } = await this.resolveParentAndName(path);
    await parent.removeEntry(name);
  }

  async renameFile(oldPath: string, newPath: string): Promise<void> {
    const normalizedOld = this.normalizePath(oldPath);
    const normalizedNew = this.normalizePath(newPath);

    if (normalizedOld === normalizedNew) return;

    const { dir: oldDir } = this.splitPath(normalizedOld);
    const { dir: newDir, name: nextName } = this.splitPath(normalizedNew);

    if (!nextName || nextName === "." || nextName === "..") {
      throw new Error("文件名不能为空");
    }
    if (oldDir !== newDir) {
      throw new Error("仅支持同目录重命名");
    }

    const targetPath = oldDir ? `${oldDir}/${nextName}` : nextName;
    const content = await this.readFile(normalizedOld);
    await this.writeFile(targetPath, content);
    await this.deleteFile(normalizedOld);
  }

  async exists(path: string): Promise<boolean> {
    try {
      await this.resolveFileHandle(path);
      return true;
    } catch {
      return false;
    }
  }

  async teardown() {
    this.directoryHandle = null;
    this.ready = false;
  }

  // --- 目录操作方法 ---

  async createFolder(
    folderPath: string,
  ): Promise<{ success: boolean; path?: string; error?: string }> {
    try {
      const parts = folderPath.split("/").filter(Boolean);
      if (parts.length === 0) {
        return { success: false, error: "文件夹名称不能为空" };
      }
      let current = this.ensureHandle();

      for (let index = 0; index < parts.length; index += 1) {
        const part = parts[index];
        const isLast = index === parts.length - 1;

        if (isLast) {
          try {
            await current.getDirectoryHandle(part);
            return { success: false, error: "文件夹已存在" };
          } catch (e: unknown) {
            const errorName = (e as { name?: string }).name;
            if (errorName && errorName !== "NotFoundError") {
              return {
                success: false,
                error: e instanceof Error ? e.message : String(e),
              };
            }
          }
        }

        // 逐级获取或创建目录，不进行特殊字符替换，因为 part 是路径的一部分
        current = await current.getDirectoryHandle(part, { create: true });
      }
      return { success: true, path: folderPath };
    } catch (e: unknown) {
      return {
        success: false,
        error: e instanceof Error ? e.message : String(e),
      };
    }
  }

  async moveFile(
    filePath: string,
    targetFolder: string,
  ): Promise<{ success: boolean; newPath?: string; error?: string }> {
    try {
      const fileName = filePath.split("/").pop() || filePath;
      const newPath = targetFolder ? `${targetFolder}/${fileName}` : fileName;

      if (filePath === newPath) return { success: true, newPath };

      let parent: FileSystemDirectoryHandle;
      let name: string;
      try {
        ({ parent, name } = await this.resolveParentAndName(newPath));
      } catch (e: unknown) {
        return { success: false, error: "目标文件夹不存在" };
      }

      try {
        await parent.getFileHandle(name);
        return { success: false, error: "目标位置已存在同名文件" };
      } catch (e: unknown) {
        const errorName = (e as { name?: string }).name;
        if (errorName && errorName !== "NotFoundError") {
          return {
            success: false,
            error: e instanceof Error ? e.message : String(e),
          };
        }
      }

      const content = await this.readFile(filePath);
      await this.writeFile(newPath, content);
      await this.deleteFile(filePath);
      return { success: true, newPath };
    } catch (e: unknown) {
      return {
        success: false,
        error: e instanceof Error ? e.message : String(e),
      };
    }
  }

  async deleteFolder(
    folderPath: string,
    options?: { recursive?: boolean },
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { parent, name } = await this.resolveParentAndName(folderPath);
      const recursive = options?.recursive === true;

      if (!recursive) {
        // 检查是否为空
        const folderHandle = await parent.getDirectoryHandle(name);
        const entries = [];
        for await (const entry of folderHandle.values()) {
          entries.push(entry);
        }
        if (entries.length > 0) {
          return {
            success: false,
            error: "文件夹不为空，请先移出或删除其中的文件",
          };
        }
        await parent.removeEntry(name);
        return { success: true };
      }

      try {
        await parent.removeEntry(name, { recursive: true });
        return { success: true };
      } catch {
        const folderHandle = await parent.getDirectoryHandle(name);
        await deleteDirectoryRecursive(folderHandle);
        await parent.removeEntry(name);
      }
      return { success: true };
    } catch (e: unknown) {
      return {
        success: false,
        error: e instanceof Error ? e.message : String(e),
      };
    }
  }

  async renameFolder(
    oldPath: string,
    newPath: string,
  ): Promise<{ success: boolean; newPath?: string; error?: string }> {
    return this.moveFolderPath(
      this.normalizePath(oldPath),
      this.normalizePath(newPath),
    );
  }

  async moveFolder(
    folderPath: string,
    targetFolder: string,
  ): Promise<{ success: boolean; newPath?: string; error?: string }> {
    const normalizedPath = this.normalizePath(folderPath);
    const normalizedTarget = this.normalizePath(targetFolder);
    const folderName = normalizedPath.split("/").pop() || normalizedPath;
    const newPath = normalizedTarget
      ? `${normalizedTarget}/${folderName}`
      : folderName;
    return this.moveFolderPath(normalizedPath, newPath);
  }

  async inspectFolder(
    folderPath: string,
  ): Promise<{ success: boolean; entries?: string[]; error?: string }> {
    try {
      const handle = await this.resolveDirectoryHandle(
        this.normalizePath(folderPath),
      );
      const entries: string[] = [];
      for await (const entry of handle.values()) {
        if (entry.name.startsWith(".")) {
          entries.push(entry.name);
          continue;
        }
        if (entry.kind === "file" && !entry.name.endsWith(".md")) {
          entries.push(entry.name);
        }
      }
      return { success: true, entries };
    } catch (e: unknown) {
      return {
        success: false,
        error: e instanceof Error ? e.message : String(e),
      };
    }
  }

  // --- 辅助方法 ---

  /**
   * 解析路径获取文件 handle
   */
  private async resolveFileHandle(
    path: string,
    create = false,
  ): Promise<FileSystemFileHandle> {
    return resolveFileHandle(this.ensureHandle(), path, create);
  }

  /**
   * 解析路径获取父目录 handle 和名称
   */
  private async resolveParentAndName(
    path: string,
  ): Promise<{ parent: FileSystemDirectoryHandle; name: string }> {
    return resolveParentAndName(this.ensureHandle(), path);
  }

  private async resolveDirectoryHandle(
    path: string,
  ): Promise<FileSystemDirectoryHandle> {
    return resolveDirectoryHandle(this.ensureHandle(), path);
  }

  private normalizePath(input: string): string {
    return normalizePath(input);
  }

  private splitPath(path: string): { dir: string; name: string } {
    return splitPath(path);
  }

  private async moveFolderPath(
    oldPath: string,
    newPath: string,
  ): Promise<{ success: boolean; newPath?: string; error?: string }> {
    try {
      const normalizedOld = this.normalizePath(oldPath);
      const normalizedNew = this.normalizePath(newPath);

      if (normalizedOld === normalizedNew)
        return { success: true, newPath: oldPath };
      if (normalizedNew.startsWith(`${normalizedOld}/`)) {
        return { success: false, error: "不能移动到子文件夹" };
      }

      const { parent: oldParent, name: oldName } =
        await this.resolveParentAndName(normalizedOld);
      let sourceHandle: FileSystemDirectoryHandle;
      try {
        sourceHandle = await oldParent.getDirectoryHandle(oldName);
      } catch (e: unknown) {
        return { success: false, error: "文件夹不存在" };
      }

      let newParent: FileSystemDirectoryHandle;
      let newName: string;
      try {
        ({ parent: newParent, name: newName } =
          await this.resolveParentAndName(normalizedNew));
      } catch (e: unknown) {
        return { success: false, error: "目标文件夹不存在" };
      }

      try {
        await newParent.getDirectoryHandle(newName);
        return { success: false, error: "目标位置已存在同名文件夹" };
      } catch (e: unknown) {
        const errorName = (e as { name?: string }).name;
        if (errorName && errorName !== "NotFoundError") {
          return {
            success: false,
            error: e instanceof Error ? e.message : String(e),
          };
        }
      }

      try {
        await newParent.getFileHandle(newName);
        return { success: false, error: "目标位置已存在同名文件" };
      } catch (e: unknown) {
        const errorName = (e as { name?: string }).name;
        if (errorName && errorName !== "NotFoundError") {
          return {
            success: false,
            error: e instanceof Error ? e.message : String(e),
          };
        }
      }

      const targetHandle = await newParent.getDirectoryHandle(newName, {
        create: true,
      });
      await copyDirectoryRecursive(sourceHandle, targetHandle);

      try {
        await oldParent.removeEntry(oldName, { recursive: true });
      } catch {
        await deleteDirectoryRecursive(sourceHandle);
        await oldParent.removeEntry(oldName);
      }

      return { success: true, newPath: normalizedNew };
    } catch (e: unknown) {
      return {
        success: false,
        error: e instanceof Error ? e.message : String(e),
      };
    }
  }
}
