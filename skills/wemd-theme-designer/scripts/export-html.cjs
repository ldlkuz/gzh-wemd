/**
 * export-html.cjs — 阶段6：主题感知的 HTML 导出器
 *
 * 直接读取 BrandVisualTheme.json 的色值令牌，生成内联样式的 HTML，
 * 避免通用 CSS 内联器丢失主题语义的问题。
 *
 * 用法：node scripts/export-html.cjs [--input <markdown-file>] [--output <html-file>]
 *
 * 默认：
 *   --input  output/docs/future-frontier-article-sample.md
 *   --output output/test.html
 */

const fs = require("fs");
const path = require("path");

// ============================================================
// 配置
// ============================================================
const ROOT = path.resolve(__dirname, "..");
const OUTPUT_DIR = path.join(ROOT, "output");
const THEME_JSON = path.join(OUTPUT_DIR, "BrandVisualTheme.json");
const DEFAULT_INPUT = path.join(OUTPUT_DIR, "docs", "future-frontier-article-sample.md");
const DEFAULT_OUTPUT = path.join(OUTPUT_DIR, "test.html");

// 解析命令行参数
const args = process.argv.slice(2);
const inputFile = args.includes("--input")
  ? path.resolve(process.cwd(), args[args.indexOf("--input") + 1])
  : DEFAULT_INPUT;
const outputFile = args.includes("--output")
  ? path.resolve(process.cwd(), args[args.indexOf("--output") + 1])
  : DEFAULT_OUTPUT;

// ============================================================
// 读取主题令牌
// ============================================================

function loadTheme() {
  const raw = fs.readFileSync(THEME_JSON, "utf-8");
  return JSON.parse(raw);
}

function extractTokens(theme) {
  const p = theme.visual_language.color.palette;
  const t = theme.visual_language.typography;
  const s = theme.visual_language.shape;
  const l = theme.visual_language.layout;

  return {
    // 颜色
    bgBase: p.background.base,
    bgSurface: p.background.surface,
    bgElevated: p.background.elevated,
    accentPrimary: p.accent.primary,
    accentSecondary: p.accent.secondary,
    accentTertiary: p.accent.tertiary,
    textPrimary: p.text.primary,
    textSecondary: p.text.secondary,
    textMuted: p.text.muted,
    semanticSuccess: p.semantic.success,
    semanticWarning: p.semantic.warning,
    semanticError: p.semantic.error,

    // 排版
    fontHeading: t.typefaces.heading,
    fontBody: t.typefaces.body,
    fontMono: t.typefaces.mono,
    scaleH1: t.scale.h1,
    scaleH2: t.scale.h2,
    scaleH3: t.scale.h3,
    scaleBody: t.scale.body,
    scaleSmall: t.scale.small,
    scaleCaption: t.scale.caption,
    weightHeading: t.weights.heading,
    weightBody: t.weights.body,
    weightBold: t.weights.bold,

    // 形状
    radiusCard: s.border_radius.card,
    lineAccent: s.decoration.line,

    // 间距
    spacingSection: l.spacing.section,
    spacingBlock: l.spacing.block,
    spacingInline: l.spacing.inline,
  };
}

// ============================================================
// 语法高亮（简单但主题感知的 tokenizer）
// ============================================================

const HLJS_TOKEN_MAP = {
  keyword: "accentTertiary",
  "title class_": "accentPrimary",
  "title function_": "accentPrimary",
  string: "semanticSuccess",
  comment: "textMuted",
  number: null, // 使用固定值
  attr: null,
  literal: null,
  "title class_": "accentPrimary",
};

const HLJS_FIXED_COLORS = {
  number: "#FFA657",
  attr: "#FFA657",
  literal: "#FFA657",
};

/**
 * 获取 token 对应的颜色值
 */
function getTokenColor(tokenKey, tokens) {
  const colorKey = HLJS_TOKEN_MAP[tokenKey];
  if (colorKey) return tokens[colorKey];
  return HLJS_FIXED_COLORS[tokenKey] || null;
}

/**
 * 单遍语法高亮 tokenizer — 一次性找出所有 token，按位置排序后构建输出
 * 避免多遍正则替换导致的嵌套 span 问题
 */
function highlightCode(code, tokens) {
  const lines = code.split("\n");

  // 所有 token 规则（按优先级排序：精确匹配优先）
  const tokenRules = [
    // 字符串（双引号）
    { pattern: /("(?:[^"\\]|\\.)*")/g, token: "string" },
    // 字符串（单引号）
    { pattern: /('(?:[^'\\]|\\.)*')/g, token: "string" },
    // 模板字符串
    { pattern: /(`(?:[^`\\]|\\.)*`)/g, token: "string" },
    // 注释 //
    { pattern: /(\/\/.*)/g, token: "comment" },
    // 注释 /* */
    { pattern: /(\/\*[\s\S]*?\*\/)/g, token: "comment" },
    // 关键字
    { pattern: /\b(import|from|const|let|var|function|async|await|return|new|class|if|else|for|of|in|typeof|instanceof|this|super|export|default|extends|implements|interface|type|enum|as|true|false|null|undefined|void|throw|try|catch|finally|switch|case|break|continue|while|do|yield|static|private|public|protected|readonly|abstract|get|set)\b/g, token: "keyword" },
    // 函数调用 xxx(
    { pattern: /([a-zA-Z_$][\w$]*(?=\s*\())/g, token: "title function_" },
    // 类名/类型（大写开头）
    { pattern: /\b([A-Z][a-zA-Z0-9_]*)\b/g, token: "title class_" },
    // 数字
    { pattern: /\b(\d+\.?\d*)\b/g, token: "number" },
    // 属性名 .xxx
    { pattern: /(\.[a-zA-Z_$][\w$]*)/g, token: "attr" },
    // 字面量
    { pattern: /\b(true|false|null|undefined)\b/g, token: "literal" },
  ];

  return lines.map((line) => {
    // 先转义 HTML
    const escaped = line
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    // 收集所有匹配（位置 + token 类型 + 匹配文本）
    const matches = [];
    for (const rule of tokenRules) {
      rule.pattern.lastIndex = 0;
      let m;
      while ((m = rule.pattern.exec(escaped)) !== null) {
        matches.push({
          start: m.index,
          end: m.index + m[1].length,
          token: rule.token,
          text: m[1],
        });
      }
    }

    // 按位置排序，并去重重叠的匹配（保留优先级高的）
    matches.sort((a, b) => a.start - b.start || (b.end - b.start) - (a.end - a.start));

    // 去除重叠匹配
    const filtered = [];
    let lastEnd = 0;
    for (const m of matches) {
      if (m.start >= lastEnd) {
        filtered.push(m);
        lastEnd = m.end;
      }
    }

    // 单遍构建输出
    let result = "";
    let pos = 0;
    for (const m of filtered) {
      // 非匹配文本
      if (m.start > pos) {
        result += escaped.slice(pos, m.start);
      }
      // 匹配文本 — 用 span 包裹
      const color = getTokenColor(m.token, tokens);
      if (color) {
        result += `<span style="color:${color}">${m.text}</span>`;
      } else {
        result += m.text;
      }
      pos = m.end;
    }
    // 剩余文本
    if (pos < escaped.length) {
      result += escaped.slice(pos);
    }

    return result;
  }).join("\n");
}

// ============================================================
// Markdown → HTML 转换器
// ============================================================

function parseMarkdown(md, tokens) {
  const lines = md.split("\n");
  const html = [];
  let i = 0;

  // 辅助：生成内联样式
  const inlineStyle = (attrs) => {
    return Object.entries(attrs)
      .filter(([, v]) => v != null)
      .map(([k, v]) => `${k}:${v}`)
      .join(";");
  };

  // 辅助：处理行内标记（**bold**, *italic*, `code`, [link](url), ![img](url)）
  // 从 lineAccent（如 "1px solid rgba(0, 229, 255, 0.2)"）中提取颜色值
  function extractColorFromLine(line) {
    const match = line.match(/(rgba?\([^)]+\)|#[0-9a-fA-F]+)/);
    return match ? match[1] : "rgba(0, 229, 255, 0.2)";
  }

  function processInline(text) {
    return text
      // 图片 ![alt](url)
      .replace(
        /!\[([^\]]*)\]\(([^)]+)\)/g,
        (_, alt, url) =>
          `<img src="${url}" alt="${alt}" style="${inlineStyle({
            "max-width": "100%",
            "border-radius": tokens.radiusCard,
            display: "block",
            margin: "24px auto",
          })}" />`,
      )
      // 链接 [text](url)
      .replace(
        /\[([^\]]+)\]\(([^)]+)\)/g,
        (_, text, url) =>
          `<a href="${url}" style="${inlineStyle({
            color: tokens.accentPrimary,
            "text-decoration": "none",
          })}">${text}</a>`,
      )
      // 行内代码 `code`
      .replace(
        /`([^`]+)`/g,
        (_, code) =>
          `<code style="${inlineStyle({
            "font-family": tokens.fontMono,
            "font-size": "0.9em",
            background: tokens.bgSurface,
            padding: "2px 6px",
            "border-radius": "4px",
            color: tokens.accentPrimary,
          })}">${code}</code>`,
      )
      // **bold**
      .replace(
        /\*\*([^*]+)\*\*/g,
        (_, text) => `<strong style="font-weight:${tokens.weightBold};color:${tokens.accentPrimary}">${text}</strong>`,
      )
      // *italic*
      .replace(
        /\*([^*]+)\*/g,
        (_, text) => `<em style="font-style:italic;color:${tokens.accentPrimary};font-weight:500">${text}</em>`,
      );
  }

  function emit(tag, attrs, content) {
    const style = inlineStyle(attrs);
    return `<${tag} style="${style}">${content}</${tag}>`;
  }

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // --- 空行 ---
    if (trimmed === "") {
      i++;
      continue;
    }

    // --- 水平分割线 ---
    if (/^---+\s*$/.test(trimmed)) {
      html.push(
        `<hr style="${inlineStyle({
          border: "none",
          height: "1px",
          background: extractColorFromLine(tokens.lineAccent),
          margin: "28px 16px",
        })}" />`,
      );
      i++;
      continue;
    }

    // --- 标题 ---
    const hMatch = trimmed.match(/^(#{1,3})\s+(.+)$/);
    if (hMatch) {
      const level = hMatch[1].length;
      const content = processInline(hMatch[2]);
      const sizes = {
        1: { size: tokens.scaleH1, weight: tokens.weightHeading, marginT: 32, marginB: 16 },
        2: { size: tokens.scaleH2, weight: 700, marginT: 24, marginB: 12 },
        3: { size: tokens.scaleH3, weight: 600, marginT: 20, marginB: 10 },
      };
      const s = sizes[level];
      html.push(
        `<h${level} style="${inlineStyle({
          "font-weight": s.weight,
          "font-size": s.size,
          color: tokens.textPrimary,
          margin: `${s.marginT}px 16px ${s.marginB}px`,
          padding: 0,
        })}">${content}</h${level}>`,
      );
      i++;
      continue;
    }

    // --- 代码块 ---
    if (/^```/.test(trimmed)) {
      const lang = trimmed.slice(3).trim();
      i++;
      const codeLines = [];
      while (i < lines.length && !/^```/.test(lines[i].trim())) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // 跳过结束 ```
      const code = codeLines.join("\n");
      const highlighted = highlightCode(code, tokens);
      html.push(
        `<pre style="${inlineStyle({
          margin: "10px 16px",
          padding: 0,
          "border-radius": "6px",
          overflow: "hidden",
        })}"><code style="${inlineStyle({
          display: "block",
          "font-family": tokens.fontMono,
          "border-radius": tokens.radiusCard,
          "font-size": "14px",
          "white-space": "pre",
          "min-width": "max-content",
          background: "#0d1117",
          padding: "16px",
          "overflow-x": "auto",
          "line-height": 1.6,
          color: "#c9d1d9",
          border: tokens.lineAccent,
        })}">${highlighted}</code></pre>`,
      );
      continue;
    }

    // --- 引用块（blockquote） ---
    if (/^>/.test(trimmed)) {
      const quoteLines = [];
      while (i < lines.length && /^>/.test(lines[i].trim())) {
        quoteLines.push(lines[i].trim().replace(/^>\s?/, ""));
        i++;
      }

      // 检测是否包含有序列表（> 1. xxx）
      const hasOrderedList = quoteLines.some((l) => /^\d+\.\s/.test(l));

      let innerHtml;
      if (hasOrderedList) {
        // 第一行是标题，其余是列表项
        const title = processInline(quoteLines[0].replace(/^\d+\.\s/, ""));
        const items = quoteLines
          .filter((l) => /^\d+\.\s/.test(l))
          .map((l) => {
            const content = l.replace(/^\d+\.\s+/, "");
            return `<li><section style="${inlineStyle({
              "margin-top": "5px",
              "margin-bottom": "5px",
              "line-height": 1.7,
              "text-align": "left",
              color: tokens.textSecondary,
              "font-weight": 500,
              margin: "8px 0",
              "font-size": "16px",
            })}">${processInline(content)}</section></li>`;
          })
          .join("");
        innerHtml = `<p style="margin:16px 0;line-height:1.7;font-size:15px;color:${tokens.textMuted}">${title}</p><ol style="margin-top:8px;margin-bottom:8px;padding-left:25px;list-style-type:decimal;color:${tokens.textSecondary}">${items}</ol>`;
      } else {
        innerHtml = quoteLines
          .map((l) => {
            if (l.trim() === "") return "";
            return `<p style="margin:16px 0;line-height:1.7;font-size:15px;color:${tokens.textMuted}">${processInline(l)}</p>`;
          })
          .join("");
      }

      html.push(
        `<blockquote style="${inlineStyle({
          "border-top": "none",
          "border-right": "none",
          "border-bottom": "none",
          "border-image": "initial",
          display: "block",
          "font-size": "0.9em",
          overflow: "auto",
          padding: "10px 10px 10px 20px",
          margin: "20px 16px",
          "border-left": `4px solid ${tokens.accentPrimary}`,
          background: tokens.bgSurface,
          color: tokens.textMuted,
          "border-radius": tokens.radiusCard,
        })}">${innerHtml}</blockquote>`,
      );
      continue;
    }

    // --- 无序列表 ---
    if (/^-\s/.test(trimmed)) {
      const items = [];
      while (i < lines.length && /^-\s/.test(lines[i].trim())) {
        const itemContent = lines[i].trim().replace(/^-\s+/, "");
        items.push(
          `<li style="padding-left:4px"><section style="${inlineStyle({
            "margin-top": "5px",
            "margin-bottom": "5px",
            "line-height": 1.7,
            "text-align": "left",
            color: tokens.textSecondary,
            "font-weight": 500,
            margin: "8px 0",
            "font-size": "16px",
          })}">${processInline(itemContent)}</section></li>`,
        );
        i++;
      }
      // 检查是否在列表项中有 **bold** 标记，需要特殊处理
      html.push(
        `<ul style="${inlineStyle({
          "margin-top": "8px",
          "margin-bottom": "8px",
          "padding-left": "calc(41px)",
          "list-style-type": "disc",
          color: tokens.textSecondary,
          "padding-right": "16px",
        })}">${items.join("")}</ul>`,
      );
      continue;
    }

    // --- 有序列表 ---
    if (/^\d+\.\s/.test(trimmed)) {
      const items = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i].trim())) {
        const itemContent = lines[i].trim().replace(/^\d+\.\s+/, "");
        items.push(
          `<li style="padding-left:4px"><section style="${inlineStyle({
            "margin-top": "5px",
            "margin-bottom": "5px",
            "line-height": 1.7,
            "text-align": "left",
            color: tokens.textSecondary,
            "font-weight": 500,
            margin: "8px 0",
            "font-size": "16px",
          })}">${processInline(itemContent)}</section></li>`,
        );
        i++;
      }
      html.push(
        `<ol style="${inlineStyle({
          "margin-top": "8px",
          "margin-bottom": "8px",
          "padding-left": "25px",
          "list-style-type": "decimal",
          color: tokens.textSecondary,
          "padding-right": "16px",
        })}">${items.join("")}</ol>`,
      );
      continue;
    }

    // --- 表格 ---
    if (trimmed.includes("|")) {
      // 检查是否是表头分隔行
      if (/^\|[\s:-]+\|/.test(trimmed)) {
        i++;
        continue;
      }

      const rows = [];
      // 收集表格行
      while (i < lines.length && lines[i].trim().includes("|")) {
        const rowLine = lines[i].trim();
        // 跳过分隔行
        if (/^\|[\s:-]+\|/.test(rowLine)) {
          i++;
          continue;
        }
        const cells = rowLine
          .split("|")
          .map((c) => c.trim())
          .filter((c) => c !== "");
        rows.push(cells);
        i++;
      }

      if (rows.length > 0) {
        const headerCells = rows[0]
          .map((cell) => processInline(cell))
          .map(
            (cell) =>
              `<th style="${inlineStyle({
                "font-size": "15px",
                padding: "6px 8px",
                "text-align": "center",
                "font-weight": 600,
                "min-width": "100px",
                border: tokens.lineAccent,
                color: tokens.accentPrimary,
                "line-height": 1.4,
                background: tokens.bgSurface,
                "white-space": "nowrap",
              })}">${cell}</th>`,
          )
          .join("");

        const bodyRows = rows
          .slice(1)
          .map((row, idx) => {
            const bgColor = idx % 2 === 0 ? tokens.bgElevated : tokens.bgSurface;
            const cells = row
              .map((cell) => processInline(cell))
              .map(
                (cell) =>
                  `<td style="${inlineStyle({
                    "font-size": "15px",
                    padding: "6px 8px",
                    "text-align": "center",
                    "min-width": "100px",
                    border: tokens.lineAccent,
                    color: tokens.textSecondary,
                    "line-height": 1.4,
                    "white-space": "nowrap",
                  })}">${cell}</td>`,
              )
              .join("");
            return `<tr style="border:0;border-top:1px solid #ccc;background-color:${bgColor}">${cells}</tr>`;
          })
          .join("");

        html.push(
          `<section style="${inlineStyle({
            "overflow-x": "auto",
            "margin-left": "16px",
            "margin-right": "16px",
          })}"><table style="${inlineStyle({
            display: "table",
            "text-align": "left",
            "border-collapse": "collapse",
            "table-layout": "auto",
            width: "auto",
            "min-width": "100%",
            "white-space": "nowrap",
          })}"><thead><tr style="border:0;border-top:1px solid #ccc;background-color:${tokens.bgSurface}">${headerCells}</tr></thead><tbody style="border:0">${bodyRows}</tbody></table></section>`,
        );
      }
      continue;
    }

    // --- 普通段落（带图片检测） ---
    // 检查是否是图片行
    const imgMatch = trimmed.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (imgMatch) {
      html.push(
        `<figure style="${inlineStyle({
          margin: "10px 0px",
          display: "flex",
          "flex-direction": "column",
          "justify-content": "center",
          "align-items": "center",
          "padding-left": "16px",
          "padding-right": "16px",
        })}"><img src="${imgMatch[2]}" alt="${imgMatch[1]}" style="${inlineStyle({
          display: "block",
          margin: "24px auto",
          "max-width": "100%",
          "border-radius": tokens.radiusCard,
        })}" /><figcaption style="${inlineStyle({
          "text-align": "center",
          "font-size": "14px",
          color: tokens.textMuted,
          "margin-top": "8px",
        })}">${imgMatch[1]}</figcaption></figure>`,
      );
      i++;
      continue;
    }

    // --- 普通段落 ---
    const paragraphs = [];
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !/^#/.test(lines[i]) &&
      !/^>/.test(lines[i]) &&
      !/^```/.test(lines[i]) &&
      !/^-\s/.test(lines[i]) &&
      !/^\d+\.\s/.test(lines[i]) &&
      !/^\|---/.test(lines[i]) &&
      !/^---+\s*$/.test(lines[i].trim()) &&
      !lines[i].trim().includes("|")
    ) {
      paragraphs.push(lines[i]);
      i++;
    }

    if (paragraphs.length > 0) {
      const text = paragraphs.join(" ");
      const processed = processInline(text);
      html.push(
        `<p style="${inlineStyle({
          margin: "16px 0px",
          "font-size": tokens.scaleBody,
          "line-height": 1.7,
          color: tokens.textSecondary,
          "padding-left": "16px",
          "padding-right": "16px",
        })}">${processed}</p>`,
      );
    } else {
      i++;
    }
  }

  return html.join("\n");
}

// ============================================================
// 生成完整 HTML
// ============================================================

function generateHtml(mdContent, theme, tokens) {
  const bodyHtml = parseMarkdown(mdContent, tokens);
  const brandName = theme.brand.name || "未知品牌";
  const conceptName = theme.concept?.name || "Unknown Theme";

  return `<!--wemd-meta:${Buffer.from(JSON.stringify({
    title: "生成式 AI 重塑创作边界",
    useTitle: true,
    useAuthor: true,
  })).toString("base64")}--><div data-wemd-publish-meta="${Buffer.from(JSON.stringify({
    title: "生成式 AI 重塑创作边界",
    useTitle: true,
    useAuthor: true,
  })).toString("base64")}" hidden></div><div style="${[
    ["word-spacing", "0px"],
    ["word-break", "break-word"],
    ["overflow-wrap", "break-word"],
    ["text-align", "left"],
    ["background", tokens.bgBase],
    ["--wemd-primary", tokens.accentPrimary],
    ["--wemd-primary-alpha-2", `rgba(0, 229, 255, 0.02)`],
    ["--wemd-secondary", tokens.accentSecondary],
    ["--wemd-bg-soft", tokens.bgSurface],
    ["--wemd-text-strong", tokens.textPrimary],
    ["--wemd-border", tokens.lineAccent],
    ["--wemd-page-padding", "16px"],
    ["--wemd-h1-font-size", tokens.scaleH1],
    ["--wemd-border-radius", tokens.radiusCard],
    ["font-family", `${tokens.fontBody}, sans-serif`],
    ["font-size", tokens.scaleBody],
    ["color", tokens.textSecondary],
    ["line-height", "1.7"],
    ["letter-spacing", "0px"],
  ]
    .map(([k, v]) => `${k}: ${v}`)
    .join("; ")}">
${bodyHtml}
</div>`;
}

// ============================================================
// 主流程
// ============================================================

console.log("🎨 主题感知 HTML 导出器");
console.log(`   主题: ${THEME_JSON}`);
console.log(`   输入: ${inputFile}`);
console.log(`   输出: ${outputFile}`);
console.log("");

// 1. 加载主题
const theme = loadTheme();
const tokens = extractTokens(theme);
console.log(`  ✅ 读取主题: ${theme.brand.name}`);
console.log(`  📊 色值令牌: ${Object.keys(tokens).length} 个`);

// 2. 读取 Markdown
const mdContent = fs.readFileSync(inputFile, "utf-8");
console.log(`  📝 读取 Markdown: ${mdContent.split("\n").length} 行`);

// 3. 生成 HTML
const html = generateHtml(mdContent, theme, tokens);
console.log(`  🏗️  生成 HTML: ${html.length} 字符`);

// 4. 写入文件
fs.mkdirSync(path.dirname(outputFile), { recursive: true });
fs.writeFileSync(outputFile, html, "utf-8");
console.log(`  ✅ 已写入: ${outputFile}`);
console.log("");
console.log("🎉 完成！打开 HTML 文件预览效果。");