/**
 * ThemeRenderer —— 从 ThemeDefinition JSON 生成完整 CSS
 *
 * 渲染管线：
 *   ThemeDefinition
 *     ├─ renderBaseCss()           → 基础重置样式
 *     ├─ renderTokenCss()          → #wemd { --wemd-* } 变量块
 *     ├─ renderTypographyCss()     → 段落/标题/列表排版
 *     ├─ renderComponentCss()      → 引用/代码/表格/图片/脚注
 *     ├─ injectVariantCss()        → 全部变体 CSS + 每个组件的 overrides/presetColor/css
 *     ├─ injectCodeTheme()         → 代码高亮主题（github / github-dark）
 *     ├─ injectComponentStyles()   → 30 个 WeMD 组件默认样式
 *     └─ renderExtrasCss()         → Callout / Mermaid / Imageflow
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
 *   7. injectVariantCss        全部变体 CSS + overrides（在最末，保证变体覆盖默认）
 *   8. renderExtrasCss         Callout / Mermaid / Imageflow
 *
 * 顺序依赖：componentStyles 必须在 variantCss 之前（否则 variant 被默认覆盖）。
 */
export function renderTheme(theme: ThemeDefinition): string {
  const parts: string[] = [
    renderBaseCss(),
    renderTokenCss(theme.tokens),
    renderTypographyCss(theme.tokens),
    renderComponentCss(theme.tokens),
    injectCodeTheme(theme.codeTheme),
    injectComponentStyles(),
    injectVariantCss(theme.components),
    renderExtrasCss(),
  ];

  return parts.filter(Boolean).join("\n\n");
}

/**
 * 注入全部变体 CSS（与 legacy `getVariantCss()` 行为一致：无条件注入所有 variant）
 * 保证用户在 UI 中手动切换组件 variant 时 CSS 已存在。
 *
 * 同时对 ThemeDefinition.components 里有自定义覆盖的组件，追加：
 *   - overrides（CSS 属性细粒度覆盖，如 { fontSize: "20px", borderWidth: "3px" }）
 *   - 未来扩展：presetColor / customCss 等
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

  // 2) 消费 ComponentStyleOverride.overrides：给每个组件追加细粒度 CSS 属性
  if (components) {
    for (const [compType, override] of Object.entries(components)) {
      if (!override.enabled || !override.overrides) continue;
      const declarations = Object.entries(override.overrides)
        .map(([k, v]) => {
          // camelCase 属性名转 kebab-case（如 fontSize → font-size）
          const cssKey = k.replace(/[A-Z]/g, (ch) => `-${ch.toLowerCase()}`);
          return `  ${cssKey}: ${v};`;
        })
        .join("\n");
      if (!declarations) continue;
      cssParts.push(
        `#wemd .wemd-component[data-type="${compType}"] {\n${declarations}\n}`,
      );
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

export {
  renderBaseCss,
  renderTokenCss,
  renderTypographyCss,
  renderComponentCss,
  renderExtrasCss,
};
