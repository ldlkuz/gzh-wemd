/**
 * render-server —— 供服务端 / 其他程序 / skill 复用的渲染入口
 *
 * 把「markdown → 主题 HTML → 微信内联安全 HTML」整条纯函数链路收敛成一个同步入口：
 *   renderWechatHtml(markdown, { themeId, inlinePseudoElements? }) => 可直接粘贴公众号的 HTML
 *
 * 纯函数、无状态、无 LLM 依赖，可被 Koa/Express 路由、CLI、MCP skill 直接调用。
 * 组件槽位/骨架（templates + slotDefs）按当前主题解析，与 Web / Electron 预览同管线。
 */
import {
  getBuiltInThemeDefinition,
  getThemeTemplates,
  getThemeSlotDefs,
} from "./index";
import { renderTheme } from "./theme-renderer";
import { createMarkdownParser } from "./MarkdownParser";
import { processHtml } from "./ThemeProcessor";

export interface RenderWechatHtmlOptions {
  /** 主题 id；缺省回退到默认主题（"default"） */
  themeId?: string;
  /** 是否内联伪元素为真实节点（微信需要），默认 true */
  inlinePseudoElements?: boolean;
}

export interface RenderWechatHtmlResult {
  html: string;
  themeId: string;
}

/**
 * 渲染一篇 markdown 为可直接粘贴微信公众号的 HTML。
 */
export function renderWechatHtml(
  markdown: string,
  options: RenderWechatHtmlOptions = {},
): RenderWechatHtmlResult {
  const themeId = options.themeId ?? "default";
  const theme = getBuiltInThemeDefinition(themeId);
  if (!theme) {
    throw new Error(`未知主题：${themeId}`);
  }

  const css = renderTheme(theme);
  const templates = getThemeTemplates(theme);
  const slotDefs = getThemeSlotDefs(theme);
  const parser = createMarkdownParser({
    getTemplate: (id) => templates.get(id),
    getSlotDefs: (id) => slotDefs.get(id),
  });

  const raw = parser.render(markdown);
  const inlinePseudo = options.inlinePseudoElements ?? true;
  const html = processHtml(raw, css, true, inlinePseudo);
  return { html, themeId };
}
