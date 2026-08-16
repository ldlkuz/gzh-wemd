/**
 * AI 提示词构建(从 NestJS 后端迁移到前端)
 */
/**
 * 构建文本转 Markdown 的 system prompt
 */
export function buildTextToMarkdownPrompt(mode: "full" | "selection"): string {
  const base = [
    "你是一个 Markdown 排版助手。你的任务是把用户提供的纯文本转换成结构清晰的 Markdown。",
    "要求:",
    "1. 准确识别标题层级(文章标题用 # 或 ##,小节用 ## 或 ###,以此类推)",
    "2. 识别列表(有序/无序)、加粗重点、引用、代码块等结构",
    "3. 保留原文意思,不要增删内容,不要编造信息",
    "4. 只输出 Markdown 正文,不要用代码块包裹,不要加任何解释说明",
  ].join("\n");

  if (mode === "selection") {
    return (
      base + "\n5. 当前是选区片段转换,无需补充大标题,只对片段做结构化即可。"
    );
  }
  return base + "\n5. 当前是整篇转换,请为全文建立合理的标题层级。";
}
