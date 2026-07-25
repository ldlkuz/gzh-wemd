export const whitespaceGalleryTheme = `/* 留白画册：图片与人物故事 */
#wemd {
  max-width: 677px;
  margin: 0 auto;
  padding: 30px 24px;
  color: #3a3734;
  background-color: transparent;
  font-family: "Songti SC", "STSong", "Noto Serif CJK SC", SimSun, serif;
  font-size: 17px;
  line-height: 2;
  letter-spacing: 0.035em;
  word-break: break-word;
}

#wemd p {
  max-width: 34em;
  margin: 0 auto 31px;
  color: #3a3734;
  font-size: 17px;
  line-height: 2;
  text-align: left;
  text-wrap: pretty;
}

#wemd h1 {
  max-width: 12em;
  margin: 58px auto 96px;
  padding: 0;
  border: none;
  text-align: center;
}

#wemd h1 .content {
  color: #2b2927;
  font-family: "Songti SC", "STSong", "Noto Serif CJK SC", SimSun, serif;
  font-size: 38px;
  font-weight: 700;
  line-height: 1.42;
  letter-spacing: 0.08em;
  text-wrap: balance;
}

#wemd h2 {
  max-width: 22em;
  margin: 78px auto 34px;
  text-align: left;
}

#wemd h2 .content {
  display: block;
  padding: 0;
  border: none;
  color: #2b2927;
  font-family: "Songti SC", "STSong", "Noto Serif CJK SC", SimSun, serif;
  font-size: 26px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-wrap: balance;
}

#wemd h3 {
  max-width: 34em;
  margin: 44px auto 20px;
  padding: 0;
  border: none;
}

#wemd h3 .content {
  color: #80503f;
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-wrap: balance;
}

#wemd h4,
#wemd h5,
#wemd h6 {
  max-width: 40em;
  margin: 30px auto 15px;
}

#wemd h4 .content,
#wemd h5 .content,
#wemd h6 .content {
  color: #625b55;
  font-size: 16px;
  font-weight: 650;
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
  margin: 62px 0;
  padding: 38px 28px;
  border: none;
  background: #2b2927;
  break-inside: avoid;
}

#wemd .multiquote-1 p,
#wemd .multiquote-2 p,
#wemd .multiquote-3 p {
  margin: 0 auto;
  color: #f7f6f4;
  font-family: "Songti SC", "STSong", "Noto Serif CJK SC", SimSun, serif;
  font-size: 21px;
  line-height: 1.85;
  letter-spacing: 0.04em;
  text-align: center;
}

#wemd .multiquote-2,
#wemd .multiquote-3,
#wemd .multiquote-1 .multiquote-1 {
  margin: 18px 0 0;
  padding: 14px 0 0;
  border: none;
  border-top: 1px solid #77716c;
  background: transparent;
}

#wemd ul,
#wemd ol {
  max-width: 38em;
  margin: 24px auto 31px;
  padding-left: 25px;
  color: #8b4c3b;
}

#wemd li section {
  margin: 7px 0;
  color: #3a3734;
  line-height: 1.85;
}

#wemd ol > li > section {
  padding-bottom: 4px;
  border: none;
}

#wemd a {
  color: #80503f;
  font-weight: 600;
  text-decoration: underline;
  text-underline-offset: 0.23em;
}

#wemd strong {
  color: #2b2927;
  font-weight: 750;
}

#wemd mark {
  padding: 1px 4px;
  color: #4c382f;
  background: #eadbd5;
}

#wemd hr {
  width: 1px;
  height: 64px;
  margin: 72px auto;
  border: none;
  background: #2b2927;
}

#wemd figure {
  margin: 72px 0 80px;
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
}

#wemd figcaption {
  max-width: 34em;
  margin: 16px auto 0;
  padding-top: 9px;
  border-top: 1px solid #bbb6b1;
  color: #77706a;
  font-size: 12px;
  line-height: 1.7;
  letter-spacing: 0.055em;
  text-align: left;
}

#wemd p code,
#wemd li code {
  padding: 2px 5px;
  border-bottom: 1px solid #a7a29d;
  color: #5c4740;
  background: #f3f2f1;
  font-family: "SFMono-Regular", Consolas, monospace;
  font-size: 13px;
}

#wemd pre {
  margin: 38px 0;
  border: 1px solid #2b2927;
  background: #2b2927;
  overflow-x: auto;
}

#wemd pre code,
#wemd pre code.hljs {
  display: block;
  min-width: max-content;
  padding: 21px;
  color: #f0efed;
  background: #2b2927;
  font-family: "SFMono-Regular", Consolas, monospace;
  font-size: 13px;
  line-height: 1.72;
  white-space: pre;
}

#wemd pre.custom > .mac-sign {
  display: block;
  border-bottom: 1px solid #57524e;
  background: #2b2927;
}

#wemd .table-container {
  margin: 39px 0;
  overflow-x: auto;
}

#wemd table {
  width: 100%;
  border-collapse: collapse;
  color: #3a3734;
  background: transparent;
  text-align: left;
}

#wemd table tr th,
#wemd table tr td {
  min-width: 88px;
  padding: 11px 9px;
  border: none;
  border-bottom: 1px solid #bbb6b1;
  font-size: 14px;
  line-height: 1.65;
}

#wemd table tr th {
  border-top: 3px solid #2b2927;
  border-bottom: 2px solid #2b2927;
  color: #2b2927;
  background: transparent;
  font-weight: 750;
}

#wemd table tr:nth-child(2n) {
  background: transparent;
}

#wemd .callout {
  max-width: 34em;
  margin: 52px auto;
  padding: 24px 0;
  border: none;
  border-top: 1px solid #aaa49f;
  border-bottom: 1px solid #aaa49f;
  border-radius: 0;
  color: #49433f;
  background: transparent;
  break-inside: avoid;
}

#wemd .callout-warning,
#wemd .callout-caution {
  border-color: #8b4c3b;
  background: transparent;
}

#wemd .callout-title {
  margin-bottom: 8px;
  color: #2b2927;
  font-weight: 700;
}

#wemd .callout p {
  margin: 0;
  color: #5e5751;
  font-size: 15px;
}

#wemd .footnote-word,
#wemd .footnote-ref {
  color: #80503f;
  font-weight: 700;
}

#wemd .footnotes-sep {
  margin-top: 57px;
  padding-top: 18px;
  border-top: 1px solid #2b2927;
}

#wemd .footnote-item {
  display: flex;
  max-width: 40em;
  margin: 10px auto 0;
}

#wemd .footnote-num {
  width: 30px;
  flex-shrink: 0;
  color: #80503f;
}

#wemd .footnote-item p {
  margin: 0;
  color: #77706a;
  font-size: 13px;
  text-align: left;
}

#wemd .block-equation {
  display: block;
  margin: 38px 0;
  padding: 20px 10px;
  border-top: 1px solid #bbb6b1;
  border-bottom: 1px solid #bbb6b1;
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
  padding: 22px 10px;
  border: 1px solid #aaa49f;
  border-top: 4px solid #2b2927;
  background: #ffffff;
}

#wemd .task-list-item {
  display: flex;
  align-items: flex-start;
  margin-left: -1.2em;
  list-style: none;
}

#wemd .task-list-item input[type='checkbox'] {
  margin-top: 8px;
  margin-right: 8px;
  accent-color: #2b2927;
  pointer-events: none;
}
`;
