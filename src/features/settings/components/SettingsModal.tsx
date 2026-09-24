import { useEffect, useRef, useState, type ComponentType } from "react";
import { useTranslation } from "react-i18next";
import { useActionHotkey } from "@/features/shortcuts/hooks/useActionHotkey";
import { useSettingsStore } from "@/shared/stores/useSettingsStore";
import { useUIStore } from "@/shared/stores/useUIStore";
import type { SettingsSection } from "@/shared/types";
import { useBodyScrollLock } from "@/shared/hooks/useBodyScrollLock";
import { useRestoreFocus } from "@/shared/hooks/useRestoreFocus";
import { IconButton } from "@/shared/ui/IconButton";
import { SettingsAbout } from "@/features/settings/components/SettingsAbout";
import { SettingsAppearance } from "@/features/settings/components/SettingsAppearance";
import { SettingsData } from "@/features/settings/components/SettingsData";
import { SettingsGeneral } from "@/features/settings/components/SettingsGeneral";
import { SettingsNotifications } from "@/features/settings/components/SettingsNotifications";
import { SettingsShortcuts } from "@/features/settings/components/SettingsShortcuts";

interface Section {
  id: SettingsSection;
  labelKey: `settings.sections.${SettingsSection}`;
  icon: string;
  Component: ComponentType;
}

const SECTIONS: Section[] = [
  {
    id: "general",
    labelKey: "settings.sections.general",
    icon: "tune",
    Component: SettingsGeneral,
  },
  {
    id: "appearance",
    labelKey: "settings.sections.appearance",
    icon: "palette",
    Component: SettingsAppearance,
  },
  {
    id: "shortcuts",
    labelKey: "settings.sections.shortcuts",
    icon: "keyboard",
    Component: SettingsShortcuts,
  },
  {
    id: "notifications",
    labelKey: "settings.sections.notifications",
    icon: "notifications",
    Component: SettingsNotifications,
  },
  {
    id: "data",
    labelKey: "settings.sections.data",
    icon: "database",
    Component: SettingsData,
  },
  {
    id: "about",
    labelKey: "settings.sections.about",
    icon: "info",
    Component: SettingsAbout,
  },
];

interface SettingsModalProps {
  onClose: () => void;
}

export const SettingsModal = ({ onClose }: SettingsModalProps) => {
  const { t } = useTranslation();
  const activeSection = useUIStore((state) => state.settingsSection);
  const setSettingsSection = useUIStore((state) => state.setSettingsSection);
  const [mobilePane, setMobilePane] = useState<"list" | "content">("list");
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeOnBackdropClick = useSettingsStore(
    (state) => state.editor.closeModalOnBackdropClick,
  );
  const isShortcutHelpOpen = useUIStore((state) => state.isShortcutHelpOpen);

  useActionHotkey("closeModal", onClose, {
    enabled: !isShortcutHelpOpen,
    enableOnFormTags: true,
  });

  useBodyScrollLock();
  useRestoreFocus();

  useEffect(() => {
    dialogRef.current?.focus();
  }, []);

  const active = SECTIONS.find((section) => section.id === activeSection);
  const ActiveSection = active?.Component ?? SettingsGeneral;

  const selectSection = (sectionId: SettingsSection) => {
    setSettingsSection(sectionId);
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
              {t("settings.title")}
            </h2>
          </div>

          <nav className="settings-nav" aria-label={t("settings.sectionsAria")}>
            {SECTIONS.map((section) => (
              <button
                key={section.id}
                type="button"
                className={`settings-nav-item${
                  activeSection === section.id ? " active" : ""
                }`}
                aria-current={activeSection === section.id ? "page" : undefined}
                onClick={() => selectSection(section.id)}
              >
                <span className="material-symbols-rounded" aria-hidden="true">
                  {section.icon}
                </span>
                <span className="text-label-large">{t(section.labelKey)}</span>
                <div className="state-layer" />
              </button>
            ))}
          </nav>
        </div>

        <div className="settings-main">
          <div className="settings-main-header">
            <IconButton
              icon="arrow_back"
              label={t("settings.back")}
              className="settings-back-btn"
              onClick={() => setMobilePane("list")}
            />
            <h2 className="text-title-medium">
              {active ? t(active.labelKey) : ""}
            </h2>
            <IconButton
              icon="close"
              label={t("settings.close")}
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
          if (closeOnBackdropClick && event.target === event.currentTarget) {
            onClose();
          }
        }}
      />
    </>
  );
};
