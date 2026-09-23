import type { SettingsSection } from "../types";
import {
  DEFAULT_ROUTE,
  type BaseView,
  type Overlay,
  type Route,
} from "./types";

const SECTION_VIEWS: Record<string, BaseView> = {
  all: "all",
  recent: "recent",
  pinned: "pinned",
  favorites: "favorites",
  stats: "stats",
  trash: "trash",
};

export const SETTINGS_SECTIONS: SettingsSection[] = [
  "general",
  "appearance",
  "shortcuts",
  "notifications",
  "data",
  "about",
];

export const isSettingsSection = (
  value: string | undefined,
): value is SettingsSection =>
  value !== undefined && SETTINGS_SECTIONS.includes(value as SettingsSection);

const decode = (value: string): string => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

/**
 * Normalize any hash into the canonical `#/...` form (no trailing slash) so
 * values read from `location.hash` and produced by `buildHash` compare equal.
 */
export const normalizeHash = (hash: string): string => {
  if (!hash) return "#/";
  const withoutHash = hash.startsWith("#") ? hash.slice(1) : hash;
  const path = withoutHash.startsWith("/") ? withoutHash : `/${withoutHash}`;
  const trimmed = path.replace(/\/+$/, "");
  return `#${trimmed || "/"}`;
};

export const parseHash = (hash: string): Route => {
  const path = normalizeHash(hash).slice(2);
  const segments = path.split("/").filter(Boolean).map(decode);
  if (segments.length === 0) return { ...DEFAULT_ROUTE };

  const route: Route = { ...DEFAULT_ROUTE };
  const head = segments[0];
  let index = 0;

  if (head === "notebooks") {
    route.base = "notebook";
    route.notebookId = segments[1] ?? null;
    index = 2;
  } else if (head in SECTION_VIEWS) {
    route.base = SECTION_VIEWS[head];
    index = 1;
  } else if (
    head === "note" ||
    head === "settings" ||
    head === "search" ||
    head === "shortcuts"
  ) {
    index = 0;
  } else {
    return { ...DEFAULT_ROUTE };
  }

  if (segments[index] === "note" && segments[index + 1]) {
    route.noteId = segments[index + 1];
    index += 2;
  }

  const overlayKey = segments[index];
  let overlay: Overlay = null;
  if (overlayKey === "settings") {
    const section = segments[index + 1];
    overlay = {
      kind: "settings",
      section: isSettingsSection(section) ? section : "general",
    };
  } else if (overlayKey === "search") {
    overlay = { kind: "search" };
  } else if (overlayKey === "shortcuts") {
    overlay = { kind: "shortcuts" };
  }
  route.overlay = overlay;

  return route;
};

export const buildHash = (route: Route): string => {
  const segments: string[] = [];

  if (route.base === "notebook" && route.notebookId) {
    segments.push("notebooks", encodeURIComponent(route.notebookId));
  } else if (route.base === "notebook") {
    segments.push("all");
  } else {
    segments.push(route.base);
  }

  if (route.noteId) {
    segments.push("note", encodeURIComponent(route.noteId));
  }

  if (route.overlay?.kind === "settings") {
    segments.push("settings", route.overlay.section);
  } else if (route.overlay) {
    segments.push(route.overlay.kind);
  }

  return `#/${segments.join("/")}`;
};

/** How nested a route is: base = 0, note or overlay = 1, both = 2. */
export const routeDepth = (route: Route): number =>
  (route.noteId ? 1 : 0) + (route.overlay ? 1 : 0);

/** Identity of the base portion, used to decide push vs replace. */
export const baseKey = (route: Route): string =>
  route.base === "notebook" ? `notebook:${route.notebookId ?? ""}` : route.base;
