# 字节跳动品牌主题 · AI 设计推理生成脚本（7 批 44 组件）
# 使用方法：在 pwsh 7 中执行:
#   cd e:\11自动工作流\wd\skills\wemd-theme-designer\services ; pwsh -File ..\test\run-bytedance-pipeline.ps1

$ErrorActionPreference = "Stop"
$PROJECT_ID = "字节跳动"
$BASE = "http://127.0.0.1:3456/api/projects/$PROJECT_ID"

function Invoke-AiSave($batch, $isLastBatch, $blueprint, $components) {
  $body = @{ batch = $batch; isLastBatch = $isLastBatch; blueprint = $blueprint; components = $components }
  $json = $body | ConvertTo-Json -Depth 10 -Compress
  $resp = Invoke-RestMethod -Uri "$BASE/ai-save" -Method Post -Body $json -ContentType "application/json; charset=utf-8" -TimeoutSec 30
  Write-Host "  ✅ $batch`: $($resp.message)"
  return $resp
}

Write-Host "========== 字节跳动品牌主题 · AI 全量生成 开始 =========="

# 公共 CSS 变量设计（字节跳动：抖音红+紫蓝渐变）
$VARS = @"
  --wemd-primary: #FE2C55;
  --wemd-primary-light: #FF5B7E;
  --wemd-primary-dark: #E0254A;
  --wemd-accent: #3370FF;
  --wemd-accent-light: #6D94FF;
  --wemd-success: #10B981;
  --wemd-warning: #F59E0B;
  --wemd-error: #EF4444;
  --wemd-bg: #FFFFFF;
  --wemd-bg-alt: #F7F8FA;
  --wemd-bg-gradient: linear-gradient(135deg, #FE2C55 0%, #3370FF 100%);
  --wemd-text: #1A1A1A;
  --wemd-text-muted: #6B7280;
  --wemd-text-on-dark: #FFFFFF;
  --wemd-border: #E5E7EB;
  --wemd-border-light: #F3F4F6;
  --wemd-font-sans: -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", "Noto Sans SC", sans-serif;
  --wemd-font-mono: "JetBrains Mono", "SF Mono", Consolas, monospace;
  --wemd-radius-sm: 6px;
  --wemd-radius-md: 12px;
  --wemd-radius-lg: 18px;
  --wemd-radius-xl: 24px;
  --wemd-shadow-sm: 0 1px 3px rgba(254, 44, 85, 0.08);
  --wemd-shadow-md: 0 8px 24px rgba(51, 112, 255, 0.12);
  --wemd-shadow-lg: 0 16px 48px rgba(254, 44, 85, 0.18);
"@

$DESIGN_BLUEPRINT = @{
  profileType = "brand"
  brandName = "字节跳动"
  themeId = "bytedance-neon-tech-2026"
  themeName = "字节跳动 · 霓虹科技风"
  variantPrefix = "bytedance"
  readingExperience = @{
    fontSize = "16px"
    lineHeight = "1.8"
    letterSpacing = "0.5px"
    paragraphSpacing = "24px"
    columnWidth = "720px"
  }
  expression = @{
    tone = "活力科技感";
    intimacy = "专业对话感";
    energy = "高张力";
  }
  brandStrategy = @{
    principles = @(
      "永远保持抖音红→紫蓝的霓虹渐变作为品牌识别锚点",
      "大胆留白配合少量高饱和配色，制造年轻活力节奏感",
      "卡片采用大圆角+柔和阴影，传达科技产品亲和感",
      "所有 CTA 按钮使用品牌渐变背景，点击即识别"
    )
    logoPosition = "hero-banner 顶部居中 + brand-sign 独立小卡片"
    sloganPosition = "hero-banner 副标题 + end-card 主 slogan"
  }
  colorPalette = @{
    primary = "#FE2C55"
    primaryLight = "#FF5B7E"
    primaryDark = "#E0254A"
    accent = "#3370FF"
    accentLight = "#6D94FF"
    bg = "#FFFFFF"
    bgAlt = "#F7F8FA"
    text = "#1A1A1A"
    textMuted = "#6B7280"
    border = "#E5E7EB"
    gradientMain = "linear-gradient(135deg, #FE2C55 0%, #3370FF 100%)"
    gradientSoft = "linear-gradient(135deg, rgba(254,44,85,0.10) 0%, rgba(51,112,255,0.10) 100%)"
  }
  typography = @{
    headingFont = "PingFang SC, Microsoft YaHei, sans-serif"
    headingWeight = "800"
    headingColor = "#1A1A1A"
    headingGradient = "linear-gradient(135deg, #FE2C55 0%, #3370FF 100%)"
    bodyFont = $VARS.Split("`n") | Where-Object { $_ -match "font-sans" }
    bodySize = "16px"
  }
  layoutStrategy = @{
    pageStructure = "封面大图+品牌数据区块+正文卡片交替+强收尾"
    paragraphStyle = "短段落，多留白，卡片穿插"
    hierarchy = "h1 渐变字大标题，h2 带左侧霓虹竖条"
  }
  decorationStrategy = @{
    pattern = "品牌主色小色块渐变斜角装饰"
    density = "medium"
    decorationLevel = "moderate"
    cornerStyle = "rounded"
    accentBars = "每个容器左上角1条24px高宽3px渐变竖条"
  }
  tokens = @{ varsCss = $VARS }
}

# ========== 第 1 批：signature 组（hero-banner, magazine-cover, end-card, brand-sign）==========
Write-Host "`n[批次 1/7] signature 组..."

$batch1 = @(
  @{
    type = "hero-banner"
    variant = "bytedance-hero-neon"
    variantCss = @"
:global(.wemd-theme__bytedance-hero-neon) { $VARS }
:global(.wemd-theme__bytedance-hero-neon) .wemd-hero-banner {
  position: relative;
  border-radius: var(--wemd-radius-xl);
  padding: 72px 40px 56px 40px;
  background: var(--wemd-bg-gradient);
  color: var(--wemd-text-on-dark);
  overflow: hidden;
  text-align: center;
  box-shadow: var(--wemd-shadow-lg);
}
:global(.wemd-theme__bytedance-hero-neon) .wemd-hero-banner::before {
  content: "";
  position: absolute;
  top: -120px; right: -120px;
  width: 360px; height: 360px;
  border-radius: 50%;
  background: rgba(255,255,255,0.14);
}
:global(.wemd-theme__bytedance-hero-neon) .wemd-hero-banner::after {
  content: "";
  position: absolute;
  bottom: -80px; left: -80px;
  width: 280px; height: 280px;
  border-radius: 50%;
  background: rgba(255,255,255,0.10);
}
:global(.wemd-theme__bytedance-hero-neon) .wemd-hero-logo {
  position: relative; z-index: 2;
  height: 64px;
  margin: 0 auto 24px auto;
  display: block;
}
:global(.wemd-theme__bytedance-hero-neon) .wemd-hero-title {
  position: relative; z-index: 2;
  font-family: var(--wemd-font-sans);
  font-weight: 900;
  font-size: 44px;
  line-height: 1.2;
  margin: 0 0 18px 0;
  letter-spacing: -0.5px;
}
:global(.wemd-theme__bytedance-hero-neon) .wemd-hero-slogan {
  position: relative; z-index: 2;
  font-size: 20px;
  opacity: 0.95;
  margin: 0;
  font-weight: 400;
}
"@
    sourceHtml = @"
<section class=&quot;wemd-hero-banner&quot; data-variant=&quot;bytedance-hero-neon&quot;>
  <img class=&quot;wemd-hero-logo&quot; src=&quot;{{logo}}&quot; alt=&quot;字节跳动&quot; />
  <h1 class=&quot;wemd-hero-title&quot;>{{主标题}}</h1>
  <p class=&quot;wemd-hero-slogan&quot;>{{副标题 / Slogan}}</p>
</section>
"@
    instruction = "字节跳动品牌英雄横幅：抖音红→紫蓝霓虹渐变背景 + 圆形柔光球装饰 + 居中Logo + 超大加粗主标题 + Slogan副标题"
  },
  @{
    type = "magazine-cover"
    variant = "bytedance-cover-editorial"
    variantCss = @"
:global(.wemd-theme__bytedance-cover-editorial) { $VARS }
:global(.wemd-theme__bytedance-cover-editorial) .wemd-magazine-cover {
  position: relative;
  border-radius: var(--wemd-radius-xl);
  padding: 64px 48px;
  background: var(--wemd-bg);
  border: 1px solid var(--wemd-border-light);
  box-shadow: var(--wemd-shadow-md);
  overflow: hidden;
}
:global(.wemd-theme__bytedance-cover-editorial) .wemd-magazine-cover::before {
  content: "";
  position: absolute;
  top: 0; left: 0;
  width: 6px; height: 100%;
  background: var(--wemd-bg-gradient);
}
:global(.wemd-theme__bytedance-cover-editorial) .wemd-cover-kicker {
  font-family: var(--wemd-font-mono);
  font-size: 12px;
  letter-spacing: 4px;
  color: var(--wemd-primary);
  text-transform: uppercase;
  margin: 0 0 20px 0;
  font-weight: 700;
}
:global(.wemd-theme__bytedance-cover-editorial) .wemd-cover-title {
  font-family: var(--wemd-font-sans);
  font-weight: 900;
  font-size: 56px;
  line-height: 1.05;
  margin: 0 0 24px 0;
  background: var(--wemd-heading-gradient);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
:global(.wemd-theme__bytedance-cover-editorial) .wemd-cover-desc {
  font-size: 17px;
  color: var(--wemd-text-muted);
  line-height: 1.75;
  margin: 0 0 28px 0;
  max-width: 560px;
}
:global(.wemd-theme__bytedance-cover-editorial) .wemd-cover-meta {
  display: flex;
  gap: 24px;
  align-items: center;
  flex-wrap: wrap;
}
:global(.wemd-theme__bytedance-cover-editorial) .wemd-meta-tag {
  padding: 6px 14px;
  border-radius: 999px;
  background: var(--wemd-gradientSoft);
  color: var(--wemd-primary);
  font-weight: 600;
  font-size: 13px;
}
"@
    sourceHtml = @"
<section class=&quot;wemd-magazine-cover&quot; data-variant=&quot;bytedance-cover-editorial&quot;>
  <p class=&quot;wemd-cover-kicker&quot;>BYTEDANCE · ISSUE {{期数}}</p>
  <h1 class=&quot;wemd-cover-title&quot;>{{文章主标题}}</h1>
  <p class=&quot;wemd-cover-desc&quot;>{{导语 / 摘要段落}}</p>
  <div class=&quot;wemd-cover-meta&quot;>
    <span class=&quot;wemd-meta-tag&quot;>{{标签1}}</span>
    <span class=&quot;wemd-meta-tag&quot;>{{标签2}}</span>
    <span class=&quot;wemd-meta-tag&quot;>发布于 {{日期}}</span>
  </div>
</section>
"@
    instruction = "杂志封面式头图：左侧6px霓虹渐变竖条 + 英文小写字距大kicker + 渐变超大标题 + 摘要段落 + 圆角标签元信息"
  },
  @{
    type = "end-card"
    variant = "bytedance-end-final"
    variantCss = @"
:global(.wemd-theme__bytedance-end-final) { $VARS }
:global(.wemd-theme__bytedance-end-final) .wemd-end-card {
  margin-top: 64px;
  padding: 56px 40px;
  border-radius: var(--wemd-radius-xl);
  background: var(--wemd-bg-gradient);
  color: var(--wemd-text-on-dark);
  text-align: center;
  position: relative;
  overflow: hidden;
  box-shadow: var(--wemd-shadow-lg);
}
:global(.wemd-theme__bytedance-end-final) .wemd-end-card::before {
  content: "";
  position: absolute;
  top: -60%; left: -20%;
  width: 60%; height: 220%;
  background: linear-gradient(120deg, transparent 40%, rgba(255,255,255,0.18) 50%, transparent 60%);
  transform: rotate(8deg);
}
:global(.wemd-theme__bytedance-end-final) .wemd-end-slogan {
  position: relative; z-index: 2;
  font-size: 32px;
  font-weight: 900;
  margin: 0 0 12px 0;
  letter-spacing: 1px;
}
:global(.wemd-theme__bytedance-end-final) .wemd-end-brand {
  position: relative; z-index: 2;
  font-family: var(--wemd-font-mono);
  font-size: 13px;
  letter-spacing: 3px;
  opacity: 0.9;
  margin: 0 0 28px 0;
  text-transform: uppercase;
}
:global(.wemd-theme__bytedance-end-final) .wemd-end-cta-row {
  position: relative; z-index: 2;
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
}
:global(.wemd-theme__bytedance-end-final) .wemd-cta-btn {
  padding: 12px 28px;
  border-radius: 999px;
  background: rgba(255,255,255,0.22);
  color: var(--wemd-text-on-dark);
  font-weight: 700;
  font-size: 15px;
  backdrop-filter: blur(4px);
  border: 1px solid rgba(255,255,255,0.3);
}
:global(.wemd-theme__bytedance-end-final) .wemd-cta-btn.primary {
  background: var(--wemd-text-on-dark);
  color: var(--wemd-primary);
}
"@
    sourceHtml = @"
<section class=&quot;wemd-end-card&quot; data-variant=&quot;bytedance-end-final&quot;>
  <h2 class=&quot;wemd-end-slogan&quot;>激发创造，丰富生活</h2>
  <p class=&quot;wemd-end-brand&quot;>BYTE DANCE</p>
  <div class=&quot;wemd-end-cta-row&quot;>
    <span class=&quot;wemd-cta-btn primary&quot;>关注官方账号</span>
    <span class=&quot;wemd-cta-btn&quot;>查看更多文章</span>
  </div>
</section>
"@
    instruction = "文章结尾卡：抖音红紫蓝渐变+斜向扫光+超大品牌slogan+BYTE英文小字+两个胶囊按钮"
  },
  @{
    type = "brand-sign"
    variant = "bytedance-sign-mini"
    variantCss = @"
:global(.wemd-theme__bytedance-sign-mini) { $VARS }
:global(.wemd-theme__bytedance-sign-mini) .wemd-brand-sign {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 8px 18px 8px 8px;
  border-radius: 999px;
  background: var(--wemd-bg);
  border: 1px solid var(--wemd-border-light);
  box-shadow: var(--wemd-shadow-sm);
}
:global(.wemd-theme__bytedance-sign-mini) .wemd-sign-logo {
  width: 36px; height: 36px;
  border-radius: 10px;
  background: var(--wemd-bg-gradient);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: white;
  font-weight: 900;
  font-size: 18px;
}
:global(.wemd-theme__bytedance-sign-mini) .wemd-sign-text {
  display: flex;
  flex-direction: column;
  line-height: 1.15;
}
:global(.wemd-theme__bytedance-sign-mini) .wemd-sign-name {
  font-size: 15px;
  font-weight: 800;
  color: var(--wemd-text);
}
:global(.wemd-theme__bytedance-sign-mini) .wemd-sign-en {
  font-family: var(--wemd-font-mono);
  font-size: 10px;
  letter-spacing: 1.5px;
  color: var(--wemd-text-muted);
  text-transform: uppercase;
}
"@
    sourceHtml = @"
<span class=&quot;wemd-brand-sign&quot; data-variant=&quot;bytedance-sign-mini&quot;>
  <span class=&quot;wemd-sign-logo&quot;>D</span>
  <span class=&quot;wemd-sign-text&quot;>
    <span class=&quot;wemd-sign-name&quot;>字节跳动</span>
    <span class=&quot;wemd-sign-en&quot;>ByteDance</span>
  </span>
</span>
"@
    instruction = "品牌标识小挂件：胶囊形圆角白底+渐变方形Logo（D字）+ 中文名+英文名，可嵌入任何段落中"
  }
)

Invoke-AiSave -batch "signature" -isLastBatch $false -blueprint $DESIGN_BLUEPRINT -components $batch1

Write-Host "`n[批次 2/7] heading 组..."

$batch2 = @(
  @{
    type = "numbered-heading"
    variant = "bytedance-num-grad"
    variantCss = @"
:global(.wemd-theme__bytedance-num-grad) { $VARS }
:global(.wemd-theme__bytedance-num-grad) .wemd-numbered-heading {
  display: flex;
  gap: 18px;
  align-items: flex-start;
  margin: 48px 0 20px 0;
}
:global(.wemd-theme__bytedance-num-grad) .wemd-num {
  flex-shrink: 0;
  width: 48px; height: 48px;
  border-radius: var(--wemd-radius-md);
  background: var(--wemd-bg-gradient);
  color: var(--wemd-text-on-dark);
  font-weight: 900;
  font-size: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--wemd-shadow-sm);
}
:global(.wemd-theme__bytedance-num-grad) .wemd-num-title {
  flex: 1;
  font-family: var(--wemd-font-sans);
  font-weight: 800;
  font-size: 26px;
  line-height: 1.3;
  color: var(--wemd-text);
  margin: 4px 0 0 0;
}
:global(.wemd-theme__bytedance-num-grad) .wemd-num-title em {
  font-style: normal;
  background: var(--wemd-heading-gradient);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
"@
    sourceHtml = @"
<h2 class=&quot;wemd-numbered-heading&quot; data-variant=&quot;bytedance-num-grad&quot;>
  <span class=&quot;wemd-num&quot;>{{序号}}</span>
  <span class=&quot;wemd-num-title&quot;>{{标题，<em>重点词渐变</em>}}</span>
</h2>
"@
    instruction = "数字编号标题：48x48渐变数字块（圆角）+ 右侧超大标题，支持em包裹的重点词渐变"
  },
  @{
    type = "section-title"
    variant = "bytedance-sec-accent"
    variantCss = @"
:global(.wemd-theme__bytedance-sec-accent) { $VARS }
:global(.wemd-theme__bytedance-sec-accent) .wemd-section-title {
  position: relative;
  margin: 40px 0 20px 0;
  padding-left: 18px;
}
:global(.wemd-theme__bytedance-sec-accent) .wemd-section-title::before {
  content: "";
  position: absolute;
  top: 6px; left: 0;
  width: 4px; height: calc(100% - 12px);
  border-radius: 4px;
  background: var(--wemd-bg-gradient);
}
:global(.wemd-theme__bytedance-sec-accent) .wemd-sec-label {
  display: block;
  font-family: var(--wemd-font-mono);
  font-size: 11px;
  letter-spacing: 3px;
  color: var(--wemd-primary);
  text-transform: uppercase;
  font-weight: 700;
  margin: 0 0 6px 0;
}
:global(.wemd-theme__bytedance-sec-accent) .wemd-sec-title {
  font-family: var(--wemd-font-sans);
  font-weight: 800;
  font-size: 22px;
  color: var(--wemd-text);
  margin: 0;
}
"@
    sourceHtml = @"
<div class=&quot;wemd-section-title&quot; data-variant=&quot;bytedance-sec-accent&quot;>
  <span class=&quot;wemd-sec-label&quot;>{{SECTION / 英文分组}}</span>
  <h3 class=&quot;wemd-sec-title&quot;>{{章节标题}}</h3>
</div>
"@
    instruction = "小节标题：左侧4px渐变竖条 + 英文小字大写kicker + 加粗章节标题"
  },
  @{
    type = "section-divider"
    variant = "bytedance-divider-line"
    variantCss = @"
:global(.wemd-theme__bytedance-divider-line) { $VARS }
:global(.wemd-theme__bytedance-divider-line) .wemd-section-divider {
  display: flex;
  align-items: center;
  gap: 14px;
  margin: 36px 0;
  color: var(--wemd-text-muted);
}
:global(.wemd-theme__bytedance-divider-line) .wemd-dot {
  flex-shrink: 0;
  width: 8px; height: 8px;
  border-radius: 50%;
  background: var(--wemd-bg-gradient);
  box-shadow: 0 0 0 4px rgba(254, 44, 85, 0.12);
}
:global(.wemd-theme__bytedance-divider-line) .wemd-line {
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, var(--wemd-primary) 0%, var(--wemd-border-light) 100%);
  opacity: 0.6;
}
:global(.wemd-theme__bytedance-divider-line) .wemd-line.right {
  background: linear-gradient(90deg, var(--wemd-border-light) 0%, var(--wemd-accent) 100%);
}
:global(.wemd-theme__bytedance-divider-line) .wemd-label {
  font-family: var(--wemd-font-mono);
  font-size: 11px;
  letter-spacing: 2px;
  font-weight: 700;
  color: var(--wemd-text-muted);
  text-transform: uppercase;
}
"@
    sourceHtml = @"
<div class=&quot;wemd-section-divider&quot; data-variant=&quot;bytedance-divider-line&quot;>
  <span class=&quot;wemd-line&quot;></span>
  <span class=&quot;wemd-dot&quot;></span>
  <span class=&quot;wemd-label&quot;>{{分隔文字 · 可选}}</span>
  <span class=&quot;wemd-dot&quot;></span>
  <span class=&quot;wemd-line right&quot;></span>
</div>
"@
    instruction = "分隔线标题：左右两条渐变线（左红→白，右白→蓝）+ 两个渐变圆点+光晕 + 中间英文大写小标"
  },
  @{
    type = "toc-nav"
    variant = "bytedance-toc-pill"
    variantCss = @"
:global(.wemd-theme__bytedance-toc-pill) { $VARS }
:global(.wemd-theme__bytedance-toc-pill) .wemd-toc-nav {
  margin: 32px 0;
  padding: 24px 28px;
  border-radius: var(--wemd-radius-lg);
  background: var(--wemd-bg-alt);
  border: 1px solid var(--wemd-border-light);
}
:global(.wemd-theme__bytedance-toc-pill) .wemd-toc-title {
  font-family: var(--wemd-font-mono);
  font-size: 12px;
  letter-spacing: 3px;
  color: var(--wemd-primary);
  font-weight: 700;
  margin: 0 0 16px 0;
  text-transform: uppercase;
}
:global(.wemd-theme__bytedance-toc-pill) .wemd-toc-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
:global(.wemd-theme__bytedance-toc-pill) .wemd-toc-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 10px 16px;
  border-radius: var(--wemd-radius-md);
  background: var(--wemd-bg);
  font-size: 15px;
  font-weight: 600;
  color: var(--wemd-text);
  transition: all .2s;
}
:global(.wemd-theme__bytedance-toc-pill) .wemd-toc-item:hover {
  background: var(--wemd-gradientSoft);
  color: var(--wemd-primary);
}
:global(.wemd-theme__bytedance-toc-pill) .wemd-toc-num {
  flex-shrink: 0;
  width: 26px; height: 26px;
  border-radius: 8px;
  background: var(--wemd-bg-gradient);
  color: var(--wemd-text-on-dark);
  font-weight: 800;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}
"@
    sourceHtml = @"
<nav class=&quot;wemd-toc-nav&quot; data-variant=&quot;bytedance-toc-pill&quot;>
  <p class=&quot;wemd-toc-title&quot;>CONTENTS · 目录</p>
  <ol class=&quot;wemd-toc-list&quot;>
    <li class=&quot;wemd-toc-item&quot;><span class=&quot;wemd-toc-num&quot;>01</span>{{第一章标题}}</li>
    <li class=&quot;wemd-toc-item&quot;><span class=&quot;wemd-toc-num&quot;>02</span>{{第二章标题}}</li>
    <li class=&quot;wemd-toc-item&quot;><span class=&quot;wemd-toc-num&quot;>03</span>{{第三章标题}}</li>
  </ol>
</nav>
"@
    instruction = "目录导航：灰底圆角卡片 + 英文CONTENTS标题 + 每个条目白底胶囊+渐变序号小方块+hover染浅色"
  }
)

Invoke-AiSave -batch "heading" -isLastBatch $false -blueprint $null -components $batch2

Write-Host "`n[批次 3/7] container 组（10个卡片）..."

$batch3 = @(
  @{
    type = "text-card"
    variant = "bytedance-text-simple"
    variantCss = @"
:global(.wemd-theme__bytedance-text-simple) { $VARS }
:global(.wemd-theme__bytedance-text-simple) .wemd-text-card {
  position: relative;
  margin: 24px 0;
  padding: 24px 28px;
  border-radius: var(--wemd-radius-lg);
  background: var(--wemd-bg);
  border: 1px solid var(--wemd-border-light);
  box-shadow: var(--wemd-shadow-sm);
  overflow: hidden;
}
:global(.wemd-theme__bytedance-text-simple) .wemd-text-card::before {
  content: "";
  position: absolute;
  top: 0; left: 0;
  width: 4px; height: 100%;
  background: var(--wemd-bg-gradient);
}
:global(.wemd-theme__bytedance-text-simple) .wemd-card-title {
  font-weight: 800;
  font-size: 18px;
  margin: 0 0 12px 0;
  color: var(--wemd-text);
}
:global(.wemd-theme__bytedance-text-simple) .wemd-card-body {
  font-size: 15px;
  line-height: 1.8;
  color: var(--wemd-text-muted);
  margin: 0;
}
:global(.wemd-theme__bytedance-text-simple) .wemd-card-body strong {
  color: var(--wemd-primary);
  font-weight: 700;
}
"@
    sourceHtml = @"
<div class=&quot;wemd-text-card&quot; data-variant=&quot;bytedance-text-simple&quot;>
  <h4 class=&quot;wemd-card-title&quot;>{{卡片标题}}</h4>
  <p class=&quot;wemd-card-body&quot;>正文内容，<strong>重点词</strong>使用品牌红高亮显示。多段落……</p>
</div>
"@
    instruction = "文本卡：白底+左侧4px渐变竖条+圆角阴影+加粗标题+正文（strong变品牌红）"
  },
  @{
    type = "image-card"
    variant = "bytedance-img-frame"
    variantCss = @"
:global(.wemd-theme__bytedance-img-frame) { $VARS }
:global(.wemd-theme__bytedance-img-frame) .wemd-image-card {
  margin: 24px 0;
  border-radius: var(--wemd-radius-lg);
  overflow: hidden;
  background: var(--wemd-bg);
  border: 1px solid var(--wemd-border-light);
  box-shadow: var(--wemd-shadow-md);
}
:global(.wemd-theme__bytedance-img-frame) .wemd-img-wrap {
  width: 100%;
  aspect-ratio: 16 / 9;
  background: var(--wemd-gradientSoft);
  position: relative;
  overflow: hidden;
}
:global(.wemd-theme__bytedance-img-frame) .wemd-img-wrap img {
  width: 100%; height: 100%;
  object-fit: cover;
  display: block;
}
:global(.wemd-theme__bytedance-img-frame) .wemd-img-caption {
  padding: 14px 22px 18px 22px;
}
:global(.wemd-theme__bytedance-img-frame) .wemd-caption-label {
  font-family: var(--wemd-font-mono);
  font-size: 10px;
  letter-spacing: 2px;
  color: var(--wemd-accent);
  text-transform: uppercase;
  font-weight: 700;
  margin: 0 0 4px 0;
}
:global(.wemd-theme__bytedance-img-frame) .wemd-caption-text {
  font-size: 14px;
  color: var(--wemd-text-muted);
  margin: 0;
  line-height: 1.6;
}
"@
    sourceHtml = @"
<figure class=&quot;wemd-image-card&quot; data-variant=&quot;bytedance-img-frame&quot;>
  <div class=&quot;wemd-img-wrap&quot;><img src=&quot;{{图片URL}}&quot; alt=&quot;{{alt}}&quot; /></div>
  <figcaption class=&quot;wemd-img-caption&quot;>
    <p class=&quot;wemd-caption-label&quot;>FIG · 图注编号</p>
    <p class=&quot;wemd-caption-text&quot;>{{图片说明文字}}</p>
  </figcaption>
</figure>
"@
    instruction = "图片卡：16:9图框+圆角阴影包边+FIG小写字标+下方蓝色图注编号+说明"
  },
  @{
    type = "product-card"
    variant = "bytedance-product"
    variantCss = @"
:global(.wemd-theme__bytedance-product) { $VARS }
:global(.wemd-theme__bytedance-product) .wemd-product-card {
  margin: 24px 0;
  border-radius: var(--wemd-radius-lg);
  overflow: hidden;
  background: var(--wemd-bg);
  border: 1px solid var(--wemd-border-light);
  box-shadow: var(--wemd-shadow-sm);
}
:global(.wemd-theme__bytedance-product) .wemd-product-head {
  padding: 20px 24px 0 24px;
  display: flex;
  align-items: center;
  gap: 14px;
}
:global(.wemd-theme__bytedance-product) .wemd-product-logo {
  width: 56px; height: 56px;
  border-radius: var(--wemd-radius-md);
  background: var(--wemd-bg-gradient);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 900;
  font-size: 22px;
  flex-shrink: 0;
}
:global(.wemd-theme__bytedance-product) .wemd-product-name {
  font-weight: 800;
  font-size: 19px;
  color: var(--wemd-text);
  margin: 0;
}
:global(.wemd-theme__bytedance-product) .wemd-product-tag {
  display: inline-block;
  margin-top: 4px;
  padding: 3px 10px;
  border-radius: 999px;
  background: var(--wemd-gradientSoft);
  color: var(--wemd-primary);
  font-size: 12px;
  font-weight: 700;
}
:global(.wemd-theme__bytedance-product) .wemd-product-body {
  padding: 18px 24px 24px 24px;
  font-size: 15px;
  line-height: 1.8;
  color: var(--wemd-text-muted);
  margin: 0;
}
"@
    sourceHtml = @"
<div class=&quot;wemd-product-card&quot; data-variant=&quot;bytedance-product&quot;>
  <div class=&quot;wemd-product-head&quot;>
    <span class=&quot;wemd-product-logo&quot;>{{产品字母}}</span>
    <div>
      <h4 class=&quot;wemd-product-name&quot;>{{产品名称}}</h4>
      <span class=&quot;wemd-product-tag&quot;>{{标签 · 短视频}}</span>
    </div>
  </div>
  <p class=&quot;wemd-product-body&quot;>{{产品介绍正文}}</p>
</div>
"@
    instruction = "产品展示卡：渐变方块产品Logo+名称+胶囊标签+下方正文介绍"
  },
  @{
    type = "testimonial-card"
    variant = "bytedance-quote-user"
    variantCss = @"
:global(.wemd-theme__bytedance-quote-user) { $VARS }
:global(.wemd-theme__bytedance-quote-user) .wemd-testimonial-card {
  margin: 24px 0;
  padding: 28px 28px 24px 28px;
  border-radius: var(--wemd-radius-lg);
  background: var(--wemd-bg-alt);
  position: relative;
}
:global(.wemd-theme__bytedance-quote-user) .wemd-quote-mark {
  position: absolute;
  top: 12px; right: 20px;
  font-size: 80px;
  line-height: 1;
  color: var(--wemd-primary);
  opacity: 0.08;
  font-family: Georgia, serif;
  font-weight: 900;
}
:global(.wemd-theme__bytedance-quote-user) .wemd-testimonial-text {
  font-size: 16px;
  line-height: 1.85;
  color: var(--wemd-text);
  margin: 0 0 20px 0;
  font-weight: 500;
}
:global(.wemd-theme__bytedance-quote-user) .wemd-testimonial-user {
  display: flex;
  align-items: center;
  gap: 12px;
}
:global(.wemd-theme__bytedance-quote-user) .wemd-avatar {
  width: 40px; height: 40px;
  border-radius: 50%;
  background: var(--wemd-bg-gradient);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
}
:global(.wemd-theme__bytedance-quote-user) .wemd-user-name {
  font-weight: 800;
  font-size: 14px;
  color: var(--wemd-text);
  margin: 0;
}
:global(.wemd-theme__bytedance-quote-user) .wemd-user-role {
  font-size: 12px;
  color: var(--wemd-text-muted);
  margin: 2px 0 0 0;
}
"@
    sourceHtml = @"
<div class=&quot;wemd-testimonial-card&quot; data-variant=&quot;bytedance-quote-user&quot;>
  <span class=&quot;wemd-quote-mark&quot;>&ldquo;</span>
  <p class=&quot;wemd-testimonial-text&quot;>这是一段用户 / 合作伙伴的引言推荐……</p>
  <div class=&quot;wemd-testimonial-user&quot;>
    <span class=&quot;wemd-avatar&quot;>{{姓氏首字母}}</span>
    <div>
      <p class=&quot;wemd-user-name&quot;>{{姓名}}</p>
      <p class=&quot;wemd-user-role&quot;>{{公司 · 职位}}</p>
    </div>
  </div>
</div>
"@
    instruction = "证言/用户评价卡：淡灰底+右上角巨大淡红色引号水印+引言+圆形渐变头像+用户名/职位"
  },
  @{
    type = "author-card"
    variant = "bytedance-author"
    variantCss = @"
:global(.wemd-theme__bytedance-author) { $VARS }
:global(.wemd-theme__bytedance-author) .wemd-author-card {
  margin: 24px 0;
  padding: 24px;
  border-radius: var(--wemd-radius-lg);
  background: var(--wemd-bg);
  border: 1px solid var(--wemd-border-light);
  box-shadow: var(--wemd-shadow-sm);
  display: flex;
  gap: 18px;
  align-items: center;
}
:global(.wemd-theme__bytedance-author) .wemd-author-avatar {
  width: 72px; height: 72px;
  border-radius: 50%;
  flex-shrink: 0;
  background: var(--wemd-bg-gradient);
  color: white;
  font-weight: 900;
  font-size: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 0 4px var(--wemd-gradientSoft);
}
:global(.wemd-theme__bytedance-author) .wemd-author-info {
  flex: 1;
  min-width: 0;
}
:global(.wemd-theme__bytedance-author) .wemd-author-name {
  font-size: 18px;
  font-weight: 800;
  color: var(--wemd-text);
  margin: 0 0 4px 0;
}
:global(.wemd-theme__bytedance-author) .wemd-author-role {
  font-size: 13px;
  color: var(--wemd-primary);
  font-weight: 600;
  margin: 0 0 8px 0;
}
:global(.wemd-theme__bytedance-author) .wemd-author-bio {
  font-size: 14px;
  line-height: 1.7;
  color: var(--wemd-text-muted);
  margin: 0;
}
"@
    sourceHtml = @"
<div class=&quot;wemd-author-card&quot; data-variant=&quot;bytedance-author&quot;>
  <span class=&quot;wemd-author-avatar&quot;>{{作字头}}</span>
  <div class=&quot;wemd-author-info&quot;>
    <h4 class=&quot;wemd-author-name&quot;>{{作者姓名}}</h4>
    <p class=&quot;wemd-author-role&quot;>{{身份 · 品牌官方}}</p>
    <p class=&quot;wemd-author-bio&quot;>{{作者简介 / 一句话}}</p>
  </div>
</div>
"@
    instruction = "作者信息卡：大号渐变圆形头像（外层4px淡色光晕圈）+ 姓名+红色身份标签+简介"
  },
  @{
    type = "quote-card"
    variant = "bytedance-quote"
    variantCss = @"
:global(.wemd-theme__bytedance-quote) { $VARS }
:global(.wemd-theme__bytedance-quote) .wemd-quote-card {
  position: relative;
  margin: 28px 0;
  padding: 28px 32px 28px 72px;
  border-radius: var(--wemd-radius-lg);
  background: linear-gradient(135deg, rgba(254,44,85,0.06) 0%, rgba(51,112,255,0.06) 100%);
  overflow: hidden;
}
:global(.wemd-theme__bytedance-quote) .wemd-quote-mark {
  position: absolute;
  top: 18px; left: 20px;
  width: 40px; height: 40px;
  border-radius: var(--wemd-radius-md);
  background: var(--wemd-bg-gradient);
  color: white;
  font-family: Georgia, serif;
  font-size: 36px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 900;
}
:global(.wemd-theme__bytedance-quote) .wemd-quote-body {
  font-size: 17px;
  line-height: 1.8;
  color: var(--wemd-text);
  font-weight: 600;
  margin: 0 0 12px 0;
}
:global(.wemd-theme__bytedance-quote) .wemd-quote-src {
  font-family: var(--wemd-font-mono);
  font-size: 12px;
  letter-spacing: 1.5px;
  color: var(--wemd-text-muted);
  text-transform: uppercase;
  margin: 0;
}
"@
    sourceHtml = @"
<blockquote class=&quot;wemd-quote-card&quot; data-variant=&quot;bytedance-quote&quot;>
  <span class=&quot;wemd-quote-mark&quot;>&ldquo;</span>
  <p class=&quot;wemd-quote-body&quot;>引言正文：公司愿景 / 创始人语录 / 理念金句……</p>
  <cite class=&quot;wemd-quote-src&quot;>—— {{来源 / 发言人}}</cite>
</blockquote>
"@
    instruction = "引言卡：左上角独立渐变方块引号图标+整体浅渐变背景+引言+英文大写来源"
  },
  @{
    type = "two-column-cards"
    variant = "bytedance-twocol"
    variantCss = @"
:global(.wemd-theme__bytedance-twocol) { $VARS }
:global(.wemd-theme__bytedance-twocol) .wemd-two-column-cards {
  margin: 28px 0;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}
:global(.wemd-theme__bytedance-twocol) .wemd-twocol-item {
  padding: 20px;
  border-radius: var(--wemd-radius-lg);
  background: var(--wemd-bg);
  border: 1px solid var(--wemd-border-light);
  box-shadow: var(--wemd-shadow-sm);
}
:global(.wemd-theme__bytedance-twocol) .wemd-twocol-item:nth-child(odd) {
  border-top: 3px solid var(--wemd-primary);
}
:global(.wemd-theme__bytedance-twocol) .wemd-twocol-item:nth-child(even) {
  border-top: 3px solid var(--wemd-accent);
}
:global(.wemd-theme__bytedance-twocol) .wemd-twocol-title {
  font-weight: 800;
  font-size: 16px;
  color: var(--wemd-text);
  margin: 0 0 8px 0;
}
:global(.wemd-theme__bytedance-twocol) .wemd-twocol-body {
  font-size: 14px;
  line-height: 1.7;
  color: var(--wemd-text-muted);
  margin: 0;
}
"@
    sourceHtml = @"
<div class=&quot;wemd-two-column-cards&quot; data-variant=&quot;bytedance-twocol&quot;>
  <div class=&quot;wemd-twocol-item&quot;>
    <h4 class=&quot;wemd-twocol-title&quot;>{{左卡标题}}</h4>
    <p class=&quot;wemd-twocol-body&quot;>左卡片正文……</p>
  </div>
  <div class=&quot;wemd-twocol-item&quot;>
    <h4 class=&quot;wemd-twocol-title&quot;>{{右卡标题}}</h4>
    <p class=&quot;wemd-twocol-body&quot;>右卡片正文……</p>
  </div>
</div>
"@
    instruction = "双列卡片：2列grid，左卡顶部3px红边，右卡顶部3px蓝边，圆角白底阴影"
  },
  @{
    type = "cta-card"
    variant = "bytedance-cta"
    variantCss = @"
:global(.wemd-theme__bytedance-cta) { $VARS }
:global(.wemd-theme__bytedance-cta) .wemd-cta-card {
  margin: 28px 0;
  padding: 28px 32px;
  border-radius: var(--wemd-radius-lg);
  background: var(--wemd-bg-gradient);
  color: var(--wemd-text-on-dark);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  flex-wrap: wrap;
  box-shadow: var(--wemd-shadow-md);
}
:global(.wemd-theme__bytedance-cta) .wemd-cta-text {
  flex: 1;
  min-width: 240px;
}
:global(.wemd-theme__bytedance-cta) .wemd-cta-title {
  font-size: 22px;
  font-weight: 900;
  margin: 0 0 8px 0;
}
:global(.wemd-theme__bytedance-cta) .wemd-cta-desc {
  font-size: 15px;
  opacity: 0.92;
  margin: 0;
}
:global(.wemd-theme__bytedance-cta) .wemd-cta-btn {
  flex-shrink: 0;
  padding: 14px 32px;
  border-radius: 999px;
  background: white;
  color: var(--wemd-primary);
  font-weight: 800;
  font-size: 15px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.15);
}
"@
    sourceHtml = @"
<div class=&quot;wemd-cta-card&quot; data-variant=&quot;bytedance-cta&quot;>
  <div class=&quot;wemd-cta-text&quot;>
    <h3 class=&quot;wemd-cta-title&quot;>{{行动号召标题}}</h3>
    <p class=&quot;wemd-cta-desc&quot;>{{引导副标题 / 一句话卖点}}</p>
  </div>
  <span class=&quot;wemd-cta-btn&quot;>{{立即参与 / 关注 / 试用}}</span>
</div>
"@
    instruction = "行动号召卡：整卡红→蓝渐变背景+左文字区+右侧白色胶囊按钮红文字"
  },
  @{
    type = "share-card"
    variant = "bytedance-share"
    variantCss = @"
:global(.wemd-theme__bytedance-share) { $VARS }
:global(.wemd-theme__bytedance-share) .wemd-share-card {
  margin: 32px 0;
  padding: 24px 28px;
  border-radius: var(--wemd-radius-lg);
  background: var(--wemd-bg-alt);
  display: flex;
  flex-direction: column;
  gap: 16px;
}
:global(.wemd-theme__bytedance-share) .wemd-share-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 800;
  font-size: 16px;
  color: var(--wemd-text);
  margin: 0;
}
:global(.wemd-theme__bytedance-share) .wemd-share-title::before {
  content: "";
  width: 4px; height: 20px;
  border-radius: 4px;
  background: var(--wemd-bg-gradient);
}
:global(.wemd-theme__bytedance-share) .wemd-share-row {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}
:global(.wemd-theme__bytedance-share) .wemd-share-btn {
  flex: 1;
  min-width: 110px;
  padding: 12px 18px;
  border-radius: var(--wemd-radius-md);
  background: var(--wemd-bg);
  text-align: center;
  font-weight: 700;
  font-size: 14px;
  color: var(--wemd-text-muted);
  border: 1px solid var(--wemd-border-light);
}
:global(.wemd-theme__bytedance-share) .wemd-share-btn.primary {
  background: var(--wemd-bg-gradient);
  color: white;
  border-color: transparent;
}
"@
    sourceHtml = @"
<div class=&quot;wemd-share-card&quot; data-variant=&quot;bytedance-share&quot;>
  <h4 class=&quot;wemd-share-title&quot;>觉得有用？分享给朋友</h4>
  <div class=&quot;wemd-share-row&quot;>
    <span class=&quot;wemd-share-btn&quot;>朋友圈</span>
    <span class=&quot;wemd-share-btn&quot;>微信好友</span>
    <span class=&quot;wemd-share-btn primary&quot;>收藏文章</span>
  </div>
</div>
"@
    instruction = "分享引导卡：灰底+左侧渐变条标题+三个并排按钮（中间两个白框，第三个渐变主按钮）"
  },
  @{
    type = "qr-card"
    variant = "bytedance-qr"
    variantCss = @"
:global(.wemd-theme__bytedance-qr) { $VARS }
:global(.wemd-theme__bytedance-qr) .wemd-qr-card {
  margin: 28px 0;
  padding: 28px;
  border-radius: var(--wemd-radius-lg);
  background: var(--wemd-bg);
  border: 1px solid var(--wemd-border-light);
  box-shadow: var(--wemd-shadow-md);
  display: flex;
  align-items: center;
  gap: 24px;
  flex-wrap: wrap;
}
:global(.wemd-theme__bytedance-qr) .wemd-qr-wrap {
  flex-shrink: 0;
  width: 140px; height: 140px;
  border-radius: var(--wemd-radius-md);
  background: var(--wemd-bg);
  border: 4px solid;
  border-image: var(--wemd-bg-gradient) 1;
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}
:global(.wemd-theme__bytedance-qr) .wemd-qr-placeholder {
  width: 100%; height: 100%;
  background:
    linear-gradient(45deg, #000 25%, transparent 25%, transparent 75%, #000 75%),
    linear-gradient(45deg, #000 25%, #fff 25%, #fff 75%, #000 75%);
  background-size: 16px 16px;
  background-position: 0 0, 8px 8px;
  opacity: 0.9;
  border-radius: 4px;
}
:global(.wemd-theme__bytedance-qr) .wemd-qr-info {
  flex: 1;
  min-width: 200px;
}
:global(.wemd-theme__bytedance-qr) .wemd-qr-title {
  font-size: 18px;
  font-weight: 800;
  margin: 0 0 8px 0;
  color: var(--wemd-text);
}
:global(.wemd-theme__bytedance-qr) .wemd-qr-desc {
  font-size: 14px;
  line-height: 1.7;
  color: var(--wemd-text-muted);
  margin: 0 0 14px 0;
}
:global(.wemd-theme__bytedance-qr) .wemd-qr-tag {
  display: inline-block;
  padding: 6px 16px;
  border-radius: 999px;
  background: var(--wemd-gradientSoft);
  color: var(--wemd-primary);
  font-size: 13px;
  font-weight: 700;
}
"@
    sourceHtml = @"
<div class=&quot;wemd-qr-card&quot; data-variant=&quot;bytedance-qr&quot;>
  <div class=&quot;wemd-qr-wrap&quot;>
    <div class=&quot;wemd-qr-placeholder&quot;></div>
  </div>
  <div class=&quot;wemd-qr-info&quot;>
    <h4 class=&quot;wemd-qr-title&quot;>{{二维码用途}}</h4>
    <p class=&quot;wemd-qr-desc&quot;>长按识别 / 扫码，关注官方账号 / 获取更多资料</p>
    <span class=&quot;wemd-qr-tag&quot;>{{标签：关注我们 / 加入社群}}</span>
  </div>
</div>
"@
    instruction = "二维码卡片：左侧二维码（渐变描边）+ 右侧标题+说明+红底胶囊标签"
  }
)

Invoke-AiSave -batch "container" -isLastBatch $false -blueprint $null -components $batch3

Write-Host "`n[批次 4/7] data 组（9 个数据组件）..."

$batch4 = @(
  @{
    type = "stats-block"
    variant = "bytedance-stats"
    variantCss = @"
:global(.wemd-theme__bytedance-stats) { $VARS }
:global(.wemd-theme__bytedance-stats) .wemd-stats-block {
  margin: 28px 0;
  padding: 28px;
  border-radius: var(--wemd-radius-lg);
  background: var(--wemd-bg-gradient);
  color: var(--wemd-text-on-dark);
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
  box-shadow: var(--wemd-shadow-md);
}
:global(.wemd-theme__bytedance-stats) .wemd-stat-item {
  text-align: center;
  padding: 8px 4px;
}
:global(.wemd-theme__bytedance-stats) .wemd-stat-num {
  font-weight: 900;
  font-size: 40px;
  line-height: 1;
  margin: 0 0 10px 0;
  font-family: var(--wemd-font-mono);
}
:global(.wemd-theme__bytedance-stats) .wemd-stat-num sup {
  font-size: 18px;
  vertical-align: top;
  margin-left: 2px;
  opacity: 0.85;
}
:global(.wemd-theme__bytedance-stats) .wemd-stat-label {
  font-size: 13px;
  opacity: 0.92;
  margin: 0;
  letter-spacing: 0.5px;
}
"@
    sourceHtml = @"
<div class=&quot;wemd-stats-block&quot; data-variant=&quot;bytedance-stats&quot;>
  <div class=&quot;wemd-stat-item&quot;>
    <p class=&quot;wemd-stat-num&quot;>150<sup>+</sup></p>
    <p class=&quot;wemd-stat-label&quot;>覆盖国家和地区</p>
  </div>
  <div class=&quot;wemd-stat-item&quot;>
    <p class=&quot;wemd-stat-num&quot;>10<sup>亿</sup></p>
    <p class=&quot;wemd-stat-label&quot;>全球月活用户</p>
  </div>
  <div class=&quot;wemd-stat-item&quot;>
    <p class=&quot;wemd-stat-num&quot;>40<sup>+</sup></p>
    <p class=&quot;wemd-stat-label&quot;>旗下产品矩阵</p>
  </div>
  <div class=&quot;wemd-stat-item&quot;>
    <p class=&quot;wemd-stat-num&quot;>12<sup>年</sup></p>
    <p class=&quot;wemd-stat-label&quot;>始终创业历程</p>
  </div>
</div>
"@
    instruction = "数据区块：渐变整卡背景+4格网格+巨大等宽数字+上角标单位+下方浅色标签"
  },
  @{
    type = "styled-table"
    variant = "bytedance-styled-tbl"
    variantCss = @"
:global(.wemd-theme__bytedance-styled-tbl) { $VARS }
:global(.wemd-theme__bytedance-styled-tbl) .wemd-styled-table {
  margin: 24px 0;
  border-radius: var(--wemd-radius-lg);
  overflow: hidden;
  background: var(--wemd-bg);
  border: 1px solid var(--wemd-border-light);
  box-shadow: var(--wemd-shadow-sm);
}
:global(.wemd-theme__bytedance-styled-tbl) table {
  width: 100%;
  border-collapse: collapse;
}
:global(.wemd-theme__bytedance-styled-tbl) thead {
  background: var(--wemd-bg-gradient);
  color: var(--wemd-text-on-dark);
}
:global(.wemd-theme__bytedance-styled-tbl) th {
  padding: 14px 20px;
  text-align: left;
  font-size: 14px;
  font-weight: 800;
  letter-spacing: 0.5px;
}
:global(.wemd-theme__bytedance-styled-tbl) td {
  padding: 14px 20px;
  font-size: 14px;
  color: var(--wemd-text);
  border-bottom: 1px solid var(--wemd-border-light);
}
:global(.wemd-theme__bytedance-styled-tbl) tbody tr:last-child td {
  border-bottom: none;
}
:global(.wemd-theme__bytedance-styled-tbl) tbody tr:nth-child(even) {
  background: var(--wemd-bg-alt);
}
:global(.wemd-theme__bytedance-styled-tbl) tbody td strong {
  color: var(--wemd-primary);
}
"@
    sourceHtml = @"
<div class=&quot;wemd-styled-table&quot; data-variant=&quot;bytedance-styled-tbl&quot;>
  <table>
    <thead><tr><th>产品</th><th>类型</th><th>覆盖用户</th><th>定位</th></tr></thead>
    <tbody>
      <tr><td>抖音</td><td>短视频</td><td><strong>8亿+</strong></td><td>记录美好生活</td></tr>
      <tr><td>TikTok</td><td>短视频（全球）</td><td><strong>10亿+</strong></td><td>Inspire Creativity</td></tr>
      <tr><td>今日头条</td><td>资讯</td><td><strong>3亿+</strong></td><td>信息创造价值</td></tr>
      <tr><td>飞书</td><td>协作办公</td><td><strong>千万+</strong></td><td>组织未来方式</td></tr>
    </tbody>
  </table>
</div>
"@
    instruction = "精品数据表格：渐变表头（红白字）+斑马行（偶数行淡灰底）+ strong数据用红色高亮"
  },
  @{
    type = "table"
    variant = "bytedance-table-simple"
    variantCss = @"
:global(.wemd-theme__bytedance-table-simple) { $VARS }
:global(.wemd-theme__bytedance-table-simple) .wemd-table {
  margin: 24px 0;
  overflow-x: auto;
  border-radius: var(--wemd-radius-md);
}
:global(.wemd-theme__bytedance-table-simple) table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
  min-width: 480px;
}
:global(.wemd-theme__bytedance-table-simple) th {
  padding: 12px 18px;
  text-align: left;
  background: var(--wemd-bg-alt);
  color: var(--wemd-text);
  font-weight: 800;
  border-bottom: 2px solid var(--wemd-primary);
}
:global(.wemd-theme__bytedance-table-simple) td {
  padding: 12px 18px;
  border-bottom: 1px solid var(--wemd-border-light);
  color: var(--wemd-text);
  line-height: 1.6;
}
:global(.wemd-theme__bytedance-table-simple) tbody tr:hover td {
  background: var(--wemd-gradientSoft);
}
"@
    sourceHtml = @"
<div class=&quot;wemd-table&quot; data-variant=&quot;bytedance-table-simple&quot;>
  <table>
    <thead><tr><th>列1</th><th>列2</th><th>列3</th></tr></thead>
    <tbody>
      <tr><td>数据 A1</td><td>数据 A2</td><td>数据 A3</td></tr>
      <tr><td>数据 B1</td><td>数据 B2</td><td>数据 B3</td></tr>
    </tbody>
  </table>
</div>
"@
    instruction = "轻量表格：灰底表头+加粗文字+下边框2px红+hover行淡渐变底色"
  },
  @{
    type = "timeline"
    variant = "bytedance-timeline"
    variantCss = @"
:global(.wemd-theme__bytedance-timeline) { $VARS }
:global(.wemd-theme__bytedance-timeline) .wemd-timeline {
  position: relative;
  margin: 32px 0;
  padding: 8px 0 8px 36px;
}
:global(.wemd-theme__bytedance-timeline) .wemd-timeline::before {
  content: "";
  position: absolute;
  top: 0; bottom: 0; left: 12px;
  width: 3px;
  background: linear-gradient(180deg, var(--wemd-primary) 0%, var(--wemd-accent) 100%);
  border-radius: 3px;
}
:global(.wemd-theme__bytedance-timeline) .wemd-tl-item {
  position: relative;
  margin-bottom: 24px;
}
:global(.wemd-theme__bytedance-timeline) .wemd-tl-dot {
  position: absolute;
  top: 6px; left: -32px;
  width: 18px; height: 18px;
  border-radius: 50%;
  background: white;
  border: 4px solid var(--wemd-primary);
  box-shadow: 0 0 0 3px rgba(254, 44, 85, 0.18);
}
:global(.wemd-theme__bytedance-timeline) .wemd-tl-item:last-child .wemd-tl-dot {
  border-color: var(--wemd-accent);
  box-shadow: 0 0 0 3px rgba(51, 112, 255, 0.2);
}
:global(.wemd-theme__bytedance-timeline) .wemd-tl-date {
  font-family: var(--wemd-font-mono);
  font-size: 12px;
  letter-spacing: 1px;
  font-weight: 700;
  color: var(--wemd-primary);
  margin: 0 0 6px 0;
}
:global(.wemd-theme__bytedance-timeline) .wemd-tl-title {
  font-weight: 800;
  font-size: 16px;
  color: var(--wemd-text);
  margin: 0 0 6px 0;
}
:global(.wemd-theme__bytedance-timeline) .wemd-tl-body {
  font-size: 14px;
  line-height: 1.75;
  color: var(--wemd-text-muted);
  margin: 0;
}
"@
    sourceHtml = @"
<div class=&quot;wemd-timeline&quot; data-variant=&quot;bytedance-timeline&quot;>
  <div class=&quot;wemd-tl-item&quot;>
    <span class=&quot;wemd-tl-dot&quot;></span>
    <p class=&quot;wemd-tl-date&quot;>2012.03</p>
    <h4 class=&quot;wemd-tl-title&quot;>公司成立</h4>
    <p class=&quot;wemd-tl-body&quot;>字节跳动在北京成立，开启信息推荐技术创业……</p>
  </div>
  <div class=&quot;wemd-tl-item&quot;>
    <span class=&quot;wemd-tl-dot&quot;></span>
    <p class=&quot;wemd-tl-date&quot;>2016.09</p>
    <h4 class=&quot;wemd-tl-title&quot;>抖音上线</h4>
    <p class=&quot;wemd-tl-body&quot;>短视频平台抖音正式上线，重新定义大众内容创作……</p>
  </div>
  <div class=&quot;wemd-tl-item&quot;>
    <span class=&quot;wemd-tl-dot&quot;></span>
    <p class=&quot;wemd-tl-date&quot;>NOW</p>
    <h4 class=&quot;wemd-tl-title&quot;>全球化科技公司</h4>
    <p class=&quot;wemd-tl-body&quot;>业务覆盖 150+ 国家和地区，持续推动技术创新……</p>
  </div>
</div>
"@
    instruction = "时间线：左侧3px红→蓝渐变竖线+圆形节点（红/蓝节点光晕）+日期等宽红字+标题+正文"
  },
  @{
    type = "resource-list"
    variant = "bytedance-res-list"
    variantCss = @"
:global(.wemd-theme__bytedance-res-list) { $VARS }
:global(.wemd-theme__bytedance-res-list) .wemd-resource-list {
  margin: 24px 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
:global(.wemd-theme__bytedance-res-list) .wemd-res-item {
  padding: 16px 20px;
  border-radius: var(--wemd-radius-md);
  background: var(--wemd-bg);
  border: 1px solid var(--wemd-border-light);
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: var(--wemd-shadow-sm);
}
:global(.wemd-theme__bytedance-res-list) .wemd-res-icon {
  width: 44px; height: 44px;
  border-radius: var(--wemd-radius-sm);
  flex-shrink: 0;
  background: var(--wemd-gradientSoft);
  color: var(--wemd-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 900;
  font-size: 16px;
}
:global(.wemd-theme__bytedance-res-list) .wemd-res-main {
  flex: 1;
  min-width: 0;
}
:global(.wemd-theme__bytedance-res-list) .wemd-res-title {
  font-weight: 800;
  font-size: 15px;
  color: var(--wemd-text);
  margin: 0 0 4px 0;
}
:global(.wemd-theme__bytedance-res-list) .wemd-res-desc {
  font-size: 13px;
  color: var(--wemd-text-muted);
  margin: 0;
}
:global(.wemd-theme__bytedance-res-list) .wemd-res-tag {
  flex-shrink: 0;
  padding: 5px 14px;
  border-radius: 999px;
  background: var(--wemd-bg-gradient);
  color: white;
  font-weight: 700;
  font-size: 12px;
}
"@
    sourceHtml = @"
<ul class=&quot;wemd-resource-list&quot; data-variant=&quot;bytedance-res-list&quot;>
  <li class=&quot;wemd-res-item&quot;>
    <span class=&quot;wemd-res-icon&quot;>📘</span>
    <div class=&quot;wemd-res-main&quot;>
      <h4 class=&quot;wemd-res-title&quot;>{{资源标题}}</h4>
      <p class=&quot;wemd-res-desc&quot;>资源简介 / 一句话描述……</p>
    </div>
    <span class=&quot;wemd-res-tag&quot;>PDF 下载</span>
  </li>
</ul>
"@
    instruction = "资源列表：圆角白底卡片+淡色渐变图标框+标题描述+右侧渐变胶囊标签"
  },
  @{
    type = "image-compare"
    variant = "bytedance-img-comp"
    variantCss = @"
:global(.wemd-theme__bytedance-img-comp) { $VARS }
:global(.wemd-theme__bytedance-img-comp) .wemd-image-compare {
  margin: 24px 0;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
:global(.wemd-theme__bytedance-img-comp) .wemd-comp-item {
  border-radius: var(--wemd-radius-lg);
  overflow: hidden;
  background: var(--wemd-bg);
  border: 1px solid var(--wemd-border-light);
  box-shadow: var(--wemd-shadow-sm);
  position: relative;
}
:global(.wemd-theme__bytedance-img-comp) .wemd-comp-before::after,
:global(.wemd-theme__bytedance-img-comp) .wemd-comp-after::after {
  position: absolute;
  top: 14px; left: 14px;
  padding: 5px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 800;
  color: white;
  z-index: 2;
}
:global(.wemd-theme__bytedance-img-comp) .wemd-comp-before::after {
  content: "BEFORE";
  background: rgba(107, 114, 128, 0.9);
}
:global(.wemd-theme__bytedance-img-comp) .wemd-comp-after::after {
  content: "AFTER";
  background: var(--wemd-bg-gradient);
}
:global(.wemd-theme__bytedance-img-comp) .wemd-comp-img {
  width: 100%;
  aspect-ratio: 4 / 3;
  background: var(--wemd-gradientSoft);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--wemd-text-muted);
  font-size: 14px;
}
:global(.wemd-theme__bytedance-img-comp) .wemd-comp-cap {
  padding: 12px 18px 16px 18px;
  font-size: 13px;
  color: var(--wemd-text-muted);
  line-height: 1.6;
  margin: 0;
}
"@
    sourceHtml = @"
<div class=&quot;wemd-image-compare&quot; data-variant=&quot;bytedance-img-comp&quot;>
  <div class=&quot;wemd-comp-item wemd-comp-before&quot;>
    <div class=&quot;wemd-comp-img&quot;>Before 图</div>
    <p class=&quot;wemd-comp-cap&quot;>改造前效果 / 原图说明</p>
  </div>
  <div class=&quot;wemd-comp-item wemd-comp-after&quot;>
    <div class=&quot;wemd-comp-img&quot;>After 图</div>
    <p class=&quot;wemd-comp-cap&quot;>改造后效果 / 品牌化说明</p>
  </div>
</div>
"@
    instruction = "图片对比：左右两列，BEFORE灰胶囊标，AFTER渐变胶囊标+4:3占位+下方图注"
  },
  @{
    type = "image-grid"
    variant = "bytedance-img-grid"
    variantCss = @"
:global(.wemd-theme__bytedance-img-grid) { $VARS }
:global(.wemd-theme__bytedance-img-grid) .wemd-image-grid {
  margin: 24px 0;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}
:global(.wemd-theme__bytedance-img-grid) .wemd-grid-img {
  border-radius: var(--wemd-radius-md);
  aspect-ratio: 1 / 1;
  overflow: hidden;
  background: var(--wemd-gradientSoft);
  position: relative;
  border: 1px solid var(--wemd-border-light);
}
:global(.wemd-theme__bytedance-img-grid) .wemd-grid-img img {
  width: 100%; height: 100%;
  object-fit: cover;
  display: block;
}
:global(.wemd-theme__bytedance-img-grid) .wemd-grid-img:nth-child(3n+1) {
  background: linear-gradient(135deg, rgba(254,44,85,0.15), rgba(255,255,255,1));
}
:global(.wemd-theme__bytedance-img-grid) .wemd-grid-img:nth-child(3n+2) {
  background: linear-gradient(135deg, rgba(51,112,255,0.15), rgba(255,255,255,1));
}
:global(.wemd-theme__bytedance-img-grid) .wemd-grid-img:nth-child(3n) {
  background: linear-gradient(135deg, rgba(254,44,85,0.10), rgba(51,112,255,0.10));
}
"@
    sourceHtml = @"
<div class=&quot;wemd-image-grid&quot; data-variant=&quot;bytedance-img-grid&quot;>
  <div class=&quot;wemd-grid-img&quot;><img src=&quot;{{img1}}&quot; alt=&quot;&quot; /></div>
  <div class=&quot;wemd-grid-img&quot;><img src=&quot;{{img2}}&quot; alt=&quot;&quot; /></div>
  <div class=&quot;wemd-grid-img&quot;><img src=&quot;{{img3}}&quot; alt=&quot;&quot; /></div>
  <div class=&quot;wemd-grid-img&quot;><img src=&quot;{{img4}}&quot; alt=&quot;&quot; /></div>
  <div class=&quot;wemd-grid-img&quot;><img src=&quot;{{img5}}&quot; alt=&quot;&quot; /></div>
  <div class=&quot;wemd-grid-img&quot;><img src=&quot;{{img6}}&quot; alt=&quot;&quot; /></div>
</div>
"@
    instruction = "九宫格图片组：3列grid方图，红、蓝、红蓝渐变三种不同淡底色循环，圆角描边"
  },
  @{
    type = "image-text-row"
    variant = "bytedance-imgtext"
    variantCss = @"
:global(.wemd-theme__bytedance-imgtext) { $VARS }
:global(.wemd-theme__bytedance-imgtext) .wemd-image-text-row {
  margin: 24px 0;
  display: grid;
  grid-template-columns: 220px 1fr;
  gap: 24px;
  align-items: center;
  padding: 20px;
  border-radius: var(--wemd-radius-lg);
  background: var(--wemd-bg);
  border: 1px solid var(--wemd-border-light);
  box-shadow: var(--wemd-shadow-sm);
}
:global(.wemd-theme__bytedance-imgtext) .wemd-it-img {
  width: 100%;
  aspect-ratio: 1 / 1;
  border-radius: var(--wemd-radius-md);
  overflow: hidden;
  background: var(--wemd-bg-gradient);
}
:global(.wemd-theme__bytedance-imgtext) .wemd-it-img img {
  width: 100%; height: 100%;
  object-fit: cover;
  display: block;
}
:global(.wemd-theme__bytedance-imgtext) .wemd-it-title {
  font-weight: 800;
  font-size: 18px;
  color: var(--wemd-text);
  margin: 0 0 10px 0;
}
:global(.wemd-theme__bytedance-imgtext) .wemd-it-body {
  font-size: 14px;
  line-height: 1.8;
  color: var(--wemd-text-muted);
  margin: 0 0 14px 0;
}
:global(.wemd-theme__bytedance-imgtext) .wemd-it-meta {
  display: inline-block;
  font-family: var(--wemd-font-mono);
  font-size: 11px;
  letter-spacing: 2px;
  padding: 4px 12px;
  border-radius: 999px;
  background: var(--wemd-gradientSoft);
  color: var(--wemd-primary);
  font-weight: 700;
  text-transform: uppercase;
}
"@
    sourceHtml = @"
<div class=&quot;wemd-image-text-row&quot; data-variant=&quot;bytedance-imgtext&quot;>
  <div class=&quot;wemd-it-img&quot;><img src=&quot;{{图}}&quot; alt=&quot;&quot; /></div>
  <div class=&quot;wemd-it-body-wrap&quot;>
    <h4 class=&quot;wemd-it-title&quot;>{{图文标题}}</h4>
    <p class=&quot;wemd-it-body&quot;>图文介绍正文……</p>
    <span class=&quot;wemd-it-meta&quot;>CASE · 案例</span>
  </div>
</div>
"@
    instruction = "左图右文：220px方图渐变占位+右侧标题正文+下方CASE英文小字胶囊标"
  },
  @{
    type = "image-caption"
    variant = "bytedance-img-cap"
    variantCss = @"
:global(.wemd-theme__bytedance-img-cap) { $VARS }
:global(.wemd-theme__bytedance-img-cap) .wemd-image-caption {
  margin: 24px 0;
}
:global(.wemd-theme__bytedance-img-cap) .wemd-cap-img {
  width: 100%;
  border-radius: var(--wemd-radius-lg);
  overflow: hidden;
  aspect-ratio: 21 / 9;
  background: var(--wemd-gradientSoft);
  border: 1px solid var(--wemd-border-light);
  box-shadow: var(--wemd-shadow-md);
  margin: 0 0 10px 0;
}
:global(.wemd-theme__bytedance-img-cap) .wemd-cap-img img {
  width: 100%; height: 100%;
  object-fit: cover;
  display: block;
}
:global(.wemd-theme__bytedance-img-cap) .wemd-cap-text {
  text-align: center;
  font-size: 13px;
  color: var(--wemd-text-muted);
  margin: 0;
  line-height: 1.6;
}
:global(.wemd-theme__bytedance-img-cap) .wemd-cap-text strong {
  color: var(--wemd-primary);
  font-weight: 700;
}
"@
    sourceHtml = @"
<figure class=&quot;wemd-image-caption&quot; data-variant=&quot;bytedance-img-cap&quot;>
  <div class=&quot;wemd-cap-img&quot;><img src=&quot;{{大图URL}}&quot; alt=&quot;&quot; /></div>
  <figcaption class=&quot;wemd-cap-text&quot;>图注 / 说明文字，<strong>重点</strong>可加粗标红</figcaption>
</figure>
"@
    instruction = "大图配说明：21:9圆角大图+阴影+下方居中灰色图注（strong红）"
  }
)

Invoke-AiSave -batch "data" -isLastBatch $false -blueprint $null -components $batch4

Write-Host "`n[批次 5/7] interactive 组（6 个交互组件）..."

$batch5 = @(
  @{
    type = "callout"
    variant = "bytedance-callout"
    variantCss = @"
:global(.wemd-theme__bytedance-callout) { $VARS }
:global(.wemd-theme__bytedance-callout) .wemd-callout {
  margin: 24px 0;
  padding: 20px 22px 20px 64px;
  border-radius: var(--wemd-radius-md);
  background: var(--wemd-bg-alt);
  border-left: 4px solid var(--wemd-primary);
  position: relative;
}
:global(.wemd-theme__bytedance-callout) .wemd-call-icon {
  position: absolute;
  top: 18px; left: 20px;
  width: 30px; height: 30px;
  border-radius: 50%;
  background: var(--wemd-bg-gradient);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 900;
  font-size: 16px;
}
:global(.wemd-theme__bytedance-callout) .wemd-call-title {
  font-weight: 800;
  font-size: 15px;
  color: var(--wemd-text);
  margin: 0 0 6px 0;
}
:global(.wemd-theme__bytedance-callout) .wemd-call-body {
  font-size: 14px;
  line-height: 1.75;
  color: var(--wemd-text-muted);
  margin: 0;
}
:global(.wemd-theme__bytedance-callout) .wemd-call-body strong {
  color: var(--wemd-primary);
}
"@
    sourceHtml = @"
<div class=&quot;wemd-callout&quot; data-variant=&quot;bytedance-callout&quot;>
  <span class=&quot;wemd-call-icon&quot;>i</span>
  <h4 class=&quot;wemd-call-title&quot;>{{提示/注意标题}}</h4>
  <p class=&quot;wemd-call-body&quot;>提示正文，<strong>重点</strong>可标红强调。</p>
</div>
"@
    instruction = "提示框：淡灰底色+左侧4px红边+圆形渐变i图标+标题+正文"
  },
  @{
    type = "callout-pro"
    variant = "bytedance-callout-pro"
    variantCss = @"
:global(.wemd-theme__bytedance-callout-pro) { $VARS }
:global(.wemd-theme__bytedance-callout-pro) .wemd-callout-pro {
  margin: 28px 0;
  padding: 28px 28px 24px 28px;
  border-radius: var(--wemd-radius-lg);
  background: linear-gradient(135deg, rgba(254,44,85,0.08) 0%, rgba(51,112,255,0.08) 100%);
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(254, 44, 85, 0.18);
}
:global(.wemd-theme__bytedance-callout-pro) .wemd-capro-head {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 0 0 14px 0;
}
:global(.wemd-theme__bytedance-callout-pro) .wemd-capro-badge {
  padding: 5px 14px;
  border-radius: 999px;
  background: var(--wemd-bg-gradient);
  color: white;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 1px;
  font-family: var(--wemd-font-mono);
  text-transform: uppercase;
}
:global(.wemd-theme__bytedance-callout-pro) .wemd-capro-title {
  font-size: 18px;
  font-weight: 900;
  color: var(--wemd-text);
  margin: 0;
}
:global(.wemd-theme__bytedance-callout-pro) .wemd-capro-body {
  font-size: 15px;
  line-height: 1.8;
  color: var(--wemd-text);
  margin: 0 0 16px 0;
}
:global(.wemd-theme__bytedance-callout-pro) .wemd-capro-list {
  margin: 0;
  padding-left: 20px;
  font-size: 14px;
  line-height: 2;
  color: var(--wemd-text-muted);
}
:global(.wemd-theme__bytedance-callout-pro) .wemd-capro-list li::marker {
  color: var(--wemd-primary);
  font-weight: 900;
}
"@
    sourceHtml = @"
<div class=&quot;wemd-callout-pro&quot; data-variant=&quot;bytedance-callout-pro&quot;>
  <div class=&quot;wemd-capro-head&quot;>
    <span class=&quot;wemd-capro-badge&quot;>PRO · 重点</span>
    <h3 class=&quot;wemd-capro-title&quot;>{{重点标题 / 核心结论}}</h3>
  </div>
  <p class=&quot;wemd-capro-body&quot;>重点描述段落……</p>
  <ul class=&quot;wemd-capro-list&quot;>
    <li>要点 1……</li>
    <li>要点 2……</li>
    <li>要点 3……</li>
  </ul>
</div>
"@
    instruction = "Pro级提示框：整体红+蓝浅渐变背景+细边+渐变PRO胶囊标+超大标题+正文+红色项目符号列表"
  },
  @{
    type = "faq"
    variant = "bytedance-faq"
    variantCss = @"
:global(.wemd-theme__bytedance-faq) { $VARS }
:global(.wemd-theme__bytedance-faq) .wemd-faq {
  margin: 28px 0;
}
:global(.wemd-theme__bytedance-faq) .wemd-faq-title {
  font-weight: 900;
  font-size: 22px;
  color: var(--wemd-text);
  margin: 0 0 6px 0;
}
:global(.wemd-theme__bytedance-faq) .wemd-faq-sub {
  font-size: 14px;
  color: var(--wemd-text-muted);
  margin: 0 0 20px 0;
}
:global(.wemd-theme__bytedance-faq) .wemd-faq-item {
  margin-bottom: 12px;
  border-radius: var(--wemd-radius-md);
  background: var(--wemd-bg);
  border: 1px solid var(--wemd-border-light);
  overflow: hidden;
  box-shadow: var(--wemd-shadow-sm);
}
:global(.wemd-theme__bytedance-faq) .wemd-faq-q {
  padding: 16px 20px 16px 52px;
  font-weight: 800;
  font-size: 15px;
  color: var(--wemd-text);
  position: relative;
  cursor: pointer;
}
:global(.wemd-theme__bytedance-faq) .wemd-faq-q::before {
  content: "Q";
  position: absolute;
  top: 14px; left: 16px;
  width: 26px; height: 26px;
  border-radius: 8px;
  background: var(--wemd-bg-gradient);
  color: white;
  font-weight: 900;
  font-size: 13px;
  display: flex;
  align-items: center;
  justify-content: center;
}
:global(.wemd-theme__bytedance-faq) .wemd-faq-a {
  padding: 4px 20px 18px 52px;
  font-size: 14px;
  line-height: 1.8;
  color: var(--wemd-text-muted);
  margin: 0;
}
"@
    sourceHtml = @"
<div class=&quot;wemd-faq&quot; data-variant=&quot;bytedance-faq&quot;>
  <h3 class=&quot;wemd-faq-title&quot;>常见问题</h3>
  <p class=&quot;wemd-faq-sub&quot;>你可能想了解的关键信息</p>

  <div class=&quot;wemd-faq-item&quot;>
    <div class=&quot;wemd-faq-q&quot;>问题一：……？</div>
    <p class=&quot;wemd-faq-a&quot;>回答一……</p>
  </div>
  <div class=&quot;wemd-faq-item&quot;>
    <div class=&quot;wemd-faq-q&quot;>问题二：……？</div>
    <p class=&quot;wemd-faq-a&quot;>回答二……</p>
  </div>
</div>
"@
    instruction = "FAQ问答：标题副标题+每个Q卡片+Q渐变方图标+A段落"
  },
  @{
    type = "accordion"
    variant = "bytedance-accordion"
    variantCss = @"
:global(.wemd-theme__bytedance-accordion) { $VARS }
:global(.wemd-theme__bytedance-accordion) .wemd-accordion {
  margin: 24px 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
:global(.wemd-theme__bytedance-accordion) .wemd-acc-item {
  border-radius: var(--wemd-radius-md);
  background: var(--wemd-bg);
  border: 1px solid var(--wemd-border-light);
  overflow: hidden;
}
:global(.wemd-theme__bytedance-accordion) .wemd-acc-header {
  padding: 16px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  font-weight: 700;
  color: var(--wemd-text);
  cursor: pointer;
}
:global(.wemd-theme__bytedance-accordion) .wemd-acc-header:hover {
  background: var(--wemd-gradientSoft);
}
:global(.wemd-theme__bytedance-accordion) .wemd-acc-num {
  font-family: var(--wemd-font-mono);
  font-size: 13px;
  color: var(--wemd-primary);
  font-weight: 800;
  margin-right: 8px;
}
:global(.wemd-theme__bytedance-accordion) .wemd-acc-title {
  flex: 1;
  font-size: 15px;
  margin: 0;
}
:global(.wemd-theme__bytedance-accordion) .wemd-acc-toggle {
  flex-shrink: 0;
  width: 28px; height: 28px;
  border-radius: 8px;
  background: var(--wemd-bg-gradient);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 900;
}
:global(.wemd-theme__bytedance-accordion) .wemd-acc-body {
  padding: 0 20px 18px 56px;
  font-size: 14px;
  line-height: 1.8;
  color: var(--wemd-text-muted);
}
"@
    sourceHtml = @"
<div class=&quot;wemd-accordion&quot; data-variant=&quot;bytedance-accordion&quot;>
  <div class=&quot;wemd-acc-item&quot;>
    <div class=&quot;wemd-acc-header&quot;>
      <span class=&quot;wemd-acc-num&quot;>01</span>
      <h4 class=&quot;wemd-acc-title&quot;>可折叠问题 / 主题 1</h4>
      <span class=&quot;wemd-acc-toggle&quot;>+</span>
    </div>
    <div class=&quot;wemd-acc-body&quot;>折叠内容正文……</div>
  </div>
  <div class=&quot;wemd-acc-item&quot;>
    <div class=&quot;wemd-acc-header&quot;>
      <span class=&quot;wemd-acc-num&quot;>02</span>
      <h4 class=&quot;wemd-acc-title&quot;>可折叠问题 / 主题 2</h4>
      <span class=&quot;wemd-acc-toggle&quot;>+</span>
    </div>
    <div class=&quot;wemd-acc-body&quot;>折叠内容正文……</div>
  </div>
</div>
"@
    instruction = "手风琴：等宽数字01红字+标题+右侧渐变方块+号按钮+展开后正文"
  },
  @{
    type = "steps"
    variant = "bytedance-steps"
    variantCss = @"
:global(.wemd-theme__bytedance-steps) { $VARS }
:global(.wemd-theme__bytedance-steps) .wemd-steps {
  margin: 28px 0;
  padding: 8px 0;
  counter-reset: step-counter;
}
:global(.wemd-theme__bytedance-steps) .wemd-step {
  position: relative;
  padding: 0 0 28px 72px;
  counter-increment: step-counter;
}
:global(.wemd-theme__bytedance-steps) .wemd-step:not(:last-child)::after {
  content: "";
  position: absolute;
  top: 48px; left: 20px;
  width: 2px;
  height: calc(100% - 20px);
  background: linear-gradient(180deg, var(--wemd-primary) 0%, var(--wemd-accent) 100%);
  opacity: 0.35;
}
:global(.wemd-theme__bytedance-steps) .wemd-step::before {
  content: counter(step-counter);
  position: absolute;
  top: 0; left: 0;
  width: 44px; height: 44px;
  border-radius: 50%;
  background: var(--wemd-bg-gradient);
  color: white;
  font-weight: 900;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--wemd-shadow-sm);
  z-index: 2;
}
:global(.wemd-theme__bytedance-steps) .wemd-step-title {
  font-weight: 800;
  font-size: 17px;
  color: var(--wemd-text);
  margin: 6px 0 8px 0;
}
:global(.wemd-theme__bytedance-steps) .wemd-step-body {
  font-size: 14px;
  line-height: 1.8;
  color: var(--wemd-text-muted);
  margin: 0;
}
"@
    sourceHtml = @"
<div class=&quot;wemd-steps&quot; data-variant=&quot;bytedance-steps&quot;>
  <div class=&quot;wemd-step&quot;>
    <h4 class=&quot;wemd-step-title&quot;>第一步：{{步骤名}}</h4>
    <p class=&quot;wemd-step-body&quot;>第一步说明正文……</p>
  </div>
  <div class=&quot;wemd-step&quot;>
    <h4 class=&quot;wemd-step-title&quot;>第二步：{{步骤名}}</h4>
    <p class=&quot;wemd-step-body&quot;>第二步说明正文……</p>
  </div>
  <div class=&quot;wemd-step&quot;>
    <h4 class=&quot;wemd-step-title&quot;>第三步：{{步骤名}}</h4>
    <p class=&quot;wemd-step-body&quot;>第三步说明正文……</p>
  </div>
</div>
"@
    instruction = "步骤流程：左侧渐变圆形序号+红蓝连接线+标题+正文，最后一步没有连线"
  },
  @{
    type = "follow-bar"
    variant = "bytedance-follow"
    variantCss = @"
:global(.wemd-theme__bytedance-follow) { $VARS }
:global(.wemd-theme__bytedance-follow) .wemd-follow-bar {
  margin: 32px 0;
  padding: 20px 24px;
  border-radius: 999px;
  background: var(--wemd-bg);
  border: 1px solid var(--wemd-border-light);
  box-shadow: var(--wemd-shadow-md);
  display: flex;
  align-items: center;
  gap: 18px;
  flex-wrap: wrap;
}
:global(.wemd-theme__bytedance-follow) .wemd-f-logo {
  width: 48px; height: 48px;
  border-radius: 50%;
  background: var(--wemd-bg-gradient);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 900;
  font-size: 20px;
  flex-shrink: 0;
}
:global(.wemd-theme__bytedance-follow) .wemd-f-text {
  flex: 1;
  min-width: 180px;
}
:global(.wemd-theme__bytedance-follow) .wemd-f-title {
  font-weight: 800;
  font-size: 16px;
  color: var(--wemd-text);
  margin: 0;
}
:global(.wemd-theme__bytedance-follow) .wemd-f-sub {
  font-size: 13px;
  color: var(--wemd-text-muted);
  margin: 3px 0 0 0;
}
:global(.wemd-theme__bytedance-follow) .wemd-f-btn {
  flex-shrink: 0;
  padding: 12px 28px;
  border-radius: 999px;
  background: var(--wemd-bg-gradient);
  color: white;
  font-weight: 800;
  font-size: 15px;
  box-shadow: 0 6px 20px rgba(254, 44, 85, 0.30);
}
"@
    sourceHtml = @"
<div class=&quot;wemd-follow-bar&quot; data-variant=&quot;bytedance-follow&quot;>
  <span class=&quot;wemd-f-logo&quot;>D</span>
  <div class=&quot;wemd-f-text&quot;>
    <h4 class=&quot;wemd-f-title&quot;>关注「字节跳动」官方账号</h4>
    <p class=&quot;wemd-f-sub&quot;>第一时间获取品牌动态 / 行业洞察 / 产品资讯</p>
  </div>
  <span class=&quot;wemd-f-btn&quot;>+ 立即关注</span>
</div>
"@
    instruction = "关注条：胶囊形白底+左渐变圆形品牌Logo+标题副标+右侧渐变红色关注大按钮"
  }
)

Invoke-AiSave -batch "interactive" -isLastBatch $false -blueprint $null -components $batch5

Write-Host "`n[批次 6/7] code 组（2 个代码组件）..."

$batch6 = @(
  @{
    type = "code-block"
    variant = "bytedance-code"
    variantCss = @"
:global(.wemd-theme__bytedance-code) { $VARS }
:global(.wemd-theme__bytedance-code) .wemd-code-block {
  margin: 24px 0;
  border-radius: var(--wemd-radius-lg);
  overflow: hidden;
  background: #0F172A;
  border: 1px solid #1E293B;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.25);
}
:global(.wemd-theme__bytedance-code) .wemd-code-head {
  padding: 14px 20px;
  background: rgba(30, 41, 59, 0.6);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  align-items: center;
  gap: 10px;
}
:global(.wemd-theme__bytedance-code) .wemd-traffic {
  display: flex;
  gap: 6px;
}
:global(.wemd-theme__bytedance-code) .wemd-dot {
  width: 12px; height: 12px;
  border-radius: 50%;
}
:global(.wemd-theme__bytedance-code) .wemd-dot.red { background: #FE2C55; }
:global(.wemd-theme__bytedance-code) .wemd-dot.yellow { background: #F59E0B; }
:global(.wemd-theme__bytedance-code) .wemd-dot.green { background: #10B981; }
:global(.wemd-theme__bytedance-code) .wemd-code-lang {
  margin-left: 8px;
  font-family: var(--wemd-font-mono);
  font-size: 12px;
  color: #94A3B8;
  letter-spacing: 1px;
  text-transform: uppercase;
  font-weight: 700;
}
:global(.wemd-theme__bytedance-code) pre {
  margin: 0;
  padding: 22px 24px;
  font-family: var(--wemd-font-mono);
  font-size: 13.5px;
  line-height: 1.7;
  color: #E2E8F0;
  overflow-x: auto;
}
:global(.wemd-theme__bytedance-code) code {
  font-family: inherit;
  background: transparent !important;
  padding: 0 !important;
  color: inherit;
}
:global(.wemd-theme__bytedance-code) pre .kw { color: #FE2C55; font-weight: 700; }
:global(.wemd-theme__bytedance-code) pre .str { color: #3370FF; }
:global(.wemd-theme__bytedance-code) pre .cm { color: #64748B; font-style: italic; }
"@
    sourceHtml = @"
<div class=&quot;wemd-code-block&quot; data-variant=&quot;bytedance-code&quot;>
  <div class=&quot;wemd-code-head&quot;>
    <div class=&quot;wemd-traffic&quot;>
      <span class=&quot;wemd-dot red&quot;></span>
      <span class=&quot;wemd-dot yellow&quot;></span>
      <span class=&quot;wemd-dot green&quot;></span>
    </div>
    <span class=&quot;wemd-code-lang&quot;>JavaScript</span>
  </div>
  <pre><code><span class=&quot;kw&quot;>const</span> mission = <span class=&quot;str&quot;>&quot;激发创造，丰富生活&quot;</span>;
<span class=&quot;cm&quot;>// ByteDance · 2026</span>
<span class=&quot;kw&quot;>export default</span> { company: <span class=&quot;str&quot;>&quot;字节跳动&quot;</span>, mission };</code></pre>
</div>
"@
    instruction = "代码块：深色mac风格，三色圆点+语言标签+渐变关键字红、字符串蓝、注释灰"
  },
  @{
    type = "code-frame"
    variant = "bytedance-codeframe"
    variantCss = @"
:global(.wemd-theme__bytedance-codeframe) { $VARS }
:global(.wemd-theme__bytedance-codeframe) .wemd-code-frame {
  margin: 22px 0;
  padding: 16px 20px;
  border-radius: var(--wemd-radius-md);
  background: var(--wemd-bg-alt);
  border-left: 4px solid var(--wemd-accent);
  font-family: var(--wemd-font-mono);
  font-size: 14px;
  color: var(--wemd-text);
  line-height: 1.7;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-word;
}
:global(.wemd-theme__bytedance-codeframe) code {
  background: transparent !important;
  padding: 0 !important;
  color: inherit;
  font-family: inherit;
}
:global(.wemd-theme__bytedance-codeframe) .wemd-inline-kw {
  color: var(--wemd-primary);
  font-weight: 700;
}
:global(.wemd-theme__bytedance-codeframe) .wemd-inline-str {
  color: var(--wemd-accent);
}
"@
    sourceHtml = @"
<div class=&quot;wemd-code-frame&quot; data-variant=&quot;bytedance-codeframe&quot;><code>
# 终端命令 / 单行 / 小段代码
<span class=&quot;wemd-inline-kw&quot;>curl</span> -X POST <span class=&quot;wemd-inline-str&quot;>&quot;https://bytedance.com/api/v1/...&quot;</span>
</code></div>
"@
    instruction = "代码行/终端框：灰底+左侧4px蓝边+内联等宽字+关键字红+字符串蓝"
  }
)

Invoke-AiSave -batch "code" -isLastBatch $false -blueprint $null -components $batch6

Write-Host "`n[批次 7/7] divider 组（9 个收尾组件，isLastBatch=true）..."

$batch7 = @(
  @{
    type = "divider-fancy"
    variant = "bytedance-fancy-div"
    variantCss = @"
:global(.wemd-theme__bytedance-fancy-div) { $VARS }
:global(.wemd-theme__bytedance-fancy-div) .wemd-divider-fancy {
  margin: 40px 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
}
:global(.wemd-theme__bytedance-fancy-div) .wemd-line {
  width: 80px;
  height: 2px;
  background: var(--wemd-bg-gradient);
  border-radius: 2px;
}
:global(.wemd-theme__bytedance-fancy-div) .wemd-diamond {
  width: 10px;
  height: 10px;
  background: var(--wemd-bg-gradient);
  transform: rotate(45deg);
}
:global(.wemd-theme__bytedance-fancy-div) .wemd-center-icon {
  width: 34px; height: 34px;
  border-radius: 50%;
  background: var(--wemd-bg-gradient);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 900;
  font-size: 14px;
  box-shadow: var(--wemd-shadow-sm);
}
"@
    sourceHtml = @"
<div class=&quot;wemd-divider-fancy&quot; data-variant=&quot;bytedance-fancy-div&quot;>
  <span class=&quot;wemd-line&quot;></span>
  <span class=&quot;wemd-diamond&quot;></span>
  <span class=&quot;wemd-center-icon&quot;>D</span>
  <span class=&quot;wemd-diamond&quot;></span>
  <span class=&quot;wemd-line&quot;></span>
</div>
"@
    instruction = "华丽分隔符：左右短渐变线+两个渐变菱形+中央圆形D字渐变图标"
  },
  @{
    type = "divider"
    variant = "bytedance-divider"
    variantCss = @"
:global(.wemd-theme__bytedance-divider) { $VARS }
:global(.wemd-theme__bytedance-divider) .wemd-divider {
  margin: 32px 0;
  border: none;
  height: 1px;
  background: linear-gradient(90deg,
    transparent 0%,
    var(--wemd-primary) 18%,
    var(--wemd-accent) 82%,
    transparent 100%);
  opacity: 0.6;
}
"@
    sourceHtml = @"
<hr class=&quot;wemd-divider&quot; data-variant=&quot;bytedance-divider&quot; />
"@
    instruction = "基础渐变分隔线：中间红蓝渐变，两端透明淡过渡1px"
  },
  @{
    type = "full-quote"
    variant = "bytedance-fullquote"
    variantCss = @"
:global(.wemd-theme__bytedance-fullquote) { $VARS }
:global(.wemd-theme__bytedance-fullquote) .wemd-full-quote {
  margin: 36px 0;
  padding: 48px 56px;
  text-align: center;
  position: relative;
  background: var(--wemd-gradientSoft);
  border-radius: var(--wemd-radius-xl);
}
:global(.wemd-theme__bytedance-fullquote) .wemd-fq-text {
  font-family: var(--wemd-font-sans);
  font-size: 26px;
  line-height: 1.5;
  font-weight: 800;
  margin: 0 0 20px 0;
  color: var(--wemd-text);
  background: var(--wemd-heading-gradient);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
:global(.wemd-theme__bytedance-fullquote) .wemd-fq-src {
  font-family: var(--wemd-font-mono);
  font-size: 12px;
  letter-spacing: 2px;
  color: var(--wemd-text-muted);
  text-transform: uppercase;
  font-weight: 700;
  margin: 0;
}
"@
    sourceHtml = @"
<blockquote class=&quot;wemd-full-quote&quot; data-variant=&quot;bytedance-fullquote&quot;>
  <p class=&quot;wemd-fq-text&quot;>「始终创业，大胆假设，小心求证，永远保持对用户的敬畏。」</p>
  <cite class=&quot;wemd-fq-src&quot;>—— 字节跳动企业文化</cite>
</blockquote>
"@
    instruction = "整版大引言：淡渐变背景+超大渐变字引言+中央对齐+英文小写字源"
  },
  @{
    type = "pullquote"
    variant = "bytedance-pullquote"
    variantCss = @"
:global(.wemd-theme__bytedance-pullquote) { $VARS }
:global(.wemd-theme__bytedance-pullquote) .wemd-pullquote {
  float: right;
  width: 45%;
  margin: 12px 0 16px 24px;
  padding: 20px 24px;
  border-left: 4px solid var(--wemd-primary);
  background: var(--wemd-bg-alt);
  border-radius: 0 var(--wemd-radius-lg) var(--wemd-radius-lg) 0;
}
:global(.wemd-theme__bytedance-pullquote) .wemd-pq-text {
  font-weight: 800;
  font-size: 17px;
  line-height: 1.6;
  color: var(--wemd-text);
  margin: 0 0 10px 0;
}
:global(.wemd-theme__bytedance-pullquote) .wemd-pq-src {
  font-family: var(--wemd-font-mono);
  font-size: 11px;
  color: var(--wemd-text-muted);
  letter-spacing: 1.5px;
  text-transform: uppercase;
  margin: 0;
  font-weight: 700;
}
"@
    sourceHtml = @"
<aside class=&quot;wemd-pullquote&quot; data-variant=&quot;bytedance-pullquote&quot;>
  <p class=&quot;wemd-pq-text&quot;>段中引言：技术是第一生产力，推荐算法改变信息分发……</p>
  <cite class=&quot;wemd-pq-src&quot;>—— 内部讲话</cite>
</aside>
"@
    instruction = "段中右侧悬浮引言：右浮动45%宽+左4px红边+灰底右圆角+加粗引言+英文小字来源"
  },
  @{
    type = "article-section"
    variant = "bytedance-art-sec"
    variantCss = @"
:global(.wemd-theme__bytedance-art-sec) { $VARS }
:global(.wemd-theme__bytedance-art-sec) .wemd-article-section {
  margin: 48px 0 20px 0;
  padding-top: 16px;
}
:global(.wemd-theme__bytedance-art-sec) .wemd-as-chip {
  display: inline-block;
  padding: 6px 16px;
  border-radius: 999px;
  background: var(--wemd-bg-gradient);
  color: white;
  font-family: var(--wemd-font-mono);
  font-size: 11px;
  letter-spacing: 3px;
  font-weight: 700;
  text-transform: uppercase;
  margin: 0 0 12px 0;
}
:global(.wemd-theme__bytedance-art-sec) .wemd-as-title {
  font-family: var(--wemd-font-sans);
  font-weight: 900;
  font-size: 32px;
  line-height: 1.25;
  margin: 0 0 12px 0;
  color: var(--wemd-text);
}
:global(.wemd-theme__bytedance-art-sec) .wemd-as-title em {
  font-style: normal;
  background: var(--wemd-heading-gradient);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
:global(.wemd-theme__bytedance-art-sec) .wemd-as-sub {
  font-size: 15px;
  color: var(--wemd-text-muted);
  line-height: 1.7;
  margin: 0;
  max-width: 600px;
}
"@
    sourceHtml = @"
<section class=&quot;wemd-article-section&quot; data-variant=&quot;bytedance-art-sec&quot;>
  <span class=&quot;wemd-as-chip&quot;>PART · 01</span>
  <h2 class=&quot;wemd-as-title&quot;>这是<em>大章节</em>主标题</h2>
  <p class=&quot;wemd-as-sub&quot;>章节副标题 / 简介段落，简要说明本章主要内容和核心结论。</p>
</section>
"@
    instruction = "文章分段：PART 01渐变胶囊标+超大渐变字章节标题+灰色简介副标"
  },
  @{
    type = "related-posts"
    variant = "bytedance-related"
    variantCss = @"
:global(.wemd-theme__bytedance-related) { $VARS }
:global(.wemd-theme__bytedance-related) .wemd-related-posts {
  margin: 36px 0;
}
:global(.wemd-theme__bytedance-related) .wemd-rel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 0 0 16px 0;
}
:global(.wemd-theme__bytedance-related) .wemd-rel-title {
  font-weight: 900;
  font-size: 18px;
  color: var(--wemd-text);
  margin: 0;
  display: flex;
  align-items: center;
  gap: 10px;
}
:global(.wemd-theme__bytedance-related) .wemd-rel-title::before {
  content: "";
  width: 4px; height: 20px;
  border-radius: 4px;
  background: var(--wemd-bg-gradient);
}
:global(.wemd-theme__bytedance-related) .wemd-rel-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14px;
}
:global(.wemd-theme__bytedance-related) .wemd-rel-card {
  padding: 18px 20px;
  border-radius: var(--wemd-radius-md);
  background: var(--wemd-bg);
  border: 1px solid var(--wemd-border-light);
  box-shadow: var(--wemd-shadow-sm);
}
:global(.wemd-theme__bytedance-related) .wemd-rel-tag {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 999px;
  background: var(--wemd-gradientSoft);
  color: var(--wemd-primary);
  font-size: 11px;
  font-weight: 800;
  margin: 0 0 10px 0;
}
:global(.wemd-theme__bytedance-related) .wemd-rel-card-title {
  font-size: 15px;
  line-height: 1.55;
  color: var(--wemd-text);
  font-weight: 700;
  margin: 0;
}
"@
    sourceHtml = @"
<section class=&quot;wemd-related-posts&quot; data-variant=&quot;bytedance-related&quot;>
  <div class=&quot;wemd-rel-head&quot;>
    <h3 class=&quot;wemd-rel-title&quot;>延伸阅读</h3>
  </div>
  <div class=&quot;wemd-rel-grid&quot;>
    <article class=&quot;wemd-rel-card&quot;>
      <span class=&quot;wemd-rel-tag&quot;>品牌</span>
      <h4 class=&quot;wemd-rel-card-title&quot;>相关文章标题一…………</h4>
    </article>
    <article class=&quot;wemd-rel-card&quot;>
      <span class=&quot;wemd-rel-tag&quot;>案例</span>
      <h4 class=&quot;wemd-rel-card-title&quot;>相关文章标题二…………</h4>
    </article>
  </div>
</section>
"@
    instruction = "相关推荐：左渐变条竖线标题+2卡片网格，每卡有胶囊标签+标题"
  },
  @{
    type = "series-nav"
    variant = "bytedance-series"
    variantCss = @"
:global(.wemd-theme__bytedance-series) { $VARS }
:global(.wemd-theme__bytedance-series) .wemd-series-nav {
  margin: 28px 0;
  padding: 20px 24px;
  border-radius: var(--wemd-radius-lg);
  background: var(--wemd-bg-alt);
  border: 1px solid var(--wemd-border-light);
}
:global(.wemd-theme__bytedance-series) .wemd-s-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin: 0 0 16px 0;
}
:global(.wemd-theme__bytedance-series) .wemd-s-title {
  font-weight: 900;
  font-size: 16px;
  color: var(--wemd-text);
  margin: 0;
  display: flex;
  align-items: center;
  gap: 10px;
}
:global(.wemd-theme__bytedance-series) .wemd-s-title::before {
  content: "";
  width: 4px; height: 20px;
  border-radius: 4px;
  background: var(--wemd-bg-gradient);
}
:global(.wemd-theme__bytedance-series) .wemd-s-progress {
  font-family: var(--wemd-font-mono);
  font-size: 12px;
  color: var(--wemd-primary);
  font-weight: 800;
}
:global(.wemd-theme__bytedance-series) .wemd-s-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
:global(.wemd-theme__bytedance-series) .wemd-s-item {
  padding: 10px 14px;
  border-radius: var(--wemd-radius-sm);
  font-size: 14px;
  color: var(--wemd-text-muted);
  font-weight: 600;
}
:global(.wemd-theme__bytedance-series) .wemd-s-item.current {
  background: var(--wemd-gradientSoft);
  color: var(--wemd-primary);
  border-left: 3px solid var(--wemd-primary);
  font-weight: 800;
}
:global(.wemd-theme__bytedance-series) .wemd-s-item.done {
  color: var(--wemd-text-muted);
  text-decoration: line-through;
  opacity: 0.65;
}
"@
    sourceHtml = @"
<nav class=&quot;wemd-series-nav&quot; data-variant=&quot;bytedance-series&quot;>
  <div class=&quot;wemd-s-head&quot;>
    <h3 class=&quot;wemd-s-title&quot;>本系列文章</h3>
    <span class=&quot;wemd-s-progress&quot;>2 / 5</span>
  </div>
  <ol class=&quot;wemd-s-list&quot;>
    <li class=&quot;wemd-s-item done&quot;>01 · 已完成章节</li>
    <li class=&quot;wemd-s-item current&quot;>02 · 当前章节</li>
    <li class=&quot;wemd-s-item&quot;>03 · 后续章节</li>
    <li class=&quot;wemd-s-item&quot;>04 · 后续章节</li>
    <li class=&quot;wemd-s-item&quot;>05 · 后续章节</li>
  </ol>
</nav>
"@
    instruction = "系列文章导航：左上渐变竖条+红字进度+列表，current高亮淡渐变底+左3px红边"
  },
  @{
    type = "copyright-notice"
    variant = "bytedance-copyright"
    variantCss = @"
:global(.wemd-theme__bytedance-copyright) { $VARS }
:global(.wemd-theme__bytedance-copyright) .wemd-copyright-notice {
  margin: 36px 0 20px 0;
  padding: 22px 28px;
  border-radius: var(--wemd-radius-lg);
  background: var(--wemd-bg-alt);
  border: 1px dashed var(--wemd-primary);
  display: flex;
  gap: 18px;
  align-items: flex-start;
}
:global(.wemd-theme__bytedance-copyright) .wemd-copy-icon {
  flex-shrink: 0;
  width: 44px; height: 44px;
  border-radius: 50%;
  background: var(--wemd-bg-gradient);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 900;
  font-size: 16px;
}
:global(.wemd-theme__bytedance-copyright) .wemd-copy-body {
  flex: 1;
}
:global(.wemd-theme__bytedance-copyright) .wemd-copy-title {
  font-weight: 800;
  font-size: 15px;
  color: var(--wemd-text);
  margin: 2px 0 8px 0;
}
:global(.wemd-theme__bytedance-copyright) .wemd-copy-text {
  font-size: 13px;
  line-height: 1.7;
  color: var(--wemd-text-muted);
  margin: 0;
}
:global(.wemd-theme__bytedance-copyright) .wemd-copy-text strong {
  color: var(--wemd-primary);
}
"@
    sourceHtml = @"
<div class=&quot;wemd-copyright-notice&quot; data-variant=&quot;bytedance-copyright&quot;>
  <span class=&quot;wemd-copy-icon&quot;>©</span>
  <div class=&quot;wemd-copy-body&quot;>
    <h4 class=&quot;wemd-copy-title&quot;>版权声明</h4>
    <p class=&quot;wemd-copy-text&quot;>本文内容版权归 <strong>字节跳动 ByteDance</strong> 所有，未经书面授权，不得转载、摘编或以其他方式使用。授权转载请注明出处。</p>
  </div>
</div>
"@
    instruction = "版权声明：虚线红边框+圆形渐变©图标+标题+灰色正文（strong红）"
  },
  @{
    type = "tag-label"
    variant = "bytedance-tags"
    variantCss = @"
:global(.wemd-theme__bytedance-tags) { $VARS }
:global(.wemd-theme__bytedance-tags) .wemd-tag-label {
  margin: 20px 0;
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}
:global(.wemd-theme__bytedance-tags) .wemd-tag-prefix {
  font-family: var(--wemd-font-mono);
  font-size: 12px;
  letter-spacing: 2px;
  color: var(--wemd-text-muted);
  font-weight: 700;
  text-transform: uppercase;
}
:global(.wemd-theme__bytedance-tags) .wemd-tag {
  display: inline-block;
  padding: 7px 16px;
  border-radius: 999px;
  background: var(--wemd-bg);
  border: 1px solid var(--wemd-border-light);
  color: var(--wemd-text);
  font-weight: 600;
  font-size: 13px;
  box-shadow: var(--wemd-shadow-sm);
}
:global(.wemd-theme__bytedance-tags) .wemd-tag.hot {
  background: var(--wemd-bg-gradient);
  color: white;
  border-color: transparent;
  box-shadow: 0 6px 18px rgba(254, 44, 85, 0.28);
}
:global(.wemd-theme__bytedance-tags) .wemd-tag.sub {
  background: var(--wemd-gradientSoft);
  color: var(--wemd-primary);
  border-color: transparent;
}
"@
    sourceHtml = @"
<div class=&quot;wemd-tag-label&quot; data-variant=&quot;bytedance-tags&quot;>
  <span class=&quot;wemd-tag-prefix&quot;>TAGS ·</span>
  <span class=&quot;wemd-tag hot&quot;>#字节跳动</span>
  <span class=&quot;wemd-tag sub&quot;>#品牌文化</span>
  <span class=&quot;wemd-tag&quot;>#科技创新</span>
  <span class=&quot;wemd-tag&quot;>#全球化</span>
  <span class=&quot;wemd-tag&quot;>#人工智能</span>
</div>
"@
    instruction = "标签组：TAGS英文前缀+三种层级标签：hot（渐变主）、sub（淡红+红字）、普通（白描边）"
  }
)

Invoke-AiSave -batch "divider" -isLastBatch $true -blueprint $null -components $batch7

Write-Host ""
Write-Host "========== 全部 7 批 44 组件保存完成 ==========" -ForegroundColor Green
Write-Host "开始执行 POST /compile 编译打包..."
