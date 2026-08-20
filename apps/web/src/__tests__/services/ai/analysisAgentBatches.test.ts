/**
 * analysisAgent 阶段2 分批填充（全局决策 + 分批）单元测试
 */
import { describe, it, expect } from "vitest";
import {
  splitParagraphs,
  convertBatchAnchors,
  buildExecuteBatches,
  type PlanResult,
} from "../../../services/ai/analysisAgent";

const TUTORIAL_PLAN: PlanResult = {
  type: "tutorial",
  reason: "测试",
  confidence: 0.9,
  slotPlan: [
    { component: "toc-nav", section: "head", count: 1 },
    { component: "callout-pro", section: "body", count: 2 },
    { component: "share-card", section: "tail", count: 1 },
  ],
};

describe("splitParagraphs 段落切分", () => {
  it("按空行切分、去首尾空白、忽略空块", () => {
    const md = "第一段\n\n\n第二段\n  第三行\n\n\n\n第四段\n\n";
    expect(splitParagraphs(md)).toEqual([
      "第一段",
      "第二段\n  第三行",
      "第四段",
    ]);
  });

  it("CRLF（\\r\\n）换行也能正确切分（Windows 编辑器的 md 常见）", () => {
    const md = "第一段\r\n\r\n第二段\r\n\r\n\r\n第三段\r\n";
    expect(splitParagraphs(md)).toEqual(["第一段", "第二段", "第三段"]);
  });
});

describe("convertBatchAnchors 位置换算", () => {
  it("段后:j 换算为全局段索引，文首/文末不变", () => {
    const ins = [
      { at: "段后:2", component: "quote-card", props: {}, body: "x", reason: "r" },
      { at: "文首", component: "toc-nav", props: {}, body: "y", reason: "r" },
      { at: "文末", component: "share-card", props: {}, body: "z", reason: "r" },
    ];
    const out = convertBatchAnchors(ins, 5);
    expect(out[0].at).toBe("段后:6");
    expect(out[1].at).toBe("文首");
    expect(out[2].at).toBe("文末");
  });
});

describe("buildExecuteBatches 分批", () => {
  it("短文（≤6 段）退回单批全文", () => {
    const paras = ["a", "b", "c", "d", "e"];
    const batches = buildExecuteBatches(TUTORIAL_PLAN, paras);
    expect(batches).toHaveLength(1);
    expect(batches[0].full).toBe(true);
    expect(batches[0].startPara).toBe(1);
    expect(batches[0].excerpt).toBe("a\n\nb\n\nc\n\nd\n\ne");
    // 全部槽位按 slotPlan 顺序展开
    expect(batches[0].slots.map((s) => s.slot.component)).toEqual([
      "toc-nav",
      "callout-pro",
      "callout-pro",
      "share-card",
    ]);
  });

  it("长文分 3 批，各自片段与起始段正确", () => {
    const paras = ["p1", "p2", "p3", "p4", "p5", "p6", "p7", "p8", "p9"];
    const batches = buildExecuteBatches(TUTORIAL_PLAN, paras);
    expect(batches).toHaveLength(3);
    expect(batches[0].startPara).toBe(1);
    expect(batches[0].excerpt).toBe("p1\n\np2\n\np3");
    expect(batches[1].startPara).toBe(4);
    expect(batches[1].excerpt).toBe("p4\n\np5\n\np6");
    expect(batches[2].startPara).toBe(7);
    expect(batches[2].excerpt).toBe("p7\n\np8\n\np9");
    // 批次内槽位归属正确
    expect(batches[0].slots[0].slot.component).toBe("toc-nav");
    expect(batches[1].slots.map((s) => s.slot.component)).toEqual([
      "callout-pro",
      "callout-pro",
    ]);
    expect(batches[2].slots[0].slot.component).toBe("share-card");
  });

  it("某区段无槽位时跳过该批", () => {
    const plan: PlanResult = {
      ...TUTORIAL_PLAN,
      slotPlan: [
        { component: "toc-nav", section: "head", count: 1 },
        { component: "share-card", section: "tail", count: 1 },
      ],
    };
    const paras = ["p1", "p2", "p3", "p4", "p5", "p6", "p7", "p8", "p9"];
    const batches = buildExecuteBatches(plan, paras);
    expect(batches).toHaveLength(2);
    expect(batches.map((b) => b.startPara)).toEqual([1, 7]);
  });
});
