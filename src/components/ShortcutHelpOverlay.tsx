import { useRef } from "react";
import { useActionHotkey } from "../hooks/useActionHotkey";
import { useFocusTrap } from "../hooks/useFocusTrap";
import { useSettingsStore } from "../store/useSettingsStore";
import {
  SHORTCUT_ACTIONS,
  formatChord,
  type ShortcutGroup,
} from "../utils/shortcuts";
import { IconButton } from "./IconButton";

interface ShortcutHelpOverlayProps {
  onClose: () => void;
}

const GROUPS: ShortcutGroup[] = ["General", "Editor", "Navigation"];

export const ShortcutHelpOverlay = ({ onClose }: ShortcutHelpOverlayProps) => {
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
            Keyboard shortcuts
          </h2>
          <IconButton
            icon="close"
            label="Close shortcuts"
            onClick={onClose}
          />
        </div>

        <div className="shortcut-help-body custom-scrollbar">
          {GROUPS.map((group) => (
            <section key={group} className="shortcut-help-group">
              <h3 className="shortcut-help-group-title text-label-large">
                {group}
              </h3>
              <ul className="shortcut-help-list">
                {SHORTCUT_ACTIONS.filter(
                  (action) => action.group === group,
                ).map((action) => (
                  <li key={action.id} className="shortcut-help-row">
                    <span className="text-body-medium">{action.label}</span>
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
