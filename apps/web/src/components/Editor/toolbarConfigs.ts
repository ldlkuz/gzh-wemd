import {
  Activity,
  Binary,
  Bold,
  Calendar,
  Clock,
  Code,
  Database,
  GitGraph,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Italic,
  Link,
  List,
  ListOrdered,
  Minus,
  Network,
  PieChart,
  Quote,
  Route,
  Strikethrough,
  Underline,
  Workflow,
  type LucideIcon,
} from "lucide-react";

export interface ToolbarInsertTool {
  icon: LucideIcon;
  label: string;
  prefix: string;
  suffix: string;
  placeholder: string;
}

export interface MermaidTemplate {
  icon: LucideIcon;
  label: string;
  code: string;
}

export const mermaidPrimaryTemplates: MermaidTemplate[] = [
  {
    icon: Workflow,
    label: "流程图",
    code: `graph TD
    A[开始] --> B{判断}
    B -- 是 --> C[执行操作]
    B -- 否 --> D[结束]
    C --> D`,
  },
  {
    icon: Clock,
    label: "时序图",
    code: `sequenceDiagram
    participant Alice
    participant Bob
    Alice->>Bob: Hello Bob, how are you?
    Bob-->>Alice: I am good thanks!
    Bob->>John: Hello John!`,
  },
  {
    icon: Network,
    label: "类图",
    code: `classDiagram
    class Animal {
        +String name
        +void eat()
    }
    class Duck {
        +void swim()
    }
    Animal <|-- Duck`,
  },
  {
    icon: GitGraph,
    label: "甘特图",
    code: `gantt
    title 项目开发计划
    dateFormat  YYYY-MM-DD
    section 设计
    需求分析       :a1, 2024-01-01, 3d
    原型设计       :after a1, 5d
    section 开发
    前端开发       :2024-01-10, 10d
    后端开发       :2024-01-10, 10d`,
  },
  {
    icon: Binary,
    label: "思维导图",
    code: `mindmap
  root((思维导图))
    主题一
      子节点 A
      子节点 B
    主题二
      子节点 C`,
  },
  {
    icon: PieChart,
    label: "饼图",
    code: `pie title 市场份额
    "产品 A" : 40
    "产品 B" : 30
    "产品 C" : 20
    "其他" : 10`,
  },
];

export const mermaidMoreTemplates: MermaidTemplate[] = [
  {
    icon: Activity,
    label: "状态图",
    code: `stateDiagram-v2
    [*] --> 空闲
    空闲 --> 处理中: 触发
    处理中 --> 完成: 成功
    处理中 --> 失败: 异常
    失败 --> 空闲
    完成 --> [*]`,
  },
  {
    icon: Database,
    label: "ER 图",
    code: `erDiagram
    USER ||--o{ ORDER : places
    USER {
        int id
        string name
    }
    ORDER {
        int id
        string status
    }`,
  },
  {
    icon: Calendar,
    label: "时间线",
    code: `timeline
    title 项目里程碑
    2024-01-01 : 立项
    2024-02-15 : 原型完成
    2024-03-20 : 开发完成
    2024-04-01 : 上线`,
  },
  {
    icon: Route,
    label: "用户旅程",
    code: `journey
    title 用户旅程
    section 认知
      了解产品: 5: 用户
    section 转化
      试用: 4: 用户
      购买: 3: 用户`,
  },
];

export const textFormatTools: ToolbarInsertTool[] = [
  {
    icon: Bold,
    label: "粗体",
    prefix: "**",
    suffix: "**",
    placeholder: "粗体文字",
  },
  {
    icon: Italic,
    label: "斜体",
    prefix: "*",
    suffix: "*",
    placeholder: "斜体文字",
  },
  {
    icon: Underline,
    label: "下划线",
    prefix: "++",
    suffix: "++",
    placeholder: "下划线文字",
  },
  {
    icon: Strikethrough,
    label: "删除线",
    prefix: "~~",
    suffix: "~~",
    placeholder: "删除文字",
  },
];

export const headingOptions: ToolbarInsertTool[] = [
  {
    icon: Heading1,
    label: "一级标题",
    prefix: "# ",
    suffix: "",
    placeholder: "标题",
  },
  {
    icon: Heading2,
    label: "二级标题",
    prefix: "## ",
    suffix: "",
    placeholder: "标题",
  },
  {
    icon: Heading3,
    label: "三级标题",
    prefix: "### ",
    suffix: "",
    placeholder: "标题",
  },
  {
    icon: Heading4,
    label: "四级标题",
    prefix: "#### ",
    suffix: "",
    placeholder: "标题",
  },
];

export const listOptions: ToolbarInsertTool[] = [
  {
    icon: List,
    label: "无序列表",
    prefix: "- ",
    suffix: "",
    placeholder: "列表项",
  },
  {
    icon: ListOrdered,
    label: "有序列表",
    prefix: "1. ",
    suffix: "",
    placeholder: "列表项",
  },
];

export const blockTools: ToolbarInsertTool[] = [
  {
    icon: Quote,
    label: "引用",
    prefix: "> ",
    suffix: "",
    placeholder: "引用文字",
  },
  {
    icon: Code,
    label: "代码块",
    prefix: "```\n",
    suffix: "\n```",
    placeholder: "代码",
  },
  {
    icon: Link,
    label: "链接",
    prefix: "[",
    suffix: "](url)",
    placeholder: "链接文字",
  },
  {
    icon: Minus,
    label: "分割线",
    prefix: "\n---\n",
    suffix: "",
    placeholder: "",
  },
];
