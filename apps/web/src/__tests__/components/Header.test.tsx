import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { Header } from "../../components/Header/Header";
import { useWindowControls } from "../../hooks/useWindowControls";
import { useUITheme } from "../../hooks/useUITheme";
import { useEditorStore } from "../../store/editorStore";

// Mock hooks
vi.mock("../../hooks/useWindowControls");
vi.mock("../../hooks/useUITheme");
vi.mock("../../store/editorStore");

// Mock components that might cause issues in JSDOM or aren't focus of test
vi.mock("../../components/Theme/ThemePanel", () => ({
  ThemePanel: ({ open }: { open: boolean }) =>
    open ? <div data-testid="theme-panel">Theme Panel</div> : null,
}));
vi.mock("../../components/StorageModeSelector/StorageModeSelector", () => ({
  StorageModeSelector: () => (
    <div data-testid="storage-selector">Storage Selector</div>
  ),
}));
vi.mock("../../components/Settings/ImageHostSettings", () => ({
  ImageHostSettings: () => (
    <div data-testid="image-host-settings">Image Host Settings</div>
  ),
}));

describe("Header", () => {
  // Default mocks
  const mockCopyToWechat = vi.fn();
  const mockCopyAsHtml = vi.fn();
  const mockSetTheme = vi.fn();
  const mockMinimize = vi.fn();
  const mockMaximize = vi.fn();
  const mockClose = vi.fn();
  let storageMock: {
    getItem: ReturnType<typeof vi.fn>;
    setItem: ReturnType<typeof vi.fn>;
    removeItem: ReturnType<typeof vi.fn>;
    clear: ReturnType<typeof vi.fn>;
    key: ReturnType<typeof vi.fn>;
    length: number;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    const store = new Map<string, string>();
    storageMock = {
      getItem: vi.fn((key: string) => store.get(key) ?? null),
      setItem: vi.fn((key: string, value: string) => {
        store.set(key, String(value));
      }),
      removeItem: vi.fn((key: string) => {
        store.delete(key);
      }),
      clear: vi.fn(() => {
        store.clear();
      }),
      key: vi.fn((index: number) => Array.from(store.keys())[index] ?? null),
      length: 0,
    };
    Object.defineProperty(storageMock, "length", {
      get: () => store.size,
      enumerable: true,
    });
    vi.stubGlobal("localStorage", storageMock);

    if (
      typeof window !== "undefined" &&
      window.localStorage &&
      typeof window.localStorage.removeItem === "function"
    ) {
      window.localStorage.removeItem("wemd-header-autohide");
    }

    // Setup default hook returns
    vi.mocked(useEditorStore).mockReturnValue({
      copyToWechat: mockCopyToWechat,
      copyAsHtml: mockCopyAsHtml,
    });

    vi.mocked(useUITheme).mockImplementation(
      (selector: (state: any) => any) => {
        const state = { theme: "light", setTheme: mockSetTheme };
        return selector(state);
      },
    );

    vi.mocked(useWindowControls).mockReturnValue({
      isElectron: false,
      isWindows: false,
      isMac: true,
      platform: "web",
      minimize: mockMinimize,
      maximize: mockMaximize,
      close: mockClose,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders logo and core elements", () => {
    render(<Header />);

    expect(screen.getByText("WeMD")).toBeInTheDocument();
    expect(screen.getByText("公众号 Markdown 排版编辑器")).toBeInTheDocument();
    expect(screen.getByText("复制到公众号")).toBeInTheDocument();
  });

  it("toggles theme interaction", () => {
    render(<Header />);

    const themeBtn = screen.getByTitle("切换到暗色模式");
    fireEvent.click(themeBtn);
    expect(mockSetTheme).toHaveBeenCalledWith("dark");
  });

  it("calls copyToWechat action", () => {
    render(<Header />);

    fireEvent.click(screen.getByText("复制到公众号"));
    expect(mockCopyToWechat).toHaveBeenCalled();
  });

  it("calls copyAsHtml action", () => {
    render(<Header />);

    fireEvent.click(screen.getByText("复制 HTML"));
    expect(mockCopyAsHtml).toHaveBeenCalled();
  });

  it("does not render window controls on Web/Mac", () => {
    vi.mocked(useWindowControls).mockReturnValue({
      isElectron: false,
      isWindows: false,
      isMac: true,
      platform: "web",
      minimize: mockMinimize,
      maximize: mockMaximize,
      close: mockClose,
    });

    render(<Header />);

    expect(screen.queryByLabelText("最小化")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("关闭")).not.toBeInTheDocument();
  });

  it("renders window controls on Windows Electron", () => {
    vi.mocked(useWindowControls).mockReturnValue({
      isElectron: true,
      isWindows: true,
      isMac: false,
      platform: "win32",
      minimize: mockMinimize,
      maximize: mockMaximize,
      close: mockClose,
    });

    render(<Header />);

    expect(screen.getByLabelText("最小化")).toBeInTheDocument();
    expect(screen.getByLabelText("最大化")).toBeInTheDocument();
    expect(screen.getByLabelText("关闭")).toBeInTheDocument();

    // Test interactions
    fireEvent.click(screen.getByLabelText("关闭"));
    expect(mockClose).toHaveBeenCalled();
  });

  it("toggles header visibility (hide/show)", () => {
    render(<Header />);

    const hideBtn = screen.getByLabelText("隐藏标题栏");
    fireEvent.click(hideBtn);

    expect(screen.getByLabelText("显示标题栏")).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("显示标题栏"));

    expect(screen.getByLabelText("隐藏标题栏")).toBeInTheDocument();
  });

  it("shows floating toolbar buttons when header is hidden", () => {
    render(<Header />);

    fireEvent.click(screen.getByLabelText("隐藏标题栏"));

    expect(screen.getByLabelText("显示标题栏")).toBeInTheDocument();
    expect(screen.getByLabelText("主题管理")).toBeInTheDocument();
    expect(screen.getByLabelText("图床设置")).toBeInTheDocument();
    expect(screen.getByLabelText("复制到公众号")).toBeInTheDocument();
  });

  it("persists header visibility to localStorage", async () => {
    render(<Header />);

    fireEvent.click(screen.getByLabelText("隐藏标题栏"));

    await waitFor(() => {
      expect(storageMock.setItem).toHaveBeenCalledWith(
        "wemd-header-autohide",
        "true",
      );
    });
  });
});
