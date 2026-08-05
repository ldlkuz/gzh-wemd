// ============================================================
// Service 层接口 — 数据操作的唯一入口
// ============================================================
// Service 负责所有文件操作、目录管理、状态流转、任务队列；
// Skill 只负责输入→输出，不触碰文件系统。

import type {
  DesignProject,
  BrandProfile,
  CreatorProfile,
  DesignBlueprint,
  ThemePackage,
  ReviewRecord,
  ComponentVersion,
  Material,
} from "./types";

// ── Project Service 接口 ──
export interface ProjectService {
  // ── 项目生命周期 ──
  createProject(profile: BrandProfile | CreatorProfile): DesignProject;
  getProject(id: string): DesignProject;
  updateProfile(id: string, profile: Partial<BrandProfile | CreatorProfile>): DesignProject;
  deleteProject(id: string): void;

  // ── 设计管道触发 ──
  runDesignPipeline(projectId: string): Promise<DesignBlueprint>;
  //  内部流程：
  //  1. Service 组装输入（Profile + DesignMemory）
  //  2. 调用 Skill（传入结构化数据）
  //  3. Skill 执行 5 层管道，输出 DesignBlueprint
  //  4. Service 保存 DesignBlueprint 到 project 文件

  // ── 编译 ──
  compileTheme(projectId: string): Promise<ThemePackage>;
  //  1. 确保 DesignBlueprint 已审核通过
  //  2. 调用 Skill 的 Compiler 子流程
  //  3. Service 保存 ThemePackage

  // ── 审核 ──
  submitForReview(projectId: string): ReviewRecord;
  approveBlueprint(projectId: string): void;
  rejectBlueprint(projectId: string, feedback: string): void;

  // ── 版本管理 ──
  createComponentVersion(
    projectId: string,
    component: string,
    data: ComponentData
  ): void;
  getComponentVersions(
    projectId: string,
    component: string
  ): ComponentVersion[];
  rollbackComponent(
    projectId: string,
    component: string,
    version: number
  ): void;

  // ── 素材管理 ──
  saveMaterial(
    projectId: string,
    element: string,
    usage: string,
    svg: string
  ): void;
  getMaterial(
    projectId: string,
    element: string,
    usage: string
  ): string | null;
  getMaterialWorkspace(projectId: string): Material[];
}

// ── 组件数据 ──
export interface ComponentData {
  variant: string;
  variantCss: string;
  changeLog: string;
}

// ── 素材 ──
export interface Material {
  element: string;
  usage: string;
  svg: string;
  createdAt: string;
}

// ── Skill 输入/输出契约 ──
export interface SkillInput {
  projectId: string;
  profile: BrandProfile | CreatorProfile;
  designMemory: import("./types").DesignMemory | null;
  action: "generate-blueprint" | "compile" | "feedback" | "modify";
}

export interface SkillOutput {
  projectId: string;
  success: boolean;
  data: DesignBlueprint | ThemePackage | FeedbackReport | null;
  errors?: string[];
}

// ── 任务队列 ──
export interface DesignTask {
  taskId: string;
  projectId: string;
  type: "generate-theme" | "regenerate" | "modify-component" | "compile";
  input: Record<string, unknown>;
  status: "pending" | "processing" | "done" | "failed";
  createdAt: string;
  updatedAt: string;
  error?: string;
}

// ── 目录结构常量 ──
export const PROJECT_DIR_STRUCTURE = {
  files: [
    "project.json",
    "profile.json",
    "design-blueprint.json",
    "design-memory.json",
    "decision-log.json",
  ],
  directories: [
    "theme/",
    "materials/assets/",
    "reviews/",
  ],
} as const;

export const WORKSPACE_DIR_STRUCTURE = {
  directories: [
    "inbox/",
    "processing/",
    "done/",
    "failed/",
    "logs/",
  ],
} as const;