import { describe, expect, it, vi } from "vitest";
import {
  PRELOAD_RELOAD_AT_KEY,
  PRELOAD_RELOAD_COOLDOWN_MS,
  getSafeSessionStorage,
  installPreloadErrorHandler,
} from "../../bootstrap/installPreloadErrorHandler";

function createHarness(opts?: {
  storedAt?: number | null;
  storageThrows?: "get" | "set";
  startTime?: number;
}) {
  const listeners: Record<string, (event: Event) => void> = {};
  const target = {
    addEventListener: vi.fn((type: string, cb: (event: Event) => void) => {
      listeners[type] = cb;
    }),
  };
  const store = new Map<string, string>();
  if (opts?.storedAt != null) {
    store.set(PRELOAD_RELOAD_AT_KEY, String(opts.storedAt));
  }
  const storage = {
    getItem: vi.fn((k: string) => {
      if (opts?.storageThrows === "get") throw new Error("boom");
      return store.get(k) ?? null;
    }),
    setItem: vi.fn((k: string, v: string) => {
      if (opts?.storageThrows === "set") throw new Error("boom");
      store.set(k, v);
    }),
  };
  let nowValue = opts?.startTime ?? 1_000_000;
  const now = vi.fn(() => nowValue);
  const reload = vi.fn();

  installPreloadErrorHandler({ target, storage, now, reload });

  function fire() {
    const event = { preventDefault: vi.fn() } as unknown as Event;
    listeners["vite:preloadError"]?.(event);
    return event;
  }
  function advance(ms: number) {
    nowValue += ms;
  }

  return { target, storage, now, reload, fire, advance, store };
}

describe("installPreloadErrorHandler", () => {
  it("registers a single vite:preloadError listener", () => {
    const h = createHarness();
    expect(h.target.addEventListener).toHaveBeenCalledTimes(1);
    expect(h.target.addEventListener).toHaveBeenCalledWith(
      "vite:preloadError",
      expect.any(Function),
    );
  });

  it("on first error: preventDefault + reload + stamp storage", () => {
    const h = createHarness({ startTime: 5_000 });
    const event = h.fire();
    expect(event.preventDefault as ReturnType<typeof vi.fn>).toHaveBeenCalled();
    expect(h.reload).toHaveBeenCalledTimes(1);
    expect(h.store.get(PRELOAD_RELOAD_AT_KEY)).toBe("5000");
  });

  it("within cooldown: does NOT preventDefault and does NOT reload", () => {
    const h = createHarness({
      storedAt: 1_000_000,
      startTime: 1_000_000 + PRELOAD_RELOAD_COOLDOWN_MS - 1,
    });
    const event = h.fire();
    expect(
      event.preventDefault as ReturnType<typeof vi.fn>,
    ).not.toHaveBeenCalled();
    expect(h.reload).not.toHaveBeenCalled();
  });

  it("after cooldown: reloads again", () => {
    const h = createHarness({
      storedAt: 1_000_000,
      startTime: 1_000_000 + PRELOAD_RELOAD_COOLDOWN_MS + 1,
    });
    h.fire();
    expect(h.reload).toHaveBeenCalledTimes(1);
  });

  it("when storage.getItem throws: still reloads once", () => {
    const h = createHarness({ storageThrows: "get" });
    h.fire();
    expect(h.reload).toHaveBeenCalledTimes(1);
  });

  it("when storage.setItem throws: still reloads (does not crash)", () => {
    const h = createHarness({ storageThrows: "set" });
    expect(() => h.fire()).not.toThrow();
    expect(h.reload).toHaveBeenCalledTimes(1);
  });
});

describe("getSafeSessionStorage", () => {
  it("returns the real storage when accessible", () => {
    const real = { getItem: () => null, setItem: () => {} };
    const win = { sessionStorage: real } as unknown as Window;
    expect(getSafeSessionStorage(win)).toBe(real);
  });

  it("returns a noop storage when the property access throws", () => {
    const win = {} as Window;
    Object.defineProperty(win, "sessionStorage", {
      get() {
        throw new Error("SecurityError");
      },
    });
    const storage = getSafeSessionStorage(win);
    expect(storage.getItem("x")).toBeNull();
    expect(() => storage.setItem("x", "y")).not.toThrow();
  });

  it("returns a noop storage when sessionStorage is null/undefined", () => {
    const win = { sessionStorage: null } as unknown as Window;
    const storage = getSafeSessionStorage(win);
    expect(storage.getItem("x")).toBeNull();
    expect(() => storage.setItem("x", "y")).not.toThrow();
  });
});
