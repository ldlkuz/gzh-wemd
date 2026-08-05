// ============================================================
// Compatibility Check — 兼容性检查
// ============================================================
// 检查编译后的 HTML 是否符合公众号平台要求。

import { isTagAllowed, isTagBlocked } from "./html-whitelist.ts";
import { isCssPropertyAllowed, BLOCKED_CSS_PROPERTIES } from "./css-whitelist.ts";

export interface CompatibilityReport {
  status: "passed" | "passed-with-warnings" | "failed";
  errors: string[];
  warnings: string[];
  changes: string[];
}

// ── 检查 HTML 兼容性 ──
export function checkHtmlCompatibility(html: string): CompatibilityReport {
  const errors: string[] = [];
  const warnings: string[] = [];
  const changes: string[] = [];

  // 1. 检查标签
  const tagRegex = /<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/g;
  let match: RegExpExecArray | null;

  while ((match = tagRegex.exec(html)) !== null) {
    const tag = match[1].toLowerCase();

    if (isTagBlocked(tag)) {
      errors.push(`禁止的标签: <${tag}>`);
    } else if (!isTagAllowed(tag)) {
      warnings.push(`不支持的标签: <${tag}>，可能被公众号过滤`);
    }
  }

  // 2. 检查 CSS 属性
  const cssRegex = /style\s*=\s*["']([^"']*)["']/gi;
  while ((match = cssRegex.exec(html)) !== null) {
    const styleContent = match[1];
    const declarations = styleContent.split(";");

    for (const decl of declarations) {
      const trimmed = decl.trim();
      if (!trimmed) continue;

      const colonIdx = trimmed.indexOf(":");
      if (colonIdx === -1) continue;

      const property = trimmed.slice(0, colonIdx).trim();

      if (BLOCKED_CSS_PROPERTIES.has(property.toLowerCase())) {
        errors.push(`不兼容的 CSS 属性: ${property}`);
      } else if (!isCssPropertyAllowed(property)) {
        warnings.push(`未知 CSS 属性: ${property}，可能被过滤`);
      }
    }
  }

  // 3. 检查外部资源引用
  const urlRegex = /url\s*\(\s*["']?(?!data:)([^"')]+)["']?\s*\)/gi;
  while ((match = urlRegex.exec(html)) !== null) {
    warnings.push(`外部 URL 引用: ${match[1].slice(0, 50)}，建议使用 data URL`);
  }

  // 4. 检查 @import
  if (html.includes("@import")) {
    errors.push("@import 不兼容，请使用内联样式");
  }

  // 5. 检查伪元素
  if (html.includes("::before") || html.includes("::after")) {
    warnings.push("::before/::after 伪元素在公众号中可能不兼容");
  }

  // 6. 检查外部样式表
  const linkRegex = /<link[^>]*rel\s*=\s*["']stylesheet["'][^>]*>/gi;
  if (linkRegex.test(html)) {
    warnings.push("外部样式表已内联处理");
    changes.push("外部样式已全部内联");
  }

  // 7. 检查 SVG 内联
  if (html.match(/<svg[\s>]/i)) {
    warnings.push("内联 SVG 已转换为 data URL");
    changes.push("SVG 已转换为 data URL");
  }

  // 判断状态
  let status: "passed" | "passed-with-warnings" | "failed" = "passed";
  if (errors.length > 0) {
    status = "failed";
  } else if (warnings.length > 0) {
    status = "passed-with-warnings";
  }

  return { status, errors, warnings, changes };
}

// ── 检查 CSS 兼容性 ──
export function checkCssCompatibility(css: string): CompatibilityReport {
  const errors: string[] = [];
  const warnings: string[] = [];
  const changes: string[] = [];

  const declarations = css.split(";");
  for (const decl of declarations) {
    const trimmed = decl.trim();
    if (!trimmed) continue;

    const colonIdx = trimmed.indexOf(":");
    if (colonIdx === -1) continue;

    const property = trimmed.slice(0, colonIdx).trim();

    if (BLOCKED_CSS_PROPERTIES.has(property.toLowerCase())) {
      errors.push(`不兼容的 CSS 属性: ${property}`);
    }

    // 检查 @keyframes
    if (property.startsWith("@keyframes")) {
      errors.push("@keyframes 动画不兼容，请使用 transition 替代");
    }
  }

  // 检查 filter
  if (css.includes("filter:")) {
    errors.push("filter 属性在公众号中不兼容");
  }

  let status: "passed" | "passed-with-warnings" | "failed" = "passed";
  if (errors.length > 0) {
    status = "failed";
  } else if (warnings.length > 0) {
    status = "passed-with-warnings";
  }

  return { status, errors, warnings, changes };
}