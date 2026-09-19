import { useState } from "react";
import { useUIStore } from "../store/useUIStore";
import { getGreetingMsg } from "../utils";
import { IconButton } from "./IconButton";

interface HeaderProps {
  onOpenSidebar: () => void;
}

export const Header = ({ onOpenSidebar }: HeaderProps) => {
  const openSettings = useUIStore((state) => state.openSettings);
  const openSearch = useUIStore((state) => state.openSearch);

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
        icon="search"
        tooltip="Search notes (⌘K)"
        label="Search notes"
        className="search-btn"
        onClick={openSearch}
      />

      <IconButton
        icon="settings"
        tooltip="Open settings"
        label="Open settings"
        className="settings-btn"
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
