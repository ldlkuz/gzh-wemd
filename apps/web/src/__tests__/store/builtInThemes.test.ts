import { describe, expect, it } from "vitest";
import {
  clearGuideTheme,
  dataBlueprintTheme,
  easternNotesTheme,
  modernEditorialTheme,
  whitespaceGalleryTheme,
} from "@wemd/core";
import { builtInThemes } from "../../store/themes/builtInThemes";
import { useThemeStore } from "../../store/themeStore";

describe("built-in themes", () => {
  it("注册编辑部手记主题并组合基础与代码样式", () => {
    const theme = builtInThemes.find((item) => item.id === "modern-editorial");

    expect(theme).toBeTruthy();
    expect(theme?.name).toBe("编辑部手记");
    expect(theme?.isBuiltIn).toBe(true);
    expect(theme?.css).toContain(modernEditorialTheme);
    expect(theme?.css).toContain("#wemd .hljs");
  });

  it("已删除的旧主题不再存在于内置主题列表", () => {
    const deletedThemeIds = [
      "template",
      "aurora-glass",
      "cyberpunk-neon",
      "bauhaus",
      "neo-brutalism",
    ];

    for (const themeId of deletedThemeIds) {
      const theme = builtInThemes.find((item) => item.id === themeId);
      expect(theme, `${themeId} 应已删除`).toBeUndefined();
    }
  });

  it("注册四款可选的场景化主题", () => {
    const expectedThemes = [
      ["data-blueprint", "数据蓝图", dataBlueprintTheme],
      ["eastern-notes", "东方笺谱", easternNotesTheme],
      ["clear-guide", "清晰指南", clearGuideTheme],
      ["whitespace-gallery", "留白画册", whitespaceGalleryTheme],
    ] as const;

    for (const [id, name, css] of expectedThemes) {
      const theme = builtInThemes.find((item) => item.id === id);
      expect(theme).toBeTruthy();
      expect(theme?.name).toBe(name);
      expect(theme?.isSelectable).not.toBe(false);
      expect(theme?.css).toContain(css);
      expect(theme?.css).toContain("#wemd .hljs");
    }
  });

  it("深色代码块主题使用可读的深色语法高亮配色", () => {
    const darkCodeThemeIds = [
      "modern-editorial",
      "data-blueprint",
      "eastern-notes",
      "clear-guide",
      "whitespace-gallery",
    ];

    for (const themeId of darkCodeThemeIds) {
      const theme = builtInThemes.find((item) => item.id === themeId);

      expect(theme?.css, themeId).toMatch(
        /#wemd \.hljs-attr,[\s\S]*?#wemd \.hljs-literal,[\s\S]*?color:\s*#79c0ff;/,
      );
      expect(theme?.css, themeId).not.toMatch(
        /#wemd \.hljs-number,[\s\S]*?#wemd \.hljs-literal,[\s\S]*?color:\s*#008080;/,
      );
    }
  });
});
