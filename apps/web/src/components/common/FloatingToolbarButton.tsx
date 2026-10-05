import type { ReactNode } from "react";

interface FloatingToolbarButtonProps {
  /** 按钮图标 */
  icon: ReactNode;
  /** 无障碍标签和 tooltip 文本 */
  label: string;
  /** 点击回调 */
  onClick: () => void;
  /** 是否为悬浮工具按钮的默认样式 */
  primary?: boolean;
  /** 是否显示为强调样式（主题色边框） */
  highlight?: boolean;
  /** 图标右上角的装饰圆点（如服务运行状态点）；null 不渲染 */
  badge?: ReactNode;
  /** 按钮内联文字（在图标右侧，如「渲染API」）；提供时按钮为图标+文字形态 */
  text?: string;
  /** 行内状态点，渲染在文字右侧（绿=运行 / 红=停止） */
  statusDot?: "running" | "stopped";
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
  badge,
  text,
  statusDot,
}: FloatingToolbarButtonProps) {
  const classNames = [
    "floating-btn",
    primary && "floating-btn-primary",
    highlight && "floating-btn-show",
    text && "floating-btn-has-text",
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
      {badge ? (
        <span className="floating-btn-badge" aria-hidden="true">
          {badge}
        </span>
      ) : null}
      {typeof text === "string" && text.length > 0 ? (
        <span className="floating-btn-text">{text}</span>
      ) : null}
      {statusDot ? (
        <span
          className={`floating-btn-statdot ${
            statusDot === "running" ? "is-running" : ""
          }`}
          aria-hidden="true"
        />
      ) : null}
    </button>
  );
}
