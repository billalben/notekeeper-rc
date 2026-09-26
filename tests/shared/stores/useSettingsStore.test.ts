import { beforeEach, describe, expect, it } from "vitest";
import { DEFAULT_LANGUAGE } from "@/app/i18n";
import { DEFAULT_SHORTCUTS } from "@/shared/lib/shortcuts";
import {
  DEFAULT_APPEARANCE_SETTINGS,
  DEFAULT_EDITOR_SETTINGS,
  DEFAULT_EXPORT_SETTINGS,
  DEFAULT_TOAST_SETTINGS,
  DEFAULT_TRASH_SETTINGS,
  SIDEBAR_WIDTH_MAX,
  SPLIT_WIDTH_MIN,
} from "@/shared/stores/settings/defaults";
import { useSettingsStore } from "@/shared/stores/useSettingsStore";

const get = () => useSettingsStore.getState();
const initialState = useSettingsStore.getState();

beforeEach(() => {
  useSettingsStore.setState(initialState, true);
});

describe("simple setters", () => {
  it("normalizes motion and language, defaulting unknown values", () => {
    get().setMotion("reduce");
    expect(get().motion).toBe("reduce");
    get().setMotion("fast" as never);
    expect(get().motion).toBe("system");

    get().setLanguage("fr");
    expect(get().language).toBe("fr");
    get().setLanguage("de" as never);
    expect(get().language).toBe(DEFAULT_LANGUAGE);
  });
});

describe("appearance", () => {
  it("merges partial updates and normalizes invalid values", () => {
    get().setAppearanceSettings({ accent: "teal", highContrast: true });
    expect(get().appearance).toMatchObject({
      accent: "teal",
      highContrast: true,
    });

    get().setAppearanceSettings({ accent: "pink" as never });
    expect(get().appearance.accent).toBe(DEFAULT_APPEARANCE_SETTINGS.accent);
    expect(get().appearance.highContrast).toBe(true);
  });

  it("resets to defaults", () => {
    get().setAppearanceSettings({ accent: "blue" });
    get().resetAppearanceSettings();
    expect(get().appearance).toEqual(DEFAULT_APPEARANCE_SETTINGS);
  });
});

describe("toasts / editor / sidebar", () => {
  it("clamps numeric ranges on update and resets", () => {
    get().setToastSettings({ duration: 10, maxVisible: 99 });
    expect(get().toasts.duration).toBe(1000);
    expect(get().toasts.maxVisible).toBe(5);
    get().resetToastSettings();
    expect(get().toasts).toEqual(DEFAULT_TOAST_SETTINGS);

    get().setEditorSettings({ splitWidth: 1 });
    expect(get().editor.splitWidth).toBe(SPLIT_WIDTH_MIN);
    get().resetEditorSettings();
    expect(get().editor).toEqual(DEFAULT_EDITOR_SETTINGS);

    get().setSidebarSettings({ width: 9999 });
    expect(get().sidebar.width).toBe(SIDEBAR_WIDTH_MAX);
  });
});

describe("trash / export / header", () => {
  it("normalizes updates", () => {
    get().setTrashSettings({ retentionDays: 7 });
    expect(get().trash.retentionDays).toBe(7);
    get().setTrashSettings({ retentionDays: 15 });
    expect(get().trash.retentionDays).toBe(
      DEFAULT_TRASH_SETTINGS.retentionDays,
    );

    get().setExportSettings({ defaultFormat: "md" });
    expect(get().export).toEqual({ defaultFormat: "md" });
    get().setExportSettings({ defaultFormat: "pdf" as never });
    expect(get().export).toEqual(DEFAULT_EXPORT_SETTINGS);

    get().setHeaderSettings({ showTheme: false });
    expect(get().header.showTheme).toBe(false);
  });
});

describe("shortcuts", () => {
  it("stores a normalized custom chord", () => {
    get().setShortcut("newNote", "mod+alt+x");
    expect(get().shortcuts.newNote).toBe("alt+mod+x");
  });

  it("falls back to the default for an invalid chord", () => {
    get().setShortcut("newNote", "shift");
    expect(get().shortcuts.newNote).toBe(DEFAULT_SHORTCUTS.newNote);
  });

  it("resets one or all shortcuts", () => {
    get().setShortcut("newNote", "mod+alt+x");
    get().resetShortcut("newNote");
    expect(get().shortcuts.newNote).toBe(DEFAULT_SHORTCUTS.newNote);

    get().setShortcut("saveNote", "mod+alt+y");
    get().resetAllShortcuts();
    expect(get().shortcuts).toEqual(DEFAULT_SHORTCUTS);
  });
});
