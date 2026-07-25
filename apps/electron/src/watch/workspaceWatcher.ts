import type { BrowserWindow } from "electron";
import * as fs from "fs";
import * as path from "path";
import {
  collectWatchableDirectories,
  createDebouncedRefresh,
  shouldTriggerWorkspaceRefresh,
} from "./workspaceWatcherUtils";

const watchers = new Map<string, fs.FSWatcher>();
let refreshScheduler: ReturnType<typeof createDebouncedRefresh> | null = null;

function sendRefresh(getWindow: () => BrowserWindow | null): void {
  const mainWindow = getWindow();
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send("file:refresh");
  }
}

function closeWatchersUnder(targetPath: string): void {
  const normalizedTarget = path.resolve(targetPath);
  for (const [dir, watcher] of watchers) {
    const normalizedDir = path.resolve(dir);
    if (
      normalizedDir === normalizedTarget ||
      normalizedDir.startsWith(`${normalizedTarget}${path.sep}`)
    ) {
      watcher.close();
      watchers.delete(dir);
    }
  }
}

function watchDirectory(
  dir: string,
  getWindow: () => BrowserWindow | null,
): void {
  if (watchers.has(dir)) return;

  try {
    const watcher = fs.watch(
      dir,
      { recursive: false },
      (_eventType, filename) => {
        const changedName = filename?.toString();
        if (!changedName) {
          refreshScheduler?.schedule();
          return;
        }

        const changedPath = path.join(dir, changedName);
        const wasWatchedDirectory = watchers.has(changedPath);
        const exists = fs.existsSync(changedPath);
        let isDirectory = false;
        if (exists) {
          try {
            isDirectory = fs.statSync(changedPath).isDirectory();
          } catch {
            isDirectory = false;
          }
        }

        const shouldRefresh = shouldTriggerWorkspaceRefresh(changedName, {
          exists,
          isDirectory,
          wasWatchedDirectory,
        });

        if (shouldRefresh && exists && isDirectory) {
          watchDirectoryTree(changedPath, getWindow);
        }
        if (!exists) {
          closeWatchersUnder(changedPath);
        }

        if (shouldRefresh) {
          refreshScheduler?.schedule();
        }
      },
    );
    watchers.set(dir, watcher);
  } catch (error) {
    console.error("Failed to watch directory:", dir, error);
  }
}

function watchDirectoryTree(
  dir: string,
  getWindow: () => BrowserWindow | null,
): void {
  for (const targetDir of collectWatchableDirectories(dir)) {
    watchDirectory(targetDir, getWindow);
  }
}

export function startWatching(
  dir: string,
  getWindow: () => BrowserWindow | null,
): void {
  stopWatching();
  if (!dir || !fs.existsSync(dir)) return;

  refreshScheduler = createDebouncedRefresh(() => sendRefresh(getWindow));
  watchDirectoryTree(dir, getWindow);
}

export function stopWatching(): void {
  for (const watcher of watchers.values()) {
    watcher.close();
  }
  watchers.clear();
  refreshScheduler?.cancel();
  refreshScheduler = null;
}
