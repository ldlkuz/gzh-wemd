/**
 * ComponentRegistry —— 统一的组件注册中心
 *
 * 管理所有组件的 manifest + CSS，支持：
 * - 注册/注销组件包
 * - CSS 拼接输出（保持与旧版组件样式文件一致的顺序）
 * - 按语义查询组件（Phase 2+）
 */
import type { ComponentPackage, ComponentVariant } from "./types";

export interface ComponentRegistry {
  /** 注册一个组件包 */
  register(pkg: ComponentPackage): void;
  /** 注销 */
  unregister(type: string, variant: string): void;
  /** 获取某个类型的所有变体 */
  getVariants(type: string): ComponentVariant[];
  /** 获取所有已注册的类型 */
  getTypes(): string[];
  /** 获取默认变体 */
  getDefaultVariant(type: string): ComponentVariant | undefined;
  /** 获取所有组件 CSS（拼接后注入页面） */
  getAllCss(): string;
  /** 为 AI 生成组件描述（Phase 2 使用） */
  describeForAi(): string;
}

/**
 * 创建 ComponentRegistry 实例
 *
 * CSS 文件按注册顺序拼接，需保持与旧版一致：
 * default → extra → faq → magazine
 */
export function createComponentRegistry(): ComponentRegistry {
  const packages = new Map<string, ComponentPackage>();
  const order: string[] = [];

  function key(type: string, variant: string): string {
    return `${type}:${variant}`;
  }

  const registry: ComponentRegistry = {
    register(pkg: ComponentPackage): void {
      const k = key(pkg.manifest.type, pkg.manifest.variant);
      // 同名组件覆盖注册（更新场景）
      packages.set(k, pkg);
      if (!order.includes(k)) {
        order.push(k);
      }
    },

    unregister(type: string, variant: string): void {
      const k = key(type, variant);
      packages.delete(k);
      const idx = order.indexOf(k);
      if (idx >= 0) {
        order.splice(idx, 1);
      }
    },

    getVariants(type: string): ComponentVariant[] {
      const result: ComponentVariant[] = [];
      for (const k of order) {
        const pkg = packages.get(k);
        if (!pkg || pkg.manifest.type !== type) continue;
        result.push({
          type: pkg.manifest.type,
          variant: pkg.manifest.variant,
          label: pkg.manifest.label,
          description: pkg.manifest.description,
          category: pkg.manifest.category,
          semantic: pkg.manifest.semantic,
          intent: pkg.manifest.intent,
          tags: pkg.manifest.tags ?? [],
          tone: pkg.manifest.tone ?? [],
          author: pkg.manifest.author,
        });
      }
      return result;
    },

    getTypes(): string[] {
      const types = new Set<string>();
      for (const k of order) {
        const pkg = packages.get(k);
        if (pkg) types.add(pkg.manifest.type);
      }
      return Array.from(types);
    },

    getDefaultVariant(type: string): ComponentVariant | undefined {
      // "default" variant 优先，否则取第一个注册的
      const variants = registry.getVariants(type);
      return variants.find((v) => v.variant === "default") ?? variants[0];
    },

    getAllCss(): string {
      const cssParts: string[] = [];
      for (const k of order) {
        const pkg = packages.get(k);
        if (pkg && pkg.css.trim()) {
          cssParts.push(pkg.css.trim());
        }
      }
      return cssParts.join("\n");
    },

    describeForAi(): string {
      const lines: string[] = [];
      const types = registry.getTypes();
      for (const type of types) {
        const variants = registry.getVariants(type);
        if (variants.length === 0) continue;
        const variantDescs = variants.map(
          (v) => `    - ${v.variant}: ${v.description}`,
        );
        lines.push(`- ${type} (${variants.length} 个变体):`, ...variantDescs);
      }
      return lines.join("\n");
    },
  };

  return registry;
}
