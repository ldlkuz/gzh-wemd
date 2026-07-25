import { createPortal } from "react-dom";
import type { FileItem, FolderItem } from "../../store/fileTypes";

interface DeleteFileModalProps {
  target: FileItem;
  deleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteFileModal({
  target,
  deleting,
  onConfirm,
  onCancel,
}: DeleteFileModalProps) {
  return createPortal(
    <div
      className="fs-confirm-backdrop"
      onClick={() => !deleting && onCancel()}
    >
      <div className="fs-confirm-modal" onClick={(e) => e.stopPropagation()}>
        <h4>删除文件</h4>
        <p>确定要删除"{target.name}"吗？此操作不可撤销。</p>
        <div className="fs-confirm-actions">
          <button
            className="btn-secondary"
            onClick={onCancel}
            disabled={deleting}
          >
            取消
          </button>
          <button
            className="btn-danger"
            onClick={onConfirm}
            disabled={deleting}
          >
            {deleting ? "删除中..." : "确认删除"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

interface DeleteFolderModalProps {
  target: FolderItem;
  extraItems?: string[];
  deleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteFolderModal({
  target,
  extraItems,
  deleting,
  onConfirm,
  onCancel,
}: DeleteFolderModalProps) {
  const hasChildren = target.children.length > 0;
  const hasExtras = (extraItems ?? []).length > 0;
  const extras = extraItems ?? [];
  const summary = extras.slice(0, 3).join("、");
  const extrasText =
    extras.length > 3 ? `${summary} 等 ${extras.length} 项` : summary;
  return createPortal(
    <div
      className="fs-confirm-backdrop"
      onClick={() => !deleting && onCancel()}
    >
      <div className="fs-confirm-modal" onClick={(e) => e.stopPropagation()}>
        <h4>删除文件夹</h4>
        <p>
          {hasChildren || hasExtras
            ? hasExtras
              ? `确定要删除文件夹"${target.name}"吗？这将删除其中所有文件与子文件夹，包含隐藏/非 md 文件（${extrasText}），且不可撤销。`
              : `确定要删除文件夹"${target.name}"吗？这将删除其中所有文件与子文件夹，且不可撤销。`
            : `确定要删除文件夹"${target.name}"吗？文件夹必须为空才能删除。`}
        </p>
        <div className="fs-confirm-actions">
          <button
            className="btn-secondary"
            onClick={onCancel}
            disabled={deleting}
          >
            取消
          </button>
          <button
            className="btn-danger"
            onClick={onConfirm}
            disabled={deleting}
          >
            {deleting
              ? "删除中..."
              : hasChildren || hasExtras
                ? "确认删除（含全部内容）"
                : "确认删除"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

interface RenameFolderModalProps {
  value: string;
  onChange: (value: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

export function RenameFolderModal({
  value,
  onChange,
  onConfirm,
  onCancel,
}: RenameFolderModalProps) {
  return createPortal(
    <div className="fs-confirm-backdrop" onClick={onCancel}>
      <div className="fs-confirm-modal" onClick={(e) => e.stopPropagation()}>
        <h4>重命名文件夹</h4>
        <input
          type="text"
          className="fs-new-folder-input"
          placeholder="输入文件夹名称"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onConfirm();
            if (e.key === "Escape") onCancel();
          }}
          autoFocus
        />
        <div className="fs-confirm-actions">
          <button className="btn-secondary" onClick={onCancel}>
            取消
          </button>
          <button className="btn-primary" onClick={onConfirm}>
            确认
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

interface NewFolderModalProps {
  value: string;
  onChange: (value: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

export function NewFolderModal({
  value,
  onChange,
  onConfirm,
  onCancel,
}: NewFolderModalProps) {
  return createPortal(
    <div className="fs-confirm-backdrop" onClick={onCancel}>
      <div className="fs-confirm-modal" onClick={(e) => e.stopPropagation()}>
        <h4>新建文件夹</h4>
        <input
          type="text"
          className="fs-new-folder-input"
          placeholder="输入文件夹名称"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onConfirm();
            if (e.key === "Escape") onCancel();
          }}
          autoFocus
        />
        <div className="fs-confirm-actions">
          <button className="btn-secondary" onClick={onCancel}>
            取消
          </button>
          <button className="btn-primary" onClick={onConfirm}>
            创建
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

interface TooltipProps {
  text: string;
  x: number;
  y: number;
}

export function Tooltip({ text, x, y }: TooltipProps) {
  return createPortal(
    <div className="fs-tooltip" style={{ top: y, left: x }}>
      {text}
    </div>,
    document.body,
  );
}
