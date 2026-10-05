/**
 * rewriteAgent —— AI 排版（整篇）核心
 *
 * 思路（替代旧的"插入推荐"）：
 * 把当前主题的组件手册（buildAIGuide，含骨架槽位映射）喂给 LLM，
 * LLM 一次性输出整篇最终 Markdown。AI 既能把已有结构改写为组件
 * （段落→steps、列表→timeline、数据→stats-block），又能补装饰/导航组件。
 *
 * 允许 AI 轻微改动措辞，但禁止编造事实/数字/人名、禁止删减信息。
 * 配套 validateRewrite 做组件合法 + 围栏闭合检测，结果先预览、可撤销。
 */
import type { ThemeDefinition, LayoutPreference } from "@wemd/core";
import { getBuiltInThemeDefinition } from "@wemd/core";
import { callLLM } from "./llm";
import { resolveAppAssetPath } from "../../utils/assetPath";

/** 手写组件手册静态资源所在目录（随 web 打包，见 apps/web/public/theme-guides/） */
const GUIDE_BASE = "theme-guides";
/** 手写手册文件名前缀：<base>/theme-ai-guide-<themeId>.md */
const GUIDE_FILE_PREFIX = "theme-ai-guide-";

/** 单次重写能承受的原文长度上限（字符）。超限需分段或提示，防截断 */
export const REWRITE_MAX_CHARS = 8000;

/** 校验结果 */
export interface RewriteValidation {
  /** 提取到的组件 id（按出现顺序去重） */
  components: string[];
  /** 不在允许范围内的组件（AI 越界，应剔除或警示） */
  invalid: string[];
  /** 是否围栏未闭合（AI 输出可能被截断） */
  truncated: boolean;
}

/** 手写手册完整 URL：<theme-guidesBase>/theme-ai-guide-<themeId>.md */
function guideUrl(themeId: string): string {
  return resolveAppAssetPath(`${GUIDE_BASE}/${GUIDE_FILE_PREFIX}${themeId}.md`);
}

/** 从手册正文提取组件 id：兼容手写格式（::: 组件id）与程序化格式（### 组件id）。 */
function extractKnownIds(text: string): Set<string> {
  const ids = new Set<string>();
  // 手写手册：每个专属/默认组件示例块以 "::: 组件id" 开头
  const colonRe = /^::: ([a-z][\w-]*)/gm;
  let m: RegExpExecArray | null;
  while ((m = colonRe.exec(text))) ids.add(m[1]);
  // 程序化手册：章节标题为 "### 组件id"
  const headingRe = /^### ([\w-]+)/gm;
  while ((m = headingRe.exec(text))) ids.add(m[1]);
  return ids;
}

/**
 * 解析原文重写前的 LLM 引导手册。
 * - 内置主题：读取 web public/theme-guides/theme-ai-guide-<themeId>.md 手写手册。
 * - 自定义/导入主题：读取其自定义定义里的 guide 字段（手写手册）。
 * 两者皆无时抛错，提示主题缺少组件手册，不静默降级。
 * knownIds 与实际喂给 AI 的手册内容严格一致（扫描 ::: 与 ### 标题），避免硬编码漂移。
 */
export async function buildRewriteGuide(
  themeId: string,
  _allowedComponents?: string[],
  customDef?: ThemeDefinition,
): Promise<{ text: string; knownIds: Set<string> }> {
  let text = "";
  if (!customDef && getBuiltInThemeDefinition(themeId)) {
    // 内置主题：手写手册走公共静态资源
    const res = await fetch(guideUrl(themeId));
    if (res.ok) text = await res.text();
  } else if (customDef?.guide) {
    // 自定义/导入主题：用主题自带 guide 字段
    text = customDef.guide;
  }
  if (!text) {
    throw new Error(
      `主题「${customDef?.meta?.name ?? themeId}」缺少组件手册（guide），无法进行 AI 排版。请为该主题补上手写组件手册后重试。`,
    );
  }
  return { text, knownIds: extractKnownIds(text) };
}

/**
 * 整篇重排：喂组件手册 + 主题约束 + 原文，让 LLM 输出整篇最终 Markdown。
 * @returns 重排后的完整 Markdown
 */
export async function rewriteArticle(
  markdown: string,
  guide: string,
  themeLayout?: LayoutPreference,
): Promise<string> {
  if (markdown.trim().length === 0) {
    throw new Error("编辑器没有内容可排版");
  }
  if (markdown.length > REWRITE_MAX_CHARS) {
    throw new Error(
      `文章过长（${markdown.length} 字），整篇排版上限 ${REWRITE_MAX_CHARS} 字。请精简后重试，或手动分段排版。`,
    );
  }

  const system = [
    "你是一个资深的微信公众号版式设计师。任务：根据下方『组件手册』，把用户文章重新排版为整篇 Markdown。",
    "",
    "规则：",
    "1. 组件分两类，书写方式不变：",
    "   - 原生组件（普通标题、引用、表格、代码块、分隔线、单图、多图）：直接用原生 Markdown，",
    "     标题用 `## 1. …`（编号开头成编号章节）/ `## …`、表格用 `| a | b |`、",
    "     金句用 `> 引用`、分隔线用 `---`、图片用 `![]()`、代码用 ```围栏；这些【不要】用 ::: 包裹。",
    "   - 手册里给出的 `::: xxxx` 结构组件（每个示例块以 `::: 组件id` 开头）：只有这类才用 ::: 包裹，",
    "     照抄手册示例、把 {占位} 换成你的内容，不得写成其他形式。",
    "2. 重组结构与包装：章节标题一律用 `##` 原生标题（不要写成 ::: numbered-heading / section-title）；",
    "   步骤用 ::: steps、时间线用 ::: timeline、数据段用 ::: stats-block 或原生表格、金句用 ::: quote-card、结尾用 ::: end-card。",
    "3. 允许对措辞做轻微润色，但必须：不改动事实/数字/人名/日期、不新增原文没有的信息、不缺删原文要点。",
    "4. 组件内容严格按手册示例的『槽位顺序』组织，落到正确位置。",
    "5. 保留原文的图片（![]()）、代码、表格、链接，原样放进合适位置。",
    "6. 输出整篇最终 Markdown，不得用 ``` 包裹全文，不要任何解释或前后缀文字。",
    "7. 组件使用克制，避免过度堆砌；装饰组件（divider-fancy 等）按需使用。",
    "8. 正文段落风格严格按『主题约束』里的「段落风格」执行，不要自己想当然地一句一段或堆空行。",
    "9. ::: 组件内部禁止用空行把一行内容拆成两段：属标题/加粗/署名/图片/序号/按段落定位的内容必须连行紧排；只有多段正文类槽（如 body）才允许用空行分多段。",
  ].join("\n");

  const user = [
    guide,
    "",
    "## 主题约束",
    formatThemeLayout(themeLayout),
    "",
    "## 用户文章",
    "",
    markdown,
  ].join("\n");

  const raw = await callLLM(system, user, 0.5);
  return raw.trim();
}

function formatThemeLayout(layout: LayoutPreference | undefined): string {
  if (!layout) return "（无，按通用排版）";
  const densityLabel =
    layout.density === "high"
      ? "丰富、杂志级"
      : layout.density === "low"
        ? "简洁、少用组件"
        : "适中、适度点缀";
  const paragraphLabel =
    layout.paragraphStyle === "prose"
      ? "大段穿甲：把语义连续的短句合并为 3~5 句一段，段与段之间用空行分隔，不做一句一段。"
      : "(未指定，默认移动端短句分段)";
  return [
    `- 风格基调：${layout.tone.join("、")}`,
    `- 排版密度：${densityLabel}`,
    `- 段落风格：${paragraphLabel}`,
    layout.preferredComponents.length
      ? `- 主题偏好组件：${layout.preferredComponents.join("、")}`
      : "",
  ]
    .filter(Boolean)
    .join("\n");
}

/**
 * 校验 AI 输出：
 * - 提取所有 ::: 组件 id，标记不在已知范围内的越界组件；
 * - 判断围栏是否闭合（::: 开头数 vs ::: 单独闭合行数），用于截断检测。
 */
export function validateRewrite(
  output: string,
  knownIds: Set<string>,
): RewriteValidation {
  const components: string[] = [];
  const invalid: string[] = [];
  const seen = new Set<string>();
  const seenInvalid = new Set<string>();

  const openRe = /^::: ([a-z][\w-]*)/gm;
  let m: RegExpExecArray | null;
  while ((m = openRe.exec(output))) {
    const id = m[1];
    if (!seen.has(id)) {
      seen.add(id);
      components.push(id);
    }
    if (!knownIds.has(id) && !seenInvalid.has(id)) {
      seenInvalid.add(id);
      invalid.push(id);
    }
  }

  const lines = output.split("\n");
  const openCount = lines.filter((l) => l.startsWith("::: ")).length;
  const closeCount = lines.filter((l) => l.trim() === ":::").length;
  const truncated = openCount > closeCount;

  return { components, invalid, truncated };
}

/**
 * 剔除不在允许范围内的组件整块（::: 越界组件的开标记直到闭合 :::），
 * 保留其余正文。越界组件要么是 AI 生造的 id，要么是用户未勾选、不应出现的组件。
 */
export function sanitizeRewrite(output: string, knownIds: Set<string>): string {
  const lines = output.split("\n");
  let inBad = false;
  const out: string[] = [];
  for (const line of lines) {
    const open = line.match(/^::: ([a-z][\w-]*)/);
    if (open) {
      if (!knownIds.has(open[1])) {
        inBad = true; // 跳过该组件整块，直到闭合
        continue;
      }
      inBad = false;
      out.push(line);
      continue;
    }
    if (line.trim() === ":::") {
      out.push(line);
      inBad = false; // 遇到闭合标记，无论是否 bad 都收口
      continue;
    }
    if (!inBad) out.push(line);
  }
  return out
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
