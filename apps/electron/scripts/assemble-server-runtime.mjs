/**
 * 组装 Render 渲染服务的打包运行时。
 *
 * 在 electron-builder 打包前调用，把以下内容影射到 electron-builder.json
 * 的 extraResources 来源目录 apps/electron/.server-runtime/：
 *
 *   .server-runtime/server-dist/
 *     index.mjs                      ← apps/server/dist 构建产物（单文件 ESM）
 *     node_modules/ws/               ← 运行时仅剩的外部依赖（happy-dom 已 bundle 进单文件，
 *                                       其依赖链中 ws 的动态 require('events') 无法亲入单文件，
 *                                       故留在 server 同层 node_modules 由 Node 解析）
 *   .server-runtime/theme-guides/    ← 手写主题手册（apps/web/public/theme-guides）
 *
 * server 侧 resolveGuideDir() 会优先读 WEMD_GUIDE_DIR（主进程指向打包后的 theme-guides）。
 */
import { spawnSync } from "node:child_process";
import { cpSync, copyFileSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// apps/electron/scripts -> apps/electron
const electronRoot = path.resolve(__dirname, "..");
// apps/electron -> repo 根
const repoRoot = path.resolve(electronRoot, "../..");
// 组装输出目录（electron-builder.json 里 extraResources 的 from 目录）
const runtimeRoot = path.join(electronRoot, ".server-runtime");
const serverDist = path.join(runtimeRoot, "server-dist");
const serverDistNodeModules = path.join(serverDist, "node_modules");
const themeGuidesOut = path.join(runtimeRoot, "theme-guides");

const serverBuildScript = path.join(repoRoot, "apps/server/build.mjs");
const serverDistSource = path.join(repoRoot, "apps/server/dist");
const themeGuidesSource = path.join(repoRoot, "apps/web/public/theme-guides");

// 用 Node 的模块解析定位 ws 真实包目录（跟随 pnpm 软链解析到 store）
const require = createRequire(import.meta.url);
const wsPkgJson = require.resolve("ws/package.json", {
  paths: [path.join(repoRoot, "apps/server")],
});
const wsSource = path.dirname(wsPkgJson);

/** 先确保 server 已构建 */
function ensureServerBuilt() {
  if (!existsSync(path.join(serverDistSource, "index.mjs"))) {
    console.log("[assemble] 未找到 server 产物，先构建 apps/server ...");
    const r = spawnSync(process.execPath, [serverBuildScript], {
      cwd: path.dirname(serverBuildScript),
      stdio: "inherit",
    });
    if (r.status !== 0) {
      console.error("[assemble] apps/server 构建失败");
      process.exit(r.status ?? 1);
    }
  }
}

function stage() {
  ensureServerBuilt();

  // 清理旧产物，避免残留
  rmSync(runtimeRoot, { recursive: true, force: true });
  mkdirSync(serverDistNodeModules, { recursive: true });
  mkdirSync(themeGuidesOut, { recursive: true });

  // 1. server 单文件入口
  copyFileSync(
    path.join(serverDistSource, "index.mjs"),
    path.join(serverDist, "index.mjs"),
  );

  // 2. 运行时唯一外部依赖 ws（happy-dom 已 bundle）
  if (!existsSync(wsSource)) {
    console.error(`[assemble] 无法解析 ws 包，期望所在：${wsSource}`);
    process.exit(1);
  }
  cpSync(wsSource, path.join(serverDistNodeModules, "ws"), {
    recursive: true,
    dereference: true,
  });

  // 3. 手写主题手册
  if (!existsSync(themeGuidesSource)) {
    console.error(`[assemble] 未找到手册目录：${themeGuidesSource}`);
    process.exit(1);
  }
  cpSync(themeGuidesSource, themeGuidesOut, { recursive: true, dereference: true });

  console.log("[assemble] 渲染服务运行时已组装：", serverDist);
}

stage();