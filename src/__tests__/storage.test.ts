import { describe, expect, it, vi } from 'vitest'
import { isTask, loadTasks, saveTasks, STORAGE_KEY } from '../storage'
import type { Task } from '../types'

class MemoryStorage implements Storage {
  private map = new Map<string, string>()
  get length() {
    return this.map.size
  }
  clear() {
    this.map.clear()
  }
  getItem(key: string) {
    return this.map.get(key) ?? null
  }
  key(index: number) {
    return Array.from(this.map.keys())[index] ?? null
  }
  removeItem(key: string) {
    this.map.delete(key)
  }
  setItem(key: string, value: string) {
    this.map.set(key, value)
  }
}

const task: Task = { id: '1', title: 'Persisted', completed: false, createdAt: 5 }

describe('storage', () => {
  it('round-trips tasks through save and load', () => {
    const storage = new MemoryStorage()
    saveTasks([task], storage)
    expect(loadTasks(storage)).toEqual([task])
  })

  it('returns an empty list when nothing is stored', () => {
    expect(loadTasks(new MemoryStorage())).toEqual([])
  })

  it('recovers from corrupt JSON', () => {
    const storage = new MemoryStorage()
    storage.setItem(STORAGE_KEY, '{not json')
    expect(loadTasks(storage)).toEqual([])
  })

  it('ignores stored values that are not an array', () => {
    const storage = new MemoryStorage()
    storage.setItem(STORAGE_KEY, JSON.stringify({ id: '1' }))
    expect(loadTasks(storage)).toEqual([])
  })

  it('drops malformed entries but keeps valid ones', () => {
    const storage = new MemoryStorage()
    storage.setItem(
      STORAGE_KEY,
      JSON.stringify([task, { id: 2, title: 'bad' }, null, 'nope']),
    )
    expect(loadTasks(storage)).toEqual([task])
  })

  it('validates task shape with isTask', () => {
    expect(isTask(task)).toBe(true)
    expect(isTask({ ...task, completed: 'yes' })).toBe(false)
    expect(isTask(null)).toBe(false)
  })

  it('does not throw when writing fails', () => {
    const storage = new MemoryStorage()
    vi.spyOn(storage, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError')
    })
    expect(() => saveTasks([task], storage)).not.toThrow()
  })

  it('is a no-op without a storage backend', () => {
    expect(loadTasks(undefined)).toEqual([])
    expect(() => saveTasks([task], undefined)).not.toThrow()
  })
})
