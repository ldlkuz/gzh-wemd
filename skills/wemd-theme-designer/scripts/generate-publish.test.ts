// @vitest-environment happy-dom
/**
 * generate-publish.test.ts — 生成公众号发布 HTML（与主程序 wechatPublishHtml 同管线）
 *
 * 读 themes/{name}/sample.md → loadThemePackageFromZip → renderTheme →
 * createMarkdownParser → processHtml（内联导出 + 伪元素物化），
 * 写入 themes/{name}/publish/{name}.html。
 *
 * 显式运行（不随 verify-* 自动跑）：
 *   npx vitest run --config ../../skills/wemd-theme-designer/vitest.config.ts scripts/generate-publish.test.ts
 * 限定单个主题：$env:WEMD_THEME="retro-newspaper"; npx vitest run ...
 */
import { it } from "vitest";
import fs from "fs";
import path from "path";
import {
  createMarkdownParser,
  processHtml,
  renderTheme,
  getThemeTemplates,
  getThemeSlotDefs,
  loadThemePackageFromZip,
} from "../../../packages/core/src/index";

const THEMES_DIR = path.resolve(__dirname, "..", "themes");
const FILTER = process.env.WEMD_THEME;

function findThemes(): string[] {
  return fs
    .readdirSync(THEMES_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .filter((n) =>
      fs.existsSync(path.join(THEMES_DIR, n, "package", "manifest.json")),
    );
}

async function generate(name: string): Promise<string> {
  const dir = path.join(THEMES_DIR, name);
  const zipPath = path.join(dir, `${name}.wemd-theme`);
  if (!fs.existsSync(zipPath)) {
    throw new Error(`未找到主题包 ${zipPath}，请先打包`);
  }
  const result = await loadThemePackageFromZip(
    new Uint8Array(fs.readFileSync(zipPath)),
  );
  if (!result.ok) {
    throw new Error(
      `主题包加载失败: ${result.errors.map((e) => e.message).join("; ")}`,
    );
  }
  const manifest: any = result.value.manifest;
  manifest.templates = manifest.templates ?? {};
  for (const [id, tpl] of result.value.templates) manifest.templates[id] = tpl;

  const sampleFile = path.join(dir, "sample.md");
  if (!fs.existsSync(sampleFile)) {
    throw new Error(`未找到 ${sampleFile}（示例文档）`);
  }
  const md = fs.readFileSync(sampleFile, "utf-8");

  const css = renderTheme(manifest, {
    componentsCss: result.value.styles.componentsCss,
    extrasCss: result.value.styles.extrasCss,
  });
  const templates = getThemeTemplates(manifest);
  const slotDefs = getThemeSlotDefs(manifest);
  const parser = createMarkdownParser({
    mathRenderer: "katex",
    getTemplate: (id) => templates.get(id),
    getSlotDefs: (id) => slotDefs.get(id),
  });
  const raw = parser.render(md);
  return processHtml(raw, css, true, true);
}

it("生成发布 HTML", async () => {
  const themes = FILTER
    ? findThemes().filter((n) => n === FILTER)
    : findThemes();
  if (themes.length === 0) throw new Error("未发现任何主题");
  for (const name of themes) {
    const html = await generate(name);
    const outFile = path.join(THEMES_DIR, name, "publish", `${name}.html`);
    fs.mkdirSync(path.dirname(outFile), { recursive: true });
    fs.writeFileSync(outFile, html, "utf-8");
    console.log(`✅ 已生成 ${outFile} (${html.length} 字符)`);
  }
});
