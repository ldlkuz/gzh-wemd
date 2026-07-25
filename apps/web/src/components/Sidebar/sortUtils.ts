import type { FileItem, FolderItem, TreeItem } from "../../store/fileTypes";

const SORT_MODE_KEY = "wemd-file-sort-mode";

export type SortMode = "recent" | "name-asc" | "name-desc";

const nameCollator = new Intl.Collator("zh-Hans", {
  numeric: true,
  sensitivity: "base",
});

export function getSortMode(): SortMode {
  try {
    const saved = localStorage.getItem(SORT_MODE_KEY);
    if (saved === "recent" || saved === "name-asc" || saved === "name-desc")
      return saved;
  } catch {
    /* ignore */
  }
  return "recent";
}

export function saveSortMode(mode: SortMode) {
  localStorage.setItem(SORT_MODE_KEY, mode);
}

export function compareFiles(a: FileItem, b: FileItem, mode: SortMode): number {
  switch (mode) {
    case "recent":
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    case "name-asc":
      return nameCollator.compare(a.title || a.name, b.title || b.name);
    case "name-desc":
      return nameCollator.compare(b.title || b.name, a.title || a.name);
  }
}

export function sortTreeItems(items: TreeItem[], mode: SortMode): TreeItem[] {
  const folders: FolderItem[] = [];
  const files: FileItem[] = [];
  for (const item of items) {
    if (item.isDirectory) {
      folders.push({
        ...item,
        children: sortTreeItems(item.children, mode),
      });
    } else {
      files.push(item);
    }
  }
  folders.sort((a, b) => nameCollator.compare(a.name, b.name));
  files.sort((a, b) => compareFiles(a, b, mode));
  return [...folders, ...files];
}
