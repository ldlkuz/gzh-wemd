/**
 * AI 提示词构建 + CSS 清理(从 NestJS 后端迁移到前端)
 *
 * Phase 3: 新增 Theme JSON 生成 prompt，替代旧 CSS 生成入口。
 */
import type { ThemeDefinition } from "@wemd/core";

// ============================================================
// 文本转 Markdown
// ============================================================

export function buildTextToMarkdownPrompt(mode: "full" | "selection"): string {
  const base = [
    "你是一个 Markdown 排版助手。你的任务是把用户提供的纯文本转换成结构清晰的 Markdown。",
    "要求:",
    "1. 准确识别标题层级(文章标题用 # 或 ##,小节用 ## 或 ###,以此类推)",
    "2. 识别列表(有序/无序)、加粗重点、引用、代码块等结构",
    "3. 保留原文意思,不要增删内容,不要编造信息",
    "4. 只输出 Markdown 正文,不要用代码块包裹,不要加任何解释说明",
  ].join("\n");

  if (mode === "selection") {
    return (
      base + "\n5. 当前是选区片段转换,无需补充大标题,只对片段做结构化即可。"
    );
  }
  return base + "\n5. 当前是整篇转换,请为全文建立合理的标题层级。";
}

// ============================================================
// 主题 CSS 生成（Legacy，保留用于兼容）
// ============================================================

export function buildThemePrompt(): string {
  return [
    "你是一个微信公众号 Markdown 排版主题 CSS 设计师。",
    "你的任务是根据用户的描述,生成适配公众号 Markdown 排版的 CSS 代码。",
    "",
    "硬性要求:",
    "1. 只输出 CSS 代码,不要用 ``` 代码块包裹,不要加任何解释说明",
    "2. 所有选择器必须以 #wemd 为根前缀",
    "3. 必须覆盖段落、标题(h1-h6)、列表、引用、链接、加粗、斜体、删除线、下划线、高亮、分隔线、代码块、行内代码、图片、表格、脚注、公式、提示框等元素",
    "4. 正文字号 15-16px,行高 1.75-2,颜色对比度 WCAG AA",
    "5. 不要给 #wemd 设置 background-color (微信粘贴后失效)",
    "6. 不要设置 width/max-width/margin: auto on #wemd",
    "7. 禁止 <script>, javascript:, expression(), @import, 外部 url()",
  ].join("\n");
}

// ============================================================
// 主题 JSON 生成（Phase 3 新格式）
// ============================================================

export function buildThemeJsonPrompt(): string {
  return [
    "你是一个微信公众号主题设计师。根据用户描述，输出一套完整的主题 JSON。",
    "只输出 JSON，不要代码块包裹，不要解释。",
    "",
    "JSON 结构（必须遵守）：",
    "{",
    '  "meta": { "name": "主题名", "description": "一句话", "keywords": ["标签1"] },',
    '  "tokens": {',
    '    "color": {',
    '      "primary": "#主色", "primaryDark": "#深主色", "primaryLight": "#浅主色",',
    '      "secondary": "#辅助色", "accent": "#点缀色", "background": "#页面背景",',
    '      "bgSoft": "#柔和背景", "bgCard": "#卡片背景", "bgMuted": "#灰背景",',
    '      "textStrong": "#强文字色", "textNormal": "#普通文字色", "textSoft": "#弱文字色", "border": "#边框色"',
    "    },",
    '    "typography": {',
    '      "fontFamily": "字体族（如 -apple-system, sans-serif）",',
    '      "fontSize": "15px或16px或17px", "lineHeight": "1.6~2.0", "letterSpacing": 0.2,',
    '      "codeFontFamily": "monospace字体",',
    '      "heading": {',
    '        "h1": { "fontSize": 28, "color": "#色", "marginTop": 36, "marginBottom": 20, "fontWeight": "600或700", "preset": "simple|left-border|bottom-border|top-border|double-line|boxed|pill|bottom-highlight|bracket", "presetColor": "#可选边框色", "centered": true或false },',
    '        "h2": { "fontSize": 22, "color": "#色", "marginTop": 28, "marginBottom": 14, "fontWeight": "600", "preset": "同上" },',
    '        "h3": { "fontSize": 19, "color": "#色", "marginTop": 24, "marginBottom": 12, "fontWeight": "600" },',
    '        "h4": { "fontSize": 17, "color": "#色", "marginTop": 20, "marginBottom": 10, "fontWeight": "600" }',
    "      }",
    "    },",
    '    "spacing": { "pagePadding": 6~12, "paragraphMargin": 4~14 },',
    '    "border": { "radius": 0~8 },',
    '    "shadow": { "enabled": false, "value": "" }',
    "  },",
    '  "layout": {',
    '    "preferredComponents": ["quote-card", "divider-fancy"],',
    '    "density": "low|medium|high",',
    '    "tone": ["warm|minimal|elegant|rational|serious|modern|playful"],',
    '    "defaultVariants": { "share-card": "warm|minimal|tech" }',
    "  }",
    "}",
    "",
    "设计规则：",
    "1. primary 是核心色，primaryLight 是浅色变体，primaryDark 是深色变体",
    "2. bgSoft/bgCard/bgMuted 与 primary 氛围协调（暖色配暖底，冷色配冷底）",
    "3. heading preset: 默认 simple，强调用 left-border/bottom-border/top-border，活泼用 pill/boxed。presetColor 可选，用于指定边框色（默认使用 color）",
    "4. preferredComponents 从以下选：quote-card, divider-fancy, cta-card, code-frame, callout-pro, stats-block, timeline, follow-bar, numbered-heading, section-title, share-card, toc-nav, tag-label, styled-table, hero-banner, faq, magazine-cover, section-divider, image-card, full-quote, two-column-cards, end-card",
    "5. tone 选：warm(温暖), minimal(极简), elegant(优雅), rational(理性), serious(严肃), modern(现代), playful(活泼)",
    "6. defaultVariants.share-card 根据 tone 选：warm/elegant/playful → warm；minimal/serious/rational → minimal；modern → tech",
    "7. 不要输出 components 字段——组件视觉由组件自身消费 tokens 实现，Theme 只负责设计 Token",
  ].join("\n");
}

/**
 * 验证 AI 生成的 Theme JSON，返回合法对象或 null
 */
export function validateThemeJson(raw: string): ThemeDefinition | null {
  let text = raw.trim();
  if (text.startsWith("```")) {
    text = text.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");
  }
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;

  try {
    const parsed = JSON.parse(jsonMatch[0]);
    if (!parsed.tokens?.color?.primary) return null;
    if (!parsed.tokens?.typography?.fontSize) return null;

    // 补充默认值
    if (!parsed.meta) parsed.meta = {};
    if (!parsed.meta.name) parsed.meta.name = "AI 生成主题";
    if (!parsed.meta.description) parsed.meta.description = "";
    if (!parsed.meta.keywords) parsed.meta.keywords = [];

    if (!parsed.layout) {
      parsed.layout = {
        preferredComponents: ["quote-card", "divider-fancy"],
        density: "medium",
        tone: ["modern"],
      };
    }

    // 校验 layout 字段结构
    const layout = parsed.layout as Record<string, unknown>;
    const validDensities = ["low", "medium", "high"];
    if (!validDensities.includes(layout.density as string)) {
      layout.density = "medium";
    }
    if (!Array.isArray(layout.tone)) {
      layout.tone = ["modern"];
    } else {
      // 过滤非法 tone 值，保留合法枚举内的项（warm/minimal/elegant/rational/serious/modern/playful）
      const validTones = [
        "warm",
        "minimal",
        "elegant",
        "rational",
        "serious",
        "modern",
        "playful",
      ];
      layout.tone = (layout.tone as string[]).filter((t) =>
        validTones.includes(t),
      );
      if ((layout.tone as string[]).length === 0) {
        layout.tone = ["modern"];
      }
    }
    if (!Array.isArray(layout.preferredComponents)) {
      layout.preferredComponents = ["quote-card", "divider-fancy"];
    }
    // 移除已废弃的 magazineLevel 字段
    delete layout.magazineLevel;

    const t = parsed.tokens.typography;
    if (!t.heading) t.heading = {};
    const defaultH = (fs: number, col: string) => ({
      fontSize: fs,
      color: col,
      marginTop: 24,
      marginBottom: 12,
      fontWeight: "600",
    });
    const p = parsed.tokens.color.primary;
    t.heading.h1 = t.heading.h1 || defaultH(28, p);
    t.heading.h2 = t.heading.h2 || defaultH(22, p);
    t.heading.h3 =
      t.heading.h3 || defaultH(19, parsed.tokens.color.textStrong || "#333");
    t.heading.h4 = t.heading.h4 || defaultH(17, p);

    if (!parsed.tokens.spacing)
      parsed.tokens.spacing = { pagePadding: 8, paragraphMargin: 8 };
    if (!parsed.tokens.border) parsed.tokens.border = { radius: 4 };
    if (!parsed.tokens.shadow)
      parsed.tokens.shadow = { enabled: false, value: "" };
    if (!t.codeFontFamily) t.codeFontFamily = "monospace";

    // components 字段可选——仅当 AI 明确输出时保留，结构校验由 ThemeDefinition 类型保证。
    // 不再强制补空对象，符合"Theme 只提供 Token，组件自行消费"的架构原则。

    return parsed;
  } catch {
    return null;
  }
}

// ============================================================
// 主题微调（对话式迭代）
// ============================================================

export function buildDescriptionRefinePrompt(userInput: string): string {
  return [
    "你是一个主题设计需求整理助手。请把用户的口语化描述整理成一段专业、具体的主题风格描述。",
    "要求：",
    "1. 保留用户的原始意图和风格方向",
    "2. 补充具体的配色倾向、排版特点、适用场景",
    "3. 使用设计师术语（如莫兰迪色系、留白、字重、对比度等）",
    "4. 只输出整理后的描述，不要加解释，不要加前缀",
    "5. 控制在 3-5 句话，简洁有力",
    "",
    "用户描述：",
    userInput,
  ].join("\n");
}

export function buildThemeRefinePrompt(
  currentJson: string,
  feedback: string,
): string {
  return [
    "你是一个微信公众号主题设计师。用户对当前主题有调整意见。",
    "请修改 Theme JSON，只修改与用户反馈相关的字段，其他字段保持不变。",
    "只输出修改后的完整 JSON，不要代码块包裹，不要解释。",
    "",
    "当前主题 JSON：",
    currentJson,
    "",
    "用户调整意见：",
    feedback,
    "",
    "注意：",
    "1. 严格保持 JSON 结构不变，只修改值",
    "2. 若用户说「太暗」，调亮 color 相关字段",
    "3. 若用户说「字号太小」，增大 typography.fontSize 和 heading 的 fontSize",
    "4. 若用户说「加点留白」，增大 spacing.pagePadding 和 paragraphMargin",
    "5. meta.name 根据反馈内容更新为更贴切的名称",
  ].join("\n");
}

// ============================================================
// CSS 清洗（Legacy）
// ============================================================

export function sanitizeCss(raw: string): string {
  let css = raw.trim();
  const codeBlockPattern = /```(?:css|style)?\s*\n([\s\S]*?)\n```/g;
  const matches = [...css.matchAll(codeBlockPattern)];
  if (matches.length > 0) {
    css = matches.map((m) => m[1].trim()).join("\n\n");
  } else {
    const lines = css.split("\n");
    const cssLines = lines.filter(
      (line) =>
        line.includes("{") ||
        line.includes("}") ||
        line.includes(":") ||
        line.includes("/*") ||
        line.includes("*/") ||
        line.trim() === "" ||
        line.trim().startsWith("#") ||
        line.trim().startsWith(".") ||
        line.trim().startsWith("@"),
    );
    if (cssLines.length > 0) css = cssLines.join("\n");
  }

  const dangerous = [
    /expression\s*\(/gi,
    /javascript:/gi,
    /<script[\s\S]*?<\/script>/gi,
    /@import\s+/gi,
    /url\s*\(\s*['"]?\s*https?:\/\//gi,
  ];
  for (const pattern of dangerous) css = css.replace(pattern, "");

  css = css.replace(
    /(#wemd\s*\{)([^}]*)(\})/g,
    (_m, open: string, body: string, close: string) => {
      const cleaned = body
        .replace(/max-width\s*:[^;]+;?/gi, "")
        .replace(/\bwidth\s*:[^;]+;?/gi, "")
        .replace(/margin\s*:[^;]*\bauto\b[^;]*;?/gi, "")
        .replace(/background-color\s*:[^;]+;?/gi, "")
        .replace(/background\s*:[^;]+;?/gi, "");
      return `${open}${cleaned}${close}`;
    },
  );

  return css.trim();
}
