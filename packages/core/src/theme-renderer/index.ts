/**
 * ThemeRenderer —— 从 ThemeDefinition JSON 生成完整 CSS
 *
 * 渲染管线：
 *   ThemeDefinition
 *     ├─ renderBaseCss()         → 基础重置样式
 *     ├─ renderTokenCss()        → #wemd { --wemd-* } 变量块
 *     ├─ renderTypographyCss()   → 段落/标题/列表排版
 *     ├─ renderComponentCss()    → 引用/代码/表格/图片/脚注
 *     ├─ renderExtrasCss()       → Callout / Mermaid / Imageflow
 *     ├─ injectVariantCss()      → 组件变体 CSS
 *     ├─ injectCodeTheme()       → 代码高亮主题
 *     └─ injectComponentDefaultCss() → 30 个 WeMD 组件的默认样式
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

/**
 * 渲染完整的主题 CSS
 *
 * 按层拼接，顺序固定：基础 → Token → 排版 → 组件 → 变体 → WeMD 组件 → 代码高亮 → 额外
 */
export function renderTheme(theme: ThemeDefinition): string {
  const parts: string[] = [
    renderBaseCss(),
    renderTokenCss(theme.tokens),
    renderTypographyCss(theme.tokens),
    renderComponentCss(theme.tokens),
    injectVariantCss(theme.components),
    injectCodeTheme(),
    renderExtrasCss(),
  ];

  return parts.filter(Boolean).join("\n\n");
}

/**
 * 从 components 配置中提取已启用的变体并注入 CSS
 *
 * 组件变体通过 data-variant 属性切换，每个变体有独立 CSS。
 * 所有已启用的变体 CSS 都注入，运行时由 HTML 的 data-variant 属性决定哪个生效。
 */
function injectVariantCss(
  components: Record<string, ComponentStyleOverride>,
): string {
  // 收集所有引用了变体的组件
  const usedVariants = new Map<string, Set<string>>(); // component → variant[]

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

  // 从变体库中注入对应的 CSS
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
 *
 * 默认使用 GitHub 主题，后续可由 ThemeDefinition 扩展字段选择。
 */
function injectCodeTheme(): string {
  return codeGithubTheme;
}

export {
  renderBaseCss,
  renderTokenCss,
  renderTypographyCss,
  renderComponentCss,
  renderExtrasCss,
};
