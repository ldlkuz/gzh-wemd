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

/** 渲染输出里每个组件容器都带 data-component="<id>"，用它与输入声明的 ::: 名做差集 */
const COMPONENT_ATTR_RE = /data-component="([^"]+)"/g;

/** 行首的 ::: 组件声明：取「::: 之后、空白或 { 之前」的名字（允许中文，AI 可能写中文组件名）；裸 ::: 收尾行无名字故不匹配 */
const BLOCK_OPEN_RE = /^:::[ \t]*([^\s:{]+)/gm;

/**
 * 生成「检查排版结果」的诊断摘要（默认返回给 MCP 调用方的内容）。
 *
 * 为什么要有它：其余工具只能告诉 AI「应该怎么写」，唯独没有任何一步能告诉它
 * 「实际渲染成了什么」。而手册说某个组件存在 ≠ 它真的被识别——所以这里把
 * 「输入声明的 ::: 名」与「输出里实际出现的组件」对一遍，点名未被识别的组件。
 */
export function summarizeCheck(input: {
  markdown: string;
  html: string;
  themeId?: string;
  warnings?: string[];
}): string {
  const { markdown, html, themeId, warnings } = input;
  const used = [...new Set([...html.matchAll(COMPONENT_ATTR_RE)].map((m) => m[1]))];
  const declared = [
    ...new Set([...markdown.matchAll(BLOCK_OPEN_RE)].map((m) => m[1])),
  ];
  const unrecognized = declared.filter((name) => !used.includes(name));

  const lines: string[] = [];
  lines.push(`主题：${themeId ?? "(未知)"}`);
  lines.push(
    used.length
      ? `已识别组件（${used.length}）：${used.join("、")}`
      : "已识别组件：无（正文没有使用 ::: 组件）",
  );
  if (unrecognized.length) {
    lines.push(
      `未识别组件（${unrecognized.length}）：${unrecognized.join("、")}`,
      "  ↑ 这些 ::: 块没有被渲染成组件，而是当普通文本输出了。请对照主题手册核对组件名（拼写错误，或该主题根本没有这个组件）。",
    );
  }
  lines.push(
    `HTML 大小：${html.length} 字符（约 ${(html.length / 1024).toFixed(1)} KB）`,
  );
  if (warnings?.length) lines.push(`图片提醒：${warnings.join("；")}`);
  return lines.join("\n");
}
