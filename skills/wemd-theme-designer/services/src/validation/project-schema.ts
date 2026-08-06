// ============================================================
// 项目 Schema 校验
// ============================================================
// 校验项目数据的必填字段、类型、状态流转合法性。

import type { DesignProject, ProjectStatus, DesignMemory } from "../types.ts";

// ── 校验结果 ──
export interface ValidationError {
  field: string;
  message: string;
  severity: "error" | "warning";
}

export interface ValidationResult {
  passed: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

// ── 合法状态列表 ──
const VALID_PROJECT_STATUSES: ProjectStatus[] = [
  "NEW",
  "READY",
  "GENERATING",
  "PREVIEW",
  "APPROVED",
  "EXPORTED",
];

// ── 合法状态流转（from → [to, ...]） ──
const VALID_TRANSITIONS: Record<string, string[]> = {
  NEW: ["READY"],
  READY: ["GENERATING"],
  GENERATING: ["PREVIEW", "NEW"],
  PREVIEW: ["APPROVED", "GENERATING"],
  APPROVED: ["EXPORTED", "PREVIEW"],
  EXPORTED: [],
};

// ── 检查项目必填字段 ──
function checkRequiredFields(
  project: Partial<DesignProject>,
  errors: ValidationError[]
): void {
  const required: { field: keyof DesignProject; label: string; type: string }[] = [
    { field: "id", label: "项目 ID", type: "string" },
    { field: "name", label: "项目名称", type: "string" },
    { field: "profileType", label: "项目类型", type: "string" },
    { field: "status", label: "项目状态", type: "string" },
    { field: "createdAt", label: "创建时间", type: "string" },
    { field: "updatedAt", label: "更新时间", type: "string" },
    { field: "profile", label: "项目配置", type: "object" },
  ];

  for (const { field, label, type } of required) {
    const value = project[field];
    if (value === undefined || value === null) {
      errors.push({
        field,
        message: `${label} (${field}) 必填且不能为空`,
        severity: "error",
      });
      continue;
    }

    if (type === "string" && typeof value !== "string") {
      errors.push({
        field,
        message: `${label} (${field}) 类型应为 ${type}，实际为 ${typeof value}`,
        severity: "error",
      });
    }

    if (type === "object" && (typeof value !== "object" || Array.isArray(value))) {
      errors.push({
        field,
        message: `${label} (${field}) 类型应为 ${type}，实际为 ${typeof value}`,
        severity: "error",
      });
    }
  }
}

// ── 检查 ID 格式 ──
function checkIdFormat(
  id: string,
  errors: ValidationError[]
): void {
  if (!id) return;

  // ID 应只包含小写字母、数字、连字符、中文字符
  if (!/^[a-z0-9\u4e00-\u9fa5-]+$/.test(id)) {
    errors.push({
      field: "id",
      message: `项目 ID 格式无效: "${id}"，应只包含小写字母、数字、连字符、中文`,
      severity: "error",
    });
  }
}

// ── 检查 profileType ──
function checkProfileType(
  profileType: string,
  errors: ValidationError[]
): void {
  if (!profileType) return;

  if (profileType !== "brand" && profileType !== "creator") {
    errors.push({
      field: "profileType",
      message: `profileType 必须为 "brand" 或 "creator"，实际为 "${profileType}"`,
      severity: "error",
    });
  }
}

// ── 检查状态合法性 ──
function checkStatus(
  status: string,
  errors: ValidationError[]
): void {
  if (!status) return;

  if (!VALID_PROJECT_STATUSES.includes(status as ProjectStatus)) {
    errors.push({
      field: "status",
      message: `非法项目状态: "${status}"，合法值: ${VALID_PROJECT_STATUSES.join(", ")}`,
      severity: "error",
    });
  }
}

// ── 检查状态流转合法性 ──
function checkStatusTransition(
  currentStatus: string,
  newStatus: string,
  errors: ValidationError[]
): void {
  if (!currentStatus || !newStatus) return;

  const allowed = VALID_TRANSITIONS[currentStatus];
  if (!allowed) {
    errors.push({
      field: "status",
      message: `当前状态 "${currentStatus}" 没有定义合法流转`,
      severity: "error",
    });
    return;
  }

  if (!allowed.includes(newStatus)) {
    errors.push({
      field: "status",
      message: `状态流转不合法: "${currentStatus}" → "${newStatus}"，合法目标: ${allowed.join(", ")}`,
      severity: "error",
    });
  }
}

// ── 检查 DesignMemory 结构 ──
function checkDesignMemory(
  memory: DesignMemory | undefined,
  warnings: ValidationError[]
): void {
  if (!memory) {
    warnings.push({
      field: "designMemory",
      message: "designMemory 缺失，建议初始化默认值",
      severity: "warning",
    });
    return;
  }

  // 检查 preferences
  if (memory.preferences) {
    const validDensity = ["low", "medium", "high"];
    if (memory.preferences.patternDensity && !validDensity.includes(memory.preferences.patternDensity)) {
      warnings.push({
        field: "designMemory.preferences.patternDensity",
        message: `patternDensity 值 "${memory.preferences.patternDensity}" 可能非法，应为 low/medium/high`,
        severity: "warning",
      });
    }

    const validDecoration = ["minimal", "moderate", "rich"];
    if (memory.preferences.decorationLevel && !validDecoration.includes(memory.preferences.decorationLevel)) {
      warnings.push({
        field: "designMemory.preferences.decorationLevel",
        message: `decorationLevel 值 "${memory.preferences.decorationLevel}" 可能非法，应为 minimal/moderate/rich`,
        severity: "warning",
      });
    }

    const validCorner = ["rounded", "sharp", "mixed"];
    if (memory.preferences.cornerStyle && !validCorner.includes(memory.preferences.cornerStyle)) {
      warnings.push({
        field: "designMemory.preferences.cornerStyle",
        message: `cornerStyle 值 "${memory.preferences.cornerStyle}" 可能非法，应为 rounded/sharp/mixed`,
        severity: "warning",
      });
    }
  }
}

// ── 检查时间戳格式 ──
function checkTimestampFormat(
  field: string,
  value: string | undefined,
  errors: ValidationError[]
): void {
  if (!value) return;

  const d = new Date(value);
  if (isNaN(d.getTime())) {
    errors.push({
      field,
      message: `时间戳格式无效: "${value}"，应为 ISO 8601 格式`,
      severity: "error",
    });
  }
}

// ── 主校验入口 ──
export function validateProject(
  project: Partial<DesignProject> | null | undefined
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  if (!project) {
    errors.push({
      field: "project",
      message: "项目数据为空",
      severity: "error",
    });
    return { passed: false, errors, warnings };
  }

  // 1. 必填字段
  checkRequiredFields(project, errors);

  // 2. ID 格式
  if (project.id) checkIdFormat(project.id, errors);

  // 3. profileType
  if (project.profileType) checkProfileType(project.profileType, errors);

  // 4. 状态合法性
  if (project.status) checkStatus(project.status, errors);

  // 5. 时间戳
  if (project.createdAt) checkTimestampFormat("createdAt", project.createdAt, errors);
  if (project.updatedAt) checkTimestampFormat("updatedAt", project.updatedAt, errors);

  // 6. DesignMemory 结构
  if (project.designMemory) checkDesignMemory(project.designMemory, warnings);

  // 7. designBlueprint 若存在，应为 object
  if (project.designBlueprint !== undefined && project.designBlueprint !== null) {
    if (typeof project.designBlueprint !== "object") {
      errors.push({
        field: "designBlueprint",
        message: "designBlueprint 类型应为 object",
        severity: "error",
      });
    }
  }

  // 8. themePackage 若存在，应为 object
  if (project.themePackage !== undefined && project.themePackage !== null) {
    if (typeof project.themePackage !== "object") {
      errors.push({
        field: "themePackage",
        message: "themePackage 类型应为 object",
        severity: "error",
      });
    }
  }

  // 9. reviewRecords 若存在，应为数组
  if (project.reviewRecords !== undefined && project.reviewRecords !== null) {
    if (!Array.isArray(project.reviewRecords)) {
      errors.push({
        field: "reviewRecords",
        message: "reviewRecords 类型应为 array",
        severity: "error",
      });
    }
  }

  // 10. decisionLog 若存在，应为数组
  if (project.decisionLog !== undefined && project.decisionLog !== null) {
    if (!Array.isArray(project.decisionLog)) {
      errors.push({
        field: "decisionLog",
        message: "decisionLog 类型应为 array",
        severity: "error",
      });
    }
  }

  return {
    passed: errors.length === 0,
    errors,
    warnings,
  };
}

// ── 检查状态流转（提供新旧状态） ──
export function validateStatusTransition(
  currentStatus: string,
  newStatus: string
): ValidationResult {
  const errors: ValidationError[] = [];
  checkStatusTransition(currentStatus, newStatus, errors);
  return {
    passed: errors.length === 0,
    errors,
    warnings: [],
  };
}