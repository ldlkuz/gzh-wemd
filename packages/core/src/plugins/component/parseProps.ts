/**
 * 组件 props 解析
 * 解析 `author="张三" role="设计师" variant="apple"` 格式的 props 字符串
 *
 * 支持的值格式：
 * - key="value"  双引号
 * - key='value'  单引号
 * - key=value    裸值（不含空格、引号、特殊字符）
 * - key          布尔简写，等价于 key="true"
 *
 * 不支持：
 * - 嵌套对象/数组（保持简单，复杂 props 由 AI 通过 JSON 传）
 * - 转义引号（公众号场景用不到）
 */

export interface ComponentProps {
  [key: string]: string | boolean;
}

/**
 * 解析 props 字符串为对象
 * 输入：`author="张三" role='设计师' variant=apple featured`
 * 输出：{ author: "张三", role: "设计师", variant: "apple", featured: true }
 */
export function parseComponentProps(raw: string): ComponentProps {
  const props: ComponentProps = {};
  if (!raw || !raw.trim()) return props;

  // 匹配三种形式：key="v" | key='v' | key=v | key
  // key 允许：字母、数字、连字符
  const pattern =
    /([a-zA-Z][a-zA-Z0-9-]*)(?:(=)("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|[^\s]+))?/g;

  let match: RegExpExecArray | null;
  while ((match = pattern.exec(raw)) !== null) {
    const [, key, eq, value] = match;
    if (!eq) {
      // 布尔简写：key 等价于 key="true"
      props[key] = true;
      continue;
    }
    if (!value) continue;

    // 去除引号
    let v = value;
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
      // 简单反转义 \" 和 \'
      v = v.replace(/\\(["'])/g, "$1");
    }
    props[key] = v;
  }

  return props;
}

/**
 * 把 props 对象序列化为 markdown 语法字符串
 * 用于 AI 生成组件语法或编辑器插入组件时构造语法
 *
 * { author: "张三", featured: true } → `author="张三" featured`
 */
export function stringifyComponentProps(props: ComponentProps): string {
  return Object.entries(props)
    .map(([key, value]) => {
      if (value === true) return key;
      if (value === false) return "";
      // 值含空格或特殊字符则加引号
      const v = String(value);
      if (/[\s"'=]/.test(v)) {
        // 转义内部双引号
        const escaped = v.replace(/"/g, '\\"');
        return `${key}="${escaped}"`;
      }
      return `${key}=${v}`;
    })
    .filter(Boolean)
    .join(" ");
}
