/**
 * applyInsertions 单元测试
 */
import { describe, it, expect } from "vitest";
import {
  applyInsertions,
  previewInsertion,
} from "../../../services/ai/applyInsertions";
import type { Insertion } from "../../../services/ai/analysisAgent";

const makeInsertion = (over: Partial<Insertion> = {}): Insertion => ({
  at: "文末",
  component: "quote-card",
  props: {},
  body: "内容",
  reason: "测试",
  ...over,
});

describe("applyInsertions", () => {
  it("空 insertions 返回原文", () => {
    const md = "第一段\n\n第二段";
    expect(applyInsertions(md, [])).toBe(md);
  });

  it("文首插入", () => {
    const md = "正文内容";
    const result = applyInsertions(md, [
      makeInsertion({ at: "文首", component: "cta-card", body: "关注我" }),
    ]);
    expect(result).toContain("::: cta-card");
    expect(result).toContain("关注我");
    // cta-card 应该在正文之前
    expect(result.indexOf("::: cta-card")).toBeLessThan(
      result.indexOf("正文内容"),
    );
  });

  it("文末插入", () => {
    const md = "正文内容";
    const result = applyInsertions(md, [
      makeInsertion({ at: "文末", component: "author-card", body: "作者" }),
    ]);
    expect(result).toContain("::: author-card");
    // author-card 应该在正文之后
    expect(result.indexOf("正文内容")).toBeLessThan(
      result.indexOf("::: author-card"),
    );
  });

  it("段后:N 插入（N=1）", () => {
    const md = "第一段\n\n第二段\n\n第三段";
    const result = applyInsertions(md, [
      makeInsertion({
        at: "段后:1",
        component: "divider-fancy",
        body: "",
      }),
    ]);
    expect(result).toContain("::: divider-fancy");
    // divider 应在第一段之后、第二段之前
    const dividerIdx = result.indexOf("::: divider-fancy");
    const para2Idx = result.indexOf("第二段");
    expect(dividerIdx).toBeGreaterThan(result.indexOf("第一段"));
    expect(dividerIdx).toBeLessThan(para2Idx);
  });

  it("段后索引超出范围时降级为文末", () => {
    const md = "只有一段";
    const result = applyInsertions(md, [
      makeInsertion({ at: "段后:99", component: "cta-card", body: "文末" }),
    ]);
    expect(result).toContain("::: cta-card");
    expect(result).toContain("文末");
  });

  it("多条插入按位置正确分布", () => {
    const md = "第一段\n\n第二段\n\n第三段";
    const result = applyInsertions(md, [
      makeInsertion({ at: "文首", component: "cta-card", body: "开头" }),
      makeInsertion({ at: "段后:2", component: "divider-fancy", body: "" }),
      makeInsertion({ at: "文末", component: "author-card", body: "结尾" }),
    ]);
    const idxCta = result.indexOf("开头");
    const idxP1 = result.indexOf("第一段");
    const idxDivider = result.indexOf("::: divider-fancy");
    const idxP3 = result.indexOf("第三段");
    const idxAuthor = result.indexOf("结尾");
    expect(idxCta).toBeLessThan(idxP1);
    expect(idxP1).toBeLessThan(idxDivider);
    expect(idxDivider).toBeLessThan(idxP3);
    expect(idxP3).toBeLessThan(idxAuthor);
  });

  it("带 props 的组件正确序列化", () => {
    const result = applyInsertions("正文", [
      makeInsertion({
        at: "文末",
        component: "quote-card",
        props: { author: "张三", role: "设计师" },
        body: "金句",
      }),
    ]);
    expect(result).toContain("::: quote-card{");
    expect(result).toContain('author="张三"');
    expect(result).toContain('role="设计师"');
    expect(result).toContain("金句");
  });

  it("props 值含空格时用双引号包裹", () => {
    const result = applyInsertions("正文", [
      makeInsertion({
        at: "文末",
        component: "cta-card",
        props: { title: "点击关注", action: "一键三连" },
        body: "",
      }),
    ]);
    expect(result).toContain('title="点击关注"');
    expect(result).toContain('action="一键三连"');
  });

  it("空 body 的组件", () => {
    const result = applyInsertions("正文", [
      makeInsertion({
        at: "文末",
        component: "divider-fancy",
        body: "",
      }),
    ]);
    expect(result).toContain("::: divider-fancy\n:::");
  });

  it("多行 body 保留换行", () => {
    const result = applyInsertions("正文", [
      makeInsertion({
        at: "文末",
        component: "timeline",
        body: "- **2019** 立项\n- **2024** 标杆",
      }),
    ]);
    expect(result).toContain("- **2019** 立项");
    expect(result).toContain("- **2024** 标杆");
  });

  it("不修改原文内容", () => {
    const md = "第一段\n\n第二段\n\n第三段";
    const result = applyInsertions(md, [
      makeInsertion({ at: "文末", component: "cta-card", body: "结尾" }),
    ]);
    expect(result).toContain("第一段");
    expect(result).toContain("第二段");
    expect(result).toContain("第三段");
  });

  it("未知 at 格式默认文末", () => {
    const result = applyInsertions("正文", [
      makeInsertion({ at: "乱七八糟", component: "cta-card", body: "X" }),
    ]);
    expect(result).toContain("::: cta-card");
    expect(result.indexOf("正文")).toBeLessThan(result.indexOf("::: cta-card"));
  });
});

describe("previewInsertion", () => {
  it("生成单条组件语法", () => {
    const md = previewInsertion(
      makeInsertion({
        component: "quote-card",
        props: { author: "K" },
        body: "金句",
      }),
    );
    expect(md).toContain("::: quote-card{");
    expect(md).toContain('author="K"');
    expect(md).toContain("金句");
    expect(md).toContain(":::");
  });

  it("空 props 不输出大括号", () => {
    const md = previewInsertion(
      makeInsertion({ component: "divider-fancy", body: "" }),
    );
    expect(md).toBe("::: divider-fancy\n:::");
  });
});
