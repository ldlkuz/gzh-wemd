import { render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MarkdownPreview } from "../../components/Preview/MarkdownPreview";
import {
  createEditorPreviewScrollSync,
  type ScrollSyncAdapter,
} from "../../components/Workspace/editorPreviewScrollSync";

const markdown = `# 长文档同步验收

开场段落用于建立第一个稳定锚点。

![异步图片](https://example.com/cover.png)

$$
\\frac{a + b}{c}
$$

\`\`\`mermaid
flowchart LR
  A[开始] --> B[结束]
\`\`\`

| 项目 | 说明 |
| --- | --- |
| 同步 | 表格布局变化后仍保持源行 |

\`\`\`ts
const ready = true;
\`\`\`

结尾段落用于验证长文档中后段定位。`;

const themeState = {
  themeId: "default",
  customCSS: "",
  customThemes: [],
  getThemeCSS: () => "",
  getAllThemes: () => [],
};

vi.mock("../../store/editorStore", () => ({
  useEditorStore: () => ({ markdown }),
}));

vi.mock("../../store/themeStore", () => ({
  useThemeStore: (selector?: (state: typeof themeState) => unknown) =>
    selector ? selector(themeState) : themeState,
}));

vi.mock("../../hooks/useUITheme", () => ({
  useUITheme: (selector: (state: { theme: string }) => unknown) =>
    selector({ theme: "light" }),
}));

const mermaidRender = vi.fn(async (_id: string, _diagram: string) => ({
  svg: '<svg viewBox="0 0 100 40"><text>流程图</text></svg>',
}));

vi.mock("mermaid", () => ({
  default: {
    initialize: vi.fn(),
    render: (id: string, diagram: string) => mermaidRender(id, diagram),
  },
}));

vi.mock("../../utils/katexRenderer", () => ({
  hasMathFormula: () => true,
  renderMathInElement: vi.fn(),
}));

vi.mock("../../utils/mermaidConfig", () => ({
  getMermaidConfig: () => ({}),
  getThemedMermaidDiagram: (input: string) => input,
}));

vi.mock("../../services/wechatTableRenderer", () => ({
  renderTableBlocksForPreview: vi.fn(async () => undefined),
}));

const createFrameQueue = () => {
  let nextHandle = 1;
  const queue = new Map<number, FrameRequestCallback>();
  return {
    request: (callback: FrameRequestCallback) => {
      const handle = nextHandle++;
      queue.set(handle, callback);
      return handle;
    },
    cancel: (handle: number) => queue.delete(handle),
    flush: () => {
      const callbacks = Array.from(queue.values());
      queue.clear();
      callbacks.forEach((callback) => callback(0));
    },
  };
};

describe("长文档预览锚点同步", () => {
  let layoutScale = 1;
  let resizeCallback: ResizeObserverCallback | null = null;

  beforeEach(() => {
    const preferences = new Map<string, string>();
    vi.stubGlobal("localStorage", {
      getItem: vi.fn((key: string) => preferences.get(key) ?? null),
      setItem: vi.fn((key: string, value: string) => {
        preferences.set(key, String(value));
      }),
    });
    mermaidRender.mockClear();
    layoutScale = 1;
    resizeCallback = null;

    vi.stubGlobal(
      "ResizeObserver",
      class ResizeObserverMock {
        constructor(callback: ResizeObserverCallback) {
          resizeCallback = callback;
        }

        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );

    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(
      function (this: HTMLElement) {
        const sourceLine = Number(this.dataset.wemdSourceStart);
        const top = Number.isFinite(sourceLine)
          ? sourceLine * 24 * layoutScale
          : 0;
        const height = Number.isFinite(sourceLine) ? 20 * layoutScale : 400;
        return {
          x: 0,
          y: top,
          top,
          left: 0,
          right: 402,
          bottom: top + height,
          width: 402,
          height,
          toJSON: () => ({}),
        };
      },
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("异步内容改变布局后仍按编辑器源行恢复预览位置", async () => {
    let previewAdapter: ScrollSyncAdapter | null = null;
    const handleReady = (adapter: ScrollSyncAdapter | null) => {
      previewAdapter = adapter;
    };
    const { container } = render(
      <MarkdownPreview onScrollSyncReady={handleReady} />,
    );

    await waitFor(() => expect(previewAdapter).not.toBeNull());
    await waitFor(() => expect(mermaidRender).toHaveBeenCalledOnce());

    const previewContainer = container.querySelector(
      ".preview-container",
    ) as HTMLElement;
    Object.defineProperties(previewContainer, {
      clientHeight: { configurable: true, value: 400 },
      scrollHeight: { configurable: true, value: 2400 },
    });

    const expectAnchoredContent = (selector: string) => {
      const content = container.querySelector<HTMLElement>(selector);
      expect(content).not.toBeNull();
      expect(
        content?.closest("[data-wemd-source-start]") ??
          content?.querySelector("[data-wemd-source-start]"),
      ).not.toBeNull();
    };
    expectAnchoredContent("img");
    expectAnchoredContent(".block-equation");
    expectAnchoredContent(".mermaid svg");
    expectAnchoredContent("table");
    expectAnchoredContent("pre.custom");

    let editorScrollListener: () => void = () => undefined;
    const editorAdapter: ScrollSyncAdapter = {
      getPosition: () => ({ sourceLine: 18, ratio: 0.65 }),
      scrollToPosition: vi.fn(),
      subscribeScroll: (listener) => {
        editorScrollListener = listener;
        return () => undefined;
      },
    };
    const frames = createFrameQueue();
    const coordinator = createEditorPreviewScrollSync(frames);
    coordinator.setAdapter("editor", editorAdapter);
    coordinator.setAdapter("preview", previewAdapter!);

    editorScrollListener();
    frames.flush();
    frames.flush();
    const initialScrollTop = previewContainer.scrollTop;
    expect(initialScrollTop).toBeGreaterThan(0);

    layoutScale = 2;
    resizeCallback?.([], {} as ResizeObserver);
    frames.flush();

    expect(previewContainer.scrollTop).toBeGreaterThan(initialScrollTop * 1.5);
    coordinator.destroy();
  });
});
