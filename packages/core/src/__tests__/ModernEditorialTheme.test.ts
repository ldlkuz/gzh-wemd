import { describe, expect, it } from "vitest";
import { modernEditorialTheme } from "../themes";

describe("modern editorial theme", () => {
  it("包含中文长文所需的关键排版层级", () => {
    expect(modernEditorialTheme).toContain("#wemd h1 .content");
    expect(modernEditorialTheme).toContain("#wemd h2 .content");
    expect(modernEditorialTheme).toContain("#wemd .multiquote-1");
    expect(modernEditorialTheme).toContain("#wemd .callout");
    expect(modernEditorialTheme).toContain("#wemd table tr th");
    expect(modernEditorialTheme).toContain("#wemd pre code.hljs");
  });

  it("保持微信复制友好的静态样式约束", () => {
    expect(modernEditorialTheme).toContain("background-color: transparent");
    expect(modernEditorialTheme).not.toContain("#wemd h1 + p");
    expect(modernEditorialTheme).not.toContain("var(--");
    expect(modernEditorialTheme).not.toMatch(
      /position\s*:\s*(absolute|fixed|sticky)/,
    );
    expect(modernEditorialTheme).not.toContain("@media");
  });

  it("包含编辑部刊头、章节编号和橙色锚点", () => {
    expect(modernEditorialTheme).toContain("border-top: 5px solid #20221e");
    expect(modernEditorialTheme).toContain("border-bottom: 3px solid #c76237");
    expect(modernEditorialTheme).toContain("counter-reset: editorial-section");
    expect(modernEditorialTheme).toContain(
      "counter(editorial-section, decimal-leading-zero)",
    );
    expect(modernEditorialTheme).toMatch(
      /#wemd h2::before\s*\{[\s\S]*?font-size:\s*32px;/,
    );
    expect(modernEditorialTheme).toContain("#c76237");
    expect(modernEditorialTheme).not.toContain("linear-gradient");
    expect(modernEditorialTheme).not.toContain("radial-gradient");
    expect(modernEditorialTheme).not.toContain("border-radius: 999px");
  });
});
