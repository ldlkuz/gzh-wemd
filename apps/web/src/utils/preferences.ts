/**
 * 界面本地偏好（localStorage）
 *
 * 说明：这类偏好只影响渲染进程的交互行为，不放主进程，读写都走 localStorage。
 */

/** 外部推送文章后是否自动在编辑器打开 */
export const AUTO_OPEN_ARTICLE_KEY = "wemd-auto-open-article";

/** 读取「推送后自动打开」偏好；无记录时默认开启 */
export function isAutoOpenArticleEnabled(): boolean {
  try {
    return localStorage.getItem(AUTO_OPEN_ARTICLE_KEY) !== "false";
  } catch {
    return true;
  }
}

/** 写入「推送后自动打开」偏好 */
export function setAutoOpenArticleEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(AUTO_OPEN_ARTICLE_KEY, String(enabled));
  } catch {
    /* 存储不可用时忽略，不影响主流程 */
  }
}
