/** 打开「文章主题」面板的全局事件：编辑器内徽章触发，Header 侧监听打开弹窗 */
export const OPEN_THEME_PANEL_EVENT = "wemd:open-theme-panel";

/** 任意组件可调用：要求 Header 打开文章主题面板 */
export function openThemePanel(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(OPEN_THEME_PANEL_EVENT));
}
