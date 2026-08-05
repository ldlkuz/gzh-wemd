/**
 * sync-skill-spec.mjs
 *
 * 从 core 包的 componentRegistry.ts 导出常量，自动生成 Skill 技能包的
 * spec/component-registry.md 文件，确保 Skill 文档与 Validator 规则同源。
 *
 * 用法：
 *   node scripts/sync-skill-spec.mjs
 *
 * CI 会在 core 包变更时运行此脚本并检查 diff，diff 非空则阻断 PR。
 */

import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

// 读取 componentRegistry.ts 源码
const registryPath = resolve(
  root,
  "packages/core/src/theme-registry/componentRegistry.ts"
);
const registrySource = readFileSync(registryPath, "utf-8");

// 解析 LEGAL_COMPONENTS 数组
function extractArray(source, varName) {
  const regex = new RegExp(
    `${varName}\\s*=\\s*\\[([\\s\\S]*?)\\n\\]\\s*as\\s*const`,
    "m"
  );
  const match = source.match(regex);
  if (!match) return [];
  const body = match[1];
  const items = [];
  const strRegex = /"([^"]+)"/g;
  let m;
  while ((m = strRegex.exec(body)) !== null) {
    items.push(m[1]);
  }
  return items;
}

// 解析 BUILTIN_PRESET_VARIANTS
function extractVariantMap(source) {
  const regex = /BUILTIN_PRESET_VARIANTS[^=]*=\s*\{([\s\S]*?)\n\};/;
  const match = source.match(regex);
  if (!match) return {};

  const body = match[1];
  const result = {};
  // 匹配每一行: "key": new Set([...]),
  const entryRegex = /"([^"]+)":\s*new Set\(\[([\s\S]*?)\]\)/g;
  let entryMatch;
  while ((entryMatch = entryRegex.exec(body)) !== null) {
    const key = entryMatch[1];
    const vals = [];
    const vRegex = /"([^"]+)"/g;
    let vm;
    while ((vm = vRegex.exec(entryMatch[2])) !== null) {
      vals.push(vm[1]);
    }
    result[key] = vals;
  }
  return result;
}

// 解析简单字符串数组（如 LEGAL_DENSITY_VALUES, SUPPORTED_SDK_VERSIONS）
// 注意：不强制 `\n` 前缀，兼容单行和跨行数组格式
function extractSimpleArray(source, varName) {
  const regex = new RegExp(
    `${varName}\\s*=\\s*\\[([\\s\\S]*?)\\]\\s*as\\s*const`,
  );
  const match = source.match(regex);
  if (!match) return [];
  const items = [];
  const strRegex = /"([^"]+)"/g;
  let m;
  while ((m = strRegex.exec(match[1])) !== null) {
    items.push(m[1]);
  }
  return items;
}

// 提取数据
const components = extractArray(registrySource, "LEGAL_COMPONENTS");
const variants = extractVariantMap(registrySource);
const densityValues = extractSimpleArray(registrySource, "LEGAL_DENSITY_VALUES");
const sdkVersions = extractSimpleArray(registrySource, "SUPPORTED_SDK_VERSIONS");

// 分组组件
const groups = [];
let currentGroup = { name: "", items: [] };
const lines = registrySource.split("\n");
for (const line of lines) {
  const groupMatch = line.match(/\/\/\s*(.+?组)\s*(?:[（(]\s*(\d+)\s*[）)])/);
  if (groupMatch) {
    if (currentGroup.items.length > 0) {
      groups.push(currentGroup);
    }
    currentGroup = { name: groupMatch[1], items: [] };
  }
  const compMatch = line.match(/"([^"]+)"/);
  if (compMatch && components.includes(compMatch[1]) && !currentGroup.items.includes(compMatch[1])) {
    currentGroup.items.push(compMatch[1]);
  }
}
if (currentGroup.items.length > 0) {
  groups.push(currentGroup);
}

// 确保所有组件都被分组
const groupedComponents = new Set(groups.flatMap((g) => g.items));
const ungrouped = components.filter((c) => !groupedComponents.has(c));
if (ungrouped.length > 0) {
  groups.push({ name: "独立组件", items: ungrouped });
}

// 生成 Markdown
let md = `# 合法组件注册表

> 此文件由 \`scripts/sync-skill-spec.mjs\` 从 \`packages/core/src/theme-registry/componentRegistry.ts\` 自动生成。
> 禁止手抄，修改请更新 core 包常量后重新运行脚本。

## 合法组件全集（${components.length} 个）

`;

for (const group of groups) {
  md += `### ${group.name}（${group.items.length} 个）\n`;
  md += group.items.map((c) => `\`${c}\``).join(", ") + "\n\n";
}

md += `## 轨道 A 内置预设 variant 表（仅供内置主题参考）

| 组件 | 预设 variant |
|------|-------------|
`;

const variantEntries = Object.entries(variants);
if (variantEntries.length > 0) {
  for (const [key, vals] of variantEntries) {
    md += `| \`${key}\` | ${vals.map((v) => `\`${v}\``).join(", ")} |\n`;
  }
} else {
  md += `| — | — |\n`;
}

md += `
> AI 主题不依赖这些预设 variant。AI 主题必须通过 \`variantCss\` 字段提供自定义 CSS（轨道 B）。

## 合法 tone 值

`;

const toneValues = ["warm", "minimal", "elegant", "rational", "serious", "modern", "playful"];
md += toneValues.map((v) => `\`${v}\``).join(", ") + "\n\n";

md += `## 合法 density 值

${densityValues.map((v) => `\`${v}\``).join(", ")}

## 支持的 SDK 版本

${sdkVersions.map((v) => `\`${v}\``).join(", ")}
`;

// 写入文件
const outputPath = resolve(
  root,
  "skills/wemd-theme-designer/spec/component-registry.md"
);
writeFileSync(outputPath, md, "utf-8");

console.log("✅ spec/component-registry.md 已从 core 包常量同步生成");
console.log(`   合法组件: ${components.length} 个`);
console.log(`   预设 variant 组件: ${variantEntries.length} 个`);
console.log(`   输出路径: ${outputPath}`);