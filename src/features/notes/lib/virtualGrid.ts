/** Minimum card width; keep in sync with `.note-list` in `main.css`. */
export const NOTE_CARD_MIN_WIDTH = 280;

/** Grid gap; keep in sync with `--spacing-2` (8px). */
export const NOTE_GRID_GAP = 8;

/** Row height used until at least one row has been measured. */
export const DEFAULT_NOTE_ROW_HEIGHT = 240;

/** Extra rows rendered above and below the viewport. */
export const NOTE_ROW_OVERSCAN = 2;

/**
 * Below this many notes, the native CSS grid is cheaper than setting up scroll
 * listeners and row measurement.
 */
export const VIRTUALIZATION_THRESHOLD = 80;

/**
 * How many columns `repeat(auto-fill, minmax(280px, 1fr))` produces at the
 * given content width. Mirrors the browser's auto-fill calculation.
 */
export const getColumnCount = (containerWidth: number): number => {
  if (!Number.isFinite(containerWidth) || containerWidth <= 0) return 1;

  return Math.max(
    1,
    Math.floor(
      (containerWidth + NOTE_GRID_GAP) / (NOTE_CARD_MIN_WIDTH + NOTE_GRID_GAP),
    ),
  );
};

/** Split notes into display rows of at most `columns` cards. */
export const chunkRows = <T>(items: T[], columns: number): T[][] => {
  const safeColumns = Math.max(1, Math.floor(columns));
  const rows: T[][] = [];

  for (let index = 0; index < items.length; index += safeColumns) {
    rows.push(items.slice(index, index + safeColumns));
  }

  return rows;
};
