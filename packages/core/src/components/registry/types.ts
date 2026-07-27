/**
 * 组件注册系统类型定义
 */

/** 组件 manifest */
export interface ComponentManifest {
  type: string;
  variant: string;
  version: string;
  label: string;
  description: string;
  author: string;
  category: string;
  semantic: string;
  intent: string;
  tags?: string[];
  tone?: string[];
  articleCategories?: string[];
  insertPosition?: string[];
  magazineLevel?: string[];
  schema?: Record<string, unknown>;
  props?: Record<string, unknown>;
}

/** 组件包 = manifest + CSS */
export interface ComponentPackage {
  manifest: ComponentManifest;
  css: string;
}

/** 组件变体简要信息 */
export interface ComponentVariant {
  type: string;
  variant: string;
  label: string;
  description: string;
  category: string;
  semantic: string;
  intent: string;
  tags: string[];
  tone: string[];
  author: string;
}
