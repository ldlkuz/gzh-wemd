/**
 * 东方笺谱 · 主题骨架模板（仅写该主题真正不同的组件）
 *
 * 复用约定：divider 多色块 / divider-fancy 印章等公共结构来自 template-library，
 * 此处只传参（印章字"笺"）与声明用哪套公共模板；颜色交给 components-eastern-notes.ts。
 * 未在此声明的组件自动回退到内置默认骨架（defaultTemplates.ts）。
 */
import {
  dividerMultiColor,
  dividerFancySeal,
  sectionDividerDualLine,
  ctaCardSealFoot,
  calloutProFoot,
  endCardSeal,
  quoteCardDualDot,
  pullquoteCorners,
  magazineCoverSeal,
} from "./template-library";

export const easternNotesTemplates: Record<string, string> = {
  divider: dividerMultiColor(),
  "divider-fancy": dividerFancySeal("笺"),
  "section-divider": sectionDividerDualLine(),
  "cta-card": ctaCardSealFoot(),
  "callout-pro": calloutProFoot(),
  "end-card": endCardSeal("笺"),
  "quote-card": quoteCardDualDot(),
  pullquote: pullquoteCorners(),
  "magazine-cover": magazineCoverSeal(),
};
