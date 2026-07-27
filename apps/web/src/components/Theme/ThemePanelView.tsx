import {
  AlertTriangle,
  ChevronDown,
  Copy,
  Download,
  Eye,
  FileText,
  Palette,
  Plus,
  Sparkles,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import type { MutableRefObject } from "react";
import type {
  CustomTheme,
  ThemeDefinition,
} from "../../store/themes/builtInThemes";
import { ThemeDesigner, type DesignerVariables } from "./ThemeDesigner";
import { ThemeLivePreview } from "./ThemeLivePreview";
import { AiThemeGenerator } from "./AiThemeGenerator";

interface ThemePanelViewProps {
  open: boolean;
  onClose: () => void;
  fileInputRef: MutableRefObject<HTMLInputElement | null>;
  builtInThemes: CustomTheme[];
  customThemes: CustomTheme[];
  selectedTheme: CustomTheme | undefined;
  selectedThemeId: string;
  isCustomTheme: boolean;
  isCreating: boolean;
  creationStep: "select-mode" | "editing";
  editorMode: "visual" | "css" | "ai";
  isVisualEditing: boolean;
  showDeleteConfirm: boolean;
  useCurrentArticle: boolean;
  previewCss: string;
  designerVariables: DesignerVariables | undefined;
  nameInput: string;
  cssInput: string;
  canSave: boolean;
  hasChanges: boolean;
  exportMenuOpen: boolean;
  exportMenuRef: MutableRefObject<HTMLDivElement | null>;
  onSelectTheme: (themeId: string) => void;
  onCreateNew: () => void;
  onImportThemeFile: (file: File) => Promise<void>;
  onSelectCreationMode: (mode: "visual" | "css" | "ai") => void;
  onSetUseCurrentArticle: (value: boolean) => void;
  onVisualCssChange: (nextCss: string) => void;
  onVariablesChange: (vars: DesignerVariables) => void;
  onNameInputChange: (value: string) => void;
  onCssInputChange: (value: string) => void;
  onCloseDeleteConfirm: () => void;
  onConfirmDelete: () => void;
  onCancelCreate: () => void;
  onDuplicate: () => void;
  onToggleExportMenu: () => void;
  onExportJson: () => void;
  onExportCss: () => void;
  onDeleteClick: () => void;
  onSave: () => void;
  onApply: () => void;
  /** AI 生成 CSS 完成回调，附带 definition（若 AI 返回 JSON） */
  onAiGenerated: (css: string, definition?: ThemeDefinition) => void;
  /** AI 预览 CSS 实时更新 */
  onPreviewCss: (css: string) => void;
  /** AI 建议主题名称 */
  onNameSuggestion: (name: string) => void;
}

export function ThemePanelView({
  open,
  onClose,
  fileInputRef,
  builtInThemes,
  customThemes,
  selectedTheme,
  selectedThemeId,
  isCustomTheme,
  isCreating,
  creationStep,
  editorMode,
  isVisualEditing,
  showDeleteConfirm,
  useCurrentArticle,
  previewCss,
  designerVariables,
  nameInput,
  cssInput,
  canSave,
  hasChanges,
  exportMenuOpen,
  exportMenuRef,
  onSelectTheme,
  onCreateNew,
  onImportThemeFile,
  onSelectCreationMode,
  onSetUseCurrentArticle,
  onVisualCssChange,
  onVariablesChange,
  onNameInputChange,
  onCssInputChange,
  onCloseDeleteConfirm,
  onConfirmDelete,
  onCancelCreate,
  onDuplicate,
  onToggleExportMenu,
  onExportJson,
  onExportCss,
  onDeleteClick,
  onSave,
  onApply,
  onAiGenerated,
  onPreviewCss,
  onNameSuggestion,
}: ThemePanelViewProps) {
  if (!open) return null;

  return (
    <div className="theme-overlay" onClick={onClose}>
      <div className="theme-modal" onClick={(e) => e.stopPropagation()}>
        <div className="theme-header">
          <h3>主题管理</h3>
          <button className="close-btn" onClick={onClose} aria-label="关闭">
            <X size={20} />
          </button>
        </div>

        <div className="theme-body">
          <div className="theme-sidebar">
            <button className="btn-new-theme" onClick={onCreateNew}>
              <Plus size={16} /> 新建自定义主题
            </button>
            <button
              className="btn-import-theme"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={16} /> 导入主题
            </button>
            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              style={{ display: "none" }}
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (file) {
                  await onImportThemeFile(file);
                  e.target.value = "";
                }
              }}
            />

            <div className="theme-list-scroll">
              {customThemes.length > 0 && (
                <div className="theme-group">
                  <div className="theme-group-title">自定义主题</div>
                  {customThemes.map((item) => (
                    <button
                      key={item.id}
                      className={`theme-item ${item.id === selectedThemeId ? "active" : ""}`}
                      onClick={() => onSelectTheme(item.id)}
                    >
                      {item.name}
                    </button>
                  ))}
                </div>
              )}

              <div className="theme-group">
                <div className="theme-group-title">内置主题</div>
                {builtInThemes.map((item) => (
                  <button
                    key={item.id}
                    className={`theme-item ${item.id === selectedThemeId ? "active" : ""}`}
                    onClick={() => onSelectTheme(item.id)}
                  >
                    {item.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="theme-editor" style={{ position: "relative" }}>
            {showDeleteConfirm && (
              <div className="delete-confirm-overlay">
                <div className="delete-confirm-box">
                  <div className="confirm-icon-wrapper">
                    <AlertTriangle size={24} color="#ef4444" />
                  </div>
                  <h4>确认删除</h4>
                  <p>
                    确定要删除主题 "{selectedTheme?.name}" 吗？此操作无法撤销。
                  </p>
                  <div className="delete-confirm-actions">
                    <button
                      className="btn-secondary"
                      onClick={onCloseDeleteConfirm}
                    >
                      取消
                    </button>
                    <button
                      className="btn-primary"
                      style={{ background: "#ef4444", boxShadow: "none" }}
                      onClick={onConfirmDelete}
                    >
                      确认删除
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="theme-form">
              {isCreating && creationStep === "select-mode" && (
                <div className="mode-selection">
                  <h3>选择创建方式</h3>
                  <div className="mode-cards">
                    <button
                      className="mode-card"
                      onClick={() => onSelectCreationMode("visual")}
                    >
                      <span className="mode-icon">
                        <Palette size={32} />
                      </span>
                      <span className="mode-title">可视化设计</span>
                      <span className="mode-desc">
                        通过可视化控件快速定制主题样式
                      </span>
                      <span className="mode-tag">适合快速上手</span>
                    </button>
                    <button
                      className="mode-card mode-card-ai"
                      onClick={() => onSelectCreationMode("ai")}
                    >
                      <span className="mode-icon mode-icon-ai">
                        <Sparkles size={32} />
                      </span>
                      <span className="mode-title">AI 生成</span>
                      <span className="mode-desc">
                        描述需求，AI 自动生成主题
                      </span>
                      <span className="mode-tag">适合零基础</span>
                    </button>
                  </div>
                </div>
              )}

              {(!isCreating || creationStep === "editing") && (
                <>
                  <div className="theme-form-preview">
                    <div className="preview-source-toggle">
                      <button
                        className={`toggle-btn ${useCurrentArticle ? "active" : ""}`}
                        onClick={() => onSetUseCurrentArticle(true)}
                        title="预览当前正在编辑的文章"
                      >
                        <FileText size={14} />
                        当前文章
                      </button>
                      <button
                        className={`toggle-btn ${!useCurrentArticle ? "active" : ""}`}
                        onClick={() => onSetUseCurrentArticle(false)}
                        title="预览内置示例内容"
                      >
                        <Eye size={14} />
                        示例内容
                      </button>
                    </div>
                    <ThemeLivePreview
                      css={previewCss}
                      designerVariables={
                        isVisualEditing ? designerVariables : undefined
                      }
                      useCurrentArticle={useCurrentArticle}
                    />
                  </div>

                  <div className="theme-form-fields">
                    <label>主题名称</label>
                    <input
                      value={nameInput}
                      onChange={(e) => onNameInputChange(e.target.value)}
                      placeholder="输入主题名称..."
                      disabled={!isCreating && !isCustomTheme}
                    />

                    {((isCreating && editorMode === "visual") ||
                      (!isCreating &&
                        isCustomTheme &&
                        selectedTheme?.editorMode === "visual")) && (
                      <div className="visual-designer-container">
                        <ThemeDesigner
                          onCSSChange={onVisualCssChange}
                          onVariablesChange={onVariablesChange}
                          initialVariables={
                            isCreating
                              ? undefined
                              : selectedTheme?.designerVariables
                          }
                        />
                      </div>
                    )}

                    {isCreating && editorMode === "ai" && (
                      <div className="ai-designer-container">
                        <AiThemeGenerator
                          onGenerated={onAiGenerated}
                          onPreviewCss={onPreviewCss}
                          onNameSuggestion={onNameSuggestion}
                        />
                      </div>
                    )}

                    {((isCreating && editorMode === "css") ||
                      (!isCreating &&
                        selectedTheme?.editorMode !== "visual")) && (
                      <>
                        <label>CSS 样式</label>
                        <textarea
                          value={cssInput}
                          onChange={(e) => onCssInputChange(e.target.value)}
                          placeholder="输入 CSS 样式代码..."
                          spellCheck={false}
                          disabled={!isCreating && !isCustomTheme}
                        />
                      </>
                    )}

                    {!isCreating && !isCustomTheme && (
                      <p className="info-hint">
                        💡内置主题不可编辑，点击"复制"按钮可以基于此主题创建自定义主题
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="theme-actions">
              {isCreating ? (
                <>
                  <button className="btn-secondary" onClick={onCancelCreate}>
                    取消
                  </button>
                  <button
                    className="btn-primary"
                    onClick={onSave}
                    disabled={!canSave}
                  >
                    保存为新主题
                  </button>
                </>
              ) : isCustomTheme ? (
                <>
                  <button className="btn-icon-text" onClick={onDuplicate}>
                    <Copy size={16} /> 复制
                  </button>
                  <div className="theme-export-menu" ref={exportMenuRef}>
                    <button
                      className="btn-icon-text"
                      onClick={onToggleExportMenu}
                      aria-haspopup="menu"
                      aria-expanded={exportMenuOpen}
                    >
                      <Download size={16} /> 导出 <ChevronDown size={14} />
                    </button>
                    {exportMenuOpen && (
                      <div className="theme-export-dropdown" role="menu">
                        {selectedTheme?.editorMode === "visual" && (
                          <button
                            type="button"
                            role="menuitem"
                            onClick={onExportJson}
                          >
                            <Download size={16} /> JSON（支持可视化编辑）
                          </button>
                        )}
                        <button
                          type="button"
                          role="menuitem"
                          onClick={onExportCss}
                        >
                          <Download size={16} /> CSS（不支持可视化编辑）
                        </button>
                      </div>
                    )}
                  </div>
                  <button
                    className="btn-icon-text btn-danger"
                    onClick={onDeleteClick}
                  >
                    <Trash2 size={16} /> 删除
                  </button>
                  <div className="flex-spacer"></div>
                  <button className="btn-secondary" onClick={onClose}>
                    取消
                  </button>
                  <button
                    className="btn-primary"
                    onClick={onSave}
                    disabled={!hasChanges}
                  >
                    保存修改
                  </button>
                  <button className="btn-primary" onClick={onApply}>
                    应用主题
                  </button>
                </>
              ) : (
                <>
                  <button className="btn-icon-text" onClick={onDuplicate}>
                    <Copy size={16} /> 复制
                  </button>
                  <div className="flex-spacer"></div>
                  <button className="btn-secondary" onClick={onClose}>
                    取消
                  </button>
                  <button className="btn-primary" onClick={onApply}>
                    应用主题
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
