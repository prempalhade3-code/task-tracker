// End-to-end check of a Task Tracker build. Verifies the real UI by booting the
// actual JavaScript bundle in a DOM and driving it, rather than trusting that the
// files exist.
//
//   node tools/verify-app.mjs            # checks the local ./dist build
//   node tools/verify-app.mjs <url>      # checks a deployed site
//
// It reports per-feature pass/fail, asserts the browser console stays clean, and
// simulates a page refresh to prove localStorage persistence.
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { JSDOM } from 'jsdom'

const STORAGE_KEY = 'task-tracker.tasks.v1'
const target = process.argv[2] ?? 'dist'
const isRemote = /^https?:\/\//.test(target)

async function loadBundle() {
  if (isRemote) {
    const base = target.endsWith('/') ? target : `${target}/`
    const page = await fetch(base)
    if (!page.ok) throw new Error(`GET ${base} -> HTTP ${page.status}`)
    const html = await page.text()
    const src = html.match(/<script[^>]+src="([^"]+)"/)?.[1]
    if (!src) throw new Error('No module script found in the deployed HTML')
    const scriptUrl = new URL(src, base).href
    const js = await fetch(scriptUrl)
    if (!js.ok) throw new Error(`GET ${scriptUrl} -> HTTP ${js.status}`)
    // Node cannot import an https:// URL, so stage the downloaded bundle locally.
    const staging = mkdtempSync(path.join(tmpdir(), 'verify-app-'))
    const file = path.join(staging, 'bundle.mjs')
    writeFileSync(file, await js.text())
    return { html, scriptUrl: pathToFileURL(file).href, label: base }
  }

  const dir = path.resolve(target)
  const html = readFileSync(path.join(dir, 'index.html'), 'utf8')
  const src = html.match(/<script[^>]+src="([^"]+)"/)?.[1]
  if (!src) throw new Error('No module script found in dist/index.html')
  // Works for both a root build ("/assets/..") and a sub-path build ("/task-tracker/assets/..").
  const file = path.join(dir, src.replace(/^.*?\/assets\//, 'assets/'))
  return { html, scriptUrl: pathToFileURL(file).href, code: readFileSync(file, 'utf8'), label: dir }
}

const results = []
function check(label, ok, detail = '') {
  results.push({ label, ok: Boolean(ok) })
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${ok || !detail ? '' : `  -> ${detail}`}`)
}

let bootCount = 0

// Boots the bundle against a fresh DOM, optionally seeding localStorage first.
async function boot({ seed } = {}) {
  const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
    url: 'https://example.test/',
  })
  const { window } = dom

  if (seed) {
    for (const [key, value] of Object.entries(seed)) window.localStorage.setItem(key, value)
  }

  const define = (name, value) =>
    Object.defineProperty(globalThis, name, { value, configurable: true, writable: true })

  define('window', window)
  define('self', window)
  define('document', window.document)
  for (const name of [
    'navigator', 'location', 'history', 'HTMLElement', 'Element', 'Node', 'Text', 'Comment',
    'Event', 'MouseEvent', 'KeyboardEvent', 'InputEvent', 'CustomEvent', 'DocumentFragment',
    'HTMLInputElement', 'HTMLFormElement', 'HTMLButtonElement', 'NodeList', 'MutationObserver',
    'SVGElement', 'getComputedStyle', 'requestAnimationFrame', 'cancelAnimationFrame',
    'localStorage', 'sessionStorage',
  ]) {
    define(name, window[name])
  }

  // Capture anything the app logs as an error or throws while it runs.
  const consoleErrors = []
  const realError = console.error
  console.error = (...args) => {
    consoleErrors.push(args.map((a) => (a instanceof Error ? a.message : String(a))).join(' '))
  }
  window.addEventListener('error', (event) => consoleErrors.push(`window error: ${event.message}`))
  window.addEventListener('unhandledrejection', (event) =>
    consoleErrors.push(`unhandled rejection: ${event.reason}`),
  )

  // A distinct specifier per boot forces the module to execute again, which is what
  // makes the refresh simulation meaningful.
  const specifier = `${bundle.scriptUrl}${bundle.scriptUrl.includes('?') ? '&' : '?'}boot=${++bootCount}`
  try {
    await import(specifier)
  } finally {
    console.error = realError
  }
  await new Promise((resolve) => setTimeout(resolve, 200))
  return { window, consoleErrors }
}

const bundle = await loadBundle()
console.log(`Verifying ${bundle.label}\n`)

const ui = (window) => ({
  titles: () =>
    Array.from(window.document.querySelectorAll('.task-list .task-item')).map(
      (li) => li.querySelector('.task-item__title')?.textContent ?? '',
    ),
  stored: () => JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '[]'),
  subtitle: () => window.document.querySelector('.app__subtitle')?.textContent,
  emptyState: () => window.document.querySelector('.empty-state')?.textContent ?? '',
})

async function addTask(window, name) {
  const input = window.document.querySelector('.task-input__field')
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set
  setter.call(input, name)
  input.dispatchEvent(new window.Event('input', { bubbles: true }))
  window.document
    .querySelector('form.task-input')
    .dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }))
  await new Promise((resolve) => setTimeout(resolve, 120))
}

const filterButton = (window, label) =>
  Array.from(window.document.querySelectorAll('.filter-bar__button')).find((b) =>
    b.textContent.startsWith(label),
  )

// ---------------------------------------------------------------- first load
{
  const { window, consoleErrors } = await boot()
  const { titles, stored, subtitle, emptyState } = ui(window)

  check('the app mounts and renders', window.document.querySelector('.app__title')?.textContent === 'Task Tracker')
  check('an empty state is shown on first load', /No tasks yet/.test(emptyState()))
  check('nothing is persisted before any interaction', stored().length === 0)

  await addTask(window, 'Buy milk')
  check('adds a task', titles().join() === 'Buy milk', titles().join())
  check('writes the task to localStorage', stored().length === 1 && stored()[0].title === 'Buy milk')
  check('shows the pending count', subtitle() === '1 task left', subtitle())

  await addTask(window, 'Walk the dog')
  await addTask(window, 'Write report')
  check('lists newest tasks first', titles().join() === 'Write report,Walk the dog,Buy milk', titles().join())

  const blankGuard = window.document.querySelector('.task-input__button').disabled
  check('disables Add while the input is blank', blankGuard === true)

  window.document.querySelector('.task-item__checkbox').click()
  await new Promise((resolve) => setTimeout(resolve, 120))
  check('marks a task as completed', stored().filter((t) => t.completed).length === 1)
  check('updates the pending count', subtitle() === '2 tasks left', subtitle())

  filterButton(window, 'Pending').click()
  await new Promise((resolve) => setTimeout(resolve, 120))
  check('filter Pending hides completed tasks', titles().join() === 'Walk the dog,Buy milk', titles().join())

  filterButton(window, 'Completed').click()
  await new Promise((resolve) => setTimeout(resolve, 120))
  check('filter Completed shows only completed tasks', titles().join() === 'Write report', titles().join())

  filterButton(window, 'All').click()
  await new Promise((resolve) => setTimeout(resolve, 120))
  check('filter All shows every task', titles().length === 3, titles().join())

  const items = window.document.querySelectorAll('.task-item')
  items[items.length - 1].querySelector('.task-item__delete').click()
  await new Promise((resolve) => setTimeout(resolve, 120))
  check('deletes a task', titles().join() === 'Write report,Walk the dog', titles().join())
  check('persists the deletion', stored().length === 2)

  const clearButton = window.document.querySelector('.clear-completed')
  check('offers Clear completed while a task is completed', Boolean(clearButton))
  clearButton.click()
  await new Promise((resolve) => setTimeout(resolve, 120))
  check('clears completed tasks', titles().join() === 'Walk the dog', titles().join())
  check('persists clear-completed', stored().length === 1 && stored()[0].title === 'Walk the dog')
  check('hides Clear completed when nothing is completed', !window.document.querySelector('.clear-completed'))

  check('browser console is free of errors', consoleErrors.length === 0, consoleErrors.join(' | '))

  // ------------------------------------------------------------ after refresh
  const snapshot = Object.fromEntries(
    Array.from({ length: window.localStorage.length }, (_, i) => {
      const key = window.localStorage.key(i)
      return [key, window.localStorage.getItem(key)]
    }),
  )
  const reloaded = await boot({ seed: snapshot })
  const after = ui(reloaded.window)
  check('tasks survive a page refresh', after.titles().join() === 'Walk the dog', after.titles().join())
  check('refresh keeps the console clean', reloaded.consoleErrors.length === 0, reloaded.consoleErrors.join(' | '))
}

const failed = results.filter((r) => !r.ok)
console.log(`\n${results.length - failed.length}/${results.length} checks passed`)
process.exit(failed.length === 0 ? 0 : 1)
