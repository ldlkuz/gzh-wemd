/**
 * 组件变体 CSS
 *
 * 每个变体使用 [data-variant="xxx"] 属性选择器隔离，
 * 与默认样式不冲突。未指定 variant 时使用默认样式。
 *
 * Phase 3: 首批示范变体
 */

/** share-card 温暖变体 */
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

/** share-card 极简变体 */
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

/** share-card 科技变体 */
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

/** 所有变体 CSS 映射 */
export const VARIANT_CSS_MAP: Record<string, Record<string, string>> = {
  "share-card": {
    warm: shareCardWarmCss,
    minimal: shareCardMinimalCss,
    tech: shareCardTechCss,
  },
};
