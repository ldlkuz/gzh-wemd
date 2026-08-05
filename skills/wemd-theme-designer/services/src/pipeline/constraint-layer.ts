// ============================================================
// Constraint Layer — 约束检查
// ============================================================
// 检查 Design Blueprint 是否符合公众号平台和 WeMD 规范。
// 阻断式：error 阻断流程，warning 仅提示。

import type { ConstraintResult, ConstraintViolation } from "./pipeline-types.ts";
import { getLegalComponents } from "./logic-layer.ts";
import { validateProject, validateComponent } from "../validation/index.ts";

// ── 主入口：检查 Blueprint ──
export function checkBlueprintConstraints(
  blueprint: Record<string, unknown>
): ConstraintResult {
  const errors: ConstraintViolation[] = [];
  const warnings: ConstraintViolation[] = [];

  // C1: 公众号平台约束
  checkPlatformConstraints(blueprint, errors);

  // C2: WeMD 规范约束
  checkWeMDSpec(blueprint, errors);

  // C3: CSS 变量约束
  checkCSSVariables(blueprint, errors);

  // C4: Schema 校验（数据完整性）
  checkSchemaValidation(blueprint, errors, warnings);

  // C5: 品牌一致性（Warning）
  checkBrandConsistency(blueprint, warnings);

  // C6: 组件合法性
  checkComponentLegality(blueprint, errors);

  return {
    passed: errors.length === 0,
    errors,
    warnings,
  };
}

// ── C4: Schema 校验（数据完整性） ──
function checkSchemaValidation(
  blueprint: Record<string, unknown>,
  errors: ConstraintViolation[],
  warnings: ConstraintViolation[]
) {
  // 检查 Blueprint 结构完整性
  const requiredBlueprintFields = [
    "expression",
    "readingExperience",
    "visualLanguage",
    "componentExpression",
  ];

  for (const field of requiredBlueprintFields) {
    if (!blueprint[field]) {
      errors.push({
        rule: "C4",
        severity: "error",
        message: `Blueprint 缺少必填字段: ${field}`,
        detail: "Design Blueprint 必须包含 expression, readingExperience, visualLanguage, componentExpression",
      });
    }
  }

  // 检查 expression 结构
  const expression = blueprint.expression as Record<string, unknown> | undefined;
  if (expression) {
    if (!expression.type) {
      errors.push({
        rule: "C4",
        severity: "error",
        message: "expression.type 缺失，必须为 brand 或 creator",
      });
    }

    if (!expression.strategy) {
      errors.push({
        rule: "C4",
        severity: "error",
        message: "expression.strategy 缺失，必须包含品牌/概念表达策略",
      });
    }
  }

  // 检查 readingExperience 结构
  const reading = blueprint.readingExperience as Record<string, unknown> | undefined;
  if (reading) {
    if (!reading.tone) {
      errors.push({
        rule: "C4",
        severity: "error",
        message: "readingExperience.tone 缺失，必须定义阅读语气",
      });
    }

    if (!reading.density) {
      errors.push({
        rule: "C4",
        severity: "warning",
        message: "readingExperience.density 缺失，建议定义信息密度",
        detail: "可选值: low, medium, high",
      });
    }

    // 检查 density 合法性
    if (reading.density && !["low", "medium", "high"].includes(reading.density as string)) {
      errors.push({
        rule: "C4",
        severity: "error",
        message: `readingExperience.density 值非法: "${reading.density}"，应为 low/medium/high`,
      });
    }
  }

  // 检查 visualLanguage 结构
  const visual = blueprint.visualLanguage as Record<string, unknown> | undefined;
  if (visual) {
    // 检查 colors
    const colors = visual.colors as Record<string, string> | undefined;
    if (colors) {
      const requiredColors = ["primary", "primaryLight", "primaryDark", "background", "surface", "textPrimary", "textSecondary"];
      for (const key of requiredColors) {
        if (!colors[key]) {
          errors.push({
            rule: "C4",
            severity: "error",
            message: `visualLanguage.colors 缺少必需颜色: ${key}`,
          });
        }
      }

      // 检查颜色值格式（#hex 或 rgb/rgba）
      for (const [key, value] of Object.entries(colors)) {
        if (typeof value === "string") {
          const isValidColor = /^#[0-9a-fA-F]{3,8}$/.test(value) || /^rgba?\s*\(/.test(value);
          if (!isValidColor) {
            warnings.push({
              rule: "C4",
              severity: "warning",
              message: `颜色值格式可能无效: ${key} = "${value}"，应为 #hex 或 rgb/rgba`,
            });
          }
        }
      }
    }

    // 检查 typography
    const typography = visual.typography as Record<string, unknown> | undefined;
    if (typography) {
      if (!typography.headingFont || !typography.bodyFont) {
        errors.push({
          rule: "C4",
          severity: "error",
          message: "visualLanguage.typography 缺少 headingFont 或 bodyFont",
        });
      }
    }

    // 检查 spacing
    const spacing = visual.spacing as Record<string, unknown> | undefined;
    if (spacing) {
      if (!spacing.unit) {
        warnings.push({
          rule: "C4",
          severity: "warning",
          message: "visualLanguage.spacing.unit 缺失，建议定义间距单位",
        });
      }
    }
  }

  // 检查 componentExpression 结构
  const compExpr = blueprint.componentExpression as Record<string, unknown> | undefined;
  if (compExpr) {
    const mapped = compExpr.mappedComponents as Array<Record<string, unknown>> | undefined;
    if (mapped && mapped.length > 0) {
      for (const m of mapped) {
        if (!m.component || !m.component.toString().trim()) {
          errors.push({
            rule: "C4",
            severity: "error",
            message: "组件映射中存在空的 component 名称",
          });
        }

        if (!m.variant || !m.variant.toString().trim()) {
          errors.push({
            rule: "C4",
            severity: "error",
            message: `组件 "${m.component || "unknown"}" 的 variant 为空`,
          });
        }

        if (!m.reason || !m.reason.toString().trim()) {
          warnings.push({
            rule: "C4",
            severity: "warning",
            message: `组件 "${m.component}" 的 reason 为空，建议提供设计理由`,
          });
        }
      }
    }
  }

  // 检查 BrandSystem 完整性
  const brandSystem = blueprint.brandSystem as Record<string, unknown> | undefined;
  if (brandSystem) {
    if (!brandSystem.principles || !Array.isArray(brandSystem.principles) || (brandSystem.principles as unknown[]).length === 0) {
      warnings.push({
        rule: "C4",
        severity: "warning",
        message: "brandSystem.principles 为空或缺失，建议定义品牌原则",
      });
    }

    const tokens = brandSystem.tokens as Record<string, unknown> | undefined;
    if (tokens) {
      if (!tokens.colors || typeof tokens.colors !== "object") {
        errors.push({
          rule: "C4",
          severity: "error",
          message: "brandSystem.tokens.colors 缺失或格式错误",
        });
      }

      if (!tokens.typography || typeof tokens.typography !== "object") {
        warnings.push({
          rule: "C4",
          severity: "warning",
          message: "brandSystem.tokens.typography 缺失或格式错误",
        });
      }

      if (!tokens.spacing || typeof tokens.spacing !== "object") {
        warnings.push({
          rule: "C4",
          severity: "warning",
          message: "brandSystem.tokens.spacing 缺失或格式错误",
        });
      }
    }

    const assetPolicy = brandSystem.assetPolicy as Record<string, unknown> | undefined;
    if (assetPolicy) {
      if (!assetPolicy.logoUsage) {
        warnings.push({
          rule: "C4",
          severity: "warning",
          message: "brandSystem.assetPolicy.logoUsage 缺失，建议定义 Logo 使用策略",
        });
      }
    }
  }
}

// ── C1: 公众号平台约束 ──
function checkPlatformConstraints(
  blueprint: Record<string, unknown>,
  errors: ConstraintViolation[]
) {
  const visual = blueprint.visualLanguage as Record<string, unknown> | undefined;
  if (!visual) return;

  // 检查 shadow 是否启用，微信公众号不支持 shadow
  const shadow = visual.shadow as Record<string, unknown> | undefined;
  if (shadow?.enabled === true) {
    errors.push({
      rule: "C1",
      severity: "error",
      message: "微信公众号不支持 box-shadow 效果，Shadow 必须禁用",
      detail: "shadow.enabled 应为 false",
    });
  }
}

// ── C2: WeMD 规范约束 ──
function checkWeMDSpec(
  blueprint: Record<string, unknown>,
  errors: ConstraintViolation[]
) {
  const compExpr = blueprint.componentExpression as Record<string, unknown> | undefined;
  if (!compExpr) {
    errors.push({
      rule: "C2",
      severity: "error",
      message: "componentExpression 缺失",
    });
    return;
  }

  const mapped = compExpr.mappedComponents as Array<Record<string, unknown>> | undefined;
  if (!mapped || mapped.length === 0) {
    errors.push({
      rule: "C2",
      severity: "error",
      message: "mappedComponents 为空，至少需要 1 个组件映射",
    });
  }

  // 检查每个映射是否有必填字段
  if (mapped) {
    for (const m of mapped) {
      if (!m.component || !m.variant || !m.reason) {
        errors.push({
          rule: "C2",
          severity: "error",
          message: `组件映射缺少必填字段: ${m.component || "unknown"}`,
          detail: "需要 component, variant, reason 三个字段",
        });
      }
    }
  }
}

// ── C3: CSS 变量约束 ──
function checkCSSVariables(
  blueprint: Record<string, unknown>,
  errors: ConstraintViolation[]
) {
  const visual = blueprint.visualLanguage as Record<string, unknown> | undefined;
  if (!visual) {
    errors.push({
      rule: "C3",
      severity: "error",
      message: "visualLanguage 缺失，无法检查 CSS 变量",
    });
    return;
  }

  const colors = visual.colors as Record<string, string> | undefined;
  if (!colors) {
    errors.push({
      rule: "C3",
      severity: "error",
      message: "colors 缺失",
    });
    return;
  }

  // 检查 14 色完整性
  const requiredColors = ["primary", "primaryLight", "primaryDark", "background", "surface", "textPrimary", "textSecondary", "border"];
  for (const key of requiredColors) {
    if (!colors[key]) {
      errors.push({
        rule: "C3",
        severity: "error",
        message: `缺少必需颜色: ${key}`,
        detail: `14 色板中必须包含 ${key}`,
      });
    }
  }

  // 检查变量名格式（不允许 --wemd-color-xxx 这种错误格式）
  for (const key of Object.keys(colors)) {
    if (key.startsWith("wemd-")) {
      errors.push({
        rule: "C3",
        severity: "error",
        message: `CSS 变量名格式错误: --${key}`,
        detail: "不要在变量名中包含 'wemd-' 前缀，正确格式: --wemd-primary",
      });
    }
  }
}

// ── C5: 品牌一致性（Warning） ──
function checkBrandConsistency(
  blueprint: Record<string, unknown>,
  warnings: ConstraintViolation[]
) {
  const expression = blueprint.expression as Record<string, unknown> | undefined;
  if (!expression) return;

  if (expression.type === "brand") {
    const logoUsage = expression.logoUsage as string;
    if (logoUsage === "header-only") {
      warnings.push({
        rule: "C5",
        severity: "warning",
        message: "Logo 仅用于头部，品牌曝光度较低",
        detail: "建议考虑 header-and-footer 模式增加品牌曝光",
      });
    }
  }

  // 检查组件映射中是否有 brand-sign
  const compExpr = blueprint.componentExpression as Record<string, unknown> | undefined;
  const mapped = compExpr?.mappedComponents as Array<Record<string, unknown>> | undefined;
  if (mapped && !mapped.some((m) => m.component === "brand-sign")) {
    warnings.push({
      rule: "C5",
      severity: "warning",
      message: "未包含 brand-sign 组件，品牌签名缺失",
    });
  }
}

// ── C6: 组件合法性 ──
function checkComponentLegality(
  blueprint: Record<string, unknown>,
  errors: ConstraintViolation[]
) {
  const legal = getLegalComponents();
  const compExpr = blueprint.componentExpression as Record<string, unknown> | undefined;
  const mapped = compExpr?.mappedComponents as Array<Record<string, unknown>> | undefined;

  if (!mapped) return;

  for (const m of mapped) {
    const comp = m.component as string;
    if (comp && !legal.includes(comp)) {
      errors.push({
        rule: "C6",
        severity: "error",
        message: `非法组件名: "${comp}"`,
        detail: `合法组件列表: ${legal.join(", ")}`,
      });
    }
  }
}