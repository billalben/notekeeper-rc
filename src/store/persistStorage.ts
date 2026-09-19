import type { StateStorage } from "zustand/middleware";

export const isQuotaExceededError = (error: unknown): boolean =>
  error instanceof DOMException &&
  (error.name === "QuotaExceededError" || error.code === 22);

/**
 * A `localStorage`-backed `StateStorage` that never throws. Read/remove
 * failures are swallowed and write failures are reported through `onError`,
 * so persistence problems surface instead of silently losing data.
 */
export const createLocalStorage = (
  onError?: (error: unknown) => void,
): StateStorage => ({
  getItem: (name) => {
    try {
      return localStorage.getItem(name);
    } catch {
      return null;
    }
  },
  setItem: (name, value) => {
    try {
      localStorage.setItem(name, value);
    } catch (error) {
      onError?.(error);
    }
  },
  removeItem: (name) => {
    try {
      localStorage.removeItem(name);
    } catch {
      /* ignore */
    }
  },
});
