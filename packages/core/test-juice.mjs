import juice from 'juice';

const html = '<section id="wemd"><section class="wemd-component wemd-magazine-cover"><section class="wemd-mc-title">Hello</section></section></section>';

const css = `
#wemd .wemd-magazine-cover {
  margin: 24px 0;
  padding: 40px 24px;
  background: #ffffff;
  border-radius: 18px;
}
#wemd .wemd-magazine-cover .wemd-mc-title {
  font-size: 32px;
  font-weight: 700;
  color: #07c160;
}
`;

const result = juice.inlineContent(html, css);
console.log(result);
