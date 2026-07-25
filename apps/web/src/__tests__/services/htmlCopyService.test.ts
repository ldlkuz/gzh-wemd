import { beforeEach, describe, expect, it, vi } from "vitest";

const mocked = vi.hoisted(() => ({
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
  electronClipboardWriteText: vi.fn(),
  buildWechatPublishHtml: vi.fn(),
  cleanup: vi.fn(),
}));

vi.mock("react-hot-toast", () => ({
  default: {
    success: mocked.toastSuccess,
    error: mocked.toastError,
  },
}));

vi.mock("../../services/wechatPublishHtml", () => ({
  buildWechatPublishHtml: mocked.buildWechatPublishHtml,
}));

import {
  copyAsHtml,
  sanitizeForExternalHtml,
} from "../../services/htmlCopyService";

function stubClipboard(writeText: ReturnType<typeof vi.fn>) {
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText },
    configurable: true,
  });
}

describe("copyAsHtml", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocked.buildWechatPublishHtml.mockResolvedValue({
      html: "<section id=\"wemd\"><h1>Hello</h1></section>",
      cleanup: mocked.cleanup,
    });
    Object.defineProperty(window, "electron", {
      value: undefined,
      configurable: true,
    });
    document.execCommand = vi.fn(() => true);
  });

  it("renders markdown and writes HTML source to clipboard as plain text", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    stubClipboard(writeText);

    await copyAsHtml("# Hello");

    expect(mocked.buildWechatPublishHtml).toHaveBeenCalledWith("# Hello", "", {});
    expect(writeText).toHaveBeenCalledWith(
      "<section id=\"wemd\"><h1>Hello</h1></section>",
    );
    expect(mocked.toastSuccess).toHaveBeenCalledWith("已复制 HTML");
    expect(mocked.toastError).not.toHaveBeenCalled();
    expect(mocked.cleanup).toHaveBeenCalledTimes(1);
  });

  it("prefers electron clipboard bridge in electron runtime", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    stubClipboard(writeText);
    Object.defineProperty(window, "electron", {
      configurable: true,
      value: {
        isElectron: true,
        clipboard: {
          writeText: mocked.electronClipboardWriteText.mockResolvedValue({
            success: true,
          }),
        },
      },
    });

    await copyAsHtml("# Hello");

    expect(mocked.electronClipboardWriteText).toHaveBeenCalledWith(
      "<section id=\"wemd\"><h1>Hello</h1></section>",
    );
    expect(writeText).not.toHaveBeenCalled();
    expect(document.execCommand).not.toHaveBeenCalled();
    expect(mocked.cleanup).toHaveBeenCalledTimes(1);
  });

  it("normalizes extra whitespace before writing to clipboard", async () => {
    mocked.buildWechatPublishHtml.mockResolvedValueOnce({
      html: "<section>\n  <h1>标题</h1>\n  <p>内容</p>\n</section>",
      cleanup: mocked.cleanup,
    });
    const writeText = vi.fn().mockResolvedValue(undefined);
    stubClipboard(writeText);

    await copyAsHtml("# 标题");

    expect(writeText).toHaveBeenCalledWith("<section><h1>标题</h1><p>内容</p></section>");
  });

  it("prepends encoded WeMD publish metadata for plugin consumption", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    stubClipboard(writeText);

    await copyAsHtml("# 标题", "", {
      meta: {
        title: "公众号标题",
        author: "Alice",
        useTitle: true,
        useAuthor: true,
      },
    });

    const copied = writeText.mock.calls[0][0] as string;
    expect(copied).toContain("<!--wemd-meta:");
    expect(copied).toContain('data-wemd-publish-meta="');
    expect(copied).toContain("<section id=\"wemd\"><h1>Hello</h1></section>");
    expect(decodeURIComponent(copied)).toContain('"title":"公众号标题"');
    expect(decodeURIComponent(copied)).toContain('"author":"Alice"');
    expect(decodeURIComponent(copied)).toContain('"useTitle":true');
    expect(decodeURIComponent(copied)).toContain('"useAuthor":true');
  });

  it("preserves disabled title or author flags even when values are empty", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    stubClipboard(writeText);

    await copyAsHtml("# 标题", "", {
      meta: { useTitle: false, useAuthor: false },
    });

    const copied = writeText.mock.calls[0][0] as string;
    expect(decodeURIComponent(copied)).toContain('"useTitle":false');
    expect(decodeURIComponent(copied)).toContain('"useAuthor":false');
  });

  it("falls back to navigator.clipboard when electron bridge fails", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    stubClipboard(writeText);
    Object.defineProperty(window, "electron", {
      configurable: true,
      value: {
        isElectron: true,
        clipboard: {
          writeText: mocked.electronClipboardWriteText.mockResolvedValue({
            success: false,
            error: "bridge failed",
          }),
        },
      },
    });

    await copyAsHtml("# Hello");

    expect(mocked.electronClipboardWriteText).toHaveBeenCalledTimes(1);
    expect(writeText).toHaveBeenCalledWith(
      "<section id=\"wemd\"><h1>Hello</h1></section>",
    );
    expect(document.execCommand).not.toHaveBeenCalled();
    expect(mocked.toastSuccess).toHaveBeenCalledWith("已复制 HTML");
    expect(mocked.cleanup).toHaveBeenCalledTimes(1);
  });

  it("falls back to execCommand when Clipboard API write fails", async () => {
    const writeText = vi.fn().mockRejectedValue(new Error("denied"));
    stubClipboard(writeText);
    const execSpy = vi.spyOn(document, "execCommand").mockReturnValue(true);

    await copyAsHtml("# Hello");

    expect(writeText).toHaveBeenCalledWith(
      "<section id=\"wemd\"><h1>Hello</h1></section>",
    );
    expect(execSpy).toHaveBeenCalledWith("copy");
    expect(mocked.toastSuccess).toHaveBeenCalledWith("已复制 HTML");
    expect(mocked.toastError).not.toHaveBeenCalled();
    expect(mocked.cleanup).toHaveBeenCalledTimes(1);
  });

  it("toasts an error without throwing when all copy paths fail", async () => {
    const writeText = vi.fn().mockRejectedValue(new Error("denied"));
    stubClipboard(writeText);
    vi.spyOn(document, "execCommand").mockReturnValue(false);

    await expect(copyAsHtml("# Hello")).resolves.toBeUndefined();

    expect(mocked.toastError).toHaveBeenCalledWith("复制 HTML 失败");
    expect(mocked.toastSuccess).not.toHaveBeenCalled();
    expect(mocked.cleanup).toHaveBeenCalledTimes(1);
  });
});

describe("sanitizeForExternalHtml", () => {
  it("unwraps prefix/content/suffix spans inside headings (h1-h6)", () => {
    const input = [1, 2, 3, 4, 5, 6]
      .map(
        (n) =>
          `<h${n}><span class="prefix"></span><span class="content">T${n}</span><span class="suffix"></span></h${n}>`,
      )
      .join("");
    const out = sanitizeForExternalHtml(input);
    expect(out).toBe(
      "<h1>T1</h1><h2>T2</h2><h3>T3</h3><h4>T4</h4><h5>T5</h5><h6>T6</h6>",
    );
  });

  it("leaves headings alone when they don't match the decoration pattern", () => {
    const input = "<h2>普通标题</h2>";
    expect(sanitizeForExternalHtml(input)).toBe(input);
  });

  it("unwraps a <li><section>X</section></li> pattern", () => {
    const input =
      "<ol><li><section>一</section></li><li><section>二</section></li></ol>";
    expect(sanitizeForExternalHtml(input)).toBe(
      "<ol><li>一</li><li>二</li></ol>",
    );
  });

  it("does not unwrap <li> when section is not the sole child", () => {
    const input = "<ul><li><section>A</section><span>B</span></li></ul>";
    expect(sanitizeForExternalHtml(input)).toBe(input);
  });

  it("removes empty <center> elements and keeps non-empty ones", () => {
    const input = "<center></center><p>x</p><center>keep</center>";
    expect(sanitizeForExternalHtml(input)).toBe(
      "<p>x</p><center>keep</center>",
    );
  });

  it("preserves non-decorated structures (p, strong, figure, img, hr)", () => {
    const input =
      '<p>段落<strong>加粗</strong></p><hr><figure><img src="x.png"></figure>';
    expect(sanitizeForExternalHtml(input)).toBe(input);
  });
});
