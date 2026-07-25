/**
 * 将 Mermaid SVG 里的 foreignObject 文本转成原生 SVG text。
 * 公众号复制链路必须生成 PNG，而 foreignObject 进 canvas 会污染画布。
 */

import { layoutSvgTextLines, type SvgTextBox } from "./wechatMermaidTextLayout";

const SVG_NS = "http://www.w3.org/2000/svg";

type ForeignObjectPlacement = {
  box: SvgTextBox;
  target: SVGElement;
};

type SubgraphTitle = {
  id: string;
  title: string;
  color?: string;
};

export type SubgraphTitleOverlay = {
  id: string;
  title: string;
  color: string;
  x: number;
  y: number;
};

const hasForeignObjectLabel = (cluster: SVGGElement): boolean =>
  cluster.querySelector(".cluster-label foreignObject") !== null;

const hasNativeSvgTextLabel = (cluster: SVGGElement): boolean =>
  cluster.querySelector(".cluster-label text") !== null;

const parseSvgLength = (value: string | null): number | null => {
  if (!value) return null;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const getSvgTextFontSize = (textEl: SVGTextElement): number => {
  const candidates = [
    textEl.getAttribute("font-size"),
    textEl.style.fontSize,
    textEl.querySelector("tspan")?.getAttribute("font-size"),
  ];

  for (const candidate of candidates) {
    const parsed = parseSvgLength(candidate ?? null);
    if (parsed) return parsed;
  }

  return 16;
};

const getViewBoxParts = (svg: SVGElement, svgRect: DOMRect): number[] => {
  const viewBoxAttr = svg.getAttribute("viewBox");
  if (!viewBoxAttr) return [0, 0, svgRect.width, svgRect.height];

  const viewBox = viewBoxAttr
    .trim()
    .split(/[\s,]+/)
    .map(Number);
  return viewBox.length === 4 && viewBox.every(Number.isFinite)
    ? viewBox
    : [0, 0, svgRect.width, svgRect.height];
};

const getForeignObjectPlacement = (
  fo: SVGForeignObjectElement,
  svg: SVGElement,
  svgRect: DOMRect,
  viewBox: number[],
): ForeignObjectPlacement | null => {
  const attrWidth = parseSvgLength(fo.getAttribute("width"));
  const attrHeight = parseSvgLength(fo.getAttribute("height"));
  const attrX = parseSvgLength(fo.getAttribute("x")) ?? 0;
  const attrY = parseSvgLength(fo.getAttribute("y")) ?? 0;
  const parent = fo.parentElement;

  if (attrWidth && attrHeight && parent instanceof SVGElement) {
    return {
      box: {
        x: attrX,
        y: attrY,
        width: attrWidth,
        height: attrHeight,
      },
      target: parent,
    };
  }

  const foRect = fo.getBoundingClientRect();
  if (!foRect.width || !foRect.height) return null;

  const scaleX = viewBox[2] / (svgRect.width || 1);
  const scaleY = viewBox[3] / (svgRect.height || 1);
  return {
    box: {
      x: viewBox[0] + (foRect.left - svgRect.left) * scaleX,
      y: viewBox[1] + (foRect.top - svgRect.top) * scaleY,
      width: foRect.width * scaleX,
      height: foRect.height * scaleY,
    },
    target: svg,
  };
};

const getForeignObjectTextFill = (fo: SVGForeignObjectElement): string => {
  const candidates = Array.from(
    fo.querySelectorAll<HTMLElement>("[style], span, p, div"),
  );

  for (const candidate of candidates) {
    const inlineColor = candidate.style.color || candidate.style.fill;
    if (inlineColor) return inlineColor;
  }

  for (const candidate of candidates) {
    const computed = window.getComputedStyle(candidate);
    const color = computed.color || computed.fill;
    if (color && color !== "rgba(0, 0, 0, 0)" && color !== "transparent") {
      return color;
    }
  }

  return "#111";
};

const getForeignObjectTextLines = (fo: SVGForeignObjectElement): string[] => {
  const htmlFragment = fo.innerHTML
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(div|p|span)>/gi, "\n");
  const tmp = document.createElement("div");
  tmp.innerHTML = htmlFragment;

  return (tmp.textContent ?? "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
};

const isClusterLabelForeignObject = (fo: SVGForeignObjectElement): boolean =>
  fo.closest(".cluster-label") !== null;

const unescapeMermaidText = (value: string): string =>
  value.replace(/\\"/g, '"').replace(/\\n/g, "\n").trim();

const parseSubgraphDeclaration = (line: string): SubgraphTitle | null => {
  const body = line.replace(/^\s*subgraph\s+/, "").trim();
  const idWithQuotedTitle = body.match(
    /^([A-Za-z0-9_:-]+)\s*\["((?:\\"|[^"])*)"\]\s*$/,
  );
  if (idWithQuotedTitle) {
    return {
      id: idWithQuotedTitle[1],
      title: unescapeMermaidText(idWithQuotedTitle[2]),
    };
  }

  const idWithBareTitle = body.match(/^([A-Za-z0-9_:-]+)\s*\[([^\]]+)\]\s*$/);
  if (idWithBareTitle) {
    return {
      id: idWithBareTitle[1],
      title: unescapeMermaidText(idWithBareTitle[2]),
    };
  }

  const quotedTitle = body.match(/^"((?:\\"|[^"])*)"\s*$/);
  if (quotedTitle) {
    const title = unescapeMermaidText(quotedTitle[1]);
    return { id: title, title };
  }

  if (body && !body.includes(" ")) {
    return { id: body, title: body };
  }

  return null;
};

const parseSubgraphTitles = (diagram: string): SubgraphTitle[] => {
  const titles = diagram
    .split("\n")
    .map((line) => parseSubgraphDeclaration(line))
    .filter(
      (item): item is SubgraphTitle => item !== null && item.title !== "",
    );

  for (const line of diagram.split("\n")) {
    const styleMatch = line.match(/^\s*style\s+([A-Za-z0-9_:-]+)\s+(.+)$/);
    if (!styleMatch) continue;

    const [, id, styleText] = styleMatch;
    const colorMatch = styleText.match(/(?:^|[,;])\s*color\s*:\s*([^,;]+)/);
    if (!colorMatch) continue;

    const title = titles.find((item) => item.id === id);
    if (title)
      title.color = colorMatch[1].replace(/\s*!important\s*$/, "").trim();
  }

  return titles;
};

const findClusterGroup = (
  svg: SVGElement,
  title: SubgraphTitle,
): SVGGElement | null => {
  const clusters = Array.from(svg.querySelectorAll<SVGGElement>("g.cluster"));
  const idPattern = new RegExp(
    `(^|[-_])${title.id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}($|[-_])`,
  );
  return (
    clusters.find((cluster) => cluster.id === title.id) ??
    clusters.find((cluster) => cluster.id.endsWith(title.id)) ??
    clusters.find((cluster) => idPattern.test(cluster.id)) ??
    null
  );
};

const getClusterBox = (cluster: SVGGElement): SvgTextBox | null => {
  const rect = cluster.querySelector<SVGRectElement>("rect");
  if (rect) {
    const x = parseSvgLength(rect.getAttribute("x"));
    const y = parseSvgLength(rect.getAttribute("y"));
    const width = parseSvgLength(rect.getAttribute("width"));
    const height = parseSvgLength(rect.getAttribute("height"));
    if (x !== null && y !== null && width && height) {
      return { x, y, width, height };
    }
  }

  try {
    const bbox = cluster.getBBox();
    if (bbox.width && bbox.height) {
      return {
        x: bbox.x,
        y: bbox.y,
        width: bbox.width,
        height: bbox.height,
      };
    }
  } catch {
    return null;
  }

  return null;
};

const getNodeTextBox = (textEl: SVGTextElement): SvgTextBox | null => {
  const node = textEl.closest("g.node") as SVGGElement | null;
  if (!node || textEl.closest(".cluster-label")) return null;

  const rect = node.querySelector<SVGRectElement>("rect");
  if (!rect) return null;

  const x = parseSvgLength(rect.getAttribute("x")) ?? 0;
  const y = parseSvgLength(rect.getAttribute("y")) ?? 0;
  const width = parseSvgLength(rect.getAttribute("width"));
  const height = parseSvgLength(rect.getAttribute("height"));
  if (!width || !height) return null;

  return { x, y, width, height };
};

const getSvgTextLines = (textEl: SVGTextElement): string[] => {
  const tspans = Array.from(textEl.querySelectorAll("tspan"));
  const rawLines =
    tspans.length > 0
      ? tspans.map((tspan) => tspan.textContent ?? "")
      : (textEl.textContent ?? "").split(/\n+/);

  return rawLines.map((line) => line.trim()).filter(Boolean);
};

const applySvgTextLayout = (
  textEl: SVGTextElement,
  box: SvgTextBox,
  rawLines: string[],
  preferredFontSize?: number,
): void => {
  const layout = layoutSvgTextLines(rawLines, box, preferredFontSize);

  textEl.replaceChildren();
  textEl.setAttribute("x", String(layout.centerX));
  textEl.setAttribute("y", String(layout.startY));
  textEl.setAttribute("text-anchor", "middle");
  textEl.setAttribute("font-size", String(layout.fontSize));

  layout.lines.forEach((line, i) => {
    const tspan = document.createElementNS(SVG_NS, "tspan");
    tspan.setAttribute("x", String(layout.centerX));
    if (i > 0) tspan.setAttribute("dy", String(layout.lineHeight));
    tspan.textContent = line;
    textEl.appendChild(tspan);
  });
};

const wrapNativeNodeTextLabels = (svg: SVGElement): void => {
  const textElements = Array.from(
    svg.querySelectorAll<SVGTextElement>("g.node text"),
  );

  textElements.forEach((textEl) => {
    const box = getNodeTextBox(textEl);
    if (!box) return;

    const rawLines = getSvgTextLines(textEl);
    if (rawLines.length === 0) return;

    applySvgTextLayout(textEl, box, rawLines, getSvgTextFontSize(textEl));
  });
};

const parseTranslate = (
  transform: string | null,
): { x: number; y: number } | null => {
  const match = transform?.match(/translate\(\s*([^,\s]+)[,\s]+([^)]+)\)/);
  if (!match) return null;

  const x = Number.parseFloat(match[1]);
  const y = Number.parseFloat(match[2]);
  return Number.isFinite(x) && Number.isFinite(y) ? { x, y } : null;
};

const getClusterLabelAnchor = (
  cluster: SVGGElement,
): { x: number; y: number } | null => {
  const label = cluster.querySelector<SVGGElement>(".cluster-label");
  const translate = parseTranslate(label?.getAttribute("transform") ?? null);
  if (!label || !translate) return null;

  const foreignObject =
    label.querySelector<SVGForeignObjectElement>("foreignObject");
  const width = parseSvgLength(foreignObject?.getAttribute("width") ?? null);
  return {
    x: width ? translate.x + width / 2 : translate.x,
    y: translate.y + 18,
  };
};

export const getSubgraphTitleOverlays = (
  svg: SVGElement,
  diagram: string,
): SubgraphTitleOverlay[] => {
  const titles = parseSubgraphTitles(diagram);
  const overlays: SubgraphTitleOverlay[] = [];

  for (const title of titles) {
    const cluster = findClusterGroup(svg, title);
    if (!cluster) continue;
    if (!hasForeignObjectLabel(cluster) || hasNativeSvgTextLabel(cluster)) {
      continue;
    }

    const box = getClusterBox(cluster);
    if (!box) continue;
    const anchor = getClusterLabelAnchor(cluster);

    overlays.push({
      id: title.id,
      title: title.title,
      color: title.color || "#111",
      x: anchor?.x ?? box.x + box.width / 2,
      y: anchor?.y ?? box.y + 22,
    });
  }

  return overlays;
};

export const applyNativeSubgraphTitleStyles = (
  svg: SVGElement,
  diagram: string,
): void => {
  const titles = parseSubgraphTitles(diagram);

  for (const title of titles) {
    if (!title.color) continue;
    const color = title.color;

    const cluster = findClusterGroup(svg, title);
    if (!cluster || hasForeignObjectLabel(cluster)) continue;

    const textElements = cluster.querySelectorAll<SVGTextElement>(
      ".cluster-label text, .cluster-label tspan",
    );

    textElements.forEach((textEl) => {
      textEl.setAttribute("fill", color);
      textEl.style.setProperty("fill", color, "important");
      textEl.style.setProperty("color", color, "important");
    });
  }
};

export const replaceForeignObjectWithSvgText = (svg: SVGElement): void => {
  wrapNativeNodeTextLabels(svg);

  const svgRect = svg.getBoundingClientRect();
  const viewBox = getViewBoxParts(svg, svgRect);
  const foreignObjects = Array.from(svg.querySelectorAll("foreignObject"));
  const pendingTexts: Array<{ target: SVGElement; text: SVGElement }> = [];

  for (const fo of foreignObjects) {
    // subgraph 标题不走普通 SVG text 替换；它的坐标由 cluster-label
    // transform 决定，最终统一在 canvas 上绘制，避免重复标题和错位。
    if (isClusterLabelForeignObject(fo)) {
      fo.remove();
      continue;
    }

    const placement = getForeignObjectPlacement(fo, svg, svgRect, viewBox);
    if (!placement) {
      fo.remove();
      continue;
    }
    const { box, target } = placement;

    const lines = getForeignObjectTextLines(fo);
    if (lines.length === 0) {
      fo.remove();
      continue;
    }

    const textEl = document.createElementNS(SVG_NS, "text");

    textEl.setAttribute(
      "font-family",
      '-apple-system, BlinkMacSystemFont, "Microsoft YaHei", sans-serif',
    );
    textEl.setAttribute("fill", getForeignObjectTextFill(fo));
    applySvgTextLayout(textEl, box, lines);

    fo.remove();
    pendingTexts.push({ target, text: textEl });
  }

  pendingTexts.forEach(({ target, text }) => target.appendChild(text));
};
