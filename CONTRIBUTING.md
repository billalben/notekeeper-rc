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
| `pnpm test`                | Run Vitest in watch mode                       |
| `pnpm test:ui`             | Open the interactive Vitest dashboard          |
| `pnpm test:run`            | Run the test suite once                        |
| `pnpm test:coverage`       | Run the suite with a coverage report           |
| `pnpm test:coverage:ui`    | Dashboard with coverage enabled                |
| `pnpm knip`                | Detect unused files, exports, and dependencies |
| `pnpm generate:pwa-assets` | Regenerate PWA icons from `public/favicon.svg` |

## Before opening a pull request

Run the following and make sure they pass:

```bash
pnpm format:check
pnpm lint
pnpm knip
pnpm build
pnpm test:run
```

A Husky pre-commit hook runs Prettier and oxlint on staged files through
lint-staged, so most formatting issues are fixed automatically on commit.

## Testing

Unit tests live in a top-level `tests/` tree that mirrors `src/`; shared helpers
(`setup.ts`, `factories.ts`) sit at its root. Tests use [Vitest](https://vitest.dev)
with a `jsdom` environment and intentionally do **not** load the PWA plugin.

Test **behaviour, not implementation**. A good test describes what a module
promises and would keep passing through a reasonable refactor. In particular:

- Prefer pure logic in `shared/lib` and feature `lib/` folders — it is the
  cheapest and most valuable thing to test.
- Test through public interfaces; never reach for private helpers or assert on
  internal state shape unless that shape is the contract.
- Query UI by role and accessible name, not by test ids, CSS classes, or
  translated copy (the app ships en/fr/ar, so wording changes are not bugs).
- Do not use snapshot tests; they fail on incidental changes.
- Mock only real boundaries — the clock (`vi.setSystemTime`), `crypto`,
  `navigator`, `localStorage`, Blob/URL. Prefer the real Fuse index and real
  stores.
- Keep tests deterministic and independent: no shared mutable state, and reset
  stores/local storage between tests.
- Assert exact values (`toEqual`/`toStrictEqual`), not loose truthiness, so a
  broken result cannot pass.

Coverage is a diagnostic, not a target. Run `pnpm test:coverage` to see what is
exercised, but aim to cover meaningful branches and invariants rather than a
percentage. Do not add tests that exist only to raise the number.

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

- Prefer the existing patterns in `src/features`, `src/shared/ui`,
  `src/shared/hooks`, and `src/shared/stores` before introducing new ones.
- Keep pure logic in `src/shared/lib` and feature `lib/` folders so it stays
  easy to reason about. Respect the one-way dependency direction
  (`app` → `features` → `shared`).
- Use the `@/*` import alias for anything outside the current folder.
- New UI strings must be added to every locale in `src/app/i18n/resources`
  (`en`, `fr`, `ar`).
- Do not add code comments unless they explain non-obvious intent.
