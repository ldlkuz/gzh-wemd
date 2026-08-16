# WeMD Web

`apps/web` 是 WeMD 的 React + Vite 前端应用（主程序），承载 Markdown 编辑、预览、AI 排版、复制到公众号、主题管理、图床设置、历史记录和文件系统模式等核心体验。

## 目录结构

```
apps/web/src/
├── components/       # React 组件（编辑器 / 预览 / 主题 / 设置等）
├── store/            # Zustand 状态管理
├── storage/          # IndexedDB 与文件系统存储适配
├── hooks/            # 可复用 Hook
├── services/         # AI、图片、模板、微信复制等业务服务
├── utils/            # 通用工具
├── lib/              # 平台适配
├── config/           # 静态配置
├── styles/           # 全局样式
├── bootstrap/        # 启动初始化逻辑
├── types/            # 全局类型
└── __tests__/        # 单元测试与集成测试
```

### 关键服务

```
services/
├── ai/               # AI 配置、提示词、分析代理、插入建议
├── template/         # Template JSON 生成与渲染（AI 版式）
├── image/            # 多图床上传（阿里 / 腾讯 / 七牛 / S3 / 微信官方）
├── math/             # 公式图片渲染
├── theme/            # 主题面板事件
├── htmlCopyService.ts      # 复制 HTML
├── wechatCopyService.ts    # 复制到公众号（富文本）
├── wechatCopyNormalizer.ts # 微信复制归一化
├── wechatPublishHtml.ts    # 微信发布 HTML 生成
└── wechatMermaidRenderer.ts # 微信 Mermaid 渲染兼容
```

## 常用命令

推荐从仓库根目录运行：

```bash
pnpm --filter @wemd/web dev
pnpm --filter @wemd/web lint
pnpm --filter @wemd/web test
pnpm --filter @wemd/web build
```

## 开发注意

- 复制到公众号是高风险链路，涉及 `wechatCopyService.ts`、`wechatCopyNormalizer.ts`、`wechatMermaidRenderer.ts` 和公式兼容逻辑，改动时需要补充测试。
- 文件系统副作用只应在 `App.tsx` 单点启用，避免多个 hook 实例重复监听或自动保存。
- UI 改动应复用现有组件、样式变量和交互模式，不要把服务逻辑写进组件。
- AI 相关改动涉及 `services/ai/` 与 `services/template/`，新增模型交互需遵循 OpenAI 兼容格式。
