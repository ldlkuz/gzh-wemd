// ============================================================
// HTML 标签白名单 — 公众号编译器
// ============================================================
// 微信公众号支持的 HTML 标签列表。

// ── 允许的 HTML 标签 ──
export const ALLOWED_TAGS = new Set([
  // 块级
  "section",
  "div",
  "p",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "blockquote",
  "ul",
  "ol",
  "li",
  "pre",
  "hr",
  "figure",
  "figcaption",
  "details",
  "summary",

  // 内联
  "span",
  "strong",
  "em",
  "b",
  "i",
  "u",
  "a",
  "br",
  "code",
  "img",
  "sub",
  "sup",
  "small",
  "mark",
  "del",
  "ins",
  "abbr",
  "cite",
  "q",

  // 表格（简单支持）
  "table",
  "thead",
  "tbody",
  "tr",
  "th",
  "td",
  "caption",

  // 语义
  "header",
  "footer",
  "nav",
  "main",
  "article",
  "aside",
  "address",
  "time",
  "dfn",
  "kbd",
  "samp",
  "var",
]);

// ── 禁止的标签 ──
export const BLOCKED_TAGS = new Set([
  "script",
  "style",
  "iframe",
  "frame",
  "object",
  "embed",
  "applet",
  "form",
  "input",
  "select",
  "textarea",
  "button",
  "canvas",
  "svg",
  "video",
  "audio",
  "link",
  "meta",
  "base",
  "noscript",
]);

// ── 允许的标签属性 ──
export const ALLOWED_ATTRIBUTES: Record<string, Set<string>> = {
  "*": new Set([
    "id",
    "class",
    "style",
    "title",
    "lang",
    "dir",
    "align",
    "data-*",
  ]),
  a: new Set(["href", "target", "rel", "title"]),
  img: new Set(["src", "alt", "width", "height", "title", "loading"]),
  td: new Set(["colspan", "rowspan", "headers"]),
  th: new Set(["colspan", "rowspan", "scope", "headers"]),
  time: new Set(["datetime"]),
  abbr: new Set(["title"]),
  ol: new Set(["start", "type", "reversed"]),
  li: new Set(["value"]),
};

// ── 检查标签是否允许 ──
export function isTagAllowed(tag: string): boolean {
  return ALLOWED_TAGS.has(tag.toLowerCase());
}

// ── 检查标签是否被禁止 ──
export function isTagBlocked(tag: string): boolean {
  return BLOCKED_TAGS.has(tag.toLowerCase());
}

// ── 检查属性是否允许 ──
export function isAttributeAllowed(tag: string, attr: string): boolean {
  const tagLower = tag.toLowerCase();
  const attrLower = attr.toLowerCase();

  // 检查通用属性
  const globalAttrs = ALLOWED_ATTRIBUTES["*"];
  if (globalAttrs) {
    for (const allowed of globalAttrs) {
      if (allowed === attrLower) return true;
      if (allowed.endsWith("-*") && attrLower.startsWith(allowed.slice(0, -2))) return true;
      if (allowed === "data-*" && attrLower.startsWith("data-")) return true;
    }
  }

  // 检查标签特定属性
  const tagAttrs = ALLOWED_ATTRIBUTES[tagLower];
  if (tagAttrs) {
    return tagAttrs.has(attrLower);
  }

  return false;
}

// ── 清理 HTML 标签 ──
export function sanitizeHtml(html: string): string {
  // 移除 script 标签及其内容
  let cleaned = html.replace(/<script[\s\S]*?<\/script>/gi, "");
  cleaned = cleaned.replace(/<style[\s\S]*?<\/style>/gi, "");

  // 移除危险的属性
  cleaned = cleaned.replace(/\s+on\w+\s*=\s*["'][^"']*["']/gi, "");
  cleaned = cleaned.replace(/\s+javascript:\s*["'][^"']*["']/gi, "");
  cleaned = cleaned.replace(/\s+expression\s*\(/gi, "");

  // 移除禁止的标签
  for (const tag of BLOCKED_TAGS) {
    const regex = new RegExp(`<${tag}[\\s\\S]*?</${tag}>|<${tag}[^>]*/>`, "gi");
    cleaned = cleaned.replace(regex, "");
  }

  return cleaned;
}