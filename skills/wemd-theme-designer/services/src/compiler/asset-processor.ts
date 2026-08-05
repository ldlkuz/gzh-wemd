// ============================================================
// Asset Processor — 资源处理器
// ============================================================
// 处理 SVG、图片等资源，转换为公众号兼容的格式。

// ── 将 SVG 转换为 data URL ──
export function svgToDataUrl(svg: string): string {
  // 清理 SVG（移除可能不安全的内容）
  const cleaned = sanitizeSvg(svg);

  // 编码为 base64
  const base64 = Buffer.from(cleaned).toString("base64");
  return `data:image/svg+xml;base64,${base64}`;
}

// ── 将图片 URL 转换为 data URL（仅限小图片） ──
export async function imageToDataUrl(url: string): Promise<string | null> {
  try {
    // 已经是 data URL
    if (url.startsWith("data:")) return url;

    const response = await fetch(url, {
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return null;

    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

// ── 清理 SVG 内容 ──
function sanitizeSvg(svg: string): string {
  let cleaned = svg;

  // 移除 script 标签
  cleaned = cleaned.replace(/<script[\s\S]*?<\/script>/gi, "");

  // 移除事件处理属性
  cleaned = cleaned.replace(/\s+on\w+\s*=\s*["'][^"']*["']/gi, "");

  // 移除 javascript: 链接
  cleaned = cleaned.replace(/href\s*=\s*["']\s*javascript:.*?["']/gi, 'href="#"');

  // 确保有 xmlns
  if (!cleaned.includes("xmlns")) {
    cleaned = cleaned.replace(/<svg\s/i, '<svg xmlns="http://www.w3.org/2000/svg" ');
  }

  return cleaned;
}

// ── 处理资源引用（替换为 data URL） ──
export function processResourceReferences(
  html: string,
  svgAssets: Record<string, string>
): string {
  let result = html;

  // 替换 SVG 文件引用
  for (const [name, svgDataUrl] of Object.entries(svgAssets)) {
    const regex = new RegExp(`url\\(["']?${escapeRegex(name)}\\.svg["']?\\)`, "gi");
    result = result.replace(regex, `url(${svgDataUrl})`);

    // 也替换 src 引用
    const srcRegex = new RegExp(`src\\s*=\\s*["']${escapeRegex(name)}\\.svg["']`, "gi");
    result = result.replace(srcRegex, `src="${svgDataUrl}"`);
  }

  return result;
}

// ── 生成兼容的 CSS background-image（SVG 降级） ──
export function generateSvgBackground(
  svgDataUrl: string,
  fallbackColor?: string
): string {
  if (fallbackColor) {
    return `${fallbackColor}; background-image: url(${svgDataUrl}); background-repeat: no-repeat;`;
  }
  return `background-image: url(${svgDataUrl}); background-repeat: no-repeat;`;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}