import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { countWords } from "@/shared/lib/text";
import type { Note, Notebook } from "@/shared/types";
import type { NoteDraft, NoteSaveInput } from "../types";

const isSameDraft = (a: NoteDraft, b: NoteDraft): boolean =>
  a.title === b.title &&
  a.text === b.text &&
  a.notebookId === b.notebookId &&
  a.favorite === b.favorite &&
  a.tags.length === b.tags.length &&
  a.tags.every((tag, index) => tag === b.tags[index]);

interface UseNoteDraftInput {
  noteId?: string;
  title?: string;
  text?: string;
  tags?: string[];
  favorite?: boolean;
  notebookId: string;
  notebooks: Notebook[];
  postedOn?: number;
  updatedOn?: number;
  onSave: (data: NoteSaveInput) => Note | undefined;
  onDirtyChange?: (dirty: boolean) => void;
}

/**
 * Holds the editor's draft fields, tracks whether they diverge from the last
 * saved snapshot, and commits them through `onSave`.
 */
export const useNoteDraft = ({
  noteId: initialNoteId,
  title: initialTitle = "",
  text: initialText = "",
  tags: initialTags = [],
  favorite: initialFavorite = false,
  notebookId,
  notebooks,
  postedOn,
  updatedOn,
  onSave,
  onDirtyChange,
}: UseNoteDraftInput) => {
  const [title, setTitle] = useState(initialTitle);
  const [text, setText] = useState(initialText);
  const [tags, setTags] = useState(initialTags);
  const [favorite, setFavorite] = useState(initialFavorite);
  const [noteId, setNoteId] = useState(initialNoteId);
  const [selectedNotebookId, setSelectedNotebookId] = useState(notebookId);
  const [savedAt, setSavedAt] = useState<number | null>(updatedOn ?? null);
  const [savedSnapshot, setSavedSnapshot] = useState<NoteDraft>({
    title: initialTitle,
    text: initialText,
    tags: initialTags,
    notebookId,
    favorite: initialFavorite,
  });

  // Cross-tab protection: remember the `updatedOn` this tab last wrote and the
  // latest one seen from the store. A different value means another tab saved
  // the note while this editor was open.
  const lastSavedUpdatedOnRef = useRef<number | undefined>(updatedOn);
  const seenUpdatedOnRef = useRef<number | undefined>(updatedOn);
  const [hasExternalConflict, setHasExternalConflict] = useState(false);
  const [adoptedExternalAt, setAdoptedExternalAt] = useState<number | null>(
    null,
  );

  const hasNote = Boolean(noteId);
  const hasNoteRef = useRef(hasNote);
  useEffect(() => {
    hasNoteRef.current = hasNote;
  }, [hasNote]);

  const dirtyChangeRef = useRef(onDirtyChange);
  useEffect(() => {
    dirtyChangeRef.current = onDirtyChange;
  }, [onDirtyChange]);

  const draft = useMemo<NoteDraft>(
    () => ({
      title,
      text,
      tags,
      notebookId: selectedNotebookId,
      favorite,
    }),
    [title, text, tags, selectedNotebookId, favorite],
  );

  const dirty = !isSameDraft(draft, savedSnapshot);
  const isSavable =
    hasNote || Boolean(title.trim() || text.trim() || tags.length);

  const notebookValue = notebooks.some((nb) => nb.id === selectedNotebookId)
    ? selectedNotebookId
    : (notebooks[0]?.id ?? "");

  const words = useMemo(() => countWords(text), [text]);

  const showEdited =
    postedOn !== undefined && savedAt !== null && savedAt - postedOn > 1000;

  const adoptExternal = useCallback(
    (next: {
      title: string;
      text: string;
      tags: string[];
      notebookId: string;
      favorite: boolean;
      updatedOn: number;
    }) => {
      seenUpdatedOnRef.current = next.updatedOn;
      lastSavedUpdatedOnRef.current = next.updatedOn;
      setTitle(next.title);
      setText(next.text);
      setTags(next.tags);
      setSelectedNotebookId(next.notebookId);
      setFavorite(next.favorite);
      setSavedSnapshot({
        title: next.title,
        text: next.text,
        tags: next.tags,
        notebookId: next.notebookId,
        favorite: next.favorite,
      });
      setSavedAt(next.updatedOn);
      setHasExternalConflict(false);
      setAdoptedExternalAt(Date.now());
    },
    [],
  );

  useEffect(() => {
    dirtyChangeRef.current?.(dirty);
  }, [dirty]);

  useEffect(() => {
    if (updatedOn === undefined) return;

    if (seenUpdatedOnRef.current === undefined) {
      seenUpdatedOnRef.current = updatedOn;
      lastSavedUpdatedOnRef.current = updatedOn;
      return;
    }

    if (updatedOn === seenUpdatedOnRef.current) return;
    seenUpdatedOnRef.current = updatedOn;

    // Our own save already updated the ref before React re-rendered.
    if (updatedOn === lastSavedUpdatedOnRef.current) return;

    if (isSameDraft(draft, savedSnapshot)) {
      // oxlint-disable-next-line react/set-state-in-effect
      adoptExternal({
        title: initialTitle,
        text: initialText,
        tags: initialTags,
        notebookId,
        favorite: initialFavorite,
        updatedOn,
      });
      return;
    }

    // The `updatedOn` change comes from another tab, so surface the conflict
    // on the next tick rather than synchronously inside this effect.
    queueMicrotask(() => setHasExternalConflict(true));
  }, [
    adoptExternal,
    draft,
    initialFavorite,
    initialTags,
    initialText,
    initialTitle,
    notebookId,
    savedSnapshot,
    updatedOn,
  ]);

  const persist = (data: NoteDraft) => {
    const result = onSave(data);
    if (!hasNoteRef.current) {
      if (!result) return;
      setNoteId(result.id);
      setSelectedNotebookId(result.notebookId);
      setFavorite(result.favorite);
    }

    if (result?.updatedOn !== undefined) {
      lastSavedUpdatedOnRef.current = result.updatedOn;
      seenUpdatedOnRef.current = result.updatedOn;
      setSavedAt(result.updatedOn);
    } else {
      setSavedAt(Date.now());
    }
    setSavedSnapshot(data);
  };

  const shouldSave = (data: NoteDraft) =>
    hasNoteRef.current ||
    Boolean(data.title.trim() || data.text.trim() || data.tags.length);

  const reloadExternal = useCallback(() => {
    if (updatedOn === undefined) return;
    adoptExternal({
      title: initialTitle,
      text: initialText,
      tags: initialTags,
      notebookId,
      favorite: initialFavorite,
      updatedOn,
    });
  }, [
    adoptExternal,
    initialFavorite,
    initialTags,
    initialText,
    initialTitle,
    notebookId,
    updatedOn,
  ]);

  const keepLocalChanges = useCallback(() => {
    setHasExternalConflict(false);
  }, []);

  const discard = () => {
    setTitle(savedSnapshot.title);
    setText(savedSnapshot.text);
    setTags(savedSnapshot.tags);
    setSelectedNotebookId(savedSnapshot.notebookId);
    setFavorite(savedSnapshot.favorite);
  };

  return {
    title,
    setTitle,
    text,
    setText,
    tags,
    setTags,
    favorite,
    setFavorite,
    noteId,
    selectedNotebookId,
    setSelectedNotebookId,
    notebookValue,
    draft,
    dirty,
    isSavable,
    hasNote,
    words,
    savedAt,
    showEdited,
    persist,
    shouldSave,
    discard,
    hasExternalConflict,
    adoptedExternalAt,
    reloadExternal,
    keepLocalChanges,
  };
};
