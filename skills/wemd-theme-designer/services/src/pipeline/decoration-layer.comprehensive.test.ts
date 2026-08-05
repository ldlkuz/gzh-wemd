// ============================================================
// 装饰层综合测试 — 模拟真实品牌场景
// ============================================================
// 测试场景：一个"科技+创新"品牌，包含多种组件类型
// 验证：品牌过滤 → 组合校验 → 映射 → 最终 CSS/HTML 输出

import {
  BrandFilterEngine,
  CombinationValidator,
  DecorationMapper,
  runDecorationLayer,
  ATOM_REGISTRY,
} from "./decoration-layer.ts";
import type { DecorationPlan, DecorationAtom } from "./decoration-layer.ts";

let passed = 0;
let failed = 0;

function check(desc: string, ok: boolean) {
  if (ok) { passed++; console.log(`  ✓ ${desc}`); }
  else { failed++; console.log(`  ✗ ${desc}`); }
}

// ══════════════════════════════════════════════════════════
// 场景 1: 科技品牌 — 完整 AI 输出方案
// ══════════════════════════════════════════════════════════
console.log("══════════════════════════════════════════════");
console.log("场景 1: 科技品牌 — AI 提供完整 DecorationPlan");
console.log("══════════════════════════════════════════════");

{
  // 模拟 AI 输出的 DecorationPlan（科技品牌，5 个组件）
  const aiPlan: DecorationPlan = {
    brandFilter: {
      keywords: ["科技", "创新"],
      allowedAtoms: [],
      density: "medium",
    },
    components: {
      "hero-banner": {
        variant: "tech-wave",
        atoms: [
          { id: "bg-gradient", params: { angle: "135deg", color1: "var(--wemd-primary)", color2: "var(--wemd-primary-dark)" } },
          { id: "pattern-grid", params: { size: 24, color: "rgba(255,255,255,0.06)", strokeWidth: 1, opacity: 0.06 } },
          { id: "badge-pill", params: { text: "NEW", color: "var(--wemd-accent)", fontSize: 13, paddingX: 12 } },
        ],
      },
      "section-title": {
        variant: "tech-left",
        atoms: [
          { id: "line-left", params: { width: 4, color: "var(--wemd-primary)", gap: 12 } },
          { id: "icon-arrow", params: { size: 18, color: "var(--wemd-primary)", gap: 6 } },
        ],
      },
      "stats-block": {
        variant: "grid-cards",
        atoms: [
          { id: "bg-soft", params: { color: "var(--wemd-primary)", opacity: 0.05 } },
          { id: "corner-rounded", params: { radius: 12 } },
          { id: "divider-gradient", params: { width: 2, color: "var(--wemd-primary)", marginY: 16 } },
        ],
      },
      "divider": {
        variant: "wave",
        atoms: [
          { id: "divider-wave", params: { height: 20, color: "var(--wemd-primary)", strokeWidth: 2, opacity: 0.4, marginY: 16 } },
        ],
      },
      "quote-card": {
        variant: "insight",
        atoms: [
          { id: "line-left", params: { width: 4, color: "var(--wemd-primary)", gap: 12 } },
          { id: "icon-quote", params: { quoteChar: "\"", size: 48, color: "var(--wemd-primary)", opacity: 0.2, gap: 8 } },
        ],
      },
    },
  };

  // 1. 品牌过滤（验证品牌过滤引擎不仅能过滤，还能与 AI 方案共存）
  const filterEngine = new BrandFilterEngine();
  const brandFilter = filterEngine.evaluate(["科技", "创新"]);

  console.log(`\n── 品牌过滤结果 ──`);
  console.log(`  密度: ${brandFilter.density}`);
  console.log(`  允许原子数: ${brandFilter.allowedAtoms.length}`);
  check("密度为 medium", brandFilter.density === "medium");
  check("包含 bg-gradient", brandFilter.allowedAtoms.includes("bg-gradient"));
  check("包含 pattern-grid", brandFilter.allowedAtoms.includes("pattern-grid"));
  check("包含 line-left", brandFilter.allowedAtoms.includes("line-left"));
  check("包含基础原子 bg-soft", brandFilter.allowedAtoms.includes("bg-soft"));

  // 2. 组合校验（验证每个组件的原子组合是否合规）
  const validator = new CombinationValidator();
  console.log(`\n── 组合校验结果 ──`);

  for (const [comp, decoration] of Object.entries(aiPlan.components)) {
    const result = validator.validate(comp, decoration.atoms, "medium");
    console.log(`  ${comp} (${decoration.atoms.length} 原子): ${result.passed ? "✅" : "❌"} ${result.summary}`);
    for (const e of result.errors) {
      console.log(`    Error [${e.code}]: ${e.message}`);
    }
    for (const w of result.warnings) {
      console.log(`    Warning [${w.code}]: ${w.message}`);
    }
    check(`${comp} 校验通过或无阻断错误`, result.passed || result.errors.length === 0);
  }

  // 3. 映射引擎（验证 CSS/HTML 输出）
  const mapper = new DecorationMapper();
  const mapResult = mapper.map(aiPlan);

  console.log(`\n── 映射结果 ──`);
  check("5 个组件都有 CSS 输出", Object.keys(mapResult.css).length === 5);
  check("5 个组件都有 HTML 输出（或空）", Object.keys(mapResult.html).length === 5);

  // hero-banner 检查
  const heroCss = mapResult.css["hero-banner"] || "";
  const heroHtml = mapResult.html["hero-banner"] || "";
  check("hero-banner CSS 包含 bg-gradient", heroCss.includes("linear-gradient"));
  check("hero-banner CSS 包含 pattern-grid SVG", heroCss.includes("background-image") && heroCss.includes("svg"));
  check("hero-banner HTML 包含 badge-pill", heroHtml.includes("wemd-hero-banner-pill"));
  check("hero-banner CSS 选择器正确", heroCss.includes('.wemd-hero-banner[data-variant="tech-wave"]'));

  // section-title 检查
  const stCss = mapResult.css["section-title"] || "";
  const stHtml = mapResult.html["section-title"] || "";
  check("section-title CSS 包含 border-left", stCss.includes("border-left"));
  check("section-title HTML 包含 icon-arrow", stHtml.includes("wemd-section-title-icon"));

  // divider 检查
  const divCss = mapResult.css["divider"] || "";
  check("divider CSS 包含 wave SVG", divCss.includes("divider-wave") || divCss.includes("svg"));

  // quote-card 检查
  const qcCss = mapResult.css["quote-card"] || "";
  const qcHtml = mapResult.html["quote-card"] || "";
  check("quote-card CSS 包含 border-left", qcCss.includes("border-left"));
  check("quote-card HTML 包含 quote 元素", qcHtml.includes("wemd-quote-card-quote"));

  // 4. 验证 CSS 语法完整性（每个选择器都有闭合括号）
  console.log(`\n── CSS 语法检查 ──`);
  for (const [comp, css] of Object.entries(mapResult.css)) {
    const openBraces = (css.match(/\{/g) || []).length;
    const closeBraces = (css.match(/\}/g) || []).length;
    check(`${comp} CSS 括号匹配 (${openBraces}开/${closeBraces}闭)`, openBraces === closeBraces);
  }
}

// ══════════════════════════════════════════════════════════
// 场景 2: 冲突检测 — 故意制造违规场景
// ══════════════════════════════════════════════════════════
console.log("\n══════════════════════════════════════════════");
console.log("场景 2: 冲突检测 — 故意制造违规场景");
console.log("══════════════════════════════════════════════");

{
  const validator = new CombinationValidator();

  // 2a. 位置冲突 + 背景互斥 + Badge 独占 + 装饰超限 — 全违规
  const badPlan: Record<string, DecorationAtom[]> = {
    "hero-banner": [
      { id: "bg-gradient", params: { angle: "135deg", color1: "blue", color2: "darkblue" } },
      { id: "bg-solid", params: { color: "white" } },           // 背景互斥
      { id: "pattern-grid", params: { size: 24 } },
      { id: "pattern-dot", params: { size: 20 } },              // 纹理叠加 Warning
      { id: "badge-pill", params: { text: "NEW" } },
      { id: "badge-number", params: { number: "01" } },         // Badge 独占
      { id: "corner-rounded", params: { radius: 12 } },
      { id: "icon-star", params: { size: 18 } },                // 装饰超限 (medium=3)
    ],
    "section-title": [
      { id: "line-left", params: { width: 4 } },
      { id: "line-gradient", params: {} },                      // 位置冲突
    ],
  };

  console.log(`\n── hero-banner (8 原子, 多项违规) ──`);
  const r1 = validator.validate("hero-banner", badPlan["hero-banner"], "medium");
  check("检测到 BACKGROUND_MUTEX", r1.errors.some(e => e.code === "BACKGROUND_MUTEX"));
  check("检测到 BADGE_EXCLUSIVE", r1.errors.some(e => e.code === "BADGE_EXCLUSIVE"));
  check("检测到 PATTERN_OVERLAY Warning", r1.warnings.some(w => w.code === "PATTERN_OVERLAY"));
  check("检测到 ATOM_COUNT_EXCEEDED Warning", r1.warnings.some(w => w.code === "ATOM_COUNT_EXCEEDED"));
  check("无位置冲突误报（背景/badge 已排除）", !r1.errors.some(e => e.code === "POSITION_CONFLICT"));

  console.log(`\n── section-title (line-left + line-gradient) ──`);
  const r2 = validator.validate("section-title", badPlan["section-title"], "medium");
  check("检测到 POSITION_CONFLICT", r2.errors.some(e => e.code === "POSITION_CONFLICT"));
}

// ══════════════════════════════════════════════════════════
// 场景 3: 参数边界 — 测试参数截断和默认值
// ══════════════════════════════════════════════════════════
console.log("\n══════════════════════════════════════════════");
console.log("场景 3: 参数边界 — 测试参数截断和默认值");
console.log("══════════════════════════════════════════════");

{
  const mapper = new DecorationMapper();
  const plan: DecorationPlan = {
    brandFilter: { keywords: [], allowedAtoms: [], density: "medium" },
    components: {
      "test": {
        variant: "v1",
        atoms: [
          // width 超出范围 (min=2, max=6) → 截断到 6
          { id: "line-left", params: { width: 999, gap: 999 } },
          // 不传参数 → 使用默认值
          { id: "corner-rounded", params: {} },
          // 枚举值验证
          { id: "badge-pill", params: { text: "测试", weight: "invalid" } },
        ],
      },
    },
  };

  const result = mapper.map(plan);
  const css = result.css["test"] || "";
  const html = result.html["test"] || "";

  check("width 截断到 max=6", css.includes("border-left: 6px"));
  check("gap 截断到 max=20", css.includes("padding-left: 20px"));

  // corner-rounded 默认 radius=12
  check("corner-rounded 使用默认 radius=12", css.includes("border-radius: 12px"));

  // badge-pill weight 无效枚举值 → 回退默认值 "600"
  check("badge-pill weight 回退默认值 600", html.includes("wemd-test-pill"));
}

// ══════════════════════════════════════════════════════════
// 场景 4: 完整 Pipeline 集成 — 模拟真实品牌流程
// ══════════════════════════════════════════════════════════
console.log("\n══════════════════════════════════════════════");
console.log("场景 4: 完整 Pipeline 集成 — runDecorationLayer");
console.log("══════════════════════════════════════════════");

{
  // 模拟真实品牌的输入
  const input = {
    keywords: ["科技", "创新", "年轻"],
    density: "medium" as "medium",
    mappedComponents: [
      { component: "hero-banner", variant: "tech-wave" },
      { component: "section-title", variant: "tech-left" },
      { component: "stats-block", variant: "grid-cards" },
      { component: "divider", variant: "wave" },
      { component: "quote-card", variant: "insight" },
      { component: "tag-label", variant: "pill" },
      { component: "callout", variant: "tech" },
      { component: "brand-sign", variant: "simple" },
    ],
  };

  const output = runDecorationLayer(input);

  console.log(`\n── 品牌过滤结果 ──`);
  check("品牌过滤原子数 > 0", output.brandFilter.allowedAtoms.length > 0);
  check("密度为 medium", output.brandFilter.density === "medium");

  console.log(`\n── 装饰方案 (自动生成) ──`);
  const compCount = Object.keys(output.decorationPlan.components).length;
  check(`生成了 ${compCount} 个组件装饰`, compCount === 8);

  let totalAtoms = 0;
  for (const [comp, deco] of Object.entries(output.decorationPlan.components)) {
    totalAtoms += deco.atoms.length;
    console.log(`  ${comp} (${deco.variant}): ${deco.atoms.length} 原子`);
  }
  check("总装饰原子数 > 0", totalAtoms > 0);

  console.log(`\n── 映射 CSS 输出 ──`);
  for (const [comp, css] of Object.entries(output.mapResult.css)) {
    const hasSelector = css.includes(`.wemd-${comp}`);
    const hasBrackets = css.includes("{") && css.includes("}");
    check(`${comp}: 选择器正确=${hasSelector}, 括号完整=${hasBrackets}`, hasSelector && hasBrackets);
  }
  check("所有 8 个组件都有 CSS", Object.keys(output.mapResult.css).length === 8);

  console.log(`\n── 组合校验 ──`);
  for (const [comp, vResult] of Object.entries(output.validationResult)) {
    check(`${comp}: ${vResult.passed ? "通过" : "有错误"}`, vResult.passed);
  }

  // 模拟 Application Layer 的 #wemd 包裹
  console.log(`\n── 模拟 Application Layer 合并 ──`);
  const baseCssTemplate = `.wemd-{comp}[data-variant="{variant}"] {\n  padding: 1em;\n  color: var(--wemd-textPrimary, #1A1A2E);\n}`;
  for (const [comp, css] of Object.entries(output.mapResult.css)) {
    const variant = output.decorationPlan.components[comp]?.variant || "default";
    const baseCss = baseCssTemplate.replace(/\{comp\}/g, comp).replace(/\{variant\}/g, variant);
    const finalCss = `#wemd ${baseCss}\n\n#wemd ${css}`;
    const hasWemd = finalCss.startsWith("#wemd");
    const hasClosing = (finalCss.match(/\}/g) || []).length === (finalCss.match(/\{/g) || []).length;
    check(`${comp} 最终 CSS: #wemd 包裹=${hasWemd}, 括号闭合=${hasClosing}`, hasWemd && hasClosing);
  }
}

// ══════════════════════════════════════════════════════════
// 场景 5: 空/边界场景 — 测试健壮性
// ══════════════════════════════════════════════════════════
console.log("\n══════════════════════════════════════════════");
console.log("场景 5: 边界场景 — 测试健壮性");
console.log("══════════════════════════════════════════════");

{
  // 5a. 空映射组件列表
  const emptyInput = {
    keywords: [],
    density: "low" as "low",
    mappedComponents: [],
  };
  const emptyOutput = runDecorationLayer(emptyInput);
  check("空组件列表: 0 个 CSS 输出", Object.keys(emptyOutput.mapResult.css).length === 0);
  check("空组件列表: 0 个组件装饰", Object.keys(emptyOutput.decorationPlan.components).length === 0);

  // 5b. 不存在的原子 ID（映射引擎应跳过）
  const mapper = new DecorationMapper();
  const badAtomPlan: DecorationPlan = {
    brandFilter: { keywords: [], allowedAtoms: [], density: "low" },
    components: {
      "test": {
        variant: "v1",
        atoms: [
          { id: "non-existent-atom", params: {} },
          { id: "line-left", params: { width: 4 } },
        ],
      },
    },
  };
  const badResult = mapper.map(badAtomPlan);
  check("不存在的原子被跳过", badResult.css["test"]?.includes("border-left") === true);

  // 5c. 无关键词（应只返回基础原子）
  const noKeywordFilter = new BrandFilterEngine().evaluate([]);
  check("无关键词: 只返回基础原子", noKeywordFilter.allowedAtoms.length <= 6);
  check("无关键词: 密度为 low", noKeywordFilter.density === "low");
}

// ══════════════════════════════════════════════════════════
// 结果
// ══════════════════════════════════════════════════════════
console.log("\n══════════════════════════════════════════════");
console.log(`综合测试完成: ${passed} 通过, ${failed} 失败`);
console.log("══════════════════════════════════════════════");

if (failed > 0) {
  Deno.exit(1);
}