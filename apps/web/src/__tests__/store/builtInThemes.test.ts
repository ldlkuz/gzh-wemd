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

  it("下架旧主题但保留注册信息供历史文章恢复", () => {
    const retiredThemeIds = [
      "template",
      "aurora-glass",
      "cyberpunk-neon",
      "bauhaus",
      "neo-brutalism",
    ];

    for (const themeId of retiredThemeIds) {
      const theme = builtInThemes.find((item) => item.id === themeId);
      expect(theme, `${themeId} 应继续保留注册信息`).toBeTruthy();
      expect(theme?.isSelectable).toBe(false);
      expect(theme?.css).toContain("#wemd");
    }

    expect(
      builtInThemes.find((item) => item.id === "luxury-gold")?.isSelectable,
    ).not.toBe(false);
  });

  it("仍可按主题 ID 恢复下架主题", () => {
    const state = useThemeStore.getState();

    state.selectTheme("bauhaus");

    expect(useThemeStore.getState().themeId).toBe("bauhaus");
    expect(useThemeStore.getState().getThemeCSS("bauhaus")).toContain(
      "包豪斯风格",
    );

    useThemeStore.getState().selectTheme("default");
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
