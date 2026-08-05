// ============================================================
// CSS 属性白名单 — 公众号编译器
// ============================================================
// 微信公众号支持的 CSS 属性列表

// ── 允许的 CSS 属性（公众号兼容） ──
export const ALLOWED_CSS_PROPERTIES = new Set([
  // 文本
  "color",
  "font-size",
  "font-weight",
  "font-family",
  "font-style",
  "line-height",
  "text-align",
  "text-indent",
  "text-decoration",
  "text-transform",
  "letter-spacing",
  "word-spacing",
  "white-space",
  "word-break",
  "vertical-align",

  // 背景
  "background",
  "background-color",
  "background-image",
  "background-size",
  "background-position",
  "background-repeat",

  // 尺寸
  "width",
  "height",
  "min-width",
  "min-height",
  "max-width",
  "max-height",

  // 间距
  "margin",
  "margin-top",
  "margin-right",
  "margin-bottom",
  "margin-left",
  "padding",
  "padding-top",
  "padding-right",
  "padding-bottom",
  "padding-left",

  // 边框
  "border",
  "border-top",
  "border-right",
  "border-bottom",
  "border-left",
  "border-color",
  "border-style",
  "border-width",
  "border-radius",
  "border-collapse",
  "border-spacing",

  // 布局
  "display",
  "float",
  "clear",
  "overflow",
  "overflow-x",
  "overflow-y",
  "visibility",
  "opacity",

  // 定位
  "position",
  "top",
  "right",
  "bottom",
  "left",
  "z-index",

  // 列表
  "list-style",
  "list-style-type",
  "list-style-position",
  "list-style-image",

  // 表格
  "table-layout",
  "empty-cells",
  "caption-side",

  // 内容
  "content",
  "quotes",
  "counter-increment",
  "counter-reset",

  // 交互
  "cursor",
  "pointer-events",

  // 动画（仅支持 transition）
  "transition",
  "transition-property",
  "transition-duration",
  "transition-timing-function",
  "transition-delay",

  // 变换（有限支持）
  "transform",
  "transform-origin",

  // 阴影
  "box-shadow",
  "text-shadow",

  // 渐变
  "background-image",
  "background-size",
  "background-position",
  "background-repeat",
]);

// ── 禁止的 CSS 属性（公众号不兼容） ──
export const BLOCKED_CSS_PROPERTIES = new Set([
  "filter",
  "backdrop-filter",
  "mix-blend-mode",
  "isolation",
  "clip-path",
  "mask",
  "mask-image",
  "object-fit",
  "object-position",
  "resize",
  "user-select",
  "scroll-behavior",
  "will-change",
  "perspective",
  "perspective-origin",
  "backface-visibility",
  "column-count",
  "column-gap",
  "column-rule",
  "column-width",
  "flex",
  "flex-basis",
  "flex-direction",
  "flex-flow",
  "flex-grow",
  "flex-shrink",
  "flex-wrap",
  "justify-content",
  "align-items",
  "align-content",
  "align-self",
  "order",
  "gap",
  "row-gap",
  "grid",
  "grid-template",
  "grid-column",
  "grid-row",
  "grid-area",
  "animation",
  "animation-name",
  "animation-duration",
  "animation-timing-function",
  "animation-delay",
  "animation-iteration-count",
  "animation-direction",
  "animation-fill-mode",
  "animation-play-state",
  "keyframes",
]);

// ── 检查 CSS 属性是否允许 ──
export function isCssPropertyAllowed(property: string): boolean {
  const prop = property.trim().toLowerCase();
  if (BLOCKED_CSS_PROPERTIES.has(prop)) return false;
  if (ALLOWED_CSS_PROPERTIES.has(prop)) return true;

  // 允许 CSS 变量
  if (prop.startsWith("--")) return true;

  // 允许 vendor prefix
  const knownPrefixes = ["-webkit-", "-moz-", "-ms-", "-o-"];
  for (const prefix of knownPrefixes) {
    if (prop.startsWith(prefix)) {
      const unprefixed = prop.slice(prefix.length);
      return ALLOWED_CSS_PROPERTIES.has(unprefixed) || BLOCKED_CSS_PROPERTIES.has(unprefixed) === false;
    }
  }

  return false;
}

// ── 清理 CSS 声明块 ──
export function sanitizeCssBlock(css: string): string {
  const declarations = css.split(";");
  const cleaned: string[] = [];

  for (const decl of declarations) {
    const trimmed = decl.trim();
    if (!trimmed) continue;

    const colonIdx = trimmed.indexOf(":");
    if (colonIdx === -1) continue;

    const property = trimmed.slice(0, colonIdx).trim();
    const value = trimmed.slice(colonIdx + 1).trim();

    // 检查属性是否允许
    if (!isCssPropertyAllowed(property)) continue;

    // 检查值是否安全
    if (isValueDangerous(value)) continue;

    cleaned.push(`${property}: ${value}`);
  }

  return cleaned.join("; ");
}

// ── 检查 CSS 值是否危险 ──
function isValueDangerous(value: string): boolean {
  const lower = value.toLowerCase();
  if (lower.includes("javascript:")) return true;
  if (lower.includes("expression(")) return true;
  if (lower.includes("url(") && lower.includes("data:")) return false; // data URL 允许
  if (lower.includes("url(") && !lower.includes("data:")) return true; // 外部 URL 禁止
  return false;
}