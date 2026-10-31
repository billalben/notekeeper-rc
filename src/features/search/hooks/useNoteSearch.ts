import { useEffect, useMemo, useRef, useState } from "react";
import {
  createNoteSearchIndex,
  runSearch,
  type SearchEntry,
  type SearchIndex,
  type SearchResult,
} from "@/features/search/lib/search";
import type {
  SearchWorkerRequest,
  SearchWorkerResponse,
} from "@/features/search/lib/searchWorkerTypes";

interface UseNoteSearchResult {
  results: SearchResult[];
  isIndexing: boolean;
  isPending: boolean;
}

/**
 * Run note searches in a dedicated worker so a large Fuse index never blocks
 * the main thread. Browsers without Worker support (including jsdom) fall back
 * to the same pure search functions synchronously.
 */
export const useNoteSearch = (
  entries: SearchEntry[],
  query: string,
): UseNoteSearchResult => {
  const [workerFailed, setWorkerFailed] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [isIndexing, setIsIndexing] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const workerRef = useRef<Worker | null>(null);
  const requestIdRef = useRef(0);
  const latestRequestIdRef = useRef(0);
  const canUseWorker = typeof Worker !== "undefined" && !workerFailed;

  const fallbackIndex = useMemo<SearchIndex | null>(
    () => (canUseWorker ? null : createNoteSearchIndex(entries)),
    [canUseWorker, entries],
  );
  const fallbackResults = useMemo(
    () => (fallbackIndex ? runSearch(fallbackIndex, query) : []),
    [fallbackIndex, query],
  );

  useEffect(() => {
    if (!canUseWorker) {
      workerRef.current = null;
      return;
    }

    let cancelled = false;
    let worker: Worker;
    try {
      worker = new Worker(new URL("../lib/search.worker.ts", import.meta.url), {
        type: "module",
      });
    } catch {
      // Defer the fallback so this effect does not synchronously set state.
      queueMicrotask(() => {
        if (!cancelled) setWorkerFailed(true);
      });
      return () => {
        cancelled = true;
      };
    }

    workerRef.current = worker;
    worker.onmessage = (event: MessageEvent<SearchWorkerResponse>) => {
      const message = event.data;

      if (message.type === "ready") {
        setIsIndexing(false);
        setIsReady(true);
        return;
      }

      if (message.type === "results") {
        if (message.requestId !== latestRequestIdRef.current) return;
        setResults(message.results);
        setIsPending(false);
        return;
      }

      setWorkerFailed(true);
    };
    worker.onerror = () => setWorkerFailed(true);
    worker.onmessageerror = () => setWorkerFailed(true);

    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, [canUseWorker]);

  useEffect(() => {
    if (!canUseWorker) return;

    const worker = workerRef.current;
    if (!worker) return;

    setIsReady(false);
    setIsIndexing(true);
    worker.postMessage({
      type: "index",
      entries,
    } satisfies SearchWorkerRequest);
  }, [canUseWorker, entries]);

  /* eslint-disable react/set-state-in-effect -- the worker is an external
     system; mark a request pending before handing it off. */
  useEffect(() => {
    if (!canUseWorker) return;

    const worker = workerRef.current;
    if (!worker) return;

    if (!isReady) return;

    if (!query.trim()) {
      latestRequestIdRef.current = 0;
      return;
    }

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    latestRequestIdRef.current = requestId;
    setIsPending(true);
    worker.postMessage({
      type: "search",
      requestId,
      query,
    } satisfies SearchWorkerRequest);
  }, [canUseWorker, isReady, query]);
  /* eslint-enable react/set-state-in-effect */

  if (!canUseWorker) {
    return { results: fallbackResults, isIndexing: false, isPending: false };
  }

  const hasQuery = query.trim().length > 0;

  return {
    results: hasQuery ? results : [],
    isIndexing,
    isPending: hasQuery ? isPending || !isReady : false,
  };
};
