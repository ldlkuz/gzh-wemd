import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { resolveImages } from "../imageAssets";

/** 上传成功：返回永久地址 */
function stubUploadOk(url = "https://cdn.example.com/x.png") {
  const fetchMock = vi.fn(
    async () =>
      new Response(JSON.stringify({ url }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("resolveImages", () => {
  let root: string;
  let assets: string;

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), "wemd-img-"));
    assets = join(root, "assets");
    mkdirSync(assets);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    rmSync(root, { recursive: true, force: true });
  });

  it("预览模式（upload=false）不转存，只汇总提醒", async () => {
    const fetchMock = stubUploadOk();
    const md = "正文\n\n![](a.png)\n\n![](https://remote.example.com/b.png)";

    const { markdown, warnings } = await resolveImages(md, {
      assetsDir: assets,
      upload: false,
    });

    expect(markdown).toBe(md); // 原样保留
    expect(fetchMock).not.toHaveBeenCalled(); // 不产生任何上传
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain("预览模式");
    expect(warnings[0]).toContain("a.png");
  });

  it("远程地址原样放行，不产生告警", async () => {
    const fetchMock = stubUploadOk();
    const md = "![](https://remote.example.com/a.png)";

    const { markdown, warnings } = await resolveImages(md, { upload: true });

    expect(markdown).toBe(md);
    expect(warnings).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("本地路径逃出 assetsDir 被拒绝，保留原引用并告警", async () => {
    stubUploadOk();
    writeFileSync(join(root, "outside.png"), "secret");
    const md = "![](../outside.png)";

    const { markdown, warnings } = await resolveImages(md, {
      assetsDir: assets,
      upload: true,
    });

    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain("超出 assetsDir 范围");
    expect(markdown).not.toContain("cdn.example.com");
  });

  it("本地图片未提供 assetsDir 时告警", async () => {
    stubUploadOk();
    const { warnings } = await resolveImages("![](a.png)", { upload: true });

    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain("本地图片需要提供 assetsDir");
  });

  it("转存成功后回填永久地址", async () => {
    const fetchMock = stubUploadOk("https://cdn.example.com/uploaded.png");
    writeFileSync(join(assets, "unique-a.png"), "content-a");
    const md = "![](unique-a.png)";

    const { markdown, warnings } = await resolveImages(md, {
      assetsDir: assets,
      upload: true,
    });

    expect(warnings).toEqual([]);
    expect(markdown).toBe("![](https://cdn.example.com/uploaded.png)");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("同一张图重复引用只上传一次", async () => {
    const fetchMock = stubUploadOk("https://cdn.example.com/dedupe.png");
    writeFileSync(join(assets, "unique-b.png"), "content-b");
    const md = "![](unique-b.png)\n\n再看一次：![](unique-b.png)";

    const { markdown, warnings } = await resolveImages(md, {
      assetsDir: assets,
      upload: true,
    });

    expect(warnings).toEqual([]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(markdown).not.toContain("unique-b.png");
  });

  it("上传失败（图床拒绝）保留原引用并告警", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(JSON.stringify({ error: "不支持的文件类型" }), {
            status: 400,
            headers: { "content-type": "application/json" },
          }),
      ),
    );
    writeFileSync(join(assets, "unique-c.png"), "content-c");

    const { markdown, warnings } = await resolveImages("![](unique-c.png)", {
      assetsDir: assets,
      upload: true,
    });

    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain("不支持的文件类型");
    expect(markdown).toBe("![](unique-c.png)");
  });
});
