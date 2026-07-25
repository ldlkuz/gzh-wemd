import * as fs from "fs";
import * as path from "path";

export interface ChangeInfo {
  exists?: boolean;
  isDirectory?: boolean;
  wasWatchedDirectory?: boolean;
}

export interface DebouncedRefresh {
  schedule: () => void;
  cancel: () => void;
}

export function hasHiddenPathSegment(targetPath: string): boolean {
  return path
    .normalize(targetPath)
    .split(/[\\/]+/)
    .some((segment) => segment.startsWith("."));
}

export function isMarkdownFilePath(targetPath: string): boolean {
  return path.extname(targetPath).toLowerCase() === ".md";
}

export function shouldTriggerWorkspaceRefresh(
  targetPath: string,
  info: ChangeInfo = {},
): boolean {
  if (!targetPath || hasHiddenPathSegment(targetPath)) return false;
  if (info.wasWatchedDirectory || info.isDirectory) return true;
  if (isMarkdownFilePath(targetPath)) return true;

  const exists = info.exists ?? fs.existsSync(targetPath);
  if (!exists && path.extname(path.basename(targetPath)) === "") {
    return true;
  }

  return false;
}

export function collectWatchableDirectories(rootDir: string): string[] {
  if (!rootDir || !fs.existsSync(rootDir)) return [];
  let rootStats: fs.Stats;
  try {
    rootStats = fs.statSync(rootDir);
  } catch {
    return [];
  }
  if (!rootStats.isDirectory()) return [];

  const result: string[] = [];
  const visit = (dir: string) => {
    result.push(dir);

    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      if (!entry.isDirectory() || entry.name.startsWith(".")) continue;
      visit(path.join(dir, entry.name));
    }
  };

  visit(rootDir);
  return result;
}

export function createDebouncedRefresh(
  sendRefresh: () => void,
  delay = 300,
): DebouncedRefresh {
  let timer: NodeJS.Timeout | null = null;

  return {
    schedule: () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        timer = null;
        sendRefresh();
      }, delay);
    },
    cancel: () => {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
    },
  };
}
