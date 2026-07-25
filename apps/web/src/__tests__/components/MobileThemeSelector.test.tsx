import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MobileThemeSelector } from "../../components/Theme/MobileThemeSelector";
import { useThemeStore } from "../../store/themeStore";

vi.mock("../../store/themeStore");

describe("MobileThemeSelector", () => {
  const selectTheme = vi.fn();
  const themes = [
    {
      id: "default",
      name: "默认主题",
      css: "#wemd{}",
      isBuiltIn: true,
      createdAt: "2026-07-14",
      updatedAt: "2026-07-14",
    },
    {
      id: "bauhaus",
      name: "包豪斯",
      css: "#wemd{}",
      isBuiltIn: true,
      isSelectable: false,
      createdAt: "2026-07-14",
      updatedAt: "2026-07-14",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useThemeStore).mockImplementation((selector) =>
      selector({
        themeId: "bauhaus",
        selectTheme,
        getAllThemes: () => themes,
        customThemes: [],
      } as unknown as ReturnType<typeof useThemeStore.getState>),
    );
  });

  it("不展示下架主题但仍允许 store 保持该主题为当前值", () => {
    render(<MobileThemeSelector open onClose={vi.fn()} />);

    expect(screen.getByRole("button", { name: "默认主题" })).toBeVisible();
    expect(
      screen.queryByRole("button", { name: "包豪斯" }),
    ).not.toBeInTheDocument();
  });

  it("选择可用主题后关闭面板", () => {
    const onClose = vi.fn();
    render(<MobileThemeSelector open onClose={onClose} />);

    fireEvent.click(screen.getByRole("button", { name: "默认主题" }));

    expect(selectTheme).toHaveBeenCalledWith("default");
    expect(onClose).toHaveBeenCalledOnce();
  });
});
