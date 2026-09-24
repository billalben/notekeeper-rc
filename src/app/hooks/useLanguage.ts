import { useEffect } from "react";
import i18n, { directionFor, loadLanguage } from "@/app/i18n";
import { useSettingsStore } from "@/shared/stores/useSettingsStore";

/**
 * Loads the selected language bundle (lazy for non-English), then syncs the
 * i18next instance, document `lang`/`dir`, and page title.
 */
export const useLanguage = (): void => {
  const language = useSettingsStore((state) => state.language);

  useEffect(() => {
    let cancelled = false;

    const applyLanguage = async () => {
      await loadLanguage(language);
      if (cancelled) return;
      if (i18n.language !== language) await i18n.changeLanguage(language);
      if (cancelled) return;
      document.documentElement.lang = language;
      document.documentElement.dir = directionFor(language);
      document.title = i18n.t("common.appTitle");
    };

    void applyLanguage();
    return () => {
      cancelled = true;
    };
  }, [language]);
};
