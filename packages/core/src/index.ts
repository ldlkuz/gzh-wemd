export * from "./MarkdownParser";
export * from "./ThemeProcessor";
export * from "./themes";
export { renderTheme } from "./theme-renderer/index";
export type { RenderThemeOptions } from "./theme-renderer/index";
export { getVariantCss } from "./components/index";
export {
  builtInThemeDefinitions,
  getBuiltInThemeDefinition,
} from "./builtin-themes/index";
export type {
  ThemeDefinition,
  ThemeMeta,
  DesignTokens,
  ComponentStyleOverride,
  LayoutPreference,
} from "./theme-schema/types";
export {
  convertCssToWeChatDarkMode,
  convertToWeChatDarkMode,
} from "./wechatDarkMode";

// Theme Registry（Validator + Loader + 组件注册表）
export {
  validateThemePackageManifest,
  scanSvgSafety,
} from "./theme-registry/ThemeValidator";
export {
  loadThemePackageFromJSON,
  loadThemePackageFromZip,
  repackThemePackage,
} from "./theme-registry/themePackageLoader";
export type {
  LoadedThemePackage,
  LoaderResult,
  LoaderSuccess,
  LoaderFailure,
} from "./theme-registry/themePackageLoader";
export {
  LEGAL_COMPONENTS,
  LEGAL_COMPONENT_SET,
  BUILTIN_PRESET_VARIANTS,
  SUPPORTED_SDK_VERSIONS,
  LEGAL_DENSITY_VALUES,
} from "./theme-registry/componentRegistry";
export type { LegalComponent } from "./theme-registry/componentRegistry";
export type {
  ThemePackageManifest,
  ThemePackageAssets,
  ImageAsset,
  ValidationError,
  ValidationResult,
} from "./theme-schema/types";

// CSS 翻译引擎（AI 两阶段翻译系统）
export {
  ALL_COMPONENT_ELEMENTS,
  describeElementsForPhase1,
  describeMappingForPhase2,
  translateComponentCss,
  translateBatchCss,
  translateThemeFreeCss,
} from "./css-translator";

export type {
  ComponentElement,
  ComponentElementsDef,
  AiAdapter,
  TranslationInput,
  TranslationResult,
} from "./css-translator";
