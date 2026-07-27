/**
 * Template 模块导出
 */

export { renderTemplate, validateTemplate } from "./renderer";
export {
  splitParagraphs,
  extractParagraphs,
  calculateCoverage,
  getParagraphCount,
} from "./contentExtractor";
export {
  componentRenderers,
  hasRenderer,
  stringifyProps,
  wrapComponent,
} from "./componentRenderers";
export { generateTemplate } from "./templateAgent";
export { buildTemplatePrompt } from "./templatePrompt";
export {
  COMPONENT_CONTENT_SCHEMAS,
  getComponentSchema,
  AI_GENERATABLE_COMPONENTS,
} from "./componentSchemas";

export type {
  TemplateJSON,
  LayoutNode,
  RenderResult,
  ArticleSectionContent,
  HeroBannerContent,
  TocNavContent,
  NumberedHeadingContent,
  SectionTitleContent,
  QuoteCardContent,
  StatsBlockContent,
  CalloutProContent,
  ShareCardContent,
  FollowBarContent,
  FaqContent,
  DividerFancyContent,
  StyledTableContent,
  CodeFrameContent,
  MagazineCoverContent,
  SectionDividerContent,
  ImageCardContent,
  TextCardContent,
  FullQuoteContent,
  TwoColumnCardsContent,
  EndCardContent,
} from "./types";
export type { TemplateGenerationResult } from "./templateAgent";
export type { ComponentContentSchema } from "./componentSchemas";
