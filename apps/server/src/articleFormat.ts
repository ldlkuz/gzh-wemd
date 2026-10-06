/**
 * 文章落盘的格式与命名规则
 *
 * 从 index.ts 抽出：这些函数不依赖 HTTP、也不启动服务，便于单独测试。
 * 与程序端（apps/web/src/utils/markdownFileMeta.ts）的 frontmatter 约定保持一致。
 */
import { existsSync } from "node:fs";
import { join } from "node:path";

/** 文件名清洗：剥离目录部分、过滤非法字符，强制 .md 后缀，防止路径穿越 */
export function sanitizeFilename(raw: string): string {
  const base = raw.split(/[\\/]/).pop() ?? "";
  const cleaned = base
    .replace(/[\\/:*?"<>|]/g, "-")
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001f]/g, "")
    .trim();
  const withoutExt = cleaned.replace(/\.md$/i, "").trim();
  return `${withoutExt || "untitled"}.md`;
}

/** 未指定文件名时按时间生成，如 untitled-20261005-143012.md */
export function timestampFilename(): string {
  const d = new Date();
  const p = (n: number): string => String(n).padStart(2, "0");
  return `untitled-${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}.md`;
}

/** 同名时生成可用文件名：标题.md → 标题-1.md → 标题-2.md */
export function resolveAvailableFilename(
  dir: string,
  filename: string,
): string {
  const base = filename.replace(/\.md$/i, "");
  for (let i = 1; i <= 999; i++) {
    const candidate = `${base}-${i}.md`;
    if (!existsSync(join(dir, candidate))) return candidate;
  }
  return `${base}-${Date.now()}.md`;
}

/** 顶层 frontmatter，与程序 parseMarkdownFileContent 的解析正则保持一致 */
export const FRONTMATTER_RE = /^(\uFEFF)?---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/;

/** frontmatter 值加引号并转义，规则同程序端 */
export function quoteFrontmatterValue(value: string): string {
  return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

/**
 * 按程序的文件约定组装 markdown 文件内容：
 * 顶层 frontmatter 记录 theme / themeName / title / author，
 * 程序打开该文件时据此自动切换到对应排版主题。
 * 未提供任何元信息时按原样返回。
 */
export function buildArticleContent(
  markdown: string,
  meta: {
    themeId?: string;
    themeName?: string;
    title?: string;
    author?: string;
  },
): string {
  const lines: string[] = [];
  if (meta.themeId) lines.push(`theme: ${meta.themeId}`);
  if (meta.themeName) {
    lines.push(`themeName: ${quoteFrontmatterValue(meta.themeName)}`);
  }
  if (meta.title) lines.push(`title: ${quoteFrontmatterValue(meta.title)}`);
  if (meta.author) lines.push(`author: ${quoteFrontmatterValue(meta.author)}`);
  if (lines.length === 0) return markdown;

  // 剥离调用方可能自带的 frontmatter，避免重复
  const body = markdown.replace(FRONTMATTER_RE, "");
  return `---\n${lines.join("\n")}\n---\n\n${body}`;
}
