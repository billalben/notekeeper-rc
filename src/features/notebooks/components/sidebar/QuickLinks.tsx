import { useTranslation } from "react-i18next";
import { useUIStore, type MainView } from "@/shared/stores/useUIStore";
import { SidebarRow } from "./SidebarRow";

interface QuickLinksProps {
  view: MainView;
  totalNotes: number;
  pinnedCount: number;
  favoriteCount: number;
  recentCount: number;
  onNavigate: () => void;
}

export const QuickLinks = ({
  view,
  totalNotes,
  pinnedCount,
  favoriteCount,
  recentCount,
  onNavigate,
}: QuickLinksProps) => {
  const { t } = useTranslation();
  const openAllNotes = useUIStore((state) => state.openAllNotes);
  const openPinned = useUIStore((state) => state.openPinned);
  const openFavorites = useUIStore((state) => state.openFavorites);
  const openRecent = useUIStore((state) => state.openRecent);

  const open = (action: () => void) => () => {
    action();
    onNavigate();
  };

  return (
    <div className="sidebar-quick">
      <SidebarRow
        icon="note_stack"
        label={t("sidebar.allNotes")}
        count={totalNotes}
        selected={view === "all"}
        onClick={open(openAllNotes)}
      />
      <SidebarRow
        icon="push_pin"
        label={t("sidebar.pinned")}
        count={pinnedCount}
        selected={view === "pinned"}
        onClick={open(openPinned)}
      />
      <SidebarRow
        icon="star"
        label={t("sidebar.favorites")}
        count={favoriteCount}
        selected={view === "favorites"}
        onClick={open(openFavorites)}
      />
      <SidebarRow
        icon="history"
        label={t("sidebar.recent")}
        count={recentCount}
        selected={view === "recent"}
        onClick={open(openRecent)}
      />
    </div>
  );
};
