import { parseLaunchIntent, type LaunchIntent } from "@/shared/lib/pwa";

let capturedIntent: LaunchIntent = null;
let launchedWithIntent = false;

/**
 * Read the launch URL before React's first render. The hash router rewrites it
 * early, so this must run in `main.tsx` to avoid losing the `/share` payload or
 * shortcut action.
 */
export const captureLaunchIntent = (): LaunchIntent => {
  const url = new URL(window.location.href);
  capturedIntent = parseLaunchIntent(url.pathname, url.search);
  launchedWithIntent = capturedIntent !== null;

  if (capturedIntent) {
    // Keep hash routing intact, but drop the share/shortcut URL so a reload
    // doesn't replay the payload.
    url.pathname = "/";
    url.search = "";
    window.history.replaceState(
      window.history.state,
      "",
      `${url.pathname}${url.hash}`,
    );
  }

  return capturedIntent;
};

/** Consume the captured intent exactly once (safe under StrictMode). */
export const takeLaunchIntent = (): LaunchIntent => {
  const intent = capturedIntent;
  capturedIntent = null;
  return intent;
};

/**
 * Whether this session started from a share/shortcut launch. Used to defer
 * the onboarding tour so it cannot close a freshly prefilled draft.
 */
export const wasLaunchedWithIntent = (): boolean => launchedWithIntent;
