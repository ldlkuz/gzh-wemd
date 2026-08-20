/**
 * 组件级规则表 —— AI 排版阶段2 提炼规则的统一来源
 *
 * 放开 pattern 槽位约束后，slotPlan 由 AI 从用户勾选的组件中自由生成，
 * 每个组件的提炼规则不再依赖某个 pattern 的槽位定义，统一在此维护。
 * 与 AVAILABLE_COMPONENTS / CONTENT_DRIVEN / POSITION_DRIVEN 同步维护。
 */
export interface ComponentRule {
  /** 组件 id */
  id: string;
  /** 中文名（展示用） */
  label: string;
  /** 适合插入的区段（head 开头 / body 中段 / tail 结尾） */
  sections: Array<"head" | "body" | "tail">;
  /** 内容提炼规则（指导 AI 填充 body；位置驱动组件以定位为主） */
  extractRule: string;
}

export const COMPONENT_RULES: Record<string, ComponentRule> = {
  // ============ 内容驱动：需从原文提炼，禁编造 ============
  "hero-banner": {
    id: "hero-banner",
    label: "顶部头图",
    sections: ["head"],
    extractRule: "第一段为文章主标题（可精炼），第二段为氛围副标题（点明内容内核）",
  },
  "magazine-cover": {
    id: "magazine-cover",
    label: "杂志封面",
    sections: ["head"],
    extractRule:
      "第一段为主标题，第二段为英文/短副标题，分隔线后为导读描述",
  },
  "toc-nav": {
    id: "toc-nav",
    label: "目录导航",
    sections: ["head"],
    extractRule:
      "从文章提取章节标题组织成有序列表。第一段写'目录'，列表项为各章节名",
  },
  "quote-card": {
    id: "quote-card",
    label: "金句卡片",
    sections: ["body"],
    extractRule: "提炼原文关键金句。props 设 author 为原文提到的人物（禁虚构）",
  },
  "full-quote": {
    id: "full-quote",
    label: "整行引用",
    sections: ["body"],
    extractRule: "提炼一句完整的金句/引言，整行居中呈现",
  },
  "callout-pro": {
    id: "callout-pro",
    label: "提示框",
    sections: ["body"],
    extractRule:
      "提炼注意事项/结论。type 选 tip/warning/danger，首段标题、次段说明",
  },
  callout: {
    id: "callout",
    label: "提示框",
    sections: ["body"],
    extractRule: "提炼一条提示/重点。首段加粗标题，次段说明",
  },
  "stats-block": {
    id: "stats-block",
    label: "数据统计",
    sections: ["body"],
    extractRule:
      "提取关键数据。首段小标题，列表项为'- 指标名 **数值**'格式",
  },
  timeline: {
    id: "timeline",
    label: "时间线",
    sections: ["body"],
    extractRule: "提取时间脉络。首段标题，列表项为'- **时间** 事件'格式",
  },
  faq: {
    id: "faq",
    label: "常见问题",
    sections: ["body"],
    extractRule: "提炼问答对。每问用加粗标题，其后为回答",
  },
  "styled-table": {
    id: "styled-table",
    label: "美化表格",
    sections: ["body"],
    extractRule: "保留原文表格。首段表格标题，后接 markdown 表格（数据原样保留）",
  },
  "code-frame": {
    id: "code-frame",
    label: "代码框",
    sections: ["body"],
    extractRule: "包裹原文代码块。props 设 title 为用途，body 保留原代码",
  },
  "text-card": {
    id: "text-card",
    label: "正文卡片",
    sections: ["body"],
    extractRule: "把一段正文收进卡片，body 为精炼后的段落",
  },
  steps: {
    id: "steps",
    label: "分步引导",
    sections: ["body"],
    extractRule: "提炼操作步骤。首段标题，列表项为每一步操作",
  },
  accordion: {
    id: "accordion",
    label: "折叠面板",
    sections: ["body"],
    extractRule: "提炼问答/分组。每项加粗标题 + 内容",
  },
  "resource-list": {
    id: "resource-list",
    label: "资料清单",
    sections: ["body", "tail"],
    extractRule: "提炼资源/资料清单。首段标题，列表项为条目",
  },
  "end-card": {
    id: "end-card",
    label: "结尾致谢",
    sections: ["tail"],
    extractRule: "提炼收尾语。首段主标题（如 Thanks），次段致谢文案",
  },
  "cta-card": {
    id: "cta-card",
    label: "行动号召",
    sections: ["tail"],
    extractRule: "行动号召。首段号召语、次段优惠说明、末段按钮文字",
  },

  // ============ 位置驱动：内容固定或结构提取，重点是位置 ============
  "divider-fancy": {
    id: "divider-fancy",
    label: "装饰分隔",
    sections: ["body"],
    extractRule: "无内容，body 留空，仅作装饰分隔",
  },
  "section-divider": {
    id: "section-divider",
    label: "章节分隔",
    sections: ["body"],
    extractRule: "章节切换处。首段 PART 编号，次段章节标题",
  },
  "section-title": {
    id: "section-title",
    label: "章节小标题",
    sections: ["body"],
    extractRule: "章节标题（精炼为短标题），body 即标题文字",
  },
  "numbered-heading": {
    id: "numbered-heading",
    label: "序号章节",
    sections: ["body"],
    extractRule: "每个主要章节用此组件。首段序号（01/02），次段章节标题",
  },
  "tag-label": {
    id: "tag-label",
    label: "关键词标签",
    sections: ["tail"],
    extractRule: "提取关键词作为标签，body 为 #标签 #标签 形式",
  },
  "share-card": {
    id: "share-card",
    label: "分享引导",
    sections: ["tail"],
    extractRule: "一句话情感收尾（如'如果帮到了你，欢迎分享 ❤️'）",
  },
  "follow-bar": {
    id: "follow-bar",
    label: "关注引导",
    sections: ["head", "tail"],
    extractRule: "固定关注引导语，一句简洁文案",
  },
};

/** 取组件规则；无定义时返回 undefined */
export function getComponentRule(id: string): ComponentRule | undefined {
  return COMPONENT_RULES[id];
}
