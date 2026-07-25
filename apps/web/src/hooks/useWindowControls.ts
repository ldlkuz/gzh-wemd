import { useEffect } from "react";

interface WindowControlsOverlay {
  visible: boolean;
  getTitlebarAreaRect: () => DOMRect;
  addEventListener: (type: "geometrychange", listener: () => void) => void;
  removeEventListener: (type: "geometrychange", listener: () => void) => void;
}

export function useWindowControls() {
  // SSR/Node 环境的基本安全检查
  const hasWindow = typeof window !== "undefined";
  const isElectron = hasWindow && (window.electron?.isElectron ?? false);
  const platform = hasWindow ? window.electron?.platform : undefined;
  const isWindows = platform === "win32";
  const isMac = platform === "darwin";

  useEffect(() => {
    if (!isElectron || isWindows) {
      document.documentElement.style.removeProperty("--titlebar-right-inset");
      document.documentElement.style.removeProperty("--titlebar-left-inset");
      return;
    }

    const nav = navigator as Navigator & {
      windowControlsOverlay?: WindowControlsOverlay;
    };

    const controlsOverlay = nav.windowControlsOverlay;

    if (!controlsOverlay?.getTitlebarAreaRect) {
      document.documentElement.style.removeProperty("--titlebar-right-inset");
      document.documentElement.style.removeProperty("--titlebar-left-inset");
      return;
    }

    const updateInset = () => {
      if (controlsOverlay.visible === false) {
        document.documentElement.style.setProperty(
          "--titlebar-right-inset",
          "0px",
        );
        document.documentElement.style.setProperty(
          "--titlebar-left-inset",
          "0px",
        );
        return;
      }
      const rect = controlsOverlay.getTitlebarAreaRect();
      const leftInset = Math.max(0, Math.round(rect.x));
      const rightInset = Math.max(
        0,
        Math.round(window.innerWidth - (rect.x + rect.width)),
      );
      document.documentElement.style.setProperty(
        "--titlebar-left-inset",
        `${leftInset}px`,
      );
      document.documentElement.style.setProperty(
        "--titlebar-right-inset",
        `${rightInset}px`,
      );
    };

    updateInset();
    const handleResize = () => updateInset();
    window.addEventListener("resize", handleResize);
    controlsOverlay.addEventListener?.("geometrychange", updateInset);

    return () => {
      window.removeEventListener("resize", handleResize);
      controlsOverlay.removeEventListener?.("geometrychange", updateInset);
      document.documentElement.style.removeProperty("--titlebar-right-inset");
      document.documentElement.style.removeProperty("--titlebar-left-inset");
    };
  }, [isElectron, isWindows]);

  return {
    isElectron,
    isWindows,
    isMac,
    platform,
    // 安全访问：如果不是 Electron 或 window 未定义，则为 undefined
    minimize: hasWindow ? window.electron?.window?.minimize : undefined,
    maximize: hasWindow ? window.electron?.window?.maximize : undefined,
    close: hasWindow ? window.electron?.window?.close : undefined,
  };
}
