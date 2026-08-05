// ============================================================
// 工具函数
// ============================================================

import { randomBytes } from "node:crypto";

// ── ULID 风格的 ID 生成器（短、有序、可排序） ──
// 格式: 时间戳(10位) + 随机(16位)
export function ulid(): string {
  const timestamp = Date.now().toString(36).padStart(8, "0");
  const random = randomBytes(8)
    .toString("hex")
    .slice(0, 10);
  return `${timestamp}${random}`;
}

// ── 格式化时间 ──
export function formatTime(isoString: string): string {
  const d = new Date(isoString);
  return d.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

// ── 进度条 ──
export function progressBar(current: number, total: number, label = ""): string {
  const width = 20;
  const filled = Math.round((current / total) * width);
  const bar = "█".repeat(filled) + "░".repeat(width - filled);
  const pct = Math.round((current / total) * 100);
  return `${bar} ${pct}% ${label}`;
}

// ── 带颜色的控制台输出 ──
export const colors = {
  green: (s: string) => `\x1b[32m${s}\x1b[0m`,
  yellow: (s: string) => `\x1b[33m${s}\x1b[0m`,
  red: (s: string) => `\x1b[31m${s}\x1b[0m`,
  cyan: (s: string) => `\x1b[36m${s}\x1b[0m`,
  dim: (s: string) => `\x1b[2m${s}\x1b[0m`,
  bold: (s: string) => `\x1b[1m${s}\x1b[0m`,
};