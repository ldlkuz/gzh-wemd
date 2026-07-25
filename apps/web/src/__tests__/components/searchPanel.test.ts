import { describe, it, expect } from "vitest";
import { findMatches } from "../../utils/findMatches";

describe("findMatches", () => {
  const doc = "Hello World hello HELLO world";

  it("finds all case-insensitive string matches", () => {
    const result = findMatches(doc, "hello", false, false);
    expect(result).toEqual([
      { from: 0, to: 5 },
      { from: 12, to: 17 },
      { from: 18, to: 23 },
    ]);
  });

  it("finds only case-sensitive string matches", () => {
    const result = findMatches(doc, "hello", true, false);
    expect(result).toEqual([{ from: 12, to: 17 }]);
  });

  it("finds case-insensitive regex matches", () => {
    const result = findMatches(doc, "hello", false, true);
    expect(result).toEqual([
      { from: 0, to: 5 },
      { from: 12, to: 17 },
      { from: 18, to: 23 },
    ]);
  });

  it("finds case-sensitive regex matches", () => {
    const result = findMatches(doc, "HELLO", true, true);
    expect(result).toEqual([{ from: 18, to: 23 }]);
  });

  it("returns empty array for no matches", () => {
    expect(findMatches(doc, "xyz", false, false)).toEqual([]);
  });

  it("handles invalid regex gracefully", () => {
    expect(findMatches(doc, "[invalid", false, true)).toEqual([]);
  });

  it("finds overlapping-adjacent matches correctly", () => {
    const result = findMatches("aaa", "aa", false, false);
    // indexOf advances by searchText.length, so only one match
    expect(result).toEqual([{ from: 0, to: 2 }]);
  });

  it("caps results at 10000 matches", () => {
    const bigDoc = "a".repeat(20000);
    const result = findMatches(bigDoc, "a", false, false);
    expect(result).toHaveLength(10000);
  });

  it("caps regex results at 10000 matches", () => {
    const bigDoc = "a".repeat(20000);
    const result = findMatches(bigDoc, "a", false, true);
    expect(result).toHaveLength(10000);
  });

  it("handles regex with special characters", () => {
    const specialDoc = "price is $100.00 and $200.00";
    const result = findMatches(specialDoc, "\\$\\d+\\.\\d+", false, true);
    expect(result).toEqual([
      { from: 9, to: 16 },
      { from: 21, to: 28 },
    ]);
  });

  it("finds matches for word boundary in regex mode", () => {
    const result = findMatches("cat catch catalog", "\\bcat\\b", false, true);
    expect(result).toEqual([{ from: 0, to: 3 }]);
  });
});
