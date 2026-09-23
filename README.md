# Notekeeper

A simple, intuitive note-taking app that lets you organize notes into
notebooks. Originally built with vanilla HTML, CSS, and JavaScript — now
rebuilt as a modern React + TypeScript + Vite application.

> **This is the React rewrite.** The original vanilla JS version lives in the
> [notekeeper](https://github.com/billalben/notekeeper) repo
> ([live demo](https://billalben.github.io/notekeeper/)), and its source is
> kept here under [`notekeeper-main/`](./notekeeper-main) for reference.
> Any notes already saved in your browser are migrated automatically on first
> load — see [Data & storage](#data--storage).

## Features

- **Notebooks** — create, rename, and delete notebooks to group your notes.
- **Notes** — create, read, update, and delete notes within a notebook.
- **Relative timestamps** — each note shows when it was last updated
  ("Just now", "5 min ago", "2 days ago", …).
- **Persistent storage** — everything is saved to `localStorage`, so notes
  survive refreshes and restarts.
- **Light & dark theme** — follows your system preference by default, can be
  toggled manually, and is applied before first paint to avoid a flash.
- **Responsive** — a collapsible sidebar for small screens and a static one
  for larger displays.
- **Installable & offline** — a PWA you can install with its own icon; the app
  shell and fonts are cached so it loads and works without a connection, and
  new versions surface as an in-app notification.

## Tech stack

| Layer           | Choice                                                        |
| --------------- | ------------------------------------------------------------- |
| UI              | [React 19](https://react.dev)                                 |
| Language        | [TypeScript](https://www.typescriptlang.org)                  |
| Build tool      | [Vite](https://vite.dev)                                      |
| State           | [Zustand](https://zustand.docs.pmnd.rs) (with `persist`)      |
| Linting         | [oxlint](https://oxc.rs)                                      |
| PWA             | [vite-plugin-pwa](https://vite-pwa-org.netlify.app) (Workbox) |
| Package manager | [pnpm](https://pnpm.io)                                       |

## Project structure

```
.
├── index.html              # App shell, fonts, and no-flash theme script
├── public/                 # Static assets (favicon)
├── src/
│   ├── assets/             # Light/dark logos
│   ├── components/         # UI components
│   │   ├── ConfirmModal.tsx
│   │   ├── Fab.tsx
│   │   ├── Header.tsx
│   │   ├── IconButton.tsx
│   │   ├── NavItem.tsx
│   │   ├── NoteCard.tsx
│   │   ├── NoteList.tsx
│   │   ├── NoteModal.tsx
│   │   └── Sidebar.tsx
│   ├── store/              # Zustand stores
│   │   ├── useNoteStore.ts # Notebooks + notes (persisted)
│   │   └── useThemeStore.ts
│   ├── App.tsx             # Root component / layout composition
│   ├── main.tsx            # React entry point
│   ├── types.ts            # Shared `Note` / `Notebook` types
│   ├── utils.ts            # ID generation, greeting, relative time
│   └── index.css           # Global styles & theme variables
├── notekeeper-main/        # Original vanilla HTML/CSS/JS version
└── vite.config.ts
```

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

# Regenerate PWA icons from public/favicon.svg (only needed if the source art changes)
pnpm generate:pwa-assets
```

## Data & storage

State is kept in `localStorage` under two keys:

- `noteKeeperDB` — all notebooks and notes, persisted by Zustand's `persist`
  middleware in the `{ state, version }` shape.
- `theme` — the user's last chosen theme (`"light"` or `"dark"`).

## License

Licensed under the MIT License.
