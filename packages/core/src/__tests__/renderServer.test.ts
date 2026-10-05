// @vitest-environment happy-dom
import { describe, it, expect } from "vitest";
import { renderWechatHtml } from "../render-server";
import { getBuiltInThemeList } from "../index";

describe("render-server：renderWechatHtml（Tier A 服务端入口）", () => {
  it("能列出内置主题", () => {
    const list = getBuiltInThemeList();
    expect(Array.isArray(list)).toBe(true);
    expect(list.length).toBeGreaterThan(0);
    expect(list[0]).toHaveProperty("id");
    expect(list[0]).toHaveProperty("name");
    expect(list[0]).toHaveProperty("description");
  });

  it("modern-editorial 渲染含 end-card 且带内联样式", () => {
    const md = `# 标题

正文段落。

::: end-card
EDITORIAL

**下期见**

编辑部
:::
`;
    const { html, themeId } = renderWechatHtml(md, {
      themeId: "modern-editorial",
    });
    expect(themeId).toBe("modern-editorial");
    expect(html.startsWith("<section id=")).toBe(true);
    expect(html).toContain("wemd-end-card");
    expect(html).toContain("color:");
  });

  it("未知主题抛错", () => {
    expect(() => renderWechatHtml("# x", { themeId: "no-such-theme" })).toThrow(
      "未知主题",
    );
  });
});
