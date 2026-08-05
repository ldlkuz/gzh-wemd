// ============================================================
// Style Inliner — 样式内联器
// ============================================================
// 将 CSS class 样式转换为内联 style 属性，确保公众号兼容。

import { sanitizeCssBlock } from "./css-whitelist.ts";

// ── 解析 CSS 规则 ──
export interface CssRule {
  selector: string;
  declarations: string;
}

export function parseCss(css: string): CssRule[] {
  const rules: CssRule[] = [];
  // 移除注释
  const cleaned = css.replace(/\/\*[\s\S]*?\*\//g, "");

  // 按规则分割
  const ruleRegex = /([^{]+)\{([^}]+)\}/g;
  let match: RegExpExecArray | null;

  while ((match = ruleRegex.exec(cleaned)) !== null) {
    const selector = match[1].trim();
    const declarations = match[2].trim();
    if (selector && declarations) {
      rules.push({ selector, declarations });
    }
  }

  return rules;
}

// ── 将样式内联到 HTML ──
export function inlineStyles(html: string, css: string): string {
  const rules = parseCss(css);
  if (rules.length === 0) return html;

  // 按选择器分组
  const styleMap = new Map<string, string[]>();
  for (const rule of rules) {
    const selectors = rule.selector.split(",").map((s) => s.trim());
    for (const selector of selectors) {
      const existing = styleMap.get(selector) || [];
      existing.push(rule.declarations);
      styleMap.set(selector, existing);
    }
  }

  // 为每个匹配的元素内联样式
  let result = html;
  for (const [selector, decls] of styleMap) {
    // 只处理 class 选择器
    if (!selector.startsWith(".")) continue;

    const className = selector.slice(1).split(":")[0]; // 移除伪类
    const combinedDecl = decls.join("; ");

    // 查找匹配的元素
    const classRegex = new RegExp(`(<[^>]+class\\s*=\\s*["'][^"']*\\b${escapeRegex(className)}\\b[^"']*["'][^>]*>)`, "gi");
    result = result.replace(classRegex, (match, openTag) => {
      // 检查是否已有 style 属性
      if (/style\s*=\s*["']/i.test(openTag)) {
        // 追加到现有 style
        return openTag.replace(/(style\s*=\s*["'])([^"']*)(["'])/i, (_, start, existingStyle, end) => {
          const sanitized = sanitizeCssBlock(combinedDecl);
          return `${start}${existingStyle}; ${sanitized}${end}`;
        });
      } else {
        // 添加 style 属性
        const sanitized = sanitizeCssBlock(combinedDecl);
        return openTag.replace(/\/?\s*>$/, (closing) => ` style="${sanitized}"${closing}`);
      }
    });
  }

  return result;
}

// ── 提取所有 CSS 并内联（从 <style> 标签中提取） ──
export function extractAndInlineStyles(html: string): { html: string; css: string } {
  // 提取 <style> 标签内容
  const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
  let css = "";
  let result = html;

  let match: RegExpExecArray | null;
  while ((match = styleRegex.exec(html)) !== null) {
    css += match[1] + "\n";
  }

  // 移除 <style> 标签
  result = result.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "");

  // 内联样式
  if (css) {
    result = inlineStyles(result, css);
  }

  return { html: result, css };
}

// ── 转义正则特殊字符 ──
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}