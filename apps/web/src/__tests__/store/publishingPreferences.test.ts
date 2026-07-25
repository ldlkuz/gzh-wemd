import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getPublishingPreference,
  LINK_TO_FOOTNOTE_EVENT,
  setPublishingPreference,
  subscribePublishingPreference,
  TABLE_WRAP_EVENT,
} from "../../store/publishingPreferences";

describe("发布偏好", () => {
  beforeEach(() => {
    const values = new Map<string, string>();
    vi.stubGlobal("localStorage", {
      getItem: vi.fn((key: string) => values.get(key) ?? null),
      setItem: vi.fn((key: string, value: string) => {
        values.set(key, String(value));
      }),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("通过同一接口持久化并发布不同偏好", () => {
    const linkListener = vi.fn();
    const tableListener = vi.fn();
    const unsubscribeLink = subscribePublishingPreference(
      "linkToFootnote",
      linkListener,
    );
    const unsubscribeTable = subscribePublishingPreference(
      "tableWrap",
      tableListener,
    );

    setPublishingPreference("linkToFootnote", true);
    setPublishingPreference("tableWrap", true);
    unsubscribeLink();
    setPublishingPreference("linkToFootnote", false);
    unsubscribeTable();

    expect(getPublishingPreference("linkToFootnote")).toBe(false);
    expect(getPublishingPreference("tableWrap")).toBe(true);
    expect(localStorage.getItem("wemd-link-to-footnote")).toBe("false");
    expect(localStorage.getItem("wemd-table-wrap")).toBe("true");
    expect(linkListener).toHaveBeenCalledTimes(1);
    expect(linkListener).toHaveBeenCalledWith(true);
    expect(tableListener).toHaveBeenCalledOnce();
    expect(tableListener).toHaveBeenCalledWith(true);
  });

  it("保留既有窗口事件名称和通知时序", () => {
    const linkOrder: string[] = [];
    const tableOrder: string[] = [];
    vi.mocked(localStorage.setItem).mockImplementation((key) => {
      if (key === "wemd-link-to-footnote") linkOrder.push("storage");
      if (key === "wemd-table-wrap") tableOrder.push("storage");
    });
    window.addEventListener(
      LINK_TO_FOOTNOTE_EVENT,
      () => linkOrder.push("event"),
      { once: true },
    );
    window.addEventListener(TABLE_WRAP_EVENT, () => tableOrder.push("event"), {
      once: true,
    });

    setPublishingPreference("linkToFootnote", true);
    setPublishingPreference("tableWrap", true);

    expect(linkOrder).toEqual(["event", "storage"]);
    expect(tableOrder).toEqual(["storage", "event"]);
  });

  it("订阅接口能够接收既有窗口事件发布者", () => {
    const listener = vi.fn();
    const unsubscribe = subscribePublishingPreference("tableWrap", listener);

    window.dispatchEvent(
      new CustomEvent<boolean>(TABLE_WRAP_EVENT, { detail: true }),
    );

    expect(listener).toHaveBeenCalledWith(true);
    unsubscribe();
  });
});
