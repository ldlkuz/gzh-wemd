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
  background: linear-gradient(180deg, transparent 0%, rgba(7, 193, 96, 0.04) 100%);
}
#wemd .wemd-share-card[data-variant="warm"] .wemd-component-body > p:first-child {
  font-size: 15px;
  color: var(--wemd-text-strong, #1a1a1a);
  font-weight: 500;
}
#wemd .wemd-share-card[data-variant="warm"] .wemd-component-body > p:first-child strong {
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
#wemd .wemd-share-card[data-variant="minimal"] .wemd-component-body > p:first-child {
  font-size: 13px;
  color: var(--wemd-text-soft, #999999);
  letter-spacing: 0.5px;
}`;

export const shareCardTechCss = `/* === share-card 科技变体 === */
#wemd .wemd-share-card[data-variant="tech"] {
  margin: 40px 0 24px 0;
  padding: 20px 16px;
  text-align: center;
  background: linear-gradient(135deg, rgba(7, 193, 96, 0.08) 0%, rgba(7, 193, 96, 0.02) 100%);
  border-radius: 12px;
  border: 1px solid var(--wemd-border, #e2e8f0);
}
#wemd .wemd-share-card[data-variant="tech"] .wemd-component-body > p:first-child {
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
#wemd .wemd-quote-card[data-variant="classic"] .wemd-component-body > p {
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
#wemd .wemd-quote-card[data-variant="quotation"] .wemd-component-body > p {
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
#wemd .wemd-quote-card[data-variant="card"] .wemd-component-body > p {
  font-size: 15px;
  color: var(--wemd-text-normal, #34495e);
  line-height: 1.75;
  margin: 0;
}
#wemd .wemd-quote-card[data-variant="card"] .wemd-component-body > p strong {
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
#wemd .wemd-cta-card[data-variant="pill"] .wemd-component-body {
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
#wemd .wemd-cta-card[data-variant="pill"] .wemd-component-body > p {
  color: #fff;
  margin: 0;
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
#wemd .wemd-cta-card[data-variant="banner"] .wemd-component-body > p {
  color: #fff;
  font-size: 16px;
  font-weight: 500;
  margin: 0;
}
#wemd .wemd-cta-card[data-variant="banner"] .wemd-component-body strong {
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
#wemd .wemd-cta-card[data-variant="minimal"] .wemd-component-body > p {
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
#wemd .wemd-divider-fancy[data-variant="line"] .wemd-component-body::before {
  content: "";
  display: block;
  width: 60px;
  height: 2px;
  background: var(--wemd-primary, #07c160);
  margin: 0 auto 8px;
}`;

/** divider-fancy 渐变 */
export const dividerFancyGradientCss = `/* === divider-fancy 渐变 === */
#wemd .wemd-divider-fancy[data-variant="gradient"] {
  margin: 32px 0;
  text-align: center;
}
#wemd .wemd-divider-fancy[data-variant="gradient"] .wemd-component-body::before {
  content: "";
  display: block;
  height: 3px;
  max-width: 200px;
  margin: 0 auto 10px;
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
#wemd .wemd-divider-fancy[data-variant="dots"] .wemd-component-body::before {
  content: "●●●";
}`;

// ============================================================
// 变体映射表
// ============================================================

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
};
