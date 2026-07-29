@echo off
echo Starting WeMD Web Dev Server...
cd /d "%~dp0"
pnpm dev:web
pause
