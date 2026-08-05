/**
 * ThemeRenderer —— 从 ThemeDefinition JSON 生成完整 CSS
 *
 * 渲染管线：
 *   ThemeDefinition
 *     ├─ renderBaseCss()           → 基础重置样式
 *     ├─ renderTokenCss()          → #wemd { --wemd-* } 变量块
 *     ├─ renderTypographyCss()     → 段落/标题/列表排版
 *     ├─ renderComponentCss()      → 引用/代码/表格/图片/脚注
 *     ├─ injectVariantCss()        → 全部变体 CSS + overrides + 轨道 B AI variantCss
 *     ├─ injectCodeTheme()         → 代码高亮主题（github / github-dark）
 *     ├─ injectComponentStyles()   → 30 个 WeMD 组件默认样式
 *     ├─ renderExtrasCss()         → Callout / Mermaid / Imageflow
 *     └─ injectExtraCss()          → styles/components.css + extras.css（Phase 4）
 *
 *   → 拼接为完整 CSS 字符串
 */

import type {
  ThemeDefinition,
  ComponentStyleOverride,
} from "../theme-schema/types";
import { renderBaseCss } from "./baseCss";
import { renderTokenCss } from "./tokenCss";
import { renderTypographyCss } from "./typographyCss";
import { renderComponentCss } from "./componentCss";
import { renderExtrasCss } from "./extrasCss";
import { VARIANT_CSS_MAP } from "../components/variants/variantCss";
import { codeGithubTheme } from "../themes/code-github";
import { codeGithubDarkTheme } from "../themes/code-github-dark";
import { componentStylesDefault } from "../themes/components-default";
import { componentStylesExtra } from "../themes/components-extra";
import { componentStylesFaq } from "../themes/components-faq";
import { componentStylesMagazine } from "../themes/components-magazine";

/** renderTheme 扩展选项（Phase 4） */
export interface RenderThemeOptions {
  /** styles/components.css 内容 */
  componentsCss?: string;
  /** styles/extras.css 内容 */
  extrasCss?: string;
  /** 资源图片映射（key → base64 data URL），注入为 --wemd-asset-xxx CSS 变量 */
  assets?: Map<string, string>;
}

/**
 * 渲染完整的主题 CSS
 *
 * 按层拼接，顺序与 legacy buildThemeCss 严格对齐：
 *   1. renderBaseCss           基础重置（等价 basicTheme）
 *   2. renderTokenCss          --wemd-* 变量（等价 themeVars）
 *   3. renderTypographyCss     段落/标题/列表排版
 *   4. renderComponentCss      引用/代码/表格/图片/脚注元素样式
 *   5. injectCodeTheme         代码高亮主题（等价 codeTheme）
 *   6. injectComponentStyles   30 个 WeMD 组件默认样式（Default+Extra+Faq+Magazine）
 *   7. injectVariantCss        全部变体 CSS + overrides + 轨道 B AI variantCss（在最末）
 *   8. renderExtrasCss         Callout / Mermaid / Imageflow
 *   9. injectExtraCss          styles/components.css + extras.css（Phase 4）
 *
 * 顺序依赖：componentStyles 必须在 variantCss 之前（否则 variant 被默认覆盖）。
 */
export function renderTheme(
  theme: ThemeDefinition,
  options?: RenderThemeOptions,
): string {
  const parts: string[] = [
    renderBaseCss(),
    renderTokenCss(theme.tokens, options?.assets),
    renderTypographyCss(theme.tokens),
    renderComponentCss(theme.tokens),
    injectCodeTheme(theme.codeTheme),
    injectComponentStyles(),
    injectVariantCss(theme.components),
    renderExtrasCss(),
    injectExtraCss(options),
  ];

  return parts.filter(Boolean).join("\n\n");
}

/**
 * 注入全部变体 CSS（与 legacy `getVariantCss()` 行为一致：无条件注入所有 variant）
 * 保证用户在 UI 中手动切换组件 variant 时 CSS 已存在。
 *
 * 同时对 ThemeDefinition.components 里有自定义覆盖的组件，追加：
 *   - overrides（CSS 属性细粒度覆盖，如 { fontSize: "20px", borderWidth: "3px" }）
 *   - variantCss（轨道 B：AI 自定义 variant 造型 CSS）
 */
function injectVariantCss(
  components?: Record<string, ComponentStyleOverride>,
): string {
  const cssParts: string[] = [];

  // 1) 注入全部变体 CSS（与 legacy getVariantCss 等价）
  for (const variants of Object.values(VARIANT_CSS_MAP)) {
    for (const css of Object.values(variants)) {
      cssParts.push(css);
    }
  }

  if (components) {
    // 2) 消费 ComponentStyleOverride.overrides：给每个组件追加细粒度 CSS 属性
    for (const [compType, override] of Object.entries(components)) {
      if (!override.enabled) continue;
      if (override.overrides) {
        const declarations = Object.entries(override.overrides)
          .map(([k, v]) => {
            const cssKey = k.replace(/[A-Z]/g, (ch) => `-${ch.toLowerCase()}`);
            return `  ${cssKey}: ${v};`;
          })
          .join("\n");
        if (declarations) {
          cssParts.push(
            `#wemd .wemd-component[data-type="${compType}"] {\n${declarations}\n}`,
          );
        }
      }
    }

    // 3) 注入 AI 自定义 variantCss（轨道 B）
    for (const override of Object.values(components)) {
      if (override.variantCss) {
        cssParts.push(override.variantCss);
      }
    }
  }

  return cssParts.length ? cssParts.join("\n\n") : "";
}

/**
 * 注入代码高亮主题 CSS
 */
function injectCodeTheme(codeTheme?: "github" | "github-dark"): string {
  return codeTheme === "github-dark" ? codeGithubDarkTheme : codeGithubTheme;
}

/**
 * 注入 30 个 WeMD 组件的默认样式
 *
 * 顺序：default → extra → faq → magazine
 * 组件样式通过 var(--wemd-*) 引用主题色，实现跟随主题。
 */
function injectComponentStyles(): string {
  return [
    componentStylesDefault,
    componentStylesExtra,
    componentStylesFaq,
    componentStylesMagazine,
  ].join("\n\n");
}

/**
 * 注入扩展 CSS（Phase 4）
 * - styles/components.css
 * - styles/extras.css
 */
function injectExtraCss(options?: RenderThemeOptions): string {
  if (!options) return "";
  const parts: string[] = [];
  if (options.componentsCss) {
    parts.push("/* styles/components.css */\n" + options.componentsCss);
  }
  if (options.extrasCss) {
    parts.push("/* styles/extras.css */\n" + options.extrasCss);
  }
  return parts.join("\n\n");
}

export {
  renderBaseCss,
  renderTokenCss,
  renderTypographyCss,
  renderComponentCss,
  renderExtrasCss,
};
