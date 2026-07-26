/**
 * AI 设计版式 —— 两阶段 AnalysisAgent
 *
 * 基于专业排版方法论 + 竞品调研 + 学术界 Plan&Execute 范式设计：
 * - 阶段1（Plan）：识别文章类型 → 选对应设计模式 → 输出 slotPlan
 * - 阶段2（Execute）：在 slotPlan 框架内，根据文章内容填充 body，生成 insertions
 *
 * 不修改原文，只建议插入组件位置。
 */
import { formatAiHttpError, getAiConfig, validateAiConfig } from "./aiConfig";
import {
  DESIGN_PATTERNS,
  PATTERN_LABELS,
  getPattern,
  type ComponentSlot,
} from "./designPatterns";

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
  /** 识别出的文章类型（阶段1 产出） */
  articleType?: string;
  /** 类型识别理由（给用户看） */
  typeReason?: string;
}

/** 阶段1 输出：文章类型 + 启用的组件槽位计划 */
interface PlanResult {
  type: string;
  reason: string;
  /** 类型识别置信度（0-1） */
  confidence: number;
  /** 启用的组件槽位（按头/中/尾顺序） */
  slotPlan: Array<{
    component: string;
    /** 放在哪一段：head/body/tail */
    section: "head" | "body" | "tail";
    /** 重复次数（repeatable 组件可 >1） */
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
] as const;

/** 阶段1：构建识别文章类型 + 输出 slotPlan 的 prompt */
function buildPlanPrompt(): string {
  const patternList = PATTERN_LABELS.map(
    (p) =>
      `- ${p.type}（${p.label}）: ${p.whenToUse}\n  识别特征:\n${p.signatures.map((s) => `    · ${s}`).join("\n")}`,
  ).join("\n\n");

  return [
    "你是一个资深公众号版式设计师。你的任务是阅读用户的文章，识别文章类型，选择最匹配的版式设计模式。",
    "",
    "## 判断原则（按优先级）",
    "",
    "1. 先看文章『想达成什么目的』：教技能→tutorial，推广产品→product，传达信息→news",
    "2. 再看『内容形式』：有代码/步骤→tutorial，有数据/表格→data，有并列项→list",
    "3. 再看『表达方式』：叙事→story，论证观点→opinion",
    "4. 多类型混合时，选『主导内容』对应的类型（如教程文末带产品介绍，主导是 tutorial）",
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
    '     "confidence": 0.0-1.0（类型识别置信度）,',
    '     "reason": "为什么选这个类型（一句话，引用文章具体特征）",',
    '     "slotPlan": [',
    '       {"component": "组件名", "section": "head|body|tail", "count": 1}',
    "     ]",
    "   }",
    "",
    "## slotPlan 规则",
    "",
    "1. 从所选模式的 head/body/tail 槽位中挑选要启用的组件",
    "2. required 槽位必须启用，非 required 视文章内容决定",
    "3. repeatable 组件 count 可 >1（如教程有 3 个章节，numbered-heading count=3）",
    "4. 非 repeatable 组件 count 只能是 1",
    "5. 顺序按 head → body → tail 排列",
    "6. count 必须基于文章实际内容估算（如章节实际有 4 个，numbered-heading count=4）",
    "",
    "## 判断示例（few-shot）",
    "",
    '示例1：文章含"第一步...第二步..."且有 `const x = 1` 代码块',
    '  → {"type":"tutorial","confidence":0.95,"reason":"含步骤序号和代码块，是典型教程","slotPlan":[...]}',
    "",
    '示例2：文章以"我"叙述创业经历，有情感转折',
    '  → {"type":"story","confidence":0.9,"reason":"第一人称叙事创业经历，情感色彩浓","slotPlan":[...]}',
    "",
    '示例3：文章含"占比 45%""同比增长"等数据，有对比表格',
    '  → {"type":"data","confidence":0.92,"reason":"含统计数据和对比表格","slotPlan":[...]}',
    "",
    '示例4：文章列出"10 本好书推荐"，每本有简短点评',
    '  → {"type":"list","confidence":0.9,"reason":"并列推荐 10 本书，无明显论证","slotPlan":[...]}',
    "",
    '示例5：文章含"活动时间：X月X日""报名方式"，传达活动信息',
    '  → {"type":"news","confidence":0.93,"reason":"传达活动时间地点等要素","slotPlan":[...]}',
    "",
    '示例6：文章介绍某产品功能，文末有"立即购买"',
    '  → {"type":"product","confidence":0.88,"reason":"介绍产品功能且有转化引导","slotPlan":[...]}',
    "",
    "示例7：文章仅 100 字，是产品简介",
    '  → {"type":"unknown","confidence":0.3,"reason":"文章过短，不适合套版式模式","slotPlan":[]}',
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

/** 阶段2：构建填充 insertions 的 prompt */
function buildExecutePrompt(plan: PlanResult): string {
  const pattern = getPattern(plan.type);
  if (!pattern) {
    throw new Error(`未知文章类型: ${plan.type}`);
  }

  // 根据 slotPlan 展开实际的组件清单（含 extractRule）
  const slots: Array<{ slot: ComponentSlot; section: string; idx: number }> =
    [];
  for (const item of plan.slotPlan) {
    const sectionSlots =
      item.section === "head"
        ? pattern.head
        : item.section === "body"
          ? pattern.body
          : pattern.tail;
    const slot = sectionSlots.find((s) => s.component === item.component);
    if (!slot) continue;
    for (let i = 0; i < item.count; i++) {
      slots.push({ slot, section: item.section, idx: i });
    }
  }

  const slotDesc = slots
    .map((s, i) => {
      const pos =
        s.section === "head" ? "头部" : s.section === "body" ? "中段" : "尾部";
      return `${i + 1}. [${pos}] ${s.slot.component}（第 ${s.idx + 1} 个）\n   提炼规则: ${s.slot.extractRule}`;
    })
    .join("\n\n");

  return [
    "你是一个资深公众号版式设计师。前一步已识别文章类型并选好版式配方，现在你的任务是根据文章内容，填充每个组件的具体内容，并决定插入位置。",
    "",
    `## 文章类型：${pattern.label}`,
    `## 版式节奏：${pattern.rhythm}`,
    "",
    "## 需要填充的组件槽位",
    "",
    slotDesc,
    "",
    "## 输出要求",
    "",
    "1. 只输出 JSON，不要代码块包裹，不要任何解释",
    '2. JSON 结构：{"insertions": [...]}',
    "3. 每个 insertion 包含字段：",
    '   - at: 插入位置，取值为 "文首" / "文末" / "段后:N"（N 为段落索引，从 1 起）',
    "   - component: 组件名（必须与上面槽位一致）",
    "   - props: 组件属性对象（可为 {}）",
    "   - body: 组件内容（按提炼规则生成，不要照抄原文）",
    "   - reason: 给用户看的理由（一句话，引用文章具体内容）",
    "",
    "## 提炼规则",
    "",
    "1. body 必须按槽位的『提炼规则』生成，不要照抄原文整段",
    "2. head 槽位 at 用'文首'或'段后:1'",
    "3. tail 槽位 at 用'文末'",
    "4. body 槽位 at 根据文章结构选'段后:N'，N 必须是有效段落索引",
    "5. 槽位顺序就是插入顺序，不要打乱",
    "6. reason 必须具体（如'第 3 段是核心金句，适合用 quote-card 突出'）",
    "7. body 长度控制：单个组件 body ≤ 200 字，避免冗长",
    "",
    "## 输出示例（few-shot）",
    "",
    "示例1（教程类，toc-nav 槽位）：",
    "  原文含章节『安装/配置/部署』",
    '  → {"at":"文首","component":"toc-nav","props":{},"body":"目录\\n\\n- 安装\\n- 配置\\n- 部署","reason":"提取三个章节作为目录，便于读者预览"}',
    "",
    "示例2（故事类，quote-card 槽位）：",
    "  原文第 4 段是人物台词『这一切都是值得的』",
    '  → {"at":"段后:4","component":"quote-card","props":{"author":"创始人"},"body":"这一切都是值得的","reason":"第 4 段人物台词是情感转折点，适合金句卡片"}',
    "",
    "示例3（数据类，stats-block 槽位）：",
    "  原文含『收入 1.2 亿，增长 45%』",
    '  → {"at":"段后:2","component":"stats-block","props":{},"body":"核心指标\\n\\n- 营收 **1.2亿**\\n- 同比增长 **45%**","reason":"第 2 段含关键数据，提取为数据块强化视觉"}',
    "",
    "## 约束",
    "",
    "1. 不修改原文，只建议插入位置",
    "2. insertions 数量必须等于槽位数量，一一对应",
    "3. 如果某个槽位无法填充（文章无对应内容），body 留空字符串",
    "4. 不要在 body 里添加原文没有的内容（如虚构作者名、编造数据、编造用户评价）",
    "5. at 中的段后 N 必须是文章实际存在的段落索引，不能超过总段落数",
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
 * 分析文章，返回插入建议（两阶段）
 *
 * 阶段1：识别文章类型 + 选配方 + 输出 slotPlan
 * 阶段2：在 slotPlan 框架内填充 insertions
 */
export async function analyzeArticle(
  markdown: string,
): Promise<AnalysisResult> {
  // 阶段1：识别类型 + 规划槽位
  const planPrompt = buildPlanPrompt();
  const planContent = await callLLM(planPrompt, markdown, 0.3);
  const plan = parsePlanResponse(planContent);

  if (!plan) {
    return { insertions: [] };
  }

  // unknown 兜底：文章不适合套模式
  if (plan.type === "unknown" || plan.confidence < 0.6) {
    return {
      insertions: [],
      articleType: plan.type,
      typeReason: plan.reason || "文章类型不明确，暂不推荐版式",
    };
  }

  // slotPlan 为空：识别到类型但文章内容不足以填充
  if (plan.slotPlan.length === 0) {
    return {
      insertions: [],
      articleType: plan.type,
      typeReason: plan.reason,
    };
  }

  // 阶段2：填充 insertions
  const executePrompt = buildExecutePrompt(plan);
  const executeContent = await callLLM(executePrompt, markdown, 0.5);
  const insertions = parseExecuteResponse(executeContent);

  return {
    insertions,
    articleType: plan.type,
    typeReason: plan.reason,
  };
}

// 导出设计模式库（供 UI 展示类型识别结果用）
export { DESIGN_PATTERNS };
