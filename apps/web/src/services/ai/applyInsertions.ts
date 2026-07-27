/**
 * applyInsertions —— 把 Insertion[] 应用到 markdown，插入 ::: 组件语法
 *
 * 纯代码，不调 AI。可逆（用户可撤销）。
 */
import type { Insertion } from "./analysisAgent";

/** 把单个 insertion 转为 ::: 组件语法块 */
function insertionToMarkdown(ins: Insertion): string {
  // 所有 props 值统一用双引号包裹，避免歧义，与 parseProps 兼容
  const propsStr = Object.entries(ins.props)
    .map(([k, v]) => {
      const escaped = String(v).replace(/"/g, '\\"');
      return `${k}="${escaped}"`;
    })
    .join(" ");

  const header = propsStr
    ? `::: ${ins.component}{${propsStr}}`
    : `::: ${ins.component}`;

  const body = ins.body.trim();
  return body ? `${header}\n${body}\n:::` : `${header}\n:::`;
}

/** 解析 at 字段，返回锚点类型和段索引 */
function parseAnchor(at: string): {
  type: "start" | "end" | "after";
  index: number;
} {
  if (at === "文首") return { type: "start", index: 0 };
  if (at === "文末") return { type: "end", index: -1 };
  const match = at.match(/^段后:(\d+)$/);
  if (match) {
    return { type: "after", index: parseInt(match[1], 10) };
  }
  // 默认文末
  return { type: "end", index: -1 };
}

/**
 * 把 markdown 按段落切分为行数组（保留空行结构）
 * 段落定义：以空行分隔的连续非空行
 */
function splitToLines(markdown: string): string[] {
  return markdown.split("\n");
}

/**
 * 找到第 N 段的结束行索引（段后插入位置）
 * 段落数从 1 起：第 1 段是第一个非空段落
 */
function findParagraphEnd(lines: string[], paragraphIndex: number): number {
  let count = 0;
  let inParagraph = false;
  let lastNonEmpty = -1;

  for (let i = 0; i < lines.length; i++) {
    const isEmpty = lines[i].trim() === "";
    if (!isEmpty) {
      inParagraph = true;
      lastNonEmpty = i;
    } else if (inParagraph) {
      // 段落结束
      count++;
      if (count === paragraphIndex) {
        return lastNonEmpty;
      }
      inParagraph = false;
    }
  }

  // 处理末尾段落（无空行结尾）
  if (inParagraph) {
    count++;
    if (count === paragraphIndex) {
      return lastNonEmpty;
    }
  }

  // 索引超出范围，返回最后一行
  return lines.length - 1;
}

/**
 * 把 insertions 应用到 markdown
 *
 * @param markdown 原文
 * @param insertions 插入建议（已按用户筛选）
 * @returns 新 markdown
 */
export function applyInsertions(
  markdown: string,
  insertions: Insertion[],
): string {
  if (insertions.length === 0) return markdown;

  const lines = splitToLines(markdown);

  // 为每条插入建议计算目标行索引
  const plans = insertions.map((ins) => {
    const anchor = parseAnchor(ins.at);
    let targetLine: number;
    if (anchor.type === "start") {
      targetLine = 0;
    } else if (anchor.type === "end") {
      targetLine = lines.length;
    } else {
      targetLine = findParagraphEnd(lines, anchor.index) + 1;
    }
    return { ins, targetLine };
  });

  // 按目标行索引降序排序（从后往前插入，避免索引偏移）
  plans.sort((a, b) => b.targetLine - a.targetLine);

  // 依次插入
  const result = [...lines];
  for (const { ins, targetLine } of plans) {
    const block = insertionToMarkdown(ins);
    const blockLines = block.split("\n");
    // 插入位置前后各加一个空行，与正文隔开
    const toInsert = ["", ...blockLines, ""];
    result.splice(targetLine, 0, ...toInsert);
  }

  return (
    result
      .join("\n")
      .replace(/\n{3,}/g, "\n\n\n")
      .trim() + "\n"
  );
}

/**
 * 生成单条 insertion 的预览 markdown（用于面板预览）
 */
export function previewInsertion(ins: Insertion): string {
  return insertionToMarkdown(ins);
}
