import { useEffect, useRef, useState, type ComponentType } from "react";
import { IconButton } from "../IconButton";
import { SettingsAbout } from "./SettingsAbout";
import { SettingsAppearance } from "./SettingsAppearance";
import { SettingsData } from "./SettingsData";
import { SettingsGeneral } from "./SettingsGeneral";
import { SettingsNotifications } from "./SettingsNotifications";

type SectionId =
  | "general"
  | "appearance"
  | "notifications"
  | "data"
  | "about";

interface Section {
  id: SectionId;
  label: string;
  icon: string;
  Component: ComponentType;
}

const SECTIONS: Section[] = [
  { id: "general", label: "General", icon: "tune", Component: SettingsGeneral },
  {
    id: "appearance",
    label: "Appearance",
    icon: "palette",
    Component: SettingsAppearance,
  },
  {
    id: "notifications",
    label: "Notifications",
    icon: "notifications",
    Component: SettingsNotifications,
  },
  { id: "data", label: "Data", icon: "database", Component: SettingsData },
  { id: "about", label: "About", icon: "info", Component: SettingsAbout },
];

interface SettingsModalProps {
  onClose: () => void;
}

export const SettingsModal = ({ onClose }: SettingsModalProps) => {
  const [activeSection, setActiveSection] = useState<SectionId>("general");
  const [mobilePane, setMobilePane] = useState<"list" | "content">("list");
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    dialogRef.current?.focus();

    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = overflow;
      previouslyFocused?.focus?.();
    };
  }, [onClose]);

  const active = SECTIONS.find((section) => section.id === activeSection);
  const ActiveSection = active?.Component ?? SettingsGeneral;

  const selectSection = (sectionId: SectionId) => {
    setActiveSection(sectionId);
    setMobilePane("content");
  };

  return (
    <>
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-modal-title"
        className="modal settings-modal"
        data-mobile-pane={mobilePane}
      >
        <div className="settings-sidebar">
          <div className="settings-sidebar-header">
            <span className="material-symbols-rounded" aria-hidden="true">
              settings
            </span>
            <h2 id="settings-modal-title" className="text-title-medium">
              Settings
            </h2>
          </div>

          <nav className="settings-nav" aria-label="Settings sections">
            {SECTIONS.map((section) => (
              <button
                key={section.id}
                type="button"
                className={`settings-nav-item${
                  activeSection === section.id ? " active" : ""
                }`}
                aria-current={
                  activeSection === section.id ? "page" : undefined
                }
                onClick={() => selectSection(section.id)}
              >
                <span
                  className="material-symbols-rounded"
                  aria-hidden="true"
                >
                  {section.icon}
                </span>
                <span className="text-label-large">{section.label}</span>
                <div className="state-layer" />
              </button>
            ))}
          </nav>
        </div>

        <div className="settings-main">
          <div className="settings-main-header">
            <IconButton
              icon="arrow_back"
              label="Back to settings sections"
              className="settings-back-btn"
              onClick={() => setMobilePane("list")}
            />
            <h2 className="text-title-medium">{active?.label}</h2>
            <IconButton
              icon="close"
              label="Close settings"
              className="settings-close-btn"
              onClick={onClose}
            />
          </div>

          <div className="settings-content custom-scrollbar">
            <ActiveSection />
          </div>
        </div>
      </div>
      <div
        className="overlay modal-overlay"
        onClick={(event) => {
          if (event.target === event.currentTarget) onClose();
        }}
      />
    </>
  );
};
