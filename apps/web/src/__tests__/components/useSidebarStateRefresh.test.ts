import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useSidebarState } from "../../components/Sidebar/useSidebarState";

const mocks = vi.hoisted(() => {
  const refreshFiles = vi.fn(async () => {});

  return {
    refreshFiles,
    useFileSystemResult: {
      files: [],
      currentFile: null,
      openFile: vi.fn(),
      createFile: vi.fn(),
      updateFileTitle: vi.fn(),
      deleteFile: vi.fn(),
      selectWorkspace: vi.fn(),
      workspacePath: "/workspace",
      createFolder: vi.fn(),
      moveToFolder: vi.fn(),
      renameFolder: vi.fn(),
      moveFolder: vi.fn(),
      deleteFolder: vi.fn(),
      inspectFolder: vi.fn(async () => []),
      flattenFiles: vi.fn(() => []),
      refreshFiles,
    },
    toast: {
      success: vi.fn(),
      error: vi.fn(),
    },
  };
});

vi.mock("../../hooks/useFileSystem", () => ({
  useFileSystem: () => mocks.useFileSystemResult,
}));

vi.mock("react-hot-toast", () => ({
  default: mocks.toast,
}));

describe("useSidebarState 刷新入口", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("会暴露文件系统刷新动作", async () => {
    const { result } = renderHook(() => useSidebarState());

    await act(async () => {
      await result.current.refreshFiles();
    });

    await waitFor(() => {
      expect(mocks.refreshFiles).toHaveBeenCalledTimes(1);
    });
  });
});
