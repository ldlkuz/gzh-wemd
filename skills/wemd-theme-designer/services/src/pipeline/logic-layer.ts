// ============================================================
// Logic Layer — 设计决策生成
// ============================================================
// 输入：Profile → 输出：Design Blueprint
// 基于规则的关键词映射引擎，无需 LLM 调用。

import type { COLOR_KEYS } from "./pipeline-types.ts";

// ── 关键词 → 设计风格映射 ──
const KEYWORD_STYLE_MAP: Record<string, {
  rhythm: "fast" | "medium" | "slow";
  density: "low" | "medium" | "high";
  emotion: string;
  visualWeight: string;
  narrative: string;
  whitespace: string;
  decorationLevel: "minimal" | "moderate" | "rich";
  patternStyle: "geometric" | "organic" | "minimal";
}> = {
  "科技": {
    rhythm: "fast", density: "medium", emotion: "前沿科技感",
    visualWeight: "轻量锐利", narrative: "数据驱动", whitespace: "充足呼吸感",
    decorationLevel: "minimal", patternStyle: "geometric",
  },
  "创新": {
    rhythm: "fast", density: "medium", emotion: "活力创新",
    visualWeight: "动感", narrative: "故事化叙事", whitespace: "适中",
    decorationLevel: "moderate", patternStyle: "geometric",
  },
  "专业": {
    rhythm: "medium", density: "medium", emotion: "专业可信赖",
    visualWeight: "稳重", narrative: "逻辑清晰", whitespace: "充足",
    decorationLevel: "minimal", patternStyle: "geometric",
  },
  "AI": {
    rhythm: "fast", density: "medium", emotion: "前沿智能",
    visualWeight: "轻量科技", narrative: "数据驱动", whitespace: "充足呼吸感",
    decorationLevel: "minimal", patternStyle: "geometric",
  },
  "温暖": {
    rhythm: "slow", density: "low", emotion: "温暖亲切",
    visualWeight: "柔和", narrative: "故事化", whitespace: "充裕",
    decorationLevel: "rich", patternStyle: "organic",
  },
  "简约": {
    rhythm: "medium", density: "low", emotion: "干净清爽",
    visualWeight: "轻盈", narrative: "直白简洁", whitespace: "大量留白",
    decorationLevel: "minimal", patternStyle: "minimal",
  },
  "文艺": {
    rhythm: "slow", density: "low", emotion: "文艺雅致",
    visualWeight: "细腻", narrative: "散文式", whitespace: "充裕诗意",
    decorationLevel: "moderate", patternStyle: "organic",
  },
  "商务": {
    rhythm: "medium", density: "high", emotion: "专业高效",
    visualWeight: "稳重", narrative: "结构化", whitespace: "适中",
    decorationLevel: "minimal", patternStyle: "geometric",
  },
  "教育": {
    rhythm: "medium", density: "medium", emotion: "亲和知识",
    visualWeight: "平衡", narrative: "循序渐进", whitespace: "充足",
    decorationLevel: "moderate", patternStyle: "organic",
  },
  "健康": {
    rhythm: "slow", density: "low", emotion: "清新自然",
    visualWeight: "柔和", narrative: "娓娓道来", whitespace: "充裕",
    decorationLevel: "moderate", patternStyle: "organic",
  },
};

// ── 默认风格（fallback） ──
const DEFAULT_STYLE = {
  rhythm: "medium" as const,
  density: "medium" as const,
  emotion: "专业平衡",
  visualWeight: "平衡",
  narrative: "逻辑清晰",
  whitespace: "充足",
  decorationLevel: "moderate" as const,
  patternStyle: "geometric" as const,
};

// ── 关键词 → 组件映射 ──
const KEYWORD_COMPONENT_MAP: Record<string, string[]> = {
  "科技": ["hero-banner", "stats-block", "code-block", "image-compare"],
  "创新": ["hero-banner", "timeline", "image-compare", "callout"],
  "专业": ["hero-banner", "stats-block", "table", "accordion"],
  "AI": ["hero-banner", "code-block", "image-compare", "steps"],
  "温暖": ["hero-banner", "testimonial-card", "brand-sign", "divider"],
  "简约": ["hero-banner", "divider", "brand-sign", "callout"],
  "文艺": ["hero-banner", "divider", "pullquote", "brand-sign"],
  "商务": ["hero-banner", "stats-block", "table", "accordion"],
  "教育": ["hero-banner", "steps", "callout", "code-block"],
  "健康": ["hero-banner", "testimonial-card", "divider", "brand-sign"],
};

// ── 合法组件列表（完整 42 种） ──
const LEGAL_COMPONENTS = [
  "hero-banner", "toc-nav", "numbered-heading", "section-title", "quote-card",
  "callout-pro", "stats-block", "faq", "share-card", "cta-card",
  "tag-label", "follow-bar", "divider-fancy", "styled-table", "timeline",
  "code-frame", "article-section", "magazine-cover", "section-divider", "image-card",
  "text-card", "full-quote", "two-column-cards", "end-card", "product-card",
  "brand-sign", "resource-list", "testimonial-card", "series-nav",
  "code-block", "image-compare", "callout", "table", "accordion", "steps",
  "divider", "pullquote", "related-posts", "image-grid", "author-card",
  "copyright-notice", "qr-card", "image-text-row", "image-caption",
];

// ── 关键词 → 布局策略 ──
const KEYWORD_LAYOUT_MAP: Record<string, {
  pageStructure: string;
  paragraphStyle: string;
  hierarchy: string;
  preferredComponentCount: string;
}> = {
  "科技": {
    pageStructure: "封面大图+数据区块+正文交替",
    paragraphStyle: "短段落，多留白",
    hierarchy: "h1 大标题吸引注意，h2 清晰分割",
    preferredComponentCount: "5-7",
  },
  "温暖": {
    pageStructure: "亲和封面+故事正文+签名结尾",
    paragraphStyle: "中长段落，娓娓道来",
    hierarchy: "h1 柔和，h2 自然过渡",
    preferredComponentCount: "3-5",
  },
  "简约": {
    pageStructure: "简洁封面+单列正文",
    paragraphStyle: "短段落，大量留白",
    hierarchy: "h1 突出，h2 极简",
    preferredComponentCount: "2-4",
  },
  "商务": {
    pageStructure: "专业封面+数据区块+正文+表格",
    paragraphStyle: "中短段落，结构化",
    hierarchy: "h1 正式，h2 层次分明",
    preferredComponentCount: "5-7",
  },
};

// ── 主入口：生成 Design Blueprint ──
export function generateDesignBlueprint(
  profile: Record<string, unknown>,
  profileType: "brand" | "creator",
  designMemory?: {
    componentStyles?: Record<string, string>;
    rejectedApproaches?: string[];
    preferences?: {
      patternDensity?: "low" | "medium" | "high";
      decorationLevel?: "minimal" | "moderate" | "rich";
      cornerStyle?: "rounded" | "sharp" | "mixed";
    };
  }
): Record<string, unknown> {
  const keywords = (profile.keywords as string[]) || [];
  const primaryColor = (profile.primaryColor as string) || "#3B82F6";

  // 1. 从关键词合成设计风格
  const style = synthesizeStyle(keywords);

  // 2. 应用 Design Memory 偏好覆盖
  if (designMemory?.preferences) {
    const prefs = designMemory.preferences;
    // decorationLevel 从 memory 覆盖
    if (prefs.decorationLevel) {
      style.decorationLevel = prefs.decorationLevel;
    }
    // patternStyle 从 cornerStyle 推断
    if (prefs.cornerStyle === "rounded") {
      // 保持原有关键词推断，不做强制覆盖
    }
  }

  // 3. 过滤被拒绝过的方案
  const rejected = designMemory?.rejectedApproaches || [];
  const activeKeywords = keywords.filter((k) => !rejected.includes(`keyword:${k}`));

  // 4. 生成色板
  const colors = generateColorPalette(primaryColor, style.emotion);

  // 5. 生成组件映射（考虑已确认的组件风格）
  const componentExpression = generateComponentExpression(
    activeKeywords,
    profileType,
    designMemory?.componentStyles
  );

  // 6. 生成布局策略
  const layoutStrategy = generateLayoutStrategy(activeKeywords, profileType);

  // 7. 生成排版配置
  const typography = generateTypography(style);

  return {
    readingExperience: {
      tone: profileType === "creator"
        ? "亲切对话，像朋友聊天般自然"
        : "专业稳重，保持信息传递的清晰与可信",
      rhythm: style.rhythm,
      density: style.density,
      emotion: style.emotion,
      visualWeight: style.visualWeight,
      narrative: style.narrative,
      whitespace: style.whitespace,
      intimacy: profileType === "creator" ? "亲切对话感" : undefined,
    },
    expression: profileType === "brand"
      ? generateBrandExpression(keywords, style)
      : generateConceptExpression(keywords, style),
    componentExpression,
    visualLanguage: {
      colors,
      typography,
      spacing: {
        unit: "em",
        paragraphSpacing: "1.5em",
        sectionSpacing: "2.5em",
        componentPadding: "1.25em",
        articleMargin: "0 auto",
      },
      border: {
        radius: style.patternStyle === "organic" ? "12px" : "6px",
        style: "solid",
        width: "1px",
        color: colors.border as string,
      },
      shadow: {
        enabled: false, // 微信公众号不支持 box-shadow
        level: "soft" as const,
        color: "rgba(0,0,0,0.08)",
      },
    },
    layoutStrategy,
    logicVersion: "1.0.0",
    generatedAt: new Date().toISOString(),
    designMemory: designMemory ? {
      appliedPreferences: designMemory.preferences,
      filteredRejected: rejected.length,
      reusedComponentStyles: designMemory.componentStyles
        ? Object.keys(designMemory.componentStyles).length
        : 0,
    } : undefined,
  };
}

// ── 合成设计风格 ──
function synthesizeStyle(keywords: string[]) {
  const matched = keywords
    .map((k) => KEYWORD_STYLE_MAP[k])
    .filter(Boolean);

  if (matched.length === 0) return { ...DEFAULT_STYLE };

  // 合并多个关键词风格（取多数值）
  const rhythm = majority(matched.map((m) => m.rhythm)) as "fast" | "medium" | "slow";
  const density = majority(matched.map((m) => m.density)) as "low" | "medium" | "high";
  const decorationLevel = majority(matched.map((m) => m.decorationLevel)) as "minimal" | "moderate" | "rich";
  const patternStyle = majority(matched.map((m) => m.patternStyle)) as "geometric" | "organic" | "minimal";

  return {
    rhythm,
    density,
    emotion: matched.map((m) => m.emotion).join("、"),
    visualWeight: matched[0].visualWeight,
    narrative: matched[0].narrative,
    whitespace: matched[0].whitespace,
    decorationLevel,
    patternStyle,
  };
}

// ── 生成配色方案 ──
function generateColorPalette(primary: string, emotion: string): Record<string, string> {
  // 从主色推导 14 色
  const r = parseInt(primary.slice(1, 3), 16);
  const g = parseInt(primary.slice(3, 5), 16);
  const b = parseInt(primary.slice(5, 7), 16);

  const lighten = (factor: number) =>
    `rgb(${Math.min(255, r + factor)},${Math.min(255, g + factor)},${Math.min(255, b + factor)})`;
  const darken = (factor: number) =>
    `rgb(${Math.max(0, r - factor)},${Math.max(0, g - factor)},${Math.max(0, b - factor)})`;

  return {
    primary,
    primaryLight: lighten(60),
    primaryDark: darken(40),
    secondary: `rgb(${g},${b},${r})`,
    accent: `rgb(${b},${r},${g})`,
    background: "#FFFFFF",
    surface: "#F8FAFC",
    textPrimary: "#1A1A2E",
    textSecondary: "#64748B",
    textCaption: "#94A3B8",
    border: "#E2E8F0",
    divider: "#F1F5F9",
    success: "#10B981",
    warning: "#F59E0B",
  };
}

// ── 生成品牌表达策略 ──
function generateBrandExpression(keywords: string[], style: ReturnType<typeof synthesizeStyle>) {
  const keywordSummary = keywords.length > 0 ? keywords.join("、") : "通用";
  return {
    type: "brand",
    strategy: `品牌「${keywordSummary}」风格在公众号中的表达策略：Logo 置顶强化品牌认知，` +
      `品牌色 ${style.decorationLevel === "rich" ? "大面积使用营造沉浸感" : "克制使用保持专业感"}，` +
      `辅助图形以 ${style.patternStyle} 纹样点缀，` +
      `整体传达「${style.emotion}」的品牌调性`,
    logoUsage: keywords.includes("简约") ? "header-only" : "header-and-footer",
    sloganPlacement: "hero",
    patternStyle: style.patternStyle,
    decorationLevel: style.decorationLevel,
    colorStrategy: "complementary",
  };
}

// ── 生成概念表达策略 ──
function generateConceptExpression(keywords: string[], style: ReturnType<typeof synthesizeStyle>) {
  const keywordSummary = keywords.length > 0 ? keywords.join("、") : "通用";
  const coreMetaphor = keywords.includes("科技") ? "数字浪潮" : "自然生长";
  return {
    type: "concept",
    strategy: `以「${coreMetaphor}」为核心视觉隐喻，围绕「${keywordSummary}」关键词展开设计：` +
      `用 ${style.patternStyle === "geometric" ? "几何元素" : "有机形态"} 构建视觉语言，` +
      `节奏 ${style.rhythm === "fast" ? "明快富有动感" : "舒缓从容"}，` +
      `整体传达「${style.emotion}」的阅读体验`,
    coreMetaphor,
    conceptElements: [
      { name: "wave", meaning: "持续进步", visualForm: "弧形线条", usage: "封面装饰", frequency: "always" },
      { name: "dot", meaning: "信息节点", visualForm: "圆点阵列", usage: "分割装饰", frequency: "chapter-start" },
    ],
    mood: style.emotion,
    colorPsychology: "传达" + style.emotion + "的视觉感受",
    visualTension: style.rhythm === "fast" ? "high" : "medium",
  };
}

// ── 生成组件映射 ──
function generateComponentExpression(
  keywords: string[],
  profileType: "brand" | "creator",
  componentStyles?: Record<string, string>
) {
  // 收集关键词匹配的组件
  const matchedComponents = new Set<string>();
  for (const kw of keywords) {
    const comps = KEYWORD_COMPONENT_MAP[kw];
    if (comps) comps.forEach((c) => matchedComponents.add(c));
  }

  // 确保最少 4 个组件
  const defaultComponents = ["hero-banner", "divider", "brand-sign", "callout"];
  const componentList = [...matchedComponents];

  // 品牌项目需包含 brand-sign 组件（插入到列表开头，确保被 slice 包含）
  if (profileType === "brand" && !componentList.includes("brand-sign")) {
    componentList.unshift("brand-sign");
  }
  // 创作者项目需包含 author-card 组件
  if (profileType === "creator" && !componentList.includes("author-card")) {
    componentList.push("author-card");
  }

  while (componentList.length < 4) {
    const dc = defaultComponents[componentList.length];
    if (!componentList.includes(dc)) componentList.push(dc);
  }

  // 生成映射表（考虑已确认的组件风格）
  const maxComponents = profileType === "brand" ? 9 : 8; // 品牌项目多一个 brand-sign 槽位
  const mappedComponents = componentList.slice(0, maxComponents).map((comp, i) => {
    // 如果 Design Memory 中已有该组件的确认风格，复用
    const confirmedVariant = componentStyles?.[comp];
    if (confirmedVariant) {
      return {
        component: comp,
        variant: confirmedVariant,
        reason: `复用已确认风格: ${confirmedVariant}`,
        visualRole: i === 0 ? "视觉焦点" : "内容支撑",
      };
    }
    return {
      component: comp,
      variant: `${comp}-${profileType}-${i === 0 ? "featured" : "default"}`,
      reason: `匹配${keywords[i % keywords.length] || "通用"}风格`,
      visualRole: i === 0 ? "视觉焦点" : "内容支撑",
    };
  });

  return {
    mappedComponents,
    componentFlow: componentList.slice(0, 6),
    specialTreatments: [
      {
        component: "hero-banner",
        treatment: "使用渐变背景 + 品牌色覆盖",
        cssHint: "background: linear-gradient(135deg, var(--wemd-primary), var(--wemd-primaryDark))",
      },
    ],
  };
}

// ── 生成布局策略 ──
function generateLayoutStrategy(
  keywords: string[],
  profileType: "brand" | "creator"
) {
  // 匹配关键词布局
  for (const kw of keywords) {
    const layout = KEYWORD_LAYOUT_MAP[kw];
    if (layout) {
      return {
        ...layout,
        componentFlow: "自然过渡，组件之间用 divider 分隔",
      };
    }
  }

  return {
    pageStructure: profileType === "brand"
      ? "品牌封面+正文+数据区块+品牌签名结尾"
      : "亲和封面+正文+互动区块+个人签名结尾",
    paragraphStyle: "中短段落，层次分明",
    hierarchy: "h1 吸引注意，h2 清晰分割，h3 补充细节",
    componentFlow: "自然过渡，组件之间用 divider 分隔",
    preferredComponentCount: "4-6",
  };
}

// ── 生成排版配置 ──
function generateTypography(style: ReturnType<typeof synthesizeStyle>) {
  const isFast = style.rhythm === "fast";
  return {
    headingFont: "system-ui, -apple-system, sans-serif",
    bodyFont: "system-ui, -apple-system, sans-serif",
    h1Size: isFast ? "1.75em" : "1.5em",
    h2Size: isFast ? "1.35em" : "1.25em",
    h3Size: "1.15em",
    h4Size: "1.05em",
    bodySize: "15px",
    lineHeight: "1.75",
    headingWeight: "700",
  };
}

// ── 辅助：取多数值 ──
function majority<T extends string>(values: T[]): T {
  const counts = new Map<T, number>();
  for (const v of values) {
    counts.set(v, (counts.get(v) || 0) + 1);
  }
  let maxCount = 0;
  let maxValue = values[0];
  for (const [v, c] of counts) {
    if (c > maxCount) {
      maxCount = c;
      maxValue = v;
    }
  }
  return maxValue;
}

// ── 生成 BrandSystem ──
export function generateBrandSystem(
  profile: Record<string, unknown>,
  profileType: "brand" | "creator",
  blueprint: Record<string, unknown>
): Record<string, unknown> {
  const keywords = (profile.keywords as string[]) || [];
  const visual = blueprint.visualLanguage as Record<string, unknown> | undefined;
  const colors = (visual?.colors as Record<string, string>) || {};
  const expression = blueprint.expression as Record<string, unknown> | undefined;
  const readingExp = blueprint.readingExperience as Record<string, unknown> | undefined;

  // 根据关键词推断品牌原则
  const principles = generatePrinciples(keywords, profileType);

  // 生成资产策略
  const assetPolicy = generateAssetPolicy(keywords, expression);

  // 生成组件规则
  const componentRules = {
    density: (readingExp?.density as "low" | "medium" | "high") || "medium",
    tone: keywords.length > 0 ? keywords : ["modern"],
    forbiddenFeatures: ["box-shadow", "position:fixed", "position:sticky", "::before", "::after", "filter"],
  };

  // 生成 Token
  const tokens = {
    colors: Object.fromEntries(
      Object.entries(colors).map(([key, val]) => [`--wemd-${key}`, val])
    ),
    typography: (visual?.typography as Record<string, unknown>) || {},
    spacing: {
      paragraphSpacing: 1.5,
      sectionSpacing: 2.5,
      componentPadding: 1.25,
      articleMargin: 0,
    },
    radius: {
      sm: 4,
      md: 8,
      lg: 12,
      xl: 16,
    },
    border: {
      width: 1,
      style: "solid",
    },
  };

  return {
    brandId: `${(profile.name as string) || "brand"}-${Date.now().toString(36)}`,
    principles,
    tokens,
    assetPolicy,
    componentRules,
    profileType,
    generatedAt: new Date().toISOString(),
  };
}

// ── 生成品牌原则 ──
function generatePrinciples(
  keywords: string[],
  profileType: "brand" | "creator"
): string[] {
  if (profileType === "creator") {
    return [
      "保持个人风格一致性",
      "内容优先，视觉服务于内容",
      "渐进式品牌建设",
    ];
  }

  const principles: string[] = [];
  if (keywords.includes("科技") || keywords.includes("AI")) {
    principles.push("科技感与专业度并重");
    principles.push("清晰的信息层级");
  }
  if (keywords.includes("温暖") || keywords.includes("健康")) {
    principles.push("亲和力优先");
    principles.push("柔和的视觉语言");
  }
  if (keywords.includes("简约")) {
    principles.push("少即是多");
    principles.push("留白是重要的设计元素");
  }
  if (keywords.includes("专业") || keywords.includes("商务")) {
    principles.push("专业可信赖");
    principles.push("结构化信息呈现");
  }
  if (keywords.includes("创新")) {
    principles.push("突破常规的视觉表达");
  }
  if (keywords.includes("文艺")) {
    principles.push("文艺气息与文字韵律");
  }
  if (keywords.includes("教育")) {
    principles.push("知识传递清晰高效");
    principles.push("亲和易读");
  }

  // 确保至少 3 条
  while (principles.length < 3) {
    principles.push("品牌一致性");
    principles.push("用户体验优先");
    principles.push("内容可读性");
  }

  return principles.slice(0, 5);
}

// ── 生成资产策略 ──
function generateAssetPolicy(
  keywords: string[],
  expression?: Record<string, unknown>
): Record<string, unknown> {
  const logoUsage = keywords.includes("简约")
    ? "header-only"
    : keywords.includes("商务")
    ? "header-and-footer"
    : "header-and-footer";

  const brandMarkUsage = keywords.includes("温暖") || keywords.includes("文艺")
    ? "decorative"
    : "small-components";

  return {
    logoUsage,
    brandMarkUsage,
    patternOpacityMax: 0.15,
    patternCoverageMax: 0.3,
    sloganPlacement: (expression as any)?.sloganPlacement || "hero",
    colorStrategy: (expression as any)?.colorStrategy || "complementary",
  };
}

// ── 导出合法组件列表（供约束层使用） ──
export function getLegalComponents(): string[] {
  return [...LEGAL_COMPONENTS];
}