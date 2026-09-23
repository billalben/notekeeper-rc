import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useRecordHotkeys } from "react-hotkeys-hook";
import { useUIStore } from "../../store/useUIStore";
import { useSettingsStore } from "../../store/useSettingsStore";
import { toast } from "../../store/useToastStore";
import {
  DEFAULT_SHORTCUTS,
  SHORTCUT_ACTIONS,
  SHORTCUT_ACTION_MAP,
  formatChord,
  findConflict,
  fromRecordedKeys,
  isModifierKey,
  isValidChord,
  normalizeChord,
  type ActionId,
  type ShortcutGroup,
} from "../../utils/shortcuts";
import { SettingsGroup, SettingsRow } from "./SettingsSection";

const GROUPS: ShortcutGroup[] = ["general", "editor", "navigation"];

export const SettingsShortcuts = () => {
  const { t } = useTranslation();
  const shortcuts = useSettingsStore((state) => state.shortcuts);
  const setShortcut = useSettingsStore((state) => state.setShortcut);
  const resetShortcut = useSettingsStore((state) => state.resetShortcut);
  const resetAllShortcuts = useSettingsStore(
    (state) => state.resetAllShortcuts,
  );
  const setRecordingShortcut = useUIStore(
    (state) => state.setRecordingShortcut,
  );
  const openShortcutHelp = useUIStore((state) => state.openShortcutHelp);

  const [recordingId, setRecordingId] = useState<ActionId | null>(null);

  const [recordedKeys, { start, stop, resetKeys, isRecording }] =
    useRecordHotkeys();

  /* eslint-disable react/set-state-in-effect -- the key recorder is an
     external system; its captured keys must be reconciled into state. */
  useEffect(() => {
    if (!isRecording || !recordingId) return;

    const nonModifier = [...recordedKeys].find(
      (token) => !isModifierKey(token),
    );
    if (!nonModifier) return;

    stop();
    setRecordingShortcut(false);
    resetKeys();
    setRecordingId(null);

    if (nonModifier === "escape") return;

    const chord = fromRecordedKeys(recordedKeys);
    if (!chord) return;

    if (!isValidChord(chord)) {
      toast.error(t("toasts.shortcutNotSaved"), {
        description: t("toasts.shortcutModifier"),
      });
      return;
    }

    const conflict = findConflict(shortcuts, recordingId, chord);
    if (conflict) {
      toast.error(t("toasts.shortcutNotSaved"), {
        description: t("toasts.shortcutConflict", {
          action: t(SHORTCUT_ACTION_MAP[conflict].labelKey),
        }),
      });
      return;
    }

    setShortcut(recordingId, chord);
  }, [
    recordedKeys,
    isRecording,
    recordingId,
    shortcuts,
    setShortcut,
    setRecordingShortcut,
    stop,
    resetKeys,
    t,
  ]);
  /* eslint-enable react/set-state-in-effect */

  useEffect(
    () => () => {
      setRecordingShortcut(false);
    },
    [setRecordingShortcut],
  );

  const beginRecording = (actionId: ActionId) => {
    resetKeys();
    setRecordingId(actionId);
    setRecordingShortcut(true);
    start();
  };

  const cancelRecording = () => {
    stop();
    resetKeys();
    setRecordingId(null);
    setRecordingShortcut(false);
  };

  const isAllDefault = SHORTCUT_ACTIONS.every(
    (action) =>
      normalizeChord(shortcuts[action.id]) ===
      normalizeChord(DEFAULT_SHORTCUTS[action.id]),
  );

  return (
    <>
      {GROUPS.map((group) => (
        <SettingsGroup
          key={group}
          title={t(`settings.shortcuts.groups.${group}`)}
        >
          {SHORTCUT_ACTIONS.filter((action) => action.group === group).map(
            (action) => {
              const isThisRecording = recordingId === action.id;
              const isCustom =
                normalizeChord(shortcuts[action.id]) !==
                normalizeChord(DEFAULT_SHORTCUTS[action.id]);
              const label = t(action.labelKey);

              return (
                <SettingsRow
                  key={action.id}
                  title={label}
                  description={t(action.descriptionKey)}
                >
                  <div className="shortcut-control">
                    <button
                      type="button"
                      className={`shortcut-key-btn${
                        isThisRecording ? " is-recording" : ""
                      }`}
                      aria-label={t("settings.shortcuts.changeShortcut", {
                        action: label,
                      })}
                      aria-pressed={isThisRecording}
                      onClick={() =>
                        isThisRecording
                          ? cancelRecording()
                          : beginRecording(action.id)
                      }
                    >
                      {isThisRecording
                        ? t("settings.shortcuts.recording")
                        : formatChord(shortcuts[action.id])}
                    </button>
                    {isCustom && (
                      <button
                        type="button"
                        className="shortcut-reset-btn"
                        aria-label={t("settings.shortcuts.resetShortcut", {
                          action: label,
                        })}
                        title={t("settings.shortcuts.resetToDefault")}
                        onClick={() => {
                          resetShortcut(action.id);
                        }}
                      >
                        <span
                          className="material-symbols-rounded"
                          aria-hidden="true"
                        >
                          restart_alt
                        </span>
                      </button>
                    )}
                  </div>
                </SettingsRow>
              );
            },
          )}
        </SettingsGroup>
      ))}

      <SettingsGroup title={t("settings.shortcuts.moreGroup")}>
        <SettingsRow
          title={t("settings.shortcuts.referenceTitle")}
          description={t("settings.shortcuts.referenceDesc")}
        >
          <button className="btn text" type="button" onClick={openShortcutHelp}>
            <span className="text-label-large">
              {t("settings.shortcuts.viewAll")}
            </span>
            <div className="state-layer" />
          </button>
        </SettingsRow>

        <SettingsRow
          title={t("settings.shortcuts.resetAllTitle")}
          description={t("settings.shortcuts.resetAllDesc")}
        >
          <button
            className="btn text"
            type="button"
            disabled={isAllDefault}
            onClick={() => {
              resetAllShortcuts();
              toast.success(t("toasts.shortcutsReset"));
            }}
          >
            <span className="text-label-large">{t("common.reset")}</span>
            <div className="state-layer" />
          </button>
        </SettingsRow>
      </SettingsGroup>
    </>
  );
};
