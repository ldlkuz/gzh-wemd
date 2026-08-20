// @vitest-environment happy-dom
/**
 * verify-theme-render.test.ts — 主题渲染回归验证（提炼自主程序 defaultThemeDomMatch.test.ts）
 *
 * 用真实渲染管线（loadThemePackageFromZip → renderTheme → createMarkdownParser →
 * processHtml 内联导出）对 themes/ 下每个主题包做通用合规断言：
 *   1. 导出无伪元素残留（无 `::`）
 *   2. 导出无结构伪类（:nth-child / :first-child / :last-child / :not(）
 *   3. `#wemd` 容器无整篇 background-color
 *   4. divider：覆盖并中和时，导出无「物化的 1px 侧线 span」（无双线回归防护）
 *   5. callout-pro：覆盖并中和时，导出无「物化绝对定位竖条 span」（无双竖条回归防护）
 *
 * 主题来源：themes/ 目录下各主题（package/manifest.json + styles/components.css + sample.md）。
 * 用 WEMD_THEME 环境变量限定单个主题。
 */
import { beforeAll, describe, expect, it } from "vitest";
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

// ============================================================
// 主题发现与加载
// ============================================================

function findThemes(): string[] {
  const dirs = fs
    .readdirSync(THEMES_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);
  return dirs.filter((name) =>
    fs.existsSync(path.join(THEMES_DIR, name, "package", "manifest.json")),
  );
}

interface LoadedTheme {
  manifest: any;
  componentsCss: string;
  sampleMd: string;
}

async function loadTheme(name: string): Promise<LoadedTheme> {
  const dir = path.join(THEMES_DIR, name);
  const zipPath = path.join(dir, `${name}.wemd-theme`);
  let manifest: any;
  let templates = new Map<string, string>();
  let componentsCss = "";

  if (fs.existsSync(zipPath)) {
    const result = await loadThemePackageFromZip(
      new Uint8Array(fs.readFileSync(zipPath)),
    );
    if (!result.ok) {
      throw new Error(
        `主题包加载失败: ${result.errors.map((e) => e.message).join("; ")}`,
      );
    }
    manifest = result.value.manifest;
    templates = result.value.templates;
    componentsCss = result.value.styles.componentsCss ?? "";
  } else {
    // 未打包时回退读 package/ 目录
    manifest = JSON.parse(
      fs.readFileSync(path.join(dir, "package", "manifest.json"), "utf-8"),
    );
    const cssFile = path.join(dir, "package", "styles", "components.css");
    if (fs.existsSync(cssFile)) {
      componentsCss = fs.readFileSync(cssFile, "utf-8");
    }
    const tplDir = path.join(dir, "package", "templates");
    if (fs.existsSync(tplDir)) {
      for (const f of fs.readdirSync(tplDir).filter((f) => f.endsWith(".html"))) {
        templates.set(f.replace(/\.html$/, ""), fs.readFileSync(path.join(tplDir, f), "utf-8"));
      }
    }
  }

  // 与主程序 themeStore 一致：把 zip 的 templates 合并回 manifest，供 getThemeTemplates 取到
  manifest.templates = manifest.templates ?? {};
  for (const [id, tpl] of templates) manifest.templates[id] = tpl;

  const sampleFile = path.join(dir, "sample.md");
  const sampleMd = fs.existsSync(sampleFile)
    ? fs.readFileSync(sampleFile, "utf-8")
    : "";
  return { manifest, componentsCss, sampleMd };
}

// ============================================================
// 渲染：与主程序 wechatPublishHtml 同管线
// ============================================================

function renderExport(
  loaded: LoadedTheme,
  md: string,
): string {
  const { manifest, componentsCss } = loaded;
  const css = renderTheme(manifest, { componentsCss });
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

/** 合规样本：主题展示文案 + 强制追加原生 > 引用、divider 与 callout-pro，保证各检查都能触发 */
function complianceSample(loaded: LoadedTheme): string {
  const base = loaded.sampleMd || "正文段落。";
  return `${base}\n\n> 一条用于验证的原生引用。\n\n---\n\n::: callout-pro{type="tip"}\n**验证提示**\n\n- 检查项一\n- 检查项二\n:::\n`;
}

/** components.css 中是否含某共享装饰选择器的 content: none 中和 */
function hasNeutralizer(componentsCss: string, selectorPart: string): boolean {
  const idx = componentsCss.indexOf(selectorPart);
  if (idx === -1) return false;
  const seg = componentsCss.slice(idx, idx + 400);
  return /\{[^{}]*content\s*:\s*none[^{}]*\}/.test(seg);
}

/** 从内联 style 取数值属性（px） */
function pxOf(style: string, prop: string): number | null {
  const m = style.match(new RegExp(`${prop}:\\s*(-?\\d+(?:\\.\\d+)?)px`));
  return m ? parseFloat(m[1]) : null;
}

/** padding-left：优先长属性，回退 padding 简写（top right bottom left） */
function paddingLeftOf(style: string): number | null {
  const direct = pxOf(style, "padding-left");
  if (direct !== null) return direct;
  const short = style.match(
    /padding:\s*(-?\d+(?:\.\d+)?)px(?:\s+(-?\d+(?:\.\d+)?)px)?(?:\s+(-?\d+(?:\.\d+)?)px)?(?:\s+(-?\d+(?:\.\d+)?)px)?/,
  );
  if (!short) return null;
  const t = parseFloat(short[1]);
  const r = short[2] ? parseFloat(short[2]) : t;
  const b = short[3] ? parseFloat(short[3]) : t;
  const l = short[4] ? parseFloat(short[4]) : r;
  return l;
}

/** border-left 宽度：优先长属性，回退 border-left 简写 */
function borderLeftWidthOf(style: string): number {
  const w = pxOf(style, "border-left-width");
  if (w !== null) return w;
  const sh = style.match(/border-left:\s*(\d+(?:\.\d+)?)px/);
  return sh ? parseFloat(sh[1]) : 0;
}

// ============================================================
// 测试
// ============================================================

const themeNames = findThemes();
const targets = FILTER
  ? themeNames.filter((n) => n === FILTER)
  : themeNames;

describe("主题渲染回归验证", () => {
  if (targets.length === 0) {
    it("未发现任何主题包", () => {
      expect(targets.length).toBeGreaterThan(0);
    });
  }

  for (const name of targets) {
    describe(name, () => {
      let loaded: LoadedTheme;
      beforeAll(async () => {
        loaded = await loadTheme(name);
      });

      it("导出无伪元素 / 结构伪类残留，且 #wemd 无整篇背景", () => {
        const out = renderExport(loaded, complianceSample(loaded));
        expect(out).not.toMatch(/::/);
        expect(out).not.toMatch(/:nth-child|:first-child|:last-child|:not\(/);
        const wemd = out.match(/<section id="wemd"[^>]*>/)?.[0] ?? "";
        expect(wemd).not.toMatch(/background-color/);
      });

      it("divider 无双线（覆盖并中和时，无物化 1px 侧线 span）", () => {
        const out = renderExport(loaded, complianceSample(loaded));
        const neutralized = hasNeutralizer(
          loaded.componentsCss,
          "wemd-divider .wemd-component-body::before",
        );
        if (out.includes("wemd-divider") && neutralized) {
          expect(out).not.toMatch(/wemd-mat[^>]*height:\s*1px/);
        }
      });

      it("divider 无内嵌 <hr> 残留（markdown --- 生成的 hr 应被隐藏，避免双线中间多一线）", () => {
        const out = renderExport(loaded, complianceSample(loaded));
        const start = out.indexOf(
          '<section class="wemd-component wemd-divider"',
        );
        if (start === -1) return;
        // 提取 divider 组件块（到下一个 </section></section> 闭合）
        const block = out.slice(start, start + 4000);
        const hrTags = block.match(/<hr[^>]*>/g) || [];
        for (const hr of hrTags) {
          expect(
            hr,
            "divider 内存在未隐藏的 <hr>（markdown --- 会生成，须 display:none）",
          ).toMatch(/display:\s*none/);
        }
      });

      it("callout-pro 无双竖条（覆盖并中和时，无物化 4px 竖条 span）", () => {
        const out = renderExport(loaded, complianceSample(loaded));
        const neutralized = hasNeutralizer(
          loaded.componentsCss,
          "wemd-callout-pro::before",
        );
        if (out.includes("wemd-callout-pro") && neutralized) {
          // 与 defaultThemeDomMatch 一致：不应再有物化的 4px 色条 span（双竖线回归防护）
          expect(out).not.toMatch(/wemd-mat[^>]*width:\s*4px/);
        }
      });

      it("pullquote 无双竖条（覆盖时，根元素不残留共享 border-left）", () => {
        const out = renderExport(loaded, complianceSample(loaded));
        const covered =
          loaded.manifest.components?.["pullquote"]?.variantCss?.length > 0;
        if (out.includes("wemd-pullquote") && covered) {
          // 原生 > 与 ::: pullquote 都自动识别为 pullquote 组件；
          // 共享根元素自带 border-left:5px，主题若在 body 另画竖条，必须覆盖根元素
          // 去掉共享竖条，否则根 + body 双条。
          const root = out.match(
            /<section class="wemd-component wemd-pullquote"[^>]*>/,
          )?.[0] ?? "";
          expect(root).not.toMatch(/border-left:\s*\d/);
        }
      });

      it("timeline 圆点居中于竖线（红点在线中间）", () => {
        const out = renderExport(loaded, complianceSample(loaded));
        const events = out.match(
          /<section class="wemd-tl-events" style="([^"]*)"/,
        );
        const dot = out.match(
          /<span class="wemd-tl-dot" style="([^"]*)"/,
        );
        if (!events || !dot) return; // 样本未渲染 timeline，跳过
        const eventsStyle = events[1];
        const dotStyle = dot[1];
        // 仅当圆点为绝对定位（画在竖线上）才校验；行内布局（如知识库）走别的设计
        if (!/position:\s*absolute/.test(dotStyle)) return;
        const PL = paddingLeftOf(eventsStyle);
        const BL = borderLeftWidthOf(eventsStyle);
        const L = pxOf(dotStyle, "left");
        const W = pxOf(dotStyle, "width");
        if (PL === null || L === null || W === null) return;
        // 圆点视觉中心 vs 竖线中心；translateX(-50%) 时与尺寸无关
        const diff = /translateX/.test(dotStyle)
          ? Math.abs(PL + L + BL / 2)
          : Math.abs(PL + L + W / 2 + BL / 2);
        expect(
          diff,
          `timeline 圆点未居中于竖线（偏差 ${diff.toFixed(1)}px；PL=${PL} L=${L} W=${W} BL=${BL}）——改圆点尺寸须配合定位，或依赖共享尺寸无关居中`,
        ).toBeLessThan(2);
      });
    });
  }
});
