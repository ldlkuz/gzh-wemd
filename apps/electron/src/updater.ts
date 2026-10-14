import { app, net, shell, BrowserWindow } from 'electron';
import { autoUpdater } from 'electron-updater';

const GITHUB_OWNER = 'ldlkuz';
const GITHUB_REPO_NAME = 'gzh-wemd';
const RELEASES_URL = `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO_NAME}/releases`;

/**
 * 更新线路（双源）：
 * - proxy：国内镜像，默认走它 —— 直连 GitHub 往往极慢甚至完全拿不到元数据
 * - github：app-update.yml 里焊死的官方源，作为兜底
 * 镜像不可用时自动回落到官方源，保证任何情况下都还能更新。
 */
type UpdateRoute = 'proxy' | 'github';

/**
 * 镜像基址 = 代理前缀 + GitHub 的 releases/latest/download 别名。
 * 别名始终指向最新 Release，所以这个 URL 固定、不带版本号，且
 * latest*.yml 与安装包都能从同一基址取到（结尾斜杠不能省）。
 */
const PROXY_FEED_URL = `https://gh-proxy.com/https://github.com/${GITHUB_OWNER}/${GITHUB_REPO_NAME}/releases/latest/download/`;

/** 兜底源：GitHub 官方，等价于 app-update.yml 里的默认配置 */
const GITHUB_FEED = {
  provider: 'github' as const,
  owner: GITHUB_OWNER,
  repo: GITHUB_REPO_NAME,
};

/** 线路探测超时：超过即认为镜像不可用，改用官方源 */
const PROBE_TIMEOUT_MS = 4000;

/**
 * 初始化自动更新（electron-updater，基于 GitHub Releases）。
 * 状态机：检查 → (update-available) → 用户点下载 → 下载进度 → 下载完成 → 重启安装
 * 设计要点：
 * - 下载受控：检测到新版本不自动下载，等用户点“下载”才触发，避免下载未完成就
 *   点击“重启”导致 electron-updater 的 quitAndInstall 报错。
 * - 进度回传：download-progress 实时推送，渲染端显示下载百分比。
 * - 错误分级：检查阶段 / 下载阶段错误分别带 stage 与 message 回传，渲染端精准提示。
 */
let lastForce = false; // 最近一次检查是否为手动强制（忽略跳过版本）
let downloadNotified = false; // 同一版本只提示一次"已下载可重启"
let updateAvailable = false; // 本次会话是否已检测到新版本（用于区分检查失败 / 下载失败）
let currentVersionCache = ''; // 缓存版本号，避免重复读 app.getVersion()
let currentRoute: UpdateRoute | null = null; // 当前生效的线路（null = 尚未设置，用 app-update.yml 默认）
let checkAttemptInFlight = false; // 检查兜底过程中：抑制 error 事件重复上报
let suppressAvailableEvent = false; // 换源重检时静默刷新，不重复弹"发现新版本"

function send(mainWindow: BrowserWindow | null, channel: string, payload?: unknown): void {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(channel, payload);
  }
}

/** 当前平台的更新元数据文件名（electron-builder 的命名约定） */
function channelFileName(): string {
  if (process.platform === 'darwin') return 'latest-mac.yml';
  if (process.platform === 'win32') return 'latest.yml';
  return 'latest-linux.yml';
}

/** 切换更新线路；同一线路不重复设置 */
function applyRoute(route: UpdateRoute): void {
  if (route === currentRoute) return;
  autoUpdater.setFeedURL(route === 'proxy' ? PROXY_FEED_URL : GITHUB_FEED);
  currentRoute = route;
}

/**
 * 探测镜像线路是否可用：能取到当前平台的元数据且内容像 yml 才算通。
 * 用 net.fetch（Chromium 网络栈）而不是 Node fetch，这样能复用系统代理设置。
 */
async function probeProxyRoute(): Promise<UpdateRoute> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
  try {
    const res = await net.fetch(`${PROXY_FEED_URL}${channelFileName()}`, {
      signal: controller.signal,
      cache: 'no-store',
    });
    if (!res.ok) return 'github';
    const text = await res.text();
    return text.includes('version:') ? 'proxy' : 'github';
  } catch {
    return 'github';
  } finally {
    clearTimeout(timer);
  }
}

/**
 * 换源后重新拉取更新信息（静默，不重复弹窗）。
 * 必须重新检查：downloadUpdate 用的是上一次检查缓存的信息。
 */
async function refreshUpdateInfo(): Promise<boolean> {
  try {
    suppressAvailableEvent = true;
    await autoUpdater.checkForUpdates();
    return true;
  } catch (error) {
    console.warn('[updater] 换源后重新检查失败:', error);
    return false;
  } finally {
    suppressAvailableEvent = false;
  }
}

// electron-updater 的 DownloadProgress 类型：{ percent, transferred, total, bytesPerSecond }
export function initAutoUpdate(getWindow: () => BrowserWindow | null): void {
  // 用函数而非固定窗口引用，保证窗口重建后仍能取到当前窗口
  const mainWindow = () => getWindow();
  autoUpdater.logger = console;
  autoUpdater.autoDownload = false; // 检测到新版本不自动下载，等待用户点击
  applyRoute('proxy'); // 默认走国内镜像；探测/检查失败时再回落官方源

  autoUpdater.on('update-available', (info) => {
    const currentVersion = app.getVersion();
    const latestVersion = info.version?.replace(/^v/, '') || currentVersion;
    updateAvailable = true; // 后续 error 属于下载阶段，而非检查阶段
    currentVersionCache = currentVersion;
    // 换源重检只为刷新内部信息：UI 此时已进入下载流程，不重复弹"发现新版本"
    if (suppressAvailableEvent) return;
    send(mainWindow(), 'update:available', {
      latestVersion,
      currentVersion,
      releaseUrl: RELEASES_URL,
      releaseNotes: info.releaseNotes || '',
      force: lastForce,
    });
  });

  autoUpdater.on('update-not-available', () => {
    // 仅手动强制检查（菜单"检查更新"）时提示"已是最新版本"，
    // 启动时的自动检查保持静默，避免每次打开都弹窗打扰用户。
    if (lastForce) {
      send(mainWindow(), 'update:upToDate', { currentVersion: app.getVersion() });
    }
  });

  autoUpdater.on('download-progress', (progress) => {
    send(mainWindow(), 'update:downloading', {
      percent: Math.round(progress.percent || 0),
      transferred: progress.transferred,
      total: progress.total,
      bytesPerSecond: progress.bytesPerSecond,
    });
  });

  autoUpdater.on('error', (err) => {
    console.error('[autoUpdater] error:', err);
    const message = err?.message || String(err);
    if (updateAvailable) {
      // 下载过程中的 error（差异更新/分块请求的临时失败）由 electron-updater
      // 内部自动重试或回退整包，这里只记日志，不弹"网络错误"，避免打扰用户。
      // 只有在下载真正彻底失败时（downloadUpdate 的 Promise reject）才提示。
      return;
    }
    // 检查阶段失败：统一由 checkForUpdates 上报（它会先回落官方源重试一轮），
    // 这里跳过可避免回退成功时仍冒出"检查更新失败"。
    if (checkAttemptInFlight) return;
    if (lastForce) {
      send(mainWindow(), 'update:error', { stage: 'check', message });
    }
  });

  autoUpdater.on('update-downloaded', (info) => {
    if (downloadNotified) return;
    downloadNotified = true;
    send(mainWindow(), 'update:downloaded', {
      latestVersion: (info.version || '').replace(/^v/, ''),
      currentVersion: currentVersionCache || app.getVersion(),
      releaseNotes: info.releaseNotes || '',
    });
  });
}

/**
 * 检查是否有新版本
 * @param force 是否手动强制检查（强制时忽略用户"跳过此版本"的记录）
 */
export async function checkForUpdates(
  getWindow: () => BrowserWindow | null,
  force: boolean = false,
): Promise<void> {
  // 未打包运行（开发态）不检查更新
  if (!app.isPackaged) {
    if (force) console.warn('[updater] skip check in dev (app not packaged)');
    return;
  }
  lastForce = force;
  checkAttemptInFlight = true;
  try {
    await autoUpdater.checkForUpdates();
  } catch (error) {
    // 镜像线路异常：静默回落到 GitHub 官方源重试一次，用户无感
    console.warn('[updater] 镜像线路检查失败，回落到官方源重试:', error);
    applyRoute('github');
    try {
      await autoUpdater.checkForUpdates();
    } catch (retryError) {
      console.error('Update check failed:', retryError);
      if (force) {
        const message =
          retryError instanceof Error ? retryError.message : String(retryError);
        send(getWindow(), 'update:error', { stage: 'check', message });
      }
    }
  } finally {
    checkAttemptInFlight = false;
  }
}

/** 手动触发下载（在检测到新版本、用户点击“下载”后调用） */
export async function downloadUpdate(
  getWindow: () => BrowserWindow | null,
): Promise<void> {
  // 下载前先定线路：探测期间给前端反馈，避免用户点了按钮却没有任何动静
  send(getWindow(), 'update:selectingRoute');
  const route = await probeProxyRoute();
  if (route !== currentRoute) {
    applyRoute(route);
    // 换源后必须重新检查，否则 downloadUpdate 用的还是旧源缓存的信息
    if (!(await refreshUpdateInfo())) {
      send(getWindow(), 'update:error', {
        stage: 'download',
        message: '更新线路切换失败，请稍后重试',
      });
      return;
    }
  }

  try {
    await autoUpdater.downloadUpdate();
  } catch (error) {
    console.error('Update download failed:', error);
    const message = error instanceof Error ? error.message : String(error);
    send(getWindow(), 'update:error', { stage: 'download', message });
    updateAvailable = false;
  }
}

/**
 * 立即重启并安装已下载的更新。
 * 注意：electron-updater 在下载未完成时调用会抛错，因此仅应在收到 update-downloaded 后调用。
 */
export function restartToInstall(): void {
  try {
    autoUpdater.quitAndInstall();
  } catch (error) {
    console.error('[updater] quitAndInstall failed:', error);
  }
}

/** 打开 Releases 页面（供渲染进程调用） */
export function openReleasesPage(): void {
  shell.openExternal(RELEASES_URL);
}

/** 供诊断包使用：当前更新线路与状态 */
export function getUpdateDiagnostics(): {
  route: UpdateRoute | null;
  proxyUrl: string;
  updateAvailable: boolean;
} {
  return {
    route: currentRoute,
    proxyUrl: PROXY_FEED_URL,
    updateAvailable,
  };
}