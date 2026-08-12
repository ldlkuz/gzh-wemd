/**
 * validate-theme.cjs — 验证主题包 manifest.json 是否符合规范
 *
 * 用法：node scripts/validate-theme.cjs
 */
const path = require("path");

// 加载主程序 validator
const { validateThemePackageManifest } = require(
  path.resolve(__dirname, "../../../packages/core/dist/theme-registry/ThemeValidator.js"),
);

const manifest = require(
  path.resolve(__dirname, "../output/theme-package/manifest.json"),
);

console.log("🔍 验证 manifest.json...\n");

const result = validateThemePackageManifest(manifest);

if (result.ok) {
  console.log("✅ 验证通过！");
  if (result.errors && result.errors.length > 0) {
    console.log(`\n⚠️  ${result.errors.length} 个警告（不阻断导入）：`);
    for (const err of result.errors) {
      console.log(`  [${err.severity || "warning"}] ${err.path}: ${err.message}`);
      if (err.fix) console.log(`    修复: ${err.fix}`);
    }
  }
} else {
  console.log("❌ 验证失败！");
  for (const err of result.errors) {
    console.log(`  [${err.severity || "error"}] ${err.path}: ${err.message}`);
    if (err.fix) console.log(`    修复: ${err.fix}`);
  }
}

// 统计
const compCount = Object.keys(manifest.components || {}).length;
const compWithCss = Object.entries(manifest.components || {}).filter(
  ([, v]) => v.variantCss && v.variantCss.length > 0,
).length;
console.log(`\n📊 统计：
  组件总数: ${compCount}
  有 variantCss: ${compWithCss}
  无 variantCss: ${compCount - compWithCss}`);