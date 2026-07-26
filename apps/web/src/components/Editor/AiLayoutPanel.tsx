/**
 * AI 设计版式 —— 方案面板
 *
 * 显示 AI 返回的插入建议，用户可：
 * - 点"预览效果"→ 插入编辑器，右侧预览框显示真实效果
 * - 点"撤销预览"→ 恢复原文
 * - 点"采纳"→ 标记保留（不立即插入）
 * - 点"跳过"→ 标记丢弃
 * - 最后点"全部采纳"→ 批量应用所有标记的建议
 */
import { useState, useEffect } from "react";
import { Check, X, Eye, EyeOff, Sparkles, Loader2 } from "lucide-react";
import type { Insertion } from "../../services/ai/analysisAgent";
import { Modal } from "../common/Modal";
import "./AiLayoutPanel.css";

interface AiLayoutPanelProps {
  /** 是否打开 */
  open: boolean;
  /** 是否正在加载 */
  loading: boolean;
  /** AI 返回的建议 */
  insertions: Insertion[];
  /** 关闭面板 */
  onClose: () => void;
  /** 采纳指定建议（已筛选后的子集）—— 用于"全部采纳"批量应用 */
  onApply: (insertions: Insertion[]) => void;
  /** 预览单条建议：插入编辑器，右侧预览框显示 */
  onPreview: (insertion: Insertion) => void;
  /** 撤销预览：恢复原文 */
  onUndoPreview: () => void;
  /** 重新分析 */
  onRefresh?: () => void;
  /** 识别出的文章类型（如 tutorial/story/data/opinion） */
  articleType?: string;
  /** 类型识别理由 */
  typeReason?: string;
}

/** 组件中文名映射 */
const COMPONENT_LABELS: Record<string, string> = {
  "quote-card": "金句卡片",
  "divider-fancy": "装饰分隔",
  "cta-card": "行动号召",
  "code-frame": "代码框",
  "callout-pro": "提示框",
  "stats-block": "数据统计",
  "image-grid": "图片网格",
  "author-card": "作者卡片",
  timeline: "时间线",
  "follow-bar": "关注引导",
  "qr-card": "二维码卡片",
  "numbered-heading": "序号章节",
  "section-title": "章节小标题",
  "image-text-row": "图文混排",
  "hero-banner": "顶部头图",
  "share-card": "分享引导",
  "related-posts": "推荐阅读",
  "toc-nav": "目录导航",
  "tag-label": "关键词标签",
  "image-caption": "图片图注",
  "copyright-notice": "转载声明",
  "styled-table": "美化表格",
  faq: "常见问题",
};

/** 文章类型中文名映射 */
const ARTICLE_TYPE_LABELS: Record<string, string> = {
  tutorial: "教程类",
  story: "故事类",
  data: "数据报告类",
  opinion: "观点评论类",
  list: "清单合集类",
  news: "资讯通知类",
  product: "产品营销类",
};

type ItemStatus = "pending" | "accepted" | "skipped";

export function AiLayoutPanel({
  open,
  loading,
  insertions,
  onClose,
  onApply,
  onPreview,
  onUndoPreview,
  onRefresh,
  articleType,
  typeReason,
}: AiLayoutPanelProps) {
  // 每条建议的状态
  const [statuses, setStatuses] = useState<ItemStatus[]>([]);
  // 当前正在预览的索引（null 表示未预览）
  const [previewingIdx, setPreviewingIdx] = useState<number | null>(null);

  // insertions 变化时重置状态
  useEffect(() => {
    setStatuses(insertions.map(() => "pending"));
    setPreviewingIdx(null);
  }, [insertions]);

  // 关闭面板前清理预览
  const handleClose = () => {
    if (previewingIdx !== null) {
      onUndoPreview();
      setPreviewingIdx(null);
    }
    onClose();
  };

  /** 点击预览：相同条目则关闭，不同条目则直接切换（onPreview 内部自动撤销旧预览） */
  const handlePreview = (idx: number) => {
    if (previewingIdx === idx) {
      // 当前正在预览这一条，再点则撤销
      onUndoPreview();
      setPreviewingIdx(null);
      return;
    }
    // 切换到新条目预览（handlePreviewInsertion 会自动基于真原文插入，无需先撤销）
    onPreview(insertions[idx]);
    setPreviewingIdx(idx);
  };

  /** 标记采纳：先撤销预览 */
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

  /** 标记跳过：先撤销预览 */
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
    onApply(accepted);
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

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="AI 设计版式建议"
      className="ai-layout-panel"
    >
      {loading ? (
        <div className="ai-layout-loading">
          <Loader2 size={32} className="spinning" />
          <p>AI 正在分析文章...</p>
          <p className="ai-layout-loading-hint">通常需要 3-15 秒</p>
        </div>
      ) : insertions.length === 0 ? (
        <div className="ai-layout-empty">
          <Sparkles size={32} />
          <p>AI 没有发现适合插入组件的位置</p>
          <p className="ai-layout-empty-hint">
            可能文章太短，或当前内容不需要组件增强。
          </p>
          {onRefresh && (
            <button className="ai-layout-refresh-btn" onClick={onRefresh}>
              重新分析
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="ai-layout-summary">
            {articleType && ARTICLE_TYPE_LABELS[articleType] && (
              <div className="ai-layout-type-badge">
                识别为 <strong>{ARTICLE_TYPE_LABELS[articleType]}</strong> 文章
                {typeReason && (
                  <span className="ai-layout-type-reason"> · {typeReason}</span>
                )}
              </div>
            )}
            AI 共建议 <strong>{insertions.length}</strong>{" "}
            个组件。点「预览效果」在右侧预览框查看真实渲染，满意后点「采纳」标记。
          </div>

          <ul className="ai-layout-list">
            {insertions.map((ins, idx) => {
              const status = statuses[idx] || "pending";
              const label = COMPONENT_LABELS[ins.component] || ins.component;
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
                      {status === "accepted" ? "已标记采纳" : "采纳"}
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
              已标记采纳 <strong>{acceptedCount}</strong> / {insertions.length}
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
    </Modal>
  );
}
