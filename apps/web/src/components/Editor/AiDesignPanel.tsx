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
import type { Audience } from "../../services/ai/types";
import type { DesignConstraints } from "../../services/ai/types";
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

const AUDIENCE_OPTIONS: {
  value: Audience["type"];
  label: string;
  desc: string;
}[] = [
  { value: "auto", label: "自动（推荐）", desc: "AI 自行判断读者阅读行为" },
  { value: "general", label: "大众阅读", desc: "平实易懂，兼顾深度和可读性" },
  { value: "quick", label: "快速浏览", desc: "多小标题、摘要、重点突出" },
  { value: "deep", label: "深度阅读", desc: "长段落、完整论证、留白更多" },
  { value: "learning", label: "学习研究", desc: "流程图、知识框、引用、总结" },
  { value: "decision", label: "决策参考", desc: "数据、对比、结论优先" },
  { value: "brand", label: "品牌传播", desc: "情绪感染、视觉冲击、CTA" },
];

const DESIGN_GOAL_OPTIONS: {
  value: DesignConstraints["designGoal"];
  label: string;
  desc: string;
}[] = [
  { value: "auto", label: "自动（推荐）", desc: "AI 根据内容自行判断最佳目标" },
  { value: "reading", label: "阅读优先", desc: "保持阅读流畅，组件仅强调重点" },
  { value: "balanced", label: "平衡设计", desc: "阅读与视觉表现保持平衡" },
  { value: "visual", label: "视觉优先", desc: "最大化视觉表现，强化节奏感" },
  {
    value: "infoDensity",
    label: "信息密度",
    desc: "表格、时间轴、对比，信息表达效率优先",
  },
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
  const [audience, setAudience] = useState<Audience["type"]>("auto");
  const [designGoal, setDesignGoal] =
    useState<DesignConstraints["designGoal"]>("auto");

  const handleClose = useCallback(() => {
    if (isTemplatePreviewing) {
      onUndoTemplatePreview();
    }
    onClose();
  }, [isTemplatePreviewing, onUndoTemplatePreview, onClose]);

  const handleStartTemplate = () => {
    onResetTemplate();
    const audienceObj: Audience = { type: audience };
    // SafetyLimit 只兜底异常生成，不作为目标数量；所有 Goal 统一上限 20
    const constraints: DesignConstraints = {
      safetyLimit: 20,
      designGoal,
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
                    {opt.label} - {opt.desc}
                  </option>
                ))}
              </select>
            </div>
            <div className="ai-design-config-item">
              <label className="ai-design-config-label">
                <SlidersHorizontal size={14} />
                设计目标
              </label>
              <select
                className="ai-design-config-select"
                value={designGoal}
                onChange={(e) =>
                  setDesignGoal(
                    e.target.value as DesignConstraints["designGoal"],
                  )
                }
                disabled={templateLoading}
              >
                {DESIGN_GOAL_OPTIONS.map((opt) => (
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
                可调整读者画像和设计目标来控制生成风格
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
