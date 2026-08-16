/**
 * Theme Package Loader —— 统一 zip/JSON 两种导入入口
 *
 * 纯函数，无 DOM 副作用。可被 core / 检测网页 / apps/web 薄封装复用。
 *
 * 三种导入入口：
 *   1. .wemd-theme zip 压缩包（Uint8Array）→ fflate 解压
 *   2. .json manifest 文件（string）→ JSON.parse
 *   3. 粘贴 manifest JSON 文本（string）→ JSON.parse
 *
 * 内部调 Validator，失败返回 {ok:false, errors}
 */

import { unzip, strFromU8, zip } from "fflate";
import { validateThemePackageManifest, scanSvgSafety } from "./ThemeValidator";
import type { ThemePackageManifest } from "../theme-schema/types";
import type { ValidationError } from "../theme-schema/types";
import {
  PSEUDO_ELEMENT_REGEX,
  STRUCTURAL_PSEUDO_REGEX,
  EXTERNAL_LINK_REGEX,
  FORBIDDEN_TAG_REGEX,
} from "../wechatCompat/whitelist";

// ============================================================
// 类型
// ============================================================

export interface LoadedThemePackage {
  manifest: ThemePackageManifest;
  styles: { componentsCss?: string; extrasCss?: string };
  /** 组件骨架模板：componentId → Mustache HTML（来自 templates/*.html 或 manifest.templates） */
  templates: Map<string, string>;
  brand?: { text: string };
  preview?: Uint8Array;
  assets?: { images: Map<string, string> }; // key → base64 data URL
  rawZip?: Uint8Array; // 用于导出时往返
}

export interface LoaderSuccess {
  ok: true;
  value: LoadedThemePackage;
  /** 校验通过时携带的警告列表（例如孤立资源、大体积资源） */
  warnings?: ValidationError[];
}

export interface LoaderFailure {
  ok: false;
  errors: ValidationError[];
}

export type LoaderResult = LoaderSuccess | LoaderFailure;

// ============================================================
// 常量
// ============================================================

// ============================================================
// 辅助：扫描 CSS 内容中的安全问题
// ============================================================

function scanCssSafety(css: string, filePath: string): ValidationError[] {
  const errors: ValidationError[] = [];

  if (PSEUDO_ELEMENT_REGEX.test(css)) {
    const match = css.match(PSEUDO_ELEMENT_REGEX);
    errors.push({
      path: filePath,
      message: `styles/components.css 包含禁用的伪元素 ${match?.[0] ?? "::"}。微信公众号不支持伪元素，复制到公众号后样式会静默丢失`,
    });
  }

  if (STRUCTURAL_PSEUDO_REGEX.test(css)) {
    const match = css.match(STRUCTURAL_PSEUDO_REGEX);
    errors.push({
      path: filePath,
      message: `styles/components.css 包含禁用的结构伪类 ${match?.[0] ?? ":nth-child"}。微信公众号不支持，请用 class 选择器替代`,
    });
  }

  if (EXTERNAL_LINK_REGEX.test(css)) {
    errors.push({
      path: filePath,
      message: "styles/components.css 包含外链 url(http...)，禁止引用外部资源",
    });
  }

  if (FORBIDDEN_TAG_REGEX.test(css)) {
    errors.push({
      path: filePath,
      message: "styles/components.css 包含禁止的 <style> 或 <script> 标签",
    });
  }

  return errors;
}

// ============================================================
// 辅助：MIME 类型推断
// ============================================================

function getImageMime(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "png":
      return "image/png";
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "gif":
      return "image/gif";
    case "svg":
      return "image/svg+xml";
    case "webp":
      return "image/webp";
    case "bmp":
      return "image/bmp";
    default:
      return "image/png";
  }
}

/** 将 Uint8Array 转换为 base64 data URL */
function uint8ToDataUrl(data: Uint8Array, filename: string): string {
  const mime = getImageMime(filename);
  const base64 = btoa(String.fromCharCode(...data));
  return `data:${mime};base64,${base64}`;
}

// ============================================================
// 从 JSON 字符串加载
// ============================================================

/**
 * 从 manifest JSON 字符串加载主题包
 *
 * @param json - manifest JSON 字符串
 * @returns LoaderResult
 */
export function loadThemePackageFromJSON(json: string): LoaderResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return {
      ok: false,
      errors: [
        { path: "/", message: "JSON 解析失败，请检查 manifest 格式是否正确" },
      ],
    };
  }

  const validation = validateThemePackageManifest(parsed);
  if (!validation.ok) {
    return { ok: false, errors: validation.errors };
  }

  return {
    ok: true,
    value: {
      manifest: validation.value,
      styles: {},
      templates: new Map(Object.entries(validation.value.templates ?? {})),
    },
  };
}

// ============================================================
// 从 zip 压缩包加载
// ============================================================

/**
 * 从 .wemd-theme zip 压缩包（Uint8Array）加载主题包
 *
 * 解压并提取：
 *  - manifest.json（必填）
 *  - styles/components.css（可选）
 *  - styles/extras.css（可选）
 *  - brand.md（可选）
 *  - preview.png（可选，也支持 .jpg/.webp）
 *  - assets/images/xxx（可选）
 *
 * @param zipData - zip 压缩包的 Uint8Array 数据
 * @returns Promise<LoaderResult>
 */
export async function loadThemePackageFromZip(
  zipData: Uint8Array,
): Promise<LoaderResult> {
  // 解压
  let entries: Record<string, Uint8Array>;
  try {
    entries = await unzipAsync(zipData);
  } catch {
    return {
      ok: false,
      errors: [
        {
          path: "/",
          message: "zip 解压失败，请确认文件是否为有效的 .wemd-theme 压缩包",
        },
      ],
    };
  }

  const errors: ValidationError[] = [];

  // 1. manifest.json（必填）
  const manifestRaw = entries["manifest.json"];
  if (!manifestRaw) {
    return {
      ok: false,
      errors: [{ path: "/", message: "zip 压缩包中缺少 manifest.json 文件" }],
    };
  }

  let manifest: ThemePackageManifest;
  try {
    const jsonStr = strFromU8(manifestRaw);
    const parsed = JSON.parse(jsonStr);
    const validation = validateThemePackageManifest(parsed);
    if (!validation.ok) {
      return { ok: false, errors: validation.errors };
    }
    manifest = validation.value;
  } catch {
    return {
      ok: false,
      errors: [
        { path: "/manifest.json", message: "manifest.json JSON 解析失败" },
      ],
    };
  }

  // 2. styles/components.css（可选）
  const componentsCssRaw = entries["styles/components.css"];
  let componentsCss: string | undefined;
  if (componentsCssRaw) {
    componentsCss = strFromU8(componentsCssRaw);
    // 安全性扫描
    errors.push(...scanCssSafety(componentsCss, "styles/components.css"));
  }

  // 3. styles/extras.css（可选）
  const extrasCssRaw = entries["styles/extras.css"];
  let extrasCss: string | undefined;
  if (extrasCssRaw) {
    extrasCss = strFromU8(extrasCssRaw);
  }

  // 4. brand.md（可选）
  const brandRaw = entries["brand.md"];
  let brand: { text: string } | undefined;
  if (brandRaw) {
    brand = { text: strFromU8(brandRaw) };
  }

  // 5. preview.png（可选）
  const previewRaw =
    entries["preview.png"] ?? entries["preview.jpg"] ?? entries["preview.webp"];

  // 6. assets/images/xxx（可选）
  // 6a. 解压 + 把独立 SVG 丢到 scanSvgSafety
  const images = new Map<string, string>();
  let totalAssetBytes = 0;
  const zipAssetPaths = new Set<string>();
  for (const [path, data] of Object.entries(entries)) {
    if (!path.startsWith("assets/images/") || data.length === 0) continue;
    const key = path.replace("assets/images/", "");
    zipAssetPaths.add(path);
    images.set(key, uint8ToDataUrl(data, key));
    totalAssetBytes += data.length;
    // SVG 安全扫描
    if (/\.(svg)$/i.test(key)) {
      try {
        const text = strFromU8(data);
        errors.push(...scanSvgSafety(text, `/${path}#svg-content`));
      } catch {
        /* 无法作为 UTF-8 解析的 SVG 不强制报错，交给导入后预览阶段发现 */
      }
    }
    if (data.length > 2 * 1024 * 1024) {
      errors.push({
        path: `/${path}`,
        severity: "warning",
        message: `资源文件 ${path} 约 ${(data.length / 1024 / 1024).toFixed(1)} MB，体积较大。请确认这是主题装饰资源（每篇文章都会出现），不是某篇文章专属的内容插图`,
        fix: "如果是产品图/实拍图/正文插画等内容资源，请在 Markdown 中通过图床插入，不要放进主题包",
      });
    }
  }

  if (totalAssetBytes > 15 * 1024 * 1024) {
    errors.push({
      path: "/assets/images",
      severity: "warning",
      message: `主题包 assets/images/ 总计约 ${(totalAssetBytes / 1024 / 1024).toFixed(1)} MB，可能混入了内容大图`,
      fix: "只保留会自动出现在每篇文章里的品牌元素（Logo/装饰 SVG），其它文章专属的图片请在 Markdown 中用图床插入",
    });
  }

  // 6b. manifest 声明的 assets/ 路径在 zip 中不存在 → warning（不阻断导入，仅该资源失效）
  if (manifest.assets?.images && Array.isArray(manifest.assets.images)) {
    manifest.assets.images.forEach((img, i) => {
      if (
        typeof (img as any).src === "string" &&
        (img as any).src.startsWith("assets/")
      ) {
        const p = (img as any).src as string;
        if (!entries[p]) {
          errors.push({
            path: `/assets/images/${i}/src`,
            severity: "warning",
            message: `manifest 声明 src="${p}"，但 zip 中未找到对应文件，该资源将失效。资源问题不阻断导入`,
            fix: `将文件 ${p} 加入 zip 对应目录；或改为直接内联 base64 data URL；或移除不存在的资源声明`,
          });
        }
      }
    });
  }

  // 6c. manifest 中声明的 data URL 资源也加入 images Map
  if (manifest.assets?.images && Array.isArray(manifest.assets.images)) {
    for (const img of manifest.assets.images) {
      const key = (img as any).key;
      const src = (img as any).src;
      if (typeof key === "string" && typeof src === "string") {
        // data URL 内联资源直接加入
        if (src.startsWith("data:")) {
          images.set(key, src);
        }
        // assets/images/ 路径的资源已在上面 6a 处理
      }
    }
  }

  // 6d. 孤立资源 warning：zip 里有 assets/images/xxx，但 manifest.assets.images 没注册这个 key
  // 注意：manifest 里 src 是 "assets/images/logo.svg" 的 key 就是 "assets/images/logo.svg" 对应文件名
  if (manifest.assets?.images && Array.isArray(manifest.assets.images)) {
    const manifestKeys = new Set<string>();
    for (const img of manifest.assets.images) {
      const src = (img as any).src;
      const key = (img as any).key;
      if (typeof key === "string") manifestKeys.add(key.trim().toLowerCase());
      if (typeof src === "string" && src.startsWith("assets/images/")) {
        const fname = src.slice("assets/images/".length);
        manifestKeys.add(fname.toLowerCase());
        manifestKeys.add(src.toLowerCase());
      }
    }
    for (const p of zipAssetPaths) {
      const fname = p.slice("assets/images/".length).toLowerCase();
      const used = manifestKeys.has(fname) || manifestKeys.has(p.toLowerCase());
      // 顺带检查 CSS 里是否有 var(--wemd-asset-xxx) 用到
      const safeKey = fname.replace(/[^a-zA-Z0-9_-]/g, "-");
      const assetVarName = `--wemd-asset-${safeKey}`;
      const allCss = (componentsCss ?? "") + "\n" + (extrasCss ?? "");
      const usedInCss = allCss.includes(assetVarName);
      if (!used && !usedInCss) {
        errors.push({
          path: `/${p}`,
          severity: "warning",
          message: `资源文件 ${p} 未在 manifest.assets.images 注册且未在 CSS 中通过 var(${assetVarName}) 引用，可能是孤立资源`,
          fix: `如果需要使用该资源，在 manifest.assets.images 中增加 { key: "${fname.replace(/\.[^.]+$/, "")}", src: "${p}" } 的声明，并在 CSS 中通过 var(${assetVarName}) 引用；否则可以从 zip 中移除以减小包体积`,
        });
      }
    }
  }

  // 7. templates/*.html（组件骨架，可选）→ 先收 zip 文件，manifest 内嵌随后覆盖
  const templates = new Map<string, string>();
  for (const [path, data] of Object.entries(entries)) {
    const m = /^templates\/([a-z][a-z0-9-]*)\.html$/.exec(path);
    if (m && data.length > 0) {
      templates.set(m[1], strFromU8(data));
    }
  }
  for (const [key, tpl] of Object.entries(manifest.templates ?? {})) {
    templates.set(key, tpl);
  }

  // 有 error 级别的问题阻断导入；warning 允许导入但仍返回给调用方展示
  const hasErrors = errors.some((e) => e.severity !== "warning");
  if (hasErrors) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    value: {
      manifest,
      styles: { componentsCss, extrasCss },
      templates,
      brand,
      preview: previewRaw,
      assets: images.size > 0 ? { images } : undefined,
      rawZip: zipData,
    },
    warnings: errors.length > 0 ? errors : undefined,
  } as LoaderSuccess;
}

// ============================================================
// 辅助：fflate unzip 异步包装
// ============================================================

function unzipAsync(data: Uint8Array): Promise<Record<string, Uint8Array>> {
  return new Promise((resolve, reject) => {
    unzip(data, (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
}

// ============================================================
// 重新导出 zip（用于主题包导出功能，Phase 6）
// ============================================================

/**
 * 将 LoadedThemePackage 重新打包为 .wemd-theme zip
 *
 * @param pkg - 已加载的主题包
 * @returns zip 压缩包的 Uint8Array
 */
export async function repackThemePackage(
  pkg: LoadedThemePackage,
): Promise<Uint8Array> {
  const files: Record<string, Uint8Array> = {};

  // manifest.json
  files["manifest.json"] = new TextEncoder().encode(
    JSON.stringify(pkg.manifest, null, 2),
  );

  // styles/components.css
  if (pkg.styles.componentsCss) {
    files["styles/components.css"] = new TextEncoder().encode(
      pkg.styles.componentsCss,
    );
  }

  // styles/extras.css
  if (pkg.styles.extrasCss) {
    files["styles/extras.css"] = new TextEncoder().encode(pkg.styles.extrasCss);
  }

  // brand.md
  if (pkg.brand?.text) {
    files["brand.md"] = new TextEncoder().encode(pkg.brand.text);
  }

  // templates/<id>.html（组件骨架）
  if (pkg.templates) {
    for (const [id, tpl] of pkg.templates) {
      files[`templates/${id}.html`] = new TextEncoder().encode(tpl);
    }
  }

  // preview.png
  if (pkg.preview) {
    files["preview.png"] = pkg.preview;
  }

  // assets/images/
  if (pkg.assets?.images) {
    for (const [key, dataUrl] of pkg.assets.images) {
      const base64 = dataUrl.split(",")[1];
      if (base64) {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        files[`assets/images/${key}`] = bytes;
      }
    }
  }

  return new Promise((resolve, reject) => {
    zip(files, (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
}
