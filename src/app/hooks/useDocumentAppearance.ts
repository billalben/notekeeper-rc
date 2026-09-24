import { useEffect } from "react";
import { useSettingsStore } from "@/shared/stores/useSettingsStore";
import { useThemeStore } from "@/shared/stores/useThemeStore";

/**
 * Mirrors theme, motion, and appearance settings onto the document root so CSS
 * can react to them without prop drilling.
 */
export const useDocumentAppearance = (): void => {
  const theme = useThemeStore((state) => state.theme);
  const motion = useSettingsStore((state) => state.motion);
  const appearance = useSettingsStore((state) => state.appearance);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    const root = document.documentElement;
    if (motion === "system") root.removeAttribute("data-motion");
    else root.setAttribute("data-motion", motion);
  }, [motion]);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-accent", appearance.accent);
    root.setAttribute("data-font", appearance.fontScale);
    root.setAttribute("data-density", appearance.density);
    root.setAttribute("data-radius", appearance.radius);
    root.setAttribute(
      "data-contrast",
      appearance.highContrast ? "high" : "default",
    );
  }, [appearance]);
};
