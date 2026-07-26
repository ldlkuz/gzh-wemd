import { useEffect, useMemo, useRef, useState } from "react";
import { EditorView, minimalSetup } from "codemirror";
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { EditorState } from "@codemirror/state";
import { githubLight } from "@uiw/codemirror-theme-github";
import { RefreshCw } from "lucide-react";
import {
  wechatMarkdownHighlighting,
  wechatMarkdownHighlightingDark,
} from "./markdownTheme";
import { underlineExtension } from "./markdownUnderline";
import { useUITheme } from "../../hooks/useUITheme";
import { useEditorStore } from "../../store/editorStore";
import { countWords, countLines } from "../../utils/wordCount";
import { Toolbar } from "./Toolbar";
import { SearchPanel } from "./SearchPanel";
import { SaveIndicator } from "./SaveIndicator";
import { openAiSettings, isAiConfigured } from "../../services/ai/aiConfig";
import { textToMarkdown } from "../../services/ai/aiService";
import {
  analyzeArticle,
  type Insertion,
} from "../../services/ai/analysisAgent";
import { applyInsertions } from "../../services/ai/applyInsertions";
import { AiLayoutPanel } from "./AiLayoutPanel";
import toast from "react-hot-toast";
import "./MarkdownEditor.css";
import { customKeymap } from "./editorShortcuts";
import { paragraphSelectionStyle } from "./mouseSelectionStyle";
import {
  WECHAT_IMAGE_MAX_SIZE_BYTES,
  formatImageSize,
} from "../../services/image/autoCompressImage";
import { uploadEditorImage } from "../../services/image/imageUploadFlow";
import {
  subscribeScrollIntent,
  type ScrollSyncAdapter,
} from "../Workspace/editorPreviewScrollSync";
import { WECHAT_TITLE_MAX_LENGTH } from "../../utils/publishMeta";

interface MarkdownEditorProps {
  onScrollSyncReady?: (adapter: ScrollSyncAdapter | null) => void;
}

const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);

export function MarkdownEditor({ onScrollSyncReady }: MarkdownEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const authorFieldRef = useRef<HTMLDivElement>(null);
  const {
    markdown: content,
    setMarkdown,
    publishTitle,
    publishAuthor,
    recentAuthors,
    usePublishTitle,
    usePublishAuthor,
    setPublishTitle,
    setPublishAuthor,
    selectRecentAuthor,
    setUsePublishTitle,
    setUsePublishAuthor,
    applyHeadingTitle,
  } = useEditorStore();
  const uiTheme = useUITheme((state) => state.theme);
  const [showSearch, setShowSearch] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [showAuthorSuggestions, setShowAuthorSuggestions] = useState(false);
  // AI 设计版式相关状态
  const [showAiLayout, setShowAiLayout] = useState(false);
  const [aiLayoutLoading, setAiLayoutLoading] = useState(false);
  const [aiLayoutInsertions, setAiLayoutInsertions] = useState<Insertion[]>([]);
  const [aiLayoutType, setAiLayoutType] = useState<string | undefined>(
    undefined,
  );
  const [aiLayoutTypeReason, setAiLayoutTypeReason] = useState<
    string | undefined
  >(undefined);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "f") {
        e.preventDefault();
        setShowSearch(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (
        authorFieldRef.current &&
        !authorFieldRef.current.contains(event.target as Node)
      ) {
        setShowAuthorSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  useEffect(() => {
    if (!editorRef.current) return;

    const currentContent = viewRef.current
      ? viewRef.current.state.doc.toString()
      : content;

    const startState = EditorState.create({
      doc: currentContent,
      extensions: [
        minimalSetup,
        customKeymap,
        markdown({ base: markdownLanguage, extensions: [underlineExtension] }),
        uiTheme === "dark"
          ? wechatMarkdownHighlightingDark
          : wechatMarkdownHighlighting,
        githubLight,
        EditorView.lineWrapping,
        paragraphSelectionStyle,
        EditorView.domEventHandlers({
          paste: (event, view) => {
            const items = event.clipboardData?.items;
            if (!items) return;

            for (const item of items) {
              if (item.type.startsWith("image/")) {
                event.preventDefault();
                const file = item.getAsFile();
                if (!file) continue;

                const needAutoCompress =
                  file.size > WECHAT_IMAGE_MAX_SIZE_BYTES;

                // 使用统一流程自动压缩并上传
                const uploadPromise = (async () => {
                  const result = await uploadEditorImage(file, {
                    compressionOptions: {
                      maxSizeBytes: WECHAT_IMAGE_MAX_SIZE_BYTES,
                    },
                  });
                  return result;
                })();

                const loadingToken = `wemd-upload-${Date.now()}-${Math.random()
                  .toString(36)
                  .slice(2, 8)}`;
                const loadingText = `![上传中... ${file.name}](${loadingToken})`;
                const range = view.state.selection.main;
                view.dispatch({
                  changes: {
                    from: range.from,
                    to: range.to,
                    insert: loadingText,
                  },
                });

                toast.promise(uploadPromise, {
                  loading: needAutoCompress
                    ? "正在压缩并上传图片..."
                    : "正在上传图片...",
                  success: (result) => {
                    const imageText = `![](${result.url})`;
                    const currentDoc = view.state.doc.toString();
                    const index = currentDoc.indexOf(loadingText);

                    if (index !== -1) {
                      view.dispatch({
                        changes: {
                          from: index,
                          to: index + loadingText.length,
                          insert: imageText,
                        },
                      });
                    }
                    return result.compressed
                      ? `图片上传成功（已自动压缩 ${formatImageSize(
                          result.originalSize,
                        )} -> ${formatImageSize(result.finalSize)}）`
                      : "图片上传成功";
                  },
                  error: (err) => {
                    const currentDoc = view.state.doc.toString();
                    const index = currentDoc.indexOf(loadingText);
                    if (index !== -1) {
                      view.dispatch({
                        changes: {
                          from: index,
                          to: index + loadingText.length,
                          insert: "",
                        },
                      });
                    }
                    return `上传失败: ${err.message}`;
                  },
                });
              }
            }
          },
        }),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            const newContent = update.state.doc.toString();
            setMarkdown(newContent);
          }
        }),
        EditorView.theme({
          "&": {
            height: "100%",
            fontSize: "15px",
          },
          ".cm-scroller": {
            fontFamily:
              "'SF Mono', 'Monaco', 'Inconsolata', 'Fira Code', monospace",
            lineHeight: "1.6",
          },
          ".cm-content": {
            padding: "16px",
          },
          ".cm-gutters": {
            backgroundColor: "#f8f9fa",
            border: "none",
          },
        }),
      ],
    });

    const view = new EditorView({
      state: startState,
      parent: editorRef.current,
    });

    const scrollDOM = view.scrollDOM;
    let scrollSubscriber: () => void = () => undefined;
    const getPosition = () => {
      const max = scrollDOM.scrollHeight - scrollDOM.clientHeight;
      const ratio = max > 0 ? scrollDOM.scrollTop / max : 0;
      const block = view.lineBlockAtHeight(scrollDOM.scrollTop);
      const line = view.state.doc.lineAt(block.from).number - 1;
      const progress =
        block.height > 0
          ? clamp((scrollDOM.scrollTop - block.top) / block.height, 0, 1)
          : 0;
      return { sourceLine: line + progress, ratio };
    };

    const scrollToPosition: ScrollSyncAdapter["scrollToPosition"] = (
      position,
    ) => {
      const max = scrollDOM.scrollHeight - scrollDOM.clientHeight;
      if (max <= 0) return;
      if (position.ratio >= 0.999 || position.sourceLine === null) {
        scrollDOM.scrollTo({ top: clamp(position.ratio, 0, 1) * max });
        return;
      }

      const sourceLine = clamp(
        position.sourceLine,
        0,
        Math.max(0, view.state.doc.lines - 1),
      );
      const lineNumber = Math.floor(sourceLine) + 1;
      const block = view.lineBlockAt(view.state.doc.line(lineNumber).from);
      const target = block.top + (sourceLine % 1) * block.height;
      scrollDOM.scrollTo({ top: clamp(target, 0, max) });
    };

    const handleEditorScroll = () => scrollSubscriber();
    scrollDOM.addEventListener("scroll", handleEditorScroll, { passive: true });
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
        subscribeScrollIntent(scrollDOM, listener),
    });

    viewRef.current = view;

    return () => {
      scrollDOM.removeEventListener("scroll", handleEditorScroll);
      onScrollSyncReady?.(null);
      view.destroy();
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setMarkdown, uiTheme, onScrollSyncReady]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const currentDoc = view.state.doc.toString();
    if (currentDoc === content) return;
    view.dispatch({
      changes: { from: 0, to: view.state.doc.length, insert: content },
    });
  }, [content]);

  const wordCount = countWords(content);
  const lineCount = countLines(content);

  const handleInsert = (
    prefix: string,
    suffix: string,
    placeholder: string,
  ) => {
    const view = viewRef.current;
    if (!view) return;

    const selection = view.state.selection.main;
    const selectedText = view.state.doc.sliceString(
      selection.from,
      selection.to,
    );
    const textToInsert = selectedText || placeholder;
    const fullText = prefix + textToInsert + suffix;

    view.dispatch({
      changes: {
        from: selection.from,
        to: selection.to,
        insert: fullText,
      },
      selection: {
        anchor: selection.from + prefix.length,
        head: selection.from + prefix.length + textToInsert.length,
      },
    });

    view.focus();
  };

  const handleOpenAi = async () => {
    if (aiLoading) return;
    const view = viewRef.current;
    if (!view) return;

    // 未配置则提示并打开设置
    if (!isAiConfigured()) {
      toast.error("请先在 AI 设置中完成服务配置");
      openAiSettings();
      return;
    }

    const sel = view.state.selection.main;
    const selected = view.state.doc.sliceString(sel.from, sel.to).trim();
    const isSelection = selected.length > 0;
    const inputText = isSelection ? selected : view.state.doc.toString();
    const mode: "selection" | "full" = isSelection ? "selection" : "full";

    if (!inputText.trim()) {
      toast.error("编辑器没有内容可转换");
      return;
    }

    setAiLoading(true);
    const toastId = toast.loading(
      mode === "selection" ? "AI 正在转换选区..." : "AI 正在转换整篇...",
    );
    try {
      const markdown = await textToMarkdown({ text: inputText, mode });
      if (isSelection) {
        view.dispatch({
          changes: { from: sel.from, to: sel.to, insert: markdown },
          selection: { anchor: sel.from, head: sel.from + markdown.length },
        });
      } else {
        view.dispatch({
          changes: { from: 0, to: view.state.doc.length, insert: markdown },
        });
        setMarkdown(markdown);
      }
      toast.success(
        mode === "selection"
          ? "选区已转换为 Markdown"
          : "整篇已转换为 Markdown",
        { id: toastId },
      );
      view.focus();
    } catch (e) {
      toast.error((e as Error).message || "AI 生成失败", { id: toastId });
    } finally {
      setAiLoading(false);
    }
  };

  // AI 设计版式：分析文章并弹出方案面板
  const handleAiLayout = async () => {
    if (aiLayoutLoading) return;
    const view = viewRef.current;
    if (!view) return;

    if (!isAiConfigured()) {
      toast.error("请先在 AI 设置中完成服务配置");
      openAiSettings();
      return;
    }

    const text = view.state.doc.toString().trim();
    if (!text) {
      toast.error("编辑器没有内容可分析");
      return;
    }

    setShowAiLayout(true);
    setAiLayoutLoading(true);
    setAiLayoutInsertions([]);
    setAiLayoutType(undefined);
    setAiLayoutTypeReason(undefined);
    try {
      const result = await analyzeArticle(text);
      setAiLayoutInsertions(result.insertions);
      setAiLayoutType(result.articleType);
      setAiLayoutTypeReason(result.typeReason);
    } catch (e) {
      toast.error((e as Error).message || "AI 分析失败");
      setShowAiLayout(false);
    } finally {
      setAiLayoutLoading(false);
    }
  };

  // 应用插入建议到编辑器（批量采纳时调用）
  const handleApplyInsertions = (insertions: Insertion[]) => {
    const view = viewRef.current;
    if (!view || insertions.length === 0) return;

    const currentText = view.state.doc.toString();
    const newText = applyInsertions(currentText, insertions);
    view.dispatch({
      changes: { from: 0, to: view.state.doc.length, insert: newText },
    });
    setMarkdown(newText);
    toast.success(`已采纳 ${insertions.length} 条建议`);
    setShowAiLayout(false);
    view.focus();
  };

  // 预览单条建议：保存原文 → 临时插入 → 右侧预览框显示
  const previewOriginalRef = useRef<string | null>(null);

  /** 滚动右侧预览框到目标组件，并加临时高亮 */
  const scrollPreviewToComponent = () => {
    // 等待预览框重新渲染（setMarkdown 后异步触发）
    setTimeout(() => {
      const container = document.querySelector(".preview-container");
      const target = document.querySelector(
        "#wemd .wemd-component[data-wemd-preview-target]",
      );
      if (!container || !target) return;

      // 滚动到组件位置（居中显示）
      const containerEl = container as HTMLElement;
      const targetEl = target as HTMLElement;
      const containerRect = containerEl.getBoundingClientRect();
      const targetRect = targetEl.getBoundingClientRect();
      const offset =
        targetRect.top -
        containerRect.top +
        containerEl.scrollTop -
        containerRect.height / 2 +
        targetRect.height / 2;
      containerEl.scrollTo({ top: Math.max(0, offset), behavior: "smooth" });

      // 加临时高亮边框（2 秒后消失）
      targetEl.classList.add("wemd-preview-highlight");
      setTimeout(() => {
        targetEl.classList.remove("wemd-preview-highlight");
        targetEl.removeAttribute("data-wemd-preview-target");
      }, 2000);
    }, 120);
  };

  const handlePreviewInsertion = (ins: Insertion) => {
    const view = viewRef.current;
    if (!view) return;

    // 如果正在预览（previewOriginalRef 有值），先恢复原文，再插入新预览
    // 这样 previewOriginalRef 始终保存"真原文"，切换预览不会污染
    const baseText =
      previewOriginalRef.current !== null
        ? previewOriginalRef.current
        : view.state.doc.toString();
    previewOriginalRef.current = baseText;

    // 给组件 body 加临时标记（用于渲染后定位）
    const markedIns: Insertion = {
      ...ins,
      body: `${ins.body}\n\n<span data-wemd-preview-target></span>`,
    };

    // 插入单条建议
    const newText = applyInsertions(baseText, [markedIns]);
    view.dispatch({
      changes: { from: 0, to: view.state.doc.length, insert: newText },
    });
    setMarkdown(newText);

    // 滚动右侧预览框到组件位置
    scrollPreviewToComponent();
  };

  // 撤销预览：恢复原文
  const handleUndoPreview = () => {
    const view = viewRef.current;
    if (!view || previewOriginalRef.current === null) return;

    const original = previewOriginalRef.current;
    view.dispatch({
      changes: { from: 0, to: view.state.doc.length, insert: original },
    });
    setMarkdown(original);
    previewOriginalRef.current = null;
  };

  const handleUseHeadingTitle = () => {
    const result = applyHeadingTitle();
    if (!result.title) {
      toast.error("正文里还没有可用的标题");
      return;
    }
    toast.success(
      result.truncated
        ? `已使用正文标题，已按 ${WECHAT_TITLE_MAX_LENGTH} 字截断`
        : "已使用正文标题",
    );
  };

  const titleLength = Array.from(publishTitle).length;
  const filteredRecentAuthors = useMemo(() => {
    const keyword = publishAuthor.trim().toLowerCase();
    if (!keyword) return recentAuthors;
    return recentAuthors.filter((author) =>
      author.toLowerCase().includes(keyword),
    );
  }, [publishAuthor, recentAuthors]);

  return (
    <div className="markdown-editor">
      <div className="editor-header">
        <span className="editor-title">Markdown 编辑器</span>
      </div>
      <Toolbar
        onInsert={handleInsert}
        onOpenAi={handleOpenAi}
        aiLoading={aiLoading}
        onOpenAiLayout={handleAiLayout}
        aiLayoutLoading={aiLayoutLoading}
      />
      <div className="editor-meta-bar">
        <div className="editor-meta-field editor-meta-field-title">
          <label
            className="editor-meta-toggle"
            htmlFor="editor-use-publish-title"
          >
            <input
              id="editor-use-publish-title"
              type="checkbox"
              checked={usePublishTitle}
              onChange={(e) => setUsePublishTitle(e.target.checked)}
              aria-label="使用标题"
              title="使用标题"
            />
          </label>
          <div className="editor-meta-input-wrap">
            <input
              id="editor-publish-title"
              className="editor-meta-input"
              type="text"
              placeholder={
                usePublishTitle
                  ? "公众号标题，留空时插件会优先取正文 H1"
                  : "未启用标题同步"
              }
              maxLength={WECHAT_TITLE_MAX_LENGTH}
              value={publishTitle}
              onChange={(e) => setPublishTitle(e.target.value)}
              disabled={!usePublishTitle}
            />
            <button
              type="button"
              className="editor-meta-icon-button"
              onClick={handleUseHeadingTitle}
              disabled={!usePublishTitle}
              aria-label="使用正文标题"
              title="使用正文标题"
            >
              <RefreshCw size={14} strokeWidth={2} />
            </button>
            <span className="editor-meta-counter">
              {titleLength}/{WECHAT_TITLE_MAX_LENGTH}
            </span>
          </div>
        </div>
        <div
          ref={authorFieldRef}
          className="editor-meta-field editor-meta-field-author"
        >
          <label
            className="editor-meta-toggle"
            htmlFor="editor-use-publish-author"
          >
            <input
              id="editor-use-publish-author"
              type="checkbox"
              checked={usePublishAuthor}
              onChange={(e) => setUsePublishAuthor(e.target.checked)}
              aria-label="使用作者"
              title="使用作者"
            />
          </label>
          <input
            id="editor-publish-author"
            className="editor-meta-input"
            type="text"
            placeholder={usePublishAuthor ? "作者名称" : "未启用作者同步"}
            title={
              usePublishAuthor
                ? "作者名称，复制 HTML 后插件会优先填这个值"
                : "未启用作者同步"
            }
            value={publishAuthor}
            onFocus={() => setShowAuthorSuggestions(usePublishAuthor)}
            onChange={(e) => {
              setPublishAuthor(e.target.value);
              setShowAuthorSuggestions(usePublishAuthor);
            }}
            disabled={!usePublishAuthor}
          />
          {usePublishAuthor && showAuthorSuggestions && (
            <div className="editor-meta-suggestions" role="listbox">
              {filteredRecentAuthors.length > 0 ? (
                filteredRecentAuthors.map((author) => (
                  <button
                    key={author}
                    type="button"
                    className="editor-meta-suggestion"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      selectRecentAuthor(author);
                      setShowAuthorSuggestions(false);
                    }}
                  >
                    {author}
                  </button>
                ))
              ) : (
                <div className="editor-meta-suggestion-empty">
                  暂无最近作者，复制成功后会出现在这里
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      {showSearch && viewRef.current && (
        <SearchPanel
          view={viewRef.current}
          onClose={() => setShowSearch(false)}
        />
      )}
      <div className="editor-body-wrapper">
        <div ref={editorRef} className="editor-container" />
      </div>
      <div className="editor-footer">
        <div className="editor-stats">
          <span className="editor-stat">行数: {lineCount}</span>
          <span className="editor-stat">字数: {wordCount}</span>
        </div>
        <SaveIndicator />
      </div>
      <AiLayoutPanel
        open={showAiLayout}
        loading={aiLayoutLoading}
        insertions={aiLayoutInsertions}
        onClose={() => setShowAiLayout(false)}
        onApply={handleApplyInsertions}
        onPreview={handlePreviewInsertion}
        onUndoPreview={handleUndoPreview}
        onRefresh={handleAiLayout}
        articleType={aiLayoutType}
        typeReason={aiLayoutTypeReason}
      />
    </div>
  );
}
