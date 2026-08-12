/**
 * 序列化测试 —— 验证 ThemeDefinition 通过 JSON.stringify/JSON.parse 后组件数据不丢失
 */
import { describe, expect, it } from "vitest";
import { renderTheme } from "../theme-renderer/index";
import type { ThemePackageManifest } from "../theme-schema/types";

const mockManifest: ThemePackageManifest = {
  sdkVersion: "1.0.0",
  meta: {
    id: "serial-test",
    name: "序列化测试",
    description: "测试",
    keywords: ["测试"],
    version: "1.0.0",
  },
  tokens: {
    color: {
      primary: "#FF6B6B",
      primaryDark: "#C0392B",
      primaryLight: "#FFE0E0",
      secondary: "#F39C12",
      accent: "#9B59B6",
      background: "#FFFFFF",
      bgSoft: "#FFF5F5",
      bgCard: "#FFFFFF",
      bgMuted: "#FFE0E0",
      textStrong: "#2C3E50",
      textNormal: "#34495E",
      textSoft: "#95A5A6",
      border: "#FFE0E0",
      borderSoft: "#FFF5F5",
    },
    typography: {
      fontFamily: "-apple-system, sans-serif",
      fontSize: "16px",
      lineHeight: "1.75",
      letterSpacing: 0,
      heading: {
        h1: {
          fontSize: 28,
          color: "#2C3E50",
          marginTop: 24,
          marginBottom: 16,
          fontWeight: "700",
        },
        h2: {
          fontSize: 22,
          color: "#2C3E50",
          marginTop: 20,
          marginBottom: 12,
          fontWeight: "600",
        },
        h3: {
          fontSize: 18,
          color: "#333333",
          marginTop: 16,
          marginBottom: 10,
          fontWeight: "600",
        },
        h4: {
          fontSize: 16,
          color: "#333333",
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
    preferredComponents: [],
    density: "medium",
    tone: ["warm"],
  },
  components: {
    "hero-banner": {
      enabled: true,
      variant: "hero-banner-default",
      variantCss:
        '/* hero-banner */ #wemd .wemd-hero-banner[data-variant="hero-banner-default"] { padding: 60px; }',
    },
    "end-card": {
      enabled: true,
      variant: "end-card-default",
      variantCss:
        '/* end-card */ #wemd .wemd-end-card[data-variant="end-card-default"] { padding: 32px; }',
    },
  },
};

describe("序列化测试 - JSON.stringify → JSON.parse 后组件数据不丢失", () => {
  it("components 字段在序列化后保留", () => {
    const serialized = JSON.stringify(mockManifest);
    const deserialized = JSON.parse(serialized) as ThemePackageManifest;

    expect(deserialized.components).toBeDefined();
    expect(Object.keys(deserialized.components!)).toEqual([
      "hero-banner",
      "end-card",
    ]);
  });

  it("variantCss 内容在序列化后保留", () => {
    const serialized = JSON.stringify(mockManifest);
    const deserialized = JSON.parse(serialized) as ThemePackageManifest;

    expect(deserialized.components!["hero-banner"].variantCss).toContain(
      "padding: 60px",
    );
    expect(deserialized.components!["end-card"].variantCss).toContain(
      "padding: 32px",
    );
  });

  it("序列化前后 renderTheme 输出一致", () => {
    const originalCss = renderTheme(mockManifest);

    const serialized = JSON.stringify(mockManifest);
    const deserialized = JSON.parse(serialized) as ThemePackageManifest;
    const deserializedCss = renderTheme(deserialized);

    expect(deserializedCss).toBe(originalCss);
  });

  it("模拟 CustomTheme 结构的完整序列化（含 extra 字段）", () => {
    // 模拟 CustomTheme 保存到 localStorage 的场景
    const customTheme = {
      id: "custom-test-123",
      name: "测试主题",
      css: renderTheme(mockManifest),
      isBuiltIn: false,
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z",
      editorMode: "css" as const,
      definition: mockManifest,
      readOnly: true,
      sdkVersion: "1.0.0",
    };

    const serialized = JSON.stringify(customTheme);
    const deserialized = JSON.parse(serialized);

    // 验证 definition 在序列化后保留
    expect(deserialized.definition).toBeDefined();
    expect(deserialized.definition.components).toBeDefined();
    expect(Object.keys(deserialized.definition.components)).toEqual([
      "hero-banner",
      "end-card",
    ]);
    expect(
      deserialized.definition.components["hero-banner"].variantCss,
    ).toContain("padding: 60px");

    // 验证 renderTheme 仍然能正确解析
    const css = renderTheme(deserialized.definition);
    expect(css).toContain("padding: 60px");
    expect(css).toContain("padding: 32px");
  });
});
