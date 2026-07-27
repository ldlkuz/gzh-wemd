/**
 * AI 设计 —— 统一面板
 *
 * 合并"组件插入"和"杂志排版"两个入口，提供：
 * - 读者画像（Audience）选择
 * - 排版复杂度（Complexity）选择
 * - 模式切换：组件插入 / 杂志级排版
 */
import { useState, useEffect, useCallback } from "react";
import {
  Check,
  X,
  Eye,
  EyeOff,
  Sparkles,
  Loader2,
  RefreshCw,
  Users,
  SlidersHorizontal,
  Puzzle,
  Layers,
  Palette,
} from "lucide-react";
import { Modal } from "../common/Modal";
import {
  type Audience,
  type DesignConstraints,
} from "../../services/ai/analysisAgent";
import type { Insertion } from "../../services/ai/analysisAgent";
import type { TemplateGenerationResult } from "../../services/template";
import { COMPONENT_LABELS, ARTICLE_TYPE_LABELS } from "./AiLayoutPanel";
import "./AiDesignPanel.css";

/** AI 设计模式 */
export type DesignMode = "insert" | "template";

interface AiDesignPanelProps {
  /** 是否打开 */
  open: boolean;
  /** 关闭面板 */
  onClose: () => void;

  // === 组件插入模式 ===
  /** 组件插入模式加载中 */
  insertLoading: boolean;
  /** 组件插入建议 */
  insertions: Insertion[];
  /** 文章类型 */
  articleType?: string;
  /** 类型理由 */
  typeReason?: string;
  /** 设计策略 */
  strategy?: string;
  /** 触发组件插入分析 */
  onAnalyzeInsert: (
    audience?: Audience,
    constraints?: DesignConstraints,
  ) => void;
  /** 采纳指定建议 */
  onApplyInsertions: (insertions: Insertion[]) => void;
  /** 预览单条建议 */
  onPreviewInsertion: (insertion: Insertion) => void;
  /** 撤销预览 */
  onUndoPreview: () => void;
  /** 重置插入结果 */
  onResetInsertions: () => void;

  // === 模板排版模式 ===
  /** 模板模式加载中 */
  templateLoading: boolean;
  /** 模板生成结果 */
  templateResult: TemplateGenerationResult | null;
  /** 触发模板生成 */
  onGenerateTemplate: () => void;
  /** 应用模板到文章 */
  onApplyTemplate: (result: TemplateGenerationResult) => void;
  /** 预览模板全文 */
  onPreviewTemplate: (result: TemplateGenerationResult) => void;
  /** 撤销模板预览 */
  onUndoTemplatePreview: () => void;
  /** 模板是否正在预览 */
  isTemplatePreviewing: boolean;
  /** 重置模板结果 */
  onResetTemplate: () => void;
}

type ItemStatus = "pending" | "accepted" | "skipped";

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
  insertLoading,
  insertions,
  articleType,
  typeReason,
  strategy,
  onAnalyzeInsert,
  onApplyInsertions,
  onPreviewInsertion,
  onUndoPreview,
  onResetInsertions,
  templateLoading,
  templateResult,
  onGenerateTemplate,
  onApplyTemplate,
  onPreviewTemplate,
  onUndoTemplatePreview,
  isTemplatePreviewing,
  onResetTemplate,
}: AiDesignPanelProps) {
  // 当前模式
  const [mode, setMode] = useState<DesignMode>("insert");
  // 用户设置
  const [audience, setAudience] = useState<Audience["type"]>("general");
  const [complexity, setComplexity] =
    useState<DesignConstraints["complexity"]>("medium");
  // 组件插入建议状态
  const [statuses, setStatuses] = useState<ItemStatus[]>([]);
  const [previewingIdx, setPreviewingIdx] = useState<number | null>(null);

  // insertions 变化时重置状态
  useEffect(() => {
    setStatuses(insertions.map(() => "pending"));
    setPreviewingIdx(null);
  }, [insertions]);

  // 关闭面板前清理
  const handleClose = useCallback(() => {
    if (previewingIdx !== null) {
      onUndoPreview();
      setPreviewingIdx(null);
    }
    if (isTemplatePreviewing) {
      onUndoTemplatePreview();
    }
    onClose();
  }, [
    previewingIdx,
    isTemplatePreviewing,
    onUndoPreview,
    onUndoTemplatePreview,
    onClose,
  ]);

  // === 组件插入操作 ===
  const handleStartInsert = () => {
    onResetInsertions();
    setPreviewingIdx(null);
    const audienceObj: Audience = { type: audience };
    const constraints: DesignConstraints = {
      maxComponents: complexity === "low" ? 4 : complexity === "high" ? 12 : 8,
      complexity,
    };
    onAnalyzeInsert(audienceObj, constraints);
  };

  const handlePreview = (idx: number) => {
    if (previewingIdx === idx) {
      onUndoPreview();
      setPreviewingIdx(null);
      return;
    }
    onPreviewInsertion(insertions[idx]);
    setPreviewingIdx(idx);
  };

  const handleAccept = (idx: number) => {
    if (previewingIdx === idx) {
      onUndoPreview();
      setPreviewingIdx(null);
    }
    setStatuses((prev) => {
      const next = [...prev];
      next[idx] = next[idx] === "accepted" ? "pending" : "accepted";
      return next;
    });
  };

  const handleSkip = (idx: number) => {
    if (previewingIdx === idx) {
      onUndoPreview();
      setPreviewingIdx(null);
    }
    setStatuses((prev) => {
      const next = [...prev];
      next[idx] = next[idx] === "skipped" ? "pending" : "skipped";
      return next;
    });
  };

  const handleApplyAll = () => {
    if (previewingIdx !== null) {
      onUndoPreview();
      setPreviewingIdx(null);
    }
    const accepted = insertions.filter((_, i) => statuses[i] === "accepted");
    if (accepted.length === 0) return;
    onApplyInsertions(accepted);
  };

  const handleSkipAll = () => {
    if (previewingIdx !== null) {
      onUndoPreview();
      setPreviewingIdx(null);
    }
    setStatuses(insertions.map(() => "skipped"));
    onClose();
  };

  const acceptedCount = statuses.filter((s) => s === "accepted").length;

  // === 模板排版操作 ===
  const handleStartTemplate = () => {
    onResetTemplate();
    onGenerateTemplate();
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

  // 模板组件统计
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

  const magazineLevelInfo = templateResult?.magazineLevel
    ? magazineLevelLabels[templateResult.magazineLevel] || null
    : null;

  // 判断是否处于任何加载状态
  const hasInsertResult = insertions.length > 0;
  const hasTemplateResult = templateResult !== null;
  const isLoading = insertLoading || templateLoading;

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="AI 设计"
      className="ai-design-panel"
    >
      <div className="ai-design-body">
        {/* 配置区：读者画像 + 复杂度 */}
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
                disabled={isLoading}
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
                排版复杂度
              </label>
              <select
                className="ai-design-config-select"
                value={complexity}
                onChange={(e) =>
                  setComplexity(
                    e.target.value as DesignConstraints["complexity"],
                  )
                }
                disabled={isLoading}
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

        {/* 模式切换 tabs */}
        <div className="ai-design-tabs">
          <button
            className={`ai-design-tab ${mode === "insert" ? "active" : ""}`}
            onClick={() => setMode("insert")}
            disabled={isLoading}
          >
            <Puzzle size={14} />
            组件插入
          </button>
          <button
            className={`ai-design-tab ${mode === "template" ? "active" : ""}`}
            onClick={() => setMode("template")}
            disabled={isLoading}
          >
            <Layers size={14} />
            杂志排版
          </button>
        </div>

        {/* 模式说明 */}
        <div className="ai-design-mode-hint">
          {mode === "insert"
            ? "AI 分析文章后建议在何处插入哪些组件，逐个预览后采纳"
            : "AI 一键生成完整排版模板，全文预览后直接应用"}
        </div>

        {/* === 组件插入模式内容 === */}
        {mode === "insert" && (
          <div className="ai-design-content">
            {insertLoading ? (
              <div className="ai-layout-loading">
                <Loader2 size={32} className="spinning" />
                <p>AI 正在分析文章...</p>
                <p className="ai-layout-loading-hint">通常需要 5-15 秒</p>
              </div>
            ) : !hasInsertResult ? (
              <div className="ai-layout-empty">
                <Sparkles size={32} />
                <p>点击「开始设计」让 AI 分析你的文章</p>
                <p className="ai-layout-empty-hint">
                  将根据读者画像和排版复杂度，智能建议组件插入位置
                </p>
                <button
                  className="ai-design-start-btn"
                  onClick={handleStartInsert}
                  disabled={insertLoading}
                >
                  <Sparkles size={14} />
                  开始设计
                </button>
              </div>
            ) : insertions.length === 0 ? (
              <div className="ai-layout-empty">
                <Sparkles size={32} />
                <p>AI 没有发现适合插入组件的位置</p>
                <p className="ai-layout-empty-hint">
                  可能文章太短，或当前内容不需要组件增强
                </p>
                <button
                  className="ai-design-start-btn"
                  onClick={handleStartInsert}
                >
                  <RefreshCw size={14} />
                  重新分析
                </button>
              </div>
            ) : (
              <>
                <div className="ai-layout-summary">
                  {articleType && ARTICLE_TYPE_LABELS[articleType] && (
                    <div className="ai-layout-type-badge">
                      识别为 <strong>{ARTICLE_TYPE_LABELS[articleType]}</strong>{" "}
                      文章
                      {typeReason && (
                        <span className="ai-layout-type-reason">
                          {" "}
                          · {typeReason}
                        </span>
                      )}
                    </div>
                  )}
                  {strategy && (
                    <div className="ai-design-strategy">
                      {strategy.split("\n").map((line, i) => (
                        <span key={i} className="ai-design-strategy-line">
                          {line}
                        </span>
                      ))}
                    </div>
                  )}
                  AI 共建议 <strong>{insertions.length}</strong>{" "}
                  个组件。预览后采纳，最后批量应用。
                </div>

                <ul className="ai-layout-list">
                  {insertions.map((ins, idx) => {
                    const status = statuses[idx] || "pending";
                    const label =
                      COMPONENT_LABELS[ins.component] || ins.component;
                    const isPreviewing = previewingIdx === idx;
                    const isOtherPreviewing =
                      previewingIdx !== null && previewingIdx !== idx;
                    return (
                      <li
                        key={idx}
                        className={`ai-layout-item ai-layout-item-${status} ${isPreviewing ? "ai-layout-item-previewing" : ""}`}
                      >
                        <div className="ai-layout-item-header">
                          <span className="ai-layout-item-badge">{label}</span>
                          <span className="ai-layout-item-at">@ {ins.at}</span>
                        </div>
                        <p className="ai-layout-item-reason">{ins.reason}</p>

                        {isPreviewing && (
                          <div className="ai-layout-item-preview-tip">
                            <EyeOff size={12} />
                            正在右侧预览框显示效果
                          </div>
                        )}

                        <div className="ai-layout-item-actions">
                          <button
                            className={`ai-layout-action-btn ai-layout-action-preview ${isPreviewing ? "is-active" : ""}`}
                            onClick={() => handlePreview(idx)}
                            disabled={isOtherPreviewing}
                          >
                            {isPreviewing ? (
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
                            className={`ai-layout-action-btn ai-layout-action-accept ${status === "accepted" ? "is-active" : ""}`}
                            onClick={() => handleAccept(idx)}
                          >
                            <Check size={14} />
                            {status === "accepted" ? "已采纳" : "采纳"}
                          </button>
                          <button
                            className={`ai-layout-action-btn ai-layout-action-skip ${status === "skipped" ? "is-active" : ""}`}
                            onClick={() => handleSkip(idx)}
                          >
                            <X size={14} />
                            {status === "skipped" ? "已跳过" : "跳过"}
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>

                <div className="ai-layout-footer">
                  <span className="ai-layout-footer-count">
                    已采纳 <strong>{acceptedCount}</strong> /{" "}
                    {insertions.length}
                  </span>
                  <div className="ai-layout-footer-buttons">
                    <button
                      className="ai-layout-footer-btn ai-layout-footer-skip"
                      onClick={handleSkipAll}
                    >
                      全部跳过
                    </button>
                    <button
                      className="ai-layout-footer-btn ai-layout-footer-apply"
                      onClick={handleApplyAll}
                      disabled={acceptedCount === 0}
                    >
                      全部采纳（{acceptedCount}）
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* === 模板排版模式内容 === */}
        {mode === "template" && (
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
                  AI 将根据排版复杂度生成完整模板，支持全文预览
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
        )}
      </div>
    </Modal>
  );
}
