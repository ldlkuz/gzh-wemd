/**
 * 合法组件注册表
 *
 * 所有合法组件和内置预设 variant 的单一来源。
 * Validator（Phase 1）和 Skill 文档（Phase 9，通过 sync-skill-spec.mjs）均从此文件派生。
 * 禁止在 Skill 文档或检测网页中硬抄一份规则。
 */

// ============================================================
// 合法组件全集（35 个，来源：builtin/index.ts + VARIANT_CSS_MAP）
// ============================================================

export const LEGAL_COMPONENTS = [
  // default 组（9）
  "quote-card",
  "divider-fancy",
  "cta-card",
  "code-frame",
  "callout-pro",
  "stats-block",
  "image-grid",
  "author-card",
  "timeline",
  // extra 组（12）
  "follow-bar",
  "qr-card",
  "numbered-heading",
  "section-title",
  "image-text-row",
  "hero-banner",
  "share-card",
  "related-posts",
  "toc-nav",
  "tag-label",
  "image-caption",
  "copyright-notice",
  "styled-table",
  // faq 组（1）
  "faq",
  // magazine 组（7）
  "magazine-cover",
  "section-divider",
  "image-card",
  "text-card",
  "full-quote",
  "two-column-cards",
  "end-card",
  // VARIANT_CSS_MAP 中有但不在 builtin 中的（5）
  "product-card",
  "brand-sign",
  "resource-list",
  "testimonial-card",
  "series-nav",
] as const;

export type LegalComponent = (typeof LEGAL_COMPONENTS)[number];

export const LEGAL_COMPONENT_SET: ReadonlySet<string> = new Set(
  LEGAL_COMPONENTS,
);

// ============================================================
// 轨道 A 内置预设 variant 表（仅供内置主题用，AI 主题不选）
// 来源：variantCss.ts 的 VARIANT_CSS_MAP
// ============================================================

export const BUILTIN_PRESET_VARIANTS: Readonly<
  Record<string, ReadonlySet<string>>
> = {
  "share-card": new Set(["warm", "minimal", "tech"]),
  "quote-card": new Set(["classic", "quotation", "card"]),
  "cta-card": new Set(["pill", "banner", "minimal"]),
  "divider-fancy": new Set(["line", "gradient", "dots"]),
  "hero-banner": new Set(["center", "left", "minimal"]),
  "callout-pro": new Set(["border", "bg", "minimal"]),
  "section-divider": new Set(["line", "dots", "bold"]),
  "end-card": new Set(["centered", "minimal", "warm"]),
  "product-card": new Set(["ecommerce", "minimal", "promo"]),
  "brand-sign": new Set(["inline", "stacked", "signature"]),
  "resource-list": new Set(["files", "steps", "minimal"]),
  "testimonial-card": new Set(["classic", "casual", "featured"]),
  "series-nav": new Set(["progress", "toc", "breadcrumb"]),
};

// ============================================================
// 常量
// ============================================================

/** 支持的 Theme System 版本范围 */
export const SUPPORTED_SDK_VERSIONS = ["1.0.0"] as const;

/** density 合法值 */
export const LEGAL_DENSITY_VALUES = ["low", "medium", "high"] as const;
