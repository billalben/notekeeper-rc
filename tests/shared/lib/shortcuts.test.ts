import { describe, expect, it, vi } from "vitest";
import {
  DEFAULT_SHORTCUTS,
  SHORTCUT_ACTIONS,
  findConflict,
  formatChord,
  fromRecordedKeys,
  isValidChord,
  normalizeChord,
  normalizeShortcuts,
} from "@/shared/lib/shortcuts";

describe("normalizeChord", () => {
  it("lowercases and canonicalizes modifier order", () => {
    expect(normalizeChord("Shift+Ctrl+S")).toBe("ctrl+shift+s");
    expect(normalizeChord("mod+alt+n")).toBe("alt+mod+n");
  });

  it("expands common aliases", () => {
    expect(normalizeChord("Cmd+S")).toBe("mod+s");
    expect(normalizeChord("Return")).toBe("enter");
    expect(normalizeChord("Del")).toBe("delete");
  });

  it("rejects chords without a usable key", () => {
    expect(normalizeChord(undefined)).toBe("");
    expect(normalizeChord(null)).toBe("");
    expect(normalizeChord("")).toBe("");
    expect(normalizeChord("mod")).toBe("");
    expect(normalizeChord("ctrl")).toBe("");
  });
});

describe("isValidChord", () => {
  it("requires a modifier or the escape key", () => {
    expect(isValidChord("mod+s")).toBe(true);
    expect(isValidChord("escape")).toBe(true);
    expect(isValidChord("s")).toBe(false);
    expect(isValidChord("shift")).toBe(false);
    expect(isValidChord("mod+unidentified")).toBe(false);
  });
});

describe("fromRecordedKeys", () => {
  it("builds a canonical chord from recorded keys", () => {
    expect(fromRecordedKeys(["Shift", "S"])).toBe("shift+s");
    expect(fromRecordedKeys(["Escape"])).toBe("escape");
  });

  it("returns null when only modifiers were recorded", () => {
    expect(fromRecordedKeys(["Shift"])).toBeNull();
    expect(fromRecordedKeys([])).toBeNull();
  });

  it("maps Cmd to mod on macOS", async () => {
    vi.resetModules();
    vi.stubGlobal("navigator", { userAgent: "Mozilla/5.0 (Macintosh)" });
    const mod = await import("@/shared/lib/shortcuts");
    expect(mod.fromRecordedKeys(["meta", "s"])).toBe("mod+s");
    vi.unstubAllGlobals();
    vi.resetModules();
  });
});

describe("findConflict", () => {
  it("returns the other action already using the chord", () => {
    expect(findConflict(DEFAULT_SHORTCUTS, "newNote", "mod+k")).toBe(
      "openSearch",
    );
    expect(findConflict(DEFAULT_SHORTCUTS, "newNote", "Cmd+K")).toBe(
      "openSearch",
    );
  });

  it("ignores the action's own binding and empty chords", () => {
    expect(findConflict(DEFAULT_SHORTCUTS, "openSearch", "mod+k")).toBeNull();
    expect(findConflict(DEFAULT_SHORTCUTS, "newNote", "")).toBeNull();
  });
});

describe("formatChord", () => {
  it("uses symbols on macOS", () => {
    expect(formatChord("mod+shift+s", true)).toBe("⇧⌘S");
    expect(formatChord("alt+mod+n", true)).toBe("⌥⌘N");
    expect(formatChord("escape", true)).toBe("Esc");
  });

  it("uses labels elsewhere", () => {
    expect(formatChord("shift+mod+s", false)).toBe("Ctrl+Shift+S");
    expect(formatChord("mod+slash", false)).toBe("Ctrl+/");
  });

  it("renders an em dash for an empty chord", () => {
    expect(formatChord("", true)).toBe("—");
  });
});

describe("normalizeShortcuts", () => {
  it("returns every action with canonical defaults when nothing is stored", () => {
    const result = normalizeShortcuts(undefined);
    expect(Object.keys(result)).toHaveLength(SHORTCUT_ACTIONS.length);
    expect(result.newNote).toBe("alt+mod+n");
    expect(result.openSearch).toBe("mod+k");
    expect(result.downloadNote).toBe("shift+mod+s");
  });

  it("is idempotent", () => {
    const once = normalizeShortcuts(DEFAULT_SHORTCUTS);
    expect(normalizeShortcuts(once)).toEqual(once);
  });

  it("keeps a valid custom chord and falls back for the rest", () => {
    const result = normalizeShortcuts({ newNote: "mod+alt+x" });
    expect(result.newNote).toBe("alt+mod+x");
    expect(result.openSearch).toBe("mod+k");
  });

  it("falls back when a chord is invalid or empty", () => {
    expect(normalizeShortcuts({ openSearch: "k" }).openSearch).toBe("mod+k");
    expect(normalizeShortcuts({ saveNote: "shift" }).saveNote).toBe("mod+s");
  });

  it("falls back when a chord collides with another action's default", () => {
    expect(normalizeShortcuts({ newNote: "mod+k" }).newNote).toBe("alt+mod+n");
  });

  it("resolves duplicate custom chords so only the first wins", () => {
    const result = normalizeShortcuts({
      saveNote: "mod+alt+1",
      copyNote: "mod+alt+1",
    });
    expect(result.saveNote).toBe("alt+mod+1");
    expect(result.copyNote).toBe("alt+mod+c");
  });
});
