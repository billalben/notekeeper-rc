import { useCallback, useEffect, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  STATUS,
  useJoyride,
  type EventData,
  type Options,
} from "react-joyride";
import { wasLaunchedWithIntent } from "@/app/launchIntent";
import { buildTourSteps } from "@/features/tour/lib/steps";
import type { AppearanceSettings } from "@/shared/stores/settings/types";
import { useNoteStore } from "@/shared/stores/useNoteStore";
import { useSettingsStore } from "@/shared/stores/useSettingsStore";
import { useThemeStore, type Theme } from "@/shared/stores/useThemeStore";
import { useUIStore } from "@/shared/stores/useUIStore";

interface TourProps {
  onOpenSidebar: () => void;
  onCloseSidebar: () => void;
  onOpenEditor: () => void;
  onCloseEditor: () => void;
}

interface TourPalette {
  primary: string;
  surface: string;
  onSurface: string;
  overlay: string;
}

const AUTO_START_DELAY_MS = 800;
/** Mirrors `--z-tour` in `src/styles/variables.css`. */
const Z_INDEX = 150;

const readPalette = (
  theme: Theme,
  appearance: AppearanceSettings,
): TourPalette => {
  const root = getComputedStyle(document.documentElement);
  const read = (name: string, fallback: string) =>
    root.getPropertyValue(name).trim() || fallback;
  const isDark = theme === "dark";
  const surface = read(
    "--surface-container-highest",
    isDark ? "#3a3330" : "#ede0db",
  );

  return {
    primary: read("--primary", isDark ? "#ffb690" : "#9d4300"),
    surface,
    onSurface: read("--on-surface", isDark ? "#d0c4bf" : "#201a18"),
    overlay: appearance.highContrast
      ? "rgba(0, 0, 0, 0.72)"
      : "rgba(0, 0, 0, 0.55)",
  };
};

/** Delay auto-start until the shell has painted and settled. */
export const Tour = ({
  onOpenSidebar,
  onCloseSidebar,
  onOpenEditor,
  onCloseEditor,
}: TourProps) => {
  const { t, i18n } = useTranslation();
  const theme = useThemeStore((state) => state.theme);
  const appearance = useSettingsStore((state) => state.appearance);
  const showSearch = useSettingsStore((state) => state.header.showSearch);
  const showTheme = useSettingsStore((state) => state.header.showTheme);
  const showShortcuts = useSettingsStore((state) => state.header.showShortcuts);
  const tourCompleted = useSettingsStore((state) => state.tourCompleted);
  const setTourCompleted = useSettingsStore((state) => state.setTourCompleted);

  const notebooks = useNoteStore((state) => state.notebooks);
  const tags = useNoteStore((state) => state.tags);

  const isTourOpen = useUIStore((state) => state.isTourOpen);
  const openTour = useUIStore((state) => state.openTour);
  const closeTour = useUIStore((state) => state.closeTour);

  const liveNotebooks = notebooks.filter(
    (notebook) => notebook.deletedAt === null,
  );
  const hasNotebooks = liveNotebooks.length > 0;
  const hasNotes = liveNotebooks.some((notebook) =>
    notebook.notes.some(
      (note) => note.deletedAt === null && note.archivedAt === null,
    ),
  );
  const hasTags = tags.length > 0;

  const palette = useMemo(
    () => readPalette(theme, appearance),
    [theme, appearance],
  );

  const finishTour = useCallback(() => {
    setTourCompleted(true);
    closeTour();
    onCloseSidebar();
    onCloseEditor();
  }, [setTourCompleted, closeTour, onCloseSidebar, onCloseEditor]);

  useEffect(() => {
    if (tourCompleted) return;
    // A share/shortcut launch already opened the editor; starting the tour
    // would close that draft. Defer it to the next normal launch.
    if (wasLaunchedWithIntent()) return;
    const timer = window.setTimeout(() => openTour(), AUTO_START_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [tourCompleted, openTour]);

  const steps = useMemo(
    () =>
      buildTourSteps({
        t,
        isRtl: i18n.dir() === "rtl",
        showSearch,
        showTheme,
        showShortcuts,
        hasNotebooks,
        hasNotes,
        hasTags,
        onOpenSidebar,
        onCloseSidebar,
        onOpenEditor,
        onCloseEditor,
      }),
    [
      t,
      i18n,
      showSearch,
      showTheme,
      showShortcuts,
      hasNotebooks,
      hasNotes,
      hasTags,
      onOpenSidebar,
      onCloseSidebar,
      onOpenEditor,
      onCloseEditor,
    ],
  );

  const options = useMemo<Partial<Options>>(
    () => ({
      primaryColor: palette.primary,
      backgroundColor: palette.surface,
      arrowColor: palette.surface,
      textColor: palette.onSurface,
      overlayColor: palette.overlay,
      zIndex: Z_INDEX,
      width: 360,
      skipBeacon: true,
      showProgress: true,
      buttons: ["back", "skip", "primary"],
      dismissKeyAction: false,
      overlayClickAction: false,
      blockTargetInteraction: true,
    }),
    [palette],
  );

  const styles = useMemo(
    () => ({
      tooltip: {
        fontFamily: "var(--font-primary)",
        borderRadius: "var(--radius-large)",
        boxShadow: "var(--shadow-3)",
      },
      tooltipContainer: { textAlign: "start" as const },
      tooltipFooter: { gap: "var(--spacing-1)" },
      buttonPrimary: {
        borderRadius: "var(--radius-full)",
        color: "var(--on-primary)",
        minHeight: 36,
        paddingInline: "var(--spacing-4)",
      },
      buttonBack: {
        borderRadius: "var(--radius-full)",
        minHeight: 36,
        paddingInline: "var(--spacing-3)",
      },
      buttonSkip: {
        borderRadius: "var(--radius-full)",
        minHeight: 36,
        paddingInline: "var(--spacing-3)",
      },
    }),
    [],
  );

  const locale = useMemo(
    () => ({
      back: t("tour.buttons.back"),
      close: t("tour.buttons.close"),
      next: t("tour.buttons.next"),
      nextWithProgress: t("tour.buttons.nextWithProgress"),
      last: t("tour.buttons.last"),
      skip: t("tour.buttons.skip"),
      open: t("tour.buttons.open"),
    }),
    [t],
  );

  const handleEvent = (data: EventData) => {
    if (data.status === STATUS.FINISHED || data.status === STATUS.SKIPPED) {
      finishTour();
    }
  };

  const { Tour: TourElement, controls } = useJoyride({
    run: isTourOpen,
    continuous: true,
    steps,
    options,
    styles,
    locale,
    onEvent: handleEvent,
  });

  const controlsRef = useRef(controls);
  useEffect(() => {
    controlsRef.current = controls;
  }, [controls]);

  // The library's `close` action advances rather than exits, so end the tour
  // with `skip()` (which also resets it) when Escape is pressed.
  useEffect(() => {
    if (!isTourOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") controlsRef.current.skip();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isTourOpen]);

  return TourElement;
};
