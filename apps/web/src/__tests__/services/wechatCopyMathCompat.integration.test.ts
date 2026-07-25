import { beforeEach, describe, expect, it, vi } from "vitest";

const mocked = vi.hoisted(() => ({
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
  loadMathJax: vi.fn(),
  uploadEditorImage: vi.fn(),
  parserRender: vi.fn(),
  processHtml: vi.fn(),
  electronClipboardWrite: vi.fn(),
}));

vi.mock("react-hot-toast", () => ({
  default: {
    success: mocked.toastSuccess,
    error: mocked.toastError,
  },
}));

vi.mock("@wemd/core", () => ({
  createMarkdownParser: () => ({
    render: mocked.parserRender,
  }),
  processHtml: mocked.processHtml,
}));

vi.mock("../../utils/mathJaxLoader", () => ({
  loadMathJax: mocked.loadMathJax,
}));

vi.mock("../../services/image/imageUploadFlow", () => ({
  uploadEditorImage: mocked.uploadEditorImage,
}));

vi.mock("../../utils/katexRenderer", () => ({
  hasMathFormula: () => false,
}));

vi.mock("../../utils/linkFootnote", () => ({
  convertLinksToFootnotes: (html: string) => html,
}));

vi.mock("../../store/publishingPreferences", () => ({
  getPublishingPreference: () => false,
}));

vi.mock("../../services/inlineStyleVarResolver", () => ({
  resolveInlineStyleVariablesForCopy: (html: string) => html,
  applyLightRootVars: vi.fn(),
}));

vi.mock("../../services/wechatCounterCompat", () => ({
  materializeCounterPseudoContent: (html: string) => html,
  stripCounterPseudoRules: (css: string) => css,
}));

vi.mock("../../services/wechatMermaidRenderer", () => ({
  renderMermaidBlocks: vi.fn(async () => undefined),
}));

vi.mock("../../services/wechatTableRenderer", () => ({
  renderTableBlocks: vi.fn(async () => undefined),
}));

import { copyToWechat } from "../../services/wechatCopyService";

const createDeferred = <T>() => {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, reject, resolve };
};

const readFileAsText = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
};

describe("wechat copy math compatibility", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocked.parserRender.mockReturnValue("<p>$\\boldsymbol{x}$</p>");
    mocked.processHtml.mockReturnValue(
      '<section id="wemd"><p><span class="inline-equation" data-latex="\\boldsymbol{x}"><span class="katex"><span class="katex-mathml"><math><semantics><mrow><mi>x</mi></mrow><annotation encoding="application/x-tex">\\boldsymbol{x}</annotation></semantics></math></span><span class="katex-html" aria-hidden="true"><span class="base" style="width:min-content;"><span class="mord boldsymbol">x</span></span></span></span></span></p></section>',
    );
    mocked.uploadEditorImage.mockResolvedValue({
      url: "https://img.example.com/formula.svg",
    });

    Object.defineProperty(window, "electron", {
      configurable: true,
      value: {
        isElectron: true,
        platform: "darwin",
        clipboard: {
          writeHTML: mocked.electronClipboardWrite.mockResolvedValue({
            success: true,
          }),
        },
      },
    });

    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(
      function getContextMock(this: HTMLCanvasElement) {
        return {
          canvas: this,
          fillRect: vi.fn(),
          scale: vi.fn(),
          drawImage: vi.fn(),
        } as unknown as CanvasRenderingContext2D;
      },
    );
    vi.spyOn(HTMLCanvasElement.prototype, "toDataURL").mockReturnValue(
      "data:image/png;base64,math",
    );
    Object.defineProperty(HTMLCanvasElement.prototype, "toBlob", {
      configurable: true,
      value: vi.fn((callback: BlobCallback) => {
        callback(new Blob(["math"], { type: "image/png" }));
      }),
    });

    class MockImage {
      onload: null | (() => void) = null;
      onerror: null | (() => void) = null;

      set src(_value: string) {
        queueMicrotask(() => {
          this.onload?.();
        });
      }
    }

    Object.defineProperty(window, "Image", {
      configurable: true,
      value: MockImage,
    });
    Object.defineProperty(globalThis, "Image", {
      configurable: true,
      value: MockImage,
    });
  });

  it("removes hidden KaTeX source markup before clipboard write", async () => {
    await copyToWechat("$\\boldsymbol{x}$", "#wemd p { margin: 18px 0; }");

    const [payload] = mocked.electronClipboardWrite.mock.calls[0] as [
      { html: string; text: string },
    ];
    expect(payload.html).toContain("katex-html");
    expect(payload.html).not.toContain("katex-mathml");
    expect(payload.html).not.toContain("application/x-tex");
    expect(payload.html).not.toContain("\\boldsymbol");
    expect(payload.html).toContain(String.fromCodePoint(0x1d499));
    expect(payload.html).not.toContain(">x</span>");
    expect(payload.html).toContain("white-space: nowrap");
    expect(payload.html).toContain("width: auto");
    expect(mocked.toastSuccess).toHaveBeenCalled();
    expect(mocked.toastError).not.toHaveBeenCalled();
  });

  it("converts high-risk block formulas to images before clipboard write", async () => {
    mocked.processHtml.mockReturnValue(
      '<section id="wemd"><section class="block-equation" data-latex="\\boldsymbol{\\frac{x}{y}}"><span class="katex"><span class="katex-html"><span class="base"><span class="mord">x</span></span></span></span></section><section class="block-equation" data-latex="\\boldsymbol{\\frac{x}{y}}"><span class="katex"><span class="katex-html"><span class="base"><span class="mord">x</span></span></span></span></section></section>',
    );
    const tex2svg = vi.fn((latex: string) => {
      if (latex.includes("\\require")) {
        throw new Error("不应动态加载 MathJax 扩展");
      }
      if (latex.includes("\\boldsymbol")) {
        const wrapper = document.createElement("div");
        wrapper.innerHTML =
          "<mjx-container><mjx-merror><mtext>\\boldsymbol</mtext></mjx-merror></mjx-container>";
        return wrapper;
      }

      const wrapper = document.createElement("div");
      wrapper.innerHTML =
        '<svg width="10ex" height="3ex" viewBox="0 0 1000 300"><path d="M0 0h10v10H0z"></path></svg>';
      return wrapper;
    });
    mocked.loadMathJax.mockImplementation(async () => {
      Object.defineProperty(window, "MathJax", {
        configurable: true,
        value: {
          texReset: vi.fn(),
          tex2svg,
        },
      });
    });

    await copyToWechat(
      "$$\\boldsymbol{\\frac{x}{y}}$$",
      "#wemd p { margin: 18px 0; }",
    );

    const [payload] = mocked.electronClipboardWrite.mock.calls[0] as [
      { html: string; text: string },
    ];
    expect(mocked.loadMathJax).toHaveBeenCalledTimes(1);
    expect(mocked.uploadEditorImage).toHaveBeenCalledTimes(1);
    const [uploadedFile] = mocked.uploadEditorImage.mock.calls[0] as [File];
    expect(uploadedFile.name).toMatch(/\.svg$/);
    expect(uploadedFile.type).toBe("image/svg+xml");
    const svgText = await readFileAsText(uploadedFile);
    expect(svgText).toContain("wemd-formula-bg");
    expect(svgText).toContain('fill="#ffffff"');
    expect(svgText).not.toContain("paint-order: stroke fill");
    expect(svgText).not.toContain("prefers-color-scheme");
    expect(tex2svg).toHaveBeenNthCalledWith(1, "\\boldsymbol{\\frac{x}{y}}", {
      display: true,
    });
    expect(tex2svg).toHaveBeenNthCalledWith(2, "\\mathbf{\\frac{x}{y}}", {
      display: true,
    });
    expect(payload.html).toContain("<img");
    expect(payload.html).toContain("https://img.example.com/formula.svg");
    expect(payload.html).toContain('width="80"');
    expect(payload.html).toContain('height="24"');
    expect(payload.html).toContain("width: 80px");
    expect(payload.html).toContain("height: 24px");
    expect(payload.html).not.toContain("data:image/png;base64");
    expect(payload.html).not.toContain("katex-html");
    expect(payload.html).not.toContain("\\frac");
    expect(mocked.toastSuccess).toHaveBeenCalledWith(
      "已复制，部分复杂公式已自动保真处理",
      expect.any(Object),
    );
  });

  it("uploads different formula images in parallel", async () => {
    mocked.processHtml.mockReturnValue(
      '<section id="wemd"><section class="block-equation" data-latex="\\frac{x}{y}"><span class="katex"><span class="katex-html"><span class="base"><span class="mord">x</span></span></span></span></section><section class="block-equation" data-latex="\\sqrt{a+b}"><span class="katex"><span class="katex-html"><span class="base"><span class="mord">a</span></span></span></span></section></section>',
    );
    const tex2svg = vi.fn(() => {
      const wrapper = document.createElement("div");
      wrapper.innerHTML =
        '<svg width="10ex" height="3ex" viewBox="0 0 1000 300"><path d="M0 0h10v10H0z"></path></svg>';
      return wrapper;
    });
    mocked.loadMathJax.mockImplementation(async () => {
      Object.defineProperty(window, "MathJax", {
        configurable: true,
        value: {
          texReset: vi.fn(),
          tex2svg,
        },
      });
    });

    const firstUpload = createDeferred<{ url: string }>();
    const secondUpload = createDeferred<{ url: string }>();
    mocked.uploadEditorImage
      .mockReturnValueOnce(firstUpload.promise)
      .mockReturnValueOnce(secondUpload.promise);

    const copyPromise = copyToWechat(
      "$$\\frac{x}{y}$$\n\n$$\\sqrt{a+b}$$",
      "#wemd p { margin: 18px 0; }",
    );

    await new Promise((resolve) => setTimeout(resolve, 0));
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(mocked.uploadEditorImage).toHaveBeenCalledTimes(2);

    firstUpload.resolve({ url: "https://img.example.com/formula-1.svg" });
    secondUpload.resolve({ url: "https://img.example.com/formula-2.svg" });

    await copyPromise;

    const [payload] = mocked.electronClipboardWrite.mock.calls[0] as [
      { html: string; text: string },
    ];
    expect(payload.html).toContain("https://img.example.com/formula-1.svg");
    expect(payload.html).toContain("https://img.example.com/formula-2.svg");
  });

  it("falls back to PNG when uploaded SVG image fails", async () => {
    mocked.processHtml.mockReturnValue(
      '<section id="wemd"><section class="block-equation" data-latex="\\frac{12\\sqrt{7}}{\\sqrt{3}}"><span class="katex"><span class="katex-html"><span class="base"><span class="mord">x</span></span></span></span></section></section>',
    );
    mocked.uploadEditorImage
      .mockRejectedValueOnce(new Error("SVG 上传失败"))
      .mockResolvedValueOnce({
        url: "https://img.example.com/formula.png",
      });
    mocked.loadMathJax.mockImplementation(async () => {
      Object.defineProperty(window, "MathJax", {
        configurable: true,
        value: {
          texReset: vi.fn(),
          tex2svg: vi.fn(() => {
            const wrapper = document.createElement("div");
            wrapper.innerHTML =
              '<svg width="10ex" height="3ex" viewBox="0 0 1000 300"><path d="M0 0h10v10H0z"></path></svg>';
            return wrapper;
          }),
        },
      });
    });

    await copyToWechat(
      "$$\\frac{12\\sqrt{7}}{\\sqrt{3}}$$",
      "#wemd p { margin: 18px 0; }",
    );

    const [payload] = mocked.electronClipboardWrite.mock.calls[0] as [
      { html: string; text: string },
    ];
    const firstUpload = mocked.uploadEditorImage.mock.calls[0] as [File];
    const secondUpload = mocked.uploadEditorImage.mock.calls[1] as [File];
    expect(firstUpload[0].name).toMatch(/\.svg$/);
    expect(firstUpload[0].type).toBe("image/svg+xml");
    expect(secondUpload[0].name).toMatch(/\.png$/);
    expect(secondUpload[0].type).toBe("image/png");
    const getContextMock = HTMLCanvasElement.prototype
      .getContext as unknown as {
      mock: { results: Array<{ value: CanvasRenderingContext2D }> };
    };
    const context = getContextMock.mock.results[0]?.value;
    const canvas = context.canvas;
    expect(canvas.width).toBe(80);
    expect(canvas.height).toBe(24);
    expect(context.fillStyle).toBe("#ffffff");
    expect(context.fillRect).toHaveBeenCalledWith(0, 0, 80, 24);
    expect(payload.html).toContain("https://img.example.com/formula.png");
    expect(payload.html).not.toContain("katex-html");
    expect(mocked.toastSuccess).toHaveBeenCalledWith(
      "已复制，部分复杂公式已自动保真处理",
      expect.any(Object),
    );
  });

  it("continues copy when MathJax image fallback hangs", async () => {
    vi.useFakeTimers();
    mocked.processHtml.mockReturnValue(
      '<section id="wemd"><section class="block-equation" data-latex="\\boldsymbol{x_1} + \\boldsymbol{A+B}"><span class="katex"><span class="katex-html"><span class="base"><span class="mord katex-error">\\boldsymbol</span><span class="mord">x</span></span></span></span></section><section class="block-equation" data-latex="\\boldsymbol{\\alpha}+\\boldsymbol{\\beta}"><span class="katex"><span class="katex-html"><span class="base"><span class="mord katex-error">\\boldsymbol</span></span></span></span></section></section>',
    );
    mocked.loadMathJax.mockReturnValue(new Promise(() => undefined));

    const copyPromise = copyToWechat(
      "$$\\boldsymbol{x_1} + \\boldsymbol{A+B}$$",
      "#wemd p { margin: 18px 0; }",
    );

    await vi.advanceTimersByTimeAsync(4000);
    await copyPromise;
    vi.useRealTimers();

    const [payload] = mocked.electronClipboardWrite.mock.calls[0] as [
      { html: string; text: string },
    ];
    expect(mocked.loadMathJax).toHaveBeenCalledTimes(1);
    expect(payload.html).toContain("katex-html");
    expect(payload.html).not.toContain("data-latex");
    expect(payload.html).not.toContain("\\boldsymbol");
    expect(payload.html).not.toContain("katex-error");
    expect(payload.html).toContain("mathbf");
    expect(mocked.toastSuccess).toHaveBeenCalledWith(
      "已复制，可以直接粘贴至微信公众号",
      expect.any(Object),
    );
    expect(mocked.toastError).not.toHaveBeenCalled();
  });

  it("falls back to KaTeX HTML when formula image upload fails", async () => {
    mocked.processHtml.mockReturnValue(
      '<section id="wemd"><section class="block-equation" data-latex="\\boldsymbol{\\frac{x}{y}}"><span class="katex"><span class="katex-html"><span class="base"><span class="mord katex-error">\\boldsymbol</span></span></span></span></section></section>',
    );
    mocked.uploadEditorImage.mockRejectedValue(new Error("图床上传失败"));
    mocked.loadMathJax.mockImplementation(async () => {
      Object.defineProperty(window, "MathJax", {
        configurable: true,
        value: {
          texReset: vi.fn(),
          tex2svg: vi.fn(() => {
            const wrapper = document.createElement("div");
            wrapper.innerHTML =
              '<svg width="10ex" height="3ex" viewBox="0 0 1000 300"><path d="M0 0h10v10H0z"></path></svg>';
            return wrapper;
          }),
        },
      });
    });

    await copyToWechat(
      "$$\\boldsymbol{\\frac{x}{y}}$$",
      "#wemd p { margin: 18px 0; }",
    );

    const [payload] = mocked.electronClipboardWrite.mock.calls[0] as [
      { html: string; text: string },
    ];
    expect(mocked.uploadEditorImage).toHaveBeenCalledTimes(2);
    expect(payload.html).toContain("katex-html");
    expect(payload.html).not.toContain("data:image/png");
    expect(payload.html).not.toContain("https://img.example.com/formula.svg");
    expect(payload.html).not.toContain("\\boldsymbol");
    expect(payload.html).not.toContain("katex-error");
    expect(mocked.toastSuccess).toHaveBeenCalledWith(
      "已复制，可以直接粘贴至微信公众号",
      expect.any(Object),
    );
    expect(mocked.toastError).not.toHaveBeenCalled();
  });

  it("falls back to KaTeX HTML when uploaded formula image is not readable", async () => {
    mocked.processHtml.mockReturnValue(
      '<section id="wemd"><section class="block-equation" data-latex="\\frac{12\\sqrt{7}}{\\sqrt{3}}"><span class="katex"><span class="katex-html"><span class="base"><span class="mord">x</span></span></span></span></section></section>',
    );
    mocked.loadMathJax.mockImplementation(async () => {
      Object.defineProperty(window, "MathJax", {
        configurable: true,
        value: {
          texReset: vi.fn(),
          tex2svg: vi.fn(() => {
            const wrapper = document.createElement("div");
            wrapper.innerHTML =
              '<svg width="10ex" height="3ex" viewBox="0 0 1000 300"><path d="M0 0h10v10H0z"></path></svg>';
            return wrapper;
          }),
        },
      });
    });

    class UploadFailImage {
      onload: null | (() => void) = null;
      onerror: null | (() => void) = null;

      set src(value: string) {
        queueMicrotask(() => {
          if (value.startsWith("https://img.example.com/")) {
            this.onerror?.();
            return;
          }
          this.onload?.();
        });
      }
    }

    Object.defineProperty(window, "Image", {
      configurable: true,
      value: UploadFailImage,
    });
    Object.defineProperty(globalThis, "Image", {
      configurable: true,
      value: UploadFailImage,
    });

    await copyToWechat(
      "$$\\frac{12\\sqrt{7}}{\\sqrt{3}}$$",
      "#wemd p { margin: 18px 0; }",
    );

    const [payload] = mocked.electronClipboardWrite.mock.calls[0] as [
      { html: string; text: string },
    ];
    expect(mocked.uploadEditorImage).toHaveBeenCalledTimes(2);
    expect(payload.html).toContain("katex-html");
    expect(payload.html).not.toContain("https://img.example.com/formula.svg");
    expect(payload.html).not.toContain("data:image/png");
    expect(mocked.toastSuccess).toHaveBeenCalledWith(
      "已复制，可以直接粘贴至微信公众号",
      expect.any(Object),
    );
    expect(mocked.toastError).not.toHaveBeenCalled();
  });
});
