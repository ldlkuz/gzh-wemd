import { useRef, useState, useEffect } from "react";
import { HelpCircle, ExternalLink } from "lucide-react";
import "./SyntaxHelpPopover.css";

// 语法速查数据
const syntaxItems = [
  { syntax: "**文字**", desc: "粗体" },
  { syntax: "*文字*", desc: "斜体" },
  { syntax: "++文字++", desc: "下划线" },
  { syntax: "~~文字~~", desc: "删除线" },
  { syntax: "==文字==", desc: "高亮" },
  { syntax: "$公式$", desc: "行内公式" },
  { syntax: "`代码`", desc: "行内代码" },
  { syntax: "H~2~O", desc: "下标" },
  { syntax: "X^2^", desc: "上标" },
  { syntax: "> [!NOTE]", desc: "提示块" },
  { syntax: "- [ ] 任务", desc: "任务列表" },
  { syntax: "{.class #id}", desc: "块级属性" },
  { syntax: "**文字**{.class}", desc: "行内/图片属性" },
];

// 组件语法速查
const componentItems = [
  {
    syntax: '::: quote-card{author="作者"}\n金句内容\n:::',
    desc: "金句卡片",
  },
  { syntax: "::: divider-fancy\n:::", desc: "装饰分割线" },
  {
    syntax: "::: cta-card\n引导文案\n:::",
    desc: "关注引导卡片",
  },
  {
    syntax: '::: callout-pro{type="info"}\n**标题**\n正文\n:::',
    desc: "强化提示框（info/success/warning/danger/tip）",
  },
  {
    syntax: '::: code-frame{lang="js" title="标题"}\n```js\ncode\n```\n:::',
    desc: "代码框（带标题）",
  },
  {
    syntax: "::: stats-block\n标题\n- 项 **数值**\n:::",
    desc: "数据统计块",
  },
  {
    syntax: "::: image-grid\n标题\n- ![](url)\n:::",
    desc: "图片网格（2 列）",
  },
  {
    syntax: "::: author-card\n![](头像)\n**姓名** *角色*\n简介\n:::",
    desc: "作者卡片",
  },
  {
    syntax: "::: timeline\n标题\n- **节点** 描述\n:::",
    desc: "时间线（带圆点竖线）",
  },
  {
    syntax: '::: faq{title="常见问题"}\n**问题一**\n回答内容\n:::',
    desc: "FAQ 问答卡片",
  },
];

export function SyntaxHelpPopover() {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const openDocs = () => {
    window.open(
      "https://wemd.app/docs/reference/markdown-syntax",
      "_blank",
      "noopener,noreferrer",
    );
    setIsOpen(false);
  };

  return (
    <div className="md-toolbar-dropdown-container" ref={containerRef}>
      <button
        className={`md-toolbar-btn ${isOpen ? "active" : ""}`}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="语法帮助"
        data-tooltip="语法帮助"
      >
        <HelpCircle size={16} />
      </button>

      {isOpen && (
        <div className="syntax-help-popover">
          <div className="syntax-help-header">Markdown 语法速查</div>
          <div className="syntax-help-list">
            {syntaxItems.map((item, idx) => (
              <div key={idx} className="syntax-help-row">
                <code>{item.syntax}</code>
                <span>{item.desc}</span>
              </div>
            ))}
          </div>
          <div className="syntax-help-header">公众号组件语法</div>
          <div className="syntax-help-list">
            {componentItems.map((item, idx) => (
              <div
                key={idx}
                className="syntax-help-row syntax-help-row-component"
              >
                <code>{item.syntax}</code>
                <span>{item.desc}</span>
              </div>
            ))}
          </div>
          <button className="syntax-help-docs-link" onClick={openDocs}>
            <span>查看完整文档</span>
            <ExternalLink size={12} />
          </button>
        </div>
      )}
    </div>
  );
}
