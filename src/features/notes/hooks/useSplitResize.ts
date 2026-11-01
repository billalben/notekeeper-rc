import { useCallback } from "react";
import { useDragResize } from "@/shared/hooks/useDragResize";
import { DESKTOP_QUERY } from "@/shared/lib/constants";
import {
  SPLIT_WIDTH_MAX,
  SPLIT_WIDTH_MIN,
  useSettingsStore,
} from "@/shared/stores/useSettingsStore";

const applySplitWidth = (width: number): void => {
  document.documentElement.style.setProperty("--split-width", `${width}px`);
};

const isDesktop = (): boolean => window.matchMedia(DESKTOP_QUERY).matches;

/**
 * Drag-to-resize for the split-view editor pane. The pane sits on the inline-end
 * edge, so the shared hook inverts the pointer direction; the separator also
 * supports Arrow keys plus Home/End.
 */
export const useSplitResize = () => {
  const width = useSettingsStore((state) => state.editor.splitWidth);
  const setEditorSettings = useSettingsStore(
    (state) => state.setEditorSettings,
  );

  const handleCommit = useCallback(
    (next: number) => setEditorSettings({ splitWidth: next }),
    [setEditorSettings],
  );

  return useDragResize({
    value: width,
    min: SPLIT_WIDTH_MIN,
    max: SPLIT_WIDTH_MAX,
    edge: "end",
    apply: applySplitWidth,
    onCommit: handleCommit,
    enabled: isDesktop,
  });
};
