# WeMD 接口与文章推送

> 界面里叫「WeMD 接口」（旧称「渲染API」）：本机 HTTP 接口 + MCP 两种接入方式。
> 面向对象：需要把「AI 生成文章 → 落到 WeMD 程序 → 自动排版」串起来的开发者。
> 涉及代码：`apps/server`、`apps/mcp`、`apps/electron`、`apps/web`。

## 1. 它是什么

WeMD 桌面版本机启动一个 HTTP 接口，让外部 skill / agent / 脚本 / MCP 客户端可以在**不接触文件系统、不需要任何授权**的前提下：

1. 读取某主题的组件语法手册；
2. 把 markdown 渲染成微信安全的 HTML；
3. 把文章**推送进程序**，程序自动落盘、刷新列表、打开并套用主题。

设计原则：**skill 只发内容，程序全权决定存哪、怎么展示。**

## 2. 全链路

```
skill / agent / MCP 客户端
   │  ① GET  /themes/:id/guide        → 拿组件语法手册
   │  ②  生成 markdown
   │  ③ (可选) POST /render           → 拿微信安全 HTML（粘公众号用）
   │  ④ POST /articles                → 把文章推给程序
   ▼
WeMD 接口服务 (127.0.0.1:8787)
   │  校验 → 主题包装 → 写入工作区文件 → stdout 打标记
   ▼
Electron 主进程
   │  解析标记 → 发 article:written 事件（目录 watcher 同时发 file:refresh）
   ▼
渲染进程
   └─ 刷新侧边栏 → 无脏文档则自动打开 → 解析 frontmatter → 应用主题 → 预览排版
```

## 3. 准备工作（不需要 skill 参与）

### 3.1 启动接口服务

**默认随程序自动启动，无需手动操作。** 主进程用 `ELECTRON_RUN_AS_NODE` 把 electron 当纯 node 用，spawn 出 `apps/server/dist/index.mjs`，注入：

| 环境变量         | 含义                                    |
| ---------------- | --------------------------------------- |
| `WEMD_HOST`      | 监听地址，默认 `127.0.0.1`              |
| `WEMD_PORT`      | 监听端口，默认 `8787`                   |
| `WEMD_GUIDE_DIR` | 手写主题手册目录                        |
| `WEMD_WORKSPACE` | 当前工作区绝对路径，供 `/articles` 落盘 |

服务默认只监听本机回环地址，重复启动是幂等的。

自动启动偏好记录在 `userData/server.json`：用户在界面主动「停止服务」后记为关闭，之后不再自动启动；主动「启动服务」则恢复自动启动。

若端口已被其他程序占用，启动会**直接失败并给出明确错误**（不会把别人的服务误判成自己的）。

### 3.2 工作区由程序自己拥有

工作区是文章的落盘位置，**对 skill 不可见、也无需感知**。

启动时决定顺序：

1. 读 `userData/workspace.json`，记录存在且目录仍存在 → 用它；
2. 否则用默认目录 `文档/WeMD`（自动创建）；
3. 创建失败 → 退回让用户手动选择。

随后主进程 `setWorkspaceDir` + 写记录 + 开启目录监听。渲染进程启动时优先恢复 localStorage 里的上次路径，没有则向主进程取兜底值。

用户手动切换工作区时：更新记录 → 重启接口服务（刷新注入的 `WEMD_WORKSPACE`）。

**效果**：用户最多手动选一次，通常零次；skill 永远不需要传路径。

## 4. 端点参考

### `GET /health`

健康检查：供外部程序 / skill 在推送前确认服务是否可用。

```json
{
  "ok": true,
  "service": "wemd-render",
  "version": "1.5.0",
  "workspace": "E:\\trae_project\\test",
  "workspaceReady": true
}
```

`version` 为程序版本（主进程注入）；`workspaceReady` 为 `false` 时 `/articles` 会返回 409。

### `GET /themes`

列出全部内置主题。

```json
{
  "themes": [{ "id": "sunset-film", "name": "落日胶片", "description": "..." }]
}
```

### `GET /themes/:id/guide`

返回该主题的**手写组件手册**（`text/markdown`）。AI 靠它写出正确的组件语法。

- 主题不存在 → `404 { error }`
- 主题存在但缺手册 → `404 { error }`

### `POST /render`

把 markdown 渲染成可直接粘进公众号的 HTML。

请求：

```json
{ "markdown": "# 标题\n\n正文", "themeId": "sunset-film" }
```

响应：`{ "html": "<section id=\"wemd\">…</section>", "themeId": "sunset-film" }`

- 未知主题 → 抛错返回 500
- 产物满足微信约束：无伪元素、无 `position: absolute/relative`、块级样式已内联

### `POST /articles`

**把文章写入程序当前工作区**，程序会自动刷新并打开。详见下一节。

## 5. `POST /articles` 详解

### 请求体

| 字段        | 类型    | 必填 | 说明                                                    |
| ----------- | ------- | ---- | ------------------------------------------------------- |
| `markdown`  | string  | 是   | 文章正文（上限 5MB）                                    |
| `filename`  | string  | 否   | 文件名，缺省按时间生成 `untitled-YYYYMMDD-HHmmss.md`    |
| `overwrite` | boolean | 否   | 同名是否覆盖，默认 `false`                              |
| `conflict`  | string  | 否   | 同名处理：缺省 `fail`（返回 409）；`rename` 自动加序号  |
| `themeId`   | string  | 否   | 排版主题 id，写进 frontmatter，程序打开时自动应用       |
| `themeName` | string  | 否   | 主题显示名；使用导入的自定义主题时随 `themeId` 一并传入 |
| `title`     | string  | 否   | 发布标题                                                |
| `author`    | string  | 否   | 作者                                                    |

### 处理顺序

1. 请求体超过 5MB → `413`（允许带 BOM，会被自动剥离）
2. 校验 `markdown` 为非空字符串 → 否则 `400`
3. 若带 `themeId`：查内置主题表
   - 命中 → 自动补 `themeName`
   - 未命中 → **不报错**，按原样写入 `theme`；若调用方也没给 `themeName`，返回体带 `warning`（用于支持导入的自定义主题）
4. 工作区不存在或不合法 → `409`
5. 文件名清洗：剥目录部分、过滤 `\ / : * ? " < > |` 及控制字符、强制 `.md` 后缀（防路径穿越）
6. 同名已存在且未传 `overwrite`：
   - `conflict: "rename"` → 自动改名（`标题.md` → `标题-1.md`）
   - 否则 → `409`
7. 拼 frontmatter（`theme` / `themeName` / `title` / `author`）后**原子写入**：先写同目录临时文件再替换，避免程序在写入中途读到半个文件（替换失败时回退为直接写入）
8. stdout 打印 `WEMD_ARTICLE_WRITTEN:<绝对路径>`，供宿主进程识别
9. 返回 `{ ok, filename, path, themeId, warning? }`

### 状态码汇总

| 状态码 | 场景                                                        |
| ------ | ----------------------------------------------------------- |
| `200`  | 成功                                                        |
| `400`  | 请求体不是合法 JSON / 缺少 `markdown`                       |
| `409`  | 工作区不可用 / 文件名冲突（未指定 `overwrite` 或 `rename`） |
| `413`  | 请求体超过 5MB                                              |
| `404`  | 路由不存在                                                  |

### 写入的文件形态

```markdown
---
theme: sunset-film
themeName: "落日胶片"
title: "把黄昏装进一卷胶片"
---

# 正文…
```

不带任何元信息字段时按原样写入，不添加 frontmatter。若调用方自带的 frontmatter 与本次元信息冲突，以本次为准（旧的会被剥离）。

### 示例

```bash
curl -X POST http://127.0.0.1:8787/articles \
  -H "Content-Type: application/json" \
  -d '{
    "markdown": "# 标题\n\n正文",
    "filename": "我的文章.md",
    "themeId": "sunset-film"
  }'
```

> Windows / PowerShell 调用提示：请求体用 UTF-8 写文件后 `-InFile` 提交即可。服务端已容忍 BOM，但本地文件仍建议保存为无 BOM，避免其他工具读取时出现异常字符。

### 用脚本推送（推荐）

仓库内置 `scripts/wemd-push.mjs`（Node 18+，零依赖），封装了「探测服务 → 推送 → 友好报错」，比手写 curl 更稳。

```bash
# 探测服务是否可用
node scripts/wemd-push.mjs --health

# 从文件推送并指定主题
node scripts/wemd-push.mjs article.md --theme sunset-film --title "标题"

# 从管道推送
cat article.md | node scripts/wemd-push.mjs --theme sunset-film

# 同名时自动改名
node scripts/wemd-push.mjs article.md --name 我的文章.md --rename
```

退出码：`0` 成功 / `1` 参数或输入错误 / `2` 服务不可达 / `3` 工作区未就绪 / `4` 服务端拒绝。

服务不可达时会直接提示「请确认 WeMD 已启动、WeMD 接口处于运行中」，而不是抛裸连接错误。

## 6. 程序侧响应

1. **主进程**：监听子进程 stdout，**按完整行解析**（维护行缓冲——stdout 分片不保证按行对齐，标记行可能被切开）→ 匹配 `WEMD_ARTICLE_WRITTEN:` 前缀 → 向渲染进程发 `article:written { path }`
2. **目录 watcher**：文件落盘同时触发 `file:refresh`，侧边栏刷新
3. **渲染进程**：
   - 刷新文件列表；
   - **若当前有未保存改动 → 只刷新列表，不打断**；
   - 否则按路径在文件树中找到目标 → `openFile`；
   - `openFile` 解析 frontmatter → `selectTheme` 自动切换主题 → 编辑器与预览同步排版。

因此主题能力无需在渲染侧写任何额外代码——它是"文件属性"。

**自动打开开关**：WeMD 接口弹窗内有「外部推送文章后，自动在编辑器打开」开关（默认开启，记在 localStorage）。关闭后只刷新侧边栏，不抢占编辑器。

**排障**：同一个弹窗里的「查看日志」可看主进程捕获的服务日志（最近 200 行，含 `WEMD_ARTICLE_WRITTEN` 标记），支持一键复制。

## 7. 关键实现文件

| 文件                                          | 职责                                                                     |
| --------------------------------------------- | ------------------------------------------------------------------------ |
| `apps/server/src/index.ts`                    | HTTP 服务：路由、`/articles` 处理、frontmatter 组装、stdout 标记         |
| `apps/server/build.mjs`                       | esbuild 打包为单文件 `dist/index.mjs`                                    |
| `apps/electron/src/ipc/serverHandlers.ts`     | 启停服务、注入环境变量、解析 stdout 标记、转发事件；工作区切换后重启服务 |
| `apps/electron/src/workspace/persistence.ts`  | 工作区持久化读写 + 默认目录解析                                          |
| `apps/electron/src/workspace/state.ts`        | 内存态工作区路径                                                         |
| `apps/electron/src/ipc/workspaceHandlers.ts`  | 工作区选择/切换：写记录、开启监听、重启服务                              |
| `apps/electron/src/watch/workspaceWatcher.ts` | 目录监听 → `file:refresh`                                                |
| `apps/electron/src/preload.ts`                | 暴露 `fs.getCurrentWorkspace`、`article.onWritten`                       |
| `apps/web/src/hooks/useFileSystemEffects.ts`  | 启动恢复工作区、监听 `article:written` 并智能打开                        |
| `apps/web/src/utils/markdownFileMeta.ts`      | frontmatter 解析/生成（程序端权威格式）                                  |
| `apps/web/src/utils/preferences.ts`           | 界面本地偏好（自动打开开关）                                             |
| `scripts/wemd-push.mjs`                       | 外部推送脚本（探测 + 推送 + 友好报错）                                   |
| `apps/mcp/src/index.ts`                       | MCP 瘦代理：4 个工具转发到本地接口服务                                   |

主进程 ↔ 渲染进程事件：`file:refresh`、`server:status`、`article:written`。

## 8. 边界与取舍

- **权限最干净**：skill 只发 HTTP，不读文件、不碰目录、不需要授权。
- **不落盘不是选项**：文档模型是"文件即文档"，`currentFile` 必须带路径；因此推送必然落盘，换来可编辑、可保存、可回溯。
- **失败可见**：程序未启动或服务未开启时，推送直接连接失败，不存在静默丢失。
- **主题随文件走**：主题记录在文件 frontmatter 中，文章换机器打开仍保持排版。
- **服务可被任意本机程序调用**，因此保持无鉴权、无状态；如需跨机访问需自行加反向代理与鉴权。

## 9. MCP 接入（让 AI 工具直接调用）

`apps/mcp` 是一个 **MCP 瘦代理**：把 WeMD 的本地服务包装成 MCP 工具，**不重复实现任何排版逻辑**，
只转发到 `127.0.0.1:8787`。因此主题与渲染规则只需在 WeMD 侧维护一次，所有 MCP 客户端自动同步。

```
Trae / Codex / Cursor ──stdio MCP──▶ wemd-mcp ──HTTP──▶ WeMD 接口服务 (127.0.0.1:8787)
```

### 暴露的工具

| 工具              | 作用                                         |
| ----------------- | -------------------------------------------- |
| `list_themes`     | 列出可用主题                                 |
| `get_theme_guide` | 取某主题的组件语法手册（**写文章前应先取**） |
| `render_markdown` | markdown → 微信安全 HTML（不写入程序）       |
| `push_article`    | 推送到 WeMD 工作区，程序自动打开并套用主题   |

> 四个工具都带 MCP `annotations`：`list_themes` / `get_theme_guide` 为只读；`render_markdown` 默认会转存图片到图床、`push_article` 会写入工作区文件，故均不标只读。
> 单次请求超时默认 120s，可用环境变量 `WEMD_TIMEOUT_MS`（毫秒）覆盖。

### 构建

```bash
pnpm --filter @wemd/mcp build   # 产出单文件 dist/index.mjs
```

### 客户端配置

**推荐（产品用户，零安装）**：在 WeMD 界面打开「WeMD 接口」面板，点「复制 MCP 配置」直接粘贴到 AI 工具的 MCP 设置。生成的配置把 `command` 指向 WeMD 程序自身，配合 `ELECTRON_RUN_AS_NODE` 当纯 Node 使用，**用户机器无需安装 Node**：

```json
{
  "mcpServers": {
    "wemd": {
      "command": "C:\\...\\WeMD.exe",
      "args": ["C:\\...\\resources\\mcp\\index.mjs"],
      "env": { "ELECTRON_RUN_AS_NODE": "1" }
    }
  }
}
```

**开发自用**：直接用 Node 跑构建产物：

```json
{
  "mcpServers": {
    "wemd": {
      "command": "node",
      "args": ["<仓库绝对路径>/apps/mcp/dist/index.mjs"]
    }
  }
}
```

生成逻辑见 `apps/electron/src/ipc/serverHandlers.ts` 的 `buildMcpConfig()`（IPC `server:mcpConfig`）。

前提：**WeMD 桌面版正在运行，且「WeMD 接口」已开启**。未开启时工具会返回明确的连接指引，
而不是裸的连接错误。

> 各客户端的配置文件位置不同（Trae 在设置面板的 MCP 项；Codex 使用 TOML 配置），
> 字段结构基本一致，具体位置以各自官方说明为准。
