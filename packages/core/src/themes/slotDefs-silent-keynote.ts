/**
 * 无声发布主题 - 主题级扩展槽位（SILENT KEYNOTE）
 *
 * 通过 ThemeDefinition.slotDefs 声明，主题骨架可消费共享 slotDefs 之外的额外内容，
 * 其他主题未声明时内容降级到 desc/body 兜底，不丢数据。
 * - magazine-cover   封面图（body 首段图片）
 * - numbered-heading 章节编号拆分（## 01 引言 → 01 + 引言）
 * - section-title    章节编号拆分（兼容无编号标题）
 */
import type { SlotDef } from "../plugins/component/slotTypes";

export const silentKeynoteSlotDefs: Record<string, SlotDef[]> = {
  "magazine-cover": [
    {
      key: "image",
      type: "image",
      semantic: "封面图（body 首段图片）",
      input: { source: "image", position: "first", cardinality: "optional" },
    },
  ],
  "numbered-heading": [
    {
      key: "part",
      type: "text",
      semantic: "编号（行首数字前缀）",
      input: { source: "number-prefix", position: "first", cardinality: "one" },
    },
    {
      key: "body",
      type: "text",
      semantic: "标题（去掉编号的剩余文本）",
      input: { source: "paragraph", position: "any", cardinality: "many" },
    },
  ],
  "section-title": [
    {
      key: "part",
      type: "text",
      semantic: "编号（行首数字前缀，无编号时省略）",
      input: { source: "number-prefix", position: "first", cardinality: "one" },
    },
    {
      key: "body",
      type: "text",
      semantic: "标题（去掉编号的剩余文本）",
      input: { source: "paragraph", position: "any", cardinality: "many" },
    },
  ],
};
