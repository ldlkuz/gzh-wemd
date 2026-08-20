/**
 * ThemeValidator —— 严格校验主题包 manifest 是否符合规范
 *
 * 纯函数，无 DOM 副作用，可被 core/检测网页/Skill 文档生成脚本复用。
 *
 * 9 个校验点（见开发计划 Phase 1）：
 *   1. 顶层 sdkVersion
 *   2. meta
 *   3. tokens.color
 *   4. tokens.typography
 *   5. tokens.spacing/border/shadow
 *   6. components 对象（含 variantCss 安全扫描）
 *   7. layout
 *   8. assets.images
 *   9. 未知字段
 */

import type {
  ThemePackageManifest,
  ValidationError,
  ValidationResult,
} from "../theme-schema/types";
import type { ColorTokens } from "../theme-schema/types";
import {
  LEGAL_COMPONENT_SET,
  LEGAL_DENSITY_VALUES,
  SUPPORTED_SDK_VERSIONS,
} from "./componentRegistry";
import {
  STRUCTURAL_PSEUDO_REGEX,
  EXTERNAL_LINK_REGEX,
  FORBIDDEN_TAG_REGEX,
  ZIP_ASSET_URL_REGEX,
  FORBIDDEN_CSS_PATTERNS,
  findForbiddenPseudoElement,
  stripCssComments,
} from "../wechatCompat/whitelist";

// ============================================================
// Helpers
// ============================================================

const SEMVER_REGEX = /^\d+\.\d+\.\d+(-[a-zA-Z0-9.]+)?(\+[a-zA-Z0-9.]+)?$/;

const CSS_COLOR_REGEX =
  /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$|^(rgb|rgba|hsl|hsla)\(|^[a-z]+$/i;

const CSS_SIZE_REGEX =
  /^\d+(\.\d+)?(px|em|rem|%|vh|vw|pt|cm|mm|ch|ex|vmin|vmax)$/;

/** SVG 恶意内容扫描规则 */
const SVG_FORBIDDEN_PATTERNS: Array<{
  regex: RegExp;
  message: string;
  fix: string;
}> = [
  {
    regex: /<script\b/i,
    message: "SVG 中包含 <script>，存在脚本注入风险，微信公众平台审核不通过",
    fix: "移除 <script> 标签，SVG 仅保留 <path>/<circle>/<rect> 等纯矢量图元",
  },
  {
    regex: /<foreignObject\b/i,
    message: "SVG 中包含 <foreignObject>，可嵌入 HTML/脚本执行，存在安全风险",
    fix: "移除 <foreignObject>，改用纯矢量图元绘制",
  },
  {
    regex: /\son[a-z]+\s*=/i,
    message:
      "SVG 中包含 onload/onclick 等事件属性，会触发脚本执行，公众号环境会被禁用",
    fix: "移除所有 on*= 事件属性，仅保留 svg/path/g/rect/circle 等静态属性",
  },
  {
    regex: /(xlink:)?href\s*=\s*["']\s*javascript:/i,
    message: "SVG 中包含 javascript: 伪协议链接，存在脚本执行风险",
    fix: "移除 javascript: href，需要链接在 Markdown 里加，不要放在 SVG 内",
  },
  {
    regex: /<!ENTITY\b/i,
    message: "SVG 中包含 <!ENTITY> 外部实体声明，存在 XXE 注入风险",
    fix: "导出 SVG 时使用标准 Web 预设（不含 DTD/实体），或用 SVGOMG 清理后再用",
  },
  {
    regex: /@import\s+url\s*\(\s*["']?\s*https?:\/\//i,
    message:
      "SVG 中通过 @import url(http...) 引用外部资源，公众号中 404 且审核存疑",
    fix: "将外部样式内联到 SVG 中，或完全使用内联属性 style= 替代",
  },
];

/** 伪位图 SVG：里面嵌了 <image> + base64 / 外部 href，实质是位图伪装成矢量，体积大且不清晰 */
const SVG_EMBEDDED_IMAGE_REGEX = /<image\b[^>]*\bhref\s*=\s*["']([^"']+)["']/i;

/** 必须是合法 CSS 颜色（hex/rgb/rgba/hsl/hsla/颜色名） */
function isValidCssColor(value: unknown): boolean {
  if (typeof value !== "string" || !value.trim()) return false;
  return CSS_COLOR_REGEX.test(value.trim());
}

/** 必须是数字 */
function isValidNumber(value: unknown): boolean {
  return typeof value === "number" && Number.isFinite(value);
}

/** 必须是字符串 */
function isValidNonEmptyString(value: unknown): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

/** 必须是布尔值 */
function isValidBoolean(value: unknown): boolean {
  return typeof value === "boolean";
}

/** 必须是字符串数组 */
function isValidStringArray(value: unknown): boolean {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every((v) => typeof v === "string")
  );
}

/** 必须是合法语义化版本 */
function isValidSemver(value: unknown): boolean {
  return typeof value === "string" && SEMVER_REGEX.test(value);
}

/** 扫描 variantCss 内容中的安全与兼容性问题 */
function scanVariantCss(css: string, path: string): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!css || typeof css !== "string") return errors;

  // 检查伪元素（注释感知 + 中和感知：纯 content: none 中和规则放行，
  // 与内置主题 #wemd .wemd-xxx::before { content: none } 的处理一致）
  const forbiddenPseudo = findForbiddenPseudoElement(css);
  if (forbiddenPseudo) {
    errors.push({
      path: `${path}`,
      message: `variantCss 包含禁用的伪元素 ${forbiddenPseudo}。微信公众号不支持伪元素，复制到公众号后样式会静默丢失`,
      fix: "移除伪元素 ::before/::after，改用额外的 HTML 元素或 background-image 实现",
    });
  }

  // 检查结构伪类（先剥离注释，避免注释中的关键词误报）
  const noComments = stripCssComments(css);
  if (STRUCTURAL_PSEUDO_REGEX.test(noComments)) {
    const match = noComments.match(STRUCTURAL_PSEUDO_REGEX);
    errors.push({
      path: `${path}`,
      message: `variantCss 包含禁用的结构伪类 ${match?.[0] ?? ":nth-child"}。微信公众号不支持，请用 class 选择器替代`,
      fix: `移除 ${match?.[0] ?? ":nth-child"}，改用具体的 class 选择器`,
    });
  }

  // 检查外链（先剥离注释）
  if (EXTERNAL_LINK_REGEX.test(noComments)) {
    errors.push({
      path: `${path}`,
      message: "variantCss 包含外链 url(http...)，禁止引用外部资源",
      fix: "将外部资源内联为 data: URI，或移除引用",
    });
  }

  // 检查 zip 路径直接写进 CSS —— 导出到公众号后一定 404
  if (ZIP_ASSET_URL_REGEX.test(css)) {
    const match = css.match(ZIP_ASSET_URL_REGEX);
    errors.push({
      path: `${path}`,
      message: `variantCss 中直接写了 zip 路径 ${match?.[0] ?? "url(assets/...)"}，公众号内 404`,
      fix: '两种正确写法：① 将资源直接内联为 url("data:image/svg+xml;utf8,...")（适合小装饰）；② 在 manifest.assets.images 注册资源 key，然后用 var(--wemd-asset-<key>) 引用，例如 manifest 里 key="logo" 则 CSS 写 var(--wemd-asset-logo)',
    });
  }

  // 检查禁止的标签
  if (FORBIDDEN_TAG_REGEX.test(css)) {
    errors.push({
      path: `${path}`,
      message: "variantCss 包含禁止的 <style> 或 <script> 标签",
      fix: "移除 <style>/<script> 标签，variantCss 只能包含纯 CSS 规则",
    });
  }

  // 检查微信不支持的 CSS 属性
  for (const { regex, message, fix } of FORBIDDEN_CSS_PATTERNS) {
    if (regex.test(css)) {
      const match = css.match(regex);
      errors.push({
        path: `${path}`,
        message: `${message}（匹配到: ${match?.[0] ?? ""}）`,
        fix,
      });
    }
  }

  // 检查选择器前缀：CSS 中至少存在一个 .wemd-xxx[data-variant="yyy"] 格式的选择器
  // 注意：用 match 而非 ^ 开头正则，因为 variantCss 常为多行模板，开头可能有空白/注释
  const hasValidSelector =
    css.match(/\.wemd-[a-z][\w-]*\[data-variant\s*=\s*["'][^"']+["']\s*\]/) !==
    null;
  if (!hasValidSelector) {
    errors.push({
      path: `${path}`,
      message:
        'variantCss 选择器必须至少包含一个 .wemd-xxx[data-variant="yyy"] 格式的选择器，确保样式作用域正确',
      fix: '将选择器改为 .wemd-组件名[data-variant="变体名"] 格式，例如 .wemd-share-card[data-variant="my-style"]',
    });
  }

  return errors;
}

// ============================================================
// 校验函数
// ============================================================

/** 校验点 1: 顶层 sdkVersion */
function validateSdkVersion(input: Record<string, unknown>): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!("sdkVersion" in input) || typeof input.sdkVersion !== "string") {
    errors.push({
      path: "/sdkVersion",
      message: "sdkVersion 必填且必须是字符串",
      expected: SUPPORTED_SDK_VERSIONS.join(" 或 "),
    });
  } else if (!isValidSemver(input.sdkVersion)) {
    errors.push({
      path: "/sdkVersion",
      message: `sdkVersion 格式非法: "${input.sdkVersion}"，必须是语义化版本（如 1.0.0）`,
      expected: "语义化版本，如 1.0.0",
    });
  } else if (
    !SUPPORTED_SDK_VERSIONS.includes(
      input.sdkVersion as (typeof SUPPORTED_SDK_VERSIONS)[number],
    )
  ) {
    errors.push({
      path: "/sdkVersion",
      message: `Theme System 版本不匹配，当前支持 ${SUPPORTED_SDK_VERSIONS.join(", ")}，主题声明 ${input.sdkVersion}`,
      expected: SUPPORTED_SDK_VERSIONS.join(" 或 "),
    });
  }

  return errors;
}

/** 校验点 2: meta */
function validateMeta(meta: unknown): ValidationError[] {
  const errors: ValidationError[] = [];
  const basePath = "/meta";

  if (!meta || typeof meta !== "object") {
    errors.push({ path: basePath, message: "meta 必填" });
    return errors;
  }

  const m = meta as Record<string, unknown>;

  if (!isValidNonEmptyString(m.id)) {
    errors.push({
      path: `${basePath}/id`,
      message: "meta.id 必填且不能为空字符串",
    });
  }
  if (!isValidNonEmptyString(m.name)) {
    errors.push({
      path: `${basePath}/name`,
      message: "meta.name 必填且不能为空字符串",
    });
  }
  if (!isValidNonEmptyString(m.description)) {
    errors.push({
      path: `${basePath}/description`,
      message: "meta.description 必填且不能为空字符串",
    });
  }
  if (!isValidStringArray(m.keywords)) {
    errors.push({
      path: `${basePath}/keywords`,
      message: "meta.keywords 必填且必须是非空字符串数组",
    });
  }
  if (!isValidSemver(m.version)) {
    errors.push({
      path: `${basePath}/version`,
      message: `meta.version 必填且必须是语义化版本，当前值: "${String(m.version)}"`,
      expected: "语义化版本，如 1.0.0",
    });
  }

  return errors;
}

/** 校验点 3: tokens.color */
function validateColorTokens(tokens: unknown): ValidationError[] {
  const errors: ValidationError[] = [];
  const basePath = "/tokens/color";

  if (!tokens || typeof tokens !== "object") {
    errors.push({ path: basePath, message: "tokens.color 必填" });
    return errors;
  }

  const t = tokens as Record<string, unknown>;
  const color = t.color as Record<string, unknown> | undefined;

  if (!color || typeof color !== "object") {
    errors.push({ path: basePath, message: "tokens.color 必填" });
    return errors;
  }

  const colorFields: Array<keyof ColorTokens> = [
    "primary",
    "primaryDark",
    "primaryLight",
    "secondary",
    "accent",
    "background",
    "bgSoft",
    "bgCard",
    "bgMuted",
    "textStrong",
    "textNormal",
    "textSoft",
    "border",
    "borderSoft",
  ];

  for (const field of colorFields) {
    const val = color[field];
    if (val === undefined || val === null) {
      errors.push({
        path: `${basePath}/${field}`,
        message: `tokens.color.${field} 必填`,
      });
    } else if (!isValidCssColor(val)) {
      errors.push({
        path: `${basePath}/${field}`,
        message: `tokens.color.${field} 值 "${String(val)}" 不是合法 CSS 颜色`,
        expected: "合法 CSS 颜色（hex/rgb/rgba/hsl/hsla/颜色名）",
      });
    }
  }

  return errors;
}

/** 校验点 4: tokens.typography */
function validateTypographyTokens(tokens: unknown): ValidationError[] {
  const errors: ValidationError[] = [];
  const basePath = "/tokens/typography";

  if (!tokens || typeof tokens !== "object") {
    errors.push({ path: basePath, message: "tokens.typography 必填" });
    return errors;
  }

  const t = tokens as Record<string, unknown>;
  const typo = t.typography as Record<string, unknown> | undefined;

  if (!typo || typeof typo !== "object") {
    errors.push({ path: basePath, message: "tokens.typography 必填" });
    return errors;
  }

  // 基础字段
  if (!isValidNonEmptyString(typo.fontFamily)) {
    errors.push({
      path: `${basePath}/fontFamily`,
      message: "typography.fontFamily 必填且不能为空",
    });
  }
  if (
    !isValidNonEmptyString(typo.fontSize) ||
    !CSS_SIZE_REGEX.test(String(typo.fontSize))
  ) {
    errors.push({
      path: `${basePath}/fontSize`,
      message: `typography.fontSize 必填且必须是带单位的字符串（如 "16px"），当前值: "${String(typo.fontSize)}"`,
    });
  }
  if (!isValidNonEmptyString(typo.lineHeight)) {
    errors.push({
      path: `${basePath}/lineHeight`,
      message: "typography.lineHeight 必填且不能为空",
    });
  }
  if (!isValidNumber(typo.letterSpacing)) {
    errors.push({
      path: `${basePath}/letterSpacing`,
      message: `typography.letterSpacing 必填且必须是数字，当前值: ${String(typo.letterSpacing)}`,
    });
  }

  // heading h1-h4
  const heading = typo.heading as Record<string, unknown> | undefined;
  if (!heading || typeof heading !== "object") {
    errors.push({
      path: `${basePath}/heading`,
      message: "typography.heading 必填",
    });
    return errors;
  }

  for (const h of ["h1", "h2", "h3", "h4"]) {
    const hObj = heading[h] as Record<string, unknown> | undefined;
    if (!hObj || typeof hObj !== "object") {
      errors.push({
        path: `${basePath}/heading/${h}`,
        message: `typography.heading.${h} 必填`,
      });
      continue;
    }
    if (!isValidNumber(hObj.fontSize)) {
      errors.push({
        path: `${basePath}/heading/${h}/fontSize`,
        message: `typography.heading.${h}.fontSize 必填且必须是数字`,
      });
    }
    if (!isValidNonEmptyString(hObj.color)) {
      errors.push({
        path: `${basePath}/heading/${h}/color`,
        message: `typography.heading.${h}.color 必填且不能为空`,
      });
    }
    if (!isValidNumber(hObj.marginTop)) {
      errors.push({
        path: `${basePath}/heading/${h}/marginTop`,
        message: `typography.heading.${h}.marginTop 必填且必须是数字`,
      });
    }
    if (!isValidNumber(hObj.marginBottom)) {
      errors.push({
        path: `${basePath}/heading/${h}/marginBottom`,
        message: `typography.heading.${h}.marginBottom 必填且必须是数字`,
      });
    }
    if (!isValidNonEmptyString(hObj.fontWeight)) {
      errors.push({
        path: `${basePath}/heading/${h}/fontWeight`,
        message: `typography.heading.${h}.fontWeight 必填且不能为空`,
      });
    }
  }

  return errors;
}

/** 校验点 5: tokens.spacing/border/shadow */
function validateLayoutTokens(tokens: unknown): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!tokens || typeof tokens !== "object") return errors;

  const t = tokens as Record<string, unknown>;

  // spacing
  const spacing = t.spacing as Record<string, unknown> | undefined;
  if (!spacing || typeof spacing !== "object") {
    errors.push({ path: "/tokens/spacing", message: "tokens.spacing 必填" });
  } else {
    if (!isValidNumber(spacing.pagePadding)) {
      errors.push({
        path: "/tokens/spacing/pagePadding",
        message: "spacing.pagePadding 必填且必须是数字",
      });
    }
    if (!isValidNumber(spacing.paragraphMargin)) {
      errors.push({
        path: "/tokens/spacing/paragraphMargin",
        message: "spacing.paragraphMargin 必填且必须是数字",
      });
    }
  }

  // border
  const border = t.border as Record<string, unknown> | undefined;
  if (!border || typeof border !== "object") {
    errors.push({ path: "/tokens/border", message: "tokens.border 必填" });
  } else {
    if (!isValidNumber(border.radius)) {
      errors.push({
        path: "/tokens/border/radius",
        message: "border.radius 必填且必须是数字",
      });
    }
  }

  // shadow
  const shadow = t.shadow as Record<string, unknown> | undefined;
  if (!shadow || typeof shadow !== "object") {
    errors.push({ path: "/tokens/shadow", message: "tokens.shadow 必填" });
  } else {
    if (!isValidBoolean(shadow.enabled)) {
      errors.push({
        path: "/tokens/shadow/enabled",
        message: "shadow.enabled 必填且必须是布尔值",
      });
    }
    if (!isValidNonEmptyString(shadow.value)) {
      errors.push({
        path: "/tokens/shadow/value",
        message: "shadow.value 必填且不能为空",
      });
    }
  }

  return errors;
}

/** 校验点 6: components 对象 */
function validateComponents(components: unknown): ValidationError[] {
  const errors: ValidationError[] = [];
  const basePath = "/components";

  if (components === undefined || components === null) return errors;

  if (typeof components !== "object" || Array.isArray(components)) {
    errors.push({ path: basePath, message: "components 必须是对象" });
    return errors;
  }

  const comps = components as Record<string, unknown>;

  for (const [key, value] of Object.entries(comps)) {
    const compPath = `${basePath}/${key}`;

    if (!LEGAL_COMPONENT_SET.has(key)) {
      errors.push({
        path: compPath,
        message: `"${key}" 不是合法组件类型。合法组件列表见 componentRegistry.ts 的 LEGAL_COMPONENTS`,
      });
      continue;
    }

    if (!value || typeof value !== "object") {
      errors.push({ path: compPath, message: "组件配置必须是对象" });
      continue;
    }

    const comp = value as Record<string, unknown>;

    // enabled 必填布尔
    if (!isValidBoolean(comp.enabled)) {
      errors.push({
        path: `${compPath}/enabled`,
        message: `components.${key}.enabled 必填且必须是布尔值，当前值: ${String(comp.enabled)}`,
      });
    }

    // variant 存在时必须配套 variantCss（AI 主题不依赖预设）
    const hasVariant =
      comp.variant !== undefined &&
      comp.variant !== null &&
      comp.variant !== "";
    const hasVariantCss =
      comp.variantCss !== undefined &&
      comp.variantCss !== null &&
      String(comp.variantCss).trim() !== "";

    if (hasVariant && !hasVariantCss) {
      errors.push({
        path: `${compPath}/variant`,
        message: `AI 主题的 variant "${String(comp.variant)}" 缺少配套的 variantCss 字段（AI 主题不依赖预设，必须提供造型 CSS）`,
      });
    }

    // variantCss 安全扫描
    if (hasVariantCss) {
      const css = String(comp.variantCss);
      if (css.length > 50 * 1024) {
        errors.push({
          path: `${compPath}/variantCss`,
          message: `variantCss 字符串长度 ${css.length} 超过 50KB 限制，可能拖慢渲染`,
        });
      }
      errors.push(...scanVariantCss(css, `${compPath}/variantCss`));
    }

    // overrides 类型检查
    if (comp.overrides !== undefined) {
      if (typeof comp.overrides !== "object" || Array.isArray(comp.overrides)) {
        errors.push({
          path: `${compPath}/overrides`,
          message: "overrides 必须是 Record<string, string> 对象",
        });
      } else {
        const overrides = comp.overrides as Record<string, unknown>;
        for (const [prop, val] of Object.entries(overrides)) {
          if (typeof val !== "string") {
            errors.push({
              path: `${compPath}/overrides/${prop}`,
              message: `overrides.${prop} 的值必须是字符串，当前类型: ${typeof val}`,
            });
          }
        }
      }
    }
  }

  return errors;
}

// ============================================================
// 校验点 6b: 引用完整性 — variantCss 中的 var(--xxx) 必须在 tokens 中定义
// ============================================================

const CSS_VAR_USAGE_REGEX = /var\(\s*--([\w-]+)\s*(?:,|\))/g;

/** 驼峰转 kebab-case（如 bgCard → bg-card） */
function toKebabCase(s: string): string {
  return s.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
}

/**
 * 提取 tokens 中定义的所有 CSS 变量名
 *
 * 与主程序 tokenCss.ts 的命名规则保持一致，生成 `wemd-*` 格式的变量名：
 *   - color.primary → wemd-primary
 *   - color.bgCard → wemd-bg-card
 *   - color.primaryDark → wemd-primary-dark
 *   - typography.fontSize → wemd-font-size
 *   - typography.heading.h1.fontSize → wemd-h1-font-size
 *   - spacing.pagePadding → wemd-page-padding
 *   - border.radius → wemd-border-radius
 *   - shadow (enabled) → wemd-shadow
 *   - 主色派生半透明色 → wemd-primary-alpha-{2,4,6,8,25}
 */
function extractDefinedVars(tokens: unknown): Set<string> {
  const defined = new Set<string>();
  if (!tokens || typeof tokens !== "object") return defined;
  const t = tokens as Record<string, unknown>;

  // color.* → wemd-*
  const color = t.color as Record<string, unknown> | undefined;
  if (color && typeof color === "object") {
    for (const [key, val] of Object.entries(color)) {
      if (val !== null && typeof val !== "object") {
        defined.add(`wemd-${toKebabCase(key)}`);
      }
    }
    // 主色派生半透明色（tokenCss.ts 中自动生成）
    if (typeof color.primary === "string" && /^#/.test(color.primary)) {
      ["2", "4", "6", "8", "25"].forEach((a) =>
        defined.add(`wemd-primary-alpha-${a}`),
      );
    }
  }

  // typography.* → wemd-*
  const typo = t.typography as Record<string, unknown> | undefined;
  if (typo && typeof typo === "object") {
    if (typeof typo.fontSize === "string") defined.add("wemd-font-size");
    if (typeof typo.lineHeight === "string") defined.add("wemd-line-height");
    if (typeof typo.letterSpacing === "number")
      defined.add("wemd-letter-spacing");

    const heading = typo.heading as Record<string, unknown> | undefined;
    if (heading && typeof heading === "object") {
      for (const h of ["h1", "h2", "h3", "h4"]) {
        const hObj = heading[h] as Record<string, unknown> | undefined;
        if (hObj && typeof hObj === "object") {
          defined.add(`wemd-${h}-font-size`);
          defined.add(`wemd-${h}-color`);
          defined.add(`wemd-${h}-margin-top`);
          defined.add(`wemd-${h}-margin-bottom`);
          defined.add(`wemd-${h}-font-weight`);
        }
      }
    }
  }

  // spacing.* → wemd-*
  const spacing = t.spacing as Record<string, unknown> | undefined;
  if (spacing && typeof spacing === "object") {
    if (typeof spacing.pagePadding === "number")
      defined.add("wemd-page-padding");
    if (typeof spacing.paragraphMargin === "number")
      defined.add("wemd-paragraph-margin");
  }

  // border.* → wemd-*
  const border = t.border as Record<string, unknown> | undefined;
  if (border && typeof border === "object") {
    if (typeof border.radius === "number") defined.add("wemd-border-radius");
  }

  // shadow.* → wemd-*
  const shadow = t.shadow as Record<string, unknown> | undefined;
  if (shadow && typeof shadow === "object") {
    if (shadow.enabled === true && typeof shadow.value === "string") {
      defined.add("wemd-shadow");
    }
  }

  return defined;
}

/** 提取 variantCss 中所有 var(--xxx) 引用的变量名 */
function extractUsedVars(css: string): Set<string> {
  const used = new Set<string>();
  let match: RegExpExecArray | null;
  CSS_VAR_USAGE_REGEX.lastIndex = 0;
  while ((match = CSS_VAR_USAGE_REGEX.exec(css)) !== null) {
    used.add(match[1]);
  }
  return used;
}

/**
 * 校验引用完整性 — variantCss 中的 var(--wemd-xxx) 必须在 tokens 中定义
 *
 * 注意：tokens 中的变量是主程序预定义的，AI 主题的 variantCss 可以选择性地引用
 * 它们（不必全部引用），因此不检查"孤立变量"。
 */
function validateReferenceIntegrity(
  components: unknown,
  tokens: unknown,
): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!components || typeof components !== "object") return errors;
  if (!tokens || typeof tokens !== "object") return errors;

  const definedVars = extractDefinedVars(tokens);
  const comps = components as Record<string, unknown>;

  for (const [key, value] of Object.entries(comps)) {
    if (!value || typeof value !== "object") continue;
    const comp = value as Record<string, unknown>;
    const variantCss = comp.variantCss;
    if (typeof variantCss !== "string" || !variantCss.trim()) continue;

    const usedVars = extractUsedVars(variantCss);
    for (const v of usedVars) {
      // wemd-asset-* 前缀的变量是由 assets.images 动态注入的（由 tokenCss.ts 生成），不在 tokens 静态列表中
      if (v.startsWith("wemd-asset-")) continue;
      if (!definedVars.has(v)) {
        errors.push({
          path: `/components/${key}/variantCss`,
          message: `引用了未定义的 CSS 变量 var(--${v})，该变量不在 tokens 派生的变量集中`,
          fix: `检查变量名拼写，或在 tokens 中补充对应字段；主程序变量命名规则见 tokenCss.ts`,
        });
      }
    }
  }

  return errors;
}

/** 校验点 7: layout */
function validateLayout(layout: unknown): ValidationError[] {
  const errors: ValidationError[] = [];
  const basePath = "/layout";

  if (!layout || typeof layout !== "object") {
    errors.push({ path: basePath, message: "layout 必填" });
    return errors;
  }

  const l = layout as Record<string, unknown>;

  // preferredComponents
  if (!Array.isArray(l.preferredComponents)) {
    errors.push({
      path: `${basePath}/preferredComponents`,
      message: "preferredComponents 必填且必须是数组",
    });
  } else {
    for (let i = 0; i < l.preferredComponents.length; i++) {
      const item = l.preferredComponents[i];
      const itemPath = `${basePath}/preferredComponents/${i}`;

      if (typeof item === "string") {
        if (!LEGAL_COMPONENT_SET.has(item)) {
          errors.push({
            path: itemPath,
            message: `preferredComponents[${i}] "${item}" 不是合法组件类型`,
          });
        }
      } else if (item && typeof item === "object" && !Array.isArray(item)) {
        const obj = item as Record<string, unknown>;
        if (
          typeof obj.name !== "string" ||
          !LEGAL_COMPONENT_SET.has(obj.name)
        ) {
          errors.push({
            path: `${itemPath}/name`,
            message: `preferredComponents[${i}].name "${String(obj.name)}" 不是合法组件类型`,
          });
        }
        if (
          obj.reason !== undefined &&
          (typeof obj.reason !== "string" || (obj.reason as string).length > 50)
        ) {
          errors.push({
            path: `${itemPath}/reason`,
            message: `preferredComponents[${i}].reason 必须 ≤50 字，当前 ${typeof obj.reason === "string" ? (obj.reason as string).length : 0} 字`,
          });
        }
      } else {
        errors.push({
          path: itemPath,
          message: `preferredComponents[${i}] 必须是字符串或 {name, reason?} 对象`,
        });
      }
    }
  }

  // density
  if (
    typeof l.density !== "string" ||
    !LEGAL_DENSITY_VALUES.includes(
      l.density as (typeof LEGAL_DENSITY_VALUES)[number],
    )
  ) {
    errors.push({
      path: `${basePath}/density`,
      message: `density 必须是 low/medium/high 之一，当前值: "${String(l.density)}"`,
    });
  }

  // tone
  if (!Array.isArray(l.tone) || l.tone.length === 0) {
    errors.push({
      path: `${basePath}/tone`,
      message: "tone 必填且必须是非空数组",
    });
  }

  return errors;
}

// ============================================================
// SVG 安全扫描（用于 assets.images / variantCss 内联 SVG / zip 独立 SVG）
// ============================================================

/**
 * 扫描 SVG 内容中的安全问题。
 *
 * 三种场景都走这里：
 *   1. manifest.assets.images[i].src 是 data:image/svg+xml;base64,... / data:image/svg+xml;utf8,...
 *   2. variantCss / styles/*.css 中内联的 url(data:image/svg+xml;utf8,...)
 *   3. zip 内 assets/images/xxx.svg 独立文件（loader 解压后传文本进来）
 */
export function scanSvgSafety(
  svgText: string,
  path: string,
): ValidationError[] {
  const errors: ValidationError[] = [];
  if (!svgText || typeof svgText !== "string") return errors;

  for (const { regex, message, fix } of SVG_FORBIDDEN_PATTERNS) {
    if (regex.test(svgText)) {
      const match = svgText.match(regex);
      errors.push({
        path: `${path}`,
        severity: "warning",
        message: `${message}（匹配到: ${(match?.[0] ?? "").slice(0, 80)}）。资源问题不阻断导入，仅该资源可能不显示`,
        fix,
      });
    }
  }

  // 伪位图 SVG：<image href="data:..."> 或 <image href="http...">
  const embeddedImage = svgText.match(SVG_EMBEDDED_IMAGE_REGEX);
  if (embeddedImage) {
    const href = embeddedImage[1] ?? "";
    const isExternal = /^https?:/i.test(href);
    errors.push({
      path: `${path}`,
      severity: "warning",
      message: isExternal
        ? 'SVG 中包含 <image href="http..."> 外链位图，公众号中 404 且审核存疑'
        : "SVG 中包含 <image> 嵌入位图，不是纯矢量；体积较大且放大不清晰，建议重新导出为纯矢量或直接提供 PNG 原图",
      fix: isExternal
        ? "移除 <image> 外部链接，纯矢量导出，或把位图放进主题包 assets/images/ 并在 CSS 中用 var(--wemd-asset-xxx) 引用"
        : "用矢量图元重绘 Logo/装饰图形；或保留位图但直接用 PNG 并放 manifest.assets",
    });
  }

  return errors;
}

/** 从 data URL 中解析出纯文本内容，用于扫描内联 SVG */
function tryDecodeDataUrl(src: string): { mime: string; text: string } | null {
  if (!src.startsWith("data:")) return null;
  // data:[<mime>][;base64],<body>  — 允许 mime 里含分号参数（如 ;utf8 或 ;charset=utf-8）
  const m = src.match(/^data:([^,]*?)(?:,(.*))?$/is);
  if (!m) return null;
  const header = m[1] ?? "";
  const payload = m[2] ?? "";
  const isB64 = /;base64$/i.test(header);
  const mime = header.split(";")[0] ?? "";
  try {
    const decoded = isB64
      ? typeof atob === "function"
        ? atob(payload)
        : Buffer.from(payload, "base64").toString("binary")
      : decodeURIComponent(payload);
    return { mime, text: decoded };
  } catch {
    return null;
  }
}

/** 校验点 8: assets.images */
function validateAssets(assets: unknown): ValidationError[] {
  const errors: ValidationError[] = [];

  if (assets === undefined || assets === null) return errors;

  if (typeof assets !== "object" || Array.isArray(assets)) {
    errors.push({ path: "/assets", message: "assets 必须是对象" });
    return errors;
  }

  const a = assets as Record<string, unknown>;
  const images = a.images as unknown[] | undefined;

  if (images === undefined) return errors;

  if (!Array.isArray(images)) {
    errors.push({
      path: "/assets/images",
      message: "assets.images 必须是数组",
    });
    return errors;
  }

  let totalBase64Bytes = 0;
  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    const imgPath = `/assets/images/${i}`;

    if (!img || typeof img !== "object") {
      errors.push({
        path: imgPath,
        severity: "warning",
        message:
          "资源条目格式错误（非对象），该资源将被跳过。资源问题不阻断导入",
      });
      continue;
    }

    const image = img as Record<string, unknown>;

    if (typeof image.key !== "string" || !image.key.trim()) {
      errors.push({
        path: `${imgPath}/key`,
        severity: "warning",
        message: "资源 key 为空，该资源将被跳过。资源问题不阻断导入",
      });
    }

    if (typeof image.src !== "string" || !image.src.trim()) {
      errors.push({
        path: `${imgPath}/src`,
        severity: "warning",
        message: "资源 src 为空，该资源将被跳过。资源问题不阻断导入",
      });
    } else {
      const src = image.src as string;
      if (!src.startsWith("data:") && !src.startsWith("assets/")) {
        errors.push({
          path: `${imgPath}/src`,
          severity: "warning",
          message: `图片 src 格式不合法（非 data: 也非 assets/），当前值: "${String(src).slice(0, 50)}..."，该资源将被跳过。资源问题不阻断导入`,
          fix: '小装饰图推荐直接内联为 data:image/svg+xml;utf8,...；品牌 Logo 等跨组件复用的放 zip 内 assets/images/logo.svg，然后 src 写 "assets/images/logo.svg"',
        });
      } else {
        // 扫描内联 SVG 的安全 & 伪位图
        const decoded = tryDecodeDataUrl(src);
        if (decoded && decoded.mime === "image/svg+xml") {
          errors.push(
            ...scanSvgSafety(decoded.text, `${imgPath}/src#svg-content`),
          );
        }
        // base64 形式累计大小，单图 > 2MB 或 总 > 15MB warning
        if (src.startsWith("data:")) {
          const comma = src.indexOf(",");
          const payload = comma >= 0 ? src.slice(comma + 1) : "";
          const isB64 = /^data:[^;,]+;base64,/i.test(src);
          const bytes = isB64
            ? Math.floor((payload.length * 3) / 4)
            : payload.length;
          totalBase64Bytes += bytes;
          if (bytes > 2 * 1024 * 1024) {
            errors.push({
              path: `${imgPath}/src`,
              severity: "warning",
              message: `资源 "${String(image.key)}" 约 ${(bytes / 1024 / 1024).toFixed(1)} MB，体积较大。请确认这是主题装饰资源（每篇文章都会出现），不是某篇文章专属的内容插图`,
              fix: "如果是文章内容插图（产品图/实拍图/插画），请在 Markdown 中通过图床插入，不要放进主题包；如果确实是主题装饰资源，可压缩为 SVG/WEBP 后重试",
            });
          }
        }
      }
    }
  }

  if (totalBase64Bytes > 15 * 1024 * 1024) {
    errors.push({
      path: "/assets/images",
      severity: "warning",
      message: `assets.images 内联资源总计约 ${(totalBase64Bytes / 1024 / 1024).toFixed(1)} MB，可能有误将内容大图塞入主题包的情况`,
      fix: "检查是否有产品图/实拍图/正文插画等文章内容资源混入；这类资源请在 Markdown 中用图床插入，不要放进主题包",
    });
  }

  return errors;
}

/** 校验点 9: 未知字段检查 */
function validateUnknownFields(
  input: Record<string, unknown>,
): ValidationError[] {
  const errors: ValidationError[] = [];
  const knownFields = new Set([
    "sdkVersion",
    "meta",
    "tokens",
    "components",
    "layout",
    "assets",
    "codeTheme",
    "templates",
  ]);

  for (const key of Object.keys(input)) {
    if (!knownFields.has(key)) {
      errors.push({
        path: `/${key}`,
        message: `未知顶层字段 "${key}"，可能不是有效的 Theme Package Manifest 字段`,
      });
    }
  }

  return errors;
}

// ============================================================
// 主入口
// ============================================================

/**
 * 校验 Theme Package Manifest
 *
 * @param input - 待校验的 manifest JSON 对象
 * @returns 校验结果（成功返回 manifest，失败返回错误列表）
 */
export function validateThemePackageManifest(
  input: unknown,
): ValidationResult<ThemePackageManifest> {
  const errors: ValidationError[] = [];

  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return {
      ok: false,
      errors: [{ path: "/", message: "manifest 必须是 JSON 对象" }],
    };
  }

  const data = input as Record<string, unknown>;

  // 校验点 1: sdkVersion
  errors.push(...validateSdkVersion(data));

  // 校验点 2: meta
  errors.push(...validateMeta(data.meta));

  // 校验点 3-5: tokens
  if (data.tokens && typeof data.tokens === "object") {
    errors.push(...validateColorTokens(data.tokens));
    errors.push(...validateTypographyTokens(data.tokens));
    errors.push(...validateLayoutTokens(data.tokens));
  } else {
    errors.push({ path: "/tokens", message: "tokens 必填" });
  }

  // 校验点 6: components
  errors.push(...validateComponents(data.components));

  // 校验点 6b: 引用完整性（variantCss 中的 var(--xxx) 必须在 tokens 中定义）
  errors.push(...validateReferenceIntegrity(data.components, data.tokens));

  // 校验点 7: layout
  errors.push(...validateLayout(data.layout));

  // 校验点 8: assets
  errors.push(...validateAssets(data.assets));

  // 校验点 9: 未知字段
  errors.push(...validateUnknownFields(data));

  // 只有 error 级别的问题才阻止通过
  const hasErrors = errors.some((e) => e.severity !== "warning");
  if (hasErrors) {
    return { ok: false, errors };
  }

  return { ok: true, value: data as unknown as ThemePackageManifest, errors };
}
