import toast from "react-hot-toast";
import { BookOpen, FolderOpen, Puzzle } from "lucide-react";
import { useUITheme } from "../../hooks/useUITheme";
import { resolveAppAssetPath } from "../../utils/assetPath";
import "./SidebarFooter.css";

export function SidebarFooter() {
  const uiTheme = useUITheme((state) => state.theme);
  const logoSrc = resolveAppAssetPath(
    uiTheme === "dark" ? "favicon-light.svg" : "favicon-dark.svg",
  );
  const isElectron = !!window.electron?.isElectron;

  const handleOpenPluginDirectory = async () => {
    const result = await window.electron?.shell?.openPluginDirectory?.();
    if (!result?.success) {
      toast.error("打开插件目录失败");
    }
  };

  const handleOpenPluginInstructions = async () => {
    const result = await window.electron?.shell?.openPluginInstructions?.();
    if (!result?.success) {
      toast.error("打开插件安装说明失败");
    }
  };

  return (
    <div className="sidebar-footer">
      <div className="footer-brand">
        <div className="footer-logo">
          <img src={logoSrc} alt="Logo" />
        </div>
        <div className="footer-info">
          <span className="footer-name">WeMD</span>
          <span className="footer-version">v{__APP_VERSION__}</span>
        </div>
      </div>
      <div className="footer-links">
        {isElectron && (
          <>
            <button
              type="button"
              onClick={handleOpenPluginDirectory}
              data-tooltip="打开插件目录"
              aria-label="打开插件目录"
            >
              <FolderOpen size={16} />
            </button>
            <button
              type="button"
              onClick={handleOpenPluginInstructions}
              data-tooltip="查看插件安装说明"
              aria-label="查看插件安装说明"
            >
              <Puzzle size={16} />
            </button>
          </>
        )}
        <a
          href="https://wemd.app/docs"
          target="_blank"
          rel="noopener noreferrer"
          data-tooltip="帮助文档"
          aria-label="帮助文档"
        >
          <BookOpen size={16} />
        </a>
      </div>
    </div>
  );
}
