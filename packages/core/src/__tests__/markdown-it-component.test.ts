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

  it("开启 includeSourcePosition 时组件 section 带滚动锚点属性", () => {
    const parserSp = createMarkdownParser({ includeSourcePosition: true });
    const md = '前置段落\n\n::: quote-card{author="x"}\n内容\n:::\n\n后置段落';
    const html = parserSp.render(md);
    // 组件外层 section 必须有 source 锚点，供预览端 collectAnchors 建立滚动同步
    expect(html).toContain(
      'class="wemd-component wemd-quote-card" data-component="quote-card"',
    );
    expect(html).toMatch(
      /<section[^>]*data-component="quote-card"[^>]*data-wemd-source-start="\d+"/,
    );
    expect(html).toMatch(
      /<section[^>]*data-component="quote-card"[^>]*data-wemd-source-end="\d+"/,
    );
  });

  it("body 支持多段落（按 slot 分离）", () => {
    const md = "::: cta-card\n第一段\n\n第二段\n:::";
    const html = parser.render(md);
    // cta-card 按 title/body 槽分离渲染（不再整块进 .wemd-component-body）
    expect(html).toContain("wemd-cta-title");
    expect(html).toContain("wemd-cta-body");
    expect(html).toContain("第一段");
    expect(html).toContain("第二段");
  });

  it("body 支持列表（渲染为 list 槽）", () => {
    const md = "::: timeline\n- 第一步\n- 第二步\n- 第三步\n:::";
    const html = parser.render(md);
    // timeline 按 title/items 槽渲染为事件列表
    expect(html).toContain("wemd-tl-events");
    expect(html).toContain("wemd-tl-item");
    expect(html).toContain("第一步");
    expect(html).toContain("第二步");
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
    // 渲染为 Slot class 结构（不再有 wemd-component-body）
    expect(html).toContain("wemd-df-label");
  });

  it("tag-label：支持把 #标签 写在同一行（行内标签语法）", () => {
    const md = "::: tag-label #设计系统 #公众号排版 #组件化 #WeMD\n:::";
    const html = parser.render(md);
    expect(html).toContain('data-component="tag-label"');
    // 每个标签拆成独立 <p>，供 CSS 渲染为独立胶囊
    expect(html).toContain("<p>#设计系统</p>");
    expect(html).toContain("<p>#公众号排版</p>");
    expect(html).toContain("<p>#组件化</p>");
    expect(html).toContain("<p>#WeMD</p>");
  });

  it("tag-label：内容在下一行（多行写法）同样渲染", () => {
    const md = "::: tag-label\n#设计系统\n#公众号排版\n:::";
    const html = parser.render(md);
    expect(html).toContain('data-component="tag-label"');
    expect(html).toContain("<p>#设计系统</p>");
    expect(html).toContain("<p>#公众号排版</p>");
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

  it("组件嵌套：text-card 内嵌套 full-quote", () => {
    const md = [
      "::: text-card",
      "引言段落",
      "",
      "::: full-quote",
      "金句内容",
      ":::",
      "",
      "后续正文段落",
      ":::",
    ].join("\n");
    const html = parser.render(md);
    // text-card 外层容器存在
    expect(html).toContain('data-component="text-card"');
    // full-quote 内层容器存在（嵌套）
    expect(html).toContain('data-component="full-quote"');
    // 内容均渲染
    expect(html).toContain("引言段落");
    expect(html).toContain("金句内容");
    expect(html).toContain("后续正文段落");
    // full-quote 在 text-card 内部
    const textCardIdx = html.indexOf('data-component="text-card"');
    const fullQuoteIdx = html.indexOf('data-component="full-quote"');
    expect(fullQuoteIdx).toBeGreaterThan(textCardIdx);
  });

  it("组件嵌套：未闭合外层的嵌套组件仍可解析内层", () => {
    // 外层 text-card 未闭合时，text-card 不解析，
    // 但内层 full-quote 是合法闭合的，应正常解析
    const md = "::: text-card\n::: full-quote\n未闭合\n:::";
    const html = parser.render(md);
    // text-card 不应解析（外层未闭合时 depth 不等于 0）
    expect(html).not.toContain('data-component="text-card"');
    // full-quote 应正常解析（内层合法闭合）
    expect(html).toContain('data-component="full-quote"');
    expect(html).toContain("未闭合");
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
    expect(html).toContain("wemd-sb-items");
    expect(html).toContain("用户数 1,234");
    expect(html).toContain("收入 ¥9,800");
  });

  it("stats-block：首段标题 + 标签在前/数值加粗在后（顺序无关映射 value/label）", () => {
    const md = [
      "::: stats-block",
      "核心数据",
      "",
      "- 组件总数",
      "  **44**",
      "- 原型分组",
      "  **7**",
      ":::",
    ].join("\n");
    const html = parser.render(md);
    // 首段纯文字作为标题，不再丢失
    expect(html).toContain('class="wemd-sb-title">核心数据</div>');
    // 加粗数字 → value（大字），非加粗文字 → label（小字）
    expect(html).toMatch(/wemd-sb-items-value[^>]*>44<\/div>/);
    expect(html).toMatch(/wemd-sb-items-label[^>]*>组件总数<\/div>/);
    expect(html).toMatch(/wemd-sb-items-value[^>]*>7<\/div>/);
    expect(html).toMatch(/wemd-sb-items-label[^>]*>原型分组<\/div>/);
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
    // 列表前缀 `- ` 应被清理，不残留在 <img> 前
    expect(html).not.toContain(">- <img");
    expect(html).not.toContain(">- ");
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
    // 内容按 title/body 槽分离渲染（不再输出 <p> 段落）
    expect(html).toContain("wemd-cta-title");
    expect(html).toContain("wemd-cta-body");
    expect(html).toContain("如果觉得有用");
  });

  it("timeline 渲染时间线列表", () => {
    const md =
      "::: timeline\n发展历程\n- **2019 年** 项目立项\n- **2024 年** 行业标杆\n:::";
    const html = parser.render(md);
    expect(html).toContain("wemd-timeline");
    expect(html).toContain('data-component="timeline"');
    expect(html).toContain("wemd-tl-events");
    expect(html).toContain("2019 年 项目立项");
    expect(html).toContain("2024 年 行业标杆");
    expect(html).toContain("项目立项");
    expect(html).toContain("行业标杆");
  });
});
