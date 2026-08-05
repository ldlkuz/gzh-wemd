import { useEffect, useMemo, useRef, memo } from "react";
import mermaid from "mermaid";
import {
  createMarkdownParser,
  processHtml,
  convertCssToWeChatDarkMode,
} from "@wemd/core";
import { useUITheme } from "../../hooks/useUITheme";
import { useEditorStore } from "../../store/editorStore";
import type { DesignerVariables } from "./ThemeDesigner/types";
import {
  getMermaidConfig,
  getThemedMermaidDiagram,
} from "../../utils/mermaidConfig";

// 主题预览用的示例 Markdown 内容
const PREVIEW_MARKDOWN = `# 一级标题示例

这是一段**加粗文本**、*斜体文本*、++下划线文本++、~~删除线文本~~、==高亮文本==和 [链接示例](https://github.com/tenngoxars/WeMD)。
正文段落通常需要设置行高和间距，以保证阅读体验。

---

## 二级标题

> 这是一个引用块示例，通常用于强调重要内容或摘录。

| 平台 | 特点 | 适用程度 |
| :--- | :--- | :--- |
| 微信 | 封闭但流量大 | ⭐⭐⭐⭐⭐ |
| 博客 | 自由但流量小 | ⭐⭐⭐ |

### 三级标题

这里演示脚注的使用：[WeChat Markdown](https://github.com/tenngoxars/WeMD "WeMD 是一款专为公众号设计的编辑器") 可以极大提升排版效率。

> [!TIP]
> 这是一个提示块示例。支持切换"默认彩色"或"跟随主题色"风格，让排版更统一。

- 无序列表
  - 嵌套的无序列表 A
  - 嵌套的无序列表 B


1. 有序列表
   1. 嵌套的有序列表 A
   2. 嵌套的有序列表 B


#### 四级标题

这里有 \`行内代码\` 样式，也可以用来表示 \`npm install wemd\` 等指令。

\`\`\`js
// 代码块示例
function hello() {
  const a = 1;
  const b = 2;
  console.log("Hello, Markdown!");
}
\`\`\`

\`\`\`mermaid
flowchart TD
  Start([Start]) --> Check{Is valid?}
  Check -- Yes --> Process[Process]
  Check -- No --> Reject[Reject]
  Process --> End([End])
  Reject --> End
\`\`\`

![WeMD 示例图片：不仅支持常规排版，更可以深度定制每一个细节。](data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0MDAgMjIwIj4KICA8ZGVmcz4KICAgIDxsaW5lYXJHcmFkaWVudCBpZD0ic2t5IiB4MT0iMCIgeTE9IjAiIHgyPSIwIiB5Mj0iMSI+CiAgICAgIDxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiNFOEYwRkYiLz4KICAgICAgPHN0b3Agb2Zmc2V0PSIxMDAlIiBzdG9wLWNvbG9yPSIjRjdGOEZBIi8+CiAgICA8L2xpbmVhckdyYWRpZW50PgogIDwvZGVmcz4KICA8cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIyMCIgZmlsbD0idXJsKCNza3kpIi8+CiAgPCEtLSDlpKrpmLMgLS0+CiAgPGNpcmNsZSBjeD0iMzIwIiBjeT0iNjAiIHI9IjI4IiBmaWxsPSIjRkZFM0IzIiBvcGFjaXR5PSIwLjg1Ii8+CiAgPCEtLSDkupEgLS0+CiAgPGcgZmlsbD0iI0ZGRkZGRiIgb3BhY2l0eT0iMC44Ij4KICAgIDxlbGxpcHNlIGN4PSI4MCIgY3k9IjU1IiByeD0iMzQiIHJ5PSIxMSIvPgogICAgPGVsbGlwc2UgY3g9IjExMCIgY3k9IjUwIiByeD0iMjYiIHJ5PSI5Ii8+CiAgICA8ZWxsaXBzZSBjeD0iMjAwIiBjeT0iODAiIHJ4PSI0MCIgcnk9IjEyIi8+CiAgPC9nPgogIDwhLS0g6L+c5bGxIC0tPgogIDxwYXRoIGQ9Ik0wLDE2MCBMNzAsMTAwIEwxMzAsMTQwIEwyMDAsODAgTDI4MCwxNTAgTDM0MCwxMTAgTDQwMCwxNjAgTDQwMCwyMjAgTDAsMjIwIFoiIGZpbGw9IiNDN0Q3RTgiIG9wYWNpdHk9IjAuNyIvPgogIDwhLS0g6L+R5bGxIC0tPgogIDxwYXRoIGQ9Ik0wLDE4MCBMNjAsMTQwIEwxNDAsMTcwIEwyMjAsMTMwIEwzMDAsMTc1IEwzODAsMTQ1IEw0MDAsMTcwIEw0MDAsMjIwIEwwLDIyMCBaIiBmaWxsPSIjOUNCNUQxIiBvcGFjaXR5PSIwLjg1Ii8+CiAgPCEtLSDlnLDpnaIgLS0+CiAgPHJlY3QgeD0iMCIgeT0iMTk1IiB3aWR0aD0iNDAwIiBoZWlnaHQ9IjI1IiBmaWxsPSIjN0E5NkI1IiBvcGFjaXR5PSIwLjYiLz4KPC9zdmc+)
`;

interface ThemeLivePreviewProps {
  /** 要预览的 CSS 样式代码 */
  css: string;
  designerVariables?: DesignerVariables;
  /** 是否使用当前文章内容，true=订阅 store 获取当前文章，false=使用内置示例 */
  useCurrentArticle?: boolean;
}

// 主题实时预览组件（使用 iframe 隔离样式）
export const ThemeLivePreview = memo(function ThemeLivePreview({
  css,
  designerVariables,
  useCurrentArticle = false,
}: ThemeLivePreviewProps) {
  // 只有当 useCurrentArticle=true 时才订阅 store，避免不必要的重渲染
  const currentMarkdown = useEditorStore((state) =>
    useCurrentArticle ? state.markdown : "",
  );
  const showMacBar = designerVariables?.showMacBar ?? false;
  const parser = useMemo(
    () => createMarkdownParser({ showMacBar, mathRenderer: "katex" }),
    [showMacBar],
  );
  const uiTheme = useUITheme((state) => state.theme);
  const isDarkMode = uiTheme === "dark";
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const mermaidRenderIdRef = useRef(0);
  const lastHtmlRef = useRef<string>("");

  const mermaidTheme = designerVariables?.mermaidTheme || "base";
  const mermaidConfigKey = useMemo(() => mermaidTheme, [mermaidTheme]);

  const shellDoc = useMemo(
    () => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style id="base-style">
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          padding: 0;
          margin: 0;
          font-size: 14px;
          line-height: 1.6;
          transition: background 0.2s, color 0.2s;
        }
        body:empty { display: none; }
      </style>
      <style id="theme-style"></style>
    </head>
    <body><div id="preview-root"></div></body>
    </html>
  `,
    [],
  );

  const finalCss = useMemo(
    () => (isDarkMode ? convertCssToWeChatDarkMode(css) : css),
    [css, isDarkMode],
  );
  const previewContent =
    useCurrentArticle && currentMarkdown !== undefined
      ? currentMarkdown
      : PREVIEW_MARKDOWN;
  const html = useMemo(() => {
    const rawHtml = parser.render(previewContent);
    // 与 MarkdownPreview 保持一致，使用 inlineStyles=false
    // 避免内联化导致 CSS 变量丢失、伪元素跳过、双重样式应用等问题
    return processHtml(rawHtml, finalCss, false);
  }, [parser, finalCss, previewContent]);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const renderMermaid = async (doc: Document) => {
      const blocks = Array.from(
        doc.querySelectorAll<HTMLElement>("pre.mermaid"),
      );
      if (blocks.length === 0) return;

      try {
        mermaid.initialize({ startOnLoad: false });
      } catch (e) {
        console.error("Mermaid initialization failed in preview:", e);
        return;
      }

      const initConfig = getMermaidConfig(designerVariables);

      const renderToken = ++mermaidRenderIdRef.current;
      for (const [index, block] of blocks.entries()) {
        if (!block.dataset.mermaidRaw) {
          block.dataset.mermaidRaw = block.textContent ?? "";
        }
        const diagram = block.dataset.mermaidRaw ?? "";
        if (!diagram.trim()) continue;

        const themedDiagram = getThemedMermaidDiagram(diagram, initConfig);
        try {
          const { svg } = await mermaid.render(
            `theme-preview-${renderToken}-${index}`,
            themedDiagram,
          );
          if (mermaidRenderIdRef.current !== renderToken) {
            return;
          }
          block.innerHTML = svg;
        } catch (e) {
          console.error("Mermaid render error:", e);
        }
      }
    };

    const updateContent = () => {
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!doc) return;

      const themeStyle = doc.getElementById("theme-style");
      const root = doc.getElementById("preview-root");

      if (themeStyle && root) {
        const scrollY = iframe.contentWindow?.scrollY || 0;

        doc.body.style.background = isDarkMode ? "#252526" : "#fff";
        doc.body.style.color = isDarkMode ? "#d4d4d4" : "#000";

        themeStyle.textContent = finalCss;
        if (lastHtmlRef.current !== html) {
          root.innerHTML = html;
          lastHtmlRef.current = html;
        }

        iframe.contentWindow?.scrollTo(0, scrollY);
        void renderMermaid(doc);
      }
    };

    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (
      doc &&
      doc.readyState === "complete" &&
      doc.getElementById("preview-root")
    ) {
      updateContent();
    } else {
      iframe.onload = updateContent;
    }
  }, [html, finalCss, isDarkMode, mermaidConfigKey]);

  return (
    <div className="theme-live-preview">
      <div className="preview-header-mini">
        <span>实时预览</span>
      </div>
      <iframe
        ref={iframeRef}
        className="preview-iframe"
        srcDoc={shellDoc}
        title="主题预览"
        sandbox="allow-same-origin"
      />
    </div>
  );
});
