import type { Filter, Task } from './types'

export type TaskAction =
  | { type: 'add'; title: string; id?: string; now?: number }
  | { type: 'toggle'; id: string }
  | { type: 'remove'; id: string }
  | { type: 'clearCompleted' }

export function createId(): string {
  const c = globalThis.crypto
  if (c && typeof c.randomUUID === 'function') return c.randomUUID()
  return `task-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

export function createTask(title: string, id: string = createId(), now: number = Date.now()): Task {
  return { id, title: title.trim(), completed: false, createdAt: now }
}

export function tasksReducer(tasks: Task[], action: TaskAction): Task[] {
  switch (action.type) {
    case 'add': {
      const title = action.title.trim()
      if (!title) return tasks
      return [createTask(title, action.id, action.now), ...tasks]
    }
    case 'toggle':
      return tasks.map((task) =>
        task.id === action.id ? { ...task, completed: !task.completed } : task,
      )
    case 'remove':
      return tasks.filter((task) => task.id !== action.id)
    case 'clearCompleted':
      return tasks.filter((task) => !task.completed)
  }
}

export function filterTasks(tasks: Task[], filter: Filter): Task[] {
  switch (filter) {
    case 'active':
      return tasks.filter((task) => !task.completed)
    case 'completed':
      return tasks.filter((task) => task.completed)
    case 'all':
      return tasks
  }
}

export interface TaskCounts {
  all: number
  active: number
  completed: number
}

export function countByStatus(tasks: Task[]): TaskCounts {
  const completed = tasks.filter((task) => task.completed).length
  return { all: tasks.length, active: tasks.length - completed, completed }
}
