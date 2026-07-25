import "@testing-library/jest-dom";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// 每次测试后清理 DOM
afterEach(() => {
  cleanup();
});
