import { describe, expect, it } from "vitest";
import { createMarkdownParser } from "../MarkdownParser";
import {
  parseComponentProps,
  stringifyComponentProps,
} from "../plugins/component/parseProps";

describe("markdown-it-component props 解析", () => {
  it("空字符串返回空对象", () => {
    expect(parseComponentProps("")).toEqual({});
    expect(parseComponentProps("   ")).toEqual({});
  });

  it("解析双引号值", () => {
    expect(parseComponentProps('author="张三"')).toEqual({ author: "张三" });
  });

  it("解析单引号值", () => {
    expect(parseComponentProps("role='设计师'")).toEqual({ role: "设计师" });
  });

  it("解析裸值", () => {
    expect(parseComponentProps("variant=apple")).toEqual({ variant: "apple" });
  });

  it("布尔简写等价于 true", () => {
    expect(parseComponentProps("featured")).toEqual({ featured: true });
  });

  it("混合解析多种形式", () => {
    const props = parseComponentProps(
      "author=\"张三\" role='设计师' variant=apple featured",
    );
    expect(props).toEqual({
      author: "张三",
      role: "设计师",
      variant: "apple",
      featured: true,
    });
  });

  it("stringify 反向序列化", () => {
    const props = { author: "张三", variant: "apple", featured: true };
    const str = stringifyComponentProps(props);
    // 重新解析应得到相同结果
    expect(parseComponentProps(str)).toEqual(props);
  });

  it("值含空格时自动加引号", () => {
    const str = stringifyComponentProps({ title: "hello world" });
    expect(str).toBe('title="hello world"');
  });
});

describe("markdown-it-component 语法解析", () => {
  const parser = createMarkdownParser();

  it("解析最简组件（无 props）", () => {
    const md = "::: divider-fancy\n:::";
    const html = parser.render(md);
    expect(html).toContain('class="wemd-component wemd-divider-fancy"');
    expect(html).toContain('data-component="divider-fancy"');
  });

  it("解析带 props 的组件", () => {
    const md = '::: quote-card{author="张三" role="设计师"}\n内容\n:::';
    const html = parser.render(md);
    expect(html).toContain('class="wemd-component wemd-quote-card"');
    expect(html).toContain('data-component="quote-card"');
    expect(html).toContain("data-props=");
    expect(html).toContain("张三");
    expect(html).toContain("设计师");
    expect(html).toContain("内容");
  });

  it("body 中的 markdown 被正常渲染", () => {
    const md = '::: quote-card{author="x"}\n**加粗** _斜体_\n:::';
    const html = parser.render(md);
    expect(html).toContain("<strong>加粗</strong>");
    expect(html).toContain("<em>斜体</em>");
  });

  it("body 支持多段落", () => {
    const md = "::: cta-card\n第一段\n\n第二段\n:::";
    const html = parser.render(md);
    expect(html).toContain("第一段");
    expect(html).toContain("第二段");
    // 应该有两个 <p>
    expect(html.match(/<p>/g)?.length).toBeGreaterThanOrEqual(2);
  });

  it("body 支持列表", () => {
    const md = "::: timeline\n- 第一步\n- 第二步\n- 第三步\n:::";
    const html = parser.render(md);
    expect(html).toContain("<ul>");
    expect(html).toContain("第一步");
    expect(html).toContain("第三步");
  });

  it("未闭合的 ::: 不被解析为组件", () => {
    const md = "::: quote-card\n内容没有闭合";
    const html = parser.render(md);
    // 不应生成 component section
    expect(html).not.toContain("wemd-component");
  });

  it("空 body 的组件", () => {
    const md = "::: divider-fancy\n:::";
    const html = parser.render(md);
    expect(html).toContain("wemd-component");
    expect(html).toContain("wemd-component-body");
  });

  it("props 为空对象时仍正常输出", () => {
    const md = "::: divider-fancy\n:::";
    const html = parser.render(md);
    expect(html).toContain('data-props="{}"');
  });

  it("非法组件名（大写开头）不被解析", () => {
    const md = "::: QuoteCard\n内容\n:::";
    const html = parser.render(md);
    expect(html).not.toContain("wemd-component");
  });

  it("非法组件名（下划线）不被解析", () => {
    const md = "::: quote_card\n内容\n:::";
    const html = parser.render(md);
    expect(html).not.toContain("wemd-component");
  });

  it("组件与普通段落混合", () => {
    const md = [
      "前置段落",
      "",
      '::: quote-card{author="x"}',
      "组件内容",
      ":::",
      "",
      "后置段落",
    ].join("\n");
    const html = parser.render(md);
    expect(html).toContain("前置段落");
    expect(html).toContain("组件内容");
    expect(html).toContain("后置段落");
    expect(html).toContain("wemd-quote-card");
  });

  it("data-props 中的特殊字符被转义", () => {
    const md = '::: quote-card{author="a<b>c"}\n内容\n:::';
    const html = parser.render(md);
    // < > 应被转义为 &lt; &gt;
    expect(html).toContain("&lt;b&gt;");
  });
});

describe("markdown-it-component 新增组件渲染", () => {
  const parser = createMarkdownParser();

  it("code-frame 渲染嵌套代码块", () => {
    const md =
      '::: code-frame{lang="js" title="示例"}\n**示例代码** `js`\n```js\nconst x = 42;\n```\n:::';
    const html = parser.render(md);
    expect(html).toContain("wemd-code-frame");
    expect(html).toContain('data-component="code-frame"');
    expect(html).toContain("<strong>示例代码</strong>");
    expect(html).toContain("<pre"); // 内嵌代码块被保留
    // highlight.js 会把 const/42 包成 span，所以只检查关键字 span
    expect(html).toContain("hljs-keyword");
    expect(html).toContain("42");
  });

  it("callout-pro 解析 type prop（HTML 转义后）", () => {
    const md = '::: callout-pro{type="warning"}\n**注意**\n这里是警告内容\n:::';
    const html = parser.render(md);
    expect(html).toContain("wemd-callout-pro");
    expect(html).toContain('data-component="callout-pro"');
    // data-props 属性值中的 " 会被转义为 &quot;
    expect(html).toContain("&quot;type&quot;:&quot;warning&quot;");
    expect(html).toContain("<strong>注意</strong>");
  });

  it("stats-block 渲染列表数据", () => {
    const md =
      "::: stats-block\n本月数据\n- 用户数 **1,234**\n- 收入 **¥9,800**\n:::";
    const html = parser.render(md);
    expect(html).toContain("wemd-stats-block");
    expect(html).toContain('data-component="stats-block"');
    expect(html).toContain("<ul>");
    expect(html).toContain("<strong>1,234</strong>");
    expect(html).toContain("<strong>¥9,800</strong>");
  });

  it("image-grid 渲染图片列表", () => {
    const md =
      '::: image-grid{cols="2"}\n相册\n- ![](https://example.com/1.png)\n- ![](https://example.com/2.png)\n:::';
    const html = parser.render(md);
    expect(html).toContain("wemd-image-grid");
    expect(html).toContain('data-component="image-grid"');
    expect(html).toContain("<img");
    expect(html).toContain("example.com/1.png");
    expect(html).toContain("example.com/2.png");
  });

  it("author-card 渲染头像与简介", () => {
    const md =
      "::: author-card\n![](https://example.com/avatar.png)\n**张三** *设计师*\n专注设计与写作\n:::";
    const html = parser.render(md);
    expect(html).toContain("wemd-author-card");
    expect(html).toContain('data-component="author-card"');
    expect(html).toContain("<img");
    expect(html).toContain("avatar.png");
    expect(html).toContain("<strong>张三</strong>");
    expect(html).toContain("<em>设计师</em>");
    expect(html).toContain("专注设计与写作");
  });

  it("cta-card 多段落渲染按钮区", () => {
    // 用空行分隔才能成为独立段落
    const md =
      "::: cta-card\n如果觉得有用，欢迎关注\n\n点赞 + 在看\n\n点击关注\n:::";
    const html = parser.render(md);
    expect(html).toContain("wemd-cta-card");
    expect(html).toContain("点击关注");
    // 至少 3 个段落
    expect(html.match(/<p>/g)?.length).toBeGreaterThanOrEqual(3);
  });

  it("timeline 渲染时间线列表", () => {
    const md =
      "::: timeline\n发展历程\n- **2019 年** 项目立项\n- **2024 年** 行业标杆\n:::";
    const html = parser.render(md);
    expect(html).toContain("wemd-timeline");
    expect(html).toContain('data-component="timeline"');
    expect(html).toContain("<ul>");
    expect(html).toContain("<strong>2019 年</strong>");
    expect(html).toContain("<strong>2024 年</strong>");
    expect(html).toContain("项目立项");
    expect(html).toContain("行业标杆");
  });
});
