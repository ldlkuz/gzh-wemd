/**
 * MCP 结果格式化助手
 *
 * 与传输层（stdio / server 启动）解耦，便于单元测试。
 */

/** 统一把结果包成 MCP 文本内容 */
export function text(value: unknown) {
  return {
    content: [
      {
        type: "text" as const,
        text: typeof value === "string" ? value : JSON.stringify(value, null, 2),
      },
    ],
  };
}

/**
 * 把元信息（实际生效的主题 / 图片转存提醒）以 HTML 注释形式附在 HTML 最前：
 * 公众号会忽略注释、不影响排版，同时 AI 能读到失败原因与实际主题，避免静默
 * ——尤其是传了不存在的主题时服务端会回退默认主题，不告知就无从察觉。
 */
export function withHtmlNotes(
  html: string,
  notes: { themeId?: string; warnings?: string[] },
): string {
  const parts: string[] = [];
  if (notes.themeId) parts.push(`主题：${notes.themeId}`);
  if (notes.warnings?.length) {
    parts.push(`图片提醒：${notes.warnings.join("；")}`);
  }
  if (!parts.length) return html;
  return `<!-- WeMD ${parts.join(" | ")} -->\n${html}`;
}
