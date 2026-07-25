import { describe, expect, it } from "vitest";
import { basicTheme, createMarkdownParser, processHtml } from "@wemd/core";
import { materializeCodeLineBreaksForWechat } from "../../services/wechatCodeBlockCompat";
import { normalizeCopyContainer } from "../../services/wechatCopyNormalizer";

describe("wechatCodeBlockCompat", () => {
  it("复制 Issue #90 的多行代码时使用结构化换行", () => {
    const markdown = [
      "```c",
      "你的程序",
      "   ↓",
      "# fork()",
      "   ↓",
      '/bin/sh -c "command"',
      "   ↓",
      "执行 shell 命令",
      "   ↓",
      "返回 exit code",
      "```",
    ].join("\n");
    const rawHtml = createMarkdownParser({ mathRenderer: "katex" }).render(
      markdown,
    );
    const container = document.createElement("div");
    container.innerHTML = processHtml(rawHtml, basicTheme, true, true);

    normalizeCopyContainer(container);

    const code = container.querySelector("pre > code") as HTMLElement;
    expect(code.querySelectorAll("br")).toHaveLength(9);
    expect(code.innerHTML).not.toContain("\n");
    expect(code.querySelectorAll("span").length).toBeGreaterThan(0);
  });

  it("保留高亮结构、缩进与连续空行", () => {
    const container = document.createElement("div");
    container.innerHTML = `<section id="wemd"><pre><code class="hljs">你的程序
&nbsp;&nbsp;&nbsp;↓
<span class="hljs-meta"># fork()</span>

返回 exit code</code></pre></section>`;

    materializeCodeLineBreaksForWechat(container);

    const code = container.querySelector("pre > code") as HTMLElement;
    expect(code.querySelectorAll("br")).toHaveLength(4);
    expect(code.innerHTML).not.toContain("\n");
    expect(code.querySelector(".hljs-meta")?.textContent).toBe("# fork()");
    expect(code.innerHTML).toContain("&nbsp;&nbsp;&nbsp;↓");
  });

  it("递归处理高亮 span 内的换行且可重复执行", () => {
    const container = document.createElement("div");
    container.innerHTML =
      '<pre><code class="hljs"><span class="hljs-comment">第一行\n第二行</span></code></pre>';

    materializeCodeLineBreaksForWechat(container);
    materializeCodeLineBreaksForWechat(container);

    const comment = container.querySelector(".hljs-comment") as HTMLElement;
    expect(comment.innerHTML).toBe("第一行<br>第二行");
  });

  it("不修改行内代码", () => {
    const container = document.createElement("div");
    container.innerHTML = "<p><code>foo\nbar</code></p>";

    materializeCodeLineBreaksForWechat(container);

    expect(container.querySelector("br")).toBeNull();
    expect(container.querySelector("code")?.textContent).toBe("foo\nbar");
  });
});
