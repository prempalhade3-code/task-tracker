import { useState, type FormEvent } from 'react'

interface TaskInputProps {
  onAdd: (title: string) => void
}

export function TaskInput({ onAdd }: TaskInputProps) {
  const [title, setTitle] = useState('')
  const trimmed = title.trim()

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!trimmed) return
    onAdd(trimmed)
    setTitle('')
  }

  return (
    <form className="task-input" onSubmit={handleSubmit}>
      <input
        className="task-input__field"
        type="text"
        value={title}
        maxLength={200}
        placeholder="What needs to be done?"
        aria-label="New task"
        onChange={(event) => setTitle(event.target.value)}
      />
      <button className="task-input__button" type="submit" disabled={!trimmed}>
        Add
      </button>
    </form>
  )
}
