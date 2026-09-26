# Notekeeper

A fast, offline-first note-taking app that organizes notes into notebooks.
Originally built with vanilla HTML, CSS, and JavaScript — now rebuilt as a
modern React + TypeScript + Vite PWA.

## Features

### Organizing

- **Notebooks** — create, rename, pin, reorder, and delete notebooks to group
  your notes. Deleted notebooks go to the trash and can be restored.
- **Notes** — create, read, update, and delete notes. Pin, favorite, reorder
  within a notebook, or move a note to another notebook (with undo).
- **Tags** — tag notes inline, with suggestions and usage counts, and filter
  the note list by one or more tags.
- **Trash** — soft-delete notes and notebooks, restore them, or empty the
  trash. Items are auto-purged after a configurable retention window
  (7 / 30 / 90 days or forever).
- **Smart views** — All notes, Recent, Pinned, and Favorites.

### Writing & finding

- **Markdown editor** — GitHub-flavored Markdown with a live preview, plus
  sanitized syntax highlighting.
- **Editor presentations** — open notes in a modal, full screen, or a
  resizable split pane beside the list. Autosave and a word count are
  available as options.
- **Search palette** — fuzzy full-text search across every notebook.
- **Statistics** — per-notebook and tag-level insights into your notes.
- **Export** — download everything, a single notebook, or one note as JSON
  or Markdown. (Importing a backup is on the roadmap.)

### Making it yours

- **Light & dark theme** — follows your system preference by default, can be
  toggled manually, and is applied before first paint to avoid a flash.
- **Appearance** — accent color, font scale, density, corner radius, and a
  high-contrast mode.
- **Languages** — English, French, and Arabic, including full RTL support.
- **Keyboard shortcuts** — fully customizable bindings with an in-app cheat
  sheet.
- **Notifications** — configure toast position, duration, and stacking.
- **Responsive** — a collapsible sidebar for small screens and a static,
  resizable one for larger displays.

### Platform

- **Installable & offline** — a PWA you can install with its own icon; the app
  shell and fonts are cached so it loads and works without a connection, and
  new versions surface as an in-app notification.
- **Deep links** — hash-based routing keeps the current view, note, and open
  overlay in the URL.

## Tech stack

| Layer            | Choice                                                                                                |
| ---------------- | ----------------------------------------------------------------------------------------------------- |
| UI               | [React 19](https://react.dev)                                                                         |
| Language         | [TypeScript](https://www.typescriptlang.org)                                                          |
| Build tool       | [Vite](https://vite.dev)                                                                              |
| State            | [Zustand](https://zustand.docs.pmnd.rs) (with `persist`)                                              |
| Markdown         | [react-markdown](https://github.com/remarkjs/react-markdown) + remark-gfm, rehype-sanitize, lowlight  |
| Search           | [Fuse.js](https://www.fusejs.io)                                                                      |
| i18n             | [i18next](https://www.i18next.com) + react-i18next                                                    |
| Shortcuts        | [react-hotkeys-hook](https://github.com/JohannesKlauss/react-hotkeys-hook)                            |
| PWA              | [vite-plugin-pwa](https://vite-pwa-org.netlify.app) (Workbox)                                         |
| Testing          | [Vitest](https://vitest.dev) + jsdom                                                                  |
| Linting          | [oxlint](https://oxc.rs)                                                                              |
| Formatting       | [Prettier](https://prettier.io)                                                                       |
| Dead-code checks | [knip](https://knip.dev)                                                                              |
| Git hooks        | [Husky](https://typicode.github.io/husky) + [lint-staged](https://github.com/lint-staged/lint-staged) |
| Package manager  | [pnpm](https://pnpm.io)                                                                               |

## Project structure

```
.
├── index.html                  # App shell, fonts, and no-flash bootstrap script
├── public/                     # Static assets (favicon, PWA icons)
├── src/
│   ├── app/                    # App shell + infrastructure
│   │   ├── hooks/              # App-level effects (appearance, language, actions, session)
│   │   ├── router/             # Hash-route parsing/serialization
│   │   ├── i18n/               # i18next setup + en/fr/ar resources
│   │   ├── App.tsx             # Root composition
│   │   ├── MainPanel.tsx       # View switcher (notes/recent/pinned/favorites/stats/trash)
│   │   ├── WorkspaceModals.tsx # Dialog/overlay stack
│   │   ├── SplitEditorPane.tsx # Split-view editor pane
│   │   ├── Header.tsx          # Top bar (greeting, search, settings, theme)
│   │   ├── main.tsx            # React entry point
│   │   └── pwa.ts              # Service-worker registration + update toasts
│   ├── features/               # Feature slices (UI + feature-only logic)
│   │   ├── notes/              # Note list, card, editor, tags, toolbar
│   │   ├── notebooks/          # Sidebar + notebook navigation
│   │   ├── tags/               # Tag filter bar
│   │   ├── search/             # Search palette + Fuse index
│   │   ├── statistics/         # Statistics view, cards, stats math
│   │   ├── trash/              # Trash view
│   │   ├── shortcuts/          # Shortcut help + hotkey binding
│   │   └── settings/           # Settings modal and its sections
│   ├── shared/                 # Cross-cutting code (no feature imports)
│   │   ├── ui/                 # Design-system primitives (Button, IconButton, …)
│   │   ├── hooks/              # Reusable React hooks
│   │   ├── lib/                # Pure helpers (notes, tags, search, export, …)
│   │   ├── markdown/           # Markdown renderer + highlight subset
│   │   ├── stores/             # Zustand stores + settings schema/persistence
│   │   └── types/              # Shared domain types
│   ├── assets/                 # Light/dark logos
│   └── styles/                 # Global CSS, split by concern
├── tests/                      # Vitest suite (mirrors src/)
├── pwa-assets.config.ts
└── vite.config.ts
```

Imports use the `@/*` alias for `src/*`. Dependency direction is one-way:
`app` → `features` → `shared`; `shared` never imports from `features` or `app`.

## Getting started

**Prerequisites:** Node.js 20+ and [pnpm](https://pnpm.io).

```bash
# Install dependencies
pnpm install

# Start the dev server (http://localhost:5173)
pnpm dev

# Type-check and build for production
pnpm build

# Preview the production build locally
pnpm preview

# Lint the codebase
pnpm lint

# Run the test suite (or once / with coverage)
pnpm test
pnpm test:run
pnpm test:coverage

# Open the interactive Vitest dashboard
pnpm test:ui
pnpm test:coverage:ui

# Check formatting / format in place
pnpm format:check
pnpm format

# Find unused files, exports, and dependencies
pnpm knip

# Regenerate PWA icons from public/favicon.svg (only if the source art changes)
pnpm generate:pwa-assets
```

A Husky pre-commit hook runs Prettier and oxlint on staged files via
lint-staged. See [CONTRIBUTING.md](./CONTRIBUTING.md) for details.

## Data & storage

Everything is stored locally in the browser — there is no backend. Three
`localStorage` keys are used:

| Key            | Contents                                                                | Version |
| -------------- | ----------------------------------------------------------------------- | ------- |
| `noteKeeperDB` | Notebooks, notes, the tag registry, and the active notebook (`persist`) | 7       |
| `settings`     | Editor, appearance, trash, toast, sidebar, and shortcut preferences     | 18      |
| `theme`        | The last chosen theme (`"light"` or `"dark"`)                           | —       |

The legacy vanilla app stored `{ notebooks: [...] }` directly under
`noteKeeperDB`; it is converted to Zustand's `{ state, version }` shape
automatically on first load so existing notes are preserved. Backward
compatibility for older schemas is handled by versioned migrations in
`src/shared/stores/useNoteStore.ts` and `src/shared/stores/useSettingsStore.ts`.

## Routing

Navigation uses hash routes, so views are linkable without a server:

```
#/notebooks/:id            #/notebooks/:id/note/:noteId
#/all  #/recent  #/pinned  #/favorites  #/stats  #/trash
#/settings/:section        #/search        #/shortcuts
```

Parsing and serialization live in `src/app/router/hashRoute.ts`.

## License

Licensed under the [MIT License](./LICENSE).
