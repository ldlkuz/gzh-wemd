export const WECHAT_TITLE_MAX_LENGTH = 64;

export interface PublishMeta {
  title?: string;
  author?: string;
  useTitle?: boolean;
  useAuthor?: boolean;
}

function normalizeMetaText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

export function truncateByCharCount(value: string, maxLength: number): string {
  return Array.from(value).slice(0, maxLength).join("");
}

export function normalizeWechatTitle(value?: string): string {
  if (!value) return "";
  const normalized = normalizeMetaText(value);
  if (!normalized) return "";
  return truncateByCharCount(normalized, WECHAT_TITLE_MAX_LENGTH);
}

export function normalizeWechatAuthor(value?: string): string {
  if (!value) return "";
  return normalizeMetaText(value);
}

export function extractHeadingTitleFromMarkdown(markdown: string): string {
  const lines = markdown.split(/\r?\n/);
  let inFence = false;
  let firstHeading = "";

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (/^(```|~~~)/.test(trimmed)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;

    // 从 magazine-cover 组件提取标题（第一行非空内容）
    if (/^::: magazine-cover$/.test(trimmed)) {
      for (let j = i + 1; j < lines.length; j++) {
        const next = lines[j].trim();
        if (next === ":::") break; // 未找到标题
        if (next) {
          const title = normalizeWechatTitle(next);
          if (title) return title;
          break;
        }
      }
      continue;
    }

    const match = trimmed.match(/^(#{1,6})\s+(.+?)\s*#*\s*$/);
    if (!match) continue;

    const title = normalizeWechatTitle(match[2]);
    if (!title) continue;
    if (match[1].length === 1) return title;
    if (!firstHeading) firstHeading = title;
  }

  return firstHeading;
}

export function resolvePublishMeta(
  markdown: string,
  meta: PublishMeta,
): Required<PublishMeta> {
  const useTitle = meta.useTitle !== false;
  const useAuthor = meta.useAuthor !== false;
  const title = useTitle
    ? normalizeWechatTitle(meta.title) ||
      extractHeadingTitleFromMarkdown(markdown)
    : "";
  const author = useAuthor ? normalizeWechatAuthor(meta.author) : "";
  return { title, author, useTitle, useAuthor };
}
