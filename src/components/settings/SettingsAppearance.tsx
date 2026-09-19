import { useThemeStore } from "../../store/useThemeStore";
import {
  ComingSoon,
  SettingsGroup,
  SettingsRow,
  SettingsSwitch,
} from "./SettingsSection";

export const SettingsAppearance = () => {
  const theme = useThemeStore((state) => state.theme);
  const setTheme = useThemeStore((state) => state.setTheme);

  const isDark = theme === "dark";

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
