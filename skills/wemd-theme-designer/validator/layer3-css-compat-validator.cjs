/**
 * layer3-css-compat-validator.cjs — 可渲染性验证第 3 层：CSS Compatibility Validator
 *
 * 职责：校验主题 CSS 产物在微信公众平台的兼容性。这一层解决「复制到公众号会不会坏」：
 * 微信只支持受限 CSS 子集，遇到不支持的写法会「静默丢失」——这种问题抓取层（只校验合法性）
 * 和布局层（只校验排版意图）都抓不到，必须在导出前拦截。
 *
 * 真源 = 主程序 wechatCompat/whitelist 的 FORBIDDEN_CSS_RULES 快照
 * （reference/shared-rules/wechat-css-rules.json，由 generate-shared-snapshot.cjs 单向生成）。
 * 重叠规则的正则一律从快照按 id 重建，禁止在本文件手抄，避免与主程序漂移。
 * layer3 保留自己的业务分层：severity（error/warning）、合并提示（W3/W4/W5）、
 * 以及主程序没有的独有项（W8 嵌套 var 雷区 BUG-0010、W10 display:grid 提示）。
 *
 * 校验点（均带「修复建议」，因为这些是开发交付物，不只报错）：
 *   W1 伪元素 ::before / ::after / ::marker / ::selection / ::first-letter / ::first-line
 *   W2 结构伪类 :first-child / :nth-child / :last-child / :only-child 等
 *   W3 position: fixed / sticky（微信不支持，会被丢弃）
 *   W4 @keyframes / animation（动画会被丢弃，且 Keyframe 内样式不生效）
 *   W5 backdrop-filter / filter / mix-blend-mode（毛玻璃等效果丢失）
 *   W6 外链 url(http(s)://)（公众号环境跨域不加载）
 *   W7 zip 内相对路径 url(assets/…)（导出后 404）→ var(--wemd-asset-*) 或 data:
 *   W8 嵌套 var fallback `var(--a, var(--b))`（BUG-0010：resolveCssVars 截断引用）【layer3 独有】
 *   W9 标签 <style> / <script>（不允许注入）
 *   W10 display:grid（主程序移动窄优先，grid 依赖支持的场合有限；给出提示而非硬错误）【layer3 独有】
 *
 * 设计：纯函数。对「属性 + 场景」给不同 severity —— 使用即校验，值驱动（G3 类似）。
 * 严重则 errors，可从下述规则表 severity 区分；不影响布局的给 warnings。
 *
 * 用法：node validator/layer3-css-compat-validator.cjs [theme-name]
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const THEMES_DIR = path.join(ROOT, "themes");

// ============================================================
// 快照加载：主程序兼容规则的单一真源（带稳定 id）
// ============================================================
const SNAPSHOT_FILE = path.resolve(
  __dirname,
  "../reference/shared-rules/wechat-css-rules.json",
);
const SNAPSHOT_RULES = JSON.parse(fs.readFileSync(SNAPSHOT_FILE, "utf-8"));
const snapshotById = new Map(SNAPSHOT_RULES.map((r) => [r.id, r]));
/** 按 id 取原子正则（快照 → RegExp），缺 id 时报错，不许回退手抄 */
function ruleRegex(id) {
  const atom = snapshotById.get(id);
  if (!atom) {
    throw new Error(
      `[layer3] 快照缺少规则 id="${id}", 请重新运行 generate-shared-snapshot.cjs 并提交最新快照`,
    );
  }
  return new RegExp(atom.pattern, atom.flags);
}

// ============================================================
// 规则表
//   - 与主程序重叠的项（W1~W7、W9）：regex 一律从快照按 id 重建，不手抄。
//   - layer3 独有项（W8 嵌套 var、W10 display:grid）：保留本地正则。
//   - W3/W4/W5 由一个快照 id 无法表达的合并语义，故提供「子规则 id 数组」，
//     逐 atom 校验，共用同一 code/severity/fix（layer3 的合并提示仍生效）。
// ============================================================
const RULES = [
  {
    code: "W1",
    name: "伪元素",
    sourceId: "pseudo-element",
    severity: "error",
    fix: "删除或改用真实 <span> 子元素；公众号不支持伪元素，装饰会静默丢失。",
  },
  {
    code: "W2",
    name: "结构伪类",
    sourceId: "structural-pseudo",
    severity: "error",
    fix: "结构伪类在公众号中支持不稳定，请改用具体 class 选择器（骨架已物化 wemd-{abbr}-{name}）。",
  },
  {
    code: "W3",
    name: "固定定位",
    sourceIds: ["position-fixed", "position-sticky"],
    severity: "error",
    fix: "公众号不支持 fixed/sticky，会被丢弃；请改用文档流布局。",
  },
  {
    code: "W4",
    name: "动画",
    sourceIds: ["keyframes", "animation"],
    severity: "warning",
    fix: "公众号不支持 @keyframes/animation，动画不会播放（Keyframe 内样式不生效），请移除或保留静态态。",
  },
  {
    code: "W5",
    name: "高级滤镜混合",
    sourceIds: ["backdrop-filter", "filter", "mix-blend-mode"],
    severity: "warning",
    fix: "公众号支持有限，backdrop-filter/filter/mix-blend-mode 可能丢失；请用 background rgba 模拟半透明。",
  },
  {
    code: "W6",
    name: "外链资源",
    sourceId: "external-link",
    severity: "error",
    fix: "外部 url() 在公众号环境跨域不加载；请内联为 data: URI。",
  },
  {
    code: "W7",
    name: "zip 相对路径",
    sourceId: "zip-asset",
    severity: "error",
    fix: "CSS 中直接写 assets/ 路径导出后会 404；请用 var(--wemd-asset-<key>) 或内联 data:。",
  },
  {
    code: "W8",
    name: "嵌套 var fallback",
    regex: /var\(\s*--wemd-[\w-]+\s*,\s*var\(/i,
    severity: "error",
    fix: "BUG-0010：嵌套 fallback `var(--a, var(--b))` 会被 resolveCssVars 截断；请改为单层 var 并在根块定义该变量。",
  },
  {
    code: "W9",
    name: "非法标签",
    sourceId: "forbidden-tag",
    severity: "error",
    fix: "样式/脚本标签不允许出现，CSS 产物只能含纯样式规则。",
  },
  {
    code: "W10",
    name: "display:grid",
    regex: /display\s*:\s*grid/i,
    severity: "warning",
    fix: "主程序移动窄优先，grid 在窄屏/公众号支持有限；多卡片建议用 flex-wrap 退化的可行性表达，若确需 grid 请确认目标容器足够窄。",
  },
];

/** 展开每条规则的「校验正则」：来自快照 id 或本地直接 regex */
function regexesForRule(rule) {
  if (rule.sourceIds) return rule.sourceIds.map(ruleRegex);
  if (rule.sourceId) return [ruleRegex(rule.sourceId)];
  return [rule.regex]; // W8/W10：layer3 独有，本地正则
}

// ============================================================
// 主题级入口
// ============================================================
function validateCssCompatibility(css, themeName = "") {
  const errors = [];
  const warnings = [];
  if (typeof css !== "string" || !css.trim()) {
    errors.push({
      code: "W0",
      path: "css",
      message: "CSS 产物为空或未传入，无法进行兼容性校验。",
    });
    return { errors, warnings };
  }

  for (const rule of RULES) {
    // 一条规则（含 W3/W4/W5 多个原子）命中任一即报告一次，避免重复报错
    let found = null;
    for (const regex of regexesForRule(rule)) {
      const m = css.match(regex);
      if (m) {
        found = m[0];
        break;
      }
    }
    if (!found) continue;
    const item = {
      code: rule.code,
      path: themeName ? `${themeName}.css` : "css",
      found,
      message: `${rule.name}：命中「${found}」。`,
      fix: rule.fix,
    };
    if (rule.severity === "error") errors.push(item);
    else warnings.push(item);
  }
  if (errors.length === 0 && warnings.length === 0) {
    warnings.push({
      code: "OK",
      path: themeName ? `${themeName}.css` : "css",
      message: "未命中任何微信不兼容规则。",
      fix: "",
    });
  }
  return { errors, warnings };
}

// ============================================================
// CLI
// ============================================================
if (require.main === module) {
  const target = process.argv[2] || "";
  let names;
  if (target) {
    names = [target];
  } else {
    names = fs.existsSync(THEMES_DIR)
      ? fs.readdirSync(THEMES_DIR).filter((d) =>
          fs.statSync(path.join(THEMES_DIR, d)).isDirectory(),
        )
      : [];
  }

  let totalErrors = 0;
  let totalWarnings = 0;
  for (const name of names) {
    if (!name) continue;
    const cssFile = path.join(THEMES_DIR, name, "css", `${name}.css`);
    if (!fs.existsSync(cssFile)) {
      console.log(`  ⚪ ${name} — 无 css 产物，跳过`);
      continue;
    }
    const css = fs.readFileSync(cssFile, "utf8");
    const { errors, warnings } = validateCssCompatibility(css, name);

    if (errors.length === 0) {
      console.log(`  ✅ ${name} — CSS 兼容性校验通过`);
    } else {
      console.log(`  ❌ ${name} — CSS 兼容性 ${errors.length} 个错误：`);
      for (const e of errors) {
        console.log(`    [${e.code}] ${e.message} → 修复: ${e.fix}`);
      }
      totalErrors += errors.length;
    }
    for (const w of warnings) {
      if (w.code === "OK") continue;
      console.log(`    ⚠️ [${w.code}] ${w.message} → ${w.fix}`);
      totalWarnings++;
    }
  }

  console.log("");
  if (totalErrors > 0) {
    console.error(`🚫 CSS 兼容性校验失败：共 ${totalErrors} 个问题。退出码 1`);
    process.exit(1);
  }
  console.log(`✅ 全部主题 CSS 兼容性校验通过（${totalWarnings} 条建议）。`);
}

module.exports = { validateCssCompatibility, RULES };