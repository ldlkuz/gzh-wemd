import { describe, it, expect } from "vitest";
import { text, withHtmlNotes } from "../format";

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
