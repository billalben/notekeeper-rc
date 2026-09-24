import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { useSettingsStore } from "@/shared/stores/useSettingsStore";
import { useToastStore } from "@/shared/stores/useToastStore";
import { Toast } from "@/shared/ui/Toast";

export const ToastRegion = () => {
  const { t } = useTranslation();
  const toasts = useToastStore((state) => state.toasts);
  const dismissToast = useToastStore((state) => state.dismissToast);
  const position = useSettingsStore((state) => state.toasts.position);

  return createPortal(
    <div
      className={`toast-region ${position}`}
      aria-label={t("common.notifications")}
    >
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onDismiss={dismissToast} />
      ))}
    </div>,
    document.body,
  );
};
