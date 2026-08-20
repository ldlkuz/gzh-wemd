import {
  processHtml,
  createMarkdownParser,
  getThemeTemplates,
  getThemeSlotDefs,
} from "@wemd/core";
import type { ThemeDefinition } from "@wemd/core";
import katexCss from "katex/dist/katex.min.css?raw";
import { convertLinksToFootnotes } from "../utils/linkFootnote";
import { getPublishingPreference } from "../store/publishingPreferences";
import {
  applyLightRootVars,
  resolveInlineStyleVariablesForCopy,
} from "./inlineStyleVarResolver";
import {
  materializeCounterPseudoContent,
  stripCounterPseudoRules,
} from "./wechatCounterCompat";
import { normalizeCopyContainer } from "./wechatCopyNormalizer";
import {
  renderHighRiskMathAsImages,
  stripHiddenMathMarkupForWechat,
} from "./wechatMathCompat";
import { renderMermaidBlocks } from "./wechatMermaidRenderer";
import { renderTableBlocks } from "./wechatTableRenderer";

export interface WechatPublishHtmlOptions {
  showMacBar?: boolean;
  /** Phase 5：当前主题定义，用于注入组件骨架模板 */
  themeDefinition?: ThemeDefinition;
}

export interface WechatPublishHtmlResult {
  container: HTMLElement;
  html: string;
  plainText: string;
  mathImageCount: number;
  cleanup: () => void;
}

const buildCopyCss = (themeCss: string) => {
  if (!themeCss) return katexCss;
  // 不再在此展开 CSS 变量，交给 processHtml 统一处理，确保
  // materializeCounterPseudoContent 等中间步骤能访问完整的 --wemd-* 变量声明
  return `${themeCss}\n${katexCss}`;
};

const renderMacSignDotsToImages = (container: HTMLElement): void => {
  container.querySelectorAll<HTMLElement>(".mac-sign").forEach((macSign) => {
    const dots = Array.from(macSign.querySelectorAll<HTMLElement>(".mac-dot"));
    if (dots.length === 0) return;

    try {
      const scale = 2;
      const dotMetrics = dots.map((dot) => ({
        color: dot.style.backgroundColor,
        height: Number.parseFloat(dot.style.height),
        marginRight: Number.parseFloat(dot.style.marginRight) || 0,
        marginTop: Number.parseFloat(dot.style.marginTop) || 0,
        width: Number.parseFloat(dot.style.width),
      }));
      const width = dotMetrics.reduce(
        (total, dot) => total + dot.width + dot.marginRight,
        0,
      );
      const height =
        Number.parseFloat(macSign.style.height) ||
        Math.max(...dotMetrics.map((dot) => dot.marginTop + dot.height));
      if (!width || !height || dotMetrics.some((dot) => !dot.color)) return;

      const canvas = document.createElement("canvas");
      canvas.width = width * scale;
      canvas.height = height * scale;
      const context = canvas.getContext("2d");
      if (!context) return;

      context.scale(scale, scale);
      let offsetX = 0;
      dotMetrics.forEach((dot) => {
        context.beginPath();
        context.arc(
          offsetX + dot.width / 2,
          dot.marginTop + dot.height / 2,
          Math.min(dot.width, dot.height) / 2,
          0,
          Math.PI * 2,
        );
        context.fillStyle = dot.color;
        context.fill();
        offsetX += dot.width + dot.marginRight;
      });

      const image = document.createElement("img");
      image.src = canvas.toDataURL("image/png");
      image.alt = "";
      image.width = width;
      image.height = height;
      image.style.display = "block";
      image.style.width = `${width}px`;
      image.style.height = `${height}px`;

      macSign.removeAttribute("aria-hidden");
      macSign.replaceChildren(image);
    } catch (error) {
      console.warn("Mac Bar PNG 绘制失败，保留 HTML 圆点", error);
    }
  });
};

const convertCheckboxesToEmoji = (html: string): string => {
  let result = html.replace(/<input[^>]*checked[^>]*>/gi, "✅&nbsp;");
  result = result.replace(
    /<input[^>]*type=["']checkbox["'][^>]*>/gi,
    "⬜&nbsp;",
  );
  return result;
};

const getRenderedPlainText = (container: HTMLElement): string => {
  const innerText = container.innerText;
  if (typeof innerText === "string" && innerText.trim().length > 0) {
    return innerText;
  }
  return container.textContent || "";
};

const createPublishContainer = (): HTMLElement => {
  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.top = "0";
  container.style.left = "0";
  container.style.width = "760px";
  container.style.opacity = "0";
  container.style.pointerEvents = "none";
  container.style.zIndex = "-1";
  container.style.contain = "layout style paint";
  // 强制亮色模式，防止暗色 UI 下 execCommand("copy") 序列化出亮色文字
  container.style.colorScheme = "light";
  container.style.color = "#000000";
  applyLightRootVars(container);
  document.body.appendChild(container);
  return container;
};

export async function buildWechatPublishHtml(
  markdown: string,
  css: string,
  options: WechatPublishHtmlOptions = {},
): Promise<WechatPublishHtmlResult> {
  const container = createPublishContainer();
  const cleanup = () => {
    if (container.parentNode) {
      container.parentNode.removeChild(container);
    }
  };

  try {
    const templates = getThemeTemplates(options.themeDefinition);
    const slotDefs = getThemeSlotDefs(options.themeDefinition);
    const parser = createMarkdownParser({
      mathRenderer: "katex",
      showMacBar: options.showMacBar === true,
      getTemplate: (componentId) => templates.get(componentId),
      getSlotDefs: (componentId) => slotDefs.get(componentId),
    });
    const rawHtml = parser.render(markdown);
    const themedCss = buildCopyCss(css);
    const sanitizedCss = stripCounterPseudoRules(themedCss);
    const sourceHtml = getPublishingPreference("linkToFootnote")
      ? convertLinksToFootnotes(rawHtml)
      : rawHtml;
    const materializedHtml = materializeCounterPseudoContent(
      sourceHtml,
      themedCss,
    );
    const styledHtml = processHtml(materializedHtml, sanitizedCss, true, true);
    const resolvedHtml = resolveInlineStyleVariablesForCopy(styledHtml, css);
    const finalHtml = convertCheckboxesToEmoji(resolvedHtml);

    container.innerHTML = finalHtml;
    const mathFallback = await renderHighRiskMathAsImages(container);
    stripHiddenMathMarkupForWechat(container);
    await renderMermaidBlocks(container);
    await renderTableBlocks(container, getPublishingPreference("tableWrap"));
    renderMacSignDotsToImages(container);
    normalizeCopyContainer(container);

    return {
      container,
      html: container.innerHTML,
      plainText: getRenderedPlainText(container),
      mathImageCount: mathFallback.imageCount,
      cleanup,
    };
  } catch (error) {
    cleanup();
    throw error;
  }
}
