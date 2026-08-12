/**
 * 验证实际主题包导入后的 CSS 渲染效果
 * 使用 bytedance-tech 主题包进行端到端验证
 */
import { describe, expect, it } from "vitest";
import fs from "fs";
import path from "path";
import { renderTheme, loadThemePackageFromZip } from "../index";

let manifest: any = null;

async function getManifest() {
  if (manifest) return manifest;
  const zipPath = path.resolve(
    __dirname,
    "../../../../sandbox/bytedance-tech/bytedance-tech-innovation.wemd-theme",
  );
  const zipData = fs.readFileSync(zipPath);
  const result = await loadThemePackageFromZip(new Uint8Array(zipData));
  if (!result.ok) throw new Error("加载主题包失败");
  manifest = result.value.manifest;
  return manifest;
}

describe("实际主题包导入验证 - bytedance-tech", () => {
  it("主题包加载成功", async () => {
    const m = await getManifest();
    expect(m.meta.name).toBe("字节跳动·科技创新");
    expect(Object.keys(m.components || {}).length).toBeGreaterThan(0);
  });

  it("所有 AI 生成的 variantCss 选择器都被添加了 #wemd 前缀", async () => {
    const m = await getManifest();
    const css = renderTheme(m);

    // 检查每个组件的 variantCss 是否都被正确添加了 #wemd 前缀
    for (const [compType, comp] of Object.entries(m.components) as any) {
      if (!comp.enabled || !comp.variantCss) continue;
      // 从 variantCss 中提取选择器
      const selectorLines = (comp.variantCss as string)
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .split("\n")
        .filter(
          (l) =>
            l.trim() &&
            !l.trim().startsWith(".") &&
            !l.trim().startsWith("#") &&
            !l.trim().startsWith("@") &&
            !l.trim().startsWith("}") &&
            l.includes("data-variant"),
        );

      // 如果原始 CSS 包含 .wemd-xxx[data-variant=...] 选择器（无 #wemd），
      // 渲染后的 CSS 应该包含 #wemd .wemd-xxx[data-variant=...]
      if (comp.variantCss.includes(`.wemd-${compType}[data-variant`)) {
        expect(css).toContain(
          `#wemd .wemd-${compType}[data-variant="${comp.variant}"]`,
        );
      }
    }
  });

  it("生成的 CSS 中没有裸露的（无 #wemd）组件选择器", async () => {
    const m = await getManifest();
    const css = renderTheme(m);
    const lines = css.split("\n");

    // 收集所有组件类型
    const compTypes = Object.keys(m.components || {});
    const pattern = new RegExp(
      `^\\s*\\.wemd-(${compTypes.join("|")})\\[data-variant`,
    );

    const bareSelectorLines = lines.filter((line) => pattern.test(line));
    expect(bareSelectorLines.length).toBe(0);
  });

  it("AI variantCss 在默认组件样式之后（CSS 层叠顺序正确）", async () => {
    const m = await getManifest();
    const css = renderTheme(m);

    const defaultStyleIdx = css.indexOf("#wemd .wemd-component");

    // 查找第一个 AI variant CSS 选择器（可能使用简写类名，如 .wemd-hero 而非 .wemd-hero-banner）
    // 从 variantCss 中提取实际选择器
    const firstVariantComp = Object.entries(m.components || {}).find(
      ([, c]: any) => c.enabled && c.variantCss,
    );
    const firstVariantCss = firstVariantComp?.[1]?.variantCss as string;
    const selectorMatch = firstVariantCss?.match(
      /\.([a-zA-Z0-9_-]+(\[data-variant[^\]]*\]))/,
    );
    const aiSelectorInCss = selectorMatch ? `#wemd .${selectorMatch[1]}` : null;

    if (aiSelectorInCss) {
      const variantCssIdx = css.indexOf(aiSelectorInCss);
      expect(variantCssIdx).toBeGreaterThan(defaultStyleIdx);
    } else {
      // 降级检查：确保 CSS 包含至少一个 AI variant 选择器
      expect(css).toMatch(/\[data-variant="[^"]+"\]/);
    }
  });

  it("组件样式优先级高于默认样式（选择器特异性更高）", async () => {
    const m = await getManifest();
    const css = renderTheme(m);

    // 从 variantCss 中提取实际选择器用于断言
    const heroComp = m.components?.["hero-banner"];
    if (heroComp?.variantCss) {
      const selectorMatch = (heroComp.variantCss as string).match(
        /\.([a-zA-Z0-9_-]+\[data-variant[^\]]*\])/,
      );
      if (selectorMatch) {
        const aiSelector = `#wemd .${selectorMatch[1]}`;
        // AI 样式（如 #wemd .wemd-hero[data-variant="bytewave"]）在 CSS 中
        expect(css).toContain(aiSelector);
      }
    }

    // 验证 AI 样式在默认组件样式之后
    const defaultIdx = css.indexOf("#wemd .wemd-component {");
    const aiIdx = css.indexOf("#wemd .wemd-hero");
    expect(aiIdx).toBeGreaterThan(defaultIdx);
  });

  it("tencent-tech 主题包也正确加载", async () => {
    const zipPath = path.resolve(
      __dirname,
      "../../../../sandbox/tencent-test/tencent-tech-intl.wemd-theme",
    );
    const zipData = fs.readFileSync(zipPath);
    const result = await loadThemePackageFromZip(new Uint8Array(zipData));
    expect(result.ok).toBe(true);

    const m = result.value.manifest;
    const css = renderTheme(m);

    // 验证组件选择器被正确添加 #wemd 前缀
    for (const [compType, comp] of Object.entries(m.components || {}) as any) {
      if (!comp.enabled || !comp.variantCss) continue;
      if (comp.variantCss.includes(`.wemd-${compType}[data-variant`)) {
        // 注释掉会导致 CSS 注释被包含的问题，但选择器本身应该正确
        // 我们直接检查 #wemd 前缀是否存在
        const hasPrefix = css.includes(`#wemd .wemd-${compType}[data-variant`);
        expect(hasPrefix).toBe(true);
      }
    }
    expect(css).toContain("#wemd");
  });
});
