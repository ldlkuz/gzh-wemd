import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Toolbar } from "../../components/Editor/Toolbar";

describe("Toolbar 表格自动换行开关", () => {
  beforeEach(() => {
    const store = new Map<string, string>();
    vi.stubGlobal("localStorage", {
      getItem: vi.fn((key: string) => store.get(key) ?? null),
      setItem: vi.fn((key: string, value: string) => {
        store.set(key, String(value));
      }),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("在外链转脚注旁切换并立即更新按钮状态", () => {
    render(<Toolbar onInsert={vi.fn()} />);

    const footnoteButton = screen.getByRole("button", {
      name: "外链转脚注：关闭",
    });
    const tableWrapButton = screen.getByRole("button", {
      name: "表格自动换行：关闭",
    });
    expect(
      footnoteButton.compareDocumentPosition(tableWrapButton) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();

    fireEvent.click(tableWrapButton);

    expect(
      screen.getByRole("button", { name: "表格自动换行：开启" }),
    ).toHaveClass("active");
    expect(localStorage.getItem("wemd-table-wrap")).toBe("true");
  });
});
