import { describe, expect, it } from 'vitest'
import {
  countByStatus,
  createTask,
  filterTasks,
  tasksReducer,
} from '../tasksReducer'
import type { Task } from '../types'

const make = (id: string, completed = false): Task => ({
  id,
  title: `Task ${id}`,
  completed,
  createdAt: 0,
})

describe('tasksReducer', () => {
  it('adds a trimmed task to the front of the list', () => {
    const result = tasksReducer([make('a')], {
      type: 'add',
      title: '  Write tests  ',
      id: 'new',
      now: 123,
    })
    expect(result).toHaveLength(2)
    expect(result[0]).toEqual({ id: 'new', title: 'Write tests', completed: false, createdAt: 123 })
  })

  it('ignores tasks whose title is empty or whitespace', () => {
    const tasks = [make('a')]
    expect(tasksReducer(tasks, { type: 'add', title: '   ' })).toBe(tasks)
    expect(tasksReducer(tasks, { type: 'add', title: '' })).toBe(tasks)
  })

  it('toggles only the matching task and does not mutate the input', () => {
    const tasks = [make('a'), make('b')]
    const result = tasksReducer(tasks, { type: 'toggle', id: 'b' })
    expect(result.map((task) => task.completed)).toEqual([false, true])
    expect(tasks.map((task) => task.completed)).toEqual([false, false])
    expect(result[1]).not.toBe(tasks[1])
  })

  it('removes a task by id', () => {
    const result = tasksReducer([make('a'), make('b')], { type: 'remove', id: 'a' })
    expect(result.map((task) => task.id)).toEqual(['b'])
  })

  it('clears completed tasks', () => {
    const result = tasksReducer([make('a', true), make('b'), make('c', true)], {
      type: 'clearCompleted',
    })
    expect(result.map((task) => task.id)).toEqual(['b'])
  })

  it('returns the same array for unknown ids', () => {
    const tasks = [make('a')]
    expect(tasksReducer(tasks, { type: 'remove', id: 'zzz' })).toEqual(tasks)
  })
})

describe('createTask', () => {
  it('generates unique ids', () => {
    const ids = new Set(Array.from({ length: 50 }, () => createTask('x').id))
    expect(ids.size).toBe(50)
  })
})

describe('filterTasks', () => {
  const tasks = [make('a', true), make('b'), make('c', true)]

  it('returns everything for "all"', () => {
    expect(filterTasks(tasks, 'all')).toHaveLength(3)
  })

  it('returns only pending tasks for "active"', () => {
    expect(filterTasks(tasks, 'active').map((task) => task.id)).toEqual(['b'])
  })

  it('returns only completed tasks for "completed"', () => {
    expect(filterTasks(tasks, 'completed').map((task) => task.id)).toEqual(['a', 'c'])
  })
})

describe('countByStatus', () => {
  it('counts each status', () => {
    expect(countByStatus([make('a', true), make('b'), make('c', true)])).toEqual({
      all: 3,
      active: 1,
      completed: 2,
    })
  })

  it('handles an empty list', () => {
    expect(countByStatus([])).toEqual({ all: 0, active: 0, completed: 0 })
  })
})
