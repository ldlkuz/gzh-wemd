import test from "node:test";
import assert from "node:assert/strict";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { getUniqueFilePath, scanWorkspace } from "./fileEntries";

const makeTempWorkspace = () =>
  fs.mkdtempSync(path.join(os.tmpdir(), "wemd-electron-"));

test("扫描工作区时只列出非隐藏目录与 Markdown 文件", () => {
  const workspace = makeTempWorkspace();
  try {
    fs.writeFileSync(
      path.join(workspace, "a.md"),
      "---\ntitle: 标题 A\nthemeName: 森林绿\n---\n\n正文",
      "utf-8",
    );
    fs.writeFileSync(path.join(workspace, "notes.txt"), "忽略", "utf-8");
    fs.writeFileSync(path.join(workspace, ".hidden.md"), "忽略", "utf-8");
    fs.mkdirSync(path.join(workspace, "folder"));
    fs.writeFileSync(path.join(workspace, "folder", "b.md"), "正文 B", "utf-8");
    fs.mkdirSync(path.join(workspace, ".hidden-folder"));
    fs.writeFileSync(
      path.join(workspace, ".hidden-folder", "c.md"),
      "忽略",
      "utf-8",
    );

    const entries = scanWorkspace(workspace);

    assert.equal(entries.length, 2);
    assert.equal(entries[0].name, "folder");
    assert.equal(entries[0].isDirectory, true);
    assert.equal(entries[0].children?.[0].name, "b.md");
    assert.equal(entries[1].name, "a.md");
    assert.equal(entries[1].title, "标题 A");
    assert.equal(entries[1].themeName, "森林绿");
  } finally {
    fs.rmSync(workspace, { recursive: true, force: true });
  }
});

test("生成唯一文件名时保留扩展名并追加编号", () => {
  const workspace = makeTempWorkspace();
  try {
    const first = path.join(workspace, "新文章.md");
    const second = path.join(workspace, "新文章 (1).md");
    fs.writeFileSync(first, "a", "utf-8");
    fs.writeFileSync(second, "b", "utf-8");

    assert.equal(
      getUniqueFilePath(first),
      path.join(workspace, "新文章 (2).md"),
    );
  } finally {
    fs.rmSync(workspace, { recursive: true, force: true });
  }
});
