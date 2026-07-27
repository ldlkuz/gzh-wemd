/**
 * 杂志级组件专用渲染器
 *
 * 为什么需要专用渲染器？
 * - Markdown 渲染输出 p/ul/li 等标签，CSS 需要大量伪类选择器
 * - juice 内联工具无法正确处理伪类选择器和 flex 布局
 * - 微信公众号对复杂 CSS 选择器支持有限
 *
 * 解决方案：
 * - 杂志级组件直接输出 section 嵌套结构，和公众号原生排版一致
 * - 结构扁平、语义明确，juice 内联后样式完整保留
 *
 * 约定的内容格式（Markdown 写法）：
 * - magazine-cover：
 *   第1行 = 主标题
 *   第2行 = 英文副标题
 *   第3行 = ---（装饰线）
 *   第4行+ = 描述文字（支持多行）
 *
 * - section-divider：
 *   第1行 = PART 编号
 *   第2行 = 章节标题
 *
 * - two-column-cards：
 *   列表格式，每个 li 是一栏
 *   li 内第1行 = emoji 图标
 *   第2行 = **标题**
 *   第3行+ = 描述
 *
 * - full-quote：
 *   所有段落都是引用文字
 *
 * - image-card：
 *   第1段 = ![](图片地址)
 *   第2段 = 说明文字（可选）
 *
 * - end-card：
 *   第1行 = 主标题
 *   第2行 = 副标题
 *   第3行+ = 装饰元素（可选）
 */

/**
 * 解析组件的原始文本内容，按段落分割
 */
function parseParagraphs(content: string): string[] {
  return content
    .trim()
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

/**
 * 解析单行内容，按行分割
 */
function parseLines(content: string): string[] {
  return content
    .trim()
    .split("\n")
    .map((l) => l.trim());
}

/**
 * 将 Markdown 粗体 **text** 去掉标记，返回纯文本
 */
function stripMarkdown(text: string): string {
  return text.replace(/\*\*(.+?)\*\*/g, "$1").replace(/\*(.+?)\*/g, "$1");
}

/**
 * 提取列表项（解析 markdown 列表）
 * 返回每个 li 的纯文本
 */
function parseListItems(content: string): string[] {
  const lines = content
    .trim()
    .split("\n")
    .map((l) => l.trim());
  const items: string[] = [];
  let currentItem: string[] = [];

  for (const line of lines) {
    if (/^[-*+]\s+/.test(line)) {
      if (currentItem.length) {
        items.push(currentItem.join(" "));
      }
      currentItem = [line.replace(/^[-*+]\s+/, "")];
    } else if (line && currentItem.length) {
      currentItem.push(line);
    }
  }
  if (currentItem.length) {
    items.push(currentItem.join(" "));
  }

  return items.filter(Boolean);
}

/**
 * 解析列表项中的结构：图标 / 标题 / 描述
 * 格式：
 * - ☀️
 *   **阳光**
 *   每一天都充满能量
 *
 * 这里简化处理：每个 li 的内容用 <br> 分割
 * 第1行 = 图标
 * 第2行 = 标题（可能带 **）
 * 第3行+ = 描述
 */
function parseCardItem(text: string): {
  icon: string;
  title: string;
  desc: string;
} {
  const parts = text.split(/<br\s*\/?>/i).map((s) => s.trim());
  let icon = "";
  let title = "";
  let desc = "";

  if (parts.length >= 1) {
    icon = parts[0].replace(/\*\*(.+?)\*\*/g, "$1");
  }
  if (parts.length >= 2) {
    title = stripMarkdown(parts[1]);
  }
  if (parts.length >= 3) {
    desc = stripMarkdown(parts.slice(2).join(" "));
  }

  return { icon, title, desc };
}

/**
 * magazine-cover 渲染器
 * 输出：
 * <section class="wemd-mc-title">主标题</section>
 * <section class="wemd-mc-subtitle">英文副标题</section>
 * <section class="wemd-mc-divider"></section>
 * <section class="wemd-mc-desc">描述文字</section>
 */
export function renderMagazineCover(rawContent: string): string {
  const lines = parseLines(rawContent);
  let title = "";
  let subtitle = "";
  let hasDivider = false;
  const descLines: string[] = [];

  let phase = 0; // 0=找标题, 1=找副标题, 2=找分隔线, 3=找描述
  for (const line of lines) {
    if (phase === 0 && line) {
      title = line;
      phase = 1;
      continue;
    }
    if (phase === 1 && line) {
      subtitle = line;
      phase = 2;
      continue;
    }
    if (phase === 2) {
      if (/^[-=*_]{3,}$/.test(line)) {
        hasDivider = true;
        phase = 3;
      } else if (line) {
        descLines.push(line);
        phase = 3;
      }
      continue;
    }
    if (phase === 3 && line) {
      descLines.push(line);
    }
  }

  const parts: string[] = [];
  if (title) {
    parts.push(`<section class="wemd-mc-title">${escapeHtml(title)}</section>`);
  }
  if (subtitle) {
    parts.push(
      `<section class="wemd-mc-subtitle">${escapeHtml(subtitle)}</section>`,
    );
  }
  if (hasDivider) {
    parts.push(`<section class="wemd-mc-divider"></section>`);
  }
  if (descLines.length) {
    parts.push(
      `<section class="wemd-mc-desc">${descLines.join("<br>")}</section>`,
    );
  }

  return parts.join("\n");
}

/**
 * section-divider 渲染器
 * 输出：
 * <section class="wemd-sd-part">PART 01</section>
 * <section class="wemd-sd-title">章节标题</section>
 */
export function renderSectionDivider(rawContent: string): string {
  const lines = parseLines(rawContent).filter(Boolean);
  let part = "";
  let title = "";

  if (lines.length >= 1) part = lines[0];
  if (lines.length >= 2) title = lines[1];

  const parts: string[] = [];
  if (part) {
    parts.push(`<section class="wemd-sd-part">${escapeHtml(part)}</section>`);
  }
  if (title) {
    parts.push(`<section class="wemd-sd-title">${escapeHtml(title)}</section>`);
  }

  return parts.join("\n");
}

/**
 * two-column-cards 渲染器
 * 输出：
 * <section class="wemd-tcc-wrapper">
 *   <section class="wemd-tcc-item">
 *     <section class="wemd-tcc-icon">☀️</section>
 *     <section class="wemd-tcc-title">阳光</section>
 *     <section class="wemd-tcc-desc">每一天都充满能量</section>
 *   </section>
 *   ...
 * </section>
 */
export function renderTwoColumnCards(rawContent: string): string {
  const items = parseListItems(rawContent);
  if (!items.length) return "";

  const itemHtmls = items.map((itemText) => {
    const { icon, title, desc } = parseCardItem(itemText);
    return [
      `<section class="wemd-tcc-item">`,
      icon
        ? `  <section class="wemd-tcc-icon">${escapeHtml(icon)}</section>`
        : "",
      title
        ? `  <section class="wemd-tcc-title">${escapeHtml(title)}</section>`
        : "",
      desc
        ? `  <section class="wemd-tcc-desc">${escapeHtml(desc)}</section>`
        : "",
      `</section>`,
    ]
      .filter(Boolean)
      .join("\n");
  });

  return [
    `<section class="wemd-tcc-wrapper">`,
    ...itemHtmls,
    `</section>`,
  ].join("\n");
}

/**
 * full-quote 渲染器
 * 输出：
 * <section class="wemd-fq-text">引用文字</section>
 */
export function renderFullQuote(rawContent: string): string {
  const paragraphs = parseParagraphs(rawContent);
  const htmls = paragraphs.map(
    (p) => `<section class="wemd-fq-text">${escapeHtml(p)}</section>`,
  );
  return htmls.join("\n");
}

/**
 * image-card 渲染器
 * 输出：
 * <section class="wemd-ic-image"><img src="..." alt="..."></section>
 * <section class="wemd-ic-caption">说明文字</section>
 */
export function renderImageCard(rawContent: string): string {
  const paragraphs = parseParagraphs(rawContent);
  let imgSrc = "";
  let imgAlt = "";
  let caption = "";

  for (const p of paragraphs) {
    const imgMatch = p.match(/!\[([^\]]*)\]\(([^)]+)\)/);
    if (imgMatch && !imgSrc) {
      imgAlt = imgMatch[1];
      imgSrc = imgMatch[2];
    } else if (!caption) {
      caption = p.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, "").trim();
    }
  }

  const parts: string[] = [];
  if (imgSrc) {
    parts.push(
      `<section class="wemd-ic-image"><img src="${escapeHtmlAttr(imgSrc)}" alt="${escapeHtmlAttr(imgAlt)}"></section>`,
    );
  }
  if (caption) {
    parts.push(
      `<section class="wemd-ic-caption">${escapeHtml(caption)}</section>`,
    );
  }

  return parts.join("\n");
}

/**
 * end-card 渲染器
 * 输出：
 * <section class="wemd-ec-title">Thanks</section>
 * <section class="wemd-ec-subtitle">感谢阅读</section>
 * <section class="wemd-ec-deco">🌸</section>
 */
export function renderEndCard(rawContent: string): string {
  const lines = parseLines(rawContent).filter(Boolean);
  let title = "";
  let subtitle = "";
  let deco = "";

  if (lines.length >= 1) title = lines[0];
  if (lines.length >= 2) subtitle = lines[1];
  if (lines.length >= 3) deco = lines.slice(2).join(" ");

  const parts: string[] = [];
  if (title) {
    parts.push(`<section class="wemd-ec-title">${escapeHtml(title)}</section>`);
  }
  if (subtitle) {
    parts.push(
      `<section class="wemd-ec-subtitle">${escapeHtml(subtitle)}</section>`,
    );
  }
  if (deco) {
    parts.push(`<section class="wemd-ec-deco">${escapeHtml(deco)}</section>`);
  }

  return parts.join("\n");
}

/**
 * 杂志级组件渲染器映射表
 */
export const MAGAZINE_RENDERERS: Record<string, (content: string) => string> = {
  "magazine-cover": renderMagazineCover,
  "section-divider": renderSectionDivider,
  "two-column-cards": renderTwoColumnCards,
  "full-quote": renderFullQuote,
  "image-card": renderImageCard,
  "end-card": renderEndCard,
};

/** 转义 HTML 文本 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** 转义 HTML 属性 */
function escapeHtmlAttr(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
