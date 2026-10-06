import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useFileSystem } from "../../hooks/useFileSystem";

/**
 * 保存防护回归测试
 *
 * 背景：热更新重建 editorStore 会让 markdown 回落到初始示例，而 fileStore 的
 * currentFile 仍指向用户文章，此时自动保存会把「错配内容」写进用户文件。
 * 防护：openFile 时记录内容归属（markdownOwnerPath），保存前校验；
 * 归属缺失时自动保存直接跳过，避免静默污染。
 */
const mocks = vi.hoisted(() => {
  const fileStoreState = {
    workspacePath: "/workspace",
    files: [] as unknown[],
    currentFile: null as unknown,
    isLoading: false,
    isSaving: false,
    lastSavedContent: "",
    isDirty: false,
    isRestoring: false,
    setWorkspacePath: vi.fn(),
    setFiles: vi.fn(),
    setCurrentFile: vi.fn(),
    setLoading: vi.fn(),
    setSaving: vi.fn(),
    setLastSavedContent: vi.fn(),
    setLastSavedAt: vi.fn(),
    setIsDirty: vi.fn(),
    setIsRestoring: vi.fn(),
  };

  // 用可变对象承载 getState 返回值，避免逐个 mockReturnValue 的类型摩擦
  const fileStoreGetStateValue = {
    currentFile: null as unknown,
    isDirty: false,
    lastSavedContent: "",
    files: [] as unknown[],
    isRestoring: false,
  };
  const fileStoreGetState = vi.fn(() => fileStoreGetStateValue);

  const editorStoreState = {
    setMarkdown: vi.fn(),
    markdown: "",
    setPublishMeta: vi.fn(),
  };
  const editorStoreGetStateValue = {
    markdown: "",
    publishTitle: "",
    publishAuthor: "",
    markdownOwnerPath: undefined as string | undefined,
    setMarkdownOwnerPath: vi.fn(),
  };
  const editorStoreGetState = vi.fn(() => editorStoreGetStateValue);

  const themeStoreState = { themeId: "default", themeName: "默认主题" };
  const themeStoreGetState = vi.fn(() => ({
    themeId: "default",
    themeName: "默认主题",
    customCSS: "",
    selectTheme: vi.fn(),
    getAllThemes: () => [{ id: "default", name: "默认主题" }],
  }));

  const storageContext = {
    adapter: null as unknown,
    ready: false,
    type: "indexeddb" as "indexeddb" | "filesystem",
  };

  return {
    fileStoreState,
    fileStoreGetState,
    fileStoreGetStateValue,
    editorStoreState,
    editorStoreGetState,
    editorStoreGetStateValue,
    themeStoreState,
    themeStoreGetState,
    storageContext,
    useFileSystemEffectsMock: vi.fn(),
  };
});

vi.mock("../../hooks/useFileSystemEffects", () => ({
  useFileSystemEffects: mocks.useFileSystemEffectsMock,
}));

vi.mock("../../storage/StorageContext", () => ({
  useStorageContext: () => mocks.storageContext,
}));

vi.mock("../../store/fileStore", () => ({
  useFileStore: Object.assign(
    vi.fn(() => mocks.fileStoreState),
    {
      getState: mocks.fileStoreGetState,
    },
  ),
}));

vi.mock("../../store/editorStore", () => ({
  useEditorStore: Object.assign(
    vi.fn(() => mocks.editorStoreState),
    {
      getState: mocks.editorStoreGetState,
    },
  ),
}));

vi.mock("../../store/themeStore", () => ({
  useThemeStore: Object.assign(
    vi.fn(() => mocks.themeStoreState),
    {
      getState: mocks.themeStoreGetState,
    },
  ),
}));

vi.mock("react-hot-toast", () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const setElectronMock = (electron: unknown) => {
  Object.defineProperty(window, "electron", {
    value: electron,
    configurable: true,
  });
};

const CURRENT_FILE = { name: "a.md", path: "/workspace/a.md", title: "A" };
const SAVED_CONTENT = "---\ntheme: default\n---\n\n# A\n";

describe("useFileSystem saveFile 内容归属校验", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.storageContext.adapter = null;
    mocks.storageContext.ready = false;
    mocks.storageContext.type = "indexeddb";
    delete (window as unknown as { electron?: unknown }).electron;

    mocks.fileStoreState.currentFile = CURRENT_FILE;
    Object.assign(mocks.fileStoreGetStateValue, {
      currentFile: CURRENT_FILE,
      isDirty: true,
      lastSavedContent: SAVED_CONTENT,
    });
    Object.assign(mocks.editorStoreGetStateValue, {
      markdown: "# A 的新内容\n",
      publishTitle: "",
      publishAuthor: "",
      markdownOwnerPath: "/workspace/a.md",
    });
  });

  afterEach(() => {
    delete (window as unknown as { electron?: unknown }).electron;
  });

  it("归属缺失时放弃保存，改为从文件重新载入", async () => {
    const bridgeSave = vi.fn(async () => ({ success: true }));
    const bridgeRead = vi.fn(async () => ({
      success: true,
      content: SAVED_CONTENT,
    }));
    setElectronMock({ fs: { saveFile: bridgeSave, readFile: bridgeRead } });

    // 模拟 HMR 后：markdown 已回落（内容与文件无关），归属标记丢失，
    // 但 fileStore 的 currentFile 仍指向用户文章
    mocks.editorStoreGetStateValue.markdownOwnerPath = undefined;
    mocks.editorStoreGetStateValue.markdown = "# 完全不同的文章内容\n";

    const { result } = renderHook(() => useFileSystem());
    await act(async () => {
      await result.current.saveFile();
    });

    // 关键：绝不写盘，改为读文件把编辑器纠正回来
    expect(bridgeSave).not.toHaveBeenCalled();
    expect(bridgeRead).toHaveBeenCalledWith("/workspace/a.md");
    // 归属被重新建立，编辑器内容被替换为文件正文
    expect(
      mocks.editorStoreGetStateValue.setMarkdownOwnerPath,
    ).toHaveBeenCalledWith("/workspace/a.md");
    expect(mocks.editorStoreState.setMarkdown).toHaveBeenCalledWith("# A\n");
  });

  it("归属匹配时正常保存", async () => {
    const bridgeSave = vi.fn(async () => ({ success: true }));
    setElectronMock({ fs: { saveFile: bridgeSave } });

    const { result } = renderHook(() => useFileSystem());
    await act(async () => {
      await result.current.saveFile();
    });

    expect(bridgeSave).toHaveBeenCalledWith(
      expect.objectContaining({ filePath: "/workspace/a.md" }),
    );
  });
});
