/**
 * ThemeRenderer —— 从 ThemeDefinition JSON 生成完整 CSS
 *
 * 渲染管线：
 *   ThemeDefinition
 *     ├─ renderBaseCss()           → 基础重置样式
 *     ├─ renderTokenCss()          → #wemd { --wemd-* } 变量块
 *     ├─ renderTypographyCss()     → 段落/标题/列表排版
 *     ├─ renderComponentCss()      → 引用/代码/表格/图片/脚注
 *     ├─ injectVariantCss()        → 组件变体 CSS
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
 * 按层拼接，顺序固定。组件默认样式在变体 CSS 之后但 extras 之前，
 * 确保变体能覆盖默认组件样式。
 */
export function renderTheme(theme: ThemeDefinition): string {
  const parts: string[] = [
    renderBaseCss(),
    renderTokenCss(theme.tokens),
    renderTypographyCss(theme.tokens),
    renderComponentCss(theme.tokens),
    injectVariantCss(theme.components),
    injectCodeTheme(theme.codeTheme),
    injectComponentStyles(),
    renderExtrasCss(),
  ];

  return parts.filter(Boolean).join("\n\n");
}

/**
 * 从 components 配置中提取已启用的变体并注入 CSS
 */
function injectVariantCss(
  components: Record<string, ComponentStyleOverride>,
): string {
  const usedVariants = new Map<string, Set<string>>();

  for (const [compType, override] of Object.entries(components)) {
    if (
      override.enabled &&
      override.variant &&
      override.variant !== "default"
    ) {
      if (!usedVariants.has(compType)) usedVariants.set(compType, new Set());
      usedVariants.get(compType)!.add(override.variant!);
    }
  }

  if (usedVariants.size === 0) return "";

  const cssParts: string[] = [];
  for (const [compType, variants] of usedVariants) {
    const variantMap = VARIANT_CSS_MAP[compType];
    if (variantMap) {
      for (const v of variants) {
        if (variantMap[v]) cssParts.push(variantMap[v]);
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

export {
  renderBaseCss,
  renderTokenCss,
  renderTypographyCss,
  renderComponentCss,
  renderExtrasCss,
};
