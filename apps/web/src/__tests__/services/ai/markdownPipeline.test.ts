/**
 * markdownPipeline（文本 → Markdown 三段式流水线）单元测试
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  preprocessPlainText,
  postprocessMarkdown,
  convertTextToMarkdown,
} from "../../../services/ai/markdownPipeline";
import { textToMarkdown } from "../../../services/ai/aiService";

vi.mock("../../../services/ai/aiService", () => ({
  textToMarkdown: vi.fn(),
}));

describe("preprocessPlainText 程序预处理（确定性）", () => {
  it("统一 CRLF/CR 换行", () => {
    expect(preprocessPlainText("a\r\nb\rc")).toBe("a\nb\nc");
  });

  it("去 BOM 与零宽字符", () => {
    expect(preprocessPlainText("\uFEFFa\u200Bb\u200Dc")).toBe("abc");
  });

  it("去行尾空白并保留段内换行", () => {
    expect(preprocessPlainText("a  \nb \t\nc")).toBe("a\nb\nc");
  });

  it("折叠 3+ 连续空行为 1 个空行，并去首尾空行", () => {
    expect(preprocessPlainText("\n\na\n\n\n\n\nb\n\n\n")).toBe("a\n\nb");
  });

  it("不做内容理解：保留原有 markdown 标记", () => {
    const md = "## 标题\n\n- 项目一\n- 项目二\n\n| a | b |";
    expect(preprocessPlainText(md)).toBe(md);
  });
});

describe("postprocessMarkdown 程序后处理（校验兜底）", () => {
  it("修复未闭合代码围栏（末尾补闭合）", () => {
    const out = postprocessMarkdown("```js\nconst a = 1;\n");
    expect(out).toContain("```js\nconst a = 1;\n```");
  });

  it("已闭合围栏不动", () => {
    const md = "```js\nconst a = 1;\n```\n\n正文";
    expect(postprocessMarkdown(md)).toBe(md);
  });

  it("表格列数对齐：少列补空单元格", () => {
    const md =
      "| 名称 | 数量 |\n| --- | --- |\n| 苹果 |\n| 香蕉 | 5 |";
    expect(postprocessMarkdown(md)).toBe(
      "| 名称 | 数量 |\n| --- | --- |\n| 苹果 |  |\n| 香蕉 | 5 |",
    );
  });

  it("表格列数对齐：多列并入末列避免丢内容", () => {
    const md = "| 名称 | 数量 |\n| --- | --- |\n| 苹果 | 3 | 多余 |";
    expect(postprocessMarkdown(md)).toBe(
      "| 名称 | 数量 |\n| --- | --- |\n| 苹果 | 3 多余 |",
    );
  });

  it("标题层级跳变修复：#### 跳到 ##", () => {
    const md = "# 大标题\n\n#### 跳级小节\n\n正文\n\n## 正常二级";
    expect(postprocessMarkdown(md)).toBe(
      "# 大标题\n\n## 跳级小节\n\n正文\n\n## 正常二级",
    );
  });

  it("代码围栏内的 # 标题不被改动", () => {
    const md = "```\n# 不动的\n#### 跳级\n```";
    expect(postprocessMarkdown(md)).toBe(md);
  });

  it("误加的 HTML 标签 → Markdown", () => {
    const md = '<p>第一段<strong>重点</strong></p><br><span style="color:red">x</span>';
    expect(postprocessMarkdown(md)).toBe("第一段**重点**\n\nx");
  });
});

describe("convertTextToMarkdown 编排", () => {
  beforeEach(() => {
    vi.mocked(textToMarkdown).mockReset();
  });

  it("先预处理再调 AI，最后后处理", async () => {
    vi.mocked(textToMarkdown).mockResolvedValue(
      "第一段\n\n| 名称 | 数量 |\n| --- | --- |\n| 苹果 |\n\n```js\nlet a = 1;",
    );
    const out = await convertTextToMarkdown({
      text: "\r\n\r\n正文\r\n\r\n\r\n",
      mode: "full",
    });
    expect(textToMarkdown).toHaveBeenCalledWith({
      text: "正文",
      mode: "full",
    });
    expect(out).toBe(
      "第一段\n\n| 名称 | 数量 |\n| --- | --- |\n| 苹果 |  |\n\n```js\nlet a = 1;\n```",
    );
  });

  it("透传 instruction 与 mode", async () => {
    vi.mocked(textToMarkdown).mockResolvedValue("ok");
    await convertTextToMarkdown({
      text: "hello",
      mode: "selection",
      instruction: "保持简短",
    });
    expect(textToMarkdown).toHaveBeenCalledWith({
      text: "hello",
      mode: "selection",
      instruction: "保持简短",
    });
  });
});
