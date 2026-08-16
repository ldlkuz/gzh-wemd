import { describe, expect, it } from "vitest";
import { createMarkdownParser } from "../MarkdownParser";
import { parseComponentSlots } from "../plugins/component/slotParsers";
import { fillTemplate } from "../plugins/component/templateFiller";
import type { SlotContent } from "../plugins/component/slotTypes";

function parser() {
  return createMarkdownParser();
}

describe("slotParsers 分槽", () => {
  it("quote-card：quote 段落 + author 粗体行", () => {
    const result = parseComponentSlots(
      parser(),
      "quote-card",
      "这是金句内容\n\n署名：**鲁迅**",
    );
    expect(result.quote).toBe("这是金句内容");
    expect(result.author).toBe("署名：<strong>鲁迅</strong>");
    expect(result.body).toBeUndefined();
  });

  it("quote-card：多余内容进 body 兜底，不丢内容", () => {
    const result = parseComponentSlots(
      parser(),
      "quote-card",
      "金句\n\n**鲁迅**\n\n多余一段",
    );
    expect(result.quote).toBe("金句");
    expect(result.author).toBe("<strong>鲁迅</strong>");
    expect(result.body).toContain("多余一段");
  });

  it("magazine-cover：title/subtitle/divider/desc 分离", () => {
    const result = parseComponentSlots(
      parser(),
      "magazine-cover",
      "主标题\n英文副标题\n---\n描述第一段\n\n描述第二段",
    );
    expect(result.title).toBe("主标题");
    expect(result.subtitle).toBe("英文副标题");
    expect(result.divider).toBe('<hr class="wemd-hr">');
    expect(result.desc).toBe("描述第一段<br>描述第二段");
  });

  it("stats-block：list 返回条目数组 (value/label)", () => {
    const result = parseComponentSlots(
      parser(),
      "stats-block",
      "- 98%\n  用户满意度\n- 1200\n  日活用户",
    ) as SlotContent & { items: Array<{ value: string; label: string }> };
    expect(result.items).toEqual([
      { value: "98%", label: "用户满意度" },
      { value: "1200", label: "日活用户" },
    ]);
  });

  it("two-column-cards：list 条目 icon/title/desc", () => {
    const result = parseComponentSlots(
      parser(),
      "two-column-cards",
      "- 🚀\n  **标题A**\n  描述A描述A\n- 🎨\n  **标题B**\n  描述B",
    ) as SlotContent & {
      items: Array<{ icon: string; title: string; desc: string }>;
    };
    expect(result.items).toEqual([
      { icon: "🚀", title: "标题A", desc: "描述A描述A" },
      { icon: "🎨", title: "标题B", desc: "描述B" },
    ]);
  });

  it("list 条目：字段含粗体时剥掉所有 ** 标记，不残留", () => {
    const result = parseComponentSlots(
      parser(),
      "related-posts",
      "- **整体标题**\n  整体描述\n- 问题**一**和**二**\n  部分描述",
    ) as SlotContent & { items: Array<{ body: string }> };
    expect(result.items[0].body).toBe("整体标题");
    expect(result.items[1].body).toBe("问题一和二");
  });

  it("code-frame：title 首行 + code 提取围栏并消费", () => {
    const result = parseComponentSlots(
      parser(),
      "code-frame",
      "配置示例\n```js\nconst x = 1;\n```",
    );
    expect(result.title).toBe("配置示例");
    // code 槽重建为带高亮的 <pre><code>
    expect(result.code).toContain('class="hljs language-js"');
    expect(result.code).toContain("const");
    expect(result.code).toContain("1");
    // 围栏行已被消费，无 body 兜底重复
    expect(result.body).toBeUndefined();
  });

  it("未知组件回退到唯一 body 槽", () => {
    const result = parseComponentSlots(
      parser(),
      "some-unknown",
      "第一段\n\n第二段",
    );
    expect(result.body).toContain("第一段");
    expect(result.body).toContain("第二段");
  });

  it("section-divider：首行 PART + 标题 分离", () => {
    const result = parseComponentSlots(
      parser(),
      "section-divider",
      "PART 01\n第一章标题",
    );
    expect(result.part).toBe("PART 01");
    expect(result.title).toBe("第一章标题");
  });

  it("image-card：图片 + 可选说明", () => {
    const result = parseComponentSlots(
      parser(),
      "image-card",
      "![](https://img/x.png)\n这是一张说明图",
    );
    expect(result.image).toContain('src="https://img/x.png"');
    expect(result.caption).toBe("这是一张说明图");
  });

  it("end-card：首行标题 + 副标题 + 装饰段落", () => {
    const result = parseComponentSlots(
      parser(),
      "end-card",
      "谢谢阅读\n\n关注我\n\n装饰文字",
    );
    expect(result.title).toBe("谢谢阅读");
    expect(result.subtitle).toBe("关注我");
    expect(result.deco).toBe("装饰文字");
  });
});

describe("slotParsers 复杂扩展组件", () => {
  it("product-card：七段式字段分离", () => {
    const result = parseComponentSlots(
      parser(),
      "product-card",
      [
        "【超值优惠】**商品标题** 副标题",
        "商品描述文字",
        "~~原价99~~ ￥59",
        "⭐ 4.8 📦 已售1200 🔥 库存50",
        "【立即抢购】",
        "#顺丰包邮 #七天无理由",
      ].join("\n\n"),
    );
    expect(result.badge).toBe("超值优惠");
    expect(result.title).toBe("商品标题");
    expect(result.subtitle).toBe("副标题");
    expect(result.description).toBe("商品描述文字");
    expect(result.price).toBe("￥59");
    expect(result.originalPrice).toBe("<s>原价99</s>");
    expect(result.rating).toContain("⭐");
    expect(result.sales).toContain("1200");
    expect(result.stock).toContain("50");
    expect(result.button).toBe("立即抢购");
    const tags = result.tags as Array<{ tag: string }>;
    expect(tags.map((t) => t.tag)).toEqual(["#顺丰包邮", "#七天无理由"]);
    expect(result.image).toBeUndefined();
  });

  it("product-card：带头图时正确识别 image 字段", () => {
    const result = parseComponentSlots(
      parser(),
      "product-card",
      [
        "![](https://img/product.png)",
        "【爆款】**智能手表** 专业版",
        "~~原价199~~ ￥99",
        "⭐ 4.9 📦 已售5000 🔥 库存20",
        "【立即下单】",
      ].join("\n\n"),
    );
    expect(result.image).toContain('src="https://img/product.png"');
    expect(result.badge).toBe("爆款");
    expect(result.title).toBe("智能手表");
    expect(result.price).toBe("￥99");
    expect(result.button).toBe("立即下单");
  });

  it("brand-sign：品牌名 + slogan + style", () => {
    const result = parseComponentSlots(
      parser(),
      "brand-sign",
      "**我的品牌**\n\n让世界更好\n\nstyle=centered divider=true\n\n*© 2026*",
    );
    expect(result.brandName).toBe("我的品牌");
    expect(result.slogan).toBe("让世界更好");
    expect(result.style).toBe("centered");
    expect(result.divider).toBe("true");
    expect(result.subText).toBe("© 2026");
  });

  it("brand-sign：品牌名 + tagline（· 副标语义）", () => {
    const result = parseComponentSlots(
      parser(),
      "brand-sign",
      "**WeMD** · 让排版更优雅\n\n激发创造，丰富生活",
    );
    expect(result.brandName).toBe("WeMD");
    expect(result.tagline).toBe("让排版更优雅");
    expect(result.slogan).toBe("激发创造，丰富生活");
    expect(result.subText).toBeUndefined();
  });

  it("resource-list：结构化条目", () => {
    const result = parseComponentSlots(
      parser(),
      "resource-list",
      [
        "**学习资料**",
        "本系列推荐清单",
        "numbered=true",
        "- [file|1] Vue3 指南 |D=深入解析 |M=PDF |T=必读 |U=https://example.com",
        "- [link|2] 官方文档 |D=权威参考",
      ].join("\n"),
    );
    expect(result.title).toBe("学习资料");
    expect(result.subtitle).toBe("本系列推荐清单");
    expect(result.numbered).toBe("true");
    const items = result.items as Array<{ label: string; title: string }>;
    expect(items[0].label).toBe("01");
    expect(items[0].title).toContain("Vue3 指南");
    expect(items[0].title).toContain("href");
    expect(items[1].label).toBe("02");
  });

  it("testimonial-card：头像 + 引用 + 姓名", () => {
    const result = parseComponentSlots(
      parser(),
      "testimonial-card",
      [
        "![](https://img/avatar.png)",
        "> 坚持就是胜利",
        "> —— 2005年斯坦福演讲",
        "**乔布斯** 联合创始人",
        "苹果公司",
      ].join("\n\n"),
    );
    expect(result.avatar).toContain("avatar.png");
    expect(result.quote).toBe("坚持就是胜利");
    expect(result.source).toBe("2005年斯坦福演讲");
    expect(result.name).toBe("乔布斯");
    expect(result.title).toBe("联合创始人");
    expect(result.company).toBe("苹果公司");
  });

  it("series-nav：系列头 + 上一篇/下一篇 + 文章列表", () => {
    const result = parseComponentSlots(
      parser(),
      "series-nav",
      [
        "📚 **Vue3 从 0 到 1** （第 3 / 10 篇）",
        "本系列带你系统掌握 Vue3",
        "⬅️ 上一篇：**第2篇** — 响应式原理",
        "➡️ 下一篇：**第4篇** — 组件通信",
        "- [1] 开篇 |U=https://a.com",
        "- [2] 安装部署",
        "- [CURRENT] 响应式原理",
      ].join("\n"),
    );
    expect(result.seriesName).toBe(
      "Vue3 从 0 到 1 <small>第 3 / 10 篇</small>",
    );
    expect(result.current).toBe("3");
    expect(result.total).toBe("10");
    expect(result.description).toBe("本系列带你系统掌握 Vue3");
    expect(result.prevLabel).toBe("← 上一篇");
    expect(result.prevTitle).toBe("响应式原理");
    expect(result.nextLabel).toBe("下一篇 →");
    const items = result.items as Array<{
      cls: string;
      idx: string;
      title: string;
    }>;
    expect(items[0].cls).toBe("wemd-sn-item");
    expect(items[2].cls).toBe("wemd-sn-item current");
    expect(items[2].title).toBe("响应式原理");
  });

  it("series-nav：自然输入（中文数字篇号）保留标题、隐藏 idx 徽章", () => {
    const result = parseComponentSlots(
      parser(),
      "series-nav",
      [
        "设计系统从 0 到 1",
        "",
        "- 第一篇：为什么需要设计系统 ✓",
        "- 第二篇：色彩与排版基础 ✓",
        "- 第三篇：组件系统全览 ← 当前",
        "- 第四篇：主题包的构建与导出",
      ].join("\n"),
    );
    expect(result.seriesName).toBe(
      "设计系统从 0 到 1 <small>第 3 / 4 篇</small>",
    );
    expect(result.prevLabel).toBe("← 上一篇");
    expect(result.nextLabel).toBe("下一篇 →");
    const items = result.items as Array<{
      cls: string;
      idx: string;
      title: string;
      check: string;
      tag: string;
    }>;
    // 中文数字篇号正确解析为 1/2/3/4
    expect(items.map((a) => a.idx)).toEqual(["01", "02", "03", "04"]);
    // 标题保留原文（含「第X篇」），并标记 no-idx 避免双重编号
    expect(items[0].title).toBe("第一篇：为什么需要设计系统");
    expect(items[0].cls).toBe("wemd-sn-item done no-idx");
    expect(items[0].check).toContain("wemd-sn-item-check");
    // 当前篇：高亮 + 「当前」标签
    expect(items[2].cls).toBe("wemd-sn-item current no-idx");
    expect(items[2].title).toBe("第三篇：组件系统全览");
    expect(items[2].tag).toContain("当前");
  });
});

describe("templateFiller 填充", () => {
  it("替换 {{slot:key}} 占位符", () => {
    const html = fillTemplate(
      '<div class="wemd-qc-quote">{{slot:quote}}</div>',
      { quote: "金句" },
    );
    expect(html).toBe('<div class="wemd-qc-quote">金句</div>');
  });

  it("遍历 {{#each}} 并填充 {{this.field}}", () => {
    const template = [
      '<div class="wemd-sb-items">',
      "{{#each items}}",
      '<div class="wemd-sb-item">',
      "<span>{{this.value}}</span>",
      "<span>{{this.label}}</span>",
      "</div>",
      "{{/each}}",
      "</div>",
    ].join("");
    const html = fillTemplate(template, {
      items: [
        { value: "98%", label: "用户满意度" },
        { value: "1200", label: "日活用户" },
      ],
    });
    expect(html).toContain("98%");
    expect(html).toContain("日活用户");
    expect(html).toContain("1200");
    expect((html.match(/wemd-sb-item">/g) ?? []).length).toBe(2);
  });

  it("缺失数据输出空串，不抛错", () => {
    expect(fillTemplate("<div>{{slot:missing}}</div>", {})).toBe("<div></div>");
  });
});

describe("分槽 → 填充 组合", () => {
  it("quote-card 分槽结果直接喂给模板", () => {
    const result = parseComponentSlots(
      parser(),
      "quote-card",
      "这是金句内容\n\n署名：**鲁迅**",
    );
    const template = [
      '<section class="wemd-component wemd-quote-card">',
      '<div class="wemd-qc-quote">{{slot:quote}}</div>',
      '<div class="wemd-qc-author">{{slot:author}}</div>',
      "</section>",
    ].join("");
    const html = fillTemplate(template, result);
    expect(html).toContain("这是金句内容");
    expect(html).toContain("<strong>鲁迅</strong>");
  });

  it("stats-block 分槽数组喂给 {{#each}} 模板", () => {
    const result = parseComponentSlots(
      parser(),
      "stats-block",
      "- 98%\n  用户满意度\n- 1200\n  日活用户",
    );
    const template = [
      '<section class="wemd-component wemd-stats-block">',
      "{{#each items}}",
      "<div><span>{{this.value}}</span><span>{{this.label}}</span></div>",
      "{{/each}}",
      "</section>",
    ].join("");
    const html = fillTemplate(template, result);
    expect(html).toContain("98%");
    expect(html).toContain("日活用户");
  });

  it("styled-table：table slot 经 markdown 管线渲染成 <table>，而非原样塞入原始文本", () => {
    const result = parseComponentSlots(
      parser(),
      "styled-table",
      "| 左 | 右 |\n| --- | --- |\n| a | b |",
    );
    expect(result.table).toContain("<table>");
    expect(result.table).toContain("<th>");
    expect(result.table).toContain("<td>a</td>");
    expect(result.table).not.toContain("| 左 | 右 |");
  });

  it("table（原生组件）：block 内容渲染成 <table>", () => {
    const result = parseComponentSlots(
      parser(),
      "table",
      "| A | B |\n| --- | --- |\n| 1 | 2 |",
    );
    expect(result.table).toContain("<table>");
    expect(result.table).toContain("<td>1</td>");
  });
});
