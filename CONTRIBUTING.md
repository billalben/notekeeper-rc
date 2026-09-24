# Contributing

Thanks for your interest in improving Notekeeper! This guide covers the local
workflow and the checks your change should pass before it is merged.

## Prerequisites

- Node.js 20+
- [pnpm](https://pnpm.io)

## Setup

```bash
pnpm install
pnpm dev
```

The dev server runs at http://localhost:5173.

## Scripts

| Command                    | What it does                                   |
| -------------------------- | ---------------------------------------------- |
| `pnpm dev`                 | Start the Vite dev server                      |
| `pnpm build`               | Type-check (`tsc -b`) and build for production |
| `pnpm preview`             | Preview the production build locally           |
| `pnpm lint`                | Run oxlint                                     |
| `pnpm format`              | Format the repo with Prettier                  |
| `pnpm format:check`        | Check formatting without writing               |
| `pnpm knip`                | Detect unused files, exports, and dependencies |
| `pnpm generate:pwa-assets` | Regenerate PWA icons from `public/favicon.svg` |

## Before opening a pull request

Run the following and make sure they pass:

```bash
pnpm format:check
pnpm lint
pnpm knip
pnpm build
```

A Husky pre-commit hook runs Prettier and oxlint on staged files through
lint-staged, so most formatting issues are fixed automatically on commit.

## Commit messages

This project uses [Conventional Commits](https://www.conventionalcommits.org).
Keep the subject in the imperative mood and scope it to the area you touched:

```
feat(shared): add hash for url
fix(shared): length for note & style for folder
perf(shared): split initial bundle and trim syntax highlighting
chore(tooling): add knip for unused-code detection
```

Common types: `feat`, `fix`, `perf`, `refactor`, `docs`, `style`, `chore`.

## Project conventions

- Prefer the existing patterns in `src/components`, `src/hooks`, `src/store`,
  and `src/utils` before introducing new ones.
- Keep pure logic in `src/utils` and stores so it stays easy to reason about.
- New UI strings must be added to every locale in `src/i18n/resources`
  (`en`, `fr`, `ar`).
- Do not add code comments unless they explain non-obvious intent.
