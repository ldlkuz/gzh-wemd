// 编辑器状态管理（主题相关功能已迁移到 themeStore.ts）
import { create } from "zustand";
import { useThemeStore } from "./themeStore";
import { useFileStore } from "./fileStore";
import { parseMarkdownFileContent } from "../utils/markdownFileMeta";
import { copyToWechat as execCopyToWechat } from "../services/wechatCopyService";
import { copyAsHtml as execCopyAsHtml } from "../services/htmlCopyService";
import {
  extractHeadingTitleFromMarkdown,
  normalizeWechatAuthor,
  normalizeWechatTitle,
  resolvePublishMeta,
} from "../utils/publishMeta";
import { addRecentAuthor, getRecentAuthors } from "../utils/recentAuthors";

const PUBLISH_TOGGLE_STORAGE_KEY = "wemd-publish-toggle-preferences";

interface PersistedPublishToggles {
  usePublishTitle?: boolean;
  usePublishAuthor?: boolean;
}

function loadPersistedPublishToggles(): Required<PersistedPublishToggles> {
  if (typeof window === "undefined") {
    return { usePublishTitle: true, usePublishAuthor: true };
  }

  try {
    const raw = window.localStorage.getItem(PUBLISH_TOGGLE_STORAGE_KEY);
    if (!raw) {
      return { usePublishTitle: true, usePublishAuthor: true };
    }
    const parsed = JSON.parse(raw) as PersistedPublishToggles;
    return {
      usePublishTitle: parsed.usePublishTitle !== false,
      usePublishAuthor: parsed.usePublishAuthor !== false,
    };
  } catch {
    return { usePublishTitle: true, usePublishAuthor: true };
  }
}

function persistPublishToggles(next: Required<PersistedPublishToggles>): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      PUBLISH_TOGGLE_STORAGE_KEY,
      JSON.stringify(next),
    );
  } catch {
    // ignore storage errors
  }
}

const initialPublishToggles = loadPersistedPublishToggles();

export interface ResetOptions {
  markdown?: string;
  theme?: string;
  customCSS?: string;
  themeName?: string;
}

interface EditorStore {
  markdown: string;
  setMarkdown: (markdown: string) => void;
  publishTitle: string;
  publishAuthor: string;
  recentAuthors: string[];
  usePublishTitle: boolean;
  usePublishAuthor: boolean;
  setPublishTitle: (title: string) => void;
  setPublishAuthor: (author: string) => void;
  selectRecentAuthor: (author: string) => void;
  setUsePublishTitle: (enabled: boolean) => void;
  setUsePublishAuthor: (enabled: boolean) => void;
  setPublishMeta: (meta: {
    title?: string;
    author?: string;
    useTitle?: boolean;
    useAuthor?: boolean;
  }) => void;
  applyHeadingTitle: () => { title: string; truncated: boolean };

  lastAutoSavedAt: Date | null;
  isEditing: boolean;
  setLastAutoSavedAt: (time: Date | null) => void;
  setIsEditing: (editing: boolean) => void;

  currentFilePath?: string;
  workspaceDir?: string;
  setFilePath: (path?: string) => void;
  setWorkspaceDir: (dir?: string) => void;

  /**
   * 当前 markdown 内容「所属」的文件路径。
   * 保存前用它校验编辑器内容与目标文件是否同源：HMR 或异常恢复会把
   * markdown 重置为初始示例、而 fileStore 的 currentFile 仍指向原文件，
   * 此时若照常保存就会把错配内容写进文件。归属缺失即视为不可信。
   *
   * 与 markdown 同生命周期：热更新重建本 store 时二者一起复位，
   * 这正是防护所依赖的信号 —— 内容变了而归属没了，即判定不可信。
   */
  markdownOwnerPath?: string;
  setMarkdownOwnerPath: (path?: string) => void;

  resetDocument: (options?: ResetOptions) => void;
  copyToWechat: () => void;
  copyAsHtml: () => void;
}

/**
 * 解析编辑器初始内容：若当前已有打开的文件，就从该文件恢复，而不是回落到范文。
 *
 * 动机：开发态热更新会重建本 store，而 fileStore 通常幸存。若初始值恒为示例
 * 范文，markdown 便与 currentFile 错配 —— 此后任何保存都会把范文写进用户文章。
 * 从 fileStore 派生可让热更新后编辑器内容与文件自动保持一致。
 *
 * 与 useFileSystem.saveFile 的归属校验配合：本函数负责「热更新后不产生错配」，
 * saveFile 负责「万一错配也不写盘，改为以文件为准重新载入」，两道防线。
 */
function resolveInitialEditorState(): {
  markdown: string;
  markdownOwnerPath?: string;
} {
  const { currentFile, lastSavedContent } = useFileStore.getState();
  if (currentFile && lastSavedContent) {
    return {
      markdown: parseMarkdownFileContent(lastSavedContent).body,
      markdownOwnerPath: currentFile.path,
    };
  }
  // 没有打开的文件时保持空白：示例内容以「工作区里的示例文章.md」形式存在，
  // 不再充当编辑器内存初始值（后者会在热更新等场景下意外跳出来并造成错配）
  return { markdown: "" };
}

const initialEditorState = resolveInitialEditorState();

export const useEditorStore = create<EditorStore>((set, get) => ({
  markdown: initialEditorState.markdown,
  setMarkdown: (markdown) => set({ markdown, isEditing: true }),
  publishTitle: "",
  publishAuthor: "",
  recentAuthors: getRecentAuthors(),
  usePublishTitle: initialPublishToggles.usePublishTitle,
  usePublishAuthor: initialPublishToggles.usePublishAuthor,
  setPublishTitle: (title) =>
    set({ publishTitle: normalizeWechatTitle(title), isEditing: true }),
  setPublishAuthor: (author) =>
    set({ publishAuthor: normalizeWechatAuthor(author), isEditing: true }),
  selectRecentAuthor: (author) =>
    set({
      publishAuthor: normalizeWechatAuthor(author),
      isEditing: true,
    }),
  setUsePublishTitle: (enabled) => {
    const next = {
      usePublishTitle: enabled,
      usePublishAuthor: get().usePublishAuthor,
    };
    persistPublishToggles(next);
    set({ usePublishTitle: enabled, isEditing: true });
  },
  setUsePublishAuthor: (enabled) => {
    const next = {
      usePublishTitle: get().usePublishTitle,
      usePublishAuthor: enabled,
    };
    persistPublishToggles(next);
    set({ usePublishAuthor: enabled, isEditing: true });
  },
  setPublishMeta: (meta) =>
    set((state) => {
      const nextUsePublishTitle = meta.useTitle ?? state.usePublishTitle;
      const nextUsePublishAuthor = meta.useAuthor ?? state.usePublishAuthor;

      if (meta.useTitle !== undefined || meta.useAuthor !== undefined) {
        persistPublishToggles({
          usePublishTitle: nextUsePublishTitle,
          usePublishAuthor: nextUsePublishAuthor,
        });
      }

      return {
        publishTitle: normalizeWechatTitle(meta.title),
        publishAuthor: normalizeWechatAuthor(meta.author),
        usePublishTitle: nextUsePublishTitle,
        usePublishAuthor: nextUsePublishAuthor,
      };
    }),
  applyHeadingTitle: () => {
    const { markdown } = get();
    const rawTitle = extractHeadingTitleFromMarkdown(markdown);
    const normalized = normalizeWechatTitle(rawTitle);
    set({ publishTitle: normalized, isEditing: true });
    return {
      title: normalized,
      truncated: Array.from(rawTitle).length > Array.from(normalized).length,
    };
  },

  // 编辑状态跟踪
  lastAutoSavedAt: null,
  isEditing: false,
  setLastAutoSavedAt: (time) =>
    set({ lastAutoSavedAt: time, isEditing: false }),
  setIsEditing: (editing) => set({ isEditing: editing }),

  currentFilePath: undefined,
  workspaceDir: undefined,
  setFilePath: (path) => set({ currentFilePath: path }),
  setWorkspaceDir: (dir) => set({ workspaceDir: dir }),
  markdownOwnerPath: initialEditorState.markdownOwnerPath,
  setMarkdownOwnerPath: (path) => set({ markdownOwnerPath: path }),

  resetDocument: (options) => {
    const themeStore = useThemeStore.getState();
    const allThemes = themeStore.getAllThemes();

    // 验证主题是否存在
    let targetTheme = options?.theme ?? "default";

    const themeExists = allThemes.some((t) => t.id === targetTheme);
    if (!themeExists) {
      console.warn(`Theme ${targetTheme} not found, falling back to default`);
      targetTheme = "default";
    }

    // 重置编辑器内容：无显式内容时保持空白。
    // 示例文章以「工作区里的示例文章.md」物理文件形式存在，不再充当内存回退值，
    // 避免在清空历史、删除最后一篇等场景下意外把范文塞进编辑器。
    const markdown = options?.markdown ?? "";
    set({
      markdown,
      publishTitle: "",
      publishAuthor: "",
      usePublishTitle: get().usePublishTitle,
      usePublishAuthor: get().usePublishAuthor,
      // 内容被整体替换，原文件的归属失效
      markdownOwnerPath: undefined,
    });

    // 重置主题（通过 themeStore）
    themeStore.selectTheme(targetTheme);
    if (options?.customCSS) {
      themeStore.setCustomCSS(options.customCSS);
    }
  },

  copyToWechat: async () => {
    const { markdown, publishAuthor, usePublishAuthor } = get();
    const themeStore = useThemeStore.getState();
    const css = themeStore.getThemeCSS(themeStore.themeId);
    const currentTheme =
      themeStore.customThemes.find((t) => t.id === themeStore.themeId) ||
      themeStore.getAllThemes().find((t) => t.id === themeStore.themeId);
    const showMacBar = currentTheme?.designerVariables?.showMacBar ?? false;

    try {
      await execCopyToWechat(markdown, css, {
        showMacBar,
        themeDefinition: currentTheme?.definition,
      });
      if (usePublishAuthor && publishAuthor.trim()) {
        set({ recentAuthors: addRecentAuthor(publishAuthor) });
      }
    } catch (error) {
      console.error("复制失败:", error);
    }
  },

  copyAsHtml: async () => {
    const {
      markdown,
      publishTitle,
      publishAuthor,
      usePublishTitle,
      usePublishAuthor,
    } = get();
    const themeStore = useThemeStore.getState();
    const css = themeStore.getThemeCSS(themeStore.themeId);
    const currentTheme =
      themeStore.customThemes.find((t) => t.id === themeStore.themeId) ||
      themeStore.getAllThemes().find((t) => t.id === themeStore.themeId);
    const showMacBar = currentTheme?.designerVariables?.showMacBar ?? false;

    await execCopyAsHtml(markdown, css, {
      showMacBar,
      themeDefinition: currentTheme?.definition,
      meta: resolvePublishMeta(markdown, {
        title: publishTitle,
        author: publishAuthor,
        useTitle: usePublishTitle,
        useAuthor: usePublishAuthor,
      }),
    });
    if (usePublishAuthor && publishAuthor.trim()) {
      set({ recentAuthors: addRecentAuthor(publishAuthor) });
    }
  },
}));
