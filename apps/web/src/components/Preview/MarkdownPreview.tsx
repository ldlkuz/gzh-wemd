import { useEffect, useState, useRef, useMemo } from "react";
import mermaid from "mermaid";
import { createMarkdownParser, processHtml } from "@wemd/core";
import { useEditorStore } from "../../store/editorStore";
import { useThemeStore } from "../../store/themeStore";
import { useUITheme } from "../../hooks/useUITheme";
import { hasMathFormula, renderMathInElement } from "../../utils/katexRenderer";
import { convertLinksToFootnotes } from "../../utils/linkFootnote";
import {
  getPublishingPreference,
  subscribePublishingPreference,
} from "../../store/publishingPreferences";
import {
  getMermaidConfig,
  getThemedMermaidDiagram,
} from "../../utils/mermaidConfig";
import { renderTableBlocksForPreview } from "../../services/wechatTableRenderer";
import {
  subscribeScrollIntent,
  type ScrollSyncAdapter,
} from "../Workspace/editorPreviewScrollSync";
import {
  mapScrollTopToSourceLine,
  mapSourceLineToScrollTop,
  type ScrollAnchor,
} from "../Workspace/scrollAnchorMapping";
import "./MarkdownPreview.css";

interface MarkdownPreviewProps {
  onScrollSyncReady?: (adapter: ScrollSyncAdapter | null) => void;
}

const collectAnchors = (
  root: HTMLElement,
  container: HTMLElement,
): ScrollAnchor[] => {
  const containerRect = container.getBoundingClientRect();
  return Array.from(
    root.querySelectorAll<HTMLElement>("[data-wemd-source-start]"),
  ).flatMap((element) => {
    const startLine = Number(element.dataset.wemdSourceStart);
    const endLine = Number(element.dataset.wemdSourceEnd);
    if (!Number.isFinite(startLine) || !Number.isFinite(endLine)) return [];
    const rect = element.getBoundingClientRect();
    const top = container.scrollTop + rect.top - containerRect.top;
    return [
      {
        startLine,
        endLine,
        top,
        bottom: top + rect.height,
      },
    ];
  });
};

export function MarkdownPreview({ onScrollSyncReady }: MarkdownPreviewProps) {
  const { markdown } = useEditorStore();
  const { themeId: theme, customCSS, getThemeCSS } = useThemeStore();
  const uiTheme = useUITheme((state) => state.theme);
  const [html, setHtml] = useState("");
  const [linkToFootnoteEnabled, setLinkToFootnoteEnabledState] = useState(() =>
    getPublishingPreference("linkToFootnote"),
  );
  const [tableWrapEnabled, setTableWrapEnabledState] = useState(() =>
    getPublishingPreference("tableWrap"),
  );
  const previewRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const mermaidRenderIdRef = useRef(0);

  // 获取当前主题对象（注意与 line 25 的 themeId 区分）
  const currentTheme = useThemeStore(
    (state) =>
      state.customThemes.find((t) => t.id === state.themeId) ||
      state.getAllThemes().find((t) => t.id === state.themeId),
  );
  const designerVars = currentTheme?.designerVariables;
  const showMacBar = designerVars?.showMacBar ?? false;

  // 缓存 parser 实例，避免每次渲染都创建新实例
  const parser = useMemo(
    () =>
      createMarkdownParser({
        showMacBar,
        mathRenderer: "katex",
        includeSourcePosition: true,
      }),
    [showMacBar],
  );

  useEffect(() => {
    const rawHtml = parser.render(markdown);
    const previewHtml = linkToFootnoteEnabled
      ? convertLinksToFootnotes(rawHtml)
      : rawHtml;

    // 使用 store 中的 getThemeCSS 方法，根据 UI 主题决定是否追加深色模式覆盖
    const isDarkMode = uiTheme === "dark";
    const css = getThemeCSS(theme, isDarkMode);
    // 预览模式不使用内联样式，直接注入 style 标签，大幅降低内存占用
    const styledHtml = processHtml(previewHtml, css, false);

    setHtml(styledHtml);
  }, [
    markdown,
    theme,
    customCSS,
    getThemeCSS,
    parser,
    uiTheme,
    linkToFootnoteEnabled,
  ]);

  // KaTeX 渲染：轻量级、快速，解决内存问题
  // MathJax 仅在复制到微信时使用
  useEffect(() => {
    if (!previewRef.current || !html) {
      return;
    }

    // 检测是否包含数学公式
    if (!hasMathFormula(markdown)) {
      return; // 无公式，跳过渲染
    }

    // 延迟渲染，避免频繁触发
    const timer = setTimeout(() => {
      if (previewRef.current) {
        renderMathInElement(previewRef.current);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [html, markdown]);

  const mermaidTheme = designerVars?.mermaidTheme || "base";
  const mermaidConfigKey = useMemo(() => mermaidTheme, [mermaidTheme]);

  useEffect(() => {
    try {
      mermaid.initialize({ startOnLoad: false });
    } catch (e) {
      console.error("Mermaid initialization failed:", e);
    }
  }, []);

  useEffect(() => {
    if (!previewRef.current || !html) return;

    const mermaidBlocks = Array.from(
      previewRef.current.querySelectorAll<HTMLElement>(".mermaid"),
    );
    if (mermaidBlocks.length === 0) return;
    const renderToken = ++mermaidRenderIdRef.current;

    // 延迟渲染以确保 DOM 更新完成
    const timer = setTimeout(() => {
      const initConfig = getMermaidConfig(designerVars);

      mermaidBlocks.forEach((block, index) => {
        if (!block.dataset.mermaidRaw) {
          block.dataset.mermaidRaw = block.textContent ?? "";
        }
        const diagram = block.dataset.mermaidRaw ?? "";
        if (!diagram.trim()) return;

        const themedDiagram = getThemedMermaidDiagram(diagram, initConfig);

        mermaid
          .render(`preview-${renderToken}-${index}`, themedDiagram)
          .then(({ svg }) => {
            if (mermaidRenderIdRef.current !== renderToken) return;
            block.innerHTML = svg;
          })
          .catch((e) => {
            console.error("Mermaid render error:", e);
          });
      });
    }, 100);

    return () => clearTimeout(timer);
  }, [html, mermaidConfigKey, designerVars]);

  // 表格布局与发布偏好保持一致，开关变化时直接重排现有 DOM。
  useEffect(() => {
    if (!previewRef.current || !html) return;

    const tables = previewRef.current.querySelectorAll(".table-container");
    if (tables.length === 0) return;

    renderTableBlocksForPreview(previewRef.current, tableWrapEnabled);
  }, [html, tableWrapEnabled]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    const root = previewRef.current;
    if (!container || !root) return;
    let scrollSubscriber: () => void = () => undefined;
    let anchorCache: ScrollAnchor[] | null = null;
    const getAnchors = () => {
      anchorCache ??= collectAnchors(root, container);
      return anchorCache;
    };
    const getPosition: ScrollSyncAdapter["getPosition"] = () => {
      const max = Math.max(0, container.scrollHeight - container.clientHeight);
      const ratio = max > 0 ? container.scrollTop / max : 0;
      return {
        sourceLine: mapScrollTopToSourceLine(getAnchors(), container.scrollTop),
        ratio,
      };
    };
    const scrollToPosition: ScrollSyncAdapter["scrollToPosition"] = (
      position,
    ) => {
      const max = Math.max(0, container.scrollHeight - container.clientHeight);
      if (position.sourceLine === null || position.ratio >= 0.999) {
        container.scrollTop = Math.min(Math.max(position.ratio, 0), 1) * max;
        return;
      }
      container.scrollTop = mapSourceLineToScrollTop(
        getAnchors(),
        position.sourceLine,
        max,
        position.ratio,
      );
    };
    const handleScroll = () => scrollSubscriber();
    container.addEventListener("scroll", handleScroll, { passive: true });
    onScrollSyncReady?.({
      getPosition,
      scrollToPosition,
      subscribeScroll: (listener) => {
        scrollSubscriber = listener;
        return () => {
          if (scrollSubscriber === listener) scrollSubscriber = () => undefined;
        };
      },
      subscribeUserIntent: (listener) =>
        subscribeScrollIntent(container, listener),
      subscribeLayoutChange: (listener) => {
        if (typeof ResizeObserver === "undefined") return () => undefined;
        const observer = new ResizeObserver(() => {
          anchorCache = null;
          listener();
        });
        observer.observe(root);
        return () => observer.disconnect();
      },
    });
    return () => {
      container.removeEventListener("scroll", handleScroll);
      onScrollSyncReady?.(null);
    };
  }, [html, onScrollSyncReady]);

  useEffect(() => {
    return subscribePublishingPreference(
      "linkToFootnote",
      setLinkToFootnoteEnabledState,
    );
  }, []);

  useEffect(() => {
    return subscribePublishingPreference("tableWrap", setTableWrapEnabledState);
  }, []);

  return (
    <div className="markdown-preview">
      <div className="preview-header">
        <span className="preview-title">实时预览</span>
        <span className="preview-subtitle">微信排版效果</span>
      </div>
      <div
        className="preview-container"
        ref={scrollContainerRef}
        onClick={(e) => {
          const target = e.target as HTMLElement;
          const link = target.closest("a");
          if (link && link.href && window.electron?.shell?.openExternal) {
            e.preventDefault();
            window.electron.shell.openExternal(link.href);
          }
        }}
      >
        <div className="preview-content">
          <style
            dangerouslySetInnerHTML={{
              __html: getThemeCSS(theme, uiTheme === "dark"),
            }}
          />
          <div ref={previewRef} dangerouslySetInnerHTML={{ __html: html }} />
        </div>
      </div>
    </div>
  );
}
// MathJax 类型已在 mathJaxLoader.ts 中声明
