// @vitest-environment happy-dom
/**
 * base64 图片 / SVG（data URL 与内联元素）在无声发布主题下的渲染回归测试。
 *
 * 覆盖场景：base64 PNG 封面图、base64 SVG 图、内联 <svg> 元素、utf8 data URL SVG、
 * 外链图。断言 img src 原样保留 + 封面图样式（object-fit/max-height）内联生效。
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

// 1x1 红色 PNG
const PNG_B64 =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
// 100x100 橙色方块 SVG（base64，无 ) 字符，避免 markdown 图片 src 截断）
const SVG_B64 =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2ZmNGQwMCIvPjwvc3ZnPg==";

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

describe("base64 / SVG 渲染（无声发布）", () => {
  it("base64 PNG 作封面图：img src 保留 + 封面图样式生效", () => {
    const out = renderSilent(
      `::: magazine-cover\n*PRODUCT KEYNOTE*\n\n**星弦 ONE**\n\n把声音，还给夜晚\n\n![cover](${PNG_B64})\n:::`,
    );
    expect(out).toContain('class="wemd-sk-cover-img"');
    expect(out).toContain(`src="${PNG_B64}"`);
    // 封面图样式（object-fit / max-height）内联生效
    expect(out).toMatch(/wemd-sk-cover-img[\s\S]{0,400}object-fit: cover/);
    expect(out).toMatch(/wemd-sk-cover-img[\s\S]{0,400}max-height: 300px/);
  });

  it("base64 SVG 作图片卡片：img src 保留", () => {
    const out = renderSilent(`![svg](${SVG_B64})\n\n图注文字`);
    expect(out).toContain(`src="${SVG_B64}"`);
    expect(out).toContain("图注文字");
  });

  it("base64 SVG 作封面图：正常渲染", () => {
    const out = renderSilent(
      `::: magazine-cover\n**标题**\n\n副题\n\n![svg](${SVG_B64})\n:::`,
    );
    expect(out).toContain(`src="${SVG_B64}"`);
    expect(out).toMatch(/wemd-sk-cover-img[\s\S]{0,400}object-fit: cover/);
  });

  it("普通外链图不受影响", () => {
    const out = renderSilent("![](https://img.example.com/a.png)");
    expect(out).toContain('src="https://img.example.com/a.png"');
  });

  it("内联 <svg> 元素：markdown 直写保留（微信兼容性不确定）", () => {
    const out = renderSilent(
      '<p><svg width="20" height="20" xmlns="http://www.w3.org/2000/svg"><circle cx="10" cy="10" r="6" fill="#ff4d00"/></svg></p>',
    );
    expect(out).toContain("<svg");
    expect(out).toContain('fill="#ff4d00"');
  });

  it("utf8 data URL SVG（含 URL 编码属性）：src 完整保留", () => {
    const utf8Svg =
      "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20'%3E%3Ccircle cx='10' cy='10' r='6' fill='%23ff4d00'/%3E%3C/svg%3E";
    const out = renderSilent(`![u](${utf8Svg})`);
    expect(out).toContain(`src="${utf8Svg}"`);
  });
});
