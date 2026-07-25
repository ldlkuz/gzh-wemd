/**
 * AI 提示词构建 + CSS 清理(从 NestJS 后端迁移到前端)
 * 前端直接调用 AI 厂商 API,需要自己构建 system prompt 和清理输出
 */

/** 构建文本转 Markdown 的系统提示词 */
export function buildTextToMarkdownPrompt(mode: "full" | "selection"): string {
  const base = [
    "你是一个 Markdown 排版助手。你的任务是把用户提供的纯文本转换成结构清晰的 Markdown。",
    "要求:",
    "1. 准确识别标题层级(文章标题用 # 或 ##,小节用 ## 或 ###,以此类推)",
    "2. 识别列表(有序/无序)、加粗重点、引用、代码块等结构",
    "3. 保留原文意思,不要增删内容,不要编造信息",
    "4. 只输出 Markdown 正文,不要用代码块包裹,不要加任何解释说明",
  ].join("\n");

  if (mode === "selection") {
    return (
      base +
      "\n5. 当前是选区片段转换,无需补充大标题,只对片段做结构化即可。"
    );
  }
  return base + "\n5. 当前是整篇转换,请为全文建立合理的标题层级。";
}

/** 构建主题生成系统提示词 */
export function buildThemePrompt(): string {
  return [
    "你是一个微信公众号 Markdown 排版主题 CSS 设计师。",
    "你的任务是根据用户的描述,生成适配公众号 Markdown 排版的 CSS 代码。",
    "",
    "硬性要求:",
    "1. 只输出 CSS 代码,不要用 ``` 代码块包裹,不要加任何解释说明",
    "2. 所有选择器必须以 #wemd 为根前缀(预览容器的 id 为 wemd)",
    "3. 必须覆盖以下全部元素,不能遗漏:",
    "   #wemd (全局容器:字体、字号、行高、颜色、间距)",
    "   #wemd p (段落)",
    "   #wemd h1 ~ h6 (标题,需有层级递减的字号)",
    "   #wemd h1 .content ~ h6 .content (标题内容,项目用 span.content 包裹)",
    "   #wemd h1 .prefix, #wemd h1 .suffix, ... h6 .prefix/.suffix (设为 display:none)",
    "   #wemd ul, #wemd ol, #wemd li, #wemd li section (列表)",
    "   #wemd blockquote, #wemd .multiquote-1, #wemd .multiquote-2, #wemd .multiquote-3 (引用)",
    "   #wemd a (链接)",
    "   #wemd strong (加粗)",
    "   #wemd em, #wemd em strong (斜体)",
    "   #wemd del (删除线)",
    "   #wemd u (下划线)",
    "   #wemd mark (高亮)",
    "   #wemd hr (分隔线)",
    "   #wemd pre, #wemd pre.custom, #wemd pre code (代码块)",
    "   #wemd p code, #wemd li code (行内代码)",
    "   #wemd img, #wemd figure, #wemd figcaption (图片)",
    "   #wemd .table-container, #wemd table, #wemd th, #wemd td, #wemd tr (表格)",
    "   #wemd .footnote-word, #wemd .footnote-ref, #wemd .footnote-item, #wemd .footnote-num, #wemd .footnotes-sep (脚注)",
    "   #wemd .block-equation, #wemd .inline-equation (公式)",
    "   #wemd .callout, #wemd .callout-title, #wemd .callout-icon (提示框)",
    "   #wemd .callout-note/.callout-tip/.callout-important/.callout-warning/.callout-caution (5种提示类型)",
    "   #wemd .task-list-item (任务列表)",
    "   #wemd .hljs 及常见 .hljs-* 代码高亮(可选,不写则用默认)",
    "",
    "4. 排版规范:",
    "   - 正文字号 15-16px,行高 1.75-2",
    "   - 标题字号合理递增(h1 > h2 > ... > h6)",
    "   - 颜色对比度满足 WCAG AA(正文与背景 ≥ 4.5:1)",
    "   - 代码块 pre 需有背景色、内边距、圆角",
    "   - 表格需有边框或分隔线,表头有背景色,单元格 min-width: 85px",
    "   - 图片 max-width: 100%,居中显示",
    "   - 引用块需有左边框或背景色,与正文区分",
    "   - #wemd 是内容容器,会自动撑满预览/微信内容区域宽度",
    "     可设置 padding 控制内边距,但不要设置 width/max-width/margin 居中",
    "     否则背景色只显示在中间一条,两侧露出白色,导致\"背景色显示不全\"",
    "",
    "   ★ 整篇背景色的重要限制(必须遵守):",
    "   - 不要给 #wemd 设置 background-color (整篇背景色)",
    "   - 原因:CSS 的 background-color 不继承,只在 #wemd 外层生效;",
    "     段落 p 之间的 margin 区域不属于任何元素背景范围,会露出白色;",
    "     微信公众号粘贴时还可能拆解外层 section,导致背景色大面积失效",
    "   - 替代方案:只用文字颜色、标题装饰、引用/代码块/表格等局部背景色",
    "     来营造氛围,保持 #wemd 背景透明",
    "   - 如必须用整篇背景色:需同时给 #wemd 及所有子块级元素(p/h1~h6/",
    "     blockquote/ul/ol/pre/.table-container)都设置相同 background-color,",
    "     并把段落间距用 padding 而非 margin 实现(因背景色覆盖 padding-box 不覆盖 margin)",
    "",
    "5. 安全限制:",
    "   - 禁止 <script>、javascript:、expression()、外部 url()",
    "   - 禁止 @import 引入外部样式表",
    "   - 禁止 position: fixed/absolute 脱离文档流",
    "   - 禁止在 #wemd 上使用 max-width / width / margin: 0 auto (会导致背景色不撑满)",
    "   - 禁止给 #wemd 设置 background-color (会导致段落间露白,微信粘贴后失效)",
    "",
    "6. 风格建议:",
    "   - 根据用户描述选择配色(暖色/冷色/中性/莫兰迪等)",
    "   - 圆角、阴影、间距要协调统一",
    "   - 标题层级分明,便于扫读",
    "   - 可以用 ::before/::after 伪元素增加装饰(如序号、下划线)",
  ].join("\n");
}

/** 简单清洗 AI 返回的 CSS:去代码块包裹 + 过滤危险内容 */
export function sanitizeCss(raw: string): string {
  let css = raw.trim();

  // 提取所有 ```css ... ``` 或 ``` ... ``` 代码块内容
  const codeBlockPattern = /```(?:css|style)?\s*\n([\s\S]*?)\n```/g;
  const matches = [...css.matchAll(codeBlockPattern)];
  if (matches.length > 0) {
    css = matches.map((m) => m[1].trim()).join("\n\n");
  } else {
    // 没有代码块包裹时,去掉可能的开场白(如"这是生成的CSS:")
    const lines = css.split("\n");
    const cssLines = lines.filter(
      (line) =>
        line.includes("{") ||
        line.includes("}") ||
        line.includes(":") ||
        line.includes("/*") ||
        line.includes("*/") ||
        line.trim() === "" ||
        line.trim().startsWith("#") ||
        line.trim().startsWith(".") ||
        line.trim().startsWith("@"),
    );
    if (cssLines.length > 0) {
      css = cssLines.join("\n");
    }
  }

  // 过滤危险模式
  const dangerous = [
    /expression\s*\(/gi,
    /javascript:/gi,
    /<script[\s\S]*?<\/script>/gi,
    /@import\s+/gi,
    /url\s*\(\s*['"]?\s*https?:\/\//gi,
  ];
  for (const pattern of dangerous) {
    css = css.replace(pattern, "");
  }

  // 清理 #wemd 根容器上的布局属性和整篇背景色
  css = css.replace(
    /(#wemd\s*\{)([^}]*)(\})/g,
    (_match, open: string, body: string, close: string) => {
      const cleaned = body
        .replace(/max-width\s*:[^;]+;?/gi, "")
        .replace(/\bwidth\s*:[^;]+;?/gi, "")
        .replace(/margin\s*:[^;]*\bauto\b[^;]*;?/gi, "")
        .replace(/background-color\s*:[^;]+;?/gi, "")
        .replace(/background\s*:[^;]+;?/gi, "");
      return `${open}${cleaned}${close}`;
    },
  );

  return css.trim();
}
