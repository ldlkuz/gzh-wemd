const fs = require("fs");
const s = fs.readFileSync("output/test.html", "utf8");
// 定位每个组件节点，提取 class 层级
const compRe = /data-component="([^"]+)"/g;
const seen = new Set();
let m;
// 简化：按组件名切分，提取该组件到下一个组件之间的 child class 序列
const compStarts = [];
const re2 = /class="wemd-component[^"]*?wemd-([a-z-]+)"[^>]*data-component="([^"]+)"/g;
let mm;
while ((mm = re2.exec(s))) compStarts.push({ cls: mm[2], idx: mm.index });
compStarts.sort((a,b)=>a.idx-b.idx);
const comps = {};
for (let i=0;i<compStarts.length;i++){
  const c = compStarts[i];
  if (comps[c.cls]) continue;
  const end = compStarts[i+1] ? compStarts[i+1].idx : s.length;
  const block = s.slice(c.idx, end);
  const classes = [...new Set([...block.matchAll(/class="([^"]+)"/g)].map(x=>x[1].split(/\s+/)).flat().filter(x=>x.startsWith("wemd-")))];
  comps[c.cls] = classes;
}
for (const [k,v] of Object.entries(comps)) console.log(k, "=>", v.join(", "));