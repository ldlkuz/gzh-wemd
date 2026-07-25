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
