/**
 * 内置主题定义
 * 提取自 editorStore.ts，集中管理所有预设主题
 *
 * Phase 3 升级：12 个内置主题全部走 ThemeDefinition → renderTheme 结构化渲染管线，
 * 不再用 legacy buildThemeCss() 拼接字符串。ThemeDefinition 的 layout/tokens/components 全面生效。
 */
import { getBuiltInThemeDefinition, renderTheme } from "@wemd/core";

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

/** 12 个内置主题的 ID 顺序 */
const BUILTIN_THEME_ORDER: Array<{ id: string; name: string }> = [
  { id: "default", name: "默认主题" },
  { id: "data-blueprint", name: "数据蓝图" },
  { id: "eastern-notes", name: "东方笺谱" },
  { id: "clear-guide", name: "清晰指南" },
  { id: "whitespace-gallery", name: "留白画册" },
  { id: "academic-paper", name: "学术论文" },
  { id: "knowledge-base", name: "知识库" },
  { id: "luxury-gold", name: "黑金奢华" },
  { id: "morandi-forest", name: "莫兰迪森林" },
  { id: "modern-editorial", name: "编辑部手记" },
  { id: "receipt", name: "购物小票" },
  { id: "sunset-film", name: "落日胶片" },
];

/**
 * 构建单个内置主题：ThemeDefinition → renderTheme 生成 CSS
 * definition 和 css 字段同源，消除 legacy CSS / structured JSON 双轨不一致。
 */
function buildBuiltInTheme(id: string, name: string): CustomTheme {
  const definition = getBuiltInThemeDefinition(id);
  if (!definition) {
    // 防御性兜底：BUILTIN_THEME_ORDER 中 12 个 id 都在 builtin-themes/index.ts 有对应项
    throw new Error(`内置主题缺失：${id}`);
  }
  const css = renderTheme(definition);
  const now = new Date().toISOString();
  return {
    id,
    name,
    css,
    definition,
    isBuiltIn: true,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * 内置主题列表
 */
export const builtInThemes: CustomTheme[] = BUILTIN_THEME_ORDER.map((t) =>
  buildBuiltInTheme(t.id, t.name),
);

/**
 * 默认主题列表（向后兼容格式）
 */
export const defaultThemes: LegacyThemeDefinition[] = [
  {
    id: "default",
    name: "默认主题",
    css: builtInThemes[0].css,
  },
];

/**
 * 获取默认主题 CSS
 */
export function getDefaultThemeCSS(): string {
  return builtInThemes[0].css;
}
