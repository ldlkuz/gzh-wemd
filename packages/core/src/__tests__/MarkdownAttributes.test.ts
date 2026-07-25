import { describe, expect, it } from "vitest";
import { createMarkdownParser } from "../MarkdownParser";

describe("Markdown 属性语法", () => {
  it("为标题和段落添加合法的 class、id 与 data 属性", () => {
    const parser = createMarkdownParser({ mathRenderer: "katex" });
    const html = parser.render(
      "## 本章摘要 {.chapter-title #chapter-summary data-kind=heading}\n\n这是一段摘要。 {.summary .featured #abstract data-kind=summary}",
    );

    expect(html).toContain(
      '<h2 class="chapter-title" id="chapter-summary" data-kind="heading">',
    );
    expect(html).toContain(
      '<p class="summary featured" id="abstract" data-kind="summary">这是一段摘要。</p>',
    );
    expect(html).not.toContain("{.chapter-title");
    expect(html).not.toContain("{.summary");
  });

  it("将表格属性放到 table 并保留现有外层容器", () => {
    const parser = createMarkdownParser({ mathRenderer: "katex" });
    const html = parser.render(
      "| 指标 | 数值 |\n| --- | --- |\n| 阅读量 | 1200 |\n\n{.compact-table #metrics data-kind=statistics}",
    );

    expect(html).toContain('<section class="table-container"><table');
    expect(html).toContain(
      '<table class="compact-table" id="metrics" data-kind="statistics">',
    );
    expect(html).not.toContain("{.compact-table");
  });

  it("拒绝危险属性和 WeMD 保留属性", () => {
    const parser = createMarkdownParser({ mathRenderer: "katex" });
    const html = parser.render(
      '受限属性。 {.notice #wemd data-safe=yes data-tool=forged data-wemd-counter-generated=before style="color:red" onclick="alert(1)"}',
    );

    expect(html).toContain('<p class="notice" data-safe="yes">受限属性。</p>');
    expect(html).not.toContain('id="wemd"');
    expect(html).not.toContain("data-tool");
    expect(html).not.toContain("data-wemd-");
    expect(html).not.toContain("style=");
    expect(html).not.toContain("onclick=");
  });

  it("不把转义语法、普通大括号和公式误解析", () => {
    const parser = createMarkdownParser({ mathRenderer: "katex" });
    const html = parser.render(
      "\\{.standalone}\n\n转义属性：\\{.notice}\n\n普通内容：{尚未完成}\n\n公式：$x^{2}$",
    );

    expect(html).toContain("{.standalone}");
    expect(html).toContain("转义属性：{.notice}");
    expect(html).toContain("普通内容：{尚未完成}");
    expect(html).toContain('class="katex"');
  });

  it("不为代码围栏应用属性语法", () => {
    const parser = createMarkdownParser({ mathRenderer: "katex" });
    const html = parser.render("```ts {.danger}\nconst value = 1;\n```");

    expect(html).toContain('<pre class="custom">');
    expect(html).toContain("value =");
    expect(html).toContain('class="hljs-number">1</span>');
    expect(html).not.toContain('class="danger"');
  });

  it("保留列表项、分隔线、表格单元格和软换行后的属性文本", () => {
    const parser = createMarkdownParser({ mathRenderer: "katex" });
    const html = parser.render(
      "- 列表项 {.list-item}\n\n--- {.divider}\n\n| 项目 | 状态 |\n| --- | --- |\n| 属性 | 保留 {.cell} |\n\n第一行\n{.softbreak}",
    );

    expect(html).toContain("列表项 {.list-item}");
    expect(html).toContain("<p>--- {.divider}</p>");
    expect(html).toContain("保留 {.cell}");
    expect(html).toContain("第一行\n{.softbreak}");
    expect(html).not.toContain('class="list-item"');
    expect(html).not.toContain('class="divider"');
    expect(html).not.toContain('class="cell"');
    expect(html).not.toContain('class="softbreak"');
  });

  it("不改写用户原文中的私用区字符", () => {
    const parser = createMarkdownParser({ mathRenderer: "katex" });
    const html = parser.render("私用区：\uE000原文\uE001");

    expect(html).toContain("\uE000原文\uE001");
  });

  it("允许列表内实际渲染为段落、标题和表格的元素使用属性", () => {
    const parser = createMarkdownParser({ mathRenderer: "katex" });
    const html = parser.render(
      "- ## 嵌套标题 {.nested-heading}\n\n  松散段落 {.nested-paragraph}\n\n  | 项目 | 状态 |\n  | --- | --- |\n  | 属性 | 生效 |\n\n  {.nested-table}",
    );

    expect(html).toContain('<h2 class="nested-heading">');
    expect(html).toContain('<p class="nested-paragraph">松散段落</p>');
    expect(html).toContain('<table class="nested-table">');
    expect(html).not.toContain('<li class="nested-heading"');
  });

  it("不把松散列表首段的列表项属性重新解释为段落属性", () => {
    const parser = createMarkdownParser({ mathRenderer: "katex" });
    const html = parser.render(
      "- 首段 {.loose-list-item}\n\n  第二段 {.nested-paragraph}",
    );

    expect(html).toContain("<p>首段 {.loose-list-item}</p>");
    expect(html).toContain('<p class="nested-paragraph">第二段</p>');
    expect(html).not.toContain('class="loose-list-item"');
  });

  it("为图片添加合法属性且不允许覆盖图片来源", () => {
    const parser = createMarkdownParser({ mathRenderer: "katex" });
    const html = parser.render(
      '![封面](cover.png "封面标题"){.hero-image #cover data-kind=hero src=evil.png alt=evil onclick="alert(1)"}',
    );

    expect(html).toContain("<figure>");
    expect(html).toContain('src="cover.png"');
    expect(html).toContain('alt="封面"');
    expect(html).toContain('class="hero-image"');
    expect(html).toContain('id="cover"');
    expect(html).toContain('data-kind="hero"');
    expect(html).not.toContain("evil.png");
    expect(html).not.toContain('onclick="');
    expect(html).not.toContain("{.hero-image");
  });

  it("为普通链接添加合法属性且不允许覆盖链接地址", () => {
    const parser = createMarkdownParser({ mathRenderer: "katex" });
    const html = parser.render(
      '[查看详情](https://example.com){.cta-link #details data-kind=external href="https://evil.example" onclick="alert(1)"}',
    );

    expect(html).toContain('href="https://example.com"');
    expect(html).toContain('class="cta-link"');
    expect(html).toContain('id="details"');
    expect(html).toContain('data-kind="external"');
    expect(html).not.toContain("evil.example");
    expect(html).not.toContain('onclick="');
    expect(html).not.toContain("{.cta-link");
  });

  it("链接被转换为脚注时保留无承载目标的属性文本", () => {
    const parser = createMarkdownParser({ mathRenderer: "katex" });
    const html = parser.render(
      '[资料来源](https://example.com "来源说明"){.source-link}',
    );

    expect(html).toContain("资料来源");
    expect(html).toContain("{.source-link}");
    expect(html).not.toContain('class="source-link"');
  });

  it("为现有行内格式元素添加局部属性", () => {
    const parser = createMarkdownParser({ mathRenderer: "katex" });
    const html = parser.render(
      "*斜体*{.emphasis} **粗体**{.strong} ~~删除~~{.deleted} `代码`{.inline-code} ==高亮=={.marked} ++下划线++{.underlined} H~2~{.subscript} X^2^{.superscript}",
    );

    expect(html).toContain('<em class="emphasis">斜体</em>');
    expect(html).toContain('<strong class="strong">粗体</strong>');
    expect(html).toContain('<s class="deleted">删除</s>');
    expect(html).toContain('<code class="inline-code">代码</code>');
    expect(html).toContain('<mark class="marked">高亮</mark>');
    expect(html).toContain('<u class="underlined">下划线</u>');
    expect(html).toContain('H<sub class="subscript">2</sub>');
    expect(html).toContain('X<sup class="superscript">2</sup>');
  });
});
