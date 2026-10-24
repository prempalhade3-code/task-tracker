# Task Tracker

A simple, responsive task tracker built with React and TypeScript. Tasks are kept in the
browser's `localStorage`, so they survive a page refresh. There is no backend, no account
and no tracking.

**Live app:** https://prempalhade3-code.github.io/task-tracker/

## Features

- **Add tasks** — type a task and press Enter or click *Add*. Blank input is rejected.
- **Complete tasks** — tick a checkbox to mark a task complete, untick it to make it pending again.
- **Delete tasks** — remove any single task with its ✕ button.
- **Filter** — switch between **All**, **Pending** and **Completed**; each filter shows a live count.
- **Clear completed** — remove every finished task in one click.
- **Persistent** — tasks are saved to `localStorage` and restored on refresh.
- **Responsive & accessible** — works from small phones up to desktop, with labelled controls,
  `aria-pressed` filter state and keyboard support throughout.

## Technologies

| Area | Choice |
| --- | --- |
| UI | React 18 |
| Language | TypeScript 5 (strict) |
| Build tool | Vite 5 |
| Testing | Vitest + React Testing Library + jsdom |
| Styling | Plain CSS with custom properties (no UI framework) |

## Getting started

Requires Node.js 18 or newer.

```sh
npm install
npm run dev
```

Then open the printed URL (by default <http://localhost:5173>).

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite dev server with hot reload |
| `npm run build` | Type-check, then build the production bundle to `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run typecheck` | Run `tsc --noEmit` only |
| `npm test` | Run the Vitest suite once |
| `npm run verify` | Boot the built app in a DOM and exercise every feature end to end |

## Project structure

```
src/
  App.tsx                 app shell: header, input, filters, list
  main.tsx                React entry point
  tasksReducer.ts         pure state transitions and derived counts
  storage.ts              localStorage load/save with validation
  useTasks.ts             hook wiring the reducer to persistence
  types.ts                shared Task / Filter types
  index.css               responsive styles
  components/
    TaskInput.tsx         controlled input + submit button
    TaskItem.tsx          a single row: checkbox, title, delete
    FilterBar.tsx         all / pending / completed tabs with counts
  __tests__/              reducer, storage and UI integration tests
```

## Testing

```sh
npm test
```

The suite covers three layers:

- `tasksReducer.test.ts` — add, toggle, delete, clear-completed, filtering and counts.
- `storage.test.ts` — reading, writing, and recovering from corrupt or unavailable storage.
- `App.test.tsx` — full user flows driven through the real components.

## Deployment

The app is deployed to **GitHub Pages** from the `main` branch by the workflow in
[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml). Every push to `main`
type-checks, tests, builds and publishes the site, so the live URL above always reflects
the latest commit.

GitHub Pages serves this project from a sub-path, so the build sets `VITE_BASE_PATH`:

```sh
VITE_BASE_PATH=/task-tracker/ npm run build
```

A plain `npm run build` uses `/` as the base, which is what you want for local previews and
for hosts that serve the app from the domain root.
