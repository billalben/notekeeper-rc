import { useState } from "react";
import { useThemeStore } from "../store/useThemeStore";
import { getGreetingMsg } from "../utils";
import { IconButton } from "./IconButton";

interface HeaderProps {
  onOpenSidebar: () => void;
}

export const Header = ({ onOpenSidebar }: HeaderProps) => {
  const toggleTheme = useThemeStore((state) => state.toggleTheme);

  const [greeting] = useState(() => getGreetingMsg(new Date().getHours()));
  const [date] = useState(() => new Date().toDateString().replace(" ", ", "));

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

      <IconButton
        tooltip="Toggle theme"
        label="Toggle theme"
        className="theme-btn"
        onClick={toggleTheme}
      >
        <span className="material-symbols-rounded dark-icon" aria-hidden="true">
          dark_mode
        </span>
        <span
          className="material-symbols-rounded light-icon"
          aria-hidden="true"
        >
          light_mode
        </span>
      </IconButton>

      <IconButton
        icon="menu"
        label="Open menu"
        className="menu-btn"
        onClick={onOpenSidebar}
      />
    </div>
  );
};
