import { useEffect, useLayoutEffect, useRef } from "react";
import {
  toggleLinePrefix,
  wrapSelection,
  type EditResult,
} from "@/shared/lib/markdownFormat";
import type { FormatKind } from "../components/NoteToolbar";

interface UseMarkdownEditingInput {
  text: string;
  setText: (value: string) => void;
}

/**
 * Markdown formatting helpers for the editor textarea: applies toolbar edits,
 * keeps the selection after the controlled value re-renders, and wires the
 * `mod+b` / `mod+i` keyboard shortcuts.
 */
export const useMarkdownEditing = ({
  text,
  setText,
}: UseMarkdownEditingInput) => {
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const pendingSelectionRef = useRef<{ start: number; end: number } | null>(
    null,
  );

  useLayoutEffect(() => {
    const pending = pendingSelectionRef.current;
    if (!pending || !bodyRef.current) return;
    bodyRef.current.focus();
    bodyRef.current.setSelectionRange(pending.start, pending.end);
    pendingSelectionRef.current = null;
  }, [text]);

  const applyEdit = (result: EditResult) => {
    pendingSelectionRef.current = {
      start: result.selectionStart,
      end: result.selectionEnd,
    };
    setText(result.value);
  };

  const handleFormat = (kind: FormatKind) => {
    const element = bodyRef.current;
    if (!element) return;

    const { selectionStart, selectionEnd, value } = element;
    let result: EditResult;

    switch (kind) {
      case "h":
        result = toggleLinePrefix(value, selectionStart, selectionEnd, "## ");
        break;
      case "ul":
        result = toggleLinePrefix(value, selectionStart, selectionEnd, "- ");
        break;
      case "task":
        result = toggleLinePrefix(
          value,
          selectionStart,
          selectionEnd,
          "- [ ] ",
        );
        break;
      case "b":
        result = wrapSelection(
          value,
          selectionStart,
          selectionEnd,
          "**",
          "**",
          "bold",
        );
        break;
      case "i":
        result = wrapSelection(
          value,
          selectionStart,
          selectionEnd,
          "*",
          "*",
          "italic",
        );
        break;
      case "code":
        result = wrapSelection(
          value,
          selectionStart,
          selectionEnd,
          "`",
          "`",
          "code",
        );
        break;
    }

    applyEdit(result);
  };

  const formatRef = useRef(handleFormat);
  useEffect(() => {
    formatRef.current = handleFormat;
  });

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const mod = event.ctrlKey || event.metaKey;
      if (!mod || event.target !== bodyRef.current) return;

      const key = event.key.toLowerCase();
      if (key === "b" || key === "i") {
        event.preventDefault();
        formatRef.current(key === "b" ? "b" : "i");
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return { bodyRef, handleFormat };
};
