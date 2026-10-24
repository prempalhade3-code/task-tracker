import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { JSDOM } from 'jsdom'
import { afterEach } from 'vitest'

// Vitest globals are disabled, so React Testing Library cannot register its own
// automatic cleanup — do it explicitly to keep each test's DOM isolated.
afterEach(() => {
  cleanup()
})

// Node 25 exposes a built-in `localStorage` global. When no `--localstorage-file`
// is configured it is a non-functional stub, and because Vitest maps the jsdom
// window onto globalThis it shadows jsdom's real Web Storage implementation.
// Install a working Storage instance so tests exercise the same API as browsers.
const dom = new JSDOM('<!doctype html><html><body></body></html>', {
  url: 'http://localhost:3000/',
})

Object.defineProperty(globalThis, 'localStorage', {
  value: dom.window.localStorage,
  configurable: true,
  writable: true,
})
