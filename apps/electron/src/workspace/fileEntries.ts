import * as fs from "fs";
import * as path from "path";
import { extractFrontmatterMeta } from "../utils/frontmatter";

export interface FileEntry {
  name: string;
  path: string;
  isDirectory: boolean;
  createdAt: Date;
  updatedAt: Date;
  size: number;
  title?: string;
  themeName: string;
  children?: FileEntry[];
}

export function getUniqueFilePath(targetPath: string): string {
  const dir = path.dirname(targetPath);
  const ext = path.extname(targetPath);
  const name = path.basename(targetPath, ext);

  let candidate = targetPath;
  let counter = 1;
  while (fs.existsSync(candidate)) {
    candidate = path.join(dir, `${name} (${counter})${ext}`);
    counter += 1;
  }
  return candidate;
}

export function readFileEntry(fullPath: string, name: string): FileEntry {
  const stats = fs.statSync(fullPath);
  let themeName = "默认主题";
  let title: string | undefined;
  try {
    const fd = fs.openSync(fullPath, "r");
    const buffer = Buffer.alloc(1200);
    const bytesRead = fs.readSync(fd, buffer, 0, 1200, 0);
    fs.closeSync(fd);
    const content = buffer.toString("utf8", 0, bytesRead);
    const parsed = extractFrontmatterMeta(content);
    themeName = parsed.themeName;
    title = parsed.title;
  } catch (e) {
    /* 忽略 */
  }
  return {
    name,
    path: fullPath,
    isDirectory: false,
    createdAt: stats.birthtime,
    updatedAt: stats.mtime,
    size: stats.size,
    title,
    themeName,
  };
}

export function scanWorkspace(dir: string): FileEntry[] {
  if (!dir || !fs.existsSync(dir)) return [];
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    const results: FileEntry[] = [];

    const folders = entries
      .filter((entry) => entry.isDirectory() && !entry.name.startsWith("."))
      .sort((a, b) => a.name.localeCompare(b.name));
    for (const folder of folders) {
      const folderPath = path.join(dir, folder.name);
      const stats = fs.statSync(folderPath);
      const children = scanWorkspace(folderPath);
      results.push({
        name: folder.name,
        path: folderPath,
        isDirectory: true,
        createdAt: stats.birthtime,
        updatedAt: stats.mtime,
        size: 0,
        themeName: "",
        children,
      });
    }

    const mdFiles = entries
      .filter(
        (entry) =>
          entry.isFile() &&
          entry.name.endsWith(".md") &&
          !entry.name.startsWith("."),
      )
      .map((entry) => readFileEntry(path.join(dir, entry.name), entry.name))
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    results.push(...mdFiles);

    return results;
  } catch (error) {
    console.error("Scan workspace failed:", error);
    return [];
  }
}
