export const tour = {
  buttons: {
    back: "Back",
    close: "Close",
    next: "Next",
    nextWithProgress: "Next ({current} of {total})",
    last: "Finish",
    skip: "Skip tour",
    open: "Open the dialog",
  },
  steps: {
    welcome: {
      title: "Welcome to Notekeeper",
      body: "A fast, offline-first home for your notes, stored right here on your device. Let's take a quick tour.",
    },
    smartViews: {
      title: "Smart views",
      body: "Jump between All notes, Pinned, Favorites, and Recent. Each view updates automatically as you work.",
    },
    notebooks: {
      title: "Your notebooks",
      body: "Group notes into notebooks. Create, rename, pin, reorder, or delete them — deleted notebooks go to Trash and can be restored.",
    },
    more: {
      title: "Statistics & Trash",
      body: "Open Statistics for insights into your writing, and Trash to restore or permanently remove deleted notes and notebooks.",
    },
    newNote: {
      title: "Create a note",
      body: "Tap + to start a new note (or use the new-note shortcut). Notes open in a modal, full screen, or a split pane, depending on your settings.",
    },
    noteList: {
      title: "Your note cards",
      body: "Each card shows a preview, its tags, and when it was edited. Use the ⋮ menu to pin, favorite, download, move, reorder, or delete a note. Pinned notes rise to the top.",
    },
    tags: {
      title: "Filter by tag",
      body: "Tag notes inline, then tap a tag here to filter the list. Select several tags to narrow things down further.",
    },
    editorTitle: {
      title: "Title & tags",
      body: "Give the note a title and add tags as you type. Pick or change its notebook from the selector, and tap the star to favorite it.",
    },
    editorToolbar: {
      title: "Write in Markdown",
      body: "Format with the toolbar — headings, bold, italic, lists, checklists, and code. Switch between Edit and Preview to see the rendered result.",
    },
    editorFooter: {
      title: "Autosave & word count",
      body: "Changes save automatically (or use Save), with a running word count. You can also copy, download as Markdown, or delete the note.",
    },
    search: {
      title: "Find anything fast",
      body: "Search across every notebook with fuzzy matching. Open the palette from here or with the keyboard shortcut.",
    },
    theme: {
      title: "Light & dark",
      body: "Toggle between light and dark mode at any time. It follows your system by default.",
    },
    shortcuts: {
      title: "Keyboard shortcuts",
      body: "See every shortcut in one place and customize the bindings to your liking.",
    },
    settings: {
      title: "Make it yours",
      body: "Open Settings to change the accent color, density, and corner radius; switch language (including right-to-left); tune notifications; and export or import your data.",
    },
    finish: {
      title: "You're all set",
      body: "Notekeeper installs as an app and works offline. You can replay this tour anytime from Settings → About. Happy note-taking!",
    },
  },
} as const;
