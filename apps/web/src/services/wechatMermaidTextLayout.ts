export type SvgTextBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type SvgTextLayout = {
  lines: string[];
  fontSize: number;
  lineHeight: number;
  startY: number;
  centerX: number;
};

const MIN_FONT_SIZE = 10;
const MAX_FONT_SIZE = 18;
const HORIZONTAL_PADDING = 12;

const isAsciiWordChar = (char: string): boolean =>
  /[A-Za-z0-9_./:+#%-]/.test(char);

const isCjkChar = (char: string): boolean =>
  /[\u2e80-\u9fff\uf900-\ufaff]/.test(char);

const estimateCharWidth = (char: string, fontSize: number): number => {
  if (/\s/.test(char)) return fontSize * 0.33;
  if (isCjkChar(char)) return fontSize;
  if (/[，。！？、；：（）《》“”‘’【】]/.test(char)) return fontSize;
  if (isAsciiWordChar(char)) return fontSize * 0.56;
  return fontSize * 0.82;
};

const estimateTextWidth = (text: string, fontSize: number): number =>
  Array.from(text).reduce(
    (total, char) => total + estimateCharWidth(char, fontSize),
    0,
  );

const tokenizeText = (line: string): string[] => {
  const tokens: string[] = [];
  let current = "";
  let inAsciiWord = false;

  const flush = () => {
    if (current) {
      tokens.push(current);
      current = "";
    }
  };

  Array.from(line).forEach((char) => {
    if (/\s/.test(char)) {
      flush();
      tokens.push(char);
      inAsciiWord = false;
      return;
    }

    const asciiWord = isAsciiWordChar(char);
    if (!asciiWord) {
      flush();
      tokens.push(char);
      inAsciiWord = false;
      return;
    }

    if (current && !inAsciiWord) {
      flush();
    }
    current += char;
    inAsciiWord = true;
  });

  flush();
  return tokens;
};

const breakOversizeToken = (
  token: string,
  maxWidth: number,
  fontSize: number,
): string[] => {
  const chunks: string[] = [];
  let current = "";

  Array.from(token).forEach((char) => {
    const next = current + char;
    if (current && estimateTextWidth(next, fontSize) > maxWidth) {
      chunks.push(current);
      current = char;
      return;
    }
    current = next;
  });

  if (current) chunks.push(current);
  return chunks;
};

const wrapSingleLine = (
  line: string,
  maxWidth: number,
  fontSize: number,
): string[] => {
  const normalized = line.replace(/\s+/g, " ").trim();
  if (!normalized) return [];
  if (estimateTextWidth(normalized, fontSize) <= maxWidth) return [normalized];

  const lines: string[] = [];
  let current = "";

  tokenizeText(normalized).forEach((token) => {
    if (!token.trim()) {
      if (current && !current.endsWith(" ")) current += " ";
      return;
    }

    const next = current ? `${current}${token}` : token;
    if (estimateTextWidth(next, fontSize) <= maxWidth) {
      current = next;
      return;
    }

    if (current.trim()) {
      lines.push(current.trim());
      current = "";
    }

    if (estimateTextWidth(token, fontSize) <= maxWidth) {
      current = token;
      return;
    }

    const chunks = breakOversizeToken(token, maxWidth, fontSize);
    lines.push(...chunks.slice(0, -1));
    current = chunks[chunks.length - 1] || "";
  });

  if (current.trim()) lines.push(current.trim());
  return lines.length > 0 ? lines : [normalized];
};

const wrapLines = (
  rawLines: string[],
  maxWidth: number,
  fontSize: number,
): string[] =>
  rawLines.flatMap((line) => wrapSingleLine(line, maxWidth, fontSize));

export const layoutSvgTextLines = (
  rawLines: string[],
  box: SvgTextBox,
  preferredFontSize = MAX_FONT_SIZE,
): SvgTextLayout => {
  const sourceLines = rawLines.map((line) => line.trim()).filter(Boolean);
  const fallbackLines = sourceLines.length > 0 ? sourceLines : [""];
  const maxWidth = Math.max(16, box.width - HORIZONTAL_PADDING);
  const maxFontSize = Math.min(
    MAX_FONT_SIZE,
    Math.max(MIN_FONT_SIZE, preferredFontSize),
  );

  let selectedLines: string[] = fallbackLines;
  let selectedFontSize = MIN_FONT_SIZE;
  let selectedLineHeight = MIN_FONT_SIZE * 1.2;

  for (
    let fontSize = Math.round(maxFontSize);
    fontSize >= MIN_FONT_SIZE;
    fontSize -= 1
  ) {
    const wrapped = wrapLines(fallbackLines, maxWidth, fontSize);
    const lineHeight = fontSize * 1.2;
    const totalHeight = wrapped.length * lineHeight;
    selectedLines = wrapped;
    selectedFontSize = fontSize;
    selectedLineHeight = lineHeight;

    if (totalHeight <= Math.max(lineHeight, box.height)) {
      break;
    }
  }

  const totalHeight = selectedLines.length * selectedLineHeight;
  return {
    lines: selectedLines,
    fontSize: selectedFontSize,
    lineHeight: selectedLineHeight,
    centerX: box.x + box.width / 2,
    startY: box.y + box.height / 2 - totalHeight / 2 + selectedFontSize * 0.85,
  };
};
