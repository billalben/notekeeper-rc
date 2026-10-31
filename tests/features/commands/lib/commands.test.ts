import type { TFunction } from "i18next";
import { describe, expect, it, vi } from "vitest";
import {
  createCommands,
  filterCommands,
  parsePaletteQuery,
  type CommandContext,
  type PaletteCommand,
} from "@/features/commands/lib/commands";
import { makeNotebook } from "@tests/factories";

const t = ((key: string, options?: Record<string, unknown>) =>
  options && "name" in options
    ? `${key}:${String(options.name)}`
    : key) as unknown as TFunction;

const createContext = (
  overrides: Partial<CommandContext> = {},
): CommandContext => ({
  t,
  theme: "light",
  notebooks: [],
  hasActiveTags: false,
  createNote: vi.fn(),
  createNotebook: vi.fn(),
  toggleTheme: vi.fn(),
  exportBackup: vi.fn(),
  openSettings: vi.fn(),
  navigate: vi.fn(),
  selectNotebook: vi.fn(),
  openShortcutHelp: vi.fn(),
  openTour: vi.fn(),
  clearTagFilter: vi.fn(),
  ...overrides,
});

const command = (
  id: string,
  label: string,
  overrides: Partial<PaletteCommand> = {},
): PaletteCommand => ({
  id,
  group: "app",
  label,
  icon: "bolt",
  run: () => {},
  ...overrides,
});

describe("parsePaletteQuery", () => {
  it("trims regular queries", () => {
    expect(parsePaletteQuery("  tag:work  ")).toEqual({
      commandOnly: false,
      query: "tag:work",
    });
  });

  it("strips the command-only prefix", () => {
    expect(parsePaletteQuery("  > toggle theme ")).toEqual({
      commandOnly: true,
      query: "toggle theme",
    });
  });

  it("treats a lone prefix as an empty command query", () => {
    expect(parsePaletteQuery(">")).toEqual({
      commandOnly: true,
      query: "",
    });
  });
});

describe("createCommands", () => {
  it("disables note and export actions when no notebooks exist", () => {
    const commands = createCommands(createContext());
    const newNote = commands.find((item) => item.id === "new-note");
    const exportBackup = commands.find((item) => item.id === "export-backup");

    expect(newNote?.disabled).toBe(true);
    expect(exportBackup?.disabled).toBe(true);
    expect(
      commands.find((item) => item.id === "new-notebook")?.disabled,
    ).toBeUndefined();
  });

  it("labels the theme command with the opposite mode", () => {
    const light = createCommands(createContext({ theme: "light" }));
    const dark = createCommands(createContext({ theme: "dark" }));

    expect(light.find((item) => item.id === "toggle-theme")?.label).toBe(
      "header.switchToDark",
    );
    expect(dark.find((item) => item.id === "toggle-theme")?.label).toBe(
      "header.switchToLight",
    );
  });

  it("creates commands for every visible notebook", () => {
    const selectNotebook = vi.fn();
    const notebooks = [
      makeNotebook({ id: "nb-work", name: "Work" }),
      makeNotebook({
        id: "nb-old",
        name: "Old",
        deletedAt: 123,
      }),
    ];

    const commands = createCommands(
      createContext({ notebooks, selectNotebook }),
    );
    const notebookCommands = commands.filter(
      (item) => item.group === "notebooks",
    );

    expect(notebookCommands).toHaveLength(1);
    expect(notebookCommands[0].label).toBe("commands.switchToNotebook:Work");

    notebookCommands[0].run();
    expect(selectNotebook).toHaveBeenCalledWith("nb-work");
  });

  it("adds the settings sections and the clear-filter command", () => {
    const commands = createCommands(createContext({ hasActiveTags: true }));
    const settingsIds = commands
      .filter((item) => item.group === "settings")
      .map((item) => item.id);

    expect(settingsIds).toEqual([
      "settings-general",
      "settings-appearance",
      "settings-shortcuts",
      "settings-notifications",
      "settings-data",
      "settings-about",
    ]);
    expect(commands.some((item) => item.id === "clear-tag-filters")).toBe(true);
  });
});

describe("filterCommands", () => {
  it("returns every command in order for an empty query", () => {
    const commands = [command("one", "First"), command("two", "Second")];

    expect(filterCommands(commands, "   ")).toEqual(commands);
  });

  it("matches labels, descriptions, and keywords case-insensitively", () => {
    const commands = [
      command("theme", "Toggle theme", { keywords: "dark light mode" }),
      command("export", "Export backup", {
        description: "Download all notes",
      }),
      command("other", "Open settings"),
    ];

    expect(filterCommands(commands, "THEME").map((item) => item.id)).toEqual([
      "theme",
    ]);
    expect(filterCommands(commands, "download").map((item) => item.id)).toEqual(
      ["export"],
    );
    expect(filterCommands(commands, "dark").map((item) => item.id)).toEqual([
      "theme",
    ]);
  });

  it("ranks prefix matches above mid-label matches", () => {
    const commands = [
      command("middle", "Change theme"),
      command("prefix", "Theme settings"),
    ];

    expect(filterCommands(commands, "theme").map((item) => item.id)).toEqual([
      "prefix",
      "middle",
    ]);
  });

  it("requires every token to match", () => {
    const commands = [
      command("full", "Toggle theme", { keywords: "dark light" }),
      command("partial", "Toggle preview"),
    ];

    expect(
      filterCommands(commands, "toggle theme").map((item) => item.id),
    ).toEqual(["full"]);
  });

  it("returns no matches for an unrelated query", () => {
    expect(filterCommands([command("one", "First")], "zzz")).toEqual([]);
  });
});
