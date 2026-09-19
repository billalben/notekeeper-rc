import { useEffect, useRef, useState, type PointerEvent } from "react";
import {
  SIDEBAR_WIDTH_MAX,
  SIDEBAR_WIDTH_MIN,
  useSettingsStore,
} from "../store/useSettingsStore";

export const SIDEBAR_COLLAPSED_WIDTH = 84;

const clampWidth = (value: number): number =>
  Math.min(SIDEBAR_WIDTH_MAX, Math.max(SIDEBAR_WIDTH_MIN, value));

export const applySidebarWidth = (
  collapsed: boolean,
  width: number,
): void => {
  document.documentElement.style.setProperty(
    "--sidebar-current",
    collapsed ? `${SIDEBAR_COLLAPSED_WIDTH}px` : `${width}px`,
  );
};

/**
 * Drag-to-resize for the desktop sidebar. The live width is kept locally while
 * dragging (so the store isn't written on every pointermove), written to the
 * `--sidebar-current` custom property, and committed on release. `Escape`
 * cancels the drag and restores the previous width.
 */
export const useSidebarResize = (collapsed: boolean) => {
  const width = useSettingsStore((state) => state.sidebar.width);
  const setSidebarSettings = useSettingsStore(
    (state) => state.setSidebarSettings,
  );

  const [isResizing, setIsResizing] = useState(false);
  const [dragWidth, setDragWidth] = useState(width);
  const startRef = useRef({ pointerX: 0, width });

  useEffect(() => {
    applySidebarWidth(collapsed, isResizing ? dragWidth : width);
  }, [collapsed, isResizing, dragWidth, width]);

  useEffect(() => {
    if (!isResizing) return;

    document.body.classList.add("resizing");

    const handleMove = (event: globalThis.PointerEvent) => {
      const delta = event.clientX - startRef.current.pointerX;
      setDragWidth(clampWidth(startRef.current.width + delta));
    };

    const finish = (commit: boolean) => {
      document.body.classList.remove("resizing");
      if (commit) {
        setDragWidth((current) => {
          setSidebarSettings({ width: current });
          return current;
        });
      } else {
        setDragWidth(startRef.current.width);
      }
      setIsResizing(false);
    };

    const handleUp = () => finish(true);
    const handleKeyDown = (event: KeyboardEvent) => {
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
  }, [isResizing, setSidebarSettings]);

  const startResize = (event: PointerEvent<HTMLDivElement>) => {
    if (!window.matchMedia("(min-width: 992px)").matches) return;
    event.preventDefault();
    startRef.current = { pointerX: event.clientX, width };
    setDragWidth(width);
    setIsResizing(true);
  };

  return { isResizing, startResize };
};

