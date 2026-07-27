/**
 * AI 杂志级排版 —— Template 模式面板
 *
 * AI 一键生成完整 Template JSON，全文预览，一键应用。
 * 与"组件插入模式"互补：
 *   - 组件插入：逐条微调，适合局部增强
 *   - Template 模式：整体重排，适合杂志级效果
 */
import { useState } from "react";
import {
  Sparkles,
  Loader2,
  RefreshCw,
  Check,
  X,
  Eye,
  EyeOff,
  Layers,
  Palette,
} from "lucide-react";
import { Modal } from "../common/Modal";
import type { TemplateGenerationResult } from "../../services/template";
import { ARTICLE_TYPE_LABELS, COMPONENT_LABELS } from "./AiLayoutPanel";
import "./AiLayoutPanel.css";

interface TemplateLayoutPanelProps {
  /** 是否打开 */
  open: boolean;
  /** 是否正在加载 */
  loading: boolean;
  /** 生成结果 */
  result: TemplateGenerationResult | null;
  /** 关闭面板 */
  onClose: () => void;
  /** 应用到编辑器 */
  onApply: (result: TemplateGenerationResult) => void;
  /** 预览全文：替换编辑器内容为渲染结果 */
  onPreview: (result: TemplateGenerationResult) => void;
  /** 撤销预览：恢复原文 */
  onUndoPreview: () => void;
  /** 重新生成 */
  onRegenerate: () => void;
  /** 当前是否正在预览 */
  isPreviewing: boolean;
}

export function TemplateLayoutPanel({
  open,
  loading,
  result,
  onClose,
  onApply,
  onPreview,
  onUndoPreview,
  onRegenerate,
  isPreviewing,
}: TemplateLayoutPanelProps) {
  const [showComponents, setShowComponents] = useState(true);

  const handleClose = () => {
    if (isPreviewing) {
      onUndoPreview();
    }
    onClose();
  };

  const handleApply = () => {
    if (!result) return;
    if (isPreviewing) {
      onUndoPreview();
    }
    onApply(result);
  };

  const handlePreviewToggle = () => {
    if (!result) return;
    if (isPreviewing) {
      onUndoPreview();
    } else {
      onPreview(result);
    }
  };

  const componentCounts =
    result?.template.layout.reduce(
      (acc, node) => {
        acc[node.component] = (acc[node.component] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    ) || {};

  const totalComponents = result?.template.layout.length || 0;
  const articleSections =
    result?.template.layout.filter((n) => n.component === "article-section")
      .length || 0;
  const decorComponents = totalComponents - articleSections;

  const magazineLevelLabels: Record<string, { label: string; desc: string }> = {
    high: { label: "全卡片化", desc: "杂志级排版，正文全部卡片化" },
    medium: { label: "适度点缀", desc: "平衡阅读与视觉效果" },
    low: { label: "简洁为主", desc: "信息高效，最少装饰" },
  };

  const magazineLevelInfo = result?.magazineLevel
    ? magazineLevelLabels[result.magazineLevel] || null
    : null;

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="AI 杂志级排版"
      className="ai-layout-panel template-layout-panel"
    >
      {loading ? (
        <div className="ai-layout-loading">
          <Loader2 size={32} className="spinning" />
          <p>AI 正在设计排版方案...</p>
          <p className="ai-layout-loading-hint">
            分析文章结构 + 设计组件布局，约需 5-15 秒
          </p>
        </div>
      ) : !result ? (
        <div className="ai-layout-empty">
          <Sparkles size={32} />
          <p>点击「重新生成」开始设计</p>
          <p className="ai-layout-empty-hint">AI 将为你的文章定制杂志级排版</p>
          <button className="ai-layout-refresh-btn" onClick={onRegenerate}>
            <Sparkles size={14} />
            生成排版方案
          </button>
        </div>
      ) : (
        <>
          <div className="ai-layout-summary">
            {result.articleType && ARTICLE_TYPE_LABELS[result.articleType] && (
              <div className="ai-layout-type-badge">
                识别为{" "}
                <strong>{ARTICLE_TYPE_LABELS[result.articleType]}</strong> 文章
                {result.typeReason && (
                  <span className="ai-layout-type-reason">
                    {" "}
                    · {result.typeReason}
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
                {result.magazineReason && (
                  <span className="ai-layout-type-reason">
                    {" "}
                    · {result.magazineReason}
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
                    {(result.rendered.coverage * 100).toFixed(0)}%
                  </strong>
                </span>
              </div>
            </div>
          </div>

          {result.warnings.length > 0 && (
            <div className="template-warnings">
              {result.warnings.slice(0, 3).map((w, i) => (
                <div key={i} className="template-warning-item">
                  <span>⚠️ {w}</span>
                </div>
              ))}
            </div>
          )}

          <div className="template-components-section">
            <button
              className="template-components-toggle"
              onClick={() => setShowComponents(!showComponents)}
            >
              <Layers size={14} />
              {showComponents ? "收起" : "展开"}组件清单
              <span className="template-components-count">
                {decorComponents} 个
              </span>
            </button>

            {showComponents && (
              <div className="template-components-grid">
                {Object.entries(componentCounts)
                  .filter(([name]) => name !== "article-section")
                  .map(([name, count]) => (
                    <div key={name} className="template-component-chip">
                      <span className="template-component-name">
                        {COMPONENT_LABELS[name] || name}
                      </span>
                      <span className="template-component-count">×{count}</span>
                    </div>
                  ))}
                {decorComponents === 0 && (
                  <div className="template-components-empty">暂无装饰组件</div>
                )}
              </div>
            )}
          </div>

          <div className="template-preview-hint">
            <Eye size={14} />
            {isPreviewing
              ? "正在右侧预览框显示完整排版效果"
              : "点击下方按钮预览完整效果"}
          </div>

          <div className="ai-layout-footer">
            <button
              className="ai-layout-footer-btn ai-layout-footer-regenerate"
              onClick={onRegenerate}
              disabled={loading}
            >
              <RefreshCw size={14} className={loading ? "spinning" : ""} />
              重新生成
            </button>
            <div className="ai-layout-footer-buttons">
              <button
                className={`ai-layout-footer-btn ${isPreviewing ? "ai-layout-footer-preview-active" : "ai-layout-footer-preview"}`}
                onClick={handlePreviewToggle}
                disabled={!result}
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
                className="ai-layout-footer-btn ai-layout-footer-apply"
                onClick={handleApply}
                disabled={!result}
              >
                <Check size={14} />
                应用到文章
              </button>
            </div>
          </div>
        </>
      )}
    </Modal>
  );
}
