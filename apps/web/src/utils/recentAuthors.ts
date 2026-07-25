const RECENT_AUTHORS_STORAGE_KEY = "wemd-recent-authors";
const MAX_RECENT_AUTHORS = 5;

function normalizeAuthor(author: string): string {
  return author.replace(/\s+/g, " ").trim();
}

export function getRecentAuthors(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(RECENT_AUTHORS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item) => normalizeAuthor(String(item)))
      .filter(Boolean)
      .slice(0, MAX_RECENT_AUTHORS);
  } catch {
    return [];
  }
}

export function saveRecentAuthors(authors: string[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      RECENT_AUTHORS_STORAGE_KEY,
      JSON.stringify(authors.slice(0, MAX_RECENT_AUTHORS)),
    );
  } catch {
    // ignore storage errors
  }
}

export function addRecentAuthor(author?: string): string[] {
  const normalized = normalizeAuthor(author || "");
  if (!normalized) return getRecentAuthors();
  const next = [
    normalized,
    ...getRecentAuthors().filter((item) => item !== normalized),
  ].slice(0, MAX_RECENT_AUTHORS);
  saveRecentAuthors(next);
  return next;
}
