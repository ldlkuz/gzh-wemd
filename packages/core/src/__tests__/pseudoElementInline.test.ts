// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { createMarkdownParser } from "../MarkdownParser";
import { processHtml } from "../ThemeProcessor";
import { getComponentCss } from "./themeCssForTest";

/**
 * 微信伪元素物化验证：
 * 微信过滤 ::before / ::after，导出时 inlinePseudoElementDecorations 把这些装饰
 * 改写为真实 <span class="wemd-mat"> 并内联样式。这里对 6 个 body 类组件做端到端断言。
 */

function renderForExport(md: string) {
  const parser = createMarkdownParser();
  const raw = parser.render(md);
  const css = getComponentCss();
  return processHtml(raw, css, true, true);
}

describe("微信伪元素物化", () => {
  it("callout-pro：物化左侧色条 + 标题图标", () => {
    const out = renderForExport(
      `::: callout-pro{type="info"}
**提示标题**

这是正文内容。
:::`,
    );
    expect(out).toContain('class="wemd-mat"');
    // 色条：背景为 info 语义色
    expect(out).toContain("background: #3b82f6");
    // 图标显示
    expect(out).toContain("\u2139\uFE0F");
  });

  it("callout-pro：物化列表项绿色圆点", () => {
    const out = renderForExport(
      `::: callout-pro
**分组建议**

- signature 组适合放在文章开头和结尾
- data 组适合穿插在论述段落之间
:::`,
    );
    // 每个列表项前的圆点物化为 wemd-mat span，且颜色跟随主题主色
    const mats = out.match(/class="wemd-mat"/g) || [];
    expect(mats.length).toBeGreaterThanOrEqual(2);
    expect(out).toContain("\u2022");
    expect(out).toContain("color: #07c160");
  });

  it("steps：每个 li 物化数字序号", () => {
    const out = renderForExport(
      `::: steps
- 第一步说明
- 第二步说明
:::`,
    );
    const mats = out.match(/class="wemd-mat"/g) || [];
    expect(mats.length).toBeGreaterThanOrEqual(2);
    expect(out).toContain(">1</span>");
    expect(out).toContain(">2</span>");
  });

  it("faq：物化挂角标题 + 菱形符号", () => {
    const out = renderForExport(
      `::: faq{title="常见问题"}
**问题一**

回答内容一

**问题二**

回答内容二
:::`,
    );
    // 菱形符号物化为 span
    expect(out).toContain("background:");
    expect(out).toMatch(/class="wemd-mat"/);
  });

  it("accordion：物化问题前缀 ＋", () => {
    const out = renderForExport(
      `::: accordion
**标题一**

内容一

**标题二**

内容二
:::`,
    );
    // 至少两个物化 span（两个问题）
    const mats = out.match(/class="wemd-mat"/g) || [];
    expect(mats.length).toBeGreaterThanOrEqual(2);
    expect(out).toContain("\uFF0B");
  });

  it("pullquote：物化引号", () => {
    const out = renderForExport(
      `::: pullquote
这是大段引用内容。
:::`,
    );
    expect(out).toMatch(/class="wemd-mat"/);
    expect(out).toContain("\u201C");
  });

  it("divider：物化左右分隔线", () => {
    const out = renderForExport(
      `::: divider
分隔文字
:::`,
    );
    const mats = out.match(/class="wemd-mat"/g) || [];
    expect(mats.length).toBeGreaterThanOrEqual(2);
  });

  it("无相关组件时原样返回，不引入 wemd-mat", () => {
    const out = renderForExport(
      `::: text-card
普通文字卡片，无伪元素装饰。
:::`,
    );
    expect(out).not.toContain("wemd-mat");
  });
});
