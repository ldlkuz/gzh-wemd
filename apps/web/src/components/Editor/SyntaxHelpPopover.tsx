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
          <button className="syntax-help-docs-link" onClick={openDocs}>
            <span>查看完整文档</span>
            <ExternalLink size={12} />
          </button>
        </div>
      )}
    </div>
  );
}
