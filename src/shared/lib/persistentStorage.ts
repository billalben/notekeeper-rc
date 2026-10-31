export interface PersistentStorageStatus {
  supported: boolean;
  persisted: boolean;
}

const UNSUPPORTED: PersistentStorageStatus = {
  supported: false,
  persisted: false,
};

/** Whether the browser already protects this origin from storage eviction. */
export const getPersistentStorageStatus =
  async (): Promise<PersistentStorageStatus> => {
    if (typeof navigator === "undefined" || !navigator.storage?.persisted) {
      return UNSUPPORTED;
    }

    try {
      return {
        supported: true,
        persisted: await navigator.storage.persisted(),
      };
    } catch {
      return UNSUPPORTED;
    }
  };

/**
 * Ask the browser to mark this origin's storage as persistent. Returns the
 * resulting state; browsers may grant or deny without showing a prompt.
 */
export const requestPersistentStorage = async (): Promise<boolean> => {
  if (typeof navigator === "undefined" || !navigator.storage?.persist) {
    return false;
  }

  try {
    if (await navigator.storage.persisted()) return true;
    return await navigator.storage.persist();
  } catch {
    return false;
  }
};
