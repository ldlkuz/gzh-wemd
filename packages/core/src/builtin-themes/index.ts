/**
 * 内置主题定义 —— ThemeDefinition JSON 格式
 *
 * 12 套可选主题 + 5 套 legacy（纯 CSS，兼容历史文章）
 *
 * 每套主题 = Meta + DesignTokens + LayoutPreference
 * Theme 只提供设计 Token（颜色/字体/圆角/阴影），组件自行消费 var(--wemd-*)。
 * 组件 variant 推荐写入 layout.defaultVariants，供 AI 排版参考。
 */
import type { ThemeDefinition } from "../theme-schema/types";

// ============================================================
// 默认主题 · 微信绿
// 设计语言：经典微信绿主色，中性灰底，编辑式排版
// 全程不用投影、外发光、渐变或伪元素装饰，保证微信兼容性。
// ============================================================

const themeDefault: ThemeDefinition = {
  meta: {
    id: "default",
    name: "默认主题",
    description: "微信绿 · 经典编辑式排版，微信兼容稳定",
    keywords: ["通用", "微信绿", "编辑", "清新"],
    version: "2.0.0",
  },
  tokens: {
    color: {
      primary: "#07c160",
      primaryDark: "#0a8f4a",
      primaryLight: "#d1fae5",
      secondary: "#0a8f4a",
      accent: "#07c160",
      background: "#ffffff",
      bgSoft: "#f7f8fa",
      bgCard: "#ffffff",
      bgMuted: "#f0fdf4",
      textStrong: "#1a1a1a",
      textNormal: "#334155",
      textSoft: "#475569",
      border: "#e2e8f0",
      borderSoft: "#f0f0f0",
    },
    typography: {
      fontFamily:
        '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif',
      fontSize: "16px",
      lineHeight: "1.8",
      letterSpacing: 0.4,
      heading: {
        h1: {
          fontSize: 30,
          color: "#1a1a1a",
          marginTop: 10,
          marginBottom: 28,
          fontWeight: "800",
          preset: "top-border",
          presetColor: "#07c160",
          letterSpacing: -0.3,
        },
        h2: {
          fontSize: 22,
          color: "#0a8f4a",
          marginTop: 42,
          marginBottom: 16,
          fontWeight: "700",
          preset: "bottom-border",
          presetColor: "#d1fae5",
          letterSpacing: 0.2,
        },
        h3: {
          fontSize: 18,
          color: "#0a8f4a",
          marginTop: 30,
          marginBottom: 12,
          fontWeight: "600",
          preset: "left-border",
          presetColor: "#07c160",
          letterSpacing: 0.2,
        },
        h4: {
          fontSize: 15,
          color: "#07c160",
          marginTop: 26,
          marginBottom: 10,
          fontWeight: "700",
          letterSpacing: 1,
        },
      },
      codeFontFamily:
        '"SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, monospace',
    },
    spacing: { pagePadding: 8, paragraphMargin: 16 },
    border: { radius: 8 },
    shadow: { enabled: false, value: "" },
  },
  layout: {
    preferredComponents: [
      "quote-card",
      "divider-fancy",
      "share-card",
      "follow-bar",
    ],
    density: "medium",
    tone: ["warm", "modern"],
    defaultVariants: { "share-card": "warm" },
  },
};

// ============================================================
// 数据蓝图（科技蓝）
// ============================================================

const themeDataBlueprint: ThemeDefinition = {
  meta: {
    id: "data-blueprint",
    name: "数据蓝图",
    description: "科技蓝色调，理性专业，适合技术文章和数据报告",
    keywords: ["科技", "数据", "专业", "技术"],
    version: "1.0.0",
  },
  tokens: {
    color: {
      primary: "#0ea5e9",
      primaryDark: "#0369a1",
      primaryLight: "#e0f2fe",
      secondary: "#0369a1",
      accent: "#06b6d4",
      background: "#ffffff",
      bgSoft: "#f0f9ff",
      bgCard: "#0c4a6e",
      bgMuted: "#e0f2fe",
      textStrong: "#082f49",
      textNormal: "#1e293b",
      textSoft: "#475569",
      border: "#bae6fd",
      borderSoft: "#e0f2fe",
    },
    typography: {
      fontFamily:
        '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif',
      fontSize: "16px",
      lineHeight: "1.8",
      letterSpacing: 0.2,
      heading: {
        h1: {
          fontSize: 28,
          color: "#082f49",
          marginTop: 32,
          marginBottom: 18,
          fontWeight: "700",
          preset: "left-border",
          presetColor: "#0ea5e9",
        },
        h2: {
          fontSize: 22,
          color: "#0369a1",
          marginTop: 28,
          marginBottom: 14,
          fontWeight: "600",
          preset: "left-border",
          presetColor: "#0ea5e9",
        },
        h3: {
          fontSize: 19,
          color: "#0ea5e9",
          marginTop: 24,
          marginBottom: 12,
          fontWeight: "600",
        },
        h4: {
          fontSize: 17,
          color: "#06b6d4",
          marginTop: 20,
          marginBottom: 10,
          fontWeight: "600",
        },
      },
      codeFontFamily: '"SF Mono", Monaco, Consolas, monospace',
    },
    spacing: { pagePadding: 8, paragraphMargin: 12 },
    border: { radius: 6 },
    shadow: { enabled: false, value: "" },
  },
  layout: {
    preferredComponents: [
      "stats-block",
      "code-frame",
      "styled-table",
      "quote-card",
    ],
    density: "high",
    tone: ["rational", "serious"],
    defaultVariants: { "share-card": "tech" },
  },
  codeTheme: "github-dark",
};

// ============================================================
// 东方笺谱（朱砂红）
// ============================================================

const themeEasternNotes: ThemeDefinition = {
  meta: {
    id: "eastern-notes",
    name: "东方笺谱",
    description: "朱砂红配米黄色，古典雅致，适合文化艺术类内容",
    keywords: ["东方", "古典", "文化", "雅致"],
    version: "1.0.0",
  },
  tokens: {
    color: {
      primary: "#c1272d",
      primaryDark: "#8b1a1f",
      primaryLight: "#f5d7d7",
      secondary: "#8b1a1f",
      accent: "#d4393f",
      background: "#faf3e8",
      bgSoft: "#f5e8d0",
      bgCard: "#fffbf5",
      bgMuted: "#fdf2f2",
      textStrong: "#3a2a1f",
      textNormal: "#5a4a3f",
      textSoft: "#6b5b4a",
      border: "#e5d5b8",
      borderSoft: "#ede0cc",
    },
    typography: {
      fontFamily:
        '"Noto Serif SC", "STSong", SimSun, "PingFang SC", "Microsoft YaHei", serif',
      fontSize: "16px",
      lineHeight: "1.9",
      letterSpacing: 0.3,
      heading: {
        h1: {
          fontSize: 28,
          color: "#8b1a1f",
          marginTop: 36,
          marginBottom: 20,
          fontWeight: "700",
          preset: "bottom-border",
          centered: true,
        },
        h2: {
          fontSize: 22,
          color: "#c1272d",
          marginTop: 28,
          marginBottom: 16,
          fontWeight: "600",
          preset: "left-border",
        },
        h3: {
          fontSize: 19,
          color: "#8b1a1f",
          marginTop: 24,
          marginBottom: 12,
          fontWeight: "600",
        },
        h4: {
          fontSize: 17,
          color: "#c1272d",
          marginTop: 20,
          marginBottom: 10,
          fontWeight: "600",
        },
      },
      codeFontFamily: '"SF Mono", Monaco, Consolas, monospace',
    },
    spacing: { pagePadding: 8, paragraphMargin: 10 },
    border: { radius: 2 },
    shadow: { enabled: false, value: "" },
  },
  layout: {
    preferredComponents: ["quote-card", "divider-fancy", "end-card"],
    density: "low",
    tone: ["warm", "elegant"],
    defaultVariants: { "share-card": "warm" },
  },
  codeTheme: "github-dark",
};

// ============================================================
// 清晰指南（Monospace + 绿色系）
// ============================================================

const themeClearGuide: ThemeDefinition = {
  meta: {
    id: "clear-guide",
    name: "清晰指南",
    description: "等宽字体 + 翠绿色系，清晰易读，适合教程文档",
    keywords: ["清晰", "教程", "文档", "指南"],
    version: "1.0.0",
  },
  tokens: {
    color: {
      primary: "#10b981",
      primaryDark: "#059669",
      primaryLight: "#d1fae5",
      secondary: "#059669",
      accent: "#f59e0b",
      background: "#ffffff",
      bgSoft: "#f0fdf4",
      bgCard: "#ffffff",
      bgMuted: "#f8fafc",
      textStrong: "#1a2e05",
      textNormal: "#374151",
      textSoft: "#6b7280",
      border: "#d1e7d9",
      borderSoft: "#e8f5ee",
    },
    typography: {
      fontFamily:
        '"IBM Plex Sans", -apple-system, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif',
      fontSize: "16px",
      lineHeight: "1.75",
      letterSpacing: 0.1,
      heading: {
        h1: {
          fontSize: 26,
          color: "#1a2e05",
          marginTop: 28,
          marginBottom: 16,
          fontWeight: "700",
          preset: "bottom-border",
        },
        h2: {
          fontSize: 20,
          color: "#059669",
          marginTop: 24,
          marginBottom: 12,
          fontWeight: "600",
          preset: "left-border",
        },
        h3: {
          fontSize: 18,
          color: "#065f46",
          marginTop: 20,
          marginBottom: 10,
          fontWeight: "600",
        },
        h4: {
          fontSize: 16,
          color: "#f59e0b",
          marginTop: 18,
          marginBottom: 8,
          fontWeight: "600",
        },
      },
      codeFontFamily: '"JetBrains Mono", "Fira Code", Consolas, monospace',
    },
    spacing: { pagePadding: 8, paragraphMargin: 10 },
    border: { radius: 4 },
    shadow: { enabled: false, value: "" },
  },
  layout: {
    preferredComponents: [
      "toc-nav",
      "code-frame",
      "callout-pro",
      "numbered-heading",
    ],
    density: "medium",
    tone: ["rational", "minimal"],
    defaultVariants: { "share-card": "minimal" },
  },
  codeTheme: "github-dark",
};

// ============================================================
// 留白画册（极简白）
// ============================================================

const themeWhitespaceGallery: ThemeDefinition = {
  meta: {
    id: "whitespace-gallery",
    name: "留白画册",
    description: "极简白色调，大量留白，适合品牌展示和设计感内容",
    keywords: ["极简", "留白", "品牌", "设计"],
    version: "1.0.0",
  },
  tokens: {
    color: {
      primary: "#374151",
      primaryDark: "#1f2937",
      primaryLight: "#f3f4f6",
      secondary: "#6b7280",
      accent: "#8b6f47",
      background: "#ffffff",
      bgSoft: "#fafafa",
      bgCard: "#ffffff",
      bgMuted: "#f5f5f5",
      textStrong: "#111827",
      textNormal: "#4b5563",
      textSoft: "#9ca3af",
      border: "#e5e7eb",
      borderSoft: "#f3f4f6",
    },
    typography: {
      fontFamily:
        '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif',
      fontSize: "16px",
      lineHeight: "2.0",
      letterSpacing: 0.5,
      heading: {
        h1: {
          fontSize: 32,
          color: "#111827",
          marginTop: 48,
          marginBottom: 28,
          fontWeight: "300",
          centered: true,
        },
        h2: {
          fontSize: 24,
          color: "#1f2937",
          marginTop: 36,
          marginBottom: 20,
          fontWeight: "300",
          preset: "bottom-border",
        },
        h3: {
          fontSize: 20,
          color: "#374151",
          marginTop: 28,
          marginBottom: 14,
          fontWeight: "400",
        },
        h4: {
          fontSize: 17,
          color: "#6b7280",
          marginTop: 24,
          marginBottom: 10,
          fontWeight: "500",
        },
      },
      codeFontFamily: '"SF Mono", Monaco, Consolas, monospace',
    },
    spacing: { pagePadding: 12, paragraphMargin: 14 },
    border: { radius: 0 },
    shadow: { enabled: false, value: "" },
  },
  layout: {
    preferredComponents: ["divider-fancy", "image-card", "full-quote"],
    density: "low",
    tone: ["minimal", "elegant"],
    defaultVariants: { "share-card": "minimal" },
  },
  codeTheme: "github-dark",
};

// ============================================================
// 学术论文（米白底 + 深墨蓝 + 深蓝卡片）
// 设计语言：原"全黑严谨"在微信白底下过于沉重且 primary 与 textStrong 相同。
// 改为米白底+深墨蓝字（可读），深蓝卡片承载学术权威感，
// serif 字体 + 双横线标题预设保持学术克制。
// ============================================================

const themeAcademicPaper: ThemeDefinition = {
  meta: {
    id: "academic-paper",
    name: "学术论文",
    description: "米白底配深墨蓝，严谨克制，适合论文、深度分析",
    keywords: ["学术", "论文", "严谨", "深度"],
    version: "2.0.0",
  },
  tokens: {
    color: {
      primary: "#1e3a5f",
      primaryDark: "#0f2540",
      primaryLight: "#e3eaf2",
      secondary: "#0f2540",
      accent: "#8b0000",
      background: "#fbfaf7",
      bgSoft: "#f4f2ec",
      bgCard: "#0f2540",
      bgMuted: "#eeebe2",
      textStrong: "#0f1b2d",
      textNormal: "#2c3e50",
      textSoft: "#5a6a7a",
      border: "#c8c0a8",
      borderSoft: "#e0dccf",
    },
    typography: {
      fontFamily:
        '"Georgia", "Times New Roman", "STSong", SimSun, "PingFang SC", serif',
      fontSize: "16px",
      lineHeight: "1.8",
      letterSpacing: 0.2,
      heading: {
        h1: {
          fontSize: 24,
          color: "#0f1b2d",
          marginTop: 36,
          marginBottom: 18,
          fontWeight: "700",
          centered: true,
        },
        h2: {
          fontSize: 20,
          color: "#1e3a5f",
          marginTop: 28,
          marginBottom: 14,
          fontWeight: "600",
          preset: "bottom-border",
          presetColor: "#1e3a5f",
        },
        h3: {
          fontSize: 17,
          color: "#1e3a5f",
          marginTop: 22,
          marginBottom: 10,
          fontWeight: "600",
        },
        h4: {
          fontSize: 15,
          color: "#5a6a7a",
          marginTop: 18,
          marginBottom: 8,
          fontWeight: "600",
        },
      },
      codeFontFamily: '"Source Code Pro", Consolas, monospace',
    },
    spacing: { pagePadding: 8, paragraphMargin: 6 },
    border: { radius: 0 },
    shadow: { enabled: false, value: "" },
  },
  layout: {
    preferredComponents: ["stats-block", "styled-table", "toc-nav"],
    density: "medium",
    tone: ["serious", "rational"],
    defaultVariants: { "share-card": "minimal" },
  },
};

// ============================================================
// 知识库（温润浅灰 + 蓝）
// ============================================================

const themeKnowledgeBase: ThemeDefinition = {
  meta: {
    id: "knowledge-base",
    name: "知识库",
    description: "温润浅灰配蓝色，适合知识管理、文档系统",
    keywords: ["知识", "文档", "温和", "专业"],
    version: "1.0.0",
  },
  tokens: {
    color: {
      primary: "#4a90d9",
      primaryDark: "#2e6bb5",
      primaryLight: "#e3effb",
      secondary: "#2e6bb5",
      accent: "#4a90d9",
      background: "#fafbfc",
      bgSoft: "#f6f8fa",
      bgCard: "#ffffff",
      bgMuted: "#f0f2f5",
      textStrong: "#24292e",
      textNormal: "#444d56",
      textSoft: "#6a737d",
      border: "#e1e4e8",
      borderSoft: "#f0f3f6",
    },
    typography: {
      fontFamily:
        '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif',
      fontSize: "15px",
      lineHeight: "1.75",
      letterSpacing: 0.2,
      heading: {
        h1: {
          fontSize: 26,
          color: "#24292e",
          marginTop: 32,
          marginBottom: 16,
          fontWeight: "600",
          preset: "bottom-border",
        },
        h2: {
          fontSize: 21,
          color: "#24292e",
          marginTop: 26,
          marginBottom: 12,
          fontWeight: "600",
          preset: "left-border",
        },
        h3: {
          fontSize: 18,
          color: "#444d56",
          marginTop: 22,
          marginBottom: 10,
          fontWeight: "600",
        },
        h4: {
          fontSize: 16,
          color: "#4a90d9",
          marginTop: 18,
          marginBottom: 8,
          fontWeight: "600",
        },
      },
      codeFontFamily: '"SF Mono", Monaco, Consolas, monospace',
    },
    spacing: { pagePadding: 8, paragraphMargin: 8 },
    border: { radius: 6 },
    shadow: { enabled: true, value: "0 1px 3px rgba(0,0,0,0.06)" },
  },
  layout: {
    preferredComponents: ["toc-nav", "callout-pro", "code-frame", "quote-card"],
    density: "medium",
    tone: ["rational", "minimal"],
    defaultVariants: { "share-card": "minimal" },
  },
};

// ============================================================
// 黑金奢华（暖米底 + 深棕卡片 + 金色贯穿）
// 设计语言：微信约束下 #wemd 不能设 background-color，所以正文区是微信白底容器。
// 解法：正文区用暖米白底+深棕字（可读且有奢华温度），
//       卡片组件（bgCard）用深棕黑底+金字（黑金的"黑"在卡片块体现），
//       金色贯穿所有装饰元素（标题/边框/阴影/分隔线）。
// hero-banner 的 center/left variant 自带深色渐变，与深色卡片呼应。
// ============================================================

const themeLuxuryGold: ThemeDefinition = {
  meta: {
    id: "luxury-gold",
    name: "黑金奢华",
    description:
      "暖米底配深棕卡片，金色贯穿装饰，奢华高端，适合品牌营销、高端内容",
    keywords: ["奢华", "高端", "黑金", "品牌"],
    version: "2.0.0",
  },
  tokens: {
    color: {
      primary: "#d4af37",
      primaryDark: "#b8960c",
      primaryLight: "#fef3c7",
      secondary: "#c5a028",
      accent: "#d4af37",
      background: "#faf6ed",
      bgSoft: "#f5edd6",
      bgCard: "#1a1410",
      bgMuted: "#f0e6d0",
      textStrong: "#1f1410",
      textNormal: "#3d2818",
      textSoft: "#7a6450",
      border: "#d4af37",
      borderSoft: "#e8d196",
    },
    typography: {
      fontFamily:
        '"Georgia", "Times New Roman", "PingFang SC", "Microsoft YaHei", serif',
      fontSize: "16px",
      lineHeight: "1.9",
      letterSpacing: 0.4,
      heading: {
        h1: {
          fontSize: 30,
          color: "#d4af37",
          marginTop: 40,
          marginBottom: 22,
          fontWeight: "700",
          preset: "double-line",
          centered: true,
        },
        h2: {
          fontSize: 22,
          color: "#d4af37",
          marginTop: 30,
          marginBottom: 16,
          fontWeight: "600",
          preset: "left-border",
        },
        h3: {
          fontSize: 19,
          color: "#c5a028",
          marginTop: 24,
          marginBottom: 12,
          fontWeight: "600",
        },
        h4: {
          fontSize: 17,
          color: "#d4af37",
          marginTop: 20,
          marginBottom: 10,
          fontWeight: "600",
        },
      },
      codeFontFamily: '"Fira Code", Consolas, monospace',
    },
    spacing: { pagePadding: 10, paragraphMargin: 10 },
    border: { radius: 2 },
    shadow: { enabled: true, value: "0 4px 24px rgba(212,175,55,0.18)" },
  },
  layout: {
    preferredComponents: [
      "hero-banner",
      "magazine-cover",
      "full-quote",
      "end-card",
    ],
    density: "high",
    tone: ["elegant", "warm"],
    defaultVariants: { "share-card": "warm" },
  },
};

// ============================================================
// 莫兰迪森林（柔和自然）
// ============================================================

const themeMorandiForest: ThemeDefinition = {
  meta: {
    id: "morandi-forest",
    name: "莫兰迪森林",
    description: "莫兰迪色系，柔和自然，适合生活方式、情感类内容",
    keywords: ["莫兰迪", "柔和", "自然", "生活方式"],
    version: "1.0.0",
  },
  tokens: {
    color: {
      primary: "#7a9a7e",
      primaryDark: "#5a7a5e",
      primaryLight: "#e8f0e9",
      secondary: "#8b9a8b",
      accent: "#c4a882",
      background: "#f8f6f3",
      bgSoft: "#f4f2ef",
      bgCard: "#fdfcfa",
      bgMuted: "#efece8",
      textStrong: "#2e3a2f",
      textNormal: "#4a5a4b",
      textSoft: "#7a807a",
      border: "#c8c0b0",
      borderSoft: "#e0d8c8",
    },
    typography: {
      fontFamily:
        '"Georgia", "Noto Serif SC", "PingFang SC", "Microsoft YaHei", serif',
      fontSize: "16px",
      lineHeight: "1.9",
      letterSpacing: 0.3,
      heading: {
        h1: {
          fontSize: 28,
          color: "#2e3a2f",
          marginTop: 36,
          marginBottom: 20,
          fontWeight: "600",
          preset: "bottom-border",
          presetColor: "#7a9a7e",
        },
        h2: {
          fontSize: 22,
          color: "#5a7a5e",
          marginTop: 28,
          marginBottom: 14,
          fontWeight: "600",
          preset: "left-border",
          presetColor: "#7a9a7e",
        },
        h3: {
          fontSize: 19,
          color: "#5a7a5e",
          marginTop: 24,
          marginBottom: 12,
          fontWeight: "600",
        },
        h4: {
          fontSize: 17,
          color: "#c4a882",
          marginTop: 20,
          marginBottom: 10,
          fontWeight: "600",
        },
      },
      codeFontFamily: '"SF Mono", Monaco, Consolas, monospace',
    },
    spacing: { pagePadding: 8, paragraphMargin: 10 },
    border: { radius: 4 },
    shadow: { enabled: false, value: "" },
  },
  layout: {
    preferredComponents: [
      "quote-card",
      "image-card",
      "section-divider",
      "end-card",
    ],
    density: "low",
    tone: ["warm", "elegant"],
    defaultVariants: { "share-card": "warm" },
  },
};

// ============================================================
// 编辑部手记（杂志风格）
// ============================================================

const themeModernEditorial: ThemeDefinition = {
  meta: {
    id: "modern-editorial",
    name: "编辑部手记",
    description: "现代杂志排版风格，适合深度长文、编辑精选",
    keywords: ["杂志", "编辑", "深度", "长文"],
    version: "1.0.0",
  },
  tokens: {
    color: {
      primary: "#2d3436",
      primaryDark: "#1a1a1a",
      primaryLight: "#e8e8e8",
      secondary: "#636e72",
      accent: "#0984e3",
      background: "#ffffff",
      bgSoft: "#f5f6fa",
      bgCard: "#ffffff",
      bgMuted: "#f0f0f0",
      textStrong: "#1a1a1a",
      textNormal: "#2d3436",
      textSoft: "#636e72",
      border: "#dfe6e9",
      borderSoft: "#eef3f5",
    },
    typography: {
      fontFamily: '"Noto Serif SC", "Georgia", "STSong", "PingFang SC", serif',
      fontSize: "17px",
      lineHeight: "1.9",
      letterSpacing: 0.4,
      heading: {
        h1: {
          fontSize: 34,
          color: "#1a1a1a",
          marginTop: 48,
          marginBottom: 24,
          fontWeight: "700",
          preset: "bottom-border",
          presetColor: "#0984e3",
          centered: true,
          letterSpacing: 2,
        },
        h2: {
          fontSize: 26,
          color: "#2d3436",
          marginTop: 36,
          marginBottom: 18,
          fontWeight: "600",
          preset: "left-border",
          presetColor: "#0984e3",
        },
        h3: {
          fontSize: 20,
          color: "#0984e3",
          marginTop: 28,
          marginBottom: 14,
          fontWeight: "600",
        },
        h4: {
          fontSize: 17,
          color: "#0984e3",
          marginTop: 24,
          marginBottom: 10,
          fontWeight: "600",
          letterSpacing: 0.5,
        },
      },
      codeFontFamily: '"SF Mono", Monaco, Consolas, monospace',
    },
    spacing: { pagePadding: 10, paragraphMargin: 12 },
    border: { radius: 2 },
    shadow: { enabled: false, value: "" },
  },
  layout: {
    preferredComponents: [
      "magazine-cover",
      "section-divider",
      "full-quote",
      "two-column-cards",
      "end-card",
    ],
    density: "high",
    tone: ["elegant", "serious"],
    defaultVariants: { "share-card": "minimal" },
  },
  codeTheme: "github-dark",
};

// ============================================================
// 购物小票（复古热敏纸）
// ============================================================

const themeReceipt: ThemeDefinition = {
  meta: {
    id: "receipt",
    name: "购物小票",
    description: "热敏纸复古风格，趣味横生，适合轻松内容、清单合集",
    keywords: ["复古", "趣味", "清单", "小票"],
    version: "1.0.0",
  },
  tokens: {
    color: {
      primary: "#2d3436",
      primaryDark: "#1a1a1a",
      primaryLight: "#f0f0f0",
      secondary: "#636e72",
      accent: "#c0392b",
      background: "#faf6ed",
      bgSoft: "#f5edd6",
      bgCard: "#fffaeb",
      bgMuted: "#f0e6c8",
      textStrong: "#2d3436",
      textNormal: "#3d4548",
      textSoft: "#7a8085",
      border: "#d4c89a",
      borderSoft: "#e8d8a8",
    },
    typography: {
      fontFamily: '"Courier New", "Source Code Pro", "PingFang SC", monospace',
      fontSize: "15px",
      lineHeight: "1.6",
      letterSpacing: 0,
      heading: {
        h1: {
          fontSize: 22,
          color: "#2d3436",
          marginTop: 28,
          marginBottom: 16,
          fontWeight: "700",
          preset: "double-line",
          centered: true,
        },
        h2: {
          fontSize: 18,
          color: "#2d3436",
          marginTop: 22,
          marginBottom: 12,
          fontWeight: "600",
          preset: "bottom-border",
        },
        h3: {
          fontSize: 16,
          color: "#4a4a4a",
          marginTop: 18,
          marginBottom: 8,
          fontWeight: "600",
        },
        h4: {
          fontSize: 15,
          color: "#636e72",
          marginTop: 16,
          marginBottom: 6,
          fontWeight: "600",
        },
      },
      codeFontFamily: '"Courier New", Consolas, monospace',
    },
    spacing: { pagePadding: 6, paragraphMargin: 4 },
    border: { radius: 2 },
    shadow: { enabled: true, value: "0 1px 3px rgba(212,175,55,0.08)" },
  },
  layout: {
    preferredComponents: ["quote-card", "divider-fancy", "numbered-heading"],
    density: "low",
    tone: ["playful", "minimal"],
    defaultVariants: { "share-card": "minimal" },
  },
};

// ============================================================
// 落日胶片（暖橙色调）
// ============================================================

const themeSunsetFilm: ThemeDefinition = {
  meta: {
    id: "sunset-film",
    name: "落日胶片",
    description: "暖橙胶片色调，温暖怀旧，适合旅行、摄影、故事类内容",
    keywords: ["温暖", "怀旧", "旅行", "摄影", "故事"],
    version: "1.0.0",
  },
  tokens: {
    color: {
      primary: "#e67e22",
      primaryDark: "#c0600c",
      primaryLight: "#fdebd0",
      secondary: "#d35400",
      accent: "#f39c12",
      background: "#fef9f3",
      bgSoft: "#fdf2e9",
      bgCard: "#fefcf9",
      bgMuted: "#f8ede0",
      textStrong: "#3e2723",
      textNormal: "#5d4037",
      textSoft: "#8d6e63",
      border: "#e0c8b0",
      borderSoft: "#efe0d0",
    },
    typography: {
      fontFamily:
        '"Georgia", "Noto Serif SC", "PingFang SC", "Microsoft YaHei", serif',
      fontSize: "16px",
      lineHeight: "1.85",
      letterSpacing: 0.3,
      heading: {
        h1: {
          fontSize: 30,
          color: "#c0600c",
          marginTop: 40,
          marginBottom: 22,
          fontWeight: "700",
          preset: "bottom-border",
          centered: true,
        },
        h2: {
          fontSize: 24,
          color: "#d35400",
          marginTop: 32,
          marginBottom: 16,
          fontWeight: "600",
          preset: "left-border",
        },
        h3: {
          fontSize: 20,
          color: "#5d4037",
          marginTop: 26,
          marginBottom: 12,
          fontWeight: "600",
        },
        h4: {
          fontSize: 17,
          color: "#e67e22",
          marginTop: 22,
          marginBottom: 10,
          fontWeight: "600",
        },
      },
      codeFontFamily: '"SF Mono", Monaco, Consolas, monospace',
    },
    spacing: { pagePadding: 8, paragraphMargin: 10 },
    border: { radius: 6 },
    shadow: { enabled: false, value: "" },
  },
  layout: {
    preferredComponents: [
      "quote-card",
      "image-card",
      "hero-banner",
      "end-card",
    ],
    density: "medium",
    tone: ["warm", "elegant"],
    defaultVariants: { "share-card": "warm" },
  },
};

// ============================================================
// 导出
// ============================================================

/** 12 套可选的内置主题 */
export const builtInThemeDefinitions: ThemeDefinition[] = [
  themeDefault,
  themeDataBlueprint,
  themeEasternNotes,
  themeClearGuide,
  themeWhitespaceGallery,
  themeAcademicPaper,
  themeKnowledgeBase,
  themeLuxuryGold,
  themeMorandiForest,
  themeModernEditorial,
  themeReceipt,
  themeSunsetFilm,
];

/** 按 ID 查找内置主题定义 */
export function getBuiltInThemeDefinition(
  id: string,
): ThemeDefinition | undefined {
  return builtInThemeDefinitions.find((t) => t.meta.id === id);
}
