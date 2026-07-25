export const dataBlueprintTheme = `/* 数据蓝图：商业分析与数据复盘 */
#wemd {
  max-width: 677px;
  margin: 0 auto;
  padding: 14px 20px;
  color: #203047;
  background-color: transparent;
  font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif;
  font-size: 15px;
  line-height: 1.72;
  letter-spacing: 0.006em;
  font-variant-numeric: tabular-nums;
  word-break: break-word;
}

#wemd p {
  margin: 0 0 18px;
  color: #203047;
  font-size: 15px;
  line-height: 1.72;
  text-align: left;
  text-wrap: pretty;
}

#wemd h1,
#wemd h2,
#wemd h3,
#wemd h4,
#wemd h5,
#wemd h6 {
  padding: 0;
  text-align: left;
}

#wemd h1 {
  margin: 18px 0 34px;
  padding: 27px 24px 25px;
  border: none;
  background: #102b4e;
}

#wemd h1 .content {
  color: #ffffff;
  font-size: 29px;
  font-weight: 800;
  line-height: 1.38;
  letter-spacing: 0.015em;
  text-wrap: balance;
}

#wemd h2 {
  margin: 42px 0 20px;
  padding: 0 0 7px;
  border-bottom: 2px solid #173f7a;
  background: transparent;
}

#wemd h2 .content {
  color: #173f7a;
  font-family: "SFMono-Regular", Consolas, monospace;
  font-size: 18px;
  font-weight: 700;
  line-height: 1.45;
  text-wrap: balance;
}

#wemd h3 {
  margin: 29px 0 14px;
  padding: 0;
  border: none;
}

#wemd h3 .content {
  display: inline-block;
  padding: 4px 8px;
  border: 1px solid #7790ac;
  color: #173f7a;
  background: #edf3f8;
  font-family: "SFMono-Regular", Consolas, monospace;
  font-size: 14px;
  font-weight: 700;
  text-wrap: balance;
}

#wemd h4,
#wemd h5,
#wemd h6 {
  margin: 28px 0 13px;
}

#wemd h4 .content,
#wemd h5 .content,
#wemd h6 .content {
  color: #365777;
  font-size: 16px;
  font-weight: 700;
}

#wemd h1 .prefix,
#wemd h1 .suffix,
#wemd h2 .prefix,
#wemd h2 .suffix,
#wemd h3 .prefix,
#wemd h3 .suffix,
#wemd h4 .prefix,
#wemd h4 .suffix,
#wemd h5 .prefix,
#wemd h5 .suffix,
#wemd h6 .prefix,
#wemd h6 .suffix {
  display: none;
}

#wemd blockquote {
  border: none;
}

#wemd .multiquote-1,
#wemd .multiquote-2,
#wemd .multiquote-3 {
  margin: 26px 0;
  padding: 15px 4px;
  border-top: 1px dashed #7790ac;
  border-bottom: 1px dashed #7790ac;
  background: transparent;
}

#wemd .multiquote-1 p,
#wemd .multiquote-2 p,
#wemd .multiquote-3 p {
  margin: 0;
  color: #314765;
  font-family: "SFMono-Regular", Consolas, monospace;
  font-size: 14px;
  line-height: 1.7;
}

#wemd .multiquote-2,
#wemd .multiquote-3,
#wemd .multiquote-1 .multiquote-1 {
  margin: 10px 0 0;
  padding: 8px 0 0 12px;
  border-top: 1px dotted #aebdce;
  border-bottom: none;
}

#wemd ul,
#wemd ol {
  margin: 18px 0 24px;
  padding-left: 25px;
  color: #a84317;
}

#wemd ul {
  list-style-type: square;
}

#wemd ol {
  font-family: "SFMono-Regular", Consolas, monospace;
  list-style-type: decimal-leading-zero;
}

#wemd li section {
  margin: 6px 0;
  color: #203047;
  font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif;
  line-height: 1.68;
}

#wemd ol > li > section {
  padding: 3px 0 9px;
  border-bottom: 1px dotted #aebdce;
}

#wemd a {
  color: #175da8;
  font-weight: 600;
  text-decoration: underline;
  text-decoration-color: #8bb4df;
  text-underline-offset: 0.2em;
}

#wemd strong {
  color: #142e55;
  font-weight: 750;
}

#wemd mark {
  padding: 1px 4px;
  color: #633018;
  background: #f9d9c8;
}

#wemd hr {
  height: 0;
  margin: 38px 0;
  border: none;
  border-top: 1px dashed #7790ac;
  background: transparent;
}

#wemd figure {
  margin: 30px 0 36px;
  break-inside: avoid;
}

#wemd figure a {
  border: none;
}

#wemd img,
#wemd figure a img {
  display: block;
  max-width: 100%;
  height: auto;
  margin: 0 auto;
  padding: 5px;
  border: 1px solid #aebdce;
  background: #ffffff;
}

#wemd figcaption {
  margin-top: 0;
  padding: 8px 10px;
  color: #536a84;
  background: #edf3f8;
  font-family: "SFMono-Regular", Consolas, monospace;
  font-size: 11px;
  line-height: 1.6;
  text-align: left;
}

#wemd p code,
#wemd li code {
  padding: 2px 6px;
  border: 1px solid #c7d2df;
  color: #174f8f;
  background: #eef3f8;
  font-family: "SFMono-Regular", Consolas, monospace;
  font-size: 13px;
}

#wemd pre {
  margin: 30px 0;
  border: 1px solid #173f7a;
  border-top: 6px solid #a84317;
  background: #13233a;
  overflow-x: auto;
}

#wemd pre code,
#wemd pre code.hljs {
  display: block;
  min-width: max-content;
  padding: 19px 20px;
  color: #eaf1f8;
  background: #13233a;
  font-family: "SFMono-Regular", Consolas, monospace;
  font-size: 13px;
  line-height: 1.7;
  white-space: pre;
}

#wemd pre.custom > .mac-sign {
  display: block;
  border-bottom: 1px solid #35506e;
  background: #13233a;
}

#wemd .table-container {
  margin: 32px 0;
  overflow-x: auto;
}

#wemd table {
  width: 100%;
  border-collapse: collapse;
  border: 2px solid #173f7a;
  color: #26354d;
  background: #ffffff;
  font-variant-numeric: tabular-nums;
  text-align: left;
}

#wemd table tr th,
#wemd table tr td {
  min-width: 88px;
  padding: 11px 10px;
  border: 1px solid #c9d4e0;
  font-size: 14px;
  line-height: 1.6;
}

#wemd table tr th {
  color: #ffffff;
  background: #173f7a;
  font-weight: 700;
}

#wemd table tr:nth-child(2n) {
  background: #f0f4f8;
}

#wemd .callout {
  margin: 30px 0;
  padding: 17px 19px;
  border: 1px dashed #7790ac;
  border-radius: 0;
  color: #26354d;
  background: transparent;
  break-inside: avoid;
}

#wemd .callout-warning,
#wemd .callout-caution {
  border-color: #a84317;
  background: #fff0e8;
}

#wemd .callout-title {
  margin-bottom: 7px;
  color: #173f7a;
  font-family: "SFMono-Regular", Consolas, monospace;
  font-size: 13px;
  font-weight: 750;
}

#wemd .callout p {
  margin: 0;
  font-size: 15px;
}

#wemd .footnote-word,
#wemd .footnote-ref {
  color: #175da8;
  font-weight: 700;
}

#wemd .footnotes-sep {
  margin-top: 48px;
  padding-top: 16px;
  border-top: 6px solid #173f7a;
}

#wemd .footnote-item {
  display: flex;
  margin-top: 9px;
}

#wemd .footnote-num {
  width: 30px;
  flex-shrink: 0;
  color: #a84317;
  font-weight: 700;
}

#wemd .footnote-item p {
  margin: 0;
  color: #5b6e85;
  font-size: 13px;
  text-align: left;
}

#wemd .block-equation {
  display: block;
  margin: 30px 0;
  padding: 18px 10px;
  border: 1px solid #c9d4e0;
  background: #f7f9fb;
  text-align: center;
  overflow-x: auto;
}

#wemd .block-equation > svg {
  max-width: 300% !important;
}

#wemd .inline-equation > svg {
  vertical-align: middle;
}

#wemd pre.mermaid {
  padding: 20px 10px;
  border: 1px solid #aebdce;
  border-top: 6px solid #173f7a;
  background: #ffffff;
}

#wemd .task-list-item {
  display: flex;
  align-items: flex-start;
  margin-left: -1.2em;
  list-style: none;
}

#wemd .task-list-item input[type='checkbox'] {
  margin-top: 7px;
  margin-right: 8px;
  accent-color: #173f7a;
  pointer-events: none;
}
`;
