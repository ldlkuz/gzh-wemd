# 打包 Windows 版（WeMD Desktop）
#
# 作用：复用仓库内 .tmp 的 electron / electron-builder 缓存，避免联网下载。
#   缓存不存在时 electron-builder 会自动回退为在线下载，脚本无需改动。
#
# 用法：pwsh scripts/build-win.ps1

$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot

$env:ELECTRON_CACHE = Join-Path $root ".tmp\electron-cache"
$env:ELECTRON_BUILDER_CACHE = Join-Path $root ".tmp\electron-builder-cache"

Write-Host "ELECTRON_CACHE         = $env:ELECTRON_CACHE"
Write-Host "ELECTRON_BUILDER_CACHE = $env:ELECTRON_BUILDER_CACHE"
Write-Host ""

# 复用 apps/electron 里已有的构建链：web 构建 → electron 构建 → 组装运行时 → electron-builder
pnpm --filter wemd-electron run build:win
