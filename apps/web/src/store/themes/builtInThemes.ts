/**
 * 内置主题定义
 * 提取自 editorStore.ts，集中管理所有预设主题
 */
import {
  basicTheme,
  codeGithubDarkTheme,
  customDefaultTheme,
  codeGithubTheme,
  clearGuideTheme,
  dataBlueprintTheme,
  easternNotesTheme,
  academicPaperTheme,
  knowledgeBaseTheme,
  luxuryGoldTheme,
  morandiForestTheme,
  modernEditorialTheme,
  receiptTheme,
  sunsetFilmTheme,
  whitespaceGalleryTheme,
  componentStylesDefault,
  componentStylesExtra,
  componentStylesFaq,
  componentStylesMagazine,
  getThemeVars,
  globalDefaultVars,
  getVariantCss,
  getBuiltInThemeDefinition,
} from "@wemd/core";

// 从 ThemeDesigner 导入共享类型（解决类型重复定义问题）
import type {
  DesignerVariables,
  HeadingStyle,
} from "../../components/Theme/ThemeDesigner/types";
import type { ThemeDefinition } from "@wemd/core";
export type { DesignerVariables, HeadingStyle };
export type { ThemeDefinition };

/**
 * 自定义主题接口
 */
export interface CustomTheme {
  id: string;
  name: string;
  css: string;
  isBuiltIn: boolean;
  /** 是否允许用户主动选择；设为 false 的内置主题仅用于兼容历史文章 */
  isSelectable?: boolean;
  createdAt: string;
  updatedAt: string;
  /** 编辑模式：创建时确定，不可更改。AI 生成模式产物为 CSS,保存为 "css" */
  editorMode?: "visual" | "css";
  /** 可视化设计器变量，仅 visual 模式存在 */
  designerVariables?: DesignerVariables;
  /** 主题定义（Phase 2 新增，有则走 renderTheme 渲染管线） */
  definition?: ThemeDefinition;
}

/**
 * 旧版主题定义接口（向后兼容）
 */
export interface LegacyThemeDefinition {
  id: string;
  name: string;
  css: string;
}

export const isThemeSelectable = (theme: CustomTheme): boolean =>
  theme.isSelectable !== false;

/**
 * 构建主题 CSS：基础样式 + 主题样式 + 代码主题 + 该主题色变量 + 组件样式
 *
 * 组件样式（componentStylesDefault）通过 var(--wemd-*) 引用主题色变量，
 * 实现组件配色跟随主题。
 *
 * 主题色变量的来源有两种（二选一，避免重复定义）：
 * 1. 主题 CSS 自带变量定义（在 #wemd 块里声明 --wemd-*）—— 变量是唯一数据源，最贴合
 * 2. theme-variables.ts 兜底注入 —— 用于尚未改造的主题
 */
function buildThemeCss(
  themeId: string,
  themeSpecific: string,
  codeTheme: string,
): string {
  // 检测主题 CSS 是否已自带 --wemd-primary 变量定义
  const hasOwnVars = themeSpecific.includes("--wemd-primary:");
  return [
    basicTheme,
    themeSpecific,
    codeTheme,
    hasOwnVars ? "" : getThemeVars(themeId), // 主题自带变量则不重复注入
    componentStylesDefault,
    componentStylesExtra,
    componentStylesFaq,
    componentStylesMagazine,
    getVariantCss(), // 组件 variant CSS
  ]
    .filter(Boolean)
    .join("\n");
}

/**
 * 内置主题列表
 */
export const builtInThemes: CustomTheme[] = [
  {
    id: "default",
    name: "默认主题",
    css: buildThemeCss("default", customDefaultTheme, codeGithubTheme),
    definition: getBuiltInThemeDefinition("default"),
    isBuiltIn: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "data-blueprint",
    name: "数据蓝图",
    css: buildThemeCss(
      "data-blueprint",
      dataBlueprintTheme,
      codeGithubDarkTheme,
    ),
    definition: getBuiltInThemeDefinition("data-blueprint"),
    isBuiltIn: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "eastern-notes",
    name: "东方笺谱",
    css: buildThemeCss("eastern-notes", easternNotesTheme, codeGithubDarkTheme),
    definition: getBuiltInThemeDefinition("eastern-notes"),
    isBuiltIn: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "clear-guide",
    name: "清晰指南",
    css: buildThemeCss("clear-guide", clearGuideTheme, codeGithubDarkTheme),
    definition: getBuiltInThemeDefinition("clear-guide"),
    isBuiltIn: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "whitespace-gallery",
    name: "留白画册",
    css: buildThemeCss(
      "whitespace-gallery",
      whitespaceGalleryTheme,
      codeGithubDarkTheme,
    ),
    definition: getBuiltInThemeDefinition("whitespace-gallery"),
    isBuiltIn: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "academic-paper",
    name: "学术论文",
    css: buildThemeCss("academic-paper", academicPaperTheme, codeGithubTheme),
    definition: getBuiltInThemeDefinition("academic-paper"),
    isBuiltIn: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "knowledge-base",
    name: "知识库",
    css: buildThemeCss("knowledge-base", knowledgeBaseTheme, codeGithubTheme),
    definition: getBuiltInThemeDefinition("knowledge-base"),
    isBuiltIn: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "luxury-gold",
    name: "黑金奢华",
    css: buildThemeCss("luxury-gold", luxuryGoldTheme, codeGithubTheme),
    definition: getBuiltInThemeDefinition("luxury-gold"),
    isBuiltIn: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "morandi-forest",
    name: "莫兰迪森林",
    css: buildThemeCss("morandi-forest", morandiForestTheme, codeGithubTheme),
    definition: getBuiltInThemeDefinition("morandi-forest"),
    isBuiltIn: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "modern-editorial",
    name: "编辑部手记",
    css: buildThemeCss(
      "modern-editorial",
      modernEditorialTheme,
      codeGithubDarkTheme,
    ),
    definition: getBuiltInThemeDefinition("modern-editorial"),
    isBuiltIn: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "receipt",
    name: "购物小票",
    css: buildThemeCss("receipt", receiptTheme, codeGithubTheme),
    definition: getBuiltInThemeDefinition("receipt"),
    isBuiltIn: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "sunset-film",
    name: "落日胶片",
    css: buildThemeCss("sunset-film", sunsetFilmTheme, codeGithubTheme),
    definition: getBuiltInThemeDefinition("sunset-film"),
    isBuiltIn: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "sunset-film",
    name: "落日胶片",
    css: buildThemeCss("sunset-film", sunsetFilmTheme, codeGithubTheme),
    definition: getBuiltInThemeDefinition("sunset-film"),
    isBuiltIn: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

/**
 * 默认主题列表（向后兼容格式）
 */
export const defaultThemes: LegacyThemeDefinition[] = [
  {
    id: "default",
    name: "默认主题",
    css: buildThemeCss("default", customDefaultTheme, codeGithubTheme),
  },
];

/**
 * 获取默认主题 CSS
 */
export function getDefaultThemeCSS(): string {
  return builtInThemes[0].css;
}

// 全局默认色变量（导出供需要 :root fallback 的地方使用）
export { globalDefaultVars };
