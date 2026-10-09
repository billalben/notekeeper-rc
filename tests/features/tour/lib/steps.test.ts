import { describe, expect, it, vi } from "vitest";
import type { TFunction } from "i18next";
import { buildTourSteps } from "@/features/tour/lib/steps";

const t = ((key: string) => key) as unknown as TFunction;

type Overrides = Partial<Parameters<typeof buildTourSteps>[0]>;

const context = (overrides: Overrides = {}) => ({
  t,
  isRtl: false,
  showSearch: true,
  showTheme: true,
  showShortcuts: true,
  hasNotebooks: true,
  hasNotes: true,
  hasTags: true,
  onOpenSidebar: vi.fn(),
  onCloseSidebar: vi.fn(),
  onOpenEditor: vi.fn(),
  onCloseEditor: vi.fn(),
  ...overrides,
});

const build = (overrides: Overrides = {}) => buildTourSteps(context(overrides));

const ids = (overrides: Overrides = {}) =>
  build(overrides).map((step) => step.id);

const runBefore = async (
  step: ReturnType<typeof build>[number],
): Promise<void> => {
  const promise = step.before?.({} as never);
  await vi.advanceTimersByTimeAsync(600);
  await promise;
};

describe("buildTourSteps", () => {
  it("orders the full tour from welcome to finish", () => {
    expect(ids()).toEqual([
      "welcome",
      "smartViews",
      "notebooks",
      "more",
      "newNote",
      "noteList",
      "tags",
      "editorTitle",
      "editorToolbar",
      "editorFooter",
      "search",
      "theme",
      "shortcuts",
      "settings",
      "finish",
    ]);
  });

  it("omits steps whose data or header control is unavailable", () => {
    expect(
      ids({
        showSearch: false,
        showTheme: false,
        showShortcuts: false,
        hasNotes: false,
        hasTags: false,
        hasNotebooks: false,
      }),
    ).toEqual([
      "welcome",
      "smartViews",
      "notebooks",
      "more",
      "newNote",
      "settings",
      "finish",
    ]);
  });

  it("keeps the welcome step first and finish last even when empty", () => {
    const stepIds = ids({
      showSearch: false,
      showTheme: false,
      showShortcuts: false,
      hasNotes: false,
      hasTags: false,
      hasNotebooks: false,
    });
    expect(stepIds[0]).toBe("welcome");
    expect(stepIds[stepIds.length - 1]).toBe("finish");
  });

  it("places the sidebar steps on the correct side for RTL", () => {
    const ltr = build().find((step) => step.id === "smartViews");
    const rtl = build({ isRtl: true }).find((step) => step.id === "smartViews");
    expect(ltr?.placement).toBe("right");
    expect(rtl?.placement).toBe("left");
  });

  it("opens the sidebar before its steps and closes it for base steps", async () => {
    vi.useFakeTimers();
    const onOpenSidebar = vi.fn();
    const onCloseSidebar = vi.fn();
    const steps = build({ onOpenSidebar, onCloseSidebar });

    await runBefore(steps.find((step) => step.id === "smartViews")!);
    expect(onOpenSidebar).toHaveBeenCalledTimes(1);

    await runBefore(steps.find((step) => step.id === "newNote")!);
    expect(onCloseSidebar).toHaveBeenCalledTimes(1);

    vi.useRealTimers();
  });

  it("opens the editor before its steps and closes it for header steps", async () => {
    vi.useFakeTimers();
    const onOpenEditor = vi.fn();
    const onCloseEditor = vi.fn();
    const steps = build({ onOpenEditor, onCloseEditor });

    await runBefore(steps.find((step) => step.id === "editorTitle")!);
    expect(onOpenEditor).toHaveBeenCalledTimes(1);

    await runBefore(steps.find((step) => step.id === "search")!);
    expect(onCloseEditor).toHaveBeenCalledTimes(1);

    vi.useRealTimers();
  });
});
