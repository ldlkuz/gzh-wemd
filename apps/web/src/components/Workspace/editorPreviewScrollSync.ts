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

const browserFrameScheduler: FrameScheduler = {
  request: (callback) => window.requestAnimationFrame(callback),
  cancel: (handle) => window.cancelAnimationFrame(handle),
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

export const createEditorPreviewScrollSync = (
  frames: FrameScheduler = browserFrameScheduler,
) => {
  const adapters: Partial<Record<ScrollSyncSource, ScrollSyncAdapter>> = {};
  const cleanups: Partial<Record<ScrollSyncSource, () => void>> = {};
  const mutedSources = new Set<ScrollSyncSource>();
  let pendingSyncFrame: number | null = null;
  let pendingRestoreFrame: number | null = null;
  let pendingSource: ScrollSyncSource | null = null;
  let lastPosition: ScrollSyncPosition | null = null;
  let lastSource: ScrollSyncSource | null = null;

  const opposite = (source: ScrollSyncSource): ScrollSyncSource =>
    source === "editor" ? "preview" : "editor";

  const muteDuringProgrammaticScroll = (source: ScrollSyncSource) => {
    mutedSources.add(source);
    frames.request(() => mutedSources.delete(source));
  };

  const syncFrom = (source: ScrollSyncSource) => {
    const sourceAdapter = adapters[source];
    const targetSource = opposite(source);
    const targetAdapter = adapters[targetSource];
    if (!sourceAdapter || !targetAdapter) return;

    const position = sourceAdapter.getPosition();
    lastPosition = position;
    lastSource = source;
    muteDuringProgrammaticScroll(targetSource);
    targetAdapter.scrollToPosition(position);
  };

  const scheduleSync = (source: ScrollSyncSource) => {
    pendingSource = source;
    if (pendingRestoreFrame !== null) {
      frames.cancel(pendingRestoreFrame);
      pendingRestoreFrame = null;
    }
    if (pendingSyncFrame !== null) return;

    pendingSyncFrame = frames.request(() => {
      pendingSyncFrame = null;
      const sourceToSync = pendingSource;
      pendingSource = null;
      if (sourceToSync) syncFrom(sourceToSync);
    });
  };

  const restoreAfterLayoutChange = () => {
    const position =
      lastSource === "editor"
        ? (adapters.editor?.getPosition() ?? lastPosition)
        : lastPosition;
    if (!position || pendingSyncFrame !== null || pendingRestoreFrame !== null)
      return;
    pendingRestoreFrame = frames.request(() => {
      pendingRestoreFrame = null;
      (["editor", "preview"] as const).forEach((source) => {
        const adapter = adapters[source];
        if (!adapter) return;
        muteDuringProgrammaticScroll(source);
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
      if (mutedSources.has(source)) return;
      scheduleSync(source);
    });
    const unsubscribeUserIntent = adapter.subscribeUserIntent?.(() => {
      mutedSources.delete(source);
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
    if (pendingSyncFrame !== null) frames.cancel(pendingSyncFrame);
    if (pendingRestoreFrame !== null) frames.cancel(pendingRestoreFrame);
    pendingSyncFrame = null;
    pendingRestoreFrame = null;
    pendingSource = null;
  };

  return { setAdapter, destroy };
};
