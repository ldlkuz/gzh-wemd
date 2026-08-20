/**
 * serve-preview.cjs — 预览静态服务器
 * 指向 skill 的 themes/ 目录，用于预览主题视觉稿 / 发布 HTML。
 * 用法：node scripts/serve-preview.cjs [port]
 */
const http = require("http");
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..", "themes");
const PORT = Number(process.argv[2]) || 5700;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

http
  .createServer((req, res) => {
    const urlPath = decodeURIComponent(req.url.split("?")[0]);
    // 目录 → 找 index.html 或列出目录
    let filePath = path.join(ROOT, urlPath);
    if (!filePath.startsWith(ROOT)) {
      res.writeHead(403);
      res.end("Forbidden");
      return;
    }
    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
      const index = path.join(filePath, "index.html");
      filePath = fs.existsSync(index) ? index : filePath;
    }
    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
      // 列出目录
      const items = fs.readdirSync(filePath).filter((f) => !f.startsWith("."));
      const links = items
        .map((f) => `<a href="${path.join(urlPath, f)}">${f}/</a>`)
        .join("<br>");
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(`<h3>themes/</h3>${links}`);
      return;
    }
    if (!fs.existsSync(filePath)) {
      res.writeHead(404);
      res.end("Not Found");
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
    fs.createReadStream(filePath).pipe(res);
  })
  .listen(PORT, () => {
    console.log(`Preview server: http://localhost:${PORT}/`);
    console.log(`Vision mockup: http://localhost:${PORT}/retro-newspaper/preview/vision.html`);
  });
