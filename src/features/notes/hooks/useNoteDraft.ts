import { useEffect, useMemo, useRef, useState } from "react";
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

  useEffect(() => {
    dirtyChangeRef.current?.(dirty);
  }, [dirty]);

  const persist = (data: NoteDraft) => {
    const result = onSave(data);
    if (!hasNoteRef.current) {
      if (!result) return;
      setNoteId(result.id);
      setSelectedNotebookId(result.notebookId);
      setFavorite(result.favorite);
    }
    setSavedAt(Date.now());
    setSavedSnapshot(data);
  };

  const shouldSave = (data: NoteDraft) =>
    hasNoteRef.current ||
    Boolean(data.title.trim() || data.text.trim() || data.tags.length);

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
  };
};
