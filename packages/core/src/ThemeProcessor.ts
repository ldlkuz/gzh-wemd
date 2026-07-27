import juice from "juice";

const DATA_TOOL = "WeMD编辑器";
const SECTION_ID = "wemd";

/**
 * 为组件内部的直接子元素添加位置 class（wemd-child-1, wemd-child-2, ...）
 * 解决 juice 无法内联 :nth-child 等伪类选择器的问题
 */
function addChildPositionClasses(html: string): string {
  const componentBodyRegex =
    /<section[^>]*class="[^"]*wemd-component-body[^"]*"[^>]*>([\s\S]*?)<\/section>/g;

  return html.replace(componentBodyRegex, (match, innerContent: string) => {
    let result = innerContent;

    const tagRegex =
      /<(p|h[1-6]|ul|ol|blockquote|table|pre|hr|div|section)(\s+[^>]*|)>/gi;

    const matches: Array<{
      fullMatch: string;
      tag: string;
      attrs: string;
      index: number;
    }> = [];
    let m: RegExpExecArray | null;
    while ((m = tagRegex.exec(innerContent)) !== null) {
      matches.push({
        fullMatch: m[0],
        tag: m[1],
        attrs: m[2],
        index: m.index,
      });
    }

    for (let i = matches.length - 1; i >= 0; i--) {
      const item = matches[i];
      const childNum = i + 1;
      let newAttrs = item.attrs;

      if (newAttrs.includes('class="')) {
        newAttrs = newAttrs.replace(
          'class="',
          `class="wemd-child-${childNum} `,
        );
      } else {
        newAttrs = ` class="wemd-child-${childNum}"${newAttrs}`;
      }

      const newTag = `<${item.tag}${newAttrs}>`;
      result =
        result.slice(0, item.index) +
        newTag +
        result.slice(item.index + item.fullMatch.length);
    }

    return match.replace(innerContent, result);
  });
}

/**
 * 为 toc-nav 目录组件的 li 添加序号 span（兼容微信内联）
 * 微信不支持 ::before 伪元素和 counter 计数器，需要直接把序号写进 HTML
 */
function addTocNumbers(html: string): string {
  const tocNavRegex =
    /<section[^>]*class="[^"]*wemd-toc-nav[^"]*"[^>]*>[\s\S]*?<\/section>/g;

  return html.replace(tocNavRegex, (match: string) => {
    let liIndex = 0;
    return match.replace(/<li([^>]*)>/gi, (liMatch: string, attrs: string) => {
      liIndex++;
      const num = liIndex.toString().padStart(2, "0");
      return `<li${attrs}><span class="toc-num">${num}</span>`;
    });
  });
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
 * 手动注入基础主题样式（#wemd 后代选择器如 h1/h2/p/a/strong 等）
 *
 * juice 浏览器版 bug：大量 CSS 规则后停止解析，#wemd 块之后的
 * 基础样式（字体、颜色、间距、标题、链接等）全部丢失。
 * injectComponentStylesManually 只救回了 .wemd-* 组件样式，
 * 本函数补充恢复 #wemd 后代选择器的样式。
 */
const injectBaseThemeStylesManually = (html: string, css: string): string => {
  const rules: Array<{ selector: string; styles: string }> = [];
  const ruleRegex = /([^{}]+)\{([^}]*)\}/g;
  let match: RegExpExecArray | null;

  while ((match = ruleRegex.exec(css)) !== null) {
    const selector = match[1].trim();
    const body = match[2].trim();

    // 只处理 #wemd 开头的选择器
    if (!selector.startsWith("#wemd")) continue;
    // 排除伪元素/伪类（::before/::after 等由 juice 的 inlinePseudoElements 处理）
    if (selector.includes("::")) continue;
    if (selector.includes("@")) continue;
    // 排除 .wemd-* 组件选择器（已有 injectComponentStylesManually 处理）
    if (selector.includes(".wemd-")) continue;

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
 * 手动注入组件内联样式（绕过 juice 浏览器版本 bug）
 *
 * juice 在浏览器端处理大量 CSS 规则后会停止解析，导致组件样式丢失。
 * 此函数从 CSS 中提取所有 .wemd-* 选择器的样式，通过浏览器原生
 * querySelectorAll 精确匹配后代选择器/子选择器/伪类，直接注入到对应 HTML 元素上。
 */
const injectComponentStylesManually = (html: string, css: string): string => {
  // 提取所有 .wemd-* 组件 CSS 规则
  const rules: Array<{ selector: string; styles: string }> = [];
  const ruleRegex = /([^{}]+)\{([^}]*)\}/g;
  let match: RegExpExecArray | null;
  while ((match = ruleRegex.exec(css)) !== null) {
    const selector = match[1].trim();
    const body = match[2].trim();
    if (!selector.includes(".wemd-")) continue;
    if (selector.includes("::") || selector.includes("@")) continue;
    if (selector.trim() === "#wemd") continue;

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

  // 创建临时 DOM，利用浏览器 querySelectorAll 精确匹配选择器
  const container = document.createElement("div");
  container.innerHTML = html;

  for (const { selector, styles } of rules) {
    try {
      const elements = container.querySelectorAll(selector);
      elements.forEach((el) => {
        if (!(el instanceof HTMLElement)) return;
        // 合并已有内联样式和新样式（新样式覆盖已有）
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
      // 无效选择器（如 data-props 属性选择器含特殊字符）跳过
    }
  }

  return container.innerHTML;
};

/**
 * 处理 HTML，添加 data-tool 属性并应用 CSS 样式
 * @param html - 原始 HTML 字符串
 * @param css - CSS 样式字符串
 * @param inlineStyles - 是否内联样式 (使用 juice)，默认为 true。预览模式建议设为 false 以提高性能。
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

  let processedHtml = addTocNumbers(html);
  processedHtml = addChildPositionClasses(processedHtml);
  const wrappedHtml = `<section id="${SECTION_ID}">${processedHtml}</section>`;

  if (!inlineStyles) {
    return wrappedHtml;
  }

  // 展开 CSS 变量：把 var(--wemd-*, fallback) 替换成 fallback 值
  // juice 无法解析 CSS 自定义属性，带 var() 的属性会被跳过不内联
  let resolvedCss = css;
  let prevCss = "";
  let iterations = 0;
  while (prevCss !== resolvedCss && iterations < 10) {
    prevCss = resolvedCss;
    resolvedCss = resolvedCss.replace(
      /var\(--wemd-[a-z0-9-]+,\s*([^()]*(?:\([^()]*\)[^()]*)*)\)/g,
      (_match, fallback: string) => fallback.trim(),
    );
    iterations++;
  }

  try {
    let res = juice.inlineContent(wrappedHtml, resolvedCss, {
      inlinePseudoElements,
      preserveImportant: true,
    });

    // juice 浏览器版本存在 bug：大量 CSS 规则（尤其是 #wemd {} 块）之后
    // 会停止解析后续的选择器，导致所有组件样式丢失。
    // 这里手动从 resolvedCss 中提取规则，注入到对应 HTML 元素上。
    res = injectComponentStylesManually(res, resolvedCss);
    res = injectBaseThemeStylesManually(res, resolvedCss);

    // 在 juice 处理之后，为代码块追加关键内联样式
    // 这确保我们的样式不会被 juice 覆盖，且优先级最高
    if (inlinePseudoElements) {
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
      // 匹配所有带 style 属性的 code 元素（不限制 class）
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
  } catch (e) {
    console.error("Juice inline error:", e);
    // juice 崩溃时，仍然手动注入样式到原始 HTML
    let fallback = wrappedHtml;
    fallback = injectComponentStylesManually(fallback, resolvedCss);
    fallback = injectBaseThemeStylesManually(fallback, resolvedCss);
    return fallback;
  }
};
