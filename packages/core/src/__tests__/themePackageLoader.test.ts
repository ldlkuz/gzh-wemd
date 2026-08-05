/**
 * themePackageLoader 单元测试
 *
 * 覆盖三种导入入口（JSON 字符串 / JSON 文件 / zip 压缩包）
 * 以及 repackThemePackage 往返测试。
 */

import { describe, it, expect } from "vitest";
import {
  loadThemePackageFromJSON,
  loadThemePackageFromZip,
  repackThemePackage,
} from "../theme-registry/themePackageLoader";
import { zip } from "fflate";
import type { ThemePackageManifest } from "../theme-schema/types";

// ============================================================
// 辅助：构造合法 manifest 基线
// ============================================================

function makeValidManifest(): ThemePackageManifest {
  return {
    sdkVersion: "1.0.0",
    meta: {
      id: "test-theme",
      name: "测试主题",
      description: "用于单元测试的合法主题",
      keywords: ["测试", "unit-test"],
      version: "1.0.0",
    },
    tokens: {
      color: {
        primary: "#3b82f6",
        primaryDark: "#2563eb",
        primaryLight: "#dbeafe",
        secondary: "#f59e0b",
        accent: "#ef4444",
        background: "#ffffff",
        bgSoft: "#f9fafb",
        bgCard: "#ffffff",
        bgMuted: "#e5e7eb",
        textStrong: "#111827",
        textNormal: "#374151",
        textSoft: "#9ca3af",
        border: "#d1d5db",
        borderSoft: "#e5e7eb",
      },
      typography: {
        fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
        fontSize: "16px",
        lineHeight: "1.75",
        letterSpacing: 0.5,
        heading: {
          h1: {
            fontSize: 28,
            color: "#111827",
            marginTop: 24,
            marginBottom: 16,
            fontWeight: "700",
          },
          h2: {
            fontSize: 24,
            color: "#111827",
            marginTop: 20,
            marginBottom: 12,
            fontWeight: "600",
          },
          h3: {
            fontSize: 20,
            color: "#374151",
            marginTop: 16,
            marginBottom: 10,
            fontWeight: "600",
          },
          h4: {
            fontSize: 18,
            color: "#374151",
            marginTop: 14,
            marginBottom: 8,
            fontWeight: "500",
          },
        },
        codeFontFamily: "Consolas, monospace",
      },
      spacing: { pagePadding: 16, paragraphMargin: 12 },
      border: { radius: 8 },
      shadow: { enabled: false, value: "none" },
    },
    layout: {
      preferredComponents: ["share-card", "quote-card"],
      density: "medium",
      tone: ["modern", "minimal"],
    },
  };
}

/** 将 manifest 序列化为 JSON 字符串 */
function manifestToJson(manifest: ThemePackageManifest): string {
  return JSON.stringify(manifest, null, 2);
}

/** 将文件集合打包为 zip Uint8Array */
function createZip(
  files: Record<string, string | Uint8Array>,
): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const u8Files: Record<string, Uint8Array> = {};
    for (const [name, content] of Object.entries(files)) {
      u8Files[name] =
        typeof content === "string"
          ? new TextEncoder().encode(content)
          : content;
    }
    zip(u8Files, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
}

// ============================================================
// 测试：JSON 字符串加载
// ============================================================

describe("loadThemePackageFromJSON", () => {
  it("合法 JSON manifest 应成功加载", () => {
    const json = manifestToJson(makeValidManifest());
    const result = loadThemePackageFromJSON(json);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.manifest.meta.id).toBe("test-theme");
      expect(result.value.styles).toEqual({});
    }
  });

  it("非法 JSON manifest 应返回错误", () => {
    const manifest = makeValidManifest();
    manifest.sdkVersion = "9.9.9";
    const result = loadThemePackageFromJSON(manifestToJson(manifest));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.length).toBeGreaterThan(0);
    }
  });

  it("非法 JSON 格式应返回错误", () => {
    const result = loadThemePackageFromJSON("not-valid-json{{{");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors[0].message).toContain("JSON 解析失败");
    }
  });

  it("空字符串应返回错误", () => {
    const result = loadThemePackageFromJSON("");
    expect(result.ok).toBe(false);
  });

  it("非对象 JSON 应返回错误", () => {
    const result = loadThemePackageFromJSON('"just a string"');
    expect(result.ok).toBe(false);
  });
});

// ============================================================
// 测试：zip 压缩包加载
// ============================================================

describe("loadThemePackageFromZip", () => {
  it("合法 zip（仅 manifest.json）应成功加载", async () => {
    const zipData = await createZip({
      "manifest.json": manifestToJson(makeValidManifest()),
    });
    const result = await loadThemePackageFromZip(zipData);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.manifest.meta.id).toBe("test-theme");
      expect(result.value.rawZip).toBeDefined();
    }
  });

  it("缺少 manifest.json 应报错", async () => {
    const zipData = await createZip({
      "brand.md": "some brand text",
    });
    const result = await loadThemePackageFromZip(zipData);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(
        result.errors.some((e) => e.message.includes("manifest.json")),
      ).toBe(true);
    }
  });

  it("无效的 zip 数据应报错", async () => {
    const badZip = new Uint8Array([0, 1, 2, 3, 4]);
    const result = await loadThemePackageFromZip(badZip);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.some((e) => e.message.includes("解压失败"))).toBe(
        true,
      );
    }
  });

  it("包含 brand.md 的 zip 应解析品牌文本", async () => {
    const zipData = await createZip({
      "manifest.json": manifestToJson(makeValidManifest()),
      "brand.md": "这是一个科技品牌的描述文本",
    });
    const result = await loadThemePackageFromZip(zipData);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.brand?.text).toContain("科技品牌");
    }
  });

  it("包含 styles/components.css 的 zip 应解析 CSS", async () => {
    const zipData = await createZip({
      "manifest.json": manifestToJson(makeValidManifest()),
      "styles/components.css": ".wemd-share-card { padding: 10px; }",
    });
    const result = await loadThemePackageFromZip(zipData);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.styles.componentsCss).toContain(".wemd-share-card");
    }
  });

  it("包含 styles/extras.css 的 zip 应解析 CSS", async () => {
    const zipData = await createZip({
      "manifest.json": manifestToJson(makeValidManifest()),
      "styles/extras.css": ".extra { margin: 0; }",
    });
    const result = await loadThemePackageFromZip(zipData);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.styles.extrasCss).toContain(".extra");
    }
  });

  it("components.css 含伪元素 ::before 应阻断导入", async () => {
    const zipData = await createZip({
      "manifest.json": manifestToJson(makeValidManifest()),
      "styles/components.css": ".card::before { content: ''; }",
    });
    const result = await loadThemePackageFromZip(zipData);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.some((e) => e.message.includes("伪元素"))).toBe(
        true,
      );
    }
  });

  it("components.css 含结构伪类 :nth-child 应阻断导入", async () => {
    const zipData = await createZip({
      "manifest.json": manifestToJson(makeValidManifest()),
      "styles/components.css": ".card :nth-child(2) { color: red; }",
    });
    const result = await loadThemePackageFromZip(zipData);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.some((e) => e.message.includes("结构伪类"))).toBe(
        true,
      );
    }
  });

  it("components.css 含外链应阻断导入", async () => {
    const zipData = await createZip({
      "manifest.json": manifestToJson(makeValidManifest()),
      "styles/components.css":
        ".card { background: url(https://evil.com/x.png); }",
    });
    const result = await loadThemePackageFromZip(zipData);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.some((e) => e.message.includes("外链"))).toBe(true);
    }
  });

  it("components.css 含 <style> 标签应阻断导入", async () => {
    const zipData = await createZip({
      "manifest.json": manifestToJson(makeValidManifest()),
      "styles/components.css": "<style>.card { color: red; }</style>",
    });
    const result = await loadThemePackageFromZip(zipData);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.some((e) => e.message.includes("<style>"))).toBe(
        true,
      );
    }
  });

  it("包含 preview.png 的 zip 应保留预览图", async () => {
    const previewBytes = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]); // PNG 头
    const zipData = await createZip({
      "manifest.json": manifestToJson(makeValidManifest()),
      "preview.png": previewBytes,
    });
    const result = await loadThemePackageFromZip(zipData);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.preview).toBeDefined();
      expect(result.value.preview![0]).toBe(137); // PNG magic byte
    }
  });

  it("包含 assets/images/ 的 zip 应解析为 base64 data URL", async () => {
    const iconBytes = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
    const zipData = await createZip({
      "manifest.json": manifestToJson(makeValidManifest()),
      "assets/images/icon.png": iconBytes,
      "assets/images/logo.svg": "<svg></svg>",
    });
    const result = await loadThemePackageFromZip(zipData);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.assets?.images).toBeDefined();
      expect(result.value.assets!.images.has("icon.png")).toBe(true);
      expect(result.value.assets!.images.has("logo.svg")).toBe(true);
      expect(result.value.assets!.images.get("icon.png")).toContain(
        "data:image/png;base64,",
      );
      expect(result.value.assets!.images.get("logo.svg")).toContain(
        "data:image/svg+xml;base64,",
      );
    }
  });

  it("manifest.json 非法时应返回 Validator 错误", async () => {
    const manifest = makeValidManifest();
    manifest.meta.id = ""; // 非法
    const zipData = await createZip({
      "manifest.json": manifestToJson(manifest),
    });
    const result = await loadThemePackageFromZip(zipData);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.some((e) => e.path === "/meta/id")).toBe(true);
    }
  });

  // ---------- assets/images 存在性 / 孤立 / 独立 SVG 安全 ----------

  it("manifest 声明了不存在的 assets 文件路径应 warning 不阻断", async () => {
    const manifest = makeValidManifest();
    manifest.assets = {
      images: [{ key: "logo", src: "assets/images/brand-logo.svg" }],
    };
    const zipData = await createZip({
      "manifest.json": manifestToJson(manifest),
      // 注意：故意不放 brand-logo.svg
      "assets/images/other.png": new Uint8Array([
        137, 80, 78, 71, 13, 10, 26, 10,
      ]),
    });
    const result = await loadThemePackageFromZip(zipData);
    expect(result.ok).toBe(true);
    if (result.ok) {
      const warnings = result.warnings ?? [];
      expect(
        warnings.some(
          (e) =>
            e.severity === "warning" &&
            e.path.startsWith("/assets/images/") &&
            e.message.includes("zip 中未找到"),
        ),
      ).toBe(true);
    }
  });

  it("zip 里有孤立资源（manifest 未声明且 CSS 未引用）应 warning 但 ok 通过", async () => {
    const manifest = makeValidManifest();
    manifest.assets = { images: [] };
    const zipData = await createZip({
      "manifest.json": manifestToJson(manifest),
      "assets/images/orphan-deco.svg":
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2 2"><rect fill="#f00"/></svg>',
    });
    const result = await loadThemePackageFromZip(zipData);
    expect(result.ok).toBe(true);
    if (result.ok) {
      const warnings = result.warnings ?? [];
      expect(
        warnings.some(
          (e) =>
            e.severity === "warning" &&
            (e.message.includes("孤立资源") ||
              e.message.includes("未在 manifest.assets.images 注册")),
        ),
      ).toBe(true);
    }
  });

  it("CSS 中用 var(--wemd-asset-xxx) 引用的 orphan 不算孤立", async () => {
    const manifest = makeValidManifest();
    manifest.components = {
      ...(manifest.components ?? {}),
      "hero-banner": {
        enabled: true,
        variant: "brand",
        variantCss:
          '.wemd-hero-banner[data-variant="brand"] { background: var(--wemd-asset-hero-deco-svg); }',
      },
    };
    const zipData = await createZip({
      "manifest.json": manifestToJson(manifest),
      // 故意不在 manifest.assets 声明，但 CSS 中用了，不应该报孤立
      "assets/images/hero-deco.svg":
        '<svg xmlns="http://www.w3.org/2000/svg"><path/></svg>',
    });
    const result = await loadThemePackageFromZip(zipData);
    expect(result.ok).toBe(true);
    if (result.ok) {
      const warnings = result.warnings ?? [];
      expect(
        warnings.some(
          (e) =>
            e.message.includes("孤立资源") && e.path?.includes("hero-deco"),
        ),
      ).toBe(false);
    }
  });

  it("zip 内独立 SVG 含恶意 <script> 应 warning 不阻断", async () => {
    const manifest = makeValidManifest();
    manifest.assets = {
      images: [{ key: "logo", src: "assets/images/logo.svg" }],
    };
    const zipData = await createZip({
      "manifest.json": manifestToJson(manifest),
      "assets/images/logo.svg":
        '<svg xmlns="http://www.w3.org/2000/svg"><script>alert("xss")</script></svg>',
    });
    const result = await loadThemePackageFromZip(zipData);
    expect(result.ok).toBe(true);
    if (result.ok) {
      const warnings = result.warnings ?? [];
      expect(
        warnings.some(
          (e) => e.severity === "warning" && e.message.includes("<script>"),
        ),
      ).toBe(true);
    }
  });

  it("zip 内 SVG 含 <image> 伪位图应 warning 不阻断", async () => {
    const manifest = makeValidManifest();
    manifest.assets = {
      images: [{ key: "logo", src: "assets/images/logo.svg" }],
    };
    const zipData = await createZip({
      "manifest.json": manifestToJson(manifest),
      "assets/images/logo.svg":
        '<svg xmlns="http://www.w3.org/2000/svg"><image href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="/></svg>',
    });
    const result = await loadThemePackageFromZip(zipData);
    expect(result.ok).toBe(true);
    if (result.ok) {
      const warnings = result.warnings ?? [];
      expect(
        warnings.some(
          (e) =>
            e.severity === "warning" &&
            (e.message.includes("<image>") || e.message.includes("嵌入位图")),
        ),
      ).toBe(true);
    }
  });

  it("空 Uint8Array 应返回错误", async () => {
    const result = await loadThemePackageFromZip(new Uint8Array(0));
    expect(result.ok).toBe(false);
  });
});

// ============================================================
// 测试：repackThemePackage 往返
// ============================================================

describe("repackThemePackage", () => {
  it("往返：加载 → 重新打包 → 再加载，manifest 应一致", async () => {
    const json = manifestToJson(makeValidManifest());
    const loadResult = loadThemePackageFromJSON(json);
    expect(loadResult.ok).toBe(true);
    if (!loadResult.ok) return;

    const pkg = loadResult.value;
    const repackedZip = await repackThemePackage(pkg);

    const reloadResult = await loadThemePackageFromZip(repackedZip);
    expect(reloadResult.ok).toBe(true);
    if (reloadResult.ok) {
      expect(reloadResult.value.manifest.meta.id).toBe(pkg.manifest.meta.id);
      expect(reloadResult.value.manifest.meta.name).toBe(
        pkg.manifest.meta.name,
      );
    }
  });

  it("往返：含 brand.md 和 components.css 的包应保留所有内容", async () => {
    const zipData = await createZip({
      "manifest.json": manifestToJson(makeValidManifest()),
      "brand.md": "品牌描述",
      "styles/components.css": ".wemd-share-card { padding: 10px; }",
    });
    const loadResult = await loadThemePackageFromZip(zipData);
    expect(loadResult.ok).toBe(true);
    if (!loadResult.ok) return;

    const pkg = loadResult.value;
    const repackedZip = await repackThemePackage(pkg);

    const reloadResult = await loadThemePackageFromZip(repackedZip);
    expect(reloadResult.ok).toBe(true);
    if (reloadResult.ok) {
      expect(reloadResult.value.brand?.text).toBe("品牌描述");
      expect(reloadResult.value.styles.componentsCss).toContain(
        ".wemd-share-card",
      );
    }
  });
});
