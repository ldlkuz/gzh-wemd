/**
 * server 打包脚本
 *
 * 用 esbuild 把入口 + core 源码 + 依赖打包成单文件 node ESM（dist/index.mjs）。
 * 需要一个小插件：core 里有 `import Token from "markdown-it/lib/token"` 的深导入，
 * 而 markdown-it v14 的 ESM 文件是 lib/token.mjs，exports 映射不会自动补扩展名；
 * esbuild 不像 Vite 会探测扩展名，故在此重定向到真实文件。
 */
import { build } from "esbuild";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = fileURLToPath(new URL("../..", import.meta.url)); // repo 根

/**
 * 定位 markdown-it 的 ESM token 文件。
 * 本仓库 .npmrc 为 node-linker=hoisted，CI 全新安装后依赖平铺在根 node_modules；
 * 本地若存在未被提升的旧结构，则回退到 packages/core/node_modules。按序探测取第一个存在的。
 */
function resolveMditToken() {
  const candidates = [
    path.join(root, "node_modules/markdown-it/lib/token.mjs"),
    path.join(root, "packages/core/node_modules/markdown-it/lib/token.mjs"),
  ];
  const hit = candidates.find((p) => existsSync(p));
  if (!hit) {
    throw new Error(
      `未找到 markdown-it/lib/token.mjs，已尝试：\n${candidates.join("\n")}`,
    );
  }
  return hit;
}
const mditToken = resolveMditToken();

await build({
  entryPoints: ["src/index.ts"],
  bundle: true,
  platform: "node",
  format: "esm",
  outfile: "dist/index.mjs",
  logLevel: "info",
  alias: {
    "@wemd/core": path.join(root, "packages/core/src/index.ts"),
  },
  // happy-dom 直接 bundle 进单文件：
  // 其依赖链里的 ws 用动态 require('events')，若一并打包会触发
  // "Dynamic require of events is not supported"，故将 ws 留在运行时解析。
  // 运行时（含打包进 exe 后）需保证 server 同层 node_modules/ws 可解析，
  // 见 electron-builder.json 的 extraResources 与 apps/electron/scripts/assemble-server-runtime.mjs。
  external: ["ws"],
  plugins: [
    {
      name: "mdit-deep-import-fix",
      setup(buildPlugin) {
        buildPlugin.onResolve({ filter: /^markdown-it\/lib\/token$/ }, () => ({
          path: mditToken,
        }));
      },
    },
  ],
});