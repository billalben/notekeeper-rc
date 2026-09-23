import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles/index.css";
import "./i18n";
import i18n, { loadLanguage } from "./i18n";
import App from "./App.tsx";
import { setupPWA } from "./pwa";
import { useSettingsStore } from "./store/useSettingsStore";

const initialLanguage = useSettingsStore.getState().language;
void loadLanguage(initialLanguage).then(() => {
  void i18n.changeLanguage(initialLanguage);
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

setupPWA();
