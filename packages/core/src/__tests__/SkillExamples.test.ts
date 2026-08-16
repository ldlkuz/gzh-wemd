import { describe, it, expect } from "vitest";
import { validateThemePackageManifest } from "../theme-registry/ThemeValidator";
import fs from "fs";
import path from "path";

describe("Skill 示例主题校验", () => {
  const examplesDir = path.resolve(
    __dirname,
    "..",
    "..",
    "..",
    "..",
    "sandbox",
    "bytedance-tech",
    "bytedance-tech-extracted",
  );
  it("bytedance-tech 主题应通过校验", () => {
    const manifest = JSON.parse(
      fs.readFileSync(path.join(examplesDir, "manifest.json"), "utf-8"),
    );
    const result = validateThemePackageManifest(manifest);
    const errs = (result.errors ?? []).filter((e) => e.severity !== "warning");
    expect(
      errs,
      `bytedance-tech 存在错误: ${JSON.stringify(errs, null, 2)}`,
    ).toHaveLength(0);
  });
});
