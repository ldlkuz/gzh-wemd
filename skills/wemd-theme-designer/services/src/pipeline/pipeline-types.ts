// ============================================================
// Pipeline 专用类型
// ============================================================

// ── 14 色标准色板 ──
export const COLOR_KEYS = [
  "primary",
  "primaryLight",
  "primaryDark",
  "secondary",
  "accent",
  "background",
  "surface",
  "textPrimary",
  "textSecondary",
  "textCaption",
  "border",
  "divider",
  "success",
  "warning",
] as const;

export type ColorKey = (typeof COLOR_KEYS)[number];

// ── 约束检查结果 ──
export interface ConstraintResult {
  passed: boolean;
  errors: ConstraintViolation[];
  warnings: ConstraintViolation[];
}

export interface ConstraintViolation {
  rule: string;
  severity: "error" | "warning";
  message: string;
  detail?: string;
}

// ── 组件变体 ──
export interface ComponentVariant {
  component: string;
  variant: string;
  variantCss: string;
  reason: string;
}

// ── 质量评分 ──
export interface QualityScore {
  brandConsistency: number;
  readingExperience: number;
  componentCoverage: number;
  constraintCompliance: number;
  conceptConsistency?: number;
}

// ── Compiler 输出 ──
export interface CompiledTheme {
  manifest: Record<string, unknown>;
  variantCss: Record<string, string>;
  warnings: string[];
  brandDoc: string;          // brand.md 内容
  zipPath?: string;          // 生成的 .wemd-theme 文件路径
}

// ── DecorationPlan 类型（从 decoration-layer.ts 引用） ──
export interface DecorationPlan {
  brandFilter: {
    keywords: string[];
    allowedAtoms: string[];
    density: "low" | "medium" | "high";
  };
  components: Record<string, ComponentDecoration>;
}

export interface ComponentDecoration {
  variant: string;
  atoms: DecorationAtom[];
}

export interface DecorationAtom {
  id: string;
  params: Record<string, string | number>;
}

export interface MapResult {
  css: Record<string, string>;
  html: Record<string, string>;
}