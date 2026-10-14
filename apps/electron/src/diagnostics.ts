import { app, dialog, shell, type BrowserWindow } from 'electron';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { readRecentLogs } from './logger';
import { getWorkspaceDir } from './workspace/state';
import { getUpdateDiagnostics } from './updater';

/** 统计工作区里的 Markdown 文件数（最多往下 2 层，跳过隐藏目录） */
function countMarkdownFiles(dir: string, depth = 0): number {
  if (depth > 2) return 0;
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return 0;
  }
  let count = 0;
  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue;
    if (entry.isDirectory()) {
      count += countMarkdownFiles(path.join(dir, entry.name), depth + 1);
    } else if (/\.(md|markdown)$/i.test(entry.name)) {
      count += 1;
    }
  }
  return count;
}

function timestamp(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

/** 组装诊断文本：环境信息 + 更新状态 + 工作区概况 + 全部日志（日志已脱敏） */
function buildDiagnostics(): string {
  const update = getUpdateDiagnostics();
  const workspaceDir = getWorkspaceDir();
  const articleCount = workspaceDir ? countMarkdownFiles(workspaceDir) : null;

  const lines: string[] = [
    'GZH-WeMD 诊断报告',
    `生成时间: ${new Date().toLocaleString()}`,
    '',
    '## 环境',
    `App 版本      : ${app.getVersion()}`,
    `Electron      : ${process.versions.electron}`,
    `Chromium      : ${process.versions.chrome}`,
    `Node          : ${process.versions.node}`,
    `操作系统      : ${os.type()} ${os.release()} (${os.arch()})`,
    `打包运行      : ${app.isPackaged ? '是' : '否'}`,
    `用户数据目录  : ${app.getPath('userData')}`,
    '',
    '## 更新',
    `当前线路      : ${update.route ?? '未初始化'}`,
    `镜像地址      : ${update.proxyUrl}`,
    `已发现新版本  : ${update.updateAvailable ? '是' : '否'}`,
    '',
    '## 工作区',
    `路径          : ${workspaceDir ?? '(未设置)'}`,
    `Markdown 文件 : ${articleCount ?? '-'}`,
    '',
    '## 日志',
  ];

  const logs = readRecentLogs();
  if (logs.length === 0) {
    lines.push('(无日志文件)');
  } else {
    for (const file of logs) {
      lines.push('', `----- ${file.path} -----`, file.text || '(空)');
    }
  }

  return lines.join('\n');
}

/**
 * 导出诊断包：把环境信息 + 更新状态 + 工作区概况 + 日志写成一个纯文本文件。
 * 用纯文本而不是 zip，是为了用户能直接打开看、也能直接附到 Issue 里。
 */
export async function exportDiagnostics(
  getWindow: () => BrowserWindow | null,
): Promise<string | null> {
  const window = getWindow();
  const defaultName = `WeMD-诊断-${timestamp()}.txt`;
  const options = {
    title: '导出诊断信息',
    defaultPath: path.join(app.getPath('downloads'), defaultName),
    filters: [{ name: '文本文件', extensions: ['txt'] }],
  };

  const result = window
    ? await dialog.showSaveDialog(window, options)
    : await dialog.showSaveDialog(options);

  if (result.canceled || !result.filePath) return null;

  try {
    fs.writeFileSync(result.filePath, buildDiagnostics(), 'utf-8');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[diagnostics] 写入诊断文件失败:', message);
    if (window) {
      await dialog.showMessageBox(window, {
        type: 'error',
        title: '导出失败',
        message: '诊断信息写入失败',
        detail: message,
      });
    }
    return null;
  }

  shell.showItemInFolder(result.filePath);
  return result.filePath;
}
