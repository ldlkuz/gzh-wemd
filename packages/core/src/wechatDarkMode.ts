type ElementType =
  | "heading"
  | "body"
  | "background"
  | "table"
  | "table-text"
  | "blockquote"
  | "blockquote-text"
  | "code"
  | "code-text"
  | "decorative-dark"
  | "vibrant-protected"
  | "selection"
  | "selection-text"
  | "other";

type CssNode =
  | { type: "rule"; selector: string; body: string }
  | {
      type: "atrule";
      name: string;
      params: string;
      body: string;
      children: CssNode[];
      isStandalone?: boolean;
    };

export interface DarkModeConfig {
  vibrantSaturationThreshold: number;
  vibrantLightnessRange: [number, number];
  decorativeDarkLuminanceThreshold: number;
}

const DEFAULT_CONFIG: DarkModeConfig = {
  vibrantSaturationThreshold: 15,
  vibrantLightnessRange: [35, 55],
  decorativeDarkLuminanceThreshold: 20,
};

const CSS_KEYWORDS_SKIP =
  /^(currentcolor|inherit|transparent|initial|unset|none)$/i;
const DEFAULT_LIGHT_TEXT_COLOR_RGB = [25, 25, 25];
const DEFAULT_LIGHT_BG_COLOR_RGB = [255, 255, 255];
const DEFAULT_DARK_TEXT_COLOR_RGB = [163, 163, 163];
const DEFAULT_DARK_BG_COLOR_RGB = [25, 25, 25];

const CONSTANTS = {
  WHITE_LIKE_COLOR_BRIGHTNESS: 250,
  MAX_LIMIT_BGCOLOR_BRIGHTNESS: 190,
  MIN_LIMIT_OFFSET_BRIGHTNESS: 65,
  HIGH_BGCOLOR_BRIGHTNESS: 100,
  HIGH_BLACKWHITE_HSL_BRIGHTNESS: 40,
  LOW_BLACKWHITE_HSL_BRIGHTNESS: 22,
  IGNORE_ALPHA: 0.05,
  DEFAULT_DARK_BG_L_OFFSET: 10,
};

const CONVERSION_MARK = "/* wemd-wechat-dark-converted */";
const convertCssCache = new Map<string, string>();
const convertCssCacheQueue: string[] = [];
const CACHE_LIMIT = 200;

const hashCss = (css: string): string => {
  let hash = 0;
  for (let i = 0; i < css.length; i++) {
    hash = (hash * 31 + css.charCodeAt(i)) | 0;
  }
  return `${css.length}:${hash >>> 0}`;
};

const cacheSet = (key: string, value: string) => {
  if (convertCssCache.has(key)) return;
  convertCssCache.set(key, value);
  convertCssCacheQueue.push(key);
  if (convertCssCacheQueue.length > CACHE_LIMIT) {
    const oldKey = convertCssCacheQueue.shift();
    if (oldKey) convertCssCache.delete(oldKey);
  }
};

function hexToRgb(hex: string): [number, number, number] | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16),
      ]
    : null;
}

function rgbToHex(r: number, g: number, b: number): string {
  return (
    "#" +
    [r, g, b]
      .map((x) => {
        const hex = Math.round(Math.max(0, Math.min(255, x))).toString(16);
        return hex.length === 1 ? "0" + hex : hex;
      })
      .join("")
  );
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  let h = 0,
    s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }
  return [h * 360, s * 100, l * 100];
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  s /= 100;
  l /= 100;
  h /= 360;
  if (s === 0) return [l * 255, l * 255, l * 255];
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return [
    hue2rgb(p, q, h + 1 / 3) * 255,
    hue2rgb(p, q, h) * 255,
    hue2rgb(p, q, h - 1 / 3) * 255,
  ];
}

function getColorPerceivedBrightness(rgb: number[]): number {
  return (rgb[0] * 299 + rgb[1] * 587 + rgb[2] * 114) / 1000;
}

function adjustBrightnessTo(
  target: number,
  rgb: number[],
): [number, number, number] {
  const current = getColorPerceivedBrightness(rgb);
  if (current < 1e-3) return [target, target, target];
  const ratio = target / current;
  let r = Math.min(255, rgb[0] * ratio),
    g = Math.min(255, rgb[1] * ratio),
    b = Math.min(255, rgb[2] * ratio);
  if (g === 0 || r === 255 || b === 255) {
    g = (target * 1000 - r * 299 - b * 114) / 587;
  } else if (r === 0) {
    r = (target * 1000 - g * 587 - b * 114) / 299;
  } else if (b === 0 || g === 255) {
    b = (target * 1000 - r * 299 - g * 587) / 114;
  }
  return [
    Math.max(0, Math.min(255, r)),
    Math.max(0, Math.min(255, g)),
    Math.max(0, Math.min(255, b)),
  ];
}

function adjustBackgroundBrightness(
  rgb: number[],
  hsl: [number, number, number],
): [number, number, number] {
  const [h, s, l] = hsl;
  const perceived = getColorPerceivedBrightness(rgb);

  const NEAR_WHITE_PERCEIVED = 235;
  if (
    (s < 10 && l > CONSTANTS.HIGH_BLACKWHITE_HSL_BRIGHTNESS) ||
    perceived > CONSTANTS.WHITE_LIKE_COLOR_BRIGHTNESS ||
    perceived > NEAR_WHITE_PERCEIVED
  ) {
    const darkL = Math.min(100, 100 + CONSTANTS.DEFAULT_DARK_BG_L_OFFSET - l);
    const darkS = s > 10 ? Math.min(s, 30) : 0;
    return hslToRgb(darkS > 0 ? h : 0, darkS, darkL);
  }

  if (perceived > CONSTANTS.MAX_LIMIT_BGCOLOR_BRIGHTNESS) {
    return adjustBrightnessTo(CONSTANTS.MAX_LIMIT_BGCOLOR_BRIGHTNESS, rgb);
  }

  if (l < CONSTANTS.LOW_BLACKWHITE_HSL_BRIGHTNESS) {
    return hslToRgb(h, s, CONSTANTS.LOW_BLACKWHITE_HSL_BRIGHTNESS);
  }

  return [rgb[0], rgb[1], rgb[2]];
}

function adjustCodeBackgroundBrightness(
  rgb: number[],
  hsl: [number, number, number],
): [number, number, number] {
  const [h, s, l] = hsl;
  const perceived = getColorPerceivedBrightness(rgb);

  const NEAR_WHITE_PERCEIVED = 235;
  if (
    (s < 10 && l > CONSTANTS.HIGH_BLACKWHITE_HSL_BRIGHTNESS) ||
    perceived > CONSTANTS.WHITE_LIKE_COLOR_BRIGHTNESS ||
    perceived > NEAR_WHITE_PERCEIVED
  ) {
    const darkL = Math.min(100, 100 + CONSTANTS.DEFAULT_DARK_BG_L_OFFSET - l);
    const darkS = s > 10 ? Math.min(s, 30) : 0;
    return hslToRgb(darkS > 0 ? h : 0, darkS, darkL);
  }

  const CODE_MAX_BG_PERCEIVED = 40;
  if (perceived > CODE_MAX_BG_PERCEIVED) {
    return adjustBrightnessTo(CODE_MAX_BG_PERCEIVED, rgb);
  }

  return [rgb[0], rgb[1], rgb[2]];
}

function adjustTextBrightness(
  textRgb: number[],
  textHsl: [number, number, number],
  bgRgb: number[] = DEFAULT_DARK_BG_COLOR_RGB,
): [number, number, number] {
  const textPerceived = getColorPerceivedBrightness(textRgb);
  const bgPerceived = getColorPerceivedBrightness(bgRgb);
  const offset = Math.abs(bgPerceived - textPerceived);

  if (textPerceived >= CONSTANTS.WHITE_LIKE_COLOR_BRIGHTNESS)
    return [textRgb[0], textRgb[1], textRgb[2]];

  const MAX_LIMIT_OFFSET = 138;
  if (offset > MAX_LIMIT_OFFSET && bgPerceived <= 27) {
    return adjustBrightnessTo(MAX_LIMIT_OFFSET + bgPerceived, textRgb);
  }

  if (offset >= CONSTANTS.MIN_LIMIT_OFFSET_BRIGHTNESS)
    return [textRgb[0], textRgb[1], textRgb[2]];

  if (bgPerceived >= CONSTANTS.HIGH_BGCOLOR_BRIGHTNESS) {
    if (textHsl[2] > 90 - CONSTANTS.HIGH_BLACKWHITE_HSL_BRIGHTNESS) {
      const newL = 90 - textHsl[2];
      return adjustTextBrightness(
        hslToRgb(textHsl[0], textHsl[1], newL),
        [textHsl[0], textHsl[1], newL],
        bgRgb,
      );
    }
    return adjustBrightnessTo(
      Math.min(
        MAX_LIMIT_OFFSET,
        bgPerceived - CONSTANTS.MIN_LIMIT_OFFSET_BRIGHTNESS,
      ),
      textRgb,
    );
  } else {
    if (textHsl[2] <= CONSTANTS.HIGH_BLACKWHITE_HSL_BRIGHTNESS) {
      const newL = 90 - textHsl[2];
      return adjustTextBrightness(
        hslToRgb(textHsl[0], textHsl[1], newL),
        [textHsl[0], textHsl[1], newL],
        bgRgb,
      );
    }
    return adjustBrightnessTo(
      Math.min(
        MAX_LIMIT_OFFSET,
        bgPerceived + CONSTANTS.MIN_LIMIT_OFFSET_BRIGHTNESS,
      ),
      textRgb,
    );
  }
}

function adjustDecorativeDarkBrightness(
  rgb: number[],
  hsl: [number, number, number],
): [number, number, number] {
  const [h, s, l] = hsl;
  return hslToRgb(h, s * 0.5, Math.max(10, Math.min(15, l)));
}

function adjustBlockquoteTextBrightness(
  textRgb: number[],
  textHsl: [number, number, number],
  bgRgb: number[] = DEFAULT_DARK_BG_COLOR_RGB,
): [number, number, number] {
  return adjustTextBrightness(textRgb, textHsl, bgRgb);
}

function adjustTableTextBrightness(
  textRgb: number[],
  textHsl: [number, number, number],
  bgRgb: number[] = DEFAULT_DARK_BG_COLOR_RGB,
): [number, number, number] {
  return adjustTextBrightness(textRgb, textHsl, bgRgb);
}

function adjustCodeTextBrightness(
  textRgb: number[],
  textHsl: [number, number, number],
): [number, number, number] {
  const [h, s, l] = textHsl;
  if (l > 75) return [textRgb[0], textRgb[1], textRgb[2]];
  return hslToRgb(h, Math.min(100, s * 1.1 + 5), Math.max(78, l));
}

function stripComments(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, "");
}

function isEscaped(str: string, index: number): boolean {
  let backslashes = 0;
  for (let i = index - 1; i >= 0; i--) {
    if (str[i] === "\\") backslashes++;
    else break;
  }
  return backslashes % 2 === 1;
}

function findMatchingBrace(str: string, start: number): number {
  let depth = 0;
  let inSingle = false,
    inDouble = false;
  for (let i = start; i < str.length; i++) {
    const ch = str[i];
    if (ch === "'" && !inDouble && !isEscaped(str, i)) inSingle = !inSingle;
    if (ch === '"' && !inSingle && !isEscaped(str, i)) inDouble = !inDouble;
    if (inSingle || inDouble) continue;
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

function splitDeclarations(body: string): string[] {
  const decls: string[] = [];
  let buf = "";
  let depth = 0;
  let inSingle = false,
    inDouble = false;
  for (let i = 0; i < body.length; i++) {
    const ch = body[i];
    if (ch === "'" && !inDouble && !isEscaped(body, i)) {
      inSingle = !inSingle;
      buf += ch;
      continue;
    }
    if (ch === '"' && !inSingle && !isEscaped(body, i)) {
      inDouble = !inDouble;
      buf += ch;
      continue;
    }
    if (inSingle || inDouble) {
      buf += ch;
      continue;
    }
    if (ch === "(") depth++;
    else if (ch === ")") depth = Math.max(0, depth - 1);
    if (ch === ";" && depth === 0) {
      if (buf.trim()) decls.push(buf.trim());
      buf = "";
      continue;
    }
    buf += ch;
  }
  if (buf.trim()) decls.push(buf.trim());
  return decls;
}

function parseCssBlocks(css: string): CssNode[] {
  const nodes: CssNode[] = [];
  let i = 0;
  const len = css.length;
  while (i < len) {
    while (i < len && /\s/.test(css[i])) i++;
    if (i >= len) break;
    const start = i;
    if (css[i] === "@") {
      while (i < len && css[i] !== "{" && css[i] !== ";") i++;
      const prelude = css.slice(start, i).trim();
      if (css[i] === ";") {
        nodes.push({
          type: "atrule",
          name: prelude,
          params: "",
          body: "",
          children: [],
          isStandalone: true,
        });
        i++;
        continue;
      }
      const braceStart = i;
      const braceEnd = findMatchingBrace(css, braceStart);
      if (braceEnd === -1) break;
      const inner = css.slice(braceStart + 1, braceEnd);
      const children = parseCssBlocks(inner);
      nodes.push({
        type: "atrule",
        name: prelude,
        params: "",
        body: children.length ? "" : inner,
        children,
      });
      i = braceEnd + 1;
    } else {
      while (i < len && css[i] !== "{") i++;
      const selector = css.slice(start, i).trim();
      const braceStart = i;
      if (braceStart >= len || css[braceStart] !== "{") {
        const remaining = css.slice(start).trim();
        if (remaining)
          nodes.push({ type: "rule", selector: "*", body: remaining });
        break;
      }
      const braceEnd = findMatchingBrace(css, braceStart);
      if (braceEnd === -1) break;
      const body = css.slice(braceStart + 1, braceEnd);
      nodes.push({ type: "rule", selector, body });
      i = braceEnd + 1;
    }
  }
  return nodes;
}

function getElementType(selector: string): ElementType {
  const s = selector.toLowerCase();
  if (s.includes("ue-table-interlace-color-single")) return "table";
  if (s.includes("ue-table-interlace-color-double")) return "table";
  if (s.includes("js_darkmode__")) return "other";

  if (/blockquote|callout|multiquote/.test(s)) return "blockquote";
  if (/\b(pre|code|hljs|language-)/.test(s)) return "code";
  if (/table|tr|th|td/.test(s)) return "table";
  if (/h[1-6]/.test(s)) return "heading";
  if (/::selection/.test(s)) return "selection";
  if (s.includes("body")) return "body";
  return "other";
}

function processColorRgb(
  rgb: number[],
  type: ElementType,
  bgRgb: number[] = DEFAULT_DARK_BG_COLOR_RGB,
): [number, number, number] {
  const hsl = rgbToHsl(rgb[0], rgb[1], rgb[2]);
  const isBg = [
    "background",
    "table",
    "blockquote",
    "code",
    "vibrant-protected",
    "selection",
  ].includes(type);

  if (type === "code") return adjustCodeBackgroundBrightness(rgb, hsl);
  if (isBg) return adjustBackgroundBrightness(rgb, hsl);
  if (type === "decorative-dark")
    return adjustDecorativeDarkBrightness(rgb, hsl);
  if (type === "table-text") return adjustTableTextBrightness(rgb, hsl, bgRgb);
  if (type === "code-text") return adjustCodeTextBrightness(rgb, hsl);
  if (type === "blockquote-text")
    return adjustBlockquoteTextBrightness(rgb, hsl, bgRgb);
  if (type === "selection-text") return adjustTextBrightness(rgb, hsl, bgRgb);
  return adjustTextBrightness(rgb, hsl, bgRgb);
}

function processImportant(val: string, suffix: string): string {
  const isImportant = val.toLowerCase().includes("!important");
  if (!isImportant) return `${val}, ${suffix}`;
  const cleanVal = val.replace(/\s*!important/i, "").trim();
  return `${cleanVal}, ${suffix} !important`;
}

export function convertToWeChatDarkMode(
  hex: string,
  type: ElementType = "body",
  bgRgb: number[] = DEFAULT_DARK_BG_COLOR_RGB,
): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const [r, g, b] = processColorRgb(rgb, type, bgRgb);
  return rgbToHex(r, g, b);
}

function convertColorValue(
  raw: string,
  type: ElementType,
  bgRgb: number[] = DEFAULT_DARK_BG_COLOR_RGB,
): string {
  const lower = raw.toLowerCase();
  if (lower.includes("var(") || CSS_KEYWORDS_SKIP.test(lower.trim()))
    return raw;
  let res = raw.replace(/#([0-9a-fA-F]{3,8})\b/g, (m) => {
    let hex = m;
    if (m.length === 4) hex = "#" + m[1] + m[1] + m[2] + m[2] + m[3] + m[3];
    let alphaSuffix = "";
    if (m.length === 5) {
      alphaSuffix = m[4] + m[4];
      hex = "#" + m[1] + m[1] + m[2] + m[2] + m[3] + m[3];
    } else if (m.length === 9) {
      alphaSuffix = m.slice(7);
      hex = m.slice(0, 7);
    }
    return convertToWeChatDarkMode(hex, type, bgRgb) + alphaSuffix;
  });

  const rgbPattern = /rgba?\(\s*([^)]+)\)/gi;
  res = res.replace(rgbPattern, (m, body) => {
    const parts = body.split(",").map((p: string) => p.trim());
    if (parts.length < 3) return m;
    const [r, g, b] = parts.slice(0, 3).map(parseFloat);
    const a = parts[3] !== undefined ? parseFloat(parts[3]) : 1;
    if ([r, g, b].some((n) => Number.isNaN(n))) return m;
    const [nr, ng, nb] = processColorRgb([r, g, b], type, bgRgb);
    return a < 1
      ? `rgba(${Math.round(nr)}, ${Math.round(ng)}, ${Math.round(nb)}, ${a})`
      : `rgb(${Math.round(nr)}, ${Math.round(ng)}, ${Math.round(nb)})`;
  });

  const hslPattern = /hsla?\(\s*([^)]+)\)/gi;
  res = res.replace(hslPattern, (m, body) => {
    const parts = body.split(",").map((p: string) => p.trim().replace("%", ""));
    if (parts.length < 3) return m;
    const [h, s, l] = parts.slice(0, 3).map(parseFloat);
    const a = parts[3] !== undefined ? parseFloat(parts[3]) : 1;
    if ([h, s, l].some((n) => Number.isNaN(n))) return m;
    const [nr, ng, nb] = processColorRgb(hslToRgb(h, s, l), type, bgRgb);
    return a < 1
      ? `rgba(${Math.round(nr)}, ${Math.round(ng)}, ${Math.round(nb)}, ${a})`
      : `rgb(${Math.round(nr)}, ${Math.round(ng)}, ${Math.round(nb)})`;
  });

  return res;
}

function transformDeclarations(selector: string, props: string): string {
  const baseType = getElementType(selector);
  const lowerSelector = selector.toLowerCase();
  const isCode = /\b(pre|code|hljs|language-)/.test(lowerSelector);
  const decls = splitDeclarations(props);

  const parsedDecls = decls
    .map((decl) => {
      const colonIndex = decl.indexOf(":");
      if (colonIndex === -1)
        return { name: "", lowerName: "", val: "", raw: decl };
      return {
        name: decl.slice(0, colonIndex).trim(),
        lowerName: decl.slice(0, colonIndex).trim().toLowerCase(),
        val: decl.slice(colonIndex + 1).trim(),
      };
    })
    .filter((d) => d.name !== "");

  let currentBgRgb = DEFAULT_DARK_BG_COLOR_RGB;
  let convertedBgColorHex = "";

  for (const d of parsedDecls) {
    const lowerName = d.lowerName;
    const lowerVal = d.val.toLowerCase();
    const isShorthand = lowerName === "background";
    const isBgColorName = lowerName === "background-color";

    if ((isShorthand || isBgColorName) && !lowerVal.includes("gradient")) {
      const colorMatch = d.val.match(
        /#([0-9a-fA-F]{3,8})|rgba?\(\s*([^)]+)\)/i,
      );
      if (colorMatch) {
        let rgb: [number, number, number] | null = null;
        if (colorMatch[1]) {
          const h = colorMatch[1];
          const hex =
            h.length === 3
              ? "#" + h[0] + h[0] + h[1] + h[1] + h[2] + h[2]
              : "#" + h.slice(0, 6);
          rgb = hexToRgb(hex);
        } else if (colorMatch[2]) {
          const parts = colorMatch[2]
            .split(",")
            .map((p) => parseFloat(p.trim()));
          if (parts.length >= 3) rgb = [parts[0], parts[1], parts[2]];
        }
        if (rgb) {
          const hsl = rgbToHsl(rgb[0], rgb[1], rgb[2]);
          const darkRgb = adjustBackgroundBrightness(rgb, hsl);
          currentBgRgb = darkRgb;
          convertedBgColorHex = rgbToHex(darkRgb[0], darkRgb[1], darkRgb[2]);
        }
      }
    }
  }

  const finalDecls: { name: string; val: string; lowerName: string }[] = [];

  for (const d of parsedDecls) {
    const name = d.name;
    const lowerName = d.lowerName;
    const val = d.val;

    const isBg = /background|bgcolor/i.test(lowerName);
    const isText =
      /color|-webkit-text-stroke|-webkit-text-fill-color|text-decoration-color|text-emphasis-color/i.test(
        lowerName,
      );
    const isShadow = /shadow/i.test(lowerName);
    const isBorder = /border|outline|column-rule|box-shadow/i.test(lowerName);

    let type: ElementType = baseType;
    if (isBg) {
      type =
        baseType === "table"
          ? "table"
          : baseType === "blockquote"
            ? "blockquote"
            : baseType === "selection"
              ? "selection"
              : baseType === "code" || isCode
                ? "code"
                : "background";
    } else if (isShadow || isBorder) {
      const colorMatch = val.match(/#([0-9a-fA-F]{3,8})|rgba?\(\s*([^)]+)\)/i);
      if (colorMatch) {
        let rgb: [number, number, number] | null = null;
        if (colorMatch[1]) {
          const h = colorMatch[1];
          const hex =
            h.length === 3
              ? "#" + h[0] + h[0] + h[1] + h[1] + h[2] + h[2]
              : "#" + h.slice(0, 6);
          rgb = hexToRgb(hex);
        } else if (colorMatch[2]) {
          const parts = colorMatch[2]
            .split(",")
            .map((p) => parseFloat(p.trim()));
          if (parts.length >= 3) rgb = [parts[0], parts[1], parts[2]];
        }
        if (rgb) {
          const lum = getColorPerceivedBrightness(rgb);
          const [, s] = rgbToHsl(rgb[0], rgb[1], rgb[2]);
          if (lum < 20) type = "decorative-dark";
          else if (s > 15) type = "vibrant-protected";
          else
            type =
              baseType === "table"
                ? "table-text"
                : baseType === "blockquote"
                  ? "blockquote-text"
                  : baseType === "selection"
                    ? "selection-text"
                    : baseType === "code" || isCode
                      ? "code-text"
                      : baseType;
        }
      }
    } else if (isText) {
      type =
        baseType === "table"
          ? "table-text"
          : baseType === "blockquote"
            ? "blockquote-text"
            : baseType === "selection"
              ? "selection-text"
              : baseType === "code" || isCode
                ? "code-text"
                : baseType;
    }

    let convertedVal = convertColorValue(val, type, currentBgRgb);

    const isInheritOrPredefined = /^(inherit|initial|unset|none)$/i.test(
      val.trim(),
    );

    if (!isInheritOrPredefined && convertedBgColorHex) {
      if (
        (lowerName === "background-image" || lowerName === "background") &&
        val.toLowerCase().includes("url(")
      ) {
        if (!convertedVal.includes("linear-gradient")) {
          convertedVal = processImportant(
            convertedVal,
            `linear-gradient(${convertedBgColorHex}, ${convertedBgColorHex})`,
          );
        }
      } else if (lowerName === "background-position") {
        convertedVal = processImportant(convertedVal, "top left");
      } else if (lowerName === "background-size") {
        convertedVal = processImportant(convertedVal, "100%");
      }
    }

    finalDecls.push({ name, val: convertedVal, lowerName });
  }

  finalDecls.sort((a, b) => {
    const na = a.lowerName;
    const nb = b.lowerName;
    if (na.startsWith("-webkit-text")) return -1;
    if (nb.startsWith("-webkit-text")) return 1;
    if (na === "color") return 1;
    if (nb === "color") return -1;
    if (na.includes("image") && nb.includes("color")) return 1;
    if (nb.includes("image") && na.includes("color")) return -1;
    return 0;
  });

  return `${selector}{${finalDecls.map((d) => `${d.name}: ${d.val}`).join(";")}}`;
}

function convertCssInternal(css: string): string {
  const cleaned = stripComments(css);
  const nodes = parseCssBlocks(cleaned);

  const renderNodes = (items: CssNode[]): string => {
    return items
      .map((node) => {
        if (node.type === "rule") {
          return transformDeclarations(node.selector, node.body);
        }
        if (node.isStandalone) {
          return `${node.name};`;
        }
        if (node.children.length) {
          return `${node.name}{${renderNodes(node.children)}}`;
        }
        const body = node.body.trim();
        if (body) {
          return `${node.name}{${transformDeclarations(node.name, body)}}`;
        }
        return `${node.name}{}`;
      })
      .join("");
  };

  const res = renderNodes(nodes);
  return `${CONVERSION_MARK}\n${res}`;
}

export function convertCssToWeChatDarkMode(css: string): string {
  if (css.includes(CONVERSION_MARK)) return css;
  const key = hashCss(css);
  const cached = convertCssCache.get(key);
  if (cached) return cached;
  const res = convertCssInternal(css);
  cacheSet(key, res);
  return res;
}

export { convertCssInternal as _convertCssToWeChatDarkModeInternal };
