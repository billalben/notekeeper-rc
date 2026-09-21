import { NoteEditor, type NoteEditorProps } from "./NoteEditor";

export type { NoteSaveInput } from "./NoteEditor";

export type NoteModalProps = Omit<NoteEditorProps, "variant">;

export const NoteModal = (props: NoteModalProps) => (
  <NoteEditor {...props} variant="modal" />
);
