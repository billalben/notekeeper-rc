/**
 * Run `purge` immediately, then on an interval and whenever the tab becomes
 * visible or focused again. Background timers are throttled by browsers, so the
 * visibility/focus triggers keep a long-lived tab from missing a purge window.
 */
export const scheduleTrashPurge = (
  purge: () => void,
  intervalMs: number,
): (() => void) => {
  purge();

  const intervalId = window.setInterval(purge, intervalMs);

  const handleVisibilityChange = () => {
    if (document.visibilityState === "visible") purge();
  };

  document.addEventListener("visibilitychange", handleVisibilityChange);
  window.addEventListener("focus", purge);

  return () => {
    window.clearInterval(intervalId);
    document.removeEventListener("visibilitychange", handleVisibilityChange);
    window.removeEventListener("focus", purge);
  };
};
