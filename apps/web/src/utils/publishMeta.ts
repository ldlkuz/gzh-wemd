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

  for (const line of lines) {
    const trimmed = line.trim();
    if (/^(```|~~~)/.test(trimmed)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;

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
    ? normalizeWechatTitle(meta.title) || extractHeadingTitleFromMarkdown(markdown)
    : "";
  const author = useAuthor ? normalizeWechatAuthor(meta.author) : "";
  return { title, author, useTitle, useAuthor };
}
