import { useTranslation } from "react-i18next";

interface TagFilterBarProps {
  tags: string[];
  activeTags: string[];
  onToggle: (tag: string) => void;
}

export const TagFilterBar = ({
  tags,
  activeTags,
  onToggle,
}: TagFilterBarProps) => {
  const { t } = useTranslation();

  if (tags.length === 0) return null;

  return (
    <div
      className="tag-filter-bar"
      role="group"
      aria-label={t("tags.filterByTag")}
    >
      <span
        className="material-symbols-rounded tag-filter-icon"
        aria-hidden="true"
      >
        label
      </span>
      <ul className="tag-filter-list custom-scrollbar">
        {tags.map((tag) => {
          const isActive = activeTags.some(
            (item) => item.toLowerCase() === tag.toLowerCase(),
          );

          return (
            <li key={tag}>
              <button
                type="button"
                className={`tag-chip tag-filter-chip${isActive ? " active" : ""}`}
                aria-pressed={isActive}
                onClick={() => onToggle(tag)}
              >
                <span className="text-label-large">#{tag}</span>
                <div className="state-layer" />
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
