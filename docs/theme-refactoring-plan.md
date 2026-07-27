# 主题系统改造方案 —— 可行性评估与分阶段计划

> 基于「主题系统改造方案.md」的四层架构理念，对标现有代码，输出可落地的分阶段改造计划。

---

## 一、方案对标分析：现有资产 vs 目标架构

### 目标架构（方案.md 提出）

```
Theme
  ├── Meta（主题信息）
  ├── Design Token（设计语言）
  ├── Component Library（每个组件在主题下的视觉定义）
  └── Layout Preference（排版倾向建议）

Renderer → CSS
```

### 现有资产盘点

| 目标层                | 现有对应物                                                                   | 匹配度  | 差距                                                                                                                                   |
| --------------------- | ---------------------------------------------------------------------------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| **Meta**              | 无正式定义。`CustomTheme.name` + 隐式描述                                    | 10%     | 需要 schema 化的 id/name/description/keywords/tags                                                                                     |
| **Design Token**      | `DesignerVariables` 类型（54 属性）+ `generateVariables()`                   | **70%** | 已有 color/typography/spacing/border/radius/shadow，但 UI 耦合在可视化设计器中，不是独立的 Token 层                                    |
| **Component Library** | 30 个 ComponentManifest + 4 组共享 CSS + variantCss（仅 share-card 有变体）  | **30%** | Manifest 只有元数据没有样式定义；CSS 是全局共享的而非每个主题一份；变体系统刚起步                                                      |
| **Layout Preference** | `DesignLanguage`（5 套，含 tone/categories/variantMap/magazineLevel）        | **60%** | 已具备 preference 的语义，但与 Theme 完全独立，没有映射关系                                                                            |
| **Renderer**          | `generateCSS()`（5 个 generators 分工明确）+ `buildThemeCss()`（字符串拼接） | **40%** | 已有 renderer 雏形，但存在两套生成路径（内置主题走拼接，可视化走 generateCSS），且组件 CSS 由 `buildThemeCss` 统一注入而非每个主题独立 |

### 关键发现

**好消息**：方案的四个层次在现有代码中都有对应的"种子"，不需要从零开始。改造的本质是**重新组织已有的资产**，而非重写。

**最大的结构性债务**：`buildThemeCss()` 函数（`builtInThemes.ts`）把 6 层 CSS 字符串拼成一份，"主题"只是其中一层 CSS。这是 Theme = CSS 的根源。改掉这个函数，整个架构就扭转了。

---

## 二、影响范围评估

### 2.1 需要修改的核心文件

| 文件                                    | 改动程度 | 说明                                                    |
| --------------------------------------- | -------- | ------------------------------------------------------- |
| `store/themes/builtInThemes.ts`         | **重度** | 17 套内置主题从 CSS 字符串改为 Theme JSON               |
| `store/themeStore.ts`                   | **中度** | `CustomTheme` 类型扩展，`getThemeCSS` 改为调用 Renderer |
| `packages/core/src/ThemeProcessor.ts`   | **轻度** | 入口不变（HTML + CSS），但 CSS 来源从拼接变为渲染       |
| `components/Theme/ThemeDesigner/`       | **中度** | 设计器编辑 Theme JSON 而非直接生成 CSS                  |
| `components/Theme/AiThemeGenerator.tsx` | **中度** | AI 输出从 CSS 变为 Theme JSON                           |
| `services/ai/designLanguage.ts`         | **轻度** | 与 Theme 建立映射关系                                   |
| `components/Theme/ThemePanel.tsx`       | **轻度** | 去掉手写 CSS 模式                                       |
| `components/Editor/AiDesignPanel.tsx`   | **轻度** | prompt 中注入当前主题上下文                             |

### 2.2 可以保留不动的

| 文件/系统                                  | 原因                                                                                              |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------- |
| 30 个 ComponentManifest                    | 已经是结构化的组件定义，作为 Component Library 的"目录"                                           |
| `components-default/extra/faq/magazine.ts` | 这些 CSS 在过渡阶段继续使用，作为组件的"默认外观"。未来逐步迁移为每个主题定义组件样式             |
| 5 个 generators                            | `generateCSS()` 本身就是一个 Renderer，只需调整输入从 `DesignerVariables` 扩展为完整的 Theme JSON |
| `DesignLanguage` 系统                      | 作为 Layout Preference 的基础，只加上与 Theme 的双向映射                                          |
| `variantCss.ts`                            | 变体系统继续工作，作为 Component Library 中"同一组件多风格"的基础机制                             |
| `ThemeLivePreview`                         | iframe 隔离预览继续工作，只是输入从手写 CSS 变为渲染后的 CSS                                      |
| `ThemeProcessor` / `wechatDarkMode`        | CSS 处理管线不变                                                                                  |

### 2.3 可以删除的

| 文件/系统                                  | 原因                                                                    |
| ------------------------------------------ | ----------------------------------------------------------------------- |
| 手写 CSS 创建模式                          | Theme 不再是 CSS，用户不应该直接写 CSS。保留"可视化设计"和"AI 生成"两种 |
| `AiThemeGenerator` 的 `sanitizeCss`        | AI 输出 JSON 后不再需要 CSS 安全过滤                                    |
| `buildThemeCss()` 的拼接逻辑               | 被 Renderer 取代                                                        |
| 部分 `theme-variables.ts` 中的 16 套色变量 | 合并到 Design Token 层                                                  |

---

## 三、改造方案：分三个阶段

### Phase 1：定义 Theme Schema + Renderer 升级

**目标**：建立 `theme.schema.json`，让 Renderer 能从 Theme JSON 生成完整 CSS。不改现有主题数据，不破坏任何功能。

#### 1.1 定义 Theme Schema

```typescript
// packages/core/src/theme-schema/types.ts

/** 四层主题定义 */
interface ThemeDefinition {
  // Layer 1: Meta
  id: string;
  name: string;
  description: string;
  keywords: string[];
  version: string;

  // Layer 2: Design Token
  tokens: DesignTokens;

  // Layer 3: Component Styles（每个组件的视觉覆盖）
  components: Record<string, ComponentStyleOverride>;

  // Layer 4: Layout Preference（给 AI 的排版建议）
  layout: LayoutPreference;
}

/** Design Token（从 DesignerVariables 提炼，去掉 UI 专属字段） */
interface DesignTokens {
  color: {
    primary: string;
    primaryDark: string;
    primaryLight: string;
    secondary: string;
    accent: string;
    background: string;
    bgSoft: string;
    bgCard: string;
    bgMuted: string;
    textStrong: string;
    textNormal: string;
    textSoft: string;
    border: string;
  };
  typography: {
    fontFamily: string;
    fontSize: string; // 正文字号
    lineHeight: string;
    letterSpacing: number;
    heading: {
      h1: HeadingToken;
      h2: HeadingToken;
      h3: HeadingToken;
      h4: HeadingToken;
    };
  };
  spacing: {
    pagePadding: number;
    paragraphMargin: number;
    paragraphPadding: number;
  };
  border: {
    radius: number;
    style: "solid" | "dashed" | "dotted";
    width: number;
  };
  shadow: {
    enabled: boolean;
    value: string;
  };
}

interface HeadingToken {
  fontSize: number;
  color: string;
  marginTop: number;
  marginBottom: number;
  fontWeight: string;
  preset?: string; // left-border / bottom-border / boxed / pill 等
  centered?: boolean;
}

/** 单个组件在主题下的视觉覆盖 */
interface ComponentStyleOverride {
  /** 是否启用（false 则使用默认样式） */
  enabled: boolean;
  /** 选用的变体 ID（如 share-card 的 warm/minimal/tech） */
  variant?: string;
  /** 覆盖的 CSS 属性（可选，用于精细化控制） */
  overrides?: Record<string, string>;
}

/** 给 AI 的排版建议 */
interface LayoutPreference {
  /** 偏好组件清单 */
  preferredComponents: string[];
  /** 排版密度 */
  density: "low" | "medium" | "high";
  /** 风格基调 */
  tone: string[];
  /** 杂志化等级 */
  magazineLevel: "low" | "medium" | "high";
}
```

#### 1.2 创建 ThemeRenderer

```
packages/core/src/theme-renderer/
  ├── index.ts          # renderTheme(theme: ThemeDefinition) → string
  ├── tokenCss.ts       # DesignTokens → CSS 变量块
  ├── typographyCss.ts  # DesignTokens → 排版 CSS（h1-h4/p/li/ul/ol）
  ├── componentCss.ts   # components → 组件 CSS（引用/代码/表格/图片等）
  └── extrasCss.ts      # 脚注/提示块/Mermaid/分割线
```

本质上是把现有的 5 个 generators 重构为以 `ThemeDefinition` 为输入，而不是 `DesignerVariables`。

#### 1.3 验证方式

不修改现有主题数据。用 1-2 套现有主题的 CSS，反向推导出 Theme JSON，通过新 Renderer 生成 CSS，与原有 CSS diff 对比，确保渲染一致性。

**产出**：

- `theme.schema.json` 文件
- `ThemeRenderer` 模块（可独立测试）
- 1-2 套主题的 JSON 表示（验证用）

---

### Phase 2：迁移内置主题 + 简化 UI

**目标**：17 套内置主题从 CSS 字符串迁移为 Theme JSON，去掉手写 CSS 模式，让主题管理围绕 JSON 数据工作。

#### 2.1 迁移 17 套内置主题

将 `builtInThemes.ts` 中的每套主题 CSS 反向推导为 `ThemeDefinition` JSON：

```typescript
// 迁移前（现状）
const defaultTheme: CustomTheme = {
  id: "default",
  name: "默认主题",
  css: customDefaultTheme + codeGithubTheme + componentStylesDefault + ...,
  isBuiltIn: true,
};

// 迁移后
const defaultTheme: ThemeDefinition = {
  id: "default",
  name: "默认主题",
  description: "微信绿色调，适合日常内容创作",
  keywords: ["通用", "清新", "日常"],
  tokens: { color: { primary: "#07c160", ... }, typography: { ... }, ... },
  components: {
    "quote-card": { enabled: true, variant: "default" },
    "share-card": { enabled: true, variant: "warm" },
    // ... 30 个组件
  },
  layout: {
    preferredComponents: ["quote-card", "divider-fancy", "share-card"],
    density: "medium",
    tone: ["warm", "modern"],
    magazineLevel: "medium",
  },
};
```

`getThemeCSS()` 改为 `renderTheme(themeDefinition)`。

#### 2.2 调整 ThemePanel

- 移除"手写 CSS"创建模式
- 保留"可视化设计"（操作 Design Tokens）
- 保留"AI 生成"（改为输出 Theme JSON）
- 导出改为 JSON 格式（ThemeDefinition）和 CSS（渲染后）

#### 2.3 调整 ThemeDesigner

- 可视化设计器现在编辑的是 `DesignTokens` + `ComponentStyleOverride`（而非直接生成 CSS）
- `generateCSS()` 被 `renderTheme()` 取代
- 已有的 10 个 Tab UI 基本保留，只是数据绑定从 `DesignerVariables` 变为 ThemeDefinition 的子集

**产出**：

- 17 套 Theme JSON
- 更新后的 ThemeStore（`getThemeCSS` → `renderTheme`）
- 简化的 ThemePanel

---

### Phase 3：AI 生成升级 + Design Language 整合

**目标**：AI 生成 Theme JSON 而非 CSS；Design Language 与 Theme 建立映射，AI 排版时能感知当前主题。

#### 3.1 AI 主题生成器改造

```
改造前                              改造后
───────                            ───────
用户输入描述                        用户输入描述
    ↓                                  ↓
System Prompt: 写 CSS              System Prompt: 设计主题
    ↓                                  ↓
AI 输出: CSS 字符串                AI 输出: ThemeDefinition JSON
    ↓                                  ↓
sanitizeCss() 安全过滤             validateTheme() 结构校验
    ↓                                  ↓
填入 CSS 编辑器                    renderTheme() → CSS → 预览
```

System prompt 变化：

- 不再要求 AI "写 CSS"
- 改为要求 AI "设计一套主题"，输出结构化 JSON
- JSON schema 作为 prompt 的一部分（few-shot examples）
- AI 只需关注 Tokens（颜色/字体/间距）和 Layout Preference，组件样式用默认值

#### 3.2 Design Language 与 Theme 整合

在 `ThemeDefinition.layout` 中定义偏好，AI 排版时读取当前主题的 layout：

```typescript
// AiDesignPanel 打开时
const currentTheme = themeStore.getThemeDefinition();
const layoutPreference = currentTheme.layout;

// 注入到 analysisAgent 的 prompt 中
// "当前主题偏好: 密度=medium, 偏好组件=[quote-card, share-card], 基调=[warm, modern]"
```

Design Language 不再需要 `matchDesignLanguage()` 的自动匹配算法。改为：

- 用户选主题 → 主题自带 layout 偏好 → AI 在偏好范围内创作
- 如果用户切换主题 → 自动更换 layout 偏好

#### 3.3 组件变体扩展

扩展 `variantCss.ts`，为更多组件类型提供变体：

```
share-card: warm / minimal / tech        ← 已有
quote-card: 经典竖线 / 大引号 / 卡片式   ← 新增
cta-card:   圆角按钮 / 全宽横幅 / 胶囊    ← 新增
divider-fancy: 细线 / 渐变 / 图标式      ← 新增
```

每个变体由独立的 CSS 片段定义，通过 `data-variant` 切换。Component Library 层记录每个主题下每个组件选了哪个变体。

**产出**：

- AI 主题生成器改为输出 Theme JSON
- Design Language 合并到 Theme.layout
- 组件变体至少覆盖 8 种组件

---

## 四、改造前后架构对比

```
改造前                                    改造后
───────                                  ───────
17 套 CSS 字符串（拼接）                  17 套 ThemeDefinition JSON
    ↓                                        ↓
buildThemeCss() 拼接                     ThemeRenderer.render()
    ↓                                        ↓
getThemeCSS() 返回 CSS                  getThemeCSS() 返回 CSS
    ↓                                        ↓
ThemeProcessor.processHtml()            ThemeProcessor.processHtml()
（不变）                                  （不变）

主题管理                                  主题管理
├─ 可视化设计（编辑变量 → 生成CSS）         ├─ 可视化设计（编辑JSON → 渲染CSS）
├─ 手写 CSS（直接写CSS）     ← 删除        ├─ AI 生成（输出JSON → 渲染CSS）
└─ AI 生成（输出CSS → 过滤） ← 改造        └─ 导入/导出 Theme JSON
    （无Schema，无校验）                        （Schema 校验，结构保证）

AI 排版                                   AI 排版
├─ Design Language 独立匹配              ├─ 读取当前 Theme.layout
├─ 不知道主题的配色/字体                    ├─ 知道主题的色调和密度偏好
└─ 5 套 Design Language 硬编码             └─ Theme.layout 动态提供偏好
```

---

## 五、风险与注意事项

1. **17 套主题的 JSON 反向推导** — 把现有 CSS 拆回 Design Token 格式需要人工判断（哪些颜色是 primary、哪些是 accent）。建议先做 2-3 套验证可行性，再批量迁移。

2. **组件 CSS 的去重** — 目前 4 份组件 CSS（default/extra/faq/magazine）被所有主题共享。改造后每个主题可以有独立的组件样式覆盖。需要决策：是保留"全局默认组件样式 + 主题覆盖"还是"每个主题完整定义所有组件"？建议**前者**（默认 + 覆盖），避免 17 套主题各复制一份组件 CSS。

3. **向后兼容** — 用户已创建的自定义主题是 CSS 字符串格式。Phase 2 需要提供迁移路径：旧格式 CSS 作为 `legacyCss` 字段保留，新创建的用 JSON 格式。

4. **可视化设计器的 100+ 变量** — 目前 `DesignerVariables` 非常细粒度。改造后只需要暴露 Theme Schema 中定义的 Token（约 30-40 个），不需要全部保留。部分高级配置可以放入"展开详情"。

---

> 文档生成时间：2026-07-27 | 基于「主题系统改造方案.md」+ 现有代码深度分析
