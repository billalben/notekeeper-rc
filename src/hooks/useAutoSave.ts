import { useCallback, useEffect, useRef, useState } from "react";
import { useDebouncedCallback } from "./useDebouncedCallback";

export const AUTOSAVE_DELAY_MS = 500;

export type AutoSaveStatus = "idle" | "saving" | "saved";

interface UseAutoSaveOptions<T> {
  onSave: (value: T) => void;
  shouldSave?: (value: T) => boolean;
  delay?: number;
}

interface UseAutoSaveResult<T> {
  status: AutoSaveStatus;
  savedAt: number | null;
  schedule: (value: T) => void;
  flush: () => void;
}

/**
 * Debounced save orchestration with a status flag for the editor. Values are
 * only committed when `shouldSave` allows them (e.g. skip brand-new empty
 * notes). `status` is `saving` while a write is pending and `saved` once it
 * lands, so the UI never has to know how persistence works.
 */
export const useAutoSave = <T>({
  onSave,
  shouldSave,
  delay = AUTOSAVE_DELAY_MS,
}: UseAutoSaveOptions<T>): UseAutoSaveResult<T> => {
  const [status, setStatus] = useState<AutoSaveStatus>("idle");
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const optionsRef = useRef({ onSave, shouldSave });
  useEffect(() => {
    optionsRef.current = { onSave, shouldSave };
  }, [onSave, shouldSave]);

  const commit = useCallback((value: T) => {
    const { onSave, shouldSave } = optionsRef.current;
    if (shouldSave && !shouldSave(value)) return;
    onSave(value);
    setSavedAt(Date.now());
    setStatus("saved");
  }, []);

  const { run, flush, cancel } = useDebouncedCallback(commit, delay);

  const schedule = useCallback(
    (value: T) => {
      const { shouldSave } = optionsRef.current;
      if (shouldSave && !shouldSave(value)) {
        cancel();
        setStatus("idle");
        return;
      }
      setStatus("saving");
      run(value);
    },
    [run, cancel],
  );

  return { status, savedAt, schedule, flush };
};
