/* 诊断并作为打包门禁：扫描「内联 style 中，简写(shorthand) 出现在其同族长属性(longhand) 之后」的实例。
 *
 * 这样的简写按浏览器出现顺序求值，会把前面已内联的长属性覆盖掉，导致视觉/间距丢失
 * （典型：`margin: 0` 排在 `margin-bottom: 24px` 之后，垂直间距被清零）。
 *
 * 家族集合与 packages/core/src/ThemeProcessor.ts 的 SHORTHAND_FAMILIES 保持一致，
 * 确保「打包门禁」检测到的风险和「内联器」规避的风险是同一套。
 *
 * 用法（CLI）：node scan-shorthand.cjs <html-file>
 * 或作为模块：const { findShorthandIssues } = require("./scan-shorthand.cjs")
 */
const fs = require("fs");
const path = require("path");

// 简写家族表 = 主程序内联器真源 SHORTHAND_FAMILIES 的单向快照（见 generate-shared-snapshot.cjs）。
// 不在此手抄，避免与主程序漂移。运行时不依赖主程序构建产物，只读此已提交 JSON。
const SNAPSHOT_FILE = path.resolve(
  __dirname,
  "../reference/shared-rules/shorthand-families.json",
);
const SHORTHAND_FAMILIES = JSON.parse(fs.readFileSync(SNAPSHOT_FILE, "utf-8"));

function shortTag(openTag) {
  const mm = openTag.match(/^<([a-zA-Z0-9]+)/);
  if (!mm) return openTag.slice(0, 30);
  return mm[1];
}

/**
 * 扫描给定 HTML 片段，返回「简写在长属性之后」的潜在覆盖问题。
 * @param {string} html
 * @returns {{ scanned: number, problems: Array<{tag:string;family:string;style:string;shortPos:number;hit:number}> }}
 */
function findShorthandIssues(html) {
  const styleRe = /<[^>]*\bstyle\s*=\s*"([^"]*)"[^>]*>/gi;
  let m;
  const problems = [];
  let scanned = 0;

  while ((m = styleRe.exec(html)) !== null) {
    const styleText = m[1];
    const openTag = m[0];
    scanned++;

    const props = [];
    styleText.split(";").forEach((seg) => {
      const ci = seg.indexOf(":");
      if (ci <= 0) return;
      const key = seg.substring(0, ci).trim();
      if (key) props.push({ key, lower: key.toLowerCase() });
    });

    for (const family of SHORTHAND_FAMILIES) {
      const shortPos = props.findIndex((p) => p.lower === family.short);
      if (shortPos < 0) continue;
      // 危险：存在位于「简写之前」的同族长属性（后来的简写会覆盖前面的长属性）
      const earlierLong = props
        .map((p, idx) => (family.longhands.includes(p.lower) ? idx : -1))
        .filter((i) => i >= 0)
        .find((i) => i < shortPos);
      if (earlierLong !== undefined) {
        problems.push({
          tag: shortTag(openTag),
          family: family.short,
          style: styleText,
          shortPos,
          hit: earlierLong,
        });
      }
    }
  }

  return { scanned, problems };
}

function printResult({ scanned, problems }) {
  if (problems.length === 0) {
    console.log(`✅ 未发现「简写在长属性之后」的实例（扫描 ${scanned} 个 style）`);
  } else {
    console.log(`⚠️  发现 ${problems.length} 处「简写覆盖其前长属性」潜在问题：\n`);
    problems.forEach((p, i) => {
      console.log(`[${i + 1}] <${p.tag}> · ${p.family}`);
      console.log(`    style: ${p.style.slice(0, 220)}${p.style.length > 220 ? "…" : ""}`);
      console.log("");
    });
  }
}

// 作为 CLI 运行
if (require.main === module) {
  const file = process.argv[2];
  if (!file) {
    console.error("用法: node scan-shorthand.cjs <html-file>");
    process.exit(1);
  }
  const html = fs.readFileSync(file, "utf-8");
  printResult(findShorthandIssues(html));
}

module.exports = { findShorthandIssues, SHORTHAND_FAMILIES };