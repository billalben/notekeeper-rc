/**
 * A tiny wrapper around the browser History API that tracks the entries this
 * app has pushed. That lets us decide whether closing an overlay should go
 * `back()` (reversing our own push) or `replaceState` (when the overlay was
 * restored from a fresh load and has no in-app predecessor).
 */

interface AppHistoryEntry {
  hash: string;
}

let stack: string[] = [];
let pointer = -1;
let initialized = false;

export const initHistory = (hash: string): void => {
  stack = [hash];
  pointer = 0;
  initialized = true;
  window.history.replaceState({ hash } satisfies AppHistoryEntry, "", hash);
};

export const pushRoute = (hash: string): void => {
  if (!initialized) {
    initHistory(hash);
    return;
  }
  stack = stack.slice(0, pointer + 1);
  stack.push(hash);
  pointer = stack.length - 1;
  window.history.pushState({ hash } satisfies AppHistoryEntry, "", hash);
};

export const replaceRoute = (hash: string): void => {
  if (!initialized) {
    initHistory(hash);
    return;
  }
  if (pointer < 0) {
    stack.push(hash);
    pointer = stack.length - 1;
  } else {
    stack[pointer] = hash;
  }
  window.history.replaceState({ hash } satisfies AppHistoryEntry, "", hash);
};

export const canGoBackTo = (hash: string): boolean =>
  pointer > 0 && stack[pointer - 1] === hash;

export const goBack = (): void => {
  if (pointer <= 0) return;
  pointer -= 1;
  window.history.back();
};

/** Reconcile our tracked stack after a browser-initiated popstate/hashchange. */
export const syncFromLocation = (hash: string): void => {
  if (!initialized) {
    initHistory(hash);
    return;
  }
  const found = stack.lastIndexOf(hash);
  if (found !== -1) {
    pointer = found;
    return;
  }
  stack = stack.slice(0, pointer + 1);
  stack.push(hash);
  pointer = stack.length - 1;
};
