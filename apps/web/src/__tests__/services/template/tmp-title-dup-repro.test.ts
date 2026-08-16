/**
 * 临时复现：AI 排版标题重复 bug
 * AI 把 `##` 标题转成 section-title 组件后，未再引用该标题段，
 * renderer 兜底逻辑把原 `##` 标题段补回正文 → 标题重复。
 */
import { describe, it, expect } from "vitest";
import { renderTemplate } from "../../../services/template/renderer";

const article = `## 一、发生了什么？一份"穿透力极强"的备查资料清单

近日，广东某地税务分局向企业发出通知，要求对研发费用加计扣除申报中存在的疑点进行核查，并限期提交留存备查资料。这不是演习，2026年金税四期全面运行后，研发费用加计扣除的核查已经从"形式审查"转向"实质审查"。你的企业，准备好了吗？`;

// 模拟 AI 生成的 Template JSON：
// - 标题段（第1段）被转成 section-title 组件，不再用 article-section 引用
// - 正文段（第2段）用 article-section 引用
const template = {
  version: "2.0",
  layout: [
    {
      component: "section-title",
      content: {
        title: '一、发生了什么？一份"穿透力极强"的备查资料清单',
      },
      design: {
        purpose: "transition",
        emphasis: "medium",
        layout: "left",
        tone: "professional",
        spacing: "normal",
        headlineSize: "xl",
      },
      reason: "章节标题，用 section-title 组件做视觉层级标识",
    },
    {
      component: "article-section",
      content: { fromParagraph: 2, toParagraph: 2 },
      design: {
        emphasis: "medium",
        layout: "left",
        tone: "minimal",
        spacing: "normal",
      },
      reason: "正文，正常阅读节奏",
    },
  ],
};

describe("tmp-title-dup-repro", () => {
  it("print rendered markdown", () => {
    const r = renderTemplate(template, article);
    console.log("\n===== rendered markdown =====");
    console.log(r.markdown);
    console.log("\n===== warnings =====");
    console.log(r.warnings.join("\n"));
  });

  it("section-title 替代原标题段，不再重复输出 `## ` 标题", () => {
    const r = renderTemplate(template, article);

    // section-title 组件应存在
    expect(r.markdown).toContain("::: section-title");
    expect(r.markdown).toContain(
      '一、发生了什么？一份"穿透力极强"的备查资料清单',
    );

    // 原 `## ` 标题段不应再以原生 Markdown 标题形式出现（已由组件消费）
    expect(r.markdown).not.toContain("## 一、发生了什么？");

    // 正文段落必须保留
    expect(r.markdown).toContain("近日，广东某地税务分局向企业发出通知");

    // 覆盖率应为 100%（标题段 + 正文段都被覆盖）
    expect(r.coverage).toBe(1);
  });
});
