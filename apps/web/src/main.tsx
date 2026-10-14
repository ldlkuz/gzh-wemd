import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { StorageProvider } from "./storage/StorageContext";
import { ErrorBoundary } from "./components/ErrorBoundary/ErrorBoundary";
import {
  getSafeSessionStorage,
  installPreloadErrorHandler,
} from "./bootstrap/installPreloadErrorHandler";
import { installLogBridge } from "./bootstrap/installLogBridge";

// Electron 下把渲染层报错转发到主进程日志文件（浏览器版自动跳过）
installLogBridge({
  target: window,
  bridge: (
    window as {
      electron?: { log?: { write?: (level: string, message: string) => void } };
    }
  ).electron?.log,
  console,
});

installPreloadErrorHandler({
  target: window,
  storage: getSafeSessionStorage(),
  now: () => Date.now(),
  reload: () => window.location.reload(),
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <StorageProvider>
        <App />
      </StorageProvider>
    </ErrorBoundary>
  </StrictMode>,
);
