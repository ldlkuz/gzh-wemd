import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

/**
 * 发布 HTML 生成专用配置：
 *   npx vitest run --config skills/wemd-theme-designer/vitest.publish.config.ts
 *   或限定主题：$env:WEMD_THEME="retro-newspaper"; npx vitest run --config ...
 */
export default defineConfig({
  root: fileURLToPath(new URL(".", import.meta.url)),
  test: {
    include: ["scripts/generate-publish.test.ts"],
    environment: "happy-dom",
  },
});
