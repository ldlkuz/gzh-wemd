// ============================================================
// Decoration Layer — 装饰层
// ============================================================
// 核心思想：AI 决定"用什么装饰"，而不是"怎么写 CSS"
// 包含：装饰原子注册表、品牌过滤引擎、组合校验器、映射引擎

// ── 类型定义 ──

/** 装饰原子参数 */
export interface AtomParams {
  [key: string]: string | number;
}

/** Decoration Plan 中的单个原子 */
export interface DecorationAtom {
  id: string;
  params: AtomParams;
}

/** 组件装饰方案 */
export interface ComponentDecoration {
  variant: string;
  atoms: DecorationAtom[];
}

/** 完整 Decoration Plan */
export interface DecorationPlan {
  brandFilter: {
    keywords: string[];
    allowedAtoms: string[];
    density: "low" | "medium" | "high";
  };
  components: Record<string, ComponentDecoration>;
}

/** 参数定义 */
export interface ParamDef {
  type: "number" | "string" | "enum";
  default: string | number;
  min?: number;
  max?: number;
  values?: string[];
}

/** CSS 模板定义 */
export interface CssTemplate {
  type: "css" | "css+html";
  css: string;
  html?: string;
  params: Record<string, ParamDef>;
  selector?: string;
}

/** 映射结果 */
export interface MapResult {
  css: Record<string, string>;
  html: Record<string, string>;
}

/** 品牌过滤引擎结果 */
export interface BrandFilterResult {
  allowedAtoms: string[];
  density: "low" | "medium" | "high";
  atomCount: {
    line: number;
    badge: number;
    pattern: number;
    icon: number;
    corner: number;
    divider: number;
    background: number;
    marker: number;
  };
}

/** 品牌过滤选项 */
export interface BrandFilterOptions {
  hardFilter?: {
    keyword: string;
    onlyAtoms: string[];
  }[];
  densityOverride?: "low" | "medium" | "high";
}

/** 校验结果 */
export interface ValidationResult {
  passed: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  summary: string;
}

export interface ValidationError {
  code: string;
  component: string;
  message: string;
  atoms: string[];
}

export interface ValidationWarning {
  code: string;
  component: string;
  message: string;
  suggestedAction?: string;
}

// ── 位置槽位定义 ──

const POSITION_SLOTS: Record<string, string[]> = {
  "line-left":      ["border-left"],
  "line-top":       ["border-top"],
  "line-bottom":    ["border-bottom"],
  "line-underline": ["underline"],
  "line-double":    ["border-top", "border-bottom"],
  "line-diagonal":  ["corner-top-left"],
  "line-gradient":  ["border-left"],
  "line-dashed":    ["border-left"],
  "badge-number":   ["badge"],
  "badge-dot":      ["badge"],
  "badge-icon":     ["badge"],
  "badge-tag":      ["badge"],
  "badge-pill":     ["badge"],
  "badge-corner":   ["badge", "corner-top-right"],
  "badge-ribbon":   ["badge", "ribbon"],
  "badge-circle":   ["badge"],
  "badge-stroke":   ["badge"],
  "badge-glow":     ["badge"],
  "corner-rounded": ["corner"],
  "corner-square":  ["corner"],
  "corner-pill":    ["corner"],
  "corner-fold":    ["corner", "corner-top-right"],
  "corner-notch":   ["corner"],
  "corner-round-left":  ["corner-left"],
  "corner-round-right": ["corner-right"],
  "corner-soft":    ["corner"],
  "bg-solid":       ["background"],
  "bg-gradient":    ["background"],
  "bg-gradient-radial": ["background"],
  "bg-pattern":     ["background"],
  "bg-soft":        ["background"],
  "bg-card":        ["background"],
};

// ── 背景互斥原子 ──

const BACKGROUND_ATOMS = new Set([
  "bg-solid", "bg-gradient", "bg-gradient-radial", "bg-pattern", "bg-soft", "bg-card"
]);

// ── 纹理原子 ──

const PATTERN_ATOMS = new Set([
  "pattern-dot", "pattern-grid", "pattern-hexagon", "pattern-stripe",
  "pattern-wave", "pattern-cross", "pattern-triangle", "pattern-zigzag",
  "pattern-houndstooth", "pattern-plaid", "pattern-mountain", "pattern-circle",
  "pattern-line-h", "pattern-line-v", "pattern-noise",
]);

// ── P0 原子注册表 (25 个) ──

export const ATOM_REGISTRY: Record<string, CssTemplate> = {
  // ── Line 类 ──
  "line-left": {
    type: "css",
    css: `.wemd-{component}[data-variant="{variant}"] {\n  border-left: {width}px solid {color};\n  padding-left: {gap}px;\n}`,
    params: {
      width: { type: "number", default: 4, min: 2, max: 6 },
      color: { type: "string", default: "var(--wemd-primary)" },
      gap: { type: "number", default: 12, min: 8, max: 20 },
    },
  },
  "line-bottom": {
    type: "css",
    css: `.wemd-{component}[data-variant="{variant}"] {\n  border-bottom: {width}px solid {color};\n  padding-bottom: {gap}px;\n}`,
    params: {
      width: { type: "number", default: 2, min: 1, max: 4 },
      color: { type: "string", default: "var(--wemd-primary)" },
      gap: { type: "number", default: 8, min: 4, max: 16 },
    },
  },
  "line-underline": {
    type: "css+html",
    html: `<span class="wemd-{component}-underline"></span>`,
    css: `.wemd-{component}[data-variant="{variant}"] {\n  position: relative;\n}\n.wemd-{component}[data-variant="{variant}"] .wemd-{component}-underline {\n  position: absolute;\n  bottom: {offset}px;\n  left: {left}%;\n  width: {width}%;\n  height: {lineHeight}px;\n  background: {color};\n  border-radius: {lineHeight}px;\n}`,
    params: {
      width: { type: "number", default: 60, min: 30, max: 100 },
      color: { type: "string", default: "var(--wemd-primary)" },
      offset: { type: "number", default: 2, min: 0, max: 8 },
      left: { type: "number", default: 0, min: 0, max: 50 },
      lineHeight: { type: "number", default: 3, min: 2, max: 6 },
    },
  },
  "line-top": {
    type: "css",
    css: `.wemd-{component}[data-variant="{variant}"] {\n  border-top: {width}px solid {color};\n  padding-top: {gap}px;\n}`,
    params: {
      width: { type: "number", default: 2, min: 1, max: 4 },
      color: { type: "string", default: "var(--wemd-primary)" },
      gap: { type: "number", default: 8, min: 4, max: 16 },
    },
  },
  "line-double": {
    type: "css",
    css: `.wemd-{component}[data-variant="{variant}"] {\n  border-top: {width}px solid {color};\n  border-bottom: {width}px solid {color};\n  padding: {gap}px 0;\n}`,
    params: {
      width: { type: "number", default: 1, min: 1, max: 3 },
      color: { type: "string", default: "var(--wemd-primary)" },
      gap: { type: "number", default: 8, min: 4, max: 16 },
    },
  },
  "line-gradient": {
    type: "css",
    css: `.wemd-{component}[data-variant="{variant}"] {\n  border-left: {width}px solid transparent;\n  border-image: linear-gradient({angle}, {color1}, {color2}) 0 0 0 1;\n  padding-left: {gap}px;\n}`,
    params: {
      width: { type: "number", default: 4, min: 2, max: 6 },
      color1: { type: "string", default: "var(--wemd-primary)" },
      color2: { type: "string", default: "var(--wemd-accent)" },
      angle: { type: "string", default: "180deg" },
      gap: { type: "number", default: 12, min: 8, max: 20 },
    },
  },
  "line-dashed": {
    type: "css",
    css: `.wemd-{component}[data-variant="{variant}"] {\n  border-left: {width}px dashed {color};\n  padding-left: {gap}px;\n}`,
    params: {
      width: { type: "number", default: 2, min: 1, max: 4 },
      color: { type: "string", default: "var(--wemd-primary)" },
      gap: { type: "number", default: 12, min: 8, max: 20 },
    },
  },

  // ── Badge 类 ──
  "badge-number": {
    type: "css+html",
    html: `<span class="wemd-{component}-badge">{number}</span>`,
    css: `.wemd-{component}[data-variant="{variant}"] .wemd-{component}-badge {\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  width: {size}px;\n  height: {size}px;\n  background: {color};\n  color: #fff;\n  border-radius: {radius}px;\n  font-size: {fontSize}px;\n  font-weight: 700;\n  margin-right: {gap}px;\n  flex-shrink: 0;\n}`,
    params: {
      number: { type: "string", default: "01" },
      size: { type: "number", default: 28, min: 20, max: 40 },
      color: { type: "string", default: "var(--wemd-primary)" },
      radius: { type: "number", default: 6, min: 4, max: 999 },
      fontSize: { type: "number", default: 14, min: 12, max: 18 },
      gap: { type: "number", default: 8, min: 4, max: 16 },
    },
  },
  "badge-dot": {
    type: "css+html",
    html: `<span class="wemd-{component}-dot"></span>`,
    css: `.wemd-{component}[data-variant="{variant}"] .wemd-{component}-dot {\n  display: inline-block;\n  width: {size}px;\n  height: {size}px;\n  border-radius: 50%;\n  background: {color};\n  margin-right: {gap}px;\n  flex-shrink: 0;\n  vertical-align: middle;\n}`,
    params: {
      size: { type: "number", default: 8, min: 6, max: 16 },
      color: { type: "string", default: "var(--wemd-primary)" },
      gap: { type: "number", default: 6, min: 4, max: 12 },
    },
  },
  "badge-pill": {
    type: "css+html",
    html: `<span class="wemd-{component}-pill">{text}</span>`,
    css: `.wemd-{component}[data-variant="{variant}"] .wemd-{component}-pill {\n  display: inline-block;\n  padding: {paddingY}px {paddingX}px;\n  background: {color};\n  color: #fff;\n  border-radius: 999px;\n  font-size: {fontSize}px;\n  font-weight: {weight};\n  line-height: 1.2;\n  margin-right: {gap}px;\n  vertical-align: middle;\n}`,
    params: {
      text: { type: "string", default: "NEW" },
      color: { type: "string", default: "var(--wemd-accent)" },
      paddingX: { type: "number", default: 12, min: 8, max: 20 },
      paddingY: { type: "number", default: 4, min: 2, max: 8 },
      fontSize: { type: "number", default: 13, min: 11, max: 16 },
      weight: { type: "enum", default: "600", values: ["400", "600", "700"] },
      gap: { type: "number", default: 6, min: 4, max: 12 },
    },
  },
  "badge-icon": {
    type: "css+html",
    html: `<span class="wemd-{component}-badge-icon">{icon}</span>`,
    css: `.wemd-{component}[data-variant="{variant}"] .wemd-{component}-badge-icon {\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  width: {size}px;\n  height: {size}px;\n  background: {color};\n  border-radius: {radius}px;\n  font-size: {iconSize}px;\n  margin-right: {gap}px;\n  flex-shrink: 0;\n}`,
    params: {
      icon: { type: "string", default: "★" },
      size: { type: "number", default: 28, min: 20, max: 40 },
      color: { type: "string", default: "var(--wemd-primary)" },
      radius: { type: "number", default: 6, min: 4, max: 999 },
      iconSize: { type: "number", default: 14, min: 10, max: 20 },
      gap: { type: "number", default: 8, min: 4, max: 16 },
    },
  },
  "badge-stroke": {
    type: "css+html",
    html: `<span class="wemd-{component}-badge-stroke">{text}</span>`,
    css: `.wemd-{component}[data-variant="{variant}"] .wemd-{component}-badge-stroke {\n  display: inline-block;\n  padding: {paddingY}px {paddingX}px;\n  border: {borderWidth}px solid {color};\n  color: {color};\n  background: transparent;\n  border-radius: {radius}px;\n  font-size: {fontSize}px;\n  font-weight: {weight};\n  margin-right: {gap}px;\n  vertical-align: middle;\n}`,
    params: {
      text: { type: "string", default: "标签" },
      color: { type: "string", default: "var(--wemd-primary)" },
      borderWidth: { type: "number", default: 1, min: 1, max: 3 },
      paddingX: { type: "number", default: 10, min: 6, max: 16 },
      paddingY: { type: "number", default: 3, min: 2, max: 6 },
      fontSize: { type: "number", default: 12, min: 10, max: 15 },
      weight: { type: "enum", default: "600", values: ["400", "600", "700"] },
      radius: { type: "number", default: 4, min: 2, max: 12 },
      gap: { type: "number", default: 6, min: 4, max: 12 },
    },
  },

  // ── Pattern 类 ──
  "pattern-dot": {
    type: "css",
    css: `.wemd-{component}[data-variant="{variant}"] {\n  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='{size}' height='{size}'%3E%3Ccircle cx='{sizeHalf}' cy='{sizeHalf}' r='{dotRadius}' fill='{color}' opacity='{opacity}'/%3E%3C/svg%3E");\n  background-repeat: repeat;\n}`,
    params: {
      size: { type: "number", default: 20, min: 12, max: 40 },
      dotRadius: { type: "number", default: 2, min: 1, max: 4 },
      color: { type: "string", default: "var(--wemd-primary)" },
      opacity: { type: "number", default: 0.06, min: 0.02, max: 0.15 },
    },
  },
  "pattern-grid": {
    type: "css",
    css: `.wemd-{component}[data-variant="{variant}"] {\n  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='{size}' height='{size}'%3E%3Crect width='{size}' height='{size}' fill='none' stroke='{color}' stroke-width='{strokeWidth}' opacity='{opacity}'/%3E%3C/svg%3E");\n  background-repeat: repeat;\n}`,
    params: {
      size: { type: "number", default: 24, min: 16, max: 48 },
      color: { type: "string", default: "var(--wemd-primary)" },
      strokeWidth: { type: "number", default: 1, min: 0.5, max: 2 },
      opacity: { type: "number", default: 0.05, min: 0.02, max: 0.12 },
    },
  },
  "pattern-hexagon": {
    type: "css",
    css: `.wemd-{component}[data-variant="{variant}"] {\n  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='{size}' height='{size}' viewBox='0 0 24 24'%3E%3Cpolygon points='12 2,22 7,22 17,12 22,2 17,2 7' fill='none' stroke='{color}' stroke-width='{strokeWidth}' opacity='{opacity}'/%3E%3C/svg%3E");\n  background-repeat: repeat;\n}`,
    params: {
      size: { type: "number", default: 32, min: 20, max: 60 },
      color: { type: "string", default: "var(--wemd-primary)" },
      strokeWidth: { type: "number", default: 1, min: 0.5, max: 2 },
      opacity: { type: "number", default: 0.05, min: 0.02, max: 0.12 },
    },
  },

  // ── Icon 类 ──
  "icon-emoji": {
    type: "css+html",
    html: `<span class="wemd-{component}-icon">{emoji}</span>`,
    css: `.wemd-{component}[data-variant="{variant}"] .wemd-{component}-icon {\n  display: inline;\n  font-size: {size}px;\n  margin-right: {gap}px;\n  vertical-align: middle;\n}`,
    params: {
      emoji: { type: "string", default: "🚀" },
      size: { type: "number", default: 24, min: 14, max: 48 },
      gap: { type: "number", default: 6, min: 4, max: 12 },
    },
  },
  "icon-arrow": {
    type: "css+html",
    html: `<span class="wemd-{component}-icon">→</span>`,
    css: `.wemd-{component}[data-variant="{variant}"] .wemd-{component}-icon {\n  display: inline;\n  font-size: {size}px;\n  color: {color};\n  margin-right: {gap}px;\n  vertical-align: middle;\n}`,
    params: {
      size: { type: "number", default: 18, min: 12, max: 32 },
      color: { type: "string", default: "var(--wemd-primary)" },
      gap: { type: "number", default: 6, min: 4, max: 12 },
    },
  },
  "icon-star": {
    type: "css+html",
    html: `<span class="wemd-{component}-icon">★</span>`,
    css: `.wemd-{component}[data-variant="{variant}"] .wemd-{component}-icon {\n  display: inline;\n  font-size: {size}px;\n  color: {color};\n  margin-right: {gap}px;\n  vertical-align: middle;\n}`,
    params: {
      size: { type: "number", default: 18, min: 12, max: 32 },
      color: { type: "string", default: "var(--wemd-accent)" },
      gap: { type: "number", default: 6, min: 4, max: 12 },
    },
  },
  "icon-quote": {
    type: "css+html",
    html: `<span class="wemd-{component}-quote">{quoteChar}</span>`,
    css: `.wemd-{component}[data-variant="{variant}"] .wemd-{component}-quote {\n  display: block;\n  font-size: {size}px;\n  color: {color};\n  line-height: 1;\n  opacity: {opacity};\n  font-family: {fontFamily};\n  margin-bottom: {gap}px;\n}`,
    params: {
      quoteChar: { type: "enum", default: "\"", values: ["\"", "'", "「", "『"] },
      size: { type: "number", default: 48, min: 32, max: 80 },
      color: { type: "string", default: "var(--wemd-primary)" },
      opacity: { type: "number", default: 0.2, min: 0.1, max: 0.4 },
      gap: { type: "number", default: 8, min: 4, max: 16 },
      fontFamily: { type: "string", default: "Georgia, serif" },
    },
  },

  // ── Corner 类 ──
  "corner-rounded": {
    type: "css",
    css: `.wemd-{component}[data-variant="{variant}"] {\n  border-radius: {radius}px;\n}`,
    params: {
      radius: { type: "number", default: 12, min: 8, max: 24 },
    },
  },
  "corner-soft": {
    type: "css",
    css: `.wemd-{component}[data-variant="{variant}"] {\n  border-radius: 4px;\n}`,
    params: {},
  },
  "corner-pill": {
    type: "css",
    css: `.wemd-{component}[data-variant="{variant}"] {\n  border-radius: 999px;\n}`,
    params: {},
  },
  "corner-square": {
    type: "css",
    css: `.wemd-{component}[data-variant="{variant}"] {\n  border-radius: 0;\n}`,
    params: {},
  },

  // ── Divider 类 ──
  "divider-solid": {
    type: "css",
    css: `.wemd-{component}[data-variant="{variant}"] {\n  border-top: {width}px solid {color};\n  margin: {marginY}px 0;\n}`,
    params: {
      width: { type: "number", default: 1, min: 1, max: 4 },
      color: { type: "string", default: "var(--wemd-border)" },
      marginY: { type: "number", default: 16, min: 8, max: 32 },
    },
  },
  "divider-gradient": {
    type: "css",
    css: `.wemd-{component}[data-variant="{variant}"] {\n  height: {width}px;\n  background: linear-gradient(to right, transparent, {color}, transparent);\n  margin: {marginY}px 0;\n  border: none;\n}`,
    params: {
      width: { type: "number", default: 2, min: 1, max: 4 },
      color: { type: "string", default: "var(--wemd-primary)" },
      marginY: { type: "number", default: 16, min: 8, max: 32 },
    },
  },
  "divider-wave": {
    type: "css+html",
    html: `<div class="wemd-{component}-wave"></div>`,
    css: `.wemd-{component}[data-variant="{variant}"] .wemd-{component}-wave {\n  height: {height}px;\n  background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 24'%3E%3Cpath d='M0,12 Q30,0 60,12 T120,12 T180,12 T240,12 T300,12 T360,12 T420,12 T480,12 T540,12 T600,12 T660,12 T720,12 T780,12 T840,12 T900,12 T960,12 T1020,12 T1080,12 T1140,12 T1200,12' fill='none' stroke='{color}' stroke-width='{strokeWidth}' opacity='{opacity}'/%3E%3C/svg%3E") repeat-x;\n  background-size: {svgWidth}px {height}px;\n  margin: {marginY}px 0;\n}`,
    params: {
      height: { type: "number", default: 20, min: 12, max: 32 },
      color: { type: "string", default: "var(--wemd-primary)" },
      strokeWidth: { type: "number", default: 2, min: 1, max: 3 },
      opacity: { type: "number", default: 0.4, min: 0.2, max: 0.6 },
      svgWidth: { type: "number", default: 1200, min: 600, max: 1200 },
      marginY: { type: "number", default: 16, min: 8, max: 32 },
    },
  },
  "divider-icon": {
    type: "css+html",
    html: `<div class="wemd-{component}-divider-icon">\n  <span class="wemd-{component}-divider-line"></span>\n  <span class="wemd-{component}-divider-char">{icon}</span>\n  <span class="wemd-{component}-divider-line"></span>\n</div>`,
    css: `.wemd-{component}[data-variant="{variant}"] .wemd-{component}-divider-icon {\n  display: flex;\n  align-items: center;\n  gap: {gap}px;\n  margin: {marginY}px 0;\n}\n.wemd-{component}[data-variant="{variant}"] .wemd-{component}-divider-line {\n  flex: 1;\n  height: {width}px;\n  background: {color};\n  opacity: {opacity};\n}\n.wemd-{component}[data-variant="{variant}"] .wemd-{component}-divider-char {\n  font-size: {iconSize}px;\n  color: {color};\n  opacity: {opacity};\n  flex-shrink: 0;\n}`,
    params: {
      icon: { type: "string", default: "★" },
      width: { type: "number", default: 1, min: 1, max: 3 },
      color: { type: "string", default: "var(--wemd-border)" },
      opacity: { type: "number", default: 0.5, min: 0.3, max: 0.8 },
      gap: { type: "number", default: 12, min: 8, max: 20 },
      iconSize: { type: "number", default: 14, min: 12, max: 24 },
      marginY: { type: "number", default: 16, min: 8, max: 32 },
    },
  },

  // ── Background 类 ──
  "bg-gradient": {
    type: "css",
    css: `.wemd-{component}[data-variant="{variant}"] {\n  background: linear-gradient({angle}, {color1}, {color2});\n}`,
    params: {
      angle: { type: "string", default: "135deg" },
      color1: { type: "string", default: "var(--wemd-primary)" },
      color2: { type: "string", default: "var(--wemd-primary-dark)" },
    },
  },
  "bg-solid": {
    type: "css",
    css: `.wemd-{component}[data-variant="{variant}"] {\n  background: {color};\n}`,
    params: {
      color: { type: "string", default: "var(--wemd-bgCard)" },
    },
  },
  "bg-soft": {
    type: "css",
    css: `.wemd-{component}[data-variant="{variant}"] {\n  background: {color};\n  opacity: {opacity};\n}`,
    params: {
      color: { type: "string", default: "var(--wemd-primary)" },
      opacity: { type: "number", default: 0.05, min: 0.03, max: 0.1 },
    },
  },
  "bg-card": {
    type: "css",
    css: `.wemd-{component}[data-variant="{variant}"] {\n  background: {bgColor};\n  border: {borderWidth}px solid {borderColor};\n  border-radius: {radius}px;\n  padding: {padding}px;\n}`,
    params: {
      bgColor: { type: "string", default: "var(--wemd-bgCard)" },
      borderColor: { type: "string", default: "var(--wemd-border)" },
      borderWidth: { type: "number", default: 1, min: 0, max: 2 },
      radius: { type: "number", default: 8, min: 0, max: 16 },
      padding: { type: "number", default: 20, min: 12, max: 32 },
    },
  },
};

// ── 关键词 → 原子映射表 ──

const KEYWORD_ATOM_MAP: Record<string, string[]> = {
  "专业": ["line-left", "line-gradient", "badge-number", "badge-stroke", "pattern-grid", "pattern-dot", "icon-arrow", "icon-check", "corner-square", "corner-soft", "divider-solid", "divider-gradient"],
  "科技": ["line-left", "line-gradient", "line-double", "badge-glow", "badge-number", "pattern-grid", "pattern-hexagon", "icon-arrow", "icon-chevron", "corner-soft", "corner-square", "divider-gradient", "divider-wave", "bg-gradient"],
  "年轻": ["line-dashed", "line-diagonal", "badge-pill", "badge-icon", "pattern-dot", "pattern-cross", "pattern-zigzag", "icon-emoji", "icon-star", "icon-heart", "corner-pill", "corner-rounded", "divider-dashed", "divider-icon"],
  "高端": ["line-left", "line-underline", "badge-stroke", "badge-number", "pattern-houndstooth", "pattern-plaid", "icon-brand", "icon-diamond", "corner-square", "corner-soft", "divider-solid", "divider-double"],
  "环保": ["line-bottom", "line-underline", "badge-dot", "badge-circle", "pattern-dot", "pattern-wave", "pattern-mountain", "icon-check", "icon-circle", "corner-rounded", "corner-soft", "divider-wave", "divider-gradient"],
  "可信": ["line-left", "line-bottom", "badge-number", "badge-stroke", "pattern-grid", "pattern-line-h", "icon-check", "icon-arrow", "corner-soft", "corner-square", "divider-solid", "divider-double"],
  "创新": ["line-gradient", "line-diagonal", "badge-glow", "badge-icon", "pattern-hexagon", "pattern-mountain", "icon-arrow", "icon-plus", "corner-pill", "corner-rounded", "divider-gradient", "divider-wave", "bg-gradient"],
  "温暖": ["line-underline", "line-bottom", "badge-pill", "badge-tag", "pattern-dot", "pattern-circle", "icon-heart", "icon-star", "corner-rounded", "corner-pill", "divider-icon", "divider-gradient"],
  "极简": ["line-left", "line-top", "badge-stroke", "badge-dot", "pattern-dot", "pattern-grid", "icon-arrow", "icon-chevron", "corner-square", "corner-soft", "divider-solid", "divider-gradient"],
  "国际化": ["line-double", "line-gradient", "badge-number", "badge-stroke", "pattern-grid", "pattern-dot", "icon-arrow", "icon-chevron", "corner-square", "corner-soft", "divider-solid", "divider-gradient"],
  "稳重": ["line-left", "line-bottom", "badge-number", "badge-stroke", "pattern-grid", "pattern-line-h", "icon-check", "icon-arrow", "corner-square", "corner-soft", "divider-solid", "divider-double"],
  "活力": ["line-dashed", "line-diagonal", "badge-pill", "badge-glow", "pattern-zigzag", "pattern-cross", "icon-star", "icon-heart", "icon-plus", "corner-pill", "corner-rounded", "divider-dashed", "divider-icon"],
  "理性": ["line-left", "line-gradient", "badge-number", "badge-dot", "pattern-grid", "pattern-line-v", "icon-arrow", "icon-check", "corner-square", "corner-soft", "divider-solid", "divider-gradient"],
  "治愈": ["line-underline", "line-bottom", "badge-dot", "badge-circle", "pattern-dot", "pattern-wave", "pattern-circle", "icon-heart", "icon-star", "corner-rounded", "corner-soft", "divider-wave", "divider-icon"],
  "匠心": ["line-left", "line-underline", "badge-number", "badge-stroke", "pattern-grid", "pattern-houndstooth", "icon-diamond", "icon-brand", "corner-square", "corner-soft", "divider-solid", "divider-double"],
  "故事感": ["line-underline", "line-double", "badge-icon", "badge-tag", "pattern-dot", "pattern-wave", "icon-quote", "icon-star", "icon-emoji", "corner-rounded", "corner-soft", "divider-icon", "divider-wave"],
  "文艺": ["line-underline", "line-left", "badge-icon", "badge-dot", "pattern-dot", "pattern-wave", "icon-quote", "icon-heart", "icon-star", "corner-rounded", "corner-soft", "divider-icon", "divider-wave"],
  "商务": ["line-left", "line-bottom", "badge-number", "badge-stroke", "pattern-grid", "pattern-line-h", "icon-arrow", "icon-check", "corner-square", "corner-soft", "divider-solid", "divider-double"],
};

// 基础原子（所有品牌都可使用的通用原子）
const BASE_ATOMS = ["corner-soft", "corner-square", "corner-rounded", "divider-solid", "bg-solid", "bg-soft"];

// ══════════════════════════════════════════════════════════
// 品牌过滤引擎
// ══════════════════════════════════════════════════════════

export class BrandFilterEngine {
  private keywordMap = KEYWORD_ATOM_MAP;

  /** 评估品牌关键词，返回允许的原子列表和密度 */
  evaluate(keywords: string[], options?: BrandFilterOptions): BrandFilterResult {
    // 1. 取并集
    const unionSet = new Set<string>();
    for (const kw of keywords) {
      const atoms = this.keywordMap[kw] || [];
      for (const atom of atoms) {
        unionSet.add(atom);
      }
    }

    // 2. 硬性过滤
    let allowed = Array.from(unionSet);
    if (options?.hardFilter) {
      for (const rule of options.hardFilter) {
        if (keywords.includes(rule.keyword)) {
          allowed = allowed.filter(a => rule.onlyAtoms.includes(a));
        }
      }
    }

    // 3. 补充基础原子
    for (const base of BASE_ATOMS) {
      if (!allowed.includes(base)) {
        allowed.push(base);
      }
    }

    // 4. 分类统计
    const atomCount = this.countByCategory(allowed);

    // 5. 密度计算
    const density = options?.densityOverride ?? this.calcDensity(keywords, allowed.length);

    return { allowedAtoms: allowed, density, atomCount };
  }

  /** 按类别统计原子数 */
  private countByCategory(atoms: string[]): BrandFilterResult["atomCount"] {
    const categories = ["line", "badge", "pattern", "icon", "corner", "divider", "background", "marker"];
    const count: Record<string, number> = {};
    for (const cat of categories) count[cat] = 0;

    for (const atom of atoms) {
      const prefix = atom.split("-")[0];
      if (count[prefix] !== undefined) count[prefix]++;
    }
    return count as BrandFilterResult["atomCount"];
  }

  /** 密度计算 */
  private calcDensity(keywords: string[], totalAtoms: number): "low" | "medium" | "high" {
    if (keywords.length >= 3 && totalAtoms > 20) return "high";
    if (keywords.length >= 2 && totalAtoms > 12) return "medium";
    return "low";
  }
}

// ══════════════════════════════════════════════════════════
// 组合校验器
// ══════════════════════════════════════════════════════════

export class CombinationValidator {
  private densityMap: Record<string, number> = {
    "low": 2,
    "medium": 3,
    "high": 4,
  };

  /** 主入口：校验组件级的原子组合 */
  validate(component: string, atoms: DecorationAtom[], density: "low" | "medium" | "high"): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const atomIds = atoms.map(a => a.id);

    // 1. 位置冲突检测
    const positionConflicts = this.detectPositionConflicts(atomIds);
    for (const [a1, a2, slot] of positionConflicts) {
      errors.push({
        code: "POSITION_CONFLICT",
        component,
        message: `原子 "${a1}" 和 "${a2}" 冲突：都占据 "${slot}" 位置`,
        atoms: [a1, a2],
      });
    }

    // 2. 背景互斥检测
    const bgConflict = this.detectBackgroundConflict(atomIds);
    if (bgConflict.length > 1) {
      errors.push({
        code: "BACKGROUND_MUTEX",
        component,
        message: `背景原子互斥：${bgConflict.join(", ")} 只能选其一`,
        atoms: bgConflict,
      });
    }

    // 3. 纹理叠加限制
    const patternCount = atomIds.filter(a => PATTERN_ATOMS.has(a)).length;
    if (patternCount > 1) {
      warnings.push({
        code: "PATTERN_OVERLAY",
        component,
        message: `同一组件纹理叠加超过 1 个（${patternCount} 个），可能导致背景过重`,
        suggestedAction: "考虑只保留 1 个纹理原子",
      });
    }

    // 4. 装饰总数限制（软限制，不含 Background）
    const nonBgAtoms = atomIds.filter(a => !BACKGROUND_ATOMS.has(a));
    const maxAtoms = this.densityMap[density];
    if (nonBgAtoms.length > maxAtoms) {
      warnings.push({
        code: "ATOM_COUNT_EXCEEDED",
        component,
        message: `装饰原子数 ${nonBgAtoms.length} 超过密度 "${density}" 的推荐限制 ${maxAtoms}，注意视觉平衡`,
        suggestedAction: "考虑减少装饰原子或改用更高密度",
      });
    }

    // 5. Badge 独占检测
    const badgeAtoms = atomIds.filter(a => a.startsWith("badge-"));
    if (badgeAtoms.length > 1) {
      errors.push({
        code: "BADGE_EXCLUSIVE",
        component,
        message: `Badge 原子独占：${badgeAtoms.join(", ")} 只能选其一`,
        atoms: badgeAtoms,
      });
    }

    // 6. Corner-Border 冲突检测
    const cornerAtoms = atomIds.filter(a => a.startsWith("corner-"));
    const borderAtoms = atomIds.filter(a =>
      ["line-left", "line-top", "line-bottom", "line-double"].includes(a)
    );
    if (cornerAtoms.length > 0 && borderAtoms.length > 0) {
      warnings.push({
        code: "CORNER_BORDER_OVERLAP",
        component,
        message: "边角原子和线条原子共存，可能造成视觉冲突",
        suggestedAction: "确认边角和线条定义在不同边，或移除其中一个",
      });
    }

    const passed = errors.length === 0;
    const summary = passed
      ? `✅ 校验通过（${atoms.length} 个原子）`
      : `❌ 校验失败（${errors.length} 个错误，${warnings.length} 个警告）`;

    return { passed, errors, warnings, summary };
  }

  /** 位置冲突检测 */
  private detectPositionConflicts(atoms: string[]): [string, string, string][] {
    const occupied = new Map<string, string>();
    const conflicts: [string, string, string][] = [];

    for (const atomId of atoms) {
      const slots = POSITION_SLOTS[atomId] || [];
      for (const slot of slots) {
        // 由 BACKGROUND_MUTEX / BADGE_EXCLUSIVE 专用规则覆盖，不重复报告
        if (slot === "background" || slot === "badge") continue;
        if (occupied.has(slot)) {
          conflicts.push([occupied.get(slot)!, atomId, slot]);
        } else {
          occupied.set(slot, atomId);
        }
      }
    }

    return conflicts;
  }

  /** 背景互斥检测 */
  private detectBackgroundConflict(atoms: string[]): string[] {
    const bgAtoms = atoms.filter(a => BACKGROUND_ATOMS.has(a));
    if (bgAtoms.length > 1) {
      return bgAtoms;
    }
    return [];
  }
}

// ══════════════════════════════════════════════════════════
// 映射引擎
// ══════════════════════════════════════════════════════════

export class DecorationMapper {
  private registry: Record<string, CssTemplate>;

  constructor(registry: Record<string, CssTemplate> = ATOM_REGISTRY) {
    this.registry = registry;
  }

  /** 主入口：将 Decoration Plan 映射为 CSS + HTML */
  map(plan: DecorationPlan): MapResult {
    const result: MapResult = { css: {}, html: {} };

    for (const [componentName, decoration] of Object.entries(plan.components)) {
      const cssParts: string[] = [];
      const htmlParts: string[] = [];

      for (const atom of decoration.atoms) {
        const template = this.registry[atom.id];
        if (!template) continue;

        // 1. 参数合并：用户参数 + 默认值 + 衍生参数
        const merged = this.mergeParams(template.params, atom.params);

        // 2. 计算衍生参数（如 sizeHalf, dotRadius）
        this.computeDerivedParams(merged);

        // 3. 构建替换上下文
        const context: Record<string, string | number> = {
          ...merged,
          component: componentName,
          variant: decoration.variant,
        };

        // 4. CSS 替换
        const css = this.replaceParams(template.css, context);

        // 5. 判断 CSS 类型并生成完整选择器
        const stripped = css.trim();
        if (stripped.startsWith(".wemd-")) {
          // 完整 CSS 规则（含选择器），直接追加，补闭合 }
          let finalCss = css;
          if (!finalCss.trimEnd().endsWith("}")) {
            finalCss += "\n}";
          }
          cssParts.push(finalCss);
        } else {
          // 纯属性，用父选择器包裹
          cssParts.push(css);
        }

        // 6. HTML 替换
        if (template.html) {
          const html = this.replaceParams(template.html, context);
          htmlParts.push(html);
        }
      }

      result.css[componentName] = cssParts.join("\n\n");
      result.html[componentName] = htmlParts.join("\n");
    }

    return result;
  }

  /** 参数合并：用户参数覆盖默认值 */
  private mergeParams(defs: Record<string, ParamDef>, userParams: AtomParams): Record<string, string | number> {
    const merged: Record<string, string | number> = {};
    for (const [key, def] of Object.entries(defs)) {
      const userVal = userParams[key];
      if (userVal !== undefined) {
        // 参数验证
        if (def.type === "number") {
          const num = Number(userVal);
          if (!isNaN(num) && def.min !== undefined && def.max !== undefined) {
            merged[key] = Math.max(def.min, Math.min(def.max, num));
          } else if (!isNaN(num)) {
            merged[key] = num;
          } else {
            merged[key] = def.default;
          }
        } else if (def.type === "enum" && def.values) {
          merged[key] = def.values.includes(String(userVal)) ? String(userVal) : def.default;
        } else {
          merged[key] = String(userVal);
        }
      } else {
        merged[key] = def.default;
      }
    }
    return merged;
  }

  /** 计算衍生参数 */
  private computeDerivedParams(params: Record<string, string | number>): void {
    // sizeHalf 用于 pattern SVG
    if (params.size !== undefined && typeof params.size === "number") {
      (params as any)["sizeHalf"] = params.size / 2;
    }
  }

  /** 占位符替换 */
  private replaceParams(template: string, params: Record<string, string | number>): string {
    let result = template;
    for (const [key, value] of Object.entries(params)) {
      result = result.replace(new RegExp(`\\{${key}\\}`, "g"), String(value));
    }
    return result;
  }
}

// ══════════════════════════════════════════════════════════
// Decoration Layer 主入口
// ══════════════════════════════════════════════════════════

export interface DecorationLayerInput {
  keywords: string[];
  density: "low" | "medium" | "high";
  mappedComponents: Array<{ component: string; variant: string }>;
  decorationPlan?: DecorationPlan; // 如果 AI 提供了，直接使用；否则自动生成
  brandFilterOptions?: BrandFilterOptions;
}

export interface DecorationLayerOutput {
  decorationPlan: DecorationPlan;
  mapResult: MapResult;
  validationResult: Record<string, ValidationResult>;
  brandFilter: BrandFilterResult;
}

export function runDecorationLayer(input: DecorationLayerInput): DecorationLayerOutput {
  // 1. 品牌过滤
  const filterEngine = new BrandFilterEngine();
  const brandFilter = filterEngine.evaluate(input.keywords, {
    ...input.brandFilterOptions,
    densityOverride: input.density,
  });

  // 2. 如果有 AI 提供的 DecorationPlan，直接使用
  // 否则生成一个默认的（基于品牌过滤的推荐）
  let decorationPlan: DecorationPlan;
  if (input.decorationPlan) {
    decorationPlan = input.decorationPlan;
  } else {
    decorationPlan = generateDefaultDecorationPlan(input.mappedComponents, brandFilter);
  }

  // 3. 组合校验
  const validator = new CombinationValidator();
  const validationResult: Record<string, ValidationResult> = {};
  for (const [component, decoration] of Object.entries(decorationPlan.components)) {
    validationResult[component] = validator.validate(
      component,
      decoration.atoms,
      decorationPlan.brandFilter.density
    );
  }

  // 4. 映射
  const mapper = new DecorationMapper();
  const mapResult = mapper.map(decorationPlan);

  return { decorationPlan, mapResult, validationResult, brandFilter };
}

/** 生成默认装饰方案（当 AI 未提供 DecorationPlan 时回退使用） */
function generateDefaultDecorationPlan(
  components: Array<{ component: string; variant: string }>,
  brandFilter: BrandFilterResult
): DecorationPlan {
  const plan: DecorationPlan = {
    brandFilter: {
      keywords: [],
      allowedAtoms: brandFilter.allowedAtoms,
      density: brandFilter.density,
    },
    components: {},
  };

  // 为每个组件分配一个简单的装饰
  for (const { component, variant } of components) {
    const atoms: DecorationAtom[] = [];

    // 根据组件类型推荐装饰
    if (["hero-banner", "cta-card", "callout-pro", "magazine-cover"].includes(component)) {
      // 视觉焦点组件 → 渐变背景
      if (brandFilter.allowedAtoms.includes("bg-gradient")) {
        atoms.push({ id: "bg-gradient", params: { angle: "135deg", color1: "var(--wemd-primary)", color2: "var(--wemd-primary-dark)" } });
      }
    } else if (["section-title", "numbered-heading", "quote-card", "pullquote"].includes(component)) {
      // 标题/引用组件 → 左竖线
      if (brandFilter.allowedAtoms.includes("line-left")) {
        atoms.push({ id: "line-left", params: { width: 4, color: "var(--wemd-primary)", gap: 12 } });
      }
    } else if (["divider", "divider-fancy", "section-divider"].includes(component)) {
      // 分隔线组件
      if (brandFilter.allowedAtoms.includes("divider-gradient")) {
        atoms.push({ id: "divider-gradient", params: { width: 2, color: "var(--wemd-primary)", marginY: 16 } });
      } else if (brandFilter.allowedAtoms.includes("divider-solid")) {
        atoms.push({ id: "divider-solid", params: { width: 1, color: "var(--wemd-border)", marginY: 16 } });
      }
    } else if (["stats-block", "testimonial-card", "author-card", "brand-sign"].includes(component)) {
      // 卡片类组件 → 柔和背景 + 圆角
      if (brandFilter.allowedAtoms.includes("bg-soft")) {
        atoms.push({ id: "bg-soft", params: { color: "var(--wemd-primary)", opacity: 0.05 } });
      }
      if (brandFilter.allowedAtoms.includes("corner-rounded")) {
        atoms.push({ id: "corner-rounded", params: { radius: 12 } });
      }
    } else if (["tag-label", "badge", "steps"].includes(component)) {
      // 标签/步骤类 → 药丸标记
      if (brandFilter.allowedAtoms.includes("badge-pill")) {
        atoms.push({ id: "badge-pill", params: { text: "NEW", color: "var(--wemd-accent)", fontSize: 13 } });
      }
    } else {
      // 其他组件 → 柔和背景
      if (brandFilter.allowedAtoms.includes("corner-soft")) {
        atoms.push({ id: "corner-soft", params: {} });
      }
    }

    plan.components[component] = { variant, atoms };
  }

  return plan;
}