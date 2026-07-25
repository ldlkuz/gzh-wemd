import { describe, expect, it } from "vitest";
import {
  mapScrollTopToSourceLine,
  mapSourceLineToScrollTop,
  type ScrollAnchor,
} from "../../components/Workspace/scrollAnchorMapping";

const anchors: ScrollAnchor[] = [
  { startLine: 0, endLine: 2, top: 0, bottom: 80 },
  { startLine: 4, endLine: 6, top: 320, bottom: 520 },
  { startLine: 8, endLine: 10, top: 700, bottom: 860 },
];

describe("预览滚动锚点映射", () => {
  it("按相邻内容锚点局部插值源行位置", () => {
    expect(mapSourceLineToScrollTop(anchors, 3, 1000, 0.9)).toBe(200);
    expect(mapSourceLineToScrollTop(anchors, 5, 1000, 0.1)).toBe(420);
  });

  it("能从预览位置反推出相邻锚点间的源行", () => {
    expect(mapScrollTopToSourceLine(anchors, 200)).toBe(3);
    expect(mapScrollTopToSourceLine(anchors, 420)).toBe(5);
  });

  it("无锚点时使用全文比例兜底并钳制边界", () => {
    expect(mapSourceLineToScrollTop([], 20, 800, 0.25)).toBe(200);
    expect(mapScrollTopToSourceLine([], 200)).toBeNull();
    expect(mapSourceLineToScrollTop(anchors, 100, 600, 0)).toBe(600);
    expect(mapScrollTopToSourceLine(anchors, 1000)).toBe(10);
  });
});
