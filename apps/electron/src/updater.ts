import { app, shell, BrowserWindow } from 'electron';
import { autoUpdater } from 'electron-updater';

const GITHUB_REPO = 'ldlkuz/gzh-wemd';
const RELEASES_URL = `https://github.com/${GITHUB_REPO}/releases`;

/**
 * 初始化自动更新（electron-updater，基于 GitHub Releases）。
 * - 检测到新版本自动后台下载
 * - 用户退出应用时自动安装（autoInstallOnAppQuit），或通过 restartToInstall 立即安装
 * - GitHub 发布元数据由 release.yml 上传的 latest*.yml 提供
 */
let lastForce = false; // 最近一次检查是否为手动强制（忽略跳过版本）
let downloadNotified = false; // 同一版本只提示一次"已下载可重启"

export function initAutoUpdate(mainWindow: BrowserWindow | null): void {
  autoUpdater.logger = console;
  autoUpdater.autoDownload = true; // 检测到新版本自动下载
  autoUpdater.autoInstallOnAppQuit = true; // 退出时安装

  autoUpdater.on('update-available', (info) => {
    const currentVersion = app.getVersion();
    const latestVersion = info.version?.replace(/^v/, '') || currentVersion;
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('update:available', {
        latestVersion,
        currentVersion,
        releaseUrl: RELEASES_URL,
        releaseNotes: info.releaseNotes || '',
        force: lastForce,
      });
    }
  });

  autoUpdater.on('update-not-available', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('update:upToDate', {
        currentVersion: app.getVersion(),
      });
    }
  });

  autoUpdater.on('error', (err) => {
    console.error('[autoUpdater] error:', err);
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('update:error');
    }
  });

  autoUpdater.on('update-downloaded', (info) => {
    if (downloadNotified) return;
    downloadNotified = true;
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('update:dowloaded', {
        latestVersion: (info.version || '').replace(/^v/, ''),
        currentVersion: app.getVersion(),
        releaseNotes: info.releaseNotes || '',
      });
    }
  });
}

/**
 * 检查是否有新版本
 * @param mainWindow 主窗口
 * @param force 是否手动强制检查（强制时忽略用户"跳过此版本"的记录）
 */
export async function checkForUpdates(
  mainWindow: BrowserWindow | null,
  force: boolean = false,
): Promise<void> {
  // 未打包运行（开发态）不检查更新
  if (!app.isPackaged) {
    if (force) console.warn('[updater] skip check in dev (app not packaged)');
    return;
  }
  try {
    lastForce = force;
    await autoUpdater.checkForUpdates();
  } catch (error) {
    console.error('Update check failed:', error);
    if (force && mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('update:error');
    }
  }
}

/** 立即重启并安装已下载的更新 */
export function restartToInstall(): void {
  autoUpdater.quitAndInstall();
}

/** 打开 Releases 页面（供渲染进程调用） */
export function openReleasesPage(): void {
  shell.openExternal(RELEASES_URL);
}