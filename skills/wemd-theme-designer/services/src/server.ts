// ============================================================
// WeMD 审核工作台 · HTTP Server
// ============================================================
// 提供 REST API + 静态文件服务，作为审核工作台的后端。

import express from "express";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync, mkdirSync } from "node:fs";
import { writeFile as writeFileAsync } from "node:fs/promises";
import {
  createProject,
  getProject,
  listAllProjects,
  deleteProject,
  updateProjectStatus,
  saveBlueprint,
  saveThemePackage,
  submitForReview,
  approveReview,
  rejectReview,
  getProjectStatus,
  getProjectState,
  updateProjectState,
  updateProfile,
  createComponentVersion,
  getComponentVersions,
  listAllComponentVersions,
  updateComponentVersionStatus,
  rollbackComponent,
  createComponent,
  getComponent,
  listAllComponents,
  updateComponent,
  deleteComponent,
  addComponentVersion,
  updateComponentReview,
  createRevisionTask,
  getRevisionTask,
  listRevisionTasks,
  claimRevisionTask,
  completeRevisionTask,
  deleteRevisionTask,
} from "./project-service.ts";
// runFullPipeline 已弃用 — AI 推理由 Skill（Trae）完成，通过 /api/projects/:id/ai-save 保存
// import { runFullPipeline } from "./pipeline/orchestrator.ts";
// runSkill 已弃用 — 组件修改走 Revision Task 异步流程，不再同步调用
// import { runSkill } from "./skill.ts";
import type { ComponentVariant } from "./pipeline/pipeline-types.ts";
import {
  initWorkspace,
  listMaterials,
  getMaterial,
  saveMaterial,
  readJSON,
  getProjectFilePath,
  PROJECTS_DIR,
} from "./file-service.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = join(__dirname, "..", "public");

const app = express();
app.use(express.json({ limit: "10mb" }));
app.use(express.static(PUBLIC_DIR));

// ═══════════════════════════════════════════════
// API: 项目列表
// ═══════════════════════════════════════════════

app.get("/api/projects", async (_req, res) => {
  try {
    const ids = await listAllProjects();
    const projects = [];
    for (const id of ids) {
      const status = await getProjectStatus(id);
      if (status.project) {
        projects.push({
          id: status.project.id,
          name: status.project.name,
          profileType: status.project.profileType,
          status: status.project.status,
          createdAt: status.project.createdAt,
          updatedAt: status.project.updatedAt,
          hasBlueprint: status.project.designBlueprint !== null,
          hasTheme: status.project.themePackage !== null,
          reviewCount: status.project.reviewRecords.length,
          decisionCount: status.project.decisionLog.length,
        });
      }
    }
    res.json({ projects });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ═══════════════════════════════════════════════
// API: 项目详情
// ═══════════════════════════════════════════════

app.get("/api/projects/:id", async (req, res) => {
  try {
    const project = await getProject(req.params.id);
    if (!project) {
      res.status(404).json({ error: "项目不存在" });
      return;
    }

    const materials = await listMaterials(req.params.id);
    const versions = await listAllComponentVersions(req.params.id);

    res.json({
      project: {
        ...project,
        profile: project.profile,
        designMemory: project.designMemory,
      },
      materials,
      versions,
    });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ═══════════════════════════════════════════════
// API: 读取项目状态（state.json）
// ═══════════════════════════════════════════════

app.get("/api/projects/:id/state", async (req, res) => {
  try {
    const state = await getProjectState(req.params.id);
    if (!state) {
      res.status(404).json({ error: "项目状态不存在" });
      return;
    }
    res.json(state);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ═══════════════════════════════════════════════
// API: 更新项目状态
// ═══════════════════════════════════════════════

app.post("/api/projects/:id/state", async (req, res) => {
  try {
    const { status, progress } = req.body;
    if (!status) {
      res.status(400).json({ error: "缺少必填字段: status" });
      return;
    }
    await updateProjectState(req.params.id, status, progress);
    const state = await getProjectState(req.params.id);
    res.json(state);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ═══════════════════════════════════════════════
// API: 更新品牌资料（Profile）
// ═══════════════════════════════════════════════

app.post("/api/projects/:id/profile", async (req, res) => {
  try {
    const profile = req.body;
    if (!profile || Object.keys(profile).length === 0) {
      res.status(400).json({ error: "缺少品牌资料" });
      return;
    }
    await updateProfile(req.params.id, profile);
    // 资料填写完成，状态变为 READY
    await updateProjectState(req.params.id, "READY");
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ═══════════════════════════════════════════════
// API: 文件上传（base64 方式，避免引入 multer 依赖）
// ── 接收 { type, fileName, base64, mimeType }
// ── 保存到 projects/{id}/assets/{type}/{fileName}
// ── 返回相对路径供 profile 引用
// ═══════════════════════════════════════════════

const ALLOWED_UPLOAD_TYPES = ["logo", "brandSpec"] as const;
const ALLOWED_MIME_TYPES: Record<string, string[]> = {
  logo: ["image/svg+xml", "image/png", "image/jpeg"],
  brandSpec: ["application/pdf"],
};
const MAX_UPLOAD_SIZE = 10 * 1024 * 1024; // 10MB

app.post("/api/projects/:id/upload", async (req, res) => {
  try {
    const { type, fileName, base64, mimeType } = req.body;
    const projectId = req.params.id;

    if (!type || !fileName || !base64) {
      res.status(400).json({ error: "缺少必填字段: type, fileName, base64" });
      return;
    }
    if (!ALLOWED_UPLOAD_TYPES.includes(type)) {
      res.status(400).json({
        error: `非法上传类型: ${type}，允许: ${ALLOWED_UPLOAD_TYPES.join(", ")}`,
      });
      return;
    }
    if (mimeType && !ALLOWED_MIME_TYPES[type].includes(mimeType)) {
      res.status(400).json({
        error: `非法文件类型: ${mimeType}，允许: ${ALLOWED_MIME_TYPES[type].join(", ")}`,
      });
      return;
    }

    // 校验项目存在
    const project = await getProject(projectId);
    if (!project) {
      res.status(404).json({ error: "项目不存在" });
      return;
    }

    // 解码 base64
    const buffer = Buffer.from(base64, "base64");
    if (buffer.length > MAX_UPLOAD_SIZE) {
      res.status(400).json({
        error: `文件过大: ${buffer.length} bytes，最大允许 ${MAX_UPLOAD_SIZE} bytes`,
      });
      return;
    }

    // 保存到项目 assets 目录
    const destDir = join(PROJECTS_DIR, projectId, "assets", type);
    if (!existsSync(destDir)) {
      mkdirSync(destDir, { recursive: true });
    }
    const destPath = join(destDir, fileName);
    await writeFileAsync(destPath, buffer);

    // 返回相对路径（相对于项目目录），供 profile 引用
    const relativePath = `assets/${type}/${fileName}`;
    res.json({
      path: relativePath,
      absolutePath: destPath,
      size: buffer.length,
      fileName,
    });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ═══════════════════════════════════════════════
// API: 访问项目上传的资源文件
// ── GET /api/projects/:id/assets/:type/:filename
// ═══════════════════════════════════════════════

app.get("/api/projects/:id/assets/:type/:filename", async (req, res) => {
  try {
    const { id, type, filename } = req.params;
    if (!ALLOWED_UPLOAD_TYPES.includes(type as any)) {
      res.status(400).json({ error: "非法资源类型" });
      return;
    }
    const filePath = join(PROJECTS_DIR, id, "assets", type, filename);
    if (!existsSync(filePath)) {
      res.status(404).json({ error: "资源不存在" });
      return;
    }
    res.sendFile(filePath);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ═══════════════════════════════════════════════
// API: 创建项目
// ═══════════════════════════════════════════════

app.post("/api/projects", async (req, res) => {
  try {
    const { name, profileType, profile } = req.body;
    if (!name) {
      res.status(400).json({ error: "缺少必填字段: name" });
      return;
    }
    // profileType 默认 brand，允许不填
    const finalType: "brand" | "creator" =
      profileType === "creator" ? "creator" : "brand";
    await createProject(name, finalType, profile || {});
    const project = await getProject(name.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]/g, "-"));
    res.json({ project });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ═══════════════════════════════════════════════
// API: 删除项目
// ═══════════════════════════════════════════════

app.delete("/api/projects/:id", async (req, res) => {
  try {
    const project = await getProject(req.params.id);
    if (!project) {
      res.status(404).json({ error: "项目不存在" });
      return;
    }
    await deleteProject(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ═══════════════════════════════════════════════
// API: 运行管道（已禁用自动生成）
// ── 原本调用 runFullPipeline 自动生成组件，会覆盖 AI 推理结果。
// ── 现在改为只返回提示，AI 推理由 Skill（Trae）完成并通过 /ai-save 保存。
// ═══════════════════════════════════════════════

app.post("/api/projects/:id/pipeline", async (req, res) => {
  res.status(410).json({
    error: "此接口已禁用",
    reason: "自动生成管道会覆盖 AI 推理结果，已改为由 Skill（Trae AI）执行推理并调用 /api/projects/:id/ai-save 保存",
    docs: "请使用 POST /api/projects/:id/ai-save 保存 AI 推理生成的设计蓝图和组件",
  });
});

// ═══════════════════════════════════════════════
// API: 保存 AI 推理结果（支持分批提交）
// ── POST /api/projects/:id/ai-save
// ── 请求体: {
//      blueprint?: object,           // 仅第 1 批需要传
//      batch?: string,               // 原型组名
//      isLastBatch?: boolean,        // true 时触发状态 → PREVIEW
//      components?: Array<{type, variant, variantCss, sourceHtml, instruction}>
//    }
// ── 行为:
//    1. 保存 blueprint 到 design-blueprint.json 和 project.json（第 1 批）
//    2. 为每个组件追加新版本（不覆盖已有版本）
//    3. 非最后一批：保持 GENERATING + 更新进度
//    4. 最后一批（isLastBatch=true）：更新状态为 PREVIEW
// ═══════════════════════════════════════════════

const BATCH_ORDER = [
  "signature", "heading", "container", "data",
  "interactive", "code", "divider",
] as const;
const TOTAL_BATCHES = BATCH_ORDER.length;

app.post("/api/projects/:id/ai-save", async (req, res) => {
  try {
    const project = await getProject(req.params.id);
    if (!project) {
      res.status(404).json({ error: "项目不存在" });
      return;
    }

    const { blueprint, components, batch, isLastBatch } = req.body as {
      blueprint?: any;
      components?: Array<{
        type: string;
        variant: string;
        variantCss: string;
        sourceHtml?: string;
        changeLog?: string;
        instruction?: string;
      }>;
      batch?: string;
      isLastBatch?: boolean;
    };

    const saved: { blueprint: boolean; components: string[] } = {
      blueprint: false,
      components: [],
    };

    // 1. 保存 blueprint（通常第 1 批携带）
    if (blueprint) {
      await saveBlueprint(req.params.id, blueprint);
      saved.blueprint = true;
    }

    // 2. 为每个组件追加新版本
    if (Array.isArray(components)) {
      for (const comp of components) {
        if (!comp.type || !comp.variant || !comp.variantCss) {
          continue;
        }
        // 确保组件已创建（新项目首次提交时组件不存在）
        let existing = await getComponent(req.params.id, comp.type);
        if (!existing) {
          existing = await createComponent(req.params.id, comp.type, comp.type);
        }
        const version = await addComponentVersion(req.params.id, comp.type, {
          variant: comp.variant,
          variantCss: comp.variantCss,
          instruction: comp.instruction || "AI 推理生成",
          sourceHtml: comp.sourceHtml || "",
          publishHtml: "",
          assetRefs: [],
          createdBy: "ai",
        });
        saved.components.push(`${comp.type}#v${version.version}`);
      }
    }

    // 3. 更新状态和进度
    const batchIndex = batch ? BATCH_ORDER.indexOf(batch) + 1 : 0;
    const isFinalBatch = isLastBatch || (!batch && components);

    if (isFinalBatch) {
      // 最后一批或兼容旧模式（无 batch 字段） → PREVIEW
      await updateProjectState(req.params.id, "PREVIEW", {
        step: TOTAL_BATCHES,
        total: TOTAL_BATCHES,
        current: "AI 推理完成",
        percent: 100,
      });
    } else {
      // 中间批次 → 保持 GENERATING
      await updateProjectState(req.params.id, "GENERATING", {
        step: batchIndex,
        total: TOTAL_BATCHES,
        current: `生成 ${batch} 组 (${batchIndex}/${TOTAL_BATCHES})`,
        percent: Math.round((batchIndex / TOTAL_BATCHES) * 100),
      });
    }

    res.json({
      success: true,
      saved,
      batch: batch || null,
      batchProgress: {
        completed: batchIndex || TOTAL_BATCHES,
        total: TOTAL_BATCHES,
      },
      message: `已保存${saved.blueprint ? "蓝图 + " : ""}${saved.components.length} 个组件${batch ? ` (${batch} ${batchIndex}/${TOTAL_BATCHES})` : ""}`,
    });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ═══════════════════════════════════════════════
// API: 编译打包主题
// ── POST /api/projects/:id/compile
// ── AI 全部组件保存完毕后调用，将 44 个组件编译为 .wemd-theme
// ── 校验：必须覆盖全部 44 个合法组件
// ═══════════════════════════════════════════════

app.post("/api/projects/:id/compile", async (req, res) => {
  try {
    const project = await getProject(req.params.id);
    if (!project) {
      res.status(404).json({ error: "项目不存在" });
      return;
    }

    // 1. 读取 blueprint
    const blueprint = project.designBlueprint;
    if (!blueprint) {
      res.status(400).json({ error: "缺少 design blueprint，请先调用 /ai-save 保存蓝图" });
      return;
    }

    // 2. 读取全部组件版本
    const allVersions = await listAllComponentVersions(req.params.id);

    // 3. 提取每个组件的最新版本作为编译输入
    const variants: Array<{
      component: string;
      variant: string;
      variantCss: string;
    }> = [];
    for (const v of allVersions) {
      const latest = v.versions[v.versions.length - 1];
      if (latest) {
        variants.push({
          component: v.component,
          variant: latest.variant,
          variantCss: latest.variantCss,
        });
      }
    }

    // 4. 校验：必须覆盖全部 44 个组件
    const { getLegalComponents } = await import("./pipeline/logic-layer.ts");
    const legal = getLegalComponents();
    const covered = new Set(variants.map((v) => v.component));
    const missing = legal.filter((c) => !covered.has(c));
    if (missing.length > 0) {
      res.status(400).json({
        error: `组件未全覆盖，缺少 ${missing.length} 个: ${missing.join(", ")}`,
        missing,
        covered: Array.from(covered),
      });
      return;
    }

    // 5. 调用 Compiler Layer
    const { compileTheme, packageThemeZip } = await import("./pipeline/compiler-layer.ts");
    const { generateMaterialDescription } = await import("./pipeline/application-layer.ts");
    const materials = generateMaterialDescription(blueprint as Record<string, unknown>);
    const compiled = compileTheme(
      blueprint as Record<string, unknown>,
      variants as ComponentVariant[],
      materials
    );

    // 6. 打包 ZIP
    const themeName = project.name || "theme";
    compiled.zipPath = await packageThemeZip(
      req.params.id,
      themeName,
      compiled.manifest,
      compiled.brandDoc,
      materials
    );

    // 7. 保存 theme package 到 project.json
    await saveThemePackage(req.params.id, {
      manifest: compiled.manifest,
      variantCss: compiled.variantCss,
      brandDoc: compiled.brandDoc,
      zipPath: compiled.zipPath,
    });

    // 8. 更新状态
    await updateProjectState(req.params.id, "APPROVED", {
      step: TOTAL_BATCHES,
      total: TOTAL_BATCHES,
      current: "编译完成",
      percent: 100,
    });

    res.json({
      success: true,
      zipPath: compiled.zipPath,
      componentCount: variants.length,
      warnings: compiled.warnings,
    });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ═══════════════════════════════════════════════
// API: 审核操作
// ═══════════════════════════════════════════════

app.post("/api/projects/:id/review", async (req, res) => {
  try {
    const { action, stage, score, feedback } = req.body;
    const projectId = req.params.id;

    if (action === "submit") {
      await submitForReview(projectId, stage);
    } else if (action === "approve") {
      await approveReview(projectId, stage, score);
    } else if (action === "reject") {
      await rejectReview(projectId, stage, feedback || "需要调整");
    } else {
      res.status(400).json({ error: `未知审核操作: ${action}` });
      return;
    }

    const project = await getProject(projectId);
    res.json({ project });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ═══════════════════════════════════════════════
// API: 版本管理
// ═══════════════════════════════════════════════

app.get("/api/projects/:id/versions", async (req, res) => {
  try {
    const versions = await listAllComponentVersions(req.params.id);
    res.json({ versions });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.post("/api/projects/:id/versions", async (req, res) => {
  try {
    const { component, variant, variantCss, changeLog, createdBy } = req.body;
    const result = await createComponentVersion(req.params.id, component, {
      variant,
      variantCss: variantCss || "",
      changeLog: changeLog || "新建版本",
      createdBy: createdBy || "ai",
    });
    res.json({ version: result });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.post("/api/projects/:id/versions/rollback", async (req, res) => {
  try {
    const { component, version, reason } = req.body;
    const result = await rollbackComponent(req.params.id, component, version, reason || "用户回退");
    res.json({ version: result });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.put("/api/projects/:id/versions/status", async (req, res) => {
  try {
    const { component, version, status } = req.body;
    const result = await updateComponentVersionStatus(req.params.id, component, version, status);
    res.json({ version: result });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ═══════════════════════════════════════════════
// API: 组件修改任务（Revision Tasks）
// ═══════════════════════════════════════════════
// 这些 API 供 Trae Skill（AI Agent）调用，完成组件级修改推理和保存。
// 驳回 / 手动修改 → 创建任务 → Skill 轮询发现 → 领取 → AI 推理生成新版本 → 完成/删除

// 1. 列出所有修改任务（?status=pending|processing|completed|failed）
app.get("/api/projects/:id/revision-tasks", async (req, res) => {
  try {
    const status = req.query.status as
      | "pending"
      | "processing"
      | "completed"
      | "failed"
      | undefined;
    const tasks = await listRevisionTasks(req.params.id, status ? { status } : undefined);
    res.json({ tasks, count: tasks.length });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// 2. 获取单个修改任务
app.get("/api/projects/:id/revision-tasks/:taskId", async (req, res) => {
  try {
    const task = await getRevisionTask(req.params.id, req.params.taskId);
    if (!task) {
      res.status(404).json({ error: "任务不存在" });
      return;
    }
    res.json({ task });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// 3. 领取任务（Skill 开始处理前调用，标记 processing，防止并发处理同一任务）
app.post("/api/projects/:id/revision-tasks/:taskId/claim", async (req, res) => {
  try {
    const task = await claimRevisionTask(req.params.id, req.params.taskId);
    if (!task) {
      res.status(404).json({ error: "任务不存在" });
      return;
    }
    res.json({ task });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// 4. 完成任务（Skill AI 生成新版本后调用，标记 completed，state 计数 -1）
//    Body: { success: boolean, outputVersion?: number, error?: string }
app.post("/api/projects/:id/revision-tasks/:taskId/complete", async (req, res) => {
  try {
    const { success, outputVersion, error } = req.body;
    const task = await completeRevisionTask({
      projectId: req.params.id,
      taskId: req.params.taskId,
      success: success !== false, // 默认 true
      outputVersion,
      error,
    });
    if (!task) {
      res.status(404).json({ error: "任务不存在" });
      return;
    }
    res.json({ task });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// 5. 删除任务
app.delete("/api/projects/:id/revision-tasks/:taskId", async (req, res) => {
  try {
    const ok = await deleteRevisionTask(req.params.id, req.params.taskId);
    if (!ok) {
      res.status(404).json({ error: "任务不存在" });
      return;
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ═══════════════════════════════════════════════
// API: 组件管理
// ═══════════════════════════════════════════════

app.get("/api/projects/:id/components", async (req, res) => {
  try {
    const components = await listAllComponents(req.params.id);
    res.json({ components });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.get("/api/projects/:id/components/:type", async (req, res) => {
  try {
    const component = await getComponent(req.params.id, req.params.type);
    if (!component) {
      res.status(404).json({ error: "组件不存在" });
      return;
    }
    res.json({ component });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.post("/api/projects/:id/components", async (req, res) => {
  try {
    const { type, name } = req.body;
    if (!type || !name) {
      res.status(400).json({ error: "缺少必填字段: type, name" });
      return;
    }
    const component = await createComponent(req.params.id, type, name);
    res.json({ component });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.put("/api/projects/:id/components/:type", async (req, res) => {
  try {
    const component = await updateComponent(req.params.id, req.params.type, req.body);
    if (!component) {
      res.status(404).json({ error: "组件不存在" });
      return;
    }
    res.json({ component });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.delete("/api/projects/:id/components/:type", async (req, res) => {
  try {
    await deleteComponent(req.params.id, req.params.type);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ── 组件版本 ──
app.post("/api/projects/:id/components/:type/versions", async (req, res) => {
  try {
    const { variant, variantCss, instruction, sourceHtml, publishHtml, assetRefs, createdBy } = req.body;
    const version = await addComponentVersion(req.params.id, req.params.type, {
      variant,
      variantCss: variantCss || "",
      instruction: instruction || "新建版本",
      sourceHtml: sourceHtml || "",
      publishHtml: publishHtml || "",
      assetRefs,
      createdBy: createdBy || "ai",
    });
    res.json({ version });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ── 组件审核（驳回 → 创建组件修改任务，由 Trae Skill（LLM）异步处理） ──
app.post("/api/projects/:id/components/:type/review", async (req, res) => {
  try {
    const { status, score, comments } = req.body;
    const projectId = req.params.id;
    const componentType = req.params.type;

    // 1. 更新审核记录（组件 review 元数据）
    const component = await updateComponentReview(projectId, componentType, {
      status,
      score,
      comments,
    });

    // 2. 如果是驳回（rejected / revision-requested），创建组件修改任务
    //    — 不再本地调 runSkill 占位，而是交给 Trae Work 的 Skill LLM 能力处理
    const rejectStatuses = new Set(["rejected", "revision-requested"]);
    if (rejectStatuses.has(status)) {
      const feedback = (comments || []).join("; ") || "需要调整设计方向";

      const latestVersion = component?.versions?.[component.versions.length - 1];
      if (!latestVersion) {
        res.json({ component, warning: "无版本数据，驳回成功但未创建修改任务" });
        return;
      }

      const revisionTask = await createRevisionTask({
        projectId,
        source: "review-reject",
        component: componentType,
        instruction: `审核驳回，请根据以下意见调整: ${feedback}`,
        baseVersion: latestVersion.version,
        baseVariant: latestVersion.variant, // 驳回重生：保持原 variant 名，不脱离整体方案
        baseVariantCss: latestVersion.variantCss || "",
        baseSourceHtml: latestVersion.sourceHtml || "",
      });

      res.json({
        component,
        revisionTask: {
          taskId: revisionTask.taskId,
          source: revisionTask.source,
          instruction: revisionTask.instruction,
          baseVersion: revisionTask.baseVersion,
          baseVariant: revisionTask.baseVariant,
          status: revisionTask.status,
        },
        pendingRevisionCount: 1,
        nextAction: "handle-revision-tasks",
        hint: "驳回已记录，请在 Trae Work 中触发 Skill，AI 将根据意见重新设计该组件",
      });
      return;
    }

    res.json({ component });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ── 单组件修改（创建组件修改任务，由 Trae Skill（LLM）异步处理） ──
app.post("/api/projects/:id/components/:type/modify", async (req, res) => {
  try {
    const { instruction, variantCss: userCss, sourceHtml: userHtml } = req.body;
    const projectId = req.params.id;
    const componentType = req.params.type;

    const component = await getComponent(projectId, componentType);
    if (!component) {
      res.status(404).json({ error: "组件不存在" });
      return;
    }

    const latest = component.versions?.[component.versions.length - 1];
    if (!latest) {
      res.status(400).json({ error: "组件尚无版本，无法修改" });
      return;
    }

    // 如果用户直接提供了 variantCss（手动改完立即保存），直接创建新版本，不走任务
    if (userCss && !instruction) {
      const newVersion = await addComponentVersion(projectId, componentType, {
        variant: latest.variant,
        variantCss: userCss,
        instruction: instruction || "用户手动修改",
        sourceHtml: userHtml || latest.sourceHtml || "",
        publishHtml: "",
        createdBy: "user",
      });
      res.json({ version: newVersion, savedDirectly: true });
      return;
    }

    // 否则（带 instruction）创建组件修改任务，交给 Trae Skill 的 LLM 处理
    const finalInstruction = instruction || "用户要求调整设计";
    // 驳回重生以外的用户修改，允许 variant 重新命名，但会附加 instruction 标注来源
    // 为避免脱离整体方案，默认保持原 variant（AI 生成时可按需改）
    const task = await createRevisionTask({
      projectId,
      source: "user-modify",
      component: componentType,
      instruction: finalInstruction,
      baseVersion: latest.version,
      baseVariant: latest.variant,
      baseVariantCss: userCss || latest.variantCss || "",
      baseSourceHtml: userHtml || latest.sourceHtml || "",
    });

    res.json({
      revisionTask: {
        taskId: task.taskId,
        source: task.source,
        instruction: task.instruction,
        baseVersion: task.baseVersion,
        baseVariant: task.baseVariant,
        status: task.status,
      },
      pendingRevisionCount: 1,
      nextAction: "handle-revision-tasks",
      hint: "修改任务已创建，请在 Trae Work 中触发 Skill，AI 将生成新组件版本",
    });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ── 组件 Design Memory ──
app.get("/api/projects/:id/components/:type/memory", async (req, res) => {
  try {
    const project = await getProject(req.params.id);
    if (!project) {
      res.status(404).json({ error: "项目不存在" });
      return;
    }
    const dm = project.designMemory || {};
    const componentMemory = (dm as any).componentStyles?.[req.params.type] || null;
    const componentDecisions = (dm as any).decisions?.filter(
      (d: any) => d.key === req.params.type
    ) || [];
    res.json({
      style: componentMemory,
      decisions: componentDecisions,
    });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ═══════════════════════════════════════════════
// API: 文章套用 (Article Apply)
// ═══════════════════════════════════════════════

// ── 解析文章 ──
app.post("/api/projects/:id/articles/parse", async (req, res) => {
  try {
    const { content, title } = req.body;
    if (!content) {
      res.status(400).json({ error: "缺少文章内容" });
      return;
    }

    const { parseArticle } = await import("./article-parser.ts");
    const parsed = parseArticle(content, title);

    // 获取组件映射
    const { getBlockComponentMapping } = await import("./article-apply.ts");
    const mapping = getBlockComponentMapping(parsed.blocks);

    res.json({
      article: parsed,
      mapping,
    });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ── 预览文章（Markdown → 主题化 HTML + 主题 CSS） ──
app.post("/api/projects/:id/articles/preview", async (req, res) => {
  try {
    const { content, title } = req.body;
    if (!content) {
      res.status(400).json({ error: "缺少文章内容" });
      return;
    }

    const { parseArticle } = await import("./article-parser.ts");
    const parsed = parseArticle(content, title);

    // 从编译后的主题 manifest 提取组件变体 CSS 与变体映射
    let themeCss = "";
    let variants: Record<string, string> = {};
    try {
      const manifest = await readJSON(getProjectFilePath(req.params.id, "theme", "manifest.json"));
      const components = (manifest as any)?.components || [];
      for (const comp of components) {
        if (comp?.variantCss) themeCss += `\n${comp.variantCss}`;
        if (comp?.name && comp?.variant) variants[comp.name] = comp.variant;
      }
    } catch {
      // 主题尚未编译时忽略，返回无样式预览
    }

    const { applyArticleBlocksInlineWithVariants, getBlockComponentMapping } = await import("./article-apply.ts");
    const html = applyArticleBlocksInlineWithVariants(parsed, variants);
    const mapping = getBlockComponentMapping(parsed.blocks);

    res.json({
      html,
      themeCss,
      mapping,
      metadata: parsed.metadata,
      title: parsed.title,
    });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ── 套用文章（生成完整 HTML） ──
app.post("/api/projects/:id/articles/apply", async (req, res) => {
  try {
    const { content, title } = req.body;
    if (!content) {
      res.status(400).json({ error: "缺少文章内容" });
      return;
    }

    const { parseArticle } = await import("./article-parser.ts");
    const parsed = parseArticle(content, title);

    // 获取 BrandSystem（如果有）
    const project = await getProject(req.params.id);
    const brandSystem = project?.designBlueprint?.brandSystem as Record<string, unknown> | undefined;

    // 提取主题变体映射与主题 CSS
    let themeCss = "";
    let variants: Record<string, string> = {};
    try {
      const manifest = await readJSON(getProjectFilePath(req.params.id, "theme", "manifest.json"));
      const components = (manifest as any)?.components || [];
      for (const comp of components) {
        if (comp?.variantCss) themeCss += `\n${comp.variantCss}`;
        if (comp?.name && comp?.variant) variants[comp.name] = comp.variant;
      }
    } catch {
      // 主题未编译时忽略
    }

    const { applyArticleBlocks, applyArticleBlocksInlineWithVariants, getBlockComponentMapping } = await import("./article-apply.ts");
    const fullHtml = applyArticleBlocks(parsed, brandSystem);
    const inlineHtml = applyArticleBlocksInlineWithVariants(parsed, variants);
    const mapping = getBlockComponentMapping(parsed.blocks);

    // 保存文章到项目目录
    const { writeJSON, getProjectFilePath, ensureDir } = await import("./file-service.ts");
    const { ulid } = await import("./utils.ts");
    const articleId = `article-${ulid().slice(0, 8)}`;
    const articlesDir = getProjectFilePath(req.params.id, "articles");
    await ensureDir(articlesDir);
    await writeJSON(getProjectFilePath(req.params.id, "articles", `${articleId}.json`), {
      id: articleId,
      title: parsed.title,
      content: fullHtml,
      inlineContent: inlineHtml,
      themeCss,
      mapping,
      metadata: parsed.metadata,
      createdAt: new Date().toISOString(),
    });

    res.json({
      articleId,
      title: parsed.title,
      html: fullHtml,
      mapping,
      metadata: parsed.metadata,
    });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ── 获取单篇文章（含主题化预览数据） ──
app.get("/api/projects/:id/articles/:articleId", async (req, res) => {
  try {
    const { readFile } = await import("node:fs/promises");
    const { join } = await import("node:path");
    const file = join(getProjectFilePath(req.params.id, "articles"), `${req.params.articleId}.json`);
    if (!existsSync(file)) {
      res.status(404).json({ error: "文章不存在" });
      return;
    }
    const raw = await readFile(file, "utf-8");
    const data = JSON.parse(raw);
    res.json({
      html: data.inlineContent || "",
      themeCss: data.themeCss || "",
      mapping: data.mapping || [],
      metadata: data.metadata || {},
      title: data.title,
    });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ── 获取文章列表 ──
app.get("/api/projects/:id/articles", async (req, res) => {
  try {
    const { readdir, readFile } = await import("node:fs/promises");
    const { existsSync } = await import("node:fs");
    const { join } = await import("node:path");
    const articlesDir = getProjectFilePath(req.params.id, "articles");

    if (!existsSync(articlesDir)) {
      res.json({ articles: [] });
      return;
    }

    const files = await readdir(articlesDir);
    const articles = [];
    for (const file of files) {
      if (!file.endsWith(".json")) continue;
      try {
        const raw = await readFile(join(articlesDir, file), "utf-8");
        const data = JSON.parse(raw);
        articles.push({
          id: data.id,
          title: data.title,
          metadata: data.metadata,
          createdAt: data.createdAt,
        });
      } catch { /* skip invalid */ }
    }

    res.json({ articles });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ═══════════════════════════════════════════════
// API: 蓝图 / 主题数据
// ═══════════════════════════════════════════════

app.get("/api/projects/:id/blueprint", async (req, res) => {
  try {
    const data = await readJSON(getProjectFilePath(req.params.id, "design-blueprint.json"));
    res.json({ blueprint: data });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.get("/api/projects/:id/manifest", async (req, res) => {
  try {
    const data = await readJSON(getProjectFilePath(req.params.id, "theme", "manifest.json"));
    res.json({ manifest: data });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ═══════════════════════════════════════════════
// API: 下载主题包 ZIP
// ═══════════════════════════════════════════════

app.get("/api/projects/:id/download", async (req, res) => {
  try {
    const { readdir } = await import("node:fs/promises");
    const { existsSync } = await import("node:fs");
    const themeDir = getProjectFilePath(req.params.id, "theme");

    if (!existsSync(themeDir)) {
      res.status(404).json({ error: "主题包不存在" });
      return;
    }

    const files = await readdir(themeDir);
    const zipFile = files.find((f) => f.endsWith(".wemd-theme"));
    if (!zipFile) {
      res.status(404).json({ error: "未找到 .wemd-theme 文件" });
      return;
    }

    const { join } = await import("node:path");
    const filePath = join(themeDir, zipFile);
    res.download(filePath, zipFile);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ═══════════════════════════════════════════════
// API: 查看 brand.md
// ═══════════════════════════════════════════════

app.get("/api/projects/:id/branddoc", async (req, res) => {
  try {
    const { readFile } = await import("node:fs/promises");
    const { existsSync } = await import("node:fs");
    const { join } = await import("node:path");
    const zipPath = join(getProjectFilePath(req.params.id, "theme"), "..");

    // 从 project.json 中读取 brandDoc（通过 compiled 缓存）
    // 或者直接从 ZIP 中提取
    const project = await getProject(req.params.id);
    if (!project) {
      res.status(404).json({ error: "项目不存在" });
      return;
    }

    // 如果有 themePackage，尝试读取
    res.json({ brandDoc: null, note: "brand.md 已打包在 .wemd-theme ZIP 中" });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ═══════════════════════════════════════════════
// API: 初始化
// ═══════════════════════════════════════════════

app.post("/api/init", async (_req, res) => {
  try {
    await initWorkspace();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ═══════════════════════════════════════════════
// 启动
// ═══════════════════════════════════════════════

export function startServer(port = 3456, host = "127.0.0.1") {
  // 确保 public 目录存在
  if (!existsSync(PUBLIC_DIR)) {
    mkdirSync(PUBLIC_DIR, { recursive: true });
  }

  app.listen(port, host, () => {
    console.log(`\n  ╔══════════════════════════════════════╗`);
    console.log(`  ║  WeMD 审核工作台                      ║`);
    console.log(`  ║                                      ║`);
    console.log(`  ║  http://${host}:${port}                ║`);
    console.log(`  ╚══════════════════════════════════════╝\n`);
  });
}

// 直接运行时启动
const isDirectRun = process.argv[1]?.includes("server.ts");
if (isDirectRun) {
  startServer();
}