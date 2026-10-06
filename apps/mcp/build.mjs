/**
 * MCP server 打包脚本
 *
 * 用 esbuild 把入口 + MCP SDK + zod 打包成单文件 node ESM（dist/index.mjs），
 * 便于作为 MCP 客户端的一个 command 直接指向，不需要额外分发 node_modules。
 *
 * 版本号在构建期从 package.json 注入（define），避免源码里手写版本号与包版本漂移；
 * package.json 的版本由根目录 scripts/sync-version.mjs 统一同步。
 */
import { readFileSync } from "node:fs";
import { build } from "esbuild";

const pkg = JSON.parse(
  readFileSync(new URL("./package.json", import.meta.url), "utf-8"),
);

await build({
  entryPoints: ["src/index.ts"],
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node18",
  outfile: "dist/index.mjs",
  logLevel: "info",
  define: { __WEMD_MCP_VERSION__: JSON.stringify(pkg.version) },
  // 单文件入口，允许直接 ./index.mjs 执行
  banner: { js: "#!/usr/bin/env node" },
});
