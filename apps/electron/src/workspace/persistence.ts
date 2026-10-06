/**
 * 工作区持久化
 *
 * 目的：让程序「自己拥有」一个工作区，外部 skill / agent 推送文章时无需关心路径。
 * - 优先使用上次记住的工作区（用户切换后写入）
 * - 从未选过或上次目录已失效时，回退到默认目录（「文档/WeMD」），自动创建
 */
import { app } from "electron";
import * as fs from "fs";
import * as path from "path";

/** 默认工作区：用户「文档」目录下的 WeMD 文件夹 */
export function defaultWorkspaceDir(): string {
  return path.join(app.getPath("documents"), "WeMD");
}

/** 持久化文件位置（userData/workspace.json） */
function storeFile(): string {
  return path.join(app.getPath("userData"), "workspace.json");
}

/** 读取上次记住的工作区路径；不存在或损坏时返回 null */
export function readStoredWorkspace(): string | null {
  try {
    const raw = fs.readFileSync(storeFile(), "utf-8");
    const parsed = JSON.parse(raw) as { path?: unknown };
    return typeof parsed.path === "string" && parsed.path ? parsed.path : null;
  } catch {
    return null;
  }
}

/** 记住工作区路径 */
export function writeStoredWorkspace(dir: string): void {
  try {
    fs.mkdirSync(path.dirname(storeFile()), { recursive: true });
    fs.writeFileSync(
      storeFile(),
      JSON.stringify({ path: dir }, null, 2),
      "utf-8",
    );
  } catch (error) {
    console.error("持久化工作区失败:", error);
  }
}

/**
 * 读取示例文章正文（打包内置 web-dist/samples/default.md，开发态读 monorepo 源文件）。
 * 示例内容统一来自 samples/default.md，前端不再硬编码范文常量。
 */
function resolveSampleMarkdown(): string | null {
  const candidates = app.isPackaged
    ? [path.join(process.resourcesPath, "web-dist", "samples", "default.md")]
    : [
        path.resolve(
          __dirname,
          "../../../../apps/web/public/samples/default.md",
        ),
      ];
  for (const file of candidates) {
    try {
      if (fs.existsSync(file)) return fs.readFileSync(file, "utf-8");
    } catch {
      /* 读不到就试下一个 */
    }
  }
  return null;
}

/**
 * 首次创建默认工作区时，落一篇示例文章。
 *
 * 示例内容以「工作目录里的普通文件」形式存在，用户可以打开、改写、删掉；
 * 而不是充当编辑器内存的初始值 —— 后者会在热更新、异常恢复等场景下
 * 意外「跳出来」与当前编辑的文件错配，甚至污染用户文章。
 */
export function seedSampleArticle(dir: string): void {
  const body = resolveSampleMarkdown();
  if (!body) return;

  const target = path.join(dir, "示例文章.md");
  if (fs.existsSync(target)) return;

  try {
    const content =
      "---\n" +
      "theme: default\n" +
      'themeName: "默认主题"\n' +
      'title: "示例文章"\n' +
      "---\n\n" +
      body.trimStart();
    fs.writeFileSync(target, content, "utf-8");
  } catch (error) {
    console.error("写入示例文章失败:", error);
  }
}

/**
 * 解析启动时应使用的工作区：
 * 1. 上次记住且仍存在 → 用它
 * 2. 否则用默认目录并自动创建（首次创建时落一篇示例文章）
 * 3. 创建失败 → null（退回让用户手动选择）
 */
export function resolveInitialWorkspace(): string | null {
  const stored = readStoredWorkspace();
  if (stored && fs.existsSync(stored)) return stored;

  const fallback = defaultWorkspaceDir();
  try {
    // 目录此前不存在 → 属于首次创建，落示例文章
    const isFresh = !fs.existsSync(fallback);
    fs.mkdirSync(fallback, { recursive: true });
    if (isFresh) seedSampleArticle(fallback);
    return fallback;
  } catch (error) {
    console.error("创建默认工作区失败:", error);
    return null;
  }
}
