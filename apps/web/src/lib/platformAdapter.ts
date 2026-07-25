/**
 * 平台适配器 - 统一 Electron/浏览器环境检测和专有行为封装
 */

// 基础环境检测（避免 SSR 环境报错）
const hasWindow = () => typeof window !== "undefined";

/**
 * 平台检测状态
 */
export const platform = {
  /** 是否运行在 Electron 环境 */
  get isElectron(): boolean {
    return hasWindow() && !!window.electron?.isElectron;
  },

  /** 是否运行在 Web 浏览器环境 */
  get isWeb(): boolean {
    return hasWindow() && !window.electron?.isElectron;
  },

  /** 是否为 macOS 平台 */
  get isMac(): boolean {
    return hasWindow() && window.electron?.platform === "darwin";
  },

  /** 是否为 Windows 平台 */
  get isWindows(): boolean {
    return hasWindow() && window.electron?.platform === "win32";
  },

  /** 原始平台字符串 */
  get name(): string | undefined {
    return hasWindow() ? window.electron?.platform : undefined;
  },
};

/**
 * 平台专有行为接口
 * 封装需要根据平台做不同处理的逻辑
 */
export const platformActions = {
  /**
   * 是否需要持久化历史快照
   * Web 环境需要持久化到 IndexedDB，Electron 环境文件直接保存
   */
  shouldPersistHistory: (): boolean => !platform.isElectron,

  /**
   * 是否显示存储模式选择器
   * 仅 Web 环境需要（Electron 自带文件系统）
   */
  showStorageModeSelector: (): boolean => !platform.isElectron,
};
