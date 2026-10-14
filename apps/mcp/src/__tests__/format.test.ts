import { describe, it, expect } from "vitest";
import { text, withHtmlNotes, summarizeCheck } from "../format";

describe("text", () => {
  it("字符串原样透传", () => {
    expect(text("<section>hi</section>")).toEqual({
      content: [{ type: "text", text: "<section>hi</section>" }],
    });
  });

  it("对象序列化为缩进 JSON", () => {
    expect(text({ ok: true, filename: "a.md" })).toEqual({
      content: [{ type: "text", text: '{\n  "ok": true,\n  "filename": "a.md"\n}' }],
    });
  });
});

describe("withHtmlNotes", () => {
  const html = '<section id="wemd">正文</section>';

  it("无元信息时不加注释", () => {
    expect(withHtmlNotes(html, {})).toBe(html);
    expect(withHtmlNotes(html, { warnings: [] })).toBe(html);
  });

  it("只有主题时注明实际生效主题", () => {
    expect(withHtmlNotes(html, { themeId: "sunset-film" })).toBe(
      `<!-- WeMD 主题：sunset-film -->\n${html}`,
    );
  });

  it("主题与图片提醒并存，用 | 分隔", () => {
    expect(
      withHtmlNotes(html, { themeId: "wanqing", warnings: ["图 1 失败", "图 2 失败"] }),
    ).toBe(
      `<!-- WeMD 主题：wanqing | 图片提醒：图 1 失败；图 2 失败 -->\n${html}`,
    );
  });
});

describe("summarizeCheck", () => {
  /** 造出真实渲染输出的关键特征：组件容器带 data-component="<id>" */
  const htmlOf = (ids: string[]) =>
    ids
      .map(
        (id) =>
          `<section class="wemd-component wemd-${id}" data-component="${id}"></section>`,
      )
      .join("");

  it("列出已识别组件，且不报未识别", () => {
    const out = summarizeCheck({
      markdown: "::: quote-card\n金句\n:::\n\n::: steps\n- 一\n:::",
      html: htmlOf(["quote-card", "steps"]),
      themeId: "luxury-gold",
    });
    expect(out).toContain("主题：luxury-gold");
    expect(out).toContain("quote-card");
    expect(out).toContain("steps");
    expect(out).toContain("已识别组件（2）");
    expect(out).not.toContain("未识别组件");
  });

  it("未被识别的 ::: 名要单独点出来", () => {
    const out = summarizeCheck({
      markdown: "::: quote-card\n金句\n:::\n\n::: 瞎写组件\n内容\n:::",
      html: htmlOf(["quote-card"]),
      themeId: "luxury-gold",
    });
    expect(out).toContain("未识别组件（1）：瞎写组件");
    expect(out).toContain("当普通文本输出");
  });

  it("没有 ::: 组件时说清是正常的", () => {
    const out = summarizeCheck({
      markdown: "只有正文段落。",
      html: htmlOf([]),
      themeId: "default",
      warnings: ["本地图片未转存"],
    });
    expect(out).toContain("没有使用 ::: 组件");
    expect(out).toContain("图片提醒：本地图片未转存");
    expect(out).toContain("HTML 大小");
  });
});
