/**
 * Token → CSS 变量块
 *
 * 将 DesignTokens 中的结构化数据转为 #wemd { --wemd-*: ... } CSS 声明块。
 * 组件样式通过 var(--wemd-*) 引用这些变量，实现主题切换时组件自动跟随。
 */
import type { DesignTokens } from "../theme-schema/types";

/**
 * 将 hex 颜色转为带透明度的 rgba
 */
function toAlpha(hex: string, alpha: number): string {
  hex = hex.replace("#", "");
  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function renderTokenCss(
  tokens: DesignTokens,
  assets?: Map<string, string>,
): string {
  const { color, typography, spacing, border, shadow } = tokens;

  const shadowLine =
    shadow?.enabled && shadow.value ? `  --wemd-shadow: ${shadow.value};` : "";

  // 资源图片 CSS 变量（Phase 4）
  const assetLines: string[] = [];
  if (assets && assets.size > 0) {
    assetLines.push("  /* 主题资源图片 */");
    for (const [key, dataUrl] of assets) {
      // 将 key 转为合法的 CSS 变量名（如 hero-bg → hero-bg）
      const safeKey = key.replace(/[^a-zA-Z0-9_-]/g, "-");
      assetLines.push(`  --wemd-asset-${safeKey}: url(${dataUrl});`);
    }
  }

  const pa2 = toAlpha(color.primary, 0.02);
  const pa4 = toAlpha(color.primary, 0.04);
  const pa6 = toAlpha(color.primary, 0.06);
  const pa8 = toAlpha(color.primary, 0.08);
  const pa25 = toAlpha(color.primary, 0.25);

  return [
    `#wemd {`,
    `  /* 主色三阶 */`,
    `  --wemd-primary: ${color.primary};`,
    `  --wemd-primary-dark: ${color.primaryDark};`,
    `  --wemd-primary-light: ${color.primaryLight};`,
    `  /* 主色派生半透明色（供渐变/阴影消费） */`,
    `  --wemd-primary-alpha-2: ${pa2};`,
    `  --wemd-primary-alpha-4: ${pa4};`,
    `  --wemd-primary-alpha-6: ${pa6};`,
    `  --wemd-primary-alpha-8: ${pa8};`,
    `  --wemd-primary-alpha-25: ${pa25};`,
    `  /* 辅助色 + 点缀色 */`,
    `  --wemd-secondary: ${color.secondary};`,
    `  --wemd-accent: ${color.accent};`,
    `  /* 三级背景 */`,
    `  --wemd-bg-soft: ${color.bgSoft};`,
    `  --wemd-bg-card: ${color.bgCard};`,
    `  --wemd-bg-muted: ${color.bgMuted};`,
    `  /* 三级文字 */`,
    `  --wemd-text-strong: ${color.textStrong};`,
    `  --wemd-text-normal: ${color.textNormal};`,
    `  --wemd-text-soft: ${color.textSoft};`,
    `  /* 边框 */`,
    `  --wemd-border: ${color.border};`,
    `  --wemd-border-soft: ${color.borderSoft};`,
    `  /* 全局排版 */`,
    `  --wemd-page-padding: ${spacing.pagePadding}px;`,
    `  --wemd-font-size: ${typography.fontSize};`,
    `  --wemd-line-height: ${typography.lineHeight};`,
    `  --wemd-letter-spacing: ${typography.letterSpacing}px;`,
    `  --wemd-paragraph-margin: ${spacing.paragraphMargin}px;`,
    `  /* 标题 */`,
    `  --wemd-h1-font-size: ${typography.heading.h1.fontSize}px;`,
    `  --wemd-h1-color: ${typography.heading.h1.color};`,
    `  --wemd-h1-margin-top: ${typography.heading.h1.marginTop}px;`,
    `  --wemd-h1-margin-bottom: ${typography.heading.h1.marginBottom}px;`,
    `  --wemd-h2-font-size: ${typography.heading.h2.fontSize}px;`,
    `  --wemd-h2-color: ${typography.heading.h2.color};`,
    `  --wemd-h2-margin-top: ${typography.heading.h2.marginTop}px;`,
    `  --wemd-h2-margin-bottom: ${typography.heading.h2.marginBottom}px;`,
    `  --wemd-h3-font-size: ${typography.heading.h3.fontSize}px;`,
    `  --wemd-h3-color: ${typography.heading.h3.color};`,
    `  --wemd-h3-margin-top: ${typography.heading.h3.marginTop}px;`,
    `  --wemd-h3-margin-bottom: ${typography.heading.h3.marginBottom}px;`,
    `  --wemd-h4-font-size: ${typography.heading.h4.fontSize}px;`,
    `  --wemd-h4-color: ${typography.heading.h4.color};`,
    `  --wemd-h4-margin-top: ${typography.heading.h4.marginTop}px;`,
    `  --wemd-h4-margin-bottom: ${typography.heading.h4.marginBottom}px;`,
    `  /* 圆角 */`,
    `  --wemd-border-radius: ${border.radius}px;`,
    shadowLine,
    assetLines.join("\n"),
    `}`,
  ]
    .filter(Boolean)
    .join("\n");
}

export const tokenCss = { renderTokenCss, toAlpha };
