import {
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";
import { useWindowVirtualizer } from "@tanstack/react-virtual";
import {
  DEFAULT_NOTE_ROW_HEIGHT,
  NOTE_GRID_GAP,
  NOTE_ROW_OVERSCAN,
  chunkRows,
  getColumnCount,
} from "../lib/virtualGrid";

interface VirtualNoteRow<T> {
  index: number;
  items: T[];
  /** Row offset from the top of the list container, in pixels. */
  start: number;
}

interface VirtualNoteGrid<T> {
  containerRef: RefObject<HTMLDivElement | null>;
  columns: number;
  visibleRows: VirtualNoteRow<T>[];
  totalHeight: number;
  measureRow: (node: HTMLDivElement | null) => void;
}

/**
 * Window-scrolling row virtualizer for the responsive note grid. Notes are
 * grouped into rows that match the CSS column count, then only the rows near
 * the viewport are mounted. Row heights are measured as they render; unseen
 * rows fall back to `estimatedRowHeight`.
 */
export const useVirtualNoteGrid = <T>(
  notes: T[],
  estimatedRowHeight = DEFAULT_NOTE_ROW_HEIGHT,
): VirtualNoteGrid<T> => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [scrollMargin, setScrollMargin] = useState(0);

  // The column count follows the container width, and the window virtualizer
  // needs the list's document offset to map scroll position to rows.
  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const update = () => {
      const width = container.clientWidth;
      setContainerWidth((current) => (current === width ? current : width));

      const margin = container.getBoundingClientRect().top + window.scrollY;
      setScrollMargin((current) => (current === margin ? current : margin));
    };

    update();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", update);
      return () => window.removeEventListener("resize", update);
    }

    const observer = new ResizeObserver(update);
    observer.observe(container);
    window.addEventListener("resize", update);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", update);
    };
  }, []);

  const columns = getColumnCount(containerWidth);
  const rows = useMemo(() => chunkRows(notes, columns), [notes, columns]);
  const estimateSize = useCallback(
    () => estimatedRowHeight,
    [estimatedRowHeight],
  );

  const virtualizer = useWindowVirtualizer<HTMLDivElement>({
    count: rows.length,
    estimateSize,
    overscan: NOTE_ROW_OVERSCAN,
    gap: NOTE_GRID_GAP,
    scrollMargin,
    // Measuring inside the ResizeObserver callback makes the new row heights
    // trigger another resize in the same delivery, which browsers report as a
    // "ResizeObserver loop completed with undelivered notifications" error.
    useAnimationFrameWithResizeObserver: true,
  });

  // Row heights depend on how many cards share a row, so measurements taken at
  // another column count are stale.
  useLayoutEffect(() => {
    virtualizer.measure();
  }, [columns, virtualizer]);

  // Virtual rows are positioned from the list start, while the container's own
  // coordinate system begins after `scrollMargin`.
  const visibleRows: VirtualNoteRow<T>[] = [];
  for (const item of virtualizer.getVirtualItems()) {
    const items = rows[item.index];
    if (items) {
      visibleRows.push({
        index: item.index,
        items,
        start: item.start - scrollMargin,
      });
    }
  }

  return {
    containerRef,
    columns,
    visibleRows,
    totalHeight: Math.max(virtualizer.getTotalSize() - scrollMargin, 0),
    measureRow: virtualizer.measureElement,
  };
};
