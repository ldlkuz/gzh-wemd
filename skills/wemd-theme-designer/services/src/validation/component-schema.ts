// ============================================================
// 组件 Schema 校验
// ============================================================
// 校验组件数据的必填字段、类型、版本号、状态流转、资源引用。

import type { BrandComponent, ComponentStatus, ComponentVersionDetail } from "../types.ts";
import type { ValidationError, ValidationResult } from "./project-schema.ts";

// ── 合法组件状态列表 ──
const VALID_COMPONENT_STATUSES: ComponentStatus[] = [
  "not-generated",
  "draft",
  "reviewing",
  "revision-requested",
  "approved",
  "locked",
];

// ── 合法状态流转（from → [to, ...]） ──
const VALID_COMPONENT_TRANSITIONS: Record<string, string[]> = {
  "not-generated": ["draft"],
  draft: ["reviewing", "revision-requested"],
  reviewing: ["approved", "revision-requested"],
  "revision-requested": ["draft", "reviewing"],
  approved: ["locked"],
  locked: [],
};

// ── 组件类型白名单（WeMD 规范组件） ──
const LEGAL_COMPONENT_TYPES = [
  "hero-banner", "heading-2", "heading-3", "rich-text", "quote",
  "list", "image", "code-block", "faq", "divider", "cta",
  "brand-sign", "testimonial-card", "related-articles", "table",
  "callout",
];

// ── 检查必填字段 ──
function checkRequiredFields(
  component: Partial<BrandComponent>,
  errors: ValidationError[]
): void {
  const required: { field: keyof BrandComponent; label: string; type: string }[] = [
    { field: "id", label: "组件 ID", type: "string" },
    { field: "type", label: "组件类型", type: "string" },
    { field: "name", label: "组件名称", type: "string" },
    { field: "status", label: "组件状态", type: "string" },
    { field: "currentVersion", label: "当前版本", type: "number" },
    { field: "versions", label: "版本列表", type: "array" },
  ];

  for (const { field, label, type } of required) {
    const value = component[field];
    if (value === undefined || value === null) {
      errors.push({
        field: `component.${field}`,
        message: `${label} (${field}) 必填且不能为空`,
        severity: "error",
      });
      continue;
    }

    if (type === "string" && typeof value !== "string") {
      errors.push({
        field: `component.${field}`,
        message: `${label} (${field}) 类型应为 ${type}，实际为 ${typeof value}`,
        severity: "error",
      });
    }

    if (type === "number" && typeof value !== "number") {
      errors.push({
        field: `component.${field}`,
        message: `${label} (${field}) 类型应为 ${type}，实际为 ${typeof value}`,
        severity: "error",
      });
    }

    if (type === "array" && !Array.isArray(value)) {
      errors.push({
        field: `component.${field}`,
        message: `${label} (${field}) 类型应为 ${type}，实际为 ${typeof value}`,
        severity: "error",
      });
    }
  }
}

// ── 检查组件类型合法性 ──
function checkComponentType(
  type: string,
  errors: ValidationError[]
): void {
  if (!type) return;

  if (!LEGAL_COMPONENT_TYPES.includes(type)) {
    errors.push({
      field: "component.type",
      message: `非法组件类型: "${type}"，合法类型: ${LEGAL_COMPONENT_TYPES.join(", ")}`,
      severity: "error",
    });
  }
}

// ── 检查组件状态合法性 ──
function checkComponentStatus(
  status: string,
  errors: ValidationError[]
): void {
  if (!status) return;

  if (!VALID_COMPONENT_STATUSES.includes(status as ComponentStatus)) {
    errors.push({
      field: "component.status",
      message: `非法组件状态: "${status}"，合法值: ${VALID_COMPONENT_STATUSES.join(", ")}`,
      severity: "error",
    });
  }
}

// ── 检查组件状态流转 ──
function checkComponentStatusTransition(
  currentStatus: string,
  newStatus: string,
  errors: ValidationError[]
): void {
  if (!currentStatus || !newStatus) return;

  const allowed = VALID_COMPONENT_TRANSITIONS[currentStatus];
  if (!allowed) {
    errors.push({
      field: "component.status",
      message: `当前状态 "${currentStatus}" 没有定义合法流转`,
      severity: "error",
    });
    return;
  }

  if (!allowed.includes(newStatus)) {
    errors.push({
      field: "component.status",
      message: `组件状态流转不合法: "${currentStatus}" → "${newStatus}"，合法目标: ${allowed.join(", ")}`,
      severity: "error",
    });
  }
}

// ── 检查版本号一致性 ──
function checkVersionConsistency(
  component: Partial<BrandComponent>,
  errors: ValidationError[]
): void {
  const versions = component.versions;
  if (!versions || !Array.isArray(versions) || versions.length === 0) return;

  // currentVersion 必须等于最大版本号
  const maxVersion = Math.max(...versions.map((v) => v.version || 0));
  if (component.currentVersion !== maxVersion) {
    errors.push({
      field: "component.currentVersion",
      message: `currentVersion (${component.currentVersion}) 不等于最大版本号 (${maxVersion})`,
      severity: "error",
    });
  }

  // 版本号必须连续递增
  const sortedVersions = [...versions].sort((a, b) => a.version - b.version);
  for (let i = 0; i < sortedVersions.length; i++) {
    const expectedVersion = i + 1; // 版本号从 1 开始
    if (sortedVersions[i].version !== expectedVersion) {
      errors.push({
        field: "component.versions",
        message: `版本号不连续: 期望 v${expectedVersion}，实际为 v${sortedVersions[i].version}`,
        severity: "error",
      });
      break;
    }
  }
}

// ── 检查 approvedVersion 有效性 ──
function checkApprovedVersion(
  component: Partial<BrandComponent>,
  errors: ValidationError[]
): void {
  if (component.approvedVersion === null || component.approvedVersion === undefined) return;

  const versions = component.versions;
  if (versions && Array.isArray(versions)) {
    const exists = versions.some((v) => v.version === component.approvedVersion);
    if (!exists) {
      errors.push({
        field: "component.approvedVersion",
        message: `approvedVersion v${component.approvedVersion} 在版本列表中不存在`,
        severity: "error",
      });
    }
  }

  if (component.approvedVersion > (component.currentVersion || 0)) {
    errors.push({
      field: "component.approvedVersion",
      message: `approvedVersion v${component.approvedVersion} 不能大于 currentVersion v${component.currentVersion}`,
      severity: "error",
    });
  }
}

// ── 检查 assetRefs 有效性 ──
function checkAssetRefs(
  component: Partial<BrandComponent>,
  warnings: ValidationError[]
): void {
  if (!component.assetRefs || !Array.isArray(component.assetRefs)) return;

  for (const ref of component.assetRefs) {
    if (typeof ref !== "string" || ref.trim().length === 0) {
      warnings.push({
        field: "component.assetRefs",
        message: `非法资源引用: "${ref}"，应为非空字符串`,
        severity: "warning",
      });
    }
  }
}

// ── 检查版本详情 ──
function checkVersionDetails(
  versions: ComponentVersionDetail[] | undefined,
  errors: ValidationError[],
  warnings: ValidationError[]
): void {
  if (!versions || !Array.isArray(versions)) return;

  for (const version of versions) {
    // 版本号必须为正整数
    if (typeof version.version !== "number" || version.version < 1) {
      errors.push({
        field: "component.versions[].version",
        message: `版本号必须为正整数，实际为 ${version.version}`,
        severity: "error",
      });
    }

    // 变体名不能为空
    if (!version.variant || typeof version.variant !== "string") {
      errors.push({
        field: "component.versions[].variant",
        message: `v${version.version} 的 variant 不能为空`,
        severity: "error",
      });
    }

    // variantCss 应包含有效的 CSS
    if (version.variantCss && typeof version.variantCss === "string") {
      // 检查是否包含 } 来确认 CSS 块完整性
      const openBraces = (version.variantCss.match(/\{/g) || []).length;
      const closeBraces = (version.variantCss.match(/\}/g) || []).length;
      if (openBraces !== closeBraces) {
        warnings.push({
          field: "component.versions[].variantCss",
          message: `v${version.version} 的 variantCss 花括号不匹配: { ${openBraces} 个, } ${closeBraces} 个`,
          severity: "warning",
        });
      }
    }

    // 时间戳格式
    if (version.createdAt) {
      const d = new Date(version.createdAt);
      if (isNaN(d.getTime())) {
        errors.push({
          field: "component.versions[].createdAt",
          message: `v${version.version} 的 createdAt 时间戳格式无效`,
          severity: "error",
        });
      }
    }

    // createdBy 合法性
    if (version.createdBy && !["ai", "user"].includes(version.createdBy)) {
      errors.push({
        field: "component.versions[].createdBy",
        message: `v${version.version} 的 createdBy 必须为 "ai" 或 "user"，实际为 "${version.createdBy}"`,
        severity: "error",
      });
    }

    // compatibility 若存在，检查结构
    if (version.compatibility) {
      if (typeof version.compatibility !== "object") {
        warnings.push({
          field: "component.versions[].compatibility",
          message: `v${version.version} 的 compatibility 类型应为 object`,
          severity: "warning",
        });
      }
    }

    // assetRefs 若存在，应为数组
    if (version.assetRefs !== undefined && !Array.isArray(version.assetRefs)) {
      warnings.push({
        field: "component.versions[].assetRefs",
        message: `v${version.version} 的 assetRefs 类型应为 array`,
        severity: "warning",
      });
    }
  }
}

// ── 检查 contentSchema 结构 ──
function checkContentSchema(
  schema: Record<string, unknown> | undefined,
  warnings: ValidationError[]
): void {
  if (!schema || Object.keys(schema).length === 0) {
    warnings.push({
      field: "component.contentSchema",
      message: "contentSchema 为空或缺失，建议定义组件内容结构",
      severity: "warning",
    });
  }
}

// ── 检查 review 字段 ──
function checkReview(
  component: Partial<BrandComponent>,
  warnings: ValidationError[]
): void {
  if (!component.review) return;

  if (component.review.status && !VALID_COMPONENT_STATUSES.includes(component.review.status)) {
    warnings.push({
      field: "component.review.status",
      message: `审核状态 "${component.review.status}" 可能非法`,
      severity: "warning",
    });
  }

  if (component.review.score !== undefined) {
    if (typeof component.review.score !== "number" || component.review.score < 0 || component.review.score > 100) {
      warnings.push({
        field: "component.review.score",
        message: `审核评分 ${component.review.score} 超出范围 (0-100)`,
        severity: "warning",
      });
    }
  }
}

// ── 主校验入口 ──
export function validateComponent(
  component: Partial<BrandComponent> | null | undefined
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  if (!component) {
    errors.push({
      field: "component",
      message: "组件数据为空",
      severity: "error",
    });
    return { passed: false, errors, warnings };
  }

  // 1. 必填字段
  checkRequiredFields(component, errors);

  // 2. 组件类型合法性
  if (component.type) checkComponentType(component.type, errors);

  // 3. 组件状态合法性
  if (component.status) checkComponentStatus(component.status, errors);

  // 4. 版本号一致性
  checkVersionConsistency(component, errors);

  // 5. approvedVersion 有效性
  checkApprovedVersion(component, errors);

  // 6. assetRefs 有效性
  checkAssetRefs(component, warnings);

  // 7. 版本详情检查
  if (component.versions) {
    checkVersionDetails(component.versions, errors, warnings);
  }

  // 8. contentSchema
  checkContentSchema(component.contentSchema, warnings);

  // 9. review 字段
  checkReview(component, warnings);

  return {
    passed: errors.length === 0,
    errors,
    warnings,
  };
}

// ── 检查组件状态流转（提供新旧状态） ──
export function validateComponentStatusTransition(
  currentStatus: string,
  newStatus: string
): ValidationResult {
  const errors: ValidationError[] = [];
  checkComponentStatusTransition(currentStatus, newStatus, errors);
  return {
    passed: errors.length === 0,
    errors,
    warnings: [],
  };
}

// ── 获取合法组件类型列表 ──
export function getLegalComponentTypes(): string[] {
  return [...LEGAL_COMPONENT_TYPES];
}