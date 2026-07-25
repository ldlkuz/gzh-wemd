import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useFileSystem } from "../../hooks/useFileSystem";

const mocks = vi.hoisted(() => {
  const useFileSystemEffectsMock = vi.fn();

  const useFileStoreMock = vi.fn(() => ({
    workspacePath: null,
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
  }));
  (useFileStoreMock as unknown as { getState: () => unknown }).getState = vi.fn(
    () => ({
      currentFile: null,
      isDirty: false,
      lastSavedContent: "",
      files: [],
      isRestoring: false,
    }),
  );

  const useEditorStoreMock = vi.fn(() => ({
    setMarkdown: vi.fn(),
    markdown: "",
  }));
  (useEditorStoreMock as unknown as { getState: () => unknown }).getState =
    vi.fn(() => ({
      markdown: "",
    }));

  const useThemeStoreMock = vi.fn(() => ({
    themeId: "default",
    themeName: "默认主题",
  }));
  (
    useThemeStoreMock as unknown as {
      getState: () => {
        themeId: string;
        themeName: string;
        selectTheme: (id: string) => void;
        getAllThemes: () => unknown[];
      };
    }
  ).getState = vi.fn(() => ({
    themeId: "default",
    themeName: "默认主题",
    selectTheme: vi.fn(),
    getAllThemes: () => [],
  }));

  return {
    useFileSystemEffectsMock,
    useFileStoreMock,
    useEditorStoreMock,
    useThemeStoreMock,
  };
});

vi.mock("../../hooks/useFileSystemEffects", () => ({
  useFileSystemEffects: mocks.useFileSystemEffectsMock,
}));

vi.mock("../../storage/StorageContext", () => ({
  useStorageContext: () => ({
    adapter: null,
    ready: false,
    type: "indexeddb" as const,
  }),
}));

vi.mock("../../store/fileStore", () => ({
  useFileStore: mocks.useFileStoreMock,
}));

vi.mock("../../store/editorStore", () => ({
  useEditorStore: mocks.useEditorStoreMock,
}));

vi.mock("../../store/themeStore", () => ({
  useThemeStore: mocks.useThemeStoreMock,
}));

describe("useFileSystem effect gate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("默认不执行副作用 hook", () => {
    renderHook(() => useFileSystem());
    expect(mocks.useFileSystemEffectsMock).toHaveBeenCalledTimes(1);
    expect(mocks.useFileSystemEffectsMock.mock.calls[0][0].enabled).toBe(false);
  });

  it("显式开启时执行副作用 hook", () => {
    renderHook(() => useFileSystem({ enableEffects: true }));
    expect(mocks.useFileSystemEffectsMock).toHaveBeenCalledTimes(1);
    expect(mocks.useFileSystemEffectsMock.mock.calls[0][0].enabled).toBe(true);
  });
});
