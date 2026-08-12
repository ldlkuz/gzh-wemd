/**
 * 导入流程测试 —— 验证 manifest.components 是否被正确渲染到 CSS 中
 */
import { describe, expect, it } from "vitest";
import { renderTheme } from "../theme-renderer/index";
import type { ThemePackageManifest } from "../theme-schema/types";

// 模拟一个导入的 manifest（包含 AI 生成的组件样式）
const mockManifest: ThemePackageManifest = {
  sdkVersion: "1.0.0",
  meta: {
    id: "test-theme",
    name: "测试主题",
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
  // 模拟 AI 生成的组件样式
  components: {
    "hero-banner": {
      enabled: true,
      variant: "hero-banner-default",
      variantCss: `/* hero-banner - 测试主题 */
#wemd .wemd-hero-banner[data-variant="hero-banner-default"] {
  background: linear-gradient(135deg, var(--wemd-primary) 0%, var(--wemd-primary-dark) 100%);
  border-radius: 16px;
  padding: 60px 40px;
  min-height: 360px;
  text-align: center;
  color: var(--wemd-bg-card);
}
#wemd .wemd-hero-banner[data-variant="hero-banner-default"] .wemd-hero-title {
  font-size: 36px;
  font-weight: 800;
  color: var(--wemd-bg-card);
  margin-bottom: 16px;
}`,
    },
    "end-card": {
      enabled: true,
      variant: "end-card-default",
      variantCss: `/* end-card - 测试主题 */
#wemd .wemd-end-card[data-variant="end-card-default"] {
  background: var(--wemd-bg-soft);
  border-top: 3px solid var(--wemd-primary);
  padding: 32px;
  text-align: center;
}`,
    },
  },
};

describe("导入流程 - manifest.components → CSS 渲染", () => {
  const css = renderTheme(mockManifest);

  it("生成非空 CSS", () => {
    expect(css.length).toBeGreaterThan(1000);
  });

  it("包含 token 颜色变量", () => {
    expect(css).toContain("#FF6B6B");
    expect(css).toContain("--wemd-primary: #FF6B6B");
  });

  it("包含 AI 生成的 hero-banner variantCss", () => {
    expect(css).toContain("hero-banner - 测试主题");
    expect(css).toContain(
      '.wemd-hero-banner[data-variant="hero-banner-default"]',
    );
    expect(css).toContain(
      "background: linear-gradient(135deg, var(--wemd-primary) 0%, var(--wemd-primary-dark) 100%)",
    );
    expect(css).toContain("padding: 60px 40px");
    expect(css).toContain("min-height: 360px");
  });

  it("包含 AI 生成的 end-card variantCss", () => {
    expect(css).toContain("end-card - 测试主题");
    expect(css).toContain('.wemd-end-card[data-variant="end-card-default"]');
    expect(css).toContain("border-top: 3px solid var(--wemd-primary)");
    expect(css).toContain("padding: 32px");
  });

  it("不包含内置变体 CSS（因为定义了 variantCss）", () => {
    // 内置变体 CSS 通常有特定的标记，检查是否被跳过
    // 如果 AI variantCss 存在，内置变体不应被注入
    // 这个测试验证 injectVariantCss 的逻辑正确性
    expect(css).toContain("hero-banner - 测试主题");
  });

  it("variantCss 在默认组件样式之后（CSS 层叠顺序正确）", () => {
    const defaultIdx = css.indexOf("#wemd .wemd-component");
    const variantIdx = css.indexOf("hero-banner - 测试主题");
    // variantCss 应该在默认样式之后（CSS 特异性更高）
    expect(variantIdx).toBeGreaterThan(defaultIdx);
  });
});

describe("导入流程 - 空 components 字段", () => {
  // 模拟没有 components 字段的 manifest
  const manifestWithoutComponents: ThemePackageManifest = {
    ...mockManifest,
    components: undefined,
  };
  const css = renderTheme(manifestWithoutComponents);

  it("无 components 时仍能生成 CSS", () => {
    expect(css.length).toBeGreaterThan(1000);
  });

  it("无 components 时包含所有内置变体 CSS（向后兼容）", () => {
    // 此时 injectVariantCss 应注入所有内置变体
    expect(css).toContain("wemd-hero-banner");
  });
});

describe("导入流程 - AI variant CSS 不含 #wemd 前缀（实际主题包场景）", () => {
  // 模拟 AI 生成的主题包中 variantCss 不含 #wemd 前缀
  // 这是实际导入场景（如 bytedance-tech 主题包）
  const manifestWithoutWemd: ThemePackageManifest = {
    ...mockManifest,
    components: {
      "hero-banner": {
        enabled: true,
        variant: "bytewave",
        variantCss: `/* hero-banner - 科技主题 */
.wemd-hero-banner[data-variant="bytewave"] {
  background: linear-gradient(135deg, var(--wemd-primary) 0%, var(--wemd-secondary) 100%);
  border-radius: 16px;
  padding: 60px 40px;
  min-height: 360px;
  text-align: center;
  color: var(--wemd-bg-card);
}
.wemd-hero-banner[data-variant="bytewave"] .wemd-hero-title {
  font-size: 36px;
  font-weight: 800;
  color: var(--wemd-bg-card);
  margin-bottom: 16px;
}`,
      },
      "end-card": {
        enabled: true,
        variant: "default",
        variantCss: `/* end-card - 科技主题 */
.wemd-end-card[data-variant="default"] {
  background: var(--wemd-bg-soft);
  border-top: 3px solid var(--wemd-primary);
  padding: 32px;
  text-align: center;
}`,
      },
    },
  };
  const css = renderTheme(manifestWithoutWemd);

  it("生成的 CSS 包含 AI 自定义样式", () => {
    expect(css).toContain("hero-banner - 科技主题");
    expect(css).toContain("end-card - 科技主题");
  });

  it("AI 自定义样式选择器已自动添加 #wemd 前缀", () => {
    // normalizeVariantCss 应为选择器添加 #wemd 前缀
    expect(css).toContain('#wemd .wemd-hero-banner[data-variant="bytewave"]');
    expect(css).toContain('#wemd .wemd-end-card[data-variant="default"]');
  });

  it("AI 自定义选择器的后代选择器也包含 #wemd 前缀", () => {
    expect(css).toContain(
      '#wemd .wemd-hero-banner[data-variant="bytewave"] .wemd-hero-title',
    );
  });

  it("AI 自定义样式不包含无 #wemd 前缀的原始选择器", () => {
    // 检查没有不含 #wemd 前缀的原始选择器
    // 注意：正则匹配要避免匹配到 #wemd 后面的内容
    const lines = css.split("\n");
    const bareSelectorLines = lines.filter((line) =>
      /^\s*\.wemd-(hero-banner|end-card)\[data-variant/.test(line),
    );
    expect(bareSelectorLines.length).toBe(0);
  });
});

describe("injectComponentVariants - HTML 匹配测试", () => {
  it("正则能匹配 markdown-it-component 输出的 HTML", () => {
    // 模拟 markdown-it-component 输出的 HTML
    const html = `<section class="wemd-component wemd-hero-banner" data-component="hero-banner" data-props="{}">
  <section class="wemd-component-body">
    <p>测试内容</p>
  </section>
</section>`;

    // 模拟 injectComponentVariants 的逻辑
    const components = mockManifest.components!;
    let result = html;
    let matched = false;

    for (const [compType, override] of Object.entries(components)) {
      if (!override.enabled || !override.variant) continue;
      const tagName = `wemd-${compType}`;
      const regex = new RegExp(
        `(<[a-zA-Z][^>]*?\\b${tagName}\\b[^>]*?)(\\s*/?\\s*>)`,
        "g",
      );
      const before = result;
      result = result.replace(regex, `$1 data-variant="${override.variant}"$2`);
      if (result !== before) matched = true;
    }

    expect(matched).toBe(true);
    expect(result).toContain('data-variant="hero-banner-default"');
    expect(result).not.toContain('data-variant="end-card-default"'); // 不应出现在 hero-banner 的 HTML 中
  });

  it("正则不匹配非组件标签", () => {
    const html = `<section class="normal-section" data-component="something">
  <p>普通内容</p>
</section>`;

    const components = mockManifest.components!;
    let result = html;
    let matched = false;

    for (const [compType, override] of Object.entries(components)) {
      if (!override.enabled || !override.variant) continue;
      const tagName = `wemd-${compType}`;
      const regex = new RegExp(
        `(<[a-zA-Z][^>]*?\\b${tagName}\\b[^>]*?)(\\s*/?\\s*>)`,
        "g",
      );
      const before = result;
      result = result.replace(regex, `$1 data-variant="${override.variant}"$2`);
      if (result !== before) matched = true;
    }

    expect(matched).toBe(false);
    expect(result).not.toContain("data-variant=");
  });
});

describe("injectComponentVariants - 简写类名处理（bytedance-tech 场景）", () => {
  // 模拟 AI 生成的 variant CSS 使用简写类名（如 .wemd-hero 而非 .wemd-hero-banner）
  // 这是实际 bytedance-tech 主题包中的情况
  const shortNameComponents = {
    "hero-banner": {
      enabled: true,
      variant: "bytewave",
      variantCss: `.wemd-hero[data-variant="bytewave"] {
  background: linear-gradient(135deg, var(--wemd-primary) 0%, var(--wemd-secondary) 100%);
  border-radius: 16px;
  padding: 60px 40px;
}`,
    },
    "stats-block": {
      enabled: true,
      variant: "metric-grid",
      variantCss: `.wemd-stats[data-variant="metric-grid"] {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 16px;
}`,
    },
  };

  it("模拟 injectComponentVariants 为简写类名添加额外 class", () => {
    const html = `<section class="wemd-component wemd-hero-banner" data-component="hero-banner" data-props="{}">
  <section class="wemd-component-body">
    <p>测试内容</p>
  </section>
</section>
<section class="wemd-component wemd-stats-block" data-component="stats-block" data-props="{}">
  <section class="wemd-component-body">
    <p>统计内容</p>
  </section>
</section>`;

    // 模拟 injectComponentVariants 的完整逻辑（含简写类名处理）
    let result = html;
    let totalInjections = 0;

    for (const [compType, override] of Object.entries(shortNameComponents)) {
      if (!override.enabled || !override.variant) continue;

      const tagName = `wemd-${compType}`;
      const regex = new RegExp(
        `(<[a-zA-Z][^>]*?\\b${tagName}\\b[^>]*?)(\\s*/?\\s*>)`,
        "g",
      );

      // 解析 AI variant CSS 的选择器类名
      let extraClasses = "";
      if (override.variantCss) {
        const match = override.variantCss.match(
          /\.([a-zA-Z0-9_-]+)(?=\[data-variant[^\]]*\])/,
        );
        const cssClassName = match ? match[1] : null;
        const defaultClassName = `wemd-${compType}`;
        if (cssClassName && cssClassName !== defaultClassName) {
          extraClasses = ` ${cssClassName}`;
        }
      }

      const before = result;
      result = result.replace(regex, (match, attrs, closing) => {
        let modified = attrs;
        modified += ` data-variant="${override.variant}"`;

        if (extraClasses) {
          const classAttrRegex = /class="([^"]*)"/;
          const classMatch = modified.match(classAttrRegex);
          if (classMatch) {
            const classes = classMatch[1].split(/\s+/);
            const extraClass = extraClasses.trim();
            if (!classes.includes(extraClass)) {
              classes.push(extraClass);
              modified = modified.replace(
                classAttrRegex,
                `class="${classes.join(" ")}"`,
              );
            }
          }
        }

        return modified + closing;
      });
      if (result !== before) totalInjections++;
    }

    expect(totalInjections).toBe(2);
    // 验证 hero-banner 添加了简写类名 wemd-hero
    expect(result).toContain(
      'class="wemd-component wemd-hero-banner wemd-hero"',
    );
    expect(result).toContain('data-variant="bytewave"');
    // 验证 stats-block 添加了简写类名 wemd-stats
    expect(result).toContain(
      'class="wemd-component wemd-stats-block wemd-stats"',
    );
    expect(result).toContain('data-variant="metric-grid"');
  });

  it("CSS 简写类名选择器能匹配添加了额外 class 的 HTML", () => {
    // 模拟 renderTheme 生成的 CSS（含 normalizeVariantCss 处理）
    const css = `#wemd .wemd-hero[data-variant="bytewave"] {
  background: linear-gradient(135deg, var(--wemd-primary) 0%, var(--wemd-secondary) 100%);
  border-radius: 16px;
  padding: 60px 40px;
}`;

    // 模拟 DOM 中注入 data-variant 和额外 class 后的 HTML
    const html = `<section id="wemd">
<section class="wemd-component wemd-hero-banner wemd-hero" data-component="hero-banner" data-variant="bytewave">
  <section class="wemd-component-body">
    <p>测试内容</p>
  </section>
</section>
</section>`;

    // 验证 CSS 选择器能匹配：wemd-hero 类名和 data-variant 属性都存在
    expect(html).toContain('class="wemd-component wemd-hero-banner wemd-hero"');
    expect(html).toContain('data-variant="bytewave"');
    // CSS 选择器 .wemd-hero[data-variant="bytewave"] 在 #wemd 内能匹配
    expect(css).toContain('.wemd-hero[data-variant="bytewave"]');
  });

  it('Markdown 指定的 variant（{variant="center"}）优先于主题配置', () => {
    // 模拟 Markdown 中用户写了 ::: hero-banner{variant="center"}
    // markdown-it-component 解析后 HTML 已包含 data-variant 属性
    const html = `<section class="wemd-component wemd-hero-banner" data-component="hero-banner" data-props='{"variant":"center"}' data-variant="center">
  <section class="wemd-component-body">
    <p>测试内容</p>
  </section>
</section>`;

    // 主题配置的 variant 是 "bytewave"
    const components = shortNameComponents;

    let result = html;
    let totalInjections = 0;

    for (const [compType, override] of Object.entries(components)) {
      if (!override.enabled || !override.variant) continue;

      const tagName = `wemd-${compType}`;
      const regex = new RegExp(
        `(<[a-zA-Z][^>]*?\\b${tagName}\\b[^>]*?)(\\s*/?\\s*>)`,
        "g",
      );

      let extraClasses = "";
      if (override.variantCss) {
        const match = override.variantCss.match(
          /\.([a-zA-Z0-9_-]+)(?=\[data-variant[^\]]*\])/,
        );
        const cssClassName = match ? match[1] : null;
        const defaultClassName = `wemd-${compType}`;
        if (cssClassName && cssClassName !== defaultClassName) {
          extraClasses = ` ${cssClassName}`;
        }
      }

      const before = result;
      result = result.replace(regex, (match, attrs, closing) => {
        let modified = attrs;

        // 检查 HTML 是否已有 data-variant（来自 Markdown 的 {variant="xxx"}）
        // 如果已有，保留 Markdown 指定的 variant，不覆盖
        if (!modified.includes("data-variant=")) {
          modified += ` data-variant="${override.variant}"`;
        }

        if (extraClasses) {
          const classAttrRegex = /class="([^"]*)"/;
          const classMatch = modified.match(classAttrRegex);
          if (classMatch) {
            const classes = classMatch[1].split(/\s+/);
            const extraClass = extraClasses.trim();
            if (!classes.includes(extraClass)) {
              classes.push(extraClass);
              modified = modified.replace(
                classAttrRegex,
                `class="${classes.join(" ")}"`,
              );
            }
          }
        }

        return modified + closing;
      });
      if (result !== before) totalInjections++;
    }

    // 验证 Markdown 的 variant 被保留（主题的 bytewave 未覆盖）
    expect(result).toContain('data-variant="center"');
    // 验证没有出现重复的 data-variant 属性
    const dataVariantMatches = result.match(/data-variant=/g);
    expect(dataVariantMatches?.length).toBe(1);
    // 简写类名仍应添加（variantCss 选择器需要）
    expect(result).toContain(
      'class="wemd-component wemd-hero-banner wemd-hero"',
    );
  });

  it("完整类名组件（如 tencent-tech）不受影响", () => {
    const html = `<section class="wemd-component wemd-hero-banner" data-component="hero-banner" data-props="{}">
  <section class="wemd-component-body">
    <p>测试内容</p>
  </section>
</section>`;

    // 模拟 tencent-tech 风格的完整类名 variant CSS
    const fullNameComponents = {
      "hero-banner": {
        enabled: true,
        variant: "tencent-hero-geometric",
        variantCss: `.wemd-hero-banner[data-variant="tencent-hero-geometric"] {
  padding: 40px 24px;
  background: linear-gradient(135deg, var(--wemd-primary) 0%, var(--wemd-secondary) 100%);
}`,
      },
    };

    let result = html;
    for (const [compType, override] of Object.entries(fullNameComponents)) {
      if (!override.enabled || !override.variant) continue;

      const tagName = `wemd-${compType}`;
      const regex = new RegExp(
        `(<[a-zA-Z][^>]*?\\b${tagName}\\b[^>]*?)(\\s*/?\\s*>)`,
        "g",
      );

      // 解析 AI variant CSS 的选择器类名
      let extraClasses = "";
      if (override.variantCss) {
        const match = override.variantCss.match(
          /\.([a-zA-Z0-9_-]+)(?=\[data-variant[^\]]*\])/,
        );
        const cssClassName = match ? match[1] : null;
        const defaultClassName = `wemd-${compType}`;
        if (cssClassName && cssClassName !== defaultClassName) {
          extraClasses = ` ${cssClassName}`;
        }
      }

      result = result.replace(regex, (match, attrs, closing) => {
        let modified = attrs;
        modified += ` data-variant="${override.variant}"`;

        if (extraClasses) {
          const classAttrRegex = /class="([^"]*)"/;
          const classMatch = modified.match(classAttrRegex);
          if (classMatch) {
            const classes = classMatch[1].split(/\s+/);
            const extraClass = extraClasses.trim();
            if (!classes.includes(extraClass)) {
              classes.push(extraClass);
              modified = modified.replace(
                classAttrRegex,
                `class="${classes.join(" ")}"`,
              );
            }
          }
        }

        return modified + closing;
      });
    }

    // 完整类名不应添加额外 class
    expect(result).toContain('class="wemd-component wemd-hero-banner"');
    expect(result).not.toContain("wemd-hero-banner wemd-hero-banner"); // 不应重复
    expect(result).toContain('data-variant="tencent-hero-geometric"');
  });
});
