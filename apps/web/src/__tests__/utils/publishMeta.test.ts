import { describe, expect, it } from "vitest";
import {
  extractHeadingTitleFromMarkdown,
  normalizeWechatTitle,
  resolvePublishMeta,
  WECHAT_TITLE_MAX_LENGTH,
} from "../../utils/publishMeta";

describe("publishMeta", () => {
  it("优先提取正文中的一级标题", () => {
    const markdown = `## 次级标题\n\n# 主标题\n\n正文`;
    expect(extractHeadingTitleFromMarkdown(markdown)).toBe("主标题");
  });

  it("会忽略代码块中的标题语法", () => {
    const markdown = "```md\n# 代码块标题\n```\n\n# 正文标题";
    expect(extractHeadingTitleFromMarkdown(markdown)).toBe("正文标题");
  });

  it("会按公众号标题长度限制截断", () => {
    const raw = "这是一段很长的标题".repeat(10);
    expect(Array.from(normalizeWechatTitle(raw)).length).toBe(
      WECHAT_TITLE_MAX_LENGTH,
    );
  });

  it("在没有显式标题时回退到正文标题", () => {
    const meta = resolvePublishMeta("# 正文标题", { author: "Alice" });
    expect(meta.title).toBe("正文标题");
    expect(meta.author).toBe("Alice");
  });

  it("从 magazine-cover 组件提取标题", () => {
    const markdown = [
      "::: magazine-cover",
      "从入门到进阶：2025 年度效率工具指南",
      "SUPERCHARGE YOUR WORKFLOW",
      "---",
      "告别选择困难，这 6 款神器让你的效率翻倍",
      ":::",
    ].join("\n");
    expect(extractHeadingTitleFromMarkdown(markdown)).toBe(
      "从入门到进阶：2025 年度效率工具指南",
    );
  });

  it("magazine-cover 组件无标题时回退到 H1", () => {
    const markdown = ["::: magazine-cover", ":::", "", "# 正文标题"].join("\n");
    expect(extractHeadingTitleFromMarkdown(markdown)).toBe("正文标题");
  });
});
