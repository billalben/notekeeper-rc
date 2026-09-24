import {
  NoteEditor,
  type NoteEditorProps,
} from "@/features/notes/components/NoteEditor";

export type NoteModalProps = Omit<NoteEditorProps, "variant">;

export const NoteModal = (props: NoteModalProps) => (
  <NoteEditor {...props} variant="modal" />
);
