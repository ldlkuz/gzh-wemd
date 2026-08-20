/**
 * 故事集主题 - 主题级扩展槽位（STORYBOOK）
 *
 * - magazine-cover   封面图（body 首段图片）
 * - text-card        引子标记（首行小标，如「引子」；无首行时省略 kicker）
 */
import type { SlotDef } from "../plugins/component/slotTypes";

export const storybookSlotDefs: Record<string, SlotDef[]> = {
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
      semantic: "引子标记（首行小标，无首行时省略）",
      input: { source: "first-line", position: "first", cardinality: "one" },
    },
    {
      key: "dropcap",
      type: "text",
      semantic: "首字下沉（正文首段第一个字符，红色大号）",
      input: { source: "first-char", position: "first", cardinality: "one" },
    },
    {
      key: "body",
      type: "text",
      semantic: "引子正文",
      required: true,
      // 覆盖共享 body(source:all)：改用 paragraph 使其尊重 title/dropcap 的消费，
      // 否则首行「引子」/首字符会在 body 里重复渲染（all 整块渲染无视消费）
      input: { source: "paragraph", position: "any", cardinality: "many" },
    },
  ],
  // end-card：完（title）+ 后记标题（heading）+ 后记正文（subtitle）
  // 覆盖共享槽控制消费顺序：title→heading→subtitle 依次取首行
  "end-card": [
    {
      key: "title",
      type: "text",
      semantic: "结尾标记（首行，如「完」）",
      required: true,
      input: { source: "first-line", position: "first", cardinality: "one" },
    },
    {
      key: "heading",
      type: "text",
      semantic: "后记标题（完 之后的大字标题，如「后记」）",
      // maxChars=6：只认短行标题，长正文不会被吞（无标题时正文仍落 subtitle）
      input: {
        source: "first-line",
        position: "any",
        cardinality: "optional",
        maxChars: 6,
      },
    },
    {
      key: "subtitle",
      type: "text",
      semantic: "后记正文",
      input: { source: "first-line", position: "any", cardinality: "optional" },
    },
  ],
};
