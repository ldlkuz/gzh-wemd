import { X, Check } from "lucide-react";
import { useThemeStore } from "../../store/themeStore";
import { isThemeSelectable } from "../../store/themes/builtInThemes";
import "./MobileThemeSelector.css";

interface MobileThemeSelectorProps {
  open: boolean;
  onClose: () => void;
}

/**
 * 移动端简化版主题选择器
 * 只显示主题列表，点击即应用
 */
export function MobileThemeSelector({
  open,
  onClose,
}: MobileThemeSelectorProps) {
  const currentThemeId = useThemeStore((state) => state.themeId);
  const selectTheme = useThemeStore((state) => state.selectTheme);
  const getAllThemes = useThemeStore((state) => state.getAllThemes);

  // 获取所有主题并分组
  const allThemes = getAllThemes();
  const builtInThemes = allThemes.filter(
    (theme) => theme.isBuiltIn && isThemeSelectable(theme),
  );
  const customThemes = allThemes.filter((t) => !t.isBuiltIn);

  if (!open) return null;

  const handleSelect = (themeId: string) => {
    selectTheme(themeId);
    onClose();
  };

  return (
    <div className="mobile-theme-overlay" onClick={onClose}>
      <div className="mobile-theme-panel" onClick={(e) => e.stopPropagation()}>
        <div className="mobile-theme-header">
          <span>选择主题</span>
          <button className="mobile-theme-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="mobile-theme-list">
          {customThemes.length > 0 && (
            <div className="mobile-theme-group">
              <div className="mobile-theme-group-title">自定义主题</div>
              {customThemes.map((theme) => (
                <button
                  key={theme.id}
                  className={`mobile-theme-item ${currentThemeId === theme.id ? "active" : ""}`}
                  onClick={() => handleSelect(theme.id)}
                >
                  <span className="mobile-theme-name">{theme.name}</span>
                  {currentThemeId === theme.id && (
                    <Check size={18} className="mobile-theme-check" />
                  )}
                </button>
              ))}
            </div>
          )}

          <div className="mobile-theme-group">
            <div className="mobile-theme-group-title">内置主题</div>
            {builtInThemes.map((theme) => (
              <button
                key={theme.id}
                className={`mobile-theme-item ${currentThemeId === theme.id ? "active" : ""}`}
                onClick={() => handleSelect(theme.id)}
              >
                <span className="mobile-theme-name">{theme.name}</span>
                {currentThemeId === theme.id && (
                  <Check size={18} className="mobile-theme-check" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
