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
    // 色条：默认主题 callout-pro 色条改用容器 border-left（避免伪元素 + position:absolute 被公众号删除）
    // 主色跟随主题（默认主题 → #07c160），不再强制 type 语义色
    expect(out).toContain("border-left: 4px solid #07c160");
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

  it("accordion：微信无折叠，上下堆叠展示（不画折叠符号）", () => {
    const out = renderForExport(
      `::: accordion
**标题一**

内容一

**标题二**

内容二
:::`,
    );
    // 问题段仍保留、回答段仍在，构成上下堆叠问答
    expect(out).toContain("wemd-accordion");
    expect(out).toContain("wemd-q");
    // 共享样式不再定义折叠"＋"伪元素，导出不产生折叠符号 span
    expect(out).not.toContain("\uFF0B");
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

  it("pullquote：原生 > 引用（blockquote 结构）物化引号并冲掉内层装饰", () => {
    // 应用环境开启了基础层自动套容器（getTemplate），原生 > 引用才被套成 pullquote
    const parserWithNative = createMarkdownParser({
      getTemplate: () => undefined,
    });
    const raw = parserWithNative.render(
      "> 这是原生引用内容，应套 pullquote 卡片。\n> 第二行引用。",
    );
    const css = getComponentCss();
    const out = processHtml(raw, css, true, true);
    // blockquote 结构下引号也要物化
    expect(out).toContain("\u201C");
    expect(out).toMatch(/class="wemd-mat"/);
    // 内层 blockquote 的左边框/底色被组件长属性冲掉，避免与卡片左竖条双重叠加
    const bq = out.match(/<blockquote[^>]*>/g)?.[0] ?? "";
    expect(bq).toContain("border-left: none");
    expect(bq).toContain("background: transparent");
  });

  it("divider-fancy：无 label 时输出默认装饰点（{{else}} 分支）", () => {
    const out = renderForExport(
      `::: divider-fancy
:::`,
    );
    expect(out).toContain("wemd-df-dots");
    expect(out).toContain("· · ·");
    expect(out).not.toContain("wemd-df-text");
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
