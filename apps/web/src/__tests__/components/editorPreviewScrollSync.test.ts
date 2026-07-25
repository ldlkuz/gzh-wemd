import { describe, expect, it, vi } from "vitest";
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

describe("编辑器与预览双向滚动协调", () => {
  it("在下一动画帧把主动侧源行同步到另一侧", () => {
    const frames = createFrameQueue();
    const editor = createAdapter({ sourceLine: 12, ratio: 0.4 });
    const preview = createAdapter({ sourceLine: 2, ratio: 0.1 });
    const coordinator = createEditorPreviewScrollSync(frames);
    coordinator.setAdapter("editor", editor.adapter);
    coordinator.setAdapter("preview", preview.adapter);

    editor.emitScroll();
    frames.flush();

    expect(preview.adapter.scrollToPosition).toHaveBeenCalledWith({
      sourceLine: 12,
      ratio: 0.4,
    });
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
    frames.flush();
    preview.emitScroll();
    frames.flush();
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
    frames.flush();
    preview.emitUserIntent();
    preview.emitScroll();
    frames.flush();

    expect(editor.adapter.scrollToPosition).toHaveBeenLastCalledWith({
      sourceLine: 4,
      ratio: 0.2,
    });
    coordinator.destroy();
  });

  it("用户滚动会抢占同帧内尚未执行的布局恢复", () => {
    const frames = createFrameQueue();
    const editor = createAdapter({ sourceLine: 18, ratio: 0.6 });
    const preview = createAdapter({ sourceLine: 4, ratio: 0.2 });
    const coordinator = createEditorPreviewScrollSync(frames);
    coordinator.setAdapter("editor", editor.adapter);
    coordinator.setAdapter("preview", preview.adapter);

    editor.emitScroll();
    frames.flush();
    frames.flush();
    preview.emitLayoutChange();
    preview.emitUserIntent();
    preview.emitScroll();
    frames.flush();

    expect(editor.adapter.scrollToPosition).toHaveBeenLastCalledWith({
      sourceLine: 4,
      ratio: 0.2,
    });
    coordinator.destroy();
  });
});
