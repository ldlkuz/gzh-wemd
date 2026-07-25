import type { ReactNode } from "react";

interface FloatingToolbarButtonProps {
  /** 按钮图标 */
  icon: ReactNode;
  /** 无障碍标签和 tooltip 文本 */
  label: string;
  /** 点击回调 */
  onClick: () => void;
  /** 是否为主操作按钮（绿色渐变背景） */
  primary?: boolean;
  /** 是否显示为强调样式（主题色边框） */
  highlight?: boolean;
}

/**
 * 浮动工具栏按钮组件
 * 用于标题栏隐藏后显示的浮动操作按钮
 */
export function FloatingToolbarButton({
  icon,
  label,
  onClick,
  primary = false,
  highlight = false,
}: FloatingToolbarButtonProps) {
  const classNames = [
    "floating-btn",
    primary && "floating-btn-primary",
    highlight && "floating-btn-show",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      className={classNames}
      onClick={onClick}
      aria-label={label}
      title={label}
      data-tooltip={label}
    >
      {icon}
    </button>
  );
}
