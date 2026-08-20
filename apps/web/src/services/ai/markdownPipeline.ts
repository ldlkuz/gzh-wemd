/**
 * 文本 → Markdown 三段式流水线（程序 + AI 辅助）
 *
 * ① preprocessPlainText —— 确定性无损清洗（统一换行、去 BOM/零宽字符、折叠空行），不做内容理解
 * ② AI 结构化 —— 调用 textToMarkdown：LLM 只补结构标记、不改文字（prompt 契约见 aiPrompts）
 * ③ postprocessMarkdown —— 确定性校验兜底：未闭合代码围栏 / 表格列数对齐 / 标题层级跳变 / 误加 HTML 标签
 *
 * 原则：程序管结构、AI 管语义归类，保证"通用 Markdown 格式没问题"。
 */
import { textToMarkdown, type TextToMarkdownParams } from "./aiService";

/** ① 程序预处理：无损清洗粘贴文本 */
export function preprocessPlainText(text: string): string {
  return text
    // 统一换行（CRLF / CR → LF）
    .replace(/\r\n?/g, "\n")
    // 去 BOM 与零宽字符（U+FEFF / U+200B-C），保留正常空白
    .replace(/[\uFEFF\u200B\u200C\u200D]/g, "")
    // 去每行行尾空白
    .split("\n")
    .map((line) => line.replace(/[ \t]+$/, ""))
    .join("\n")
    // 折叠 3 个以上连续空行为 1 个空行（保留段落分隔）
    .replace(/\n{3,}/g, "\n\n")
    // 去首尾空行
    .trim();
}

/** ③ 程序后处理：校验并修复 LLM 常见 Markdown 结构错误 */
export function postprocessMarkdown(markdown: string): string {
  let md = markdown.replace(/\r\n?/g, "\n").trim();

  // 1) 未闭合代码围栏 → 末尾补闭合
  md = closeUnclosedFence(md);
  // 2) 误加的 HTML 标签 → Markdown
  md = normalizeInlineHtml(md);
  // 3) 表格列数对齐（按表头/分隔行列数补齐或并入末列）
  md = normalizeTableColumns(md);
  // 4) 标题层级跳变修复（跳过代码围栏内）
  md = normalizeHeadingLevels(md);
  // 5) 再次折叠多余空行
  md = md.replace(/\n{3,}/g, "\n\n").trim();

  return md;
}

/** 主入口：预处理 → AI 结构化 → 后处理 */
export async function convertTextToMarkdown(
  params: TextToMarkdownParams,
): Promise<string> {
  const cleaned = preprocessPlainText(params.text);
  const raw = await textToMarkdown({ ...params, text: cleaned });
  return postprocessMarkdown(raw);
}

/* ============ 后处理内部实现 ============ */

/** 行首围栏标记（``` 或 ~~~） */
const FENCE_RE = /^\s*(```+|~~~+)/;

/** 未闭合代码围栏：围栏需成对，末尾为奇数时补一个与当前打开围栏同类型的闭合标记 */
function closeUnclosedFence(md: string): string {
  const lines = md.split("\n");
  let open = false;
  let openChar = "```";
  for (const line of lines) {
    const m = line.match(FENCE_RE);
    if (!m) continue;
    if (!open) openChar = m[1];
    open = !open;
  }
  if (!open) return md;
  return `${md}\n${openChar}`;
}

/** 误加的 HTML 标签 → Markdown（属性兼容；仅处理常见 LLM 注入标签，避免误伤真实 HTML） */
function normalizeInlineHtml(md: string): string {
  return md
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/?p[^>]*>/gi, "\n\n")
    .replace(/<\/?strong[^>]*>/gi, "**")
    .replace(/<\/?b[^>]*>/gi, "**")
    .replace(/<\/?em[^>]*>/gi, "*")
    .replace(/<\/?i[^>]*>/gi, "*")
    .replace(/<\/?code[^>]*>/gi, "`")
    // 先去掉带属性的 span/div（其内容保留），避免 <s> 正则误伤 <span...>
    .replace(/<span[^>]*>/gi, "")
    .replace(/<\/span>/gi, "")
    .replace(/<div[^>]*>/gi, "")
    .replace(/<\/div>/gi, "")
    .replace(/<\/?s[^>]*>/gi, "~~")
    .replace(/<\/?u[^>]*>/gi, "");
}

/** 管道表格行 */
const TABLE_LINE_RE = /^\s*\|/;
/** 分隔行（| --- | :---: | 等） */
const TABLE_DELIM_RE = /^\s*\|?[\s:|-]+\|?\s*$/;

/** 拆表格行单元格（去首尾 |） */
function splitTableCells(line: string): string[] {
  let s = line.trim();
  if (s.startsWith("|")) s = s.slice(1);
  if (s.endsWith("|")) s = s.slice(0, -1);
  return s.split("|").map((c) => c.trim());
}

/** 表格列数对齐：按分隔行/表头列数对齐；多列并入末列避免丢内容，少列补空单元格 */
function normalizeTableColumns(md: string): string {
  const lines = md.split("\n");
  const result: string[] = [];
  let i = 0;
  let inFence = false;

  while (i < lines.length) {
    const line = lines[i];
    if (FENCE_RE.test(line)) inFence = !inFence;
    if (inFence || !TABLE_LINE_RE.test(line)) {
      result.push(line);
      i++;
      continue;
    }
    // 收集连续表格行
    const block: string[] = [];
    while (
      i < lines.length &&
      !FENCE_RE.test(lines[i]) &&
      TABLE_LINE_RE.test(lines[i])
    ) {
      block.push(lines[i]);
      i++;
    }
    if (block.length < 2) {
      result.push(...block);
      continue;
    }
    // 目标列数：优先分隔行，其次首行列数
    const delimIdx = block.findIndex((l) => TABLE_DELIM_RE.test(l));
    const target =
      delimIdx >= 0
        ? splitTableCells(block[delimIdx]).length
        : splitTableCells(block[0]).length;
    if (target <= 0) {
      result.push(...block);
      continue;
    }
    result.push(
      ...block.map((l) => {
        if (TABLE_DELIM_RE.test(l)) return l; // 分隔行不动
        const cells = splitTableCells(l);
        if (cells.length === target) return l;
        if (cells.length > target) {
          const kept = cells.slice(0, target - 1);
          kept.push(cells.slice(target - 1).join(" "));
          return `| ${kept.join(" | ")} |`;
        }
        const padded = [...cells, ...Array(target - cells.length).fill("")];
        return `| ${padded.join(" | ")} |`;
      }),
    );
  }
  return result.join("\n");
}

/** 标题层级跳变修复：后一级比前一级跳 ≥2 级时压到前一级 +1；跳过代码围栏内 */
function normalizeHeadingLevels(md: string): string {
  const lines = md.split("\n");
  const out: string[] = [];
  let inFence = false;
  let prevLevel = 0;
  for (const line of lines) {
    if (FENCE_RE.test(line)) inFence = !inFence;
    if (inFence) {
      out.push(line);
      continue;
    }
    const m = line.match(/^(#{1,6})\s+/);
    if (!m) {
      out.push(line);
      continue;
    }
    const level = m[1].length;
    if (prevLevel > 0 && level > prevLevel + 1) {
      const fixed = "#".repeat(prevLevel + 1);
      out.push(line.replace(/^#{1,6}\s+/, `${fixed} `));
      prevLevel = prevLevel + 1;
    } else {
      prevLevel = level;
      out.push(line);
    }
  }
  return out.join("\n");
}
