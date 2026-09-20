import type { ReactNode } from "react";

interface SidebarRowProps {
  icon: string;
  label: string;
  count?: number;
  selected?: boolean;
  dimmed?: boolean;
  onClick: () => void;
  trailing?: ReactNode;
}

/**
 * Compact, single-selectable navigation row shared by Quick access and the
 * "More" group: icon, ellipsised label, and an optional count on the right.
 */
export const SidebarRow = ({
  icon,
  label,
  count,
  selected = false,
  dimmed = false,
  onClick,
  trailing,
}: SidebarRowProps) => (
  <button
    type="button"
    className={`sidebar-row${selected ? " is-selected" : ""}${
      dimmed ? " is-dimmed" : ""
    }`}
    aria-current={selected ? "page" : undefined}
    title={label}
    onClick={onClick}
    data-sidebar-nav-item
  >
    <span
      className="material-symbols-rounded sidebar-row-icon"
      aria-hidden="true"
    >
      {icon}
    </span>
    <span className="text text-label-large sidebar-row-label">{label}</span>
    {trailing}
    {count !== undefined && (
      <span
        className="sidebar-row-count text-label-small"
        aria-label={`${count} notes`}
      >
        {count}
      </span>
    )}
    <div className="state-layer" />
  </button>
);
