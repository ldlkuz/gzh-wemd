/**
 * 临时验证：7 个新增组件的 renderer 输出正确的 ::: 语法
 */
import { describe, it, expect } from "vitest";
import {
  componentRenderers,
  wrapComponent,
} from "../../../services/template/componentRenderers";

function render(name: string, content: unknown): string {
  const renderer = componentRenderers[name];
  expect(renderer).toBeDefined();
  const body = renderer(content);
  return wrapComponent(name, "", body || " ");
}

describe("新增 7 个组件 renderer", () => {
  it("image-compare 渲染两张图 + caption", () => {
    const md = render("image-compare", {
      before: "https://x.com/a.jpg",
      after: "https://x.com/b.jpg",
      caption: "对比",
    });
    expect(md).toContain("::: image-compare");
    expect(md).toContain("a.jpg");
    expect(md).toContain("b.jpg");
    expect(md).toContain("对比");
  });

  it("table 渲染 markdown 表格", () => {
    const md = render("table", {
      title: "配置",
      headers: ["版本", "价格"],
      rows: [{ cells: ["基础", "99"] }, { cells: ["旗舰", "199"] }],
    });
    expect(md).toContain("::: table");
    expect(md).toContain("| 版本 | 价格 |");
    expect(md).toContain("| 基础 | 99 |");
  });

  it("accordion 渲染多组问答", () => {
    const md = render("accordion", {
      items: [
        { title: "Q1", body: "A1" },
        { title: "Q2", body: "A2" },
      ],
    });
    expect(md).toContain("::: accordion");
    expect(md).toContain("Q1");
    expect(md).toContain("A1");
    expect(md).toContain("Q2");
  });

  it("steps 渲染步骤列表", () => {
    const md = render("steps", {
      title: "步骤",
      items: [{ title: "第一步", description: "说明" }, { title: "第二步" }],
    });
    expect(md).toContain("::: steps");
    expect(md).toContain("第一步");
    expect(md).toContain("第二步");
  });

  it("code-block 渲染代码块", () => {
    const md = render("code-block", {
      code: "console.log('hi')",
      lang: "javascript",
    });
    expect(md).toContain("::: code-block");
    expect(md).toContain("```javascript");
    expect(md).toContain("console.log('hi')");
  });

  it("pullquote 渲染引用块", () => {
    const md = render("pullquote", {
      text: "好产品会消失",
      source: "乔布斯",
    });
    expect(md).toContain("::: pullquote");
    expect(md).toContain("好产品会消失");
    expect(md).toContain("乔布斯");
  });

  it("divider 渲染分隔线", () => {
    const md = render("divider", { text: "第一部分完" });
    expect(md).toContain("::: divider");
    expect(md).toContain("第一部分完");
  });

  it("全部 43 组件在 componentRenderers 中都有 renderer", () => {
    const all = [
      "hero-banner",
      "toc-nav",
      "numbered-heading",
      "section-title",
      "quote-card",
      "callout-pro",
      "stats-block",
      "faq",
      "share-card",
      "cta-card",
      "tag-label",
      "follow-bar",
      "divider-fancy",
      "magazine-cover",
      "section-divider",
      "image-card",
      "text-card",
      "full-quote",
      "two-column-cards",
      "end-card",
      "product-card",
      "brand-sign",
      "resource-list",
      "testimonial-card",
      "series-nav",
      "author-card",
      "related-posts",
      "copyright-notice",
      "qr-card",
      "image-text-row",
      "image-caption",
      "image-grid",
      "timeline",
      "styled-table",
      "code-frame",
      "image-compare",
      "table",
      "accordion",
      "steps",
      "code-block",
      "pullquote",
      "divider",
    ];
    // article-section 有独立 renderArticleSection，不走通用注册表
    const handledSeperately = ["article-section"];
    for (const name of all) {
      expect(componentRenderers[name], `${name} 缺 renderer`).toBeDefined();
    }
    for (const name of handledSeperately) {
      expect(
        componentRenderers[name],
        `${name} 应由独立逻辑处理`,
      ).toBeUndefined();
    }
  });
});
