import { beforeEach, describe, expect, it, vi } from "vitest";

const mocked = vi.hoisted(() => ({
  previousConfig: {
    startOnLoad: false,
    flowchart: { htmlLabels: true },
    themeVariables: { fontFamily: "system-ui" },
  },
  initialize: vi.fn(),
  render: vi.fn(),
  getSiteConfig: vi.fn(),
}));

vi.mock("mermaid", () => ({
  default: {
    initialize: mocked.initialize,
    render: mocked.render,
    mermaidAPI: {
      getSiteConfig: mocked.getSiteConfig,
    },
  },
}));

vi.mock("../../store/themeStore", () => ({
  useThemeStore: {
    getState: () => ({
      themeId: "default",
      customThemes: [],
      getAllThemes: () => [],
    }),
  },
}));

vi.mock("../../utils/mermaidConfig", () => ({
  getMermaidConfig: (_designerVariables: unknown, options?: unknown) => ({
    theme: "base",
    flowchart: {
      htmlLabels:
        typeof options === "object" &&
        options !== null &&
        "htmlLabels" in options
          ? (options as { htmlLabels?: boolean }).htmlLabels
          : true,
    },
    themeVariables: {
      fontFamily: "system-ui",
    },
  }),
  getThemedMermaidDiagram: (diagram: string) => diagram,
}));

import { renderMermaidBlocks } from "../../services/wechatMermaidRenderer";

describe("renderMermaidBlocks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocked.getSiteConfig.mockReturnValue(mocked.previousConfig);
    mocked.render.mockRejectedValue(new Error("render failed"));
    document.body.innerHTML = "";
  });

  it("restores Mermaid global config after copy rendering", async () => {
    const container = document.createElement("div");
    container.innerHTML = `<pre class="mermaid">graph TD\nA-->B</pre>`;
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    try {
      await renderMermaidBlocks(container);
    } finally {
      consoleErrorSpy.mockRestore();
    }

    expect(mocked.getSiteConfig).toHaveBeenCalledTimes(1);
    expect(mocked.initialize).toHaveBeenCalledTimes(2);
    expect(mocked.initialize.mock.calls[0][0]).toMatchObject({
      flowchart: { htmlLabels: false },
    });
    expect(mocked.initialize.mock.calls[1][0]).toEqual(mocked.previousConfig);
    expect(mocked.initialize.mock.calls[1][0]).not.toBe(mocked.previousConfig);
    expect(document.body.childElementCount).toBe(0);
  });
});
