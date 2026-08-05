// ============================================================
// 运行时类型定义（Service 层独立维护）
// ============================================================

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
  profile: Record<string, unknown>;
  designBlueprint: Record<string, unknown> | null;
  themePackage: Record<string, unknown> | null;
  designMemory: DesignMemory;
  reviewRecords: ReviewRecord[];
  decisionLog: DecisionLogEntry[];
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

// ── 组件版本 ──
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

// ── 任务 ──
export interface DesignTask {
  taskId: string;
  projectId: string;
  type: "generate-theme" | "regenerate" | "modify-component" | "compile";
  input: Record<string, unknown>;
  status: "pending" | "processing" | "done" | "failed";
  createdAt: string;
  updatedAt: string;
  error?: string;
}

// ═══════════════════════════════════════════════
// Phase 1: BrandSystem + 组件数据结构
// ═══════════════════════════════════════════════

// ── BrandSystem — 核心品牌工程规范 ──
export interface BrandSystem {
  brandId: string;
  principles: string[];
  tokens: {
    colors: Record<string, string>;
    typography: Record<string, unknown>;
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
  profileType: "brand" | "creator";
  generatedAt: string;
}

// ── 组件状态 ──
export type ComponentStatus =
  | "not-generated"
  | "draft"
  | "reviewing"
  | "revision-requested"
  | "approved"
  | "locked";

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

// ── 组件版本详情 ──
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

// ── 组件审核记录 ──
export interface ComponentReview {
  component: string;
  status: ComponentStatus;
  score?: number;
  reviewer: "human" | "ai";
  comments: string[];
  createdAt: string;
  decidedAt?: string;
}

// ── 组件决策日志 ──
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