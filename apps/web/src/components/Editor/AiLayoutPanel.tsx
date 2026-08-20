/**
 * AI 排版 —— 简化版
 *
 * 流程：勾选组件 → AI 在勾选范围内生成插入建议 → 整体预览 → 一键应用。
 * 不再逐条预览/采纳/跳过，AI 只在用户允许的组件里选型并生成，交互降到最低。
 */
import { useState, useEffect } from "react";
import { Check, Eye, EyeOff, Loader2, RefreshCw, Sparkles } from "lucide-react";
import type { Insertion } from "../../services/ai/analysisAgent";
import {
  AVAILABLE_COMPONENTS,
  CONTENT_DRIVEN_COMPONENTS,
  POSITION_DRIVEN_COMPONENTS,
} from "../../services/ai/analysisAgent";
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
  /** 生成排版：传入用户勾选的组件范围 */
  onGenerate: (selectedComponents: string[]) => void;
  /** 整体预览：应用全部建议到编辑器 */
  onPreviewAll: () => void;
  /** 撤销预览：恢复原文 */
  onUndoPreview: () => void;
  /** 一键应用全部建议 */
  onApplyAll: () => void;
  /** 当前是否正在预览 */
  isPreviewing: boolean;
  /** 识别出的文章类型（如 tutorial/story/data/opinion） */
  articleType?: string;
  /** 类型识别理由 */
  typeReason?: string;
}

/** 组件中文名映射 */
export const COMPONENT_LABELS: Record<string, string> = {
  "quote-card": "金句卡片",
  "divider-fancy": "装饰分隔",
  "cta-card": "行动号召",
  "code-frame": "代码框",
  "callout-pro": "提示框",
  callout: "提示框",
  steps: "分步引导",
  accordion: "折叠面板",
  "resource-list": "资料清单",
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
  "magazine-cover": "杂志封面",
  "section-divider": "章节分隔",
  "image-card": "图片卡片",
  "text-card": "正文卡片",
  "full-quote": "整行引用",
  "two-column-cards": "两栏卡片",
  "end-card": "结尾致谢",
};

/** 文章类型中文名映射 */
export const ARTICLE_TYPE_LABELS: Record<string, string> = {
  tutorial: "教程类",
  story: "故事类",
  data: "数据报告类",
  opinion: "观点评论类",
  list: "清单合集类",
  news: "资讯通知类",
  product: "产品营销类",
};

/** 勾选清单分组：基于内容（需提炼）/ 找位置直接加（内容固定） */
const COMPONENT_GROUPS = [
  {
    key: "content",
    label: "基于内容 · 需提炼原文",
    hint: "AI 从原文提炼内容，不得编造",
    ids: [...CONTENT_DRIVEN_COMPONENTS],
  },
  {
    key: "position",
    label: "找位置直接加 · 内容固定",
    hint: "装饰/标题/标签，重点是放对位置",
    ids: [...POSITION_DRIVEN_COMPONENTS],
  },
];

export function AiLayoutPanel({
  open,
  loading,
  insertions,
  onClose,
  onGenerate,
  onPreviewAll,
  onUndoPreview,
  onApplyAll,
  isPreviewing,
  articleType,
  typeReason,
}: AiLayoutPanelProps) {
  // 勾选的组件范围（默认全选）
  const [selected, setSelected] = useState<string[]>([]);
  // 是否已发起生成（区分"未生成"与"生成为空"）
  const [generated, setGenerated] = useState(false);

  useEffect(() => {
    if (open) {
      setSelected([...AVAILABLE_COMPONENTS]);
      setGenerated(false);
    }
  }, [open]);

  const toggleComponent = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    );
  };

  const handleGenerate = () => {
    if (selected.length === 0 || loading) return;
    setGenerated(true);
    onGenerate(selected);
  };

  const handleClose = () => {
    if (isPreviewing) onUndoPreview();
    onClose();
  };

  // 选择组件视图
  const renderSelectView = () => (
    <>
      <div className="ai-layout-select">
        <p className="ai-layout-select-hint">
          勾选希望 AI 使用的组件，AI 将只在勾选范围内挑选合适的组件。
        </p>
        {COMPONENT_GROUPS.map((group) => (
          <div key={group.key} className="ai-layout-select-group">
            <div className="ai-layout-select-group-head">
              <span className="ai-layout-select-group-label">
                {group.label}
              </span>
              <span className="ai-layout-select-group-hint">{group.hint}</span>
            </div>
            <div className="ai-layout-select-grid">
              {group.ids.map((id) => {
                const label = COMPONENT_LABELS[id] || id;
                const checked = selected.includes(id);
                return (
                  <button
                    key={id}
                    type="button"
                    className={`ai-layout-select-chip ${checked ? "is-checked" : ""}`}
                    onClick={() => toggleComponent(id)}
                  >
                    {checked && <Check size={12} />}
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <div className="ai-layout-footer">
        <span className="ai-layout-footer-count">
          已勾选 <strong>{selected.length}</strong> / {AVAILABLE_COMPONENTS.length}
        </span>
        <button
          className="ai-layout-footer-btn ai-layout-footer-apply"
          onClick={handleGenerate}
          disabled={selected.length === 0 || loading}
        >
          <Sparkles size={14} />
          生成排版
        </button>
      </div>
    </>
  );

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="AI 排版"
      className="ai-layout-panel"
    >
      {loading ? (
        <div className="ai-layout-loading">
          <Loader2 size={32} className="spinning" />
          <p>AI 正在分析文章并挑选组件...</p>
          <p className="ai-layout-loading-hint">通常需要 3-15 秒</p>
        </div>
      ) : !generated ? (
        renderSelectView()
      ) : insertions.length === 0 ? (
        <div className="ai-layout-empty">
          <Sparkles size={32} />
          <p>AI 没有发现适合插入组件的位置</p>
          {(articleType || typeReason) && (
            <p className="ai-layout-empty-reason">
              {articleType && ARTICLE_TYPE_LABELS[articleType] && (
                <>
                  识别为 <strong>{ARTICLE_TYPE_LABELS[articleType]}</strong> 文章
                </>
              )}
              {typeReason ? ` · ${typeReason}` : ""}
            </p>
          )}
          <p className="ai-layout-empty-hint">
            可尝试勾选更多组件，或调整文章内容后重新生成。
          </p>
          <div className="ai-layout-empty-actions">
            <button
              className="ai-layout-refresh-btn"
              onClick={() => setGenerated(false)}
            >
              返回选择组件
            </button>
            <button
              className="ai-layout-refresh-btn"
              onClick={handleGenerate}
              disabled={loading}
            >
              重新生成
            </button>
          </div>
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
            AI 在勾选范围内挑选了 <strong>{insertions.length}</strong>{" "}
            个组件。点击「预览效果」在右侧预览框查看，满意后「应用到文章」。
          </div>

          <ul className="ai-layout-list">
            {insertions.map((ins, idx) => (
              <li key={idx} className="ai-layout-item">
                <div className="ai-layout-item-header">
                  <span className="ai-layout-item-badge">
                    {COMPONENT_LABELS[ins.component] || ins.component}
                  </span>
                  <span className="ai-layout-item-at">@ {ins.at}</span>
                </div>
                <p className="ai-layout-item-reason">{ins.reason}</p>
              </li>
            ))}
          </ul>

          <div className="ai-layout-footer">
            <div className="ai-layout-footer-buttons">
              <button
                className="ai-layout-footer-btn ai-layout-footer-regenerate"
                onClick={handleGenerate}
                disabled={loading}
              >
                <RefreshCw size={14} />
                重新生成
              </button>
              <button
                className="ai-layout-footer-btn ai-layout-footer-back"
                onClick={() => setGenerated(false)}
              >
                返回选择
              </button>
            </div>
            <div className="ai-layout-footer-buttons">
              <button
                className={`ai-layout-footer-btn ${isPreviewing ? "ai-layout-footer-preview-active" : "ai-layout-footer-preview"}`}
                onClick={() =>
                  isPreviewing ? onUndoPreview() : onPreviewAll()
                }
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
                onClick={onApplyAll}
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
