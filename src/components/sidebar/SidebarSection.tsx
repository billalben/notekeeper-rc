import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

interface SidebarSectionProps {
  id: string;
  title: string;
  count?: number;
  collapsed: boolean;
  onToggle: () => void;
  action?: ReactNode;
  collapsedIndicators?: ReactNode;
  className?: string;
  children: ReactNode;
}

/**
 * Collapsible sidebar section. The body animates via a grid row transition so
 * it respects the shared motion tokens (and the reduced-motion overrides), and
 * scrolls independently with a bottom fade hint when there is more to see.
 */
export const SidebarSection = ({
  id,
  title,
  count,
  collapsed,
  onToggle,
  action,
  collapsedIndicators,
  className,
  children,
}: SidebarSectionProps) => {
  const bodyId = `${id}-body`;
  const scrollRef = useRef<HTMLDivElement>(null);
  const [hasMore, setHasMore] = useState(false);

  const updateFade = useCallback(() => {
    const scroll = scrollRef.current;
    if (!scroll) return;
    setHasMore(scroll.scrollHeight - scroll.scrollTop - scroll.clientHeight > 1);
  }, []);

  useEffect(() => {
    const scroll = scrollRef.current;
    if (!scroll) return;

    const content = scroll.firstElementChild as HTMLElement | null;
    const observer = new ResizeObserver(updateFade);
    observer.observe(scroll);
    if (content) observer.observe(content);

    return () => observer.disconnect();
  }, [updateFade]);

  return (
    <section
      className={`sidebar-section${collapsed ? " is-collapsed" : ""}${
        className ? ` ${className}` : ""
      }`}
    >
      <div className="sidebar-section-header">
        <button
          type="button"
          className="sidebar-section-toggle"
          aria-expanded={!collapsed}
          aria-controls={bodyId}
          onClick={onToggle}
          data-sidebar-nav-item
        >
          <span
            className="material-symbols-rounded sidebar-section-chevron"
            aria-hidden="true"
          >
            expand_more
          </span>
          <span className="text text-label-large sidebar-section-title">
            {title}
          </span>
          {count !== undefined && (
            <span className="sidebar-section-count text-label-small">
              {count}
            </span>
          )}
          {collapsed && collapsedIndicators && (
            <span className="sidebar-section-indicators">
              {collapsedIndicators}
            </span>
          )}
          <div className="state-layer" />
        </button>
        {action}
      </div>

      <div
        id={bodyId}
        className={`sidebar-section-body${hasMore ? " has-more" : ""}`}
        inert={collapsed || undefined}
      >
        <div className="sidebar-section-inner">
          <div
            ref={scrollRef}
            className="sidebar-section-scroll custom-scrollbar"
            onScroll={updateFade}
          >
            {children}
          </div>
          <div className="sidebar-section-fade" aria-hidden="true" />
        </div>
      </div>
    </section>
  );
};
