/**
 * 微信公众号复制主编排入口
 * 负责将 Markdown 转为微信兼容 HTML 并写入剪贴板
 */

import toast from "react-hot-toast";
import { normalizeCopyContainer, stripCopyMetadata } from "./wechatCopyNormalizer";
import {
  buildWechatPublishHtml,
  type WechatPublishHtmlOptions,
} from "./wechatPublishHtml";

// re-export 保持外部引用兼容
export { normalizeCopyContainer, stripCopyMetadata };

// ── 剪贴板写入策略 ─────────────────────────────────

const copyViaNativeExecCommand = (container: HTMLElement): boolean => {
  const selection = window.getSelection();
  const range = document.createRange();
  range.selectNodeContents(container);
  selection?.removeAllRanges();
  selection?.addRange(range);
  try {
    return document.execCommand("copy");
  } finally {
    selection?.removeAllRanges();
  }
};

const copyViaElectronClipboard = async (
  payload: { html: string; text: string },
): Promise<{ success: boolean; error?: string } | null> => {
  const writeHTML = window.electron?.clipboard?.writeHTML;
  if (!writeHTML) return null;

  return writeHTML(payload);
};

const shouldPreferElectronClipboard = (): boolean => {
  const electron = window.electron;
  if (!electron?.isElectron) return false;

  // Windows 下优先使用与手动复制一致的选区链路，降低公众号样式丢失概率
  if (electron.platform === "win32") return false;
  if (electron.platform === "darwin" || electron.platform === "linux")
    return true;
  return false;
};

// ── 主编排流程 ──────────────────────────────────────

export async function copyToWechat(
  markdown: string,
  css: string,
  options: WechatPublishHtmlOptions = {},
): Promise<void> {
  let publishResult:
    | Awaited<ReturnType<typeof buildWechatPublishHtml>>
    | undefined;

  try {
    publishResult = await buildWechatPublishHtml(markdown, css, options);
    const { container, html, plainText, mathImageCount } = publishResult;

    let copied = false;

    const preferElectronClipboard = shouldPreferElectronClipboard();

    if (!preferElectronClipboard) {
      copied = copyViaNativeExecCommand(container);
    }

    if (!copied && window.electron?.isElectron) {
      try {
        const electronResult = await copyViaElectronClipboard({
          html,
          text: plainText,
        });
        if (electronResult) {
          copied = electronResult.success;
          if (!electronResult.success) {
            console.warn(
              "[WeMD] Electron clipboard bridge unavailable, fallback to browser copy chain",
              electronResult.error || "unknown error",
            );
          }
        }
      } catch (e) {
        console.error("Electron clipboard 写入失败，降级为浏览器复制链路", e);
      }
    }

    if (!copied && preferElectronClipboard) {
      copied = copyViaNativeExecCommand(container);
    }

    // 最后回退到 Clipboard API
    if (!copied && navigator.clipboard && window.ClipboardItem) {
      console.warn(
        "[WeMD] native execCommand copy unavailable, fallback to Clipboard API",
      );
      try {
        const blob = new Blob([html], { type: "text/html" });
        const textBlob = new Blob([plainText], {
          type: "text/plain",
        });
        await navigator.clipboard.write([
          new ClipboardItem({
            "text/html": blob,
            "text/plain": textBlob,
          }),
        ]);
        copied = true;
      } catch (e) {
        console.error("Clipboard API 失败，使用回退方案", e);
      }
    }

    if (!copied) {
      throw new Error("浏览器剪贴板写入失败");
    }

    toast.success(
      mathImageCount > 0
        ? "已复制，部分复杂公式已自动保真处理"
        : "已复制，可以直接粘贴至微信公众号",
      {
        duration: 3000,
        icon: "✅",
      },
    );
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("复制失败详情:", error);
    toast.error(`复制失败: ${errorMsg}`);
    throw error;
  } finally {
    publishResult?.cleanup();
  }
}
