import type { ReactNode } from "react";
import "./Modal.css";

interface ModalProps {
  /** 是否显示弹窗 */
  open: boolean;
  /** 关闭回调 */
  onClose: () => void;
  /** 弹窗标题 */
  title: string;
  /** 弹窗内容 */
  children: ReactNode;
  /** 自定义类名 */
  className?: string;
}

/**
 * 通用弹窗组件
 * 提供统一的弹窗外观和交互，包括遮罩层、标题栏和关闭按钮
 */
export function Modal({
  open,
  onClose,
  title,
  children,
  className,
}: ModalProps) {
  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className={`modal-panel ${className || ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="modal-close" onClick={onClose} aria-label="关闭">
            ×
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}
