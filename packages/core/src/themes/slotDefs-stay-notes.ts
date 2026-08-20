/**
 * 民宿纪主题 - 主题级扩展槽位（STAY NOTES）
 *
 * - magazine-cover   封面图（body 首段图片）
 * - text-card        导语：引言小标（title 扩展槽）+ 正文（body 覆盖为 paragraph）
 * - image-caption    民宿卡字段拆分：imageUrl(图) / no(木牌编号) / title(店名) /
 *                    price(价格) / location(位置·含早·可住) / slogan(一句推荐) /
 *                    tags(标签) / body(推荐理由)
 */
import type { SlotDef } from "../plugins/component/slotTypes";

export const stayNotesSlotDefs: Record<string, SlotDef[]> = {
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
      semantic: "导语小标（首行，如「这一期挑房的标准」）",
      input: { source: "first-line", position: "first", cardinality: "one" },
    },
    {
      key: "body",
      type: "text",
      semantic: "导语正文",
      required: true,
      // 覆盖共享 body(source:all)：改用 paragraph 尊重 title 的消费，避免首行重复
      input: { source: "paragraph", position: "any", cardinality: "many" },
    },
  ],
  "image-caption": [
    {
      key: "imageUrl",
      type: "text",
      semantic: "民宿图 URL（首段图片，作 background-image 用）",
      input: { source: "image-url", position: "first", cardinality: "one" },
    },
    {
      key: "no",
      type: "text",
      semantic: "木牌编号（如 01）",
      input: {
        source: "first-line",
        position: "first",
        cardinality: "one",
        maxChars: 4,
      },
    },
    {
      key: "title",
      type: "text",
      semantic: "民宿店名",
      input: {
        source: "first-line",
        position: "any",
        cardinality: "one",
        maxChars: 20,
      },
    },
    {
      key: "price",
      type: "text",
      semantic: "价格（如 ¥428）",
      input: {
        source: "first-line",
        position: "any",
        cardinality: "one",
        maxChars: 12,
      },
    },
    {
      key: "slogan",
      type: "text",
      semantic: "一句推荐（如 睡到自然醒）",
      input: {
        source: "first-line",
        position: "any",
        cardinality: "optional",
        maxChars: 24,
      },
    },
    {
      key: "location",
      type: "text",
      semantic: "位置 / 含早 / 可住（如 云顶镇 半山腰 · 含双早）",
      input: {
        source: "first-line",
        position: "any",
        cardinality: "optional",
        maxChars: 60,
      },
    },
    {
      key: "tags",
      type: "text",
      semantic: "标签（如 #山景 #独立院子）",
      input: {
        source: "first-line",
        position: "any",
        cardinality: "optional",
      },
    },
    {
      key: "body",
      type: "text",
      semantic: "推荐理由",
      required: true,
      // 覆盖共享 body(source:all)：改用 paragraph 尊重 no/title/price/slogan/location/tags 的消费
      input: { source: "paragraph", position: "any", cardinality: "many" },
    },
  ],
};