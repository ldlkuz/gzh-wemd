import type { IpcMainInvokeEvent } from "electron";
import { clipboard, ipcMain } from "electron";

export function registerClipboardHandlers(): void {
  ipcMain.handle(
    "clipboard:writeHTML",
    async (
      _event: IpcMainInvokeEvent,
      payload: { html?: string; text?: string },
    ) => {
      const html = payload?.html ?? "";
      const text = payload?.text ?? "";
      if (!html.trim()) {
        return { success: false, error: "HTML 不能为空" };
      }
      try {
        clipboard.write({ html, text });
        return { success: true };
      } catch (error: any) {
        return { success: false, error: error?.message ?? "写入剪贴板失败" };
      }
    },
  );

  ipcMain.handle(
    "clipboard:writeText",
    async (_event: IpcMainInvokeEvent, text: string) => {
      if (!text?.trim()) {
        return { success: false, error: "文本不能为空" };
      }
      try {
        clipboard.writeText(text);
        return { success: true };
      } catch (error: any) {
        return { success: false, error: error?.message ?? "写入剪贴板失败" };
      }
    },
  );
}
