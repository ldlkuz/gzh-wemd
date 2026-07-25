export const modernEditorialFoundationTheme = `/* 编辑部手记：高信息密度的中文内刊风格 */
#wemd {
  max-width: 677px;
  margin: 0 auto;
  padding: 16px 24px;
  color: #34362f;
  background-color: transparent;
  font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", "Noto Sans CJK SC", sans-serif;
  font-size: 16px;
  line-height: 1.86;
  letter-spacing: 0.018em;
  word-break: break-word;
  counter-reset: editorial-section;
}

/* 正文 */
#wemd p {
  margin: 0 0 23px;
  color: #34362f;
  font-size: 16px;
  line-height: 1.86;
  letter-spacing: 0.018em;
  text-align: justify;
}

/* 刊头和章节 */
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
  margin: 26px 0 50px;
  padding: 24px 0 20px;
  border-top: 5px solid #20221e;
  border-bottom: 3px solid #c76237;
  background: transparent;
}

#wemd h1 .content {
  color: #20221e;
  font-family: "Songti SC", "STSong", "Noto Serif CJK SC", SimSun, serif;
  font-size: 32px;
  font-weight: 700;
  line-height: 1.4;
  letter-spacing: 0.04em;
}

#wemd h2 {
  display: flex;
  align-items: flex-end;
  gap: 14px;
  margin: 56px 0 25px;
  padding-bottom: 12px;
  border-bottom: 1px solid #afb1a6;
}

#wemd h2::before {
  content: counter(editorial-section, decimal-leading-zero);
  counter-increment: editorial-section;
  display: inline-block;
  min-width: 42px;
  margin-right: 4px;
  color: #c76237;
  font-family: "SFMono-Regular", Consolas, monospace;
  font-size: 32px;
  font-weight: 800;
  line-height: 1;
  letter-spacing: 0.02em;
  vertical-align: bottom;
}

#wemd h2 .content {
  color: #242720;
  font-family: "Songti SC", "STSong", "Noto Serif CJK SC", SimSun, serif;
  font-size: 23px;
  font-weight: 700;
  line-height: 1.48;
  letter-spacing: 0.035em;
}

#wemd h3 {
  margin: 38px 0 19px;
}

#wemd h3 .content {
  display: inline-block;
  padding: 7px 13px;
  color: #f4f2e9;
  background: #34372f;
  font-size: 16px;
  font-weight: 700;
  line-height: 1.45;
  letter-spacing: 0.055em;
}

#wemd h4 {
  margin: 31px 0 16px;
  padding-left: 12px;
  border-left: 4px solid #c76237;
}

#wemd h4 .content {
  color: #34372f;
  font-size: 16px;
  font-weight: 700;
  line-height: 1.5;
  letter-spacing: 0.035em;
}

#wemd h5,
#wemd h6 {
  margin: 27px 0 14px;
}

#wemd h5 .content,
#wemd h6 .content {
  color: #626657;
  font-size: 15px;
  font-weight: 700;
  line-height: 1.5;
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

/* 摘要引用 */
#wemd blockquote {
  border: none;
}

#wemd .multiquote-1 {
  margin: 35px 0;
  padding: 24px 24px 21px;
  border-top: 3px solid #5f6453;
  border-bottom: 1px solid #c8c9bf;
  background: #f1f0e9;
}

#wemd .multiquote-2,
#wemd .multiquote-3 {
  margin: 28px 0 28px 18px;
  padding: 7px 0 7px 18px;
  border-left: 3px solid #c76237;
  background: transparent;
}

#wemd .multiquote-1 p,
#wemd .multiquote-2 p,
#wemd .multiquote-3 p {
  margin: 0;
  color: #4f5347;
  font-family: "Songti SC", "STSong", "Noto Serif CJK SC", SimSun, serif;
  font-size: 16px;
  line-height: 1.9;
  letter-spacing: 0.035em;
}

/* 清单和步骤 */
#wemd ul,
#wemd ol {
  margin: 22px 0 28px;
  padding-left: 24px;
  color: #c76237;
}

#wemd ul {
  list-style-type: square;
}

#wemd ul ul {
  margin-top: 8px;
  list-style-type: circle;
}

#wemd ol {
  list-style-type: decimal-leading-zero;
}

#wemd ol ol {
  margin-top: 8px;
  list-style-type: lower-alpha;
}

#wemd li section {
  margin: 7px 0;
  color: #34362f;
  font-size: 16px;
  font-weight: 400;
  line-height: 1.8;
  text-align: left;
}

#wemd ol > li {
  margin: 11px 0;
  color: #c76237;
  font-weight: 700;
}

#wemd ol > li > section {
  padding: 10px 14px;
  border-left: 1px solid #b8baae;
  color: #34362f;
  background: #f5f4ee;
  font-weight: 400;
}
`;
