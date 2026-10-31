import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@/styles/index.css";
import "./i18n";
import i18n, { loadLanguage } from "@/app/i18n";
import App from "./App.tsx";
import { ErrorBoundary } from "./ErrorBoundary";
import { setupPWA } from "./pwa";
import { useSettingsStore } from "@/shared/stores/useSettingsStore";

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
