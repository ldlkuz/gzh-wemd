// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { processHtml } from "../ThemeProcessor";

describe("ThemeProcessor mac bar", () => {
  it("保留 pre 与 code 之间的 Mac Bar 圆点，并保持代码空格保护", () => {
    const html =
      '<pre class="custom"><span class="mac-sign" style="display:block;padding:10px 14px 0;line-height:0;"><span class="mac-dot" style="display:inline-block;width:10px;height:10px;border-radius:50%;background:rgb(237,108,96);"></span><span class="mac-dot" style="display:inline-block;width:10px;height:10px;border-radius:50%;background:rgb(247,193,81);"></span><span class="mac-dot" style="display:inline-block;width:10px;height:10px;border-radius:50%;background:rgb(100,200,86);"></span></span><code class="hljs language-ts">  const a = 1;\n    console.log(a);</code></pre>';
    const css = `
      #wemd pre.custom > .mac-sign {
        display: block;
      }
    `;

    const output = processHtml(html, css, false, true);

    expect(output.match(/class="mac-dot"/g)).toHaveLength(3);
    expect(output).not.toContain("<svg");
    expect(output).toMatch(
      /<pre[^>]*>\s*<span[^>]*>[\s\S]*class="mac-dot"[\s\S]*<\/span><code/i,
    );
    expect(output).not.toMatch(/<code[^>]*>[\s\S]*class="mac-dot"/i);
    expect(output).toContain("&nbsp;&nbsp;const a = 1;");
    expect(output).toContain("\n&nbsp;&nbsp;&nbsp;&nbsp;console.log(a);");
  });
});

// 提取内联后第一个 <div> 的 style 串
function inlineStyle(html: string, css: string): string {
  const out = processHtml(html, css, true, false);
  const m = out.match(/<div[^>]*style="([^"]*)"/);
  return m ? m[1] : "";
}

describe("ThemeProcessor 简写顺序归一 (normalizeShorthandOrderForInline)", () => {
  it("margin 危险序（长属性先、简写后）→ 简写被前置，长属性在简写之后生效", () => {
    const style = inlineStyle(
      '<div class="x">t</div>',
      ".x { margin-bottom: 24px; margin: 0; }",
    );
    // 重排后：margin 在前，margin-bottom 在后
    expect(style.indexOf("margin: 0")).toBeGreaterThanOrEqual(0);
    expect(style.indexOf("margin: 0")).toBeLessThan(
      style.indexOf("margin-bottom: 24px"),
    );
  });

  it("margin 安全序（简写先、长属性后）→ 保持原顺序", () => {
    const style = inlineStyle(
      '<div class="x">t</div>',
      ".x { margin: 0; margin-bottom: 24px; }",
    );
    expect(style.indexOf("margin: 0")).toBeLessThan(
      style.indexOf("margin-bottom: 24px"),
    );
  });

  it("只有简写、无同家族长属性 → 简写不被清掉", () => {
    const style = inlineStyle('<div class="x">t</div>', ".x { margin: 0; }");
    expect(style).toContain("margin: 0");
  });

  it("border 危险序 → border 前置到 border-top-width 之前", () => {
    const style = inlineStyle(
      '<div class="x">t</div>',
      ".x { border-top-width: 3px; border: 1px solid red; }",
    );
    expect(style.indexOf("border: 1px solid red")).toBeLessThan(
      style.indexOf("border-top-width"),
    );
  });

  it("flex 危险序 → flex 前置到 flex-basis 之前", () => {
    const style = inlineStyle(
      '<div class="x">t</div>',
      ".x { flex-basis: 40%; flex: 1; }",
    );
    expect(style.indexOf("flex: 1")).toBeLessThan(
      style.indexOf("flex-basis: 40%"),
    );
  });

  it("background 危险序 → background 前置到 background-size 之前", () => {
    const style = inlineStyle(
      '<div class="x">t</div>',
      ".x { background-size: 16px 16px; background: #f5efe0; }",
    );
    expect(style.indexOf("background: #f5efe0")).toBeLessThan(
      style.indexOf("background-size: 16px 16px"),
    );
  });
});
