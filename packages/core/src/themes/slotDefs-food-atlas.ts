/**
 * 美食图谱主题 - 主题级扩展槽位（FOOD ATLAS）
 *
 * - magazine-cover   封面图（body 首段图片）
 * - image-caption    美食卡字段拆分：number(排名) / title(菜名) / location(门店) / tags(标签) / body(描述)
 */
import type { SlotDef } from "../plugins/component/slotTypes";

export const foodAtlasSlotDefs: Record<string, SlotDef[]> = {
  "text-card": [
    {
      key: "title",
      type: "text",
      semantic: "引言小标（首行，如「本周精选 · PICKS」）",
      input: { source: "first-line", position: "first", cardinality: "one" },
    },
    {
      key: "body",
      type: "text",
      semantic: "引言正文",
      required: true,
      // 覆盖共享 body(source:all)：改用 paragraph 尊重 title 的消费，避免首行重复
      input: { source: "paragraph", position: "any", cardinality: "many" },
    },
  ],
  "magazine-cover": [
    {
      key: "imageUrl",
      type: "text",
      semantic: "封面图 URL（body 首段图片，作 background-image 用）",
      input: {
        source: "image-url",
        position: "first",
        cardinality: "optional",
      },
    },
  ],
  "image-caption": [
    {
      key: "imageUrl",
      type: "text",
      semantic: "美食图 URL（首段图片，作 background-image 用）",
      input: { source: "image-url", position: "first", cardinality: "one" },
    },
    {
      key: "number",
      type: "text",
      semantic: "排名徽章（如 TOP 1）",
      input: {
        source: "first-line",
        position: "first",
        cardinality: "one",
        maxChars: 12,
      },
    },
    {
      key: "title",
      type: "text",
      semantic: "菜名 / 店名",
      input: {
        source: "first-line",
        position: "any",
        cardinality: "one",
        maxChars: 20,
      },
    },
    {
      key: "location",
      type: "text",
      semantic: "门店 / 厨师",
      input: {
        source: "first-line",
        position: "any",
        cardinality: "optional",
        maxChars: 20,
      },
    },
    {
      key: "tags",
      type: "text",
      semantic: "标签（如 #日式 #浓汤）",
      input: {
        source: "first-line",
        position: "any",
        cardinality: "optional",
      },
    },
    {
      key: "body",
      type: "text",
      semantic: "推荐描述",
      required: true,
      // 覆盖共享 body(source:all)：改用 paragraph 尊重 number/title/location/tags 的消费
      input: { source: "paragraph", position: "any", cardinality: "many" },
    },
  ],
};