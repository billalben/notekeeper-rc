import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";
import {
  NOTE_GRID_GAP,
  buildRowOffsets,
  chunkRows,
  findVisibleRowRange,
  getColumnCount,
} from "../lib/virtualGrid";

interface VirtualNoteRow<T> {
  index: number;
  items: T[];
  top: number;
}

interface MeasuredRows {
  columns: number;
  heights: ReadonlyMap<number, number>;
}

interface VirtualNoteGrid<T> {
  containerRef: RefObject<HTMLDivElement | null>;
  columns: number;
  visibleRows: VirtualNoteRow<T>[];
  totalHeight: number;
}

const EMPTY_HEIGHTS: ReadonlyMap<number, number> = new Map();

/**
 * Window-scrolling row virtualizer for the responsive note grid. Notes are
 * grouped into rows that match the CSS column count, then only the rows near
 * the viewport are mounted. Unmeasured rows use a rolling average so the page
 * keeps a stable scroll height before every row has been seen.
 */
export const useVirtualNoteGrid = <T>(
  notes: T[],
  estimatedRowHeight: number,
): VirtualNoteGrid<T> => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const offsetsRef = useRef<number[]>([0]);

  const [containerWidth, setContainerWidth] = useState(0);
  const [measured, setMeasured] = useState<MeasuredRows>({
    columns: 1,
    heights: EMPTY_HEIGHTS,
  });
  const [range, setRange] = useState({ start: 0, end: 3 });

  const columns = getColumnCount(containerWidth);
  const rowHeights =
    measured.columns === columns ? measured.heights : EMPTY_HEIGHTS;

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateWidth = () => {
      const next = container.clientWidth;
      setContainerWidth((current) => (current === next ? current : next));
    };

    updateWidth();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", updateWidth);
      return () => window.removeEventListener("resize", updateWidth);
    }

    const observer = new ResizeObserver(updateWidth);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const rows = useMemo(() => chunkRows(notes, columns), [notes, columns]);

  const rowEstimate = useMemo(() => {
    if (rowHeights.size === 0) return estimatedRowHeight;

    let total = 0;
    rowHeights.forEach((height) => {
      total += height;
    });
    const average = total / rowHeights.size;
    return Math.min(600, Math.max(120, average));
  }, [estimatedRowHeight, rowHeights]);

  const offsets = useMemo(
    () =>
      buildRowOffsets(
        rows.length,
        (index) => rowHeights.get(index) ?? rowEstimate,
        NOTE_GRID_GAP,
      ),
    [rows.length, rowEstimate, rowHeights],
  );

  const updateRange = useCallback(() => {
    const container = containerRef.current;
    if (!container || typeof window === "undefined") return;

    const rect = container.getBoundingClientRect();
    const viewportStart = -rect.top;
    const viewportEnd = viewportStart + window.innerHeight;
    const next = findVisibleRowRange(
      offsetsRef.current,
      viewportStart,
      viewportEnd,
    );

    setRange((current) =>
      current.start === next.start && current.end === next.end ? current : next,
    );
  }, []);

  // Publish offsets and recompute the window before paint, so width or
  // filter changes never flash an empty or mispositioned row range.
  useLayoutEffect(() => {
    offsetsRef.current = offsets;
    updateRange();
  });

  useEffect(() => {
    let frame = 0;

    const schedule = () => {
      if (frame !== 0) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        updateRange();
      });
    };

    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);

    return () => {
      if (frame !== 0) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [updateRange]);

  const measureRows = useCallback(
    (entries: Array<{ index: number; height: number }>) => {
      if (entries.length === 0) return;

      setMeasured((current) => {
        const heights =
          current.columns === columns
            ? new Map(current.heights)
            : new Map<number, number>();
        let changed = false;

        entries.forEach(({ index, height }) => {
          const previous = heights.get(index);
          if (previous === undefined || Math.abs(previous - height) > 0.5) {
            heights.set(index, height);
            changed = true;
          }
        });

        return changed ? { columns, heights } : current;
      });
    },
    [columns],
  );

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container || typeof ResizeObserver === "undefined") return;

    const elements = Array.from(
      container.querySelectorAll<HTMLElement>("[data-virtual-row]"),
    );
    if (elements.length === 0) return;

    const observer = new ResizeObserver((entries) => {
      measureRows(
        entries.flatMap((entry) => {
          const element = entry.target as HTMLElement;
          const index = Number(element.dataset.virtualRow);
          const height = element.getBoundingClientRect().height;
          return Number.isInteger(index) && height > 0
            ? [{ index, height }]
            : [];
        }),
      );
    });

    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [rows, columns, range.start, range.end, measureRows]);

  const visibleRows = useMemo(() => {
    if (rows.length === 0) return [];

    const start = Math.min(range.start, rows.length - 1);
    const end = Math.min(Math.max(range.end, start + 1), rows.length);
    const result: VirtualNoteRow<T>[] = [];

    for (let index = start; index < end; index += 1) {
      result.push({ index, items: rows[index], top: offsets[index] });
    }

    return result;
  }, [rows, offsets, range.start, range.end]);

  return {
    containerRef,
    columns,
    visibleRows,
    totalHeight: offsets[offsets.length - 1] ?? 0,
  };
};
