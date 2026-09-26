import { describe, expect, it } from "vitest";
import { DEFAULT_LANGUAGE } from "@/app/i18n";
import { normalizeShortcuts } from "@/shared/lib/shortcuts";
import {
  DEFAULT_APPEARANCE_SETTINGS,
  DEFAULT_EDITOR_SETTINGS,
  DEFAULT_EXPORT_SETTINGS,
  DEFAULT_HEADER_SETTINGS,
  DEFAULT_MOTION,
  DEFAULT_SIDEBAR_SETTINGS,
  DEFAULT_TOAST_SETTINGS,
  DEFAULT_TRASH_SETTINGS,
  SIDEBAR_WIDTH_MAX,
  SIDEBAR_WIDTH_MIN,
  SPLIT_WIDTH_MAX,
  SPLIT_WIDTH_MIN,
  TOAST_DURATION_MAX,
  TOAST_DURATION_MIN,
  TOAST_MAX_VISIBLE_MAX,
  TOAST_MAX_VISIBLE_MIN,
} from "@/shared/stores/settings/defaults";
import {
  normalizeAppearance,
  normalizeEditorSettings,
  normalizeExportSettings,
  normalizeHeaderSettings,
  normalizeLanguage,
  normalizeMotion,
  normalizePersistedSettings,
  normalizeSidebarSettings,
  normalizeToastSettings,
  normalizeTrashSettings,
} from "@/shared/stores/settings/normalizers";

describe("normalizeToastSettings", () => {
  it("falls back to defaults", () => {
    expect(normalizeToastSettings(undefined)).toEqual(DEFAULT_TOAST_SETTINGS);
  });

  it("clamps duration and maxVisible into range", () => {
    expect(normalizeToastSettings({ duration: 10 }).duration).toBe(
      TOAST_DURATION_MIN,
    );
    expect(normalizeToastSettings({ duration: 10_000 }).duration).toBe(
      TOAST_DURATION_MAX,
    );
    expect(normalizeToastSettings({ maxVisible: 0 }).maxVisible).toBe(
      TOAST_MAX_VISIBLE_MIN,
    );
    expect(normalizeToastSettings({ maxVisible: 99 }).maxVisible).toBe(
      TOAST_MAX_VISIBLE_MAX,
    );
  });
});

describe("normalizeEditorSettings", () => {
  it("keeps valid enum values and defaults invalid ones", () => {
    expect(normalizeEditorSettings({ defaultMode: "edit" }).defaultMode).toBe(
      "edit",
    );
    expect(
      normalizeEditorSettings({ defaultMode: "bogus" as never }).defaultMode,
    ).toBe(DEFAULT_EDITOR_SETTINGS.defaultMode);
    expect(
      normalizeEditorSettings({ presentation: "split" }).presentation,
    ).toBe("split");
    expect(
      normalizeEditorSettings({ presentation: "wide" as never }).presentation,
    ).toBe(DEFAULT_EDITOR_SETTINGS.presentation);
  });

  it("clamps the split width", () => {
    expect(normalizeEditorSettings({ splitWidth: 1 }).splitWidth).toBe(
      SPLIT_WIDTH_MIN,
    );
    expect(normalizeEditorSettings({ splitWidth: 10_000 }).splitWidth).toBe(
      SPLIT_WIDTH_MAX,
    );
    expect(normalizeEditorSettings(undefined)).toEqual(DEFAULT_EDITOR_SETTINGS);
  });
});

describe("normalizeTrashSettings", () => {
  it("accepts known retention options, including forever", () => {
    expect(normalizeTrashSettings({ retentionDays: 7 }).retentionDays).toBe(7);
    expect(
      normalizeTrashSettings({ retentionDays: null }).retentionDays,
    ).toBeNull();
  });

  it("defaults an unknown retention value", () => {
    expect(normalizeTrashSettings({ retentionDays: 15 }).retentionDays).toBe(
      DEFAULT_TRASH_SETTINGS.retentionDays,
    );
  });
});

describe("normalizeExportSettings", () => {
  it("keeps a valid format and defaults an invalid one", () => {
    expect(normalizeExportSettings({ defaultFormat: "md" }).defaultFormat).toBe(
      "md",
    );
    expect(
      normalizeExportSettings({ defaultFormat: "pdf" as never }).defaultFormat,
    ).toBe(DEFAULT_EXPORT_SETTINGS.defaultFormat);
  });
});

describe("normalizeHeaderSettings", () => {
  it("defaults missing flags but keeps explicit ones", () => {
    expect(normalizeHeaderSettings(undefined)).toEqual(DEFAULT_HEADER_SETTINGS);
    expect(normalizeHeaderSettings({ showSearch: false }).showSearch).toBe(
      false,
    );
  });
});

describe("normalizeAppearance", () => {
  it("defaults invalid enum values and coerces highContrast", () => {
    expect(normalizeAppearance({ accent: "pink" as never }).accent).toBe(
      DEFAULT_APPEARANCE_SETTINGS.accent,
    );
    expect(normalizeAppearance({ accent: "violet" }).accent).toBe("violet");
    expect(normalizeAppearance({ highContrast: 1 as never }).highContrast).toBe(
      DEFAULT_APPEARANCE_SETTINGS.highContrast,
    );
    expect(normalizeAppearance({ highContrast: true }).highContrast).toBe(true);
  });
});

describe("normalizeSidebarSettings", () => {
  it("clamps width and defaults booleans", () => {
    expect(normalizeSidebarSettings({ width: 1 }).width).toBe(
      SIDEBAR_WIDTH_MIN,
    );
    expect(normalizeSidebarSettings({ width: 9999 }).width).toBe(
      SIDEBAR_WIDTH_MAX,
    );
    expect(normalizeSidebarSettings(undefined)).toEqual(
      DEFAULT_SIDEBAR_SETTINGS,
    );
  });
});

describe("normalizeMotion / normalizeLanguage", () => {
  it("keeps known values and defaults the rest", () => {
    expect(normalizeMotion("reduce")).toBe("reduce");
    expect(normalizeMotion("fast")).toBe(DEFAULT_MOTION);
    expect(normalizeLanguage("fr")).toBe("fr");
    expect(normalizeLanguage("de")).toBe(DEFAULT_LANGUAGE);
  });
});

describe("normalizePersistedSettings", () => {
  it("returns a complete, defaulted settings object for empty input", () => {
    expect(normalizePersistedSettings(undefined)).toEqual({
      toasts: DEFAULT_TOAST_SETTINGS,
      editor: DEFAULT_EDITOR_SETTINGS,
      trash: DEFAULT_TRASH_SETTINGS,
      sidebar: DEFAULT_SIDEBAR_SETTINGS,
      header: DEFAULT_HEADER_SETTINGS,
      motion: DEFAULT_MOTION,
      language: DEFAULT_LANGUAGE,
      appearance: DEFAULT_APPEARANCE_SETTINGS,
      export: DEFAULT_EXPORT_SETTINGS,
      shortcuts: normalizeShortcuts(undefined),
    });
  });

  it("merges partial, legacy input over the defaults", () => {
    const result = normalizePersistedSettings({
      toasts: { duration: 2000 },
      appearance: { accent: "teal" },
      motion: "nonsense",
    });
    expect(result.toasts.duration).toBe(2000);
    expect(result.toasts.enabled).toBe(DEFAULT_TOAST_SETTINGS.enabled);
    expect(result.appearance.accent).toBe("teal");
    expect(result.motion).toBe(DEFAULT_MOTION);
  });
});
