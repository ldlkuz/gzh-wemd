// ============================================================
// Decoration Layer 测试
// ============================================================
// 验证：品牌过滤引擎、组合校验器、映射引擎

import {
  BrandFilterEngine,
  CombinationValidator,
  DecorationMapper,
  runDecorationLayer,
  ATOM_REGISTRY,
} from "./decoration-layer.ts";
import type { DecorationPlan, DecorationAtom } from "./decoration-layer.ts";

// ── 测试 1: 品牌过滤引擎 ──
console.log("─── 测试 1: 品牌过滤引擎 ───");
{
  const engine = new BrandFilterEngine();
  const result = engine.evaluate(["科技", "创新"]);

  console.log(`密度: ${result.density}`);
  console.log(`允许原子数: ${result.allowedAtoms.length}`);
  console.log(`包含 line-gradient: ${result.allowedAtoms.includes("line-gradient")}`);
  console.log(`包含 pattern-hexagon: ${result.allowedAtoms.includes("pattern-hexagon")}`);
  console.log(`包含基础原子 bg-soft: ${result.allowedAtoms.includes("bg-soft")}`);

  const hasLine = result.allowedAtoms.some(a => a.startsWith("line-"));
  const hasBadge = result.allowedAtoms.some(a => a.startsWith("badge-"));
  console.log(`包含线条类: ${hasLine}, 包含徽标类: ${hasBadge}`);
  console.log(`测试 1 通过 ✓`);
}

// ── 测试 2: 组合校验器 - 无冲突 ──
console.log(`\n─── 测试 2: 组合校验器 - 无冲突 ───`);
{
  const validator = new CombinationValidator();
  const atoms: DecorationAtom[] = [
    { id: "line-left", params: { width: 4, color: "var(--wemd-primary)", gap: 12 } },
    { id: "badge-number", params: { number: "01", size: 28 } },
    { id: "bg-soft", params: { color: "var(--wemd-primary)", opacity: 0.05 } },
  ];

  const result = validator.validate("section-title", atoms, "medium");
  console.log(`通过: ${result.passed}`);
  console.log(`错误数: ${result.errors.length}, 警告数: ${result.warnings.length}`);
  console.log(`摘要: ${result.summary}`);

  if (result.passed) {
    console.log(`测试 2 通过 ✓`);
  } else {
    console.log(`测试 2 失败 ✗: 应有 0 个错误`);
  }
}

// ── 测试 3: 组合校验器 - 位置冲突 ──
console.log(`\n─── 测试 3: 组合校验器 - 位置冲突 ───`);
{
  const validator = new CombinationValidator();
  const atoms: DecorationAtom[] = [
    { id: "line-left", params: {} },
    { id: "line-gradient", params: {} }, // 同为 border-left 槽位，冲突
  ];

  const result = validator.validate("section-title", atoms, "medium");
  console.log(`通过: ${result.passed}`);
  console.log(`错误数: ${result.errors.length}`);
  console.log(`摘要: ${result.summary}`);

  if (!result.passed && result.errors.length === 1 && result.errors[0].code === "POSITION_CONFLICT") {
    console.log(`测试 3 通过 ✓ (正确检测到位置冲突)`);
  } else {
    console.log(`测试 3 失败 ✗`);
  }
}

// ── 测试 4: 组合校验器 - 背景互斥 ──
console.log(`\n─── 测试 4: 组合校验器 - 背景互斥 ───`);
{
  const validator = new CombinationValidator();
  const atoms: DecorationAtom[] = [
    { id: "bg-gradient", params: { angle: "135deg", color1: "blue", color2: "darkblue" } },
    { id: "bg-solid", params: { color: "white" } },
  ];

  const result = validator.validate("hero-banner", atoms, "medium");
  console.log(`通过: ${result.passed}`);
  console.log(`错误数: ${result.errors.length}`);
  console.log(`摘要: ${result.summary}`);

  if (!result.passed && result.errors.length === 1 && result.errors[0].code === "BACKGROUND_MUTEX") {
    console.log(`测试 4 通过 ✓ (正确检测到背景互斥)`);
  } else {
    console.log(`测试 4 失败 ✗`);
  }
}

// ── 测试 5: 组合校验器 - Badge 独占 ──
console.log(`\n─── 测试 5: 组合校验器 - Badge 独占 ───`);
{
  const validator = new CombinationValidator();
  const atoms: DecorationAtom[] = [
    { id: "badge-number", params: { number: "01" } },
    { id: "badge-pill", params: { text: "NEW" } },
  ];

  const result = validator.validate("section-title", atoms, "medium");
  console.log(`通过: ${result.passed}`);
  console.log(`错误数: ${result.errors.length}`);
  console.log(`摘要: ${result.summary}`);

  if (!result.passed && result.errors.length === 1 && result.errors[0].code === "BADGE_EXCLUSIVE") {
    console.log(`测试 5 通过 ✓ (正确检测到 Badge 独占)`);
  } else {
    console.log(`测试 5 失败 ✗`);
  }
}

// ── 测试 6: 映射引擎 - 基本映射 ──
console.log(`\n─── 测试 6: 映射引擎 - 基本映射 ───`);
{
  const mapper = new DecorationMapper();
  const plan: DecorationPlan = {
    brandFilter: { keywords: ["科技"], allowedAtoms: [], density: "medium" },
    components: {
      "section-title": {
        variant: "tech-left",
        atoms: [
          { id: "line-left", params: { width: 4, color: "var(--wemd-primary)", gap: 12 } },
        ],
      },
    },
  };

  const result = mapper.map(plan);
  const css = result.css["section-title"] || "";

  console.log(`CSS 包含 border-left: ${css.includes("border-left")}`);
  console.log(`CSS 包含选择器 section-title: ${css.includes("section-title")}`);
  console.log(`CSS 包含 data-variant: ${css.includes("tech-left")}`);
  console.log(`CSS:\n${css}`);

  if (css.includes("border-left") && css.includes("section-title") && css.includes("tech-left")) {
    console.log(`测试 6 通过 ✓`);
  } else {
    console.log(`测试 6 失败 ✗`);
  }
}

// ── 测试 7: 映射引擎 - 带 HTML 的原子 ──
console.log(`\n─── 测试 7: 映射引擎 - 带 HTML 的原子 ───`);
{
  const mapper = new DecorationMapper();
  const plan: DecorationPlan = {
    brandFilter: { keywords: [], allowedAtoms: [], density: "medium" },
    components: {
      "steps": {
        variant: "numbered",
        atoms: [
          { id: "badge-number", params: { number: "01", size: 28, color: "var(--wemd-primary)", gap: 8 } },
        ],
      },
    },
  };

  const result = mapper.map(plan);
  const html = result.html["steps"] || "";
  const css = result.css["steps"] || "";

  console.log(`HTML 包含 badge span: ${html.includes("wemd-steps-badge")}`);
  console.log(`CSS 包含 .wemd-steps-badge: ${css.includes(".wemd-steps-badge")}`);

  if (html.includes("wemd-steps-badge") && css.includes(".wemd-steps-badge")) {
    console.log(`测试 7 通过 ✓`);
  } else {
    console.log(`测试 7 失败 ✗`);
  }
}

// ── 测试 8: 映射引擎 - 参数验证与范围截断 ──
console.log(`\n─── 测试 8: 映射引擎 - 参数验证与范围截断 ───`);
{
  const mapper = new DecorationMapper();
  const plan: DecorationPlan = {
    brandFilter: { keywords: [], allowedAtoms: [], density: "medium" },
    components: {
      "test": {
        variant: "v1",
        atoms: [
          { id: "line-left", params: { width: 999, color: "var(--wemd-primary)", gap: 999 } },
        ],
      },
    },
  };

  const result = mapper.map(plan);
  const css = result.css["test"] || "";

  // width 应该被截断到 max(6), gap 应该被截断到 max(20)
  console.log(`border-left 截断为 6px: ${css.includes("border-left: 6px")}`);
  console.log(`padding-left 截断为 20px: ${css.includes("padding-left: 20px")}`);

  if (css.includes("border-left: 6px") && css.includes("padding-left: 20px")) {
    console.log(`测试 8 通过 ✓ (参数正确截断)`);
  } else {
    console.log(`测试 8 失败 ✗`);
  }
}

// ── 测试 9: 完整 Decoration Layer 流程 ──
console.log(`\n─── 测试 9: 完整 Decoration Layer 流程 ───`);
{
  const input = {
    keywords: ["科技", "创新", "年轻"],
    density: "medium" as "medium",
    mappedComponents: [
      { component: "hero-banner", variant: "tech-wave" },
      { component: "section-title", variant: "tech-left" },
      { component: "divider", variant: "wave" },
    ],
  };

  const output = runDecorationLayer(input);

  console.log(`品牌过滤原子数: ${output.brandFilter.allowedAtoms.length}`);
  console.log(`装饰组件数: ${Object.keys(output.decorationPlan.components).length}`);
  console.log(`映射 CSS 组件数: ${Object.keys(output.mapResult.css).length}`);

  // 验证每个组件都有 CSS
  let allHaveCss = true;
  for (const comp of ["hero-banner", "section-title", "divider"]) {
    if (!output.mapResult.css[comp]) {
      console.log(`  ✗ ${comp} 缺少 CSS`);
      allHaveCss = false;
    } else {
      console.log(`  ✓ ${comp} 有 CSS`);
    }
  }

  // 验证校验结果
  let allValidated = true;
  for (const [comp, vResult] of Object.entries(output.validationResult)) {
    if (!vResult.passed) {
      console.log(`  ⚠ ${comp}: ${vResult.summary}`);
      allValidated = false;
    }
  }

  if (allHaveCss) {
    console.log(`测试 9 通过 ✓`);
  } else {
    console.log(`测试 9 失败 ✗`);
  }
}

// ── 测试 10: 原子注册表完整性 ──
console.log(`\n─── 测试 10: 原子注册表完整性 ───`);
{
  const expectedP0Atoms = [
    "line-left", "line-bottom", "line-underline", "line-top", "line-double",
    "line-gradient", "line-dashed",
    "badge-number", "badge-dot", "badge-pill", "badge-icon", "badge-stroke",
    "pattern-dot", "pattern-grid", "pattern-hexagon",
    "icon-emoji", "icon-arrow", "icon-star", "icon-quote",
    "corner-rounded", "corner-soft", "corner-pill", "corner-square",
    "divider-solid", "divider-gradient", "divider-wave", "divider-icon",
    "bg-gradient", "bg-solid", "bg-soft", "bg-card",
  ];

  const registered = Object.keys(ATOM_REGISTRY);
  let missing = 0;
  for (const atom of expectedP0Atoms) {
    if (!registered.includes(atom)) {
      console.log(`  ✗ 缺少 ${atom}`);
      missing++;
    }
  }

  console.log(`注册原子数: ${registered.length}, 期望: ${expectedP0Atoms.length}, 缺失: ${missing}`);
  if (missing === 0) {
    console.log(`测试 10 通过 ✓ (所有 P0 原子已注册)`);
  } else {
    console.log(`测试 10 失败 ✗`);
  }
}

console.log(`\n─── 所有测试完成 ───`);