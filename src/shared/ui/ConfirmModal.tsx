import type { ReactNode } from "react";
import { Trans, useTranslation } from "react-i18next";
import { useActionHotkey } from "@/features/shortcuts/hooks/useActionHotkey";
import { useSettingsStore } from "@/shared/stores/useSettingsStore";
import { Button } from "./Button";

interface ConfirmModalProps {
  title?: string;
  heading?: ReactNode;
  description?: string;
  confirmLabel?: string;
  stacked?: boolean;
  onConfirm: (isConfirm: boolean) => void;
}

export const ConfirmModal = ({
  title,
  heading,
  description,
  confirmLabel,
  stacked = false,
  onConfirm,
}: ConfirmModalProps) => {
  const { t } = useTranslation();

  useActionHotkey("closeModal", () => onConfirm(false), {
    enableOnFormTags: true,
  });

  return (
    <>
      <div className={`modal${stacked ? " modal-stacked" : ""}`}>
        <h3 className="modal-title text-title-medium">
          {heading ?? (
            <Trans
              i18nKey="confirm.deleteQuestion"
              values={{ title: title ?? "" }}
              components={{ strong: <strong /> }}
            />
          )}
        </h3>
        {description && (
          <p className="modal-description text-body-medium">{description}</p>
        )}
        <div className="modal-footer">
          <Button onClick={() => onConfirm(false)}>{t("common.cancel")}</Button>
          <Button variant="fill" onClick={() => onConfirm(true)}>
            {confirmLabel ?? t("confirm.delete")}
          </Button>
        </div>
      </div>
      <div
        className={`overlay modal-overlay${stacked ? " modal-stacked" : ""}`}
        onClick={(event) => {
          if (
            useSettingsStore.getState().editor.closeModalOnBackdropClick &&
            event.target === event.currentTarget
          ) {
            onConfirm(false);
          }
        }}
      />
    </>
  );
};
