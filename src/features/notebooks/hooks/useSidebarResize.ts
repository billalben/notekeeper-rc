import { useCallback } from "react";
import { useDragResize } from "@/shared/hooks/useDragResize";
import { DESKTOP_QUERY } from "@/shared/lib/constants";
import {
  SIDEBAR_WIDTH_MAX,
  SIDEBAR_WIDTH_MIN,
  useSettingsStore,
} from "@/shared/stores/useSettingsStore";

const applySidebarWidth = (width: number): void => {
  document.documentElement.style.setProperty("--sidebar-current", `${width}px`);
};

const isDesktop = (): boolean => window.matchMedia(DESKTOP_QUERY).matches;

/**
 * Drag-to-resize for the desktop sidebar. The shared `useDragResize` hook owns
 * the pointer, Escape and keyboard handling; this adapter binds it to the
 * sidebar width setting and the `--sidebar-current` custom property.
 */
export const useSidebarResize = () => {
  const width = useSettingsStore((state) => state.sidebar.width);
  const setSidebarSettings = useSettingsStore(
    (state) => state.setSidebarSettings,
  );

  const handleCommit = useCallback(
    (next: number) => setSidebarSettings({ width: next }),
    [setSidebarSettings],
  );

  return useDragResize({
    value: width,
    min: SIDEBAR_WIDTH_MIN,
    max: SIDEBAR_WIDTH_MAX,
    apply: applySidebarWidth,
    onCommit: handleCommit,
    enabled: isDesktop,
  });
};
