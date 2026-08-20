import { useEffect, useMemo, useRef, useState } from "react";
import {
  createMarkdownParser,
  getThemeTemplates,
  getThemeSlotDefs,
  processHtml,
  type ThemeDefinition,
} from "@wemd/core";
import { useEditorStore } from "../../store/editorStore";
import { useThemeStore } from "../../store/themeStore";
import { convertLinksToFootnotes } from "../../utils/linkFootnote";
import {
  getPublishingPreference,
  subscribePublishingPreference,
} from "../../store/publishingPreferences";
import "./DebugPreviewPanel.css";

interface DebugIssue {
  type: "syntax" | "danger" | "removed";
  level: "error" | "warn";
  msg: string;
}

interface DebugReport {
  ok: boolean;
  issues: DebugIssue[];
}

interface DebugPreviewPanelProps {
  /** 是否展开调试面板（宽度由父容器 CSS 控制；false 时收起） */
  open?: boolean;
  /** 关闭回调（header 右上角关闭按钮） */
  onClose?: () => void;
}

// <paste-editor> 自定义元素（由 /vendor/paste-editor.js 定义，含 Shadow DOM 兜底样式）
interface PasteEditorElement extends HTMLElement {
  value: string;
  engine?: { setHTML(h: string): DebugReport };
}

// 让 JSX 认识 <paste-editor>
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      "paste-editor": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          readonly?: boolean | "";
          placeholder?: string;
        },
        HTMLElement
      >;
    }
  }
}

/**
 * 调试预览面板
 *
 * 与 MarkdownPreview 视觉一致（header + 滚动容器 + content），内核用
 * `<paste-editor>` Web Component（与 paste-editor/index.html 演示页同一套渲染环境，
 * 含 Shadow DOM 兜底样式）：
 * - 喂入的是「导出内联版」HTML（processHtml inline + 物化），等价于复制到公众号的最终形态；
 * - 组件按公众号发布行为清洗并触发 report（removed / danger / syntax），
 *   用于判断「自带效果 vs 公众号最终效果」是否一致。
 */
export function DebugPreviewPanel({
  open = false,
  onClose,
}: DebugPreviewPanelProps) {
  const { markdown } = useEditorStore();
  const { themeId: theme, getThemeCSS } = useThemeStore();
  const [linkToFootnoteEnabled, setLinkToFootnoteEnabledState] = useState(() =>
    getPublishingPreference("linkToFootnote"),
  );
  const [report, setReport] = useState<DebugReport | null>(null);
  const editorRef = useRef<PasteEditorElement | null>(null);

  const currentTheme = useThemeStore(
    (state) =>
      state.customThemes.find((t) => t.id === state.themeId) ||
      state.getAllThemes().find((t) => t.id === state.themeId),
  );
  const designerVars = currentTheme?.designerVariables;
  const showMacBar = designerVars?.showMacBar ?? false;

  const themeDefinition = currentTheme?.definition as
    | ThemeDefinition
    | undefined;
  const parser = useMemo(() => {
    const templates = getThemeTemplates(themeDefinition);
    const slotDefs = getThemeSlotDefs(themeDefinition);
    return createMarkdownParser({
      showMacBar,
      mathRenderer: "katex",
      getTemplate: (componentId) => templates.get(componentId),
      getSlotDefs: (componentId) => slotDefs.get(componentId),
    });
  }, [showMacBar, themeDefinition]);

  // 调试面板同样用亮色 CSS（公众号只支持亮色）
  const previewCss = useMemo(
    () => getThemeCSS(theme, false),
    [theme, getThemeCSS],
  );

  // 生成「导出内联版」HTML —— 与复制到公众号路径一致。
  // 用防抖（停止输入后才计算），避免每次击键同步重算整篇内联导致主线程卡顿。
  const [exportedHtml, setExportedHtml] = useState("");
  const latestHtmlRef = useRef(exportedHtml);
  latestHtmlRef.current = exportedHtml;
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const rawHtml = parser.render(markdown);
      const themedHtml = linkToFootnoteEnabled
        ? convertLinksToFootnotes(rawHtml)
        : rawHtml;
      setExportedHtml(processHtml(themedHtml, previewCss, true, true));
    }, 250);
    return () => window.clearTimeout(timer);
  }, [markdown, parser, previewCss, linkToFootnoteEnabled]);

  useEffect(() => {
    return subscribePublishingPreference(
      "linkToFootnote",
      setLinkToFootnoteEnabledState,
    );
  }, []);

  // 打开时写入最新导出 HTML 到 <paste-editor>，并监听 report 事件
  useEffect(() => {
    const el = editorRef.current;
    if (!open || !el) return;

    const onReport = (e: Event) => {
      setReport((e as CustomEvent<DebugReport>).detail);
    };
    el.addEventListener("report", onReport);

    // 防抖写入（停止输入后才灌入），避免每次击键全量清洗
    const timer = window.setTimeout(() => {
      try {
        if (el.engine) {
          setReport(el.engine.setHTML(latestHtmlRef.current));
        } else {
          el.value = latestHtmlRef.current;
        }
      } catch {
        /* 引擎未就绪时忽略 */
      }
    }, 300);
    return () => {
      window.clearTimeout(timer);
      el.removeEventListener("report", onReport);
    };
  }, [open, exportedHtml]);

  const issueCount = report?.issues.length ?? 0;
  const removedCount =
    report?.issues.filter((i) => i.type === "removed").length ?? 0;
  const dangerCount =
    report?.issues.filter((i) => i.type === "danger").length ?? 0;

  return (
    <div className="debug-preview">
      <div className="debug-preview__header">
        <span className="debug-preview__title">调试预览</span>
        <span className="debug-preview__subtitle">公众号模拟</span>
        {issueCount > 0 && (
          <span
            className={`debug-preview__badge ${
              dangerCount > 0 ? "is-danger" : "is-warn"
            }`}
          >
            差异 {issueCount}
          </span>
        )}
        {onClose && (
          <button
            type="button"
            className="debug-preview__close"
            onClick={onClose}
            title="关闭调试预览"
            aria-label="关闭调试预览"
          >
            ×
          </button>
        )}
      </div>
      <div className="debug-preview__body">
        <div className="debug-preview__content">
          <paste-editor
            ref={(el) => {
              editorRef.current = el as PasteEditorElement | null;
            }}
            readonly={open ? "" : undefined}
            placeholder="点击右上角“调试”按钮，在此预览公众号模拟效果"
          />
        </div>
      </div>
      {report && report.issues.length > 0 && (
        <div className="debug-preview__report">
          {removedCount > 0 && (
            <div className="debug-preview__report-line">
              <b>{removedCount}</b> 个元素公众号将移除（warn）
            </div>
          )}
          {dangerCount > 0 && (
            <div className="debug-preview__report-line is-danger">
              <b>{dangerCount}</b> 个危险成分被拦截（error）
            </div>
          )}
        </div>
      )}
    </div>
  );
}
