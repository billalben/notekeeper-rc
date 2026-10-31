import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeNote } from "@tests/factories";
import type { Note, NoteRevision, Notebook } from "@/shared/types";
import {
  MAX_HISTORY_CHARS,
  MAX_REVISIONS_PER_NOTE,
  REVISION_MIN_INTERVAL_MS,
  appendRevision,
  normalizeRevisions,
  pruneRevisions,
  removeRevisions,
  type RevisionMap,
} from "@/shared/stores/notes/history";

const baseNote = (overrides: Partial<Note> = {}) =>
  makeNote({ id: "note-1", title: "Title", text: "Body", ...overrides });

const revisionFor = (
  note: Pick<Note, "id" | "title" | "text" | "tags">,
  createdAt: number,
): NoteRevision => ({
  id: `rev-${createdAt}-${note.title}`,
  noteId: note.id,
  title: note.title,
  text: note.text,
  tags: [...note.tags],
  createdAt,
});

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("appendRevision", () => {
  it("captures the version that is about to be overwritten", () => {
    const note = baseNote({ tags: ["Work"] });

    const map = appendRevision({}, note, 1000);

    expect(map[note.id]).toHaveLength(1);
    expect(map[note.id][0]).toMatchObject({
      noteId: note.id,
      title: "Title",
      text: "Body",
      tags: ["Work"],
      createdAt: 1000,
    });
  });

  it("skips a snapshot whose content matches the newest revision", () => {
    const note = baseNote();
    const map = appendRevision({}, note, 1000);

    expect(appendRevision(map, note, 2000)).toBe(map);
  });

  it("coalesces rapid consecutive edits", () => {
    const note = baseNote();
    const map = appendRevision({}, note, 1000);

    const next = appendRevision(
      map,
      { ...note, text: "Second" },
      1000 + REVISION_MIN_INTERVAL_MS - 1,
    );

    expect(next).toBe(map);
    expect(next[note.id]).toHaveLength(1);
  });

  it("records another version once the coalescing interval has passed", () => {
    const note = baseNote();
    const map = appendRevision({}, note, 1000);

    const next = appendRevision(
      map,
      { ...note, text: "Second" },
      1000 + REVISION_MIN_INTERVAL_MS,
    );

    expect(next[note.id]).toHaveLength(2);
    expect(next[note.id][1].text).toBe("Second");
  });

  it("caps versions per note and keeps the newest ones", () => {
    let map: RevisionMap = {};
    for (let index = 0; index < MAX_REVISIONS_PER_NOTE + 5; index += 1) {
      map = appendRevision(
        map,
        baseNote({ title: `Version ${index}` }),
        index * REVISION_MIN_INTERVAL_MS,
      );
    }

    const history = map["note-1"];
    expect(history).toHaveLength(MAX_REVISIONS_PER_NOTE);
    expect(history[history.length - 1].title).toBe(
      `Version ${MAX_REVISIONS_PER_NOTE + 4}`,
    );
    expect(history[0].title).toBe("Version 5");
  });

  it("drops the oldest versions across notes to stay within the budget", () => {
    const bigText = "x".repeat(40_000);
    let map: RevisionMap = {};

    for (let index = 0; index < MAX_REVISIONS_PER_NOTE; index += 1) {
      map = appendRevision(
        map,
        baseNote({
          title: `Version ${index}`,
          text: `${bigText}${index}`,
        }),
        index * REVISION_MIN_INTERVAL_MS,
      );
    }

    const totalChars = Object.values(map).reduce(
      (total, list) =>
        total +
        list.reduce(
          (sum, revision) => sum + revision.title.length + revision.text.length,
          0,
        ),
      0,
    );

    expect(totalChars).toBeLessThanOrEqual(MAX_HISTORY_CHARS);
    expect(map["note-1"][map["note-1"].length - 1].title).toBe(
      `Version ${MAX_REVISIONS_PER_NOTE - 1}`,
    );
  });
});

describe("pruneRevisions", () => {
  it("removes history for notes that no longer exist", () => {
    const revisions = {
      keep: [revisionFor(baseNote({ id: "keep" }), 1)],
      gone: [revisionFor(baseNote({ id: "gone" }), 2)],
    };
    const notebooks: Notebook[] = [
      {
        id: "nb",
        name: "N",
        notes: [baseNote({ id: "keep" })],
        deletedAt: null,
        pinned: false,
      },
    ];

    const next = pruneRevisions(revisions, notebooks);

    expect(Object.keys(next)).toEqual(["keep"]);
  });

  it("returns the original map when nothing needs pruning", () => {
    const revisions = {
      keep: [revisionFor(baseNote({ id: "keep" }), 1)],
    };
    const notebooks: Notebook[] = [
      {
        id: "nb",
        name: "N",
        notes: [baseNote({ id: "keep" })],
        deletedAt: null,
        pinned: false,
      },
    ];

    expect(pruneRevisions(revisions, notebooks)).toBe(revisions);
  });
});

describe("removeRevisions", () => {
  it("removes history for the given note ids only", () => {
    const revisions = {
      a: [revisionFor(baseNote({ id: "a" }), 1)],
      b: [revisionFor(baseNote({ id: "b" }), 2)],
    };

    const next = removeRevisions(revisions, ["a", "missing"]);

    expect(Object.keys(next)).toEqual(["b"]);
  });

  it("returns the original map when no ids match", () => {
    const revisions = {
      a: [revisionFor(baseNote({ id: "a" }), 1)],
    };

    expect(removeRevisions(revisions, ["missing"])).toBe(revisions);
  });
});

describe("normalizeRevisions", () => {
  it("drops malformed entries and coerces fields", () => {
    const normalized = normalizeRevisions({
      "note-1": [
        {
          id: "rev-1",
          title: "T",
          text: 42,
          tags: ["a", 7],
          createdAt: 100,
        },
        { title: "no timestamp" },
        "not an object",
      ],
      "note-2": "not a list",
    });

    expect(normalized["note-1"]).toHaveLength(1);
    expect(normalized["note-1"][0]).toMatchObject({
      id: "rev-1",
      title: "T",
      text: "",
      tags: ["a"],
      createdAt: 100,
    });
    expect(normalized["note-2"]).toBeUndefined();
  });

  it("sorts oldest first and caps each note", () => {
    const list = Array.from({ length: MAX_REVISIONS_PER_NOTE + 3 }, (_, i) => ({
      id: `rev-${i}`,
      title: `T${i}`,
      text: "",
      tags: [],
      createdAt: MAX_REVISIONS_PER_NOTE + 3 - i,
    }));

    const normalized = normalizeRevisions({ "note-1": list });
    const history = normalized["note-1"];

    expect(history).toHaveLength(MAX_REVISIONS_PER_NOTE);
    expect(history[0].createdAt).toBeLessThan(
      history[history.length - 1].createdAt,
    );
  });

  it("returns an empty map for non-object input", () => {
    expect(normalizeRevisions(null)).toEqual({});
    expect(normalizeRevisions("nope")).toEqual({});
    expect(normalizeRevisions([])).toEqual({});
  });
});
