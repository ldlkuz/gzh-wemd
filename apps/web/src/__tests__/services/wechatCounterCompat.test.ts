import { describe, expect, it, vi } from "vitest";
import {
  extractCounterPseudoRules,
  materializeCounterPseudoContent,
  stripCounterPseudoRules,
} from "../../services/wechatCounterCompat";

const mockStyle = (
  content: string,
  styleValues: Record<string, string>,
): CSSStyleDeclaration =>
  ({
    content,
    getPropertyValue: (property: string) => styleValues[property] || "",
  }) as unknown as CSSStyleDeclaration;

describe("wechatCounterCompat", () => {
  it("extracts counter pseudo rules from css", () => {
    const css = `
      #wemd h2::before { content: 'Part' counter(counterh1); }
      #wemd h3:before { content: counters(counterh2, "."); }
      #wemd h4::before { content: "No Counter"; }
    `;

    const rules = extractCounterPseudoRules(css);
    expect(rules.map((rule) => [rule.selector, rule.pseudo])).toEqual([
      ["#wemd h2", "before"],
      ["#wemd h3", "before"],
    ]);
  });

  it("strips only pseudo rules that contain counter content", () => {
    const css = `
      #wemd h2::before { content: 'Part' counter(counterh1); color: #333; }
      #wemd h2 { color: #333; }
      #wemd h3::before { content: "纯文本"; color: #666; }
    `;

    const stripped = stripCounterPseudoRules(css);
    expect(stripped).not.toContain("counter(counterh1)");
    expect(stripped).toContain("#wemd h2 { color: #333; }");
    expect(stripped).toContain(
      '#wemd h3::before { content: "纯文本"; color: #666; }',
    );
  });

  it("materializes pseudo counter text into real nodes before copy", () => {
    const originalGetComputedStyle = window.getComputedStyle.bind(window);
    const getComputedStyleSpy = vi
      .spyOn(window, "getComputedStyle")
      .mockImplementation((elt: Element, pseudoElt?: string | null) => {
        const tag = (elt as HTMLElement).tagName.toLowerCase();
        const id = (elt as HTMLElement).id;
        if (!pseudoElt && tag === "section" && id === "wemd") {
          return mockStyle("normal", {
            "counter-reset": "counterh1 0 counterh2 0",
            "counter-increment": "none",
          });
        }
        if (!pseudoElt && tag === "h2") {
          return mockStyle("normal", {
            "counter-increment": "none",
            "counter-reset": "none",
          });
        }
        if (!pseudoElt && tag === "h3") {
          return mockStyle("normal", {
            "counter-increment": "none",
            "counter-reset": "none",
          });
        }
        if (pseudoElt === "::before" && tag === "h2") {
          const styleValues: Record<string, string> = {
            color: "rgb(255, 255, 255)",
            "background-color": "rgb(37, 132, 181)",
            padding: "2px 8px",
            "counter-reset": "counterh2 0",
            "counter-increment": "counterh1 1",
          };
          return mockStyle('"Part" counter(counterh1) " "', styleValues);
        }
        if (pseudoElt === "::before" && tag === "h3") {
          const styleValues: Record<string, string> = {
            color: "rgb(123, 189, 207)",
            "margin-right": "6px",
            "counter-reset": "none",
            "counter-increment": "counterh2 1",
          };
          return mockStyle(
            'counter(counterh1) "." counter(counterh2) " "',
            styleValues,
          );
        }
        if (pseudoElt === "::after") {
          return mockStyle("none", {});
        }
        if (pseudoElt) {
          return mockStyle("none", {});
        }
        return originalGetComputedStyle(elt, pseudoElt ?? undefined);
      });

    const html = `
      <h2>二级标题A</h2>
      <h3>三级标题A-1</h3>
      <h3>三级标题A-2</h3>
      <h2>二级标题B</h2>
      <h3>三级标题B-1</h3>
    `;
    const css = `
      #wemd h2::before {
        counter-reset: counterh2;
        content: 'Part' counter(counterh1);
        counter-increment: counterh1;
        color: white;
        background: rgb(37,132,181);
        padding: 2px 8px;
      }
      #wemd h3::before {
        counter-increment: counterh2;
        content: counter(counterh1) "." counter(counterh2) " ";
        color: rgb(123,189,207);
        margin-right: 6px;
      }
    `;

    const result = materializeCounterPseudoContent(html, css);

    expect(result.match(/data-wemd-counter-generated="before"/g)?.length).toBe(
      5,
    );
    expect(result).toContain("Part1");
    expect(result).toContain("Part2");
    expect(result).toContain("1.1");
    expect(result).toContain("1.2");
    expect(result).toContain("2.1");
    expect(result).toContain("padding:2px 8px;");

    getComputedStyleSpy.mockRestore();
  });

  it("keeps only final increment/reset declaration from computed style", () => {
    const getComputedStyleSpy = vi
      .spyOn(window, "getComputedStyle")
      .mockImplementation((elt: Element, pseudoElt?: string | null) => {
        const tag = (elt as HTMLElement).tagName.toLowerCase();
        const id = (elt as HTMLElement).id;
        if (!pseudoElt && tag === "section" && id === "wemd") {
          return mockStyle("normal", {
            "counter-reset": "counterh1 0",
            "counter-increment": "none",
          });
        }
        if (pseudoElt === "::before" && tag === "h2") {
          return mockStyle('"Part" counter(counterh1)', {
            "counter-increment": "counterh1 1",
            "counter-reset": "none",
          });
        }
        if (pseudoElt === "::after") {
          return mockStyle("none", {});
        }
        return mockStyle("normal", {});
      });

    const html = "<h2>标题A</h2><h2>标题B</h2>";
    const css = `
      #wemd h2::before { content: "Part" counter(counterh1); counter-increment: counterh1 999; }
      #wemd h2::before { content: "Part" counter(counterh1); counter-increment: counterh1; }
    `;

    const result = materializeCounterPseudoContent(html, css);
    expect(result).toContain("Part1");
    expect(result).toContain("Part2");
    expect(result).not.toContain("Part1000");

    getComputedStyleSpy.mockRestore();
  });

  it("supports counters(name, separator) multi-level output", () => {
    const getComputedStyleSpy = vi
      .spyOn(window, "getComputedStyle")
      .mockImplementation((elt: Element, pseudoElt?: string | null) => {
        const tag = (elt as HTMLElement).tagName.toLowerCase();
        const id = (elt as HTMLElement).id;

        if (!pseudoElt && tag === "section" && id === "wemd") {
          return mockStyle("normal", {
            "counter-reset": "sec 0 sub 0",
            "counter-increment": "none",
          });
        }
        if (
          !pseudoElt &&
          tag === "div" &&
          (elt as HTMLElement).className === "nested"
        ) {
          return mockStyle("normal", {
            "counter-reset": "sub 0",
            "counter-increment": "none",
          });
        }
        if (pseudoElt === "::before" && tag === "h2") {
          return mockStyle('counter(sec) " "', {
            "counter-increment": "sec 1",
            "counter-reset": "none",
          });
        }
        if (pseudoElt === "::before" && tag === "h3") {
          return mockStyle('counters(sub, ".") " "', {
            "counter-increment": "sub 1",
            "counter-reset": "none",
          });
        }
        if (pseudoElt === "::after") {
          return mockStyle("none", {});
        }

        return mockStyle("normal", {});
      });

    const html = `
      <h2>章节</h2>
      <h3>一级</h3>
      <div class="nested">
        <h3>二级</h3>
      </div>
    `;
    const css = `
      #wemd h2::before { content: counter(sec) " "; counter-increment: sec; }
      #wemd h3::before { content: counters(sub, ".") " "; counter-increment: sub; }
    `;

    const result = materializeCounterPseudoContent(html, css);
    expect(result).toContain(
      '<span data-wemd-counter-generated="before">1 </span>章节',
    );
    expect(result).toContain(
      '<span data-wemd-counter-generated="before">1 </span>一级',
    );
    expect(result).toContain(
      '<span data-wemd-counter-generated="before">1.1 </span>二级',
    );

    getComputedStyleSpy.mockRestore();
  });

  it("supports counters separator containing comma", () => {
    const getComputedStyleSpy = vi
      .spyOn(window, "getComputedStyle")
      .mockImplementation((elt: Element, pseudoElt?: string | null) => {
        const tag = (elt as HTMLElement).tagName.toLowerCase();
        const id = (elt as HTMLElement).id;
        const className = (elt as HTMLElement).className;

        if (!pseudoElt && tag === "section" && id === "wemd") {
          return mockStyle("normal", {
            "counter-reset": "sec 0",
            "counter-increment": "none",
          });
        }
        if (!pseudoElt && tag === "div" && className === "nested") {
          return mockStyle("normal", {
            "counter-reset": "sec 0",
            "counter-increment": "none",
          });
        }
        if (pseudoElt === "::before" && tag === "h2") {
          return mockStyle('counter(sec) " "', {
            "counter-increment": "sec 1",
            "counter-reset": "none",
          });
        }
        if (pseudoElt === "::before" && tag === "h3") {
          return mockStyle('counters(sec, ", ") " "', {
            "counter-increment": "sec 1",
            "counter-reset": "none",
          });
        }
        if (pseudoElt === "::after") {
          return mockStyle("none", {});
        }
        return mockStyle("normal", {});
      });

    const html = `
      <h2>父级</h2>
      <div class="nested">
        <h3>子级</h3>
      </div>
    `;
    const css = `
      #wemd h2::before { content: counter(sec) " "; counter-increment: sec; }
      #wemd h3::before { content: counters(sec, ", ") " "; counter-increment: sec; }
    `;

    const result = materializeCounterPseudoContent(html, css);
    expect(result).toContain(
      '<span data-wemd-counter-generated="before">1, 1 </span>子级',
    );

    getComputedStyleSpy.mockRestore();
  });

  it("supports counter styles in counter() and counters()", () => {
    const getComputedStyleSpy = vi
      .spyOn(window, "getComputedStyle")
      .mockImplementation((elt: Element, pseudoElt?: string | null) => {
        const tag = (elt as HTMLElement).tagName.toLowerCase();
        const id = (elt as HTMLElement).id;
        const className = (elt as HTMLElement).className;

        if (!pseudoElt && tag === "section" && id === "wemd") {
          return mockStyle("normal", {
            "counter-reset": "part 0 item 1",
            "counter-increment": "none",
          });
        }
        if (!pseudoElt && tag === "div" && className === "nested") {
          return mockStyle("normal", {
            "counter-reset": "item 0",
            "counter-increment": "none",
          });
        }
        if (pseudoElt === "::before" && tag === "h2") {
          return mockStyle('counter(part, upper-roman) " "', {
            "counter-increment": "part 1",
            "counter-reset": "none",
          });
        }
        if (pseudoElt === "::before" && tag === "h3") {
          return mockStyle('counters(item, "-", lower-alpha) " "', {
            "counter-increment": "item 1",
            "counter-reset": "none",
          });
        }
        if (pseudoElt === "::after") {
          return mockStyle("none", {});
        }
        return mockStyle("normal", {});
      });

    const html = `
      <h2>章节一</h2>
      <h2>章节二</h2>
      <div class="nested">
        <h3>条目A</h3>
        <h3>条目B</h3>
      </div>
    `;
    const css = `
      #wemd h2::before { content: counter(part, upper-roman) " "; counter-increment: part; }
      #wemd h3::before { content: counters(item, "-", lower-alpha) " "; counter-increment: item; }
    `;

    const result = materializeCounterPseudoContent(html, css);
    expect(result).toContain(
      '<span data-wemd-counter-generated="before">I </span>章节一',
    );
    expect(result).toContain(
      '<span data-wemd-counter-generated="before">II </span>章节二',
    );
    expect(result).toContain(
      '<span data-wemd-counter-generated="before">a-a </span>条目A',
    );
    expect(result).toContain(
      '<span data-wemd-counter-generated="before">a-b </span>条目B',
    );

    getComputedStyleSpy.mockRestore();
  });
});
