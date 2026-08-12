/**
 * css-translator 入口
 *
 * 导出两阶段 CSS 翻译系统的所有公共 API
 */

export {
  ALL_COMPONENT_ELEMENTS,
  describeElementsForPhase1,
  describeMappingForPhase2,
} from "./componentElements";

export type {
  ComponentElement,
  ComponentElementsDef,
} from "./componentElements";

export {
  translateComponentCss,
  translateBatchCss,
  translateThemeFreeCss,
} from "./CssTranslator";

export type {
  AiAdapter,
  TranslationInput,
  TranslationResult,
} from "./CssTranslator";
