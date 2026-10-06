#!/usr/bin/env node
/**
 * wemd-push —— 把 markdown 文章推送到 WeMD 桌面版的当前工作区
 *
 * 用法：
 *   node scripts/wemd-push.mjs article.md --theme sunset-film
 *   cat article.md | node scripts/wemd-push.mjs --theme sunset-film
 *   node scripts/wemd-push.mjs --health
 *
 * 选项：
 *   --theme <id>       排版主题 id（如 sunset-film）
 *   --title <text>     发布标题
 *   --author <text>    作者
 *   --name <filename>  保存的文件名（默认按时间生成）
 *   --overwrite        同名时覆盖
 *   --rename           同名时自动改名（标题-1.md）
 *   --host <addr>      服务地址（默认 127.0.0.1）
 *   --port <n>         服务端口（默认 8787）
 *   --health           仅探测服务状态，不推送
 *   --json             以 JSON 输出结果
 *   -h, --help         显示帮助
 *
 * 退出码：0 成功 / 1 参数或输入错误 / 2 服务不可达 / 3 工作区未就绪 / 4 服务端拒绝
 *
 * 依赖：Node 18+（内置 fetch），无需安装任何包。
 */
import { readFileSync } from "node:fs";
import process from "node:process";

const DEFAULT_HOST = "127.0.0.1";
const DEFAULT_PORT = 8787;

function printHelp() {
  console.log(
    [
      "wemd-push —— 把 markdown 文章推送到 WeMD 桌面版的当前工作区",
      "",
      "用法：",
      "  node scripts/wemd-push.mjs <file.md> [选项]",
      "  cat article.md | node scripts/wemd-push.mjs [选项]",
      "",
      "选项：",
      "  --theme <id>       排版主题 id（如 sunset-film）",
      "  --title <text>     发布标题",
      "  --author <text>    作者",
      "  --name <filename>  保存的文件名（默认按时间生成）",
      "  --overwrite        同名时覆盖",
      "  --rename           同名时自动改名（标题-1.md）",
      "  --host <addr>      服务地址（默认 127.0.0.1）",
      "  --port <n>         服务端口（默认 8787）",
      "  --health           仅探测服务状态，不推送",
      "  --json             以 JSON 输出结果",
      "  -h, --help         显示本帮助",
    ].join("\n"),
  );
}

function parseArgs(argv) {
  const opts = { host: DEFAULT_HOST, port: DEFAULT_PORT, json: false };
  const positional = [];

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    switch (arg) {
      case "--theme":
        opts.theme = argv[++i];
        break;
      case "--title":
        opts.title = argv[++i];
        break;
      case "--author":
        opts.author = argv[++i];
        break;
      case "--name":
        opts.name = argv[++i];
        break;
      case "--host":
        opts.host = argv[++i];
        break;
      case "--port":
        opts.port = Number(argv[++i]);
        break;
      case "--overwrite":
        opts.overwrite = true;
        break;
      case "--rename":
        opts.rename = true;
        break;
      case "--health":
        opts.health = true;
        break;
      case "--json":
        opts.json = true;
        break;
      case "-h":
      case "--help":
        opts.help = true;
        break;
      default:
        if (arg.startsWith("-")) throw new Error(`未知参数：${arg}`);
        positional.push(arg);
    }
  }

  if (positional.length > 0) opts.file = positional[0];
  return opts;
}

async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  return Buffer.concat(chunks).toString("utf-8");
}

async function main() {
  let opts;
  try {
    opts = parseArgs(process.argv.slice(2));
  } catch (error) {
    console.error(`参数错误：${error.message}\n`);
    printHelp();
    process.exit(1);
  }

  if (opts.help) {
    printHelp();
    process.exit(0);
  }

  const base = `http://${opts.host}:${opts.port}`;

  // 1) 先探测服务，给出明确的失败指引而不是裸的连接错误
  let health;
  try {
    const res = await fetch(`${base}/health`);
    health = await res.json();
  } catch {
    console.error(`✗ 无法连接 WeMD 接口（${base}）`);
    console.error(
      "  请确认：1) WeMD 桌面版已启动  2) 「WeMD 接口」处于运行中",
    );
    process.exit(2);
  }

  if (opts.health) {
    if (opts.json) {
      console.log(JSON.stringify(health, null, 2));
    } else {
      console.log(
        `✓ 服务可用：${base}\n  版本 ${health.version ?? "未知"}｜工作区 ${
          health.workspaceReady ? "就绪" : "未就绪"
        }（${health.workspace ?? "未设置"}）`,
      );
    }
    process.exit(health.workspaceReady ? 0 : 3);
  }

  if (!health.workspaceReady) {
    console.error("✗ 程序工作区未就绪，无法写入");
    console.error(`  当前工作区：${health.workspace ?? "（未设置）"}`);
    console.error("  请在 WeMD 里选择工作区，或等待默认工作区就绪");
    process.exit(3);
  }

  // 2) 取正文：文件 > 管道
  let markdown;
  if (opts.file) {
    try {
      markdown = readFileSync(opts.file, "utf-8");
    } catch {
      console.error(`✗ 读取文件失败：${opts.file}`);
      process.exit(1);
    }
  } else if (!process.stdin.isTTY) {
    markdown = await readStdin();
  } else {
    console.error("✗ 没有输入内容：请传入文件路径，或用管道输入 markdown\n");
    printHelp();
    process.exit(1);
  }

  markdown = markdown.replace(/^\uFEFF/, "");
  if (!markdown.trim()) {
    console.error("✗ 文章内容为空");
    process.exit(1);
  }

  // 3) 推送
  const body = { markdown };
  if (opts.name) body.filename = opts.name;
  if (opts.theme) body.themeId = opts.theme;
  if (opts.title) body.title = opts.title;
  if (opts.author) body.author = opts.author;
  if (opts.overwrite) body.overwrite = true;
  if (opts.rename) body.conflict = "rename";

  let res;
  let data;
  try {
    res = await fetch(`${base}/articles`, {
      method: "POST",
      headers: { "content-type": "application/json; charset=utf-8" },
      body: JSON.stringify(body),
    });
    data = await res.json().catch(() => ({}));
  } catch (error) {
    console.error(`✗ 推送失败：${error.message}`);
    process.exit(4);
  }

  if (!res.ok) {
    if (opts.json) {
      console.log(
        JSON.stringify({ ok: false, status: res.status, ...data }, null, 2),
      );
    } else {
      console.error(
        `✗ 推送失败（HTTP ${res.status}）：${data.error ?? "未知错误"}`,
      );
    }
    process.exit(4);
  }

  if (opts.json) {
    console.log(JSON.stringify(data, null, 2));
  } else {
    console.log(`✓ 已推送：${data.filename}`);
    console.log(`  路径：${data.path}`);
    if (data.themeId) console.log(`  主题：${data.themeId}`);
    if (data.warning) console.warn(`  ⚠ ${data.warning}`);
  }
}

main();
