// ============================================================
// 校验入口
// ============================================================
// 整合项目、组件、资源的校验规则，提供统一校验接口。

import type { ValidationResult } from "./project-schema.ts";
import { validateProject, validateStatusTransition } from "./project-schema.ts";
import {
  validateComponent,
  validateComponentStatusTransition,
  getLegalComponentTypes,
} from "./component-schema.ts";
import { validateAssetManifest, validateAsset } from "./asset-schema.ts";

// ── 校验类型枚举 ──
export type ValidationType =
  | "project"
  | "component"
  | "asset"
  | "asset-manifest"
  | "status-transition";

// ── 校验请求 ──
export interface ValidationRequest {
  type: ValidationType;
  data: unknown;
  context?: {
    currentStatus?: string;
    newStatus?: string;
  };
}

// ── 校验结果汇总 ──
export interface ValidationSummary {
  passed: boolean;
  total: number;
  errors: number;
  warnings: number;
  details: ValidationResult[];
  summary: string;
}

// ── 统一校验入口 ──
export async function validate(
  request: ValidationRequest | ValidationRequest[]
): Promise<ValidationSummary> {
  const requests = Array.isArray(request) ? request : [request];
  const results: ValidationResult[] = [];

  for (const req of requests) {
    try {
      switch (req.type) {
        case "project":
          results.push(validateProject(req.data as Record<string, unknown> | null));
          break;

        case "component":
          results.push(validateComponent(req.data as Record<string, unknown> | null));
          break;

        case "asset":
          results.push(await validateAsset(req.data as Record<string, unknown> | null));
          break;

        case "asset-manifest":
          results.push(validateAssetManifest(req.data as Record<string, unknown> | null));
          break;

        case "status-transition":
          if (req.context?.currentStatus && req.context?.newStatus) {
            results.push(
              validateStatusTransition(req.context.currentStatus, req.context.newStatus)
            );
          } else {
            results.push({
              passed: false,
              errors: [{
                field: "status-transition",
                message: "status-transition 校验需要提供 currentStatus 和 newStatus",
                severity: "error",
              }],
              warnings: [],
            });
          }
          break;

        default:
          results.push({
            passed: false,
            errors: [{
              field: "type",
              message: `未知校验类型: "${req.type}"`,
              severity: "error",
            }],
            warnings: [],
          });
      }
    } catch (err) {
      results.push({
        passed: false,
        errors: [{
          field: "runtime",
          message: `校验运行时异常: ${err}`,
          severity: "error",
        }],
        warnings: [],
      });
    }
  }

  const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);
  const totalWarnings = results.reduce((sum, r) => sum + r.warnings.length, 0);
  const passed = totalErrors === 0;

  let summary: string;
  if (passed && totalWarnings === 0) {
    summary = `全部通过 (${results.length} 项校验)`;
  } else if (passed && totalWarnings > 0) {
    summary = `通过 (${totalWarnings} 个警告)`;
  } else {
    summary = `未通过: ${totalErrors} 个错误, ${totalWarnings} 个警告`;
  }

  return {
    passed,
    total: results.length,
    errors: totalErrors,
    warnings: totalWarnings,
    details: results,
    summary,
  };
}

// ── 便捷校验：项目数据 ──
export function validateProjectData(
  data: Record<string, unknown> | null | undefined
): ValidationResult {
  return validateProject(data as Record<string, unknown> | null);
}

// ── 便捷校验：组件数据 ──
export function validateComponentData(
  data: Record<string, unknown> | null | undefined
): ValidationResult {
  return validateComponent(data as Record<string, unknown> | null);
}

// ── 便捷校验：资源数据 ──
export async function validateAssetData(
  data: Record<string, unknown> | null | undefined
): Promise<ValidationResult> {
  return validateAsset(data as Record<string, unknown> | null);
}

// ── 格式化校验结果（用于日志输出） ──
export function formatValidationResult(result: ValidationResult): string {
  const lines: string[] = [];

  if (result.errors.length > 0) {
    lines.push(`  ✗ 错误 (${result.errors.length}):`);
    for (const err of result.errors) {
      lines.push(`    - [${err.field}] ${err.message}`);
    }
  }

  if (result.warnings.length > 0) {
    lines.push(`  ⚠ 警告 (${result.warnings.length}):`);
    for (const warn of result.warnings) {
      lines.push(`    - [${warn.field}] ${warn.message}`);
    }
  }

  if (result.errors.length === 0 && result.warnings.length === 0) {
    lines.push("  ✓ 校验通过，无错误或警告");
  }

  return lines.join("\n");
}

// ── 导出 ──
export { validateProject, validateStatusTransition } from "./project-schema.ts";
export {
  validateComponent,
  validateComponentStatusTransition,
  getLegalComponentTypes,
} from "./component-schema.ts";
export { validateAssetManifest, validateAsset } from "./asset-schema.ts";