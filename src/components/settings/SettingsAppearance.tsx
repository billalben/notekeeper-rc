import { useThemeStore } from "../../store/useThemeStore";
import { ComingSoon, SettingsGroup, SettingsRow } from "./SettingsSection";

export const SettingsAppearance = () => {
  const theme = useThemeStore((state) => state.theme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);

  const isDark = theme === "dark";

  return (
    <>
      <SettingsGroup title="Theme">
        <SettingsRow
          title="Dark mode"
          description="Use a dark color scheme across the app."
        >
          <button
            type="button"
            role="switch"
            aria-checked={isDark}
            aria-label="Dark mode"
            className={`settings-switch${isDark ? " active" : ""}`}
            onClick={toggleTheme}
          >
            <span className="settings-switch-thumb" />
          </button>
        </SettingsRow>
      </SettingsGroup>

      <SettingsGroup title="More">
        <SettingsRow
          title="Accent color & density"
          description="Customize colors, font size, and spacing."
        >
          <ComingSoon />
        </SettingsRow>
        <SettingsRow
          title="Reduce motion"
          description="Honor your system motion preference."
        >
          <ComingSoon />
        </SettingsRow>
      </SettingsGroup>
    </>
  );
};
