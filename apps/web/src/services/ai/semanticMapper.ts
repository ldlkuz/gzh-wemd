/**
 * 语义映射层（Semantic Mapper）
 *
 * 从 ComponentRegistry 读取组件语义标注，
 * 为 AI 提供"按意图选组件"的能力。
 *
 * 核心逻辑：
 * - AI 说"需要 Ending.Comment.Warm" → 映射到 share-card
 * - 不是"需要 share-card"
 */

import type {
  ArticleProfile,
  ArticlePurpose,
  ArticleTone,
} from "./articleProfile";

/** 语义查询条件 */
export interface SemanticQuery {
  /** 需要的 Category（如 "Ending"、"Hero"） */
  category?: string;
  /** 需要的 Semantic（如 "Share"、"Quote"） */
  semantic?: string;
  /** 匹配的语气 */
  tone?: string;
  /** 匹配的文章类别 */
  articleCategory?: string;
}

/** 语义匹配结果 */
export interface SemanticMatch {
  component: string;
  category: string;
  semantic: string;
  intent: string;
  score: number;
}

/**
 * 基于 Profile + Purpose 推荐合适的 Semantic 意图
 *
 * 纯代码规则，不调 LLM。
 * Phase 2 先用规则，Phase 3 可以由 AI 直接输出。
 */
export function recommendEndingIntent(purpose: ArticlePurpose): {
  semantic: string;
  examples: string[];
} {
  const map: Record<ArticlePurpose, { semantic: string; examples: string[] }> =
    {
      Discussion: {
        semantic: "Comment",
        examples: ["欢迎在评论区分享你的看法 💬", "你觉得呢？留言聊聊"],
      },
      Share: {
        semantic: "Share",
        examples: ["如果觉得有用，分享给需要的朋友 ❤️", "转发给更多人看到"],
      },
      Collect: {
        semantic: "Collect",
        examples: ["建议收藏备用 ⭐", "先收藏，慢慢看"],
      },
      Convert: { semantic: "CTA", examples: ["立即体验", "扫码了解更多"] },
      Guide: {
        semantic: "Share",
        examples: ["学到了？分享给同事吧", "转发给团队"],
      },
      Branding: { semantic: "Thanks", examples: ["感谢阅读", "期待下次相遇"] },
      Inform: { semantic: "Share", examples: ["转给需要的人", "关注获取更多"] },
    };
  return (
    map[purpose] ?? { semantic: "Share", examples: ["如果觉得有用，欢迎分享"] }
  );
}

/** 根据 Profile 推荐使用的语义类别 */
export function recommendCategories(profile: ArticleProfile): string[] {
  const categories: string[] = [];

  // 深度文章用 Hero + Highlight
  if (profile.depth === "Deep") {
    categories.push("Hero");
    categories.push("Highlight");
  }

  // 教程/指南用 Structure + Data
  if (profile.purpose === "Guide") {
    categories.push("Structure");
    categories.push("Data");
  }

  // 数据分享用 Data
  if (profile.purpose === "Share" && profile.category === "Business") {
    categories.push("Data");
  }

  // 收藏类用 Footer
  if (profile.purpose === "Collect") {
    categories.push("Footer");
  }

  // 品牌建设用 Hero + Ending
  if (profile.purpose === "Branding") {
    categories.push("Hero");
  }

  // 总有一个 Ending
  categories.push("Ending");

  // 去重
  return [...new Set(categories)];
}

/**
 * 给定 Profile，推荐组件密度（低/中/高）
 *
 * Quick → low（仅封面+收尾）
 * Medium → medium（适度点缀）
 * Deep → high（可全卡片化）
 */
export function recommendComplexity(
  profile: ArticleProfile,
): "reading" | "balanced" | "visual" | "infoDensity" {
  switch (profile.depth) {
    case "Quick":
      return "reading";
    case "Medium":
      return "balanced";
    case "Deep":
      return "visual";
  }
}
