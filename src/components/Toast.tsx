import { useCallback, useEffect, useRef, useState } from "react";
import type { ToastType } from "../types";
import { useSettingsStore } from "../store/useSettingsStore";
import type { ToastItem } from "../store/useToastStore";
import { IconButton } from "./IconButton";

const EXIT_DURATION = 200;

const TYPE_ICONS: Record<ToastType, string> = {
  success: "check_circle",
  error: "error",
  info: "info",
};

interface ToastProps {
  toast: ToastItem;
  onDismiss: (id: string) => void;
}

export const Toast = ({ toast, onDismiss }: ToastProps) => {
  const defaultDuration = useSettingsStore((state) => state.toasts.duration);
  const showCloseButton = useSettingsStore(
    (state) => state.toasts.showCloseButton,
  );

  const duration = toast.duration ?? defaultDuration;

  const [exiting, setExiting] = useState(false);
  const [paused, setPaused] = useState(false);
  const exitingRef = useRef(false);
  const remainingRef = useRef(duration);
  const startedAtRef = useRef(0);

  const requestDismiss = useCallback(() => {
    if (exitingRef.current) return;
    exitingRef.current = true;
    setExiting(true);
    window.setTimeout(() => onDismiss(toast.id), EXIT_DURATION);
  }, [onDismiss, toast.id]);

  useEffect(() => {
    if (paused || exiting) return;

    startedAtRef.current = Date.now();
    const timer = window.setTimeout(requestDismiss, remainingRef.current);

    return () => {
      window.clearTimeout(timer);
      remainingRef.current -= Date.now() - startedAtRef.current;
    };
  }, [paused, exiting, requestDismiss]);

  const handleAction = () => {
    toast.action?.onClick();
    requestDismiss();
  };

  return (
    <div
      role={toast.type === "error" ? "alert" : "status"}
      className={`toast ${toast.type}${exiting ? " exiting" : ""}`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <span className="material-symbols-rounded toast-icon" aria-hidden="true">
        {TYPE_ICONS[toast.type]}
      </span>

      <div className="toast-body">
        <p className="toast-message text-body-medium">{toast.message}</p>
        {toast.description && (
          <p className="toast-description text-body-small">
            {toast.description}
          </p>
        )}
      </div>

      {toast.action && (
        <button
          type="button"
          className="toast-action text-label-large"
          onClick={handleAction}
        >
          {toast.action.label}
          <div className="state-layer" />
        </button>
      )}

      {showCloseButton && (
        <IconButton
          icon="close"
          size="small"
          label="Dismiss notification"
          className="toast-close"
          onClick={requestDismiss}
        />
      )}
    </div>
  );
};
