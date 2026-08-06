// ============================================================
// Feedback Layer — 质量评估
// ============================================================
// 评估主题设计质量，输出 5 维度评分。
// 支持两种模式：
//   1. Blueprint 模式（旧）：仅评估蓝图质量
//   2. 全量组件模式（新）：评估 44 个组件的实际生成质量

import type { QualityScore } from "./pipeline-types.ts";

// ── 组件 CSS 质量检查结果 ──
export interface ComponentCssCheck {
  component: string;
  hasVariantSelector: boolean;     // 选择器格式正确
  hasHardcodedColor: boolean;      // 硬编码颜色
  hasPseudoElement: boolean;       // 使用了 ::before/::after
  hasForbiddenPosition: boolean;   // 使用了 fixed/sticky
  hasAnimation: boolean;           // 使用了 @keyframes/animation
  hasFilter: boolean;              // 使用了 filter/backdrop-filter
  cssLineCount: number;            // CSS 行数
  subElementCoverage: number;      // 子元素覆盖率（0-1）
}

// ── 主入口：评估质量（全量组件模式） ──
export function evaluateQuality(
  blueprint: Record<string, unknown>,
  constraintPassed: boolean,
  warnings: string[],
  componentChecks?: ComponentCssCheck[]
): {
  scores: QualityScore;
  passed: boolean;
  suggestions: string[];
  summary: string;
} {
  const scores: QualityScore = {
    brandConsistency: scoreBrandConsistency(blueprint),
    readingExperience: scoreReadingExperience(blueprint),
    componentCoverage: scoreComponentCoverage(componentChecks),
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
  if (scores.componentCoverage < 90) {
    const failed = componentChecks?.filter(c =>
      !c.hasVariantSelector || c.hasPseudoElement || c.hasForbiddenPosition ||
      c.hasAnimation || c.hasFilter || c.cssLineCount < 5
    ) || [];
    if (failed.length > 0) {
      suggestions.push(`以下组件 CSS 质量待改进: ${failed.slice(0, 5).map(c => c.component).join(", ")}${failed.length > 5 ? " 等" : ""}`);
    }
  }
  if (!constraintPassed) {
    suggestions.push("修复约束检查错误后再编译");
  }

  for (const w of warnings) {
    suggestions.push(`注意: ${w}`);
  }

  // 各项是否通过（F3 组件覆盖要求 ≥ 90，因为必须 44 个全覆盖）
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

// ── F3: 组件覆盖与 CSS 质量 ──
// 新方案：44 个组件全量生成，评分基于实际 CSS 质量
function scoreComponentCoverage(componentChecks?: ComponentCssCheck[]): number {
  if (!componentChecks || componentChecks.length === 0) return 0;

  const LEGAL_COUNT = 44;
  const covered = componentChecks.length;

  // 覆盖率：必须 44 个全到位
  const coverageRatio = covered / LEGAL_COUNT;
  if (coverageRatio < 1) {
    return Math.round(coverageRatio * 60); // 不全覆盖最多 60 分
  }

  // 全覆盖后，评估 CSS 质量
  let qualityScore = 100;
  let qualityDeductions = 0;

  for (const check of componentChecks) {
    const issues: string[] = [];

    // 选择器格式不正确 — 严重
    if (!check.hasVariantSelector) issues.push("selector");

    // 硬编码颜色 — 警告级
    if (check.hasHardcodedColor) issues.push("hardcoded-color");

    // 违规属性 — 严重
    if (check.hasPseudoElement) issues.push("pseudo-element");
    if (check.hasForbiddenPosition) issues.push("forbidden-position");
    if (check.hasAnimation) issues.push("animation");
    if (check.hasFilter) issues.push("filter");

    // CSS 过短 — 可能只是占位符
    if (check.cssLineCount < 5) issues.push("too-short");

    // 子元素覆盖率低
    if (check.subElementCoverage < 0.5) issues.push("low-coverage");

    // 每个问题扣分
    const severeCount = issues.filter(i =>
      i !== "hardcoded-color" && i !== "low-coverage"
    ).length;
    const warningCount = issues.filter(i =>
      i === "hardcoded-color" || i === "low-coverage"
    ).length;

    qualityDeductions += severeCount * 3 + warningCount * 1;
  }

  qualityScore = Math.max(0, 100 - qualityDeductions);

  return qualityScore;
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

// ── 辅助：检查单个组件 CSS 的合规性 ──
export function checkComponentCss(
  component: string,
  variantCss: string,
  sourceHtml: string
): ComponentCssCheck {
  const css = variantCss || "";

  // 选择器格式：#wemd .wemd-xxx[data-variant="yyy"]
  const selectorRegex = new RegExp(
    `#wemd\\s+\\.wemd-${component.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\[data-variant=`
  );
  const hasVariantSelector = selectorRegex.test(css);

  // 硬编码颜色（hex 或 rgb，不在 var() 内）
  const hardcodedColorRegex = /#([0-9a-fA-F]{3,8})\b|rgba?\(/g;
  const varWrappedRegex = /var\(--wemd-/;
  const hasHardcodedColor = hardcodedColorRegex.test(css) && !varWrappedRegex.test(css);

  // 伪元素
  const hasPseudoElement = /::before|::after/.test(css);

  // 禁止的定位
  const hasForbiddenPosition = /position:\s*(fixed|sticky)/.test(css);

  // 动画
  const hasAnimation = /@keyframes|animation\s*:/.test(css);

  // 滤镜
  const hasFilter = /backdrop-filter\s*:|filter\s*:/.test(css);

  // CSS 行数
  const cssLineCount = css.split("\n").filter((l) => l.trim().length > 0).length;

  // 子元素覆盖率：从 HTML 提取 class 名，检查 CSS 中是否覆盖
  const htmlClassRegex = /class="[^"]*"/g;
  const classMatches = sourceHtml.match(htmlClassRegex) || [];
  const subClasses = new Set<string>();
  for (const match of classMatches) {
    const classNames = match.replace(/class="/, "").replace(/"/, "").split(/\s+/);
    for (const cls of classNames) {
      if (cls.startsWith("wemd-") && cls !== `wemd-${component}`) {
        subClasses.add(cls);
      }
    }
  }

  let subElementCoverage = 1;
  if (subClasses.size > 0) {
    let covered = 0;
    for (const cls of subClasses) {
      if (css.includes(cls)) covered++;
    }
    subElementCoverage = covered / subClasses.size;
  }

  return {
    component,
    hasVariantSelector,
    hasHardcodedColor,
    hasPseudoElement,
    hasForbiddenPosition,
    hasAnimation,
    hasFilter,
    cssLineCount,
    subElementCoverage,
  };
}