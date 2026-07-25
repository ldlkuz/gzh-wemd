import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ResizeHandle } from "../../components/Workspace/ResizeHandle";

describe("编辑器与预览分隔条", () => {
  it("支持键盘微调和双击恢复默认宽度", () => {
    const onRatioChange = vi.fn();
    const onReset = vi.fn();
    render(
      <ResizeHandle
        ratio={0.6}
        onRatioChange={onRatioChange}
        onPointerPosition={vi.fn()}
        onReset={onReset}
      />,
    );

    const separator = screen.getByRole("separator", {
      name: "调整编辑器与预览宽度",
    });
    fireEvent.keyDown(separator, { key: "ArrowLeft" });
    fireEvent.keyDown(separator, { key: "ArrowRight", shiftKey: true });
    fireEvent.doubleClick(separator);

    expect(onRatioChange).toHaveBeenNthCalledWith(1, 0.58);
    expect(onRatioChange).toHaveBeenNthCalledWith(2, 0.7);
    expect(onReset).toHaveBeenCalledOnce();
  });

  it("拖动时持续更新指针位置并正确结束拖动态", () => {
    const onPointerPosition = vi.fn();
    const onDraggingChange = vi.fn();
    render(
      <ResizeHandle
        ratio={0.6}
        onRatioChange={vi.fn()}
        onPointerPosition={onPointerPosition}
        onReset={vi.fn()}
        onDraggingChange={onDraggingChange}
      />,
    );

    const separator = screen.getByRole("separator");
    Object.assign(separator, {
      setPointerCapture: vi.fn(),
      hasPointerCapture: vi.fn(() => true),
      releasePointerCapture: vi.fn(),
    });
    fireEvent.pointerDown(separator, { pointerId: 1, clientX: 500 });
    fireEvent.pointerMove(separator, { pointerId: 1, clientX: 560 });
    fireEvent.pointerUp(separator, { pointerId: 1, clientX: 560 });

    expect(onPointerPosition).toHaveBeenNthCalledWith(1, 500);
    expect(onPointerPosition).toHaveBeenNthCalledWith(2, 560);
    expect(onDraggingChange).toHaveBeenNthCalledWith(1, true);
    expect(onDraggingChange).toHaveBeenNthCalledWith(2, false);
  });
});
