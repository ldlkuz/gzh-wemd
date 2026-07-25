import type { FileItem, FolderItem, TreeItem } from "../../store/fileTypes";
import type { SortMode } from "./sortUtils";
import { compareFiles, sortTreeItems } from "./sortUtils";

const COLLAPSED_KEY = "wemd-folder-collapsed";

export const ROOT_DROP_TARGET = "__root__";
export const FILE_DRAG_TYPE = "application/x-wemd-file";
export const FOLDER_DRAG_TYPE = "application/x-wemd-folder";

export function getCollapsedState(): Set<string> {
  try {
    const saved = localStorage.getItem(COLLAPSED_KEY);
    return saved ? new Set(JSON.parse(saved)) : new Set();
  } catch {
    return new Set();
  }
}

export function saveCollapsedState(collapsed: Set<string>) {
  localStorage.setItem(COLLAPSED_KEY, JSON.stringify([...collapsed]));
}

export function getBaseName(rawPath: string | null): string {
  if (!rawPath) return "";
  const last = Math.max(rawPath.lastIndexOf("/"), rawPath.lastIndexOf("\\"));
  return last >= 0 ? rawPath.slice(last + 1) : rawPath;
}

export function normalizePath(value: string): string {
  return value.replace(/\\/g, "/");
}

export function remapPath(
  rawPath: string,
  oldPath: string,
  newPath: string,
): string | null {
  const normalizedPath = normalizePath(rawPath);
  const normalizedOld = normalizePath(oldPath);
  const normalizedNew = normalizePath(newPath);

  if (normalizedPath === normalizedOld) {
    return rawPath.includes("\\")
      ? normalizedNew.replace(/\//g, "\\")
      : normalizedNew;
  }
  if (!normalizedPath.startsWith(`${normalizedOld}/`)) return null;

  const suffix = normalizedPath.slice(normalizedOld.length);
  const mapped = normalizedNew + suffix;
  return rawPath.includes("\\") ? mapped.replace(/\//g, "\\") : mapped;
}

export function collectAllFolders(items: TreeItem[]) {
  const folders: { name: string; path: string }[] = [];
  const walk = (entries: TreeItem[], prefix = "") => {
    for (const item of entries) {
      if (!item.isDirectory) continue;
      const fullName = prefix ? `${prefix}/${item.name}` : item.name;
      folders.push({ name: fullName, path: item.path });
      walk(item.children, fullName);
    }
  };
  walk(items);
  return folders;
}

export function buildFilteredItems(
  files: TreeItem[],
  filter: string,
  flattenFiles: (items: TreeItem[]) => FileItem[],
  sortMode: SortMode,
) {
  if (!filter) return sortTreeItems(files, sortMode);

  const keyword = filter.toLowerCase();
  const matched = flattenFiles(files).filter((f) =>
    (f.title || f.name).toLowerCase().includes(keyword),
  );
  matched.sort((a, b) => compareFiles(a, b, sortMode));
  return matched;
}

export function findFolderByPath(
  items: TreeItem[],
  target: string,
): FolderItem | null {
  for (const item of items) {
    if (!item.isDirectory) continue;
    if (item.path === target) return item;
    const found = findFolderByPath(item.children, target);
    if (found) return found;
  }
  return null;
}

export function isDescendantPath(parentPath: string, childPath: string) {
  const normalizedParent = normalizePath(parentPath);
  const normalizedChild = normalizePath(childPath);
  return (
    normalizedChild === normalizedParent ||
    normalizedChild.startsWith(`${normalizedParent}/`)
  );
}

export function resolveParentFolderPath(
  filePath: string,
  workspacePath: string | null,
): string | null {
  const normalizedPath = normalizePath(filePath);
  const lastIndex = normalizedPath.lastIndexOf("/");
  if (lastIndex === -1) return null;

  const parentPath = filePath.substring(
    0,
    filePath.length - (normalizedPath.length - lastIndex),
  );
  if (!parentPath || (workspacePath && parentPath === workspacePath)) {
    return null;
  }
  return parentPath;
}

export function expandAncestorFolders(
  collapsedFolders: Set<string>,
  filePath: string,
  workspacePath: string | null,
) {
  const next = new Set(collapsedFolders);
  let current = filePath;
  while (true) {
    const sepIndex = Math.max(
      current.lastIndexOf("/"),
      current.lastIndexOf("\\"),
    );
    if (sepIndex === -1) break;
    const parent = current.substring(0, sepIndex);
    if (workspacePath && parent === workspacePath) break;
    if (next.has(parent)) next.delete(parent);
    current = parent;
    if (!current) break;
  }
  return next;
}

export function formatRelativeTime(date: Date) {
  const now = new Date();
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );
  const startOfDate = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );
  const diff = startOfToday.getTime() - startOfDate.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days <= 0) {
    return date.toLocaleTimeString("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  if (days < 7) {
    const rtf = new Intl.RelativeTimeFormat("zh", { numeric: "auto" });
    return rtf.format(-days, "day");
  }
  return date.toLocaleDateString("zh-CN", { month: "short", day: "numeric" });
}
