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
  fullQuote: renderFullQuote,
  "image-card": renderImageCard,
  "end-card": renderEndCard,
  // 新增扩展组件结构渲染器
  "product-card": renderProductCard,
  "brand-sign": renderBrandSign,
  "resource-list": renderResourceList,
  "testimonial-card": renderTestimonialCard,
  "series-nav": renderSeriesNav,
};

/* === 新增扩展组件的结构渲染器 === */

/**
 * product-card 产品/商品卡片
 * 结构：.wemd-product-card
 *   .wemd-pc-image        产品图
 *   .wemd-pc-badge        角标
 *   .wemd-pc-title        标题（加粗）
 *   .wemd-pc-subtitle     副标题
 *   .wemd-pc-description  详细描述
 *   .wemd-pc-price-row    价格行
 *     .wemd-pc-price      现价（大字，强调色）
 *     .wemd-pc-original   原价（删除线）
 *   .wemd-pc-meta-row     元信息行：⭐评分 / 销量 / 库存
 *   .wemd-pc-button       购买按钮
 *   .wemd-pc-tags         标签行：#顺丰包邮 #七天无理由
 */
export function renderProductCard(rawContent: string): string {
  const paragraphs = parseParagraphs(rawContent);
  // product-card 的段落顺序：图(可选) → 标题行(badge+title+subtitle) → desc(可选) → price+original → meta(可选) → button → tags(可选)
  let cursor = 0;
  const pickImg = (
    text: string,
  ): { alt: string; src: string; rest: string } | null => {
    const m = text.match(/!\[([^\]]*)\]\(([^)]+)\)/);
    if (!m) return null;
    const rest = text.replace(m[0], "").trim();
    return { alt: m[1], src: m[2], rest };
  };

  const image = pickImg(paragraphs[cursor] || "");
  if (image) cursor++;
  const imgSrc = image?.src || "";

  // 标题行：提取【badge】、**title**、subtitle
  const titleLine = paragraphs[cursor] || "";
  cursor++;
  let badge = "";
  let title = "";
  let subtitle = "";
  {
    const badgeMatch = titleLine.match(/【([^】]+)】/);
    if (badgeMatch) badge = badgeMatch[1];
    const titleMatch = titleLine.match(/\*\*([^*]+)\*\*/);
    if (titleMatch) title = titleMatch[1];
    // 去掉 badge 和 **title** 剩下的就是 subtitle
    let rest = titleLine;
    if (badgeMatch) rest = rest.replace(badgeMatch[0], "");
    if (titleMatch) rest = rest.replace(titleMatch[0], "");
    subtitle = rest.trim();
  }

  // description：若下一段不是价格行（不含 💰、￥、¥、删除线）则是 desc
  let description = "";
  const next = paragraphs[cursor] || "";
  const hasPrice = /💰|￥|¥|~~/.test(next);
  if (!hasPrice && next) {
    description = next;
    cursor++;
  }

  // 价格行
  let price = "";
  let originalPrice = "";
  const priceLine = paragraphs[cursor] || "";
  if (priceLine) {
    cursor++;
    const priceMatch = priceLine.match(/(💰\s*)?([￥¥]\s*\d+(?:\.\d+)?)/);
    if (priceMatch) price = priceMatch[2];
    const origMatch = priceLine.match(/~~([^~]+)~~/);
    if (origMatch) originalPrice = origMatch[1];
    if (!price) {
      // 兜底：取第一段非 ~~ 文本
      const parts = priceLine.split(/\s+/).filter(Boolean);
      price = parts.find((p) => !p.startsWith("~~") && /[￥¥\d]/.test(p)) || "";
    }
  }

  // meta 行：⭐rating / sales / stock
  let rating = "";
  let sales = "";
  let stock = "";
  const metaLine = paragraphs[cursor] || "";
  if (metaLine && !metaLine.includes("【") && !metaLine.startsWith("#")) {
    const starMatch = metaLine.match(/([⭐☆]+)/);
    const starNumMatch = metaLine.match(/(\d+(?:\.\d+)?)/);
    if (starMatch)
      rating = starMatch[0] + (starNumMatch ? " " + starNumMatch[1] : "");
    const saleMatch = metaLine.match(/📦\s*([^\s]+(?:\s[^\s🔥]+)*)/u);
    if (saleMatch) sales = saleMatch[1];
    const stockMatch = metaLine.match(/🔥\s*([^\s]+(?:\s[^\s]+)*)/u);
    if (stockMatch) stock = stockMatch[1];
    cursor++;
  }

  // 按钮
  let button = "";
  const btnLine = paragraphs[cursor] || "";
  if (/【.+】/.test(btnLine)) {
    const m = btnLine.match(/【([^】]+)】/);
    if (m) button = m[1];
    cursor++;
  }

  // 标签：#顺丰包邮  #七天无理由
  const tags: string[] = [];
  const tagsLine = paragraphs[cursor] || "";
  if (tagsLine && tagsLine.startsWith("#")) {
    tagsLine.split(/\s+/).forEach((t) => {
      if (t.startsWith("#")) tags.push(t.slice(1));
    });
  }

  const parts: string[] = [];
  if (imgSrc) {
    parts.push(
      `<section class="wemd-pc-image"><img src="${escapeHtmlAttr(imgSrc)}" alt="product"></section>`,
    );
  }
  const headerParts: string[] = [];
  if (badge)
    headerParts.push(
      `<section class="wemd-pc-badge">${escapeHtml(badge)}</section>`,
    );
  if (title)
    headerParts.push(
      `<section class="wemd-pc-title">${escapeHtml(title)}</section>`,
    );
  if (subtitle)
    headerParts.push(
      `<section class="wemd-pc-subtitle">${escapeHtml(subtitle)}</section>`,
    );
  if (headerParts.length)
    parts.push(
      `<section class="wemd-pc-header">${headerParts.join("")}</section>`,
    );
  if (description) {
    parts.push(
      `<section class="wemd-pc-description">${escapeHtml(description)}</section>`,
    );
  }
  const priceParts: string[] = [];
  if (price)
    priceParts.push(
      `<section class="wemd-pc-price">${escapeHtml(price)}</section>`,
    );
  if (originalPrice) {
    priceParts.push(
      `<section class="wemd-pc-original"><s>${escapeHtml(originalPrice)}</s></section>`,
    );
  }
  if (priceParts.length) {
    parts.push(
      `<section class="wemd-pc-price-row">${priceParts.join("")}</section>`,
    );
  }
  const metaParts: string[] = [];
  if (rating)
    metaParts.push(
      `<section class="wemd-pc-rating">${escapeHtml(rating)}</section>`,
    );
  if (sales)
    metaParts.push(
      `<section class="wemd-pc-sales">${escapeHtml(sales)}</section>`,
    );
  if (stock)
    metaParts.push(
      `<section class="wemd-pc-stock">${escapeHtml(stock)}</section>`,
    );
  if (metaParts.length) {
    parts.push(
      `<section class="wemd-pc-meta-row">${metaParts.join("")}</section>`,
    );
  }
  if (button) {
    parts.push(
      `<section class="wemd-pc-button">${escapeHtml(button)}</section>`,
    );
  }
  if (tags.length) {
    const tagHtmls = tags
      .map((t) => `<span class="wemd-pc-tag">#${escapeHtml(t)}</span>`)
      .join("");
    parts.push(`<section class="wemd-pc-tags">${tagHtmls}</section>`);
  }

  return parts.join("\n");
}

/**
 * brand-sign 品牌签名 Logo 小标
 * 结构：.wemd-brand-sign
 *   .wemd-bs-logo         Logo 图
 *   .wemd-bs-brand-name   品牌名
 *   .wemd-bs-slogan       Slogan
 *   .wemd-bs-subtext      小字版权
 * data-style：inline / stacked / centered
 * data-divider：true / false
 */
export function renderBrandSign(rawContent: string): string {
  const paragraphs = parseParagraphs(rawContent);
  let logoSrc = "";
  let brandName = "";
  let slogan = "";
  let style = "";
  let divider = false;
  let subText = "";

  let cursor = 0;
  const p0 = paragraphs[0] || "";
  const img = p0.match(/!\[([^\]]*)\]\(([^)]+)\)/);
  if (img) {
    logoSrc = img[2];
    cursor = 1;
  }

  const nameP = paragraphs[cursor] || "";
  const m = nameP.match(/\*\*([^*]+)\*\*/);
  if (m) brandName = m[1];
  cursor++;

  const slog = paragraphs[cursor];
  if (
    slog &&
    !slog.includes("style=") &&
    !slog.includes("divider") &&
    !slog.startsWith("*")
  ) {
    slogan = slog;
    cursor++;
  }

  const meta = paragraphs[cursor];
  if (meta && (meta.includes("style=") || meta.includes("divider"))) {
    const s = meta.match(/style=(inline|stacked|centered)/);
    if (s) style = s[1];
    divider = /divider\s*=\s*true/.test(meta);
    cursor++;
  }

  const last = paragraphs[cursor];
  if (last) {
    const em = last.match(/^\*([^*]+)\*$/);
    subText = em ? em[1] : last;
  }

  const attrStyle = style ? ` data-style="${escapeHtmlAttr(style)}"` : "";
  const attrDivider = divider ? ' data-divider="true"' : "";
  const parts: string[] = [];
  if (logoSrc) {
    parts.push(
      `<section class="wemd-bs-logo"><img src="${escapeHtmlAttr(logoSrc)}" alt="logo"></section>`,
    );
  }
  if (brandName) {
    parts.push(
      `<section class="wemd-bs-brand-name">${escapeHtml(brandName)}</section>`,
    );
  }
  if (slogan)
    parts.push(
      `<section class="wemd-bs-slogan">${escapeHtml(slogan)}</section>`,
    );
  if (subText)
    parts.push(
      `<section class="wemd-bs-subtext">${escapeHtml(subText)}</section>`,
    );

  return `<section class="wemd-bs-wrapper"${attrStyle}${attrDivider}>\n${parts.join("\n")}\n</section>`;
}

/**
 * resource-list 资料清单 / 步骤清单
 * 结构：.wemd-resource-list
 *   .wemd-rl-title        标题（加粗）
 *   .wemd-rl-subtitle     副标题
 *   .wemd-rl-items
 *     .wemd-rl-item[data-type][data-numbered]
 *       .wemd-rl-idx / .wemd-rl-icon   序号 或 类型图标
 *       .wemd-rl-main
 *         .wemd-rl-item-title  标题
 *         .wemd-rl-item-desc   描述
 *       .wemd-rl-meta          右侧元信息
 *       .wemd-rl-tag           标签
 * data-numbered：true / false
 * data-layout：compact / comfortable
 */
export function renderResourceList(rawContent: string): string {
  const allLines = rawContent
    .split("\n")
    .map((l) => l.trimEnd())
    .filter((l) => l !== "---"); // 分隔线忽略
  // 头三段：title、subtitle(可选)、meta(numbered/layout)，然后是列表项 "- ..."
  let title = "";
  let subtitle = "";
  let numbered = false;
  let layout = "comfortable";
  let listStartIdx = 0;

  for (let i = 0; i < Math.min(3, allLines.length); i++) {
    const l = allLines[i];
    if (!l) continue;
    if (/^- /.test(l)) {
      listStartIdx = i;
      break;
    }
    const mBold = l.match(/^\*\*([^*]+)\*\*$/);
    if (mBold && !title) {
      title = mBold[1];
      listStartIdx = i + 1;
      continue;
    }
    if (/numbered\s*=\s*(true|false)/.test(l) || /layout\s*=\s*/.test(l)) {
      const nm = l.match(/numbered\s*=\s*(true|false)/);
      if (nm) numbered = nm[1] === "true";
      const lm = l.match(/layout\s*=\s*(compact|comfortable)/);
      if (lm) layout = lm[1];
      listStartIdx = i + 1;
      break;
    }
    // 到这里就是 subtitle
    if (!subtitle) {
      subtitle = l;
      listStartIdx = i + 1;
    }
  }

  const itemsHtml: string[] = [];
  for (let i = listStartIdx; i < allLines.length; i++) {
    const line = allLines[i];
    if (!line) continue;
    const itemMatch = line.match(/^-\s*\[([a-zA-Z]+)\|(\d+)\]\s*(.*)$/);
    if (!itemMatch) continue;
    const type = itemMatch[1] || "link";
    const idx = Number(itemMatch[2]);
    const rest = itemMatch[3].trim();
    // rest 格式：title  |D=desc  |M=meta  |T=tag  |U=url
    const seg = rest.split(/\s*\|(?=[DMTU]=)/);
    const titlePart = seg[0].trim();
    const descM = rest.match(/\|D=([^|]+)/);
    const metaM = rest.match(/\|M=([^|]+)/);
    const tagM = rest.match(/\|T=([^|]+)/);
    const urlM = rest.match(/\|U=([^|]+)/);
    const desc = descM ? descM[1].trim() : "";
    const meta = metaM ? metaM[1].trim() : "";
    const tag = tagM ? tagM[1].trim() : "";
    const url = urlM ? urlM[1].trim() : "";

    const icons: Record<string, string> = {
      file: "📄",
      link: "🔗",
      video: "🎞️",
      step: "📌",
    };
    const icon = icons[type] || "📎";

    const inner: string[] = [];
    inner.push(
      numbered
        ? `<section class="wemd-rl-idx">${String(idx).padStart(2, "0")}</section>`
        : `<section class="wemd-rl-icon">${icon}</section>`,
    );
    const main: string[] = [];
    if (titlePart) {
      const t = url
        ? `<a href="${escapeHtmlAttr(url)}">${escapeHtml(titlePart)}</a>`
        : escapeHtml(titlePart);
      main.push(`<section class="wemd-rl-item-title">${t}</section>`);
    }
    if (desc)
      main.push(
        `<section class="wemd-rl-item-desc">${escapeHtml(desc)}</section>`,
      );
    inner.push(`<section class="wemd-rl-main">${main.join("")}</section>`);
    if (meta)
      inner.push(`<section class="wemd-rl-meta">${escapeHtml(meta)}</section>`);
    if (tag)
      inner.push(`<section class="wemd-rl-tag">${escapeHtml(tag)}</section>`);
    itemsHtml.push(
      `<section class="wemd-rl-item" data-type="${escapeHtmlAttr(type)}">${inner.join("")}</section>`,
    );
  }

  const parts: string[] = [];
  if (title)
    parts.push(`<section class="wemd-rl-title">${escapeHtml(title)}</section>`);
  if (subtitle)
    parts.push(
      `<section class="wemd-rl-subtitle">${escapeHtml(subtitle)}</section>`,
    );
  if (itemsHtml.length) {
    parts.push(
      `<section class="wemd-rl-items" data-numbered="${numbered ? "true" : "false"}" data-layout="${escapeHtmlAttr(layout)}">`,
    );
    parts.push(itemsHtml.join("\n"));
    parts.push(`</section>`);
  }
  return parts.join("\n");
}

/**
 * testimonial-card 名人推荐 / 客户背书
 * 结构：.wemd-testimonial-card
 *   .wemd-tc-quote         大号引号图标装饰（CSS 伪元素也可，这里也输出图标段落）
 *   .wemd-tc-avatar        头像
 *   .wemd-tc-body          名言正文（blockquote 样式）
 *   .wemd-tc-source        来源（"2005年斯坦福演讲"）
 *   .wemd-tc-person
 *     .wemd-tc-name        姓名
 *     .wemd-tc-title       职位
 *     .wemd-tc-company     公司
 *   .wemd-tc-company-logo  公司 Logo（可选）
 */
export function renderTestimonialCard(rawContent: string): string {
  const paragraphs = parseParagraphs(rawContent);
  let avatarSrc = "";
  let quote = "";
  let source = "";
  let name = "";
  let title = "";
  let company = "";
  let companyLogo = "";

  let cursor = 0;
  const p0 = paragraphs[0] || "";
  const img = p0.match(/!\[([^\]]*)\]\(([^)]+)\)/);
  if (img && !/^>/.test(p0)) {
    avatarSrc = img[2];
    cursor = 1;
  }

  // 找 quote：> **xxx**  或  > xxx
  for (let i = cursor; i < paragraphs.length; i++) {
    const p = paragraphs[i];
    if (p.startsWith(">")) {
      const content = p
        .replace(/^>\s*/, "")
        .replace(/\*\*/g, "")
        .replace(/^——\s*/, "")
        .trim();
      if (!quote && /^—/.test(p.replace(/^>\s*/, "").trim())) {
        source = p.replace(/^>\s*—+\s*/, "").trim();
      } else if (!quote) {
        quote = content;
      } else if (!source) {
        source = p.replace(/^>\s*—+\s*/, "").trim();
      }
      cursor = i + 1;
    } else {
      break;
    }
  }

  // 下一段：**name**  title
  const personLine = paragraphs[cursor] || "";
  if (personLine) {
    cursor++;
    const nm = personLine.match(/\*\*([^*]+)\*\*/);
    if (nm) name = nm[1];
    const rest = personLine.replace(nm ? nm[0] : "", "").trim();
    if (rest) title = rest;
  }

  // 下一段：公司或公司 logo
  const companyLine = paragraphs[cursor] || "";
  if (companyLine) {
    const ci = companyLine.match(/!\[([^\]]*)\]\(([^)]+)\)/);
    if (ci) {
      companyLogo = ci[2];
    } else {
      company = companyLine;
    }
  }

  const parts: string[] = [];
  parts.push(
    `<section class="wemd-tc-quote">${escapeHtml(quote || "")}</section>`,
  );
  if (source)
    parts.push(
      `<section class="wemd-tc-source">${escapeHtml(source)}</section>`,
    );
  const person: string[] = [];
  if (avatarSrc) {
    person.push(
      `<section class="wemd-tc-avatar"><img src="${escapeHtmlAttr(avatarSrc)}" alt="${escapeHtmlAttr(name)}"></section>`,
    );
  }
  const nameParts: string[] = [];
  if (name)
    nameParts.push(
      `<section class="wemd-tc-name">${escapeHtml(name)}</section>`,
    );
  if (title)
    nameParts.push(
      `<section class="wemd-tc-title">${escapeHtml(title)}</section>`,
    );
  if (company)
    nameParts.push(
      `<section class="wemd-tc-company">${escapeHtml(company)}</section>`,
    );
  if (nameParts.length)
    person.push(
      `<section class="wemd-tc-person-meta">${nameParts.join("")}</section>`,
    );
  if (person.length)
    parts.push(`<section class="wemd-tc-person">${person.join("")}</section>`);
  if (companyLogo) {
    parts.push(
      `<section class="wemd-tc-company-logo"><img src="${escapeHtmlAttr(companyLogo)}" alt="${escapeHtmlAttr(company || "brand")}"></section>`,
    );
  }
  return parts.join("\n");
}

/**
 * series-nav 系列文章导航
 * 结构：.wemd-series-nav
 *   .wemd-sn-header           系列名 + 当前进度 + 描述 + 进度条
 *     .wemd-sn-name           📚 系列名  (3/10)
 *     .wemd-sn-desc           系列简介
 *     .wemd-sn-progress-bar   当前进度条
 *   .wemd-sn-nav              上一篇 / 下一篇
 *     .wemd-sn-prev
 *     .wemd-sn-next
 *   .wemd-sn-articles
 *     .wemd-sn-item.current    当前文章（高亮）
 *     .wemd-sn-item            其他文章
 */
export function renderSeriesNav(rawContent: string): string {
  const lines = rawContent.split("\n").map((l) => l.trimEnd());
  let seriesName = "";
  let current = 0;
  let total = 0;
  let description = "";
  let prev = { title: "", index: 0 };
  let next = { title: "", index: 0 };

  const listItems: {
    index: number;
    title: string;
    current: boolean;
    url?: string;
  }[] = [];

  for (const line of lines) {
    const l = line.trim();
    if (!l) continue;
    // 标题行：📚 **Vue3 从 0 到 1**  (第 3 / 10 篇)
    const header = l.match(
      /📚\s*\*\*([^*]+)\*\*\s*\(\s*第\s*(\d+)\s*\/\s*(\d+)\s*篇\s*\)/,
    );
    if (header) {
      seriesName = header[1];
      current = Number(header[2]);
      total = Number(header[3]);
      continue;
    }
    if (/^⬅️\s*上一篇：/.test(l)) {
      const m = l.match(/上一篇：\*\*第(\d+)篇\*\*\s*—\s*(.+)$/);
      if (m) prev = { index: Number(m[1]), title: m[2] };
      continue;
    }
    if (/^➡️\s*下一篇：/.test(l)) {
      const m = l.match(/下一篇：\*\*第(\d+)篇\*\*\s*—\s*(.+)$/);
      if (m) next = { index: Number(m[1]), title: m[2] };
      continue;
    }
    // 列表项：- [1|current] 标题  |U=url
    const listMatch = l.match(/^-\s*\[(\d+|CURRENT)\]\s*(.*)$/);
    if (listMatch) {
      const flag = listMatch[1];
      let rest = listMatch[2].trim();
      const urlMatch = rest.match(/\|\s*U=(\S+)/);
      const url = urlMatch ? urlMatch[1] : undefined;
      if (urlMatch) rest = rest.replace(/\|\s*U=\S+/, "").trim();
      if (flag === "CURRENT") {
        const idx = Number(listItems.length + 1);
        listItems.push({ index: idx, title: rest, current: true, url });
      } else {
        listItems.push({
          index: Number(flag),
          title: rest,
          current: false,
          url,
        });
      }
      continue;
    }
    // 其他都当做 description
    if (!description) description = l;
  }

  const parts: string[] = [];
  // header
  const h: string[] = [];
  if (seriesName) {
    h.push(
      `<section class="wemd-sn-name">📚 ${escapeHtml(seriesName)}  <small>第 ${current} / ${total} 篇</small></section>`,
    );
  }
  if (description)
    h.push(
      `<section class="wemd-sn-desc">${escapeHtml(description)}</section>`,
    );
  if (total > 0) {
    const pct = Math.min(100, Math.round((current / total) * 100));
    h.push(
      `<section class="wemd-sn-progress-bar" style="--sn-progress:${pct}%"></section>`,
    );
  }
  if (h.length)
    parts.push(`<section class="wemd-sn-header">${h.join("")}</section>`);

  // nav
  const nav: string[] = [];
  if (prev.title) {
    nav.push(
      `<section class="wemd-sn-prev"><section class="wemd-sn-prev-label">上一篇 · 第${prev.index}篇</section><section class="wemd-sn-prev-title">${escapeHtml(prev.title)}</section></section>`,
    );
  } else {
    nav.push(
      `<section class="wemd-sn-prev wemd-sn-empty">这是本系列第 1 篇</section>`,
    );
  }
  if (next.title) {
    nav.push(
      `<section class="wemd-sn-next"><section class="wemd-sn-next-label">下一篇 · 第${next.index}篇</section><section class="wemd-sn-next-title">${escapeHtml(next.title)}</section></section>`,
    );
  } else {
    nav.push(
      `<section class="wemd-sn-next wemd-sn-empty">本系列已更新到最新一篇</section>`,
    );
  }
  parts.push(`<section class="wemd-sn-nav">${nav.join("")}</section>`);

  // articles
  if (listItems.length) {
    const itemHtmls = listItems.map((a) => {
      const cls = a.current ? "wemd-sn-item current" : "wemd-sn-item";
      const t = a.url
        ? `<a href="${escapeHtmlAttr(a.url)}">${escapeHtml(a.title)}</a>`
        : escapeHtml(a.title);
      return `<section class="${cls}"><span class="wemd-sn-item-idx">${String(a.index).padStart(2, "0")}</span>${t}</section>`;
    });
    parts.push(
      `<section class="wemd-sn-articles">${itemHtmls.join("")}</section>`,
    );
  }

  return parts.join("\n");
}

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
