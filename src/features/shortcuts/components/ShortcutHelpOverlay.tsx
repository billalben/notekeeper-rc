import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { useActionHotkey } from "@/features/shortcuts/hooks/useActionHotkey";
import { useFocusTrap } from "@/shared/hooks/useFocusTrap";
import { useSettingsStore } from "@/shared/stores/useSettingsStore";
import {
  SHORTCUT_ACTIONS,
  formatChord,
  type ShortcutGroup,
} from "@/shared/lib/shortcuts";
import { IconButton } from "@/shared/ui/IconButton";

interface ShortcutHelpOverlayProps {
  onClose: () => void;
}

const GROUPS: ShortcutGroup[] = ["general", "editor", "navigation"];

export const ShortcutHelpOverlay = ({ onClose }: ShortcutHelpOverlayProps) => {
  const { t } = useTranslation();
  const shortcuts = useSettingsStore((state) => state.shortcuts);
  const dialogRef = useRef<HTMLDivElement>(null);

  useFocusTrap(dialogRef);

  useActionHotkey("closeModal", onClose, { enableOnFormTags: true });
  useActionHotkey("shortcutHelp", onClose, { enableOnFormTags: true });

  return (
    <>
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="shortcut-help-title"
        className="modal shortcut-help-modal"
      >
        <div className="shortcut-help-header">
          <h2 id="shortcut-help-title" className="text-title-medium">
            {t("header.keyboardShortcuts")}
          </h2>
          <IconButton
            icon="close"
            label={t("common.close")}
            onClick={onClose}
          />
        </div>

        <div className="shortcut-help-body custom-scrollbar">
          {GROUPS.map((group) => (
            <section key={group} className="shortcut-help-group">
              <h3 className="shortcut-help-group-title text-label-large">
                {t(`settings.shortcuts.groups.${group}`)}
              </h3>
              <ul className="shortcut-help-list">
                {SHORTCUT_ACTIONS.filter(
                  (action) => action.group === group,
                ).map((action) => (
                  <li key={action.id} className="shortcut-help-row">
                    <span className="text-body-medium">
                      {t(action.labelKey)}
                    </span>
                    <kbd className="shortcut-key text-label-large">
                      {formatChord(shortcuts[action.id])}
                    </kbd>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
      <div className="overlay modal-overlay" onClick={onClose} />
    </>
  );
};
