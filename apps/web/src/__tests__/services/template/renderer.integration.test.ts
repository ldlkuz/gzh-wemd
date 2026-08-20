/**
 * Template JSON Renderer 集成测试
 * 验证 Renderer 输出的 Markdown 能被 MarkdownParser 正确解析为组件 HTML
 */
import { describe, it, expect } from "vitest";
import { createMarkdownParser } from "@wemd/core";
import { renderTemplate } from "../../../services/template";
import type { TemplateJSON } from "../../../services/template/types";

const sampleArticle = `# 七月好物推荐

七月如期而至，蝉鸣、晚风、西瓜与落日。

愿这个七月，烦恼清零，快乐满仓。

## 好物清单

### 冰丝凉席

这款凉席采用高密冰丝面料，触感清凉，一觉睡到天亮。

### 便携风扇

迷你手持风扇，三档风速，USB 充电。放在包里不占地方。

### 防晒喷雾

SPF50+ PA++++，清爽不油腻，喷上很快成膜。`;

const template: TemplateJSON = {
  name: "测试模板",
  layout: [
    {
      component: "hero-banner",
      content: { title: "七月好物", subtitle: "清凉一夏的 3 件小物" },
    },
    {
      component: "toc-nav",
      content: {
        title: "目录",
        items: ["冰丝凉席", "便携风扇", "防晒喷雾"],
      },
    },
    {
      component: "numbered-heading",
      props: { index: "01" },
      content: { title: "冰丝凉席" },
    },
    {
      component: "article-section",
      content: { fromParagraph: 5, toParagraph: 6 },
    },
    {
      component: "quote-card",
      props: { author: "用户评价" },
      content: { text: "睡了一晚，凉得不想起床。" },
    },
    {
      component: "numbered-heading",
      props: { index: "02" },
      content: { title: "便携风扇" },
    },
    {
      component: "article-section",
      content: { fromParagraph: 7, toParagraph: 8 },
    },
    {
      component: "callout-pro",
      props: { type: "tip" },
      content: { title: "小贴士", body: "出门前 15 分钟喷防晒效果更好" },
    },
    {
      component: "numbered-heading",
      props: { index: "03" },
      content: { title: "防晒喷雾" },
    },
    {
      component: "article-section",
      content: { fromParagraph: 9, toParagraph: 10 },
    },
    {
      component: "stats-block",
      content: {
        title: "本月数据",
        items: [
          { label: "推荐好物", value: "3 件" },
          { label: "满意度", value: "92%" },
        ],
      },
    },
    {
      component: "share-card",
      content: { text: "这个清单对你有帮助？" },
    },
  ],
};

describe("Template Renderer 集成测试", () => {
  it("Renderer 输出的 Markdown 能被正确解析为组件 HTML", () => {
    const result = renderTemplate(template, sampleArticle);
    // 模板 article-section 只覆盖第5-10段，第1-4段由兜底逻辑自动补全
    expect(result.warnings.some((w) => w.includes("兜底"))).toBe(true);
    // 兜底后全文应 100% 覆盖
    expect(result.coverage).toBe(1);

    const parser = createMarkdownParser({
      mathRenderer: "katex",
      showMacBar: false,
    });
    const html = parser.render(result.markdown);

    expect(html).toContain("wemd-hero-banner");
    // 基础层组件（toc-nav/stats-block）不再产 :::，渲染为原生 HTML
    expect(html).toContain("<ul>");
    expect(html).toContain("wemd-numbered-heading");
    expect(html).toContain("wemd-quote-card");
    expect(html).toContain("wemd-callout-pro");
    expect(html).toContain("wemd-share-card");

    expect(html).toContain("七月好物");
    expect(html).toContain("冰丝凉席");
    expect(html).toContain("睡了一晚");
    expect(html).toContain("出门前 15 分钟");
    expect(html).toContain("92%");
    // 兜底补回的未覆盖段落（第1-4段）也应在 HTML 中出现
    expect(html).toContain("七月如期而至");
    expect(html).toContain("烦恼清零");
    expect(html).toContain("好物清单");
  });

  it("渲染结果包含正确的 data-component 属性", () => {
    const result = renderTemplate(template, sampleArticle);
    const parser = createMarkdownParser({
      mathRenderer: "katex",
      showMacBar: false,
    });
    const html = parser.render(result.markdown);

    expect(html).toContain('data-component="hero-banner"');
    expect(html).toContain('data-component="quote-card"');
    // 基础层组件输出原生 HTML，不再带 data-component
    expect(html).not.toContain('data-component="toc-nav"');
    expect(html).not.toContain('data-component="stats-block"');
  });

  it("props 被正确序列化为 data-props", () => {
    const result = renderTemplate(template, sampleArticle);
    const parser = createMarkdownParser({
      mathRenderer: "katex",
      showMacBar: false,
    });
    const html = parser.render(result.markdown);

    expect(html).toContain("author");
    expect(html).toContain("用户评价");
  });

  it("空模板 + 空文章不崩溃", () => {
    const result = renderTemplate({ layout: [] }, "");
    expect(result.markdown).toBe("");
    expect(result.coverage).toBe(1);
  });
});
