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
        body: "要把「复制 HTML」的结果粘进公众号后台，需要浏览器插件配合（插件负责把 HTML 写入公众号编辑器）；不装插件时，用「复制到公众号」的富文本方式同样能发布。插件由本程序提供，桌面版左下角有「打开插件目录」「查看插件安装说明」两个按钮，按说明安装即可。",
      },
      {
        title: "配置 AI 模型（可选）",
        body: "AI 排版需要先接入模型。点顶部「AI 设置」，填入 OpenAI 兼容的 Base URL 与密钥，保存后可测试连通。配置只存本地、不上传。不配置也能正常手写排版和复制，只是用不了 AI 改写。",
      },
      {
        title: "图片存放位置（可选）",
        body: "默认使用官方图床，无需任何配置，粘贴或插入的图片会自动上传。想存到自己的云时，打开顶部「图床设置」，可选七牛云 / 阿里云 OSS / 腾讯云 COS / S3，填好参数后启用即可。",
      },
      {
        title: "WeMD 接口",
        body: "桌面版默认随程序自动开启本机接口（供其他程序调用排版能力），一般无需手动操作；若你之前手动停过，点「启动服务」即可重新开启。浏览器版没有这个接口。点顶部「WeMD 接口」可查看运行状态与端口、停止服务、复制 MCP 配置，以及用「查看日志」排查问题。如果不接入外部 AI 工具，这一项可以完全不用管。",
      },
    ],
  },
  {
    title: "基础操作",
    items: [
      {
        title: "工作区",
        body: "文章以本地文件的形式存在工作区文件夹里。侧边栏顶部显示当前工作区名，点它即可更换文件夹。桌面版首次启动会自动准备好「文档 / WeMD」，通常不需要你手动选择；万一没准备好，界面会提示你先选一个文件夹。",
      },
      {
        title: "从示例文章开始（推荐）",
        body: "首次自动创建工作区时，会同时放入一篇「示例文章.md」。打开它就能一次看全所有组件的排版效果——想知道某个组件长什么样，最快的办法就是在这里对照。",
      },
      {
        title: "写文章",
        body: "在左侧用 Markdown 写正文。用 # 标题、> 引用、| 表格 |、代码块、![](图片) 等通用语法，系统自动适配成微信兼容样式，无需额外动作。",
      },
      {
        title: "选主题",
        body: "点顶部导航的「文章主题」，在打开的面板里挑一套主题（隐藏标题栏时用浮动工具栏的「主题管理」）。每个主题是完整视觉风格（颜色、字体、组件形态都不同），随时可切换。",
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
    title: "主题与设计",
    items: [
      {
        title: "可视化设计主题",
        body: "在「文章主题」面板里新建主题、或编辑自定义主题时，选「可视化设计」模式，用控件分项调整配色、字体、间距、标题与组件样式，改动实时预览，不用写 CSS（也可以切到 CSS 模式手写样式）。",
      },
      {
        title: "导入 / 导出主题包",
        body: "面板顶部「导入主题」支持 .json / .wemd-theme / .zip，导入后即可像内置主题一样使用（同名会提示覆盖或导入为副本）；自己调好的主题可用「导出 → 主题包（.wemd-theme）」分享或备份。",
      },
      {
        title: "导出组件语法文档",
        body: "在主题面板可以把当前主题的组件语法导出成一份 .md（基础语法 + 全部组件 + 排版规格），适合当写作对照，或交给 AI 让它按这套主题写文章。",
      },
    ],
  },
  {
    title: "导出到公众号",
    items: [
      {
        title: "复制为 HTML",
        body: "点顶部「复制 HTML」得到微信安全的内联样式 HTML，配合浏览器插件可粘进公众号后台，也可用于自建发布链路。",
      },
      {
        title: "复制到公众号",
        body: "点「复制到公众号」直接生成适合粘贴到公众号后台的富文本，粘贴后所见即所得。",
      },
    ],
  },
  {
    title: "给外部程序用（可选）",
    items: [
      {
        title: "用 MCP 接入 AI 工具",
        body: "让 Trae / Codex / Cursor 等 AI 工具直接调用 WeMD 排版，三步：① 打开「WeMD 接口」面板，点「复制 MCP 配置」；② 粘贴到 AI 工具的 MCP 设置（如 Trae：设置 → MCP）并保存；③ 新开一个会话，把面板里给的示例提示词发给它。配置指向 WeMD 程序自身，本机无需另外安装 Node。不需要接入其他 AI 工具的话，这一节整节都可以跳过。",
      },
      {
        title: "直接用 HTTP 调用（脚本 / Skill）",
        body: "接口默认已开启，可直接调用：POST /render（传 Markdown，返回微信安全 HTML）、POST /articles（把文章写入工作区，程序自动打开并套用主题）、GET /themes（列主题）、GET /themes/:id/guide（取该主题的组件语法手册）、GET /health（健康检查）。仓库内 scripts/wemd-push.mjs 是封装好的命令行推送脚本。接口仅监听本机、无鉴权，适合本机自用。",
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
