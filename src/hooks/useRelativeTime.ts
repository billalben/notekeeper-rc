import { useMemo } from "react";
import { useTranslation } from "react-i18next";

const MINUTE_MS = 60 * 1000;

/**
 * Locale-aware relative time formatter (e.g. "5 minutes ago", "yesterday").
 * Falls back to a translated "Just now" for very recent timestamps.
 */
export const useRelativeTime = (): ((milliseconds: number) => string) => {
  const { t, i18n } = useTranslation();

  return useMemo(() => {
    const formatter = new Intl.RelativeTimeFormat(i18n.language, {
      numeric: "auto",
    });

    return (milliseconds: number) => {
      const minutes = Math.floor((Date.now() - milliseconds) / MINUTE_MS);
      if (minutes < 1) return t("common.justNow");
      if (minutes < 60) return formatter.format(-minutes, "minute");

      const hours = Math.floor(minutes / 60);
      if (hours < 24) return formatter.format(-hours, "hour");

      return formatter.format(-Math.floor(hours / 24), "day");
    };
  }, [t, i18n.language]);
};
