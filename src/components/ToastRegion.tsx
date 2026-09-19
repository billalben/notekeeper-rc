import { createPortal } from "react-dom";
import { useSettingsStore } from "../store/useSettingsStore";
import { useToastStore } from "../store/useToastStore";
import { Toast } from "./Toast";

export const ToastRegion = () => {
  const toasts = useToastStore((state) => state.toasts);
  const dismissToast = useToastStore((state) => state.dismissToast);
  const position = useSettingsStore((state) => state.toasts.position);

  return createPortal(
    <div className={`toast-region ${position}`} aria-label="Notifications">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onDismiss={dismissToast} />
      ))}
    </div>,
    document.body,
  );
};
