import { createFormulaImageRenderer } from "./math/formulaImageRenderer";
import {
  isHighRiskLatex,
  normalizeBoldSymbolText,
  rerenderFormulaWithSafeKatex,
} from "./math/formulaLatexPolicy";

interface MathImageRenderResult {
  imageCount: number;
}

export const renderHighRiskMathAsImages = async (
  container: HTMLElement,
): Promise<MathImageRenderResult> => {
  const formulaNodes = Array.from(
    container.querySelectorAll<HTMLElement>(
      ".inline-equation[data-latex], .block-equation[data-latex]",
    ),
  ).filter((node) => {
    const latex = node.getAttribute("data-latex") || "";
    return latex && isHighRiskLatex(latex, node);
  });

  const renderFormulaImage = await createFormulaImageRenderer();
  const renderResults = await Promise.all(
    formulaNodes.map(async (node) => {
      const latex = node.getAttribute("data-latex") || "";
      const display = node.classList.contains("block-equation");
      const image = renderFormulaImage
        ? await renderFormulaImage(latex, display, node)
        : null;
      if (!image) {
        rerenderFormulaWithSafeKatex(node, latex, display);
        return false;
      }

      node.replaceChildren(image);
      node.removeAttribute("data-latex");
      return true;
    }),
  );

  return { imageCount: renderResults.filter(Boolean).length };
};

/**
 * 微信复制公式兼容处理。
 * KaTeX 会输出隐藏 MathML 与 TeX annotation，微信清洗后可能暴露源码。
 */
export const stripHiddenMathMarkupForWechat = (
  container: HTMLElement,
): void => {
  container.querySelectorAll(".katex-mathml").forEach((node) => {
    node.remove();
  });

  container
    .querySelectorAll('annotation[encoding="application/x-tex"]')
    .forEach((node) => {
      node.remove();
    });

  container.querySelectorAll<HTMLElement>("[data-latex]").forEach((node) => {
    node.removeAttribute("data-latex");
  });

  normalizeBoldSymbolText(container);

  container
    .querySelectorAll<HTMLElement>(".katex, .katex-html, .base")
    .forEach((node) => {
      node.style.setProperty("white-space", "nowrap", "important");
    });

  container.querySelectorAll<HTMLElement>(".katex-html").forEach((node) => {
    node.style.setProperty("display", "inline-block", "important");
  });

  container.querySelectorAll<HTMLElement>(".base").forEach((node) => {
    node.style.setProperty("display", "inline-block", "important");
    node.style.setProperty("width", "auto", "important");
    node.style.setProperty("min-width", "0", "important");
  });
};
