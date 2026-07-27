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

export const defaultMarkdown = `# 在社交过度的时代里

朋友圈里的动态要经常更新，这样才能保持一定的存在感；聚会时的位置要算准了，才能有圈子的感觉；就连一段关系的存在也要靠频繁的互动、点赞和故意的"问候"来证明它的真伪。

用密集型的方式来进行维护来对抗被这个世界所忽略掉的恐惧。

但是随着年龄的增长，很多人在经历了社交的喧嚣和疲惫之后，渐渐意识到：最宝贵的关系，并不是在高频互动的时候建立起来的，而是在时空留白的时候形成的。

::: divider-fancy{}
:::

::: numbered-heading{index="01"}
社交错觉：不要把"经常联系"当成是"深层次联系"
:::

从心理学的角度看，"社交补偿机制"存在。

当人们感到孤独或者焦虑的时候，往往会不自觉地提高自己的社交频率——经常刷朋友圈、加入很多没有意义的群聊、参加一些必须要去的聚会。

但是这其实是一种低质量的补偿。

::: quote-card{author="心理学家 阿德勒"}
我们终其一生，都在摆脱他人的期待，找到真正的自己。
:::

为了参加聚会而勉强去应酬，为了保持一种社交的姿态而做着公式化的点赞，这样的行为其实是在做一场"社交表演"。

在这样的演出里，人的神经很紧张，感情也变得淡薄了。

"时刻在场"的假象会给人带来很大的精神压力，在社交的时候耗费了大量的精力来维持一个"社交人格"，但是回到现实生活中之后又会感觉非常空虚。

真正的联系并不是依靠"频率"来保持的，而是通过"共振"来实现的。

::: callout-pro{type="tip"}
你不需要对每一条消息都秒回
真正在意你的人，会愿意等你有空的时候再回复。与其用秒回维持表面的热络，不如用高质量的对话深化真正的关系。
:::

::: numbered-heading{index="02"}
生命轨迹：由"交错"变为"并行"的自然规律
:::

我们必须面对这样一个残酷的事实：生命维度越长，人的发展路径就越丰富多样、不同寻常。

人生的不同阶段里，我们会成为两条交错的线，在相同的学校里度过青春岁月，在同样的工作岗位上承受同样的压力，在相近的价值观之下一起度过夜晚，一起面对风雨。

但是随着社会角色的变化——升学、异地、结婚、生子、职业转换等等——我们的人生轨迹就会不自觉地出现偏差。

造成偏差的原因并不是由于矛盾，而是由于"生长"。

::: stats-block{}
- 25岁前：朋友数量达到峰值，平均有 150+ 位社交联系人
- 30岁后：社交圈开始精简，核心好友稳定在 5-8 人
- 40岁后：追求质量而非数量，深度关系成为重心
:::

每个人都在自己的一条线上前进，在自己的维度里延伸，如果要强行把两条已经分开的平行线扭成一个螺旋状，那么结果不是重逢就是错位、摩擦。

承认"各自奔跑"才是生命常态，也是一个人走向成熟的开始。

::: numbered-heading{index="03"}
内化了的记忆：已经深深地烙印在生命的底色上
:::

因为轨迹会偏移、因为互动会变少，所以之前深厚的友谊就不存在了吗？

其实并没有消亡，而是由原来的"显性"变成了现在的"隐形"。

以前一起熬过的夜晚、互相扶持的时候、一起淋过的雨、一起走过的路等等都已经不是简单的回忆了，而是被内化的生命的意义。

它们成为你的性格特征之一，也是你与这个世界相处的方式之一。

真正的友谊具有超越时空的稳定特性。

即使我们不再经常联系，甚至几年都没有联系过，在某一个特定的时间点上，比如一首老歌、一种相似的情景之下，我们又重新相遇的时候，"无需再做自我介绍"的默契也会立刻恢复。

因为我们在对方的生命中已经留出了一个永远的位置。

::: numbered-heading{index="04"}
最好的体面就是没有被打扰过的自由以及可以随时回来的勇气。
:::

成年人最高等级的社会交际能力就是知道怎样"优雅地退出"。

退出的方式并不是决裂、也不是冷淡，而是带有界限的温柔。

它意味着：

- 我尊重你自己的节奏，在你很忙的时候，我不用不断地给你发信息打扰你；
- 我尊重你个人的空间：即使我们不再经常给对方点赞，但是仍然会在心里为你送上最真挚的祝福；
- 有自己的天地：我不需要去讨好别人来证明自己的存在感，因为我知道自己的价值不是由别人的态度决定的。

在这样的"时空留白"的状态下，朋友之间才会有最大的尊重，也会有最长的生命力。

希望我们各自走在自己的道路上，活出精彩的自己，坚定地走好每一步；相遇的时候热情真诚；分别的时候体面从容。

::: divider-fancy{}
:::

::: cta-card{buttonText="开始创作"}
用 WeMD 写出你的第一篇公众号文章
AI 智能排版 + 30+ 精美组件，让每一篇文章都像杂志一样好看
不需要懂设计，专注内容就够了
:::

::: share-card{}
觉得这篇文章有用？
别忘了点赞、在看、分享给朋友 👇
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
