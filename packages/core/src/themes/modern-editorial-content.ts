export const modernEditorialContentTheme = `/* 行内强调 */
#wemd a {
  color: #9f4828;
  font-weight: 600;
  text-decoration: none;
  border-bottom: 1px solid #d59a7f;
}

#wemd strong {
  color: #242720;
  font-weight: 700;
  border-bottom: 2px solid #dfa187;
}

#wemd em {
  color: #646858;
  font-style: italic;
}

#wemd em strong {
  color: #242720;
  font-weight: 700;
  font-style: italic;
}

#wemd mark {
  padding: 1px 4px;
  color: #392e27;
  background: #f1d8c9;
}

#wemd del {
  color: #8b8d84;
  text-decoration: line-through;
}

#wemd u {
  text-decoration-color: #c76237;
  text-decoration-thickness: 1px;
  text-underline-offset: 0.22em;
}

#wemd hr {
  width: 84px;
  height: 5px;
  margin: 54px auto;
  border: none;
  background: #c76237;
}

/* 图片版式 */
#wemd figure {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  margin: 40px 4px 44px 0;
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
  padding: 7px;
  border: 1px solid #ccccc2;
  border-radius: 1px;
  background: #f7f6f0;
  box-shadow: 8px 8px 0 #deddd4;
}

#wemd figcaption {
  margin-top: 16px;
  padding-left: 13px;
  border-left: 3px solid #c76237;
  color: #73766b;
  font-size: 12px;
  line-height: 1.65;
  letter-spacing: 0.04em;
  text-align: left;
}

/* 行内代码 */
#wemd p code,
#wemd li code {
  margin: 0 2px;
  padding: 2px 6px;
  border: 1px solid #d2d1c7;
  border-radius: 2px;
  color: #9f4828;
  background: #f1f0e9;
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
  font-size: 13px;
  word-break: break-all;
}
`;
