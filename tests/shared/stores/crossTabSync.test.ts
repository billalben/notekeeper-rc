import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { makeNote, makeNotebook } from "@tests/factories";
import {
  STORAGE_KEY,
  STORAGE_VERSION,
} from "@/shared/stores/notes/persistence";
import { subscribeToNoteStoreSync } from "@/shared/stores/crossTabSync";
import { useNoteStore } from "@/shared/stores/useNoteStore";

const initialState = useNoteStore.getState();

const writeStore = (state: Record<string, unknown>) => {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ state, version: STORAGE_VERSION }),
  );
};

const flushMicrotasks = () => new Promise((resolve) => setTimeout(resolve, 0));

let unsubscribe: (() => void) | undefined;

beforeEach(() => {
  useNoteStore.setState(initialState, true);
  localStorage.clear();
});

afterEach(() => {
  unsubscribe?.();
  unsubscribe = undefined;
  vi.restoreAllMocks();
});

describe("subscribeToNoteStoreSync", () => {
  it("rehydrates when another tab writes the note store", async () => {
    const rehydrate = vi
      .spyOn(useNoteStore.persist, "rehydrate")
      .mockResolvedValue();

    unsubscribe = subscribeToNoteStoreSync();
    window.dispatchEvent(new StorageEvent("storage", { key: STORAGE_KEY }));
    await flushMicrotasks();

    expect(rehydrate).toHaveBeenCalledTimes(1);
  });

  it("coalesces several writes into a single rehydrate", async () => {
    const rehydrate = vi
      .spyOn(useNoteStore.persist, "rehydrate")
      .mockResolvedValue();

    unsubscribe = subscribeToNoteStoreSync();
    window.dispatchEvent(new StorageEvent("storage", { key: STORAGE_KEY }));
    window.dispatchEvent(new StorageEvent("storage", { key: STORAGE_KEY }));
    await flushMicrotasks();

    expect(rehydrate).toHaveBeenCalledTimes(1);
  });

  it("rehydrates after a full localStorage clear", async () => {
    const rehydrate = vi
      .spyOn(useNoteStore.persist, "rehydrate")
      .mockResolvedValue();

    unsubscribe = subscribeToNoteStoreSync();
    window.dispatchEvent(new StorageEvent("storage", { key: null }));
    await flushMicrotasks();

    expect(rehydrate).toHaveBeenCalledTimes(1);
  });

  it("ignores writes to unrelated storage keys", async () => {
    const rehydrate = vi
      .spyOn(useNoteStore.persist, "rehydrate")
      .mockResolvedValue();

    unsubscribe = subscribeToNoteStoreSync();
    window.dispatchEvent(new StorageEvent("storage", { key: "theme" }));
    await flushMicrotasks();

    expect(rehydrate).not.toHaveBeenCalled();
  });
});

describe("note store rehydration", () => {
  it("adopts notes written by another tab while keeping the local notebook", async () => {
    const localNotebook = makeNotebook({
      id: "local",
      notes: [makeNote({ id: "note-1", title: "Local" })],
    });
    const otherNotebook = makeNotebook({ id: "other" });

    useNoteStore.setState({
      notebooks: [localNotebook, otherNotebook],
      activeNotebookId: "local",
      revisions: {},
    });

    const externalNotebook = makeNotebook({
      id: "local",
      notes: [makeNote({ id: "note-1", title: "From another tab" })],
    });
    writeStore({
      notebooks: [externalNotebook],
      tags: [],
      activeNotebookId: "external-active",
      revisions: {},
    });

    await useNoteStore.persist.rehydrate();

    expect(useNoteStore.getState().notebooks[0].notes[0].title).toBe(
      "From another tab",
    );
    expect(useNoteStore.getState().activeNotebookId).toBe("local");
  });

  it("uses the persisted notebook when the local one is gone", async () => {
    useNoteStore.setState({
      notebooks: [makeNotebook({ id: "local" })],
      activeNotebookId: null,
      revisions: {},
    });

    writeStore({
      notebooks: [makeNotebook({ id: "external" })],
      tags: [],
      activeNotebookId: "external",
      revisions: {},
    });

    await useNoteStore.persist.rehydrate();

    expect(useNoteStore.getState().activeNotebookId).toBe("external");
  });

  it("drops the local notebook when it was trashed by another tab", async () => {
    useNoteStore.setState({
      notebooks: [makeNotebook({ id: "local" })],
      activeNotebookId: "local",
      revisions: {},
    });

    writeStore({
      notebooks: [
        makeNotebook({ id: "local", deletedAt: 1 }),
        makeNotebook({ id: "other" }),
      ],
      tags: [],
      activeNotebookId: "other",
      revisions: {},
    });

    await useNoteStore.persist.rehydrate();

    expect(useNoteStore.getState().activeNotebookId).toBe("other");
  });
});
