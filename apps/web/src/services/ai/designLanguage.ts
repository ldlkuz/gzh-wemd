/**
 * 设计语言（Design Language）
 *
 * 区别于 CSS Theme（配色），Design Language 定义"整篇文章的设计风格"。
 * 同一个 Design Language 统一驱动所有组件的视觉选择。
 * 灵感来自升级思路2.md 的 Design Theme 概念。
 */

import type { ArticleProfile, DesignLanguageId } from "./articleProfile";

/** 设计语言定义 */
export interface DesignLanguage {
  id: DesignLanguageId;
  label: string;
  description: string;
  /** 适合的语气 */
  tone: string[];
  /** 适合的文章类别 */
  categories: string[];
  /** 适合的目的 */
  purposes: string[];
  /** 组件变体映射：组件类型 → 推荐变体名（Phase 3 启用） */
  variantMap: Record<string, string>;
  /** 杂志化等级 */
  magazineLevel: "high" | "medium" | "low";
}

/** 预置设计语言（5 套） */
export const DESIGN_LANGUAGES: DesignLanguage[] = [
  {
    id: "warm-magazine",
    label: "温暖杂志",
    description:
      "圆润卡片、暖色渐变、情感化排版。适合个人故事、随笔、生活方式。",
    tone: ["Warm", "Elegant"],
    categories: ["Emotion", "Life", "Travel"],
    purposes: ["Discussion", "Branding"],
    variantMap: {
      "share-card": "warm",
      "quote-card": "warm",
      "end-card": "warm",
    },
    magazineLevel: "high",
  },
  {
    id: "apple-minimal",
    label: "Apple 极简",
    description:
      "大量留白、细线分割、克制装饰。适合严肃内容、商业分析、产品发布。",
    tone: ["Modern", "Rational", "Luxury"],
    categories: ["Business", "Tech", "Finance"],
    purposes: ["Branding", "Convert", "Inform"],
    variantMap: {
      "share-card": "minimal",
      "quote-card": "minimal",
      "end-card": "minimal",
    },
    magazineLevel: "medium",
  },
  {
    id: "tech-data",
    label: "科技数据",
    description: "代码框、数据卡、几何装饰。适合技术教程、数据报告、AI 内容。",
    tone: ["Rational", "Modern"],
    categories: ["Tech", "AI", "Finance"],
    purposes: ["Guide", "Share"],
    variantMap: {
      "share-card": "tech",
      "quote-card": "tech",
      "stats-block": "tech",
    },
    magazineLevel: "medium",
  },
  {
    id: "editorial",
    label: "编辑部风",
    description:
      "杂志级排版、标题装饰、章节分隔。适合深度文章、行业分析、专栏。",
    tone: ["Serious", "Elegant"],
    categories: ["Business", "News", "Education"],
    purposes: ["Discussion", "Guide", "Branding"],
    variantMap: {
      "share-card": "editorial",
      "quote-card": "editorial",
      "end-card": "editorial",
    },
    magazineLevel: "high",
  },
  {
    id: "playful-card",
    label: "活力卡片",
    description:
      "彩色标签、emoji 点缀、活泼圆角。适合清单合集、生活推荐、轻松内容。",
    tone: ["Playful", "Warm"],
    categories: ["Life", "Travel", "Education"],
    purposes: ["Collect", "Share", "Discussion"],
    variantMap: {
      "share-card": "playful",
      "tag-label": "playful",
      "end-card": "playful",
    },
    magazineLevel: "high",
  },
];

/** 基于 Profile 匹配最佳设计语言（纯代码匹配，不调 LLM） */
export function matchDesignLanguage(profile: ArticleProfile): DesignLanguage {
  let best: DesignLanguage = DESIGN_LANGUAGES[0];
  let bestScore = -1;

  for (const dl of DESIGN_LANGUAGES) {
    let score = 0;

    // tone 匹配
    if (dl.tone.includes(profile.tone)) score += 3;
    else if (dl.tone.some((t) => t === "Modern" || t === "Plain")) score += 1; // 中性兜底

    // category 匹配
    if (dl.categories.includes(profile.category)) score += 2;

    // purpose 匹配
    if (dl.purposes.includes(profile.purpose)) score += 2;

    if (score > bestScore) {
      bestScore = score;
      best = dl;
    }
  }

  return best;
}

/** 构建让 AI 推荐设计语言的 prompt 片段 */
export function buildDesignLanguagePromptSnippet(): string {
  const dlList = DESIGN_LANGUAGES.map(
    (dl) => `- ${dl.id}（${dl.label}）: ${dl.description}`,
  ).join("\n");

  return [
    "",
    "## 设计语言（Design Language）",
    "从以下预置设计语言中选择最合适的：",
    "",
    dlList,
    "",
    "输出字段 designLanguage，值为上述 id 之一。",
    "如果不确定，默认用 apple-minimal。",
  ].join("\n");
}
