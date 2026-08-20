/**
 * 组件插入示例生成器测试（slot-driven sample markdown）
 * - 按当前主题合并后的槽位结构生成 body，主题感知
 * - 未知组件返回空串（由静态模板兜底）
 */
import { describe, it, expect } from "vitest";
import { getComponentSampleMarkdown } from "../plugins/component/slotSamples";

describe("getComponentSampleMarkdown 主题感知插入示例", () => {
  it("故事集 text-card：生成「引子 + 正文」结构（title/body 槽）", () => {
    const md = getComponentSampleMarkdown("storybook", "text-card");
    expect(md).toContain("引子");
    expect(md).toContain("这里是引子正文");
    // 槽位按空行分隔
    expect(md).toMatch(/引子\n\n这里是引子正文/);
  });

  it("故事集 magazine-cover：生成图 + 主标题 + 副题 + 描述（imageUrl/title/subtitle/desc）", () => {
    const md = getComponentSampleMarkdown("storybook", "magazine-cover");
    expect(md).toMatch(/!\[.*\]\(https:\/\/via\.placeholder\.com\/1200x630\)/);
    expect(md).toContain("在这里写主标题");
    expect(md).toContain("一句话副标题");
    expect(md).toContain("引子/描述段落");
  });

  it("好物种草 image-caption：生成「图 + 编号 + 名称 + 价格 + 理由」五段", () => {
    const md = getComponentSampleMarkdown(
      "shopping-guide",
      "image-caption",
    );
    expect(md).toMatch(/!\[.*\]\(https:\/\/via\.placeholder\.com\/1200x630\)/);
    expect(md).toContain("01 · 分类");
    expect(md).toContain("好物名称");
    expect(md).toContain("¥ 000");
    expect(md).toContain("这里是推荐理由/说明文字");
    // 顺序：图 → 编号 → 名称 → 价格 → 理由
    const idxImg = md.indexOf("![");
    const idxNo = md.indexOf("01 · 分类");
    const idxTitle = md.indexOf("好物名称");
    const idxPrice = md.indexOf("¥ 000");
    const idxBody = md.indexOf("这里是推荐理由");
    expect(
      idxImg < idxNo && idxNo < idxTitle && idxTitle < idxPrice && idxPrice < idxBody,
    ).toBe(true);
  });

  it("quote-card：金句正文生成、作者槽跳过（由 props 提供）", () => {
    const md = getComponentSampleMarkdown("default", "quote-card");
    expect(md).toContain("在这里写下值得被记住的金句");
    expect(md).not.toContain("**作者");
  });

  it("未知组件返回空串（web 端回退静态模板）", () => {
    expect(getComponentSampleMarkdown("default", "not-a-component")).toBe("");
  });

  it("补齐组件也能生成非空示例（stats-block / steps / table / image-compare）", () => {
    const stats = getComponentSampleMarkdown("default", "stats-block");
    expect(stats).toContain("核心数据一览");
    const steps = getComponentSampleMarkdown("default", "steps");
    expect(steps).toContain("1. 第一步");
    const table = getComponentSampleMarkdown("default", "table");
    expect(table).toContain("| 列名 | 列名 |");
    const icmp = getComponentSampleMarkdown("default", "image-compare");
    expect(icmp).toMatch(/!\[.*\]\(https:\/\/via\.placeholder\.com\/600x400\)/);
  });
});
