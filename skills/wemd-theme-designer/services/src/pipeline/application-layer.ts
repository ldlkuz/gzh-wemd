// ============================================================
// Application Layer — 实现层
// ============================================================
// 根据 Design Blueprint 生成 variantCss 和素材。
// 策略选择遵循 A-E 方案优先级。
// 装饰效果由 Decoration Layer 提供映射，此处仅做组合。

import type { ComponentVariant, MapResult } from "./pipeline-types.ts";

// ── 主入口：生成组件变体 CSS ──
export function generateVariants(
  blueprint: Record<string, unknown>
): ComponentVariant[] {
  const compExpr = blueprint.componentExpression as Record<string, unknown> | undefined;
  const visual = blueprint.visualLanguage as Record<string, unknown> | undefined;
  const colors = visual?.colors as Record<string, string> | undefined;
  const mapped = compExpr?.mappedComponents as Array<Record<string, unknown>> | undefined;

  if (!mapped || !colors) return [];

  // 检查是否有 Decoration Layer 的映射结果
  const decorationMapResult = blueprint.decorationMapResult as MapResult | undefined;
  const decorationPlan = blueprint.decorationPlan as Record<string, unknown> | undefined;

  const variants: ComponentVariant[] = [];

  for (const m of mapped) {
    const comp = m.component as string;
    const variant = m.variant as string;
    const reason = m.reason as string;

    // 优先使用 Decoration Layer 映射的 CSS
    let css: string;
    if (decorationMapResult?.css?.[comp]) {
      // 装饰层提供了该组件的 CSS
      const decoCss = decorationMapResult.css[comp];

      // 还需要生成基础组件样式（颜色、排版等基础属性）
      const baseCss = generateBaseComponentCSS(comp, variant, colors, blueprint);

      // 合并基础样式 + 装饰样式（用 #wemd 包裹）
      css = `#wemd ${baseCss}\n\n#wemd ${decoCss}`;
    } else {
      // 回退到旧方案：硬编码 CSS
      css = generateComponentCSS(comp, variant, colors, blueprint);
    }

    variants.push({ component: comp, variant, variantCss: css, reason });
  }

  return variants;
}

/** 生成基础组件样式（颜色、排版等基础属性，不含装饰） */
function generateBaseComponentCSS(
  component: string,
  variant: string,
  colors: Record<string, string>,
  blueprint: Record<string, unknown>
): string {
  const primary = colors.primary || "#3B82F6";
  const bg = colors.background || "#FFFFFF";
  const text = colors.textPrimary || "#1A1A2E";
  const textSec = colors.textSecondary || "#64748B";
  const border = colors.border || "#E2E8F0";
  const surface = colors.surface || "#F8FAFC";

  // 只生成基础布局和颜色，不包含装饰效果
  const baseCssMap: Record<string, string> = {
    "hero-banner": `.wemd-hero-banner[data-variant="${variant}"] {
  color: #fff;
  padding: 2.5em 1.5em;
  border-radius: 12px;
  text-align: center;
}
.wemd-hero-banner[data-variant="${variant}"] .wemd-hero-title {
  font-size: 1.75em;
  font-weight: 700;
  margin: 0 0 0.5em;
  color: #fff;
}
.wemd-hero-banner[data-variant="${variant}"] .wemd-hero-subtitle {
  font-size: 1em;
  opacity: 0.9;
  color: rgba(255,255,255,0.9);
}`,
    "stats-block": `.wemd-stats-block[data-variant="${variant}"] {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1em;
  padding: 1.5em;
  background: ${surface};
  border-radius: 10px;
  border: 1px solid ${border};
}
.wemd-stats-block[data-variant="${variant}"] .wemd-stat-value {
  font-size: 1.5em;
  font-weight: 700;
  color: ${primary};
}
.wemd-stats-block[data-variant="${variant}"] .wemd-stat-label {
  font-size: 0.85em;
  color: ${textSec};
}`,
    "brand-sign": `.wemd-brand-sign[data-variant="${variant}"] {
  display: flex;
  align-items: center;
  gap: 1em;
  padding: 1.25em;
  border-top: 2px solid ${primary};
  margin-top: 2em;
}
.wemd-brand-sign[data-variant="${variant}"] .wemd-brand-logo {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  background: ${primary};
}
.wemd-brand-sign[data-variant="${variant}"] .wemd-brand-name {
  font-weight: 600;
  color: ${text};
}
.wemd-brand-sign[data-variant="${variant}"] .wemd-brand-desc {
  font-size: 0.85em;
  color: ${textSec};
}`,
    "divider": `.wemd-divider[data-variant="${variant}"] {
  border: none;
  height: 1px;
  margin: 2em 0;
  opacity: 0.5;
}`,
    "callout": `.wemd-callout[data-variant="${variant}"] {
  padding: 1em 1.25em;
  border-radius: 0 8px 8px 0;
  margin: 1.25em 0;
}
.wemd-callout[data-variant="${variant}"] .wemd-callout-title {
  font-weight: 600;
  color: ${primary};
  margin-bottom: 0.25em;
}
.wemd-callout[data-variant="${variant}"] .wemd-callout-content {
  color: ${text};
  font-size: 0.95em;
}`,
    "testimonial-card": `.wemd-testimonial-card[data-variant="${variant}"] {
  background: ${surface};
  border: 1px solid ${border};
  border-radius: 12px;
  padding: 1.5em;
  margin: 1.25em 0;
}
.wemd-testimonial-card[data-variant="${variant}"] .wemd-testimonial-text {
  font-style: italic;
  color: ${text};
  line-height: 1.7;
}
.wemd-testimonial-card[data-variant="${variant}"] .wemd-testimonial-author {
  font-weight: 600;
  color: ${primary};
  margin-top: 0.75em;
}`,
    "code-block": `.wemd-code-block[data-variant="${variant}"] {
  background: #1E293B;
  color: #E2E8F0;
  border-radius: 8px;
  padding: 1.25em;
  font-family: "JetBrains Mono", "Fira Code", monospace;
  font-size: 0.85em;
  overflow-x: auto;
  margin: 1.25em 0;
}`,
    "pullquote": `.wemd-pullquote[data-variant="${variant}"] {
  font-size: 1.2em;
  font-style: italic;
  color: ${primary};
  padding: 0.5em 1em;
  margin: 1.5em 0;
  background: ${surface};
  border-radius: 0 8px 8px 0;
}`,
    "steps": `.wemd-steps[data-variant="${variant}"] {
  padding: 0;
  list-style: none;
}
.wemd-steps[data-variant="${variant}"] .wemd-step {
  padding: 0.75em 0 0.75em 2.5em;
  position: relative;
  border-left: 2px solid ${primary};
  margin-left: 1em;
}
.wemd-steps[data-variant="${variant}"] .wemd-step-marker {
  position: absolute;
  left: -1em;
  top: 0.75em;
  width: 2em;
  height: 2em;
  background: ${primary};
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85em;
  font-weight: 600;
}`,
  };

  return baseCssMap[component] || `.wemd-${component}[data-variant="${variant}"] {
  padding: 1em;
  color: ${text};
}`;
}

// ── 生成 Logo SVG 素材描述 ──
export function generateMaterialDescription(
  blueprint: Record<string, unknown>
): Record<string, string> {
  const expression = blueprint.expression as Record<string, unknown> | undefined;
  const colors = (blueprint.visualLanguage as Record<string, unknown>)?.colors as Record<string, string> | undefined;

  if (!colors) return {};

  const primary = colors.primary || "#3B82F6";
  const isBrand = expression?.type === "brand";

  return {
    "logo-main": isBrand
      ? `<svg viewBox="0 0 120 40" xmlns="http://www.w3.org/2000/svg"><rect width="40" height="40" rx="8" fill="${primary}"/><text x="48" y="28" font-family="system-ui" font-size="20" font-weight="700" fill="${colors.textPrimary}">BRAND</text></svg>`
      : `<svg viewBox="0 0 120 40" xmlns="http://www.w3.org/2000/svg"><text x="0" y="28" font-family="system-ui" font-size="18" font-weight="600" fill="${colors.textPrimary}">@creator</text></svg>`,
    "pattern-dot": `<svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><circle cx="10" cy="10" r="2" fill="${primary}" opacity="0.3"/></svg>`,
    "divider-wave": `<svg viewBox="0 0 120 20" xmlns="http://www.w3.org/2000/svg"><path d="M0 10 Q30 0 60 10 Q90 20 120 10" stroke="${primary}" stroke-width="1.5" fill="none" opacity="0.4"/></svg>`,
  };
}

// ── 生成组件演示 HTML（用于预览） ──
export function generateComponentSourceHtml(
  component: string,
  variant: string
): string {
  const htmlMap: Record<string, string> = {
    "hero-banner": `<section class="wemd-hero-banner" data-variant="${variant}">
  <h1 class="wemd-hero-title">探索未来科技</h1>
  <p class="wemd-hero-subtitle">用创新驱动变革，让技术赋能每一个梦想</p>
</section>`,

    "stats-block": `<div class="wemd-stats-block" data-variant="${variant}">
  <div class="wemd-stat-item">
    <div class="wemd-stat-value">99.9%</div>
    <div class="wemd-stat-label">可用率</div>
  </div>
  <div class="wemd-stat-item">
    <div class="wemd-stat-value">10M+</div>
    <div class="wemd-stat-label">用户数</div>
  </div>
  <div class="wemd-stat-item">
    <div class="wemd-stat-value">150+</div>
    <div class="wemd-stat-label">国家覆盖</div>
  </div>
</div>`,

    "brand-sign": `<div class="wemd-brand-sign" data-variant="${variant}">
  <div class="wemd-brand-logo"></div>
  <div class="wemd-brand-info">
    <div class="wemd-brand-name">品牌名称</div>
    <div class="wemd-brand-desc">用心打造每一款产品</div>
  </div>
</div>`,

    "divider": `<hr class="wemd-divider" data-variant="${variant}" />`,

    "callout": `<div class="wemd-callout" data-variant="${variant}">
  <div class="wemd-callout-title">💡 提示</div>
  <div class="wemd-callout-content">这是一个重要的提示信息，用于吸引读者注意关键内容。</div>
</div>`,

    "testimonial-card": `<div class="wemd-testimonial-card" data-variant="${variant}">
  <p class="wemd-testimonial-text">"这款产品彻底改变了我们的工作方式，团队效率提升了 300%。强烈推荐给每一个追求卓越的团队。"</p>
  <div class="wemd-testimonial-author">— 张三，CTO</div>
</div>`,

    "code-block": `<pre class="wemd-code-block" data-variant="${variant}"><code>function greet(name) {
  return \`你好, \${name}!\`;
}

console.log(greet("世界"));</code></pre>`,

    "pullquote": `<blockquote class="wemd-pullquote" data-variant="${variant}">
  技术的意义不在于本身，而在于它能为人类创造什么价值。
</blockquote>`,

    "steps": `<ol class="wemd-steps" data-variant="${variant}">
  <li class="wemd-step"><span class="wemd-step-marker">★</span>注册账号并完成实名认证</li>
  <li class="wemd-step"><span class="wemd-step-marker">★</span>选择适合你的产品方案</li>
  <li class="wemd-step"><span class="wemd-step-marker">★</span>开始使用，享受高效工作体验</li>
</ol>`,

    "toc-nav": `<nav class="wemd-toc-nav" data-variant="${variant}">
  <div class="wemd-toc-title">目录</div>
  <ul class="wemd-toc-list">
    <li class="wemd-toc-item">第一章：引言</li>
    <li class="wemd-toc-item">第二章：核心概念</li>
    <li class="wemd-toc-item">第三章：实践方法</li>
  </ul>
</nav>`,

    "numbered-heading": `<h2 class="wemd-numbered-heading" data-variant="${variant}">
  <span class="wemd-numbered-index">01</span>
  <span class="wemd-numbered-title">章节标题</span>
</h2>`,

    "section-title": `<h3 class="wemd-section-title" data-variant="${variant}">段落小标题文字</h3>`,

    "quote-card": `<blockquote class="wemd-quote-card" data-variant="${variant}">
  <p class="wemd-quote-text">"生活不止眼前的苟且，还有诗和远方的田野。"</p>
  <cite class="wemd-quote-author">— 高晓松</cite>
</blockquote>`,

    "callout-pro": `<div class="wemd-callout-pro" data-variant="${variant}">
  <div class="wemd-callout-icon">💡</div>
  <div class="wemd-callout-body">
    <strong class="wemd-callout-title">提示标题</strong>
    <p class="wemd-callout-desc">这是一个重要的提示信息。</p>
  </div>
</div>`,

    "faq": `<div class="wemd-faq" data-variant="${variant}">
  <details class="wemd-faq-item" open>
    <summary class="wemd-faq-question">什么是 WeMD？</summary>
    <div class="wemd-faq-answer">WeMD 是一款专注于微信公众号排版的主题设计工具。</div>
  </details>
  <details class="wemd-faq-item">
    <summary class="wemd-faq-question">如何开始使用？</summary>
    <div class="wemd-faq-answer">选择主题模板，编辑文章内容，一键导出即可。</div>
  </details>
</div>`,

    "share-card": `<div class="wemd-share-card" data-variant="${variant}">
  <p class="wemd-share-text">觉得有用就分享给朋友吧</p>
  <div class="wemd-share-buttons">
    <span class="wemd-share-btn">分享到朋友圈</span>
    <span class="wemd-share-btn">分享给好友</span>
  </div>
</div>`,

    "cta-card": `<div class="wemd-cta-card" data-variant="${variant}">
  <h3 class="wemd-cta-title">立即报名</h3>
  <p class="wemd-cta-subtitle">限时优惠，名额有限</p>
  <p class="wemd-cta-body">加入我们，开启你的学习之旅</p>
  <a class="wemd-cta-button" href="#">立即报名 →</a>
</div>`,

    "tag-label": `<div class="wemd-tag-label" data-variant="${variant}">
  <span class="wemd-tag">前端开发</span>
  <span class="wemd-tag">Vue3</span>
  <span class="wemd-tag">TypeScript</span>
</div>`,

    "follow-bar": `<div class="wemd-follow-bar" data-variant="${variant}">
  <span class="wemd-follow-hint">点击关注，获取更多干货</span>
  <span class="wemd-follow-btn">关注</span>
</div>`,

    "divider-fancy": `<div class="wemd-divider-fancy" data-variant="${variant}">
  <span class="wemd-divider-line"></span>
  <span class="wemd-divider-icon">✦</span>
  <span class="wemd-divider-line"></span>
</div>`,

    "styled-table": `<div class="wemd-styled-table" data-variant="${variant}">
  <table class="wemd-table">
    <thead><tr><th>功能</th><th>基础版</th><th>专业版</th></tr></thead>
    <tbody>
      <tr><td>数据分析</td><td>✓</td><td>✓</td></tr>
      <tr><td>API 接入</td><td>—</td><td>✓</td></tr>
      <tr><td>技术支持</td><td>邮件</td><td>7×24 小时</td></tr>
    </tbody>
  </table>
</div>`,

    "code-frame": `<div class="wemd-code-frame" data-variant="${variant}">
  <div class="wemd-code-header">
    <span class="wemd-code-lang">JavaScript</span>
  </div>
  <pre class="wemd-code-body"><code>function greet(name) {
  return \`你好, \${name}!\`;
}
console.log(greet("世界"));</code></pre>
</div>`,

    "article-section": `<div class="wemd-article-section" data-variant="${variant}">
  <div class="wemd-section-marker">§</div>
  <div class="wemd-section-content">
    <p>引用原文第 1-3 段内容，作为文章的背景介绍和上下文铺垫。</p>
  </div>
</div>`,

    "magazine-cover": `<div class="wemd-magazine-cover" data-variant="${variant}">
  <div class="wemd-cover-subtitle">Summer Breeze</div>
  <h2 class="wemd-cover-title">盛夏时光</h2>
  <div class="wemd-cover-divider"></div>
  <p class="wemd-cover-desc">愿所有美好<br>如夏日微风一般如期而至。</p>
</div>`,

    "section-divider": `<div class="wemd-section-divider" data-variant="${variant}">
  <span class="wemd-section-part">PART 01</span>
  <h3 class="wemd-section-title">夏日故事</h3>
</div>`,

    "image-card": `<figure class="wemd-image-card" data-variant="${variant}">
  <div class="wemd-image-card-img" style="background:#e8f4f8;height:160px;border-radius:8px;display:flex;align-items:center;justify-content:center;color:#999">🖼️ 图片占位</div>
  <figcaption class="wemd-image-card-caption">图片说明文字</figcaption>
</figure>`,

    "text-card": `<div class="wemd-text-card" data-variant="${variant}">
  <p>七月盛夏，阳光透过树叶洒落在地面。</p>
  <p>微风轻轻吹过，带来了青草与花朵的香气。</p>
</div>`,

    "full-quote": `<blockquote class="wemd-full-quote" data-variant="${variant}">
  <p>愿这个夏天，所有期待都有回应。</p>
</blockquote>`,

    "two-column-cards": `<div class="wemd-two-column-cards" data-variant="${variant}">
  <div class="wemd-two-col-item">
    <span class="wemd-col-icon">☀️</span>
    <h4 class="wemd-col-title">阳光</h4>
    <p class="wemd-col-desc">每一天都充满能量</p>
  </div>
  <div class="wemd-two-col-item">
    <span class="wemd-col-icon">🍃</span>
    <h4 class="wemd-col-title">微风</h4>
    <p class="wemd-col-desc">吹散所有烦恼</p>
  </div>
</div>`,

    "end-card": `<div class="wemd-end-card" data-variant="${variant}">
  <h2 class="wemd-end-title">Thanks</h2>
  <p class="wemd-end-subtitle">感谢阅读 · 期待下次相遇</p>
</div>`,

    "product-card": `<div class="wemd-product-card" data-variant="${variant}">
  <div class="wemd-product-badge">限时特惠</div>
  <div class="wemd-product-img" style="background:linear-gradient(135deg,#667eea,#764ba2);height:140px;border-radius:8px 8px 0 0;display:flex;align-items:center;justify-content:center;color:#fff;font-size:32px">⭐</div>
  <div class="wemd-product-body">
    <h3 class="wemd-product-title">星空投影灯 Pro</h3>
    <p class="wemd-product-desc">360° 全景星空投影</p>
    <div class="wemd-product-price">
      <span class="wemd-price-current">¥399</span>
      <span class="wemd-price-original">¥599</span>
    </div>
    <a class="wemd-product-btn" href="#">立即抢购</a>
  </div>
</div>`,

    "resource-list": `<div class="wemd-resource-list" data-variant="${variant}">
  <h3 class="wemd-resource-title">配套资料包</h3>
  <div class="wemd-resource-items">
    <div class="wemd-resource-item">
      <span class="wemd-resource-type">📄</span>
      <div class="wemd-resource-info">
        <span class="wemd-resource-name">Vue3 入门讲义 PDF</span>
        <span class="wemd-resource-meta">PDF / 12MB</span>
      </div>
    </div>
    <div class="wemd-resource-item">
      <span class="wemd-resource-type">📦</span>
      <div class="wemd-resource-info">
        <span class="wemd-resource-name">配套源码压缩包</span>
        <span class="wemd-resource-meta">ZIP / 38MB</span>
      </div>
    </div>
  </div>
</div>`,

    "series-nav": `<div class="wemd-series-nav" data-variant="${variant}">
  <div class="wemd-series-header">
    <span class="wemd-series-name">Vue3 从 0 到 1</span>
    <span class="wemd-series-progress">3/10</span>
  </div>
  <div class="wemd-series-bar">
    <div class="wemd-series-bar-fill" style="width:30%"></div>
  </div>
  <div class="wemd-series-links">
    <a class="wemd-series-prev">← 上一篇</a>
    <a class="wemd-series-next">下一篇 →</a>
  </div>
</div>`,

    "image-grid": `<div class="wemd-image-grid" data-variant="${variant}">
  <div class="wemd-grid-img" style="background:#e8f4f8;height:100px;border-radius:8px;display:flex;align-items:center;justify-content:center;color:#999">🖼️</div>
  <div class="wemd-grid-img" style="background:#f0e6ff;height:100px;border-radius:8px;display:flex;align-items:center;justify-content:center;color:#999">🖼️</div>
  <div class="wemd-grid-img" style="background:#fff3e0;height:100px;border-radius:8px;display:flex;align-items:center;justify-content:center;color:#999">🖼️</div>
</div>`,

    "author-card": `<div class="wemd-author-card" data-variant="${variant}">
  <div class="wemd-author-avatar" style="width:48px;height:48px;border-radius:50%;background:#667eea;display:flex;align-items:center;justify-content:center;color:#fff;font-size:20px">A</div>
  <div class="wemd-author-info">
    <strong class="wemd-author-name">作者名称</strong>
    <span class="wemd-author-bio">前端工程师，技术写作者</span>
  </div>
</div>`,

    "related-posts": `<div class="wemd-related-posts" data-variant="${variant}">
  <h3 class="wemd-related-title">相关推荐</h3>
  <ul class="wemd-related-list">
    <li class="wemd-related-item"><a href="#">深入理解 Vue3 响应式原理</a></li>
    <li class="wemd-related-item"><a href="#">TypeScript 高级类型详解</a></li>
    <li class="wemd-related-item"><a href="#">前端工程化实践指南</a></li>
  </ul>
</div>`,

    "copyright-notice": `<div class="wemd-copyright-notice" data-variant="${variant}">
  <p>© 2026 WeMD Team. All rights reserved.</p>
  <p>未经许可，不得转载</p>
</div>`,

    "qr-card": `<div class="wemd-qr-card" data-variant="${variant}">
  <div class="wemd-qr-code" style="width:80px;height:80px;background:#f0f0f0;display:flex;align-items:center;justify-content:center;font-size:12px;color:#999">QR</div>
  <div class="wemd-qr-info">
    <p class="wemd-qr-text">扫码关注公众号</p>
    <p class="wemd-qr-desc">获取更多精彩内容</p>
  </div>
</div>`,

    "image-text-row": `<div class="wemd-image-text-row" data-variant="${variant}">
  <div class="wemd-itr-img" style="width:80px;height:80px;border-radius:8px;background:linear-gradient(135deg,#a8edea,#fed6e3);display:flex;align-items:center;justify-content:center;color:#fff;font-size:24px">🌅</div>
  <div class="wemd-itr-text">
    <p class="wemd-itr-title">标题文字</p>
    <p class="wemd-itr-desc">描述文字，简要说明内容</p>
  </div>
</div>`,

    "image-caption": `<figure class="wemd-image-caption" data-variant="${variant}">
  <div class="wemd-ic-img" style="height:120px;background:linear-gradient(135deg,#667eea,#764ba2);border-radius:8px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:28px">🖼️</div>
  <figcaption class="wemd-ic-caption">这是一张精美的示例图片，展示了产品的核心功能</figcaption>
</figure>`,

    "table": `<table class="wemd-table" data-variant="${variant}">
  <thead><tr><th>功能</th><th>基础版</th><th>专业版</th></tr></thead>
  <tbody>
    <tr><td>数据分析</td><td>✓</td><td>✓</td></tr>
    <tr><td>API 接入</td><td>—</td><td>✓</td></tr>
    <tr><td>技术支持</td><td>邮件</td><td>7×24 小时</td></tr>
  </tbody>
</table>`,

    "timeline": `<div class="wemd-timeline" data-variant="${variant}">
  <div class="wemd-timeline-item">
    <div class="wemd-timeline-date">2024 Q1</div>
    <div class="wemd-timeline-content">产品立项与市场调研</div>
  </div>
  <div class="wemd-timeline-item">
    <div class="wemd-timeline-date">2024 Q2</div>
    <div class="wemd-timeline-content">核心功能开发与内测</div>
  </div>
  <div class="wemd-timeline-item">
    <div class="wemd-timeline-date">2024 Q3</div>
    <div class="wemd-timeline-content">正式版上线</div>
  </div>
</div>`,

    "accordion": `<div class="wemd-accordion" data-variant="${variant}">
  <details class="wemd-accordion-item">
    <summary class="wemd-accordion-header">产品功能概述</summary>
    <div class="wemd-accordion-body">我们提供全方位的解决方案，覆盖从数据采集到智能分析的完整链路。</div>
  </details>
</div>`,

    "image-compare": `<div class="wemd-image-compare" data-variant="${variant}" style="margin:1em 0;border-radius:10px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08)">
  <div style="padding:10px 14px;font-size:12px;font-weight:600;color:#666;background:#f8f9fa;border-bottom:1px solid #eee">图片对比</div>
  <div style="display:flex;height:140px">
    <div style="flex:1;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;font-size:13px;font-weight:600;position:relative">
      <span style="position:absolute;top:8px;left:8px;font-size:10px;background:rgba(0,0,0,0.3);padding:2px 8px;border-radius:4px">优化前</span>
      <div style="text-align:center;opacity:0.6">
        <div style="font-size:24px;margin-bottom:4px">◐</div>
        <div style="font-size:10px">原始图像</div>
      </div>
    </div>
    <div style="width:2px;background:#fff;box-shadow:0 0 4px rgba(0,0,0,0.15);position:relative;z-index:1">
      <div style="width:24px;height:24px;background:#fff;border-radius:50%;position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);box-shadow:0 1px 4px rgba(0,0,0,0.2);display:flex;align-items:center;justify-content:center;font-size:12px;color:#666">↔</div>
    </div>
    <div style="flex:1;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#f093fb,#f5576c);color:#fff;font-size:13px;font-weight:600;position:relative">
      <span style="position:absolute;top:8px;right:8px;font-size:10px;background:rgba(0,0,0,0.3);padding:2px 8px;border-radius:4px">优化后</span>
      <div style="text-align:center;opacity:0.6">
        <div style="font-size:24px;margin-bottom:4px">◑</div>
        <div style="font-size:10px">增强图像</div>
      </div>
    </div>
  </div>
</div>`,
  };

  return htmlMap[component] || `<div class="wemd-${component}" data-variant="${variant}">
  <p>${component} 组件预览</p>
</div>`;
}

// ── 为单个组件生成 CSS ──
function generateComponentCSS(
  component: string,
  variant: string,
  colors: Record<string, string>,
  blueprint: Record<string, unknown>
): string {
  const primary = colors.primary || "#3B82F6";
  const bg = colors.background || "#FFFFFF";
  const text = colors.textPrimary || "#1A1A2E";
  const textSec = colors.textSecondary || "#64748B";
  const border = colors.border || "#E2E8F0";
  const surface = colors.surface || "#F8FAFC";

  const cssMap: Record<string, string> = {
    "hero-banner": `#wemd .wemd-hero-banner[data-variant="${variant}"] {
  background: linear-gradient(135deg, ${primary}, ${colors.primaryDark || primary});
  color: #fff;
  padding: 2.5em 1.5em;
  border-radius: 12px;
  text-align: center;
}
#wemd .wemd-hero-banner[data-variant="${variant}"] .wemd-hero-title {
  font-size: 1.75em;
  font-weight: 700;
  margin: 0 0 0.5em;
  color: #fff;
}
#wemd .wemd-hero-banner[data-variant="${variant}"] .wemd-hero-subtitle {
  font-size: 1em;
  opacity: 0.9;
  color: rgba(255,255,255,0.9);
}`,
    "stats-block": `#wemd .wemd-stats-block[data-variant="${variant}"] {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1em;
  padding: 1.5em;
  background: ${surface};
  border-radius: 10px;
  border: 1px solid ${border};
}
#wemd .wemd-stats-block[data-variant="${variant}"] .wemd-stat-value {
  font-size: 1.5em;
  font-weight: 700;
  color: ${primary};
}
#wemd .wemd-stats-block[data-variant="${variant}"] .wemd-stat-label {
  font-size: 0.85em;
  color: ${textSec};
}`,
    "brand-sign": `#wemd .wemd-brand-sign[data-variant="${variant}"] {
  display: flex;
  align-items: center;
  gap: 1em;
  padding: 1.25em;
  border-top: 2px solid ${primary};
  margin-top: 2em;
}
#wemd .wemd-brand-sign[data-variant="${variant}"] .wemd-brand-logo {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  background: ${primary};
}
#wemd .wemd-brand-sign[data-variant="${variant}"] .wemd-brand-name {
  font-weight: 600;
  color: ${text};
}
#wemd .wemd-brand-sign[data-variant="${variant}"] .wemd-brand-desc {
  font-size: 0.85em;
  color: ${textSec};
}`,
    "divider": `#wemd .wemd-divider[data-variant="${variant}"] {
  border: none;
  height: 1px;
  background: linear-gradient(to right, transparent, ${primary}, transparent);
  margin: 2em 0;
  opacity: 0.5;
}`,
    "callout": `#wemd .wemd-callout[data-variant="${variant}"] {
  border-left: 4px solid ${primary};
  background: ${surface};
  padding: 1em 1.25em;
  border-radius: 0 8px 8px 0;
  margin: 1.25em 0;
}
#wemd .wemd-callout[data-variant="${variant}"] .wemd-callout-title {
  font-weight: 600;
  color: ${primary};
  margin-bottom: 0.25em;
}
#wemd .wemd-callout[data-variant="${variant}"] .wemd-callout-content {
  color: ${text};
  font-size: 0.95em;
}`,
    "testimonial-card": `#wemd .wemd-testimonial-card[data-variant="${variant}"] {
  background: ${surface};
  border: 1px solid ${border};
  border-radius: 12px;
  padding: 1.5em;
  margin: 1.25em 0;
}
#wemd .wemd-testimonial-card[data-variant="${variant}"] .wemd-testimonial-text {
  font-style: italic;
  color: ${text};
  line-height: 1.7;
}
#wemd .wemd-testimonial-card[data-variant="${variant}"] .wemd-testimonial-author {
  font-weight: 600;
  color: ${primary};
  margin-top: 0.75em;
}`,
    "code-block": `#wemd .wemd-code-block[data-variant="${variant}"] {
  background: #1E293B;
  color: #E2E8F0;
  border-radius: 8px;
  padding: 1.25em;
  font-family: "JetBrains Mono", "Fira Code", monospace;
  font-size: 0.85em;
  overflow-x: auto;
  margin: 1.25em 0;
}`,
    "pullquote": `#wemd .wemd-pullquote[data-variant="${variant}"] {
  font-size: 1.2em;
  font-style: italic;
  color: ${primary};
  border-left: 3px solid ${primary};
  padding: 0.5em 1em;
  margin: 1.5em 0;
  background: ${surface};
  border-radius: 0 8px 8px 0;
}`,
    "steps": `#wemd .wemd-steps[data-variant="${variant}"] {
  padding: 0;
  list-style: none;
}
#wemd .wemd-steps[data-variant="${variant}"] .wemd-step {
  padding: 0.75em 0 0.75em 2.5em;
  position: relative;
  border-left: 2px solid ${primary};
  margin-left: 1em;
}
#wemd .wemd-steps[data-variant="${variant}"] .wemd-step-marker {
  position: absolute;
  left: -1em;
  top: 0.75em;
  width: 2em;
  height: 2em;
  background: ${primary};
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85em;
  font-weight: 600;
}`,
  };

  // 无匹配时生成通用样式
  return cssMap[component] || `#wemd .wemd-${component}[data-variant="${variant}"] {
  padding: 1em;
  color: ${text};
}`;
}