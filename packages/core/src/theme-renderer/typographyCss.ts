/**
 * 排版样式生成器
 *
 * 从 DesignTokens 生成段落、标题、列表的完整 CSS。
 * 包含 heading preset 支持（left-border / bottom-border / boxed / pill 等）。
 */
import type { DesignTokens, HeadingToken } from "../../theme-schema/types";

// ============================================================
// Heading Preset 预设样式
// ============================================================

interface PresetCss {
  content: string;
  extra: string;
}

const HEADING_PRESETS: Record<
  string,
  (tag: string, color: string) => PresetCss
> = {
  simple: () => ({ content: "", extra: "" }),

  "left-border": (tag, color) => ({
    content: `#wemd ${tag} { border-left: 4px solid ${color}; padding-left: 10px; }`,
    extra: "",
  }),

  "bottom-border": (tag, color) => ({
    content: `#wemd ${tag} { border-bottom: 2px solid ${color}; padding-bottom: 8px; }`,
    extra: "",
  }),

  "double-line": (tag, color) => ({
    content: `#wemd ${tag} { border-top: 2px solid ${color}; border-bottom: 2px solid ${color}; padding: 8px 0; }`,
    extra: "",
  }),

  boxed: (tag, color) => {
    const alpha = hexToAlpha(color, 0.12);
    return {
      content: `#wemd ${tag} { background: ${alpha}; border-left: 4px solid ${color}; border-radius: 4px; padding: 8px 12px; }`,
      extra: "",
    };
  },

  "bottom-highlight": (tag, color) => {
    const alpha = hexToAlpha(color, 0.18);
    return {
      content: `#wemd ${tag} { display: inline-block; background: linear-gradient(to top, ${alpha} 40%, transparent 40%); }`,
      extra: "",
    };
  },

  pill: (tag, color) => ({
    content: `#wemd ${tag} { display: inline-block; background: ${color}; color: #fff; border-radius: 20px; padding: 4px 16px; }`,
    extra: "",
  }),

  bracket: (tag, color) => ({
    content: `#wemd ${tag} { display: inline-block; padding: 0 6px; }`,
    extra: `#wemd ${tag}::before { content: "["; color: ${color}; font-weight: bold; }\n#wemd ${tag}::after { content: "]"; color: ${color}; font-weight: bold; }`,
  }),
};

function hexToAlpha(hex: string, alpha: number): string {
  hex = hex.replace("#", "");
  if (hex.length === 3)
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function renderHeadingPreset(
  tag: string,
  h: HeadingToken,
): { content: string; extra: string } {
  const presetId = h.preset || "simple";
  const fn = HEADING_PRESETS[presetId];
  if (!fn) return { content: "", extra: "" };
  return fn(tag, h.color);
}

// ============================================================
// 主渲染函数
// ============================================================

export function renderTypographyCss(tokens: DesignTokens): string {
  const { typography, spacing, color } = tokens;
  const { heading } = typography;

  const parts: string[] = [];

  // 全局
  parts.push(`/* === 全局排版 === */`);
  parts.push(
    `#wemd {`,
    `  font-family: ${typography.fontFamily};`,
    `  font-size: ${typography.fontSize};`,
    `  color: ${color.textNormal};`,
    `  line-height: ${typography.lineHeight};`,
    `  letter-spacing: ${typography.letterSpacing}px;`,
    `  padding: 0 ${spacing.pagePadding}px;`,
    `}`,
  );

  // 段落
  parts.push(`/* 段落 */`);
  parts.push(
    `#wemd p {`,
    `  font-size: ${typography.fontSize};`,
    `  margin: ${spacing.paragraphMargin}px 0;`,
    `  line-height: ${typography.lineHeight};`,
    `  color: ${color.textNormal};`,
    `}`,
  );

  // 列表
  parts.push(`/* 列表 */`);
  parts.push(
    `#wemd ul, #wemd ol { color: ${color.textNormal}; }`,
    `#wemd ul li { padding-left: 4px; }`,
    `#wemd li section {`,
    `  margin: 8px 0; line-height: ${typography.lineHeight};`,
    `  font-size: ${typography.fontSize}; color: ${color.textNormal};`,
    `}`,
    `#wemd ul li::marker, #wemd ol li::marker { color: ${color.primary}; }`,
  );

  // 标题
  const tags = ["h1", "h2", "h3", "h4"] as const;
  const headingExtras: string[] = [];

  for (const tag of tags) {
    const h = heading[tag];
    const preset = renderHeadingPreset(tag, h);

    parts.push(
      `#wemd ${tag} {`,
      `  font-size: ${h.fontSize}px;`,
      `  color: ${h.color};`,
      `  font-weight: ${h.fontWeight};`,
      `  margin-top: ${h.marginTop}px;`,
      `  margin-bottom: ${h.marginBottom}px;`,
      h.letterSpacing ? `  letter-spacing: ${h.letterSpacing}px;` : "",
      h.centered ? `  text-align: center;` : "",
      `}`,
    );

    if (preset.content) parts.push(preset.content);
    if (preset.extra) headingExtras.push(preset.extra);
  }

  // h5, h6 默认
  parts.push(
    `#wemd h5 { font-size: 16px; color: #5a6c7d; margin: 18px 0 8px; font-weight: 600; }`,
    `#wemd h6 { font-size: 15px; color: #7f8c8d; margin: 16px 0 8px; font-weight: 600; }`,
  );

  // 注入 heading extras（伪元素等）
  if (headingExtras.length) {
    parts.push(`/* heading extras */`, ...headingExtras);
  }

  return parts.filter(Boolean).join("\n");
}
