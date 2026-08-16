/* 复现 app 组装：baseCss + typography + componentCss + pixel-arcade.css
   之后走 processHtml + relocateRootPadding，读取 blockquote 与 magazine-cover 的最终 margin */
const fs = require("fs");
const path = require("path");

const SKILL_ROOT = path.resolve(__dirname, "..");
const CORE_DIST = path.resolve(SKILL_ROOT, "../../packages/core/dist");
const HAPPY_DOM = path.resolve(
  SKILL_ROOT,
  "../../packages/core/node_modules/happy-dom",
);
const { GlobalWindow } = require(HAPPY_DOM);
const win = new GlobalWindow();
for (const key of ["window", "document", "HTMLElement", "Element", "Node", "getComputedStyle", "navigator"]) {
  globalThis[key] = win[key];
}

const { processHtml } = require(path.join(CORE_DIST, "ThemeProcessor.js"));
const { renderBaseCss } = require(path.join(CORE_DIST, "theme-renderer/baseCss.js"));

const pixelCss = fs.readFileSync(
  path.join(SKILL_ROOT, "themes", "pixel-arcade", "css", "pixel-arcade.css"),
  "utf-8",
);
const css = [renderBaseCss(), pixelCss].join("\n\n");

const html = `
  <blockquote class="multiquote-1"><p>引言</p></blockquote>
  <section class="wemd-component wemd-magazine-cover wemd-mc-centered" data-component="magazine-cover" data-props="{}">
    <span class="wemd-mc-title">标题</span>
  </section>
`;

const out = processHtml(html, css, true, true);

// 内联后、relocate 前
const doc = win.document;
const wrap0 = doc.createElement("div");
wrap0.innerHTML = out;
console.log("=== 内联后（relocate 前）===");
const bq0 = wrap0.querySelector("blockquote");
const mc0 = wrap0.querySelector(".wemd-magazine-cover");
// 列出各自 margin 相关属性
for (const [label, el] of [["blockquote", bq0], ["magazine-cover", mc0]]) {
  const props = {};
  ["margin", "margin-top", "margin-bottom", "margin-left", "margin-right"].forEach((p) => {
    props[p] = el.style.getPropertyValue(p).trim();
  });
  console.log(label, JSON.stringify(props), "| full style:", JSON.stringify(el.getAttribute("style")));
}

// 模拟 relocateRootPaddingToInnerWrapper：把 #wemd 的 padding-left/right 迁到一级块
const wrap = doc.createElement("div");
wrap.innerHTML = out;
const root = wrap.firstElementChild; // <section id=wemd>
const setRootPad = root.style.getPropertyValue("padding-left").trim();
console.log("root padding-left:", JSON.stringify(setRootPad));
if (setRootPad) {
  Array.from(root.children).forEach((child) => {
    if (child instanceof win.HTMLElement) {
      child.style.setProperty("margin-left", setRootPad);
      child.style.setProperty("margin-right", setRootPad);
    }
  });
}

// 读取各自的 style + 关键属性
const bq = wrap.querySelector("blockquote");
const mc = wrap.querySelector(".wemd-magazine-cover");
for (const [label, el] of [["blockquote", bq], ["magazine-cover", mc]]) {
  console.log(`\n<${label}> style attr:`);
  console.log("  ", el.getAttribute("style"));
}
console.log("\nblockquote computed margin-bottom:", bq.style.marginBottom);
console.log("magazine computed margin-bottom:", mc.style.marginBottom);