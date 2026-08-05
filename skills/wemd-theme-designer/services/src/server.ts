// ============================================================
// WeMD 审核工作台 · HTTP Server
// ============================================================
// 提供 REST API + 静态文件服务，作为审核工作台的后端。

import express from "express";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync, mkdirSync } from "node:fs";
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
} from "./project-service.ts";
import { runFullPipeline } from "./pipeline/orchestrator.ts";
import { runSkill } from "./skill.ts";
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
// API: 创建项目
// ═══════════════════════════════════════════════

app.post("/api/projects", async (req, res) => {
  try {
    const { name, profileType, profile } = req.body;
    if (!name || !profileType) {
      res.status(400).json({ error: "缺少必填字段: name, profileType" });
      return;
    }
    await createProject(name, profileType, profile || {});
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
// API: 运行管道
// ═══════════════════════════════════════════════

app.post("/api/projects/:id/pipeline", async (req, res) => {
  try {
    const project = await getProject(req.params.id);
    if (!project) {
      res.status(404).json({ error: "项目不存在" });
      return;
    }

    const result = await runFullPipeline(
      project.profile,
      project.profileType,
      project.designMemory,
      req.params.id  // 传递 projectId 用于打包 ZIP
    );

    // 保存 blueprint
    if (result.blueprint) {
      await saveBlueprint(req.params.id, result.blueprint);
    }

    // 保存主题包信息
    if (result.compiled?.zipPath) {
      await saveThemePackage(req.params.id, {
        zipPath: result.compiled.zipPath,
        manifest: result.compiled.manifest,
      });
    }

    res.json({
      success: result.success,
      blueprint: result.blueprint,
      brandSystem: result.brandSystem,
      constraintResult: result.constraintResult,
      variants: result.variants,
      compiled: result.compiled,
      feedback: result.feedback,
      errors: result.errors,
      zipPath: result.compiled?.zipPath || null,
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

// ── 组件审核 ──
app.post("/api/projects/:id/components/:type/review", async (req, res) => {
  try {
    const { status, score, comments } = req.body;
    const component = await updateComponentReview(req.params.id, req.params.type, {
      status,
      score,
      comments,
    });
    res.json({ component });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ── 单组件修改 ──
app.post("/api/projects/:id/components/:type/modify", async (req, res) => {
  try {
    const { instruction, variantCss, sourceHtml } = req.body;
    const component = await getComponent(req.params.id, req.params.type);
    if (!component) {
      res.status(404).json({ error: "组件不存在" });
      return;
    }

    // 通过 Skill 的 modify-component action 处理
    const { runSkill } = await import("./skill.ts");
    const skillResult = await runSkill({
      projectId: req.params.id,
      profile: {},
      profileType: "brand",
      action: "modify-component",
      componentInput: {
        component: req.params.type,
        currentVersion: component.currentVersion,
        instruction: instruction || "用户修改",
        sourceHtml: sourceHtml || component.versions[component.versions.length - 1]?.sourceHtml || "",
        variantCss: variantCss || component.versions[component.versions.length - 1]?.variantCss || "",
      },
    });

    if (!skillResult.success) {
      res.status(500).json({ error: skillResult.errors?.join("; ") || "修改失败" });
      return;
    }

    // 保存为新版本
    const newVersion = await addComponentVersion(req.params.id, req.params.type, {
      variant: (skillResult.data as any)?.variant || `modified-v${component.currentVersion + 1}`,
      variantCss: variantCss || component.versions[component.versions.length - 1]?.variantCss || "",
      instruction: instruction || "用户修改",
      sourceHtml: sourceHtml || component.versions[component.versions.length - 1]?.sourceHtml || "",
      publishHtml: "",
      createdBy: "user",
    });

    res.json({ version: newVersion, skillResult });
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