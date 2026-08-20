// @vitest-environment happy-dom
/**
 * 主题级扩展槽机制测试：
 * - mergeSlotOverrides：合并行为（追加 / key 冲突以主题为准）
 * - parseComponentSlots：主题扩展槽从 body 提取额外内容
 * - 端到端：主题骨架用 {{slot:image}} 消费扩展槽；不支持扩展槽时内容降级 leftover body 不丢
 */
import { describe, expect, it } from "vitest";
import type MarkdownIt from "markdown-it";
import { createMarkdownParser } from "../MarkdownParser";
import { getBuiltinSlotDef } from "../plugins/component/slotDefs";
import {
  parseComponentSlots,
  mergeSlotOverrides,
} from "../plugins/component/slotParsers";
import type { SlotDef } from "../plugins/component/slotTypes";
import {
  getThemeSlotDefs,
} from "../theme-renderer/index";

/** 构造一个带 image 扩展槽的 magazine-cover 主题（模拟"无声发布"封面图） */
const coverImageOverride: SlotDef = {
  key: "image",
  type: "image",
  semantic: "封面图（主题扩展槽）",
  input: { source: "image", position: "first", cardinality: "optional" },
};

const coverTemplate = [
  '<section class="wemd-component wemd-magazine-cover" data-component="magazine-cover">',
  '<section class="wemd-sk-cover">',
  '<section class="wemd-sk-title">{{slot:title}}</section>',
  '{{#if image}}<section class="wemd-sk-cover-img">{{slot:image}}</section>{{/if}}',
  "</section>",
  "</section>",
].join("\n");

function parserWithTheme(
  theme: { templates: Record<string, string>; slotDefs: Record<string, SlotDef[]> },
): MarkdownIt {
  return createMarkdownParser({
    getTemplate: (id) => theme.templates[id],
    getSlotDefs: (id) => theme.slotDefs[id],
  });
}

describe("mergeSlotOverrides 扩展槽合并", () => {
  it("无扩展槽时原样返回共享 def", () => {
    const base = getBuiltinSlotDef("magazine-cover")!;
    expect(mergeSlotOverrides(base, undefined)).toBe(base);
    expect(mergeSlotOverrides(base, [])).toBe(base);
  });

  it("追加主题扩展槽", () => {
    const base = getBuiltinSlotDef("magazine-cover")!;
    const merged = mergeSlotOverrides(base, [coverImageOverride]);
    expect(merged.slots.map((s) => s.key)).toContain("image");
    // 共享槽仍保留
    expect(merged.slots.map((s) => s.key)).toContain("title");
    expect(merged.slots.length).toBe(base.slots.length + 1);
  });

  it("key 冲突时以主题扩展为准", () => {
    const base = getBuiltinSlotDef("magazine-cover")!;
    const override: SlotDef = {
      key: "title",
      type: "text",
      semantic: "主题自定义标题语义",
      input: { source: "paragraph", position: "any", cardinality: "one" },
    };
    const merged = mergeSlotOverrides(base, [override]);
    const title = merged.slots.find((s) => s.key === "title")!;
    expect(title.semantic).toBe("主题自定义标题语义");
    expect(title.input?.source).toBe("paragraph");
  });
});

describe("主题扩展槽解析", () => {
  it("magazine-cover 带 image 扩展槽：body 首图进 image 槽", () => {
    const parser = parserWithTheme({
      templates: { "magazine-cover": coverTemplate },
      slotDefs: { "magazine-cover": [coverImageOverride] },
    });
    const result = parseComponentSlots(
      parser,
      "magazine-cover",
      "**星弦 ONE**\n\n把声音，还给夜晚\n\n![](https://img.example.com/cover.jpg)",
      [coverImageOverride],
    );
    expect(result.image).toContain('src="https://img.example.com/cover.jpg"');
    expect(result.title).toContain("星弦 ONE");
    // 图片被消费，不再进 desc/body 兜底
    const rest = `${result.desc ?? ""}${result.body ?? ""}`;
    expect(rest).not.toContain("cover.jpg");
  });

  it("不带扩展槽：图片被共享 desc 槽消费，内容不丢", () => {
    const parser = parserWithTheme({
      templates: { "magazine-cover": coverTemplate },
      slotDefs: {},
    });
    const result = parseComponentSlots(
      parser,
      "magazine-cover",
      "**星弦 ONE**\n\n把声音，还给夜晚\n\n![](https://img.example.com/cover.jpg)",
    );
    expect(result.image).toBeUndefined();
    // 内容降级进 desc / body 兜底（数据不丢）
    const rest = `${result.desc ?? ""}${result.body ?? ""}`;
    expect(rest).toContain('src="https://img.example.com/cover.jpg"');
  });
});

describe("端到端：主题扩展槽落地", () => {
  it("主题骨架用 {{slot:image}} 渲染封面图", () => {
    const theme = {
      templates: { "magazine-cover": coverTemplate },
      slotDefs: { "magazine-cover": [coverImageOverride] },
    };
    const parser = parserWithTheme(theme);
    const out = parser.render(
      "::: magazine-cover\n**星弦 ONE**\n\n把声音，还给夜晚\n\n![](https://img.example.com/cover.jpg)\n:::",
    );
    expect(out).toContain('class="wemd-sk-cover-img"');
    expect(out).toContain('src="https://img.example.com/cover.jpg"');
    expect(out).toContain("星弦 ONE");
  });

  it("不支持扩展槽的主题（默认主题）：封面图降级不报错", () => {
    const parser = createMarkdownParser({
      getTemplate: (id) => (id === "magazine-cover" ? coverTemplate : undefined),
      getSlotDefs: () => undefined,
    });
    const out = parser.render(
      "::: magazine-cover\n**星弦 ONE**\n\n把声音，还给夜晚\n\n![](https://img.example.com/cover.jpg)\n:::",
    );
    // 骨架没有 image 槽 → 不渲染封面图容器；正文兜底不崩溃
    expect(out).not.toContain('class="wemd-sk-cover-img"');
    expect(out).toContain("星弦 ONE");
  });

  it("getThemeSlotDefs 从主题定义提取扩展槽", () => {
    const themeDefinition = {
      templates: { "magazine-cover": coverTemplate },
      slotDefs: { "magazine-cover": [coverImageOverride] },
    } as never;
    const map = getThemeSlotDefs(themeDefinition as never);
    expect(map.get("magazine-cover")).toHaveLength(1);
    expect(map.get("magazine-cover")![0].key).toBe("image");
  });
});
