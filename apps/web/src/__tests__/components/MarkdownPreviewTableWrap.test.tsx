import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MarkdownPreview } from "../../components/Preview/MarkdownPreview";
import { setPublishingPreference } from "../../store/publishingPreferences";

const { renderTableBlocksForPreviewMock } = vi.hoisted(() => ({
  renderTableBlocksForPreviewMock: vi.fn(async () => undefined),
}));

vi.mock("../../services/wechatTableRenderer", () => ({
  renderTableBlocksForPreview: renderTableBlocksForPreviewMock,
}));

vi.mock("../../store/editorStore", () => ({
  useEditorStore: () => ({
    markdown: "| 表头 |\n| --- |\n| 很长的单元格内容 |",
  }),
}));

const themeState = {
  themeId: "default",
  customCSS: "",
  customThemes: [],
  getThemeCSS: () => "#wemd table { width: 100%; }",
  getAllThemes: () => [],
};

vi.mock("../../store/themeStore", () => ({
  useThemeStore: (selector?: (state: typeof themeState) => unknown) =>
    selector ? selector(themeState) : themeState,
}));

vi.mock("../../hooks/useUITheme", () => ({
  useUITheme: (selector: (state: { theme: string }) => unknown) =>
    selector({ theme: "light" }),
}));

vi.mock("mermaid", () => ({
  default: {
    initialize: vi.fn(),
    render: vi.fn(),
  },
}));

describe("MarkdownPreview 表格自动换行", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    renderTableBlocksForPreviewMock.mockClear();
    const store = new Map<string, string>();
    vi.stubGlobal("localStorage", {
      getItem: vi.fn((key: string) => store.get(key) ?? null),
      setItem: vi.fn((key: string, value: string) => {
        store.set(key, String(value));
      }),
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("开关变化后立即用新模式重排右侧现有表格", async () => {
    render(<MarkdownPreview />);
    await act(async () => {
      vi.advanceTimersByTime(110);
    });
    expect(renderTableBlocksForPreviewMock).toHaveBeenLastCalledWith(
      expect.any(HTMLElement),
      false,
    );
    expect(document.querySelector("[data-wemd-source-start]")).not.toBeNull();

    await act(async () => {
      setPublishingPreference("tableWrap", true);
      vi.advanceTimersByTime(110);
    });

    expect(renderTableBlocksForPreviewMock).toHaveBeenLastCalledWith(
      expect.any(HTMLElement),
      true,
    );
  });
});
