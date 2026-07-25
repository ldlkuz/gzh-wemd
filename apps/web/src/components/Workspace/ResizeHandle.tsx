import { useRef, type PointerEvent as ReactPointerEvent } from "react";

interface ResizeHandleProps {
  ratio: number;
  minRatio?: number;
  maxRatio?: number;
  onRatioChange: (ratio: number) => void;
  onPointerPosition: (clientX: number) => void;
  onReset: () => void;
  onDraggingChange?: (dragging: boolean) => void;
}

export function ResizeHandle({
  ratio,
  minRatio = 0.35,
  maxRatio = 0.65,
  onRatioChange,
  onPointerPosition,
  onReset,
  onDraggingChange,
}: ResizeHandleProps) {
  const draggingRef = useRef(false);

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    draggingRef.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
    onDraggingChange?.(true);
    onPointerPosition(event.clientX);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    onPointerPosition(event.clientX);
  };

  const finishDragging = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    onDraggingChange?.(false);
  };

  return (
    <div
      className="workspace-resize-handle"
      role="separator"
      aria-label="调整编辑器与预览宽度"
      aria-orientation="vertical"
      aria-valuemin={Math.round(minRatio * 100)}
      aria-valuemax={Math.round(maxRatio * 100)}
      aria-valuenow={Math.round(ratio * 100)}
      tabIndex={0}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={finishDragging}
      onPointerCancel={finishDragging}
      onDoubleClick={onReset}
      onKeyDown={(event) => {
        if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
        event.preventDefault();
        const direction = event.key === "ArrowLeft" ? -1 : 1;
        const step = event.shiftKey ? 0.1 : 0.02;
        onRatioChange(ratio + direction * step);
      }}
    >
      <span className="workspace-resize-handle__line" aria-hidden="true" />
    </div>
  );
}
