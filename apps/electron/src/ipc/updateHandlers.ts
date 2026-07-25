import { ipcMain } from "electron";
import { openReleasesPage } from "../updater";

export function registerUpdateHandlers(): void {
  ipcMain.handle("update:openReleases", () => {
    openReleasesPage();
  });
}
