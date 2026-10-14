import { useEffect, useState } from "react";
import { ArrowRight, X } from "lucide-react";
import "./FirstRunTour.css";

interface TourStep {
  target: string;
  title: string;
  body: string;
}

/** 只讲每个大功能"是什么、在哪"，不讲细节；细节留给「使用帮助」。 */
const STEPS: TourStep[] = [
  {
    target: "sidebar",
    title: "左栏是你的工作区",
    body: "文章就是一个普通的 .md 文件，存在你自己选的文件夹里。换文件夹、切文章都在这儿。",
  },
  {
    target: "editor",
    title: "在这里写 Markdown",
    body: "直接写，或者把你已有的稿子粘进来。",
  },
  {
    target: "ai",
    title: "让 AI 帮你排版",
    body: "不用自己挑组件——AI 读一遍全文，逐处给出「这里该插什么组件」的建议，你采纳或跳过。需要先在「AI 设置」里填模型。",
  },
  {
    target: "components",
    title: "也可以手动插组件",
    body: "44 个排版组件都在这里：卡片、数据块、时间线、封面、结尾卡……点一下插到光标处。",
  },
  {
    target: "preview",
    title: "右边就是公众号里的样子",
    body: "实时预览，所见即所得。这里长什么样，粘进公众号就是什么样。",
  },
  {
    target: "theme",
    title: "一键换主题",
    body: "18 套内置主题，点这里切换；也能进主题设计器自己调配色、字体和组件样式。",
  },
  {
    target: "imagehost",
    title: "粘贴图片会自动上传",
    body: "默认用官方图床，无需配置；也可以换成你自己的阿里 OSS / 腾讯 COS / 七牛 / S3。",
  },
  {
    target: "copy",
    title: "写完复制到公众号",
    body: "完整版式走「复制 HTML」——配合浏览器插件直接写进公众号后台，样式不丢。没装插件就退一步用「复制富文本」，能直接粘，但复杂版式（弹性布局、旋转装饰、阴影等）可能被微信简化。更多用法看右上角「使用帮助」。",
  },
];

/** 高亮框相对目标元素外扩的像素 */
const HIGHLIGHT_PADDING = 8;
/** 气泡宽度 */
const TOOLTIP_WIDTH = 320;
/** 气泡高度估算值，用于决定放上方还是下方 */
const TOOLTIP_HEIGHT = 200;
/** 气泡与高亮框、视口边缘的间距 */
const TOOLTIP_GAP = 12;

interface SpotlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface Viewport {
  width: number;
  height: number;
}

function measureTarget(target: string): SpotlightRect | null {
  const el = document.querySelector(`[data-tour="${target}"]`);
  if (!(el instanceof HTMLElement)) return null;
  const rect = el.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) return null;
  return {
    top: Math.max(0, rect.top - HIGHLIGHT_PADDING),
    left: Math.max(0, rect.left - HIGHLIGHT_PADDING),
    width: rect.width + HIGHLIGHT_PADDING * 2,
    height: rect.height + HIGHLIGHT_PADDING * 2,
  };
}

/** 气泡优先贴在高亮框下方；下方放不下就翻到上方；
 *  上下都放不下（目标本身很高，比如整块编辑区）就贴到目标框内侧顶部。 */
function resolveTooltipStyle(rect: SpotlightRect | null, viewport: Viewport) {
  if (!rect) {
    return {
      top: Math.max(TOOLTIP_GAP, viewport.height / 2 - TOOLTIP_HEIGHT / 2),
      left: Math.max(TOOLTIP_GAP, viewport.width / 2 - TOOLTIP_WIDTH / 2),
      width: TOOLTIP_WIDTH,
    };
  }

  const spaceBelow = viewport.height - (rect.top + rect.height);
  const spaceAbove = rect.top;
  const room = TOOLTIP_HEIGHT + TOOLTIP_GAP;

  let top: number;
  if (spaceBelow >= room) {
    top = rect.top + rect.height + TOOLTIP_GAP;
  } else if (spaceAbove >= room) {
    top = rect.top - TOOLTIP_HEIGHT - TOOLTIP_GAP;
  } else {
    top = rect.top + TOOLTIP_GAP;
  }

  const centered = rect.left + rect.width / 2 - TOOLTIP_WIDTH / 2;
  const maxLeft = Math.max(
    TOOLTIP_GAP,
    viewport.width - TOOLTIP_WIDTH - TOOLTIP_GAP,
  );

  return {
    top: Math.max(TOOLTIP_GAP, top),
    left: Math.min(Math.max(TOOLTIP_GAP, centered), maxLeft),
    width: TOOLTIP_WIDTH,
  };
}

/**
 * 首次使用引导：不截图，直接在真实界面上高亮目标 + 气泡说明。
 * 好处是跟随主题与深色模式，UI 改动后也不会过期。
 */
export function FirstRunTour({ onClose }: { onClose: () => void }) {
  // 目标元素可能不在（例如侧边栏收起），所以挂载后等一帧再量，只保留能量到的步骤
  const [activeSteps, setActiveSteps] = useState<TourStep[] | null>(null);
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<SpotlightRect | null>(null);
  const [viewport, setViewport] = useState<Viewport>(() => ({
    width: window.innerWidth,
    height: window.innerHeight,
  }));

  // 一个锚点都找不到时不能调 onClose：那会把"已看过"标记写掉，
  // 用户却什么都没看到。这里什么都不做，下次启动再试。
  const step = activeSteps?.[index] ?? null;

  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      setActiveSteps(
        STEPS.filter((item) => measureTarget(item.target) !== null),
      );
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  // 当前步骤变化时重新测量高亮位置
  useEffect(() => {
    if (step) setRect(measureTarget(step.target));
  }, [step]);

  // 窗口尺寸变化或内部滚动都会让高亮框错位，实时跟随
  useEffect(() => {
    const onViewportChange = () => {
      setViewport({ width: window.innerWidth, height: window.innerHeight });
      if (step) setRect(measureTarget(step.target));
    };
    window.addEventListener("resize", onViewportChange);
    window.addEventListener("scroll", onViewportChange, true);
    return () => {
      window.removeEventListener("resize", onViewportChange);
      window.removeEventListener("scroll", onViewportChange, true);
    };
  }, [step]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  if (!step) return null;

  const isLast = activeSteps ? index === activeSteps.length - 1 : false;
  const total = activeSteps?.length ?? 1;

  return (
    <div className="tour-root">
      {rect && (
        <>
          {/* 用四块遮罩围出"洞"，比 clip-path / SVG 稳，也不会裁掉高亮元素的阴影 */}
          <div
            className="tour-dim"
            style={{ top: 0, left: 0, right: 0, height: rect.top }}
          />
          <div
            className="tour-dim"
            style={{
              top: rect.top,
              left: 0,
              width: rect.left,
              height: rect.height,
            }}
          />
          <div
            className="tour-dim"
            style={{
              top: rect.top,
              left: rect.left + rect.width,
              right: 0,
              height: rect.height,
            }}
          />
          <div
            className="tour-dim"
            style={{
              top: rect.top + rect.height,
              left: 0,
              right: 0,
              bottom: 0,
            }}
          />
          <div
            className="tour-ring"
            style={{
              top: rect.top,
              left: rect.left,
              width: rect.width,
              height: rect.height,
            }}
          />
        </>
      )}

      <div
        className="tour-tooltip"
        style={resolveTooltipStyle(rect, viewport)}
        role="dialog"
        aria-label="首次使用引导"
      >
        <button className="tour-close" onClick={onClose} aria-label="关闭引导">
          <X size={16} />
        </button>

        <div className="tour-count">
          第 {index + 1} / {total} 步
        </div>
        <h3 className="tour-title">{step.title}</h3>
        <p className="tour-body">{step.body}</p>

        <div className="tour-actions">
          <button className="tour-btn tour-btn-ghost" onClick={onClose}>
            跳过
          </button>
          <button
            className="tour-btn tour-btn-primary"
            onClick={() => (isLast ? onClose() : setIndex((i) => i + 1))}
          >
            {isLast ? "开始写作" : "下一步"}
            {!isLast && <ArrowRight size={15} />}
          </button>
        </div>
      </div>
    </div>
  );
}
