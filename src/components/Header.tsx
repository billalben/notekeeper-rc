import { useState } from "react";
import { useSettingsStore } from "../store/useSettingsStore";
import { useThemeStore } from "../store/useThemeStore";
import { useUIStore } from "../store/useUIStore";
import { formatChord } from "../utils/shortcuts";
import { getGreetingMsg } from "../utils";
import { IconButton } from "./IconButton";

interface HeaderProps {
  onOpenSidebar: () => void;
}

export const Header = ({ onOpenSidebar }: HeaderProps) => {
  const openSettings = useUIStore((state) => state.openSettings);
  const openSearch = useUIStore((state) => state.openSearch);
  const openShortcutHelp = useUIStore((state) => state.openShortcutHelp);
  const isSettingsOpen = useUIStore((state) => state.isSettingsOpen);
  const theme = useThemeStore((state) => state.theme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);
  const searchChord = useSettingsStore((state) => state.shortcuts.openSearch);
  const helpChord = useSettingsStore((state) => state.shortcuts.shortcutHelp);
  const showSearch = useSettingsStore((state) => state.header.showSearch);
  const showShortcuts = useSettingsStore(
    (state) => state.header.showShortcuts,
  );
  const showTheme = useSettingsStore((state) => state.header.showTheme);

  const [greeting] = useState(() => getGreetingMsg(new Date().getHours()));
  const [date] = useState(() => new Date().toDateString().replace(" ", ", "));

  const isDark = theme === "dark";

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
          tooltip={`Search notes (${formatChord(searchChord)})`}
          label="Search notes"
          className="search-btn"
          onClick={openSearch}
        />
      )}

      {showShortcuts && (
        <IconButton
          icon="keyboard"
          tooltip={`Keyboard shortcuts (${formatChord(helpChord)})`}
          label="Keyboard shortcuts"
          className="shortcut-help-btn"
          onClick={openShortcutHelp}
        />
      )}

      {showTheme && (
        <IconButton
          icon={isDark ? "light_mode" : "dark_mode"}
          tooltip={isDark ? "Switch to light mode" : "Switch to dark mode"}
          label={isDark ? "Switch to light mode" : "Switch to dark mode"}
          className={`theme-btn${isDark ? " is-rotated" : ""}`}
          onClick={toggleTheme}
        />
      )}

      <IconButton
        icon="settings"
        tooltip="Open settings"
        label="Open settings"
        className={`settings-btn${isSettingsOpen ? " is-rotated" : ""}`}
        onClick={openSettings}
      />

      <IconButton
        icon="menu"
        label="Open menu"
        className="menu-btn"
        onClick={onOpenSidebar}
      />
    </div>
  );
};
