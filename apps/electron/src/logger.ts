import { app } from 'electron';
import log from 'electron-log/main';
import * as path from 'path';

/** 敏感键名：命中后整值替换为 *** */
const SENSITIVE_KEY =
  /^(authorization|api[-_]?key|apikey|access[-_]?key|access[-_]?token|secret([-_]?access)?[-_]?key|secret|password|token|bearer|credential)$/i;

/** 值内的敏感字符串模式：命中的片段替换掉 */
const SENSITIVE_TEXT: Array<[RegExp, string]> = [
  // OpenAI 风格密钥
  [/sk-[A-Za-z0-9_-]{6,}/g, 'sk-***'],
  // Bearer token
  [/(bearer\s+)[A-Za-z0-9._~+/-]{6,}=*/gi, '$1***'],
  // URL 查询串里的签名/密钥参数
  [/([?&](?:key|token|secret|signature|accesskeyid|x-amz-signature)=)[^&\s"']+/gi, '$1***'],
];

function scrubText(text: string): string {
  let out = text;
  for (const [pattern, replacement] of SENSITIVE_TEXT) {
    out = out.replace(pattern, replacement);
  }
  return out;
}

/**
 * 递归脱敏：日志会随诊断包交给用户/维护者，AI 密钥与图床密钥绝不能进去。
 * 深度超过 3 层直接截断，避免把整个对象图打进去。
 */
function scrubValue(value: unknown, depth = 0): unknown {
  if (typeof value === 'string') return scrubText(value);
  if (value instanceof Error) {
    return {
      name: value.name,
      message: scrubText(value.message),
      stack: scrubText(value.stack ?? ''),
    };
  }
  if (value === null || typeof value !== 'object') return value;
  if (depth >= 3) return '[深度截断]';
  if (Array.isArray(value)) {
    return value.map((item) => scrubValue(item, depth + 1));
  }
  const result: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
    result[key] = SENSITIVE_KEY.test(key) ? '***' : scrubValue(item, depth + 1);
  }
  return result;
}

let initialized = false;

/** 日志目录（userData/logs） */
export function getLogDir(): string {
  return path.join(app.getPath('userData'), 'logs');
}

/**
 * 初始化日志：
 * - 落盘到 userData/logs/main.log，单文件 5MB 后轮转为 main.old.log
 * - 所有写入先过脱敏钩子（AI / 图床密钥不进日志）
 * - 捕获主进程未处理异常与 Promise 拒绝
 * - 接管 console.*，让代码里已有的 console.error 等调用一并落盘
 */
export function initLogger(): void {
  if (initialized) return;
  initialized = true;

  log.transports.file.resolvePathFn = () => path.join(getLogDir(), 'main.log');
  log.transports.file.maxSize = 5 * 1024 * 1024;
  log.transports.file.level = 'info';
  // 打包后终端没人看，控制台只留 warn 以上；开发时全开
  log.transports.console.level = app.isPackaged ? 'warn' : 'debug';

  log.hooks.push((message) => {
    message.data = message.data.map((value) => scrubValue(value));
    return message;
  });

  // showDialog 关掉：未处理的 Promise 拒绝不该弹系统错误框打扰用户
  log.errorHandler.startCatching({ showDialog: false });

  Object.assign(console, log.functions);

  log.info('[logger] 日志初始化完成', {
    logDir: getLogDir(),
    version: app.getVersion(),
    packaged: app.isPackaged,
  });
}

/** 读取全部日志文件（含轮转后的旧文件），只取尾部若干行避免诊断包过大 */
export function readRecentLogs(
  maxLinesPerFile = 3000,
): Array<{ path: string; text: string }> {
  try {
    return log.transports.file.readAllLogs().map(({ path: filePath, lines }) => ({
      path: filePath,
      text: lines.slice(-maxLinesPerFile).join('\n'),
    }));
  } catch (error) {
    return [
      {
        path: '(读取失败)',
        text: error instanceof Error ? error.message : String(error),
      },
    ];
  }
}

export default log;
