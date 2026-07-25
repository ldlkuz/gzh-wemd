import type { SyntheticEvent } from "react";
import { useState, useMemo, useCallback } from "react";
import { useFileSystem } from "../../hooks/useFileSystem";
import toast from "react-hot-toast";
import type { FileItem, FolderItem } from "../../store/fileTypes";
import { type SortMode, getSortMode, saveSortMode } from "./sortUtils";
import {
  buildFilteredItems,
  collectAllFolders,
  expandAncestorFolders,
  FILE_DRAG_TYPE,
  findFolderByPath,
  FOLDER_DRAG_TYPE,
  formatRelativeTime,
  getBaseName,
  getCollapsedState,
  isDescendantPath,
  remapPath,
  resolveParentFolderPath,
  ROOT_DROP_TARGET,
  saveCollapsedState,
} from "./sidebarStateHelpers";

export { ROOT_DROP_TARGET, FILE_DRAG_TYPE, FOLDER_DRAG_TYPE, getBaseName };

export function useSidebarState() {
  const {
    files,
    currentFile,
    openFile,
    createFile,
    updateFileTitle,
    deleteFile,
    selectWorkspace,
    workspacePath,
    createFolder,
    moveToFolder,
    renameFolder,
    moveFolder,
    deleteFolder,
    inspectFolder,
    flattenFiles,
    refreshFiles,
  } = useFileSystem();

  const [filter, setFilter] = useState("");
  const [renamingPath, setRenamingPath] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [collapsedFolders, setCollapsedFolders] =
    useState<Set<string>>(getCollapsedState);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });
  const [menuTarget, setMenuTarget] = useState<FileItem | null>(null);
  const [menuTargetFolder, setMenuTargetFolder] = useState<FolderItem | null>(
    null,
  );
  const [deleteTarget, setDeleteTarget] = useState<FileItem | null>(null);
  const [deleteFolderTarget, setDeleteFolderTarget] =
    useState<FolderItem | null>(null);
  const [deleteFolderExtras, setDeleteFolderExtras] = useState<string[]>([]);
  const [deleting, setDeleting] = useState(false);
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [activeFolder, setActiveFolder] = useState<string | null>(null);
  const [showMoveMenu, setShowMoveMenu] = useState(false);
  const [draggingPath, setDraggingPath] = useState<string | null>(null);
  const [draggingFolderPath, setDraggingFolderPath] = useState<string | null>(
    null,
  );
  const [dragOverTarget, setDragOverTarget] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{
    text: string;
    x: number;
    y: number;
  } | null>(null);
  const [renameFolderTarget, setRenameFolderTarget] =
    useState<FolderItem | null>(null);
  const [renameFolderValue, setRenameFolderValue] = useState("");
  const [showRenameFolderModal, setShowRenameFolderModal] = useState(false);
  const [sortMode, setSortModeState] = useState<SortMode>(getSortMode);

  const isDragEnabled = !filter;

  const allFolders = useMemo(() => collectAllFolders(files), [files]);

  const filteredItems = useMemo(
    () => buildFilteredItems(files, filter, flattenFiles, sortMode),
    [files, filter, flattenFiles, sortMode],
  );

  const handleSetSortMode = useCallback((mode: SortMode) => {
    setSortModeState(mode);
    saveSortMode(mode);
  }, []);

  const getDisplayTitle = useCallback(
    (file: FileItem) => file.title?.trim() || file.name.replace(/\.md$/i, ""),
    [],
  );

  const toggleFolder = useCallback((folderPath: string) => {
    setCollapsedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderPath)) {
        next.delete(folderPath);
        setActiveFolder(folderPath);
      } else {
        next.add(folderPath);
        setActiveFolder((current) => (current === folderPath ? null : current));
      }
      saveCollapsedState(next);
      return next;
    });
  }, []);

  const updateFolderPathState = useCallback(
    (oldPath: string, newPath: string) => {
      setActiveFolder((current) => {
        if (!current) return current;
        return remapPath(current, oldPath, newPath) ?? current;
      });

      setCollapsedFolders((prev) => {
        const next = new Set<string>();
        for (const entry of prev) {
          next.add(remapPath(entry, oldPath, newPath) ?? entry);
        }
        saveCollapsedState(next);
        return next;
      });
    },
    [],
  );

  const getFolderMoveTargets = useCallback(
    (folder: FolderItem) => {
      return allFolders.filter((item) => {
        if (item.path === folder.path) return false;
        return !isDescendantPath(folder.path, item.path);
      });
    },
    [allFolders],
  );

  const closeMenu = useCallback(() => {
    setMenuOpen(false);
    setMenuTarget(null);
    setMenuTargetFolder(null);
    setShowMoveMenu(false);
  }, []);

  const handleContextMenu = useCallback(
    (e: React.MouseEvent, file: FileItem) => {
      e.preventDefault();
      e.stopPropagation();
      setMenuTarget(file);
      setMenuTargetFolder(null);
      setMenuPos({ x: e.clientX, y: e.clientY });
      setMenuOpen(true);
      setShowMoveMenu(false);
    },
    [],
  );

  const handleFolderContextMenu = useCallback(
    (e: React.MouseEvent, folder: FolderItem) => {
      e.preventDefault();
      e.stopPropagation();
      setMenuTargetFolder(folder);
      setMenuTarget(null);
      setMenuPos({ x: e.clientX, y: e.clientY });
      setMenuOpen(true);
      setShowMoveMenu(false);
    },
    [],
  );

  const handleEmptyContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setMenuTarget(null);
    setMenuTargetFolder(null);
    setMenuPos({ x: e.clientX, y: e.clientY });
    setMenuOpen(true);
    setShowMoveMenu(false);
  }, []);

  const startRename = useCallback(
    (file: FileItem) => {
      setRenamingPath(file.path);
      setRenameValue(getDisplayTitle(file));
      closeMenu();
    },
    [closeMenu, getDisplayTitle],
  );

  const copyTitle = useCallback(
    async (file: FileItem) => {
      try {
        const title = getDisplayTitle(file);
        await navigator.clipboard.writeText(title);
        toast.success("标题已复制");
      } catch {
        toast.error("复制失败");
      }
      closeMenu();
    },
    [closeMenu, getDisplayTitle],
  );

  const submitRename = useCallback(async () => {
    if (renamingPath && renameValue) {
      const flatFiles = flattenFiles(files);
      const file = flatFiles.find((f) => f.path === renamingPath);
      if (file) {
        await updateFileTitle(file, renameValue);
      }
    }
    setRenamingPath(null);
  }, [renamingPath, renameValue, files, flattenFiles, updateFileTitle]);

  const handleCreateFolder = useCallback(async () => {
    if (!newFolderName.trim()) {
      toast.error("请输入文件夹名称");
      return;
    }
    await createFolder(newFolderName.trim(), activeFolder || undefined);
    setNewFolderName("");
    setShowNewFolderModal(false);
  }, [newFolderName, activeFolder, createFolder]);

  const handleMoveToFolder = useCallback(
    async (targetFolder: string) => {
      if (menuTarget) {
        await moveToFolder(menuTarget, targetFolder);
      }
      closeMenu();
    },
    [menuTarget, moveToFolder, closeMenu],
  );

  const handleMoveFolder = useCallback(
    async (targetFolder: string) => {
      if (!menuTargetFolder) return;
      const res = await moveFolder(menuTargetFolder, targetFolder);
      if (res.success && res.newPath) {
        updateFolderPathState(menuTargetFolder.path, res.newPath);
      }
      closeMenu();
    },
    [menuTargetFolder, moveFolder, updateFolderPathState, closeMenu],
  );

  const handleRenameFolder = useCallback(async () => {
    if (!renameFolderTarget) return;
    const nextName = renameFolderValue.trim();
    if (!nextName) {
      toast.error("请输入文件夹名称");
      return;
    }
    const res = await renameFolder(renameFolderTarget, nextName);
    if (res.success && res.newPath) {
      updateFolderPathState(renameFolderTarget.path, res.newPath);
    }
    setShowRenameFolderModal(false);
    setRenameFolderTarget(null);
    setRenameFolderValue("");
  }, [
    renameFolderTarget,
    renameFolderValue,
    renameFolder,
    updateFolderPathState,
  ]);

  const closeRenameFolderModal = useCallback(() => {
    setShowRenameFolderModal(false);
    setRenameFolderTarget(null);
    setRenameFolderValue("");
  }, []);

  const prepareDeleteFolder = useCallback(
    async (folder: FolderItem) => {
      setDeleteFolderTarget(folder);
      setDeleteFolderExtras([]);
      const extras = await inspectFolder(folder.path);
      setDeleteFolderExtras(extras);
    },
    [inspectFolder],
  );

  const showTooltipFn = useCallback((e: SyntheticEvent, text: string) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setTooltip({ text, x: rect.left + rect.width / 2, y: rect.bottom + 8 });
  }, []);

  const hideTooltip = useCallback(() => setTooltip(null), []);

  const findFileByPath = useCallback(
    (path: string) => flattenFiles(files).find((item) => item.path === path),
    [files, flattenFiles],
  );

  const handleDropToFolder = useCallback(
    async (e: React.DragEvent, targetFolder: string) => {
      if (!isDragEnabled) return;
      e.preventDefault();
      e.stopPropagation();

      const draggedFolderPath = e.dataTransfer.getData(FOLDER_DRAG_TYPE);
      if (draggedFolderPath) {
        if (targetFolder && isDescendantPath(draggedFolderPath, targetFolder)) {
          setDragOverTarget(null);
          return;
        }
        const folder = findFolderByPath(files, draggedFolderPath);
        if (!folder) return;
        const res = await moveFolder(folder, targetFolder);
        if (res.success && res.newPath) {
          updateFolderPathState(folder.path, res.newPath);
        }
        setDragOverTarget(null);
        return;
      }

      const filePath =
        e.dataTransfer.getData(FILE_DRAG_TYPE) ||
        e.dataTransfer.getData("text/plain");
      if (!filePath) return;
      const file = findFileByPath(filePath);
      if (!file) return;
      await moveToFolder(file, targetFolder);
      setDragOverTarget(null);
    },
    [
      isDragEnabled,
      files,
      moveFolder,
      updateFolderPathState,
      findFileByPath,
      moveToFolder,
    ],
  );

  const handleDropToRoot = useCallback(
    async (e: React.DragEvent) => {
      if (!isDragEnabled) return;
      e.preventDefault();
      if (e.target !== e.currentTarget) return;

      const draggedFolderPath = e.dataTransfer.getData(FOLDER_DRAG_TYPE);
      if (draggedFolderPath) {
        const folder = findFolderByPath(files, draggedFolderPath);
        if (!folder) return;
        const res = await moveFolder(folder, "");
        if (res.success && res.newPath) {
          updateFolderPathState(folder.path, res.newPath);
        }
        setDragOverTarget(null);
        return;
      }

      const filePath =
        e.dataTransfer.getData(FILE_DRAG_TYPE) ||
        e.dataTransfer.getData("text/plain");
      if (!filePath) return;
      const file = findFileByPath(filePath);
      if (!file) return;
      await moveToFolder(file, "");
      setDragOverTarget(null);
    },
    [
      isDragEnabled,
      files,
      moveFolder,
      updateFolderPathState,
      findFileByPath,
      moveToFolder,
    ],
  );

  const handleDragLeave = useCallback(
    (e: React.DragEvent, targetKey: string) => {
      if (!isDragEnabled) return;
      const related = e.relatedTarget as Node | null;
      if (related && e.currentTarget.contains(related)) return;
      setDragOverTarget((current) => (current === targetKey ? null : current));
    },
    [isDragEnabled],
  );

  const handleFileClick = useCallback(
    (file: FileItem) => {
      openFile(file);
      const parentPath = resolveParentFolderPath(file.path, workspacePath);
      setActiveFolder(parentPath);

      if (parentPath) {
        setCollapsedFolders((prev) => {
          const next = expandAncestorFolders(prev, file.path, workspacePath);
          saveCollapsedState(next);
          return next;
        });
      }
    },
    [openFile, workspacePath],
  );

  const formatTime = useCallback((date: Date) => formatRelativeTime(date), []);

  return {
    files,
    currentFile,
    createFile,
    deleteFile,
    deleteFolder,
    selectWorkspace,
    workspacePath,
    flattenFiles,
    refreshFiles,

    allFolders,
    filteredItems,
    isDragEnabled,

    filter,
    setFilter,
    renamingPath,
    setRenamingPath,
    renameValue,
    setRenameValue,
    collapsedFolders,
    menuOpen,
    menuPos,
    menuTarget,
    menuTargetFolder,
    deleteTarget,
    setDeleteTarget,
    deleteFolderTarget,
    setDeleteFolderTarget,
    deleteFolderExtras,
    setDeleteFolderExtras,
    deleting,
    setDeleting,
    showNewFolderModal,
    setShowNewFolderModal,
    newFolderName,
    setNewFolderName,
    activeFolder,
    setActiveFolder,
    showMoveMenu,
    setShowMoveMenu,
    draggingPath,
    setDraggingPath,
    draggingFolderPath,
    setDraggingFolderPath,
    dragOverTarget,
    setDragOverTarget,
    tooltip,
    renameFolderTarget,
    setRenameFolderTarget,
    renameFolderValue,
    setRenameFolderValue,
    showRenameFolderModal,
    setShowRenameFolderModal,
    sortMode,
    handleSetSortMode,

    toggleFolder,
    getFolderMoveTargets,
    closeMenu,
    handleContextMenu,
    handleFolderContextMenu,
    handleEmptyContextMenu,
    startRename,
    copyTitle,
    submitRename,
    handleCreateFolder,
    handleMoveToFolder,
    handleMoveFolder,
    handleRenameFolder,
    closeRenameFolderModal,
    prepareDeleteFolder,
    showTooltip: showTooltipFn,
    hideTooltip,
    handleDropToFolder,
    handleDropToRoot,
    handleDragLeave,
    handleFileClick,
    formatTime,
  };
}
