/**
 * 组件系统入口
 *
 * 导出全局 ComponentRegistry 单例 + 初始化函数。
 * 取代旧的 4 个 CSS 文件手动拼接方式。
 */
import {
  createComponentRegistry,
  type ComponentRegistry,
} from "./registry/ComponentRegistry";
import { registerBuiltInComponents } from "./builtin/index";
import { VARIANT_CSS_MAP } from "./variants/variantCss";

let _registry: ComponentRegistry | null = null;

/** 获取 ComponentRegistry 单例（惰性初始化） */
export function getComponentRegistry(): ComponentRegistry {
  if (!_registry) {
    _registry = createComponentRegistry();
    registerBuiltInComponents(_registry);
  }
  return _registry;
}

/**
 * 重置 Registry（仅测试用）
 */
export function resetComponentRegistry(): void {
  _registry = null;
}

/**
 * 获取所有组件 CSS。
 *
 * 输出与旧版拼接（componentStylesDefault + Extra + Faq + Magazine）完全一致，
 * 因 builtin/index.ts 按 default→extra→faq→magazine 顺序注册。
 */
export function getComponentCss(): string {
  return getComponentRegistry().getAllCss();
}

/** 获取所有变体 CSS（拼接后注入页面/ThemeProcessor） */
export function getVariantCss(): string {
  const parts: string[] = [];
  for (const variants of Object.values(VARIANT_CSS_MAP)) {
    for (const css of Object.values(variants)) {
      parts.push(css);
    }
  }
  return parts.join("\n");
}

export { type ComponentRegistry } from "./registry/ComponentRegistry";
export type {
  ComponentManifest,
  ComponentPackage,
  ComponentVariant,
} from "./registry/types";
