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

const ACCENTS: { id: AccentColor; label: string }[] = [
  { id: "orange", label: "Orange" },
  { id: "blue", label: "Blue" },
  { id: "green", label: "Green" },
  { id: "teal", label: "Teal" },
  { id: "violet", label: "Violet" },
  { id: "rose", label: "Rose" },
];

export const SettingsAppearance = () => {
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
      <SettingsGroup title="Theme">
        <SettingsRow
          title="Dark mode"
          description="Use a dark color scheme across the app."
        >
          <SettingsSwitch
            checked={isDark}
            label="Dark mode"
            onChange={(checked) => setTheme(checked ? "dark" : "light")}
          />
        </SettingsRow>
      </SettingsGroup>

      <SettingsGroup title="Accent & size">
        <SettingsRow
          title="Accent color"
          description="Recolors buttons, highlights, and active states."
        >
          <div
            className="accent-swatches"
            role="group"
            aria-label="Accent color"
          >
            {ACCENTS.map((accent) => {
              const isSelected = appearance.accent === accent.id;
              return (
                <button
                  key={accent.id}
                  type="button"
                  className="accent-swatch"
                  style={{ backgroundColor: `var(--swatch-${accent.id})` }}
                  aria-label={accent.label}
                  title={accent.label}
                  aria-pressed={isSelected}
                  onClick={() => setAppearanceSettings({ accent: accent.id })}
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
          title="Font size"
          description="Scale text and line heights across the app."
        >
          <SettingsSelect
            label="Font size"
            value={appearance.fontScale}
            options={[
              { value: "small", label: "Small" },
              { value: "default", label: "Default" },
              { value: "large", label: "Large" },
            ]}
            onChange={(value) =>
              setAppearanceSettings({ fontScale: value as FontScale })
            }
          />
        </SettingsRow>

        <SettingsRow
          title="Density"
          description="Adjust padding and spacing throughout the UI."
        >
          <SettingsSelect
            label="Density"
            value={appearance.density}
            options={[
              { value: "compact", label: "Compact" },
              { value: "default", label: "Default" },
              { value: "comfortable", label: "Comfortable" },
            ]}
            onChange={(value) =>
              setAppearanceSettings({ density: value as Density })
            }
          />
        </SettingsRow>

        <SettingsRow
          title="Corners"
          description="Choose how rounded corners appear across the UI."
        >
          <SettingsSelect
            label="Corner style"
            value={appearance.radius}
            options={[
              { value: "default", label: "Default" },
              { value: "square", label: "Square" },
              { value: "rounded", label: "Rounded" },
            ]}
            onChange={(value) =>
              setAppearanceSettings({ radius: value as RadiusStyle })
            }
          />
        </SettingsRow>

        <SettingsRow
          title="High contrast"
          description="Strengthen borders and text for better visibility."
        >
          <SettingsSwitch
            checked={appearance.highContrast}
            label="High contrast"
            onChange={(checked) =>
              setAppearanceSettings({ highContrast: checked })
            }
          />
        </SettingsRow>

        <SettingsRow
          title="Reset appearance"
          description="Restore accent, font size, density, corners, and contrast to defaults."
        >
          <button
            className="btn text"
            type="button"
            disabled={isDefaultAppearance}
            onClick={() => {
              resetAppearanceSettings();
              toast.success("Appearance reset to defaults");
            }}
          >
            <span className="text-label-large">Reset</span>
            <div className="state-layer" />
          </button>
        </SettingsRow>
      </SettingsGroup>

      <SettingsGroup title="Motion">
        <SettingsRow
          title="Reduce motion"
          description="Honor your system motion preference, or override it."
        >
          <SettingsSelect
            label="Motion preference"
            value={motion}
            options={[
              { value: "system", label: "System default" },
              { value: "reduce", label: "Reduce motion" },
              { value: "full", label: "Full motion" },
            ]}
            onChange={(value) => setMotion(value as MotionPreference)}
          />
        </SettingsRow>
      </SettingsGroup>
    </>
  );
};
