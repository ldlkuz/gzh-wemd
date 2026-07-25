import { describe, expect, it } from "vitest";
import { createMarkdownParser } from "../MarkdownParser";
import {
  clearGuideTheme,
  codeGithubDarkTheme,
  dataBlueprintTheme,
  easternNotesTheme,
  modernEditorialTheme,
  whitespaceGalleryTheme,
} from "../themes";

const darkCodeThemes = {
  modernEditorialTheme,
  dataBlueprintTheme,
  easternNotesTheme,
  clearGuideTheme,
  whitespaceGalleryTheme,
};

const hexToRgb = (hex: string): [number, number, number] => {
  const value = Number.parseInt(hex.slice(1), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
};

const relativeLuminance = (hex: string): number => {
  const channels = hexToRgb(hex).map((channel) => {
    const value = channel / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });

  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
};

const contrastRatio = (foreground: string, background: string): number => {
  const values = [
    relativeLuminance(foreground),
    relativeLuminance(background),
  ].sort((a, b) => b - a);
  return (values[0] + 0.05) / (values[1] + 0.05);
};

describe("dark code highlight theme", () => {
  it("Highlight.js 会把 JSON 布尔值标记为可着色的常量", () => {
    const html = createMarkdownParser().render(
      '```json\n{"enabled": true}\n```',
    );

    expect(html).toMatch(
      /<span class="hljs-literal">(?:<span class="hljs-keyword">)?true/,
    );
  });

  it("所有语法前景色在近期主题的代码背景上满足 WCAG AA", () => {
    const literalColor = codeGithubDarkTheme.match(
      /#wemd \.hljs-literal,[\s\S]*?color:\s*(#[0-9a-f]{6});/i,
    )?.[1];
    const foregroundColors = [
      ...codeGithubDarkTheme.matchAll(/^\s*color:\s*(#[0-9a-f]{6});/gim),
    ].map((match) => match[1]);

    expect(literalColor).toBe("#79c0ff");
    expect(foregroundColors.length).toBeGreaterThan(0);

    for (const [name, css] of Object.entries(darkCodeThemes)) {
      const codeBackground = css.match(
        /#wemd pre code,[\s\S]*?#wemd pre code\.hljs\s*\{[\s\S]*?background:\s*(#[0-9a-f]{6});/i,
      )?.[1];

      expect(codeBackground, `${name} 缺少代码块背景色`).toBeTruthy();
      for (const foreground of foregroundColors) {
        expect(
          contrastRatio(foreground, codeBackground!),
          `${name} 的 ${foreground} 对比度不足`,
        ).toBeGreaterThanOrEqual(4.5);
      }
    }
  });
});
