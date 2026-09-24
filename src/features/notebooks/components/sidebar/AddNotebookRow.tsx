import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { MAX_NOTEBOOK_NAME_LENGTH } from "@/shared/lib/constants";
import { useNoteStore } from "@/shared/stores/useNoteStore";
import { toast } from "@/shared/stores/useToastStore";
import { useUIStore } from "@/shared/stores/useUIStore";

/** Inline "new notebook" row shown while a notebook is being added. */
export const AddNotebookRow = () => {
  const { t } = useTranslation();
  const addNotebook = useNoteStore((state) => state.addNotebook);
  const stopAddingNotebook = useUIStore((state) => state.stopAddingNotebook);

  const [newName, setNewName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const hasCommittedRef = useRef(false);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const commitAdd = () => {
    if (hasCommittedRef.current) return;
    hasCommittedRef.current = true;

    const name = newName.trim();
    stopAddingNotebook();
    if (name) {
      addNotebook(name);
      toast.success(t("toasts.notebookCreated"));
    }
  };

  const cancelAdd = () => {
    hasCommittedRef.current = true;
    stopAddingNotebook();
  };

  return (
    <div className="nav-item is-selected">
      <div className="nav-item-main">
        <span
          className="material-symbols-rounded nav-item-icon"
          aria-hidden="true"
        >
          folder
        </span>
        <span className="nav-item-label">
          <input
            ref={inputRef}
            className="text text-label-large"
            value={newName}
            maxLength={MAX_NOTEBOOK_NAME_LENGTH}
            placeholder={t("sidebar.untitled")}
            onChange={(event) => setNewName(event.target.value)}
            onBlur={commitAdd}
            onKeyDown={(event) => {
              if (event.key === "Enter") commitAdd();
              if (event.key === "Escape") cancelAdd();
            }}
          />
        </span>
        <div className="state-layer" />
      </div>
    </div>
  );
};
