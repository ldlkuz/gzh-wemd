import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createEditorPreviewScrollSync,
  type ScrollSyncAdapter,
  type ScrollSyncPosition,
} from "../../components/Workspace/editorPreviewScrollSync";

const createFrameQueue = () => {
  let nextHandle = 1;
  const queue = new Map<number, FrameRequestCallback>();
  return {
    request: (callback: FrameRequestCallback) => {
      const handle = nextHandle++;
      queue.set(handle, callback);
      return handle;
    },
    cancel: vi.fn((handle: number) => queue.delete(handle)),
    flush: () => {
      const callbacks = Array.from(queue.values());
      queue.clear();
      callbacks.forEach((callback) => callback(0));
    },
  };
};

const createAdapter = (initialPosition: ScrollSyncPosition) => {
  let position = initialPosition;
  let scrollListener = () => undefined;
  let layoutListener = () => undefined;
  let userIntentListener = () => undefined;
  const adapter: ScrollSyncAdapter = {
    getPosition: vi.fn(() => position),
    scrollToPosition: vi.fn(),
    subscribeScroll: vi.fn((listener) => {
      scrollListener = listener;
      return () => undefined;
    }),
    subscribeLayoutChange: vi.fn((listener) => {
      layoutListener = listener;
      return () => undefined;
    }),
    subscribeUserIntent: vi.fn((listener) => {
      userIntentListener = listener;
      return () => undefined;
    }),
  };
  return {
    adapter,
    emitScroll: () => scrollListener(),
    emitLayoutChange: () => layoutListener(),
    emitUserIntent: () => userIntentListener(),
    setPosition: (nextPosition: ScrollSyncPosition) => {
      position = nextPosition;
    },
  };
};

const SETTLE_DELAY_MS = 150;

describe("编辑器与预览双向滚动协调（弱同步 + 停止校准）", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("滚动过程中不立即同步，停止 150ms 后才把主动侧源行送到另一侧", () => {
    const frames = createFrameQueue();
    const editor = createAdapter({ sourceLine: 12, ratio: 0.4 });
    const preview = createAdapter({ sourceLine: 2, ratio: 0.1 });
    const coordinator = createEditorPreviewScrollSync(frames);
    coordinator.setAdapter("editor", editor.adapter);
    coordinator.setAdapter("preview", preview.adapter);

    editor.emitScroll();
    // 仍在滚动，尚未到达停止校准时机
    expect(preview.adapter.scrollToPosition).not.toHaveBeenCalled();

    vi.advanceTimersByTime(SETTLE_DELAY_MS);

    expect(preview.adapter.scrollToPosition).toHaveBeenCalledWith({
      sourceLine: 12,
      ratio: 0.4,
    });
    coordinator.destroy();
  });

  it("滚动持续时重置计时器，只有真正停止后才同步一次", () => {
    const frames = createFrameQueue();
    const editor = createAdapter({ sourceLine: 12, ratio: 0.4 });
    const preview = createAdapter({ sourceLine: 2, ratio: 0.1 });
    const coordinator = createEditorPreviewScrollSync(frames);
    coordinator.setAdapter("editor", editor.adapter);
    coordinator.setAdapter("preview", preview.adapter);

    editor.emitScroll();
    vi.advanceTimersByTime(100);
    editor.emitScroll(); // 继续滚动，重置计时
    vi.advanceTimersByTime(100);
    expect(preview.adapter.scrollToPosition).not.toHaveBeenCalled();

    vi.advanceTimersByTime(SETTLE_DELAY_MS);
    expect(preview.adapter.scrollToPosition).toHaveBeenCalledTimes(1);
    coordinator.destroy();
  });

  it("忽略程序化滚动产生的反向事件，并在布局变化后读取编辑器当前位置", () => {
    const frames = createFrameQueue();
    const editor = createAdapter({ sourceLine: 18, ratio: 0.6 });
    const preview = createAdapter({ sourceLine: 4, ratio: 0.2 });
    const coordinator = createEditorPreviewScrollSync(frames);
    coordinator.setAdapter("editor", editor.adapter);
    coordinator.setAdapter("preview", preview.adapter);

    editor.emitScroll();
    vi.advanceTimersByTime(SETTLE_DELAY_MS);
    // 程序化滚动使 preview 进入静默期，其反向 scroll 事件应被忽略
    preview.emitScroll();
    vi.advanceTimersByTime(SETTLE_DELAY_MS);
    expect(editor.adapter.scrollToPosition).not.toHaveBeenCalled();

    editor.setPosition({ sourceLine: 22, ratio: 0.7 });
    preview.emitLayoutChange();
    frames.flush();
    expect(preview.adapter.scrollToPosition).toHaveBeenLastCalledWith({
      sourceLine: 22,
      ratio: 0.7,
    });
    coordinator.destroy();
  });

  it("目标侧出现真实用户意图时立即接管同步来源", () => {
    const frames = createFrameQueue();
    const editor = createAdapter({ sourceLine: 18, ratio: 0.6 });
    const preview = createAdapter({ sourceLine: 4, ratio: 0.2 });
    const coordinator = createEditorPreviewScrollSync(frames);
    coordinator.setAdapter("editor", editor.adapter);
    coordinator.setAdapter("preview", preview.adapter);

    editor.emitScroll();
    vi.advanceTimersByTime(SETTLE_DELAY_MS);
    preview.emitUserIntent();
    preview.emitScroll();
    vi.advanceTimersByTime(SETTLE_DELAY_MS);

    expect(editor.adapter.scrollToPosition).toHaveBeenLastCalledWith({
      sourceLine: 4,
      ratio: 0.2,
    });
    coordinator.destroy();
  });

  it("用户滚动会抢占尚未执行的布局恢复", () => {
    const frames = createFrameQueue();
    const editor = createAdapter({ sourceLine: 18, ratio: 0.6 });
    const preview = createAdapter({ sourceLine: 4, ratio: 0.2 });
    const coordinator = createEditorPreviewScrollSync(frames);
    coordinator.setAdapter("editor", editor.adapter);
    coordinator.setAdapter("preview", preview.adapter);

    editor.emitScroll();
    vi.advanceTimersByTime(SETTLE_DELAY_MS);
    preview.emitLayoutChange();
    preview.emitUserIntent();
    preview.emitScroll();
    vi.advanceTimersByTime(SETTLE_DELAY_MS);

    expect(editor.adapter.scrollToPosition).toHaveBeenLastCalledWith({
      sourceLine: 4,
      ratio: 0.2,
    });
    coordinator.destroy();
  });
});
