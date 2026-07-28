/**
 * Theme Schema —— 主题定义的类型系统
 *
 * 一个 Theme 是四层结构化数据：
 *   1. Meta — 主题元信息
 *   2. DesignToken — 设计语言（颜色/字体/间距/边框/阴影）
 *   3. ComponentStyle — 每个组件在主题下的视觉覆盖
 *   4. LayoutPreference — 给 AI 的排版建议
 *
 * Theme JSON → ThemeRenderer → CSS
 */
// ============================================================
// Layer 1: Meta
// ============================================================

export interface ThemeMeta {
  /** 唯一标识符，如 "default"、"tech-blue" */
  id: string;
  /** 显示名称 */
  name: string;
  /** 一句话描述 */
  description: string;
  /** 搜索关键词 */
  keywords: string[];
  /** 语义版本号 */
  version: string;
}

// ============================================================
// Layer 2: Design Token
// ============================================================

export interface DesignTokens {
  color: ColorTokens;
  typography: TypographyTokens;
  spacing: SpacingTokens;
  border: BorderTokens;
  shadow: ShadowTokens;
}

export interface ColorTokens {
  /** 主色 */
  primary: string;
  /** 主色深色（hover/强调） */
  primaryDark: string;
  /** 主色浅色（背景/装饰） */
  primaryLight: string;
  /** 辅助色（次要强调/标签） */
  secondary: string;
  /** 点缀色（高亮数字/重点图标） */
  accent: string;
  /** 页面背景（不设置则透明，微信兼容） */
  background: string;
  /** 柔和背景 */
  bgSoft: string;
  /** 卡片背景 */
  bgCard: string;
  /** 灰背景 */
  bgMuted: string;
  /** 强文字色 */
  textStrong: string;
  /** 普通文字色 */
  textNormal: string;
  /** 弱文字色 */
  textSoft: string;
  /** 边框色 */
  border: string;
  /** 柔和边框（卡片内分隔等） */
  borderSoft: string;
}

export interface TypographyTokens {
  /** 正文字体族 */
  fontFamily: string;
  /** 正文字号（如 "16px"） */
  fontSize: string;
  /** 正文行高 */
  lineHeight: string;
  /** 字间距 */
  letterSpacing: number;
  /** 四级标题 */
  heading: {
    h1: HeadingToken;
    h2: HeadingToken;
    h3: HeadingToken;
    h4: HeadingToken;
  };
  /** 代码字体族 */
  codeFontFamily: string;
}

export interface HeadingToken {
  fontSize: number;
  color: string;
  marginTop: number;
  marginBottom: number;
  fontWeight: string;
  /** 预设样式 ID */
  preset?: string;
  /** 预设样式的边框/背景色（默认使用 color） */
  presetColor?: string;
  centered?: boolean;
  letterSpacing?: number;
}

export interface SpacingTokens {
  /** 页面内边距 */
  pagePadding: number;
  /** 段落间距 */
  paragraphMargin: number;
}

export interface BorderTokens {
  /** 通用圆角 */
  radius: number;
}

export interface ShadowTokens {
  /** 是否启用阴影 */
  enabled: boolean;
  /** 阴影 CSS 值 */
  value: string;
}

// ============================================================
// Layer 3: Component Style
// ============================================================

/** 单个组件在主题下的视觉覆盖 */
export interface ComponentStyleOverride {
  /** 是否在此主题中启用（false = AI 不推荐，但渲染不报错） */
  enabled: boolean;
  /** 选用的变体 ID，如 share-card 的 "warm" / "minimal" / "tech" */
  variant?: string;
  /** 覆盖的 CSS 声明（可选，用于精细化控制） */
  overrides?: Record<string, string>;
}

// ============================================================
// Layer 4: Layout Preference
// ============================================================

/** 给 AI 的排版建议 */
export interface LayoutPreference {
  /** 偏好组件清单（组件 type 列表） */
  preferredComponents: string[];
  /** 排版密度 */
  density: "low" | "medium" | "high";
  /** 风格基调 */
  tone: string[];
  /** 杂志化等级 */
  magazineLevel: "low" | "medium" | "high";
}

// ============================================================
// 完整主题定义
// ============================================================

export interface ThemeDefinition {
  meta: ThemeMeta;
  tokens: DesignTokens;
  components: Record<string, ComponentStyleOverride>;
  layout: LayoutPreference;
  /** 代码高亮主题：github（亮色）/ github-dark（暗色） */
  codeTheme?: "github" | "github-dark";
}
