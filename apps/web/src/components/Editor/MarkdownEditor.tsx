import { useEffect, useMemo, useRef, useState } from "react";
import { EditorView, minimalSetup } from "codemirror";
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { EditorState } from "@codemirror/state";
import { githubLight } from "@uiw/codemirror-theme-github";
import { RefreshCw, PanelLeft, PanelLeftClose } from "lucide-react";
import {
  wechatMarkdownHighlighting,
  wechatMarkdownHighlightingDark,
} from "./markdownTheme";
import { underlineExtension } from "./markdownUnderline";
import { useUITheme } from "../../hooks/useUITheme";
import { useEditorStore } from "../../store/editorStore";
import { useThemeStore } from "../../store/themeStore";
import { getBuiltInThemeDefinition } from "@wemd/core";
import { countWords, countLines } from "../../utils/wordCount";
import { Toolbar } from "./Toolbar";
import { SearchPanel } from "./SearchPanel";
import { SaveIndicator } from "./SaveIndicator";
import { openAiSettings, isAiConfigured } from "../../services/ai/aiConfig";
import { textToMarkdown } from "../../services/ai/aiService";
import { AiDesignPanel } from "./AiDesignPanel";
import {
  generateTemplate,
  type TemplateGenerationResult,
} from "../../services/template";
import type { Audience, DesignConstraints } from "../../services/ai/types";
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
  showHistory?: boolean;
  onToggleHistory?: () => void;
}

const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);

export function MarkdownEditor({
  onScrollSyncReady,
  showHistory,
  onToggleHistory,
}: MarkdownEditorProps) {
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
  // AI 设计统一状态
  const [showAiDesign, setShowAiDesign] = useState(false);
  // 模板排版模式状态
  const [templateLoading, setTemplateLoading] = useState(false);
  const [templateResult, setTemplateResult] =
    useState<TemplateGenerationResult | null>(null);
  const [isTemplatePreviewing, setIsTemplatePreviewing] = useState(false);
  const templateOriginalRef = useRef<string | null>(null);

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
      let target: number;
      if (position.ratio >= 0.999 || position.sourceLine === null) {
        target = clamp(position.ratio, 0, 1) * max;
      } else {
        const sourceLine = clamp(
          position.sourceLine,
          0,
          Math.max(0, view.state.doc.lines - 1),
        );
        const lineNumber = Math.floor(sourceLine) + 1;
        const block = view.lineBlockAt(view.state.doc.line(lineNumber).from);
        target = clamp(block.top + (sourceLine % 1) * block.height, 0, max);
      }
      // 停止校准：平滑滚动到目标位置，避免瞬跳
      scrollDOM.scrollTo({ top: target, behavior: "smooth" });
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

  // AI 设计：打开统一面板
  const handleOpenAiDesign = () => {
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

    setShowAiDesign(true);
  };

  // 模板排版模式：生成模板
  const handleGenerateTemplateInner = async (
    audience?: Audience,
    constraints?: DesignConstraints,
  ) => {
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

    // 如果正在预览，先恢复原文
    if (isTemplatePreviewing && templateOriginalRef.current !== null) {
      view.dispatch({
        changes: {
          from: 0,
          to: view.state.doc.length,
          insert: templateOriginalRef.current,
        },
      });
      setMarkdown(templateOriginalRef.current);
      templateOriginalRef.current = null;
      setIsTemplatePreviewing(false);
    }

    // 检测纯文本，自动转换为 Markdown
    let activeText = text;
    const hasMarkdownSyntax =
      /^#{1,6}\s|^\s*[-*+]\s|^\s*\d+\.\s|`|\[.+\]\(.+\)|!\[|:::|\*\*|__/m.test(
        text,
      );
    if (!hasMarkdownSyntax) {
      const toastId = toast.loading("检测到纯文本，正在自动转换为 Markdown...");
      try {
        activeText = await textToMarkdown({ text, mode: "full" });
        view.dispatch({
          changes: { from: 0, to: view.state.doc.length, insert: activeText },
        });
        setMarkdown(activeText);
        toast.success("已自动转换为 Markdown", { id: toastId });
      } catch (e) {
        toast.error("Markdown 转换失败，使用原文继续", { id: toastId });
      }
    }

    setTemplateLoading(true);
    setTemplateResult(null);
    try {
      // 获取当前主题的 layout 偏好，传递给 AI
      const themeId = useThemeStore.getState().themeId;
      const builtInDef = getBuiltInThemeDefinition(themeId);
      const customThemes = useThemeStore.getState().customThemes;
      const customTheme = customThemes.find((t) => t.id === themeId);
      // 优先使用导入主题自身的 layout，其次回退到内置主题
      const themeLayout = customTheme?.definition?.layout || builtInDef?.layout;
      // AI 主题的品牌语言（brand.md）
      const brandText = customTheme?.brandText;
      const result = await generateTemplate(
        activeText,
        undefined,
        themeLayout,
        audience,
        constraints,
        brandText,
      );
      setTemplateResult(result);
    } catch (e) {
      toast.error((e as Error).message || "AI 生成失败");
    } finally {
      setTemplateLoading(false);
    }
  };

  // 重置模板结果（重新生成时恢复原文）
  const handleResetTemplate = () => {
    setTemplateResult(null);
    if (templateOriginalRef.current !== null) {
      const view = viewRef.current;
      if (view) {
        view.dispatch({
          changes: {
            from: 0,
            to: view.state.doc.length,
            insert: templateOriginalRef.current,
          },
        });
        setMarkdown(templateOriginalRef.current);
      }
      templateOriginalRef.current = null;
      setIsTemplatePreviewing(false);
    }
  };

  // Template 模式：预览全文
  const handleTemplatePreview = (result: TemplateGenerationResult) => {
    const view = viewRef.current;
    if (!view) return;

    // 保存原文
    const original = view.state.doc.toString();
    templateOriginalRef.current = original;

    // 替换为渲染后的 Markdown
    view.dispatch({
      changes: {
        from: 0,
        to: view.state.doc.length,
        insert: result.rendered.markdown,
      },
    });
    setMarkdown(result.rendered.markdown);
    setIsTemplatePreviewing(true);

    // 滚动到顶部
    setTimeout(() => {
      const container = document.querySelector(".preview-container");
      if (container) {
        (container as HTMLElement).scrollTo({ top: 0, behavior: "smooth" });
      }
    }, 120);
  };

  // Template 模式：撤销预览
  const handleTemplateUndoPreview = () => {
    const view = viewRef.current;
    if (!view || templateOriginalRef.current === null) return;

    const original = templateOriginalRef.current;
    view.dispatch({
      changes: { from: 0, to: view.state.doc.length, insert: original },
    });
    setMarkdown(original);
    templateOriginalRef.current = null;
    setIsTemplatePreviewing(false);
  };

  // Template 模式：应用到文章
  const handleTemplateApply = (result: TemplateGenerationResult) => {
    const view = viewRef.current;
    if (!view) return;

    // 保存原文，以便重新生成时恢复
    templateOriginalRef.current = view.state.doc.toString();

    view.dispatch({
      changes: {
        from: 0,
        to: view.state.doc.length,
        insert: result.rendered.markdown,
      },
    });
    setMarkdown(result.rendered.markdown);
    toast.success("已应用杂志级排版");
    setShowAiDesign(false);
    setIsTemplatePreviewing(false);
    view.focus();
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
        <button
          className="btn-icon-only sidebar-toggle"
          onClick={onToggleHistory}
          aria-label={showHistory ? "隐藏列表" : "显示列表"}
          title={showHistory ? "隐藏列表" : "显示列表"}
        >
          {showHistory ? (
            <PanelLeftClose size={18} strokeWidth={2} />
          ) : (
            <PanelLeft size={18} strokeWidth={2} />
          )}
        </button>
        <span className="editor-title">Markdown 编辑器</span>
      </div>
      <Toolbar
        onInsert={handleInsert}
        onOpenAi={handleOpenAi}
        aiLoading={aiLoading}
        onOpenAiDesign={handleOpenAiDesign}
        aiDesignLoading={templateLoading}
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
      <AiDesignPanel
        open={showAiDesign}
        onClose={() => setShowAiDesign(false)}
        // 模板排版模式
        templateLoading={templateLoading}
        templateResult={templateResult}
        onGenerateTemplate={handleGenerateTemplateInner}
        onApplyTemplate={handleTemplateApply}
        onPreviewTemplate={handleTemplatePreview}
        onUndoTemplatePreview={handleTemplateUndoPreview}
        isTemplatePreviewing={isTemplatePreviewing}
        onResetTemplate={handleResetTemplate}
      />
    </div>
  );
}
