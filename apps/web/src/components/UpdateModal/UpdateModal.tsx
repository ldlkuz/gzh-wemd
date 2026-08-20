import { X, Download, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { resolveAppAssetPath } from "../../utils/assetPath";
import "./UpdateModal.css";

interface UpdateModalProps {
  latestVersion: string;
  currentVersion: string;
  releaseNotes?: string;
  downloaded?: boolean;
  onClose: () => void;
  onDownload: () => void;
  onSkipVersion: () => void;
}

export function UpdateModal({
  latestVersion,
  releaseNotes,
  downloaded = false,
  onClose,
  onDownload,
  onSkipVersion,
}: UpdateModalProps) {
  const [showNotes, setShowNotes] = useState(false);
  const iconSrc = resolveAppAssetPath("favicon-dark.svg");

  // 简单处理 Markdown 格式的 release notes
  const formatReleaseNotes = (notes: string) => {
    return notes
      .replace(/^### /gm, "◆ ")
      .replace(/^## /gm, "▸ ")
      .replace(/^# /gm, "")
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .replace(/`(.*?)`/g, "$1")
      .replace(/^- /gm, "• ")
      .trim();
  };

  return (
    <div className="update-modal-overlay" onClick={onClose}>
      <div className="update-modal" onClick={(e) => e.stopPropagation()}>
        <button className="update-modal-close" onClick={onClose}>
          <X size={18} />
        </button>

        <div className="update-modal-icon">
          <img src={iconSrc} alt="WeMD" width={64} height={64} />
        </div>

        <h2 className="update-modal-title">
          {downloaded ? "更新已就绪" : "发现新版本"}
        </h2>
        <p className="update-modal-version">
          {downloaded ? "WeMD 已下载，重启即可安装" : `WeMD ${latestVersion} 已发布`}
        </p>

        {releaseNotes && (
          <button
            className="update-modal-notes-toggle"
            onClick={() => setShowNotes(!showNotes)}
          >
            {showNotes ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            {showNotes ? "收起更新日志" : "查看更新日志"}
          </button>
        )}

        {showNotes && releaseNotes && (
          <div className="update-modal-notes">
            <pre>{formatReleaseNotes(releaseNotes)}</pre>
          </div>
        )}

        <div className="update-modal-actions">
          {!downloaded && (
            <button className="update-modal-btn secondary" onClick={onClose}>
              稍后提醒
            </button>
          )}
          <button className="update-modal-btn primary" onClick={onDownload}>
            {downloaded ? <Download size={16} /> : null}
            {downloaded ? "重启并安装" : "前往下载"}
          </button>
        </div>

        {!downloaded && (
          <button className="update-modal-skip" onClick={onSkipVersion}>
            跳过此版本
          </button>
        )}
      </div>
    </div>
  );
}
