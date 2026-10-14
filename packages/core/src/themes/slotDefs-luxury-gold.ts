/**
 * 黑金奢华主题 - 主题级扩展槽位（LUXURY GOLD）
 *
 * 通过 ThemeDefinition.slotDefs 声明，主题骨架可消费共享 slotDefs 之外的额外内容，
 * 其他主题未声明时内容降级到 desc/body 兜底，不丢数据。
 * - magazine-cover 封面图（body 首段图片）
 */
import type { SlotDef } from "../plugins/component/slotTypes";

export const luxuryGoldSlotDefs: Record<string, SlotDef[]> = {
  "magazine-cover": [
    {
      key: "image",
      type: "image",
      semantic: "封面图（body 首段图片）",
      input: { source: "image", position: "first", cardinality: "optional" },
    },
  ],
};
