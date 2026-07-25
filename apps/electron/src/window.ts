import { app, BrowserWindow, nativeImage } from "electron";
import * as fs from "fs";
import * as path from "path";

export interface CreateWindowOptions {
  isDev: boolean;
  onClosed: () => void;
}

function getWindowIcon() {
  let iconPath = path.join(__dirname, "assets", "icon.png");

  if (!fs.existsSync(iconPath)) {
    iconPath = path.join(__dirname, "..", "assets", "icon.png");
  }

  const img = nativeImage.createFromPath(iconPath);
  return img.isEmpty() ? null : img;
}

export function createWindow({
  isDev,
  onClosed,
}: CreateWindowOptions): BrowserWindow {
  const windowIcon = getWindowIcon() || undefined;
  const isWindows = process.platform === "win32";

  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 1024,
    minHeight: 640,
    title: "WeMD",
    icon: windowIcon,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
      // 打包模式下前端通过 file:// 加载,需要访问 http://localhost:4000 后端
      // 默认 webSecurity:true 会阻止 file:// → http:// 的跨协议请求
      webSecurity: !isDev ? false : true,
    },
    titleBarStyle: "hidden",
    frame: !isWindows,
    titleBarOverlay: isWindows
      ? false
      : {
          color: "#f5f7f9",
          symbolColor: "#2c2c2c",
          height: 48,
        },
    trafficLightPosition: { x: 20, y: 28 },
    show: false,
  });

  const startUrl = process.env.ELECTRON_START_URL
    ? process.env.ELECTRON_START_URL
    : isDev
      ? "http://localhost:5173"
      : `file://${path.join(process.resourcesPath, "web-dist", "index.html")}`;

  console.log("[WeMD] Loading URL:", startUrl);
  console.log("[WeMD] isDev:", isDev);
  console.log("[WeMD] resourcesPath:", process.resourcesPath);

  mainWindow.loadURL(startUrl);

  mainWindow.once("ready-to-show", () => {
    if (mainWindow.isDestroyed()) return;
    mainWindow.maximize();
    mainWindow.show();
  });

  mainWindow.on("closed", onClosed);

  return mainWindow;
}

export function configureAppIdentity(): void {
  app.setName("WeMD");
  app.setAppUserModelId("com.wemd.app");
}
