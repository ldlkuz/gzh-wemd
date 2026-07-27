import type { CSSProperties } from "react";
import { Loader2 } from "lucide-react";
import { MarkdownEditor } from "../Editor/MarkdownEditor";
import { MarkdownPreview } from "../Preview/MarkdownPreview";
import { ResizeHandle } from "./ResizeHandle";
import { useEditorPreviewScrollSync } from "./useEditorPreviewScrollSync";
import { useSplitPane } from "./useSplitPane";
import "./EditorPreviewWorkspace.css";

interface EditorPreviewWorkspaceProps {
  loading: boolean;
  mobileView?: "editor" | "preview";
  showHistory?: boolean;
  onToggleHistory?: () => void;
}

const Loading = () => (
  <div className="workspace-loading">
    <Loader2 className="animate-spin" size={24} />
    <p>正在加载文章</p>
  </div>
);

export function EditorPreviewWorkspace({
  loading,
  mobileView,
  showHistory,
  onToggleHistory,
}: EditorPreviewWorkspaceProps) {
  const { registerEditor, registerPreview } = useEditorPreviewScrollSync();
  const {
    containerRef,
    ratio,
    minRatio,
    maxRatio,
    editorWidth,
    isDragging,
    setDragging,
    setRatio,
    setRatioFromClientX,
    resetRatio,
  } = useSplitPane();
  const style = {
    "--editor-pane-width": `${editorWidth}px`,
  } as CSSProperties;

  return (
    <div
      ref={containerRef}
      className={`workspace ${isDragging ? "is-resizing" : ""}`}
      style={style}
      data-mobile-view={mobileView}
    >
      <div className="editor-pane">
        {loading ? (
          <Loading />
        ) : (
          <MarkdownEditor
            onScrollSyncReady={registerEditor}
            showHistory={showHistory}
            onToggleHistory={onToggleHistory}
          />
        )}
      </div>
      <ResizeHandle
        ratio={ratio}
        minRatio={minRatio}
        maxRatio={maxRatio}
        onRatioChange={setRatio}
        onPointerPosition={setRatioFromClientX}
        onReset={resetRatio}
        onDraggingChange={setDragging}
      />
      <div className="preview-pane">
        {loading ? (
          <Loading />
        ) : (
          <MarkdownPreview onScrollSyncReady={registerPreview} />
        )}
      </div>
    </div>
  );
}
