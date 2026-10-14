/**
 * WeMD MCP Server —— 把本机 WeMD 渲染服务包装成 MCP 工具
 *
 * 设计：**瘦代理**。本进程不实现任何排版逻辑，只把 MCP 工具调用转发到
 * WeMD 桌面版已在运行的本地服务（默认 http://127.0.0.1:8787）。
 * 这样主题与渲染规则只需在 WeMD 侧维护一次，所有 MCP 客户端自动同步。
 *
 * 重要：stdio 是 MCP 协议通道，**日志一律走 stderr**，否则会污染协议。
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { text, withHtmlNotes, summarizeCheck } from "./format";

const HOST = process.env.WEMD_HOST ?? "127.0.0.1";
const PORT = Number(process.env.WEMD_PORT ?? 8787);
const BASE = `http://${HOST}:${PORT}`;

/**
 * 单次请求超时（毫秒）。服务端转存图片时单张上限 15s、网络类失败还会重试一次，
 * 多图串行处理，故给足余量；可用 WEMD_TIMEOUT_MS 覆盖。
 * 没有超时的话，服务端一旦卡住，工具调用会一直挂着不返回，AI 侧只能干等。
 */
const REQUEST_TIMEOUT_MS = Number(process.env.WEMD_TIMEOUT_MS ?? 120_000);

/** 日志走 stderr，避免污染 stdio 协议通道 */
function log(...args: unknown[]): void {
  console.error("[wemd-mcp]", ...args);
}

/** 发起请求；连接失败 / 超时翻译成对 AI 有指导意义的错误 */
async function fetchWemd(path: string, init?: RequestInit): Promise<Response> {
  try {
    return await fetch(`${BASE}${path}`, {
      ...init,
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (err) {
    if (err instanceof Error && err.name === "TimeoutError") {
      throw new Error(
        `WeMD 接口响应超时（超过 ${Math.round(REQUEST_TIMEOUT_MS / 1000)}s，${BASE}）。` +
          `正文含多张本地图片时转存耗时较长，可稍后重试或减少图片数量。`,
      );
    }
    throw new Error(
      `无法连接 WeMD 接口（${BASE}）。请确认：1) WeMD 桌面版已启动；2) 工具栏「WeMD 接口」处于运行中。`,
    );
  }
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetchWemd(path, init);
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    throw new Error(
      `WeMD 接口返回 ${res.status}：${data.error ?? JSON.stringify(data)}`,
    );
  }
  return data as T;
}

async function requestText(path: string): Promise<string> {
  const res = await fetchWemd(path);
  const body = await res.text();
  if (!res.ok) throw new Error(`WeMD 接口返回 ${res.status}：${body}`);
  return body;
}

/** 版本号由构建脚本从 package.json 注入（见 build.mjs 的 define），避免与包版本漂移 */
declare const __WEMD_MCP_VERSION__: string;

const server = new McpServer(
  { name: "wemd", version: __WEMD_MCP_VERSION__ },
  {
    instructions:
      "WeMD 是本地公众号排版工具。典型流程：先用 list_themes 挑主题，再用 get_theme_guide 取该主题的组件语法手册，" +
      "按手册书写 markdown（原生语法直接写，专用组件用 ::: 包裹）；" +
      "交付前可用 check_markdown 自查组件有没有被正确识别，最后用 push_article 把成稿交付给 WeMD（程序会自动打开并套用主题）。" +
      "AI 看不到渲染效果，版式以用户在 WeMD 预览里看到的为准。" +
      "**交付失败要如实上报**：若 push_article 报「无法连接 WeMD 接口」，把错误原文告诉用户、请他打开 WeMD 并确认「WeMD 接口」已开启后重试一次；不要改用自己写 .md 文件的方式绕过——那会让用户看不出真实原因。" +
      "若正文含本地图片：把 markdown 与图片放在同一目录，并在调用 push_article 时用 assetsDir 传该目录绝对路径，" +
      "WeMD 会自动把本地图片转存为永久图床地址（已有的 http(s) 图片地址会被原样保留，无需处理）。" +
      "所有工具都依赖 WeMD 桌面版正在运行且「WeMD 接口」已开启。",
  },
);

server.registerTool(
  "list_themes",
  {
    title: "列出 WeMD 主题",
    description:
      "列出 WeMD 当前可用的排版主题（id / 名称 / 描述）。先在这里挑主题，再取对应手册。",
    inputSchema: {},
    annotations: {
      readOnlyHint: true,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  async () => {
    const data = await requestJson("/themes");
    return text(
      `${JSON.stringify(data, null, 2)}\n\n下一步：调 get_theme_guide(themeId) 取该主题的组件语法手册，按手册书写 markdown。`,
    );
  },
);

server.registerTool(
  "get_theme_guide",
  {
    title: "获取主题组件语法手册",
    description:
      "返回指定主题的组件语法手册（Markdown）。**写正文前必须先取手册**：该主题专属组件与全部可用组件的正确写法都在里面，照抄示例才能得到正确排版。" +
      "**未先取手册就凭记忆写 `:::` 组件语法，排版必错**——组件名或槽位结构与该主题不符时，那一块会被当普通文本原样输出。" +
      "写完可用 check_markdown 自查组件有没有被识别。",
    inputSchema: {
      themeId: z.string().describe("主题 id，如 sunset-film"),
    },
    annotations: {
      readOnlyHint: true,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  async ({ themeId }) => text(await requestText(`/themes/${themeId}/guide`)),
);

server.registerTool(
  "check_markdown",
  {
    title: "检查排版结果（自检 / 排障）",
    description:
      "检查一段 markdown 在当前主题下**实际渲染成了什么**，默认只返回诊断摘要：实际生效的主题 id、" +
      "识别到的组件、**未被识别的 ::: 组件名**、HTML 大小、图片提醒。" +
      "**交付前建议先自查**：手册说某个组件存在 ≠ 它真的被识别——这里会直接点名你写的 ::: 块有没有被渲染成组件" +
      "（未被识别的会被当普通文本输出，粘到公众号里就是一行裸文本）。" +
      "本工具只做检查：不写入程序、不转存图片（不会在图床留下垃圾图）。正式交付请用 push_article。" +
      "确实需要整篇 HTML 时才传 returnHtml: true（长文几百 KB，慎用）。",
    inputSchema: {
      markdown: z.string().describe("要检查的 markdown 正文"),
      themeId: z.string().optional().describe("排版主题 id，默认 default"),
      returnHtml: z
        .boolean()
        .optional()
        .describe(
          "是否在摘要之后附上完整 HTML，默认 false（全文可能几百 KB，只在确实需要时开启）",
        ),
    },
    annotations: {
      // 只渲染并返回诊断信息：不写文件、不转存图片
      readOnlyHint: true,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  async ({ markdown, themeId, returnHtml }) => {
    const data = await requestJson<{
      html: string;
      themeId?: string;
      warnings?: string[];
    }>("/render", {
      method: "POST",
      headers: { "content-type": "application/json; charset=utf-8" },
      // 只做检查：固定不转存图片，避免"检查一下"就在图床留下永久垃圾图
      body: JSON.stringify({ markdown, themeId, uploadImages: false }),
    });
    const summary = summarizeCheck({
      markdown,
      html: data.html,
      themeId: data.themeId ?? themeId,
      warnings: data.warnings,
    });
    if (!returnHtml) return text(summary);
    return text(
      `${summary}\n\n--- 完整 HTML ---\n${withHtmlNotes(data.html, {
        themeId: data.themeId,
        warnings: data.warnings,
      })}`,
    );
  },
);

server.registerTool(
  "push_article",
  {
    title: "推送文章到 WeMD",
    description:
      "把 markdown 文章写入 WeMD 的当前工作区，程序会自动刷新并在编辑器打开它，主题随文章保存。**这是把成稿交付给用户的推荐方式。**" +
      "若正文含本地图片，传 assetsDir（markdown 与图片所在目录的绝对路径），本地图片会自动转存为永久图床地址；已有的 http(s) 图片地址原样保留。" +
      "**调用报「无法连接 WeMD 接口」时**：把错误原文告诉用户，请他确认 WeMD 与「WeMD 接口」都在运行，然后**重试一次**——不要改用写文件的方式绕过（那会把真实原因掩盖掉）。",
    inputSchema: {
      markdown: z.string().describe("文章 markdown 正文"),
      themeId: z.string().optional().describe("排版主题 id"),
      title: z.string().optional().describe("发布标题"),
      author: z.string().optional().describe("作者"),
      themeName: z
        .string()
        .optional()
        .describe(
          "主题显示名；使用导入的自定义主题时随 themeId 一并传入（内置主题无需传，服务端会自动补）",
        ),
      filename: z
        .string()
        .optional()
        .describe("保存的文件名，不传则按时间自动命名"),
      overwrite: z.boolean().optional().describe("同名文件是否覆盖"),
      conflict: z
        .enum(["fail", "rename"])
        .optional()
        .describe(
          '同名文件的处理方式：默认 "fail"（返回错误，需改文件名重试）；"rename" 自动加序号（标题-1.md），用固定文件名重复推送时建议传 "rename"',
        ),
      assetsDir: z
        .string()
        .optional()
        .describe(
          "图片资源目录绝对路径：正文里有本地图片时传，用于把本地图片转存为永久地址",
        ),
    },
    annotations: {
      // 会写入工作区文件（并可能转存图片），非只读、非幂等
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: true,
    },
  },
  async ({
    markdown,
    themeId,
    title,
    author,
    themeName,
    filename,
    overwrite,
    conflict,
    assetsDir,
  }) => {
    const data = await requestJson<{ filename?: string; path?: string }>(
      "/articles",
      {
        method: "POST",
        headers: { "content-type": "application/json; charset=utf-8" },
        body: JSON.stringify({
          markdown,
          themeId,
          title,
          author,
          themeName,
          filename,
          overwrite,
          conflict,
          assetsDir,
        }),
      },
    );
    const where = data.path ? `：${data.path}` : "";
    return text(
      `${JSON.stringify(data, null, 2)}\n\n程序已刷新并在编辑器中打开该文章${where}——版式请以用户在 WeMD 里看到的预览为准（AI 看不到渲染效果）。`,
    );
  },
);

const transport = new StdioServerTransport();
await server.connect(transport);
log(`已就绪，转发目标 ${BASE}`);
