// ============================================================
// 资源 Schema 校验
// ============================================================
// 校验资源数据的必填字段、类型、路径存在性、SVG 有效性。

import type { BrandAsset, AssetManifest } from "../types.ts";
import type { ValidationError, ValidationResult } from "./project-schema.ts";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";

// ── 合法资源类型 ──
const VALID_ASSET_TYPES = [
  "logo", "brand-mark", "pattern", "divider", "icon", "cover-decoration",
];

// ── 合法资源格式 ──
const VALID_SOURCE_FORMATS = ["svg", "png"];

// ── 检查必填字段 ──
function checkRequiredFields(
  asset: Partial<BrandAsset>,
  errors: ValidationError[]
): void {
  const required: { field: string; label: string; type: string }[] = [
    { field: "id", label: "资源 ID", type: "string" },
    { field: "type", label: "资源类型", type: "string" },
    { field: "sourceFormat", label: "资源格式", type: "string" },
    { field: "sourcePath", label: "资源路径", type: "string" },
  ];

  for (const { field, label, type } of required) {
    const value = (asset as Record<string, unknown>)[field];
    if (value === undefined || value === null) {
      errors.push({
        field: `asset.${field}`,
        message: `${label} (${field}) 必填且不能为空`,
        severity: "error",
      });
      continue;
    }

    if (type === "string" && typeof value !== "string") {
      errors.push({
        field: `asset.${field}`,
        message: `${label} (${field}) 类型应为 ${type}，实际为 ${typeof value}`,
        severity: "error",
      });
    }
  }
}

// ── 检查资源类型合法性 ──
function checkAssetType(
  type: string,
  errors: ValidationError[]
): void {
  if (!type) return;

  if (!VALID_ASSET_TYPES.includes(type)) {
    errors.push({
      field: "asset.type",
      message: `非法资源类型: "${type}"，合法类型: ${VALID_ASSET_TYPES.join(", ")}`,
      severity: "error",
    });
  }
}

// ── 检查资源格式合法性 ──
function checkSourceFormat(
  format: string,
  errors: ValidationError[]
): void {
  if (!format) return;

  if (!VALID_SOURCE_FORMATS.includes(format)) {
    errors.push({
      field: "asset.sourceFormat",
      message: `非法资源格式: "${format}"，合法格式: ${VALID_SOURCE_FORMATS.join(", ")}`,
      severity: "error",
    });
  }
}

// ── 检查资源路径存在性 ──
function checkSourcePath(
  path: string,
  asset: Partial<BrandAsset>,
  errors: ValidationError[],
  warnings: ValidationError[]
): void {
  if (!path) return;

  try {
    if (!existsSync(path)) {
      warnings.push({
        field: "asset.sourcePath",
        message: `资源路径不存在: "${path}" (${asset.id || "unknown"})`,
        severity: "warning",
      });
    }
  } catch {
    // 路径检查异常不阻断
    warnings.push({
      field: "asset.sourcePath",
      message: `无法检查资源路径: "${path}"`,
      severity: "warning",
    });
  }
}

// ── 检查 SVG 有效性 ──
async function checkSvgValidity(
  asset: Partial<BrandAsset>,
  errors: ValidationError[],
  warnings: ValidationError[]
): Promise<void> {
  if (asset.sourceFormat !== "svg" || !asset.sourcePath) return;

  try {
    if (!existsSync(asset.sourcePath)) {
      warnings.push({
        field: "asset.sourcePath",
        message: `SVG 文件不存在: "${asset.sourcePath}" (${asset.id})`,
        severity: "warning",
      });
      return;
    }

    const content = await readFile(asset.sourcePath, "utf-8");

    // 检查是否为有效的 SVG
    if (!content.trim().startsWith("<svg") && !content.trim().startsWith('<?xml')) {
      warnings.push({
        field: "asset.sourcePath",
        message: `文件不是有效的 SVG: "${asset.sourcePath}" (${asset.id})`,
        severity: "warning",
      });
      return;
    }

    // 检查闭合标签
    const openTags = (content.match(/<svg[\s>]/g) || []).length;
    const closeTags = (content.match(/<\/svg>/g) || []).length;
    if (openTags !== closeTags) {
      errors.push({
        field: "asset.sourcePath",
        message: `SVG 标签不匹配: <svg> ${openTags} 个, </svg> ${closeTags} 个 (${asset.id})`,
        severity: "error",
      });
    }

    // 检查恶意内容
    const dangerousPatterns = [
      /<script[\s>]/i,
      /on\w+\s*=\s*["']?javascript:/i,
      /onload\s*=/i,
      /expression\s*\(/i,
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(content)) {
        errors.push({
          field: "asset.sourcePath",
          message: `SVG 包含危险内容: "${asset.id}"`,
          severity: "error",
        });
        break;
      }
    }

    // 检查伪 SVG（内嵌位图）
    if (/<image[\s>][^>]*href\s*=\s*["']?data:/.test(content)) {
      warnings.push({
        field: "asset.sourcePath",
        message: `SVG 包含内嵌位图，可能是伪 SVG: "${asset.id}"`,
        severity: "warning",
      });
    }
  } catch {
    warnings.push({
      field: "asset.sourcePath",
      message: `无法读取 SVG 文件: "${asset.sourcePath}" (${asset.id})`,
      severity: "warning",
    });
  }
}

// ── 检查 usage 字段 ──
function checkUsage(
  asset: Partial<BrandAsset>,
  warnings: ValidationError[]
): void {
  if (!asset.usage || !Array.isArray(asset.usage)) {
    warnings.push({
      field: "asset.usage",
      message: `资源 "${asset.id || "unknown"}" 的 usage 缺失或不是数组`,
      severity: "warning",
    });
    return;
  }

  if (asset.usage.length === 0) {
    warnings.push({
      field: "asset.usage",
      message: `资源 "${asset.id}" 的 usage 为空数组，未标记使用场合`,
      severity: "warning",
    });
  }

  for (const u of asset.usage) {
    if (typeof u !== "string" || u.trim().length === 0) {
      warnings.push({
        field: "asset.usage",
        message: `资源 "${asset.id}" 的 usage 包含非法值`,
        severity: "warning",
      });
    }
  }
}

// ── 检查 Manifest 结构 ──
function checkManifestStructure(
  manifest: Partial<AssetManifest> | undefined,
  errors: ValidationError[],
  warnings: ValidationError[]
): void {
  if (!manifest) {
    warnings.push({
      field: "manifest",
      message: "AssetManifest 为空",
      severity: "warning",
    });
    return;
  }

  if (!manifest.assets || !Array.isArray(manifest.assets)) {
    errors.push({
      field: "manifest.assets",
      message: "AssetManifest.assets 缺失或不是数组",
      severity: "error",
    });
    return;
  }

  if (manifest.assets.length === 0) {
    warnings.push({
      field: "manifest.assets",
      message: "AssetManifest.assets 为空数组，没有资源被注册",
      severity: "warning",
    });
  }

  // 检查 ID 唯一性
  const ids = new Set<string>();
  for (const asset of manifest.assets) {
    if (asset.id) {
      if (ids.has(asset.id)) {
        errors.push({
          field: "manifest.assets",
          message: `资源 ID 重复: "${asset.id}"`,
          severity: "error",
        });
      }
      ids.add(asset.id);
    }
  }
}

// ── 主校验入口（同步） ──
export function validateAssetManifest(
  manifest: Partial<AssetManifest> | null | undefined
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  if (!manifest) {
    errors.push({
      field: "manifest",
      message: "AssetManifest 数据为空",
      severity: "error",
    });
    return { passed: false, errors, warnings };
  }

  checkManifestStructure(manifest, errors, warnings);

  if (manifest.assets) {
    for (const asset of manifest.assets) {
      checkRequiredFields(asset, errors);
      if (asset.type) checkAssetType(asset.type, errors);
      if (asset.sourceFormat) checkSourceFormat(asset.sourceFormat, errors);
      if (asset.sourcePath) checkSourcePath(asset.sourcePath, asset, errors, warnings);
      checkUsage(asset, warnings);
    }
  }

  return {
    passed: errors.length === 0,
    errors,
    warnings,
  };
}

// ── 校验单个资源（异步，含 SVG 有效性检查） ──
export async function validateAsset(
  asset: Partial<BrandAsset> | null | undefined
): Promise<ValidationResult> {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  if (!asset) {
    errors.push({
      field: "asset",
      message: "资源数据为空",
      severity: "error",
    });
    return { passed: false, errors, warnings };
  }

  checkRequiredFields(asset, errors);
  if (asset.type) checkAssetType(asset.type, errors);
  if (asset.sourceFormat) checkSourceFormat(asset.sourceFormat, errors);
  if (asset.sourcePath) checkSourcePath(asset.sourcePath, asset, errors, warnings);
  checkUsage(asset, warnings);

  // SVG 有效性检查（异步）
  await checkSvgValidity(asset, errors, warnings);

  return {
    passed: errors.length === 0,
    errors,
    warnings,
  };
}