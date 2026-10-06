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
  const manifestPath = path.join(examplesDir, "manifest.json");

  // 依赖本机 sandbox/ 下的主题包 fixture（sandbox/ 不入库），CI 上缺失时跳过
  it.skipIf(!fs.existsSync(manifestPath))(
    "bytedance-tech 主题应通过校验",
    () => {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
      const result = validateThemePackageManifest(manifest);
      const errs = (result.errors ?? []).filter(
        (e) => e.severity !== "warning",
      );
      expect(
        errs,
        `bytedance-tech 存在错误: ${JSON.stringify(errs, null, 2)}`,
      ).toHaveLength(0);
    },
  );
});
