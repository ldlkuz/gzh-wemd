/**
 * Slot 契约类型定义 —— 主程序内置默认真源
 *
 * 说明：本次只改主程序，registry（skill 层）不 Slot 化，
 * 因此组件 slot 定义在此内置为默认真源，供 slotParsers 使用。
 * 后续若 registry 升级为 Slot 结构，可从此处迁移。
 *
 * 命名约定：Slot class = `wemd-{abbr}-{slotkey}`
 * 例：quote-card（abbr=qc）的 quote 槽 → `wemd-qc-quote`
 */

/** Slot 类型 */
export type SlotType =
  | "text"
  | "image"
  | "list"
  | "number"
  | "code"
  | "decorative";

/** 单个 Slot 的输入识别规则（Input Contract） */
export interface SlotInputRule {
  /** 输入来源：段落 / 粗体 / 列表 / 图片 / 首行 / 末行 / 整块 */
  source:
    | "paragraph"
    | "strong"
    | "list"
    | "image"
    | "first-line"
    | "last-line"
    | "hr"
    | "block"
    | "all";
  /** 在来源中的位置：first / last / any */
  position?: "first" | "last" | "any";
  /** 数量：one / optional / many */
  cardinality?: "one" | "optional" | "many";
}

/** 单个 Slot 定义 */
export interface SlotDef {
  key: string;
  type: SlotType;
  semantic: string;
  required?: boolean;
  /**
   * 输入识别规则（Input Contract）。
   * 复杂组件（product-card 等）由 COMPLEX_PARSERS 专用函数解析整个原始内容，
   * 不按 Input Contract 分槽，故其 slot 可省略 input。
   */
  input?: SlotInputRule;
  /** list 类型时，条目的子字段 */
  item_slots?: { key: string; type: SlotType; semantic: string }[];
}

/** 组件 Slot 定义 */
export interface ComponentSlotDef {
  id: string;
  abbr: string;
  slots: SlotDef[];
  /** 是否专用渲染器（magazine 类），不走通用 body 兜底 */
  hasCustomRenderer?: boolean;
}

/** list Slot 的单个条目：字段名 → 已渲染 HTML */
export interface ListItem {
  [field: string]: string;
}

/** 分槽结果：slotKey → 标量 HTML，或 list 条目数组 */
export type SlotContent = Record<string, string | ListItem[]>;

/** 分槽结果（list 用，兼容旧名）：slotKey → 条目数组 */
export type SlotListContent = Record<string, ListItem[]>;
