/**
 * 完整导入流程测试 —— 验证从 manifest → CSS 渲染 → HTML 注入的完整数据流
 */
import { describe, expect, it } from "vitest";
import { renderTheme } from "../theme-renderer/index";
import type {
  ThemePackageManifest,
  ComponentStyleOverride,
} from "../theme-schema/types";

// 模拟完整的 AI 生成主题 manifest（包含所有 30+ 组件的 variantCss）
const mockManifest: ThemePackageManifest = {
  sdkVersion: "1.0.0",
  meta: {
    id: "full-test-theme",
    name: "完整测试主题",
    description: "测试用",
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
      variantCss: `/* hero-banner - 完整测试主题 */
#wemd .wemd-hero-banner[data-variant="hero-banner-default"] {
  background: linear-gradient(135deg, var(--wemd-primary) 0%, var(--wemd-primary-dark) 100%);
  border-radius: 16px;
  padding: 60px 40px;
  min-height: 360px;
  box-shadow: 0 8px 32px var(--wemd-shadow);
  text-align: center;
}
#wemd .wemd-hero-banner[data-variant="hero-banner-default"] .wemd-hero-title {
  font-size: 36px;
  font-weight: 800;
  color: var(--wemd-bg-card);
  margin-bottom: 16px;
  text-shadow: 0 2px 4px var(--wemd-shadow);
}`,
    },
    "end-card": {
      enabled: true,
      variant: "end-card-default",
      variantCss: `/* end-card - 完整测试主题 */
#wemd .wemd-end-card[data-variant="end-card-default"] {
  background: var(--wemd-bg-soft);
  border-top: 3px solid var(--wemd-primary);
  padding: 32px;
  text-align: center;
}
#wemd .wemd-end-card[data-variant="end-card-default"] .wemd-end-title {
  color: var(--wemd-primary-dark);
  font-size: 20px;
  font-weight: 600;
}`,
    },
    "magazine-cover": {
      enabled: true,
      variant: "magazine-cover-default",
      variantCss: `/* magazine-cover - 完整测试主题 */
#wemd .wemd-magazine-cover[data-variant="magazine-cover-default"] {
  background: linear-gradient(180deg, var(--wemd-bg-soft) 0%, var(--wemd-primary-light) 100%);
  border: 2px solid var(--wemd-primary);
  border-radius: 16px;
  padding: 40px;
  text-align: center;
}
#wemd .wemd-magazine-cover[data-variant="magazine-cover-default"] .wemd-cover-title {
  font-family: "Noto Serif SC", serif;
  font-size: 28px;
  color: var(--wemd-primary-dark);
  margin-bottom: 12px;
}`,
    },
  },
};

describe("完整导入流程 - CSS 渲染验证", () => {
  const css = renderTheme(mockManifest);

  it("生成的 CSS 包含 AI 自定义 hero-banner 样式", () => {
    expect(css).toContain("hero-banner - 完整测试主题");
    expect(css).toContain("padding: 60px 40px");
    expect(css).toContain("min-height: 360px");
    expect(css).toContain("box-shadow: 0 8px 32px");
  });

  it("生成的 CSS 不包含内置 hero-banner 变体（center/left/minimal）", () => {
    // AI 定义了 variantCss，所以不应注入内置变体
    expect(css).not.toContain('wemd-hero-banner[data-variant="center"]');
    expect(css).not.toContain('wemd-hero-banner[data-variant="left"]');
    expect(css).not.toContain('wemd-hero-banner[data-variant="minimal"]');
  });

  it("生成的 CSS 包含默认组件样式（基础布局）", () => {
    // 默认组件样式（injectComponentStyles）应该始终注入
    // 这些是组件的基础布局，AI variantCss 在此基础上覆盖
    expect(css).toContain("#wemd .wemd-component");
  });

  it("AI variantCss 在默认组件样式之后（CSS 层叠顺序正确）", () => {
    const defaultIdx = css.indexOf("#wemd .wemd-component");
    const variantIdx = css.indexOf("hero-banner - 完整测试主题");
    // AI variantCss 应该在默认样式之后
    // 这样即使选择器特异性相同，AI 样式也能覆盖默认样式
    expect(variantIdx).toBeGreaterThan(defaultIdx);
  });

  it("生成的 CSS 包含所有三个组件的 AI 样式", () => {
    expect(css).toContain("hero-banner - 完整测试主题");
    expect(css).toContain("end-card - 完整测试主题");
    expect(css).toContain("magazine-cover - 完整测试主题");
  });
});

describe("完整导入流程 - HTML 注入验证", () => {
  // 模拟 markdown-it-component 的 HTML 输出
  const mockHtml = `<section id="wemd">
<section class="wemd-component wemd-hero-banner" data-component="hero-banner" data-props="{}">
  <section class="wemd-hb-title">测试内容</section>
</section>
<section class="wemd-component wemd-end-card" data-component="end-card" data-props="{}">
  <section class="wemd-component-body">
    <p>结束内容</p>
  </section>
</section>
<section class="wemd-component wemd-magazine-cover" data-component="magazine-cover" data-props="{}">
  <p>封面内容</p>
</section>
</section>`;

  // 模拟 injectComponentVariants 逻辑
  function injectVariants(
    html: string,
    components?: Record<string, ComponentStyleOverride>,
  ): string {
    if (!components) return html;
    let result = html;
    for (const [compType, override] of Object.entries(components)) {
      if (!override.enabled || !override.variant) continue;
      const tagName = `wemd-${compType}`;
      const regex = new RegExp(
        `(<[a-zA-Z][^>]*?\\b${tagName}\\b[^>]*?)(\\s*/?\\s*>)`,
        "g",
      );
      result = result.replace(regex, `$1 data-variant="${override.variant}"$2`);
    }
    return result;
  }

  it("所有组件都被注入 data-variant 属性", () => {
    const result = injectVariants(mockHtml, mockManifest.components);
    expect(result).toContain('data-variant="hero-banner-default"');
    expect(result).toContain('data-variant="end-card-default"');
    expect(result).toContain('data-variant="magazine-cover-default"');
  });

  it("注入后 HTML 结构不变", () => {
    const result = injectVariants(mockHtml, mockManifest.components);
    // 原始结构应该保留
    expect(result).toContain('class="wemd-component wemd-hero-banner"');
    expect(result).toContain('class="wemd-component-body"');
    expect(result).toContain("测试内容");
    expect(result).toContain("结束内容");
    expect(result).toContain("封面内容");
  });

  it("data-variant 在 data-props 之后（正确位置）", () => {
    const result = injectVariants(mockHtml, mockManifest.components);
    // 对每个组件，data-variant 应该在 data-props 之后
    const heroBannerTag =
      result.match(/<section[^>]*wemd-hero-banner[^>]*>/)?.[0] || "";
    expect(heroBannerTag.indexOf('data-props="{}"')).toBeLessThan(
      heroBannerTag.indexOf('data-variant="hero-banner-default"'),
    );
  });
});

describe("导入主题 vs 内置主题 - 差异验证", () => {
  it("导入主题的 CSS 包含 AI 自定义样式，内置主题不包含", () => {
    const importedCss = renderTheme(mockManifest);

    // 内置主题（无 components 字段）的 CSS
    const builtInManifest: ThemePackageManifest = {
      ...mockManifest,
      components: undefined,
    };
    const builtInCss = renderTheme(builtInManifest);

    // 导入主题应该包含 AI 样式
    expect(importedCss).toContain("hero-banner - 完整测试主题");
    // 内置主题不应该包含 AI 样式
    expect(builtInCss).not.toContain("hero-banner - 完整测试主题");

    // 内置主题应该包含所有内置变体
    expect(builtInCss).toContain('wemd-hero-banner[data-variant="center"]');
    // 导入主题不应该包含内置变体（因为 AI 定义了 variantCss）
    expect(importedCss).not.toContain(
      'wemd-hero-banner[data-variant="center"]',
    );
  });
});
