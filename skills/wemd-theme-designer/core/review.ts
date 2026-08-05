// ============================================================
// 审核流水线 — 两个关键审核节点
// ============================================================
// 节点 A：Design Blueprint 审核（策略层）
//    Logic Layer 输出 → Constraint 检查 → 用户审核
// 节点 B：Theme Package 审核（实现层）
//    Compiler 输出 → Feedback 评估 → 用户审核

import type { DesignBlueprint, ThemePackage, FeedbackReport } from "./types";

// ── 审核记录 ──
export interface ReviewRecord {
  reviewId: string;
  projectId: string;
  stage: "blueprint" | "theme";
  status: "pending" | "approved" | "rejected";
  score?: number;
  feedback?: string;
  reviewedBy: "user" | "ai";
  createdAt: string;
  decidedAt?: string;
}

// ── 审核清单条目 ──
export interface ReviewChecklistItem {
  id: string;
  category: string;
  description: string;
  passed: boolean;
  detail?: string;
}

// ── Blueprint 审核清单 ──
export interface BlueprintReview {
  projectId: string;
  blueprint: DesignBlueprint;
  items: ReviewChecklistItem[];
  passed: boolean;
  summary: string;
}

// ── Theme 审核清单 ──
export interface ThemeReview {
  projectId: string;
  themePackage: ThemePackage;
  feedbackReport: FeedbackReport;
  items: ReviewChecklistItem[];
  passed: boolean;
  summary: string;
}

// ── 审核流水线 ──
export interface ReviewPipeline {
  /** 生成 Blueprint 审核清单 */
  createBlueprintReview(projectId: string): BlueprintReview;

  /** 生成 Theme 审核清单 */
  createThemeReview(projectId: string): ThemeReview;

  /** 提交审核 */
  submitReview(
    projectId: string,
    stage: "blueprint" | "theme"
  ): ReviewRecord;

  /** 通过审核 */
  approveReview(reviewId: string, score?: number): void;

  /** 驳回审核 */
  rejectReview(reviewId: string, feedback: string): void;

  /** 获取项目审核历史 */
  getReviewHistory(projectId: string): ReviewRecord[];

  /** 获取审核统计 */
  getReviewStats(projectId: string): {
    total: number;
    approved: number;
    rejected: number;
    averageScore: number;
  };
}

// ── 默认审核清单（由 Constraint Layer + Feedback Layer 生成） ──
export const DEFAULT_BLUEPRINT_CHECKLIST = [
  {
    id: "C1",
    category: "公众号平台约束",
    description: "无伪元素（::before/::after）/ 无 CSS 动画 / 无 position:fixed",
  },
  {
    id: "C2",
    category: "WeMD 规范约束",
    description: "manifest 结构完整、组件名合法",
  },
  {
    id: "C3",
    category: "CSS 变量约束",
    description: "变量命名符合 --wemd-xxx 规范，无不存在的变量引用",
  },
  {
    id: "C5",
    category: "品牌一致性",
    description: "Logo 使用频率、辅助图形覆盖、品牌色匹配",
  },
  {
    id: "C6",
    category: "组件合法性",
    description: "所有映射组件在 LEGAL_COMPONENTS 中",
  },
] as const;

export const DEFAULT_THEME_CHECKLIST = [
  {
    id: "F1",
    category: "品牌一致性",
    description: "Logo 使用频率、辅助图形覆盖、品牌色匹配度",
  },
  {
    id: "F2",
    category: "阅读体验",
    description: "fontSize 与 density 匹配，行距舒适",
  },
  {
    id: "F3",
    category: "组件覆盖",
    description: "所有映射组件已实现 variantCss",
  },
  {
    id: "F4",
    category: "约束遵守",
    description: "所有约束规则已通过（必须满分）",
  },
  {
    id: "F5",
    category: "概念一致性",
    description: "视觉隐喻与概念表达一致（仅 Creator）",
  },
] as const;