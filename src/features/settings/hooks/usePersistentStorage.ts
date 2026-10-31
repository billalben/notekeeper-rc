import { useCallback, useEffect, useState } from "react";
import {
  getPersistentStorageStatus,
  requestPersistentStorage,
  type PersistentStorageStatus,
} from "@/shared/lib/persistentStorage";

interface PersistentStorageState extends PersistentStorageStatus {
  /** Whether the initial async check has completed. */
  checked: boolean;
}

/**
 * Read and request persistent storage. `request` is user-gesture friendly and
 * updates the local status with the browser's answer.
 */
export const usePersistentStorage = () => {
  const [status, setStatus] = useState<PersistentStorageState>({
    supported: false,
    persisted: false,
    checked: false,
  });

  useEffect(() => {
    let cancelled = false;

    void getPersistentStorageStatus().then((next) => {
      if (!cancelled) setStatus({ ...next, checked: true });
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const request = useCallback(async (): Promise<boolean> => {
    const persisted = await requestPersistentStorage();
    setStatus({ supported: true, persisted, checked: true });
    return persisted;
  }, []);

  return { ...status, request };
};
