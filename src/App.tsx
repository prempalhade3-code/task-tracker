import { FilterBar } from './components/FilterBar'
import { TaskInput } from './components/TaskInput'
import { TaskItem } from './components/TaskItem'
import { countByStatus, filterTasks } from './tasksReducer'
import { useTasks } from './useTasks'
import type { Filter } from './types'

const EMPTY_MESSAGES: Record<Filter, string> = {
  all: 'No tasks yet. Add your first one above.',
  active: 'Nothing pending. You are all caught up.',
  completed: 'No completed tasks yet.',
}

export default function App() {
  const { tasks, filter, setFilter, addTask, toggleTask, removeTask, clearCompleted } = useTasks()

  const visibleTasks = filterTasks(tasks, filter)
  const counts = countByStatus(tasks)

  return (
    <main className="app">
      <header className="app__header">
        <h1 className="app__title">Task Tracker</h1>
        <p className="app__subtitle">
          {counts.active === 0
            ? 'All done'
            : `${counts.active} task${counts.active === 1 ? '' : 's'} left`}
        </p>
      </header>

      <TaskInput onAdd={addTask} />
      <FilterBar value={filter} counts={counts} onChange={setFilter} />

      {visibleTasks.length === 0 ? (
        <p className="empty-state" role="status">
          {EMPTY_MESSAGES[filter]}
        </p>
      ) : (
        <ul className="task-list">
          {visibleTasks.map((task) => (
            <TaskItem key={task.id} task={task} onToggle={toggleTask} onRemove={removeTask} />
          ))}
        </ul>
      )}

      {counts.completed > 0 && (
        <footer className="app__footer">
          <button type="button" className="clear-completed" onClick={clearCompleted}>
            Clear completed ({counts.completed})
          </button>
        </footer>
      )}
    </main>
  )
}
