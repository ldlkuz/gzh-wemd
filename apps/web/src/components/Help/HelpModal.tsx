import { useState } from "react";
import "./HelpModal.css";

interface HelpItem {
  title: string;
  body: string;
}

const HELP_SECTIONS: { title: string; items: HelpItem[] }[] = [
  {
    title: "准备工作",
    items: [
      {
        title: "安装插件（推荐）",
        body: "WeMD 依赖 Markdown 插件扩展语法，其中「HTML 插入」等能力不装插件无法使用，因此建议安装。桌面版左下角有「打开插件目录」「查看插件安装说明」两个按钮，按说明安装即可。",
      },
      {
        title: "配置 AI 模型",
        body: "AI 排版需要先接入模型。点顶部「AI 设置」，填入 OpenAI 兼容的 Base URL 与密钥，保存后可测试连通。配置只存本地，不上传。未配置时不影响手动排版和复制，仅 AI 改写功能不可用。",
      },
      {
        title: "启动渲染API（桌面版）",
        body: "渲染API 是给其他 Skill / Agent 对接用的：它在本机起一个 HTTP 接口，让别的 AI 助手（Skill、Agent、脚本）能传 Markdown 进来、拿回排版好的微信 HTML。点工具栏「渲染API」启动（状态点变绿）即可被调用；浏览器版因无 Node 进程无法提供此接口。",
      },
    ],
  },
  {
    title: "基础操作",
    items: [
      {
        title: "写文章",
        body: "在左侧用 Markdown 写正文。用 # 标题、> 引用、| 表格 |、代码块、![](图片) 等通用语法，系统自动适配成微信兼容样式，无需额外动作。",
      },
      {
        title: "选主题",
        body: "点顶部「主题管理」，在右侧面板挑一套主题。每个主题是完整视觉风格（颜色、字体、组件形态都不同），随时可切换。",
      },
      {
        title: "预览与编辑",
        body: "右侧为实时预览，随输入更新。需要图、表格、步骤等结构时，用编辑器工具栏的插入入口，或手写对应组件语法。",
      },
    ],
  },
  {
    title: "AI 排版",
    items: [
      {
        title: "一键改写排版",
        body: "配置好 AI 模型后，点顶部「AI 设置」→ 用改写/导读功能，AI 会按当前主题的组件手册把文章重排成主题化、更适合公众号阅读的成稿。",
      },
      {
        title: "组件语法",
        body: "需要步骤、时间线、数据表、金句卡等专用结构时，用 ::: 组件名 包裹（具体示例见手册）。原生 Markdown 全自动适配，无需专用语法。",
      },
    ],
  },
  {
    title: "导出到公众号",
    items: [
      {
        title: "复制为 HTML",
        body: "点工具栏「复制 HTML」得到微信安全的内联样式 HTML，可粘进支持 HTML 的编辑器或自建发布链路。",
      },
      {
        title: "复制到公众号",
        body: "点「复制到公众号」直接生成适合粘贴到公众号后台的富文本，粘贴后所见即所得。",
      },
    ],
  },
  {
    title: "给外部程序用（桌面版）",
    items: [
      {
        title: "渲染API",
        body: "启动「渲染API」后，Skill / Agent / 脚本即可调用 POST /render（传 Markdown，返回微信 HTML）、GET /themes/:id/guide（取主题手册）等接口。适合把排版能力接入自己的 AI 工作流。",
      },
    ],
  },
];

export function HelpModal({ onClose }: { onClose: () => void }) {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <div className="help-modal">
      <p className="help-modal-intro">
        从写稿到发布，按这些步骤就能顺畅使用 WeMD：
      </p>
      {HELP_SECTIONS.map((section) => (
        <div key={section.title} className="help-section">
          <div className="help-section-title">{section.title}</div>
          <div className="help-items">
            {section.items.map((item) => {
              const isOpen = open === item.title;
              return (
                <div key={item.title} className="help-item">
                  <button
                    className="help-item-title"
                    onClick={() => setOpen(isOpen ? null : item.title)}
                  >
                    <span className="help-item-caret">
                      {isOpen ? "▾" : "▸"}
                    </span>
                    {item.title}
                  </button>
                  {isOpen && <div className="help-item-body">{item.body}</div>}
                </div>
              );
            })}
          </div>
        </div>
      ))}
      <div className="help-modal-footer">
        <button className="btn-primary" onClick={onClose}>
          知道了
        </button>
      </div>
    </div>
  );
}
