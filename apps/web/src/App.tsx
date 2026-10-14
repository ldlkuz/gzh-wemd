import type { CSSProperties } from "react";
import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { Toaster } from "react-hot-toast";
import { Header } from "./components/Header/Header";
import { FileSidebar } from "./components/Sidebar/FileSidebar";
import { EditorPreviewWorkspace } from "./components/Workspace/EditorPreviewWorkspace";
import { DebugPreviewPanel } from "./components/Preview/DebugPreviewPanel";
import { useFileSystem } from "./hooks/useFileSystem";
import { useMobileView } from "./hooks/useMobileView";
import { MobileToolbar } from "./components/common/MobileToolbar";
import { useEditorStore } from "./store/editorStore";
import "./styles/global.css";
import "./App.css";

import { useStorageContext } from "./storage/StorageContext";
import { Loader2 } from "lucide-react";
import { useHistoryStore } from "./store/historyStore";
import { useFileStore } from "./store/fileStore";
import { platform } from "./lib/platformAdapter";

const HistoryPanel = lazy(() =>
  import("./components/History/HistoryPanel").then((m) => ({
    default: m.HistoryPanel,
  })),
);
const HistoryManager = lazy(() =>
  import("./components/History/HistoryManager").then((m) => ({
    default: m.HistoryManager,
  })),
);
const Welcome = lazy(() =>
  import("./components/Welcome/Welcome").then((m) => ({ default: m.Welcome })),
);
const UpdateModal = lazy(() =>
  import("./components/UpdateModal/UpdateModal").then((m) => ({
    default: m.UpdateModal,
  })),
);
const FirstRunTour = lazy(() =>
  import("./components/Onboarding/FirstRunTour").then((m) => ({
    default: m.FirstRunTour,
  })),
);
import { MobileThemeSelector } from "./components/Theme/MobileThemeSelector";

interface UpdateEventData {
  latestVersion: string;
  currentVersion: string;
  releaseNotes?: string;
  force?: boolean;
}

interface UpdateErrorData {
  stage?: "check" | "download";
  message?: string;
}

interface UpdateProgressData {
  percent: number;
  transferred: number;
  total: number;
  bytesPerSecond: number;
}

interface ElectronUpdateAPI {
  onUpdateAvailable?: (callback: (data: UpdateEventData) => void) => () => void;
  onUpToDate?: (
    callback: (data: { currentVersion: string }) => void,
  ) => () => void;
  onUpdateError?: (callback: (data: UpdateErrorData) => void) => () => void;
  onUpdateDownloading?: (
    callback: (data: UpdateProgressData) => void,
  ) => () => void;
  onUpdateDownloaded?: (
    callback: (data: UpdateEventData) => void,
  ) => () => void;
  /** 下载前正在探测更新线路（镜像 / 官方源） */
  onUpdateSelectingRoute?: (callback: () => void) => () => void;
  removeUpdateListener?: (handler: (() => void) | undefined) => void;
  openReleases?: () => void;
  download?: () => Promise<unknown>;
  restartAndInstall?: () => void;
}

/** 首次使用引导看过的标记；换 key 可让所有用户重新看一次 */
const TOUR_SEEN_KEY = "wemd-first-run-tour-v1";

function hasSeenTour(): boolean {
  try {
    return localStorage.getItem(TOUR_SEEN_KEY) === "1";
  } catch {
    // localStorage 不可用时（隐私模式等）不打扰用户
    return true;
  }
}

function markTourSeen(): void {
  try {
    localStorage.setItem(TOUR_SEEN_KEY, "1");
  } catch {
    /* 忽略持久化失败 */
  }
}

function App() {
  const { workspacePath, saveFile } = useFileSystem({ enableEffects: true });
  const { type: storageType, ready } = useStorageContext();
  const historyLoading = useHistoryStore((state) => state.loading);
  const fileLoading = useFileStore((state) => state.isLoading);
  const {
    isMobile: isMobileScreen,
    activeView,
    setActiveView,
  } = useMobileView();
  const isMobile = isMobileScreen && !platform.isElectron;
  const copyToWechat = useEditorStore((state) => state.copyToWechat);
  const copyAsHtml = useEditorStore((state) => state.copyAsHtml);
  const [showThemePanel, setShowThemePanel] = useState(false);

  // 全局保存快捷键（统一监听器）
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        saveFile(true); // showToast = true
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [saveFile]);

  const isElectron = platform.isElectron;

  // 更新提示状态（available=待下载；selecting=正在选择下载线路；downloading=下载中带进度；
  // downloaded=可重启；error=下载失败）
  const [updateInfo, setUpdateInfo] = useState<{
    latestVersion: string;
    currentVersion: string;
    releaseNotes: string;
    status: "available" | "selecting" | "downloading" | "downloaded" | "error";
    progress?: number;
    errorMessage?: string;
  } | null>(null);

  // 首次使用引导：第一次进入编辑器时自动展示一次，之后可从菜单随时重看
  const [showTour, setShowTour] = useState(false);

  useEffect(() => {
    if (!workspacePath || hasSeenTour()) return;
    // 等布局稳定（编辑器与预览面板挂载完）再弹，否则锚点量不到
    const timer = window.setTimeout(() => setShowTour(true), 700);
    return () => window.clearTimeout(timer);
  }, [workspacePath]);

  useEffect(() => {
    const fs = window.electron?.fs;
    if (!fs?.onMenuShowTour) return;
    fs.onMenuShowTour(() => setShowTour(true));
  }, []);

  const handleTourClose = () => {
    setShowTour(false);
    markTourSeen();
  };

  // 监听 Electron 更新事件
  useEffect(() => {
    if (!isElectron) return;
    const electron = window.electron as { update?: ElectronUpdateAPI };
    if (!electron?.update?.onUpdateAvailable) return;

    const availableHandler = electron.update.onUpdateAvailable(
      (data: UpdateEventData) => {
        // 检查是否跳过了此版本（除非是强制检查）
        const skippedVersion = localStorage.getItem("wemd-skipped-version");
        if (!data.force && skippedVersion === data.latestVersion) {
          return; // 用户之前选择跳过此版本
        }

        setUpdateInfo({
          latestVersion: data.latestVersion,
          currentVersion: data.currentVersion,
          releaseNotes: data.releaseNotes || "",
          status: "available",
        });
      },
    );

    const downloadingHandler = electron.update.onUpdateDownloading?.(
      (data: UpdateProgressData) => {
        setUpdateInfo((prev) =>
          prev
            ? { ...prev, status: "downloading", progress: data.percent }
            : prev,
        );
      },
    );

    const selectingRouteHandler = electron.update.onUpdateSelectingRoute?.(
      () => {
        setUpdateInfo((prev) =>
          prev ? { ...prev, status: "selecting" } : prev,
        );
      },
    );

    const downloadedHandler = electron.update.onUpdateDownloaded?.(
      (data: UpdateEventData) => {
        setUpdateInfo((prev) => ({
          latestVersion: data.latestVersion,
          currentVersion: data.currentVersion || prev?.currentVersion || "",
          releaseNotes: data.releaseNotes || prev?.releaseNotes || "",
          status: "downloaded",
          progress: 100,
        }));
      },
    );

    const upToDateHandler = electron.update.onUpToDate?.(
      (data: { currentVersion: string }) => {
        // 使用 react-hot-toast 显示已是最新版本
        import("react-hot-toast").then(({ default: toast }) => {
          toast.success(`当前已是最新版本 (${data.currentVersion})`);
        });
      },
    );

    const errorHandler = electron.update.onUpdateError?.(
      (data: UpdateErrorData) => {
        import("react-hot-toast").then(({ default: toast }) => {
          if (data.stage === "download") {
            // 下载失败：在弹窗内展示，用户可重试下载
            setUpdateInfo((prev) =>
              prev
                ? {
                    ...prev,
                    status: "error",
                    errorMessage: data.message || "下载更新失败，请稍后重试",
                  }
                : prev,
            );
          } else {
            // 检查失败：用 toast 轻提示
            toast.error("检查更新失败，请稍后重试");
          }
        });
      },
    );

    return () => {
      electron.update?.removeUpdateListener?.(availableHandler);
      if (downloadingHandler)
        electron.update?.removeUpdateListener?.(downloadingHandler);
      if (upToDateHandler)
        electron.update?.removeUpdateListener?.(upToDateHandler);
      if (errorHandler) electron.update?.removeUpdateListener?.(errorHandler);
      if (downloadedHandler)
        electron.update?.removeUpdateListener?.(downloadedHandler);
      if (selectingRouteHandler)
        electron.update?.removeUpdateListener?.(selectingRouteHandler);
    };
  }, [isElectron]);

  const [showHistory, setShowHistory] = useState(() => {
    if (typeof window === "undefined") return true;
    const saved = localStorage.getItem("wemd-show-history");
    return saved !== "false";
  });
  const [debugMode, setDebugMode] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("wemd-debug-mode") === "true";
  });
  const [debugWidth, setDebugWidth] = useState<string>(
    debugMode ? "430px" : "0px",
  );
  const [historyWidth, setHistoryWidth] = useState<string>(
    showHistory ? "280px" : "0px",
  );

  useEffect(() => {
    try {
      localStorage.setItem("wemd-debug-mode", String(debugMode));
    } catch {
      /* 忽略持久化错误 */
    }
  }, [debugMode]);

  useEffect(() => {
    if (debugMode) {
      setDebugWidth("430px");
      return;
    }
    const timer = window.setTimeout(() => setDebugWidth("0px"), 350);
    return () => window.clearTimeout(timer);
  }, [debugMode]);

  useEffect(() => {
    try {
      localStorage.setItem("wemd-show-history", String(showHistory));
    } catch {
      /* 忽略持久化错误 */
    }
  }, [showHistory]);

  useEffect(() => {
    if (showHistory) {
      setHistoryWidth("280px");
      return;
    }
    const timer = window.setTimeout(() => setHistoryWidth("0px"), 350);
    return () => window.clearTimeout(timer);
  }, [showHistory]);

  const mainClass = "app-main";
  const mainStyle = useMemo(
    () =>
      ({
        "--history-width": historyWidth,
        "--debug-width": debugWidth,
      }) as CSSProperties,
    [historyWidth, debugWidth],
  );

  // Electron 模式：强制选择工作区
  if (isElectron && !workspacePath) {
    return (
      <>
        <Toaster position="top-center" />
        <Suspense
          fallback={
            <div className="workspace-loading">
              <Loader2 className="animate-spin" size={24} />
            </div>
          }
        >
          <Welcome />
        </Suspense>
      </>
    );
  }

  return (
    <div className="app" data-layout-mode={isMobile ? "mobile" : "desktop"}>
      {/* 更新提示 Modal */}
      {updateInfo && (
        <Suspense fallback={null}>
          <UpdateModal
            latestVersion={updateInfo.latestVersion}
            currentVersion={updateInfo.currentVersion}
            releaseNotes={updateInfo.releaseNotes}
            status={updateInfo.status}
            progress={updateInfo.progress}
            errorMessage={updateInfo.errorMessage}
            onClose={() => setUpdateInfo(null)}
            onDownload={() => {
              const api = (window.electron as { update?: ElectronUpdateAPI })
                ?.update;
              if (api?.download) {
                // available / error 状态下点击 → 触发或重试下载
                api.download().then(() => {
                  // 下载完成由 update:downloaded 事件接管（置 downloaded 并允许重启）
                });
                setUpdateInfo((prev) =>
                  prev ? { ...prev, status: "selecting" } : prev,
                );
              }
            }}
            onRestart={() => {
              (
                window.electron as { update?: ElectronUpdateAPI }
              )?.update?.restartAndInstall?.();
              setUpdateInfo(null);
            }}
            onSkipVersion={() => {
              localStorage.setItem(
                "wemd-skipped-version",
                updateInfo.latestVersion,
              );
              setUpdateInfo(null);
            }}
          />
        </Suspense>
      )}
      {/* 首次使用引导：真实界面高亮，不依赖截图 */}
      {showTour && (
        <Suspense fallback={null}>
          <FirstRunTour onClose={handleTourClose} />
        </Suspense>
      )}
      {/* 只在存储上下文完全就绪且确认为 IndexedDB 模式时才渲染 HistoryManager */}
      {!isElectron && ready && storageType === "indexeddb" && (
        <Suspense fallback={null}>
          <HistoryManager />
        </Suspense>
      )}

      <>
        <Toaster
          position="top-center"
          toastOptions={{
            className: "premium-toast",
            style: {
              background: "rgba(255, 255, 255, 0.9)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              color: "#1a1a1a",
              boxShadow: "0 12px 30px -10px rgba(0, 0, 0, 0.12)",
              borderRadius: "50px",
              padding: "10px 20px",
              fontSize: "14px",
              fontWeight: 500,
              border: "1px solid rgba(0, 0, 0, 0.05)",
              maxWidth: "400px",
            },
            success: {
              iconTheme: {
                primary: "#07c160",
                secondary: "#fff",
              },
              duration: 2000,
            },
            error: {
              iconTheme: {
                primary: "#ef4444",
                secondary: "#fff",
              },
              duration: 3000,
            },
          }}
        />
        <Header
          debugMode={debugMode}
          onToggleDebug={() => setDebugMode((prev) => !prev)}
        />
        <main
          className={mainClass}
          style={mainStyle}
          data-show-history={showHistory}
        >
          <div
            className={`history-pane ${showHistory ? "is-visible" : "is-hidden"}`}
            aria-hidden={!showHistory}
            data-tour="sidebar"
          >
            <div className="history-pane__content">
              {/* ready 后渲染，防止闪烁 */}
              {ready &&
                (isElectron || storageType === "filesystem" ? (
                  <FileSidebar />
                ) : (
                  <Suspense
                    fallback={
                      <div className="workspace-loading">
                        <Loader2 className="animate-spin" size={24} />
                      </div>
                    }
                  >
                    <HistoryPanel />
                  </Suspense>
                ))}
            </div>
          </div>
          <EditorPreviewWorkspace
            loading={
              !ready ||
              fileLoading ||
              (historyLoading && !isElectron && storageType === "indexeddb")
            }
            mobileView={isMobile ? activeView : undefined}
            showHistory={showHistory}
            onToggleHistory={() => setShowHistory((prev) => !prev)}
          />

          {/* 右侧调试面板（公众号模拟内核）：参照左侧 history-pane 抽屉逻辑滑入滑出 */}
          <div
            className={`debug-pane ${debugMode ? "is-visible" : "is-hidden"}`}
            aria-hidden={!debugMode}
          >
            <div className="debug-pane__content">
              {ready && (
                <DebugPreviewPanel
                  open={debugMode}
                  onClose={() => setDebugMode(false)}
                />
              )}
            </div>
          </div>

          {/* 移动端底部工具栏 */}
          {isMobile && (
            <MobileToolbar
              activeView={activeView}
              onViewChange={setActiveView}
              onCopyToWechat={copyToWechat}
              onCopyAsHtml={copyAsHtml}
              onOpenTheme={() => setShowThemePanel(true)}
            />
          )}
        </main>
      </>

      {/* 移动端主题选择器 */}
      {isMobile && (
        <MobileThemeSelector
          open={showThemePanel}
          onClose={() => setShowThemePanel(false)}
        />
      )}
    </div>
  );
}

export default App;
