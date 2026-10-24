import { useCallback, useEffect, useReducer, useState } from 'react'
import { loadTasks, saveTasks } from './storage'
import { tasksReducer } from './tasksReducer'
import type { Filter } from './types'

export function useTasks() {
  const [tasks, dispatch] = useReducer(tasksReducer, undefined, loadTasks)
  const [filter, setFilter] = useState<Filter>('all')

  useEffect(() => {
    saveTasks(tasks)
  }, [tasks])

  const addTask = useCallback((title: string) => dispatch({ type: 'add', title }), [])
  const toggleTask = useCallback((id: string) => dispatch({ type: 'toggle', id }), [])
  const removeTask = useCallback((id: string) => dispatch({ type: 'remove', id }), [])
  const clearCompleted = useCallback(() => dispatch({ type: 'clearCompleted' }), [])

  return { tasks, filter, setFilter, addTask, toggleTask, removeTask, clearCompleted }
}
