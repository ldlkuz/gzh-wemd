<p align="center">
  <img src="apps/web/public/favicon-dark.svg" width="80" height="80" alt="GZH-WeMD Logo" />
</p>

<h1 align="center">GZH-WeMD</h1>

<p align="center">
  <strong>AI 驱动的公众号 Markdown 排版工具</strong>
</p>

<p align="center">
  杂志级排版 · 39 组件系统 · AI 排版 · 12 套主题 · 一键发布到公众号
</p>

---

## 项目来源

本项目基于 [WeMD](https://github.com/tenngoxars/WeMD) 二次开发，感谢原作者 [@tenngoxars](https://github.com/tenngoxars) 的开源贡献。

WeMD 提供了优秀的微信公众号 Markdown 排版基础框架 —— 所见即所得的编辑体验、主题系统、丰富的排版组件以及一键复制到公众号的核心能力。GZH-WeMD 在此基础上进行了大量扩展。

---

## 核心能力

| 模块                    | 说明                                                                                                |
| ----------------------- | --------------------------------------------------------------------------------------------------- |
| **AI 设计版式**         | AI 分析全文内容，识别文章类型，给出组件插入建议（位置 / 组件 / 理由），可预览、采纳、跳过或批量应用 |
| **AI 杂志排版**         | 一键生成完整的杂志级版式模板（Template JSON），应用后全文自动排版                                   |
| **模板渲染系统**        | 结构化 Template JSON → 渲染管线，AI 输出经合法性校验，确保可直接消费                                |
| **39 个排版组件**       | 覆盖卡片、数据、导航、引用、代码、图文、列表等常见公众号排版场景                                    |
| **主题系统**            | 12 套内置主题 + 可视化主题设计器 + 导入/导出主题包（.wemd-theme）；支持深色模式                     |
| **wemd-theme-designer** | 内置 AI 主题设计 skill，输入品牌信息即可自动产出可直接导入的完整主题包（.wemd-theme）               |
| **一键发布到公众号**    | 富文本复制直接粘贴，或复制 HTML 配合插件；内置标题/作者元信息管理                                   |
| **多图床**              | 阿里 OSS / 腾讯 COS / 七牛 / S3 / 微信官方，粘贴图片自动处理并上传                                  |
| **文件系统模式**        | 以本地文件夹为工作区，支持历史记录、快捷同步与文件管理                                              |

---

## 预览

<p align="center">
  <img src=".github/assets/test.png" alt="主界面预览" style="border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);" />
</p>

<p align="center">
  <img src=".github/assets/test1.png" alt="杂志风排版效果" style="border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);" />
</p>

---

## AI 排版

不只是"AI 帮你写"，而是"AI 帮你设计"。

```
用户输入纯文本 / Markdown
         │
         ▼
   AI 分析内容信号（数据 / 情绪 / 结论 / 过渡）
         │
         ▼
   AI 给出组件插入建议 / 生成完整版式模板
         │
         ▼
   主题设计语言 × 排版方案 → 渲染
         │
         ▼
   一键复制到公众号
```

### 能力

- **AI 设计版式**：全文分析 → 识别文章类型 → 逐处给出组件插入建议，用户逐条预览 / 采纳 / 跳过，或批量应用
- **AI 杂志排版**：一键生成完整版式模板（Template JSON），应用后全文结构化排版
- **模板渲染系统**：Template JSON 经合法性校验后渲染，保证 AI 输出可被稳定消费

### 设计原则

- **主题优先级最高**：主题的设计语言主导风格走向，用户偏好为软建议
- **组件按需存在**：每个组件必须解决具体问题
- **AI 输出可校验**：生成的版式方案经过结构化校验，避免无效输出

---

## 组件系统

39 个排版组件，覆盖公众号常见排版需求，按语言分组：

- **default 组（9）**：引用卡、分隔线、CTA 卡、代码框、进阶提示、数据块、图片网格、作者卡、时间线
- **extra 组（13）**：关注条、二维码卡、编号标题、章节标题、图文行、主 Banner、转发卡、相关阅读、目录导航、标签、图片说明、版权声明、样式表格
- **magazine 组（7）**：杂志封面、章节分隔、图文卡、文字卡、整段引用、双栏卡片、结尾卡
- **extended 组（9）**：文章区块、代码块、提示、步骤、手风琴、拉引语、分隔线、表格、图片对比
- **faq 组（1）**：FAQ 问答

组件采用「骨架模板 + slot 填充」渲染，主题可通过模板骨架定制组件结构，保证预览与导出一致。

---

## 主题系统

内置 12 套主题，覆盖商务 / 学术 / 科技 / 自然 / 极简 / 创意等风格：

- 默认主题、数据蓝图、东方笺谱、清晰指南、留白画册、学术论文、知识库、黑金奢华、莫兰迪森林、编辑部手记、购物小票、落日胶片

### 主题来源

- **可视化设计器**：分项调整配色 / 字体 / 间距 / 标题 / 组件样式，实时预览
- **导入主题包**：导入 `.wemd-theme` 主题包，支持同名主题覆盖
- **wemd-theme-designer skill**：由 AI 根据品牌信息自动产出可导入的主题包

### 技术要点

- 设计令牌（Design Token）：颜色、字体、间距统一管理
- 模板骨架：主题可为组件定制 DOM 结构（slot 填充）
- 深色模式：所有主题自动适配
- 响应式：移动端自适应

---

## 公众号发布

- **复制到公众号**：富文本格式，直接粘贴到公众号编辑器
- **复制 HTML**：配合浏览器插件，完整保留样式

内置元信息管理（标题、作者），支持快捷同步和历史联想。

---

## 快速开始

```bash
# 安装依赖
pnpm install

# 启动 Web 开发服务器
pnpm dev:web

# 启动桌面端（Electron）
pnpm dev:desktop
```

### 构建

```bash
# 全量构建（Web + Electron）
pnpm build

# 仅 Web
pnpm --filter @wemd/web build
```

桌面端平台打包命令见 [apps/electron/README.md](apps/electron/README.md)。

---

## wemd-theme-designer Skill

内置一个开箱即用的 AI 主题设计 skill，输入品牌信息即可产出可直接导入的完整主题包，实现端到端的主题生成流程。详见 [skills/wemd-theme-designer/README.md](skills/wemd-theme-designer/README.md)。

它能把品牌信息（名称、介绍、关键词）转化为一套独特的视觉语言、深度设计的 Brand Anchor 组件，以及可直接导入的 `.wemd-theme` 主题包，并通过打包前 CSS 校验与 DOM 真源对齐，杜绝"预览与导出不一致"。

---

## 项目结构

```text
├── apps/
│   ├── web/              # React + Vite 前端（主程序）
│   │   └── src/
│   │       ├── components/  # UI 组件（编辑器 / 预览 / 主题 / 设置等）
│   │       ├── services/    # AI、图片、模板、微信复制等服务
│   │       ├── store/       # Zustand 状态管理
│   │       └── hooks/       # 可复用 Hook
│   └── electron/         # Electron 桌面端
├── packages/
│   └── core/            # 核心库（Markdown 解析、主题、组件、模板）
├── skills/
│   └── wemd-theme-designer/ # AI 主题生成 skill
├── docs/                # 开发文档
└── scripts/             # 构建脚本
```

---

## License

详见 [LICENSE](LICENSE)。
