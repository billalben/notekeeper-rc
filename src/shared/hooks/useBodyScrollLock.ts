import { useEffect } from "react";

/**
 * Lock body scrolling for the lifetime of the calling component (e.g. a
 * full-screen dialog) and restore the previous overflow on unmount.
 */
export const useBodyScrollLock = (): void => {
  useEffect(() => {
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflow;
    };
  }, []);
};
