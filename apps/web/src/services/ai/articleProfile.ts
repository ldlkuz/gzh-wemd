/**
 * 文章画像（Article Profile）
 *
 * AI 理解文章的多维描述，取代单一 articleType。
 * 灵感来自升级思路2.md 的 Article Profile 概念。
 */

/** 文章画像 */
export interface ArticleProfile {
  /** 内容类别 */
  category: ArticleCategory;
  /** 语气/情绪 */
  tone: ArticleTone;
  /** 写作目的 */
  purpose: ArticlePurpose;
  /** 阅读深度 */
  depth: ReadingDepth;
}

/** 内容类别 */
export type ArticleCategory =
  | "Tech"
  | "AI"
  | "Emotion"
  | "Finance"
  | "News"
  | "Travel"
  | "Education"
  | "Business"
  | "Life"
  | "Other";

/** 文章语气 */
export type ArticleTone =
  | "Warm"
  | "Serious"
  | "Rational"
  | "Luxury"
  | "Modern"
  | "Elegant"
  | "Playful"
  | "Plain";

/** 写作目的 */
export type ArticlePurpose =
  | "Discussion"
  | "Share"
  | "Collect"
  | "Convert"
  | "Guide"
  | "Branding"
  | "Inform";

/** 阅读深度 */
export type ReadingDepth = "Quick" | "Medium" | "Deep";

// === Profile 推断规则（纯代码，不调 LLM） ===
// 基于现有 designPatterns 的 7 种 type 做初步映射，
// 实际使用中由 LLM 输出更精确的 profile。

const TYPE_TO_PROFILE: Record<string, ArticleProfile> = {
  tutorial: {
    category: "Tech",
    tone: "Rational",
    purpose: "Guide",
    depth: "Deep",
  },
  story: {
    category: "Life",
    tone: "Warm",
    purpose: "Discussion",
    depth: "Medium",
  },
  data: {
    category: "Business",
    tone: "Serious",
    purpose: "Share",
    depth: "Deep",
  },
  opinion: {
    category: "Business",
    tone: "Rational",
    purpose: "Discussion",
    depth: "Medium",
  },
  list: { category: "Life", tone: "Plain", purpose: "Collect", depth: "Quick" },
  news: { category: "News", tone: "Plain", purpose: "Inform", depth: "Quick" },
  product: {
    category: "Business",
    tone: "Modern",
    purpose: "Convert",
    depth: "Medium",
  },
};

/** 从旧版 articleType 推断初始 Profile（纯代码，不需 LLM） */
export function inferProfileFromType(articleType: string): ArticleProfile {
  return (
    TYPE_TO_PROFILE[articleType] ?? {
      category: "Other",
      tone: "Plain",
      purpose: "Inform",
      depth: "Medium",
    }
  );
}

/** 构建 AI 推断 Profile 的 prompt（融入现有 Stage1 prompt） */
export function buildProfilePromptSnippet(): string {
  return [
    "",
    "## 文章画像（Article Profile）",
    "除了类型之外，请同时输出文章的多维画像：",
    "",
    "category（内容类别）: Tech | AI | Emotion | Finance | News | Travel | Education | Business | Life | Other",
    "tone（语气/情绪）: Warm | Serious | Rational | Luxury | Modern | Elegant | Playful | Plain",
    "purpose（写作目的）: Discussion | Share | Collect | Convert | Guide | Branding | Inform",
    "depth（阅读深度）: Quick | Medium | Deep",
    "",
    "示例：一篇温暖的创业故事 → { category: Emotion, tone: Warm, purpose: Discussion, depth: Medium }",
    "示例：一篇数据分析报告 → { category: Business, tone: Serious, purpose: Share, depth: Deep }",
  ].join("\n");
}
