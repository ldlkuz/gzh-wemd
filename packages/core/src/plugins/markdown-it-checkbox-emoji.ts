/**
 * markdown-it 插件：将 checkbox 转换为 emoji
 * 微信公众号会过滤 <input> 标签，需要在渲染时就转为 emoji
 */
import MarkdownIt from "markdown-it";

export default function markdownItCheckboxEmoji(md: MarkdownIt): void {
  // 保存原始渲染器
  const defaultRender = md.renderer.rules.html_inline;

  md.renderer.rules.html_inline = (tokens, idx, options, env, self) => {
    const token = tokens[idx];
    const content = token.content;

    // 检查是否是 checkbox input
    if (
      content.includes('type="checkbox"') ||
      content.includes("type='checkbox'")
    ) {
      // 选中的 checkbox
      if (content.includes("checked")) {
        return '<span style="font-size:1em;margin-right:4px">✅</span>';
      }
      // 未选中的 checkbox
      return '<span style="font-size:1em;margin-right:4px">⬜</span>';
    }

    // 其他 html_inline 使用默认渲染
    if (defaultRender) {
      return defaultRender(tokens, idx, options, env, self);
    }
    return content;
  };
}
