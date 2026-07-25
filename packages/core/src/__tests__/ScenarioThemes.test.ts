import { describe, expect, it } from "vitest";
import {
  clearGuideTheme,
  dataBlueprintTheme,
  easternNotesTheme,
  whitespaceGalleryTheme,
} from "../themes";

const themes = {
  dataBlueprintTheme,
  easternNotesTheme,
  clearGuideTheme,
  whitespaceGalleryTheme,
};

const requiredSelectors = [
  "#wemd h1",
  "#wemd h2",
  "#wemd h3",
  "#wemd .multiquote-1",
  "#wemd ul",
  "#wemd ol",
  "#wemd figure",
  "#wemd figcaption",
  "#wemd pre",
  "#wemd table",
  "#wemd .callout",
  "#wemd .footnotes-sep",
  "#wemd .block-equation",
  "#wemd .block-equation > svg",
  "#wemd pre.mermaid",
  "#wemd .task-list-item",
];

describe("scenario themes", () => {
  it("完整覆盖公众号文章的主要内容元素", () => {
    for (const [name, css] of Object.entries(themes)) {
      for (const selector of requiredSelectors) {
        expect(css, `${name} 缺少 ${selector}`).toContain(selector);
      }
    }
  });

  it("保持透明根背景并避开模板化视觉效果", () => {
    for (const [name, css] of Object.entries(themes)) {
      expect(css, name).toMatch(
        /#wemd\s*\{[\s\S]*?background(?:-color)?:\s*transparent;/,
      );
      expect(css, name).not.toMatch(/background-clip:\s*text/i);
      expect(css, name).not.toMatch(/backdrop-filter/i);
      expect(css, name).not.toMatch(/border-left:\s*[2-9]\d*px/i);
    }
  });

  it("四款主题具有不同的核心视觉锚点", () => {
    expect(dataBlueprintTheme).toContain("#173f7a");
    expect(easternNotesTheme).toContain("#a33a2b");
    expect(clearGuideTheme).toContain("#087f75");
    expect(whitespaceGalleryTheme).toContain("#2b2927");
  });

  it("四款主题使用不同的版式语法而非同一骨架换色", () => {
    expect(dataBlueprintTheme).toMatch(
      /#wemd h1\s*\{[\s\S]*?background:\s*#102b4e;/,
    );
    expect(dataBlueprintTheme).toContain(
      "list-style-type: decimal-leading-zero",
    );

    expect(easternNotesTheme).toMatch(
      /#wemd h1\s*\{[\s\S]*?max-width:\s*7em;[\s\S]*?text-align:\s*right;/,
    );
    expect(easternNotesTheme).toMatch(
      /#wemd h1 \.content\s*\{[\s\S]*?max-width:\s*100%;/,
    );
    expect(easternNotesTheme).toContain("#wemd .multiquote-1::before");

    expect(clearGuideTheme).toMatch(
      /#wemd h1\s*\{[\s\S]*?border-bottom:\s*8px solid #f0c94d;/,
    );
    expect(clearGuideTheme).toMatch(
      /#wemd figure\s*\{[\s\S]*?border:\s*2px solid #172b29;/,
    );

    expect(whitespaceGalleryTheme).toMatch(
      /#wemd h1\s*\{[\s\S]*?max-width:\s*12em;/,
    );
    expect(whitespaceGalleryTheme).toMatch(
      /#wemd \.multiquote-1,[\s\S]*?background:\s*#2b2927;/,
    );
  });

  it("精修后的长文组件保持清晰边界与稳定换行", () => {
    for (const [name, css] of Object.entries(themes)) {
      expect(css, `${name} 标题缺少平衡换行`).toMatch(
        /#wemd h1 \.content\s*\{[\s\S]*?text-wrap:\s*balance;/,
      );
      expect(css, `${name} 提示块不应继承默认大圆角`).toMatch(
        /#wemd \.callout\s*\{[\s\S]*?border-radius:\s*0;/,
      );
      expect(css, `${name} 图片不应在分页时被拆开`).toMatch(
        /#wemd figure\s*\{[\s\S]*?break-inside:\s*avoid;/,
      );
      expect(css, `${name} 嵌套引用不应重复挤压横向空间`).toMatch(
        /#wemd \.multiquote-1 \.multiquote-1\s*\{[\s\S]*?margin:\s*\d+px 0 0;/,
      );
    }
  });
});
