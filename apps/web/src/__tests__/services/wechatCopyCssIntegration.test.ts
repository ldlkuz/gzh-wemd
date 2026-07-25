import { describe, expect, it, vi } from "vitest";
import {
  clearGuideTheme,
  dataBlueprintTheme,
  easternNotesTheme,
  modernEditorialTheme,
  createMarkdownParser,
  processHtml,
  whitespaceGalleryTheme,
} from "@wemd/core";
import {
  applyLightRootVars,
  resolveInlineStyleVariablesForCopy,
} from "../../services/inlineStyleVarResolver";
import { normalizeCopyContainer } from "../../services/wechatCopyService";
import {
  materializeCounterPseudoContent,
  stripCounterPseudoRules,
} from "../../services/wechatCounterCompat";
import { defaultVariables } from "../../components/Theme/ThemeDesigner/defaults";
import { generateCSS } from "../../components/Theme/ThemeDesigner/generateCSS";

describe("wechat copy css integration", () => {
  it("将四款场景化主题的关键样式内联到复制内容", () => {
    const themes = [
      dataBlueprintTheme,
      easternNotesTheme,
      clearGuideTheme,
      whitespaceGalleryTheme,
    ];
    const html = `
      <h1><span class="content">文章标题</span></h1>
      <p>正文内容</p>
      <div class="callout"><div class="callout-title">提示</div><p>提示内容</p></div>
      <table><thead><tr><th>指标</th></tr></thead><tbody><tr><td>42</td></tr></tbody></table>
    `;

    for (const theme of themes) {
      const output = processHtml(html, theme, true, true);
      const container = document.createElement("div");
      container.innerHTML = output;

      expect(container.querySelector("h1")?.getAttribute("style")).toContain(
        "border",
      );
      expect(container.querySelector("p")?.style.color).toBeTruthy();
      expect(
        container.querySelector(".callout")?.getAttribute("style"),
      ).toContain("border");
      expect(container.querySelector("th")?.style.fontWeight).toBeTruthy();
      expect(output).not.toContain("var(");
    }
  });

  it("场景化主题复制嵌套引用时不会逐级挤压行宽", () => {
    const themes = [
      [dataBlueprintTheme, "12px"],
      [easternNotesTheme, "0px"],
      [clearGuideTheme, "0px"],
      [whitespaceGalleryTheme, "0px"],
    ] as const;
    const html = `
      <blockquote class="multiquote-1">
        <p>一级引用</p>
        <blockquote class="multiquote-1">
          <p>二级引用</p>
          <blockquote class="multiquote-1"><p>三级引用</p></blockquote>
        </blockquote>
      </blockquote>
    `;

    for (const [theme, expectedPaddingLeft] of themes) {
      const container = document.createElement("div");
      container.innerHTML = processHtml(html, theme, true, true);
      const nestedQuotes = container.querySelectorAll(
        ".multiquote-1 .multiquote-1",
      );

      expect(nestedQuotes).toHaveLength(2);
      for (const quote of nestedQuotes) {
        const style = (quote as HTMLElement).style;
        expect(style.marginLeft).toBe("0px");
        expect(style.paddingLeft).toBe(expectedPaddingLeft);
      }
    }
  });

  it("将编辑部手记章节编号转换为可复制的真实节点", () => {
    const originalGetComputedStyle = window.getComputedStyle.bind(window);
    const getComputedStyleSpy = vi
      .spyOn(window, "getComputedStyle")
      .mockImplementation((element: Element, pseudo?: string | null) => {
        const htmlElement = element as HTMLElement;
        const tagName = htmlElement.tagName.toLowerCase();

        if (!pseudo && tagName === "section" && htmlElement.id === "wemd") {
          return {
            content: "normal",
            getPropertyValue: (property: string) =>
              property === "counter-reset" ? "editorial-section 0" : "none",
          } as unknown as CSSStyleDeclaration;
        }

        if (pseudo === "::before" && tagName === "h2") {
          return {
            content: "counter(editorial-section, decimal-leading-zero)",
            getPropertyValue: (property: string) =>
              ({
                color: "rgb(199, 98, 55)",
                "font-family": "Consolas, monospace",
                "font-size": "32px",
                "font-weight": "800",
                "line-height": "32px",
                display: "inline-block",
                "counter-increment": "editorial-section 1",
                "counter-reset": "none",
              })[property] ?? "",
          } as unknown as CSSStyleDeclaration;
        }

        if (pseudo) {
          return {
            content: "none",
            getPropertyValue: () => "",
          } as unknown as CSSStyleDeclaration;
        }

        return originalGetComputedStyle(element);
      });

    try {
      const html = `
        <h2><span class="content">第一节</span></h2>
        <p>正文。</p>
        <h2><span class="content">第二节</span></h2>
      `;
      const materializedHtml = materializeCounterPseudoContent(
        html,
        modernEditorialTheme,
      );
      const output = resolveInlineStyleVariablesForCopy(
        processHtml(
          materializedHtml,
          stripCounterPseudoRules(modernEditorialTheme),
          true,
          true,
        ),
      );
      const container = document.createElement("div");
      container.innerHTML = output;
      normalizeCopyContainer(container);

      const counters = Array.from(
        container.querySelectorAll("h2 > span"),
      ).filter((span) => /^\d{2}$/.test(span.textContent?.trim() ?? ""));
      expect(counters).toHaveLength(2);
      expect(counters[0].textContent).toBe("01");
      expect(counters[1].textContent).toBe("02");
      expect((counters[0] as HTMLElement).style.fontSize).toBe("32px");
      expect(output).not.toContain("counter(editorial-section");
    } finally {
      getComputedStyleSpy.mockRestore();
    }
  });

  it("resolves inline var() values with scope-aware computed values", () => {
    const html = "<p>段落</p>";
    const css = `
      #wemd {
        --wemd-font-size: 14px;
        --wemd-text-color: #123456;
        --wemd-paragraph-margin: 18px;
      }
      #wemd p {
        font-size: var(--wemd-font-size);
        color: var(--wemd-text-color);
        margin: var(--wemd-paragraph-margin) 0;
      }
    `;

    const output = resolveInlineStyleVariablesForCopy(
      processHtml(html, css, true, true),
    );

    const container = document.createElement("div");
    container.innerHTML = output;
    const paragraph = container.querySelector("p");

    expect(paragraph).toBeTruthy();
    expect(paragraph!.style.fontSize).toBe("14px");
    expect(paragraph!.style.color).toBe("rgb(18, 52, 86)");
    expect(paragraph!.style.marginTop).toBe("18px");
    expect(paragraph!.style.marginBottom).toBe("18px");
    expect(output).toContain("margin-top: 18px;");
    expect(output).toContain("margin-bottom: 18px;");
    expect(output).not.toContain("var(--wemd-font-size)");
    expect(output).not.toContain("var(--wemd-text-color)");
    expect(output).not.toContain("var(--wemd-paragraph-margin)");
  });

  it("keeps literal var() text inside quoted string values", () => {
    const html = "<p>段落</p>";
    const css = `
      #wemd p {
        font-family: "var(--fake-family)";
        color: var(--wemd-text-color, #222222);
      }
    `;

    const output = resolveInlineStyleVariablesForCopy(
      processHtml(html, css, true, true),
    );
    const container = document.createElement("div");
    container.innerHTML = output;
    const paragraph = container.querySelector("p");

    expect(paragraph).toBeTruthy();
    expect(paragraph!.style.fontFamily).toContain("var(--fake-family)");
    expect(paragraph!.style.color).toBe("rgb(34, 34, 34)");
  });

  it("resolves same custom property name based on local scope", () => {
    const html = `<p>root</p><blockquote><p>quote</p></blockquote>`;
    const css = `
      #wemd {
        --text-color: #111111;
      }
      #wemd p {
        color: var(--text-color);
      }
      #wemd blockquote {
        --text-color: #222222;
      }
    `;

    const output = resolveInlineStyleVariablesForCopy(
      processHtml(html, css, true, true),
    );
    const container = document.createElement("div");
    container.innerHTML = output;
    const paragraphs = container.querySelectorAll("p");

    expect(paragraphs).toHaveLength(2);
    expect(paragraphs[0].style.color).toBe("rgb(17, 17, 17)");
    expect(paragraphs[1].style.color).toBe("rgb(34, 34, 34)");
    expect(output).not.toContain("var(--text-color)");
  });

  it("falls back when circular custom properties cannot be resolved", () => {
    const html = "<p>段落</p>";
    const css = `
      #wemd {
        --a: var(--b);
        --b: var(--a);
      }
      #wemd p {
        color: var(--a, #334455);
        background-color: var(--missing-bg, #fafafa);
      }
    `;

    const output = resolveInlineStyleVariablesForCopy(
      processHtml(html, css, true, true),
    );
    const container = document.createElement("div");
    container.innerHTML = output;
    const paragraph = container.querySelector("p");

    expect(paragraph).toBeTruthy();
    expect(paragraph!.style.color).toBe("rgb(51, 68, 85)");
    expect(paragraph!.style.backgroundColor).toBe("rgb(250, 250, 250)");
    expect(output).not.toContain("var(--a");
    expect(output).not.toContain("var(--b");
    expect(output).not.toMatch(/--(?:a|b)\s*:/);
  });

  it("does not read runtime global css variables outside copy content", () => {
    document.documentElement.style.setProperty(
      "--external-text-color",
      "#d4d4d4",
    );
    try {
      const html = "<p>段落</p>";
      const css = `
        #wemd p {
          color: var(--external-text-color, #111111);
        }
      `;

      const output = resolveInlineStyleVariablesForCopy(
        processHtml(html, css, true, true),
      );
      const container = document.createElement("div");
      container.innerHTML = output;
      const paragraph = container.querySelector("p");

      expect(paragraph).toBeTruthy();
      expect(paragraph!.style.color).toBe("rgb(17, 17, 17)");
      expect(paragraph!.style.color).not.toBe("rgb(212, 212, 212)");
    } finally {
      document.documentElement.style.removeProperty("--external-text-color");
    }
  });

  it("injects light ui token baseline into copy host", () => {
    const host = document.createElement("div");
    applyLightRootVars(host);

    expect(host.style.getPropertyValue("--text-primary").trim()).toBe(
      "#0f172a",
    );
    expect(host.style.getPropertyValue("--border-light").trim()).toBe(
      "#e2e8f0",
    );
    expect(host.style.getPropertyValue("--bg-primary").trim()).toBe("#ffffff");
  });

  it("materializes visual theme styles without remaining css variables", () => {
    const html = `
      <h2><span class="content">标题</span></h2>
      <p>正文段落</p>
      <blockquote><p>引用内容</p></blockquote>
      <ul><li>列表项</li></ul>
    `;
    const css = generateCSS(defaultVariables);

    const output = resolveInlineStyleVariablesForCopy(
      processHtml(html, css, true, true),
    );
    const container = document.createElement("div");
    container.innerHTML = output;
    const paragraph = container.querySelector("p");
    const heading = container.querySelector("h2 .content");

    expect(paragraph).toBeTruthy();
    expect(heading).toBeTruthy();
    expect(paragraph!.style.fontSize).toBeTruthy();
    expect(paragraph!.style.lineHeight).toBeTruthy();
    expect(heading!.getAttribute("style")).toContain("font-size");
    expect(output).not.toContain("var(--wemd-");
    expect(output).not.toMatch(/--wemd-[\w-]+\s*:/);
  });

  it("relocates horizontal page padding in full pipeline", () => {
    const html = "<p>段落</p><h2><span class='content'>标题</span></h2>";
    const css = generateCSS({
      ...defaultVariables,
      pagePadding: 48,
    });

    const resolved = resolveInlineStyleVariablesForCopy(
      processHtml(html, css, true, true),
    );
    const container = document.createElement("div");
    container.innerHTML = resolved;

    normalizeCopyContainer(container);

    const paragraph = container.querySelector("p") as HTMLElement | null;
    const heading = container.querySelector("h2") as HTMLElement | null;
    expect(paragraph).toBeTruthy();
    expect(heading).toBeTruthy();
    expect(paragraph!.style.paddingLeft).toBe("48px");
    expect(paragraph!.style.paddingRight).toBe("48px");
    expect(heading!.style.marginLeft).toBe("48px");
    expect(heading!.style.marginRight).toBe("48px");
    expect(heading!.style.paddingLeft).not.toBe("48px");
    expect(heading!.style.paddingRight).not.toBe("48px");
  });

  it("relocates horizontal page padding to hr in full pipeline", () => {
    const html = "<p>段落</p><hr />";
    const css = generateCSS({
      ...defaultVariables,
      pagePadding: 48,
    });

    const resolved = resolveInlineStyleVariablesForCopy(
      processHtml(html, css, true, true),
    );
    const container = document.createElement("div");
    container.innerHTML = resolved;

    normalizeCopyContainer(container);

    const hr = container.querySelector("hr") as HTMLElement | null;
    expect(hr).toBeTruthy();
    expect(hr!.style.marginLeft).toBe("48px");
    expect(hr!.style.marginRight).toBe("48px");
    expect(hr!.style.paddingLeft).not.toBe("48px");
    expect(hr!.style.paddingRight).not.toBe("48px");
  });

  it("propagates #wemd background-color to child blocks after normalization (#52)", () => {
    const html = "<p>段落</p><blockquote><p>引用</p></blockquote>";
    const css = `
      #wemd {
        background-color: #f5f3ef;
      }
      #wemd p {
        color: #333;
      }
    `;

    const resolved = resolveInlineStyleVariablesForCopy(
      processHtml(html, css, true, true),
    );
    const container = document.createElement("div");
    container.innerHTML = resolved;

    // juice 正确内联到根元素
    const root = container.firstElementChild as HTMLElement;
    expect(root.style.backgroundColor).toBe("rgb(245, 243, 239)");

    // normalizeCopyContainer 将背景色下沉到子块
    normalizeCopyContainer(container);

    const paragraph = container.querySelector("p") as HTMLElement;
    expect(paragraph.style.backgroundColor).toBe("rgb(245, 243, 239)");

    // 根元素背景已清除（微信会清洗最外层样式）
    const newRoot = container.firstElementChild as HTMLElement;
    expect(newRoot.style.backgroundColor).toBeFalsy();
  });

  it("materializes inherited text color to avoid ui theme leakage", () => {
    const container = document.createElement("div");
    container.innerHTML = `
      <section id="wemd" style="color: var(--text-primary);">
        <div class="callout">
          <p class="callout-title">需要注意的问题</p>
        </div>
      </section>
    `;

    normalizeCopyContainer(container);

    const calloutTitle = container.querySelector(
      ".callout-title",
    ) as HTMLElement;
    expect(calloutTitle).toBeTruthy();
    expect(calloutTitle.style.color).toBe("rgb(26, 26, 26)");
  });

  it("复制链路保留无需加载的 Mac Bar 圆点", () => {
    const html = createMarkdownParser({ showMacBar: true }).render(
      "```ts\n  const a = 1;\n    console.log(a);\n```",
    );
    const css = `
      #wemd pre.custom > .mac-sign {
        display: block;
      }
    `;

    const output = resolveInlineStyleVariablesForCopy(
      processHtml(html, css, true, true),
    );

    const container = document.createElement("div");
    container.innerHTML = output;
    normalizeCopyContainer(container);

    const pre = container.querySelector("pre") as HTMLElement | null;
    const macSign = container.querySelector(
      "pre > .mac-sign",
    ) as HTMLElement | null;
    const dots = container.querySelectorAll("pre > .mac-sign > .mac-dot");
    const code = container.querySelector("pre > code");

    expect(pre).toBeTruthy();
    expect(macSign?.style.width).toBe("");
    expect(macSign?.style.height).toBe("13px");
    expect(dots).toHaveLength(3);
    expect((dots[0] as HTMLElement).style.width).toBe("10px");
    expect((dots[0] as HTMLElement).style.height).toBe("10px");
    expect((dots[0] as HTMLElement).style.marginTop).toBe("1.5px");
    expect(container.querySelector("svg")).toBeNull();
    expect(code).toBeTruthy();
    expect(code!.querySelector(".mac-dot")).toBeNull();

    const preChildren = Array.from(pre!.children).map((el) => el.tagName);
    expect(preChildren[0]).toBe("SPAN");
    expect(preChildren[1]).toBe("CODE");
  });

  it("does not add extra top padding to code when mac bar is enabled", () => {
    const html =
      "<pre class='custom'><code class='hljs language-ts'>const a = 1;</code></pre>";
    const css = generateCSS({
      ...defaultVariables,
      showMacBar: true,
    });

    const output = resolveInlineStyleVariablesForCopy(
      processHtml(html, css, true, true),
    );

    const container = document.createElement("div");
    container.innerHTML = output;
    normalizeCopyContainer(container);

    const code = container.querySelector("pre > code") as HTMLElement | null;
    expect(code).toBeTruthy();
    expect(code!.style.paddingTop).toBe("16px");
    expect(code!.style.paddingRight).toBe("16px");
    expect(code!.style.paddingBottom).toBe("16px");
    expect(code!.style.paddingLeft).toBe("16px");
  });

  it("uses pre background instead of code background for mac bar layout", () => {
    const html =
      "<pre class='custom'><code class='hljs language-ts'>const a = 1;</code></pre>";
    const css = generateCSS({
      ...defaultVariables,
      showMacBar: true,
      codeBackground: "#f5f5f5",
    });

    const output = resolveInlineStyleVariablesForCopy(
      processHtml(html, css, true, true),
    );

    const container = document.createElement("div");
    container.innerHTML = output;
    normalizeCopyContainer(container);

    const pre = container.querySelector("pre.custom") as HTMLElement | null;
    const code = container.querySelector("pre > code") as HTMLElement | null;
    expect(pre).toBeTruthy();
    expect(code).toBeTruthy();
    expect(pre!.style.background).toBe("rgb(245, 245, 245)");
    expect(pre!.style.borderRadius).toBe("8px");
    expect(code!.style.background).toBe("transparent");
    expect(code!.style.borderRadius).toBe("0");
  });
});
