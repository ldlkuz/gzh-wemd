// ============================================================
// File Service — 文件系统操作
// ============================================================
// 所有文件读写、目录管理、路径操作都集中在这里。

import { mkdir, writeFile, readFile, readdir, unlink, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";

// ── 基础路径（相对于 skill 目录） ──
const SKILL_DIR = join(import.meta.dirname, "..", "..");
export const WORKSPACE_DIR = join(SKILL_DIR, "workspace");
export const PROJECTS_DIR = join(SKILL_DIR, "projects");

// ── 项目目录结构 ──
export const PROJECT_FILES = [
  "project.json",
  "profile.json",
  "design-blueprint.json",
  "design-memory.json",
  "decision-log.json",
] as const;

export const PROJECT_SUBDIRS = [
  "theme",
  "materials/assets",
  "reviews",
  "versions",
  "components",
  "articles",
] as const;

// ── 确保目录存在 ──
export async function ensureDir(dir: string): Promise<void> {
  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true });
  }
}

// ── 初始化工作区目录 ──
export async function initWorkspace(): Promise<void> {
  const dirs = [
    WORKSPACE_DIR,
    ...["inbox", "processing", "done", "failed", "logs"].map((d) =>
      join(WORKSPACE_DIR, d)
    ),
    PROJECTS_DIR,
  ];
  await Promise.all(dirs.map(ensureDir));
  console.log("✓ 工作区已初始化:", WORKSPACE_DIR);
}

// ── 初始化项目目录 ──
export async function initProjectDir(projectId: string): Promise<string> {
  const projectDir = join(PROJECTS_DIR, projectId);
  await ensureDir(projectDir);

  // 创建子目录
  await Promise.all(
    PROJECT_SUBDIRS.map((d) => ensureDir(join(projectDir, d)))
  );

  return projectDir;
}

// ── 读取 JSON 文件 ──
export async function readJSON<T>(filePath: string): Promise<T | null> {
  try {
    const raw = await readFile(filePath, "utf-8");
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

// ── 写入 JSON 文件 ──
export async function writeJSON(
  filePath: string,
  data: unknown
): Promise<void> {
  await ensureDir(dirname(filePath));
  await writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
}

// ── 列出项目 ──
export async function listProjects(): Promise<string[]> {
  await ensureDir(PROJECTS_DIR);
  const entries = await readdir(PROJECTS_DIR, { withFileTypes: true });
  return entries
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort();
}

// ── 删除项目 ──
export async function deleteProjectDir(projectId: string): Promise<void> {
  const projectDir = join(PROJECTS_DIR, projectId);
  if (existsSync(projectDir)) {
    await rm(projectDir, { recursive: true, force: true });
  }
}

// ── 获取项目文件路径 ──
export function getProjectFilePath(
  projectId: string,
  ...segments: string[]
): string {
  return join(PROJECTS_DIR, projectId, ...segments);
}

// ── SVG 素材操作 ──
export async function saveMaterial(
  projectId: string,
  element: string,
  usage: string,
  svg: string
): Promise<string> {
  const assetsDir = join(PROJECTS_DIR, projectId, "materials", "assets");
  await ensureDir(assetsDir);
  const filePath = join(assetsDir, `${element}-${usage}.svg`);
  await writeFile(filePath, svg, "utf-8");
  return filePath;
}

export async function getMaterial(
  projectId: string,
  element: string,
  usage: string
): Promise<string | null> {
  const filePath = join(
    PROJECTS_DIR,
    projectId,
    "materials",
    "assets",
    `${element}-${usage}.svg`
  );
  if (!existsSync(filePath)) return null;
  return readFile(filePath, "utf-8");
}

// ── 列出素材 ──
export async function listMaterials(
  projectId: string
): Promise<{ element: string; usage: string; path: string }[]> {
  const assetsDir = join(PROJECTS_DIR, projectId, "materials", "assets");
  if (!existsSync(assetsDir)) return [];

  const files = await readdir(assetsDir);
  const result: { element: string; usage: string; path: string }[] = [];

  for (const file of files) {
    if (!file.endsWith(".svg")) continue;
    const match = file.match(/^(.+?)-(.+)\.svg$/);
    if (match) {
      result.push({
        element: match[1],
        usage: match[2],
        path: join(assetsDir, file),
      });
    }
  }
  return result;
}