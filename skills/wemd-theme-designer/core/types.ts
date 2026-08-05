// ============================================================
// 核心类型定义 — 融合架构的共享数据类型
// ============================================================
// 所有 core 模块从这里导入类型，避免循环依赖。

// ── 项目状态 ──
export type ProjectStatus =
  | "profile-collecting"
  | "profile-confirmed"
  | "designing"
  | "blueprint-ready"
  | "blueprint-approved"
  | "compiling"
  | "compiled"
  | "reviewing"
  | "approved"
  | "locked";

// ── 项目主体 ──
export interface DesignProject {
  id: string;
  name: string;
  profileType: "brand" | "creator";
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
  profile: BrandProfile | CreatorProfile;
  designBlueprint: DesignBlueprint | null;
  themePackage: ThemePackage | null;
  designMemory: DesignMemory;
  reviewRecords: ReviewRecord[];
  decisionLog: DecisionLogEntry[];
}

// ── Profile（企业品牌） ──
export interface BrandProfile {
  profileType: "brand";
  brandName: string;
  logo: File | null;
  description: string;
  keywords: string[];
  primaryColor?: string;
  website?: string;
  slogan?: string;
  brandSpec?: File;
}

// ── Profile（自由创作者） ──
export interface CreatorProfile {
  profileType: "creator";
  name: string;
  contentDirection: string;
  keywords: string[];
  primaryColor?: string;
  logo?: File | null;
  reference?: string;
  slogan?: string;
}

// ── Design Blueprint ──
export interface DesignBlueprint {
  readingExperience: {
    rhythm: "fast" | "medium" | "slow";
    density: "low" | "medium" | "high";
    emotion: string;
    visualWeight: string;
    narrative: string;
    whitespace: string;
    intimacy?: string;
  };
  expression: BrandExpression | ConceptExpression;
  componentExpression: ComponentExpression;
  visualLanguage: {
    colors: Record<string, string>;
    typography: TypographyConfig;
    spacing: SpacingConfig;
    border: BorderConfig;
    shadow: ShadowConfig;
  };
  layoutStrategy: {
    pageStructure: string;
    paragraphStyle: string;
    hierarchy: string;
    componentFlow: string;
    preferredComponentCount: string;
  };
}

// ── 品牌表达策略 ──
export interface BrandExpression {
  type: "brand";
  logoUsage: "header-only" | "header-and-footer" | "every-article-start";
  sloganPlacement: "hero" | "footer" | "none";
  patternStyle: "geometric" | "organic" | "minimal";
  decorationLevel: "minimal" | "moderate" | "rich";
  colorStrategy: "monochrome" | "complementary" | "analogous";
}

// ── 概念表达策略 ──
export interface ConceptExpression {
  type: "concept";
  coreMetaphor: string;
  conceptElements: ConceptElement[];
  mood: string;
  colorPsychology: string;
  visualTension: "low" | "medium" | "high";
}

export interface ConceptElement {
  name: string;
  meaning: string;
  visualForm: string;
  usage: string;
  frequency: "always" | "chapter-start" | "key-sections";
}

// ── 组件表达映射 ──
export interface ComponentExpression {
  mappedComponents: ComponentMapping[];
  componentFlow: string[];
  specialTreatments: SpecialTreatment[];
}

export interface ComponentMapping {
  component: string;
  variant: string;
  reason: string;
  visualRole: string;
}

export interface SpecialTreatment {
  component: string;
  treatment: string;
  cssHint: string;
}

// ── 视觉语言配置 ──
export interface TypographyConfig {
  headingFont: string;
  bodyFont: string;
  h1Size: string;
  h2Size: string;
  h3Size: string;
  h4Size: string;
  bodySize: string;
  lineHeight: string;
  headingWeight: string;
}

export interface SpacingConfig {
  paragraphSpacing: string;
  sectionSpacing: string;
  componentPadding: string;
  articleMargin: string;
}

export interface BorderConfig {
  radius: string;
  style: "solid" | "dashed" | "none";
  width: string;
  color: string;
}

export interface ShadowConfig {
  enabled: boolean;
  level: "soft" | "medium" | "strong";
  color: string;
}

// ── Theme Package ──
export interface ThemePackage {
  manifest: Record<string, unknown>;
  filePath: string;
  slug: string;
  version: string;
}

// ── Design Memory ──
export interface DesignMemory {
  decisions: Decision[];
  componentStyles: Record<string, string>;
  preferences: {
    patternDensity: "low" | "medium" | "high";
    decorationLevel: "minimal" | "moderate" | "rich";
    cornerStyle: "rounded" | "sharp" | "mixed";
  };
  rejectedApproaches: string[];
}

export interface Decision {
  type: "style" | "component" | "color" | "typography" | "layout";
  key: string;
  value: string;
  reason: string;
  confirmedAt: string;
  source: "ai-proposal" | "user-feedback" | "review";
}

// ── 审核记录 ──
export interface ReviewRecord {
  reviewId: string;
  projectId: string;
  stage: "blueprint" | "theme";
  status: "pending" | "approved" | "rejected";
  score?: number;
  feedback?: string;
  reviewedBy: "user" | "ai";
  createdAt: string;
  decidedAt?: string;
}

// ── 决策日志 ──
export interface DecisionLogEntry {
  version: number;
  stage: string;
  decision: "approved" | "rejected" | "revised";
  reason: string;
  timestamp: string;
}

// ── 组件版本（来自 version.ts） ──
export interface ComponentVersion {
  version: number;
  component: string;
  variant: string;
  variantCss: string;
  createdAt: string;
  createdBy: "ai" | "user";
  status: "draft" | "reviewing" | "approved" | "locked";
  changeLog: string;
  parentVersion?: number;
}

// ── Feedback Report（来自 service.ts） ──
export interface FeedbackReport {
  scores: {
    brandConsistency: number;
    readingExperience: number;
    componentCoverage: number;
    constraintCompliance: number;
    conceptConsistency?: number;
  };
  passed: boolean;
  suggestions: string[];
}

// ── 素材 ──
export interface Material {
  element: string;
  usage: string;
  svg: string;
  createdAt: string;
}

// ═══════════════════════════════════════════════
// Phase 1 新增类型 — BrandSystem / 组件数据结构
// ═══════════════════════════════════════════════

// ── BrandSystem — 核心品牌工程规范 ──
export interface BrandSystem {
  brandId: string;
  principles: string[];
  tokens: {
    colors: Record<string, string>;
    typography: TypographyConfig;
    spacing: Record<string, number>;
    radius: Record<string, number>;
    border: { width: number; style: string };
  };
  assetPolicy: {
    logoUsage: "cover-footer" | "header-only" | "header-and-footer" | "every-article-start";
    brandMarkUsage: "small-components" | "decorative" | "heading-only";
    patternOpacityMax: number;
    patternCoverageMax: number;
  };
  componentRules: {
    density: "low" | "medium" | "high";
    tone: string[];
    forbiddenFeatures: string[];
  };
}

// ── 组件状态（详细版） ──
export type ComponentStatus =
  | "not-generated"
  | "draft"
  | "reviewing"
  | "revision-requested"
  | "approved"
  | "locked"
  | "failed";

// ── 组件版本详情（含 sourceHtml/publishHtml/compatibility） ──
export interface ComponentVersionDetail {
  version: number;
  component: string;
  variant: string;
  variantCss: string;
  createdAt: string;
  createdBy: "ai" | "user";
  status: ComponentStatus;
  changeLog: string;
  parentVersion?: number;
  instruction: string;
  sourceHtml: string;
  publishHtml: string;
  assetRefs: string[];
  compatibility: {
    status: "passed" | "passed-with-warnings" | "failed";
    warnings: string[];
    errors: string[];
  };
}

// ── 完整组件 ──
export interface BrandComponent {
  id: string;
  type: string;
  name: string;
  status: ComponentStatus;
  currentVersion: number;
  approvedVersion: number | null;
  contentSchema: Record<string, unknown>;
  assetRefs: string[];
  versions: ComponentVersionDetail[];
  review: ComponentReview | null;
  decisions: ComponentDecision[];
}

// ── 组件级审核记录 ──
export interface ComponentReview {
  component: string;
  status: ComponentStatus;
  score?: number;
  reviewer: "human" | "ai";
  comments: string[];
  createdAt: string;
  decidedAt?: string;
}

// ── 组件级决策日志 ──
export interface ComponentDecision {
  version: number;
  decision: "approve" | "reject" | "revise";
  reason: string;
  timestamp: string;
}

// ── 组件级 Design Memory ──
export interface ComponentDesignMemory {
  style: string;
  decisions: string[];
  updatedAt: string;
}

// ── Asset Manifest ──
export interface AssetManifest {
  assets: BrandAsset[];
}

export interface BrandAsset {
  id: string;
  type: "logo" | "brand-mark" | "pattern" | "divider" | "icon" | "cover-decoration";
  sourceFormat: "svg" | "png";
  sourcePath: string;
  fallbackPath?: string;
  usage: string[];
}