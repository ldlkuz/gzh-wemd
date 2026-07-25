/// <reference types="node" />

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const previewCss = readFileSync(
  "src/components/Preview/MarkdownPreview.css",
  "utf8",
);

describe("MarkdownPreview responsive layout", () => {
  it("窄屏预览卡片使用容器宽度且 padding 计入盒模型", () => {
    expect(previewCss).toMatch(
      /@media\s*\(max-width:\s*768px\)[\s\S]*?\.preview-content\s*\{[\s\S]*?box-sizing:\s*border-box;[\s\S]*?width:\s*100%;/,
    );
  });
});
