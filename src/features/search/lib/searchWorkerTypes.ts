import type { SearchEntry, SearchResult } from "./search";

export type SearchWorkerRequest =
  | { type: "index"; entries: SearchEntry[] }
  | { type: "search"; requestId: number; query: string };

export type SearchWorkerResponse =
  | { type: "ready" }
  | { type: "results"; requestId: number; results: SearchResult[] }
  | { type: "error"; requestId?: number; message: string };
