/**
 * ThemeRenderer 验证测试
 *
 * 验证 renderTheme(ThemeDefinition) 生成的 CSS：
 * 1. 12 套内置主题全部正确渲染
 * 2. CSS 语法完整性
 * 3. 关键选择器和变量存在
 */
import { describe, expect, it } from "vitest";
import { renderTheme } from "../theme-renderer/index";
import { builtInThemeDefinitions } from "../builtin-themes/index";

// ============================================================
// 12 套主题全部渲染
// ============================================================

describe("ThemeRenderer - 12 套内置主题", () => {
  for (const theme of builtInThemeDefinitions) {
    describe(theme.meta.name, () => {
      const css = renderTheme(theme);

      it("生成非空 CSS", () => {
        expect(css.length).toBeGreaterThan(1000);
      });

      it("所有大括号平衡", () => {
        const opens = (css.match(/\{/g) || []).length;
        const closes = (css.match(/\}/g) || []).length;
        expect(opens).toBe(closes);
      });

      it("包含 CSS 变量块", () => {
        expect(css).toContain("--wemd-primary:");
        expect(css).toContain("--wemd-primary-dark:");
        expect(css).toContain("--wemd-text-strong:");
      });

      it("色值与定义一致", () => {
        expect(css).toContain(theme.tokens.color.primary);
        expect(css).toContain(theme.tokens.color.primaryDark);
      });

      it("包含排版样式", () => {
        expect(css).toContain("#wemd p");
        expect(css).toContain("#wemd h1");
        expect(css).toContain("#wemd h2");
      });

      it("包含组件默认样式", () => {
        expect(css).toContain("#wemd .wemd-component");
        expect(css).toContain("#wemd .wemd-quote-card");
      });

      it("不包含 background-color on #wemd 块（微信兼容）", () => {
        const wemdBlocks = css.match(/#wemd\s*\{([^}]*)\}/g);
        if (wemdBlocks) {
          for (const block of wemdBlocks) {
            expect(block).not.toMatch(/background-color\s*:/);
          }
        }
      });
    });
  }
});

// ============================================================
// 特定主题专项测试
// ============================================================

describe("默认主题", () => {
  const theme = builtInThemeDefinitions.find((t) => t.meta.id === "default")!;
  const css = renderTheme(theme);

  it("H1 bottom-border 预设生效", () => {
    expect(css).toContain("#wemd h1 { border-bottom: 2px solid #1a1a1a");
  });

  it("H2 left-border 预设生效", () => {
    expect(css).toContain("#wemd h2 { border-left: 4px solid #2c3e50");
  });
});

describe("数据蓝图", () => {
  const theme = builtInThemeDefinitions.find(
    (t) => t.meta.id === "data-blueprint",
  )!;
  const css = renderTheme(theme);

  it("codeTheme github-dark 生效", () => {
    expect(css).toContain("#0d1117");
  });
});

describe("黑金奢华", () => {
  const theme = builtInThemeDefinitions.find(
    (t) => t.meta.id === "luxury-gold",
  )!;
  const css = renderTheme(theme);

  it("H1 double-line 预设生效", () => {
    expect(css).toContain("border-top: 2px solid #d4af37");
  });
});

describe("购物小票", () => {
  const theme = builtInThemeDefinitions.find((t) => t.meta.id === "receipt")!;
  const css = renderTheme(theme);

  it("等宽字体生效", () => {
    expect(css).toContain("Courier New");
  });
});

// ============================================================
// ThemeDefinition 结构校验
// ============================================================

describe("ThemeDefinition 结构", () => {
  it("12 套主题 ID 不重复", () => {
    const ids = builtInThemeDefinitions.map((t) => t.meta.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("每套主题的 layout.preferredComponents 有效", () => {
    for (const theme of builtInThemeDefinitions) {
      expect(theme.layout.preferredComponents.length).toBeGreaterThan(0);
    }
  });

  it("每套主题的 components 覆盖 30 个组件", () => {
    for (const theme of builtInThemeDefinitions) {
      expect(Object.keys(theme.components).length).toBe(30);
    }
  });
});
