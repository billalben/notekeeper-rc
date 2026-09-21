import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "./i18n";
import i18n from "./i18n";
import App from "./App.tsx";
import { useSettingsStore } from "./store/useSettingsStore";

i18n.changeLanguage(useSettingsStore.getState().language);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
