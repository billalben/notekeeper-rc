import type { ToastPosition } from "../../types";
import { toast } from "../../store/useToastStore";
import {
  TOAST_DURATION_MAX,
  TOAST_DURATION_MIN,
  TOAST_MAX_VISIBLE_MAX,
  TOAST_MAX_VISIBLE_MIN,
  useSettingsStore,
} from "../../store/useSettingsStore";
import {
  SettingsGroup,
  SettingsRow,
  SettingsSwitch,
} from "./SettingsSection";

const POSITIONS: { value: ToastPosition; label: string }[] = [
  { value: "top-left", label: "Top left" },
  { value: "top-center", label: "Top center" },
  { value: "top-right", label: "Top right" },
  { value: "bottom-left", label: "Bottom left" },
  { value: "bottom-center", label: "Bottom center" },
  { value: "bottom-right", label: "Bottom right" },
];

const PREVIEWS: { key: string; label: string; run: () => void }[] = [
  {
    key: "success",
    label: "Success",
    run: () =>
      toast.success("Note saved", {
        description: "Your changes were saved.",
        action: { label: "Undo", onClick: () => toast.info("Action clicked") },
      }),
  },
  {
    key: "error",
    label: "Error",
    run: () =>
      toast.error("Couldn't import notes", {
        description: "The selected file isn't a valid backup.",
      }),
  },
  {
    key: "info",
    label: "Info",
    run: () =>
      toast.info("Tip", {
        description: "You can customize where notifications appear.",
      }),
  },
];

export const SettingsNotifications = () => {
  const toasts = useSettingsStore((state) => state.toasts);
  const setToastSettings = useSettingsStore((state) => state.setToastSettings);
  const resetToastSettings = useSettingsStore(
    (state) => state.resetToastSettings,
  );

  return (
    <>
      <SettingsGroup title="Preview">
        <SettingsRow
          title="Preview notifications"
          description="See how each notification type looks."
        >
          <div className="settings-preview-actions">
            {PREVIEWS.map((preview) => (
              <button
                key={preview.key}
                type="button"
                className="btn text"
                disabled={!toasts.enabled}
                onClick={preview.run}
              >
                <span className="text-label-large">{preview.label}</span>
                <div className="state-layer" />
              </button>
            ))}
          </div>
        </SettingsRow>
      </SettingsGroup>

      <SettingsGroup title="Toasts">
        <SettingsRow
          title="Enable toasts"
          description="Show notifications for actions, results, and errors."
        >
          <SettingsSwitch
            checked={toasts.enabled}
            label="Enable toasts"
            onChange={(enabled) => setToastSettings({ enabled })}
          />
        </SettingsRow>

        <SettingsRow
          title="Position"
          description="Where notifications appear on screen."
        >
          <select
            className="settings-select"
            aria-label="Toast position"
            value={toasts.position}
            disabled={!toasts.enabled}
            onChange={(event) =>
              setToastSettings({
                position: event.target.value as ToastPosition,
              })
            }
          >
            {POSITIONS.map((position) => (
              <option key={position.value} value={position.value}>
                {position.label}
              </option>
            ))}
          </select>
        </SettingsRow>

        <SettingsRow
          title="Duration"
          description="How long each notification stays on screen."
        >
          <div className="settings-range-control">
            <input
              type="range"
              className="settings-range"
              aria-label="Toast duration in seconds"
              min={TOAST_DURATION_MIN}
              max={TOAST_DURATION_MAX}
              step={500}
              value={toasts.duration}
              disabled={!toasts.enabled}
              onChange={(event) =>
                setToastSettings({ duration: Number(event.target.value) })
              }
            />
            <span className="settings-range-value text-label-large">
              {toasts.duration / 1000}s
            </span>
          </div>
        </SettingsRow>

        <SettingsRow
          title="Maximum visible"
          description="How many notifications stack at once."
        >
          <div className="settings-range-control">
            <input
              type="range"
              className="settings-range"
              aria-label="Maximum visible toasts"
              min={TOAST_MAX_VISIBLE_MIN}
              max={TOAST_MAX_VISIBLE_MAX}
              step={1}
              value={toasts.maxVisible}
              disabled={!toasts.enabled}
              onChange={(event) =>
                setToastSettings({ maxVisible: Number(event.target.value) })
              }
            />
            <span className="settings-range-value text-label-large">
              {toasts.maxVisible}
            </span>
          </div>
        </SettingsRow>

        <SettingsRow
          title="Show close button"
          description="Let each notification be dismissed manually."
        >
          <SettingsSwitch
            checked={toasts.showCloseButton}
            label="Show close button"
            onChange={(showCloseButton) => setToastSettings({ showCloseButton })}
          />
        </SettingsRow>
      </SettingsGroup>

      <SettingsGroup title="Reset">
        <SettingsRow
          title="Reset notification settings"
          description="Restore all notification options to their defaults."
        >
          <button
            className="btn text"
            type="button"
            onClick={resetToastSettings}
          >
            <span className="text-label-large">Reset</span>
            <div className="state-layer" />
          </button>
        </SettingsRow>
      </SettingsGroup>
    </>
  );
};
