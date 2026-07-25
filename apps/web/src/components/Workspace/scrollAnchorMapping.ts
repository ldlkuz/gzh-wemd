export interface ScrollAnchor {
  startLine: number;
  endLine: number;
  top: number;
  bottom: number;
}

interface AnchorPoint {
  line: number;
  offset: number;
}

const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);

const buildAnchorPoints = (anchors: ScrollAnchor[]): AnchorPoint[] => {
  const points = anchors.flatMap(({ startLine, endLine, top, bottom }) => [
    { line: startLine, offset: top },
    { line: Math.max(startLine, endLine), offset: Math.max(top, bottom) },
  ]);

  points.sort((left, right) =>
    left.line === right.line
      ? left.offset - right.offset
      : left.line - right.line,
  );

  const normalized: AnchorPoint[] = [];
  points.forEach((point) => {
    const previous = normalized.at(-1);
    if (previous?.line === point.line) {
      previous.offset = Math.min(previous.offset, point.offset);
      return;
    }

    normalized.push({
      line: point.line,
      offset: Math.max(previous?.offset ?? 0, point.offset),
    });
  });
  return normalized;
};

const interpolate = (
  value: number,
  leftInput: number,
  rightInput: number,
  leftOutput: number,
  rightOutput: number,
): number => {
  if (rightInput <= leftInput) return leftOutput;
  const progress = (value - leftInput) / (rightInput - leftInput);
  return leftOutput + progress * (rightOutput - leftOutput);
};

const findBounds = <T>(
  items: T[],
  value: number,
  getValue: (item: T) => number,
): [T, T] => {
  let low = 0;
  let high = items.length - 1;

  while (low <= high) {
    const middle = Math.floor((low + high) / 2);
    if (getValue(items[middle]) < value) low = middle + 1;
    else high = middle - 1;
  }

  const rightIndex = clamp(low, 0, items.length - 1);
  const leftIndex = clamp(rightIndex - 1, 0, items.length - 1);
  return [items[leftIndex], items[rightIndex]];
};

export const mapSourceLineToScrollTop = (
  anchors: ScrollAnchor[],
  sourceLine: number,
  maxScrollTop: number,
  fallbackRatio: number,
): number => {
  const points = buildAnchorPoints(anchors);
  if (points.length === 0) {
    return clamp(fallbackRatio, 0, 1) * Math.max(0, maxScrollTop);
  }

  const [left, right] = findBounds(points, sourceLine, (point) => point.line);
  const offset = interpolate(
    sourceLine,
    left.line,
    right.line,
    left.offset,
    right.offset,
  );
  return clamp(offset, 0, Math.max(0, maxScrollTop));
};

export const mapScrollTopToSourceLine = (
  anchors: ScrollAnchor[],
  scrollTop: number,
): number | null => {
  const points = buildAnchorPoints(anchors);
  if (points.length === 0) return null;
  if (scrollTop <= points[0].offset) return points[0].line;
  if (scrollTop >= points.at(-1)!.offset) return points.at(-1)!.line;

  const [left, right] = findBounds(points, scrollTop, (point) => point.offset);
  return interpolate(
    scrollTop,
    left.offset,
    right.offset,
    left.line,
    right.line,
  );
};
