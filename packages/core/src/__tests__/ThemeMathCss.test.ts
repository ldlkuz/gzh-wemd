import { describe, expect, it } from "vitest";
import {
  academicPaperTheme,
  basicTheme,
  codeGithubTheme,
  customDefaultTheme,
  clearGuideTheme,
  dataBlueprintTheme,
  easternNotesTheme,
  knowledgeBaseTheme,
  luxuryGoldTheme,
  morandiForestTheme,
  modernEditorialTheme,
  receiptTheme,
  sunsetFilmTheme,
  whitespaceGalleryTheme,
} from "../themes";

const themes = {
  academicPaperTheme,
  basicTheme,
  codeGithubTheme,
  customDefaultTheme,
  clearGuideTheme,
  dataBlueprintTheme,
  easternNotesTheme,
  knowledgeBaseTheme,
  luxuryGoldTheme,
  morandiForestTheme,
  modernEditorialTheme,
  receiptTheme,
  sunsetFilmTheme,
  whitespaceGalleryTheme,
};

describe("theme math css", () => {
  it("不会用宽泛公式 SVG 选择器影响 KaTeX 根号内部 SVG", () => {
    for (const [name, css] of Object.entries(themes)) {
      expect(css, name).not.toMatch(/#wemd\s+\.block-equation\s+svg\b/);
      expect(css, name).not.toMatch(/#wemd\s+\.inline-equation\s+svg\b/);
      expect(css, name).not.toMatch(/#wemd\s+\.katex-(?:block|inline)\s+svg\b/);
    }
  });
});
