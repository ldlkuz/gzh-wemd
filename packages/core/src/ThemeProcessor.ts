import { expandCSSVariables } from "./themes/cssVariableExpander";
import { inlinePseudoElementDecorations } from "./pseudoElementInline";

const DATA_TOOL = "WeMD编辑器";
const SECTION_ID = "wemd";

/**
 * 通用 CSS 简写家族表：每个「简写(shorthand)」映射到它所能影响的「长属性(longhand)」。
 *
 * 这些长属性在 CSS 层叠中与简写共享同一组联动值。当内联到同一段 style 串时，
 * 浏览器按声明顺序求值：排在简写【之前】的长属性会被简写覆盖（危险），
 * 排在简写【之后】的长属性会覆盖简写（安全）。
 *
 * 表驱动替代原先仅有 margin/padding 的硬编码，覆盖 border / outline / flex /
 * background 等常见家族，统一解决「简写覆盖其前长属性」的顺序敏感问题。
 */
export const SHORTHAND_FAMILIES: ReadonlyArray<{
  short: string;
  longhands: readonly string[];
}> = [
  {
    short: "margin",
    longhands: ["margin-top", "margin-right", "margin-bottom", "margin-left"],
  },
  {
    short: "padding",
    longhands: [
      "padding-top",
      "padding-right",
      "padding-bottom",
      "padding-left",
    ],
  },
  { short: "inset", longhands: ["top", "right", "bottom", "left"] },
  {
    short: "border",
    longhands: [
      "border-width",
      "border-style",
      "border-color",
      "border-top",
      "border-right",
      "border-bottom",
      "border-left",
      "border-top-width",
      "border-top-style",
      "border-top-color",
      "border-right-width",
      "border-right-style",
      "border-right-color",
      "border-bottom-width",
      "border-bottom-style",
      "border-bottom-color",
      "border-left-width",
      "border-left-style",
      "border-left-color",
    ],
  },
  {
    short: "border-width",
    longhands: [
      "border-top-width",
      "border-right-width",
      "border-bottom-width",
      "border-left-width",
    ],
  },
  {
    short: "border-style",
    longhands: [
      "border-top-style",
      "border-right-style",
      "border-bottom-style",
      "border-left-style",
    ],
  },
  {
    short: "border-color",
    longhands: [
      "border-top-color",
      "border-right-color",
      "border-bottom-color",
      "border-left-color",
    ],
  },
  {
    short: "border-top",
    longhands: ["border-top-width", "border-top-style", "border-top-color"],
  },
  {
    short: "border-right",
    longhands: [
      "border-right-width",
      "border-right-style",
      "border-right-color",
    ],
  },
  {
    short: "border-bottom",
    longhands: [
      "border-bottom-width",
      "border-bottom-style",
      "border-bottom-color",
    ],
  },
  {
    short: "border-left",
    longhands: ["border-left-width", "border-left-style", "border-left-color"],
  },
  {
    short: "border-radius",
    longhands: [
      "border-top-left-radius",
      "border-top-right-radius",
      "border-bottom-right-radius",
      "border-bottom-left-radius",
    ],
  },
  {
    short: "outline",
    longhands: ["outline-width", "outline-style", "outline-color"],
  },
  { short: "flex", longhands: ["flex-grow", "flex-shrink", "flex-basis"] },
  { short: "gap", longhands: ["row-gap", "column-gap"] },
  { short: "place-items", longhands: ["align-items", "justify-items"] },
  { short: "place-content", longhands: ["align-content", "justify-content"] },
  {
    short: "font",
    longhands: [
      "font-style",
      "font-variant",
      "font-weight",
      "font-stretch",
      "font-size",
      "line-height",
      "font-family",
    ],
  },
  {
    short: "background",
    longhands: [
      "background-image",
      "background-position",
      "background-size",
      "background-repeat",
      "background-origin",
      "background-clip",
      "background-attachment",
      "background-color",
    ],
  },
  {
    short: "list-style",
    longhands: ["list-style-type", "list-style-position", "list-style-image"],
  },
  {
    short: "text-decoration",
    longhands: [
      "text-decoration-line",
      "text-decoration-style",
      "text-decoration-color",
      "text-decoration-thickness",
    ],
  },
];

/**
 * 解决内联时「简写(shorthand) + 长属性(longhand) 并存互相覆盖」问题。
 *
 * 背景：`margin: 0` 与 `margin-bottom: 24px` 会同时写进同一段 style，
 * 浏览器按出现顺序求值，`margin` 简写若排在后面会把前面已内联的
 * `margin-bottom` 顶掉——导致组件垂直间距丢失（blockquote 典型案例）。
 *
 * 处理策略：不删除简写、也不把简写值分解重写，而是把每个「简写」稳定地
 * 前置到它所属家族第一个长属性之前。这样长属性在简写之后出现，按 CSS
 * 层叠规则长属性生效，结果与声明顺序无关。相比逐属性展开值，此法对所有
 * 家族统一成立，无需解析 background / font 等复杂简写的拆分语义。
 */
function normalizeShorthandOrderForInline(
  styleMap: Map<string, string>,
): Map<string, string> {
  // 取 entries 数组做稳定移动：只调整简写与长属性的相对顺序，不触碰其它声明
  const entries = Array.from(styleMap.entries());

  for (const family of SHORTHAND_FAMILIES) {
    const shortIdx = entries.findIndex(([k]) => k === family.short);
    if (shortIdx < 0) continue;
    // 简写存在但该家族没有任何长属性 → 无覆盖风险，无需处理
    if (!family.longhands.some((k) => styleMap.has(k))) continue;
    const firstLongIdx = entries.findIndex(([k]) =>
      family.longhands.includes(k),
    );
    // 简写已经在长属性之前（安全）→ 跳过
    if (firstLongIdx > shortIdx) continue;
    // 把简写移动到该家族第一个长属性之前
    const [moved] = entries.splice(shortIdx, 1);
    entries.splice(firstLongIdx, 0, moved);
  }

  const result = new Map<string, string>();
  for (const [k, v] of entries) result.set(k, v);
  return result;
}

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
        // 统一简写家族（margin/padding/border/outline/flex 等）与长属性的顺序，
        // 避免简写在 style 串中覆盖其前长属性，
        // 从而消除组件垂直间距丢失（如 blockquote）这类「顺序决定结果」的问题
        const normalizedMap = normalizeShorthandOrderForInline(styleMap);
        const merged = Array.from(normalizedMap.entries())
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

  // rem 单位 → px（基准 16px）
  // 公众号编辑器根字体大小与浏览器不同且不可控，若残留 rem，间距/字号会随根字体缩放而异常。
  // 需在 CSS 变量展开、样式全内联之后执行(buildWechatPublishHtml / compile-publish 共用本函数)。
  const remToPx = (value: string): string =>
    value.replace(/(\d+(?:\.\d+)?)rem\b/g, (_m, num: string) => {
      const px = parseFloat(num) * 16;
      return `${Number.isInteger(px) ? px : parseFloat(px.toFixed(3))}px`;
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

  // 内联完成后，把所有 rem 统一转为 px，避免公众号根字体缩放导致间距/字号异常
  res = remToPx(res);

  return res;
};
