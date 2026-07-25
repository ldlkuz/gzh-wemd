import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useWindowControls } from "../../hooks/useWindowControls";

describe("useWindowControls", () => {
  const originalWindowElectron = window.electron;

  beforeEach(() => {
    // Reset window.electron before each test
    Object.defineProperty(window, "electron", {
      value: undefined,
      writable: true,
    });
  });

  afterEach(() => {
    // Restore original window.electron
    Object.defineProperty(window, "electron", {
      value: originalWindowElectron,
      writable: true,
    });
  });

  it("should return default values when not in Electron", () => {
    const { result } = renderHook(() => useWindowControls());

    expect(result.current.isElectron).toBe(false);
    expect(result.current.isWindows).toBe(false);
    expect(result.current.isMac).toBe(false);
    expect(result.current.platform).toBeUndefined();
  });

  it("should identify Electron environment", () => {
    Object.defineProperty(window, "electron", {
      value: {
        isElectron: true,
        platform: "darwin",
      },
      writable: true,
    });

    const { result } = renderHook(() => useWindowControls());

    expect(result.current.isElectron).toBe(true);
    expect(result.current.isMac).toBe(true);
    expect(result.current.isWindows).toBe(false);
  });

  it("should identify Windows platform", () => {
    Object.defineProperty(window, "electron", {
      value: {
        isElectron: true,
        platform: "win32",
      },
      writable: true,
    });

    const { result } = renderHook(() => useWindowControls());

    expect(result.current.isWindows).toBe(true);
  });

  it("should expose window control methods", () => {
    const minimizeMock = vi.fn();
    const maximizeMock = vi.fn();
    const closeMock = vi.fn();

    Object.defineProperty(window, "electron", {
      value: {
        isElectron: true,
        window: {
          minimize: minimizeMock,
          maximize: maximizeMock,
          close: closeMock,
        },
      },
      writable: true,
    });

    const { result } = renderHook(() => useWindowControls());

    result.current.minimize?.();
    expect(minimizeMock).toHaveBeenCalled();

    result.current.maximize?.();
    expect(maximizeMock).toHaveBeenCalled();

    result.current.close?.();
    expect(closeMock).toHaveBeenCalled();
  });
});
