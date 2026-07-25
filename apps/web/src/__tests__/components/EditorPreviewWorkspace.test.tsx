import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { EditorPreviewWorkspace } from "../../components/Workspace/EditorPreviewWorkspace";

vi.mock("../../components/Editor/MarkdownEditor", () => ({
  MarkdownEditor: () => <div>编辑器</div>,
}));

vi.mock("../../components/Preview/MarkdownPreview", () => ({
  MarkdownPreview: () => <div>预览区</div>,
}));

describe("编辑器与预览工作区", () => {
  beforeEach(() => {
    const store = new Map<string, string>();
    vi.stubGlobal("localStorage", {
      getItem: vi.fn((key: string) => store.get(key) ?? null),
      setItem: vi.fn((key: string, value: string) => {
        store.set(key, String(value));
      }),
    });
  });

  afterEach(() => vi.unstubAllGlobals());

  it("默认提供可调分隔条并持久化键盘调整后的比例", async () => {
    render(<EditorPreviewWorkspace loading={false} />);

    const separator = screen.getByRole("separator", {
      name: "调整编辑器与预览宽度",
    });
    expect(screen.getByText("编辑器")).toBeInTheDocument();
    expect(screen.getByText("预览区")).toBeInTheDocument();

    fireEvent.keyDown(separator, { key: "ArrowLeft" });

    await waitFor(() => {
      expect(
        Number(localStorage.getItem("wemd-editor-pane-ratio")),
      ).toBeCloseTo(0.56);
    });
  });
});
