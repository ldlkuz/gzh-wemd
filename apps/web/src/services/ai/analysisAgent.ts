/**
 * AI 设计版式 —— 多阶段 AnalysisAgent
 *
 * Phase 3 升级：主题感知
 * - 阶段1（Profile）：识别文章类型 + 文章画像 + 主题约束
 * - 阶段2（Execute）：在主题框架内填充组件内容
 *
 * 主题（Theme）提供品牌约束（配色/基调/密度/偏好组件），
 * AI 在约束内自由创作，确保每篇气质一致但表达不同。
 */
import { formatAiHttpError, getAiConfig, validateAiConfig } from "./aiConfig";
import { DESIGN_PATTERNS, PATTERN_LABELS, getPattern } from "./designPatterns";
import { COMPONENT_RULES } from "./componentRules";
import { type ArticleProfile } from "./articleProfile";
import type { LayoutPreference } from "@wemd/core";
import type { Audience, DesignConstraints } from "./types";

/** 单条插入建议 */
export interface Insertion {
  /** 插入锚点：文首 / 文末 / 段后:N（N 为段落索引，从 1 起） */
  at: string;
  /** 组件名 */
  component: string;
  /** 组件 props */
  props: Record<string, string>;
  /** 组件内容（AI 提炼，可为多行 markdown） */
  body: string;
  /** 给用户看的理由 */
  reason: string;
}

/** 分析结果 */
export interface AnalysisResult {
  insertions: Insertion[];
  /** 识别出的文章类型 */
  articleType?: string;
  /** 类型识别理由 */
  typeReason?: string;
  /** 文章画像 */
  profile?: ArticleProfile;
  /** 设计策略说明 */
  strategy?: string;
}

/** 阶段1 输出：文章类型 + 画像 + 设计语言 + 槽位计划 */
export interface PlanResult {
  type: string;
  reason: string;
  confidence: number;
  profile?: ArticleProfile;
  /** 启用的组件槽位（按头/中/尾顺序） */
  slotPlan: Array<{
    component: string;
    section: "head" | "body" | "tail";
    count: number;
  }>;
}

/**
 * AI 可选的组件清单（用于校验 AI 返回的 insertion 是否合法）
 *
 * 不在此清单的组件（依赖外部信息，AI 不应自动建议）：
 * - author-card 作者卡片：需要作者真实姓名+头像+简介，AI 无法获取
 * - related-posts 推荐阅读：需要其他文章链接，AI 会虚构
 * - copyright-notice 转载声明：需要版权方/来源单位信息，AI 无法获取
 * - image-text-row 图文混排：需要图片选择，是用户决策
 * - qr-card 二维码卡片：需要二维码图片 URL
 * - image-grid 图片网格：需要图片选择
 * - image-caption 图片图注：需要图片选择
 *
 * 这些组件保留在工具栏供用户手动插入。
 */
export const AVAILABLE_COMPONENTS = [
  "quote-card",
  "divider-fancy",
  "cta-card",
  "code-frame",
  "callout-pro",
  "stats-block",
  "timeline",
  "follow-bar",
  "numbered-heading",
  "section-title",
  "share-card",
  "toc-nav",
  "tag-label",
  "styled-table",
  "hero-banner",
  "faq",
  // 内容驱动（补充）
  "magazine-cover",
  "full-quote",
  "text-card",
  "end-card",
  "callout",
  "steps",
  "accordion",
  "resource-list",
  // 位置驱动（补充）
  "section-divider",
] as const;

/**
 * 组件按 AI 处理方式分两类：
 * - 内容驱动：需从原文提炼/保留内容才有价值，AI 必须读懂原文并控制不编造
 * - 位置驱动：内容固定或从结构直接取，关键是放对位置，几乎无编造风险
 */
export const CONTENT_DRIVEN_COMPONENTS = [
  "hero-banner",
  "toc-nav",
  "quote-card",
  "cta-card",
  "callout-pro",
  "stats-block",
  "timeline",
  "faq",
  "styled-table",
  "code-frame",
  "magazine-cover",
  "full-quote",
  "text-card",
  "end-card",
  "callout",
  "steps",
  "accordion",
  "resource-list",
] as const;

export const POSITION_DRIVEN_COMPONENTS = [
  "divider-fancy",
  "section-title",
  "numbered-heading",
  "tag-label",
  "share-card",
  "follow-bar",
  "section-divider",
] as const;

/** 阶段1：构建识别文章类型 + 主题约束 + slotPlan 的 prompt */
function buildPlanPrompt(
  audience?: Audience,
  themeLayout?: LayoutPreference,
  constraints?: DesignConstraints,
  allowed?: readonly string[],
): string {
  const patternList = PATTERN_LABELS.map(
    (p) =>
      `- ${p.type}（${p.label}）: ${p.whenToUse}\n  识别特征:\n${p.signatures.map((s) => `    · ${s}`).join("\n")}`,
  ).join("\n\n");

  const audienceHint =
    audience && audience.type !== "auto"
      ? `\n\n## 读者画像\n目标读者：${audience.type === "quick" ? "快速浏览型" : audience.type === "deep" ? "深度阅读型" : audience.type === "learning" ? "学习研究型" : audience.type === "decision" ? "决策参考型" : audience.type === "brand" ? "品牌传播型" : "大众阅读型"}\n请根据读者阅读行为调整设计策略。`
      : "";

  // Phase 3: 主题约束
  const themeHint = themeLayout
    ? `\n\n## 主题约束（当前文章使用的品牌规范，必须遵守）\n- 风格基调：${themeLayout.tone.join("、")}\n- 排版密度：${themeLayout.density}（${themeLayout.density === "low" ? "简洁为主，少用组件" : themeLayout.density === "medium" ? "适度点缀" : "丰富组件，杂志级排版"}）\n- 主题偏好的组件：${themeLayout.preferredComponents.join("、")}\n\n注意：\n1. 优先从主题偏好的组件中选择槽位，但也可根据文章内容选择其他合适的组件\n2. slotPlan 的总组件数量应符合排版密度要求\n3. 主题基调决定了文章的整体氛围，design 字段应与之协调`
    : "";

  // Design Goal 约束（软建议，AI 可偏离）
  const goalHint =
    constraints && constraints.designGoal !== "auto"
      ? `\n\n## 设计目标（用户偏好，软建议）\n${constraints.designGoal === "reading" ? "优先保证阅读流畅性，组件仅用于强调重点，允许大量普通正文" : constraints.designGoal === "visual" ? "优先追求视觉表现力，可以增加视觉模块，强化节奏感" : constraints.designGoal === "infoDensity" ? "优先信息表达效率，多用表格、时间轴、对比等结构化组件" : "在阅读体验和视觉表现之间取得平衡"}\n注意：这是软建议，主题约束优先于此偏好。`
      : "";

  // 用户勾选的组件范围（硬约束，AI 只能在清单内选择）
  const allowedHint =
    allowed && allowed.length > 0
      ? `\n\n## 允许使用的组件（用户勾选，必须遵守）\n${allowed.join("、")}\n注意：slotPlan 中的组件必须全部来自以上清单，不要使用清单外的组件。`
      : "";

  return [
    "你是一个资深公众号版式设计师。你的任务是阅读用户的文章，识别文章类型，在主题约束下选择最匹配的版式设计。",
    audienceHint,
    themeHint,
    goalHint,
    allowedHint,
    "",
    "## 判断原则（按优先级）",
    "",
    "1. 先看文章『想达成什么目的』：教技能→tutorial，推广产品→product，传达信息→news",
    "2. 再看『内容形式』：有代码/步骤→tutorial，有数据/表格→data，有并列项→list",
    "3. 再看『表达方式』：叙事→story，论证观点→opinion",
    "4. 多类型混合时，选『主导内容』对应的类型（如教程文末带产品介绍，主导是 tutorial）",
    "5. 主题约束优先于类型判断：如果主题偏好的组件更适合某种布局，应优先考虑",
    "",
    "## 可选设计模式（7 种 + unknown 兜底）",
    "",
    patternList,
    "",
    "- unknown: 文章过短（<200 字）、纯图片、无法归类的混合内容。返回 unknown 时 slotPlan 必须为空数组",
    "",
    "## 输出要求",
    "",
    "1. 只输出 JSON，不要代码块包裹，不要任何解释",
    "2. JSON 结构：",
    "   {",
    '     "type": "tutorial|story|data|opinion|list|news|product|unknown",',
    '     "confidence": 0.0-1.0,',
    '     "reason": "为什么选这个类型（一句话，引用文章具体特征）",',
    '     "profile": {',
    '       "category": "Tech|Emotion|Business|Life|...",',
    '       "tone": "Warm|Serious|Rational|Modern|Playful|Plain",',
    '       "purpose": "Discussion|Share|Collect|Convert|Guide|Branding|Inform",',
    '       "depth": "Quick|Medium|Deep"',
    "     },",
    '     "slotPlan": [',
    '       {"component": "组件名", "section": "head|body|tail", "count": 1}',
    "     ]",
    "   }",
    "",
    "## slotPlan 规则",
    "",
    "1. 只能使用「允许使用的组件」清单中的组件，不要用清单外的",
    "2. 根据文章类型与内容，为每个选中的组件判断适合的位置：head=开头 / body=中段 / tail=结尾",
    "3. 组件数量应符合排版密度（主题约束），不要过度堆砌",
    "4. 同一组件 count 可 >1（如多章节时 numbered-heading count=章节数），基于实际内容估算",
    "5. 顺序按 head → body → tail 排列",
    "6. 主题偏好组件优先",
    "",
    "## 判断示例（few-shot）",
    "",
    '示例1：文章含"第一步...第二步..."且有 `const x = 1` 代码块，主题偏好=[code-frame, toc-nav]，密度=high',
    '  → {"type":"tutorial","confidence":0.95,"reason":"含步骤序号和代码块，是典型教程","profile":{"category":"Tech","tone":"Rational","purpose":"Guide","depth":"Deep"},"slotPlan":[{"component":"toc-nav","section":"head","count":1},{"component":"code-frame","section":"body","count":2},{"component":"quote-card","section":"body","count":1}]}',
    "",
    '示例2：文章以"我"叙述创业经历，有情感转折，主题偏好=[quote-card, end-card]，基调=[warm, elegant]',
    '  → {"type":"story","confidence":0.9,"reason":"第一人称叙事创业经历","profile":{"category":"Life","tone":"Warm","purpose":"Discussion","depth":"Medium"},"slotPlan":[{"component":"hero-banner","section":"head","count":1},{"component":"quote-card","section":"body","count":2},{"component":"end-card","section":"tail","count":1}]}',
    "",
    '示例3：文章含"占比 45%""同比增长"等数据，有对比表格，主题密度=high',
    '  → {"type":"data","confidence":0.92,"reason":"含统计数据和对比表格","profile":{"category":"Business","tone":"Serious","purpose":"Share","depth":"Deep"},"slotPlan":[{"component":"stats-block","section":"head","count":1},{"component":"styled-table","section":"body","count":1},{"component":"divider-fancy","section":"body","count":1}]}',
    "",
    '示例4：文章列出"10 本好书推荐"，每本有简短点评',
    '  → {"type":"list","confidence":0.9,"reason":"并列推荐 10 本书","profile":{"category":"Life","tone":"Plain","purpose":"Collect","depth":"Quick"},"slotPlan":[{"component":"numbered-heading","section":"body","count":10},{"component":"share-card","section":"tail","count":1}]}',
    "",
    '示例5：文章介绍某产品功能，文末有"立即购买"',
    '  → {"type":"product","confidence":0.88,"reason":"介绍产品功能且有转化引导","profile":{"category":"Business","tone":"Modern","purpose":"Convert","depth":"Medium"},"slotPlan":[{"component":"hero-banner","section":"head","count":1},{"component":"cta-card","section":"tail","count":1}]}',
    "",
    "示例6：文章仅 100 字，是产品简介",
    '  → {"type":"unknown","confidence":0.3,"reason":"文章过短","profile":{"category":"Other","tone":"Plain","purpose":"Inform","depth":"Quick"},"slotPlan":[]}',
    "",
    "## 约束",
    "",
    "1. type 必须是上面 7 种之一或 unknown",
    "2. confidence < 0.6 时优先返回 unknown",
    "3. unknown 时 slotPlan 必须为空数组",
    "4. reason 必须引用文章具体特征（如'含 3 段代码块和步骤序号'，不要泛泛说'是教程类'）",
    "5. 不要被单一关键词误导（如出现'推荐'不一定是 list，可能是 product 软广）",
  ].join("\n");
}

/** 单个已展开的组件槽位（含 section 与第几个） */
interface SlotItem {
  slot: { component: string; extractRule: string };
  section: "head" | "body" | "tail";
  idx: number;
}

/** 阶段2 的一个批次：负责某段原文 + 该段的组件槽位 */
export interface ExecuteBatch {
  slots: SlotItem[];
  /** 该批对应的原文片段（段落以空行拼接） */
  excerpt: string;
  /** 该批第一段在全局的段落索引（1-based），用于位置换算 */
  startPara: number;
  /** 是否包含全文（短文单批时 true，此时位置用全局段索引） */
  full?: boolean;
}

/** 把 slotPlan 条目展开为实际组件槽位列表（规则来自组件级规则表，不再依赖 pattern 槽位） */
export function expandSlots(items: PlanResult["slotPlan"]): SlotItem[] {
  const slots: SlotItem[] = [];
  for (const item of items) {
    const rule = COMPONENT_RULES[item.component];
    if (!rule) continue;
    for (let i = 0; i < item.count; i++) {
      slots.push({
        slot: { component: item.component, extractRule: rule.extractRule },
        section: item.section,
        idx: i,
      });
    }
  }
  return slots;
}

/** 按空行切分段落（与 applyInsertions 的段落定义一致）。先统一换行，避免 CRLF 下空行切分失败 */
export function splitParagraphs(markdown: string): string[] {
  return markdown
    .replace(/\r\n?/g, "\n")
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter((block) => block.length > 0);
}

/**
 * 阶段2 分批：head/body/tail 对应前/中/后各 1/3 原文分 3 批，
 * 每批只传对应片段控制 token。段落过少（≤ 6）时退回单批（全文），
 * 保持短文行为与旧逻辑一致。
 */
export function buildExecuteBatches(
  plan: PlanResult,
  paragraphs: string[],
): ExecuteBatch[] {
  const total = paragraphs.length;
  const singleBatch = (): ExecuteBatch[] => {
    const slots = expandSlots(plan.slotPlan);
    if (slots.length === 0) return [];
    return [{ slots, excerpt: paragraphs.join("\n\n"), startPara: 1, full: true }];
  };

  if (total <= 6) return singleBatch();

  const headEnd = Math.max(1, Math.floor(total / 3));
  const tailStart = Math.min(total, Math.ceil((total * 2) / 3));
  const ranges: Array<{
    section: "head" | "body" | "tail";
    start: number;
    end: number;
  }> = [
    { section: "head", start: 1, end: headEnd },
    { section: "body", start: headEnd + 1, end: tailStart },
    { section: "tail", start: tailStart + 1, end: total },
  ];

  const batches: ExecuteBatch[] = [];
  for (const r of ranges) {
    const items = plan.slotPlan.filter((i) => i.section === r.section);
    const slots = expandSlots(items);
    if (slots.length === 0) continue; // 该区段无组件槽位 → 不调用
    const excerpt = paragraphs.slice(r.start - 1, r.end).join("\n\n");
    batches.push({ slots, excerpt, startPara: r.start });
  }
  return batches;
}

/** 把批内相对段索引（段后:j）换算为全局段索引（段后:startPara+j-1）；文首/文末不变 */
export function convertBatchAnchors(
  insertions: Insertion[],
  startPara: number,
): Insertion[] {
  return insertions.map((ins) => {
    const m = ins.at.match(/^段后:(\d+)$/);
    if (!m) return ins;
    return { ...ins, at: `段后:${startPara + parseInt(m[1], 10) - 1}` };
  });
}

/** 阶段2：构建填充 insertions 的 prompt（分批，只给该批片段） */
function buildBatchExecutePrompt(
  plan: PlanResult,
  batch: ExecuteBatch,
): string {
  const pattern = getPattern(plan.type);
  if (!pattern) {
    throw new Error(`未知文章类型: ${plan.type}`);
  }

  const slotDesc = batch.slots
    .map((s, i) => {
      const pos =
        s.section === "head" ? "头部" : s.section === "body" ? "中段" : "尾部";
      return `${i + 1}. [${pos}] ${s.slot.component}（第 ${s.idx + 1} 个）\n   提炼规则: ${s.slot.extractRule}`;
    })
    .join("\n\n");

  // 组件按处理方式分类：内容驱动（需提炼、禁编造）/ 位置驱动（内容固定、重点是位置）
  const contentList = CONTENT_DRIVEN_COMPONENTS.join(" / ");
  const positionList = POSITION_DRIVEN_COMPONENTS.join(" / ");

  // 该批对应的原文范围说明（决定 at 锚点的填法）
  const isHeadOnly = batch.slots.every((s) => s.section === "head");
  const isTailOnly = batch.slots.every((s) => s.section === "tail");
  const rangeNote = batch.full
    ? "你负责的是全文。位置用'段后:N'（N 为全文段落索引，从 1 起）；头部组件可用'文首'，尾部组件可用'文末'。"
    : isHeadOnly
      ? "你负责的是全文开头部分。位置用'文首'或'段后:1'。"
      : isTailOnly
        ? "你负责的是全文结尾部分。位置用'文末'。"
        : `你负责的是全文第 ${batch.startPara} 段开始的一段原文（只给了这段，未给全文）。位置用'段后:j'，j 是这段原文内的相对段落索引（第 1 段从 1 起），程序会自动换算为全文位置。`;

  return [
    "你是一个资深公众号版式设计师。前一步已识别文章类型并选好版式配方，现在你的任务是根据你负责的原文片段，填充组件的具体内容，并决定插入位置。",
    "",
    `## 文章类型：${pattern.label}`,
    `## 版式节奏：${pattern.rhythm}`,
    "",
    rangeNote,
    "",
    "## 需要填充的组件槽位",
    "",
    slotDesc,
    "",
    "## 组件分类处理策略",
    "",
    `- 【内容驱动】必须从原文提炼/保留内容，不得编造事实、数据、人物，body 严格基于原文（可精简措辞）：${contentList}`,
    `- 【位置驱动】内容固定或从标题结构直接取，重点是放对位置，无需深读提炼：${positionList}`,
    "- 位置驱动组件（如 divider-fancy）body 可留空；内容驱动组件若原文无对应内容，body 留空，不要硬凑",
    "",
    "## 输出要求",
    "",
    "1. 只输出 JSON，不要代码块包裹，不要任何解释",
    '2. JSON 结构：{"insertions": [...]}',
    "3. 每个 insertion 包含字段：",
    "   - at: 插入位置，按上面的位置说明填写（\"文首\" / \"文末\" / \"段后:N\"）",
    "   - component: 组件名（必须与上面槽位一致）",
    "   - props: 组件属性对象（可为 {}）",
    "   - body: 组件内容（按提炼规则生成，不要照抄原文）",
    "   - reason: 给用户看的理由（一句话，引用片段具体内容）",
    "",
    "## 提炼规则",
    "",
    "1. body 必须按槽位的『提炼规则』生成，不要照抄原文整段",
    "2. 位置严格按上面的位置说明填写",
    "3. 槽位顺序就是插入顺序，不要打乱",
    "4. reason 必须具体（如'片段第 2 段是核心金句，适合用 quote-card 突出'）",
    "5. body 长度控制：单个组件 body ≤ 200 字，避免冗长",
    "",
    "## 约束",
    "",
    "1. 不修改原文，只建议插入位置",
    "2. insertions 数量必须等于槽位数量，一一对应",
    "3. 如果某个槽位无法填充（片段无对应内容），body 留空字符串",
    "4. 不要在 body 里添加原文没有的内容（如虚构作者名、编造数据、编造用户评价）",
    "5. '段后:N'不能超过你负责的原文总段落数",
    "6. component 必须是槽位中列出的组件，不要生成 author-card / related-posts / copyright-notice / image-text-row 等需要外部信息的组件",
  ].join("\n");
}

/** 解析阶段1 AI 返回的 JSON */
function parsePlanResponse(content: string): PlanResult | null {
  let text = content.trim();
  if (text.startsWith("```")) {
    text = text.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");
  }
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;

  try {
    const parsed = JSON.parse(jsonMatch[0]);
    if (!parsed.type || !parsed.slotPlan || !Array.isArray(parsed.slotPlan)) {
      return null;
    }
    const confidence =
      typeof parsed.confidence === "number"
        ? parsed.confidence
        : parsed.type === "unknown"
          ? 0.3
          : 0.7;
    return {
      type: parsed.type,
      reason: typeof parsed.reason === "string" ? parsed.reason : "",
      confidence,
      profile:
        parsed.profile && typeof parsed.profile === "object"
          ? {
              category: parsed.profile.category || "Other",
              tone: parsed.profile.tone || "Plain",
              purpose: parsed.profile.purpose || "Inform",
              depth: parsed.profile.depth || "Medium",
            }
          : undefined,
      slotPlan: parsed.slotPlan.filter(
        (item: { component?: unknown; section?: unknown }) =>
          item.component && item.section,
      ),
    };
  } catch {
    return null;
  }
}

/** 解析阶段2 AI 返回的 JSON */
function parseExecuteResponse(content: string): Insertion[] {
  let text = content.trim();
  if (text.startsWith("```")) {
    text = text.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");
  }
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return [];

  try {
    const parsed = JSON.parse(jsonMatch[0]);
    if (!parsed.insertions || !Array.isArray(parsed.insertions)) return [];

    const validInsertions: Insertion[] = [];
    for (const item of parsed.insertions) {
      if (!item.component || !AVAILABLE_COMPONENTS.includes(item.component)) {
        continue;
      }
      if (!item.at || typeof item.at !== "string") continue;
      validInsertions.push({
        at: item.at,
        component: item.component,
        props:
          typeof item.props === "object" && item.props !== null
            ? item.props
            : {},
        body: typeof item.body === "string" ? item.body : "",
        reason: typeof item.reason === "string" ? item.reason : "",
      });
    }
    return validInsertions;
  } catch {
    return [];
  }
}

/** 规范化 baseUrl：去末尾斜杠 */
function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/+$/, "");
}

/** 构造 chat/completions 请求 URL */
function chatCompletionsUrl(baseUrl: string): string {
  const base = normalizeBaseUrl(baseUrl);
  if (base.endsWith("/v1")) {
    return `${base}/chat/completions`;
  }
  return `${base}/v1/chat/completions`;
}

/** 构造请求头 */
function buildHeaders(apiKey: string, baseUrl: string): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (apiKey.trim()) {
    headers["Authorization"] = `Bearer ${apiKey.trim()}`;
  }
  if (baseUrl.includes("openrouter.ai")) {
    headers["HTTP-Referer"] = "https://wemd.app";
    headers["X-Title"] = "WeMD";
  }
  return headers;
}

/** 单次 LLM 调用 */
async function callLLM(
  systemPrompt: string,
  userContent: string,
  temperature: number,
): Promise<string> {
  const config = getAiConfig();
  const configError = validateAiConfig(config);
  if (configError) {
    throw new Error(configError);
  }

  const url = chatCompletionsUrl(config.baseUrl);
  const resp = await fetch(url, {
    method: "POST",
    headers: buildHeaders(config.apiKey, config.baseUrl),
    body: JSON.stringify({
      model: config.model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ],
      temperature,
      stream: false,
    }),
  });

  if (!resp.ok) {
    const errText = await resp.text().catch(() => resp.statusText);
    throw new Error(formatAiHttpError(config.baseUrl, resp.status, errText));
  }

  const data = await resp.json();
  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new Error("模型返回内容为空");
  }
  return content;
}

/**
 * 分析文章，返回插入建议（多阶段）
 *
 * Phase 3 升级：主题感知
 * - 阶段1（Profile）：识别类型 + 画像 + 主题约束 → 槽位计划
 * - 阶段2（Execute）：填充组件内容
 * - themeLayout 来自当前选中主题的 layout 偏好
 */
export async function analyzeArticle(
  markdown: string,
  audience?: Audience,
  constraints?: DesignConstraints,
  themeLayout?: LayoutPreference,
  allowedComponents?: readonly string[],
): Promise<AnalysisResult> {
  const effectiveConstraints: DesignConstraints = constraints ?? {
    safetyLimit: 20,
    designGoal: "auto",
  };

  // 用户勾选的组件范围（硬约束），未勾选时兜底为全局白名单
  const allowed =
    allowedComponents && allowedComponents.length > 0
      ? allowedComponents
      : AVAILABLE_COMPONENTS;

  // 阶段1：识别类型 + 画像 + 主题约束 + 设计目标 → 槽位计划
  const planPrompt = buildPlanPrompt(
    audience,
    themeLayout,
    effectiveConstraints,
    allowed,
  );
  const planContent = await callLLM(planPrompt, markdown, 0.3);
  const plan = parsePlanResponse(planContent);

  if (!plan) {
    return { insertions: [] };
  }

  // 槽位计划只保留用户勾选范围内的组件（确定性兜底）
  const planComponentCount = plan.slotPlan.length;
  plan.slotPlan = plan.slotPlan.filter((item) =>
    (allowed as readonly string[]).includes(item.component),
  );

  // unknown 兜底
  if (plan.type === "unknown" || plan.confidence < 0.6) {
    return {
      insertions: [],
      articleType: plan.type,
      typeReason:
        plan.reason || "文章较短或类型不明确，暂不推荐版式",
    };
  }

  if (plan.slotPlan.length === 0) {
    return {
      insertions: [],
      articleType: plan.type,
      typeReason:
        planComponentCount > 0
          ? "勾选的组件都不适合这篇文章，试试勾选更多组件或调整选择"
          : plan.reason || "未找到适合这篇文章的组件",
    };
  }

  // 画像处理
  const { inferProfileFromType } = await import("./articleProfile");
  const profile = plan.profile ?? inferProfileFromType(plan.type);

  // Phase 3: 策略说明基于主题 layout 而非 DesignLanguage
  const layout = themeLayout;
  const densityLabel =
    layout?.density === "high"
      ? "丰富"
      : layout?.density === "low"
        ? "简洁"
        : "适中";
  const strategy = [
    `文章类型：${plan.type}（${plan.reason}）`,
    layout ? `主题基调：${layout.tone.join("、")}，密度：${densityLabel}` : "",
    `写作目的：${profile.purpose}`,
    layout?.preferredComponents.length
      ? `主题偏好组件：${layout.preferredComponents.join("、")}`
      : "",
    effectiveConstraints.designGoal !== "auto"
      ? `设计目标：${effectiveConstraints.designGoal === "reading" ? "阅读优先" : effectiveConstraints.designGoal === "visual" ? "视觉优先" : effectiveConstraints.designGoal === "infoDensity" ? "信息密度" : "平衡设计"}`
      : "",
  ]
    .filter(Boolean)
    .join("\n");

  // 阶段2：分批填充 insertions（全局决策已定，每批只传对应片段控制 token）
  const paragraphs = splitParagraphs(markdown);
  const batches = buildExecuteBatches(plan, paragraphs);
  const allInsertions: Insertion[] = [];
  for (const batch of batches) {
    const batchPrompt = buildBatchExecutePrompt(plan, batch);
    const batchContent = await callLLM(batchPrompt, batch.excerpt, 0.5);
    const batchInsertions = parseExecuteResponse(batchContent);
    // 批内相对段索引 → 全局段索引
    allInsertions.push(
      ...convertBatchAnchors(batchInsertions, batch.startPara),
    );
  }

  // 只保留用户勾选范围内的组件（确定性兜底），再按安全上限裁剪
  const inScope = allInsertions.filter((i) =>
    (allowed as readonly string[]).includes(i.component),
  );
  const limitedInsertions = inScope.slice(
    0,
    effectiveConstraints.safetyLimit,
  );

  return {
    insertions: limitedInsertions,
    articleType: plan.type,
    typeReason: plan.reason,
    profile,
    strategy,
  };
}

// 导出设计模式库（供 UI 展示类型识别结果用）
export { DESIGN_PATTERNS };
