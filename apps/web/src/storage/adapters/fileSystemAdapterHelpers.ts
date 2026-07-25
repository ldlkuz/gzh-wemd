import type { FileItem } from "../types";

const parseQuotedValue = (raw?: string): string | undefined => {
  if (!raw) return undefined;
  const trimmed = raw.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    const quote = trimmed[0];
    const inner = trimmed.slice(1, -1);
    if (quote === '"') {
      return inner.replace(/\\"/g, '"').replace(/\\\\/g, "\\");
    }
    return inner.replace(/\\'/g, "'");
  }
  return trimmed;
};

const parseMarkdownMetaFromFile = async (
  file: File,
): Promise<{ themeName?: string; title?: string }> => {
  try {
    const slice = file.slice(0, 1200);
    const text = await slice.text();
    const match = text.match(
      /^(?:\uFEFF)?---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/,
    );
    if (!match) return {};

    const themeMatch = match[1].match(/themeName:\s*(.+)/);
    const titleMatch = match[1].match(/title:\s*(.+)/);
    return {
      themeName: themeMatch ? parseQuotedValue(themeMatch[1]) : undefined,
      title: titleMatch ? parseQuotedValue(titleMatch[1]) : undefined,
    };
  } catch {
    return {};
  }
};

export const normalizePath = (input: string): string => {
  return input.replace(/\\/g, "/");
};

export const splitPath = (path: string): { dir: string; name: string } => {
  const normalized = normalizePath(path);
  const lastSlash = normalized.lastIndexOf("/");
  if (lastSlash < 0) {
    return { dir: "", name: normalized };
  }
  return {
    dir: normalized.slice(0, lastSlash),
    name: normalized.slice(lastSlash + 1),
  };
};

export const resolveFileHandle = async (
  root: FileSystemDirectoryHandle,
  path: string,
  create = false,
): Promise<FileSystemFileHandle> => {
  const parts = path.split("/");
  const fileName = parts.pop()!;
  let current = root;

  for (const part of parts) {
    current = await current.getDirectoryHandle(part, { create });
  }

  return current.getFileHandle(fileName, { create });
};

export const resolveParentAndName = async (
  root: FileSystemDirectoryHandle,
  path: string,
): Promise<{ parent: FileSystemDirectoryHandle; name: string }> => {
  const parts = path.split("/");
  const name = parts.pop()!;
  let current = root;

  for (const part of parts) {
    current = await current.getDirectoryHandle(part);
  }

  return { parent: current, name };
};

export const resolveDirectoryHandle = async (
  root: FileSystemDirectoryHandle,
  path: string,
): Promise<FileSystemDirectoryHandle> => {
  if (!path) return root;
  const parts = path.split("/").filter(Boolean);
  let current = root;
  for (const part of parts) {
    current = await current.getDirectoryHandle(part);
  }
  return current;
};

export const copyDirectoryRecursive = async (
  source: FileSystemDirectoryHandle,
  target: FileSystemDirectoryHandle,
): Promise<void> => {
  for await (const entry of source.values()) {
    if (entry.kind === "directory") {
      const nextTarget = await target.getDirectoryHandle(entry.name, {
        create: true,
      });
      await copyDirectoryRecursive(
        entry as FileSystemDirectoryHandle,
        nextTarget,
      );
    } else {
      const file = await (entry as FileSystemFileHandle).getFile();
      const fileHandle = await target.getFileHandle(entry.name, {
        create: true,
      });
      const writable = await fileHandle.createWritable();
      await writable.write(file);
      await writable.close();
    }
  }
};

export const deleteDirectoryRecursive = async (
  handle: FileSystemDirectoryHandle,
): Promise<void> => {
  for await (const entry of handle.values()) {
    if (entry.kind === "directory") {
      await deleteDirectoryRecursive(entry as FileSystemDirectoryHandle);
      await handle.removeEntry(entry.name);
    } else {
      await handle.removeEntry(entry.name);
    }
  }
};

export const scanDirectory = async (
  dirHandle: FileSystemDirectoryHandle,
  basePath: string,
): Promise<FileItem[]> => {
  const folders: FileItem[] = [];
  const files: FileItem[] = [];

  for await (const entry of dirHandle.values()) {
    if (entry.name.startsWith(".")) continue;
    const entryPath = basePath ? `${basePath}/${entry.name}` : entry.name;

    if (entry.kind === "directory") {
      const subHandle = await dirHandle.getDirectoryHandle(entry.name);
      const children = await scanDirectory(subHandle, entryPath);
      folders.push({
        path: entryPath,
        name: entry.name,
        meta: {
          isDirectory: true,
          children,
        },
      });
      continue;
    }

    if (entry.kind === "file" && entry.name.endsWith(".md")) {
      const fileHandle = entry as FileSystemFileHandle;
      const file = await fileHandle.getFile();
      const { themeName, title } = await parseMarkdownMetaFromFile(file);
      files.push({
        path: entryPath,
        name: entry.name,
        size: file.size,
        updatedAt: file.lastModified
          ? new Date(file.lastModified).toISOString()
          : undefined,
        meta: { themeName, title, isDirectory: false },
      });
    }
  }

  files.sort((a, b) => {
    const timeA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
    const timeB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
    return timeB - timeA;
  });
  folders.sort((a, b) => a.name.localeCompare(b.name));
  return [...folders, ...files];
};
