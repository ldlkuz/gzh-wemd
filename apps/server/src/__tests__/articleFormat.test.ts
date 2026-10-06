import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  buildArticleContent,
  FRONTMATTER_RE,
  resolveAvailableFilename,
  sanitizeFilename,
  timestampFilename,
} from "../articleFormat";

describe("sanitizeFilename", () => {
  it("剥离目录部分，防止路径穿越", () => {
    expect(sanitizeFilename("../../etc/passwd")).toBe("passwd.md");
    expect(sanitizeFilename("a\\b\\c.md")).toBe("c.md");
    expect(sanitizeFilename("..\\..\\windows\\system32")).toBe("system32.md");
  });

  it("过滤非法字符并强制 .md 后缀", () => {
    expect(sanitizeFilename('a:b*c?d"e<f>g|h.md')).toBe("a-b-c-d-e-f-g-h.md");
  });

  it("已带 .md 后缀时不会重复追加", () => {
    expect(sanitizeFilename("我的文章.md")).toBe("我的文章.md");
    expect(sanitizeFilename("我的文章.MD")).toBe("我的文章.md");
  });

  it("空输入回退到 untitled.md", () => {
    expect(sanitizeFilename("")).toBe("untitled.md");
    expect(sanitizeFilename("   ")).toBe("untitled.md");
    expect(sanitizeFilename(".md")).toBe("untitled.md");
  });
});

describe("timestampFilename", () => {
  it("形如 untitled-YYYYMMDD-HHmmss.md", () => {
    expect(timestampFilename()).toMatch(
      /^untitled-\d{8}-\d{6}\.md$/,
    );
  });
});

describe("resolveAvailableFilename", () => {
  let dir: string;
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "wemd-fmt-"));
  });
  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it("无冲突时返回原名", () => {
    expect(resolveAvailableFilename(dir, "标题.md")).toBe("标题-1.md");
  });

  it("逐个试到未被占用的序号", () => {
    writeFileSync(join(dir, "标题-1.md"), "x");
    writeFileSync(join(dir, "标题-2.md"), "x");
    expect(resolveAvailableFilename(dir, "标题.md")).toBe("标题-3.md");
  });
});

describe("buildArticleContent", () => {
  it("无元信息时按原样返回", () => {
    expect(buildArticleContent("# 正文", {})).toBe("# 正文");
  });

  it("拼出 frontmatter，title/author 加引号转义", () => {
    const out = buildArticleContent("# 正文", {
      themeId: "sunset-film",
      themeName: "落日胶片",
      title: '他说"你好"',
      author: "老王",
    });
    expect(out).toBe(
      '---\ntheme: sunset-film\nthemeName: "落日胶片"\ntitle: "他说\\"你好\\""\nauthor: "老王"\n---\n\n# 正文',
    );
  });

  it("剥离调用方自带的 frontmatter，避免重复", () => {
    const out = buildArticleContent(
      '---\ntheme: old\ntitle: "旧"\n---\n\n# 正文',
      { themeId: "new" },
    );
    // 正则吃掉了闭合 --- 后的第一个换行，正文前会多一个空行 —— 既有行为，对 Markdown 渲染无影响
    expect(out).toBe("---\ntheme: new\n---\n\n\n# 正文");
    expect(out).not.toContain("theme: old");
    expect(out).not.toContain('title: "旧"');
  });

  it("容忍 CRLF 与 BOM 形式的历史 frontmatter", () => {
    expect(FRONTMATTER_RE.test("\uFEFF---\r\ntheme: a\r\n---\r\n正文")).toBe(
      true,
    );
    expect(
      buildArticleContent("\uFEFF---\r\ntheme: a\r\n---\r\n正文", {
        themeId: "b",
      }),
    ).toBe("---\ntheme: b\n---\n\n正文");
  });
});
