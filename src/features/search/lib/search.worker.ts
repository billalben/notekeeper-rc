import { createNoteSearchIndex, runSearch, type SearchIndex } from "./search";
import type {
  SearchWorkerRequest,
  SearchWorkerResponse,
} from "./searchWorkerTypes";

const workerScope = self as unknown as {
  onmessage: ((event: MessageEvent<SearchWorkerRequest>) => void) | null;
  postMessage: (message: SearchWorkerResponse) => void;
};

let index: SearchIndex | null = null;

workerScope.onmessage = (event) => {
  const message = event.data;

  if (message.type === "index") {
    index = createNoteSearchIndex(message.entries);
    workerScope.postMessage({ type: "ready" });
    return;
  }

  if (message.type === "search") {
    try {
      const results = index ? runSearch(index, message.query) : [];
      workerScope.postMessage({
        type: "results",
        requestId: message.requestId,
        results,
      });
    } catch (error) {
      workerScope.postMessage({
        type: "error",
        requestId: message.requestId,
        message: error instanceof Error ? error.message : "Search failed",
      });
    }
  }
};
