import type { Task } from '../types'

interface TaskItemProps {
  task: Task
  onToggle: (id: string) => void
  onRemove: (id: string) => void
}

export function TaskItem({ task, onToggle, onRemove }: TaskItemProps) {
  return (
    <li className={`task-item${task.completed ? ' task-item--completed' : ''}`}>
      <label className="task-item__label">
        <input
          className="task-item__checkbox"
          type="checkbox"
          checked={task.completed}
          onChange={() => onToggle(task.id)}
          aria-label={`Mark "${task.title}" as ${task.completed ? 'pending' : 'completed'}`}
        />
        <span className="task-item__title">{task.title}</span>
      </label>
      <button
        className="task-item__delete"
        type="button"
        onClick={() => onRemove(task.id)}
        aria-label={`Delete "${task.title}"`}
      >
        <span aria-hidden="true">✕</span>
      </button>
    </li>
  )
}
