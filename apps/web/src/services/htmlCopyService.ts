import toast from "react-hot-toast";
import {
  buildWechatPublishHtml,
  type WechatPublishHtmlOptions,
} from "./wechatPublishHtml";
import type { PublishMeta } from "../utils/publishMeta";
import { html as beautifyHtml } from "js-beautify";

// 剥离 parser 为微信主题 CSS 注入的结构装饰（prefix/content/suffix span、<li><section>、空 <center>）。
// 外部编辑器不认这些 class，留着只会变成语义噪音。
export function sanitizeForExternalHtml(html: string): string {
  const doc = new DOMParser().parseFromString(
    `<body>${html}</body>`,
    "text/html",
  );
  const body = doc.body;

  body.querySelectorAll("h1, h2, h3, h4, h5, h6").forEach((h) => {
    const prefix = h.querySelector(":scope > span.prefix");
    const content = h.querySelector(":scope > span.content");
    const suffix = h.querySelector(":scope > span.suffix");
    if (prefix && content && suffix) {
      h.innerHTML = content.innerHTML;
    }
  });

  body.querySelectorAll("li").forEach((li) => {
    if (li.children.length === 1 && li.children[0].tagName === "SECTION") {
      const section = li.children[0] as HTMLElement;
      li.innerHTML = section.innerHTML;
    }
  });

  body.querySelectorAll("center").forEach((c) => {
    if (!c.textContent?.trim() && c.children.length === 0) {
      c.remove();
    }
  });

  return body.innerHTML;
}

function normalizeHtmlSource(html: string): string {
  return html.replace(/>\s+</g, "><").trim();
}

// 用 js-beautify 把 HTML 源码格式化为多行缩进，便于排查。
// 默认配置下内联元素保持同行，只对块级/标签层级换行，
// 往公众号粘贴时块级间的空白会被折叠，不会引入多余空格。
function formatHtmlSource(html: string): string {
  // 先清掉标签间冗余空白，避免格式化后出现重复空行
  const minified = normalizeHtmlSource(html);
  return beautifyHtml(minified, {
    indent_size: 2,
    indent_char: " ",
    wrap_line_length: 0,
  });
}

function prependPublishMetaComment(html: string, meta?: PublishMeta): string {
  if (!meta) return html;
  const payload: PublishMeta = {};
  if (meta.title?.trim()) payload.title = meta.title.trim();
  if (meta.author?.trim()) payload.author = meta.author.trim();
  if (meta.useTitle !== undefined) payload.useTitle = meta.useTitle;
  if (meta.useAuthor !== undefined) payload.useAuthor = meta.useAuthor;
  if (
    !payload.title &&
    !payload.author &&
    payload.useTitle === undefined &&
    payload.useAuthor === undefined
  ) {
    return html;
  }
  const encoded = encodeURIComponent(JSON.stringify(payload));
  return `<!--wemd-meta:${encoded}--><div data-wemd-publish-meta="${encoded}" hidden></div>${html}`;
}

const copyViaElectronClipboard = async (text: string): Promise<boolean> => {
  const writeText = window.electron?.clipboard?.writeText;
  if (!writeText) return false;
  try {
    const result = await writeText(text);
    return result.success;
  } catch (error) {
    console.error("Electron 剪贴板写入失败:", error);
    return false;
  }
};

const copyViaNavigatorClipboard = async (text: string): Promise<boolean> => {
  if (!navigator.clipboard?.writeText) return false;
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error("Clipboard API 写入失败:", error);
    return false;
  }
};

const copyViaExecCommand = (text: string): boolean => {
  if (typeof document.execCommand !== "function") return false;
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "true");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  textarea.style.pointerEvents = "none";
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  textarea.setSelectionRange(0, textarea.value.length);
  try {
    return document.execCommand("copy");
  } finally {
    document.body.removeChild(textarea);
    window.getSelection()?.removeAllRanges();
  }
};

export async function copyAsHtml(
  markdown: string,
  css = "",
  options: WechatPublishHtmlOptions & { meta?: PublishMeta } = {},
): Promise<void> {
  const publishResult = await buildWechatPublishHtml(markdown, css, options);
  const html = prependPublishMetaComment(
    formatHtmlSource(publishResult.html),
    options.meta,
  );

  try {
    const copied =
      (window.electron?.isElectron && (await copyViaElectronClipboard(html))) ||
      (await copyViaNavigatorClipboard(html)) ||
      copyViaExecCommand(html);

    if (copied) {
      toast.success("已复制 HTML");
      return;
    }

    toast.error("复制 HTML 失败");
  } finally {
    publishResult.cleanup();
  }
}
