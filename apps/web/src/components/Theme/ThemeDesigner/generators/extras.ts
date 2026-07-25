import type { DesignerVariables } from "../types";

interface ExtraPresets {
  headingExtras: string;
  quoteExtras: string;
}

export function generateExtras(
  v: DesignerVariables,
  presets: ExtraPresets,
): string {
  return `${presets.headingExtras}
${presets.quoteExtras}

#wemd .footnote-word {
  color: ${v.footnoteHeaderColor || v.primaryColor};
  font-weight: bold;
}

#wemd .footnote-ref {
  color: ${v.footnoteHeaderColor || v.primaryColor};
  font-weight: bold;
}

#wemd .footnote-ref a {
  color: ${v.footnoteHeaderColor || v.primaryColor} !important;
  text-decoration: none;
  border-bottom: none!important;
}

#wemd .footnote-item {
  display: flex;
}

#wemd .footnote-num {
  display: inline;
  width: 32px;
  flex-shrink: 0;
  background: none;
  font-size: 80%;
  line-height: 26px;
  color: ${v.footnoteHeaderColor || v.primaryColor};
  font-family: Optima-Regular, Optima, PingFangSC-light, PingFangTC-light, 'PingFang SC', Cambria, Cochin, Georgia, Times, 'Times New Roman', serif;
}

#wemd .footnote-num a,
  #wemd .footnote-item a.footnote-backref {
  color: ${v.footnoteHeaderColor || v.primaryColor} !important;
  text-decoration: none;
  border-bottom: none!important;
}

#wemd .footnote-item p {
  display: inline;
  font-size: ${v.footnoteFontSize}px;
  flex: 1;
  padding: 0;
  margin: 0;
  line-height: 26px;
  word-break: break-all;
  color: ${v.footnoteColor || "#666"};
}

#wemd .footnotes-sep:before {
  content: "${v.footnoteHeader}";
  display: ${v.footnoteHeader ? "block" : "none"};
  ${
    v.footnoteHeaderStyle === "simple"
      ? `
    font-weight: bold;
    font-size: 16px;
    color: ${v.footnoteHeaderColor || v.primaryColor};
  `
      : ""
  }
  ${
    v.footnoteHeaderStyle === "left-border"
      ? `
    font-weight: bold;
    font-size: 18px;
    color: ${v.footnoteHeaderColor || v.primaryColor};
    border-left: 4px solid ${v.footnoteHeaderColor || v.primaryColor};
    padding-left: 10px;
  `
      : ""
  }
  ${
    v.footnoteHeaderStyle === "bottom-border"
      ? `
    font-weight: bold;
    font-size: 18px;
    color: ${v.footnoteHeaderColor || v.primaryColor};
    border-bottom: 2px solid ${v.footnoteHeaderColor || v.primaryColor};
    padding-bottom: 6px;
  `
      : ""
  }
  ${
    v.footnoteHeaderStyle === "background"
      ? `
    font-weight: bold;
    font-size: 18px;
    color: ${v.footnoteHeaderColor || v.primaryColor};
    background: ${v.footnoteHeaderColor || v.primaryColor}15;
    padding: 6px 12px;
    border-radius: 4px;
    border-left: 4px solid ${v.footnoteHeaderColor || v.primaryColor};
  `
      : ""
  }
  ${
    v.footnoteHeaderStyle === "pill"
      ? `
    font-weight: bold;
    font-size: 16px;
    background: ${v.footnoteHeaderColor || v.primaryColor};
    color: #fff;
    padding: 4px 16px;
    border-radius: 20px;
    display: inline-block;
  `
      : ""
  }
}

#wemd .callout {
  border-left-width: 4px;
  border-left-style: solid;
  border-radius: 4px;
  margin: var(--wemd-paragraph-margin) 0;
  padding: 12px 16px;
}

/* 横向滑动图片 */
#wemd .imageflow-layer1 {
  margin-top: 1em;
  margin-bottom: 0.5em;
  white-space: normal;
  border: 0px none;
  padding: 0px;
  overflow: hidden;
}

#wemd .imageflow-layer2 {
  white-space: nowrap;
  width: 100%;
  overflow-x: scroll;
}

#wemd .imageflow-layer3 {
  display: inline-block;
  word-wrap: break-word;
  white-space: normal;
  vertical-align: top;
  width: 80%;
  margin-right: 10px;
  flex-shrink: 0;
}

#wemd .imageflow-img {
  display: block;
  width: 100%;
  height: auto;
  max-height: 300px;
  object-fit: contain;
  border-radius: var(--wemd-image-border-radius);
}

#wemd .imageflow-caption {
  text-align: center;
  margin-top: 0px;
  padding-top: 0px;
  color: var(--wemd-image-caption-color);
  font-size: var(--wemd-image-caption-font-size);
}

/* 提示块默认样式 */
#wemd .callout-title {
  font-weight: 600;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 0;
  letter-spacing: 0.05em;
}

#wemd .callout-icon {
  font-size: 18px;
  margin-right: 8px;
}

#wemd .callout p {
  margin: 0 !important;
}

#wemd .callout-note { border-left: 4px solid #6366f1; background: #f5f5ff; }
#wemd .callout-tip { border-left: 4px solid #10b981; background: #ecfdf5; }
#wemd .callout-important { border-left: 4px solid #8b5cf6; background: #f5f3ff; }
#wemd .callout-warning { border-left: 4px solid #f59e0b; background: #fffbeb; }
#wemd .callout-caution { border-left: 4px solid #ef4444; background: #fff5f5; }

/* Mermaid 样式覆盖 */
#wemd .mermaid .node foreignObject {
  overflow: visible;
}
#wemd .mermaid .label {
  color: var(--wemd-text-color);
  font-family: inherit;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  text-align: center;
  line-height: 1.2;
}
#wemd .mermaid .label * {
  margin: 0;
  padding: 0;
}
`;
}
