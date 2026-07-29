import { Palette, ChevronRight } from "lucide-react";
import { useThemeStore } from "../../store/themeStore";
import { getBuiltInThemeDefinition } from "@wemd/core";
import { openThemePanel } from "../../services/theme/openThemePanelEvent";
import "./CurrentThemeBadge.css";

/**
 * 只读主题徽章：显示当前应用的文章主题
 * - 颜色点跟随当前主题的 tokens.color.primary
 * - 点击跳转「文章主题」面板（但不允许直接切换主题）
 */
export function CurrentThemeBadge() {
  const themeId = useThemeStore((s) => s.themeId);
  const themeName = useThemeStore((s) => s.themeName);
  const customThemes = useThemeStore((s) => s.customThemes);

  // 计算主色点颜色：优先用 ThemeDefinition 的 tokens.color.primary
  let primaryColor = "";
  let themeType: "builtin" | "custom" = "builtin";
  const builtInDef = getBuiltInThemeDefinition(themeId);
  if (builtInDef?.tokens?.color?.primary) {
    primaryColor = builtInDef.tokens.color.primary;
  } else {
    const custom = customThemes.find((t) => t.id === themeId);
    if (custom) {
      themeType = "custom";
      if (custom.definition?.tokens?.color?.primary) {
        primaryColor = custom.definition.tokens.color.primary;
      } else if (custom.designerVariables?.primaryColor) {
        primaryColor = custom.designerVariables.primaryColor;
      }
    }
  }

  const colorDot = primaryColor ? { background: primaryColor } : undefined;

  return (
    <button
      type="button"
      className="current-theme-badge"
      onClick={openThemePanel}
      data-tooltip="当前文章主题：到文章主题面板中切换"
      title="当前文章主题：到文章主题面板中切换"
    >
      <span className="current-theme-badge__dot" style={colorDot}>
        {!colorDot && <Palette size={10} />}
      </span>
      <span className="current-theme-badge__label">
        <span className="current-theme-badge__name">{themeName}</span>
        <span className="current-theme-badge__tag">
          {themeType === "custom" ? "自定义" : "内置"}
        </span>
      </span>
      <ChevronRight size={12} className="current-theme-badge__chev" />
    </button>
  );
}
