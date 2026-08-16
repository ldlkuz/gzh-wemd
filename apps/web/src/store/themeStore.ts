// 主题状态管理
import { create } from "zustand";
import {
  builtInThemes,
  type CustomTheme,
  type DesignerVariables,
  type ThemeDefinition,
} from "./themes/builtInThemes";
import {
  convertCssToWeChatDarkMode,
  getBuiltInThemeDefinition,
  renderTheme,
  loadThemePackageFromJSON,
  loadThemePackageFromZip,
  repackThemePackage,
  type ValidationError,
  type LoadedThemePackage,
  type ThemePackageManifest,
} from "@wemd/core";
import { generateCSS } from "../components/Theme/ThemeDesigner/generateCSS";

// 深色模式 CSS 转换缓存
const darkCssCache = new Map<string, string>();
const DARK_MARK = "/* wemd-wechat-dark-converted */";

/** 文件名非法字符过滤（Windows /\:\*?"<>|，统一替换为下划线） */
const sanitizeFileName = (name: string): string =>
  name.replace(/[\\/:*?"<>|]/g, "_");

/** Blob 转 base64 data URL */
const blobToDataUrl = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

const hashCss = (css: string): string => {
  let hash = 0;
  for (let i = 0; i < css.length; i++) {
    hash = (hash << 5) - hash + css.charCodeAt(i);
    hash |= 0;
  }
  return hash.toString(16);
};

const buildDarkCacheKey = (themeId: string, css: string) =>
  `${themeId}:${hashCss(css)}`;
const clearDarkCssCache = () => darkCssCache.clear();

// localStorage 键名
const CUSTOM_THEMES_KEY = "wemd-custom-themes";
const SELECTED_THEME_KEY = "wemd-selected-theme";

const getBrowserStorage = (): Storage | null => {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const storage = window.localStorage as Partial<Storage>;
    if (
      typeof storage.getItem !== "function" ||
      typeof storage.setItem !== "function"
    ) {
      return null;
    }
    return storage as Storage;
  } catch {
    return null;
  }
};

const loadCustomThemes = (): CustomTheme[] => {
  const storage = getBrowserStorage();
  if (!storage) return [];
  try {
    const stored = storage.getItem(CUSTOM_THEMES_KEY);
    if (!stored) return [];
    const themes = JSON.parse(stored) as CustomTheme[];

    return themes.map((t) => {
      let newCss = t.css;
      const variables = t.designerVariables;

      if (variables) {
        if (!variables.underlineStyle) variables.underlineStyle = "solid";
        if (!variables.underlineColor)
          variables.underlineColor = "currentColor";
        newCss = generateCSS(variables);
      }

      const theme = {
        ...t,
        css: newCss,
        designerVariables: variables,
      };

      if (t.editorMode) {
        return theme;
      }

      return {
        ...theme,
        editorMode: t.designerVariables ? "visual" : "css",
      };
    });
  } catch (error) {
    console.error("加载自定义主题失败:", error);
    return [];
  }
};

// 保存自定义主题到 localStorage
const saveCustomThemes = (themes: CustomTheme[]): void => {
  const storage = getBrowserStorage();
  if (!storage) return;
  try {
    storage.setItem(CUSTOM_THEMES_KEY, JSON.stringify(themes));
  } catch (error) {
    console.error("保存自定义主题失败:", error);
  }
};

// 保存选中主题到 localStorage
const saveSelectedTheme = (themeId: string, themeName: string): void => {
  const storage = getBrowserStorage();
  if (!storage) return;
  try {
    storage.setItem(
      SELECTED_THEME_KEY,
      JSON.stringify({ id: themeId, name: themeName }),
    );
  } catch (error) {
    console.error("保存选中主题失败:", error);
  }
};

// 从 localStorage 加载选中主题
const loadSelectedTheme = (): { id: string; name: string } | null => {
  const storage = getBrowserStorage();
  if (!storage) return null;
  try {
    const stored = storage.getItem(SELECTED_THEME_KEY);
    if (!stored) return null;
    return JSON.parse(stored);
  } catch (error) {
    console.error("加载选中主题失败:", error);
    return null;
  }
};

// 初始化选中的主题（验证存在性）
const initialSelectedTheme = (() => {
  const saved = loadSelectedTheme();
  if (!saved) return null;
  const allThemes = [...builtInThemes, ...loadCustomThemes()];
  const exists = allThemes.some((t) => t.id === saved.id);
  return exists ? saved : null;
})();

/** 导入结果 */
export interface ImportResult {
  ok: boolean;
  errors?: ValidationError[];
  themeId?: string;
  /** 主题名重复时的现有主题信息 */
  duplicate?: { existingTheme: CustomTheme };
}

/**
 * 主题 Store 接口
 */
interface ThemeStore {
  // 当前主题
  themeId: string;
  themeName: string;
  customCSS: string;

  // 自定义主题列表
  customThemes: CustomTheme[];

  // 主题操作
  selectTheme: (themeId: string) => void;
  setCustomCSS: (css: string) => void;
  getThemeCSS: (themeId: string, darkMode?: boolean) => string;

  getAllThemes: () => CustomTheme[];

  // 主题 CRUD
  createTheme: (
    name: string,
    editorMode: "visual" | "css",
    css?: string,
    designerVariables?: DesignerVariables,
    definition?: ThemeDefinition,
    extra?: Partial<
      Pick<
        CustomTheme,
        | "sdkVersion"
        | "preview"
        | "brandText"
        | "readOnly"
        | "packageRaw"
        | "assets"
        | "componentsCss"
        | "extrasCss"
      >
    >,
  ) => CustomTheme;
  updateTheme: (
    id: string,
    updates: Partial<
      Pick<CustomTheme, "name" | "css" | "designerVariables" | "definition">
    >,
  ) => void;
  deleteTheme: (id: string) => void;
  duplicateTheme: (id: string, newName: string) => CustomTheme;

  // 导入导出
  /** 导出主题为 JSON 文件（含 designerVariables，可再次导入编辑） */
  exportTheme: (id: string) => void;
  /** 导出主题为 CSS 文件（纯样式代码） */
  exportThemeCSS: (id: string) => void;
  /** 导出主题为 .wemd-theme zip 压缩包（仅 readOnly 导入主题可用） */
  exportThemePackage: (id: string) => Promise<void>;
  /** 从 JSON 文件或 .wemd-theme zip 压缩包导入主题 */
  importTheme: (file: File) => Promise<ImportResult>;
}

export const useThemeStore = create<ThemeStore>((set, get) => ({
  themeId: initialSelectedTheme?.id ?? "default",
  themeName: initialSelectedTheme?.name ?? "默认主题",
  customCSS: "",
  customThemes: loadCustomThemes(),

  selectTheme: (themeId: string) => {
    const allThemes = get().getAllThemes();
    const theme = allThemes.find((t) => t.id === themeId);
    if (theme) {
      clearDarkCssCache();
      set({
        themeId: theme.id,
        themeName: theme.name,
        customCSS: theme.css,
      });
      saveSelectedTheme(theme.id, theme.name);
    }
  },

  setCustomCSS: (css: string) => {
    clearDarkCssCache();
    set({ customCSS: css });
  },

  getThemeCSS: (themeId: string, darkMode?: boolean) => {
    const state = get();
    let css: string;

    // 内置主题：有 definition 则走 renderTheme（结构化管线），否则回退 legacy CSS
    const builtIn = builtInThemes.find((t) => t.id === themeId);
    if (builtIn?.definition) {
      css = renderTheme(builtIn.definition);
    } else if (builtIn?.css) {
      css = builtIn.css;
    } else {
      // 自定义主题：有 definition 则用 renderTheme + 扩展选项，否则用存储的 CSS
      const custom = state.customThemes.find((t) => t.id === themeId);
      if (custom?.definition) {
        console.log(
          "[getThemeCSS] custom.definition.components keys:",
          Object.keys(custom.definition.components || {}),
        );
        console.log(
          "[getThemeCSS] sample component variantCss length:",
          custom.definition.components?.["hero-banner"]?.variantCss?.length ||
            0,
        );
        css = renderTheme(custom.definition, {
          componentsCss: custom.componentsCss,
          extrasCss: custom.extrasCss,
          assets: custom.assets,
        });
      } else {
        css = custom?.css || builtInThemes[0]?.css || "";
      }
    }

    // 深色模式下：使用微信颜色转换算法
    if (darkMode) {
      const cacheKey = buildDarkCacheKey(themeId, css);
      if (darkCssCache.has(cacheKey)) {
        return darkCssCache.get(cacheKey) as string;
      }
      const converted = css.includes(DARK_MARK)
        ? css
        : convertCssToWeChatDarkMode(css);
      darkCssCache.set(cacheKey, converted);
      return converted;
    }

    return css;
  },

  getAllThemes: () => {
    const state = get();
    return [...builtInThemes, ...state.customThemes];
  },

  createTheme: (
    name: string,
    editorMode: "visual" | "css",
    css?: string,
    designerVariables?: DesignerVariables,
    definition?: ThemeDefinition,
    extra?: Partial<
      Pick<
        CustomTheme,
        | "sdkVersion"
        | "preview"
        | "brandText"
        | "readOnly"
        | "packageRaw"
        | "assets"
        | "componentsCss"
        | "extrasCss"
      >
    >,
  ) => {
    const state = get();
    const trimmedName = name.trim() || "未命名主题";
    const themeCSS = css || state.customCSS || state.getThemeCSS(state.themeId);

    const newTheme: CustomTheme = {
      id: `custom-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      name: trimmedName,
      css: themeCSS,
      isBuiltIn: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      editorMode,
      designerVariables:
        editorMode === "visual" ? designerVariables : undefined,
      definition: definition || undefined,
      ...extra,
    };

    const nextCustomThemes = [...state.customThemes, newTheme];
    saveCustomThemes(nextCustomThemes);
    clearDarkCssCache();
    set({ customThemes: nextCustomThemes });

    return newTheme;
  },

  updateTheme: (
    id: string,
    updates: Partial<Pick<CustomTheme, "name" | "css" | "designerVariables">>,
  ) => {
    const state = get();
    const themeIndex = state.customThemes.findIndex((t) => t.id === id);

    if (themeIndex === -1) {
      console.warn(`主题 ${id} 未找到或为内置主题`);
      return;
    }

    const existingTheme = state.customThemes[themeIndex];
    const updatedTheme: CustomTheme = {
      ...existingTheme,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    const nextCustomThemes = [
      ...state.customThemes.slice(0, themeIndex),
      updatedTheme,
      ...state.customThemes.slice(themeIndex + 1),
    ];

    saveCustomThemes(nextCustomThemes);
    clearDarkCssCache();
    set({ customThemes: nextCustomThemes });

    // 如果是当前主题，更新名称
    if (state.themeId === id) {
      set({ themeName: updatedTheme.name });
    }
  },

  deleteTheme: (id: string) => {
    const state = get();
    const theme = state.customThemes.find((t) => t.id === id);

    if (!theme) {
      console.warn(`主题 ${id} 未找到或为内置主题`);
      return;
    }

    const nextCustomThemes = state.customThemes.filter((t) => t.id !== id);
    saveCustomThemes(nextCustomThemes);
    clearDarkCssCache();
    set({ customThemes: nextCustomThemes });

    // 如果删除的是当前主题，切换到默认
    if (state.themeId === id) {
      set({
        themeId: "default",
        themeName: "默认主题",
        customCSS: "",
      });
      saveSelectedTheme("default", "默认主题");
    }
  },

  duplicateTheme: (id: string, newName: string) => {
    const state = get();
    const allThemes = state.getAllThemes();
    const sourceTheme = allThemes.find((t) => t.id === id);

    if (!sourceTheme) {
      throw new Error(`主题 ${id} 未找到`);
    }

    // 复制时保留源主题的编辑模式和变量
    const editorMode = sourceTheme.editorMode || "css";
    return state.createTheme(
      newName,
      editorMode,
      sourceTheme.css,
      sourceTheme.designerVariables,
    );
  },

  exportTheme: (id: string) => {
    const state = get();
    const theme = state.customThemes.find((t) => t.id === id);
    if (!theme) {
      console.warn("主题未找到");
      return;
    }

    // Phase 3: 优先导出 definition（ThemeDefinition JSON）
    if (theme.definition) {
      const exportData = {
        version: 2,
        name: theme.name,
        definition: theme.definition,
      };
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${sanitizeFileName(theme.name)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      return;
    }

    // 兼容旧格式：导出 designerVariables
    if (theme.editorMode === "visual" && theme.designerVariables) {
      const exportData = {
        version: 1,
        name: theme.name,
        editorMode: "visual",
        designerVariables: theme.designerVariables,
      };
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${sanitizeFileName(theme.name)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      return;
    }

    // 纯 CSS 主题导出 CSS
    const blob = new Blob([theme.css], { type: "text/css" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${sanitizeFileName(theme.name)}.css`;
    a.click();
    URL.revokeObjectURL(url);
  },

  /**
   * 导出主题为 CSS 文件
   * @param id - 主题 ID
   */
  exportThemeCSS: (id: string) => {
    const state = get();
    const theme = state.customThemes.find((t) => t.id === id);
    if (!theme) {
      console.warn("主题未找到");
      return;
    }

    const blob = new Blob([theme.css], {
      type: "text/css",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${sanitizeFileName(theme.name)}.css`;
    a.click();
    URL.revokeObjectURL(url);
  },

  /**
   * 导出主题为 .wemd-theme zip 压缩包（Phase 6）
   * 仅 readOnly 导入主题可用，内置主题和本地 CSS 编辑主题不可导出 zip
   */
  exportThemePackage: async (id: string) => {
    const state = get();
    const theme = state.customThemes.find((t) => t.id === id);

    if (!theme) {
      console.warn("主题未找到");
      return;
    }

    if (!theme.readOnly) {
      console.warn("仅导入的主题支持导出 zip 压缩包");
      return;
    }

    try {
      let zipData: Uint8Array;

      if (theme.packageRaw) {
        // 有原始 zip 数据 → 直接复用（往返完整性）
        zipData = theme.packageRaw;
      } else {
        // 从 JSON 导入的主题（无 rawZip）→ 从存储数据重建
        const manifest: ThemePackageManifest = {
          sdkVersion: theme.sdkVersion ?? "1.0.0",
          meta: theme.definition?.meta ?? {
            id: theme.id,
            name: theme.name,
            description: theme.name,
            keywords: [],
            version: "1.0.0",
          },
          tokens: theme.definition?.tokens ?? {
            color: {
              primary: "#07c160",
              primaryDark: "#06ad56",
              primaryLight: "#e8f8ef",
              secondary: "#f39c12",
              accent: "#e74c3c",
              background: "#ffffff",
              bgSoft: "#f8f8f8",
              bgCard: "#ffffff",
              bgMuted: "#f0f0f0",
              textStrong: "#1a1a1a",
              textNormal: "#333333",
              textSoft: "#999999",
              border: "#e0e0e0",
              borderSoft: "#f0f0f0",
            },
            typography: {
              fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
              fontSize: "16px",
              lineHeight: "1.75",
              letterSpacing: 0,
              heading: {
                h1: {
                  fontSize: 24,
                  color: "#1a1a1a",
                  marginTop: 32,
                  marginBottom: 16,
                  fontWeight: "700",
                },
                h2: {
                  fontSize: 20,
                  color: "#1a1a1a",
                  marginTop: 28,
                  marginBottom: 14,
                  fontWeight: "600",
                },
                h3: {
                  fontSize: 18,
                  color: "#333333",
                  marginTop: 24,
                  marginBottom: 12,
                  fontWeight: "600",
                },
                h4: {
                  fontSize: 16,
                  color: "#333333",
                  marginTop: 20,
                  marginBottom: 10,
                  fontWeight: "500",
                },
              },
              codeFontFamily: "Consolas, Monaco, monospace",
            },
            spacing: { pagePadding: 16, paragraphMargin: 12 },
            border: { radius: 8 },
            shadow: { enabled: false, value: "none" },
          },
          components: theme.definition?.components ?? {},
          layout: theme.definition?.layout ?? {
            preferredComponents: [],
            density: "medium",
            tone: ["minimal"] as const,
          },
          assets: theme.assets
            ? {
                images: Array.from(theme.assets.entries()).map(([k, v]) => ({
                  key: k,
                  src: v,
                })),
              }
            : undefined,
        };

        const pkg: LoadedThemePackage = {
          manifest,
          templates: new Map(Object.entries(theme.definition?.templates ?? {})),
          styles: {
            componentsCss: theme.componentsCss,
            extrasCss: theme.extrasCss,
          },
          brand: theme.brandText ? { text: theme.brandText } : undefined,
          preview: theme.preview
            ? (() => {
                const base64 = theme.preview.split(",")[1];
                if (!base64) return undefined;
                const binary = atob(base64);
                const bytes = new Uint8Array(binary.length);
                for (let i = 0; i < binary.length; i++) {
                  bytes[i] = binary.charCodeAt(i);
                }
                return bytes;
              })()
            : undefined,
          assets: theme.assets ? { images: theme.assets } : undefined,
        };

        zipData = await repackThemePackage(pkg);
      }

      const blob = new Blob([zipData], { type: "application/zip" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${sanitizeFileName(theme.name)}.wemd-theme`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("导出主题包失败:", error);
    }
  },

  importTheme: async (file: File): Promise<ImportResult> => {
    try {
      const fileName = file.name.toLowerCase();
      const isZip =
        fileName.endsWith(".wemd-theme") || fileName.endsWith(".zip");

      let loaderResult;

      if (isZip) {
        // .wemd-theme zip 压缩包 → 读取为 Uint8Array → Loader 解压
        const buffer = await file.arrayBuffer();
        const zipData = new Uint8Array(buffer);
        loaderResult = await loadThemePackageFromZip(zipData);
      } else {
        // .json 文件 → 读取文本 → Loader 解析
        const text = await file.text();
        loaderResult = loadThemePackageFromJSON(text);
      }

      if (!loaderResult.ok) {
        return { ok: false, errors: loaderResult.errors };
      }

      const pkg = loaderResult.value;
      const manifest = pkg.manifest;

      // 主题骨架模板：loader 把 zip 的 templates/*.html 提取到 pkg.templates（Map），
      // 但不会写回 manifest。若不合并，渲染器 getThemeTemplates(themeDefinition) 取不到，
      // 会回退到内置默认骨架，导致主题自定义骨架不生效。
      manifest.templates = manifest.templates ?? {};
      for (const [id, tpl] of pkg.templates) {
        manifest.templates[id] = tpl;
      }

      // 检查重名
      const existingNames = get().customThemes.map((t) => t.name);
      const existingById = get().customThemes.find(
        (t) => t.definition?.meta?.id === manifest.meta.id,
      );
      let finalName = manifest.meta.name;

      if (existingById) {
        return {
          ok: false,
          duplicate: { existingTheme: existingById },
          errors: [
            {
              path: "/meta/id",
              message: `主题 "${manifest.meta.id}" 已存在（名称: ${existingById.name}），是否覆盖？`,
            },
          ],
        };
      }

      if (existingNames.includes(finalName)) {
        let suffix = 1;
        while (existingNames.includes(`${manifest.meta.name} (${suffix})`)) {
          suffix++;
        }
        finalName = `${manifest.meta.name} (${suffix})`;
      }

      // 调试：记录导入时的 components 字段
      console.log(
        "[importTheme] manifest.components keys:",
        Object.keys(manifest.components || {}),
      );
      console.log(
        "[importTheme] sample component:",
        JSON.stringify(manifest.components?.["hero-banner"], null, 2),
      );

      // 渲染 CSS：renderTheme 生成完整 CSS（含轨道 B AI variantCss + components.css）
      // 保留导入主题自身的排版（标题预设/字体/字号），避免被默认主题覆盖而出现无关装饰线
      // 仅当导入主题缺少排版时才回退到内置默认主题的排版
      if (!manifest.tokens.typography) {
        const defaultDef = getBuiltInThemeDefinition("default");
        if (defaultDef?.tokens?.typography) {
          manifest.tokens.typography = JSON.parse(
            JSON.stringify(defaultDef.tokens.typography),
          );
        }
      }
      const fullCss = renderTheme(manifest, {
        componentsCss: pkg.styles.componentsCss,
        extrasCss: pkg.styles.extrasCss,
        assets: pkg.assets?.images,
      });

      // 预览图转 base64 data URL
      let previewBase64: string | undefined;
      if (pkg.preview) {
        previewBase64 = await blobToDataUrl(
          new Blob([pkg.preview], { type: "image/png" }),
        );
      }

      const newTheme = get().createTheme(
        finalName,
        "css",
        fullCss,
        undefined,
        manifest,
        {
          sdkVersion: manifest.sdkVersion,
          preview: previewBase64,
          brandText: pkg.brand?.text,
          readOnly: true,
          packageRaw: pkg.rawZip,
          assets: pkg.assets?.images,
          componentsCss: pkg.styles.componentsCss,
          extrasCss: pkg.styles.extrasCss,
        },
      );

      return { ok: true, themeId: newTheme.id };
    } catch (error) {
      console.error("导入主题失败:", error);
      return {
        ok: false,
        errors: [
          {
            path: "/",
            message: `导入失败: ${error instanceof Error ? error.message : "未知错误"}`,
          },
        ],
      };
    }
  },
}));

// 导出内置主题供其他模块使用
export { builtInThemes };
export type { CustomTheme };
