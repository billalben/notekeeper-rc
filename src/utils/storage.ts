export const STORAGE_QUOTA_BYTES = 5 * 1024 * 1024;
export const STORAGE_WARNING_RATIO = 0.8;

const PROBE_KEY = "__notekeeper_storage_probe__";

/**
 * Approximate the number of UTF-8 bytes a string occupies, matching what a
 * browser would store.
 */
export const estimateBytes = (value: string): number =>
  new Blob([value]).size;

/**
 * Whether `localStorage` is usable. A write failure caused by quota still
 * means storage exists, so only report it as unavailable when access itself
 * is blocked.
 */
export const isLocalStorageAvailable = (): boolean => {
  if (typeof window === "undefined") return false;

  try {
    const storage = window.localStorage;
    if (!storage) return false;

    storage.setItem(PROBE_KEY, "1");
    storage.removeItem(PROBE_KEY);
    return true;
  } catch (error) {
    // A quota failure still means storage exists; a disabled/blocked storage
    // (SecurityError) does not.
    return (
      error instanceof DOMException && error.name === "QuotaExceededError"
    );
  }
};

export const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};
