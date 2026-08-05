# Profile 模板规范

> **核心设计原则：** Skill 不关心"你是企业还是个人"，它只关心有没有一份完整的 Profile。
> 生成逻辑只有一套，输入模板可扩展。未来增加"学校""政府""媒体"等类型，也只是新增 Profile 模板。

---

## 统一数据结构（UnifiedProfile）

所有 Profile 模板最终都映射到这个结构，生成逻辑只读这个：

```typescript
interface UnifiedProfile {
  /** Profile 来源模板 */
  profileType: "brand" | "creator";

  /** 企业名称 / 公众号名称 / 个人品牌名 */
  name: string;

  /** Logo 文件（Brand 必填；Creator 可选，没有则 AI 帮做文字 Logo） */
  logo: File | null;

  /**
   * 定位描述 — 一段话说明"你是谁、做什么、给谁看"
   * Brand: 企业简介 100~300 字
   * Creator: 内容方向 + 目标读者（如"写 AI 效率内容，面向职场人"）
   */
  positioning: string;

  /** 风格关键词 3~5 个（两种 Profile 共用同一套清单） */
  keywords: string[];

  /** 主色 #HEX（可选，"auto" = 从 Logo 提取或 AI 推荐） */
  primaryColor: string | "auto";

  /** 参考来源：官网 URL / 喜欢的网站 / 一句话描述风格（可选） */
  reference: string | null;

  /** Slogan（可选） */
  slogan: string | null;

  /** VI 手册 PDF（仅 Brand Profile，可选） */
  brandSpec: File | null;
}
```

---

## 模板 1：Brand Profile（品牌档案）

> 适合：企业、公司、品牌方
> 特征："我已经知道我要什么，你帮我实现。"

| 配置项     | 必填 | 格式                     | 说明                                |
| ---------- | ---- | ------------------------ | ----------------------------------- |
| 企业名称   | ✅   | 文本                     | 用于 meta.id 和主题命名             |
| 企业 Logo  | ✅   | PNG/SVG/JPG ≥200×200px   | 品牌识别 + 主色提取 + Header/Footer |
| 企业简介   | ✅   | 100~300 字               | 理解行业、客户群、品牌定位          |
| 品牌关键词 | ✅   | 3~5 个（从 18 词清单选） | 决定整体视觉风格和语气              |
| 品牌主色   | ◯    | `#HEX` 或 auto           | 有就填，没有从 Logo 提取            |
| 官网 URL   | ◯    | 可访问网址               | 参考风格/配色                       |
| Slogan     | ◯    | 一句话                   | 如「让数据创造价值」                |
| VI 手册    | ◯    | PDF                      | 有则严格遵循                        |

### Brand Profile 示例

```yaml
profileType: brand
name: 云帆科技
logo: logo.svg
positioning: 我们是一家专注于工业自动化的软件企业，服务制造业客户，品牌定位是专业、可靠、高效。
keywords: [专业, 科技, 创新, 可信]
primaryColor: "#1a56db"
reference: https://yunfan.example.com
slogan: 让数据创造价值
brandSpec: null
```

---

## 模板 2：Creator Profile（创作者档案）

> 适合：个人博主、自媒体、独立创作者
> 特征："我知道我要表达什么，但不知道怎么设计。"

| 配置项     | 必填 | 格式                     | 说明                          |
| ---------- | ---- | ------------------------ | ----------------------------- |
| 公众号名称 | ✅   | 文本                     | 用于 meta.id 和主题命名       |
| 内容方向   | ✅   | 选一个类目               | 决定排版基调和组件选择        |
| 风格关键词 | ✅   | 3~5 个（从 18 词清单选） | 决定整体视觉风格和语气        |
| 主色       | ◯    | `#HEX` 或 auto           | 有就填，AI 按关键词推荐       |
| Logo       | ◯    | PNG/SVG/JPG              | 没有则 AI 帮做文字 Logo       |
| 参考风格   | ◯    | URL 或一句话描述         | 如「喜欢 Apple 官网这种感觉」 |
| Slogan     | ◯    | 一句话                   |                               |

### 内容方向类目（Creator 专有）

```
科技  ·  AI  ·  投资  ·  情感  ·  生活  ·  摄影
美食  ·  母婴  ·  教育  ·  职场  ·  阅读  ·  旅行
```

> 选定后 AI 会推荐配套关键词组合（见 brand-keywords.md 的「创作者内容方向推荐」表）。

### Creator Profile 示例

```yaml
profileType: creator
name: AI效率实验室
logo: null
positioning: 写 AI + 效率方向内容，面向职场人
keywords: [专业, 极简, 高级]
primaryColor: auto
reference: 喜欢 Apple 官网这种感觉
slogan: null
brandSpec: null
```

---

## 两种模板的差异对照

| 配置项    | Brand Profile            | Creator Profile              |
| --------- | ------------------------ | ---------------------------- |
| 名称      | 企业名称                 | 公众号名称                   |
| Logo      | **必填**                 | 可选（没有 AI 做文字 Logo）  |
| 定位      | 企业简介 100~300字       | 内容方向（选类目 + 一句话）  |
| 关键词    | 品牌关键词               | 风格关键词（同一套清单）     |
| 主色      | 品牌色（或从 Logo 提取） | 喜欢的颜色（或 AI 推荐）     |
| 参考      | 官网 / VI 手册           | 喜欢的公众号 / 网站 / 一句话 |
| Slogan    | 可选                     | 可选                         |
| VI 手册   | 可选                     | —                            |
| brand.md  | ✅ 写品牌语气+排版偏好   | ❌ 不写（个人无品牌语气）    |
| Logo 内嵌 | ✅ 内嵌到 assets         | 看用户提供                   |

---

## 生成逻辑如何使用 Profile

```
UnifiedProfile
      │
      ▼
  keywords (3~5 个)
      │
      ├──→ layout.tone        （关键词→tone 映射表）
      ├──→ layout.density     （关键词→density 映射表）
      ├──→ tokens.color       （主色来自 primaryColor 或 Logo）
      ├──→ typography         （关键词→字体族/字重/字号）
      ├──→ components.variantCss （关键词→优先定制组件表）
      └──→ brand.md           （仅 Brand Profile 且有简介/Slogan 时）
```

**无论 Profile 来自哪个模板，进入生成逻辑后的处理完全一致。**

---

## 未来扩展（不在 V2.1 范围内）

新增类型只需：

1. 定义新的 Profile 模板（字段映射到 UnifiedProfile）
2. 如有特殊需求，在生成逻辑中加条件分支
3. 不需要改核心生成管线

可能的方向：

- **Edu Profile**（教育机构）— 加校徽、院系色、学术排版偏好
- **Media Profile**（媒体机构）— 加版权声明样式、多作者排版
- **Gov Profile**（政府机构）— 加公文格式约束、红色主色规范
