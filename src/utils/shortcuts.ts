/**
 * Pure keyboard-shortcut helpers: the action registry, canonical chord
 * normalization/validation, conflict detection, and display formatting.
 *
 * Chords are stored in a canonical, layout-independent form built from
 * `event.code`-style tokens (e.g. `mod+shift+s`, `escape`, `mod+slash`) so they
 * round-trip with `react-hotkeys-hook`'s code-based matching without a
 * translation layer.
 */

export type ActionId =
  | "newNote"
  | "openSearch"
  | "saveNote"
  | "togglePreview"
  | "downloadNote"
  | "deleteNote"
  | "toggleTheme"
  | "closeModal"
  | "shortcutHelp";

export type ShortcutGroup = "General" | "Editor" | "Navigation";

export interface ShortcutAction {
  id: ActionId;
  label: string;
  description: string;
  group: ShortcutGroup;
  defaultChord: string;
}

export const SHORTCUT_ACTIONS: ShortcutAction[] = [
  {
    id: "newNote",
    label: "New note",
    description: "Create a note in the active notebook.",
    group: "General",
    defaultChord: "mod+alt+n",
  },
  {
    id: "openSearch",
    label: "Search notes",
    description: "Open the search palette.",
    group: "General",
    defaultChord: "mod+k",
  },
  {
    id: "toggleTheme",
    label: "Toggle theme",
    description: "Switch between light and dark mode.",
    group: "General",
    defaultChord: "mod+alt+t",
  },
  {
    id: "shortcutHelp",
    label: "Show shortcuts",
    description: "Open the keyboard shortcut reference.",
    group: "General",
    defaultChord: "mod+slash",
  },
  {
    id: "saveNote",
    label: "Save / flush now",
    description: "Save the open note immediately.",
    group: "Editor",
    defaultChord: "mod+s",
  },
  {
    id: "togglePreview",
    label: "Toggle Markdown preview",
    description: "Switch the open note between edit and preview.",
    group: "Editor",
    defaultChord: "mod+e",
  },
  {
    id: "downloadNote",
    label: "Download current note",
    description: "Download the open note as Markdown.",
    group: "Editor",
    defaultChord: "mod+shift+s",
  },
  {
    id: "deleteNote",
    label: "Delete current note",
    description: "Move the open note to Trash (undo available).",
    group: "Editor",
    defaultChord: "mod+backspace",
  },
  {
    id: "closeModal",
    label: "Close / cancel",
    description: "Close the topmost dialog or overlay.",
    group: "Navigation",
    defaultChord: "escape",
  },
];

export const SHORTCUT_ACTION_MAP: Record<ActionId, ShortcutAction> =
  SHORTCUT_ACTIONS.reduce(
    (acc, action) => {
      acc[action.id] = action;
      return acc;
    },
    {} as Record<ActionId, ShortcutAction>,
  );

export const DEFAULT_SHORTCUTS: Record<ActionId, string> =
  SHORTCUT_ACTIONS.reduce(
    (acc, action) => {
      acc[action.id] = action.defaultChord;
      return acc;
    },
    {} as Record<ActionId, string>,
  );

export type ShortcutBindings = Record<ActionId, string>;

export const IS_MAC =
  typeof navigator !== "undefined" &&
  /mac/i.test(navigator.userAgent) &&
  !/iphone|ipad|ipod/i.test(navigator.userAgent);

export const MODIFIER_KEYS = new Set([
  "shift",
  "alt",
  "opt",
  "option",
  "ctrl",
  "control",
  "meta",
  "mod",
  "cmd",
  "command",
  "os",
]);

export const isModifierKey = (token: string): boolean =>
  MODIFIER_KEYS.has(token);

const MODIFIER_ORDER = ["ctrl", "alt", "shift", "mod", "meta"] as const;

/** Friendly aliases (from common hotkey strings) mapped to canonical tokens. */
const CODE_ALIASES: Record<string, string> = {
  esc: "escape",
  return: "enter",
  " ": "space",
  del: "delete",
  up: "arrowup",
  down: "arrowdown",
  left: "arrowleft",
  right: "arrowright",
};

const normalizeKeyToken = (raw: string): string => {
  const lower = raw.trim().toLowerCase();
  return CODE_ALIASES[lower] ?? lower;
};

const MODIFIER_ALIASES: Record<string, string> = {
  control: "ctrl",
  cmd: "mod",
  command: "mod",
  option: "alt",
  opt: "alt",
  os: "meta",
};

const normalizeModifier = (token: string): string =>
  MODIFIER_ALIASES[token] ?? token;

const buildChord = (modifiers: Set<string>, key: string): string => {
  const parts = MODIFIER_ORDER.filter((modifier) => modifiers.has(modifier));
  return [...parts, key].join("+");
};

/**
 * Parse a raw chord into canonical form. Returns an empty string when the
 * chord has no usable non-modifier key.
 */
export const normalizeChord = (chord: string | undefined | null): string => {
  if (!chord) return "";

  const tokens = chord
    .toLowerCase()
    .split("+")
    .map((token) => token.trim())
    .filter(Boolean);

  const modifiers = new Set<string>();
  let key = "";

  tokens.forEach((token) => {
    if (isModifierKey(token)) {
      modifiers.add(normalizeModifier(token));
    } else {
      key = normalizeKeyToken(token);
    }
  });

  if (!key || isModifierKey(key)) return "";
  return buildChord(modifiers, key);
};

/** Build a canonical chord from the keys captured by `useRecordHotkeys`. */
export const fromRecordedKeys = (keys: Iterable<string>): string | null => {
  const modifiers = new Set<string>();
  let key: string | null = null;

  for (const raw of keys) {
    const token = normalizeKeyToken(raw);
    if (isModifierKey(token)) {
      modifiers.add(normalizeModifier(token));
      continue;
    }
    key = token;
  }

  if (!key) return null;

  if (IS_MAC && modifiers.has("meta")) {
    modifiers.delete("meta");
    modifiers.add("mod");
  } else if (!IS_MAC && modifiers.has("ctrl")) {
    modifiers.delete("ctrl");
    modifiers.add("mod");
  }

  return buildChord(modifiers, key);
};

/**
 * A binding must include a non-modifier key; bare keys are rejected (except
 * `Escape`) so shortcuts can't hijack ordinary typing. Browser-reserved combos
 * are allowed on purpose — the dispatcher calls `preventDefault` so users can
 * override most of them.
 */
export const isValidChord = (chord: string): boolean => {
  const normalized = normalizeChord(chord);
  if (!normalized) return false;

  const parts = normalized.split("+");
  const key = parts[parts.length - 1];
  if (key === "unidentified") return false;

  const hasModifier = parts.length > 1;
  return hasModifier || key === "escape";
};

/** The id of another action already using `chord`, or null when free. */
export const findConflict = (
  bindings: ShortcutBindings,
  actionId: ActionId,
  chord: string,
): ActionId | null => {
  const target = normalizeChord(chord);
  if (!target) return null;

  const conflict = SHORTCUT_ACTIONS.find(
    (action) =>
      action.id !== actionId &&
      normalizeChord(bindings[action.id]) === target,
  );

  return conflict?.id ?? null;
};

const KEY_LABELS: Record<string, string> = {
  escape: "Esc",
  enter: "↵",
  backspace: "⌫",
  delete: "Del",
  space: "Space",
  tab: "Tab",
  arrowup: "↑",
  arrowdown: "↓",
  arrowleft: "←",
  arrowright: "→",
  slash: "/",
  backslash: "\\",
  comma: ",",
  period: ".",
  minus: "-",
  equal: "=",
  semicolon: ";",
  quote: "'",
  backquote: "`",
  bracketleft: "[",
  bracketright: "]",
};

const keyLabel = (key: string): string =>
  KEY_LABELS[key] ?? (key.length === 1 ? key.toUpperCase() : key);

const MODIFIER_LABELS_MAC: Record<string, string> = {
  ctrl: "⌃",
  alt: "⌥",
  shift: "⇧",
  mod: "⌘",
  meta: "⌘",
};

const MODIFIER_LABELS_DEFAULT: Record<string, string> = {
  ctrl: "Ctrl",
  alt: "Alt",
  shift: "Shift",
  mod: "Ctrl",
  meta: "Win",
};

const MODIFIER_DISPLAY_RANK_MAC: Record<string, number> = {
  ctrl: 0,
  alt: 1,
  shift: 2,
  mod: 3,
  meta: 3,
};

const MODIFIER_DISPLAY_RANK_DEFAULT: Record<string, number> = {
  mod: 0,
  ctrl: 1,
  alt: 2,
  shift: 3,
  meta: 4,
};

/** Human-readable chord, e.g. `⇧⌘S` on macOS or `Ctrl+Shift+S` elsewhere. */
export const formatChord = (
  chord: string,
  mac: boolean = IS_MAC,
): string => {
  const normalized = normalizeChord(chord);
  if (!normalized) return "—";

  const parts = normalized.split("+");
  const key = parts[parts.length - 1];
  const rank = mac
    ? MODIFIER_DISPLAY_RANK_MAC
    : MODIFIER_DISPLAY_RANK_DEFAULT;
  const modifiers = parts
    .slice(0, -1)
    .sort((a, b) => (rank[a] ?? 99) - (rank[b] ?? 99));

  if (mac) {
    const glyphs = modifiers
      .map((modifier) => MODIFIER_LABELS_MAC[modifier] ?? modifier)
      .join("");
    return `${glyphs}${keyLabel(key)}`;
  }

  const labels = modifiers.map(
    (modifier) => MODIFIER_LABELS_DEFAULT[modifier] ?? modifier,
  );
  return [...labels, keyLabel(key)].join("+");
};

/**
 * Normalize every action's binding. Valid, non-conflicting custom chords win;
 * anything missing, malformed, reserved, or colliding with another action's
 * default falls back to that action's own default. Guarantees a unique set.
 */
export const normalizeShortcuts = (value: unknown): ShortcutBindings => {
  const source =
    value && typeof value === "object"
      ? (value as Record<string, unknown>)
      : {};

  const defaults = new Map(
    SHORTCUT_ACTIONS.map((action) => [
      action.id,
      normalizeChord(action.defaultChord),
    ]),
  );
  const used = new Set<string>();
  const result = {} as ShortcutBindings;

  SHORTCUT_ACTIONS.forEach((action) => {
    const raw = source[action.id];
    const candidate =
      typeof raw === "string" && isValidChord(raw) ? normalizeChord(raw) : "";

    const collidesWithDefault =
      candidate !== "" &&
      SHORTCUT_ACTIONS.some(
        (other) =>
          other.id !== action.id && defaults.get(other.id) === candidate,
      );

    if (candidate && !collidesWithDefault && !used.has(candidate)) {
      result[action.id] = candidate;
      used.add(candidate);
      return;
    }

    const fallback = defaults.get(action.id) ?? action.defaultChord;
    result[action.id] = fallback;
    used.add(fallback);
  });

  return result;
};
