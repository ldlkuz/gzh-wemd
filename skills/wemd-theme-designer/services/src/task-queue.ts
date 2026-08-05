// ============================================================
// Task Queue — 任务队列管理
// ============================================================
// 基于文件系统的任务队列：
//   inbox/     → 等待处理
//   processing/ → 正在处理
//   done/       → 已完成
//   failed/     → 执行失败（含错误日志）

import { join } from "node:path";
import { readdir, readFile, writeFile, rename, unlink, copyFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { WORKSPACE_DIR, ensureDir } from "./file-service.ts";
import type { DesignTask } from "./types.ts";
import { ulid } from "./utils.ts";

// ── 队列目录 ──
const QUEUE_DIRS = {
  inbox: join(WORKSPACE_DIR, "inbox"),
  processing: join(WORKSPACE_DIR, "processing"),
  done: join(WORKSPACE_DIR, "done"),
  failed: join(WORKSPACE_DIR, "failed"),
  logs: join(WORKSPACE_DIR, "logs"),
} as const;

// ── 创建任务 ──
export async function createTask(
  projectId: string,
  type: DesignTask["type"],
  input: Record<string, unknown> = {}
): Promise<DesignTask> {
  const task: DesignTask = {
    taskId: ulid(),
    projectId,
    type,
    input,
    status: "pending",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const filePath = join(QUEUE_DIRS.inbox, `${task.taskId}.json`);
  await ensureDir(QUEUE_DIRS.inbox);
  await writeFile(filePath, JSON.stringify(task, null, 2), "utf-8");

  console.log(`  ✓ 任务已创建: [${type}] ${task.taskId}`);
  return task;
}

// ── 获取下一个待处理任务 ──
export async function getNextTask(): Promise<{
  task: DesignTask;
  filePath: string;
} | null> {
  await ensureDir(QUEUE_DIRS.inbox);
  const files = await readdir(QUEUE_DIRS.inbox);
  if (files.length === 0) return null;

  const jsonFiles = files.filter((f) => f.endsWith(".json")).sort();
  if (jsonFiles.length === 0) return null;

  const firstFile = jsonFiles[0];
  const filePath = join(QUEUE_DIRS.inbox, firstFile);
  const raw = await readFile(filePath, "utf-8");
  const task = JSON.parse(raw) as DesignTask;
  return { task, filePath };
}

// ── 开始处理任务（移到 processing 目录） ──
export async function startProcessing(taskId: string): Promise<DesignTask | null> {
  await ensureDir(QUEUE_DIRS.processing);
  const srcPath = join(QUEUE_DIRS.inbox, `${taskId}.json`);
  const destPath = join(QUEUE_DIRS.processing, `${taskId}.json`);

  if (!existsSync(srcPath)) return null;

  await rename(srcPath, destPath);
  const raw = await readFile(destPath, "utf-8");
  const task = JSON.parse(raw) as DesignTask;
  task.status = "processing";
  task.updatedAt = new Date().toISOString();
  await writeFile(destPath, JSON.stringify(task, null, 2), "utf-8");

  return task;
}

// ── 完成任务（移到 done 目录） ──
export async function completeTask(taskId: string): Promise<DesignTask | null> {
  await ensureDir(QUEUE_DIRS.done);
  const srcPath = join(QUEUE_DIRS.processing, `${taskId}.json`);
  const destPath = join(QUEUE_DIRS.done, `${taskId}.json`);

  if (!existsSync(srcPath)) return null;

  const raw = await readFile(srcPath, "utf-8");
  const task = JSON.parse(raw) as DesignTask;
  task.status = "done";
  task.updatedAt = new Date().toISOString();
  await writeFile(destPath, JSON.stringify(task, null, 2), "utf-8");
  await unlink(srcPath);

  return task;
}

// ── 标记任务失败（移到 failed 目录） ──
export async function failTask(
  taskId: string,
  error: string
): Promise<DesignTask | null> {
  await ensureDir(QUEUE_DIRS.failed);
  await ensureDir(QUEUE_DIRS.logs);

  let srcPath = join(QUEUE_DIRS.inbox, `${taskId}.json`);
  if (!existsSync(srcPath)) {
    srcPath = join(QUEUE_DIRS.processing, `${taskId}.json`);
  }
  if (!existsSync(srcPath)) return null;

  const destPath = join(QUEUE_DIRS.failed, `${taskId}.json`);
  const raw = await readFile(srcPath, "utf-8");
  const task = JSON.parse(raw) as DesignTask;
  task.status = "failed";
  task.error = error;
  task.updatedAt = new Date().toISOString();
  await writeFile(destPath, JSON.stringify(task, null, 2), "utf-8");
  await unlink(srcPath);

  // 写入错误日志
  const logPath = join(QUEUE_DIRS.logs, `${taskId}.log`);
  await writeFile(
    logPath,
    `[${new Date().toISOString()}] Task ${taskId} failed:\n${error}\n`,
    "utf-8"
  );

  return task;
}

// ── 获取队列统计 ──
export async function getQueueStats(): Promise<{
  inbox: number;
  processing: number;
  done: number;
  failed: number;
}> {
  const count = async (dir: string) => {
    try {
      const files = await readdir(dir);
      return files.filter((f) => f.endsWith(".json")).length;
    } catch {
      return 0;
    }
  };

  return {
    inbox: await count(QUEUE_DIRS.inbox),
    processing: await count(QUEUE_DIRS.processing),
    done: await count(QUEUE_DIRS.done),
    failed: await count(QUEUE_DIRS.failed),
  };
}

// ── 列出待处理任务 ──
export async function listPendingTasks(): Promise<DesignTask[]> {
  await ensureDir(QUEUE_DIRS.inbox);
  const files = await readdir(QUEUE_DIRS.inbox);
  const tasks: DesignTask[] = [];

  for (const file of files.sort()) {
    if (!file.endsWith(".json")) continue;
    const raw = await readFile(join(QUEUE_DIRS.inbox, file), "utf-8");
    tasks.push(JSON.parse(raw));
  }
  return tasks;
}