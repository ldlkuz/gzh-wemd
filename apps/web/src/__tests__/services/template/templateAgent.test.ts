/**
 * Template Agent 测试
 * 测试：prompt 构建、JSON 解析、sanitize 清洗、短文章降级
 */
import { describe, it, expect } from "vitest";
import { buildTemplatePrompt } from "../../../services/template/templatePrompt";
import {
  COMPONENT_CONTENT_SCHEMAS,
  AI_GENERATABLE_COMPONENTS,
  getComponentSchema,
} from "../../../services/template/componentSchemas";

describe("Template Prompt", () => {
  it("buildTemplatePrompt 生成有效 prompt", () => {
    const prompt = buildTemplatePrompt(20);
    expect(prompt.length).toBeGreaterThan(1000);
    expect(prompt).toContain("20");
    expect(prompt).toContain("hero-banner");
    expect(prompt).toContain("article-section");
  });

  it("包含 design 字段说明", () => {
    const prompt = buildTemplatePrompt(20);
    expect(prompt).toContain("design");
    expect(prompt).toContain("emphasis");
    expect(prompt).toContain("purpose");
    expect(prompt).toContain("reason");
  });

  it("包含内容信号识别", () => {
    const prompt = buildTemplatePrompt(20);
    expect(prompt).toContain("内容信号");
    expect(prompt).toContain("数据信号");
    expect(prompt).toContain("情绪信号");
  });

  it("包含 role 字段说明", () => {
    const prompt = buildTemplatePrompt(20);
    expect(prompt).toContain("role");
    expect(prompt).toContain("opening");
    expect(prompt).toContain("summary");
  });
});

describe("Component Schemas", () => {
  it("COMPONENT_CONTENT_SCHEMAS 有足够组件", () => {
    expect(COMPONENT_CONTENT_SCHEMAS.length).toBeGreaterThanOrEqual(15);
  });

  it("每个 schema 都有 component 和 example", () => {
    for (const schema of COMPONENT_CONTENT_SCHEMAS) {
      expect(schema.component).toBeTruthy();
      expect(schema.example).toBeDefined();
      expect(schema.description).toBeTruthy();
    }
  });

  it("getComponentSchema 能查到 hero-banner", () => {
    const schema = getComponentSchema("hero-banner");
    expect(schema).toBeDefined();
    expect(schema?.component).toBe("hero-banner");
    expect(schema?.example.title).toBeDefined();
  });

  it("getComponentSchema 查不到返回 undefined", () => {
    expect(getComponentSchema("fake-component")).toBeUndefined();
  });

  it("AI_GENERATABLE_COMPONENTS 包含 article-section", () => {
    expect(AI_GENERATABLE_COMPONENTS).toContain("article-section");
    expect(AI_GENERATABLE_COMPONENTS).toContain("hero-banner");
    expect(AI_GENERATABLE_COMPONENTS).toContain("share-card");
  });
});

describe("Template JSON 解析", () => {
  it("能解析标准 JSON 响应", async () => {
    // 使用动态 import 来获取模块内部函数（如果导出的话）
    // 这里主要测试公共 API
    const { renderTemplate, validateTemplate } = await import(
      "../../../services/template"
    );

    const sampleArticle = `# 测试文章

第一段内容。

第二段内容。

第三段内容。`;

    const template = {
      version: "2.0",
      layout: [
        {
          component: "hero-banner",
          content: { title: "测试标题", subtitle: "副标题" },
          design: {
            purpose: "headline",
            emphasis: "high",
            layout: "center",
            tone: "professional",
            spacing: "large",
          },
          reason: "测试标题",
        },
        {
          component: "article-section",
          content: { fromParagraph: 1, toParagraph: 4 },
          design: {
            emphasis: "medium",
            layout: "left",
            tone: "minimal",
            spacing: "normal",
          },
          reason: "正文段落",
        },
        {
          component: "share-card",
          content: { text: "分享给朋友" },
          design: {
            purpose: "decoration",
            emphasis: "low",
            layout: "center",
            tone: "warm",
            spacing: "normal",
          },
          reason: "文末分享引导",
        },
      ],
    };

    const errors = validateTemplate(template);
    expect(errors).toHaveLength(0);

    const result = renderTemplate(template, sampleArticle);
    expect(result.markdown).toContain("hero-banner");
    expect(result.markdown).toContain("share-card");
    expect(result.coverage).toBeGreaterThan(0.5);
  });

  it("validateTemplate 检测未知组件", async () => {
    const { validateTemplate } = await import("../../../services/template");

    const errors = validateTemplate({
      layout: [{ component: "fake-component", content: {} }],
    });
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.includes("不支持"))).toBe(true);
  });

  it("旧模板（v1.x 含 magazineLevel）能被渲染", async () => {
    const { renderTemplate } = await import("../../../services/template");

    const sampleArticle = "第一段。\n\n第二段。\n\n第三段。";
    const oldTemplate = {
      articleType: "data",
      magazineLevel: "high" as const,
      magazineReason: "数据密集型文章",
      layout: [
        { component: "hero-banner", content: { title: "旧模板测试" } },
        {
          component: "article-section",
          content: { fromParagraph: 1, toParagraph: 3 },
        },
      ],
    };

    const result = renderTemplate(oldTemplate, sampleArticle);
    expect(result.markdown).toContain("hero-banner");
    expect(result.coverage).toBeGreaterThan(0.5);
  });
});

describe("短文章降级", () => {
  it("getParagraphCount 正确计数", async () => {
    const { getParagraphCount } = await import("../../../services/template");

    expect(getParagraphCount("")).toBe(0);
    expect(getParagraphCount("一段")).toBe(1);
    expect(getParagraphCount("一段\n\n二段\n\n三段")).toBe(3);
  });
});
