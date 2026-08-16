// 编辑器状态管理（主题相关功能已迁移到 themeStore.ts）
import { create } from "zustand";
import { useThemeStore } from "./themeStore";
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

  resetDocument: (options?: ResetOptions) => void;
  copyToWechat: () => void;
  copyAsHtml: () => void;
}

export const defaultMarkdown = `::: magazine-cover
从入门到进阶：2025 年度效率工具指南
SUPERCHARGE YOUR WORKFLOW
---
告别选择困难，这 6 款神器让你的效率翻倍
:::

::: toc-nav
目录

- Obsidian
- Cursor
- 飞书文档
:::

::: text-card
工作三年，换了不下 20 款工具。踩过的坑、交过的学费，浓缩成这一篇。

不是参数堆砌的测评，而是真正用了半年以上、至今还躺在我的 Dock 栏里的那些。

> 工欲善其事，必先利其器。但"利器"不在多，在于恰好解决你的痛点。

先说说为什么 2025 年还要聊工具这个话题。AI 爆发之后，很多人以为"工具已经不重要了，AI 什么都能干"。**正好相反——正是因为 AI 降低了门槛，选择对的工具才变得前所未有地重要。**

为什么？因为 AI 让内容生产的速度提升了 10 倍，但在这个过程中，你用什么工具来组织、梳理、输出这些内容，直接决定了你的输出质量。

- 平均每人同时使用 5-7 款工具
- 60% 的用户因为"别人推荐"而开始，因为"不适合自己"而放弃
- 找到真正匹配的工具后，工作效率平均提升 2.3 倍
:::

::: section-divider{variant="dots"}
PART 01

Obsidian：不只是笔记，是第二大脑
:::

::: text-card
如果只能推荐一款工具，我会毫不犹豫选 Obsidian。

::: full-quote
它的核心不是"记笔记"，而是建立知识之间的连接。
:::

当你日积月累写下 500 条笔记后，那些看似无关的想法会在双向链接中产生意想不到的火花。

> 新手建议：先不要装任何插件，用默认功能写满 30 天，再根据实际痛点按需添加。很多人的问题不是"功能不够"，而是"插件太多了"。

适用人群：愿意花时间构建知识体系的人。如果你只想随手记个便签，那 Obsidian 确实杀鸡用牛刀了。
:::

::: section-divider{variant="dots"}
PART 02

Cursor：AI 时代的代码利器
:::

::: text-card
> 用了三天 Cursor，感觉自己像雇了一个随身坐着的资深程序员。—— 一位从 VS Code 迁移的开发者

Cursor 不是简单的 AI 代码补全，它理解你的整个项目。当你修改一个函数，它会自动检查所有引用的地方要不要一起改；当你写注释，它能直接生成对应的代码——而且**比你自己写的更好**。

当然，它也有一些短板：

- 学习曲线：前两周效率反而会下降，因为你在学如何和它沟通
- 价格不菲：Pro 版每月 $20，但对我而言一个下午就能回本
- 偶尔抽风：AI 不是神，有时会陷入循环修复同一个 bug

**适合**：有编程基础、需要快速实现想法的人
**不适合**：完全零基础、想"一句话写完整个项目"的人
:::

::: section-divider{variant="dots"}
PART 03

飞书文档：团队协作的事实标准
:::

::: text-card
一个人做事和一群人做事，需要的东西完全不同。

飞书的多维表格是我去年发现的最惊喜的功能。你可以用它在 5 分钟内搭出一个项目管理工具、一个 CRM、甚至一个轻量级数据库——**不用写一行代码**。

> 注意：飞书的强项是协作，如果你只是一个人写作，推荐用更轻量的 Notion 或者直接用 Obsidian。

**三款主流工具的定位差异：**

- **Notion**：轻量全能，适合个人项目管理
- **Obsidian**：知识图谱，适合深度学习者
- **飞书**：团队协作，适合企业与组织
:::

::: share-card
觉得这份清单有用吗？分享给需要的朋友吧
:::

::: end-card{variant="warm"}
Thanks

感谢阅读 · 效率提升
:::
`;

export const useEditorStore = create<EditorStore>((set, get) => ({
  markdown: defaultMarkdown,
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

    // 重置编辑器内容
    const markdown = options?.markdown ?? defaultMarkdown;
    set({
      markdown,
      publishTitle: "",
      publishAuthor: "",
      usePublishTitle: get().usePublishTitle,
      usePublishAuthor: get().usePublishAuthor,
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
