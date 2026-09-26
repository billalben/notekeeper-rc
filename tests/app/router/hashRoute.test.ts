import { describe, expect, it } from "vitest";
import { DEFAULT_ROUTE, type Route } from "@/app/router/types";
import {
  baseKey,
  buildHash,
  normalizeHash,
  parseHash,
  routeDepth,
} from "@/app/router/hashRoute";

describe("normalizeHash", () => {
  it("canonicalizes any hash into the #/ form", () => {
    expect(normalizeHash("")).toBe("#/");
    expect(normalizeHash("#/")).toBe("#/");
    expect(normalizeHash("#/all/")).toBe("#/all");
    expect(normalizeHash("all")).toBe("#/all");
    expect(normalizeHash("#all")).toBe("#/all");
    expect(normalizeHash("#/notebooks/x/")).toBe("#/notebooks/x");
  });
});

describe("parseHash", () => {
  it("parses base views", () => {
    expect(parseHash("#/all")).toEqual({ ...DEFAULT_ROUTE, base: "all" });
    expect(parseHash("#/recent")).toEqual({ ...DEFAULT_ROUTE, base: "recent" });
    expect(parseHash("#/pinned")).toEqual({ ...DEFAULT_ROUTE, base: "pinned" });
    expect(parseHash("#/favorites")).toEqual({
      ...DEFAULT_ROUTE,
      base: "favorites",
    });
    expect(parseHash("#/stats")).toEqual({ ...DEFAULT_ROUTE, base: "stats" });
    expect(parseHash("#/trash")).toEqual({ ...DEFAULT_ROUTE, base: "trash" });
  });

  it("falls back to the default route for empty or unknown paths", () => {
    expect(parseHash("#/")).toEqual(DEFAULT_ROUTE);
    expect(parseHash("")).toEqual(DEFAULT_ROUTE);
    expect(parseHash("#/nonsense")).toEqual(DEFAULT_ROUTE);
  });

  it("parses notebooks and notes", () => {
    expect(parseHash("#/notebooks/nb1")).toEqual({
      base: "notebook",
      notebookId: "nb1",
      noteId: null,
      overlay: null,
    });
    expect(parseHash("#/notebooks/nb1/note/n1")).toEqual({
      base: "notebook",
      notebookId: "nb1",
      noteId: "n1",
      overlay: null,
    });
    expect(parseHash("#/all/note/n1")).toEqual({
      ...DEFAULT_ROUTE,
      noteId: "n1",
    });
  });

  it("parses overlays, defaulting an unknown settings section to general", () => {
    expect(parseHash("#/search")).toEqual({
      ...DEFAULT_ROUTE,
      overlay: { kind: "search" },
    });
    expect(parseHash("#/shortcuts")).toEqual({
      ...DEFAULT_ROUTE,
      overlay: { kind: "shortcuts" },
    });
    expect(parseHash("#/all/settings/appearance")).toEqual({
      ...DEFAULT_ROUTE,
      overlay: { kind: "settings", section: "appearance" },
    });
    expect(parseHash("#/all/settings/bogus")).toEqual({
      ...DEFAULT_ROUTE,
      overlay: { kind: "settings", section: "general" },
    });
  });

  it("decodes ids, tolerating malformed sequences", () => {
    expect(parseHash("#/notebooks/a%2Fb").notebookId).toBe("a/b");
    expect(parseHash("#/notebooks/%E0%A4%A").notebookId).toBe("%E0%A4%A");
  });
});

describe("buildHash", () => {
  it("serializes routes", () => {
    expect(buildHash(DEFAULT_ROUTE)).toBe("#/all");
    expect(
      buildHash({
        base: "notebook",
        notebookId: "x",
        noteId: null,
        overlay: null,
      }),
    ).toBe("#/notebooks/x");
    expect(
      buildHash({
        base: "notebook",
        notebookId: null,
        noteId: null,
        overlay: null,
      }),
    ).toBe("#/all");
    expect(
      buildHash({
        base: "notebook",
        notebookId: "x",
        noteId: "n1",
        overlay: { kind: "settings", section: "general" },
      }),
    ).toBe("#/notebooks/x/note/n1/settings/general");
    expect(
      buildHash({ base: "all", notebookId: null, noteId: "n1", overlay: null }),
    ).toBe("#/all/note/n1");
    expect(
      buildHash({
        base: "all",
        notebookId: null,
        noteId: null,
        overlay: { kind: "search" },
      }),
    ).toBe("#/all/search");
  });

  it("encodes ids that contain slashes", () => {
    expect(
      buildHash({
        base: "notebook",
        notebookId: "a/b",
        noteId: null,
        overlay: null,
      }),
    ).toBe("#/notebooks/a%2Fb");
  });
});

describe("parseHash / buildHash round-trip", () => {
  const routes: Route[] = [
    DEFAULT_ROUTE,
    { base: "recent", notebookId: null, noteId: null, overlay: null },
    { base: "notebook", notebookId: "nb 1", noteId: "n/1", overlay: null },
    {
      base: "notebook",
      notebookId: "nb1",
      noteId: "n1",
      overlay: { kind: "shortcuts" },
    },
    {
      base: "favorites",
      notebookId: null,
      noteId: null,
      overlay: { kind: "settings", section: "data" },
    },
  ];

  it("recovers the original route", () => {
    routes.forEach((route) => {
      expect(parseHash(buildHash(route))).toEqual(route);
    });
  });
});

describe("routeDepth", () => {
  it("counts how nested a route is", () => {
    expect(routeDepth(DEFAULT_ROUTE)).toBe(0);
    expect(routeDepth({ ...DEFAULT_ROUTE, noteId: "n1" })).toBe(1);
    expect(routeDepth({ ...DEFAULT_ROUTE, overlay: { kind: "search" } })).toBe(
      1,
    );
    expect(
      routeDepth({
        ...DEFAULT_ROUTE,
        noteId: "n1",
        overlay: { kind: "search" },
      }),
    ).toBe(2);
  });
});

describe("baseKey", () => {
  it("identifies the base portion", () => {
    expect(baseKey(DEFAULT_ROUTE)).toBe("all");
    expect(
      baseKey({
        base: "notebook",
        notebookId: "x",
        noteId: null,
        overlay: null,
      }),
    ).toBe("notebook:x");
    expect(
      baseKey({
        base: "notebook",
        notebookId: null,
        noteId: null,
        overlay: null,
      }),
    ).toBe("notebook:");
  });
});
