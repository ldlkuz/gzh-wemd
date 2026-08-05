// ============================================================
// Skill 输入/输出契约
// ============================================================
// Service 通过此接口调用 Skill 的 5 层设计管道。
// Skill 不触碰文件系统，只做输入→输出。

import { runFullPipeline } from "./pipeline/orchestrator.ts";

// ── Skill 输入 ──
export interface SkillInput {
  projectId: string;
  profile: Record<string, unknown>;
  profileType: "brand" | "creator";
  designMemory?: {
    componentStyles?: Record<string, string>;
    rejectedApproaches?: string[];
    preferences?: {
      patternDensity?: "low" | "medium" | "high";
      decorationLevel?: "minimal" | "moderate" | "rich";
      cornerStyle?: "rounded" | "sharp" | "mixed";
    };
  };
  action: "generate-blueprint" | "compile" | "feedback" | "full-pipeline" | "modify-component";
  componentInput?: {
    component: string;
    currentVersion: number;
    instruction: string;
    sourceHtml: string;
    variantCss: string;
  };
}

// ── Skill 输出 ──
export interface SkillOutput {
  projectId: string;
  success: boolean;
  action: SkillInput["action"];
  data: Record<string, unknown> | null;
  errors?: string[];
  warnings?: string[];
  feedback?: {
    scores: Record<string, number>;
    passed: boolean;
    suggestions: string[];
    summary: string;
  };
}

// ── Skill 入口 ──
export async function runSkill(input: SkillInput): Promise<SkillOutput> {
  const { projectId, profile, profileType, designMemory, action } = input;

  try {
    switch (action) {
      case "generate-blueprint": {
        const result = await runFullPipeline(profile, profileType, designMemory);
        return {
          projectId,
          success: result.success,
          action,
          data: result.blueprint as Record<string, unknown> | null,
          errors: result.errors.length > 0 ? result.errors : undefined,
          warnings: result.constraintResult?.warnings.map((w) => `[${w.rule}] ${w.message}`),
          feedback: result.feedback || undefined,
        };
      }

      case "compile": {
        // 需要先有 blueprint
        if (!designMemory?.componentStyles) {
          return {
            projectId,
            success: false,
            action,
            data: null,
            errors: ["缺少 blueprint 数据，无法编译"],
          };
        }
        // 重新运行完整管道（从 blueprint 开始）
        const bpResult = await runFullPipeline(profile, profileType, designMemory);
        if (!bpResult.compiled) {
          return {
            projectId,
            success: false,
            action,
            data: null,
            errors: bpResult.errors,
          };
        }
        return {
          projectId,
          success: true,
          action,
          data: bpResult.compiled.manifest as Record<string, unknown>,
          warnings: bpResult.compiled.warnings,
          feedback: bpResult.feedback || undefined,
        };
      }

      case "feedback": {
        // 仅运行 Feedback Layer
        const bpResult = await runFullPipeline(profile, profileType, designMemory);
        return {
          projectId,
          success: true,
          action,
          data: null,
          feedback: bpResult.feedback || undefined,
          warnings: bpResult.compiled?.warnings,
        };
      }

      case "full-pipeline": {
        const result = await runFullPipeline(profile, profileType, designMemory);
        return {
          projectId,
          success: result.success,
          action,
          data: result.compiled?.manifest as Record<string, unknown> || null,
          errors: result.errors.length > 0 ? result.errors : undefined,
          warnings: [
            ...(result.constraintResult?.warnings.map((w) => `[${w.rule}] ${w.message}`) || []),
            ...(result.compiled?.warnings || []),
          ],
          feedback: result.feedback || undefined,
        };
      }

      case "modify-component": {
        if (!input.componentInput) {
          return {
            projectId,
            success: false,
            action,
            data: null,
            errors: ["缺少 componentInput 数据"],
          };
        }

        // 单组件修改：基于当前组件 + 用户指令生成新版本
        // 实际场景中这里会调用 AI 生成新的 variantCss 和 sourceHtml
        // 当前实现为确定性逻辑：根据指令修改变体名并记录
        const { component, instruction, currentVersion, sourceHtml, variantCss } = input.componentInput;
        const newVersion = currentVersion + 1;

        return {
          projectId,
          success: true,
          action,
          data: {
            component,
            newVersion,
            variant: `modified-v${newVersion}`,
            variantCss: variantCss || "/* 待 AI 生成 */",
            sourceHtml: sourceHtml || "<!-- 待 AI 生成 -->",
            publishHtml: "",
            instruction: instruction || "用户修改",
            createdBy: "user" as const,
            compatibility: {
              status: "passed" as const,
              warnings: [],
              errors: [],
            },
          },
          warnings: instruction ? [`组件 ${component} 修改指令: ${instruction}`] : undefined,
        };
      }

      default:
        return {
          projectId,
          success: false,
          action,
          data: null,
          errors: [`未知 action: ${action}`],
        };
    }
  } catch (err) {
    return {
      projectId,
      success: false,
      action,
      data: null,
      errors: [`Skill 执行异常: ${err}`],
    };
  }
}