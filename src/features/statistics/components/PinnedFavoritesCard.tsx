import { useTranslation } from "react-i18next";
import { useUIStore } from "@/shared/stores/useUIStore";
import { formatNumber } from "../lib/format";
import { StatCard } from "./StatCard";

interface PinnedFavoritesCardProps {
  pinnedCount: number;
  favoriteCount: number;
}

export const PinnedFavoritesCard = ({
  pinnedCount,
  favoriteCount,
}: PinnedFavoritesCardProps) => {
  const { t, i18n } = useTranslation();
  const locale = i18n.language;
  const openPinned = useUIStore((state) => state.openPinned);
  const openFavorites = useUIStore((state) => state.openFavorites);

  return (
    <StatCard span={5} title={t("stats.pinnedAndFavorites")}>
      <button type="button" className="stats-link-row" onClick={openPinned}>
        <span
          className="material-symbols-rounded stats-link-icon"
          aria-hidden="true"
        >
          push_pin
        </span>
        <span className="stats-link-count text-title-medium">
          {formatNumber(pinnedCount, locale)}
        </span>
        <span className="stats-link-label text-body-medium">
          {t("stats.pinnedNotes")}
        </span>
        <span
          className="material-symbols-rounded stats-link-arrow"
          aria-hidden="true"
        >
          arrow_forward
        </span>
      </button>

      <button type="button" className="stats-link-row" onClick={openFavorites}>
        <span
          className="material-symbols-rounded stats-link-icon"
          aria-hidden="true"
        >
          star
        </span>
        <span className="stats-link-count text-title-medium">
          {formatNumber(favoriteCount, locale)}
        </span>
        <span className="stats-link-label text-body-medium">
          {t("stats.favorites")}
        </span>
        <span
          className="material-symbols-rounded stats-link-arrow"
          aria-hidden="true"
        >
          arrow_forward
        </span>
      </button>
    </StatCard>
  );
};
