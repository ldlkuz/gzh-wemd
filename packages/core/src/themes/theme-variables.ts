/**
 * 主题色变量定义 —— 为每套主题定义 --wemd-* CSS 变量
 *
 * 组件样式（components-default.ts）通过 var(--wemd-*) 引用这些变量，
 * 实现组件配色跟随主题。
 *
 * 变量清单（扩展版，对齐 theme-factory 4 色体系）：
 * - --wemd-primary / --wemd-primary-dark / --wemd-primary-light（主色三阶）
 * - --wemd-secondary（辅助色：用于次要强调、标签、装饰元素）
 * - --wemd-accent（点缀色：用于高亮数字、重点图标、小面积吸引眼球）
 * - --wemd-bg-soft / --wemd-bg-card / --wemd-bg-muted（三级背景）
 * - --wemd-text-strong / --wemd-text-normal / --wemd-text-soft（三级文字）
 * - --wemd-border
 *
 * 向后兼容：未定义新变量的主题会 fallback 到默认值（基于 primary 推导）
 */

/** 默认主题色变量（微信绿，未定义变量的主题会自动 fallback 到这些值） */
const defaultVars = `:root {
  /* 主色三阶 */
  --wemd-primary: #07c160;
  --wemd-primary-dark: #0a8f4a;
  --wemd-primary-light: #d1fae5;
  /* 辅助色 + 点缀色（默认基于主色推导） */
  --wemd-secondary: #0a8f4a;
  --wemd-accent: #07c160;
  /* 三级背景 */
  --wemd-bg-soft: #f7f8fa;
  --wemd-bg-card: #ffffff;
  --wemd-bg-muted: #f1f5f9;
  /* 三级文字 */
  --wemd-text-strong: #1a1a1a;
  --wemd-text-normal: #334155;
  --wemd-text-soft: #475569;
  /* 边框 */
  --wemd-border: #e2e8f0;
}`;

/**
 * 每套主题的色变量定义（在 #wemd 作用域内）
 *
 * 设计原则：
 * - 只在 #wemd 作用域内定义，不影响全局
 * - 每套主题提供 7 个变量，与组件样式一一对应
 * - 颜色取自各主题 CSS 中已使用的主色，保持视觉一致
 */
const themeVars: Record<string, string> = {
  // 默认主题（微信绿）
  default: `#wemd {
  --wemd-primary: #07c160;
  --wemd-primary-dark: #0a8f4a;
  --wemd-primary-light: #d1fae5;
  --wemd-bg-soft: #f7f8fa;
  --wemd-bg-card: #ffffff;
  --wemd-bg-muted: #f0fdf4;
  --wemd-accent: #07c160;
  --wemd-text-strong: #1a1a1a;
  --wemd-text-normal: #334155;
  --wemd-text-soft: #475569;
  --wemd-border: #e2e8f0;
  --wemd-border-soft: #f0f0f0;
}`,

  // 数据蓝图（科技蓝）
  "data-blueprint": `#wemd {
  --wemd-primary: #3b82f6;
  --wemd-primary-dark: #1e40af;
  --wemd-primary-light: #dbeafe;
  --wemd-bg-soft: #f0f7ff;
  --wemd-bg-card: #ffffff;
  --wemd-bg-muted: #eff6ff;
  --wemd-accent: #2563eb;
  --wemd-text-strong: #1e3a5f;
  --wemd-text-normal: #334155;
  --wemd-text-soft: #475569;
  --wemd-border: #c7d9ec;
  --wemd-border-soft: #e8edf3;
}`,

  // 东方笺谱（朱砂红）
  "eastern-notes": `#wemd {
  --wemd-primary: #c1272d;
  --wemd-primary-dark: #8b1a1f;
  --wemd-primary-light: #f5d7d7;
  --wemd-bg-soft: #faf3e8;
  --wemd-bg-card: #fffbf5;
  --wemd-bg-muted: #fdf2f2;
  --wemd-accent: #d4393f;
  --wemd-text-strong: #3a2a1f;
  --wemd-text-normal: #5a4a3f;
  --wemd-text-soft: #6b5b4a;
  --wemd-border: #e5d5b8;
  --wemd-border-soft: #ede0cc;
}`,

  // 清晰指南（薄荷绿）
  "clear-guide": `#wemd {
  --wemd-primary: #10b981;
  --wemd-primary-dark: #047857;
  --wemd-primary-light: #d1fae5;
  --wemd-bg-soft: #f0fdf4;
  --wemd-bg-card: #ffffff;
  --wemd-bg-muted: #ecfdf5;
  --wemd-accent: #059669;
  --wemd-text-strong: #064e3b;
  --wemd-text-normal: #374151;
  --wemd-text-soft: #4b5563;
  --wemd-border: #d1d5db;
  --wemd-border-soft: #e5e7eb;
}`,

  // 留白画册（极简灰）
  "whitespace-gallery": `#wemd {
  --wemd-primary: #1f2937;
  --wemd-primary-dark: #111827;
  --wemd-primary-light: #e5e7eb;
  --wemd-bg-soft: #fafafa;
  --wemd-bg-card: #ffffff;
  --wemd-bg-muted: #f3f4f6;
  --wemd-accent: #374151;
  --wemd-text-strong: #111827;
  --wemd-text-normal: #4b5563;
  --wemd-text-soft: #6b7280;
  --wemd-border: #e5e7eb;
  --wemd-border-soft: #f3f4f6;
}`,

  // 学术论文（深蓝学术）
  "academic-paper": `#wemd {
  --wemd-primary: #1e3a8a;
  --wemd-primary-dark: #1e3a8a;
  --wemd-primary-light: #dbeafe;
  --wemd-bg-soft: #f8fafc;
  --wemd-bg-card: #ffffff;
  --wemd-bg-muted: #f1f5f9;
  --wemd-accent: #2563eb;
  --wemd-text-strong: #0f172a;
  --wemd-text-normal: #334155;
  --wemd-text-soft: #475569;
  --wemd-border: #cbd5e1;
  --wemd-border-soft: #e2e8f0;
}`,

  // 知识库（沉稳蓝）
  "knowledge-base": `#wemd {
  --wemd-primary: #2563eb;
  --wemd-primary-dark: #1e40af;
  --wemd-primary-light: #dbeafe;
  --wemd-bg-soft: #f1f5f9;
  --wemd-bg-card: #ffffff;
  --wemd-bg-muted: #eff6ff;
  --wemd-accent: #1d4ed8;
  --wemd-text-strong: #0f172a;
  --wemd-text-normal: #334155;
  --wemd-text-soft: #475569;
  --wemd-border: #e2e8f0;
  --wemd-border-soft: #e2e8f0;
}`,

  // 黑金奢华（金色 · 深色主题）
  "luxury-gold": `#wemd {
  --wemd-primary: #d4af37;
  --wemd-primary-dark: #a67c00;
  --wemd-primary-light: #fef3c7;
  --wemd-bg-soft: #1a1a1a;
  --wemd-bg-card: #252525;
  --wemd-bg-muted: #2d2d1f;
  --wemd-accent: #e6c44d;
  --wemd-text-strong: #d4af37;
  --wemd-text-normal: #c4b998;
  --wemd-text-soft: #a8a29e;
  --wemd-border: #3a3a3a;
  --wemd-border-soft: #444444;
}`,

  // 莫兰迪森林（雾霾绿）
  "morandi-forest": `#wemd {
  --wemd-primary: #6b8e7f;
  --wemd-primary-dark: #4a6b5c;
  --wemd-primary-light: #d4e0d8;
  --wemd-bg-soft: #f5f3f0;
  --wemd-bg-card: #fafaf7;
  --wemd-bg-muted: #eef0eb;
  --wemd-accent: #5d7d6e;
  --wemd-text-strong: #3a4a42;
  --wemd-text-normal: #5a6560;
  --wemd-text-soft: #6b7568;
  --wemd-border: #d4d0c8;
  --wemd-border-soft: #e2e0d8;
}`,

  // 编辑部手记（复古棕）
  "modern-editorial": `#wemd {
  --wemd-primary: #92400e;
  --wemd-primary-dark: #78350f;
  --wemd-primary-light: #fef3c7;
  --wemd-bg-soft: #fdf6e3;
  --wemd-bg-card: #fefcf5;
  --wemd-bg-muted: #fef9ee;
  --wemd-accent: #b45309;
  --wemd-text-strong: #1c1917;
  --wemd-text-normal: #44403c;
  --wemd-text-soft: #57534e;
  --wemd-border: #e7e5e4;
  --wemd-border-soft: #ede9e3;
}`,

  // 购物小票（极简黑白）
  receipt: `#wemd {
  --wemd-primary: #404040;
  --wemd-primary-dark: #171717;
  --wemd-primary-light: #e5e5e5;
  --wemd-bg-soft: #fafafa;
  --wemd-bg-card: #ffffff;
  --wemd-bg-muted: #f5f5f5;
  --wemd-accent: #525252;
  --wemd-text-strong: #171717;
  --wemd-text-normal: #404040;
  --wemd-text-soft: #525252;
  --wemd-border: #d4d4d4;
  --wemd-border-soft: #e5e5e5;
}`,

  // 落日胶片（暖橙）
  "sunset-film": `#wemd {
  --wemd-primary: #ea580c;
  --wemd-primary-dark: #c2410c;
  --wemd-primary-light: #fed7aa;
  --wemd-bg-soft: #fff7ed;
  --wemd-bg-card: #fffbf8;
  --wemd-bg-muted: #fff2e6;
  --wemd-accent: #f97316;
  --wemd-text-strong: #7c2d12;
  --wemd-text-normal: #6b3a1f;
  --wemd-text-soft: #78350f;
  --wemd-border: #fde0c4;
  --wemd-border-soft: #fce4cc;
}`,
};

/**
 * 获取指定主题的色变量 CSS
 * @param themeId 主题 ID
 * @returns CSS 字符串（含 #wemd 作用域的变量定义）
 */
export function getThemeVars(themeId: string): string {
  return themeVars[themeId] || defaultVars;
}

/**
 * 全局默认色变量（在 :root 定义，作为最终 fallback）
 */
export const globalDefaultVars = defaultVars;

/**
 * 所有主题色变量定义（用于注入到主题 CSS 头部）
 *
 * 输出格式：每套主题的变量定义拼接成一个字符串，
 * 由 builtInThemes.ts 在构造主题 CSS 时插入到主题 CSS 末尾。
 */
export const allThemeVars = Object.entries(themeVars)
  .map(([, css]) => css)
  .join("\n\n");
