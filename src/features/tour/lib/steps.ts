import type { TFunction } from "i18next";
import type { Step } from "react-joyride";

export interface TourContext {
  t: TFunction;
  isRtl: boolean;
  showSearch: boolean;
  showTheme: boolean;
  showShortcuts: boolean;
  hasNotebooks: boolean;
  hasNotes: boolean;
  hasTags: boolean;
  onOpenSidebar: () => void;
  onCloseSidebar: () => void;
  onOpenEditor: () => void;
  onCloseEditor: () => void;
}

type Setup = () => Promise<void>;

/** Matches the sidebar's CSS transform transition so the target is in view. */
const SIDEBAR_TRANSITION_MS = 320;
/** Lets the note editor mount and settle before spotlighting it. */
const EDITOR_OPEN_MS = 420;

const wait = (ms: number) =>
  new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });

/** Close transient panels so a step points at the base shell. */
const showBase =
  (context: TourContext): Setup =>
  async () => {
    context.onCloseSidebar();
    context.onCloseEditor();
    await wait(SIDEBAR_TRANSITION_MS);
  };

/** Reveal the sidebar (off-canvas on narrow screens) for a step. */
const showSidebar =
  (context: TourContext): Setup =>
  async () => {
    context.onOpenSidebar();
    context.onCloseEditor();
    await wait(SIDEBAR_TRANSITION_MS);
  };

/** Open a blank note editor so its parts can be spotlighted. */
const showEditor =
  (context: TourContext): Setup =>
  async () => {
    context.onCloseSidebar();
    context.onOpenEditor();
    await wait(EDITOR_OPEN_MS);
  };

/**
 * Build the onboarding steps in order. Steps whose target needs data that
 * doesn't exist yet (notes, tags, notebooks) or a header control that is
 * hidden in settings are omitted, so the tour never points at nothing.
 */
export const buildTourSteps = (context: TourContext): Step[] => {
  const { t, isRtl } = context;
  const sidebarPlacement = isRtl ? "left" : "right";
  const base = showBase(context);
  const sidebar = showSidebar(context);
  const editor = showEditor(context);

  const steps: Step[] = [
    {
      id: "welcome",
      target: "body",
      placement: "center",
      title: t("tour.steps.welcome.title"),
      content: t("tour.steps.welcome.body"),
      before: base,
    },
    {
      id: "smartViews",
      target: ".sidebar-quick",
      placement: sidebarPlacement,
      title: t("tour.steps.smartViews.title"),
      content: t("tour.steps.smartViews.body"),
      before: sidebar,
    },
    {
      id: "notebooks",
      target: ".sidebar-notebooks",
      placement: sidebarPlacement,
      title: t("tour.steps.notebooks.title"),
      content: t("tour.steps.notebooks.body"),
      before: sidebar,
    },
    {
      id: "more",
      target: ".sidebar-more",
      placement: sidebarPlacement,
      title: t("tour.steps.more.title"),
      content: t("tour.steps.more.body"),
      before: sidebar,
    },
    {
      id: "newNote",
      target: "[data-tour='new-note']",
      placement: "top",
      title: t("tour.steps.newNote.title"),
      content: t("tour.steps.newNote.body"),
      before: base,
    },
  ];

  if (context.hasNotes) {
    steps.push({
      id: "noteList",
      target: "[data-note-panel]",
      placement: sidebarPlacement,
      title: t("tour.steps.noteList.title"),
      content: t("tour.steps.noteList.body"),
      before: base,
    });
  }

  if (context.hasTags) {
    steps.push({
      id: "tags",
      target: ".tag-filter-bar",
      placement: "bottom",
      title: t("tour.steps.tags.title"),
      content: t("tour.steps.tags.body"),
      before: base,
    });
  }

  if (context.hasNotebooks) {
    steps.push(
      {
        id: "editorTitle",
        target: ".note-head",
        placement: "bottom",
        title: t("tour.steps.editorTitle.title"),
        content: t("tour.steps.editorTitle.body"),
        before: editor,
      },
      {
        id: "editorToolbar",
        target: ".note-toolbar",
        placement: "bottom",
        title: t("tour.steps.editorToolbar.title"),
        content: t("tour.steps.editorToolbar.body"),
        before: editor,
      },
      {
        id: "editorFooter",
        target: ".note-foot",
        placement: "top",
        title: t("tour.steps.editorFooter.title"),
        content: t("tour.steps.editorFooter.body"),
        before: editor,
      },
    );
  }

  if (context.showSearch) {
    steps.push({
      id: "search",
      target: "[data-tour='search']",
      placement: "bottom",
      title: t("tour.steps.search.title"),
      content: t("tour.steps.search.body"),
      before: base,
    });
  }

  if (context.showTheme) {
    steps.push({
      id: "theme",
      target: "[data-tour='theme']",
      placement: "bottom",
      title: t("tour.steps.theme.title"),
      content: t("tour.steps.theme.body"),
      before: base,
    });
  }

  if (context.showShortcuts) {
    steps.push({
      id: "shortcuts",
      target: "[data-tour='shortcuts']",
      placement: "bottom",
      title: t("tour.steps.shortcuts.title"),
      content: t("tour.steps.shortcuts.body"),
      before: base,
    });
  }

  steps.push(
    {
      id: "settings",
      target: "[data-tour='settings']",
      placement: "bottom",
      title: t("tour.steps.settings.title"),
      content: t("tour.steps.settings.body"),
      before: base,
    },
    {
      id: "finish",
      target: "body",
      placement: "center",
      title: t("tour.steps.finish.title"),
      content: t("tour.steps.finish.body"),
      before: base,
    },
  );

  return steps;
};
