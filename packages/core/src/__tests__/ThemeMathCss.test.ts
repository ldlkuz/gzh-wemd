import { describe, expect, it } from "vitest";
import {
  academicPaperTheme,
  auroraGlassTheme,
  basicTheme,
  bauhausTheme,
  codeGithubTheme,
  customDefaultTheme,
  cyberpunkNeonTheme,
  clearGuideTheme,
  dataBlueprintTheme,
  easternNotesTheme,
  knowledgeBaseTheme,
  luxuryGoldTheme,
  morandiForestTheme,
  modernEditorialTheme,
  neoBrutalismTheme,
  receiptTheme,
  sunsetFilmTheme,
  templateTheme,
  whitespaceGalleryTheme,
} from "../themes";

const themes = {
  academicPaperTheme,
  auroraGlassTheme,
  basicTheme,
  bauhausTheme,
  codeGithubTheme,
  customDefaultTheme,
  cyberpunkNeonTheme,
  clearGuideTheme,
  dataBlueprintTheme,
  easternNotesTheme,
  knowledgeBaseTheme,
  luxuryGoldTheme,
  morandiForestTheme,
  modernEditorialTheme,
  neoBrutalismTheme,
  receiptTheme,
  sunsetFilmTheme,
  templateTheme,
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
