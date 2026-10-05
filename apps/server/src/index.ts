/**
 * wemd 渲染服务 —— Tier A：纯渲染
 *
 * 让其他程序 / skill 通过 HTTP 调用：
 *   - GET  /themes               列主题
 *   - GET  /themes/:id/guide     该主题的手写组件手册（Markdown 文本；缺册返回 404）
 *   - GET  /themes/:id/sample    该主题的示例 Markdown（getComponentSampleMarkdown）
 *   - POST /render               传 markdown → 返回可直接粘公众号的 HTML
 *
 * HTTP 用 Node 内置 http，唯一的额外运行依赖是 happy-dom（core 内联样式需要 DOM）。
 * 纯函数无状态，无需 LLM / 鉴权 / 配置。
 */
import { createServer } from "node:http";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { Window } from "happy-dom";
import {
  renderWechatHtml,
  getBuiltInThemeList,
  getBuiltInThemeDefinition,
  getComponentSampleMarkdown,
} from "@wemd/core";

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

async function readBody(req: import("node:http").IncomingMessage): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  return Buffer.concat(chunks).toString("utf-8");
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", "http://localhost");
  const path = url.pathname;

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

    // GET /themes/:id/sample/:component（单组件示例）
    const sampleMatch = path.match(
      /^\/themes\/([a-z0-9-]+)\/sample\/([a-z0-9-]+)$/,
    );
    if (req.method === "GET" && sampleMatch) {
      const id = sampleMatch[1];
      const componentId = sampleMatch[2];
      if (!getBuiltInThemeDefinition(id)) {
        sendJson(res, 404, { error: `未知主题：${id}` });
        return;
      }
      const sample = getComponentSampleMarkdown(id, componentId);
      if (!sample) {
        sendJson(res, 404, { error: `无示例组件：${componentId}` });
        return;
      }
      sendText(
        res,
        200,
        sample,
        "text/markdown; charset=utf-8",
      );
      return;
    }

    // POST /render
    if (req.method === "POST" && path === "/render") {
      const body = await readBody(req);
      let payload: { markdown?: string; themeId?: string };
      try {
        payload = JSON.parse(body || "{}");
      } catch {
        sendJson(res, 400, { error: "请求体必须是 JSON：{ markdown, themeId? }" });
        return;
      }
      if (!payload.markdown || typeof payload.markdown !== "string") {
        sendJson(res, 400, { error: "缺少字符串字段 markdown" });
        return;
      }
      const { html, themeId } = renderWechatHtml(payload.markdown, {
        themeId: payload.themeId,
      });
      sendJson(res, 200, { html, themeId });
      return;
    }

    sendJson(res, 404, { error: `未找到路由：${path}` });
  } catch (err) {
    sendJson(res, 500, {
      error: err instanceof Error ? err.message : String(err),
    });
  }
});

server.listen(PORT, HOST, () => {
  // eslint-disable-next-line no-console
  console.log(
    `wemd render server ready: http://${HOST}:${PORT} (guideDir=${GUIDE_DIR})`,
  );
});