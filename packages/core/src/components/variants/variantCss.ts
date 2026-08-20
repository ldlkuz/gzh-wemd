/**
 * 组件变体 CSS
 *
 * 每个变体使用 [data-variant="xxx"] 属性选择器隔离，
 * 与默认样式不冲突。未指定 variant 时使用默认样式。
 *
 * 组件清单：
 * - share-card: warm / minimal / tech（已有）
 * - quote-card: classic / quotation / card（新增）
 * - cta-card: pill / banner / minimal（新增）
 * - divider-fancy: line / gradient / dots（新增）
 */

// ============================================================
// share-card 变体（已有）
// ============================================================

export const shareCardWarmCss = `/* === share-card 温暖变体 === */
#wemd .wemd-share-card[data-variant="warm"] {
  margin: 40px 0 24px 0;
  padding: 24px 20px;
  text-align: center;
  border-top: 2px solid var(--wemd-primary, #07c160);
  background: linear-gradient(180deg, transparent 0%, var(--wemd-primary-alpha-4, rgba(7, 193, 96, 0.04)) 100%);
}
#wemd .wemd-share-card[data-variant="warm"] .wemd-sc-body {
  font-size: 15px;
  color: var(--wemd-text-strong, #1a1a1a);
  font-weight: 500;
}
#wemd .wemd-share-card[data-variant="warm"] .wemd-sc-body strong {
  color: var(--wemd-primary, #07c160);
  font-weight: 600;
}`;

export const shareCardMinimalCss = `/* === share-card 极简变体 === */
#wemd .wemd-share-card[data-variant="minimal"] {
  margin: 40px 0 24px 0;
  padding: 24px 16px;
  text-align: center;
  border-top: 1px solid var(--wemd-border, #e2e8f0);
}
#wemd .wemd-share-card[data-variant="minimal"] .wemd-sc-body {
  font-size: 13px;
  color: var(--wemd-text-soft, #999999);
  letter-spacing: 0.5px;
}`;

export const shareCardTechCss = `/* === share-card 科技变体 === */
#wemd .wemd-share-card[data-variant="tech"] {
  margin: 40px 0 24px 0;
  padding: 20px 16px;
  text-align: center;
  background: linear-gradient(135deg, var(--wemd-primary-alpha-8, rgba(7, 193, 96, 0.08)) 0%, var(--wemd-primary-alpha-2, rgba(7, 193, 96, 0.02)) 100%);
  border-radius: 12px;
  border: 1px solid var(--wemd-border, #e2e8f0);
}
#wemd .wemd-share-card[data-variant="tech"] .wemd-sc-body {
  font-size: 14px;
  color: var(--wemd-text-soft, #666666);
  font-family: "SF Mono", Monaco, monospace;
}`;

// ============================================================
// quote-card 变体（新增）
// ============================================================

/** quote-card 经典竖线 */
export const quoteCardClassicCss = `/* === quote-card 经典竖线 === */
#wemd .wemd-quote-card[data-variant="classic"] {
  padding: 16px 20px;
  border-left: 4px solid var(--wemd-primary, #07c160);
  background: var(--wemd-bg-soft, #f6f8fa);
  margin: 24px 0;
  border-radius: 0 var(--wemd-border-radius, 4px) var(--wemd-border-radius, 4px) 0;
}
#wemd .wemd-quote-card[data-variant="classic"] .wemd-qc-quote {
  font-size: 16px;
  color: var(--wemd-text-normal, #34495e);
  line-height: 1.8;
  margin: 0;
}`;

/** quote-card 大引号 */
export const quoteCardQuotationCss = `/* === quote-card 大引号 === */
#wemd .wemd-quote-card[data-variant="quotation"] {
  padding: 32px 24px;
  text-align: center;
  margin: 32px 0;
  position: relative;
}
#wemd .wemd-quote-card[data-variant="quotation"]::before {
  content: '"';
  display: block;
  font-size: 64px;
  color: var(--wemd-primary-light, #d1fae5);
  font-family: Georgia, serif;
  line-height: 0.8;
  margin-bottom: 8px;
}
#wemd .wemd-quote-card[data-variant="quotation"] .wemd-qc-quote {
  font-size: 18px;
  color: var(--wemd-text-strong, #1a1a1a);
  line-height: 1.9;
  margin: 0;
  font-style: italic;
}`;

/** quote-card 卡片式 */
export const quoteCardCardCss = `/* === quote-card 卡片式 === */
#wemd .wemd-quote-card[data-variant="card"] {
  padding: 20px 20px;
  background: linear-gradient(135deg, var(--wemd-primary-light, #d1fae5), var(--wemd-bg-card, #fff));
  border-radius: 12px;
  border: 1px solid var(--wemd-border, #e2e8f0);
  margin: 24px 0;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}
#wemd .wemd-quote-card[data-variant="card"] .wemd-qc-quote {
  font-size: 15px;
  color: var(--wemd-text-normal, #34495e);
  line-height: 1.75;
  margin: 0;
}
#wemd .wemd-quote-card[data-variant="card"] .wemd-qc-author {
  color: var(--wemd-primary-dark, #0a8f4a);
}`;

// ============================================================
// cta-card 变体（新增）
// ============================================================

/** cta-card 胶囊按钮 */
export const ctaCardPillCss = `/* === cta-card 胶囊按钮 === */
#wemd .wemd-cta-card[data-variant="pill"] {
  margin: 32px 0;
  text-align: center;
}
#wemd .wemd-cta-card[data-variant="pill"] .wemd-cta-body {
  display: inline-block;
  padding: 12px 32px;
  background: var(--wemd-primary, #07c160);
  color: #fff;
  border-radius: 24px;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 0.5px;
  box-shadow: 0 4px 14px rgba(0,0,0,0.15);
}
#wemd .wemd-cta-card[data-variant="pill"] .wemd-cta-title {
  color: #fff;
  margin: 0 0 4px 0;
}
#wemd .wemd-cta-card[data-variant="pill"] .wemd-cta-action {
  color: #fff;
}`;

/** cta-card 全宽横幅 */
export const ctaCardBannerCss = `/* === cta-card 全宽横幅 === */
#wemd .wemd-cta-card[data-variant="banner"] {
  margin: 32px 0;
  padding: 20px 16px;
  background: linear-gradient(135deg, var(--wemd-primary, #07c160), var(--wemd-primary-dark, #0a8f4a));
  border-radius: 8px;
  text-align: center;
}
#wemd .wemd-cta-card[data-variant="banner"] .wemd-cta-title,
#wemd .wemd-cta-card[data-variant="banner"] .wemd-cta-body,
#wemd .wemd-cta-card[data-variant="banner"] .wemd-cta-action {
  color: #fff;
  font-size: 16px;
  font-weight: 500;
  margin: 0;
}
#wemd .wemd-cta-card[data-variant="banner"] .wemd-cta-title strong {
  color: #fff;
  font-weight: 700;
}`;

/** cta-card 极简 */
export const ctaCardMinimalCss = `/* === cta-card 极简 === */
#wemd .wemd-cta-card[data-variant="minimal"] {
  margin: 28px 0;
  padding: 16px 20px;
  border: 2px solid var(--wemd-primary, #07c160);
  border-radius: 8px;
  text-align: center;
  background: transparent;
}
#wemd .wemd-cta-card[data-variant="minimal"] .wemd-cta-title,
#wemd .wemd-cta-card[data-variant="minimal"] .wemd-cta-body,
#wemd .wemd-cta-card[data-variant="minimal"] .wemd-cta-action {
  color: var(--wemd-primary, #07c160);
  font-size: 15px;
  font-weight: 500;
  margin: 0;
}`;

// ============================================================
// divider-fancy 变体（新增）
// ============================================================

/** divider-fancy 细线 */
export const dividerFancyLineCss = `/* === divider-fancy 细线 === */
#wemd .wemd-divider-fancy[data-variant="line"] {
  margin: 32px 0;
  text-align: center;
}
#wemd .wemd-divider-fancy[data-variant="line"] .wemd-df-label::before,
#wemd .wemd-divider-fancy[data-variant="line"] .wemd-df-label::after {
  content: "";
  flex: none;
  width: 60px;
  height: 2px;
  background: var(--wemd-primary, #07c160);
}`;

/** divider-fancy 渐变 */
export const dividerFancyGradientCss = `/* === divider-fancy 渐变 === */
#wemd .wemd-divider-fancy[data-variant="gradient"] {
  margin: 32px 0;
  text-align: center;
}
#wemd .wemd-divider-fancy[data-variant="gradient"] .wemd-df-label::before,
#wemd .wemd-divider-fancy[data-variant="gradient"] .wemd-df-label::after {
  content: "";
  flex: none;
  width: 100px;
  height: 3px;
  background: linear-gradient(90deg, transparent, var(--wemd-primary, #07c160), transparent);
  border-radius: 2px;
}`;

/** divider-fancy 圆点 */
export const dividerFancyDotsCss = `/* === divider-fancy 圆点 === */
#wemd .wemd-divider-fancy[data-variant="dots"] {
  margin: 32px 0;
  text-align: center;
  letter-spacing: 8px;
  color: var(--wemd-primary-light, #d1fae5);
  font-size: 8px;
  line-height: 1;
}
#wemd .wemd-divider-fancy[data-variant="dots"] .wemd-df-label::before,
#wemd .wemd-divider-fancy[data-variant="dots"] .wemd-df-label::after {
  content: "●●●";
  flex: none;
  width: auto;
  height: auto;
  background: none;
}`;

// ============================================================
// hero-banner 变体（新增）
// 设计原则：
//   - 每个 variant 必须显式声明 6 项：min-height / padding / border-radius /
//     background / --hb-title 主标题色 / --hb-sub 副标题色
//   - 不依赖基础规则的"默认渐变/默认白字"，避免 variant 之间看起来一样
//   - 渐变必须同色系 + 多停点平滑过渡（避免跨色相大跨度硬边）
// ============================================================

/** hero-banner 居中渐变（默认风格）
 *  语义：杂志封面头图感，文字居中、主色同色系对角渐变 + 角落柔光光晕
 *  渐变方向 160°，6 个停点保证过渡顺滑；角落 radial-glow 柔化高饱和色块边缘
 */
export const heroBannerCenterCss = `/* === hero-banner 居中渐变 === */
#wemd .wemd-hero-banner[data-variant="center"] {
  min-height: 180px;
  border-radius: calc(var(--wemd-border-radius, 8px) + 6px);
  background:
    radial-gradient(120% 80% at 10% 0%, var(--wemd-primary-light, #d1fae5) 0%, transparent 55%),
    radial-gradient(120% 80% at 100% 100%, var(--wemd-primary-alpha-25, rgba(7,193,96,0.25)) 0%, transparent 55%),
    linear-gradient(160deg,
      var(--wemd-primary-dark, #0a8f4a) 0%,
      var(--wemd-primary, #07c160) 22%,
      color-mix(in srgb, var(--wemd-primary, #07c160) 85%, var(--wemd-primary-light, #d1fae5)) 44%,
      color-mix(in srgb, var(--wemd-primary, #07c160) 92%, var(--wemd-primary-dark, #0a8f4a)) 68%,
      color-mix(in srgb, var(--wemd-primary-dark, #0a8f4a) 88%, var(--wemd-text-strong, #1a1a1a)) 90%,
      var(--wemd-primary-dark, #0a8f4a) 100%);
}
#wemd .wemd-hero-banner .wemd-component-body[data-variant="center"] {
  padding: 44px 36px;
  text-align: center;
}
#wemd .wemd-hero-banner[data-variant="center"] .wemd-hb-title {
  font-size: 28px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.18);
}`;

/** hero-banner 左对齐
 *  语义：杂志专栏导语感，深灰+主色混底，左侧 6px 渐变描边，文字左对齐
 *  底色：text-strong 82% + primary 18% 混成"杂志深色"，不会是纯黑也不会和某主题的
 *  text-strong 完全一致，避免不同主题前面"都长一样"
 */
export const heroBannerLeftCss = `/* === hero-banner 左对齐 === */
#wemd .wemd-hero-banner[data-variant="left"] {
  min-height: 156px;
  justify-content: flex-start;
  /* 右弧左切：视觉像杂志的 "左边出血式" 导语卡片 */
  border-radius: 0 calc(var(--wemd-border-radius, 8px) + 6px) calc(var(--wemd-border-radius, 8px) + 6px) 0;
  border-left: 6px solid transparent;
  background:
    linear-gradient(180deg,
      color-mix(in srgb, var(--wemd-text-strong, #1a1a1a) 82%, var(--wemd-primary, #07c160)) 0%,
      color-mix(in srgb, var(--wemd-text-strong, #1a1a1a) 92%, var(--wemd-primary, #07c160)) 60%,
      color-mix(in srgb, var(--wemd-text-strong, #1a1a1a) 98%, var(--wemd-primary-dark, #0a8f4a)) 100%)
      padding-box,
    linear-gradient(180deg, var(--wemd-primary, #07c160), var(--wemd-accent, #764ba2)) border-box;
}
#wemd .wemd-hero-banner .wemd-component-body[data-variant="left"] {
  padding: 36px 32px 36px 28px;
  text-align: left;
}
#wemd .wemd-hero-banner[data-variant="left"] .wemd-hb-title {
  font-size: 24px;
  letter-spacing: 0.8px;
}
#wemd .wemd-hero-banner[data-variant="left"] .wemd-hb-subtitle {
  font-size: 13px;
}`;

/** hero-banner 极简
 *  语义：文章小标题感，白底卡片 + 顶部主色高亮条，完全脱离白字
 *  保证纯白底文章下可读；背景 bg-card，边线 border，顶部 3px 主色条
 */
export const heroBannerMinimalCss = `/* === hero-banner 极简 === */
#wemd .wemd-hero-banner[data-variant="minimal"] {
  min-height: auto;
  border-radius: calc(var(--wemd-border-radius, 8px) + 2px);
  border: 1px solid var(--wemd-border, #e2e8f0);
  background: var(--wemd-bg-card, #ffffff);
  box-shadow: 0 1px 2px var(--wemd-primary-alpha-2, rgba(7,193,96,0.02));
}
#wemd .wemd-hero-banner[data-variant="minimal"]::before {
  content: "";
  position: absolute;
  inset: 0 0 auto 0;
  height: 3px;
  background: linear-gradient(90deg, var(--wemd-primary, #07c160) 0%, var(--wemd-accent, #764ba2) 100%);
  z-index: 0;
}
#wemd .wemd-hero-banner .wemd-component-body[data-variant="minimal"] {
  padding: 30px 28px 26px 28px;
  text-align: center;
}
#wemd .wemd-hero-banner[data-variant="minimal"] .wemd-hb-title {
  font-size: 22px;
  letter-spacing: 0.6px;
  color: var(--wemd-text-strong, #1a1a1a);
}
#wemd .wemd-hero-banner[data-variant="minimal"] .wemd-hb-subtitle {
  font-size: 13px;
}`;

// ============================================================
// callout-pro 变体（新增）
// ============================================================

/** callout-pro 全背景色块 */
export const calloutProBgCss = `/* === callout-pro 全背景色块 === */
#wemd .wemd-callout-pro .wemd-component-body[data-variant="bg"] {
  padding: 0;
}
#wemd .wemd-callout-pro[data-variant="bg"] {
  border: none;
  box-shadow: none;
  border-radius: 8px;
  padding: 20px 24px;
}
#wemd .wemd-callout-pro[data-variant="bg"]::before {
  display: none;
}
#wemd .wemd-callout-pro[data-variant="bg"][data-type="tip"] {
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.12), rgba(139, 92, 246, 0.04));
}
#wemd .wemd-callout-pro[data-variant="bg"][data-type="info"] {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.12), rgba(59, 130, 246, 0.04));
}
#wemd .wemd-callout-pro[data-variant="bg"][data-type="warning"] {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.12), rgba(245, 158, 11, 0.04));
}
#wemd .wemd-callout-pro[data-variant="bg"][data-type="danger"] {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.12), rgba(239, 68, 68, 0.04));
}
#wemd .wemd-callout-pro[data-variant="bg"]:not([data-type]) {
  background: linear-gradient(135deg, var(--wemd-primary-light, #d1fae5), var(--wemd-primary-alpha-4, rgba(7, 193, 96, 0.04)));
}`;

/** callout-pro 极简图标 */
export const calloutProMinimalCss = `/* === callout-pro 极简图标 === */
#wemd .wemd-callout-pro .wemd-component-body[data-variant="minimal"] {
  padding: 0;
}
#wemd .wemd-callout-pro[data-variant="minimal"] {
  background: transparent;
  border: none;
  box-shadow: none;
  padding: 8px 0;
  border-radius: 0;
}
#wemd .wemd-callout-pro[data-variant="minimal"]::before {
  display: none;
}
#wemd .wemd-callout-pro[data-variant="minimal"] .wemd-cp-body {
  font-size: 15px;
  color: var(--wemd-text-strong, #1e293b);
}`;

// ============================================================
// section-divider 变体（新增 · 杂志组件）
// ============================================================

/** section-divider 细线（默认） */
export const sectionDividerLineCss = `/* === section-divider 细线 === */
#wemd .wemd-section-divider[data-variant="line"] {
  margin: 40px 0 20px 0;
  text-align: center;
}`;

/** section-divider 圆点装饰 */
export const sectionDividerDotsCss = `/* === section-divider 圆点装饰 === */
#wemd .wemd-section-divider[data-variant="dots"] {
  margin: 36px 0 24px 0;
  text-align: center;
}
#wemd .wemd-section-divider[data-variant="dots"]::before {
  content: "···";
  display: block;
  font-size: 18px;
  letter-spacing: 6px;
  color: var(--wemd-primary-light, #d1fae5);
  margin-bottom: 12px;
}
#wemd .wemd-section-divider[data-variant="dots"] .wemd-sd-part {
  font-size: 12px;
  opacity: 0.7;
}`;

/** section-divider 粗色块 */
export const sectionDividerBoldCss = `/* === section-divider 粗色块 === */
#wemd .wemd-section-divider[data-variant="bold"] {
  margin: 36px 0 24px 0;
  text-align: center;
  padding: 20px 16px;
  background: linear-gradient(90deg, transparent, var(--wemd-primary-light, #d1fae5), transparent);
  border-radius: 4px;
}
#wemd .wemd-section-divider[data-variant="bold"] .wemd-sd-part {
  font-size: 14px;
  font-weight: 700;
  color: var(--wemd-primary-dark, #0a8f4a);
}
#wemd .wemd-section-divider[data-variant="bold"] .wemd-sd-title {
  margin-top: 4px;
  font-size: 24px;
}`;

// ============================================================
// end-card 变体（新增 · 杂志组件）
// ============================================================

/** end-card 居中致谢（默认） */
export const endCardCenteredCss = `/* === end-card 居中致谢 === */
#wemd .wemd-end-card[data-variant="centered"] {
  margin: 40px 0 20px 0;
  text-align: center;
}`;

/** end-card 极简收尾 */
export const endCardMinimalCss = `/* === end-card 极简收尾 === */
#wemd .wemd-end-card[data-variant="minimal"] {
  margin: 32px 0 16px 0;
  padding: 20px 0;
  text-align: center;
  border-top: 1px solid var(--wemd-border, #e2e8f0);
}
#wemd .wemd-end-card[data-variant="minimal"] .wemd-ec-title {
  font-size: 15px;
  color: var(--wemd-text-soft, #999999);
}
#wemd .wemd-end-card[data-variant="minimal"] .wemd-ec-subtitle {
  font-size: 12px;
}
#wemd .wemd-end-card[data-variant="minimal"] .wemd-ec-deco {
  display: none;
}`;

/** end-card 暖色调 */
export const endCardWarmCss = `/* === end-card 暖色调 === */
#wemd .wemd-end-card[data-variant="warm"] {
  margin: 40px 0 24px 0;
  padding: 32px 20px;
  text-align: center;
  background: linear-gradient(180deg, transparent, var(--wemd-primary-alpha-6, rgba(7, 193, 96, 0.06)));
  border-radius: var(--wemd-border-radius, 8px);
}
#wemd .wemd-end-card[data-variant="warm"] .wemd-ec-title {
  font-size: 20px;
  color: var(--wemd-primary, #07c160);
}
#wemd .wemd-end-card[data-variant="warm"] .wemd-ec-subtitle {
  font-size: 14px;
  color: var(--wemd-text-normal, #666666);
}
#wemd .wemd-end-card[data-variant="warm"] .wemd-ec-deco {
  font-size: 24px;
  margin-top: 16px;
}`;

// ============================================================
// product-card 变体（3 个）
// ============================================================

/** product-card ecommerce 经典电商（默认） */
export const productCardEcommerceCss = `/* === product-card 经典电商 === */
#wemd .wemd-product-card[data-variant="ecommerce"] {
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 4px 18px rgba(0, 0, 0, 0.06);
  border: 1px solid #f1f1f3;
}
#wemd .wemd-product-card[data-variant="ecommerce"] .wemd-pc-badge {
  background: linear-gradient(135deg, #ff7a45, #ff4d4f);
}
#wemd .wemd-product-card[data-variant="ecommerce"] .wemd-pc-button {
  background: linear-gradient(90deg, #ff6a3d, #ff4d4f);
  letter-spacing: 2px;
}
#wemd .wemd-product-card[data-variant="ecommerce"] .wemd-pc-price {
  color: #ff4d4f;
}`;

/** product-card minimal 极简杂志（图片在上，无阴影） */
export const productCardMinimalCss = `/* === product-card 极简杂志 === */
#wemd .wemd-product-card[data-variant="minimal"] {
  background: #fff;
  border-radius: 6px;
  box-shadow: none;
  border: 1px solid #ececf0;
  padding: 0;
  overflow: hidden;
}
#wemd .wemd-product-card[data-variant="minimal"] .wemd-pc-image img {
  border-radius: 0;
  max-height: 260px;
  margin-bottom: 0;
}
#wemd .wemd-product-card[data-variant="minimal"] .wemd-pc-header,
#wemd .wemd-product-card[data-variant="minimal"] .wemd-pc-description,
#wemd .wemd-product-card[data-variant="minimal"] .wemd-pc-price-row,
#wemd .wemd-product-card[data-variant="minimal"] .wemd-pc-meta-row,
#wemd .wemd-product-card[data-variant="minimal"] .wemd-pc-tags {
  padding: 0 18px;
}
#wemd .wemd-product-card[data-variant="minimal"] .wemd-pc-header {
  margin-top: 18px;
}
#wemd .wemd-product-card[data-variant="minimal"] .wemd-pc-button {
  border-radius: 6px;
  background: #0f172a;
  margin: 18px;
  color: #fff;
}
#wemd .wemd-product-card[data-variant="minimal"] .wemd-pc-tags {
  padding-bottom: 18px;
  margin-top: 10px;
}`;

/** product-card promo 促销强调（大价格+大红标签） */
export const productCardPromoCss = `/* === product-card 促销强调 === */
#wemd .wemd-product-card[data-variant="promo"] {
  background: linear-gradient(135deg, #fff8f0 0%, #fff 100%);
  border-radius: 18px;
  border: 1.5px dashed #ff9f43;
  box-shadow: 0 6px 24px rgba(255, 122, 69, 0.12);
  position: relative;
}
#wemd .wemd-product-card[data-variant="promo"]::before {
  content: "限时";
  position: absolute;
  top: 14px;
  right: 14px;
  background: #ff4d4f;
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 999px;
  letter-spacing: 2px;
}
#wemd .wemd-product-card[data-variant="promo"] .wemd-pc-badge {
  background: #ff9f43;
}
#wemd .wemd-product-card[data-variant="promo"] .wemd-pc-price {
  font-size: 32px;
  color: #ff4d4f;
}
#wemd .wemd-product-card[data-variant="promo"] .wemd-pc-original s {
  font-size: 16px;
  color: #ff7a45;
}
#wemd .wemd-product-card[data-variant="promo"] .wemd-pc-button {
  background: linear-gradient(135deg, #ff4d4f, #ff7a45);
  border-radius: 999px;
  box-shadow: 0 6px 16px rgba(255, 77, 79, 0.32);
}`;

// ============================================================
// brand-sign 变体（3 个）
// ============================================================

/** brand-sign inline 水平一行（段落间插入）：logo 左 + 品牌名/ slogan/ 版权 右侧竖排 */
export const brandSignInlineCss = `/* === brand-sign inline === */
#wemd .wemd-brand-sign[data-variant="inline"] {
  margin: 20px 0;
}
#wemd .wemd-brand-sign[data-variant="inline"] .wemd-bs-wrapper {
  flex-direction: row;
  justify-content: flex-start;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
}
#wemd .wemd-brand-sign[data-variant="inline"] .wemd-bs-text {
  flex-direction: column;
  align-items: flex-start;
  text-align: left;
  gap: 4px;
  min-width: 0;
  flex: 1;
}
#wemd .wemd-brand-sign[data-variant="inline"] .wemd-bs-logo {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background-image: var(--wemd-asset-logo, none);
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 700;
  color: var(--wemd-primary, #07c160);
}
#wemd .wemd-brand-sign[data-variant="inline"] .wemd-bs-brand-name {
  font-size: 15px;
  letter-spacing: 0.3px;
}
#wemd .wemd-brand-sign[data-variant="inline"] .wemd-bs-slogan {
  font-size: 12px;
}
#wemd .wemd-brand-sign[data-variant="inline"] .wemd-bs-subtext {
  border-top: none;
  padding-top: 0;
}`;

/** brand-sign stacked 纵向堆叠（文末品牌签名） */
export const brandSignStackedCss = `/* === brand-sign stacked === */
#wemd .wemd-brand-sign[data-variant="stacked"] {
  margin: 40px 0 20px;
}
#wemd .wemd-brand-sign[data-variant="stacked"] .wemd-bs-wrapper {
  flex-direction: column;
  text-align: center;
  padding: 26px 20px;
  border: 1px solid var(--wemd-border-soft, #e8ebe8);
  border-radius: 14px;
  background: linear-gradient(180deg, var(--wemd-bg-card, #fff), var(--wemd-bg-soft, #f7f8fa));
}
#wemd .wemd-brand-sign[data-variant="stacked"] .wemd-bs-logo {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.08);
  margin-bottom: 10px;
  background-image: var(--wemd-asset-logo, none);
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: 700;
  color: var(--wemd-primary, #07c160);
}
#wemd .wemd-brand-sign[data-variant="stacked"] .wemd-bs-brand-name {
  font-size: 20px;
  margin-bottom: 4px;
}
#wemd .wemd-brand-sign[data-variant="stacked"] .wemd-bs-slogan {
  font-size: 14px;
  color: var(--wemd-primary, #07c160);
  font-weight: 500;
  margin-bottom: 14px;
}
#wemd .wemd-brand-sign[data-variant="stacked"] .wemd-bs-subtext {
  padding-top: 14px;
  margin-top: 4px;
  border-top: 1px dashed var(--wemd-border-soft, #e8ebe8);
}`;

/** brand-sign signature 手写签名感（斜体+装饰线） */
export const brandSignSignatureCss = `/* === brand-sign signature === */
#wemd .wemd-brand-sign[data-variant="signature"] {
  margin: 32px 0 20px;
}
#wemd .wemd-brand-sign[data-variant="signature"] .wemd-bs-wrapper {
  flex-direction: column;
  text-align: right;
  padding: 10px 6px;
  border: none;
  background: transparent;
  position: relative;
}
#wemd .wemd-brand-sign[data-variant="signature"] .wemd-bs-wrapper::before {
  content: "";
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: linear-gradient(180deg, var(--wemd-primary, #07c160), transparent);
  border-radius: 2px;
}
#wemd .wemd-brand-sign[data-variant="signature"] .wemd-bs-logo {
  display: none;
}
#wemd .wemd-brand-sign[data-variant="signature"] .wemd-bs-brand-name {
  font-family: Georgia, "Times New Roman", serif;
  font-style: italic;
  font-size: 20px;
  color: var(--wemd-text-strong, #0f172a);
  padding-right: 14px;
}
#wemd .wemd-brand-sign[data-variant="signature"] .wemd-bs-slogan {
  padding-right: 14px;
  font-style: italic;
  font-size: 13px;
  color: var(--wemd-text-soft, #64748b);
}`;

// ============================================================
// resource-list 变体（3 个）
// ============================================================

/** resource-list files 资料包风格 */
export const resourceListFilesCss = `/* === resource-list files === */
#wemd .wemd-resource-list[data-variant="files"] {
  background: var(--wemd-bg-soft, #f7f8fa);
}
#wemd .wemd-resource-list[data-variant="files"] .wemd-rl-item {
  background: #fff;
  border: 1px solid var(--wemd-border-soft, #e8ebe8);
  transition: border-color 0.2s ease;
}
#wemd .wemd-resource-list[data-variant="files"] .wemd-rl-tag {
  background: var(--wemd-primary, #07c160);
}`;

/** resource-list steps 步骤流程风格（大号序号） */
export const resourceListStepsCss = `/* === resource-list steps 步骤风 === */
#wemd .wemd-resource-list[data-variant="steps"] {
  background: transparent;
  padding: 8px 0;
}
#wemd .wemd-resource-list[data-variant="steps"] .wemd-rl-title {
  padding: 0 20px;
  color: var(--wemd-primary, #07c160);
}
#wemd .wemd-resource-list[data-variant="steps"] .wemd-rl-subtitle {
  padding: 0 20px;
}
#wemd .wemd-resource-list[data-variant="steps"] .wemd-rl-items {
  gap: 0;
  margin-top: 12px;
  padding-left: 36px;
  position: relative;
}
#wemd .wemd-resource-list[data-variant="steps"] .wemd-rl-items::before {
  content: "";
  position: absolute;
  left: 15px;
  top: 16px;
  bottom: 16px;
  width: 2px;
  background: linear-gradient(180deg, var(--wemd-primary, #07c160), var(--wemd-primary-light, #dcf3e6));
}
#wemd .wemd-resource-list[data-variant="steps"] .wemd-rl-item {
  background: var(--wemd-bg-card, #fff);
  border-radius: 12px;
  border: 1px solid var(--wemd-border-soft, #e8ebe8);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.03);
  margin-bottom: 14px;
}
#wemd .wemd-resource-list[data-variant="steps"] .wemd-rl-idx {
  width: 40px;
  height: 40px;
  font-size: 16px;
  background: var(--wemd-primary, #07c160);
  color: #fff;
  box-shadow: 0 4px 10px var(--wemd-primary-alpha-25, rgba(7, 193, 96, 0.25));
}
#wemd .wemd-resource-list[data-variant="steps"] .wemd-rl-tag {
  display: none;
}`;

/** resource-list minimal 极简参考书目（无图标、细线分隔） */
export const resourceListMinimalCss = `/* === resource-list minimal 极简 === */
#wemd .wemd-resource-list[data-variant="minimal"] {
  background: transparent;
  padding: 0;
}
#wemd .wemd-resource-list[data-variant="minimal"] .wemd-rl-title {
  font-size: 15px;
  text-transform: uppercase;
  letter-spacing: 3px;
  color: var(--wemd-text-soft, #64748b);
  padding-bottom: 12px;
  margin-bottom: 12px;
  border-bottom: 1px solid var(--wemd-border-soft, #e8ebe8);
}
#wemd .wemd-resource-list[data-variant="minimal"] .wemd-rl-subtitle {
  display: none;
}
#wemd .wemd-resource-list[data-variant="minimal"] .wemd-rl-items {
  gap: 0;
}
#wemd .wemd-resource-list[data-variant="minimal"] .wemd-rl-item {
  background: transparent;
  border: none;
  border-bottom: 1px solid var(--wemd-border-soft, #e8ebe8);
  border-radius: 0;
  padding: 12px 4px;
}
#wemd .wemd-resource-list[data-variant="minimal"] .wemd-rl-icon,
#wemd .wemd-resource-list[data-variant="minimal"] .wemd-rl-idx {
  display: none;
}
#wemd .wemd-resource-list[data-variant="minimal"] .wemd-rl-item-title {
  font-size: 14.5px;
  font-weight: 500;
}
#wemd .wemd-resource-list[data-variant="minimal"] .wemd-rl-tag {
  display: none;
}`;

// ============================================================
// testimonial-card 变体（3 个）
// ============================================================

/** testimonial-card classic 经典名言（大号引号装饰） */
export const testimonialClassicCss = `/* === testimonial-card classic === */
#wemd .wemd-testimonial-card[data-variant="classic"] {
  background: linear-gradient(135deg, #fff, var(--wemd-bg-soft, #f7f8fa));
}
#wemd .wemd-testimonial-card[data-variant="classic"]::before {
  font-size: 64px;
  color: var(--wemd-primary-light, #d4f4e1);
}
#wemd .wemd-testimonial-card[data-variant="classic"] .wemd-tc-quote {
  font-size: 18px;
  font-weight: 600;
  line-height: 1.8;
  color: var(--wemd-text-strong, #0f172a);
  padding-top: 12px;
}
#wemd .wemd-testimonial-card[data-variant="classic"] .wemd-tc-person {
  padding-left: 36px;
  flex-direction: row;
  align-items: center;
  gap: 12px;
}
#wemd .wemd-testimonial-card[data-variant="classic"] .wemd-tc-avatar img {
  border: 3px solid var(--wemd-primary-light, #d4f4e1);
}`;

/** testimonial-card casual 轻量种草（左头像右正文） */
export const testimonialCasualCss = `/* === testimonial-card casual 种草 === */
#wemd .wemd-testimonial-card[data-variant="casual"] {
  background: #fff;
  border-radius: 14px;
  box-shadow: 0 2px 14px rgba(0, 0, 0, 0.04);
}
#wemd .wemd-testimonial-card[data-variant="casual"]::before {
  display: none;
}
#wemd .wemd-testimonial-card[data-variant="casual"] .wemd-tc-person {
  padding-left: 0;
  padding-bottom: 14px;
  margin-bottom: 14px;
  border-bottom: 1px solid var(--wemd-border-soft, #e8ebe8);
  align-items: center;
}
#wemd .wemd-testimonial-card[data-variant="casual"] .wemd-tc-quote {
  padding: 0;
  font-size: 15px;
  font-weight: 500;
  color: var(--wemd-text-normal, #334155);
  line-height: 1.8;
}
#wemd .wemd-testimonial-card[data-variant="casual"] .wemd-tc-source {
  padding-left: 0;
}
#wemd .wemd-testimonial-card[data-variant="casual"] .wemd-tc-company-logo img {
  margin-left: 0;
}`;

/** testimonial-card featured 重点背书（居中+公司Logo一排） */
export const testimonialFeaturedCss = `/* === testimonial-card featured 重点背书 === */
#wemd .wemd-testimonial-card[data-variant="featured"] {
  background: linear-gradient(135deg, var(--wemd-primary, #07c160), var(--wemd-primary-dark, #0a8f4a));
  color: #fff;
  border: none;
  border-radius: 20px;
  padding: 36px 28px;
}
#wemd .wemd-testimonial-card[data-variant="featured"]::before {
  color: rgba(255, 255, 255, 0.2);
  font-size: 72px;
  top: 12px;
  left: 24px;
}
#wemd .wemd-testimonial-card[data-variant="featured"] .wemd-tc-quote {
  color: #fff;
  font-size: 19px;
  font-weight: 700;
  text-align: center;
  padding: 14px 6px 12px;
}
#wemd .wemd-testimonial-card[data-variant="featured"] .wemd-tc-source {
  color: rgba(255, 255, 255, 0.8);
  text-align: center;
  padding: 0 0 18px;
}
#wemd .wemd-testimonial-card[data-variant="featured"] .wemd-tc-person {
  flex-direction: column;
  text-align: center;
  padding-left: 0;
  gap: 6px;
}
#wemd .wemd-testimonial-card[data-variant="featured"] .wemd-tc-avatar img {
  width: 64px;
  height: 64px;
  border: 3px solid rgba(255, 255, 255, 0.4);
}
#wemd .wemd-testimonial-card[data-variant="featured"] .wemd-tc-name {
  color: #fff;
  margin-top: 6px;
}
#wemd .wemd-testimonial-card[data-variant="featured"] .wemd-tc-title {
  color: rgba(255, 255, 255, 0.85);
}
#wemd .wemd-testimonial-card[data-variant="featured"] .wemd-tc-company {
  color: rgba(255, 255, 255, 0.85);
}
#wemd .wemd-testimonial-card[data-variant="featured"] .wemd-tc-company-logo {
  text-align: center;
  padding-top: 22px;
  margin-top: 18px;
  border-top: 1px solid rgba(255, 255, 255, 0.25);
}
#wemd .wemd-testimonial-card[data-variant="featured"] .wemd-tc-company-logo img {
  margin: 0 auto;
  filter: brightness(0) invert(1);
}`;

// ============================================================
// series-nav 变体（3 个）
// ============================================================

/** series-nav progress 进度条风（紧凑，不展开列表） */
export const seriesProgressCss = `/* === series-nav progress === */
#wemd .wemd-series-nav[data-variant="progress"] .wemd-sn-articles {
  display: none;
}
#wemd .wemd-series-nav[data-variant="progress"] {
  padding: 16px 20px;
  border-radius: 12px;
  background: var(--wemd-bg-soft, #f7f8fa);
}
#wemd .wemd-series-nav[data-variant="progress"] .wemd-sn-name {
  font-size: 15px;
}
#wemd .wemd-series-nav[data-variant="progress"] .wemd-sn-desc {
  display: none;
}
#wemd .wemd-series-nav[data-variant="progress"] .wemd-sn-nav {
  margin-bottom: 0;
}`;

/** series-nav toc 目录风（展开所有文章） */
export const seriesTocCss = `/* === series-nav toc 目录风 === */
#wemd .wemd-series-nav[data-variant="toc"] {
  background: #fff;
  border: 1px solid var(--wemd-border, #e2e8f0);
  border-radius: 16px;
}
#wemd .wemd-series-nav[data-variant="toc"] .wemd-sn-header {
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px dashed var(--wemd-border-soft, #e8ebe8);
}
#wemd .wemd-series-nav[data-variant="toc"] .wemd-sn-name {
  font-size: 20px;
}
#wemd .wemd-series-nav[data-variant="toc"] .wemd-sn-progress-bar {
  display: none;
}
#wemd .wemd-series-nav[data-variant="toc"] .wemd-sn-nav {
  display: none;
}
#wemd .wemd-series-nav[data-variant="toc"] .wemd-sn-articles {
  gap: 8px;
  background: transparent;
  padding: 0;
}
#wemd .wemd-series-nav[data-variant="toc"] .wemd-sn-item {
  padding: 10px 12px;
  border-radius: 10px;
}
#wemd .wemd-series-nav[data-variant="toc"] .wemd-sn-item.current {
  background: linear-gradient(90deg, var(--wemd-primary-light, #e7f8ef), transparent);
}`;

/** series-nav breadcrumb 面包屑风（一行紧凑） */
export const seriesBreadcrumbCss = `/* === series-nav breadcrumb === */
#wemd .wemd-series-nav[data-variant="breadcrumb"] {
  padding: 10px 16px;
  margin: 20px 0;
  border-radius: 999px;
  background: var(--wemd-bg-soft, #f7f8fa);
  box-shadow: none;
}
#wemd .wemd-series-nav[data-variant="breadcrumb"] .wemd-sn-desc,
#wemd .wemd-series-nav[data-variant="breadcrumb"] .wemd-sn-progress-bar,
#wemd .wemd-series-nav[data-variant="breadcrumb"] .wemd-sn-articles {
  display: none;
}
#wemd .wemd-series-nav[data-variant="breadcrumb"] .wemd-sn-header {
  margin-bottom: 0;
  display: inline-block;
  vertical-align: middle;
  margin-right: 16px;
}
#wemd .wemd-series-nav[data-variant="breadcrumb"] .wemd-sn-name {
  font-size: 14px;
  font-weight: 600;
}
#wemd .wemd-series-nav[data-variant="breadcrumb"] .wemd-sn-name small {
  display: none;
}
#wemd .wemd-series-nav[data-variant="breadcrumb"] .wemd-sn-nav {
  display: inline-grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-bottom: 0;
  vertical-align: middle;
  width: calc(100% - 260px);
}
#wemd .wemd-series-nav[data-variant="breadcrumb"] .wemd-sn-prev,
#wemd .wemd-series-nav[data-variant="breadcrumb"] .wemd-sn-next {
  flex-direction: row;
  align-items: center;
  gap: 10px;
  padding: 6px 12px;
  background: transparent;
  border: none;
}
#wemd .wemd-series-nav[data-variant="breadcrumb"] .wemd-sn-next {
  justify-content: flex-end;
}
#wemd .wemd-series-nav[data-variant="breadcrumb"] .wemd-sn-prev-label,
#wemd .wemd-series-nav[data-variant="breadcrumb"] .wemd-sn-next-label {
  display: none;
}
#wemd .wemd-series-nav[data-variant="breadcrumb"] .wemd-sn-prev::before {
  content: "‹";
  font-size: 20px;
  color: var(--wemd-text-soft, #64748b);
  font-weight: 700;
}
#wemd .wemd-series-nav[data-variant="breadcrumb"] .wemd-sn-next::after {
  content: "›";
  font-size: 20px;
  color: var(--wemd-text-soft, #64748b);
  font-weight: 700;
  order: 2;
}
#wemd .wemd-series-nav[data-variant="breadcrumb"] .wemd-sn-empty {
  opacity: 0.5;
  padding: 0;
  min-height: 0;
}`;

export const VARIANT_CSS_MAP: Record<string, Record<string, string>> = {
  "share-card": {
    warm: shareCardWarmCss,
    minimal: shareCardMinimalCss,
    tech: shareCardTechCss,
  },
  "quote-card": {
    classic: quoteCardClassicCss,
    quotation: quoteCardQuotationCss,
    card: quoteCardCardCss,
  },
  "cta-card": {
    pill: ctaCardPillCss,
    banner: ctaCardBannerCss,
    minimal: ctaCardMinimalCss,
  },
  "divider-fancy": {
    line: dividerFancyLineCss,
    gradient: dividerFancyGradientCss,
    dots: dividerFancyDotsCss,
  },
  "hero-banner": {
    center: heroBannerCenterCss,
    left: heroBannerLeftCss,
    minimal: heroBannerMinimalCss,
  },
  "callout-pro": {
    border: "", // 默认样式，无需额外 CSS
    bg: calloutProBgCss,
    minimal: calloutProMinimalCss,
  },
  "section-divider": {
    line: sectionDividerLineCss,
    dots: sectionDividerDotsCss,
    bold: sectionDividerBoldCss,
  },
  "end-card": {
    centered: endCardCenteredCss,
    minimal: endCardMinimalCss,
    warm: endCardWarmCss,
  },
  "product-card": {
    ecommerce: productCardEcommerceCss,
    minimal: productCardMinimalCss,
    promo: productCardPromoCss,
  },
  "brand-sign": {
    inline: brandSignInlineCss,
    stacked: brandSignStackedCss,
    signature: brandSignSignatureCss,
  },
  "resource-list": {
    files: resourceListFilesCss,
    steps: resourceListStepsCss,
    minimal: resourceListMinimalCss,
  },
  "testimonial-card": {
    classic: testimonialClassicCss,
    casual: testimonialCasualCss,
    featured: testimonialFeaturedCss,
  },
  "series-nav": {
    progress: seriesProgressCss,
    toc: seriesTocCss,
    breadcrumb: seriesBreadcrumbCss,
  },
};
