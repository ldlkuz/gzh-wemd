import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

const STORAGE_KEY = "wemd-editor-pane-ratio";
const DEFAULT_RATIO = 0.58;
const DIVIDER_WIDTH = 24;
const MIN_EDITOR_WIDTH = 340;
const MIN_PREVIEW_WIDTH = 402;

const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);

const getRatioBounds = (containerWidth: number) => {
  const availableWidth = Math.max(1, containerWidth - DIVIDER_WIDTH);
  if (availableWidth < MIN_EDITOR_WIDTH + MIN_PREVIEW_WIDTH) {
    return { min: 0.35, max: 0.65, availableWidth };
  }
  return {
    min: MIN_EDITOR_WIDTH / availableWidth,
    max: (availableWidth - MIN_PREVIEW_WIDTH) / availableWidth,
    availableWidth,
  };
};

const loadRatio = (): number => {
  try {
    const saved = Number(window.localStorage.getItem(STORAGE_KEY));
    return Number.isFinite(saved) && saved > 0 && saved < 1
      ? saved
      : DEFAULT_RATIO;
  } catch {
    return DEFAULT_RATIO;
  }
};

export function useSplitPane() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [preferredRatio, setPreferredRatio] = useState(loadRatio);
  const [containerWidth, setContainerWidth] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const updateWidth = () => setContainerWidth(container.clientWidth);
    updateWidth();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", updateWidth);
      return () => window.removeEventListener("resize", updateWidth);
    }

    const observer = new ResizeObserver(updateWidth);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, String(preferredRatio));
    } catch {
      /* 忽略持久化错误 */
    }
  }, [preferredRatio]);

  const bounds = useMemo(
    () => getRatioBounds(containerWidth || 1200),
    [containerWidth],
  );
  const ratio = clamp(preferredRatio, bounds.min, bounds.max);
  const editorWidth = ratio * bounds.availableWidth;

  const setRatio = useCallback(
    (nextRatio: number) => {
      setPreferredRatio(clamp(nextRatio, bounds.min, bounds.max));
    },
    [bounds.max, bounds.min],
  );

  const setRatioFromClientX = useCallback(
    (clientX: number) => {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      setRatio((clientX - rect.left) / bounds.availableWidth);
    },
    [bounds.availableWidth, setRatio],
  );

  const resetRatio = useCallback(() => setPreferredRatio(DEFAULT_RATIO), []);

  return {
    containerRef,
    ratio,
    minRatio: bounds.min,
    maxRatio: bounds.max,
    editorWidth,
    isDragging,
    setDragging: setIsDragging,
    setRatio,
    setRatioFromClientX,
    resetRatio,
  };
}
