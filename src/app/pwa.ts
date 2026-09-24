import { registerSW } from "virtual:pwa-register";
import i18n from "@/app/i18n";
import { toast } from "@/shared/stores/useToastStore";

/**
 * Registers the service worker and surfaces update/offline events as toasts
 * (F-02). Off by default in development (`devOptions.enabled` is `false`), so
 * this is effectively production-only behavior.
 */
export const setupPWA = () => {
  if (!("serviceWorker" in navigator)) return;

  let updateNotified = false;

  const updateSW = registerSW({
    immediate: true,
    onNeedRefresh() {
      if (updateNotified) return;
      updateNotified = true;

      toast.info(i18n.t("pwa.updateAvailable"), {
        description: i18n.t("pwa.updateAvailableDesc"),
        duration: 10000,
        action: {
          label: i18n.t("pwa.reload"),
          onClick: () => updateSW(true),
        },
      });
    },
    onOfflineReady() {
      toast.success(i18n.t("pwa.offlineReady"), {
        description: i18n.t("pwa.offlineReadyDesc"),
      });
    },
    onRegisterError(error) {
      console.error("Service worker registration failed:", error);
    },
  });
};
