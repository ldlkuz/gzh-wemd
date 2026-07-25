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

function persistPublishToggles(
  next: Required<PersistedPublishToggles>,
): void {
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

export const defaultMarkdown = `# 欢迎使用 WeMD

这是一个现代化的 Markdown 编辑器，专为**微信公众号**排版设计。

## 1. 基础语法
**这是加粗文本**

*这是斜体文本*

***这是加粗斜体文本***

~~这是删除线文本~~

==这是高亮文本==

这是一个 [链接](https://github.com/your-repo)

## 2. 特殊格式
### 上标和下标

水的化学式：H~2~O

爱因斯坦质能方程：E=mc^2^

### Emoji 表情
今天天气真好 :sunny: 

让我们一起学习 :books: 

加油 :rocket:

## 3. 列表展示
### 无序列表
- 列表项 1
- 列表项 2
  - 子列表项 2.1
  - 子列表项 2.2

### 有序列表
1. 第一步
2. 第二步
3. 第三步

## 4. 引用
> 这是一个一级引用
> 
> > 这是一个二级引用
> > 
> > > 这是一个三级引用
> 

> [!TIP]
> 这是一个技巧提示块

> [!NOTE]
> 这是一个备注提示块

> [!IMPORTANT]
> 这是一个重要信息提示块

> [!WARNING]
> 这是一个警告提示块

> [!CAUTION]
> 这是一个危险提示块

## 5. 代码展示
### 行内代码
我们在代码中通常使用 \`console.log()\` 来输出信息。

### 代码块
\`\`\`javascript
// JavaScript 示例
function hello() {
  console.log('Hello, WeMD!');
  const a = 1;
  const b = 2;
  return a + b;
}
\`\`\`

## 6. 数学公式
行内公式: $E=mc^2$

行间公式:
$$
\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}
$$

## 7. 脚注与链接建议
这里演示脚注的使用：[WeChat Markdown](https://github.com/tenngoxars/WeMD "WeMD 是一款专为公众号设计的编辑器") 可以极大提升排版效率。

在 WeMD 中，只需为链接添加“标题”（双引号里的文字），系统就会自动将其转换为文末脚注，这是最符合微信公众号习惯的排法。

## 8. 表格
| 姓名 | 年龄 | 职业 |
| :--- | :---: | ---: |
| 张三 | 18 | 工程师 |
| 李四 | 20 | 设计师 |
| 王五 | 22 | 产品经理 |

## 8. 分割线
---

## 9. 图片
![WeMD：专为微信公众号设计的现代化 Markdown 编辑器](https://img.wemd.app/example.jpg)

**开始编辑吧!** 🚀
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

      if (
        meta.useTitle !== undefined ||
        meta.useAuthor !== undefined
      ) {
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
      await execCopyToWechat(markdown, css, { showMacBar });
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
