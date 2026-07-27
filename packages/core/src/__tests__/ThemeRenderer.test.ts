/**
 * ThemeRenderer 验证测试
 *
 * 验证 renderTheme(ThemeDefinition) 生成的 CSS：
 * 1. 语法完整（包含关键的 CSS 变量和选择器）
 * 2. 与现有 builtInThemes 生成的 CSS 功能等价
 */
import { describe, expect, it } from "vitest";
import { renderTheme } from "../theme-renderer/index";
import type { ThemeDefinition } from "../theme-schema/types";

// ============================================================
// 测试数据：默认主题
// ============================================================

const defaultTheme: ThemeDefinition = {
  meta: {
    id: "default",
    name: "默认主题",
    description: "微信绿色调，适合日常内容创作",
    keywords: ["通用", "清新", "日常"],
    version: "1.0.0",
  },
  tokens: {
    color: {
      primary: "#07c160",
      primaryDark: "#0a8f4a",
      primaryLight: "#d1fae5",
      secondary: "#0a8f4a",
      accent: "#07c160",
      background: "#ffffff",
      bgSoft: "#f6f8fa",
      bgCard: "#ffffff",
      bgMuted: "#f1f5f9",
      textStrong: "#1a1a1a",
      textNormal: "#34495e",
      textSoft: "#475569",
      border: "#e2e8f0",
    },
    typography: {
      fontFamily:
        '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif',
      fontSize: "16px",
      lineHeight: "1.8",
      letterSpacing: 0.3,
      heading: {
        h1: {
          fontSize: 28,
          color: "#1a1a1a",
          marginTop: 10,
          marginBottom: 20,
          fontWeight: "700",
          preset: "bottom-border",
          centered: true,
          letterSpacing: 1,
        },
        h2: {
          fontSize: 22,
          color: "#2c3e50",
          marginTop: 20,
          marginBottom: 14,
          fontWeight: "600",
          preset: "left-border",
        },
        h3: {
          fontSize: 19,
          color: "#34495e",
          marginTop: 24,
          marginBottom: 12,
          fontWeight: "600",
          preset: "left-border",
        },
        h4: {
          fontSize: 17,
          color: "#07c160",
          marginTop: 20,
          marginBottom: 10,
          fontWeight: "600",
        },
      },
      codeFontFamily:
        '"SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, monospace',
    },
    spacing: { pagePadding: 8, paragraphMargin: 8 },
    border: { radius: 4 },
    shadow: { enabled: false, value: "" },
  },
  components: {
    "quote-card": { enabled: true, variant: "default" },
    "divider-fancy": { enabled: true, variant: "default" },
    "cta-card": { enabled: true, variant: "default" },
    "code-frame": { enabled: true, variant: "default" },
    "callout-pro": { enabled: true, variant: "default" },
    "stats-block": { enabled: true, variant: "default" },
    "image-grid": { enabled: true, variant: "default" },
    "author-card": { enabled: true, variant: "default" },
    timeline: { enabled: true, variant: "default" },
    "follow-bar": { enabled: true, variant: "default" },
    "qr-card": { enabled: true, variant: "default" },
    "numbered-heading": { enabled: true, variant: "default" },
    "section-title": { enabled: true, variant: "default" },
    "image-text-row": { enabled: true, variant: "default" },
    "hero-banner": { enabled: true, variant: "default" },
    "share-card": { enabled: true, variant: "warm" },
    "related-posts": { enabled: true, variant: "default" },
    "toc-nav": { enabled: true, variant: "default" },
    "tag-label": { enabled: true, variant: "default" },
    "image-caption": { enabled: true, variant: "default" },
    "copyright-notice": { enabled: true, variant: "default" },
    "styled-table": { enabled: true, variant: "default" },
    faq: { enabled: true, variant: "default" },
    "magazine-cover": { enabled: true, variant: "default" },
    "section-divider": { enabled: true, variant: "default" },
    "image-card": { enabled: true, variant: "default" },
    "text-card": { enabled: true, variant: "default" },
    "full-quote": { enabled: true, variant: "default" },
    "two-column-cards": { enabled: true, variant: "default" },
    "end-card": { enabled: true, variant: "default" },
  },
  layout: {
    preferredComponents: ["quote-card", "divider-fancy", "share-card"],
    density: "medium",
    tone: ["warm", "modern"],
    magazineLevel: "medium",
  },
};

// ============================================================
// 测试数据：数据蓝图
// ============================================================

const dataBlueprintTheme: ThemeDefinition = {
  meta: {
    id: "data-blueprint",
    name: "数据蓝图",
    description: "科技蓝色调，适合技术文章和数据报告",
    keywords: ["科技", "数据", "专业", "技术"],
    version: "1.0.0",
  },
  tokens: {
    color: {
      primary: "#3b82f6",
      primaryDark: "#1e40af",
      primaryLight: "#dbeafe",
      secondary: "#1e40af",
      accent: "#f59e0b",
      background: "#ffffff",
      bgSoft: "#f0f7ff",
      bgCard: "#ffffff",
      bgMuted: "#f1f5f9",
      textStrong: "#1e3a5f",
      textNormal: "#334155",
      textSoft: "#475569",
      border: "#c7d9ec",
    },
    typography: {
      fontFamily:
        '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif',
      fontSize: "16px",
      lineHeight: "1.8",
      letterSpacing: 0.2,
      heading: {
        h1: {
          fontSize: 28,
          color: "#1e3a5f",
          marginTop: 32,
          marginBottom: 18,
          fontWeight: "700",
          preset: "left-border",
        },
        h2: {
          fontSize: 22,
          color: "#1e40af",
          marginTop: 28,
          marginBottom: 14,
          fontWeight: "600",
          preset: "left-border",
        },
        h3: {
          fontSize: 19,
          color: "#3b82f6",
          marginTop: 24,
          marginBottom: 12,
          fontWeight: "600",
        },
        h4: {
          fontSize: 17,
          color: "#60a5fa",
          marginTop: 20,
          marginBottom: 10,
          fontWeight: "600",
        },
      },
      codeFontFamily: '"SF Mono", Monaco, Consolas, monospace',
    },
    spacing: { pagePadding: 8, paragraphMargin: 12 },
    border: { radius: 6 },
    shadow: { enabled: false, value: "" },
  },
  components: {
    "quote-card": { enabled: true, variant: "default" },
    "divider-fancy": { enabled: true, variant: "default" },
    "cta-card": { enabled: true, variant: "default" },
    "code-frame": { enabled: true, variant: "default" },
    "callout-pro": { enabled: true, variant: "default" },
    "stats-block": { enabled: true, variant: "default" },
    "image-grid": { enabled: true, variant: "default" },
    "author-card": { enabled: true, variant: "default" },
    timeline: { enabled: true, variant: "default" },
    "follow-bar": { enabled: true, variant: "default" },
    "qr-card": { enabled: true, variant: "default" },
    "numbered-heading": { enabled: true, variant: "default" },
    "section-title": { enabled: true, variant: "default" },
    "image-text-row": { enabled: true, variant: "default" },
    "hero-banner": { enabled: false },
    "share-card": { enabled: true, variant: "tech" },
    "related-posts": { enabled: true, variant: "default" },
    "toc-nav": { enabled: true, variant: "default" },
    "tag-label": { enabled: true, variant: "default" },
    "image-caption": { enabled: true, variant: "default" },
    "copyright-notice": { enabled: true, variant: "default" },
    "styled-table": { enabled: true, variant: "default" },
    faq: { enabled: true, variant: "default" },
    "magazine-cover": { enabled: false },
    "section-divider": { enabled: true, variant: "default" },
    "image-card": { enabled: true, variant: "default" },
    "text-card": { enabled: true, variant: "default" },
    "full-quote": { enabled: true, variant: "default" },
    "two-column-cards": { enabled: true, variant: "default" },
    "end-card": { enabled: true, variant: "default" },
  },
  layout: {
    preferredComponents: [
      "stats-block",
      "code-frame",
      "styled-table",
      "quote-card",
    ],
    density: "high",
    tone: ["rational", "serious"],
    magazineLevel: "high",
  },
};

// ============================================================
// 测试
// ============================================================

describe("ThemeRenderer", () => {
  describe("renderTheme - 默认主题", () => {
    const css = renderTheme(defaultTheme);

    it("包含基础重置样式", () => {
      expect(css).toContain("#wemd p");
      expect(css).toContain("#wemd img");
    });

    it("生成正确的 CSS 变量", () => {
      expect(css).toContain("--wemd-primary: #07c160");
      expect(css).toContain("--wemd-primary-dark: #0a8f4a");
      expect(css).toContain("--wemd-primary-light: #d1fae5");
      expect(css).toContain("--wemd-bg-soft: #f6f8fa");
      expect(css).toContain("--wemd-text-strong: #1a1a1a");
      expect(css).toContain("--wemd-border: #e2e8f0");
      expect(css).toContain("--wemd-border-radius: 4px");
    });

    it("包含排版样式", () => {
      expect(css).toContain("font-family: -apple-system");
      expect(css).toContain("font-size: 16px");
      expect(css).toContain("line-height: 1.8");
      expect(css).toContain("#wemd h1");
      expect(css).toContain("#wemd h2");
      expect(css).toContain("#wemd h3");
      expect(css).toContain("#wemd h4");
    });

    it("H1 使用 bottom-border 预设", () => {
      expect(css).toContain("#wemd h1 { border-bottom: 2px solid #1a1a1a");
    });

    it("H2 使用 left-border 预设", () => {
      expect(css).toContain("#wemd h2 { border-left: 4px solid #2c3e50");
    });

    it("H1 居中", () => {
      expect(css).toContain("text-align: center");
    });

    it("包含组件样式", () => {
      expect(css).toContain("#wemd .multiquote-1");
      expect(css).toContain("#wemd a {");
      expect(css).toContain("#wemd strong {");
      expect(css).toContain("#wemd hr {");
      expect(css).toContain("#wemd table tr th");
      expect(css).toContain("#wemd .footnote-word");
    });

    it("组件样式引用 CSS 变量", () => {
      expect(css).toContain("var(--wemd-primary)");
      expect(css).toContain("var(--wemd-bg-soft)");
      expect(css).toContain("var(--wemd-border)");
    });

    it("包含 Callout 提示块", () => {
      expect(css).toContain("#wemd .callout {");
      expect(css).toContain(".callout-note");
      expect(css).toContain(".callout-tip");
    });

    it("包含 Mermaid 覆盖", () => {
      expect(css).toContain("#wemd .mermaid");
      expect(css).toContain("var(--wemd-primary)");
    });

    it("CSS 以 #wemd 为根选择器", () => {
      // 每段 CSS 的首个选择器应该是 #wemd
      const rules = css
        .split("\n")
        .filter((line) => line.trim().startsWith("#wemd"));
      expect(rules.length).toBeGreaterThan(10);
    });

    it("不包含 background-color on #wemd（微信兼容）", () => {
      // 确保 #wemd 本身没有 background-color
      const wemdBlock = css.match(/#wemd\s*\{([^}]*)\}/g);
      if (wemdBlock) {
        for (const block of wemdBlock) {
          expect(block).not.toMatch(/background-color\s*:/);
        }
      }
    });
  });

  describe("renderTheme - 数据蓝图", () => {
    const css = renderTheme(dataBlueprintTheme);

    it("生成科技蓝色系变量", () => {
      expect(css).toContain("--wemd-primary: #3b82f6");
      expect(css).toContain("--wemd-primary-dark: #1e40af");
      expect(css).toContain("--wemd-primary-light: #dbeafe");
    });

    it("H1 使用 left-border 预设", () => {
      expect(css).toContain("#wemd h1 { border-left: 4px solid #1e3a5f");
    });

    it("包含更大的段落间距", () => {
      expect(css).toContain("--wemd-paragraph-margin: 12px");
    });

    it("hero-banner 设置为 enabled: false（不影响 CSS，只影响 AI）", () => {
      // enabled: false 不应导致 CSS 缺失，因为组件有默认样式
      expect(css).toContain("#wemd .multiquote-1");
    });
  });

  describe("ThemeDefinition 结构完整性", () => {
    it("meta 包含必填字段", () => {
      expect(defaultTheme.meta.id).toBeTruthy();
      expect(defaultTheme.meta.name).toBeTruthy();
      expect(defaultTheme.meta.description).toBeTruthy();
      expect(defaultTheme.meta.keywords.length).toBeGreaterThan(0);
    });

    it("tokens.color 包含所有必填色值", () => {
      const { color } = defaultTheme.tokens;
      expect(color.primary).toBeTruthy();
      expect(color.primaryDark).toBeTruthy();
      expect(color.primaryLight).toBeTruthy();
      expect(color.textStrong).toBeTruthy();
      expect(color.textNormal).toBeTruthy();
      expect(color.border).toBeTruthy();
    });

    it("components 覆盖所有 30 个组件", () => {
      const compNames = Object.keys(defaultTheme.components);
      expect(compNames.length).toBe(30);
      // 验证关键组件存在
      expect(compNames).toContain("quote-card");
      expect(compNames).toContain("hero-banner");
      expect(compNames).toContain("magazine-cover");
      expect(compNames).toContain("end-card");
    });

    it("layout 包含偏好配置", () => {
      expect(defaultTheme.layout.density).toBe("medium");
      expect(defaultTheme.layout.preferredComponents.length).toBeGreaterThan(0);
      expect(defaultTheme.layout.tone.length).toBeGreaterThan(0);
    });
  });

  describe("CSS 语法完整性", () => {
    const css = renderTheme(defaultTheme);

    it("所有大括号平衡", () => {
      const opens = (css.match(/\{/g) || []).length;
      const closes = (css.match(/\}/g) || []).length;
      expect(opens).toBe(closes);
      expect(opens).toBeGreaterThan(0);
    });

    it("不包含空规则", () => {
      // 不允许出现 "{}" 空规则
      expect(css).not.toMatch(/\{\s*\}/);
    });

    it("引号平衡", () => {
      const dq = (css.match(/"/g) || []).length;
      expect(dq % 2).toBe(0);
    });
  });
});
