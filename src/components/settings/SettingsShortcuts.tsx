import { useEffect, useState } from "react";
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

const GROUPS: ShortcutGroup[] = ["General", "Editor", "Navigation"];

export const SettingsShortcuts = () => {
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
      toast.error("Shortcut not saved", {
        description: "Use a modifier (⌘/Ctrl, Alt) plus a key.",
      });
      return;
    }

    const conflict = findConflict(shortcuts, recordingId, chord);
    if (conflict) {
      toast.error("Shortcut not saved", {
        description: `Already used by “${SHORTCUT_ACTION_MAP[conflict].label}”.`,
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
        <SettingsGroup key={group} title={group}>
          {SHORTCUT_ACTIONS.filter((action) => action.group === group).map(
            (action) => {
              const isThisRecording = recordingId === action.id;
              const isCustom =
                normalizeChord(shortcuts[action.id]) !==
                normalizeChord(DEFAULT_SHORTCUTS[action.id]);

              return (
                <SettingsRow
                  key={action.id}
                  title={action.label}
                  description={action.description}
                >
                  <div className="shortcut-control">
                    <button
                      type="button"
                      className={`shortcut-key-btn${
                        isThisRecording ? " is-recording" : ""
                      }`}
                      aria-label={`Change shortcut for ${action.label}`}
                      aria-pressed={isThisRecording}
                      onClick={() =>
                        isThisRecording
                          ? cancelRecording()
                          : beginRecording(action.id)
                      }
                    >
                      {isThisRecording
                        ? "Recording…"
                        : formatChord(shortcuts[action.id])}
                    </button>
                    {isCustom && (
                      <button
                        type="button"
                        className="shortcut-reset-btn"
                        aria-label={`Reset ${action.label} to default`}
                        title="Reset to default"
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

      <SettingsGroup title="More">
        <SettingsRow
          title="Shortcut reference"
          description="See every shortcut in one place."
        >
          <button
            className="btn text"
            type="button"
            onClick={openShortcutHelp}
          >
            <span className="text-label-large">View all</span>
            <div className="state-layer" />
          </button>
        </SettingsRow>

        <SettingsRow
          title="Reset all shortcuts"
          description="Restore every binding to its default."
        >
          <button
            className="btn text"
            type="button"
            disabled={isAllDefault}
            onClick={() => {
              resetAllShortcuts();
              toast.success("Shortcuts reset to defaults");
            }}
          >
            <span className="text-label-large">Reset</span>
            <div className="state-layer" />
          </button>
        </SettingsRow>
      </SettingsGroup>
    </>
  );
};
