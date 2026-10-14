# 更新日志

本仓库采用语义化版本（SemVer），版本号以根 `package.json` 为唯一真源，由 `scripts/sync-version.mjs` 同步到 `apps/web`、`apps/electron`、`apps/server`、`apps/mcp`、`packages/core`。

## [1.5.2] - 2026-10-14

### 新增

- **更新下载走代理优先、官方源兜底**
  - 默认使用 `gh-proxy` 镜像源；点「下载」时先用 `net.fetch` 探测线路可用性，界面提示「正在选择线路…」
  - 代理不可用时静默回落到 GitHub 官方源重试，不再打扰用户
- **日志落盘与诊断包**
  - 接入 `electron-log`，日志写入 `userData/logs`（5MB 轮转），密钥 / Bearer / URL 参数等敏感信息自动脱敏
  - 渲染进程的 `error`、`unhandledrejection`、`console.error/warn` 经 IPC 转发到主进程统一落盘；捕获未处理异常
  - 菜单新增「打开日志目录」与「导出诊断包」（环境 + 更新诊断 + 工作区状态 + 全部日志）
- **首屏上手指引**
  - 首次进入编辑器按真实界面高亮引导 8 步（侧边栏 / 编辑器 / AI 排版 / 插入组件 / 预览 / 文章主题 / 图床 / 复制发布），可从菜单「查看上手指引」重看
- **黑金奢华封面支持配图**
  - `magazine-cover` 新增图片扩展槽，封面卡可直接放头图（内置主题版本 `2.0.0 → 2.1.0`）
- **隐私说明**
  - 新增 `PRIVACY.md`：列明四种联网场景，明确不做埋点与崩溃上报

### 变更

- **「复制到公众号」更名为「复制富文本」，并与「复制 HTML」主次对调**
  - 「复制 HTML」提为主按钮：配合浏览器插件直接写入公众号后台，绕过微信的粘贴清理，版式最完整
  - 「复制富文本」降为次按钮：免插件可直接粘贴，但会经过微信粘贴过滤，复杂版式（弹性布局、旋转装饰、阴影等）可能被简化
  - 首屏引导第 8 步、帮助面板与按钮口径同步更新
- **MCP 工具集收敛为「挑主题 → 取手册 → 交付」+ 自检**
  - `render_markdown` 更名为 `check_markdown`，改为返回**诊断摘要**：实际生效主题、识别到的组件、**未被识别的 `:::` 名**、HTML 大小、图片提醒（未被识别的组件会被当普通文本输出，这是手册给不了的反馈）
  - 它固定不转存图片、不写文件（不再"检查一下"就在图床留下垃圾图）；需要整篇 HTML 时才传 `returnHtml: true`
  - 「取成品 HTML」改由 HTTP `POST /render` 承担，MCP 侧不再默认回大体积正文
  - `list_themes` 输出追加下一步提示；`get_theme_guide` 描述硬化（未先取手册就写 `:::` 语法必错）；`push_article` 返回点明"已在 WeMD 中打开"
  - **交付失败要如实上报**：报「无法连接 WeMD 接口」时把错误原文告知用户、请他确认 WeMD 与接口在运行并重试一次，**禁止改用自己写 .md 文件绕过**（那会把真实原因掩盖掉）

### 工程

- 本机视觉稿 / 预览稿 / 个人素材统一归置 `userdocs/`（整目录 gitignore），`docs/` 只保留 `engineering` 与 `phase-reports` 正式开发文档；`.gitignore` 中 10 条零散 `docs/xx` 规则合并为一条 `/userdocs/`

## [1.5.1] - 2026-10-06

### 新增

- **MCP 接入（`apps/mcp`）**
  - 新增 MCP 瘦代理，把本机「WeMD 接口」包装成 4 个 MCP 工具：`list_themes`、`get_theme_guide`、`render_markdown`、`push_article`，AI 工具（Trae / Cursor / Codex 等）可直接调用
  - 「WeMD 接口」面板新增「复制 MCP 配置」：生成的配置把 `command` 指向 WeMD 程序自身并配合 `ELECTRON_RUN_AS_NODE`，用户机器**无需安装 Node**
  - 工具带 MCP `annotations` 标注；单次请求默认 120s 超时，可用 `WEMD_TIMEOUT_MS` 覆盖
- **文章推送接口**
  - `POST /articles`：把 markdown 写入当前工作区，程序自动刷新、打开并套用主题
  - `scripts/wemd-push.mjs`：命令行推送脚本（探测服务 → 推送 → 友好报错）
- **示例文章**
  - 首次创建默认工作区时落一篇 `示例文章.md`，以普通文件形式存在，不再充当编辑器初始内容

### 变更

- **移除 `GET /themes/:id/sample/:component`**：主题手册（`GET /themes/:id/guide`）已包含全部组件写法，单组件示例接口冗余，直接删除

### 修复

- **编辑器内容错配会覆盖用户文章**：保存前校验内容归属，归属不符时改为以文件为准重新载入
- **导出公众号后骨架布局塌陷**：微信会把 `<div>` 打平成 `<p>`，导致依赖 flex 的骨架失效 —— 组件骨架容器统一改用 `<section>`（含 code-block 的 Mac 窗结构，装饰圆点改 `<span>`）
- food-atlas 数据指标块区块塌陷；silent-keynote 时间线标题缺少左缩进
- 渲染服务构建脚本在 hoisted 依赖布局下找不到 markdown-it token 文件

### 工程

- electron（12 例）、server（18 例）、mcp（5 例）测试纳入 CI；server、mcp 新增 `typecheck` 并接入 CI
- 版本号同步范围扩展到 `apps/server`、`apps/mcp`
- 新增根目录聚合命令 `pnpm test`（`turbo run test`）
- 修复 CI 中 `pnpm test` 命令在 pnpm 9 下报 `Unknown option: 'run'` 导致测试步骤失效的问题

## [1.5.0] - 2026-09-24

### 新增

- **渲染API 服务**
  - 应用内可直接启动/停止「渲染API」，提供本机 HTTP 服务，供其他 Skill / Agent / 脚本调用
  - `POST /render` 一键把 Markdown 转成微信安全 HTML
  - `GET /themes`、`GET /themes/:id/guide`、`GET /themes/:id/sample/:component` 取主题信息与组件示例
- **使用帮助弹窗**
  - 工具栏新增帮助按钮，内置分组式使用引导（准备工作 / 基础操作 / AI 排版 / 导出发布 / 外部程序调用）
- **AI 组件手册体系**
  - 18 套主题各配套一份独立的手写 AI 排版手册，已接入 AI 排版与渲染服务
  - 导入主题现在可携带自己的组件手册

### 优化

- **插件目录可见化**
  - 浏览器插件由隐藏的 `resources/` 移到安装根目录，用户可直接定位
  - 「打开插件目录」同步指向安装根目录
- **插件升级 3.4.0**
  - 打开插件面板自动读取系统剪贴板，填入 HTML，免手动粘贴
  - 仍保留手动粘贴兜底

### 修复

- 帮助弹窗内容超出时无法滚动（窄弹窗滚动被关死）。
- 组件 AI 语法手册与 system 提示词规则不一致（原生组件描述改为兼容手写分组格式）。
