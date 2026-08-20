/**
 * analysisAgent 组件分类（内容驱动 / 位置驱动）不变量测试
 *
 * 防止未来新增 AVAILABLE_COMPONENTS 时漏分类：
 * - UI 勾选清单按两组渲染，漏分类会导致组件无法被用户勾选
 * - AI prompt 按两组给处理策略，漏分类会导致组件无分类指令
 */
import { describe, it, expect } from "vitest";
import {
  AVAILABLE_COMPONENTS,
  CONTENT_DRIVEN_COMPONENTS,
  POSITION_DRIVEN_COMPONENTS,
} from "../../../services/ai/analysisAgent";

describe("组件分类（内容驱动 / 位置驱动）", () => {
  it("两组并集恰好覆盖 AVAILABLE_COMPONENTS，无遗漏无重叠", () => {
    const available = new Set<string>([...AVAILABLE_COMPONENTS]);
    const union = new Set<string>([
      ...CONTENT_DRIVEN_COMPONENTS,
      ...POSITION_DRIVEN_COMPONENTS,
    ]);
    expect(union.size).toBe(available.size);
    for (const id of available) {
      expect(union.has(id), `${id} 未分类`).toBe(true);
    }
  });

  it("两组均非空", () => {
    expect(CONTENT_DRIVEN_COMPONENTS.length).toBeGreaterThan(0);
    expect(POSITION_DRIVEN_COMPONENTS.length).toBeGreaterThan(0);
  });
});
