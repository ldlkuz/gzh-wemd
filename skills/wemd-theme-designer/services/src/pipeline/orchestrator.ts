// ============================================================
// Pipeline Orchestrator — 5 层管道编排器
// ============================================================
// 按顺序调用 5 层，处理中间结果保存和回退。

import { generateDesignBlueprint, generateBrandSystem, getLegalComponents } from "./logic-layer.ts";
import { checkBlueprintConstraints } from "./constraint-layer.ts";
import { generateVariants, generateMaterialDescription, generateComponentSourceHtml } from "./application-layer.ts";
import { compileTheme, formatManifestJSON, packageThemeZip } from "./compiler-layer.ts";
import { evaluateQuality } from "./feedback-layer.ts";
import { runDecorationLayer } from "./decoration-layer.ts";
import type { CompiledTheme, ComponentVariant, DecorationPlan, MapResult } from "./pipeline-types.ts";

// ── 管道结果 ──
export interface PipelineResult {
  success: boolean;
  blueprint: Record<string, unknown> | null;
  brandSystem: Record<string, unknown> | null;
  constraintResult: { passed: boolean; errors: unknown[]; warnings: unknown[] } | null;
  decorationPlan: DecorationPlan | null;
  decorationMapResult: MapResult | null;
  variants: ComponentVariant[];
  compiled: CompiledTheme | null;
  feedback: {
    scores: Record<string, number>;
    passed: boolean;
    suggestions: string[];
    summary: string;
  } | null;
  errors: string[];
}

// ── 运行完整 5 层管道 ──
export async function runFullPipeline(
  profile: Record<string, unknown>,
  profileType: "brand" | "creator",
  designMemory?: {
    componentStyles?: Record<string, string>;
    rejectedApproaches?: string[];
    preferences?: {
      patternDensity?: "low" | "medium" | "high";
      decorationLevel?: "minimal" | "moderate" | "rich";
      cornerStyle?: "rounded" | "sharp" | "mixed";
    };
  },
  projectId?: string  // 用于保存 ZIP 包
): Promise<PipelineResult> {
  const errors: string[] = [];
  const result: PipelineResult = {
    success: false,
    blueprint: null,
    brandSystem: null,
    constraintResult: null,
    decorationPlan: null,
    decorationMapResult: null,
    variants: [],
    compiled: null,
    feedback: null,
    errors,
  };

  // ── Layer 1: Logic Layer ──
  console.log("  [Layer 1/5] Logic Layer — 生成 Design Blueprint...");
  try {
    result.blueprint = generateDesignBlueprint(profile, profileType, designMemory);

    // 生成 BrandSystem
    result.brandSystem = generateBrandSystem(profile, profileType, result.blueprint);
    (result.blueprint as any).brandSystem = result.brandSystem;

    console.log(`    ✓ Blueprint 已生成 (含 BrandSystem)`);
  } catch (err) {
    errors.push(`Logic Layer 失败: ${err}`);
    return result;
  }

  // ── Layer 2: Constraint Layer ──
  console.log("  [Layer 2/5] Constraint Layer — 约束检查...");
  try {
    result.constraintResult = checkBlueprintConstraints(result.blueprint);
    const passed = result.constraintResult.passed;
    const errorCount = result.constraintResult.errors.length;
    const warnCount = result.constraintResult.warnings.length;
    console.log(`    ${passed ? "✓" : "✗"} 通过: ${passed}, 错误: ${errorCount}, 警告: ${warnCount}`);

    if (!passed) {
      for (const err of result.constraintResult.errors) {
        errors.push(`[${err.rule}] ${err.message}`);
      }
      // 不阻断，继续执行以收集完整反馈
    }
  } catch (err) {
    errors.push(`Constraint Layer 失败: ${err}`);
    return result;
  }

  // ── Layer 2.5: Decoration Layer（装饰层，新增） ──
  console.log("  [Layer 2.5/5] Decoration Layer — 装饰组合与映射...");
  try {
    const compExpr = result.blueprint?.componentExpression as Record<string, unknown> | undefined;
    const mapped = (compExpr?.mappedComponents as Array<Record<string, unknown>>) || [];
    const keywords = (profile.keywords as string[]) || [];
    const readingExp = result.blueprint?.readingExperience as Record<string, unknown> | undefined;
    const density = (readingExp?.density as "low" | "medium" | "high") || "medium";

    const decoInput = {
      keywords,
      density,
      mappedComponents: mapped.map((m: Record<string, unknown>) => ({
        component: m.component as string,
        variant: m.variant as string,
      })),
      // 如果 AI 在 blueprint 中提供了 decorationPlan，直接使用
      decorationPlan: (result.blueprint as any)?.decorationPlan as DecorationPlan | undefined,
    };

    const decoOutput = runDecorationLayer(decoInput);
    result.decorationPlan = decoOutput.decorationPlan;
    result.decorationMapResult = decoOutput.mapResult;

    // 将装饰结果注入 blueprint，供 application layer 使用
    (result.blueprint as any).decorationPlan = decoOutput.decorationPlan;
    (result.blueprint as any).decorationMapResult = decoOutput.mapResult;

    const compCount = Object.keys(decoOutput.decorationPlan.components).length;
    const atomCount = Object.values(decoOutput.decorationPlan.components)
      .reduce((sum, c) => sum + c.atoms.length, 0);
    console.log(`    ✓ 装饰层: ${compCount} 个组件, ${atomCount} 个装饰原子`);

    // 输出校验警告
    for (const [comp, vResult] of Object.entries(decoOutput.validationResult)) {
      if (!vResult.passed) {
        for (const err of vResult.errors) {
          console.log(`    ✕ [${comp}] ${err.message}`);
        }
      }
      for (const warn of vResult.warnings) {
        console.log(`    ⚠ [${comp}] ${warn.message}`);
      }
    }
  } catch (err) {
    errors.push(`Decoration Layer 失败: ${err}`);
    return result;
  }

  // ── Layer 3: Application Layer ──
  console.log("  [Layer 3/5] Application Layer — 生成组件样式...");
  try {
    result.variants = generateVariants(result.blueprint);
    const materials = generateMaterialDescription(result.blueprint);
    console.log(`    ✓ 生成了 ${result.variants.length} 个组件变体, ${Object.keys(materials).length} 个素材`);

    // 将生成的组件变体保存到 components/ 目录
    if (projectId) {
      const { createComponent, addComponentVersion, getComponent } = await import("../project-service.ts");
      // 先保存有关键词匹配的组件变体
      for (const variant of result.variants) {
        const type = variant.component;
        const existing = await getComponent(projectId, type);
        if (!existing) {
          await createComponent(projectId, type, type.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase()));
        }
        const sourceHtml = generateComponentSourceHtml(type, variant.variant);
        await addComponentVersion(projectId, type, {
          variant: variant.variant,
          variantCss: variant.variantCss || "",
          instruction: `管道生成: ${variant.variant}`,
          sourceHtml,
          publishHtml: "",
          createdBy: "ai",
        });
      }

      // 再为剩余的全部 35 种组件创建基本条目（确保审核工作台能显示所有组件）
      const allLegal = getLegalComponents();
      const generatedTypes = new Set(result.variants.map(v => v.component));
      for (const type of allLegal) {
        if (generatedTypes.has(type)) continue; // 已生成，跳过
        const existing = await getComponent(projectId, type);
        if (!existing) {
          await createComponent(projectId, type, type.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase()));
        }
        const sourceHtml = generateComponentSourceHtml(type, `${type}-default`);
        const basicCss = `#wemd .wemd-${type}[data-variant="${type}-default"] {\n  padding: 1em;\n  color: var(--wemd-textPrimary, #1A1A2E);\n}`;
        await addComponentVersion(projectId, type, {
          variant: `${type}-default`,
          variantCss: basicCss,
          instruction: `管道生成基础外观: ${type}`,
          sourceHtml,
          publishHtml: "",
          createdBy: "ai",
        });
      }
      console.log(`    ✓ 已保存 ${result.variants.length + (allLegal.length - generatedTypes.size)} 个组件到 components/ (含 ${allLegal.length - generatedTypes.size} 个基础组件)`);
    }
  } catch (err) {
    errors.push(`Application Layer 失败: ${err}`);
    return result;
  }

  // ── Layer 4: Compiler Layer ──
  console.log("  [Layer 4/5] Compiler Layer — 编译主题包...");
  try {
    const materials = generateMaterialDescription(result.blueprint);
    result.compiled = compileTheme(result.blueprint, result.variants, materials);
    if (result.compiled.warnings.length > 0) {
      for (const w of result.compiled.warnings) {
        console.log(`    ⚠ ${w}`);
      }
    }
    console.log(`    ✓ manifest.json 已编译`);

    // 打包为 .wemd-theme ZIP
    if (projectId) {
      const themeName = (profile.name as string) || (profile.projectName as string) || "theme";
      result.compiled.zipPath = await packageThemeZip(
        projectId,
        themeName,
        result.compiled.manifest,
        result.compiled.brandDoc,
        materials
      );
    }
  } catch (err) {
    errors.push(`Compiler Layer 失败: ${err}`);
    return result;
  }

  // ── Layer 5: Feedback Layer ──
  console.log("  [Layer 5/5] Feedback Layer — 质量评估...");
  try {
    const constraintPassed = result.constraintResult?.passed ?? false;
    const compiledWarnings = result.compiled?.warnings ?? [];
    result.feedback = evaluateQuality(result.blueprint, constraintPassed, compiledWarnings);
    console.log(`    ${result.feedback.passed ? "✓" : "△"} ${result.feedback.summary}`);
    if (result.feedback.suggestions.length > 0) {
      for (const s of result.feedback.suggestions.slice(0, 3)) {
        console.log(`    · ${s}`);
      }
    }
  } catch (err) {
    errors.push(`Feedback Layer 失败: ${err}`);
    return result;
  }

  result.success = errors.length === 0;
  return result;
}

// ── 生成文件名 ──
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}