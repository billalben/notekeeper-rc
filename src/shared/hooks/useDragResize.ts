import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
import { clamp } from "@/shared/lib/math";

/** Which edge of the resizable region the handle sits on. */
type ResizeEdge = "start" | "end";

export interface UseDragResizeOptions {
  /** Current persisted size in pixels. */
  value: number;
  min: number;
  max: number;
  /** Mirrors the live size while dragging (e.g. a CSS custom property). */
  apply: (width: number) => void;
  /** Persists the final size on pointer release or key press. */
  onCommit: (width: number) => void;
  /** Defaults to `"start"`. `"end"` inverts the pointer direction. */
  edge?: ResizeEdge;
  /** Pixels moved per arrow-key press. Defaults to `16`. */
  step?: number;
  /** Return `false` to ignore drags and keys (e.g. below a breakpoint). */
  enabled?: () => boolean;
}

/**
 * Shared drag-to-resize behaviour for the sidebar and split-view pane. The live
 * size is written through `apply` while dragging (no re-render per pointer
 * move) and committed on release. `Escape` cancels the drag and restores the
 * previous size. The separator is keyboard-resizable with Arrow keys plus
 * Home/End. Pointer and arrow directions are mirrored in RTL.
 */
export const useDragResize = ({
  value,
  min,
  max,
  apply,
  onCommit,
  edge = "start",
  step = 16,
  enabled,
}: UseDragResizeOptions) => {
  const [isResizing, setIsResizing] = useState(false);
  const startRef = useRef({ pointerX: 0, width: value });
  const liveWidthRef = useRef(value);
  const applyRef = useRef(apply);
  const commitRef = useRef(onCommit);
  const boundsRef = useRef({ min, max, step });
  const enabledRef = useRef(enabled);

  useEffect(() => {
    applyRef.current = apply;
    commitRef.current = onCommit;
    boundsRef.current = { min, max, step };
    enabledRef.current = enabled;
  }, [apply, onCommit, min, max, step, enabled]);

  useEffect(() => {
    if (!isResizing) applyRef.current(value);
  }, [isResizing, value]);

  useEffect(() => {
    if (!isResizing) return;

    document.body.classList.add("resizing");

    const handleMove = (event: globalThis.PointerEvent) => {
      const isRtl = document.documentElement.dir === "rtl";
      const direction = (edge === "start" ? 1 : -1) * (isRtl ? -1 : 1);
      const delta = (event.clientX - startRef.current.pointerX) * direction;
      const { min, max } = boundsRef.current;
      const next = clamp(startRef.current.width + delta, min, max);

      liveWidthRef.current = next;
      applyRef.current(next);
    };

    const finish = (commit: boolean) => {
      document.body.classList.remove("resizing");
      if (commit) {
        commitRef.current(liveWidthRef.current);
      } else {
        applyRef.current(startRef.current.width);
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
  }, [isResizing, edge]);

  const startResize = (event: PointerEvent<HTMLDivElement>) => {
    if (enabledRef.current && !enabledRef.current()) return;
    event.preventDefault();
    startRef.current = { pointerX: event.clientX, width: value };
    liveWidthRef.current = value;
    applyRef.current(value);
    setIsResizing(true);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (enabledRef.current && !enabledRef.current()) return;

    const isRtl = document.documentElement.dir === "rtl";
    const direction = (edge === "start" ? 1 : -1) * (isRtl ? -1 : 1);
    const { min, max, step } = boundsRef.current;

    let next: number;
    switch (event.key) {
      case "ArrowLeft":
        next = value - direction * step;
        break;
      case "ArrowRight":
        next = value + direction * step;
        break;
      case "Home":
        next = min;
        break;
      case "End":
        next = max;
        break;
      default:
        return;
    }

    event.preventDefault();
    commitRef.current(clamp(next, min, max));
  };

  return { isResizing, startResize, onKeyDown };
};
