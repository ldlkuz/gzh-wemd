import test from "node:test";
import assert from "node:assert/strict";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import {
  collectWatchableDirectories,
  createDebouncedRefresh,
  hasHiddenPathSegment,
  shouldTriggerWorkspaceRefresh,
} from "./workspaceWatcherUtils";

const makeTempWorkspace = () =>
  fs.mkdtempSync(path.join(os.tmpdir(), "wemd-electron-watch-"));

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

test("收集可监听目录时包含工作区和普通子目录，并跳过隐藏目录", () => {
  const workspace = makeTempWorkspace();
  try {
    fs.mkdirSync(path.join(workspace, "docs", "drafts"), { recursive: true });
    fs.mkdirSync(path.join(workspace, ".git", "objects"), { recursive: true });
    fs.mkdirSync(path.join(workspace, ".hidden"), { recursive: true });

    const dirs = collectWatchableDirectories(workspace).map((item) =>
      path.relative(workspace, item),
    );

    assert.deepEqual(dirs, ["", "docs", path.join("docs", "drafts")]);
  } finally {
    fs.rmSync(workspace, { recursive: true, force: true });
  }
});

test("识别隐藏路径片段", () => {
  assert.equal(hasHiddenPathSegment(path.join("docs", ".draft", "a.md")), true);
  assert.equal(hasHiddenPathSegment(path.join("docs", "draft", "a.md")), false);
});

test("判断文件系统事件是否需要刷新文件树", () => {
  assert.equal(shouldTriggerWorkspaceRefresh("a.md"), true);
  assert.equal(shouldTriggerWorkspaceRefresh("A.MD"), true);
  assert.equal(shouldTriggerWorkspaceRefresh("a.txt", { exists: true }), false);
  assert.equal(shouldTriggerWorkspaceRefresh(".DS_Store"), false);
  assert.equal(
    shouldTriggerWorkspaceRefresh("docs", {
      exists: true,
      isDirectory: true,
    }),
    true,
  );
  assert.equal(
    shouldTriggerWorkspaceRefresh("docs", {
      exists: false,
      wasWatchedDirectory: true,
    }),
    true,
  );
});

test("防抖刷新会合并连续事件", async () => {
  let refreshCount = 0;
  const debounced = createDebouncedRefresh(() => {
    refreshCount += 1;
  }, 10);

  debounced.schedule();
  debounced.schedule();
  debounced.schedule();

  await delay(25);
  assert.equal(refreshCount, 1);
});

test("取消防抖刷新后不会发送刷新事件", async () => {
  let refreshCount = 0;
  const debounced = createDebouncedRefresh(() => {
    refreshCount += 1;
  }, 10);

  debounced.schedule();
  debounced.cancel();

  await delay(25);
  assert.equal(refreshCount, 0);
});
