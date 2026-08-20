import { ipcMain } from "electron";
import { openReleasesPage, restartToInstall } from "../updater";

export function registerUpdateHandlers(): void {
  ipcMain.handle("update:openReleases", () => {
    openReleasesPage();
  });
  ipcMain.handle("update:restartAndInstall", () => {
    restartToInstall();
  });
}
