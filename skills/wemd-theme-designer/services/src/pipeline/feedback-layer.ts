// ============================================================
// Feedback Layer — 质量评估
// ============================================================
// 评估 Design Blueprint 的设计质量，输出 5 维度评分。

import type { QualityScore } from "./pipeline-types.ts";

// ── 主入口：评估质量 ──
export function evaluateQuality(
  blueprint: Record<string, unknown>,
  constraintPassed: boolean,
  warnings: string[]
): {
  scores: QualityScore;
  passed: boolean;
  suggestions: string[];
  summary: string;
} {
  const scores: QualityScore = {
    brandConsistency: scoreBrandConsistency(blueprint),
    readingExperience: scoreReadingExperience(blueprint),
    componentCoverage: scoreComponentCoverage(blueprint),
    constraintCompliance: constraintPassed ? 100 : 60,
  };

  const expression = blueprint.expression as Record<string, unknown> | undefined;
  if (expression?.type === "concept") {
    scores.conceptConsistency = scoreConceptConsistency(blueprint);
  }

  const suggestions: string[] = [];

  if (scores.brandConsistency < 70) {
    suggestions.push("增加品牌元素在组件中的使用频率");
  }
  if (scores.readingExperience < 70) {
    suggestions.push("调整排版参数改善阅读体验");
  }
  if (scores.componentCoverage < 70) {
    suggestions.push("增加更多组件映射覆盖");
  }
  if (!constraintPassed) {
    suggestions.push("修复约束检查错误后再编译");
  }

  for (const w of warnings) {
    suggestions.push(`注意: ${w}`);
  }

  // 各项是否通过
  const allPassed = Object.values(scores).every((s) => s >= 70);
  const passed = allPassed && constraintPassed;

  const avg = Object.values(scores).reduce((a, b) => a + b, 0) / Object.values(scores).length;

  const summary = passed
    ? `质量评估通过 (${Math.round(avg)}/100)`
    : `需要改进 (${Math.round(avg)}/100) — ${suggestions[0] || ""}`;

  return { scores, passed, suggestions, summary };
}

// ── F1: 品牌一致性 ──
function scoreBrandConsistency(blueprint: Record<string, unknown>): number {
  const expression = blueprint.expression as Record<string, unknown> | undefined;
  const compExpr = blueprint.componentExpression as Record<string, unknown> | undefined;
  const mapped = compExpr?.mappedComponents as Array<Record<string, unknown>> | undefined;

  let score = 50;

  // 品牌 Profile 加分
  if (expression?.type === "brand") {
    score += 10;
    const logoUsage = expression.logoUsage as string;
    if (logoUsage === "header-and-footer") score += 10;
    if (logoUsage === "every-article-start") score += 15;
  }

  // 包含 brand-sign 组件加分
  if (mapped?.some((m) => m.component === "brand-sign")) {
    score += 15;
  }

  // 有 slogan 加分
  if (expression?.sloganPlacement && expression.sloganPlacement !== "none") {
    score += 10;
  }

  return Math.min(100, score);
}

// ── F2: 阅读体验 ──
function scoreReadingExperience(blueprint: Record<string, unknown>): number {
  const visual = blueprint.visualLanguage as Record<string, unknown> | undefined;
  const typography = visual?.typography as Record<string, unknown> | undefined;
  const reading = blueprint.readingExperience as Record<string, unknown> | undefined;

  let score = 50;

  // 字号合理性
  if (typography) {
    const bodySize = parseInt((typography.bodySize as string) || "0");
    if (bodySize >= 14 && bodySize <= 18) score += 15;
    if (typography.lineHeight === "1.75") score += 10;
    if (typography.headingWeight === "700") score += 5;
  }

  // 阅读体验字段完整
  if (reading) {
    if (reading.rhythm) score += 5;
    if (reading.density) score += 5;
    if (reading.whitespace) score += 5;
    if (reading.narrative) score += 5;
  }

  return Math.min(100, score);
}

// ── F3: 组件覆盖 ──
function scoreComponentCoverage(blueprint: Record<string, unknown>): number {
  const compExpr = blueprint.componentExpression as Record<string, unknown> | undefined;
  const mapped = compExpr?.mappedComponents as Array<Record<string, unknown>> | undefined;

  if (!mapped || mapped.length === 0) return 0;

  // 4 个组件以下不及格
  if (mapped.length < 4) return 40;

  // 4-6 个良好
  if (mapped.length <= 6) return 75;

  // 7 个以上优秀
  return 90;
}

// ── F5: 概念一致性（仅 Creator） ──
function scoreConceptConsistency(blueprint: Record<string, unknown>): number {
  const expression = blueprint.expression as Record<string, unknown> | undefined;
  const elements = expression?.conceptElements as Array<Record<string, unknown>> | undefined;

  if (!elements || elements.length === 0) return 40;

  let score = 50;
  if (expression.coreMetaphor) score += 20;
  if (elements.length >= 2) score += 15;
  if (expression.visualTension) score += 15;

  return Math.min(100, score);
}