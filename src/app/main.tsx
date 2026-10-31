import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@/styles/index.css";
import "./i18n";
import i18n, { loadLanguage } from "@/app/i18n";
import App from "./App.tsx";
import { ErrorBoundary } from "./ErrorBoundary";
import { captureLaunchIntent } from "./launchIntent";
import { setupPWA } from "./pwa";
import { useSettingsStore } from "@/shared/stores/useSettingsStore";

// Must run before the hash router's first render, which rewrites the URL and
// would otherwise drop `/share` payloads and `?action=…` shortcut params.
captureLaunchIntent();

const initialLanguage = useSettingsStore.getState().language;
void loadLanguage(initialLanguage).then(() => {
  void i18n.changeLanguage(initialLanguage);
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);

setupPWA();
