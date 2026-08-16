export type ScrollSyncSource = "editor" | "preview";

export interface ScrollSyncPosition {
  sourceLine: number | null;
  ratio: number;
}

export interface ScrollSyncAdapter {
  getPosition: () => ScrollSyncPosition;
  scrollToPosition: (position: ScrollSyncPosition) => void;
  subscribeScroll: (listener: () => void) => () => void;
  subscribeUserIntent?: (listener: () => void) => () => void;
  subscribeLayoutChange?: (listener: () => void) => () => void;
}

interface FrameScheduler {
  request: (callback: FrameRequestCallback) => number;
  cancel: (handle: number) => void;
}

interface TimerScheduler {
  setTimeout: (callback: () => void, ms: number) => number;
  clearTimeout: (handle: number) => void;
}

const browserFrameScheduler: FrameScheduler = {
  request: (callback) => window.requestAnimationFrame(callback),
  cancel: (handle) => window.cancelAnimationFrame(handle),
};

const browserTimerScheduler: TimerScheduler = {
  setTimeout: (callback, ms) => window.setTimeout(callback, ms),
  clearTimeout: (handle) => window.clearTimeout(handle),
};

const SCROLL_INTENT_EVENTS = [
  "wheel",
  "pointerdown",
  "touchstart",
  "keydown",
] as const;

export const subscribeScrollIntent = (
  element: HTMLElement,
  listener: () => void,
): (() => void) => {
  SCROLL_INTENT_EVENTS.forEach((eventName) =>
    element.addEventListener(eventName, listener),
  );
  return () => {
    SCROLL_INTENT_EVENTS.forEach((eventName) =>
      element.removeEventListener(eventName, listener),
    );
  };
};

// 滚动停止后延迟该时长，才做一次精确校准（弱同步 + 停止校准）
const SETTLE_DELAY_MS = 150;
// 程序化平滑滚动期间静默另一侧，避免平滑滚动产生的 scroll 事件反向触发同步
const PROGRAMMATIC_MUTE_MS = 350;

export const createEditorPreviewScrollSync = (
  frames: FrameScheduler = browserFrameScheduler,
  timers: TimerScheduler = browserTimerScheduler,
) => {
  const adapters: Partial<Record<ScrollSyncSource, ScrollSyncAdapter>> = {};
  const cleanups: Partial<Record<ScrollSyncSource, () => void>> = {};
  // 程序化滚动静默截止时间戳（毫秒）
  const mutedUntil = new Map<ScrollSyncSource, number>();
  let settleTimer: number | null = null;
  let pendingRestoreFrame: number | null = null;
  let pendingSource: ScrollSyncSource | null = null;
  let lastPosition: ScrollSyncPosition | null = null;
  let lastSource: ScrollSyncSource | null = null;

  const now = () => Date.now();

  const opposite = (source: ScrollSyncSource): ScrollSyncSource =>
    source === "editor" ? "preview" : "editor";

  /** source 当前是否处于程序化滚动静默期 */
  const isMuted = (source: ScrollSyncSource): boolean => {
    const until = mutedUntil.get(source);
    if (until === undefined) return false;
    if (now() < until) return true;
    mutedUntil.delete(source);
    return false;
  };

  /** 静默 source 一段时间（覆盖平滑滚动动画） */
  const muteFor = (source: ScrollSyncSource, durationMs: number) => {
    mutedUntil.set(source, now() + durationMs);
  };

  const syncFrom = (source: ScrollSyncSource) => {
    const sourceAdapter = adapters[source];
    const targetSource = opposite(source);
    const targetAdapter = adapters[targetSource];
    if (!sourceAdapter || !targetAdapter) return;

    const position = sourceAdapter.getPosition();
    lastPosition = position;
    lastSource = source;
    // 程序化滚动目标侧：静默窗口内忽略目标自身的 scroll 事件，避免反馈循环
    muteFor(targetSource, PROGRAMMATIC_MUTE_MS);
    targetAdapter.scrollToPosition(position);
  };

  const scheduleSync = (source: ScrollSyncSource) => {
    pendingSource = source;
    if (pendingRestoreFrame !== null) {
      frames.cancel(pendingRestoreFrame);
      pendingRestoreFrame = null;
    }
    // 滚动仍在进行则重置计时器；停止 SETTLE_DELAY_MS 后才做一次精确同步
    if (settleTimer !== null) timers.clearTimeout(settleTimer);
    settleTimer = timers.setTimeout(() => {
      settleTimer = null;
      const sourceToSync = pendingSource;
      pendingSource = null;
      if (sourceToSync) syncFrom(sourceToSync);
    }, SETTLE_DELAY_MS);
  };

  const restoreAfterLayoutChange = () => {
    const position =
      lastSource === "editor"
        ? (adapters.editor?.getPosition() ?? lastPosition)
        : lastPosition;
    if (!position || settleTimer !== null || pendingRestoreFrame !== null)
      return;
    pendingRestoreFrame = frames.request(() => {
      pendingRestoreFrame = null;
      (["editor", "preview"] as const).forEach((source) => {
        const adapter = adapters[source];
        if (!adapter) return;
        muteFor(source, PROGRAMMATIC_MUTE_MS);
        adapter.scrollToPosition(position);
      });
    });
  };

  const setAdapter = (
    source: ScrollSyncSource,
    adapter: ScrollSyncAdapter | null,
  ) => {
    cleanups[source]?.();
    delete cleanups[source];
    delete adapters[source];
    if (!adapter) return;

    adapters[source] = adapter;
    const unsubscribeScroll = adapter.subscribeScroll(() => {
      if (isMuted(source)) return;
      scheduleSync(source);
    });
    const unsubscribeUserIntent = adapter.subscribeUserIntent?.(() => {
      // 用户主动接管滚动：解除程序化静默
      mutedUntil.delete(source);
    });
    const unsubscribeLayout = adapter.subscribeLayoutChange?.(
      restoreAfterLayoutChange,
    );
    cleanups[source] = () => {
      unsubscribeScroll();
      unsubscribeUserIntent?.();
      unsubscribeLayout?.();
    };
    if (source === "preview") restoreAfterLayoutChange();
  };

  const destroy = () => {
    cleanups.editor?.();
    cleanups.preview?.();
    if (settleTimer !== null) timers.clearTimeout(settleTimer);
    if (pendingRestoreFrame !== null) frames.cancel(pendingRestoreFrame);
    settleTimer = null;
    pendingRestoreFrame = null;
    pendingSource = null;
  };

  return { setAdapter, destroy };
};
