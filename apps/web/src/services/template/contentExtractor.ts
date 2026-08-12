/**
 * 从 Markdown 中提取段落范围
 *
 * 按空行分隔段落，从 1 开始索引。
 * 用于 article-section 组件的核心实现。
 */

const PARAGRAPH_SPLIT_RE = /\n\s*\n/;

/**
 * 将 Markdown 拆分为段落数组
 * 按空行（含空白行）分隔，保留段落内部的换行和格式。
 */
export function splitParagraphs(markdown: string): string[] {
  if (!markdown || !markdown.trim()) return [];
  const paragraphs = markdown.split(PARAGRAPH_SPLIT_RE);
  return paragraphs.map((p) => p.trim()).filter(Boolean);
}

/**
 * 提取指定范围的段落（1-based 索引，包含两端）
 * 越界时自动裁剪到有效范围。
 */
export function extractParagraphs(
  markdown: string,
  from: number,
  to: number,
): { text: string; actualFrom: number; actualTo: number } {
  const paragraphs = splitParagraphs(markdown);
  const total = paragraphs.length;

  if (total === 0) {
    return { text: "", actualFrom: 0, actualTo: 0 };
  }

  const fromIdx = Math.max(1, Math.ceil(from));
  const toIdx = Math.min(total, Math.floor(to));

  if (fromIdx > toIdx) {
    return { text: "", actualFrom: 0, actualTo: 0 };
  }

  const slice = paragraphs.slice(fromIdx - 1, toIdx);
  return {
    text: slice.join("\n\n"),
    actualFrom: fromIdx,
    actualTo: toIdx,
  };
}

/**
 * 计算一组段落范围的覆盖率
 * 返回被覆盖的段落数 / 总段落数
 */
export function calculateCoverage(
  markdown: string,
  ranges: Array<{ from: number; to: number }>,
): number {
  const paragraphs = splitParagraphs(markdown);
  const total = paragraphs.length;
  if (total === 0) return 1;

  const covered = new Set<number>();
  for (const range of ranges) {
    const from = Math.max(1, Math.ceil(range.from));
    const to = Math.min(total, Math.floor(range.to));
    for (let i = from; i <= to; i++) {
      covered.add(i);
    }
  }

  return covered.size / total;
}

/**
 * 找出未被任何 article-section 覆盖的段落范围（1-based，含两端）
 *
 * 相邻未覆盖段落会合并为连续区间，便于兜底追加 article-section。
 * 返回空数组表示全文已被覆盖。
 */
export function findUncoveredRanges(
  markdown: string,
  ranges: Array<{ from: number; to: number }>,
): Array<{ from: number; to: number }> {
  const paragraphs = splitParagraphs(markdown);
  const total = paragraphs.length;
  if (total === 0) return [];

  const covered = new Set<number>();
  for (const range of ranges) {
    const from = Math.max(1, Math.ceil(range.from));
    const to = Math.min(total, Math.floor(range.to));
    for (let i = from; i <= to; i++) {
      covered.add(i);
    }
  }

  const uncovered: Array<{ from: number; to: number }> = [];
  let start = -1;
  for (let i = 1; i <= total; i++) {
    if (!covered.has(i)) {
      if (start === -1) start = i;
    } else if (start !== -1) {
      uncovered.push({ from: start, to: i - 1 });
      start = -1;
    }
  }
  if (start !== -1) {
    uncovered.push({ from: start, to: total });
  }

  return uncovered;
}

/**
 * 获取总段落数
 */
export function getParagraphCount(markdown: string): number {
  return splitParagraphs(markdown).length;
}
