/**
 * Template Renderer 单元测试
 */
import { describe, it, expect } from "vitest";
import { renderTemplate, validateTemplate } from "../../../services/template";
import type { TemplateJSON } from "../../../services/template/types";

const sampleArticle = `# 测试文章

这是第一段正文内容，介绍文章背景。

这是第二段，包含一些**关键信息。

这是第三段，有一个列表：
- 项目一
- 项目二
- 项目三

这是第四段，总结部分。`;

const makeTemplate = (over: Partial<TemplateJSON> = {}): TemplateJSON => ({
  layout: [
    {
      component: "article-section",
      content: { fromParagraph: 1, toParagraph: 5 },
    },
  ],
  ...over,
});

describe("contentExtractor", () => {
  it("正确拆分段落", async () => {
    const { splitParagraphs } = await import(
      "../../../services/template/contentExtractor"
    );
    const result = splitParagraphs("第一段\n\n第二段\n\n第三段");
    expect(result).toHaveLength(3);
    expect(result[0]).toBe("第一段");
    expect(result[1]).toBe("第二段");
    expect(result[2]).toBe("第三段");
  });

  it("空字符串返回空数组", async () => {
    const { splitParagraphs } = await import(
      "../../../services/template/contentExtractor"
    );
    expect(splitParagraphs("")).toEqual([]);
    expect(splitParagraphs("   ")).toEqual([]);
  });

  it("提取段落范围", async () => {
    const { extractParagraphs } = await import(
      "../../../services/template/contentExtractor"
    );
    const md = "一\n\n二\n\n三\n\n四\n\n五";
    const result = extractParagraphs(md, 2, 4);
    expect(result.text).toBe("二\n\n三\n\n四");
    expect(result.actualFrom).toBe(2);
    expect(result.actualTo).toBe(4);
  });

  it("越界自动裁剪", async () => {
    const { extractParagraphs } = await import(
      "../../../services/template/contentExtractor"
    );
    const md = "一\n\n二\n\n三";
    const result = extractParagraphs(md, 0, 10);
    expect(result.actualFrom).toBe(1);
    expect(result.actualTo).toBe(3);
  });
});

describe("componentRenderers", () => {
  it("stringifyProps 正确序列化", async () => {
    const { stringifyProps } = await import(
      "../../../services/template/componentRenderers"
    );
    expect(stringifyProps({ author: "张三", type: "info" })).toBe(
      'author="张三" type="info"',
    );
    expect(stringifyProps({ index: 1 })).toBe("index=1");
    expect(stringifyProps({ active: true })).toBe("active=true");
    expect(stringifyProps({})).toBe("");
    expect(stringifyProps(undefined)).toBe("");
  });

  it("wrapComponent 正确包裹", async () => {
    const { wrapComponent } = await import(
      "../../../services/template/componentRenderers"
    );
    expect(wrapComponent("quote-card", 'author="张三"', "金句内容")).toBe(
      '::: quote-card{author="张三"}\n金句内容\n:::',
    );
    expect(wrapComponent("divider-fancy", "", "")).toBe(
      "::: divider-fancy\n\n:::",
    );
  });

  it("renderHeroBanner 正确渲染", async () => {
    const { renderHeroBanner } = await import(
      "../../../services/template/componentRenderers"
    );
    const result = renderHeroBanner({
      title: "七月好物推荐",
      subtitle: "清凉一夏的 8 件小物",
      tag: "JULY PICKS",
    });
    expect(result).toContain("**七月好物推荐**");
    expect(result).toContain("清凉一夏的 8 件小物");
    expect(result).toContain("*JULY PICKS*");
  });

  it("renderTocNav 正确渲染", async () => {
    const { renderTocNav } = await import(
      "../../../services/template/componentRenderers"
    );
    const result = renderTocNav({
      title: "目录",
      items: ["第一章", "第二章", "第三章"],
    });
    expect(result).toContain("目录");
    expect(result).toContain("- 第一章");
    expect(result).toContain("- 第二章");
  });

  it("renderQuoteCard 正确渲染", async () => {
    const { renderQuoteCard } = await import(
      "../../../services/template/componentRenderers"
    );
    expect(renderQuoteCard({ text: "这是金句" })).toBe("这是金句");
  });

  it("renderStatsBlock 正确渲染", async () => {
    const { renderStatsBlock } = await import(
      "../../../services/template/componentRenderers"
    );
    const result = renderStatsBlock({
      title: "核心指标",
      items: [
        { label: "用户数", value: "1,234" },
        { label: "收入", value: "¥9,800" },
      ],
    });
    expect(result).toContain("核心指标");
    expect(result).toContain("- 用户数 **1,234**");
  });

  it("renderFaq 正确渲染", async () => {
    const { renderFaq } = await import(
      "../../../services/template/componentRenderers"
    );
    const result = renderFaq({
      title: "常见问题",
      items: [
        { q: "怎么用？", a: "很简单" },
        { q: "要钱吗？", a: "免费" },
      ],
    });
    expect(result).toContain("**常见问题**");
    expect(result).toContain("**怎么用？**");
    expect(result).toContain("很简单");
    expect(result).toContain("**要钱吗？**");
    expect(result).toContain("免费");
  });
});

describe("renderTemplate", () => {
  it("纯 article-section 正确提取原文", () => {
    const template = makeTemplate();
    const result = renderTemplate(template, sampleArticle);
    expect(result.markdown).toContain("测试文章");
    expect(result.markdown).toContain("第一段正文");
    expect(result.markdown).toContain("第四段");
    expect(result.coverage).toBe(1);
    expect(result.warnings).toHaveLength(0);
  });

  it("hero-banner + article-section 组合", () => {
    const template = makeTemplate({
      layout: [
        {
          component: "hero-banner",
          content: { title: "测试标题", subtitle: "测试副标题" },
        },
        {
          component: "article-section",
          content: { fromParagraph: 1, toParagraph: 5 },
        },
      ],
    });
    const result = renderTemplate(template, sampleArticle);
    expect(result.markdown).toContain("::: hero-banner");
    expect(result.markdown).toContain("**测试标题**");
    expect(result.markdown).toContain("测试副标题");
    expect(result.markdown).toContain("测试文章");
    expect(result.coverage).toBe(1);
  });

  it("完整排版：hero + toc + 序号标题 + 正文 + 金句 + 分享", () => {
    const template: TemplateJSON = {
      name: "测试模板",
      layout: [
        {
          component: "hero-banner",
          content: { title: "七月好物", subtitle: "清凉一夏" },
        },
        {
          component: "toc-nav",
          content: { title: "目录", items: ["冰丝凉席", "便携风扇"] },
        },
        {
          component: "numbered-heading",
          props: { index: "01" },
          content: { title: "冰丝凉席" },
        },
        {
          component: "article-section",
          content: { fromParagraph: 1, toParagraph: 2 },
        },
        {
          component: "quote-card",
          props: { author: "用户评价" },
          content: { text: "睡了一晚，凉得不想起床。" },
        },
        {
          component: "article-section",
          content: { fromParagraph: 3, toParagraph: 5 },
        },
        {
          component: "share-card",
          content: { text: "这个清单对你有帮助？" },
        },
      ],
    };
    const result = renderTemplate(template, sampleArticle);
    expect(result.markdown).toContain("::: hero-banner");
    // 基础层组件（toc-nav 等）不再产 :::，输出原生 Markdown 列表
    expect(result.markdown).not.toContain("::: toc-nav");
    expect(result.markdown).toMatch(/^- 冰丝凉席$/m);
    expect(result.markdown).toContain('::: numbered-heading{index="01"}');
    expect(result.markdown).toContain('::: quote-card{author="用户评价"}');
    expect(result.markdown).toContain("::: share-card");
    expect(result.markdown).toContain("冰丝凉席");
    expect(result.markdown).toContain("睡了一晚");
    expect(result.coverage).toBe(1);
  });

  it("未知组件会警告并跳过", () => {
    const template = makeTemplate({
      layout: [
        { component: "unknown-component", content: {} },
        {
          component: "article-section",
          content: { fromParagraph: 1, toParagraph: 5 },
        },
      ],
    });
    const result = renderTemplate(template, sampleArticle);
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings[0]).toContain("unknown-component");
    expect(result.markdown).toContain("测试文章");
  });

  it("段落越界会警告并修正", () => {
    const template = makeTemplate({
      layout: [
        {
          component: "article-section",
          content: { fromParagraph: 0, toParagraph: 999 },
        },
      ],
    });
    const result = renderTemplate(template, sampleArticle);
    expect(result.warnings.length).toBeGreaterThanOrEqual(1);
    expect(result.coverage).toBe(1);
  });

  it("空 layout 返回空 markdown 和警告", () => {
    const result = renderTemplate({ layout: [] }, "");
    expect(result.markdown).toBe("");
    expect(result.coverage).toBe(1);
  });

  it("未覆盖段落自动兜底为 article-section", () => {
    // 只覆盖第 2 段，其余 1/3/4/5 段应被自动兜底
    const template = makeTemplate({
      layout: [
        {
          component: "article-section",
          content: { fromParagraph: 2, toParagraph: 2 },
        },
      ],
    });
    const result = renderTemplate(template, sampleArticle);
    expect(result.coverage).toBe(1);
    // 兜底后所有段落内容都应保留
    expect(result.markdown).toContain("第一段正文");
    expect(result.markdown).toContain("第二段");
    expect(result.markdown).toContain("第三段");
    expect(result.markdown).toContain("第四段");
    expect(result.warnings.some((w) => w.includes("兜底"))).toBe(true);
  });

  it("多段间隙分别兜底", () => {
    // 覆盖 1 和 5 段，中间 2/3/4 段应合并为一段兜底
    const template = makeTemplate({
      layout: [
        {
          component: "article-section",
          content: { fromParagraph: 1, toParagraph: 1 },
        },
        {
          component: "article-section",
          content: { fromParagraph: 5, toParagraph: 5 },
        },
      ],
    });
    const result = renderTemplate(template, sampleArticle);
    expect(result.coverage).toBe(1);
    expect(result.markdown).toContain("第一段正文");
    expect(result.markdown).toContain("第二段");
    expect(result.markdown).toContain("第三段");
    expect(result.markdown).toContain("第四段");
    expect(result.warnings.some((w) => w.includes("兜底"))).toBe(true);
  });

  it("全文已覆盖时不产生额外兜底", () => {
    const template = makeTemplate({
      layout: [
        {
          component: "article-section",
          content: { fromParagraph: 1, toParagraph: 5 },
        },
      ],
    });
    const result = renderTemplate(template, sampleArticle);
    expect(result.coverage).toBe(1);
    expect(result.warnings.some((w) => w.includes("兜底"))).toBe(false);
  });

  it("基础层不再产 :::：AI 未输出标题组件时，标题段保留原生 Markdown 语法", () => {
    // 模拟 AI 只编排正文 article-section，不输出任何标题组件（标题交给基础层）
    // article-section 范围 1-5 覆盖全文，其中第 1 段是 `#` 标题、第 3 段含 `##` 标题
    const article = `# 一级标题

这是第一段正文内容。

## 二级标题

这是第二段正文。

这是第三段正文。`;
    const template = {
      version: "2.0",
      layout: [
        {
          component: "article-section",
          content: { fromParagraph: 1, toParagraph: 5 },
        },
      ],
    };

    const result = renderTemplate(template, article);

    // 基础层不产 ::: 私有语法（方案 A：基础层对齐 md 语法，标题用原生 # 表达）
    expect(result.markdown.match(/::: section-title/g)).toBeNull();

    // 未被消费的标题段保持原生 Markdown 标题语法，交由解析器渲染 h1/h3
    expect(result.markdown).toContain("# 一级标题");
    expect(result.markdown).toContain("## 二级标题");

    // 正文段必须完整保留
    expect(result.markdown).toContain("这是第一段正文内容");
    expect(result.markdown).toContain("这是第二段正文");
    expect(result.markdown).toContain("这是第三段正文");

    // 覆盖率应为 100%
    expect(result.coverage).toBe(1);
  });

  it("基础层去重：已被 AI 标题组件消费的标题段不再重复转换", () => {
    const article = `## 已被消费的标题

正文段落。`;

    const template: TemplateJSON = {
      version: "2.0",
      layout: [
        // AI 显式输出 section-title 消费了标题段，"已被消费的标题"
        {
          component: "section-title",
          content: { title: "已被消费的标题" },
          design: {
            purpose: "transition",
            emphasis: "medium",
            layout: "left",
            tone: "professional",
            spacing: "normal",
            headlineSize: "xl",
          },
          reason: "章节标题",
        },
        {
          component: "article-section",
          content: { fromParagraph: 1, toParagraph: 2 },
        },
      ],
    };

    const result = renderTemplate(template, article);

    // section-title 组件应只出现一次（AI 显式那个），基础层不再重复转换
    expect(result.markdown.match(/::: section-title/g)).toHaveLength(1);
    // 原 `## ` 标题不得以原生形式出现
    expect(result.markdown).not.toContain("## 已被消费的标题");
    // 正文完整
    expect(result.markdown).toContain("正文段落");
    expect(result.coverage).toBe(1);
  });
});

describe("validateTemplate", () => {
  it("合法模板无错误", () => {
    const errors = validateTemplate(makeTemplate());
    expect(errors).toHaveLength(0);
  });

  it("空 layout 有错误", () => {
    const errors = validateTemplate({ layout: [] });
    expect(errors.length).toBeGreaterThan(0);
  });

  it("缺少 component 字段报错", () => {
    const errors = validateTemplate({
      layout: [{ component: "", content: {} } as any],
    });
    expect(errors.some((e) => e.includes("component"))).toBe(true);
  });

  it("未知组件报错", () => {
    const errors = validateTemplate({
      layout: [{ component: "fake-component", content: {} }],
    });
    expect(errors.some((e) => e.includes("不支持"))).toBe(true);
  });
});
