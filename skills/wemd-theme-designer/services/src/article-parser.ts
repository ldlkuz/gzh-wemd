// ============================================================
// Article Parser — 文章解析器（确定性代码）
// ============================================================
// 解析 HTML/Markdown 文章，识别结构元素并映射到 WeMD 组件。
// 不依赖 AI，所有规则都是确定性的。

export interface ParsedArticle {
  title: string;
  blocks: ArticleBlock[];
  metadata: {
    wordCount: number;
    hasImages: boolean;
    hasQuotes: boolean;
    hasLists: boolean;
    hasCode: boolean;
    estimatedReadTime: number; // 分钟
  };
}

export interface ArticleBlock {
  type: "hero" | "heading" | "subheading" | "paragraph" | "quote" | "list" | "image" | "code" | "faq" | "divider" | "cta" | "brand-sign";
  content: string;
  level?: number; // heading level
  items?: string[]; // list items
  source?: string; // image source
  metadata?: Record<string, string>;
}

// ── 解析 HTML 文章 ──
export function parseHtmlArticle(html: string, title?: string): ParsedArticle {
  const blocks: ArticleBlock[] = [];
  let wordCount = 0;
  let hasImages = false;
  let hasQuotes = false;
  let hasLists = false;
  let hasCode = false;

  // 提取标题
  const titleMatch = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
  const articleTitle = title || titleMatch?.[1] || "未命名文章";

  // 提取 body 内容
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  const bodyContent = bodyMatch?.[1] || html;

  // 按块级元素分割
  const blockRegex = /<(h[12]|p|blockquote|ul|ol|img|pre|section|hr|div)[^>]*>([\s\S]*?)<\/\1>/gi;
  let match: RegExpExecArray | null;

  while ((match = blockRegex.exec(bodyContent)) !== null) {
    const tag = match[1].toLowerCase();
    const innerContent = match[2].trim();

    switch (tag) {
      case "h1":
        blocks.push({ type: "hero", content: innerContent, level: 1 });
        wordCount += innerContent.split(/\s+/).length;
        break;

      case "h2":
        blocks.push({ type: "heading", content: innerContent, level: 2 });
        wordCount += innerContent.split(/\s+/).length;
        break;

      case "p":
        // 检查是否是 FAQ 段落
        if (innerContent.match(/^(问|Q|问题)[：:]\s*/i)) {
          blocks.push({ type: "faq", content: innerContent.replace(/^(问|Q|问题)[：:]\s*/i, "") });
        } else {
          blocks.push({ type: "paragraph", content: innerContent });
        }
        wordCount += innerContent.split(/\s+/).length;
        break;

      case "blockquote":
        blocks.push({ type: "quote", content: innerContent.replace(/<[^>]+>/g, "") });
        hasQuotes = true;
        wordCount += innerContent.split(/\s+/).length;
        break;

      case "ul":
      case "ol": {
        const items = innerContent.match(/<li[^>]*>([\s\S]*?)<\/li>/gi);
        if (items) {
          const listItems = items.map((item) => item.replace(/<[^>]*>/g, "").trim());
          // 检测是否为 FAQ 列表
          if (listItems.some((item) => item.match(/^(问|Q|问题|答|A|答案)[：:]/i))) {
            blocks.push({ type: "faq", content: listItems.join(" | ") });
          } else {
            blocks.push({ type: "list", content: listItems.join(", "), items: listItems });
          }
          hasLists = true;
          listItems.forEach((item) => { wordCount += item.split(/\s+/).length; });
        }
        break;
      }

      case "img": {
        const srcMatch = innerContent.match(/src\s*=\s*["']([^"']+)["']/i);
        if (srcMatch) {
          blocks.push({ type: "image", content: "", source: srcMatch[1] });
          hasImages = true;
        }
        break;
      }

      case "pre":
        blocks.push({ type: "code", content: innerContent.replace(/<[^>]+>/g, "") });
        hasCode = true;
        break;

      case "hr":
        blocks.push({ type: "divider", content: "---" });
        break;

      case "section": {
        // 检测 FAQ section
        if (innerContent.match(/faq/i)) {
          const faqItems = innerContent.match(/<([^>]+)>[^<]*<\/\1>/g);
          if (faqItems) {
            blocks.push({ type: "faq", content: faqItems.map((f) => f.replace(/<[^>]*>/g, "")).join(" | ") });
          }
        }
        break;
      }

      case "div":
        // 检查 div 内部是否有其他块级元素
        // 简单处理：跳过 div，其内容由子元素处理
        break;
    }
  }

  // 检测 HTML 中是否包含 FAQ 结构
  if (html.match(/class\s*=\s*["'][^"']*faq[^"']*["']/i)) {
    hasQuotes = true; // FAQ 类似引用结构
  }

  // 检测结尾品牌签名
  const lastBlocks = blocks.slice(-3);
  const hasBrandSign = lastBlocks.some(
    (b) => b.type === "paragraph" && (b.content.match(/品牌|签名|关注|扫码|公众号/i) || b.content.length < 30)
  );

  return {
    title: articleTitle,
    blocks,
    metadata: {
      wordCount,
      hasImages,
      hasQuotes,
      hasLists,
      hasCode,
      estimatedReadTime: Math.max(1, Math.ceil(wordCount / 300)),
    },
  };
}

// ── 解析 Markdown 文章 ──
export function parseMarkdownArticle(md: string, title?: string): ParsedArticle {
  const blocks: ArticleBlock[] = [];
  let wordCount = 0;
  let hasImages = false;
  let hasQuotes = false;
  let hasLists = false;
  let hasCode = false;

  const lines = md.split("\n");
  let articleTitle = title || "未命名文章";
  let currentList: string[] = [];
  let inCodeBlock = false;
  let codeContent = "";

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // 代码块
    if (line.startsWith("```")) {
      if (inCodeBlock) {
        blocks.push({ type: "code", content: codeContent.trim() });
        codeContent = "";
        hasCode = true;
      }
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) {
      codeContent += line + "\n";
      continue;
    }

    // 空行 → 结束当前列表
    if (!line) {
      if (currentList.length > 0) {
        blocks.push({ type: "list", content: currentList.join(", "), items: [...currentList] });
        currentList = [];
        hasLists = true;
      }
      continue;
    }

    // 标题
    if (line.startsWith("# ")) {
      const content = line.slice(2);
      articleTitle = title || content;
      blocks.push({ type: "hero", content, level: 1 });
      wordCount += content.split(/\s+/).length;
    } else if (line.startsWith("## ")) {
      const content = line.slice(3);
      blocks.push({ type: "heading", content, level: 2 });
      wordCount += content.split(/\s+/).length;
    } else if (line.startsWith("### ")) {
      const content = line.slice(4);
      blocks.push({ type: "subheading", content, level: 3 });
      wordCount += content.split(/\s+/).length;
    }
    // 引用
    else if (line.startsWith("> ")) {
      const content = line.slice(2);
      blocks.push({ type: "quote", content });
      hasQuotes = true;
      wordCount += content.split(/\s+/).length;
    }
    // 列表
    else if (line.match(/^[-*+]\s/)) {
      currentList.push(line.replace(/^[-*+]\s/, ""));
    } else if (line.match(/^\d+[.)]\s/)) {
      currentList.push(line.replace(/^\d+[.)]\s/, ""));
    }
    // 图片
    else if (line.match(/!\[.*?\]\(.*?\)/)) {
      const srcMatch = line.match(/\(([^)]+)\)/);
      const altMatch = line.match(/\[([^\]]*)\]/);
      blocks.push({
        type: "image",
        content: altMatch?.[1] || "",
        source: srcMatch?.[1] || "",
      });
      hasImages = true;
    }
    // 分割线
    else if (line.match(/^[-*_]{3,}$/)) {
      // 先结束当前列表
      if (currentList.length > 0) {
        blocks.push({ type: "list", content: currentList.join(", "), items: [...currentList] });
        currentList = [];
        hasLists = true;
      }
      blocks.push({ type: "divider", content: "---" });
    }
    // 普通段落
    else {
      // 先结束当前列表
      if (currentList.length > 0) {
        blocks.push({ type: "list", content: currentList.join(", "), items: [...currentList] });
        currentList = [];
        hasLists = true;
      }

      // 检测 FAQ 段落
      if (line.match(/^(问|Q|问题|答|A|答案)[：:]/i)) {
        blocks.push({ type: "faq", content: line.replace(/^(问|Q|问题|答|A|答案)[：:]\s*/i, "") });
      } else {
        blocks.push({ type: "paragraph", content: line });
      }
      wordCount += line.split(/\s+/).length;
    }
  }

  // 结束最后的列表
  if (currentList.length > 0) {
    blocks.push({ type: "list", content: currentList.join(", "), items: [...currentList] });
    hasLists = true;
  }

  // 检测结尾品牌签名
  const lastBlocks = blocks.slice(-3);
  const hasBrandSign = lastBlocks.some(
    (b) => b.type === "paragraph" && (b.content.match(/品牌|签名|关注|扫码|公众号/i) || b.content.length < 30)
  );
  if (!hasBrandSign && !blocks.some((b) => b.type === "brand-sign")) {
    // 根据文章长度判断是否添加品牌签名
    if (blocks.length > 3) {
      blocks.push({ type: "brand-sign", content: "品牌签名" });
    }
  }

  return {
    title: articleTitle,
    blocks,
    metadata: {
      wordCount,
      hasImages,
      hasQuotes,
      hasLists,
      hasCode,
      estimatedReadTime: Math.max(1, Math.ceil(wordCount / 300)),
    },
  };
}

// ── 自动检测文章类型并解析 ──
export function parseArticle(input: string, title?: string): ParsedArticle {
  const trimmed = input.trim();

  // 检测是否为 HTML
  if (trimmed.startsWith("<") && trimmed.match(/<html|<body|<div|<p|<h[12]/i)) {
    return parseHtmlArticle(trimmed, title);
  }

  // 默认为 Markdown
  return parseMarkdownArticle(trimmed, title);
}