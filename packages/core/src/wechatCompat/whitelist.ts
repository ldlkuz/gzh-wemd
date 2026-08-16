/**
 * wechatCompat/whitelist —— 微信公众号兼容性规则的单一来源（Single Source of Truth）
 *
 * 所有"微信不支持 XX"的知识统一集中在此：
 *   - 伪元素 regex
 *   - 结构伪类 regex
 *   - 外链 regex
 *   - 禁止标签 regex
 *   - 微信禁用 CSS 属性规则（含提示与修复建议）
 *
 * 引用方（内联器 / ThemeValidator / themePackageLoader / 校验脚本）必须从此导入，
 * 禁止在各自文件中再复制一份规则，避免规则漂移。
 */

/** 微信会剥离的伪元素 */
export const PSEUDO_ELEMENT_REGEX =
  /::(before|after|marker|selection|first-letter|first-line|placeholder|backdrop|spelling-error|grammar-error)/i;

/** 微信不支持的 CSS 结构伪类，必须用具体 class 选择器替代 */
export const STRUCTURAL_PSEUDO_REGEX =
  /:(first-child|last-child|nth-child|nth-last-child|first-of-type|last-of-type|nth-of-type|nth-last-of-type|only-child|only-of-type|empty)\b/i;

/** 引用外部 http(s) 资源的 url(...)—— 微信公众号中会 404，禁止使用 */
export const EXTERNAL_LINK_REGEX = /url\s*\(\s*['"]?\s*https?:\/\//i;

/** variantCss / components.css 中禁止出现的标签 */
export const FORBIDDEN_TAG_REGEX = /<(style|script)\b/i;

/** CSS 中直接写 url(assets/...) —— 导出到公众号后必然 404 */
export const ZIP_ASSET_URL_REGEX =
  /url\s*\(\s*['"]?\s*assets\/[^'")\s]+['"]?\s*\)/i;

/** 统一的微信兼容规则（含稳定 id，供快照 / layer3 按 id 引用） */
export interface ForbiddenCssRule {
  /** 稳定标识。layer3 等消费方据此从快照重建，禁止再手抄正则 */
  id: string;
  regex: RegExp;
  message: string;
  fix: string;
}

/**
 * 全部微信兼容规则（12 条）= 5 个独立正则 + 7 条属性/at-rule 规则。
 * 单一真源：快照生成（generate-shared-snapshot.cjs）与 layer3 均基于此。
 */
export const FORBIDDEN_CSS_RULES: readonly ForbiddenCssRule[] = [
  {
    id: "pseudo-element",
    regex: PSEUDO_ELEMENT_REGEX,
    message: "微信会剥离伪元素，装饰会静默丢失。",
    fix: "删除或改用真实 <span> 子元素。",
  },
  {
    id: "structural-pseudo",
    regex: STRUCTURAL_PSEUDO_REGEX,
    message: "结构伪类在微信中支持不稳定，必须改用具体 class 选择器。",
    fix: "改用具体 class 选择器（骨架已物化 wemd-{abbr}-{name}）。",
  },
  {
    id: "external-link",
    regex: EXTERNAL_LINK_REGEX,
    message: "外部 url(http(s)://) 在公众号中会 404，禁止使用。",
    fix: "内联为 data: URI。",
  },
  {
    id: "forbidden-tag",
    regex: FORBIDDEN_TAG_REGEX,
    message: "样式/脚本标签不允许出现，CSS 产物只能含纯样式规则。",
    fix: "移除 <style>/<script> 标签。",
  },
  {
    id: "zip-asset",
    regex: ZIP_ASSET_URL_REGEX,
    message: "CSS 中直接写 assets/ 路径导出后会 404。",
    fix: "用 var(--wemd-asset-<key>) 或内联 data:。",
  },
  {
    id: "position-fixed",
    regex: /position\s*:\s*fixed/i,
    message: "position:fixed 在微信公众号中不支持，会被静默丢弃",
    fix: "移除 position:fixed，或改用 position:relative",
  },
  {
    id: "position-sticky",
    regex: /position\s*:\s*sticky/i,
    message: "position:sticky 在微信公众号中不支持，会被静默丢弃",
    fix: "移除 position:sticky，或改用 position:relative",
  },
  {
    id: "keyframes",
    regex: /@keyframes\b/i,
    message: "@keyframes 在微信公众号中不支持，动画会被丢弃",
    fix: "移除 @keyframes 及对应的 animation 属性",
  },
  {
    id: "animation",
    regex: /animation\s*:/i,
    message: "animation 属性在微信公众号中不支持，动画不会播放",
    fix: "移除 animation 属性",
  },
  {
    id: "backdrop-filter",
    regex: /backdrop-filter\s*:/i,
    message: "backdrop-filter 在微信公众号中不支持，毛玻璃效果会丢失",
    fix: "移除 backdrop-filter，改用 background:rgba() 模拟半透明效果",
  },
  {
    id: "filter",
    regex: /filter\s*:/i,
    message: "filter 在微信公众号中支持有限，可能被丢弃",
    fix: "移除 filter，如需模糊效果请用 SVG 滤镜替代",
  },
  {
    id: "mix-blend-mode",
    regex: /mix-blend-mode\s*:/i,
    message: "mix-blend-mode 在微信公众号中不支持",
    fix: "移除 mix-blend-mode 属性",
  },
];

/** 兼容原有导出的纯属性规则（id 非前 5 个命名正则，即属性/at-rule 类）。 */
const NAMED_RULE_IDS = new Set([
  "pseudo-element",
  "structural-pseudo",
  "external-link",
  "forbidden-tag",
  "zip-asset",
]);
export const FORBIDDEN_CSS_PATTERNS: readonly ForbiddenCssRule[] =
  FORBIDDEN_CSS_RULES.filter((r) => !NAMED_RULE_IDS.has(r.id));
