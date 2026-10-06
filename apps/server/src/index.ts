/**
 * wemd 渲染服务 —— Tier A：纯渲染
 *
 * 让其他程序 / skill 通过 HTTP 调用：
 *   - GET  /health               健康检查（服务版本 / 工作区就绪状态）
 *   - GET  /themes               列主题
 *   - GET  /themes/:id/guide     该主题的手写组件手册（Markdown 文本；缺册返回 404）
 *   - POST /render               传 markdown → 返回可直接粘公众号的 HTML
 *   - POST /articles             把文章 markdown 写入程序工作区（可选 themeId 指定排版主题）
 *
 * 两个接口都会扫描 markdown 里的图片引用（markdown 语法与原始 HTML <img>）：
 *   - /articles（交付）始终把本地 / base64 图转存官方图床并回填永久地址；
 *   - /render 默认不转存（避免"渲染看一眼"就在图床留下永久垃圾图），需显式传 uploadImages: true。
 * http(s) 远程地址一律原样放行；本地图片需用 assetsDir 指明基准目录（只允许读该目录内的文件）。
 * 失败项保留原引用并通过 warnings 返回，不中断交付。
 *
 * HTTP 用 Node 内置 http，唯一的额外运行依赖是 happy-dom（core 内联样式需要 DOM）。
 * 渲染无状态，无需 LLM / 鉴权 / 配置；/articles 仅写工作区文件，不依赖外部服务。
 */
import { createServer } from "node:http";
import {
  existsSync,
  readFileSync,
  renameSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { Window } from "happy-dom";
import {
  renderWechatHtml,
  getBuiltInThemeList,
  getBuiltInThemeDefinition,
} from "@wemd/core";
import { resolveImages } from "./imageAssets";
import {
  buildArticleContent,
  resolveAvailableFilename,
  sanitizeFilename,
  timestampFilename,
} from "./articleFormat";

// core 的 processHtml 内联样式需要 DOM；Node 宿主无浏览器，用 happy-dom 自举全局 document
const window = new Window();
(globalThis as Record<string, unknown>).document = window.document;
(globalThis as Record<string, unknown>).HTMLElement = window.HTMLElement;

/** 监听主机/端口：开发默认 127.0.0.1:8787，可由环境变量覆盖（打包进 exe 后由主进程注入） */
const HOST = process.env.WEMD_HOST ?? "127.0.0.1";
const PORT = Number(process.env.WEMD_PORT ?? 8787);

/**
 * 手写手册目录解析：
 * - 优先 WEMD_GUIDE_DIR（打包进 exe 后由主进程指向 resources 下的主题手册目录，绝对路径）
 * - 开发模式回退到 monorepo 的 apps/web/public/theme-guides
 */
function resolveGuideDir(): string {
  const fromEnv = process.env.WEMD_GUIDE_DIR;
  if (fromEnv && existsSync(fromEnv)) return fromEnv;
  const repoRoot = join(
    dirname(fileURLToPath(import.meta.url)),
    "..",
    "..",
    "..",
  );
  return join(repoRoot, "apps", "web", "public", "theme-guides");
}
const GUIDE_DIR = resolveGuideDir();

/**
 * 程序当前工作区目录：主进程启动 server 时注入，
 * 供 POST /articles 把文章落盘到用户正在使用的工作区。
 * 未选工作区时为空字符串，此时 /articles 返回 409。
 */
const WORKSPACE_DIR = process.env.WEMD_WORKSPACE ?? "";

/**
 * 读取该主题的手写组件手册（apps/web/public/theme-guides/theme-ai-guide-<id>.md），
 * 与 web 端 rewriteAgent 共用同一份，找不到时返回 null。
 */
function loadHandwrittenGuide(themeId: string): string | null {
  const file = join(GUIDE_DIR, `theme-ai-guide-${themeId}.md`);
  if (!existsSync(file)) return null;
  return readFileSync(file, "utf-8");
}

function sendJson(
  res: import("node:http").ServerResponse,
  status: number,
  body: unknown,
): void {
  const data = JSON.stringify(body);
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "content-length": Buffer.byteLength(data),
  });
  res.end(data);
}

function sendText(
  res: import("node:http").ServerResponse,
  status: number,
  text: string,
  contentType = "text/plain; charset=utf-8",
): void {
  const data = Buffer.from(text, "utf-8");
  res.writeHead(status, {
    "content-type": contentType,
    "content-length": data.byteLength,
  });
  res.end(data);
}

/** 请求体上限：避免超大 body 占用内存 */
const MAX_BODY_BYTES = 5 * 1024 * 1024;

/** 请求体超限，由顶层 catch 转成 413 */
class PayloadTooLargeError extends Error {}

async function readBody(
  req: import("node:http").IncomingMessage,
): Promise<string> {
  const chunks: Buffer[] = [];
  let size = 0;
  let tooLarge = false;
  for await (const chunk of req) {
    // 超限后继续消费但丢弃：读完整包再回 413，避免连接被提前重置导致客户端拿不到响应
    if (tooLarge) continue;
    const buf = chunk as Buffer;
    size += buf.length;
    if (size > MAX_BODY_BYTES) {
      tooLarge = true;
      chunks.length = 0;
      continue;
    }
    chunks.push(buf);
  }
  if (tooLarge) throw new PayloadTooLargeError();
  return Buffer.concat(chunks).toString("utf-8");
}

/** 去掉可能存在的 UTF-8 BOM，容忍调用方直接读文件回传 */
function stripBom(text: string): string {
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
}

/** 请求日志时间戳：HH:MM:SS */
function clock(): string {
  const d = new Date();
  const p = (n: number): string => String(n).padStart(2, "0");
  return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", "http://localhost");
  const path = url.pathname;
  const startedAt = Date.now();
  /** 请求失败时的错误摘要，供该行日志附带 */
  let errorNote: string | undefined;

  // 每个请求结束记一行：时间 方法 路径 状态码 耗时（失败附错误摘要），
  // 供界面「服务日志」排查 AI / 外部程序调用情况。
  res.on("finish", () => {
    const ms = Date.now() - startedAt;
    // eslint-disable-next-line no-console
    console.log(
      `[${clock()}] ${req.method} ${path} ${res.statusCode} ${ms}ms${errorNote ? ` — ${errorNote}` : ""}`,
    );
  });

  try {
    // CORS，方便浏览器 / 其他网页直接 fetch
    res.setHeader("access-control-allow-origin", "*");
    res.setHeader(
      "access-control-allow-methods",
      "GET, POST, OPTIONS",
    );
    res.setHeader("access-control-allow-headers", "content-type");
    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }

    // GET /health —— 供外部程序 / skill 探测服务是否可用
    if (req.method === "GET" && path === "/health") {
      sendJson(res, 200, {
        ok: true,
        service: "wemd-render",
        version: process.env.WEMD_VERSION ?? null,
        workspace: WORKSPACE_DIR || null,
        workspaceReady: Boolean(WORKSPACE_DIR) && existsSync(WORKSPACE_DIR),
      });
      return;
    }

    // GET /themes
    if (req.method === "GET" && path === "/themes") {
      sendJson(res, 200, { themes: getBuiltInThemeList() });
      return;
    }

    // GET /themes/:id/guide
    const guideMatch = path.match(/^\/themes\/([a-z0-9-]+)\/guide$/);
    if (req.method === "GET" && guideMatch) {
      const id = guideMatch[1];
      if (!getBuiltInThemeDefinition(id)) {
        sendJson(res, 404, { error: `未知主题：${id}` });
        return;
      }
      const guide = loadHandwrittenGuide(id);
      if (!guide) {
        sendJson(res, 404, { error: `主题 ${id} 缺少手写组件手册（guide）` });
        return;
      }
      sendText(res, 200, guide, "text/markdown; charset=utf-8");
      return;
    }

    // POST /render
    if (req.method === "POST" && path === "/render") {
      const body = await readBody(req);
      let payload: {
        markdown?: string;
        themeId?: string;
        assetsDir?: string;
        uploadImages?: boolean;
      };
      try {
        payload = JSON.parse(stripBom(body) || "{}");
      } catch {
        sendJson(res, 400, {
          error:
            "请求体必须是 JSON：{ markdown, themeId?, assetsDir?, uploadImages? }",
        });
        return;
      }
      if (!payload.markdown || typeof payload.markdown !== "string") {
        sendJson(res, 400, { error: "缺少字符串字段 markdown" });
        return;
      }
      // /render 默认只预览、不产生永久上传：本地图片原样保留并在 warnings 里提示；
      // 需要转存时显式传 uploadImages: true（远程地址始终原样放行）。
      const { markdown, warnings } = await resolveImages(payload.markdown, {
        assetsDir: payload.assetsDir,
        upload: payload.uploadImages === true,
      });
      const { html, themeId } = renderWechatHtml(markdown, {
        themeId: payload.themeId,
      });
      sendJson(res, 200, {
        html,
        themeId,
        ...(warnings.length ? { warnings } : {}),
      });
      return;
    }

    // POST /articles —— 把文章 markdown 写入程序工作区
    // 程序（Electron）监听工作区目录，文件一落盘即自动刷新侧边栏。
    if (req.method === "POST" && path === "/articles") {
      const body = await readBody(req);
      let payload: {
        markdown?: string;
        filename?: string;
        overwrite?: boolean;
        conflict?: string;
        themeId?: string;
        themeName?: string;
        title?: string;
        author?: string;
        assetsDir?: string;
      };
      try {
        payload = JSON.parse(stripBom(body) || "{}");
      } catch {
        sendJson(res, 400, {
          error:
            "请求体必须是 JSON：{ markdown, filename?, overwrite?, conflict?, themeId?, title?, author?, assetsDir? }",
        });
        return;
      }
      if (!payload.markdown || typeof payload.markdown !== "string") {
        sendJson(res, 400, { error: "缺少字符串字段 markdown" });
        return;
      }

      // 可选指定排版主题：写进 frontmatter，程序打开时自动应用。
      // 未知主题不报错（以支持导入的自定义主题），但在返回体给出 warning。
      let themeName = payload.themeName;
      let themeWarning: string | undefined;
      if (payload.themeId) {
        const theme = getBuiltInThemeList().find(
          (item) => item.id === payload.themeId,
        );
        if (theme) {
          themeName = theme.name;
        } else if (!themeName) {
          themeWarning = `未知主题 ${payload.themeId}，已原样写入；程序若不存在该主题将保持默认主题`;
        }
      }

      if (!WORKSPACE_DIR || !existsSync(WORKSPACE_DIR)) {
        sendJson(res, 409, {
          error: "程序尚未选择工作区，或工作区目录不存在",
        });
        return;
      }

      let filename = payload.filename
        ? sanitizeFilename(payload.filename)
        : timestampFilename();
      let target = join(WORKSPACE_DIR, filename);

      if (existsSync(target) && !payload.overwrite) {
        if (payload.conflict === "rename") {
          // 自动改名，避免 skill 用固定文件名时反复失败
          filename = resolveAvailableFilename(WORKSPACE_DIR, filename);
          target = join(WORKSPACE_DIR, filename);
        } else {
          sendJson(res, 409, {
            error: `文件已存在：${filename}（可传 overwrite: true 覆盖，或 conflict: "rename" 自动改名）`,
          });
          return;
        }
      }

      // 交付路径：始终转存本地 / base64 图片后再写入工作区
      const { markdown, warnings: imageWarnings } = await resolveImages(
        payload.markdown,
        { assetsDir: payload.assetsDir, upload: true },
      );

      const content = buildArticleContent(markdown, {
        themeId: payload.themeId,
        themeName,
        title: payload.title,
        author: payload.author,
      });
      // 原子写入：先写同目录临时文件再替换，避免程序在写入中途读到半个文件
      const tmpPath = `${target}.${process.pid}.${Date.now()}.tmp`;
      try {
        writeFileSync(tmpPath, content, "utf-8");
        renameSync(tmpPath, target);
      } catch {
        // 替换失败（如目标被占用）→ 清理临时文件并回退为直接写入
        try {
          unlinkSync(tmpPath);
        } catch {
          /* 临时文件可能不存在，忽略 */
        }
        writeFileSync(target, content, "utf-8");
      }
      // 通知宿主进程（Electron 主进程）新文章已写入，用于自动在编辑器打开。
      // 独立运行时这行只进日志，无副作用。
      // eslint-disable-next-line no-console
      console.log(`WEMD_ARTICLE_WRITTEN:${target}`);
      sendJson(res, 200, {
        ok: true,
        filename,
        path: target,
        themeId: payload.themeId ?? null,
        ...(themeWarning ? { warning: themeWarning } : {}),
        ...(imageWarnings.length ? { warnings: imageWarnings } : {}),
      });
      return;
    }

    sendJson(res, 404, { error: `未找到路由：${path}` });
  } catch (err) {
    if (err instanceof PayloadTooLargeError) {
      errorNote =
        "请求体过大，上限 5MB；若正文内嵌 base64 图片，建议改为传 assetsDir 引用本地图片";
      sendJson(res, 413, { error: errorNote });
      return;
    }
    errorNote = err instanceof Error ? err.message : String(err);
    sendJson(res, 500, { error: errorNote });
  }
});

server.listen(PORT, HOST, () => {
  // eslint-disable-next-line no-console
  console.log(
    `wemd api ready: http://${HOST}:${PORT} (guideDir=${GUIDE_DIR})`,
  );
});