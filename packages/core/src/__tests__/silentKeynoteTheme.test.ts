// @vitest-environment happy-dom
/**
 * 无声发布主题（SILENT KEYNOTE）回归测试：
 * - 带图封面（magazine-cover 扩展 image 槽）
 * - 章节编号拆分（numbered-heading / section-title 的 number-prefix）
 * - 黑屏收场（end-card）
 * - 无声分隔线（divider）+ 无伪元素/整篇背景
 */
import { describe, expect, it } from "vitest";
import { createMarkdownParser } from "../MarkdownParser";
import { processHtml } from "../ThemeProcessor";
import {
  renderTheme,
  getThemeTemplates,
  getThemeSlotDefs,
  getBuiltInThemeDefinition,
} from "../index";

function renderSilent(md: string): string {
  const theme = getBuiltInThemeDefinition("silent-keynote")!;
  const css = renderTheme(theme);
  const templates = getThemeTemplates(theme);
  const slotDefs = getThemeSlotDefs(theme);
  const parser = createMarkdownParser({
    getTemplate: (id) => templates.get(id),
    getSlotDefs: (id) => slotDefs.get(id),
  });
  const raw = parser.render(md);
  return processHtml(raw, css, true, true);
}

describe("无声发布 · 带图封面", () => {
  it("magazine-cover 首段图片进封面图槽，黑屏面板 + 大标题", () => {
    const out = renderSilent(
      "::: magazine-cover\n*PRODUCT KEYNOTE*\n\n**星弦 ONE**\n\n把声音，还给夜晚\n\n![](https://img.example.com/cover.jpg)\n:::",
    );
    expect(out).toContain('class="wemd-sk-cover"');
    expect(out).toContain('class="wemd-sk-cover-img"');
    expect(out).toContain('src="https://img.example.com/cover.jpg"');
    // 槽位映射：eyebrow ← title 槽（首行斜体小字），大标题 ← subtitle 槽（次行粗体）
    expect(out).toMatch(/wemd-sk-eyebrow[\s\S]{0,500}PRODUCT KEYNOTE/);
    expect(out).toMatch(/wemd-sk-title[\s\S]{0,500}星弦 ONE/);
    // 黑屏封面背景 + 浅字
    expect(out).toMatch(/wemd-sk-cover[^>]*background: ?#0a0a0c/);
    expect(out).toMatch(/wemd-sk-title[^>]*color: ?#f4f4f0/);
  });
});

describe("无声发布 · 章节编号拆分", () => {
  it("## 01 引言 → 编号 01 + 标题 引言 分离", () => {
    const out = renderSilent("## 01 引言\n\n正文内容");
    expect(out).toContain('class="wemd-component wemd-numbered-heading"');
    expect(out).toContain('class="wemd-sk-sec-num"');
    expect(out).toContain("01");
    expect(out).toContain('class="wemd-sk-sec-body"');
    expect(out).toContain("引言");
    // 编号橙色，标题深色
    expect(out).toMatch(/wemd-sk-sec-num[^>]*color: ?#ff4d00/);
    expect(out).toMatch(/wemd-sk-sec-body[^>]*color: ?#18181c/);
  });

  it("## 引言（无编号）→ 纯标题，不渲染编号元素", () => {
    const out = renderSilent("## 引言\n\n正文内容");
    expect(out).toContain('class="wemd-component wemd-section-title"');
    expect(out).toContain('class="wemd-sk-sec-body"');
    expect(out).toContain("引言");
    expect(out).not.toContain('class="wemd-sk-sec-num"');
  });
});

describe("无声发布 · 黑屏收场与分隔", () => {
  it("end-card 黑屏收场（深底 + 橙线 + 大标题）", () => {
    const out = renderSilent(
      "::: end-card\n*STARSTRING®*\n\n**安静，值得被听见**\n\n星弦 ONE · 现已开售\n:::",
    );
    expect(out).toContain('class="wemd-sk-end"');
    expect(out).toMatch(/wemd-sk-end[^>]*background: ?#0a0a0c/);
    // 槽位映射：eyebrow ← title（首行小字），大标题 ← subtitle（次行大字）
    expect(out).toMatch(/wemd-sk-end-eyebrow[\s\S]{0,500}STARSTRING/);
    expect(out).toMatch(/wemd-sk-end-title[\s\S]{0,500}安静，值得被听见/);
  });

  it("divider 无声细线（等宽符号）", () => {
    const out = renderSilent("正文\n\n---\n\n段落");
    expect(out).toContain('class="wemd-sk-dots"');
  });
});

describe("无声发布 · 微信约束", () => {
  it("导出无伪元素 / 结构伪类残留，且 #wemd 无整篇背景", () => {
    const out = renderSilent(
      "::: magazine-cover\n**标题**\n\n副题\n\n![](https://img.example.com/cover.jpg)\n:::\n\n## 01 引言\n\n正文\n\n---\n\n::: end-card\n**收尾**\n:::",
    );
    expect(out).not.toMatch(/::/);
    expect(out).not.toMatch(/:nth-child|:first-child|:last-child|:not\(/);
    const wemd = out.match(/<section id="wemd"[^>]*>/)?.[0] ?? "";
    expect(wemd).not.toMatch(/background-color/);
  });
});
