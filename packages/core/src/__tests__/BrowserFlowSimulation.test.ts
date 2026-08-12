/**
 * 浏览器端完整数据流模拟测试
 *
 * 模拟浏览器端从主题导入 → localStorage 存储 → 加载 → CSS 渲染 → HTML 处理的完整流程，
 * 验证 AI 生成的组件样式在各个环节都能正确保留和渲染。
 */
import { describe, expect, it } from "vitest";
import { renderTheme } from "../theme-renderer/index";
import { processHtml } from "../ThemeProcessor";
import type {
  ThemePackageManifest,
  ComponentStyleOverride,
  ThemeDefinition,
} from "../theme-schema/types";

// ============================================================
// 模拟数据
// ============================================================

/** 从 manifest.json 提取的 AI 生成主题定义 */
const mockAIManifest: ThemePackageManifest = {
  sdkVersion: "1.0.0",
  meta: {
    id: "编译测试",
    name: "编译测试",
    description: "由 WeMD Design Pipeline 自动生成",
    keywords: ["温暖", "活力", "创意"],
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
      fontFamily: "-apple-system, 'PingFang SC', sans-serif",
      fontSize: "16px",
      lineHeight: "1.8",
      letterSpacing: 0.2,
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
          fontWeight: "700",
        },
        h3: {
          fontSize: 18,
          color: "#2C3E50",
          marginTop: 16,
          marginBottom: 10,
          fontWeight: "700",
        },
        h4: {
          fontSize: 16,
          color: "#2C3E50",
          marginTop: 14,
          marginBottom: 8,
          fontWeight: "700",
        },
      },
      codeFontFamily: "'JetBrains Mono', 'SF Mono', Consolas, monospace",
    },
    spacing: { pagePadding: 20, paragraphMargin: 14 },
    border: { radius: 12 },
    shadow: { enabled: true, value: "0 2px 8px rgba(0,0,0,0.08)" },
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
      variantCss: `/* hero-banner - 温暖主题 */
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
      variantCss: `/* end-card - 温暖主题 */
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
      variantCss: `/* magazine-cover - 温暖主题 */
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

/** 模拟 markdown-it-component 输出的 HTML（含 WeMD 组件） */
const mockArticleHtml = `<section id="wemd">
<section class="wemd-component wemd-hero-banner" data-component="hero-banner" data-props="{}">
  <section class="wemd-component-body">
    <h1 class="wemd-hero-title">欢迎来到温暖主题</h1>
    <p>这是一个测试文章</p>
  </section>
</section>
<p>普通段落内容</p>
<section class="wemd-component wemd-magazine-cover" data-component="magazine-cover" data-props="{}">
  <section class="wemd-component-body">
    <h2 class="wemd-cover-title">杂志封面标题</h2>
    <p>封面描述内容</p>
  </section>
</section>
<p>中间内容</p>
<section class="wemd-component wemd-end-card" data-component="end-card" data-props="{}">
  <section class="wemd-component-body">
    <h3 class="wemd-end-title">结束标题</h3>
    <p>结束描述</p>
  </section>
</section>
</section>`;

// ============================================================
// 模拟浏览器端 injectComponentVariants 函数
// ============================================================

function injectComponentVariants(
  html: string,
  components?: Record<string, ComponentStyleOverride>,
): string {
  if (!components) return html;
  let result = html;
  let totalInjections = 0;
  for (const [compType, override] of Object.entries(components)) {
    if (!override.enabled || !override.variant) continue;
    const tagName = `wemd-${compType}`;
    const regex = new RegExp(
      `(<[a-zA-Z][^>]*?\\b${tagName}\\b[^>]*?)(\\s*/?\\s*>)`,
      "g",
    );
    const before = result;
    result = result.replace(regex, `$1 data-variant="${override.variant}"$2`);
    if (result !== before) {
      totalInjections++;
    }
  }
  return result;
}

// ============================================================
// 测试：模拟浏览器端完整流程
// ============================================================

/**
 * 模拟浏览器端流程：
 * 1. 导入主题 → renderTheme 生成 CSS → 存储为 CustomTheme
 * 2. localStorage 序列化 → 反序列化
 * 3. 加载主题 → getThemeCSS → renderTheme 重新生成 CSS
 * 4. 解析 Markdown → HTML
 * 5. injectComponentVariants → 注入 data-variant 属性
 * 6. processHtml → 处理 HTML（预览模式，inlineStyles: false）
 * 7. 检查 CSS 能否匹配 HTML
 */

describe("浏览器端完整数据流模拟", () => {
  // Step 1: 导入主题，生成 CSS（模拟 importTheme 中的 renderTheme 调用）
  const importedCss = renderTheme(mockAIManifest);

  it("Step 1: 导入主题的 CSS 包含 AI 生成的 variantCss", () => {
    expect(importedCss).toContain("hero-banner - 温暖主题");
    expect(importedCss).toContain("padding: 60px 40px");
    expect(importedCss).toContain("min-height: 360px");
    expect(importedCss).toContain("end-card - 温暖主题");
    expect(importedCss).toContain("magazine-cover - 温暖主题");
  });

  // Step 2: 模拟 localStorage 序列化/反序列化（JSON.stringify → JSON.parse）
  const serialized = JSON.stringify({
    id: "custom-编译测试",
    name: "编译测试",
    css: importedCss,
    isBuiltIn: false,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
    editorMode: "css",
    definition: mockAIManifest,
    readOnly: true,
    sdkVersion: "1.0.0",
  });

  const deserialized = JSON.parse(serialized) as {
    id: string;
    name: string;
    css: string;
    definition: ThemeDefinition;
  };

  it("Step 2: localStorage 序列化后 definition 完整保留", () => {
    expect(deserialized.definition).toBeDefined();
    expect(deserialized.definition.components).toBeDefined();
    expect(deserialized.definition.components!["hero-banner"]).toBeDefined();
    expect(
      deserialized.definition.components!["hero-banner"].variantCss,
    ).toContain("padding: 60px 40px");
  });

  // Step 3: 模拟 getThemeCSS 重新渲染 CSS
  const reloadedCss = renderTheme(deserialized.definition);

  it("Step 3: 重新加载后 CSS 与导入时一致", () => {
    expect(reloadedCss).toContain("hero-banner - 温暖主题");
    expect(reloadedCss).toContain("padding: 60px 40px");
    expect(reloadedCss).toContain("end-card - 温暖主题");
    expect(reloadedCss).toContain("magazine-cover - 温暖主题");
    // 与导入时的 CSS 一致（内容相同，顺序可能略有不同但关键内容一致）
    expect(reloadedCss).toEqual(importedCss);
  });

  // Step 4: 模拟 injectComponentVariants
  const htmlWithVariants = injectComponentVariants(
    mockArticleHtml,
    deserialized.definition.components,
  );

  it("Step 4: 注入 data-variant 属性", () => {
    expect(htmlWithVariants).toContain('data-variant="hero-banner-default"');
    expect(htmlWithVariants).toContain('data-variant="end-card-default"');
    expect(htmlWithVariants).toContain('data-variant="magazine-cover-default"');
  });

  // Step 5: 模拟 processHtml（预览模式，inlineStyles: false）
  const processedHtml = processHtml(htmlWithVariants, reloadedCss, false);

  it("Step 5: processHtml 后 data-variant 属性仍然保留", () => {
    expect(processedHtml).toContain('data-variant="hero-banner-default"');
    expect(processedHtml).toContain('data-variant="end-card-default"');
    expect(processedHtml).toContain('data-variant="magazine-cover-default"');
  });

  it("Step 5: processHtml 后 HTML 结构完整", () => {
    expect(processedHtml).toContain('class="wemd-component wemd-hero-banner"');
    expect(processedHtml).toContain('class="wemd-component-body"');
    expect(processedHtml).toContain("欢迎来到温暖主题");
    expect(processedHtml).toContain("结束标题");
    expect(processedHtml).toContain("杂志封面标题");
  });

  it("Step 5: processHtml 被包裹在 #wemd section 中", () => {
    expect(processedHtml).toMatch(/^<section id="wemd">/);
    expect(processedHtml).toMatch(/<\/section>$/);
  });

  // Step 6: 最终验证 - CSS 选择器能匹配 HTML 中的元素
  it("Step 6: CSS 选择器与 HTML 元素匹配", () => {
    // CSS 中使用的选择器
    const cssSelectors = [
      '#wemd .wemd-hero-banner[data-variant="hero-banner-default"]',
      '#wemd .wemd-end-card[data-variant="end-card-default"]',
      '#wemd .wemd-magazine-cover[data-variant="magazine-cover-default"]',
    ];

    for (const selector of cssSelectors) {
      // CSS 中包含该选择器
      expect(reloadedCss).toContain(selector);
      // HTML 中包含对应的元素
      // 将 CSS 选择器转为 HTML 属性检查
      const attrMatch = selector.match(/\[data-variant="([^"]+)"\]/);
      if (attrMatch) {
        expect(processedHtml).toContain(`data-variant="${attrMatch[1]}"`);
      }
    }
  });

  it("Step 6: AI 自定义样式能覆盖默认组件样式", () => {
    const defaultStyleIdx = reloadedCss.indexOf("#wemd .wemd-component");
    const aiStyleIdx = reloadedCss.indexOf("hero-banner - 温暖主题");
    // AI 样式在默认样式之后（CSS 层叠正确）
    expect(aiStyleIdx).toBeGreaterThan(defaultStyleIdx);
  });
});

// ============================================================
// 测试：对比导入主题与内置主题的 CSS 差异
// ============================================================

describe("导入主题 vs 内置主题 CSS 差异", () => {
  it("导入主题包含 AI 自定义样式，内置主题不包含", () => {
    const importedCss = renderTheme(mockAIManifest);

    // 创建无 components 的内置主题
    const builtInManifest: ThemePackageManifest = {
      ...mockAIManifest,
      components: undefined,
    };
    const builtInCss = renderTheme(builtInManifest);

    // 导入主题有 AI 样式
    expect(importedCss).toContain("hero-banner - 温暖主题");
    // 内置主题没有 AI 样式
    expect(builtInCss).not.toContain("hero-banner - 温暖主题");

    // 导入主题的 hero-banner 有 AI 自定义的 padding: 60px
    expect(importedCss).toContain("padding: 60px 40px");
    // 内置主题的 hero-banner 没有 AI 自定义的 padding
    expect(builtInCss).not.toContain("padding: 60px 40px");
  });

  it("导入主题的 CSS 与内置主题的 CSS 明显不同", () => {
    const importedCss = renderTheme(mockAIManifest);

    const builtInManifest: ThemePackageManifest = {
      ...mockAIManifest,
      components: undefined,
    };
    const builtInCss = renderTheme(builtInManifest);

    // 两个 CSS 应该不同
    expect(importedCss).not.toBe(builtInCss);
    // 导入主题包含 AI variantCss，内置主题不包含（已在上一个测试验证）
    // 注意：builtInCss 的 injectVariantCss 会回退注入所有内置变体 CSS，
    // 其长度可能超过导入主题的特定 AI variantCss，因此不比较长度
  });
});
