/**
 * CssTranslator —— AI CSS 翻译引擎（Phase 2）
 *
 * 职责：
 * 将 Phase 1 AI 生成的自由 CSS（无 class 约束）翻译为
 * WeMD 标准 CSS（选择器对准 .wemd-* 类）。
 *
 * 流程：
 * 1. 输入：自由 CSS + 组件类型名 + 主题变量
 * 2. 生成翻译 Prompt（包含 WeMD 选择器映射参考）
 * 3. 调用 AI 翻译
 * 4. 返回翻译后的 WeMD 标准 CSS
 */

import { ALL_COMPONENT_ELEMENTS } from "./componentElements";

// ============================================================
// Type Definitions
// ============================================================

/** AI 适配器接口 —— 支持任何 OpenAI 兼容的 AI 提供商 */
export interface AiAdapter {
  /** 发送对话并返回文本回复 */
  chat(
    messages: Array<{ role: "system" | "user" | "assistant"; content: string }>,
  ): Promise<string>;
}

/** 翻译输入 */
export interface TranslationInput {
  /** 组件类型名（如 "hero-banner"） */
  componentType: string;
  /** 自由 CSS 内容（Phase 1 产出） */
  freeCss: string;
  /** 主题变量（可选，用于帮助 AI 理解上下文） */
  themeTokens?: Record<string, string>;
}

/** 翻译结果 */
export interface TranslationResult {
  /** 翻译后的 WeMD 标准 CSS */
  wemdCss: string;
  /** 是否成功 */
  success: boolean;
  /** 错误信息（失败时） */
  error?: string;
}

// ============================================================
// Prompt Templates
// ============================================================

/**
 * 生成 Phase 2 翻译 Prompt
 *
 * 核心思路：
 * - 告诉 AI 它的角色：CSS 选择器翻译器
 * - 给出 WeMD 标准选择器映射参考
 * - 给出自由 CSS
 * - 要求只改选择器，不改样式声明
 * - 要求输出格式：纯 CSS，无额外解释
 */
function buildTranslationPrompt(input: TranslationInput): string {
  const { componentType, freeCss, themeTokens } = input;

  const compDef = ALL_COMPONENT_ELEMENTS[componentType];
  if (!compDef) {
    throw new Error(`未知组件类型: ${componentType}`);
  }

  // 构建选择器映射参考
  const mappingLines = compDef.elements.map((el) => {
    if (el.name === "container") return `- 容器选择器 → ${el.wemdSelector}`;
    return `- 元素 "${el.name}"（${el.desc}）→ ${el.wemdSelector}`;
  });

  // 主题变量参考（可选）
  let tokensSection = "";
  if (themeTokens && Object.keys(themeTokens).length > 0) {
    const tokenLines = Object.entries(themeTokens)
      .map(([k, v]) => `  --wemd-${k}: ${v};`)
      .join("\n");
    tokensSection = `\n主题变量参考（可在 CSS 中引用）：\n#wemd {\n${tokenLines}\n}\n`;
  }

  return `你是一个 CSS 选择器翻译器。你的任务是将自由 CSS 的选择器翻译为 WeMD 标准选择器。

## 规则
1. 只改选择器，不改样式声明
2. 保留所有原始 CSS 的样式值
3. 保留 @media 等 @ 规则
4. 容器选择器前加 #wemd 前缀
5. 输出纯 CSS，不要额外解释

## 组件信息
组件类型：${componentType}（${compDef.label}）
容器：${compDef.containerSelector}
${compDef.hasBody ? "包含 .wemd-component-body 内容层" : "无内容层，直接输出语义结构"}

## 选择器映射参考
${mappingLines.join("\n")}
${tokensSection}
## 自由 CSS（待翻译）
\`\`\`css
${freeCss}
\`\`\`

## 输出要求
- 只输出翻译后的 CSS 代码
- 不要加 \`\`\`css 包裹（除非原始 CSS 中已经包含）
- 每条规则只改选择器，保持所有样式声明不变`;
}

// ============================================================
// CSS 后处理
// ============================================================

/**
 * 对 AI 翻译后的 CSS 做后处理
 *
 * 1. 去除可能的 markdown 代码块标记
 * 2. 确保 #wemd 前缀正确（处理媒体查询、@keyframes 等嵌套规则）
 * 3. 规范化空白
 */
function postProcessCss(rawCss: string): string {
  let css = rawCss.trim();

  // 去除 markdown 代码块包裹
  css = css.replace(/^```(?:css)?\s*\n?/i, "");
  css = css.replace(/\n?```\s*$/i, "");

  // 去除可能的 HTML 实体
  css = css.replace(/&gt;/g, ">");
  css = css.replace(/&lt;/g, "<");
  css = css.replace(/&amp;/g, "&");

  // 按顶层块分割处理，正确处理嵌套规则
  const blocks = splitTopLevelBlocks(css);
  const processed = blocks.map(processBlock);
  return processed.join("\n\n").trim();
}

/** 顶层块类型 */
type BlockType =
  | "media"
  | "keyframes"
  | "supports"
  | "container"
  | "font-face"
  | "import"
  | "other-at"
  | "rule";

/** 解析后的顶层块 */
interface CssBlock {
  type: BlockType;
  /** 块原始内容（不含外部大括号，用于递归处理） */
  inner: string;
  /** 块头部（如 @media screen） */
  header: string;
  /** 原始完整内容 */
  raw: string;
}

/**
 * 将 CSS 按顶层规则分割成块
 *
 * 通过跟踪花括号深度来正确分割，不依赖正则匹配嵌套结构。
 */
function splitTopLevelBlocks(css: string): CssBlock[] {
  const blocks: CssBlock[] = [];
  let depth = 0;
  let start = 0;
  let blockStart = 0;
  let inBlock = false;

  for (let i = 0; i < css.length; i++) {
    const ch = css[i];

    if (ch === "{") {
      if (depth === 0 && !inBlock) {
        // 找到一个块开始
        blockStart = start;
        inBlock = true;
      }
      depth++;
    } else if (ch === "}") {
      depth--;
      if (depth === 0 && inBlock) {
        // 块结束
        const raw = css.slice(blockStart, i + 1).trim();
        if (raw) {
          blocks.push(classifyBlock(raw));
        }
        start = i + 1;
        inBlock = false;
      }
    } else if (ch === ";" && depth === 0 && !inBlock) {
      // 非块语句（如 @import url(...);）
      const raw = css.slice(start, i + 1).trim();
      if (raw) {
        blocks.push(classifyBlock(raw));
      }
      start = i + 1;
    }
  }

  return blocks;
}

/**
 * 分类 CSS 块
 */
function classifyBlock(raw: string): CssBlock {
  const trimmed = raw.trim();

  if (trimmed.startsWith("@media")) {
    return {
      type: "media",
      header: extractHeader(trimmed),
      inner: extractInner(trimmed),
      raw: trimmed,
    };
  }

  if (
    trimmed.startsWith("@keyframes") ||
    trimmed.startsWith("@-webkit-keyframes")
  ) {
    return {
      type: "keyframes",
      header: extractHeader(trimmed),
      inner: extractInner(trimmed),
      raw: trimmed,
    };
  }

  if (trimmed.startsWith("@supports")) {
    return {
      type: "supports",
      header: extractHeader(trimmed),
      inner: extractInner(trimmed),
      raw: trimmed,
    };
  }

  if (trimmed.startsWith("@container")) {
    return {
      type: "container",
      header: extractHeader(trimmed),
      inner: extractInner(trimmed),
      raw: trimmed,
    };
  }

  if (trimmed.startsWith("@font-face")) {
    return {
      type: "font-face",
      header: "",
      inner: extractInner(trimmed),
      raw: trimmed,
    };
  }

  if (trimmed.startsWith("@import")) {
    return { type: "import", header: "", inner: "", raw: trimmed };
  }

  if (trimmed.startsWith("@")) {
    return { type: "other-at", header: "", inner: "", raw: trimmed };
  }

  return {
    type: "rule",
    header: "",
    inner: trimmed,
    raw: trimmed,
  };
}

/** 提取 @ 规则的头部 */
function extractHeader(block: string): string {
  const braceIdx = block.indexOf("{");
  return braceIdx !== -1 ? block.slice(0, braceIdx).trim() : block;
}

/** 提取 @ 规则的花括号内内容 */
function extractInner(block: string): string {
  const braceIdx = block.indexOf("{");
  const lastBrace = block.lastIndexOf("}");
  if (braceIdx === -1 || lastBrace === -1) return "";
  return block.slice(braceIdx + 1, lastBrace).trim();
}

/**
 * 处理单个 CSS 块，添加 #wemd 前缀
 */
function processBlock(block: CssBlock): string {
  switch (block.type) {
    case "media":
    case "supports":
    case "container": {
      // 递归处理内部规则
      const innerBlocks = splitTopLevelBlocks(block.inner);
      const processedInner = innerBlocks.map(processBlock).join("\n\n");
      return `${block.header} {\n${processedInner}\n}`;
    }

    case "keyframes":
      // @keyframes 内部选择器（from/to/百分比）不加 #wemd
      return block.raw;

    case "font-face":
    case "import":
    case "other-at":
      // 这些规则不需要修改
      return block.raw;

    case "rule":
      return addWemdPrefix(block.inner);
  }
}

/**
 * 为 CSS 规则的选择器添加 #wemd 前缀
 *
 * 仅对以 .wemd- 开头的选择器添加前缀，
 * 跳过已有 #wemd 前缀的选择器。
 */
function addWemdPrefix(ruleCss: string): string {
  return ruleCss.replace(
    /([^{]+)\{/g,
    (match: string, selectorGroup: string) => {
      const trimmed = selectorGroup.trim();
      // 跳过 @ 规则（安全兜底）
      if (trimmed.startsWith("@")) return match;
      // 跳过已包含 #wemd 的规则
      if (trimmed.startsWith("#wemd")) return match;

      // 逗号分隔的多个选择器分别处理
      const selectors = trimmed
        .split(",")
        .map((s: string) => s.trim())
        .filter(Boolean);
      const newSelectors = selectors.map((s: string) => {
        // 只对以 .wemd- 开头的选择器加前缀
        if (s.startsWith(".wemd-")) {
          return `#wemd ${s}`;
        }
        // 对属性选择器（如 [data-variant="x"]）也加前缀
        if (s.startsWith("[data-")) {
          return `#wemd ${s}`;
        }
        // 组合选择器（如 div.wemd-hero）也加前缀
        if (s.includes(".wemd-")) {
          return `#wemd ${s}`;
        }
        return s;
      });

      return `${newSelectors.join(",\n")} {`;
    },
  );
}

// ============================================================
// 主翻译器
// ============================================================

/**
 * 翻译单个组件的自由 CSS 为 WeMD 标准 CSS
 */
export async function translateComponentCss(
  input: TranslationInput,
  ai: AiAdapter,
): Promise<TranslationResult> {
  try {
    const prompt = buildTranslationPrompt(input);
    const systemPrompt = `你是一个精确的 CSS 选择器翻译器。
你只做一件事：将 CSS 规则中的选择器从自由命名替换为 WeMD 标准选择器。
你不改变任何样式声明，不添加新规则，不删除规则。
你输出的应该是合法、可直接使用的 CSS。`;

    const response = await ai.chat([
      { role: "system", content: systemPrompt },
      { role: "user", content: prompt },
    ]);

    const wemdCss = postProcessCss(response);

    return {
      wemdCss,
      success: true,
    };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    return {
      wemdCss: "",
      success: false,
      error,
    };
  }
}

/**
 * 批量翻译多个组件的自由 CSS
 *
 * @param inputs 翻译输入数组
 * @param ai AI 适配器
 * @param concurrency 并发数（默认 3）
 * @returns 翻译结果映射 { componentType: TranslationResult }
 */
export async function translateBatchCss(
  inputs: TranslationInput[],
  ai: AiAdapter,
  concurrency: number = 3,
): Promise<Record<string, TranslationResult>> {
  const results: Record<string, TranslationResult> = {};

  // 按并发数分批执行
  for (let i = 0; i < inputs.length; i += concurrency) {
    const batch = inputs.slice(i, i + concurrency);
    const batchPromises = batch.map((input) =>
      translateComponentCss(input, ai).then((result) => ({
        type: input.componentType,
        result,
      })),
    );

    const batchResults = await Promise.all(batchPromises);
    for (const { type, result } of batchResults) {
      results[type] = result;
    }
  }

  return results;
}

/**
 * 从 ThemeDefinition 提取所有自由 CSS 并翻译
 *
 * 这是最上层的入口函数，对接现有渲染管线：
 * 1. 遍历 components 找出所有 variantCssFree 标记为 true 的条目
 * 2. 对每个条目调用 translateComponentCss
 * 3. 把翻译结果写回 variantCss
 * 4. 移除 variantCssFree 标记
 */
export async function translateThemeFreeCss(
  theme: {
    components?: Record<
      string,
      {
        enabled: boolean;
        variant?: string;
        variantCss?: string;
        variantCssFree?: boolean;
        [key: string]: unknown;
      }
    >;
    tokens?: Record<string, unknown>;
  },
  ai: AiAdapter,
): Promise<{
  modified: boolean;
  componentCount: number;
  errors: Array<{ componentType: string; error: string }>;
}> {
  const errors: Array<{ componentType: string; error: string }> = [];
  let modifiedCount = 0;

  if (!theme.components) {
    return { modified: false, componentCount: 0, errors: [] };
  }

  // 提取主题 token 用于翻译上下文
  const themeTokens = extractTokens(theme.tokens);

  const translationInputs: TranslationInput[] = [];

  for (const [compType, override] of Object.entries(theme.components)) {
    if (!override.enabled) continue;
    if (!override.variantCssFree || !override.variantCss) continue;

    translationInputs.push({
      componentType: compType,
      freeCss: override.variantCss,
      themeTokens,
    });
  }

  if (translationInputs.length === 0) {
    return { modified: false, componentCount: 0, errors: [] };
  }

  const results = await translateBatchCss(translationInputs, ai);

  for (const input of translationInputs) {
    const result = results[input.componentType];
    if (!result) continue;

    if (result.success && result.wemdCss) {
      const comp = theme.components[input.componentType];
      comp.variantCss = result.wemdCss;
      delete comp.variantCssFree;
      modifiedCount++;
    } else {
      errors.push({
        componentType: input.componentType,
        error: result.error || "翻译失败",
      });
    }
  }

  return {
    modified: modifiedCount > 0,
    componentCount: modifiedCount,
    errors,
  };
}

/**
 * 从 DesignTokens 中提取关键主题变量（扁平化）
 */
function extractTokens(
  tokens?: Record<string, unknown>,
): Record<string, string> {
  if (!tokens) return {};

  const result: Record<string, string> = {};

  // 提取 color 子集
  const color = tokens.color as Record<string, string> | undefined;
  if (color) {
    const colorKeys = [
      "primary",
      "primaryDark",
      "primaryLight",
      "bgSoft",
      "bgCard",
      "textStrong",
      "textSoft",
      "border",
    ];
    for (const key of colorKeys) {
      if (color[key]) result[key] = color[key];
    }
  }

  // 提取 border radius
  const border = tokens.border as Record<string, number> | undefined;
  if (border?.radius) {
    result["border-radius"] = `${border.radius}px`;
  }

  return result;
}
