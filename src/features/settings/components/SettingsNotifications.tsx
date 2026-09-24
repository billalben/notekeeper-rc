import type { TFunction } from "i18next";
import { useTranslation } from "react-i18next";
import type { ToastPosition } from "@/shared/types";
import { toast } from "@/shared/stores/useToastStore";
import {
  TOAST_DURATION_MAX,
  TOAST_DURATION_MIN,
  TOAST_MAX_VISIBLE_MAX,
  TOAST_MAX_VISIBLE_MIN,
  useSettingsStore,
} from "@/shared/stores/useSettingsStore";
import {
  SettingsGroup,
  SettingsRow,
} from "@/features/settings/components/SettingsSection";
import { Select } from "@/shared/ui/Select";
import { Switch } from "@/shared/ui/Switch";

const POSITIONS: ToastPosition[] = [
  "top-left",
  "top-center",
  "top-right",
  "bottom-left",
  "bottom-center",
  "bottom-right",
];

type PositionLabelKey =
  | "settings.notifications.positions.topLeft"
  | "settings.notifications.positions.topCenter"
  | "settings.notifications.positions.topRight"
  | "settings.notifications.positions.bottomLeft"
  | "settings.notifications.positions.bottomCenter"
  | "settings.notifications.positions.bottomRight";

const POSITION_KEYS: Record<ToastPosition, PositionLabelKey> = {
  "top-left": "settings.notifications.positions.topLeft",
  "top-center": "settings.notifications.positions.topCenter",
  "top-right": "settings.notifications.positions.topRight",
  "bottom-left": "settings.notifications.positions.bottomLeft",
  "bottom-center": "settings.notifications.positions.bottomCenter",
  "bottom-right": "settings.notifications.positions.bottomRight",
};

interface Preview {
  key: string;
  labelKey:
    | "settings.notifications.labels.success"
    | "settings.notifications.labels.error"
    | "settings.notifications.labels.info";
  run: (t: TFunction) => void;
}

const PREVIEWS: Preview[] = [
  {
    key: "success",
    labelKey: "settings.notifications.labels.success",
    run: (t) =>
      toast.success(t("settings.notifications.successMessage"), {
        description: t("settings.notifications.successDesc"),
        action: {
          label: t("common.undo"),
          onClick: () => toast.info(t("toasts.actionClicked")),
        },
      }),
  },
  {
    key: "error",
    labelKey: "settings.notifications.labels.error",
    run: (t) =>
      toast.error(t("settings.notifications.errorMessage"), {
        description: t("settings.notifications.errorDesc"),
      }),
  },
  {
    key: "info",
    labelKey: "settings.notifications.labels.info",
    run: (t) =>
      toast.info(t("settings.notifications.infoMessage"), {
        description: t("settings.notifications.infoDesc"),
      }),
  },
];

export const SettingsNotifications = () => {
  const { t } = useTranslation();
  const toasts = useSettingsStore((state) => state.toasts);
  const setToastSettings = useSettingsStore((state) => state.setToastSettings);
  const resetToastSettings = useSettingsStore(
    (state) => state.resetToastSettings,
  );

  return (
    <>
      <SettingsGroup title={t("settings.notifications.previewGroup")}>
        <SettingsRow
          title={t("settings.notifications.previewTitle")}
          description={t("settings.notifications.previewDesc")}
        >
          <div className="settings-preview-actions">
            {PREVIEWS.map((preview) => (
              <button
                key={preview.key}
                type="button"
                className="btn text"
                disabled={!toasts.enabled}
                onClick={() => preview.run(t)}
              >
                <span className="text-label-large">{t(preview.labelKey)}</span>
                <div className="state-layer" />
              </button>
            ))}
          </div>
        </SettingsRow>
      </SettingsGroup>

      <SettingsGroup title={t("settings.notifications.toastsGroup")}>
        <SettingsRow
          title={t("settings.notifications.enableTitle")}
          description={t("settings.notifications.enableDesc")}
        >
          <Switch
            checked={toasts.enabled}
            label={t("settings.notifications.enableLabel")}
            onChange={(enabled) => setToastSettings({ enabled })}
          />
        </SettingsRow>

        <SettingsRow
          title={t("settings.notifications.positionTitle")}
          description={t("settings.notifications.positionDesc")}
        >
          <Select
            label={t("settings.notifications.positionLabel")}
            value={toasts.position}
            disabled={!toasts.enabled}
            options={POSITIONS.map((position) => ({
              value: position,
              label: t(POSITION_KEYS[position]),
            }))}
            onChange={(value) =>
              setToastSettings({ position: value as ToastPosition })
            }
          />
        </SettingsRow>

        <SettingsRow
          title={t("settings.notifications.durationTitle")}
          description={t("settings.notifications.durationDesc")}
        >
          <div className="settings-range-control">
            <input
              type="range"
              className="settings-range"
              aria-label={t("settings.notifications.durationLabel")}
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
          title={t("settings.notifications.maxVisibleTitle")}
          description={t("settings.notifications.maxVisibleDesc")}
        >
          <div className="settings-range-control">
            <input
              type="range"
              className="settings-range"
              aria-label={t("settings.notifications.maxVisibleLabel")}
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
          title={t("settings.notifications.closeButtonTitle")}
          description={t("settings.notifications.closeButtonDesc")}
        >
          <Switch
            checked={toasts.showCloseButton}
            label={t("settings.notifications.closeButtonLabel")}
            onChange={(showCloseButton) =>
              setToastSettings({ showCloseButton })
            }
          />
        </SettingsRow>
      </SettingsGroup>

      <SettingsGroup title={t("settings.notifications.resetGroup")}>
        <SettingsRow
          title={t("settings.notifications.resetTitle")}
          description={t("settings.notifications.resetDesc")}
        >
          <button
            className="btn text"
            type="button"
            onClick={resetToastSettings}
          >
            <span className="text-label-large">{t("common.reset")}</span>
            <div className="state-layer" />
          </button>
        </SettingsRow>
      </SettingsGroup>
    </>
  );
};
