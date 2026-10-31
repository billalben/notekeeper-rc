import type { TFunction } from "i18next";
import type { MainView } from "@/shared/stores/useUIStore";
import type { Theme } from "@/shared/stores/useThemeStore";
import type { ActionId } from "@/shared/lib/shortcuts";
import type { Notebook, SettingsSection } from "@/shared/types";

export type CommandGroup =
  "create" | "navigate" | "notebooks" | "settings" | "app";

const COMMAND_GROUP_ORDER: CommandGroup[] = [
  "create",
  "navigate",
  "notebooks",
  "settings",
  "app",
];

export const COMMAND_GROUP_LABELS: Record<
  CommandGroup,
  `commands.groups.${CommandGroup}`
> = {
  create: "commands.groups.create",
  navigate: "commands.groups.navigate",
  notebooks: "commands.groups.notebooks",
  settings: "commands.groups.settings",
  app: "commands.groups.app",
};

export interface PaletteCommand {
  id: string;
  group: CommandGroup;
  label: string;
  description?: string;
  icon: string;
  keywords?: string;
  shortcut?: ActionId;
  disabled?: boolean;
  run: () => void;
}

export interface CommandContext {
  t: TFunction;
  theme: Theme;
  notebooks: Notebook[];
  hasActiveTags: boolean;
  createNote: () => void;
  createNotebook: () => void;
  toggleTheme: () => void;
  exportBackup: () => void;
  openSettings: (section: SettingsSection) => void;
  navigate: (view: MainView) => void;
  selectNotebook: (notebookId: string) => void;
  openShortcutHelp: () => void;
  openTour: () => void;
  clearTagFilter: () => void;
}

const VIEW_COMMANDS: Array<{
  view: MainView;
  labelKey:
    | "sidebar.allNotes"
    | "sidebar.recent"
    | "sidebar.pinned"
    | "sidebar.favorites"
    | "sidebar.archive"
    | "sidebar.trash"
    | "sidebar.statistics";
  icon: string;
  keywords: string;
}> = [
  {
    view: "all",
    labelKey: "sidebar.allNotes",
    icon: "note_stack",
    keywords: "all notes library",
  },
  {
    view: "recent",
    labelKey: "sidebar.recent",
    icon: "history",
    keywords: "recent latest recently opened",
  },
  {
    view: "pinned",
    labelKey: "sidebar.pinned",
    icon: "push_pin",
    keywords: "pinned bookmarked",
  },
  {
    view: "favorites",
    labelKey: "sidebar.favorites",
    icon: "star",
    keywords: "favorites starred",
  },
  {
    view: "archive",
    labelKey: "sidebar.archive",
    icon: "archive",
    keywords: "archive archived",
  },
  {
    view: "trash",
    labelKey: "sidebar.trash",
    icon: "delete",
    keywords: "trash deleted bin",
  },
  {
    view: "stats",
    labelKey: "sidebar.statistics",
    icon: "insights",
    keywords: "statistics stats insights analytics",
  },
];

const SETTINGS_SECTIONS: Array<{
  id: SettingsSection;
  labelKey: `settings.sections.${SettingsSection}`;
  icon: string;
}> = [
  {
    id: "general",
    labelKey: "settings.sections.general",
    icon: "tune",
  },
  {
    id: "appearance",
    labelKey: "settings.sections.appearance",
    icon: "palette",
  },
  {
    id: "shortcuts",
    labelKey: "settings.sections.shortcuts",
    icon: "keyboard",
  },
  {
    id: "notifications",
    labelKey: "settings.sections.notifications",
    icon: "notifications",
  },
  {
    id: "data",
    labelKey: "settings.sections.data",
    icon: "database",
  },
  {
    id: "about",
    labelKey: "settings.sections.about",
    icon: "info",
  },
];

/**
 * Build every palette command from the current workspace state. Dynamic labels
 * (theme direction, notebook names) and disabled states are resolved here so
 * the palette stays a thin renderer.
 */
export const createCommands = (context: CommandContext): PaletteCommand[] => {
  const {
    t,
    theme,
    notebooks,
    hasActiveTags,
    createNote,
    createNotebook,
    toggleTheme,
    exportBackup,
    openSettings,
    navigate,
    selectNotebook,
    openShortcutHelp,
    openTour,
    clearTagFilter,
  } = context;

  const visibleNotebooks = notebooks.filter(
    (notebook) => notebook.deletedAt === null,
  );
  const hasNotebooks = visibleNotebooks.length > 0;

  const commands: PaletteCommand[] = [
    {
      id: "new-note",
      group: "create",
      label: t("sidebar.newNote"),
      description: t("settings.shortcuts.actions.newNote.description"),
      icon: "add",
      keywords: "create add write note",
      shortcut: "newNote",
      disabled: !hasNotebooks,
      run: createNote,
    },
    {
      id: "new-notebook",
      group: "create",
      label: t("commands.newNotebook"),
      icon: "create_new_folder",
      keywords: "create add folder notebook",
      run: createNotebook,
    },
  ];

  VIEW_COMMANDS.forEach(({ view, labelKey, icon, keywords }) => {
    commands.push({
      id: `view-${view}`,
      group: "navigate",
      label: t(labelKey),
      icon,
      keywords,
      run: () => navigate(view),
    });
  });

  if (hasActiveTags) {
    commands.push({
      id: "clear-tag-filters",
      group: "navigate",
      label: t("commands.clearTagFilters"),
      icon: "filter_alt_off",
      keywords: "clear reset remove tag filters",
      run: clearTagFilter,
    });
  }

  visibleNotebooks.forEach((notebook) => {
    commands.push({
      id: `notebook-${notebook.id}`,
      group: "notebooks",
      label: t("commands.switchToNotebook", { name: notebook.name }),
      icon: "folder",
      keywords: `switch go notebook ${notebook.name}`,
      run: () => selectNotebook(notebook.id),
    });
  });

  SETTINGS_SECTIONS.forEach(({ id, labelKey, icon }) => {
    commands.push({
      id: `settings-${id}`,
      group: "settings",
      label: t(labelKey),
      icon,
      keywords: `settings preferences ${id}`,
      run: () => openSettings(id),
    });
  });

  commands.push(
    {
      id: "toggle-theme",
      group: "app",
      label:
        theme === "dark" ? t("header.switchToLight") : t("header.switchToDark"),
      icon: theme === "dark" ? "light_mode" : "dark_mode",
      keywords: "theme dark light mode appearance toggle",
      shortcut: "toggleTheme",
      run: toggleTheme,
    },
    {
      id: "export-backup",
      group: "app",
      label: t("commands.exportBackup"),
      description: t("settings.data.exportAllDesc"),
      icon: "download",
      keywords: "export backup download data json",
      disabled: !hasNotebooks,
      run: exportBackup,
    },
    {
      id: "import-backup",
      group: "app",
      label: t("commands.importBackup"),
      description: t("settings.data.importDesc"),
      icon: "upload",
      keywords: "import restore upload data backup",
      run: () => openSettings("data"),
    },
    {
      id: "shortcut-help",
      group: "app",
      label: t("header.keyboardShortcuts"),
      description: t("settings.shortcuts.actions.shortcutHelp.description"),
      icon: "keyboard",
      keywords: "keyboard shortcuts hotkeys help",
      shortcut: "shortcutHelp",
      run: openShortcutHelp,
    },
    {
      id: "start-tour",
      group: "app",
      label: t("commands.startTour"),
      icon: "tour",
      keywords: "tour walkthrough guide help",
      run: openTour,
    },
  );

  return commands;
};

export interface ParsedPaletteQuery {
  commandOnly: boolean;
  query: string;
}

/** Split a raw palette query into command-only mode and the search text. */
export const parsePaletteQuery = (raw: string): ParsedPaletteQuery => {
  const trimmed = raw.trim();
  if (!trimmed.startsWith(">")) {
    return { commandOnly: false, query: trimmed };
  }

  return {
    commandOnly: true,
    query: trimmed.slice(1).trim(),
  };
};

const GROUP_RANK = new Map(
  COMMAND_GROUP_ORDER.map((group, index) => [group, index]),
);

const scoreCommand = (
  command: PaletteCommand,
  query: string,
): number | null => {
  const label = command.label.toLocaleLowerCase();
  const haystack = [
    label,
    command.description?.toLocaleLowerCase() ?? "",
    command.keywords?.toLocaleLowerCase() ?? "",
  ].join(" ");

  const tokens = query.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return 0;
  if (!tokens.every((token) => haystack.includes(token))) return null;

  if (label === query) return 0;
  if (label.startsWith(query)) return 1;
  if (
    tokens.length === 1 &&
    label.split(/\s+/).some((word) => word.startsWith(query))
  ) {
    return 2;
  }
  if (label.includes(query)) return 3;
  return 4;
};

/**
 * Filter commands by every whitespace-separated token, ranking exact and
 * prefix label matches above keyword-only matches.
 */
export const filterCommands = (
  commands: readonly PaletteCommand[],
  rawQuery: string,
): PaletteCommand[] => {
  const query = rawQuery.trim().toLocaleLowerCase();
  if (!query) return [...commands];

  return commands
    .map((command, index) => ({
      command,
      index,
      score: scoreCommand(command, query),
    }))
    .filter(
      (
        entry,
      ): entry is { command: PaletteCommand; index: number; score: number } =>
        entry.score !== null,
    )
    .sort(
      (a, b) =>
        a.score - b.score ||
        (GROUP_RANK.get(a.command.group) ?? 0) -
          (GROUP_RANK.get(b.command.group) ?? 0) ||
        a.index - b.index,
    )
    .map((entry) => entry.command);
};
