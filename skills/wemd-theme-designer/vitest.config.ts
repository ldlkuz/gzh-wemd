import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

/**
 * wemd-theme-designer 的 vitest 配置：
 * 用于运行 scripts/verify-theme-render.test.ts（主题渲染回归验证）。
 *
 * 运行（仓库根目录）：
 *   npx vitest run --config skills/wemd-theme-designer/vitest.config.ts
 * 或指定单个主题：
 *   WEMD_THEME=retro-newspaper npx vitest run --config skills/wemd-theme-designer/vitest.config.ts
 */
export default defineConfig({
  root: fileURLToPath(new URL(".", import.meta.url)),
  test: {
    // 只自动跑 verify-* 验证；generate-publish 需显式指定文件运行
    include: ["scripts/verify-*.test.ts"],
    environment: "happy-dom",
  },
});
