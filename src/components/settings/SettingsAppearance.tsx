import { useTranslation } from "react-i18next";
import { useThemeStore } from "../../store/useThemeStore";
import { toast } from "../../store/useToastStore";
import {
  DEFAULT_APPEARANCE_SETTINGS,
  type AccentColor,
  type Density,
  type FontScale,
  type MotionPreference,
  type RadiusStyle,
  useSettingsStore,
} from "../../store/useSettingsStore";
import {
  SettingsGroup,
  SettingsRow,
  SettingsSelect,
  SettingsSwitch,
} from "./SettingsSection";

const ACCENTS: AccentColor[] = [
  "orange",
  "blue",
  "green",
  "teal",
  "violet",
  "rose",
];

export const SettingsAppearance = () => {
  const { t } = useTranslation();
  const theme = useThemeStore((state) => state.theme);
  const setTheme = useThemeStore((state) => state.setTheme);

  const motion = useSettingsStore((state) => state.motion);
  const setMotion = useSettingsStore((state) => state.setMotion);
  const appearance = useSettingsStore((state) => state.appearance);
  const setAppearanceSettings = useSettingsStore(
    (state) => state.setAppearanceSettings,
  );
  const resetAppearanceSettings = useSettingsStore(
    (state) => state.resetAppearanceSettings,
  );

  const isDark = theme === "dark";
  const isDefaultAppearance = (
    Object.keys(DEFAULT_APPEARANCE_SETTINGS) as (keyof typeof appearance)[]
  ).every((key) => appearance[key] === DEFAULT_APPEARANCE_SETTINGS[key]);

  return (
    <>
      <SettingsGroup title={t("settings.appearance.themeGroup")}>
        <SettingsRow
          title={t("settings.appearance.darkModeTitle")}
          description={t("settings.appearance.darkModeDesc")}
        >
          <SettingsSwitch
            checked={isDark}
            label={t("settings.appearance.darkModeLabel")}
            onChange={(checked) => setTheme(checked ? "dark" : "light")}
          />
        </SettingsRow>
      </SettingsGroup>

      <SettingsGroup title={t("settings.appearance.accentGroup")}>
        <SettingsRow
          title={t("settings.appearance.accentTitle")}
          description={t("settings.appearance.accentDesc")}
        >
          <div
            className="accent-swatches"
            role="group"
            aria-label={t("settings.appearance.accentLabel")}
          >
            {ACCENTS.map((accent) => {
              const isSelected = appearance.accent === accent;
              const label = t(`settings.appearance.accents.${accent}`);
              return (
                <button
                  key={accent}
                  type="button"
                  className="accent-swatch"
                  style={{ backgroundColor: `var(--swatch-${accent})` }}
                  aria-label={label}
                  title={label}
                  aria-pressed={isSelected}
                  onClick={() => setAppearanceSettings({ accent })}
                >
                  {isSelected && (
                    <span
                      className="material-symbols-rounded"
                      aria-hidden="true"
                    >
                      check
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </SettingsRow>

        <SettingsRow
          title={t("settings.appearance.fontSizeTitle")}
          description={t("settings.appearance.fontSizeDesc")}
        >
          <SettingsSelect
            label={t("settings.appearance.fontSizeLabel")}
            value={appearance.fontScale}
            options={[
              { value: "small", label: t("settings.appearance.sizes.small") },
              {
                value: "default",
                label: t("settings.appearance.sizes.default"),
              },
              { value: "large", label: t("settings.appearance.sizes.large") },
            ]}
            onChange={(value) =>
              setAppearanceSettings({ fontScale: value as FontScale })
            }
          />
        </SettingsRow>

        <SettingsRow
          title={t("settings.appearance.densityTitle")}
          description={t("settings.appearance.densityDesc")}
        >
          <SettingsSelect
            label={t("settings.appearance.densityLabel")}
            value={appearance.density}
            options={[
              {
                value: "compact",
                label: t("settings.appearance.densities.compact"),
              },
              {
                value: "default",
                label: t("settings.appearance.densities.default"),
              },
              {
                value: "comfortable",
                label: t("settings.appearance.densities.comfortable"),
              },
            ]}
            onChange={(value) =>
              setAppearanceSettings({ density: value as Density })
            }
          />
        </SettingsRow>

        <SettingsRow
          title={t("settings.appearance.cornersTitle")}
          description={t("settings.appearance.cornersDesc")}
        >
          <SettingsSelect
            label={t("settings.appearance.cornersLabel")}
            value={appearance.radius}
            options={[
              {
                value: "default",
                label: t("settings.appearance.corners.default"),
              },
              {
                value: "square",
                label: t("settings.appearance.corners.square"),
              },
              {
                value: "rounded",
                label: t("settings.appearance.corners.rounded"),
              },
            ]}
            onChange={(value) =>
              setAppearanceSettings({ radius: value as RadiusStyle })
            }
          />
        </SettingsRow>

        <SettingsRow
          title={t("settings.appearance.highContrastTitle")}
          description={t("settings.appearance.highContrastDesc")}
        >
          <SettingsSwitch
            checked={appearance.highContrast}
            label={t("settings.appearance.highContrastLabel")}
            onChange={(checked) =>
              setAppearanceSettings({ highContrast: checked })
            }
          />
        </SettingsRow>

        <SettingsRow
          title={t("settings.appearance.resetTitle")}
          description={t("settings.appearance.resetDesc")}
        >
          <button
            className="btn text"
            type="button"
            disabled={isDefaultAppearance}
            onClick={() => {
              resetAppearanceSettings();
              toast.success(t("toasts.appearanceReset"));
            }}
          >
            <span className="text-label-large">{t("common.reset")}</span>
            <div className="state-layer" />
          </button>
        </SettingsRow>
      </SettingsGroup>

      <SettingsGroup title={t("settings.appearance.motionGroup")}>
        <SettingsRow
          title={t("settings.appearance.reduceMotionTitle")}
          description={t("settings.appearance.reduceMotionDesc")}
        >
          <SettingsSelect
            label={t("settings.appearance.motionLabel")}
            value={motion}
            options={[
              {
                value: "system",
                label: t("settings.appearance.motions.system"),
              },
              {
                value: "reduce",
                label: t("settings.appearance.motions.reduce"),
              },
              {
                value: "full",
                label: t("settings.appearance.motions.full"),
              },
            ]}
            onChange={(value) => setMotion(value as MotionPreference)}
          />
        </SettingsRow>
      </SettingsGroup>
    </>
  );
};
