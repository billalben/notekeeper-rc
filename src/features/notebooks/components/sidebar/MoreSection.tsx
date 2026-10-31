import { useTranslation } from "react-i18next";
import { useSettingsStore } from "@/shared/stores/useSettingsStore";
import { useUIStore, type MainView } from "@/shared/stores/useUIStore";
import { SidebarRow } from "./SidebarRow";
import { SidebarSection } from "./SidebarSection";

interface MoreSectionProps {
  view: MainView;
  trashedCount: number;
  archivedCount: number;
  onNavigate: () => void;
}

export const MoreSection = ({
  view,
  trashedCount,
  archivedCount,
  onNavigate,
}: MoreSectionProps) => {
  const { t } = useTranslation();
  const moreCollapsed = useSettingsStore(
    (state) => state.sidebar.moreCollapsed,
  );
  const setSidebarSettings = useSettingsStore(
    (state) => state.setSidebarSettings,
  );
  const openStats = useUIStore((state) => state.openStats);
  const openTrash = useUIStore((state) => state.openTrash);
  const openArchive = useUIStore((state) => state.openArchive);

  const indicators = (
    <>
      <span
        className={`material-symbols-rounded sidebar-indicator${
          view === "stats" ? " is-selected" : ""
        }`}
        title={t("sidebar.statistics")}
        aria-hidden="true"
      >
        insights
      </span>
      <span
        className={`material-symbols-rounded sidebar-indicator${
          view === "archive" ? " is-selected" : ""
        }`}
        title={t("sidebar.archive")}
        aria-hidden="true"
      >
        archive
      </span>
      <span
        className={`material-symbols-rounded sidebar-indicator${
          view === "trash" ? " is-selected" : ""
        }`}
        title={t("sidebar.trash")}
        aria-hidden="true"
      >
        delete
      </span>
    </>
  );

  return (
    <SidebarSection
      id="sidebar-more"
      title={t("sidebar.more")}
      collapsed={moreCollapsed}
      onToggle={() => setSidebarSettings({ moreCollapsed: !moreCollapsed })}
      className="sidebar-more"
      collapsedIndicators={indicators}
    >
      <SidebarRow
        icon="insights"
        label={t("sidebar.statistics")}
        selected={view === "stats"}
        onClick={() => {
          openStats();
          onNavigate();
        }}
      />
      <SidebarRow
        icon="archive"
        label={t("sidebar.archive")}
        count={archivedCount}
        selected={view === "archive"}
        onClick={() => {
          openArchive();
          onNavigate();
        }}
      />
      <SidebarRow
        icon="delete"
        label={t("sidebar.trash")}
        count={trashedCount}
        selected={view === "trash"}
        onClick={() => {
          openTrash();
          onNavigate();
        }}
      />
    </SidebarSection>
  );
};
