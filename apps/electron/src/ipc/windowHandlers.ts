import type { BrowserWindow } from "electron";
import { ipcMain } from "electron";

export function registerWindowHandlers(
  getWindow: () => BrowserWindow | null,
): void {
  ipcMain.handle("window:minimize", () => getWindow()?.minimize());
  ipcMain.handle("window:maximize", () => {
    const mainWindow = getWindow();
    if (mainWindow?.isMaximized()) mainWindow.unmaximize();
    else mainWindow?.maximize();
  });
  ipcMain.handle("window:close", () => getWindow()?.close());
  ipcMain.handle("window:isMaximized", () => getWindow()?.isMaximized());
}
