// ============================================================
// Project Service — 项目管理
// ============================================================
// 项目 CRUD、状态流转、审核流水线

import { join } from "node:path";
import type {
  DesignProject,
  ProjectStatus,
  DesignMemory,
  ReviewRecord,
  DecisionLogEntry,
  ComponentVersion,
  BrandSystem,
  BrandComponent,
  ComponentVersionDetail,
  ComponentReview,
  ComponentDecision,
  ComponentDesignMemory,
  ComponentRevisionTask,
  RevisionSource,
} from "./types.ts";
import {
  initProjectDir,
  readJSON,
  writeJSON,
  listProjects,
  deleteProjectDir,
  getProjectFilePath,
  ensureDir,
  readProjectState,
  writeProjectState,
  patchProjectState,
  writeRevisionTask,
  readRevisionTask as _readRevisionTask,
  listRevisionTasks as _listRevisionTasks,
  countPendingRevisionTasks,
  deleteRevisionTask as _deleteRevisionTask,
} from "./file-service.ts";
import { ulid } from "./utils.ts";

// ── 创建项目 ──
export async function createProject(
  name: string,
  profileType: "brand" | "creator",
  profile: Record<string, unknown>
): Promise<DesignProject> {
  const id = name.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]/g, "-");
  const now = new Date().toISOString();

  const project: DesignProject = {
    id,
    name,
    profileType,
    status: "NEW",
    createdAt: now,
    updatedAt: now,
    profile,
    designBlueprint: null,
    themePackage: null,
    designMemory: {
      decisions: [],
      componentStyles: {},
      preferences: {
        patternDensity: "medium",
        decorationLevel: "moderate",
        cornerStyle: "rounded",
      },
      rejectedApproaches: [],
    },
    reviewRecords: [],
    decisionLog: [],
  };

  // 初始化目录
  await initProjectDir(id);

  // 写入文件
  await Promise.all([
    writeJSON(getProjectFilePath(id, "project.json"), project),
    writeJSON(getProjectFilePath(id, "profile.json"), profile),
    writeJSON(getProjectFilePath(id, "design-memory.json"), project.designMemory),
    writeJSON(getProjectFilePath(id, "decision-log.json"), []),
  ]);

  console.log(`  ✓ 项目已创建: ${name} (${id})`);
  return project;
}

// ── 获取项目 ──
export async function getProject(id: string): Promise<DesignProject | null> {
  return readJSON<DesignProject>(getProjectFilePath(id, "project.json"));
}

// ── 列出所有项目 ──
export async function listAllProjects(): Promise<string[]> {
  return listProjects();
}

// ── 更新项目状态 ──
export async function updateProjectStatus(
  id: string,
  status: ProjectStatus
): Promise<DesignProject | null> {
  const project = await getProject(id);
  if (!project) return null;

  project.status = status;
  project.updatedAt = new Date().toISOString();
  await writeJSON(getProjectFilePath(id, "project.json"), project);
  return project;
}

// ── 更新 Profile ──
export async function updateProfile(
  id: string,
  profile: Record<string, unknown>
): Promise<DesignProject | null> {
  const project = await getProject(id);
  if (!project) return null;

  project.profile = profile;
  project.updatedAt = new Date().toISOString();
  await Promise.all([
    writeJSON(getProjectFilePath(id, "project.json"), project),
    writeJSON(getProjectFilePath(id, "profile.json"), profile),
  ]);
  return project;
}

// ── 保存 Design Blueprint ──
export async function saveBlueprint(
  id: string,
  blueprint: Record<string, unknown>
): Promise<DesignProject | null> {
  const project = await getProject(id);
  if (!project) return null;

  project.designBlueprint = blueprint;
  project.status = "GENERATING";
  project.updatedAt = new Date().toISOString();
  await Promise.all([
    writeJSON(getProjectFilePath(id, "project.json"), project),
    writeJSON(getProjectFilePath(id, "design-blueprint.json"), blueprint),
  ]);
  return project;
}

// ── 保存主题包信息 ──
export async function saveThemePackage(
  id: string,
  themePackage: { zipPath: string; manifest: Record<string, unknown> }
): Promise<DesignProject | null> {
  const project = await getProject(id);
  if (!project) return null;

  project.themePackage = themePackage;
  project.status = "PREVIEW";
  project.updatedAt = new Date().toISOString();
  await writeJSON(getProjectFilePath(id, "project.json"), project);
  return project;
}

// ── 删除项目 ──
export async function deleteProject(id: string): Promise<void> {
  await deleteProjectDir(id);
  console.log(`  ✓ 项目已删除: ${id}`);
}

// ── 审核操作 ──

// 提交审核
export async function submitForReview(
  projectId: string,
  stage: "blueprint" | "theme"
): Promise<ReviewRecord | null> {
  const project = await getProject(projectId);
  if (!project) return null;

  const review: ReviewRecord = {
    reviewId: ulid(),
    projectId,
    stage,
    status: "pending",
    reviewedBy: "user",
    createdAt: new Date().toISOString(),
  };

  project.reviewRecords.push(review);
  project.status = "PREVIEW";
  project.updatedAt = new Date().toISOString();
  await writeJSON(getProjectFilePath(projectId, "project.json"), project);
  await writeJSON(
    getProjectFilePath(projectId, "reviews", `${stage}-review.json`),
    review
  );

  console.log(`  ✓ 已提交 ${stage === "blueprint" ? "Blueprint" : "Theme"} 审核`);
  return review;
}

// 通过审核
export async function approveReview(
  projectId: string,
  stage: "blueprint" | "theme",
  score?: number
): Promise<DesignProject | null> {
  const project = await getProject(projectId);
  if (!project) return null;

  const review = project.reviewRecords.find(
    (r) => r.stage === stage && r.status === "pending"
  );
  if (!review) {
    console.log(`  ! 未找到待审核的 ${stage} 记录`);
    return null;
  }

  review.status = "approved";
  review.score = score;
  review.decidedAt = new Date().toISOString();

  project.status =
    stage === "blueprint" ? "GENERATING" : "APPROVED";
  project.updatedAt = new Date().toISOString();

  // 记录决策日志
  const log: DecisionLogEntry = {
    version: project.decisionLog.length + 1,
    stage: `review-${stage}`,
    decision: "approved",
    reason: score ? `审核通过，评分: ${score}` : "审核通过",
    timestamp: new Date().toISOString(),
  };
  project.decisionLog.push(log);

  await Promise.all([
    writeJSON(getProjectFilePath(projectId, "project.json"), project),
    writeJSON(getProjectFilePath(projectId, "decision-log.json"), project.decisionLog),
  ]);

  console.log(`  ✓ ${stage === "blueprint" ? "Blueprint" : "Theme"} 审核通过`);
  return project;
}

// 驳回审核
export async function rejectReview(
  projectId: string,
  stage: "blueprint" | "theme",
  feedback: string
): Promise<DesignProject | null> {
  const project = await getProject(projectId);
  if (!project) return null;

  const review = project.reviewRecords.find(
    (r) => r.stage === stage && r.status === "pending"
  );
  if (!review) return null;

  review.status = "rejected";
  review.feedback = feedback;
  review.decidedAt = new Date().toISOString();

  project.status =
    stage === "blueprint" ? "NEW" : "PREVIEW";
  project.updatedAt = new Date().toISOString();

  const log: DecisionLogEntry = {
    version: project.decisionLog.length + 1,
    stage: `review-${stage}`,
    decision: "rejected",
    reason: feedback,
    timestamp: new Date().toISOString(),
  };
  project.decisionLog.push(log);

  await Promise.all([
    writeJSON(getProjectFilePath(projectId, "project.json"), project),
    writeJSON(getProjectFilePath(projectId, "decision-log.json"), project.decisionLog),
  ]);

  console.log(`  ✗ ${stage === "blueprint" ? "Blueprint" : "Theme"} 审核驳回: ${feedback}`);
  return project;
}

// ── 获取项目状态 ──
export async function getProjectStatus(id: string): Promise<{
  project: DesignProject | null;
  exists: boolean;
  path: string;
}> {
  const project = await getProject(id);
  return {
    project,
    exists: project !== null,
    path: getProjectFilePath(id, "project.json"),
  };
}

// ── 读取 state.json ──
export async function getProjectState(
  id: string
): Promise<{ projectId: string; status: string; progress?: Record<string, unknown>; updatedAt: string } | null> {
  return readProjectState(id);
}

// ── 更新 state.json ──
export async function updateProjectState(
  id: string,
  status: string,
  progress?: { step: number; total: number; current: string; percent: number }
): Promise<void> {
  await writeProjectState(id, status, progress);
  // 同步更新 project.json 中的 status
  const project = await getProject(id);
  if (project) {
    project.status = status as any;
    project.updatedAt = new Date().toISOString();
    await writeJSON(getProjectFilePath(id, "project.json"), project);
  }
}

// ═══════════════════════════════════════════════
// 组件 CRUD (BrandComponent)
// ═══════════════════════════════════════════════

// ── 创建组件 ──
export async function createComponent(
  projectId: string,
  type: string,
  name: string
): Promise<BrandComponent | null> {
  const project = await getProject(projectId);
  if (!project) return null;

  const now = new Date().toISOString();
  const component: BrandComponent = {
    id: `${type}-${ulid().slice(0, 8)}`,
    type,
    name,
    status: "not-generated",
    currentVersion: 0,
    approvedVersion: null,
    contentSchema: {},
    assetRefs: [],
    versions: [],
    review: null,
    decisions: [],
  };

  // 保存到 components 目录
  const compDir = getProjectFilePath(projectId, "components");
  await ensureDir(compDir);
  await writeJSON(getProjectFilePath(projectId, "components", `${type}.json`), component);

  // 记录到 project.json
  project.updatedAt = now;
  await writeJSON(getProjectFilePath(projectId, "project.json"), project);

  console.log(`  ✓ 组件已创建: ${type} (${name})`);
  return component;
}

// ── 获取组件 ──
export async function getComponent(
  projectId: string,
  type: string
): Promise<BrandComponent | null> {
  return readJSON<BrandComponent>(
    getProjectFilePath(projectId, "components", `${type}.json`)
  );
}

// ── 列出所有组件 ──
export async function listAllComponents(
  projectId: string
): Promise<BrandComponent[]> {
  const compDir = getProjectFilePath(projectId, "components");
  const { readdir } = await import("node:fs/promises");
  const { existsSync } = await import("node:fs");

  if (!existsSync(compDir)) return [];

  const files = await readdir(compDir);
  const components: BrandComponent[] = [];
  for (const file of files) {
    if (!file.endsWith(".json")) continue;
    const comp = await readJSON<BrandComponent>(compDir + "/" + file);
    if (comp) components.push(comp);
  }
  return components;
}

// ── 更新组件 ──
export async function updateComponent(
  projectId: string,
  type: string,
  updates: Partial<BrandComponent>
): Promise<BrandComponent | null> {
  const component = await getComponent(projectId, type);
  if (!component) return null;

  Object.assign(component, updates);
  await writeJSON(getProjectFilePath(projectId, "components", `${type}.json`), component);

  const project = await getProject(projectId);
  if (project) {
    project.updatedAt = new Date().toISOString();
    await writeJSON(getProjectFilePath(projectId, "project.json"), project);
  }

  console.log(`  ✓ 组件已更新: ${type}`);
  return component;
}

// ── 删除组件 ──
export async function deleteComponent(
  projectId: string,
  type: string
): Promise<void> {
  const filePath = getProjectFilePath(projectId, "components", `${type}.json`);
  const { existsSync, unlinkSync } = await import("node:fs");
  if (existsSync(filePath)) {
    unlinkSync(filePath);
    console.log(`  ✓ 组件已删除: ${type}`);
  }
}

// ── 添加组件版本 ──
export async function addComponentVersion(
  projectId: string,
  type: string,
  data: {
    variant: string;
    variantCss: string;
    instruction: string;
    sourceHtml: string;
    publishHtml: string;
    assetRefs?: string[];
    createdBy?: "ai" | "user";
  }
): Promise<ComponentVersionDetail | null> {
  const component = await getComponent(projectId, type);
  if (!component) return null;

  const now = new Date().toISOString();
  const newVersion: ComponentVersionDetail = {
    version: component.currentVersion + 1,
    component: type,
    variant: data.variant,
    variantCss: data.variantCss,
    createdAt: now,
    createdBy: data.createdBy || "ai",
    status: "approved",
    changeLog: data.instruction,
    parentVersion: component.currentVersion > 0 ? component.currentVersion : undefined,
    instruction: data.instruction,
    sourceHtml: data.sourceHtml,
    publishHtml: data.publishHtml,
    assetRefs: data.assetRefs || [],
    compatibility: {
      status: "passed",
      warnings: [],
      errors: [],
    },
  };

  component.versions.push(newVersion);
  component.currentVersion = newVersion.version;
  // 默认通过：AI 生成的版本即视为已通过，只有用户主动驳回才标记为需修改
  component.status = "approved";
  component.approvedVersion = newVersion.version;
  component.review = {
    component: type,
    status: "approved",
    score: undefined,
    reviewer: "ai",
    comments: ["AI 生成版本默认通过"],
    createdAt: now,
    decidedAt: now,
  };

  // 版本清理：保留所有 approved/locked + 最近 3 个 draft/reviewing
  await trimComponentVersions(projectId, type, component);

  await writeJSON(getProjectFilePath(projectId, "components", `${type}.json`), component);

  const project = await getProject(projectId);
  if (project) {
    project.updatedAt = new Date().toISOString();
    await writeJSON(getProjectFilePath(projectId, "project.json"), project);
  }

  console.log(`  ✓ 组件 ${type} v${newVersion.version} 版本已添加: ${data.instruction}`);
  return newVersion;
}

// ── 版本清理：保留所有 approved/locked + 最近 3 个 draft/reviewing ──
const MAX_DRAFT_VERSIONS = 3;

async function trimComponentVersions(
  projectId: string,
  type: string,
  component: BrandComponent,
): Promise<void> {
  const versions = component.versions;
  if (versions.length <= MAX_DRAFT_VERSIONS) return;

  // 分离已审核版本和草稿版本
  const protectedStatuses = new Set(["approved", "locked"]);
  const protectedVersions = versions.filter((v) =>
    protectedStatuses.has(v.status),
  );
  const draftVersions = versions.filter(
    (v) => !protectedStatuses.has(v.status),
  );

  // 草稿版本按版本号降序，保留最近 MAX_DRAFT_VERSIONS 个
  const draftsToKeep = draftVersions
    .sort((a, b) => b.version - a.version)
    .slice(0, MAX_DRAFT_VERSIONS);
  const draftsToRemove = draftVersions
    .sort((a, b) => b.version - a.version)
    .slice(MAX_DRAFT_VERSIONS);

  if (draftsToRemove.length === 0) return;

  // 删除多余草稿版本对应的 v*.json 文件
  const { existsSync, unlinkSync } = await import("node:fs");
  const versionDir = getProjectFilePath(projectId, "versions", type);
  for (const v of draftsToRemove) {
    const filePath = join(versionDir, `v${v.version}.json`);
    if (existsSync(filePath)) {
      try {
        unlinkSync(filePath);
        console.log(`  🗑 组件 ${type} v${v.version} 已清理（超出 ${MAX_DRAFT_VERSIONS} 个草稿上限）`);
      } catch (err) {
        console.warn(`  ! 无法删除 ${type} v${v.version}: ${err}`);
      }
    }
  }

  // 重组 versions 数组：保留的草稿 + 已审核版本，按版本号升序
  const keepSet = new Set(draftsToKeep.map((v) => v.version));
  component.versions = versions.filter(
    (v) => protectedStatuses.has(v.status) || keepSet.has(v.version),
  ).sort((a, b) => a.version - b.version);
}

// ── 更新组件审核状态 ──
export async function updateComponentReview(
  projectId: string,
  type: string,
  review: {
    status: ComponentStatus;
    score?: number;
    comments?: string[];
  }
): Promise<BrandComponent | null> {
  const component = await getComponent(projectId, type);
  if (!component) return null;

  const now = new Date().toISOString();
  component.review = {
    component: type,
    status: review.status,
    score: review.score,
    reviewer: "human",
    comments: review.comments || [],
    createdAt: component.review?.createdAt || now,
    decidedAt: now,
  };

  component.status = review.status;
  if (review.status === "approved") {
    component.approvedVersion = component.currentVersion;
  } else if (review.status === "revision-requested" || review.status === "rejected") {
    // 驳回时清空 approvedVersion，标记当前版本未通过
    component.approvedVersion = null;
  }

  // 添加决策记录
  const decision: ComponentDecision = {
    version: component.currentVersion,
    decision: review.status === "approved" ? "approve" : review.status === "locked" ? "approve" : "reject",
    reason: review.comments?.join("; ") || "审核完成",
    timestamp: now,
  };
  component.decisions.push(decision);

  await writeJSON(getProjectFilePath(projectId, "components", `${type}.json`), component);

  const project = await getProject(projectId);
  if (project) {
    project.updatedAt = now;
    await writeJSON(getProjectFilePath(projectId, "project.json"), project);
  }

  console.log(`  ✓ 组件 ${type} 审核状态已更新: ${review.status}`);
  return component;
}

// ═══════════════════════════════════════════════
// 版本管理
// ═══════════════════════════════════════════════

// ── 创建组件版本 ──
export async function createComponentVersion(
  projectId: string,
  component: string,
  data: { variant: string; variantCss: string; changeLog: string; createdBy?: "ai" | "user" }
): Promise<ComponentVersion | null> {
  const project = await getProject(projectId);
  if (!project) return null;

  // 检查是否 locked
  const existingVersions = await getComponentVersions(projectId, component);
  const latestLocked = existingVersions.find((v) => v.status === "locked");
  if (latestLocked) {
    console.log(`  ! 组件 ${component} 的 v${latestLocked.version} 已锁定，不可修改`);
    return null;
  }

  // 计算新版本号
  const latestVersion = existingVersions.reduce((max, v) => Math.max(max, v.version), 0);
  const newVersion: ComponentVersion = {
    version: latestVersion + 1,
    component,
    variant: data.variant,
    variantCss: data.variantCss,
    createdAt: new Date().toISOString(),
    createdBy: data.createdBy || "ai",
    status: "draft",
    changeLog: data.changeLog,
    parentVersion: latestVersion > 0 ? latestVersion : undefined,
  };

  // 保存版本文件
  const versionDir = getProjectFilePath(projectId, "versions", component);
  await ensureDir(versionDir);
  await writeJSON(
    join(versionDir, `v${newVersion.version}.json`),
    newVersion
  );

  // 更新 project.json 中的 componentStyles
  project.designMemory.componentStyles[component] = data.variant;
  project.updatedAt = new Date().toISOString();
  await writeJSON(getProjectFilePath(projectId, "project.json"), project);

  console.log(`  ✓ 组件 ${component} v${newVersion.version} 已创建: ${data.changeLog}`);
  return newVersion;
}

// ── 获取组件版本列表 ──
export async function getComponentVersions(
  projectId: string,
  component: string
): Promise<ComponentVersion[]> {
  const versionDir = getProjectFilePath(projectId, "versions", component);
  const { readdir } = await import("node:fs/promises");
  const { existsSync } = await import("node:fs");

  if (!existsSync(versionDir)) return [];

  const files = await readdir(versionDir);
  const versionFiles = files.filter((f) => f.endsWith(".json")).sort();

  const versions: ComponentVersion[] = [];
  for (const file of versionFiles) {
    const v = await readJSON<ComponentVersion>(join(versionDir, file));
    if (v) versions.push(v);
  }

  return versions.sort((a, b) => b.version - a.version);
}

// ── 获取所有组件的版本摘要 ──
export async function listAllComponentVersions(
  projectId: string
): Promise<{ component: string; versions: ComponentVersion[] }[]> {
  const compDir = getProjectFilePath(projectId, "components");
  const { readdir } = await import("node:fs/promises");
  const { existsSync } = await import("node:fs");

  if (!existsSync(compDir)) return [];

  const files = await readdir(compDir);
  const result: { component: string; versions: ComponentVersion[] }[] = [];

  for (const file of files) {
    if (!file.endsWith(".json")) continue;
    const comp = await readJSON<BrandComponent>(compDir + "/" + file);
    if (comp && comp.versions && comp.versions.length > 0) {
      result.push({ component: comp.type, versions: comp.versions });
    }
  }

  return result.sort((a, b) => a.component.localeCompare(b.component));
}

// ── 更新组件版本状态（审核/锁定） ──
export async function updateComponentVersionStatus(
  projectId: string,
  component: string,
  version: number,
  status: "draft" | "reviewing" | "approved" | "locked"
): Promise<ComponentVersion | null> {
  const versions = await getComponentVersions(projectId, component);
  const target = versions.find((v) => v.version === version);
  if (!target) {
    console.log(`  ! 组件 ${component} v${version} 不存在`);
    return null;
  }

  // 如果目标是 locked 状态，则不可修改
  if (target.status === "locked" && status !== "locked") {
    console.log(`  ! 组件 ${component} v${version} 已锁定，不可修改状态`);
    return null;
  }

  // 如果目标是 approved 状态，只能转为 locked
  if (target.status === "approved" && status !== "locked") {
    console.log(`  ! 组件 ${component} v${version} 已通过审核，只能锁定`);
    return null;
  }

  target.status = status;

  const versionDir = getProjectFilePath(projectId, "versions", component);
  await writeJSON(join(versionDir, `v${version}.json`), target);

  console.log(`  ✓ 组件 ${component} v${version} 状态已更新为 ${status}`);
  return target;
}

// ── 回退组件版本 ──
export async function rollbackComponent(
  projectId: string,
  component: string,
  targetVersion: number,
  reason: string
): Promise<ComponentVersion | null> {
  const versions = await getComponentVersions(projectId, component);
  const target = versions.find((v) => v.version === targetVersion);
  if (!target) {
    console.log(`  ! 组件 ${component} v${targetVersion} 不存在`);
    return null;
  }

  // 检查目标版本是否 locked
  if (target.status === "locked") {
    console.log(`  ! 组件 ${component} v${targetVersion} 已锁定，不可回退到此版本`);
    return null;
  }

  // 创建新版本（基于目标版本的内容）
  const newVersion = await createComponentVersion(projectId, component, {
    variant: target.variant,
    variantCss: target.variantCss,
    changeLog: `回退到 v${targetVersion}: ${reason}`,
    createdBy: "user",
  });

  if (newVersion) {
    // 更新决策日志
    const project = await getProject(projectId);
    if (project) {
      const log: DecisionLogEntry = {
        version: project.decisionLog.length + 1,
        stage: `rollback-${component}`,
        decision: "revised",
        reason: `回退到 v${targetVersion}: ${reason}`,
        timestamp: new Date().toISOString(),
      };
      project.decisionLog.push(log);
      project.updatedAt = new Date().toISOString();
      await writeJSON(getProjectFilePath(projectId, "project.json"), project);
      await writeJSON(
        getProjectFilePath(projectId, "decision-log.json"),
        project.decisionLog
      );
    }
  }

  return newVersion;
}

// ═══════════════════════════════════════════════
// Revision Tasks（组件修改任务 CRUD）
// ═══════════════════════════════════════════════

// ── 创建组件修改任务（驳回重生 / 手动修改） ──
export async function createRevisionTask(params: {
  projectId: string;
  source: RevisionSource;
  component: string;
  instruction: string;
  baseVersion: number;
  baseVariant: string;
  baseVariantCss?: string;
  baseSourceHtml?: string;
}): Promise<ComponentRevisionTask> {
  const {
    projectId,
    source,
    component,
    instruction,
    baseVersion,
    baseVariant,
    baseVariantCss = "",
    baseSourceHtml = "",
  } = params;

  const task: ComponentRevisionTask = {
    taskId: `rev_${ulid()}`,
    projectId,
    component,
    source,
    instruction,
    baseVersion,
    baseVariant,
    baseVariantCss,
    baseSourceHtml,
    status: "pending",
    createdAt: new Date().toISOString(),
  };

  await writeRevisionTask(projectId, task as any);
  await syncRevisionCount(projectId);
  console.log(
    `  ✓ 组件修改任务已创建 [${task.source}] ${component}: ${instruction.slice(0, 60)}`
  );
  return task;
}

// ── 读取单个任务 ──
export async function getRevisionTask(
  projectId: string,
  taskId: string
): Promise<ComponentRevisionTask | null> {
  return _readRevisionTask<ComponentRevisionTask>(projectId, taskId);
}

// ── 列出所有任务（可按状态过滤） ──
export async function listRevisionTasks(
  projectId: string,
  filter?: { status?: "pending" | "processing" | "completed" | "failed" }
): Promise<ComponentRevisionTask[]> {
  return _listRevisionTasks<ComponentRevisionTask>(projectId, filter);
}

// ── 领取任务（Skill 开始处理） ──
export async function claimRevisionTask(
  projectId: string,
  taskId: string
): Promise<ComponentRevisionTask | null> {
  const task = await _readRevisionTask<ComponentRevisionTask>(projectId, taskId);
  if (!task) return null;
  if (task.status !== "pending") {
    console.log(`  ! 任务 ${taskId} 状态为 ${task.status}，无法领取`);
    return task;
  }
  task.status = "processing";
  task.claimedBy = "skill";
  task.claimedAt = new Date().toISOString();
  await writeRevisionTask(projectId, task as any);
  return task;
}

// ── 完成任务 ──
export async function completeRevisionTask(params: {
  projectId: string;
  taskId: string;
  success: boolean;
  outputVersion?: number;
  error?: string;
}): Promise<ComponentRevisionTask | null> {
  const { projectId, taskId, success, outputVersion, error } = params;
  const task = await _readRevisionTask<ComponentRevisionTask>(projectId, taskId);
  if (!task) return null;

  task.status = success ? "completed" : "failed";
  task.completedAt = new Date().toISOString();
  if (outputVersion !== undefined) task.outputVersion = outputVersion;
  if (error) task.error = error;

  await writeRevisionTask(projectId, task as any);
  await syncRevisionCount(projectId);
  console.log(
    `  ✓ 组件修改任务 ${taskId} ${success ? "完成" : "失败"}: ${task.component}`
  );
  return task;
}

// ── 删除任务 ──
export async function deleteRevisionTask(
  projectId: string,
  taskId: string
): Promise<boolean> {
  const ok = await _deleteRevisionTask(projectId, taskId);
  if (ok) await syncRevisionCount(projectId);
  return ok;
}

// ── 同步 state.json 中的 pendingRevisionCount 和 nextAction ──
async function syncRevisionCount(projectId: string): Promise<void> {
  const count = await countPendingRevisionTasks(projectId);
  await patchProjectState(projectId, {
    pendingRevisionCount: count,
    nextAction: count > 0 ? "handle-revision-tasks" : "",
  });
}