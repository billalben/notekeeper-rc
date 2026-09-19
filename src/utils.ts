export const generateID = (): string => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return new Date().getTime().toString();
};

export const getGreetingMsg = (currentHour: number): string => {
  const greeting =
    currentHour < 5
      ? "Night"
      : currentHour < 12
        ? "Morning"
        : currentHour < 15
          ? "Noon"
          : currentHour < 17
            ? "Afternoon"
            : currentHour < 20
              ? "Evening"
              : "Night";

  return `Good ${greeting}`;
};

export const countWords = (text: string): number => {
  const matches = text.trim().match(/\S+/g);
  return matches ? matches.length : 0;
};

export const getRelativeTime = (milliSeconds: number): string => {
  const currentTime = new Date().getTime();

  const minute = Math.floor((currentTime - milliSeconds) / 1000 / 60);
  const hour = Math.floor(minute / 60);
  const day = Math.floor(hour / 24);

  return minute < 1
    ? "Just now"
    : minute < 60
      ? `${minute} min ago`
      : hour < 24
        ? `${hour} hour ago`
        : day === 1
          ? `${day} day ago`
          : `${day} days ago`;
};

export const DAY_MS = 24 * 60 * 60 * 1000;

export const TRASH_RETENTION_DAYS = 30;

export type TrashRetentionDays = number | null;

export const TRASH_RETENTION_OPTIONS: {
  value: TrashRetentionDays;
  label: string;
}[] = [
  { value: 7, label: "7 days" },
  { value: TRASH_RETENTION_DAYS, label: "30 days" },
  { value: 90, label: "90 days" },
  { value: null, label: "Forever" },
];

export const trashRetentionMs = (
  days: TrashRetentionDays,
): number | null => (days === null ? null : days * DAY_MS);

export const isTrashed = (item: { deletedAt: number | null }): boolean =>
  item.deletedAt !== null;

export const sortByPinned = <T extends { pinned: boolean }>(items: T[]): T[] =>
  [...items].sort((a, b) => Number(b.pinned) - Number(a.pinned));

export type MoveDirection = "up" | "down";

interface Movable {
  id: string;
  pinned: boolean;
  deletedAt: number | null;
}

/**
 * Swap an item with its nearest visible (non-trashed) neighbour in the given
 * direction. Movement is confined to the item's own pinned group so pinned
 * items always stay above unpinned ones. Returns a new array, or the original
 * array unchanged when no valid move exists.
 */
export const moveWithinGroup = <T extends Movable>(
  items: T[],
  id: string,
  direction: MoveDirection,
): T[] => {
  const index = items.findIndex((item) => item.id === id);
  if (index === -1) return items;

  const target = items[index];
  const isVisible = (item: Movable) => item.deletedAt === null;
  const isSameGroup = (item: Movable) => item.pinned === target.pinned;

  const step = direction === "up" ? -1 : 1;
  let neighbourIndex = -1;
  for (let i = index + step; i >= 0 && i < items.length; i += step) {
    const candidate = items[i];
    if (isVisible(candidate) && isSameGroup(candidate)) {
      neighbourIndex = i;
      break;
    }
    if (isVisible(candidate) && !isSameGroup(candidate)) break;
  }

  if (neighbourIndex === -1) return items;

  const next = [...items];
  next[index] = next[neighbourIndex];
  next[neighbourIndex] = target;
  return next;
};

export interface MoveFlags {
  canMoveUp: boolean;
  canMoveDown: boolean;
}

/**
 * Compute per-item move availability from a list already ordered for display
 * (pinned first). Only same-pinned-state, visible neighbours count.
 */
export const withMoveFlags = <T extends Movable>(
  items: T[],
): (T & MoveFlags)[] =>
  items.map((item, index) => {
    const prev = items[index - 1];
    const next = items[index + 1];
    const sameGroup = (other: Movable | undefined) =>
      other !== undefined &&
      other.deletedAt === null &&
      other.pinned === item.pinned;

    return {
      ...item,
      canMoveUp: sameGroup(prev),
      canMoveDown: sameGroup(next),
    };
  });
