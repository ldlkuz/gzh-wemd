/**
 * 好物种草主题 - 主题级扩展槽位（SHOPPING GUIDE）
 *
 * - magazine-cover   封面图（body 首段图片）
 * - text-card        引言：kicker（title 扩展槽）+ 正文（body 覆盖为 paragraph）
 * - image-caption    好物卡字段拆分：number(编号) / title(名称) / price(价格) / body(理由)
 */
import type { SlotDef } from "../plugins/component/slotTypes";

export const shoppingGuideSlotDefs: Record<string, SlotDef[]> = {
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
  "text-card": [
    {
      key: "title",
      type: "text",
      semantic: "引言小标（首行，如「筛选标准 · STANDARD」）",
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
  "image-caption": [
    {
      key: "imageUrl",
      type: "text",
      semantic: "好物图 URL（首段图片，作 background-image 用）",
      input: {
        source: "image-url",
        position: "first",
        cardinality: "one",
      },
    },
    {
      key: "number",
      type: "text",
      semantic: "编号标签（如 01 · 光线）",
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
      semantic: "好物名称",
      input: {
        source: "first-line",
        position: "any",
        cardinality: "one",
        maxChars: 12,
      },
    },
    {
      key: "price",
      type: "text",
      semantic: "价格（如 ¥299）",
      input: {
        source: "first-line",
        position: "any",
        cardinality: "one",
        maxChars: 12,
      },
    },
    {
      key: "body",
      type: "text",
      semantic: "推荐理由",
      required: true,
      // 覆盖共享 body(source:all)：改用 paragraph 尊重 number/title/price 的消费
      input: { source: "paragraph", position: "any", cardinality: "many" },
    },
  ],
};
