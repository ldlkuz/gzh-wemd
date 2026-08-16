/**
 * CssTranslator 测试 —— 验证两阶段 CSS 翻译系统
 *
 * 测试范围：
 * 1. 组件元素描述表完整性和正确性
 * 2. Phase 1 描述生成
 * 3. Phase 2 翻译 Prompt 生成
 * 4. CSS 后处理
 * 5. 使用 mock AI 的完整翻译流程
 * 6. 与现有 renderTheme 管线的集成
 */

import { describe, expect, it, vi } from "vitest";
import {
  ALL_COMPONENT_ELEMENTS,
  describeElementsForPhase1,
  describeMappingForPhase2,
} from "../css-translator/componentElements";
import {
  translateComponentCss,
  translateThemeFreeCss,
  type AiAdapter,
} from "../css-translator/CssTranslator";
import { renderTheme } from "../theme-renderer/index";
import type { ThemePackageManifest } from "../theme-schema/types";

// ============================================================
// 1. 组件元素描述表完整性验证
// ============================================================

describe("组件元素描述表", () => {
  it("包含所有杂志级组件", () => {
    const magazineTypes = [
      "magazine-cover",
      "section-divider",
      "two-column-cards",
      "full-quote",
      "image-card",
      "end-card",
      "product-card",
      "brand-sign",
      "resource-list",
      "testimonial-card",
      "series-nav",
    ];

    for (const type of magazineTypes) {
      expect(ALL_COMPONENT_ELEMENTS[type]).toBeDefined();
      expect(ALL_COMPONENT_ELEMENTS[type].hasBody).toBe(false);
    }
  });

  it("包含所有普通组件", () => {
    const normalTypes = [
      "quote-card",
      "hero-banner",
      "cta-card",
      "callout-pro",
      "share-card",
      "faq",
      "timeline",
      "author-card",
      "stats-block",
      "image-text-row",
      "numbered-heading",
      "section-title",
      "image-grid",
      "related-posts",
      "toc-nav",
      "tag-label",
      "image-caption",
      "copyright-notice",
      "styled-table",
      "code-frame",
      "divider-fancy",
      "follow-bar",
      "qr-card",
    ];

    for (const type of normalTypes) {
      expect(ALL_COMPONENT_ELEMENTS[type]).toBeDefined();
    }
  });

  it("普通组件按是否有 body 层区分 hasBody 标志", () => {
    // body 层组件：渲染仍走 .wemd-component-body 内容层
    const bodyBased = [
      "hero-banner",
      "callout-pro",
      "share-card",
      "faq",
      "author-card",
      "image-text-row",
      "numbered-heading",
      "section-title",
      "image-grid",
      "toc-nav",
      "tag-label",
      "image-caption",
      "copyright-notice",
      "follow-bar",
      "qr-card",
    ];
    for (const type of bodyBased) {
      expect(ALL_COMPONENT_ELEMENTS[type].hasBody).toBe(true);
    }
    // 语义槽组件：已迁移为语义类名，无 body 层
    const semanticSlotted = [
      "quote-card",
      "cta-card",
      "timeline",
      "stats-block",
      "related-posts",
      "styled-table",
      "code-frame",
      "divider-fancy",
    ];
    for (const type of semanticSlotted) {
      expect(ALL_COMPONENT_ELEMENTS[type].hasBody).toBe(false);
    }
  });

  it("每个组件至少有 container 元素", () => {
    for (const [type, def] of Object.entries(ALL_COMPONENT_ELEMENTS)) {
      const container = def.elements.find((e) => e.name === "container");
      expect(container).toBeDefined(`${type} 缺少 container 元素`);
      expect(container!.wemdSelector).toBe(`.wemd-${type}`);
    }
  });

  it("杂志级组件不包含 .wemd-component-body 选择器", () => {
    for (const [type, def] of Object.entries(ALL_COMPONENT_ELEMENTS)) {
      if (def.hasBody) continue;
      for (const el of def.elements) {
        expect(el.wemdSelector).not.toContain("wemd-component-body");
      }
    }
  });

  it("普通组件包含 .wemd-component-body 选择器", () => {
    for (const [type, def] of Object.entries(ALL_COMPONENT_ELEMENTS)) {
      if (!def.hasBody) continue;
      const bodyEl = def.elements.find((e) => e.name === "body");
      expect(bodyEl).toBeDefined(`${type} 缺少 body 元素`);
      expect(bodyEl!.wemdSelector).toContain("wemd-component-body");
    }
  });
});

// ============================================================
// 2. Phase 1 描述生成验证
// ============================================================

describe("Phase 1 描述生成", () => {
  it("describeElementsForPhase1 生成正确格式", () => {
    const desc = describeElementsForPhase1(["magazine-cover", "hero-banner"]);

    expect(desc).toContain("magazine-cover");
    expect(desc).toContain("杂志封面");
    expect(desc).toContain("title（主标题）");
    expect(desc).toContain("subtitle（英文副标题）");

    expect(desc).toContain("hero-banner");
    expect(desc).toContain("顶部头图 Banner");
    expect(desc).toContain("backgroundImage（背景图片（第一张 img））");
  });

  it("describeElementsForPhase1 不包含 container 元素", () => {
    const desc = describeElementsForPhase1(["magazine-cover"]);
    expect(desc).not.toContain("container");
  });
});

// ============================================================
// 3. 翻译 Prompt 与后处理验证
// ============================================================

describe("CSS 翻译流程", () => {
  it("translateComponentCss 使用 mock AI 返回翻译结果", async () => {
    const mockAi: AiAdapter = {
      chat: async () => {
        return `.wemd-hero-banner[data-variant="test"] {
  background: var(--wemd-primary);
  padding: 40px;
}
.wemd-hero-banner .wemd-component-body > p:first-child {
  font-size: 28px;
  color: #fff;
}`;
      },
    };

    const result = await translateComponentCss(
      {
        componentType: "hero-banner",
        freeCss: `.my-banner {
  background: var(--wemd-primary);
  padding: 40px;
}
.my-banner .banner-title {
  font-size: 28px;
  color: #fff;
}`,
      },
      mockAi,
    );

    expect(result.success).toBe(true);
    expect(result.wemdCss).toContain(".wemd-hero-banner[data-variant=");
    expect(result.wemdCss).toContain(
      ".wemd-hero-banner .wemd-component-body > p:first-child",
    );
    expect(result.wemdCss).toContain("background: var(--wemd-primary)");
    expect(result.wemdCss).toContain("font-size: 28px");
  });

  it("postProcessCss 添加 #wemd 前缀到未加前缀的选择器", async () => {
    const mockAi: AiAdapter = {
      chat: async () => {
        // 模拟 AI 返回缺少 #wemd 前缀的 CSS
        return `.wemd-magazine-cover {
  margin: 20px;
}
.wemd-mc-title {
  font-size: 32px;
}`;
      },
    };

    const result = await translateComponentCss(
      {
        componentType: "magazine-cover",
        freeCss: ".cover { margin: 20px; } .cover-title { font-size: 32px; }",
      },
      mockAi,
    );

    expect(result.success).toBe(true);
    // 后处理器应添加 #wemd 前缀
    expect(result.wemdCss).toContain("#wemd .wemd-magazine-cover");
    expect(result.wemdCss).toContain("#wemd .wemd-mc-title");
  });

  it("AI 返回空的 CSS 时仍能正确处理", async () => {
    const mockAi: AiAdapter = {
      chat: async () => "",
    };

    const result = await translateComponentCss(
      {
        componentType: "hero-banner",
        freeCss: ".nothing { color: red; }",
      },
      mockAi,
    );

    expect(result.success).toBe(true);
    expect(result.wemdCss).toBe("");
  });

  it("未知组件类型抛出错误", async () => {
    const mockAi: AiAdapter = {
      chat: async () => "",
    };

    const result = await translateComponentCss(
      {
        componentType: "non-existent-component",
        freeCss: ".test { color: red; }",
      },
      mockAi,
    );

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});

// ============================================================
// 4. 边缘情况处理
// ============================================================

describe("CSS 后处理边缘情况", () => {
  it("媒体查询中的规则被正确添加 #wemd 前缀", async () => {
    const mockAi: AiAdapter = {
      chat: async () => {
        return `@media (max-width: 600px) {
  .wemd-hero-banner {
    padding: 20px;
  }
  .wemd-hero-banner .wemd-mc-title {
    font-size: 24px;
  }
}`;
      },
    };

    const result = await translateComponentCss(
      {
        componentType: "hero-banner",
        freeCss:
          "@media (max-width: 600px) { .banner { padding: 20px; } .banner .title { font-size: 24px; } }",
      },
      mockAi,
    );

    expect(result.success).toBe(true);
    expect(result.wemdCss).toContain("#wemd .wemd-hero-banner");
    expect(result.wemdCss).toContain("#wemd .wemd-hero-banner .wemd-mc-title");
    // 媒体查询结构保留
    expect(result.wemdCss).toContain("@media (max-width: 600px)");
  });

  it("@keyframes 不被添加 #wemd 前缀", async () => {
    const mockAi: AiAdapter = {
      chat: async () => {
        return `@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
.wemd-hero-banner {
  animation: fadeIn 0.5s ease;
}`;
      },
    };

    const result = await translateComponentCss(
      {
        componentType: "hero-banner",
        freeCss:
          "@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }\n.banner { animation: fadeIn 0.5s ease; }",
      },
      mockAi,
    );

    expect(result.success).toBe(true);
    // @keyframes 内容不变
    expect(result.wemdCss).toContain("@keyframes fadeIn");
    expect(result.wemdCss).toContain("from { opacity: 0; }");
    expect(result.wemdCss).toContain("to { opacity: 1; }");
    // 普通规则仍加前缀
    expect(result.wemdCss).toContain("#wemd .wemd-hero-banner");
  });

  it("@supports 块内的规则被正确添加前缀", async () => {
    const mockAi: AiAdapter = {
      chat: async () => {
        return `@supports (display: grid) {
  .wemd-image-grid {
    display: grid;
    gap: 16px;
  }
}`;
      },
    };

    const result = await translateComponentCss(
      {
        componentType: "image-grid",
        freeCss:
          "@supports (display: grid) { .grid { display: grid; gap: 16px; } }",
      },
      mockAi,
    );

    expect(result.success).toBe(true);
    expect(result.wemdCss).toContain("#wemd .wemd-image-grid");
    expect(result.wemdCss).toContain("@supports (display: grid)");
  });

  it("@font-face 不被修改", async () => {
    const mockAi: AiAdapter = {
      chat: async () => {
        return `@font-face {
  font-family: "CustomFont";
  src: url("https://example.com/font.woff2");
}
.wemd-magazine-cover {
  font-family: "CustomFont", serif;
}`;
      },
    };

    const result = await translateComponentCss(
      {
        componentType: "magazine-cover",
        freeCss:
          "@font-face { font-family: 'CustomFont'; src: url('...'); }\n.cover { font-family: 'CustomFont', serif; }",
      },
      mockAi,
    );

    expect(result.success).toBe(true);
    expect(result.wemdCss).toContain("@font-face");
    expect(result.wemdCss).toContain('font-family: "CustomFont"');
    expect(result.wemdCss).toContain("#wemd .wemd-magazine-cover");
  });

  it("多个逗号分隔的选择器都加前缀", async () => {
    const mockAi: AiAdapter = {
      chat: async () => {
        return `.wemd-magazine-cover .wemd-mc-title,
.wemd-magazine-cover .wemd-mc-subtitle {
  text-align: center;
}`;
      },
    };

    const result = await translateComponentCss(
      {
        componentType: "magazine-cover",
        freeCss: ".cover-title, .cover-subtitle { text-align: center; }",
      },
      mockAi,
    );

    expect(result.success).toBe(true);
    // 两个选择器都应该有 #wemd 前缀
    expect(result.wemdCss).toContain(
      "#wemd .wemd-magazine-cover .wemd-mc-title",
    );
    expect(result.wemdCss).toContain(
      "#wemd .wemd-magazine-cover .wemd-mc-subtitle",
    );
  });

  it("已包含 #wemd 前缀的选择器不被重复添加", async () => {
    const mockAi: AiAdapter = {
      chat: async () => {
        return `#wemd .wemd-hero-banner {
  padding: 40px;
}`;
      },
    };

    const result = await translateComponentCss(
      {
        componentType: "hero-banner",
        freeCss: ".banner { padding: 40px; }",
      },
      mockAi,
    );

    expect(result.success).toBe(true);
    // #wemd 只出现一次
    expect(result.wemdCss).toMatch(/^#wemd \.wemd-hero-banner/);
    expect((result.wemdCss.match(/#wemd/g) || []).length).toBe(1);
  });

  it("混合内容：媒体查询 + @keyframes + 普通规则", async () => {
    const mockAi: AiAdapter = {
      chat: async () => {
        return `@keyframes slideUp {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.wemd-hero-banner {
  animation: slideUp 0.6s ease;
  padding: 60px;
}

@media (prefers-reduced-motion: reduce) {
  .wemd-hero-banner {
    animation: none;
  }
}`;
      },
    };

    const result = await translateComponentCss(
      {
        componentType: "hero-banner",
        freeCss:
          "@keyframes slideUp { ... }\n.banner { animation: slideUp 0.6s ease; padding: 60px; }\n@media (prefers-reduced-motion: reduce) { .banner { animation: none; } }",
      },
      mockAi,
    );

    expect(result.success).toBe(true);
    // @keyframes 不变
    expect(result.wemdCss).toContain("@keyframes slideUp");
    // 普通规则加前缀
    expect(result.wemdCss).toContain("#wemd .wemd-hero-banner");
    // 媒体查询内加前缀
    expect(result.wemdCss).toContain("@media (prefers-reduced-motion: reduce)");
    expect(result.wemdCss).toContain("#wemd .wemd-hero-banner");
  });
});

// ============================================================
// 5. 完整翻译管线集成测试
// ============================================================

describe("translateThemeFreeCss 集成", () => {
  it("翻译所有 variantCssFree 标记的组件", async () => {
    const mockAi: AiAdapter = {
      chat: async (messages) => {
        const userMsg = messages.find((m) => m.role === "user")?.content || "";
        if (userMsg.includes("hero-banner")) {
          return `.wemd-hero-banner[data-variant="custom"] {
  background: linear-gradient(135deg, var(--wemd-primary) 0%, var(--wemd-primary-dark) 100%);
  padding: 60px 40px;
}`;
        }
        if (userMsg.includes("end-card")) {
          return `.wemd-end-card[data-variant="custom"] {
  background: var(--wemd-bg-soft);
  border-top: 3px solid var(--wemd-primary);
  padding: 32px;
}`;
        }
        return "";
      },
    };

    const theme = {
      tokens: {
        color: {
          primary: "#FF6B6B",
          primaryDark: "#C0392B",
          bgSoft: "#FFF5F5",
        },
      },
      components: {
        "hero-banner": {
          enabled: true,
          variant: "custom",
          variantCss: `.my-banner {
  background: linear-gradient(135deg, var(--wemd-primary) 0%, var(--wemd-primary-dark) 100%);
  padding: 60px 40px;
}`,
          variantCssFree: true,
        },
        "end-card": {
          enabled: true,
          variant: "custom",
          variantCss: `.my-end {
  background: var(--wemd-bg-soft);
  border-top: 3px solid var(--wemd-primary);
  padding: 32px;
}`,
          variantCssFree: true,
        },
        // 普通 variantCss（无 free 标记）不应被翻译
        "quote-card": {
          enabled: true,
          variant: "classic",
          variantCss: `.wemd-quote-card[data-variant="classic"] {
  border-left: 4px solid var(--wemd-primary);
}`,
        },
      },
    };

    const result = await translateThemeFreeCss(theme as any, mockAi);

    expect(result.modified).toBe(true);
    expect(result.componentCount).toBe(2);
    expect(result.errors).toHaveLength(0);

    // 验证 hero-banner 的 CSS 已被翻译
    const heroBanner = theme.components["hero-banner"];
    expect(heroBanner.variantCssFree).toBeUndefined();
    expect(heroBanner.variantCss).toContain(".wemd-hero-banner");

    // 验证 end-card 的 CSS 已被翻译
    const endCard = theme.components["end-card"];
    expect(endCard.variantCssFree).toBeUndefined();
    expect(endCard.variantCss).toContain(".wemd-end-card");

    // 验证 quote-card 未被翻译
    const quoteCard = theme.components["quote-card"];
    expect(quoteCard.variantCssFree).toBeUndefined();
    expect(quoteCard.variantCss).toContain(".wemd-quote-card");
  });

  it("没有 variantCssFree 标记时不做任何操作", async () => {
    const mockAi: AiAdapter = {
      chat: async () => "",
    };

    const theme = {
      components: {
        "hero-banner": {
          enabled: true,
          variant: "center",
          variantCss: `.wemd-hero-banner { background: red; }`,
        },
      },
    };

    const result = await translateThemeFreeCss(theme as any, mockAi);

    expect(result.modified).toBe(false);
    expect(result.componentCount).toBe(0);
  });
});

// ============================================================
// 5. 与现有 renderTheme 管线的集成
// ============================================================

describe("与 renderTheme 管线集成", () => {
  it("翻译后的 CSS 能被 renderTheme 正确渲染", async () => {
    const mockAi: AiAdapter = {
      chat: async () => {
        return `.wemd-hero-banner[data-variant="custom"] {
  background: linear-gradient(135deg, var(--wemd-primary) 0%, var(--wemd-primary-dark) 100%);
  padding: 60px 40px;
  min-height: 360px;
  text-align: center;
}`;
      },
    };

    // 模拟 AI 生成的 manifest（Phase 1 产出）
    const manifest: ThemePackageManifest = {
      sdkVersion: "1.0.0",
      meta: {
        id: "test-translation",
        name: "翻译测试",
        description: "测试 CSS 翻译管线",
        keywords: ["测试"],
        version: "1.0.0",
      },
      tokens: {
        color: {
          primary: "#FF6B6B",
          primaryDark: "#C0392B",
          primaryLight: "#FFE0E0",
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
              fontWeight: "700",
              color: "#2C3E50",
              marginTop: 24,
              marginBottom: 12,
            } as any,
            h2: {
              fontSize: 22,
              fontWeight: "600",
              color: "#2C3E50",
              marginTop: 20,
              marginBottom: 12,
            } as any,
            h3: {
              fontSize: 18,
              fontWeight: "600",
              color: "#2C3E50",
              marginTop: 16,
              marginBottom: 8,
            } as any,
            h4: {
              fontSize: 16,
              fontWeight: "600",
              color: "#2C3E50",
              marginTop: 14,
              marginBottom: 8,
            } as any,
          },
          codeFontFamily: "monospace",
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
          variant: "custom",
          variantCss: `.my-banner {
  background: linear-gradient(135deg, var(--wemd-primary) 0%, var(--wemd-primary-dark) 100%);
  padding: 60px 40px;
  min-height: 360px;
  text-align: center;
}`,
          variantCssFree: true,
        },
      },
    };

    // 执行翻译（Phase 2）
    const translationResult = await translateThemeFreeCss(
      manifest as any,
      mockAi,
    );

    expect(translationResult.modified).toBe(true);
    expect(translationResult.componentCount).toBe(1);

    // 渲染主题
    const css = renderTheme(manifest);

    // 验证翻译后的 CSS 被正确注入
    expect(css).toContain('wemd-hero-banner[data-variant="custom"]');
    expect(css).toContain("padding: 60px 40px");
    expect(css).toContain("min-height: 360px");
    expect(css).toContain(
      "background: linear-gradient(135deg, var(--wemd-primary) 0%, var(--wemd-primary-dark) 100%)",
    );

    // 验证 variantCssFree 标记不存在
    expect(css).not.toContain("variantCssFree");
  });

  it("未翻译的 CSS 触发 console.warn", async () => {
    const manifest: ThemePackageManifest = {
      sdkVersion: "1.0.0",
      meta: {
        id: "test-untranslated",
        name: "未翻译测试",
        description: "测试未翻译警告",
        keywords: ["测试"],
        version: "1.0.0",
      },
      tokens: {
        color: { primary: "#FF6B6B" },
        typography: {
          fontFamily: "sans-serif",
          fontSize: "16px",
          lineHeight: "1.75",
          letterSpacing: 0,
          heading: {
            h1: {
              fontSize: 28,
              fontWeight: "700",
              color: "#2C3E50",
              marginTop: 24,
              marginBottom: 12,
            } as any,
            h2: {
              fontSize: 22,
              fontWeight: "600",
              color: "#2C3E50",
              marginTop: 20,
              marginBottom: 12,
            } as any,
            h3: {
              fontSize: 18,
              fontWeight: "600",
              color: "#2C3E50",
              marginTop: 16,
              marginBottom: 8,
            } as any,
            h4: {
              fontSize: 16,
              fontWeight: "600",
              color: "#2C3E50",
              marginTop: 14,
              marginBottom: 8,
            } as any,
          } as any,
          codeFontFamily: "monospace",
        },
        spacing: { pagePadding: 16, paragraphMargin: 12 },
        border: { radius: 8 },
      },
      layout: {
        preferredComponents: [],
        density: "medium",
        tone: ["warm"],
      },
      components: {
        "hero-banner": {
          enabled: true,
          variant: "custom",
          variantCss: `.my-banner { background: red; }`,
          variantCssFree: true,
        },
      },
    };

    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    renderTheme(manifest);

    expect(warnSpy).toHaveBeenCalled();
    expect(warnSpy.mock.calls[0][0]).toContain("variantCssFree");

    warnSpy.mockRestore();
  });
});
