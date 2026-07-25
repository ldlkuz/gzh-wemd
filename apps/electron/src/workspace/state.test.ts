import test from "node:test";
import assert from "node:assert/strict";
import * as path from "path";
import { isPathInsideWorkspace, setWorkspaceDir } from "./state";

test("工作区路径校验允许根目录与子路径", () => {
  const workspace = path.resolve("/tmp/wemd-workspace");
  setWorkspaceDir(workspace);

  assert.equal(isPathInsideWorkspace(workspace), true);
  assert.equal(isPathInsideWorkspace(path.join(workspace, "article.md")), true);
  assert.equal(
    isPathInsideWorkspace(path.join(workspace, "folder", "a.md")),
    true,
  );
});

test("工作区路径校验拒绝相邻目录前缀碰撞", () => {
  const workspace = path.resolve("/tmp/wemd-workspace");
  setWorkspaceDir(workspace);

  assert.equal(
    isPathInsideWorkspace(path.resolve("/tmp/wemd-workspace-evil/a.md")),
    false,
  );
  assert.equal(
    isPathInsideWorkspace(path.resolve("/tmp/wemd-workspace2/a.md")),
    false,
  );
});

test("工作区未设置时拒绝任何路径", () => {
  setWorkspaceDir(null);

  assert.equal(
    isPathInsideWorkspace(path.resolve("/tmp/wemd-workspace/a.md")),
    false,
  );
});
