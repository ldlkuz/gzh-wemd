export interface ScrollAnchor {
  startLine: number;
  endLine: number;
  top: number;
  bottom: number;
}

const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);

const anchorHeight = (a: ScrollAnchor): number => Math.max(0, a.bottom - a.top);
const anchorLines = (a: ScrollAnchor): number =>
  Math.max(1, a.endLine - a.startLine);

/**
 * 找到"包含某源码行"的最精确锚点元素。
 * 每个段落/标题/组件都是一个独立的对齐点，编辑器滚到该元素起始行时，
 * 预览精确滚到该元素顶部——不再做跨元素的线性插值，从根源上消除漂移。
 */
const findAnchorContainingLine = (
  anchors: ScrollAnchor[],
  sourceLine: number,
): ScrollAnchor | null => {
  let best: ScrollAnchor | null = null;
  for (const a of anchors) {
    if (sourceLine < a.startLine || sourceLine > a.endLine) continue;
    if (!best || anchorLines(a) < anchorLines(best)) best = a;
  }
  return best;
};

/** sourceLine 落在锚点空隙（元素之间的行）时，取"起始行 ≤ 该行"中起始行最大的前一个元素 */
const findAnchorBeforeLine = (
  anchors: ScrollAnchor[],
  sourceLine: number,
): ScrollAnchor | null => {
  let best: ScrollAnchor | null = null;
  for (const a of anchors) {
    if (a.startLine <= sourceLine && (!best || a.startLine > best.startLine)) {
      best = a;
    }
  }
  return best;
};

/** 找到"包含某滚动偏移"的最精确锚点元素 */
const findAnchorContainingOffset = (
  anchors: ScrollAnchor[],
  offset: number,
): ScrollAnchor | null => {
  let best: ScrollAnchor | null = null;
  for (const a of anchors) {
    if (offset < a.top || offset > a.bottom) continue;
    if (!best || anchorHeight(a) < anchorHeight(best)) best = a;
  }
  return best;
};

/** offset 落在元素间距空隙时，取"顶部 ≤ 该偏移"中顶部最大的前一个元素 */
const findAnchorBeforeOffset = (
  anchors: ScrollAnchor[],
  offset: number,
): ScrollAnchor | null => {
  let best: ScrollAnchor | null = null;
  for (const a of anchors) {
    if (a.top <= offset && (!best || a.top > best.top)) best = a;
  }
  return best;
};

/**
 * 编辑器滚动到某源码行时，预览应滚动到的位置。
 * 定位到"包含该行"的渲染元素，元素内部才按比例细分；元素之间不做跨元素插值。
 */
export const mapSourceLineToScrollTop = (
  anchors: ScrollAnchor[],
  sourceLine: number,
  maxScrollTop: number,
  fallbackRatio: number,
): number => {
  if (anchors.length === 0) {
    return clamp(fallbackRatio, 0, 1) * Math.max(0, maxScrollTop);
  }
  const anchor =
    findAnchorContainingLine(anchors, sourceLine) ??
    findAnchorBeforeLine(anchors, sourceLine) ??
    anchors[0];
  const ratio = clamp(
    (sourceLine - anchor.startLine) / anchorLines(anchor),
    0,
    1,
  );
  const target = anchor.top + ratio * anchorHeight(anchor);
  return clamp(target, 0, Math.max(0, maxScrollTop));
};

/**
 * 预览滚动到某位置时，对应的源码行。
 * 定位到"包含该偏移"的渲染元素，元素内部才按比例细分。
 */
export const mapScrollTopToSourceLine = (
  anchors: ScrollAnchor[],
  scrollTop: number,
): number | null => {
  if (anchors.length === 0) return null;
  const anchor =
    findAnchorContainingOffset(anchors, scrollTop) ??
    findAnchorBeforeOffset(anchors, scrollTop) ??
    anchors[0];
  const ratio = clamp(
    (scrollTop - anchor.top) / Math.max(1, anchorHeight(anchor)),
    0,
    1,
  );
  return anchor.startLine + ratio * anchorLines(anchor);
};
