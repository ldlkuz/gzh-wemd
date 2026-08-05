// ============================================================
// Compiler Layer — 编译层
// ============================================================
// 将 Design Blueprint + Variant CSS 编译为 manifest.json，
// 生成 brand.md（品牌文档），并打包为 .wemd-theme ZIP。

import AdmZip from "adm-zip";
import { join } from "node:path";
import { writeFile } from "node:fs/promises";
import { ensureDir, getProjectFilePath } from "../file-service.ts";
import type { ComponentVariant, CompiledTheme } from "./pipeline-types.ts";

// ── 主入口：编译主题包 ──
export function compileTheme(
  blueprint: Record<string, unknown>,
  variants: ComponentVariant[],
  materials: Record<string, string>
): CompiledTheme {
  const warnings: string[] = [];
  const visual = blueprint.visualLanguage as Record<string, unknown> | undefined;
  const colors = (visual?.colors as Record<string, string>) || {};
  const layout = blueprint.layoutStrategy as Record<string, unknown> | undefined;
  const compExpr = blueprint.componentExpression as Record<string, unknown> | undefined;
  const mapped = compExpr?.mappedComponents as Array<Record<string, unknown>> | undefined;
  const brandExpr = blueprint.brandExpression as Record<string, unknown> | undefined;
  const readingExp = blueprint.readingExperience as Record<string, unknown> | undefined;
  const profileType = blueprint.profileType as string | undefined;

  // 1. 构建 manifest
  const manifest: Record<string, unknown> = {
    sdkVersion: "1.0.0",
    meta: {
      name: (blueprint.projectName as string) || "Generated Theme",
      description: "由 WeMD Design Pipeline 自动生成",
      keywords: (brandExpr?.keywords as string[]) || [],
      author: "WeMD Pipeline",
      version: "1.0.0",
    },
    tokens: {
      colors: formatColors(colors),
      typography: visual?.typography || {},
      spacing: visual?.spacing || {},
      border: visual?.border || {},
    },
    layout: {
      preferredComponents: mapped?.map((m) => ({
        name: m.component,
        reason: m.reason,
      })) || [],
      density: (readingExp?.density as string) || "medium",
      tone: (readingExp?.tone as string[]) || ["modern"],
    },
    components: variants.map((v) => ({
      name: v.component,
      variant: v.variant,
      variantCss: v.variantCss,
    })),
    assets: {
      images: Object.entries(materials).map(([key, svg]) => ({
        name: key,
        data: svg,
        type: "svg",
      })),
    },
  };

  // 2. 校验
  if (!manifest.meta) warnings.push("meta 字段缺失");
  if (!manifest.tokens) warnings.push("tokens 字段缺失");
  if (variants.length === 0) warnings.push("组件变体为空");

  // 3. 检查 variantCss 约束
  for (const v of variants) {
    const css = v.variantCss;
    if (css.includes("::before") || css.includes("::after")) {
      warnings.push(`[警告] 组件 ${v.component} 包含伪元素，Decoration Library 已禁止伪元素，请检查生成逻辑`);
    }
    if (css.includes("filter:")) {
      warnings.push(`组件 ${v.component} 包含 filter 属性，微信公众号支持有限`);
    }
    if (css.includes("position:fixed") || css.includes("position: sticky")) {
      warnings.push(`组件 ${v.component} 包含 fixed/sticky 定位，微信公众号不支持`);
    }
  }

  // 4. 生成 brand.md
  const brandDoc = generateBrandDoc(blueprint, profileType === "brand");

  return {
    manifest,
    variantCss: extractVariantCssMap(variants),
    warnings,
    brandDoc,
  };
}

// ── 生成 brand.md ──
export function generateBrandDoc(
  blueprint: Record<string, unknown>,
  isBrand: boolean
): string {
  const brandExpr = blueprint.brandExpression as Record<string, unknown> | undefined;
  const readingExp = blueprint.readingExperience as Record<string, unknown> | undefined;
  const compExpr = blueprint.componentExpression as Record<string, unknown> | undefined;
  const mapped = compExpr?.mappedComponents as Array<Record<string, unknown>> | undefined;
  const visual = blueprint.visualLanguage as Record<string, unknown> | undefined;
  const colors = (visual?.colors as Record<string, string>) || {};

  const lines: string[] = [];
  const title = isBrand ? "品牌语言说明" : "设计语言说明";
  lines.push(`# ${title}`);
  lines.push("");
  lines.push("> 由 WeMD Design Pipeline 自动生成");
  lines.push("");

  // 品牌/创作者概述
  if (brandExpr?.description) {
    lines.push("## 概述");
    lines.push("");
    lines.push(brandExpr.description as string);
    lines.push("");
  }

  // 品牌语气
  if (isBrand && brandExpr?.tone) {
    lines.push("## 品牌语气");
    lines.push("");
    const tone = brandExpr.tone as string[];
    tone.forEach((t) => lines.push(`- ${t}`));
    lines.push("");
  }

  // 视觉关键词
  if (brandExpr?.keywords && Array.isArray(brandExpr.keywords)) {
    lines.push("## 视觉关键词");
    lines.push("");
    (brandExpr.keywords as string[]).forEach((k: string) => lines.push(`- ${k}`));
    lines.push("");
  }

  // 色彩体系
  if (Object.keys(colors).length > 0) {
    lines.push("## 色彩体系");
    lines.push("");
    lines.push("| 用途 | 色值 |");
    lines.push("|------|------|");
    for (const [key, val] of Object.entries(colors)) {
      const label = key
        .replace(/([A-Z])/g, " $1")
        .replace(/^./, (s) => s.toUpperCase())
        .trim();
      lines.push(`| ${label} | \`${val}\` |`);
    }
    lines.push("");
  }

  // 阅读体验
  if (readingExp) {
    lines.push("## 排版偏好");
    lines.push("");
    if (readingExp.density) lines.push(`- **密度**: ${readingExp.density}`);
    if (readingExp.tone && Array.isArray(readingExp.tone)) {
      lines.push(`- **基调**: ${(readingExp.tone as string[]).join("、")}`);
    }
    if (readingExp.readingWidth) lines.push(`- **阅读宽度**: ${readingExp.readingWidth}`);
    lines.push("");
  }

  // 组件推荐
  if (mapped && mapped.length > 0) {
    lines.push("## 组件推荐");
    lines.push("");
    mapped.forEach((m) => {
      lines.push(`- **${m.component}**（${m.variant}）: ${m.reason || "—"}`);
    });
    lines.push("");
  }

  // 品牌资产
  if (brandExpr?.logo) {
    lines.push("## 品牌资产");
    lines.push("");
    lines.push("- Logo: 已内联到主题包");
    if (brandExpr?.slogan) lines.push(`- Slogan: ${brandExpr.slogan}`);
    lines.push("");
  }

  // 配置文件（针对创作者）
  if (!isBrand && brandExpr?.contentDirection) {
    lines.push("## 内容方向");
    lines.push("");
    lines.push(`- ${brandExpr.contentDirection}`);
    lines.push("");
  }

  return lines.join("\n");
}

// ── 打包为 .wemd-theme ZIP ──
export async function packageThemeZip(
  projectId: string,
  themeName: string,
  manifest: Record<string, unknown>,
  brandDoc: string,
  materials: Record<string, string>
): Promise<string> {
  const slug = themeName
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "theme";

  const zip = new AdmZip();

  // 1. manifest.json
  zip.addFile("manifest.json", Buffer.from(JSON.stringify(manifest, null, 2), "utf-8"));

  // 2. brand.md
  zip.addFile("brand.md", Buffer.from(brandDoc, "utf-8"));

  // 3. assets/images/
  for (const [key, svg] of Object.entries(materials)) {
    zip.addFile(`assets/images/${key}.svg`, Buffer.from(svg, "utf-8"));
  }

  // 4. 写入文件
  const themeDir = getProjectFilePath(projectId, "theme");
  await ensureDir(themeDir);
  const zipPath = join(themeDir, `${slug}.wemd-theme`);
  zip.writeZip(zipPath);

  // 5. 同时保存 manifest.json 方便直接查看
  await writeFile(join(themeDir, "manifest.json"), JSON.stringify(manifest, null, 2), "utf-8");

  console.log(`  ✓ 主题包已生成: ${slug}.wemd-theme`);
  return zipPath;
}

// ── 格式化颜色为 --wemd-xxx 格式 ──
function formatColors(colors: Record<string, string>): Record<string, string> {
  const formatted: Record<string, string> = {};
  for (const [key, value] of Object.entries(colors)) {
    formatted[`--wemd-${key}`] = value;
  }
  return formatted;
}

// ── 提取 variantCss 映射 ──
function extractVariantCssMap(variants: ComponentVariant[]): Record<string, string> {
  const map: Record<string, string> = {};
  for (const v of variants) {
    map[`${v.component}[data-variant="${v.variant}"]`] = v.variantCss;
  }
  return map;
}

// ── 生成 manifest.json 字符串 ──
export function formatManifestJSON(manifest: Record<string, unknown>): string {
  return JSON.stringify(manifest, null, 2);
}