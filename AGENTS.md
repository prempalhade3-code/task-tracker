# Task Tracker

React + TypeScript + Vite task tracker. All state transitions live in a pure
reducer and are persisted to `localStorage`.

## Layout

- `src/tasksReducer.ts` — add / toggle / remove / clearCompleted, filtering, counts
- `src/storage.ts` — localStorage load + save, validates stored data, never throws
- `src/useTasks.ts` — hook wiring the reducer to persistence
- `src/components/` — `TaskInput`, `TaskItem`, `FilterBar`
- `src/App.tsx`, `src/main.tsx`, `src/index.css`
- `src/__tests__/` — Vitest suites (reducer, storage, UI integration)
- `scripts/verify-app.mjs` — boots the production bundle in jsdom and drives the real UI

## Commands

On a normal machine:

```sh
npm install
npm run dev      # dev server
npm run build    # typecheck + production build
npm test         # vitest
```

## Running inside the agent sandbox

The sandbox blocks several things, so the `npm run *` scripts do not work here.
Workarounds, all run from the project root:

- `/opt` is only partially readable, which breaks npm's module resolution. Use the
  npm copy at the workspace root (`../tools/npm/bin/npm-cli.js`) or invoke tool
  binaries directly.
- npm runs scripts through `sh`, which the sandbox denies. Invoke the bins directly.
- `/etc/hosts` is unreadable so `localhost` does not resolve. Preload
  `tools/dns-patch.cjs` with `NODE_OPTIONS`.
- `HOME` points at a scratch directory, so dependency resolution walks up to
  `/Users/<user>` and hits EPERM. Run with `HOME="$PWD"`.
- Node 25 ships a stub `localStorage` global that shadows jsdom's. `src/test/setup.ts`
  installs a real Web Storage instance.
- Binding a TCP port is denied, so `vite dev` / `vite preview` cannot start.
- `/usr/bin/git` is a shim that fails without a readable developer dir. Use
  `/Library/Developer/CommandLineTools/usr/bin/git`.

```sh
export OPENSSL_CONF=/dev/null
export NODE_OPTIONS="--require=\"$PWD/tools/dns-patch.cjs\""

HOME="$PWD" node node_modules/typescript/bin/tsc --noEmit
HOME="$PWD" node node_modules/vitest/vitest.mjs run
HOME="$PWD" node node_modules/vite/bin/vite.js build
node scripts/verify-app.mjs
```
