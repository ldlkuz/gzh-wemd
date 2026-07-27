/**
 * markdown-it-component
 * 解析公众号组件语法 `::: type{props} ... :::`
 *
 * 语法：
 * ::: quote-card{author="张三" role="设计师"}
 * 内容很重要
 * :::
 *
 * 输出：
 * <section class="wemd-component wemd-quote-card" data-props='{...}'>
 *   <section class="wemd-component-body">内容</section>
 * </section>
 *
 * 设计要点：
 * - 不渲染具体样式，只输出结构 + data-props，样式由主题 CSS 提供
 * - props 解析支持：key="value"、key='value'、key=value
 * - 支持嵌套 markdown 内容（body 会走完整的 markdown-it 渲染管线）
 * - 容错：未闭合的 ::: 不解析，原样输出
 */

import type MarkdownIt from "markdown-it";
import type StateBlock from "markdown-it/lib/rules_block/state_block";
import Token from "markdown-it/lib/token";
import { parseComponentProps } from "./component/parseProps";
import { MAGAZINE_RENDERERS } from "./component/magazineRenderers";

const COMPONENT_MARKER = ":::";
// 组件名允许：小写字母、数字、连字符
const COMPONENT_NAME_RE = /^[a-z][a-z0-9-]*$/;

interface ComponentBlockInfo {
  name: string;
  propsRaw: string;
}

/**
 * 从行首匹配 `::: name{props}` 语法
 * 返回 null 表示不是组件起始行
 */
function matchComponentOpen(line: string): ComponentBlockInfo | null {
  const trimmed = line.trim();
  if (!trimmed.startsWith(COMPONENT_MARKER)) return null;

  // ::: 后面的内容
  const rest = trimmed.slice(COMPONENT_MARKER.length).trim();
  if (!rest) return null;

  // 提取 name 和可选的 {props}
  // 形如：quote-card 或 quote-card{author="x"} 或 quote-card {author="x"}
  const match = rest.match(/^([a-z][a-z0-9-]*)\s*(\{[^}]*\})?\s*$/);
  if (!match) return null;

  const name = match[1];
  if (!COMPONENT_NAME_RE.test(name)) return null;

  const propsRaw = match[2] ? match[2].slice(1, -1) : "";
  return { name, propsRaw };
}

/**
 * 判断一行是否为组件闭合标记 `:::`
 * 注意：起始行可能有 name，闭合行只能是裸 `:::`
 */
function isComponentClose(line: string): boolean {
  return line.trim() === COMPONENT_MARKER;
}

/**
 * 组件块规则：识别 `::: name{props} ... :::` 块
 */
function componentRule(
  state: StateBlock,
  startLine: number,
  endLine: number,
  silent: boolean,
): boolean {
  const start = state.bMarks[startLine] + state.tShift[startLine];
  const lineStart = state.src.slice(start, state.eMarks[startLine]);

  const info = matchComponentOpen(lineStart);
  if (!info) return false;

  // 向下查找闭合行 `:::`
  let closeLine = -1;
  for (let line = startLine + 1; line < endLine; line++) {
    const ls = state.bMarks[line] + state.tShift[line];
    const le = state.eMarks[line];
    const content = state.src.slice(ls, le);
    if (isComponentClose(content)) {
      closeLine = line;
      break;
    }
  }

  // 未闭合：不解析，交给其他规则处理
  if (closeLine === -1) return false;

  if (silent) return true;

  const oldParent = state.parentType;
  state.parentType = "component" as typeof state.parentType;

  const token = state.push("component_open", "section", 1);
  token.markup = COMPONENT_MARKER;
  token.block = true;
  token.info = info.propsRaw;
  token.attrSet("class", `wemd-component wemd-${info.name}`);
  token.attrSet("data-component", info.name);
  token.map = [startLine, closeLine];

  // 检查是否有专用渲染器
  const hasCustomRenderer = info.name in MAGAZINE_RENDERERS;

  if (hasCustomRenderer) {
    // 有专用渲染器：提取原始内容，存到 token.meta 中
    // 不调用 markdown-it 的 tokenize，避免内部生成 p/ul/li 等标签
    const rawLines: string[] = [];
    for (let line = startLine + 1; line < closeLine; line++) {
      const ls = state.bMarks[line] + state.tShift[line];
      const le = state.eMarks[line];
      rawLines.push(state.src.slice(ls, le));
    }
    const rawContent = rawLines.join("\n");

    // 插入一个自定义 token，渲染时用专用渲染器处理
    const bodyToken = state.push("component_body", "", 0);
    bodyToken.content = rawContent;
    bodyToken.meta = { componentName: info.name };
  } else {
    // 没有专用渲染器：走正常的 Markdown 渲染
    state.md.block.tokenize(state, startLine + 1, closeLine);
  }

  const closeToken = state.push("component_close", "section", -1);
  closeToken.markup = COMPONENT_MARKER;

  state.parentType = oldParent;
  state.line = closeLine + 1;

  return true;
}

/**
 * 把 propsRaw 字符串序列化为 JSON 字符串，写入 data-props 属性
 * 同时把解析后的 props 对象存到 token.meta，供渲染时使用
 */
function attachPropsToToken(token: Token, propsRaw: string): void {
  const props = parseComponentProps(propsRaw);
  token.meta = { props };
  try {
    token.attrSet("data-props", JSON.stringify(props));
  } catch {
    token.attrSet("data-props", "{}");
  }
  for (const [key, value] of Object.entries(props)) {
    const attrKey = `data-${key}`;
    if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
    ) {
      token.attrSet(attrKey, String(value));
    }
  }
}

export default function markdownItComponent(md: MarkdownIt): void {
  // 注册块规则，优先级在 table、blockquote 之后
  md.block.ruler.before("fence", "component", componentRule, {
    alt: ["paragraph", "reference", "blockquote", "list"],
  });

  // 在 core 规则里把 props 写入 token
  md.core.ruler.push("component-props", (state) => {
    for (const token of state.tokens) {
      if (token.type === "component_open" && token.info != null) {
        attachPropsToToken(token, token.info);
      }
    }
  });

  // 自定义 component_open 渲染
  md.renderer.rules.component_open = (tokens: Token[], idx: number) => {
    const token = tokens[idx];
    const cls = token.attrGet("class") || "wemd-component";
    const dataComponent = token.attrGet("data-component") || "";
    const dataProps = token.attrGet("data-props") || "{}";
    const componentName = dataComponent;

    const dataAttrs: string[] = [];
    if (token.attrs) {
      for (const [name, value] of token.attrs) {
        if (
          name.startsWith("data-") &&
          name !== "data-props" &&
          name !== "data-component"
        ) {
          dataAttrs.push(`${name}="${escapeHtmlAttr(String(value))}"`);
        }
      }
    }
    const dataAttrsStr = dataAttrs.length ? " " + dataAttrs.join(" ") : "";

    const hasCustomRenderer = componentName in MAGAZINE_RENDERERS;
    if (hasCustomRenderer) {
      // 杂志级组件：直接输出外层容器，不带 wemd-component-body
      return `<section class="${cls}" data-component="${dataComponent}" data-props="${escapeHtmlAttr(dataProps)}">\n`;
    } else {
      // 普通组件：输出外层容器 + wemd-component-body
      return `<section class="${cls}" data-component="${dataComponent}" data-props="${escapeHtmlAttr(dataProps)}">\n<section class="wemd-component-body"${dataAttrsStr}>\n`;
    }
  };

  // 自定义 component_body 渲染：调用专用渲染器
  md.renderer.rules.component_body = (tokens: Token[], idx: number) => {
    const token = tokens[idx];
    const componentName = token.meta?.componentName as string;
    const renderer = MAGAZINE_RENDERERS[componentName];
    if (renderer) {
      return renderer(token.content || "") + "\n";
    }
    return "";
  };

  // 自定义 component_close 渲染
  md.renderer.rules.component_close = (tokens: Token[], idx: number) => {
    // 找到对应的 open token，判断是否是杂志级组件
    let componentName = "";
    for (let i = idx - 1; i >= 0; i--) {
      if (tokens[i].type === "component_open") {
        componentName = tokens[i].attrGet("data-component") || "";
        break;
      }
    }

    const hasCustomRenderer = componentName in MAGAZINE_RENDERERS;
    if (hasCustomRenderer) {
      return `</section>\n`;
    } else {
      return `</section>\n</section>\n`;
    }
  };
}

/** 转义 HTML 属性值中的特殊字符 */
function escapeHtmlAttr(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
