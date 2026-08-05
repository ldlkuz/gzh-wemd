/**
 * ThemeValidator 单元测试
 *
 * 覆盖 Phase 1 全部 9 个校验点，确保 Validator 正确拦截非法 manifest
 * 并放过合法 manifest。
 */

import { describe, it, expect } from "vitest";
import { validateThemePackageManifest } from "../theme-registry/ThemeValidator";
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

// ============================================================
// 测试用例
// ============================================================

describe("ThemeValidator", () => {
  // ---------- 合法场景 ----------

  it("合法 manifest 应通过校验（基础字段）", () => {
    const manifest = makeValidManifest();
    const result = validateThemePackageManifest(manifest);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.meta.id).toBe("test-theme");
    }
  });

  it("合法 manifest + 轨道 B 自定义 variantCss 应通过校验", () => {
    const manifest = makeValidManifest();
    manifest.components = {
      "share-card": {
        enabled: true,
        variant: "my-custom",
        variantCss:
          '.wemd-share-card[data-variant="my-custom"] { background: var(--wemd-bg-card); border-radius: 12px; }',
      },
    };
    const result = validateThemePackageManifest(manifest);
    expect(result.ok).toBe(true);
  });

  it("合法 manifest + 多个组件 variantCss 应通过校验", () => {
    const manifest = makeValidManifest();
    manifest.components = {
      "share-card": {
        enabled: true,
        variant: "custom-a",
        variantCss:
          '.wemd-share-card[data-variant="custom-a"] { padding: 20px; }',
      },
      "hero-banner": {
        enabled: true,
        variant: "custom-b",
        variantCss:
          '.wemd-hero-banner[data-variant="custom-b"] { text-align: left; }',
      },
    };
    const result = validateThemePackageManifest(manifest);
    expect(result.ok).toBe(true);
  });

  it("合法 manifest + assets 应通过校验", () => {
    const manifest = makeValidManifest();
    manifest.assets = {
      images: [
        {
          key: "hero-bg",
          src: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCI+PC9zdmc+",
        },
        { key: "icon", src: "assets/icons/star.svg" },
      ],
    };
    const result = validateThemePackageManifest(manifest);
    expect(result.ok).toBe(true);
  });

  it("合法 manifest + preferredComponents 对象格式（含 reason）应通过校验", () => {
    const manifest = makeValidManifest();
    manifest.layout.preferredComponents = [
      { name: "share-card", reason: "适合社交分享场景" },
      "quote-card",
    ];
    const result = validateThemePackageManifest(manifest);
    expect(result.ok).toBe(true);
  });

  it("合法 manifest + overrides 应通过校验", () => {
    const manifest = makeValidManifest();
    manifest.components = {
      "share-card": {
        enabled: true,
        overrides: {
          "border-radius": "16px",
          "box-shadow": "0 2px 8px rgba(0,0,0,0.1)",
        },
      },
    };
    const result = validateThemePackageManifest(manifest);
    expect(result.ok).toBe(true);
  });

  // ---------- 非法场景：顶层结构 ----------

  it("非对象输入应返回错误", () => {
    const result = validateThemePackageManifest("not-an-object");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].path).toBe("/");
    }
  });

  it("null 输入应返回错误", () => {
    const result = validateThemePackageManifest(null);
    expect(result.ok).toBe(false);
  });

  it("数组输入应返回错误", () => {
    const result = validateThemePackageManifest([]);
    expect(result.ok).toBe(false);
  });

  // ---------- 校验点 1: sdkVersion ----------

  it("缺少 sdkVersion 应报错", () => {
    const manifest = makeValidManifest();
    const raw = { ...manifest } as Record<string, unknown>;
    delete raw.sdkVersion;
    const result = validateThemePackageManifest(raw);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      const sdkErrors = result.errors.filter((e) => e.path === "/sdkVersion");
      expect(sdkErrors.length).toBeGreaterThan(0);
    }
  });

  it("sdkVersion 格式非法应报错", () => {
    const manifest = makeValidManifest();
    manifest.sdkVersion = "not-semver";
    const result = validateThemePackageManifest(manifest);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      const sdkErrors = result.errors.filter((e) => e.path === "/sdkVersion");
      expect(sdkErrors.length).toBeGreaterThan(0);
    }
  });

  it("sdkVersion 不在支持列表应报错", () => {
    const manifest = makeValidManifest();
    manifest.sdkVersion = "9.9.9";
    const result = validateThemePackageManifest(manifest);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      const sdkErrors = result.errors.filter((e) => e.path === "/sdkVersion");
      expect(sdkErrors.length).toBeGreaterThan(0);
    }
  });

  // ---------- 校验点 2: meta ----------

  it("缺少 meta 应报错", () => {
    const manifest = makeValidManifest();
    const raw = { ...manifest } as Record<string, unknown>;
    delete raw.meta;
    const result = validateThemePackageManifest(raw);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      const metaErrors = result.errors.filter((e) =>
        e.path.startsWith("/meta"),
      );
      expect(metaErrors.length).toBeGreaterThan(0);
    }
  });

  it("meta.id 为空应报错", () => {
    const manifest = makeValidManifest();
    manifest.meta.id = "";
    const result = validateThemePackageManifest(manifest);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.some((e) => e.path === "/meta/id")).toBe(true);
    }
  });

  it("meta.keywords 为空数组应报错", () => {
    const manifest = makeValidManifest();
    manifest.meta.keywords = [];
    const result = validateThemePackageManifest(manifest);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.some((e) => e.path === "/meta/keywords")).toBe(true);
    }
  });

  it("meta.version 格式非法应报错", () => {
    const manifest = makeValidManifest();
    manifest.meta.version = "abc";
    const result = validateThemePackageManifest(manifest);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.some((e) => e.path === "/meta/version")).toBe(true);
    }
  });

  // ---------- 校验点 3: tokens.color ----------

  it("缺少 tokens.color 应报错", () => {
    const manifest = makeValidManifest();
    const raw = { ...manifest } as Record<string, unknown>;
    const tokens = raw.tokens as Record<string, unknown>;
    delete tokens.color;
    const result = validateThemePackageManifest(raw);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.some((e) => e.path === "/tokens/color")).toBe(true);
    }
  });

  it("颜色值非法应报错", () => {
    const manifest = makeValidManifest();
    manifest.tokens.color.primary = "not-a-color";
    const result = validateThemePackageManifest(manifest);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(
        result.errors.some((e) => e.path === "/tokens/color/primary"),
      ).toBe(true);
    }
  });

  it("颜色字段缺失应报错", () => {
    const manifest = makeValidManifest();
    const raw = { ...manifest } as Record<string, unknown>;
    const tokens = raw.tokens as Record<string, unknown>;
    const color = tokens.color as Record<string, unknown>;
    delete color.primary;
    const result = validateThemePackageManifest(raw);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(
        result.errors.some((e) => e.path === "/tokens/color/primary"),
      ).toBe(true);
    }
  });

  // ---------- 校验点 4: tokens.typography ----------

  it("缺少 typography 应报错", () => {
    const manifest = makeValidManifest();
    const raw = { ...manifest } as Record<string, unknown>;
    const tokens = raw.tokens as Record<string, unknown>;
    delete tokens.typography;
    const result = validateThemePackageManifest(raw);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.some((e) => e.path === "/tokens/typography")).toBe(
        true,
      );
    }
  });

  it("fontSize 不带单位应报错", () => {
    const manifest = makeValidManifest();
    manifest.tokens.typography.fontSize = "16"; // 缺少 px
    const result = validateThemePackageManifest(manifest);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(
        result.errors.some((e) => e.path === "/tokens/typography/fontSize"),
      ).toBe(true);
    }
  });

  it("heading.h1 缺少子字段应报错", () => {
    const manifest = makeValidManifest();
    // @ts-expect-error 测试缺少字段
    delete manifest.tokens.typography.heading.h1.fontSize;
    const result = validateThemePackageManifest(manifest);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(
        result.errors.some(
          (e) => e.path === "/tokens/typography/heading/h1/fontSize",
        ),
      ).toBe(true);
    }
  });

  // ---------- 校验点 5: tokens.spacing/border/shadow ----------

  it("缺少 spacing 应报错", () => {
    const manifest = makeValidManifest();
    const raw = { ...manifest } as Record<string, unknown>;
    const tokens = raw.tokens as Record<string, unknown>;
    delete tokens.spacing;
    const result = validateThemePackageManifest(raw);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.some((e) => e.path === "/tokens/spacing")).toBe(
        true,
      );
    }
  });

  it("缺少 border 应报错", () => {
    const manifest = makeValidManifest();
    const raw = { ...manifest } as Record<string, unknown>;
    const tokens = raw.tokens as Record<string, unknown>;
    delete tokens.border;
    const result = validateThemePackageManifest(raw);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.some((e) => e.path === "/tokens/border")).toBe(true);
    }
  });

  it("shadow.enabled 不是布尔值应报错", () => {
    const manifest = makeValidManifest();
    // @ts-expect-error 测试非法类型
    manifest.tokens.shadow.enabled = "yes";
    const result = validateThemePackageManifest(manifest);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(
        result.errors.some((e) => e.path === "/tokens/shadow/enabled"),
      ).toBe(true);
    }
  });

  // ---------- 校验点 6: components ----------

  it("components 包含未知组件名应报错", () => {
    const manifest = makeValidManifest();
    manifest.components = {
      "not-a-component": { enabled: true },
    };
    const result = validateThemePackageManifest(manifest);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(
        result.errors.some((e) => e.path === "/components/not-a-component"),
      ).toBe(true);
    }
  });

  it("AI 主题 variant 缺少 variantCss 应报错", () => {
    const manifest = makeValidManifest();
    manifest.components = {
      "share-card": {
        enabled: true,
        variant: "my-variant",
        // 缺少 variantCss
      },
    };
    const result = validateThemePackageManifest(manifest);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(
        result.errors.some((e) => e.path === "/components/share-card/variant"),
      ).toBe(true);
    }
  });

  it("variantCss 包含伪元素 ::before 应报错", () => {
    const manifest = makeValidManifest();
    manifest.components = {
      "share-card": {
        enabled: true,
        variant: "bad",
        variantCss:
          '.wemd-share-card[data-variant="bad"]::before { content: "X"; }',
      },
    };
    const result = validateThemePackageManifest(manifest);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.some((e) => e.message.includes("伪元素"))).toBe(
        true,
      );
    }
  });

  it("variantCss 包含结构伪类 :nth-child 应报错", () => {
    const manifest = makeValidManifest();
    manifest.components = {
      "share-card": {
        enabled: true,
        variant: "bad",
        variantCss:
          '.wemd-share-card[data-variant="bad"] :nth-child(2) { color: red; }',
      },
    };
    const result = validateThemePackageManifest(manifest);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.some((e) => e.message.includes("结构伪类"))).toBe(
        true,
      );
    }
  });

  it("variantCss 包含外链 url(http...) 应报错", () => {
    const manifest = makeValidManifest();
    manifest.components = {
      "share-card": {
        enabled: true,
        variant: "bad",
        variantCss:
          '.wemd-share-card[data-variant="bad"] { background: url(https://evil.com/x.png); }',
      },
    };
    const result = validateThemePackageManifest(manifest);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.some((e) => e.message.includes("外链"))).toBe(true);
    }
  });

  it("variantCss 包含 <style> 标签应报错", () => {
    const manifest = makeValidManifest();
    manifest.components = {
      "share-card": {
        enabled: true,
        variant: "bad",
        variantCss:
          '<style>.wemd-share-card[data-variant="bad"] { color: red; }</style>',
      },
    };
    const result = validateThemePackageManifest(manifest);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.some((e) => e.message.includes("<style>"))).toBe(
        true,
      );
    }
  });

  it("variantCss 选择器无 .wemd- 前缀应报错", () => {
    const manifest = makeValidManifest();
    manifest.components = {
      "share-card": {
        enabled: true,
        variant: "bad",
        variantCss: '.my-share-card[data-variant="bad"] { color: red; }',
      },
    };
    const result = validateThemePackageManifest(manifest);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.some((e) => e.message.includes(".wemd-"))).toBe(
        true,
      );
    }
  });

  it("variantCss 超过 50KB 应报错", () => {
    const manifest = makeValidManifest();
    const longCss =
      '.wemd-share-card[data-variant="big"] { ' + "x".repeat(51 * 1024) + " }";
    manifest.components = {
      "share-card": {
        enabled: true,
        variant: "big",
        variantCss: longCss,
      },
    };
    const result = validateThemePackageManifest(manifest);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.some((e) => e.message.includes("50KB"))).toBe(true);
    }
  });

  it("overrides 值不是字符串应报错", () => {
    const manifest = makeValidManifest();
    manifest.components = {
      "share-card": {
        enabled: true,
        // @ts-expect-error 测试非法类型
        overrides: { "border-radius": 123 },
      },
    };
    const result = validateThemePackageManifest(manifest);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.some((e) => e.path.includes("/overrides/"))).toBe(
        true,
      );
    }
  });

  it("overrides 不是对象应报错", () => {
    const manifest = makeValidManifest();
    manifest.components = {
      "share-card": {
        enabled: true,
        // @ts-expect-error 测试非法类型
        overrides: "not-an-object",
      },
    };
    const result = validateThemePackageManifest(manifest);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(
        result.errors.some(
          (e) => e.path === "/components/share-card/overrides",
        ),
      ).toBe(true);
    }
  });

  it("components 不是对象应报错", () => {
    const manifest = makeValidManifest();
    // @ts-expect-error 测试非法类型
    manifest.components = "not-an-object";
    const result = validateThemePackageManifest(manifest);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.some((e) => e.path === "/components")).toBe(true);
    }
  });

  it("组件 enabled 不是布尔值应报错", () => {
    const manifest = makeValidManifest();
    manifest.components = {
      "share-card": {
        // @ts-expect-error 测试非法类型
        enabled: "yes",
      },
    };
    const result = validateThemePackageManifest(manifest);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(
        result.errors.some((e) => e.path === "/components/share-card/enabled"),
      ).toBe(true);
    }
  });

  // ---------- 校验点 7: layout ----------

  it("缺少 layout 应报错", () => {
    const manifest = makeValidManifest();
    const raw = { ...manifest } as Record<string, unknown>;
    delete raw.layout;
    const result = validateThemePackageManifest(raw);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.some((e) => e.path === "/layout")).toBe(true);
    }
  });

  it("preferredComponents 包含未知组件应报错", () => {
    const manifest = makeValidManifest();
    manifest.layout.preferredComponents = ["not-a-component"];
    const result = validateThemePackageManifest(manifest);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(
        result.errors.some((e) => e.path.includes("preferredComponents")),
      ).toBe(true);
    }
  });

  it("preferredComponents 对象格式 name 非法应报错", () => {
    const manifest = makeValidManifest();
    manifest.layout.preferredComponents = [
      { name: "not-a-component", reason: "test" },
    ];
    const result = validateThemePackageManifest(manifest);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(
        result.errors.some((e) =>
          e.path.includes("preferredComponents/0/name"),
        ),
      ).toBe(true);
    }
  });

  it("preferredComponents reason 超过 50 字应报错", () => {
    const manifest = makeValidManifest();
    manifest.layout.preferredComponents = [
      {
        name: "share-card",
        reason:
          "这是一段超过五十个字的理由描述文本，用于测试校验器是否会正确拦截过长的推荐理由，保证不超过限制，额外加几个字触发",
      },
    ];
    const result = validateThemePackageManifest(manifest);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.some((e) => e.path.includes("reason"))).toBe(true);
    }
  });

  it("preferredComponents 元素类型非法应报错", () => {
    const manifest = makeValidManifest();
    // @ts-expect-error 测试非法类型
    manifest.layout.preferredComponents = [123];
    const result = validateThemePackageManifest(manifest);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(
        result.errors.some((e) => e.path.includes("preferredComponents/0")),
      ).toBe(true);
    }
  });

  it("density 值非法应报错", () => {
    const manifest = makeValidManifest();
    // @ts-expect-error 测试非法值
    manifest.layout.density = "ultra";
    const result = validateThemePackageManifest(manifest);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.some((e) => e.path === "/layout/density")).toBe(
        true,
      );
    }
  });

  it("tone 为空数组应报错", () => {
    const manifest = makeValidManifest();
    manifest.layout.tone = [];
    const result = validateThemePackageManifest(manifest);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.some((e) => e.path === "/layout/tone")).toBe(true);
    }
  });

  // ---------- 校验点 8: assets ----------

  it("assets.images 不是数组应报错", () => {
    const manifest = makeValidManifest();
    // @ts-expect-error 测试非法类型
    manifest.assets = { images: "not-array" };
    const result = validateThemePackageManifest(manifest);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.some((e) => e.path === "/assets/images")).toBe(true);
    }
  });

  it("图片 src 不以 data: 或 assets/ 开头应 warning 不阻断", () => {
    const manifest = makeValidManifest();
    manifest.assets = {
      images: [{ key: "bad", src: "https://external.com/img.png" }],
    };
    const result = validateThemePackageManifest(manifest);
    expect(result.ok).toBe(true);
    const warnings = result.ok ? (result.errors ?? []) : [];
    expect(
      warnings.some((e) => e.severity === "warning" && e.path.includes("src")),
    ).toBe(true);
  });

  it("图片缺少 key 应 warning 不阻断", () => {
    const manifest = makeValidManifest();
    manifest.assets = {
      images: [{ src: "data:image/png;base64,abc" } as any],
    };
    const result = validateThemePackageManifest(manifest);
    expect(result.ok).toBe(true);
    const warnings = result.ok ? (result.errors ?? []) : [];
    expect(
      warnings.some((e) => e.severity === "warning" && e.path.includes("key")),
    ).toBe(true);
  });

  it("assets 不是对象应报错", () => {
    const manifest = makeValidManifest();
    // @ts-expect-error 测试非法类型
    manifest.assets = "not-object";
    const result = validateThemePackageManifest(manifest);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.some((e) => e.path === "/assets")).toBe(true);
    }
  });

  // ---------- 校验点 8b: variantCss 中 url(assets/...) 拦截 ----------

  it("variantCss 中直接写 url(assets/images/xxx) 应报错", () => {
    const manifest = makeValidManifest();
    manifest.components = {
      "share-card": {
        enabled: true,
        variant: "bad",
        variantCss:
          '.wemd-share-card[data-variant="bad"] { background: url(assets/images/logo.svg) no-repeat; }',
      },
    };
    const result = validateThemePackageManifest(manifest);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      const hit = result.errors.find(
        (e) =>
          e.message.includes("url(assets/...)") ||
          e.message.includes("zip 路径"),
      );
      expect(hit).toBeTruthy();
    }
  });

  it("variantCss 中用 url(data:image/svg+xml;utf8,...) 直接内联应通过", () => {
    const manifest = makeValidManifest();
    manifest.components = {
      "quote-card": {
        enabled: true,
        variant: "good",
        variantCss:
          '.wemd-quote-card[data-variant="good"] { background-image: url("data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2216%22 height=%2216%22><circle cx=%228%22 cy=%228%22 r=%224%22 fill=%22red%22/></svg>"); }',
      },
    };
    const result = validateThemePackageManifest(manifest);
    expect(result.ok).toBe(true);
  });

  // ---------- 校验点 8c: SVG 安全扫描（manifest 内嵌 base64/utf8 SVG）----------

  it("manifest 中内联的恶意 SVG（含 <script>）应 warning 不阻断", () => {
    const maliciousSvg =
      "data:image/svg+xml;utf8," +
      encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>',
      );
    const manifest = makeValidManifest();
    manifest.assets = { images: [{ key: "logo", src: maliciousSvg }] };
    const result = validateThemePackageManifest(manifest);
    expect(result.ok).toBe(true);
    const warnings = result.ok ? (result.errors ?? []) : [];
    expect(
      warnings.some(
        (e) => e.severity === "warning" && e.message.includes("<script>"),
      ),
    ).toBe(true);
  });

  it("manifest 中内联 SVG 含 onload= 事件属性应 warning 不阻断", () => {
    const maliciousSvg =
      "data:image/svg+xml;utf8," +
      encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"><rect/></svg>',
      );
    const manifest = makeValidManifest();
    manifest.assets = { images: [{ key: "logo", src: maliciousSvg }] };
    const result = validateThemePackageManifest(manifest);
    expect(result.ok).toBe(true);
    const warnings = result.ok ? (result.errors ?? []) : [];
    expect(
      warnings.some(
        (e) =>
          e.severity === "warning" &&
          (e.message.includes("onload/onclick") ||
            e.message.includes("事件属性")),
      ),
    ).toBe(true);
  });

  it("manifest 中内联伪位图 SVG（嵌 base64 位图）应给 warning", () => {
    const fakeBitmapSvg =
      "data:image/svg+xml;utf8," +
      encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg"><image href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="/></svg>',
      );
    const manifest = makeValidManifest();
    manifest.assets = { images: [{ key: "pseudo-svg", src: fakeBitmapSvg }] };
    const result = validateThemePackageManifest(manifest);
    // warning 不阻断 ok=true，只会在 errors/warnings 列表里带出来
    expect(result.ok).toBe(true);
    const warnings = result.ok ? (result.errors ?? []) : [];
    expect(
      warnings.some(
        (e) =>
          e.severity === "warning" &&
          (e.message.includes("<image>") || e.message.includes("嵌入位图")),
      ),
    ).toBe(true);
  });

  it("manifest 中内联正常纯矢量 SVG 应通过且无错误", () => {
    const cleanSvg =
      "data:image/svg+xml;utf8," +
      encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 2L2 22h20L12 2z" fill="#07c160"/></svg>',
      );
    const manifest = makeValidManifest();
    manifest.assets = { images: [{ key: "logo", src: cleanSvg }] };
    const result = validateThemePackageManifest(manifest);
    expect(result.ok).toBe(true);
    if (result.ok) {
      const assetErrors = (result.errors ?? []).filter((e) =>
        e.path.startsWith("/assets/images/0"),
      );
      expect(assetErrors.length).toBe(0);
    }
  });

  // ---------- 校验点 9: 未知字段 ----------

  it("未知顶层字段应报错", () => {
    const manifest = makeValidManifest();
    const raw = {
      ...manifest,
      unknownField: "oops",
    } as unknown as ThemePackageManifest;
    const result = validateThemePackageManifest(raw);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.some((e) => e.path === "/unknownField")).toBe(true);
    }
  });

  // ---------- 边界场景 ----------

  it("components 为 undefined 应通过（可选字段）", () => {
    const manifest = makeValidManifest();
    // components 不设置
    const result = validateThemePackageManifest(manifest);
    expect(result.ok).toBe(true);
  });

  it("assets 为 undefined 应通过（可选字段）", () => {
    const manifest = makeValidManifest();
    // assets 不设置
    const result = validateThemePackageManifest(manifest);
    expect(result.ok).toBe(true);
  });

  it("variant 为空字符串且无 variantCss 应通过（无 variant 声明）", () => {
    const manifest = makeValidManifest();
    manifest.components = {
      "share-card": {
        enabled: true,
        variant: "",
      },
    };
    const result = validateThemePackageManifest(manifest);
    expect(result.ok).toBe(true);
  });

  it("codeTheme 合法值应通过", () => {
    const manifest = makeValidManifest();
    manifest.codeTheme = "github-dark";
    const result = validateThemePackageManifest(manifest);
    expect(result.ok).toBe(true);
  });

  it("variantCss 选择器含 .wemd- 前缀但格式不完整应报错", () => {
    // 只有 .wemd-xxx 但没有 [data-variant="yyy"]
    const manifest = makeValidManifest();
    manifest.components = {
      "share-card": {
        enabled: true,
        variant: "bad",
        variantCss: ".wemd-share-card { color: red; }",
      },
    };
    const result = validateThemePackageManifest(manifest);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.some((e) => e.message.includes(".wemd-"))).toBe(
        true,
      );
    }
  });

  it("多个错误应全部收集", () => {
    const manifest = makeValidManifest();
    manifest.sdkVersion = "9.9.9";
    manifest.meta.id = "";
    manifest.tokens.color.primary = "bad-color";
    manifest.layout.density = "ultra" as any;
    manifest.layout.tone = [];
    const result = validateThemePackageManifest(manifest);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      // 至少收集了 5 个错误
      expect(result.errors.length).toBeGreaterThanOrEqual(5);
    }
  });
});
