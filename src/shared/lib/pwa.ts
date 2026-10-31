/**
 * Constants and pure helpers for the PWA extras: share-target launches and
 * manifest shortcuts. This module is imported by `vite/pwaManifest.ts`, so it
 * must stay free of DOM and app imports.
 */

const SHARE_PARAM = "share";
const ACTION_PARAM = "action";

/**
 * The manifest `share_target.action`. A dedicated path is used because the
 * spec replaces any existing query string with the shared fields, so a `?share`
 * marker in the action URL would be lost.
 */
export const SHARE_TARGET_ACTION = "/share";

export const SHORTCUT_URLS = {
  newNote: `/?${ACTION_PARAM}=new-note`,
  search: `/?${ACTION_PARAM}=search`,
} as const;

type LaunchShortcut = "new-note" | "search";

export interface SharedContent {
  title: string;
  text: string;
  url: string;
}

/** Initial title/body for a draft opened from a shared payload. */
export interface NoteSeed {
  title: string;
  text: string;
}

export type LaunchIntent =
  | { kind: "share"; content: SharedContent; seed: NoteSeed }
  | { kind: "shortcut"; action: LaunchShortcut }
  | null;

const readParam = (params: URLSearchParams, name: string): string =>
  (params.get(name) ?? "").trim();

/**
 * Compose the draft from a share payload. The URL goes on its own paragraph
 * unless the shared text already contains it.
 */
export const buildNoteSeed = (content: SharedContent): NoteSeed => {
  const text = content.text.trim();
  const url = content.url.trim();
  const parts: string[] = [];

  if (text) parts.push(text);
  if (url && !text.includes(url)) parts.push(url);

  return { title: content.title.trim(), text: parts.join("\n\n") };
};

/**
 * Parse the path/query appended by the OS share sheet or a manifest shortcut.
 * Returns `null` for normal navigations and empty share payloads. The `?share`
 * marker remains as a convenience for manual launches and older links.
 */
export const parseLaunchIntent = (
  pathname: string,
  search: string,
): LaunchIntent => {
  const params = new URLSearchParams(search);

  if (pathname === SHARE_TARGET_ACTION || params.has(SHARE_PARAM)) {
    const content: SharedContent = {
      title: readParam(params, "title"),
      text: readParam(params, "text"),
      url: readParam(params, "url"),
    };

    if (!content.title && !content.text && !content.url) return null;
    return { kind: "share", content, seed: buildNoteSeed(content) };
  }

  const action = params.get(ACTION_PARAM);
  if (action === "new-note" || action === "search") {
    return { kind: "shortcut", action };
  }

  return null;
};
