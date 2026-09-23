import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useSettingsStore } from "../store/useSettingsStore";
import { useThemeStore } from "../store/useThemeStore";
import { useUIStore } from "../store/useUIStore";
import { formatChord } from "../utils/shortcuts";
import { IconButton } from "./IconButton";

interface HeaderProps {
  onOpenSidebar: () => void;
}

const greetingKey = (hour: number) =>
  hour < 5
    ? "night"
    : hour < 12
      ? "morning"
      : hour < 15
        ? "noon"
        : hour < 17
          ? "afternoon"
          : hour < 20
            ? "evening"
            : "night";

export const Header = ({ onOpenSidebar }: HeaderProps) => {
  const { t, i18n } = useTranslation();
  const openSettings = useUIStore((state) => state.openSettings);
  const openSearch = useUIStore((state) => state.openSearch);
  const openShortcutHelp = useUIStore((state) => state.openShortcutHelp);
  const isSettingsOpen = useUIStore((state) => state.isSettingsOpen);
  const theme = useThemeStore((state) => state.theme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);
  const searchChord = useSettingsStore((state) => state.shortcuts.openSearch);
  const helpChord = useSettingsStore((state) => state.shortcuts.shortcutHelp);
  const showSearch = useSettingsStore((state) => state.header.showSearch);
  const showShortcuts = useSettingsStore((state) => state.header.showShortcuts);
  const showTheme = useSettingsStore((state) => state.header.showTheme);

  const greeting = useMemo(
    () => t(`header.greeting.${greetingKey(new Date().getHours())}`),
    [t],
  );
  const date = useMemo(
    () =>
      new Intl.DateTimeFormat(i18n.language, {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      }).format(new Date()),
    [i18n.language],
  );

  const isDark = theme === "dark";
  const themeLabel = isDark
    ? t("header.switchToLight")
    : t("header.switchToDark");

  return (
    <div className="header">
      <div className="wrapper">
        <p className="title text-title-large" data-greeting>
          {greeting}
        </p>
        <span className="text text-body-medium" data-current-date>
          {date}
        </span>
      </div>

      {showSearch && (
        <IconButton
          icon="search"
          tooltip={t("header.searchNotesTooltip", {
            chord: formatChord(searchChord),
          })}
          label={t("header.searchNotes")}
          className="search-btn"
          onClick={openSearch}
        />
      )}

      {showShortcuts && (
        <IconButton
          icon="keyboard"
          tooltip={t("header.keyboardShortcutsTooltip", {
            chord: formatChord(helpChord),
          })}
          label={t("header.keyboardShortcuts")}
          className="shortcut-help-btn"
          onClick={openShortcutHelp}
        />
      )}

      {showTheme && (
        <IconButton
          icon={isDark ? "light_mode" : "dark_mode"}
          tooltip={themeLabel}
          label={themeLabel}
          className={`theme-btn${isDark ? " is-rotated" : ""}`}
          onClick={toggleTheme}
        />
      )}

      <IconButton
        icon="settings"
        tooltip={t("header.openSettings")}
        label={t("header.openSettings")}
        className={`settings-btn${isSettingsOpen ? " is-rotated" : ""}`}
        onClick={() => openSettings()}
      />

      <IconButton
        icon="menu"
        label={t("header.openMenu")}
        className="menu-btn"
        onClick={onOpenSidebar}
      />
    </div>
  );
};
