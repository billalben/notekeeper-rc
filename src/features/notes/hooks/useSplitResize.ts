import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
import {
  SPLIT_WIDTH_MAX,
  SPLIT_WIDTH_MIN,
  useSettingsStore,
} from "@/shared/stores/useSettingsStore";
import { DESKTOP_QUERY } from "@/shared/lib/constants";

const clampWidth = (value: number): number =>
  Math.min(SPLIT_WIDTH_MAX, Math.max(SPLIT_WIDTH_MIN, value));

const applySplitWidth = (width: number): void => {
  document.documentElement.style.setProperty("--split-width", `${width}px`);
};

/**
 * Drag-to-resize for the split-view editor pane (and its keyboard equivalent).
 * The pane sits on the inline-end edge, so the drag delta is inverted in LTR and
 * kept as-is in RTL. The live width is held locally while dragging, mirrored to
 * `--split-width`, and committed on release; `Escape` cancels the drag. The
 * separator is focusable and supports Arrow keys plus Home/End.
 */
export const useSplitResize = () => {
  const width = useSettingsStore((state) => state.editor.splitWidth);
  const setEditorSettings = useSettingsStore(
    (state) => state.setEditorSettings,
  );

  const [isResizing, setIsResizing] = useState(false);
  const [dragWidth, setDragWidth] = useState(width);
  const startRef = useRef({ pointerX: 0, width });
  const liveWidthRef = useRef(width);

  useEffect(() => {
    applySplitWidth(isResizing ? dragWidth : width);
  }, [isResizing, dragWidth, width]);

  useEffect(() => {
    if (!isResizing) return;

    document.body.classList.add("resizing");
    const isRtl = document.documentElement.dir === "rtl";

    const handleMove = (event: globalThis.PointerEvent) => {
      const delta = event.clientX - startRef.current.pointerX;
      const signed = isRtl ? delta : -delta;
      const next = clampWidth(startRef.current.width + signed);
      liveWidthRef.current = next;
      setDragWidth(next);
    };

    const finish = (commit: boolean) => {
      document.body.classList.remove("resizing");
      if (commit) {
        setEditorSettings({ splitWidth: liveWidthRef.current });
      } else {
        setDragWidth(startRef.current.width);
      }
      setIsResizing(false);
    };

    const handleUp = () => finish(true);
    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") finish(false);
    };

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.classList.remove("resizing");
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isResizing, setEditorSettings]);

  const startResize = (event: PointerEvent<HTMLDivElement>) => {
    if (!window.matchMedia(DESKTOP_QUERY).matches) return;
    event.preventDefault();
    startRef.current = { pointerX: event.clientX, width };
    liveWidthRef.current = width;
    setDragWidth(width);
    setIsResizing(true);
  };

  const setWidth = (next: number) =>
    setEditorSettings({ splitWidth: clampWidth(next) });

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const isRtl = document.documentElement.dir === "rtl";
    switch (event.key) {
      case "ArrowLeft":
        event.preventDefault();
        setWidth(width + (isRtl ? -16 : 16));
        break;
      case "ArrowRight":
        event.preventDefault();
        setWidth(width + (isRtl ? 16 : -16));
        break;
      case "Home":
        event.preventDefault();
        setWidth(SPLIT_WIDTH_MIN);
        break;
      case "End":
        event.preventDefault();
        setWidth(SPLIT_WIDTH_MAX);
        break;
      default:
        break;
    }
  };

  return { isResizing, startResize, onKeyDown };
};
