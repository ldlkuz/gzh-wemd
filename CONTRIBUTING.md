# 贡献指南

感谢你愿意改进 WeMD。WeMD 是面向微信公众号创作者的本地优先 Markdown 排版工具，贡献时请优先保证写作、预览、复制到公众号和本地文件体验稳定。

## 开始之前

- 先搜索现有 [Issues](https://github.com/tenngoxars/WeMD/issues)，避免重复处理同一个问题。
- 较大的功能或行为调整，建议先通过 Issue 说明背景、影响范围和预期方案。
- 不要提交密钥、私有配置、构建产物、上传产物或本地缓存文件。

## 本地环境

```bash
corepack enable pnpm
pnpm install
pnpm dev:web
```

桌面端开发需要先启动 Web 服务，再运行：

```bash
pnpm dev:desktop
```

## 改动原则

- 保持改动聚焦，只修改完成当前问题必要的文件。
- 优先复用现有组件、服务、hook、状态和测试工具。
- 复制到公众号、Markdown 渲染、主题、图床、文件系统和 Electron IPC 都是高风险链路，改动时需要补充对应测试。
- 用户可见文案使用中文，必要时保留 Markdown、Electron、PR 等英文专业词。

## 必要检查

按改动范围运行本地检查。常见命令如下：

```bash
pnpm --filter @wemd/core test -- --run
pnpm --filter @wemd/web lint
pnpm --filter @wemd/web test -- --run
pnpm --filter @wemd/web build
pnpm --filter wemd-electron test
pnpm --filter @wemd/server test
```

跨包、构建配置或共享逻辑变更时，请补充运行：

```bash
pnpm lint
pnpm build
```

## 提交前自查

- 是否包含对应单元测试或集成测试。
- 是否通过与改动范围匹配的本地检查。
- 是否只包含本次贡献相关文件。
- 是否同步更新了 README、帮助文档或 `.agentdocs/` 中需要长期沉淀的约束。

## Pull Request

- 标题请简明描述用户可感知的问题或开发维护收益。
- 描述中说明改动内容、验证命令和相关 Issue。
- 如果涉及界面变化，请附上截图或录屏。
- CI 会自动运行基础检查；失败时请先根据日志修复后再请求 review。
