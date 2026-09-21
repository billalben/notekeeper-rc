import { useCallback, useEffect, useMemo, useRef } from "react";

export interface DebouncedCallback<Args extends unknown[]> {
  run: (...args: Args) => void;
  flush: () => void;
  cancel: () => void;
}

/**
 * Trailing-edge debounce with imperative controls. The latest callback is kept
 * in a ref so callers don't need to memoize it, and a pending invocation is
 * flushed on unmount so edits aren't dropped when the consumer goes away
 * (e.g. switching notes in split view). `flush` runs any pending call
 * immediately (used before closing the editor), while `cancel` drops it.
 */
export const useDebouncedCallback = <Args extends unknown[]>(
  callback: (...args: Args) => void,
  delay = 500,
): DebouncedCallback<Args> => {
  const callbackRef = useRef(callback);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingRef = useRef<Args | null>(null);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const cancel = useCallback(() => {
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    pendingRef.current = null;
  }, []);

  const flush = useCallback(() => {
    if (timeoutRef.current === null) return;
    clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
    const args = pendingRef.current;
    pendingRef.current = null;
    if (args) callbackRef.current(...args);
  }, []);

  const run = useCallback(
    (...args: Args) => {
      pendingRef.current = args;
      if (timeoutRef.current !== null) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        timeoutRef.current = null;
        const pending = pendingRef.current;
        pendingRef.current = null;
        if (pending) callbackRef.current(...pending);
      }, delay);
    },
    [delay],
  );

  useEffect(() => flush, [flush]);

  return useMemo(() => ({ run, flush, cancel }), [run, flush, cancel]);
};
