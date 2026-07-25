import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { FileSidebar } from "../../components/Sidebar/FileSidebar";

const mocks = vi.hoisted(() => {
  const refreshFiles = vi.fn();

  const sidebarState = {
    files: [],
    currentFile: null,
    createFile: vi.fn(),
    deleteFile: vi.fn(),
    deleteFolder: vi.fn(),
    selectWorkspace: vi.fn(),
    workspacePath: "/workspace",
    flattenFiles: vi.fn(() => []),
    refreshFiles,
    allFolders: [],
    filteredItems: [],
    isDragEnabled: true,
    filter: "",
    setFilter: vi.fn(),
    renamingPath: null,
    setRenamingPath: vi.fn(),
    renameValue: "",
    setRenameValue: vi.fn(),
    collapsedFolders: new Set<string>(),
    menuOpen: false,
    menuPos: { x: 0, y: 0 },
    menuTarget: null,
    menuTargetFolder: null,
    deleteTarget: null,
    setDeleteTarget: vi.fn(),
    deleteFolderTarget: null,
    setDeleteFolderTarget: vi.fn(),
    deleteFolderExtras: [],
    setDeleteFolderExtras: vi.fn(),
    deleting: false,
    setDeleting: vi.fn(),
    showNewFolderModal: false,
    setShowNewFolderModal: vi.fn(),
    newFolderName: "",
    setNewFolderName: vi.fn(),
    activeFolder: null,
    setActiveFolder: vi.fn(),
    showMoveMenu: false,
    setShowMoveMenu: vi.fn(),
    draggingPath: null,
    setDraggingPath: vi.fn(),
    draggingFolderPath: null,
    setDraggingFolderPath: vi.fn(),
    dragOverTarget: null,
    setDragOverTarget: vi.fn(),
    tooltip: null,
    renameFolderTarget: null,
    setRenameFolderTarget: vi.fn(),
    renameFolderValue: "",
    setRenameFolderValue: vi.fn(),
    showRenameFolderModal: false,
    setShowRenameFolderModal: vi.fn(),
    sortMode: "recent",
    handleSetSortMode: vi.fn(),
    toggleFolder: vi.fn(),
    getFolderMoveTargets: vi.fn(() => []),
    closeMenu: vi.fn(),
    handleContextMenu: vi.fn(),
    handleFolderContextMenu: vi.fn(),
    handleEmptyContextMenu: vi.fn(),
    startRename: vi.fn(),
    copyTitle: vi.fn(),
    submitRename: vi.fn(),
    handleCreateFolder: vi.fn(),
    handleMoveToFolder: vi.fn(),
    handleMoveFolder: vi.fn(),
    handleRenameFolder: vi.fn(),
    closeRenameFolderModal: vi.fn(),
    prepareDeleteFolder: vi.fn(),
    showTooltip: vi.fn(),
    hideTooltip: vi.fn(),
    handleDropToFolder: vi.fn(),
    handleDropToRoot: vi.fn(),
    handleDragLeave: vi.fn(),
    handleFileClick: vi.fn(),
    formatTime: vi.fn(() => "刚刚"),
  };

  return { refreshFiles, sidebarState };
});

vi.mock("../../components/Sidebar/useSidebarState", async () => {
  const actual = await vi.importActual<
    typeof import("../../components/Sidebar/useSidebarState")
  >("../../components/Sidebar/useSidebarState");
  return {
    ...actual,
    useSidebarState: () => mocks.sidebarState,
  };
});

vi.mock("../../components/Sidebar/SidebarFooter", () => ({
  SidebarFooter: () => <div data-testid="sidebar-footer" />,
}));

vi.mock("../../store/themeStore", () => ({
  useThemeStore: () => "默认主题",
}));

describe("FileSidebar 刷新入口", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("点击刷新按钮会触发文件列表刷新", () => {
    render(<FileSidebar />);

    fireEvent.click(screen.getByRole("button", { name: "刷新文件列表" }));

    expect(mocks.refreshFiles).toHaveBeenCalledTimes(1);
  });
});
