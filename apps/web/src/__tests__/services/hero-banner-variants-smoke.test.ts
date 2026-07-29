import { describe, it, expect } from "vitest";
import {
  createMarkdownParser,
  processHtml,
  renderTheme,
  getBuiltInThemeDefinition,
} from "@wemd/core";
import { expandCSSVariables } from "../../services/cssVariableExpander";
import katexCss from "katex/dist/katex.min.css?raw";

const buildCopyCss = (themeCss: string) => {
  if (!themeCss) return katexCss;
  return `${expandCSSVariables(themeCss)}\n${katexCss}`;
};

const mkMd = (variant: string) => `::: hero-banner{variant="${variant}"}
**逃离城市24小时**

我的第一次露营全记录

*露营攻略*
:::`;

const parser = createMarkdownParser();

const getSectionStyles = (html: string) => {
  // 收集 hero-banner 外层 section 的所有内联样式（去重后）
  const rules = new Set<string>();
  const re = /style="([^"]+)"/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    m[1].split(/\s*;\s*/).forEach((r) => r && rules.add(r.trim()));
  }
  return rules;
};

describe("hero-banner 三个 variant 区分度 + 对比度 + 渐变顺滑", () => {
  it("variant 之间背景结构一眼不同（center 多停点渐变 + radial；left 深色+左边条；minimal 透明+顶部色条）", () => {
    const theme = getBuiltInThemeDefinition("default")!;
    const css = buildCopyCss(renderTheme(theme));

    const center = processHtml(parser.render(mkMd("center")), css, true, false);
    const left = processHtml(parser.render(mkMd("left")), css, true, false);
    const minimal = processHtml(
      parser.render(mkMd("minimal")),
      css,
      true,
      false,
    );

    const c = Array.from(getSectionStyles(center)).join(" | ");
    const l = Array.from(getSectionStyles(left)).join(" | ");
    const m = Array.from(getSectionStyles(minimal)).join(" | ");

    console.log(
      "---center bg 相关---\n",
      c
        .split(" | ")
        .filter((s) => /background|border-radius|height|border/.test(s))
        .join("\n"),
    );
    console.log(
      "---left bg 相关---\n",
      l
        .split(" | ")
        .filter((s) => /background|border-radius|height|border/.test(s))
        .join("\n"),
    );
    console.log(
      "---minimal bg 相关---\n",
      m
        .split(" | ")
        .filter((s) => /background|border-radius|height|border/.test(s))
        .join("\n"),
    );

    // 区分度约束：三个 variant 的背景类关键字集合必须两两不相交
    // center 至少包含 3 个停点以上（linear-gradient 逗号数 >= 3）
    const cLinearMatches = (c.match(/linear-gradient\([^)]+\)/g) || []).join(
      " ",
    );
    const lLinearMatches = (l.match(/linear-gradient\([^)]+\)/g) || []).join(
      " ",
    );
    const mLinearMatches = (m.match(/linear-gradient\([^)]+\)/g) || []).join(
      " ",
    );
    console.log("center linear:", cLinearMatches);
    console.log("left linear:", lLinearMatches);
    console.log("minimal linear:", mLinearMatches);
    // center 应该有多个 linear-gradient 停点（逗号数>=5 => >=6 段）
    expect((cLinearMatches.match(/,/g) || []).length >= 5).toBe(true);
    // minimal 应该没有复杂渐变主背景（主背景应当是 #fff / bg-card 纯色）
    expect(m).not.toMatch(/radial-gradient/);
  });

  it("minimal 变体：深色字（不是白色）+ 卡片背景，纯白底绝对可辨", () => {
    const theme = getBuiltInThemeDefinition("default")!;
    const css = buildCopyCss(renderTheme(theme));
    const out = processHtml(parser.render(mkMd("minimal")), css, true, false);
    const styles = Array.from(getSectionStyles(out)).join(" ; ");
    console.log("minimal 全量内联样式（简化）：", styles);
    // 标题字色应该是深色 text-strong（≈#1a1a1a 或近深色），不该是 #ffffff
    expect(styles).not.toMatch(/color:\s*#fff(fff)?[;\s]/);
  });

  it("center / left 变体：深色背景 + 白色字，双主题下都不硬编码微信绿", () => {
    const def = getBuiltInThemeDefinition("default")!;
    const sun = getBuiltInThemeDefinition("sunset-film")!;
    const defCss = buildCopyCss(renderTheme(def));
    const sunCss = buildCopyCss(renderTheme(sun));
    const mdC = mkMd("center");
    const mdL = mkMd("left");

    const defC = processHtml(parser.render(mdC), defCss, true, false);
    const sunC = processHtml(parser.render(mdC), sunCss, true, false);
    const defL = processHtml(parser.render(mdL), defCss, true, false);
    const sunL = processHtml(parser.render(mdL), sunCss, true, false);

    // sunset-film 下不该再出现微信绿主色
    expect(sunC).not.toContain("#07c160");
    expect(sunL).not.toContain("#07c160");
    // 但应该换成落日橘
    expect(sunC).toContain("e67e22");
    expect(sunL).toContain("e67e22");

    // default 下应该有主色 #07c160（跟随主题）
    expect(defC).toContain("#07c160");
    expect(defL).toContain("#07c160");
  });

  it("渐变顺滑：center 渐变相邻停点跨度都 < 40%（避免硬边）", () => {
    const theme = getBuiltInThemeDefinition("default")!;
    const expCss = expandCSSVariables(renderTheme(theme));
    // center variant 主渐变是 160deg 的 linear-gradient，把括号完整匹配出来（包含嵌套 color-mix 的括号）
    const centerStart = expCss.indexOf(
      '.wemd-hero-banner[data-variant="center"]',
    );
    const gradStart = expCss.indexOf("linear-gradient(160deg", centerStart);
    // 数括号找对应的右括号
    let depth = 0;
    let i = gradStart;
    while (i < expCss.length) {
      if (expCss[i] === "(") depth++;
      else if (expCss[i] === ")") {
        depth--;
        if (depth === 0) break;
      }
      i++;
    }
    const grad = expCss.slice(gradStart, i + 1);
    console.log("center 完整主渐变：", grad);
    // 停点提取规则（必须满足以下任一才是停点百分比）：
    // 1. 在 color-mix() 之外 + 后跟逗号/右括号；且
    // 2. 前面是一个 "#xxxxxx " 色值（即停点是跟在具体色值后的位置）
    const pcts: number[] = [];
    // 1) 逐段扫描括号深度，只处理 depth = 最外层 gradient 内部
    //    遇到 color-mix( 则直接跳到匹配的右括号，避免内部百分比被误判
    let bracketDepth = 0;
    for (let j = 0; j < grad.length; j++) {
      const c = grad[j];
      if (c === "(") bracketDepth++;
      else if (c === ")") {
        bracketDepth--;
        continue;
      }
      if (bracketDepth !== 1) continue;
      // 跳过 color-mix 整段
      if (grad.startsWith("color-mix(", j)) {
        let k = j + "color-mix(".length;
        let d = 1;
        while (k < grad.length && d > 0) {
          if (grad[k] === "(") d++;
          else if (grad[k] === ")") d--;
          k++;
        }
        j = k - 1;
        continue;
      }
      // 最外层的 "NN%," 或 "NN%)" 才算停点（紧跟逗号/右括号前的%是位置百分比，color-mix 内已跳过）
      const m = grad.slice(j).match(/^([0-9]{1,3})%([,)])/);
      if (m) pcts.push(parseInt(m[1], 10));
    }
    console.log("跳过 color-mix 后最外层位置百分比：", pcts);
    // 可能扫到 radial-gradient 里的 55%、120% 等非渐变停点的数字，只保留 [0,100] 区间内单调递增的位置
    const clean: number[] = [];
    for (const v of pcts) {
      if (v < 0 || v > 100) continue;
      if (clean.length && v < clean[clean.length - 1]) continue;
      clean.push(v);
    }
    console.log("清洗后单调递增 0-100 停点：", clean);
    expect(clean.length).toBeGreaterThanOrEqual(5);
    expect(clean[0]).toBe(0);
    expect(clean[clean.length - 1]).toBe(100);
    const diffs = clean.slice(1).map((v, idx) => v - clean[idx]);
    console.log("相邻停点跨度差（0-100 单调）：", diffs);
    expect(diffs.every((d) => d < 40)).toBe(true);
  });
});
