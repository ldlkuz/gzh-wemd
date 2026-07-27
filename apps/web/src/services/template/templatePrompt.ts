/**
 * Template JSON AI Prompt 构建器
 *
 * Phase 3: 主题感知 — 接受 themeLayout，注入主题偏好到 prompt
 */
import {
  DESIGN_PATTERNS,
  PATTERN_LABELS,
  type DesignPattern,
} from "../ai/designPatterns";
import { COMPONENT_CONTENT_SCHEMAS } from "./componentSchemas";
import type { LayoutPreference } from "@wemd/core";

/**
 * 构建 Template JSON 生成的系统 prompt
 */
export function buildTemplatePrompt(
  totalParagraphs: number,
  articleTypeHint?: string,
  themeLayout?: LayoutPreference,
): string {
  const patternList = PATTERN_LABELS.map(
    (p) =>
      `- ${p.type}（${p.label}）: ${p.whenToUse}\n  识别特征:\n${p.signatures.map((s) => `    · ${s}`).join("\n")}`,
  ).join("\n\n");

  // Phase 3: 主题约束
  const themeHint = themeLayout
    ? `\n\n## 主题约束（当前使用的品牌规范）\n- 风格基调：${themeLayout.tone.join("、")}\n- 排版密度：${themeLayout.density}\n- 杂志化等级：${themeLayout.magazineLevel}\n- 主题偏好的组件：${themeLayout.preferredComponents.join("、")}\n\n注意：优先选择主题偏好的组件，杂志化等级应匹配主题设定。`
    : "";

  // 构建各类型杂志化等级说明
  const magazineLevelList = DESIGN_PATTERNS.map(
    (p) =>
      `- ${p.type}（${p.label}）: magazineLevel = "${p.magazineLevel}"\n  理由: ${p.magazineReason}`,
  ).join("\n\n");

  // 从所有设计模式中收集用到的组件名
  const usedComponents = new Set<string>();
  for (const pattern of DESIGN_PATTERNS) {
    [...pattern.head, ...pattern.body, ...pattern.tail].forEach((s) =>
      usedComponents.add(s.component),
    );
  }
  usedComponents.add("article-section");

  const usedComponentsArray = Array.from(usedComponents);

  const componentSchemasText = COMPONENT_CONTENT_SCHEMAS.filter((s) =>
    usedComponentsArray.includes(s.component),
  )
    .map((s) => {
      const propsStr = s.propsExample
        ? `\n  props 示例: ${JSON.stringify(s.propsExample)}`
        : "";
      return `- ${s.component}\n  说明: ${s.description}\n  content 示例: ${JSON.stringify(s.example)}${propsStr}`;
    })
    .join("\n\n");

  return [
    "你是一个资深公众号版式设计师。你的任务是阅读用户的文章，生成一份 Template JSON，用于将文章排版为杂志级公众号样式。",
    themeHint,
    "## 工作流程",
    "",
    "1. 识别文章类型（从下面 7 种中选一个，或 unknown）",
    "2. 根据类型确定杂志化等级（magazineLevel: high / medium / low）",
    "3. 根据等级和类型选择版式节奏（head → body → tail）",
    "4. 设计 layout 数组：头部组件 + 正文段落 + 中段组件穿插 + 尾部组件",
    "5. 组件内容从文章提炼，不要照抄原文整段",
    "6. 正文用 article-section 组件引用，指定 fromParagraph 和 toParagraph",
    "",
    `## 文章段落总数：${totalParagraphs}`,
    articleTypeHint ? `## 用户指定类型：${articleTypeHint}` : "",
    "",
    "## 可选文章类型（7 种 + unknown 兜底）",
    "",
    patternList,
    "",
    "- unknown: 文章过短（<200 字）、纯图片、无法归类的混合内容。返回 unknown 时 layout 只包含 article-section",
    "",
    "## 杂志化分级策略（magazineLevel）",
    "",
    "不同类型的文章适合不同程度的杂志化排版，不是所有文章都适合全卡片化。",
    "",
    "各类型对应等级：",
    "",
    magazineLevelList,
    "",
    "### high（全卡片化）",
    "",
    "适用：清单合集、数据报告、产品营销",
    "",
    "⚠️ 重要：high 级优先使用以下杂志级组件（必须用，不要用普通组件代替）：",
    "- 头部：用 magazine-cover（不要用 hero-banner）",
    "- 章节分隔：用 section-divider（不要用 numbered-heading / section-title）",
    "- 正文：用 article-section（渲染器会自动包 text-card，你不要手动包）",
    "- 穿插组件：优先用 two-column-cards、full-quote、image-card",
    "- 结尾：用 end-card + share-card",
    "",
    "high 级避免使用：hero-banner、numbered-heading、section-title、follow-bar（这些是 medium/low 级用的）",
    "",
    "特征：",
    "- 杂志封面 + 章节分隔标题 + 全卡片正文 + 杂志级组件穿插 + 结尾致谢卡",
    "- 组件密度高，几乎每段都有视觉装饰",
    "",
    "### medium（适度点缀）",
    "",
    "适用：教程、故事、观点评论",
    "特征：",
    "- 头部使用 hero-banner 或 quote-card",
    "- 章节切换使用 section-title 或 numbered-heading",
    "- 正文保持纯文本（article-section 直接输出，不包裹 text-card）",
    "- 适度穿插 quote-card、callout-pro、stats-block 等强调组件",
    "- 结尾使用 share-card",
    "- 组件密度中等，每 3-5 段穿插 1 个组件",
    "",
    "### low（基本不用）",
    "",
    "适用：资讯通知、新闻公告",
    "特征：",
    "- 头部使用 hero-banner",
    "- 章节切换使用 section-title",
    "- 正文保持纯文本，不做卡片化",
    "- 仅用 callout-pro 标记重点信息",
    "- 结尾使用 share-card",
    "- 组件密度低，全文仅 2-4 个组件",
    "",
    "## 可用组件及 content 结构",
    "",
    componentSchemasText,
    "",
    "## 输出要求（Template JSON 规范）",
    "",
    "1. 只输出 JSON，不要代码块包裹，不要任何解释",
    "2. JSON 结构：",
    "   {",
    '     "articleType": "tutorial|story|data|opinion|list|news|product|unknown",',
    '     "typeReason": "为什么选这个类型（一句话，引用文章具体特征）",',
    '     "magazineLevel": "high|medium|low",',
    '     "magazineReason": "为什么选这个杂志化等级（一句话）",',
    '     "layout": [',
    '       { "component": "组件名", "props": {...}, "content": {...} }',
    "     ]",
    "   }",
    "",
    "## layout 设计原则",
    "",
    "1. 三段式结构：head（头部）→ body（正文+组件穿插）→ tail（尾部）",
    "2. head 组件数：high 级 1-2 个（magazine-cover + toc-nav），medium 级 1 个，low 级 1 个",
    "3. body 中，正文用 article-section 引用，按杂志化等级穿插组件：",
    "   - high：每 1-2 个 article-section 之间穿插 1 个杂志级组件",
    "   - medium：每 3-5 个 article-section 之间穿插 1 个强调组件",
    "   - low：全文仅 2-3 个强调组件",
    "4. tail 组件数：high 级 2 个（share-card + end-card），medium 级 1 个，low 级 1 个",
    "5. article-section 的 fromParagraph/toParagraph 必须是有效段落号（1 ~ 总段落数）",
    "6. 所有 article-section 合起来应覆盖正文主体内容，不要遗漏大段正文",
    "7. 组件顺序要自然，符合阅读节奏",
    "8. 重要：正文段落一律用 article-section 输出，不要手动用 text-card 包裹正文。high 级的全卡片化由渲染器自动处理。",
    "",
    "## article-section 使用规则",
    "",
    "1. article-section 用来引用原文段落，不要把正文复制到其他组件里",
    '2. content: { "fromParagraph": 1, "toParagraph": 3 } 表示引用第 1 到第 3 段',
    "3. 段落号从 1 开始计数，按空行拆分段落",
    "4. 多个 article-section 可以不连续（中间穿插其他组件），但应覆盖主要正文",
    "5. 不要让 article-section 越界：fromParagraph ≥ 1，toParagraph ≤ 总段落数",
    "",
    "## 内容提炼规则",
    "",
    "1. hero-banner / toc-nav / numbered-heading 等标题类组件：精炼原文，不要照抄",
    "2. quote-card：从原文提取最精彩的一句话作为金句，author 从原文找（没有就留空）",
    "3. callout-pro：从原文提炼要点/提示/警告，type 根据语气选 tip/warning/danger/info",
    "4. stats-block：提取原文中的关键数据，label 用简短描述，value 保留数字",
    "5. faq：从原文提炼 2-3 个读者可能问的问题和答案",
    "6. 所有组件内容长度控制：单个组件 ≤ 200 字，避免冗长",
    "7. 严禁虚构原文没有的内容（如编造作者、编造数据、编造用户评价）",
    "",
    "## 示例（high 级 · 清单类文章 layout 完整结构）",
    "",
    "⚠️ 这是 high 级的正确写法，使用杂志级组件，正文用 article-section：",
    "",
    "[",
    '  { "component": "magazine-cover", "content": { "title": "盛夏清凉好物", "subtitle": "SUMMER ESSENTIALS", "description": "5件亲测好用的夏日必备\\n每一件都经过真实考验" } }',
    '  { "component": "toc-nav", "content": { "title": "目录", "items": ["冰丝凉席", "手持小风扇", "防晒喷雾", "冰镇眼罩", "冷萃咖啡杯"] } }',
    '  { "component": "section-divider", "content": { "part": "PART 01", "title": "冰丝凉席" } }',
    '  { "component": "article-section", "content": { "fromParagraph": 3, "toParagraph": 6 } }',
    '  { "component": "full-quote", "content": { "text": "一整晚下来背部都不会闷汗" } }',
    '  { "component": "section-divider", "content": { "part": "PART 02", "title": "手持小风扇" } }',
    '  { "component": "article-section", "content": { "fromParagraph": 8, "toParagraph": 11 } }',
    '  { "component": "two-column-cards", "content": { "items": [ { "icon": "💨", "title": "三档风力", "description": "中档就很舒服" }, { "icon": "🔋", "title": "续航持久", "description": "可用4-6小时" } ] } }',
    '  { "component": "section-divider", "content": { "part": "PART 03", "title": "防晒喷雾" } }',
    '  { "component": "article-section", "content": { "fromParagraph": 13, "toParagraph": 16 } }',
    '  { "component": "share-card", "content": { "text": "觉得这份清单有用吗？" } }',
    '  { "component": "end-card", "content": { "title": "Thanks", "subtitle": "感谢阅读 · 夏日愉快" } }',
    "]",
    "",
    "## 约束",
    "",
    "1. articleType 必须是 7 种之一或 unknown",
    "2. layout 数组至少 3 个元素（head + 正文 + tail），除非 unknown",
    `3. article-section 的 fromParagraph ≥ 1, toParagraph ≤ ${totalParagraphs}`,
    "4. 组件必须从上面列出的可用组件中选择，不要使用未列出的组件",
    "5. 不要生成 author-card / related-posts / copyright-notice / image-text-row 等需要外部信息的组件",
    "6. props 和 content 的结构必须符合上面各组件的示例",
    "7. content 中的文本必须基于原文提炼，不可凭空捏造",
    "8. ⚠️ high 级强约束：头部必须是 magazine-cover，章节分隔必须用 section-divider，结尾必须有 end-card，正文必须用 article-section（不要手动包 text-card），禁止使用 hero-banner / numbered-heading / follow-bar",
    "9. section-divider 的 part 必须正确编号：PART 01、PART 02、PART 03……依此类推",
  ]
    .filter(Boolean)
    .join("\n");
}

/** 按类型获取该类型的推荐组件清单（用于 prompt 中强化约束） */
export function getPatternComponents(pattern: DesignPattern): string[] {
  const components: string[] = [];
  [...pattern.head, ...pattern.body, ...pattern.tail].forEach((s) => {
    if (!components.includes(s.component)) {
      components.push(s.component);
    }
  });
  return components;
}
