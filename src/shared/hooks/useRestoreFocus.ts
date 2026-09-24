import { useEffect } from "react";

/**
 * Remember the element focused before a dialog mounted and restore focus to it
 * on unmount, so keyboard users return to where they were.
 */
export const useRestoreFocus = (): void => {
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    return () => {
      previouslyFocused?.focus?.();
    };
  }, []);
};
