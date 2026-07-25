import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useFileSystem } from "../../hooks/useFileSystem";

const mocks = vi.hoisted(() => {
  const fileStoreState = {
    workspacePath: "/workspace",
    files: [],
    currentFile: null,
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

  const fileStoreGetState = vi.fn(() => ({
    currentFile: null,
    isDirty: false,
    lastSavedContent: "",
    files: [],
    isRestoring: false,
  }));

  const editorStoreState = {
    setMarkdown: vi.fn(),
    markdown: "",
  };

  const editorStoreGetState = vi.fn(() => ({
    markdown: "",
  }));

  const selectTheme = vi.fn();
  const themeStoreState = {
    themeId: "default",
    themeName: "默认主题",
  };
  const themeStoreGetState = vi.fn(() => ({
    themeId: "default",
    themeName: "默认主题",
    customCSS: "",
    selectTheme,
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
    editorStoreState,
    editorStoreGetState,
    themeStoreState,
    themeStoreGetState,
    storageContext,
    selectTheme,
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

describe("useFileSystem createFile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.storageContext.adapter = null;
    mocks.storageContext.ready = false;
    mocks.storageContext.type = "indexeddb";
    delete (window as unknown as { electron?: unknown }).electron;
  });

  afterEach(() => {
    delete (window as unknown as { electron?: unknown }).electron;
  });

  it("Electron 模式下使用文章标题生成默认文件名", async () => {
    const createFile = vi.fn(
      async (_payload: { filename?: string; content?: string }) => ({
        success: true,
        filePath: "/workspace/新文章.md",
        filename: "新文章.md",
      }),
    );
    const listFiles = vi.fn(async () => ({ success: true, files: [] }));
    const readFile = vi.fn(async () => ({
      success: true,
      content:
        '---\ntheme: default\nthemeName: "默认主题"\ntitle: "新文章"\n---\n\n# 新文章\n\n',
    }));

    setElectronMock({
      fs: {
        listFiles,
        readFile,
        createFile,
      },
    });

    const { result } = renderHook(() => useFileSystem());

    await act(async () => {
      await result.current.createFile();
    });

    expect(createFile).toHaveBeenCalledWith(
      expect.objectContaining({
        filename: "新文章.md",
      }),
    );
    const createPayload = createFile.mock.calls[0]?.[0];
    expect(createPayload?.content).toContain('title: "新文章"');
    expect(mocks.fileStoreState.setCurrentFile).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "新文章.md",
        title: "新文章",
      }),
    );
  });

  it("浏览器文件夹模式下避免覆盖已有新文章文件", async () => {
    const adapter = {
      listFiles: vi.fn(async () => []),
      readFile: vi.fn(async () =>
        [
          "---",
          "theme: default",
          'themeName: "默认主题"',
          'title: "新文章"',
          "---",
          "",
          "# 新文章",
          "",
        ].join("\n"),
      ),
      writeFile: vi.fn(async () => {}),
      exists: vi.fn(async (path: string) => path === "docs/新文章.md"),
    };
    mocks.storageContext.adapter = adapter;
    mocks.storageContext.ready = true;
    mocks.storageContext.type = "filesystem";

    const { result } = renderHook(() => useFileSystem());

    await act(async () => {
      await result.current.createFile("docs");
    });

    expect(adapter.exists).toHaveBeenCalledWith("docs/新文章.md");
    expect(adapter.exists).toHaveBeenCalledWith("docs/新文章 (1).md");
    expect(adapter.writeFile).toHaveBeenCalledWith(
      "docs/新文章 (1).md",
      expect.stringContaining('title: "新文章"'),
    );
    expect(mocks.fileStoreState.setCurrentFile).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "新文章 (1).md",
        path: "docs/新文章 (1).md",
        title: "新文章",
      }),
    );
  });
});
