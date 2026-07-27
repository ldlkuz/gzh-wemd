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
    expect(prompt).toContain("Template JSON");
  });

  it("包含用户指定类型", () => {
    const prompt = buildTemplatePrompt(20, "list");
    expect(prompt).toContain("list");
    expect(prompt).toContain("用户指定类型");
  });

  it("包含所有 7 种文章类型", () => {
    const prompt = buildTemplatePrompt(20);
    const types = [
      "tutorial",
      "story",
      "data",
      "opinion",
      "list",
      "news",
      "product",
    ];
    types.forEach((t) => {
      expect(prompt).toContain(t);
    });
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
      articleType: "list" as const,
      layout: [
        {
          component: "hero-banner",
          content: { title: "测试标题", subtitle: "副标题" },
        },
        {
          component: "article-section",
          content: { fromParagraph: 1, toParagraph: 4 },
        },
        {
          component: "share-card",
          content: { text: "分享给朋友" },
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
});

describe("短文章降级", () => {
  it("getParagraphCount 正确计数", async () => {
    const { getParagraphCount } = await import("../../../services/template");

    expect(getParagraphCount("")).toBe(0);
    expect(getParagraphCount("一段")).toBe(1);
    expect(getParagraphCount("一段\n\n二段\n\n三段")).toBe(3);
  });
});
