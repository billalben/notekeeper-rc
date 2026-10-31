import { useEffect, useRef } from "react";

/**
 * Remember the element focused before a dialog mounted and restore focus to it
 * on unmount, so keyboard users return to where they were.
 */
export const useRestoreFocus = (): void => {
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    // Capture once: StrictMode re-runs effects, and by then the dialog itself
    // may already own focus.
    if (previouslyFocused.current === null) {
      previouslyFocused.current = document.activeElement as HTMLElement | null;
    }

    return () => {
      // Another surface may have claimed focus in the same commit (for example,
      // a command that opens an inline editor). Only restore focus if it fell
      // back to the document, so we never steal it from the new target.
      if (document.activeElement !== document.body) return;
      previouslyFocused.current?.focus?.();
    };
  }, []);
};
