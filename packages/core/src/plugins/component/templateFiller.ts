/**
 * 模板填充器 —— 把 Slot 内容填入组件骨架模板
 *
 * 支持 Mustache 子集（仅 4 个语法，零编译）：
 * - `{{slot:key}}`      填入单个 Slot 内容（text/image/number）
 * - `{{#each slotKey}}...{{/each}}`  遍历 list Slot
 * - `{{this.field}}`    在 each 内取条目的子字段
 * - `{{#if key}}...{{/if}}`  条件渲染：key 存在且有非空内容时才输出（支持空标题/空段隐藏）
 *
 * 无 Slot 定义、内容缺失时输出空字符串，不抛错。
 */

/** 单值 Slot 内容 */
export type ScalarSlot = string;

/** list Slot 内容：条目数组 */
export interface ListItem {
  [field: string]: string;
}

/** 填充数据：slotKey → 标量内容 或 条目数组 */
export type TemplateData = Record<string, string | ListItem[]>;

/** 手写正则：匹配 `{{slot:key}}`（全局替换所有占位符） */
const SLOT_RE = /\{\{slot:([a-zA-Z0-9_-]+)\}\}/g;
/** 手写正则：匹配 `{{#each key}}...{{/each}}`（非贪婪，不支持嵌套 each） */
const EACH_RE = /\{\{#each ([a-zA-Z0-9_-]+)\}\}([\s\S]*?)\{\{\/each\}\}/;
/** 手写正则：匹配 `{{#if key}}...{{/if}}`（全局替换，支持多个非嵌套 if 块） */
const IF_RE = /\{\{#if ([a-zA-Z0-9_-]+)\}\}([\s\S]*?)\{\{\/if\}\}/g;
/** 手写正则：匹配 `{{this.field}}` */
const THIS_FIELD_RE = /\{\{this\.([a-zA-Z0-9_-]+)\}\}/g;

/**
 * 填充模板
 *
 * @param template  骨架模板字符串
 * @param data      slotKey → 内容（标量或条目数组）
 * @returns 填充后的 HTML
 */
export function fillTemplate(template: string, data: TemplateData): string {
  if (!template) return "";

  let out = template;

  // 1. 处理 each 块（先处理，避免与 slot 占位冲突）
  out = out.replace(EACH_RE, (_full, key: string, inner: string) => {
    const value = data[key];
    if (!Array.isArray(value)) return "";
    return value
      .map((item) => fillListItem(inner, item))
      .join("")
      .trim();
  });

  // 2. 处理 if 块：key 有非空内容时才保留内部模板（内部 slot 占位后续统一填充）
  out = out.replace(IF_RE, (_full, key: string, inner: string) => {
    const value = data[key];
    const present =
      typeof value === "string"
        ? value.trim().length > 0
        : Array.isArray(value)
          ? value.length > 0
          : false;
    return present ? inner : "";
  });

  // 3. 处理剩余 slot 占位符
  out = out.replace(SLOT_RE, (_full, key: string) => {
    const value = data[key];
    if (typeof value !== "string") return "";
    return value;
  });

  return out.trim();
}

/**
 * 填充 each 的一个条目：替换 inner 中的 {{this.field}}
 */
function fillListItem(template: string, item: ListItem): string {
  return template.replace(THIS_FIELD_RE, (_full, field: string) => {
    const value = item[field];
    return typeof value === "string" ? value : "";
  });
}

/**
 * 深拷贝模板数据（防外部修改）
 */
export function cloneTemplateData(data: TemplateData): TemplateData {
  const result: TemplateData = {};
  for (const [key, value] of Object.entries(data)) {
    if (Array.isArray(value)) {
      result[key] = value.map((item) => ({ ...item }));
    } else {
      result[key] = value;
    }
  }
  return result;
}
