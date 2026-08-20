/**
 * 微信导出专用：把内置组件里的 CSS 伪元素装饰（::before / ::after）物化为真实 DOM 元素。
 *
 * 微信编辑器会过滤 CSS 伪元素（::before / ::after），导致 timeline 竖线、steps 序号、
 * faq 挂角标题、callout 色条等装饰在公众号中丢失。本模块把这些装饰改写成真实
 * <span class="wemd-mat"> 元素，并直接把对应 CSS 规则的样式内联到元素上，
 * 从而在微信端也能正常显示。
 *
 * 设计约束（"最稳处理"）：
 * - 只在 inlinePseudoElements=true（复制到微信）时调用，预览与普通测试不受影响。
 * - 从 CSS 规则中读取样式（变量已展开），单一数据源，避免值漂移。
 * - 无命中组件时原样返回输入，不做 DOM 序列化，避免干扰其他用例。
 * - 全部确定性命令式处理，无正则对其他 HTML 结构产生副作用。
 */
import { expandCSSVariables } from "./themes/cssVariableExpander";

interface ParsedRule {
  style: string; // 声明块转 style 字符串（不含 content / counter-*）
  content: string; // content 属性原文
}

/** 从（已展开变量的）CSS 中提取某条选择器规则的声明。
    取「最后一个匹配项」：CSS 覆盖法则下，后面的规则（如主题追加层）胜出，
    避免命中共享层旧规则。 */
function parseRule(resolvedCss: string, selectorPart: string): ParsedRule {
  const re = new RegExp(
    `([^{}]*${escapeRegExp(selectorPart)}[^{}]*)\\{([^{}]*)\\}`,
    "gi",
  );
  let match: RegExpExecArray | null;
  let last: RegExpExecArray | null = null;
  while ((match = re.exec(resolvedCss)) !== null) {
    last = match;
  }
  const parsed: ParsedRule = { style: "", content: "" };
  if (!last) return parsed;

  const styleParts: string[] = [];
  last[2]
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .forEach((decl) => {
      const colon = decl.indexOf(":");
      if (colon <= 0) return;
      const prop = decl.substring(0, colon).trim().toLowerCase();
      if (prop === "content") {
        parsed.content = decl.substring(colon + 1).trim();
        return;
      }
      if (prop === "counter-increment" || prop === "counter-reset") return;
      styleParts.push(decl);
    });
  parsed.style = styleParts.join("; ");
  return parsed;
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** 解析 content 属性为文本（支持字面量 / attr() / counter()） */
function contentText(content: string, el: Element, index: number): string {
  const c = (content || "").trim();
  if (!c || c === "none") return "";
  const counter = c.match(/counter\(([^)]+)\)/);
  if (counter) return String(index);
  const attr = c.match(/attr\(([^)]+)\)/);
  if (attr) return el.getAttribute(attr[1]?.trim()) || "";
  const quoted = c.match(/^["']([\s\S]*)["']$/);
  if (quoted) return quoted[1];
  return "";
}

/** 创建物化 span */
function makeSpan(style: string, text: string): HTMLSpanElement {
  const span = document.createElement("span");
  span.className = "wemd-mat";
  if (style) {
    const existing = span.getAttribute("style") || "";
    span.setAttribute("style", existing ? `${existing}; ${style}` : style);
  }
  if (text) span.textContent = text;
  return span;
}

/** 从 data-props 中解析 callout type */
function calloutType(el: Element): string | undefined {
  const raw = el.getAttribute("data-props") || "";
  const decoded = raw
    .replace(/&quot;/g, '"')
    .replace(/&gt;/g, ">")
    .replace(/&lt;/g, "<");
  const m = decoded.match(/"type"\s*:\s*"([^"]+)"/);
  return m ? m[1].toLowerCase() : undefined;
}

const CALLOUT_TYPE_COLORS: Record<string, string> = {
  info: "#3b82f6",
  success: "#10b981",
  warning: "#f59e0b",
  danger: "#ef4444",
  tip: "#8b5cf6",
};

const CALLOUT_TYPE_ICONS: Record<string, string> = {
  info: "\u2139\uFE0F",
  success: "\u2705",
  warning: "\u26A0\uFE0F",
  danger: "\u274C",
  tip: "\uD83D\uDCA1",
};

/* ---------- 各组件物化逻辑（命中返回 true） ---------- */

function materializeCalloutPro(container: HTMLElement, css: string): boolean {
  const roots = container.querySelectorAll<HTMLElement>(
    "#wemd .wemd-callout-pro",
  );
  if (!roots.length) return false;
  const barRule = parseRule(css, ".wemd-callout-pro::before");
  const iconRule = parseRule(
    css,
    ".wemd-callout-pro .wemd-component-body > p:first-child::before",
  );
  let changed = false;

  roots.forEach((root) => {
    const type = calloutType(root);
    // 左侧色条
    if (barRule.style) {
      let style = barRule.style;
      // 语义固定色兜底：仅当主题 CSS 未自定义竖条背景（barRule.style 不含
      // background）时才强制覆盖为 type 语义色。主题皮肤若写了
      // `.wemd-callout-pro::before { background: ... }`，parseRule 取最后匹配，
      // style 会带上主题背景 → 尊重主题色，避免「主题想用琥珀/科技蓝，却被
      // 物化器硬塞紫色」的竖条与卡片风格冲突。
      if (
        type &&
        CALLOUT_TYPE_COLORS[type] &&
        !/background\s*:/.test(style)
      ) {
        style = `${style}; background: ${CALLOUT_TYPE_COLORS[type]}`.replace(
          /^;/,
          "",
        );
      }
      root.insertBefore(makeSpan(style, ""), root.firstChild);
      changed = true;
    }
    // 标题图标（type 固定图标优先；未命中时用 CSS content 兜底）
    if (iconRule.style || (type && CALLOUT_TYPE_ICONS[type])) {
      const title = root.querySelector<HTMLElement>(
        ".wemd-component-body > p:first-child",
      );
      if (title) {
        const icon =
          (type && CALLOUT_TYPE_ICONS[type]) || iconRule.content.trim();
        title.insertBefore(makeSpan(iconRule.style, icon), title.firstChild);
        changed = true;
      }
    }
  });
  return changed;
}

/** callout-pro 列表装饰：复用 .wemd-callout-pro li::before 的样式。
    content 为空时（如主题改用纯装饰竖线）仅物化样式、不插入文本。 */
function materializeCalloutProList(
  container: HTMLElement,
  css: string,
): boolean {
  const roots = container.querySelectorAll<HTMLElement>(
    "#wemd .wemd-callout-pro",
  );
  if (!roots.length) return false;
  const rule = parseRule(
    css,
    ".wemd-callout-pro .wemd-component-body ul li::before",
  );
  if (!rule.style) return false;
  const hasContent = rule.content.trim().length > 0;
  const text = hasContent ? contentText(rule.content, roots[0], 0) : "";
  let changed = false;
  roots.forEach((root) => {
    root
      .querySelectorAll<HTMLElement>(".wemd-component-body ul li")
      .forEach((li) => {
        li.insertBefore(makeSpan(rule.style, text), li.firstChild);
        changed = true;
      });
  });
  return changed;
}

function materializeSteps(container: HTMLElement, css: string): boolean {
  const lis = container.querySelectorAll<HTMLElement>(
    "#wemd .wemd-steps .wemd-component-body ol > li, #wemd .wemd-steps .wemd-component-body ul > li",
  );
  if (!lis.length) return false;
  const rule = parseRule(css, ".wemd-steps .wemd-component-body li::before");
  let i = 0;
  lis.forEach((li) => {
    i++;
    li.insertBefore(makeSpan(rule.style, String(i)), li.firstChild);
  });
  return true;
}

function materializeAccordion(container: HTMLElement, css: string): boolean {
  const qs = container.querySelectorAll<HTMLElement>(
    "#wemd .wemd-accordion .wemd-component-body > p.wemd-q",
  );
  if (!qs.length) return false;
  const rule = parseRule(
    css,
    ".wemd-accordion .wemd-component-body > p.wemd-q::before",
  );
  // 微信无折叠交互：不再画"＋"折叠符号，仅当主题仍定义了 ::before 装饰时才物化
  if (!rule.style) return false;
  const plus = contentText(rule.content, qs[0], 0) || "\uFF0B";
  qs.forEach((p) => p.insertBefore(makeSpan(rule.style, plus), p.firstChild));
  return true;
}

function materializePullquote(container: HTMLElement, css: string): boolean {
  // pullquote 两种结构：原生 > 引用（blockquote）与显式 ::: pullquote 容器（p）
  const ps = container.querySelectorAll<HTMLElement>(
    "#wemd .wemd-pullquote .wemd-component-body blockquote p:first-child, #wemd .wemd-pullquote .wemd-component-body > p:first-child",
  );
  if (!ps.length) return false;

  // 若该 pullquote 已定制为「双色角线」装饰（存在 .wemd-pq-corner），
  // 视觉已由角线承载，不再插入旧的 ::before 引号 span，避免装饰重复。
  const cornerRoot = ps[0].closest(".wemd-pullquote");
  if (cornerRoot && cornerRoot.querySelector(".wemd-pq-corner")) {
    return false;
  }

  const blockquoteRule = parseRule(
    css,
    ".wemd-pullquote .wemd-component-body > blockquote p:first-child::before",
  );
  const pRule = parseRule(
    css,
    ".wemd-pullquote .wemd-component-body > p:first-child::before",
  );
  const rule = blockquoteRule.style ? blockquoteRule : pRule;
  const mark = contentText(rule.content, ps[0], 0) || "\u201C";
  ps.forEach((p) => p.insertBefore(makeSpan(rule.style, mark), p.firstChild));
  return true;
}

function materializeFaq(container: HTMLElement, css: string): boolean {
  const bodies = container.querySelectorAll<HTMLElement>(
    "#wemd .wemd-faq .wemd-component-body",
  );
  if (!bodies.length) return false;
  const titleRule = parseRule(
    css,
    ".wemd-faq[data-title] .wemd-component-body::before",
  );
  const diamondRule = parseRule(
    css,
    ".wemd-faq .wemd-component-body > p > strong::before",
  );
  let changed = false;

  bodies.forEach((body) => {
    // 挂角标题徽章：data-title 注入在外层 .wemd-faq 容器上，而非 body
    const title = body.parentElement?.getAttribute("data-title");
    if (title && titleRule.style) {
      body.insertBefore(makeSpan(titleRule.style, title), body.firstChild);
      changed = true;
    }
    // 问题项菱形符号
    if (diamondRule.style) {
      body.querySelectorAll<HTMLElement>("p > strong").forEach((strong) => {
        strong.insertBefore(makeSpan(diamondRule.style, ""), strong.firstChild);
        changed = true;
      });
    }
  });
  return changed;
}

function materializeDivider(container: HTMLElement, css: string): boolean {
  const bodies = container.querySelectorAll<HTMLElement>(
    "#wemd .wemd-divider .wemd-component-body",
  );
  if (!bodies.length) return false;
  const before = parseRule(css, ".wemd-divider .wemd-component-body::before");
  const after = parseRule(css, ".wemd-divider .wemd-component-body::after");
  let changed = false;

  bodies.forEach((body) => {
    // 主题定制骨架已物化装饰元素（如 .wemd-dv-line），跳过，避免重复插入侧线
    if (body.querySelector(".wemd-dv-line") || body.querySelector(".wemd-mat")) {
      return;
    }
    const hasContent = body.children.length > 0;
    if (before.style) {
      body.insertBefore(makeSpan(before.style, ""), body.firstChild);
      changed = true;
    }
    if (hasContent && after.style) {
      body.appendChild(makeSpan(after.style, ""));
      changed = true;
    }
  });
  return changed;
}

/**
 * 将内置组件中的伪元素装饰物化为真实 <span>。
 * @param html - 已内联样式的 HTML（#wemd 包裹前或后均可）
 * @param css - 原始主题 CSS（本函数内部展开变量）
 * @returns 物化后的 HTML；若无命中组件则原样返回输入
 */
export const inlinePseudoElementDecorations = (
  html: string,
  css: string,
): string => {
  if (!html || !css) return html;
  const resolvedCss = expandCSSVariables(css);

  const container = document.createElement("div");
  container.innerHTML = html;

  let changed = false;
  changed = materializeCalloutPro(container, resolvedCss) || changed;
  changed = materializeCalloutProList(container, resolvedCss) || changed;
  changed = materializeSteps(container, resolvedCss) || changed;
  changed = materializeAccordion(container, resolvedCss) || changed;
  changed = materializePullquote(container, resolvedCss) || changed;
  changed = materializeFaq(container, resolvedCss) || changed;
  changed = materializeDivider(container, resolvedCss) || changed;

  if (!changed) return html;
  return container.innerHTML;
};
