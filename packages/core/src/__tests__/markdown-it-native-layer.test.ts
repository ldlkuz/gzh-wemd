import { describe, expect, it } from "vitest";
import { createMarkdownParser } from "../MarkdownParser";

// getTemplate stub：返回 undefined 会回退默认骨架，仅用于验证"套容器"行为
const stubTemplate = () => undefined;

describe("markdown-it-native-layer 基础层自动套容器", () => {
  const parserWith = createMarkdownParser({ getTemplate: stubTemplate });
  const parserPlain = createMarkdownParser();

  it("未启用（无 getTemplate）时不套容器", () => {
    const md = "## 标题\n\n| a | b |\n|---|---|\n| 1 | 2 |";
    const html = parserPlain.render(md);
    expect(html).toContain("<h2");
    expect(html).toContain("<table");
    expect(html).not.toContain("wemd-component");
  });

  it("启用时 `## 标题` → section-title 容器", () => {
    const html = parserWith.render("## 章节标题");
    expect(html).toContain('class="wemd-component wemd-section-title"');
    expect(html).toContain('data-component="section-title"');
    // 内层原生标题仍正常生成，未因套容器而丢失
    expect(html).toContain("<h2");
  });

  it("启用时 `## 1. 标题` → numbered-heading 容器", () => {
    const html = parserWith.render("## 1. 第一步");
    expect(html).toContain('class="wemd-component wemd-numbered-heading"');
  });

  it("启用时 `## 第一步` → numbered-heading 容器", () => {
    const html = parserWith.render("## 第一步");
    expect(html).toContain('class="wemd-component wemd-numbered-heading"');
  });

  it("启用时表格 → styled-table 容器", () => {
    const md = "| a | b |\n|---|---|\n| 1 | 2 |";
    const html = parserWith.render(md);
    expect(html).toContain('class="wemd-component wemd-styled-table"');
    expect(html).toContain("<table");
    expect(html).toContain("<thead");
  });

  it("启用时代码块 → code-frame 容器", () => {
    const html = parserWith.render("```js\nconst a = 1;\n```");
    expect(html).toContain('class="wemd-component wemd-code-frame"');
    expect(html).toContain("<pre");
  });

  it("启用时引用 → pullquote 容器", () => {
    const html = parserWith.render("> 这是一段引用");
    expect(html).toContain('class="wemd-component wemd-pullquote"');
    expect(html).toContain("<blockquote");
  });

  it("启用时分隔线 → divider 容器", () => {
    const html = parserWith.render("---");
    expect(html).toContain('class="wemd-component wemd-divider"');
    expect(html).toContain("<hr");
  });

  it("启用时连续两图 → image-grid 容器", () => {
    const md =
      "![](https://a.com/1.png)\n![](https://a.com/2.png)";
    const html = parserWith.render(md);
    expect(html).toContain('class="wemd-component wemd-image-grid"');
  });

  it("启用时单图 → image-card 容器", () => {
    const md = "![](https://a.com/1.png)";
    const html = parserWith.render(md);
    expect(html).toContain('class="wemd-component wemd-image-card"');
  });

  it("列表项内的原生结构不被套容器", () => {
    const md = "- | a | b |\n---";
    const html = parserWith.render(md);
    // 列表整体仍存在
    expect(html).toContain("<li");
  });
});