/**
 * 图片资源处理 —— 把 markdown 里的本地图片资源转存到官方图床。
 *
 * 交付契约（与 MCP / 外部调用方约定一致）：
 *   - http(s) 地址：原样放行（尊重调用方自有图床，不增加官方图床压力）
 *   - data:image/* 内联 base64：解码 → 上传 → 回填永久地址
 *   - 本地路径：仅在 assetsDir 目录内查找 → 读文件 → 上传 → 回填
 *   - 解析不到 / 上传失败：保留原引用并收集 warning，不中断交付
 *
 * 是否真的上传由 options.upload 决定：
 *   - 交付路径（push_article / articles）传 true；
 *   - 纯预览的 HTTP /render 默认 false，避免"渲染看一眼"就在图床留下永久垃圾图。
 * 远程地址与开关无关，始终原样放行。
 */
import { createHash } from "node:crypto";
import { existsSync, readFileSync, realpathSync } from "node:fs";
import { basename, isAbsolute, relative, resolve, sep } from "node:path";

/** 官方图床上传端点（与 web 端 OfficialUploader 一致，可用环境变量覆盖） */
const UPLOAD_ENDPOINT =
  process.env.WEMD_UPLOAD_ENDPOINT ?? "https://api.wemd.app/upload";

/** 单张图片上限：官方图床限 10MB，本地提前拦掉避免无效上传 */
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

/** 单次上传超时：图床无响应时不至于把整个交付请求挂死 */
const UPLOAD_TIMEOUT_MS = 15000;

/** 上传结果缓存：内容指纹 → 永久地址，同一张图不重复上传 */
const uploadCache = new Map<string, string>();
/** 缓存条数上限，超出按插入顺序淘汰最旧 */
const MAX_CACHE_ENTRIES = 500;

/** markdown 图片语法 ![alt](src "title")；src 不吃空白，避免把 title 当成地址 */
function markdownImageRe(): RegExp {
  return /!\[([^\]]*)\]\(([^)\s]+)(\s+"[^"]*")?\)/g;
}

/** 原始 HTML 图片 <img src="...">，兼容单/双引号 */
function htmlImageRe(): RegExp {
  return /<img\b[^>]*?\ssrc=(["'])([^"']+)\1[^>]*>/gi;
}

export interface ResolveImagesOptions {
  /** 本地相对路径的基准目录 */
  assetsDir?: string;
  /**
   * 是否把本地 / base64 图片转存到官方图床，默认 true。
   * 交付路径必须为 true；纯预览（HTTP /render 默认）传 false。
   */
  upload?: boolean;
}

export interface ResolveImagesResult {
  /** 回填后的 markdown */
  markdown: string;
  /** 未成功转存的图片来源与原因（保留原引用，不中断） */
  warnings: string[];
}

function isRemote(src: string): boolean {
  return /^https?:\/\//i.test(src);
}

/** 由 data URI 的 media type 推断后缀：image/png → .png，image/jpeg → .jpg */
function extFromMime(mime: string): string {
  const sub = (mime.split("/")[1] ?? "png").toLowerCase();
  return `.${sub === "jpeg" ? "jpg" : sub}`;
}

/** 扩展名 → MIME：官方图床按 MIME 判断类型，Blob 不带类型会被判为「不支持的文件类型」 */
const MIME_BY_EXT: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  bmp: "image/bmp",
  svg: "image/svg+xml",
};

function mimeFromFilename(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  return MIME_BY_EXT[ext] ?? "application/octet-stream";
}

/** 图床明确拒绝（类型/大小不合法），重试没有意义 */
class UploadRejectedError extends Error {}

/** 真正发起上传：带超时，网络类失败重试一次 */
async function postToOfficial(
  bytes: Buffer,
  filename: string,
): Promise<string> {
  let lastErr: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const form = new FormData();
      form.append(
        "file",
        new Blob([bytes], { type: mimeFromFilename(filename) }),
        filename,
      );
      const res = await fetch(UPLOAD_ENDPOINT, {
        method: "POST",
        body: form,
        signal: AbortSignal.timeout(UPLOAD_TIMEOUT_MS),
      });
      const data = (await res.json().catch(() => ({}))) as {
        url?: string;
        error?: string;
      };
      if (!res.ok || !data.url) {
        throw new UploadRejectedError(
          data.error ?? `上传失败（HTTP ${res.status}）`,
        );
      }
      return data.url;
    } catch (err) {
      if (err instanceof UploadRejectedError) throw err;
      // 超时 / 网络中断：记下原因后重试一次
      lastErr = err;
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}

/** 内容指纹：同一张图（内容一致）复用上次的永久地址，避免重复上传 */
function contentKey(bytes: Buffer): string {
  return createHash("sha1").update(bytes).digest("hex");
}

/** 上传字节到官方图床，返回永久 URL；失败抛错由调用方收集成 warning */
async function uploadToOfficial(
  bytes: Buffer,
  filename: string,
): Promise<string> {
  if (bytes.byteLength > MAX_IMAGE_BYTES) {
    const mb = (bytes.byteLength / 1024 / 1024).toFixed(1);
    throw new Error(`图片超过 10MB 上限（${mb}MB）`);
  }
  const key = contentKey(bytes);
  const cached = uploadCache.get(key);
  if (cached) return cached;

  const url = await postToOfficial(bytes, filename);
  uploadCache.set(key, url);
  if (uploadCache.size > MAX_CACHE_ENTRIES) {
    const oldest = uploadCache.keys().next().value;
    if (oldest !== undefined) uploadCache.delete(oldest);
  }
  return url;
}

/** child 是否位于 parent 目录内（含 parent 自身），已按真实路径解析 */
function isInside(parent: string, child: string): boolean {
  const rel = relative(parent, child);
  return (
    rel === "" ||
    (rel !== ".." && !rel.startsWith(`..${sep}`) && !isAbsolute(rel))
  );
}

/**
 * 把本地图片定位成可读的真实路径。
 * 只允许读取 assetsDir 内的文件：`../` 逃逸与目录外的绝对路径一律拒绝，
 * 避免接口被用来读取（并上传）机器上的任意文件。
 */
function resolveLocalPath(src: string, assetsDir?: string): string {
  if (!assetsDir) {
    throw new Error("本地图片需要提供 assetsDir 才能定位");
  }
  if (!existsSync(assetsDir)) {
    throw new Error(`assetsDir 不存在：${assetsDir}`);
  }
  const baseDir = realpathSync(assetsDir);
  const candidate = isAbsolute(src) ? resolve(src) : resolve(baseDir, src);
  if (!existsSync(candidate)) {
    throw new Error(`图片文件不存在：${candidate}`);
  }
  const real = realpathSync(candidate);
  if (!isInside(baseDir, real)) {
    throw new Error(`图片超出 assetsDir 范围，已拒绝：${src}`);
  }
  return real;
}

/** 解析单个图片引用为永久地址；远程地址原样返回 */
async function resolveOne(
  src: string,
  options: ResolveImagesOptions,
): Promise<string> {
  if (isRemote(src)) return src;

  const dataMatch = src.match(/^data:(image\/[a-z0-9.+-]+);base64,(.+)$/i);
  if (dataMatch) {
    return uploadToOfficial(
      Buffer.from(dataMatch[2], "base64"),
      `inline${extFromMime(dataMatch[1])}`,
    );
  }

  const filePath = resolveLocalPath(src, options.assetsDir);
  return uploadToOfficial(readFileSync(filePath), basename(filePath));
}

/** 收集 markdown 图片与原始 HTML 图片的全部引用地址（去重） */
function collectImageSrcs(markdown: string): Set<string> {
  const srcs = new Set<string>();
  for (const m of markdown.matchAll(markdownImageRe())) srcs.add(m[2]);
  for (const m of markdown.matchAll(htmlImageRe())) srcs.add(m[2]);
  return srcs;
}

/** 告警里展示用的图片名，base64 只留头部，避免刷屏 */
function displaySrc(src: string): string {
  return src.startsWith("data:") ? `${src.slice(0, 24)}…` : src;
}

/**
 * 扫描 markdown 中的图片引用（markdown 语法 + 原始 HTML <img>），
 * 把本地资源转存官方图床并回填永久地址。重复引用只上传一次。
 * options.upload 为 false 时不转存，仅汇总提醒（预览模式）。
 */
export async function resolveImages(
  markdown: string,
  options: ResolveImagesOptions = {},
): Promise<ResolveImagesResult> {
  const allSrcs = [...collectImageSrcs(markdown)];

  // 预览模式：不产生永久上传，只提示调用方有本地图片没被处理
  if (options.upload === false) {
    const locals = allSrcs.filter((src) => !isRemote(src));
    const warnings = locals.length
      ? [
          `有 ${locals.length} 张本地/base64 图片未转存（当前为预览模式，` +
            `如需转存请传 uploadImages: true）：${locals
              .slice(0, 3)
              .map(displaySrc)
              .join("、")}${locals.length > 3 ? " 等" : ""}`,
        ]
      : [];
    return { markdown, warnings };
  }

  const resolved = new Map<string, string>();
  const warnings: string[] = [];
  for (const src of allSrcs) {
    try {
      resolved.set(src, await resolveOne(src, options));
    } catch (err) {
      warnings.push(
        `图片未转存 ${displaySrc(src)}：${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  let out = markdown.replace(
    markdownImageRe(),
    (full: string, alt: string, src: string, title?: string) => {
      const next = resolved.get(src);
      if (!next || next === src) return full;
      return `![${alt}](${next}${title ?? ""})`;
    },
  );
  out = out.replace(
    htmlImageRe(),
    (tag: string, _quote: string, src: string) => {
      const next = resolved.get(src);
      if (!next || next === src) return tag;
      // 只替换该标签的 src 值，其余属性原样保留
      return tag.replace(/\ssrc=(["'])[^"']*\1/i, (_m, q: string) => {
        return ` src=${q}${next}${q}`;
      });
    },
  );

  return { markdown: out, warnings };
}
