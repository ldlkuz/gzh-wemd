/**
 * AI 杂志排版面板 —— 一键生成完整的杂志级排版模板
 */
import { useState, useCallback } from "react";
import {
  Check,
  Eye,
  EyeOff,
  Sparkles,
  Loader2,
  RefreshCw,
  Layers,
  Palette,
  Users,
  SlidersHorizontal,
} from "lucide-react";
import { Modal } from "../common/Modal";
import type { TemplateGenerationResult } from "../../services/template";
import type { Audience } from "../../services/ai/analysisAgent";
import type { DesignConstraints } from "../../services/ai/analysisAgent";
import { ARTICLE_TYPE_LABELS } from "./AiLayoutPanel";
import "./AiDesignPanel.css";

interface AiDesignPanelProps {
  open: boolean;
  onClose: () => void;

  templateLoading: boolean;
  templateResult: TemplateGenerationResult | null;
  onGenerateTemplate: (
    audience?: Audience,
    constraints?: DesignConstraints,
  ) => void;
  onApplyTemplate: (result: TemplateGenerationResult) => void;
  onPreviewTemplate: (result: TemplateGenerationResult) => void;
  onUndoTemplatePreview: () => void;
  isTemplatePreviewing: boolean;
  onResetTemplate: () => void;
}

const AUDIENCE_OPTIONS: { value: Audience["type"]; label: string }[] = [
  { value: "general", label: "普通读者" },
  { value: "developer", label: "程序员/技术人" },
  { value: "manager", label: "管理者/决策者" },
  { value: "beginner", label: "小白/初学者" },
];

const COMPLEXITY_OPTIONS: {
  value: DesignConstraints["complexity"];
  label: string;
  desc: string;
}[] = [
  { value: "low", label: "简洁", desc: "最少组件，突出正文" },
  { value: "medium", label: "适中", desc: "适度点缀，平衡阅读与视觉" },
  { value: "high", label: "丰富", desc: "杂志级排版，全方位视觉增强" },
];

export function AiDesignPanel({
  open,
  onClose,
  templateLoading,
  templateResult,
  onGenerateTemplate,
  onApplyTemplate,
  onPreviewTemplate,
  onUndoTemplatePreview,
  isTemplatePreviewing,
  onResetTemplate,
}: AiDesignPanelProps) {
  const [audience, setAudience] = useState<Audience["type"]>("general");
  const [complexity, setComplexity] =
    useState<DesignConstraints["complexity"]>("medium");

  const handleClose = useCallback(() => {
    if (isTemplatePreviewing) {
      onUndoTemplatePreview();
    }
    onClose();
  }, [isTemplatePreviewing, onUndoTemplatePreview, onClose]);

  const handleStartTemplate = () => {
    onResetTemplate();
    const audienceObj: Audience = { type: audience };
    const constraints: DesignConstraints = {
      maxComponents: complexity === "low" ? 4 : complexity === "high" ? 12 : 8,
      complexity,
    };
    onGenerateTemplate(audienceObj, constraints);
  };

  const handleTemplatePreviewToggle = () => {
    if (!templateResult) return;
    if (isTemplatePreviewing) {
      onUndoTemplatePreview();
    } else {
      onPreviewTemplate(templateResult);
    }
  };

  const handleTemplateApply = () => {
    if (!templateResult) return;
    if (isTemplatePreviewing) {
      onUndoTemplatePreview();
    }
    onApplyTemplate(templateResult);
  };

  const hasTemplateResult = templateResult !== null;

  const totalComponents = templateResult?.template.layout.length || 0;
  const articleSections =
    templateResult?.template.layout.filter(
      (n) => n.component === "article-section",
    ).length || 0;
  const decorComponents = totalComponents - articleSections;

  const magazineLevelLabels: Record<string, { label: string; desc: string }> = {
    high: { label: "全卡片化", desc: "杂志级排版，正文全部卡片化" },
    medium: { label: "适度点缀", desc: "平衡阅读与视觉效果" },
    low: { label: "简洁为主", desc: "信息高效，最少装饰" },
  };

  // v2.0 模板不再有 magazineLevel 概念，仅旧模板显示
  const isV2Template = templateResult?.template.version?.startsWith("2.");
  const magazineLevelInfo =
    !isV2Template && templateResult?.magazineLevel
      ? magazineLevelLabels[templateResult.magazineLevel] || null
      : null;

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="AI 杂志排版"
      className="ai-design-panel"
    >
      <div className="ai-design-body">
        {/* 配置区：读者画像 + 排版复杂度 */}
        <div className="ai-design-config">
          <div className="ai-design-config-row">
            <div className="ai-design-config-item">
              <label className="ai-design-config-label">
                <Users size={14} />
                读者画像
              </label>
              <select
                className="ai-design-config-select"
                value={audience}
                onChange={(e) =>
                  setAudience(e.target.value as Audience["type"])
                }
                disabled={templateLoading}
              >
                {AUDIENCE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="ai-design-config-item">
              <label className="ai-design-config-label">
                <SlidersHorizontal size={14} />
                排版丰富度
              </label>
              <select
                className="ai-design-config-select"
                value={complexity}
                onChange={(e) =>
                  setComplexity(
                    e.target.value as DesignConstraints["complexity"],
                  )
                }
                disabled={templateLoading}
              >
                {COMPLEXITY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label} - {opt.desc}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* 模式说明 */}
        <div className="ai-design-mode-hint">
          AI 根据读者画像和排版丰富度生成完整排版模板，全文预览后直接应用
        </div>

        <div className="ai-design-content">
          {templateLoading ? (
            <div className="ai-layout-loading">
              <Loader2 size={32} className="spinning" />
              <p>AI 正在设计排版方案...</p>
              <p className="ai-layout-loading-hint">
                分析文章结构 + 设计组件布局，约需 5-15 秒
              </p>
            </div>
          ) : !hasTemplateResult ? (
            <div className="ai-layout-empty">
              <Sparkles size={32} />
              <p>点击「开始设计」生成杂志级排版</p>
              <p className="ai-layout-empty-hint">
                可调整读者画像和排版丰富度来控制生成风格
              </p>
              <button
                className="ai-design-start-btn"
                onClick={handleStartTemplate}
                disabled={templateLoading}
              >
                <Sparkles size={14} />
                开始设计
              </button>
            </div>
          ) : (
            <>
              <div className="ai-layout-summary">
                {templateResult.articleType &&
                  ARTICLE_TYPE_LABELS[templateResult.articleType] && (
                    <div className="ai-layout-type-badge">
                      识别为{" "}
                      <strong>
                        {ARTICLE_TYPE_LABELS[templateResult.articleType]}
                      </strong>{" "}
                      文章
                      {templateResult.typeReason && (
                        <span className="ai-layout-type-reason">
                          {" "}
                          · {templateResult.typeReason}
                        </span>
                      )}
                    </div>
                  )}
                {magazineLevelInfo && (
                  <div className="ai-layout-type-badge magazine-level-badge">
                    <Palette size={14} />
                    <span>
                      杂志化等级：<strong>{magazineLevelInfo.label}</strong>
                    </span>
                    {templateResult.magazineReason && (
                      <span className="ai-layout-type-reason">
                        {" "}
                        · {templateResult.magazineReason}
                      </span>
                    )}
                  </div>
                )}
                <div className="template-stats">
                  <div className="template-stat-item">
                    <Layers size={16} />
                    <span>
                      共 <strong>{totalComponents}</strong> 个模块
                    </span>
                    <span className="template-stat-sub">
                      （{decorComponents} 个组件 + {articleSections} 段正文）
                    </span>
                  </div>
                  <div className="template-stat-item">
                    <Eye size={16} />
                    <span>
                      正文覆盖率{" "}
                      <strong>
                        {(templateResult.rendered.coverage * 100).toFixed(0)}%
                      </strong>
                    </span>
                  </div>
                </div>
              </div>

              {templateResult.warnings.length > 0 && (
                <div className="template-warnings">
                  {templateResult.warnings.slice(0, 3).map((w, i) => (
                    <div key={i} className="template-warning-item">
                      <span>⚠️ {w}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="template-preview-hint">
                <Eye size={14} />
                {isTemplatePreviewing
                  ? "正在右侧预览框显示完整排版效果"
                  : "点击下方按钮预览完整效果"}
              </div>

              <div className="ai-layout-footer">
                <button
                  className="ai-layout-footer-btn ai-layout-footer-regenerate"
                  onClick={handleStartTemplate}
                  disabled={templateLoading}
                >
                  <RefreshCw
                    size={14}
                    className={templateLoading ? "spinning" : ""}
                  />
                  重新生成
                </button>
                <div className="ai-layout-footer-buttons">
                  <button
                    className={`ai-layout-footer-btn ${isTemplatePreviewing ? "ai-layout-footer-preview-active" : "ai-layout-footer-preview"}`}
                    onClick={handleTemplatePreviewToggle}
                    disabled={!templateResult}
                  >
                    {isTemplatePreviewing ? (
                      <>
                        <EyeOff size={14} />
                        撤销预览
                      </>
                    ) : (
                      <>
                        <Eye size={14} />
                        预览效果
                      </>
                    )}
                  </button>
                  <button
                    className="ai-layout-footer-btn ai-layout-footer-apply"
                    onClick={handleTemplateApply}
                    disabled={!templateResult}
                  >
                    <Check size={14} />
                    应用到文章
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </Modal>
  );
}
