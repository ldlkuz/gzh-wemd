import { describe, expect, it } from "vitest";
import {
  applyNativeSubgraphTitleStyles,
  getSubgraphTitleOverlays,
  replaceForeignObjectWithSvgText,
} from "../../services/wechatMermaidSvgText";

const parseSvg = (markup: string): SVGElement => {
  const holder = document.createElement("div");
  holder.innerHTML = markup;
  const svg = holder.querySelector("svg");
  if (!svg) throw new Error("测试 SVG 缺少根节点");
  return svg;
};

describe("replaceForeignObjectWithSvgText", () => {
  it("removes cluster-label foreignObject because subgraph titles use canvas overlay", () => {
    const svg = parseSvg(`
      <svg width="300" height="180" viewBox="0 0 300 180" xmlns="http://www.w3.org/2000/svg">
        <g class="cluster" id="Route1">
          <rect x="20" y="20" width="260" height="140" style="fill:#10a37f" />
          <g class="cluster-label" transform="translate(50, 28)">
            <foreignObject width="200" height="48">
              <div xmlns="http://www.w3.org/1999/xhtml">
                <span style="color:#fff">路线一：OpenAI 闭源极致智能</span>
              </div>
            </foreignObject>
          </g>
        </g>
      </svg>
    `);

    replaceForeignObjectWithSvgText(svg);

    expect(svg.querySelector("foreignObject")).toBeNull();
    expect(svg.querySelector(".cluster-label text")).toBeNull();
  });

  it("preserves regular foreignObject labels with explicit x/y inside nested transforms", () => {
    const svg = parseSvg(`
      <svg width="120" height="80" viewBox="0 0 120 80" xmlns="http://www.w3.org/2000/svg">
        <g transform="translate(10, 20)">
          <g transform="translate(5, 6)">
            <foreignObject x="2" y="3" width="40" height="20">
              <div xmlns="http://www.w3.org/1999/xhtml">
                <span style="color:#123456">普通节点</span>
              </div>
            </foreignObject>
          </g>
        </g>
      </svg>
    `);

    replaceForeignObjectWithSvgText(svg);

    const text = svg.querySelector("text");
    expect(text?.textContent).toBe("普通节点");
    expect(text?.parentElement?.getAttribute("transform")).toBe(
      "translate(5, 6)",
    );
    expect(text?.getAttribute("x")).toBe("22");
    expect(text?.getAttribute("fill")).not.toBe("#111");
  });

  it("wraps long Chinese foreignObject labels within the node box", () => {
    const svg = parseSvg(`
      <svg width="220" height="120" viewBox="0 0 220 120" xmlns="http://www.w3.org/2000/svg">
        <g class="node">
          <rect x="20" y="20" width="120" height="64" />
          <g class="label">
            <foreignObject x="20" y="20" width="120" height="64">
              <div xmlns="http://www.w3.org/1999/xhtml">
                <span style="color:#222">久坐、久思、用眼过度<br />→胃气极度虚弱（太阴）</span>
              </div>
            </foreignObject>
          </g>
        </g>
      </svg>
    `);

    replaceForeignObjectWithSvgText(svg);

    const text = svg.querySelector("text");
    const tspans = Array.from(svg.querySelectorAll("tspan"));
    expect(svg.querySelector("foreignObject")).toBeNull();
    expect(text?.getAttribute("text-anchor")).toBe("middle");
    expect(tspans.length).toBeGreaterThan(2);
    expect(
      tspans.every((tspan) => (tspan.textContent ?? "").length <= 10),
    ).toBe(true);
  });

  it("wraps long native SVG node labels emitted by Mermaid", () => {
    const svg = parseSvg(`
      <svg width="220" height="120" viewBox="0 0 220 120" xmlns="http://www.w3.org/2000/svg">
        <g class="node">
          <rect x="10" y="10" width="110" height="58" />
          <g class="label">
            <text x="65" y="39" font-size="16">水饮蒙蔽清阳→头前额如裹、头顶禁锢、头昏沉</text>
          </g>
        </g>
      </svg>
    `);

    replaceForeignObjectWithSvgText(svg);

    const text = svg.querySelector("text");
    const tspans = Array.from(svg.querySelectorAll("tspan"));
    expect(text?.getAttribute("x")).toBe("65");
    expect(text?.getAttribute("text-anchor")).toBe("middle");
    expect(tspans.length).toBeGreaterThan(2);
    expect(
      tspans.every((tspan) => (tspan.textContent ?? "").length <= 10),
    ).toBe(true);
  });

  it("builds a canvas title overlay from the original subgraph declaration", () => {
    const svg = parseSvg(`
      <svg width="300" height="180" viewBox="0 0 300 180" xmlns="http://www.w3.org/2000/svg">
        <g class="cluster" id="flowchart-Route1-0">
          <rect x="20" y="20" width="260" height="140" style="fill:#10a37f" />
          <g class="cluster-label" transform="translate(50, 20)">
            <foreignObject width="200" height="48">
              <div xmlns="http://www.w3.org/1999/xhtml">
                <span>旧标题</span>
              </div>
            </foreignObject>
          </g>
        </g>
      </svg>
    `);

    const overlays = getSubgraphTitleOverlays(
      svg,
      `graph TB
subgraph Route1["路线一：OpenAI 闭源极致智能"]
end
style Route1 fill:#10a37f,color:#fff,stroke:#0d8c6d`,
    );

    expect(overlays).toEqual([
      {
        id: "Route1",
        title: "路线一：OpenAI 闭源极致智能",
        color: "#fff",
        x: 150,
        y: 38,
      },
    ]);
  });

  it("does not build a canvas overlay when Mermaid already emitted native SVG text", () => {
    const svg = parseSvg(`
      <svg width="300" height="180" viewBox="0 0 300 180" xmlns="http://www.w3.org/2000/svg">
        <g class="cluster" id="Route1">
          <rect x="20" y="20" width="260" height="140" style="fill:#10a37f" />
          <g class="cluster-label" transform="translate(150, 20)">
            <text>路线一：OpenAI 闭源极致智能</text>
          </g>
        </g>
      </svg>
    `);

    const overlays = getSubgraphTitleOverlays(
      svg,
      `graph TB
subgraph Route1["路线一：OpenAI 闭源极致智能"]
end
style Route1 fill:#10a37f,color:#fff,stroke:#0d8c6d`,
    );

    expect(overlays).toEqual([]);
  });

  it("applies Mermaid style color to native SVG subgraph titles", () => {
    const svg = parseSvg(`
      <svg width="300" height="180" viewBox="0 0 300 180" xmlns="http://www.w3.org/2000/svg">
        <g class="cluster" id="Route1">
          <rect x="20" y="20" width="260" height="140" style="fill:#10a37f" />
          <g class="cluster-label" transform="translate(150, 20)">
            <text><tspan>路线一：OpenAI 闭源极致智能</tspan></text>
          </g>
        </g>
      </svg>
    `);

    applyNativeSubgraphTitleStyles(
      svg,
      `graph TB
subgraph Route1["路线一：OpenAI 闭源极致智能"]
end
style Route1 fill:#10a37f,color:#fff,stroke:#0d8c6d`,
    );

    const text = svg.querySelector(".cluster-label text");
    const tspan = svg.querySelector(".cluster-label tspan");
    expect(text?.getAttribute("fill")).toBe("#fff");
    expect(tspan?.getAttribute("fill")).toBe("#fff");
  });
});
