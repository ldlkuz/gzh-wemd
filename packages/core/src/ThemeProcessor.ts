import { expandCSSVariables } from "./themes/cssVariableExpander";
import { inlinePseudoElementDecorations } from "./pseudoElementInline";

const DATA_TOOL = "WeMD编辑器";
const SECTION_ID = "wemd";

/**
 * 为 toc-nav 目录组件的 li 添加序号 span（兼容微信内联）
 * 微信不支持 ::before 伪元素和 counter 计数器，需要直接把序号写进 HTML
 *
 * 用栈平衡匹配 toc-nav 的完整范围，避免非贪婪正则被内部嵌套的
 * <section> 提前截断。
 *
 * 算法：在 toc-nav 开标签之后，用单指针 indexOf 逐位扫描最近的
 *       <section 或 </section>。两个独立 regex 会导致 lastIndex
 *       不同步 → depth 算错 → 块永不闭合 → 把后面的 li 也编号。
 */
function addTocNumbers(html: string): string {
  const startRegex = /<section[^>]*class="[^"]*wemd-toc-nav[^"]*"[^>]*>/gi;

  let result = "";
  let lastIdx = 0;
  let sm: RegExpExecArray | null;

  while ((sm = startRegex.exec(html)) !== null) {
    const startIdx = sm.index;
    result += html.slice(lastIdx, startIdx);

    // 单指针扫描：每次找最近的下一个 <section 或 </section>
    let depth = 1;
    let cursor = startRegex.lastIndex;

    while (depth > 0 && cursor < html.length) {
      const nextOpen = html.indexOf("<section", cursor);
      const nextClose = html.indexOf("</section", cursor);

      if (nextClose === -1) break;

      if (nextOpen !== -1 && nextOpen < nextClose) {
        depth++;
        cursor = nextOpen + 8;
      } else {
        depth--;
        cursor = nextClose + 10;
      }
    }

    const block = html.slice(startIdx, cursor);
    let liIndex = 0;
    const replaced = block.replace(
      /<li([^>]*)>/gi,
      (_m: string, attrs: string) => {
        liIndex++;
        const num = liIndex.toString().padStart(2, "0");
        return `<li${attrs}><span class="toc-num">${num}</span>`;
      },
    );
    result += replaced;
    lastIdx = cursor;
  }

  result += html.slice(lastIdx);
  return result;
}

const BLOCK_TAGS = [
  "p",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "ul",
  "ol",
  "li",
  "blockquote",
  "table",
  "figure",
  "pre",
  "hr",
] as const;

/**
 * 通用手动 CSS 内联器 —— 完全替代 juice
 *
 * juice 浏览器版本存在严重 bug：其依赖的 slick/parser 解析某些
 * 选择器（如带转义引号的属性选择器）时返回 undefined，导致
 * getPseudoElementType(undefined) 崩溃。即使剥离伪元素规则
 * 也无法避免。
 *
 * 本函数直接用浏览器原生 querySelectorAll 匹配选择器，稳定可靠。
 * CSS 规则按出现顺序应用，后出现的规则覆盖先出现的（与 CSS 层叠一致）。
 */
const inlineAllStylesManually = (html: string, css: string): string => {
  const rules: Array<{ selector: string; styles: string }> = [];
  // 剥离 CSS 注释，避免注释文本被误认为是选择器的一部分
  const cleanCss = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const ruleRegex = /([^{}]+)\{([^{}]*)\}/g;
  let match: RegExpExecArray | null;

  while ((match = ruleRegex.exec(cleanCss)) !== null) {
    const selector = match[1].trim();
    const body = match[2].trim();

    // 跳过空选择器、伪元素、@-规则
    if (!selector) continue;
    if (selector.includes("::")) continue;
    if (selector.startsWith("@")) continue;

    const styleStr = body
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && s.indexOf(":") > 0)
      .join("; ");

    if (styleStr) {
      rules.push({ selector, styles: styleStr });
    }
  }

  if (rules.length === 0) return html;

  const container = document.createElement("div");
  container.innerHTML = html;

  for (const { selector, styles } of rules) {
    try {
      const elements = container.querySelectorAll(selector);
      elements.forEach((el) => {
        if (!(el instanceof HTMLElement)) return;
        const styleMap = new Map<string, string>();
        const existing = (el.getAttribute("style") || "").trim();
        existing.split(";").forEach((s) => {
          const colonIdx = s.indexOf(":");
          if (colonIdx > 0) {
            styleMap.set(
              s.substring(0, colonIdx).trim(),
              s.substring(colonIdx + 1).trim(),
            );
          }
        });
        styles.split(";").forEach((s) => {
          const colonIdx = s.indexOf(":");
          if (colonIdx > 0) {
            styleMap.set(
              s.substring(0, colonIdx).trim(),
              s.substring(colonIdx + 1).trim(),
            );
          }
        });
        const merged = Array.from(styleMap.entries())
          .map(([p, v]) => `${p}: ${v}`)
          .join("; ");
        el.setAttribute("style", merged);
      });
    } catch {
      // 无效选择器跳过
    }
  }

  return container.innerHTML;
};

/**
 * 处理 HTML，添加 data-tool 属性并应用 CSS 样式
 * @param html - 原始 HTML 字符串
 * @param css - CSS 样式字符串
 * @param inlineStyles - 是否内联样式，默认为 true。预览模式建议设为 false 以提高性能。
 * @param inlinePseudoElements - 是否内联伪元素内容（如 ::before / ::after），默认为 false。复制到微信时建议设为 true。
 * @returns 处理后的 HTML 字符串
 */
export const processHtml = (
  html: string,
  css: string,
  inlineStyles: boolean = true,
  inlinePseudoElements: boolean = false,
): string => {
  if (!html || !css) {
    return html || "";
  }

  // 为顶级块元素添加 data-tool 属性
  BLOCK_TAGS.forEach((tag) => {
    const regex = new RegExp(`<${tag}(\\s+[^>]*|)>`, "gi");
    html = html.replace(regex, (match, attributes) => {
      if (match.includes("data-tool=")) return match;
      return `<${tag} data-tool="${DATA_TOOL}"${attributes}>`;
    });
  });

  // 处理 MathJax 相关的替换
  html = html.replace(
    /<mjx-container (class="inline.+?)<\/mjx-container>/g,
    "<span $1</span>",
  );
  html = html.replace(/\s<span class="inline/g, '&nbsp;<span class="inline');
  html = html.replace(/svg><\/span>\s/g, "svg></span>&nbsp;");
  html = html.replace(/mjx-container/g, "section");
  html = html.replace(/class="mjx-solid"/g, 'fill="none" stroke-width="70"');
  html = html.replace(/<mjx-assistive-mml.+?<\/mjx-assistive-mml>/g, "");

  // 保护代码块中的空格，防止微信清洗时删除
  html = html.replace(
    /<code([^>]*class="[^"]*\bhljs\b[^"]*"[^>]*)>([\s\S]*?)<\/code>/g,
    (match, attrs: string, inner: string) => {
      let protected_ = inner;
      protected_ = protected_.replace(/\t/g, "&nbsp;&nbsp;");
      protected_ = protected_.replace(/<\/span> <span/g, " </span><span");
      protected_ = protected_.replace(/\n( +)/g, (m, spaces: string) => {
        return "\n" + "&nbsp;".repeat(spaces.length);
      });
      protected_ = protected_.replace(/^( +)/, (m, spaces: string) => {
        return "&nbsp;".repeat(spaces.length);
      });
      return `<code${attrs}>${protected_}</code>`;
    },
  );

  let processedHtml = html;
  // 统一为 toc-nav 注入序号 span：预览和微信导出共用，避免 ::before 在微信丢失
  // 原"预览用 CSS counter + 导出用 span"双轨设计会导致微信导出时出现双重编号
  // （addTocNumbers 的 span + inlineAllStylesManually 转换的 ::before span）
  processedHtml = addTocNumbers(processedHtml);
  const wrappedHtml = `<section id="${SECTION_ID}">${processedHtml}</section>`;

  if (!inlineStyles) {
    return wrappedHtml;
  }

  const inlineWrappedHtml = wrappedHtml;

  // 展开 CSS 变量：把 var(--wemd-*) 引用替换为实际值
  // juice（已被 inlineAllStylesManually 替代）和手动内联器都无法解析 CSS 自定义属性，
  // 使用统一的 expandCSSVariables 完成：变量声明提取 + 递归引用解析 + 移除变量声明块
  const resolvedCss = expandCSSVariables(css);

  // 使用手动 CSS 内联器，完全替代 juice
  // juice 浏览器版本存在严重 bug（slick/parser 返回 undefined 导致崩溃），
  // 且即使剥离伪元素规则也无法避免。手动内联器更稳定可靠。
  let res = inlineAllStylesManually(inlineWrappedHtml, resolvedCss);

  // 为代码块追加关键内联样式
  if (inlinePseudoElements) {
    // 微信会过滤 CSS 伪元素：把内置组件的 ::before / ::after 装饰物化为真实元素
    res = inlinePseudoElementDecorations(res, resolvedCss);

    const appendStyleValue = (styleValue: string, extra: string) => {
      const trimmed = styleValue.trim();
      if (!trimmed) return extra;
      const needsSemicolon = !trimmed.endsWith(";");
      return `${trimmed}${needsSemicolon ? ";" : ""}${extra}`;
    };

    // 处理 pre 元素：确保 overflow 和 white-space 正确
    res = res.replace(
      /<pre([^>]*)(style="[^"]*")([^>]*)>/gi,
      (match, before: string, styleAttr: string, after: string) => {
        const styleMatch = styleAttr.match(/style="([^"]*)"/i);
        const existing = styleMatch ? styleMatch[1] : "";
        const nextStyle = appendStyleValue(
          existing,
          "overflow-x:auto;-webkit-overflow-scrolling:touch;",
        );
        return `<pre${before}style="${nextStyle}"${after}>`;
      },
    );

    // 处理 code 元素：防止 text-align:justify 破坏代码格式
    res = res.replace(
      /<code([^>]*)(style="[^"]*")([^>]*)>/gi,
      (match, before: string, styleAttr: string, after: string) => {
        const styleMatch = styleAttr.match(/style="([^"]*)"/i);
        const existing = styleMatch ? styleMatch[1] : "";
        const normalized = existing.replace(
          /white-space:\s*pre-wrap/gi,
          "white-space:pre",
        );
        const nextStyle = appendStyleValue(
          normalized,
          "text-align:left;letter-spacing:0;word-spacing:0;",
        );
        return `<code${before}style="${nextStyle}"${after}>`;
      },
    );
  }

  return res;
};
