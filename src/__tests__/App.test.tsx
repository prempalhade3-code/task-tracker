import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import App from '../App'
import { STORAGE_KEY } from '../storage'
import type { Task } from '../types'

function readStored(): Task[] {
  const raw = window.localStorage.getItem(STORAGE_KEY)
  return raw ? (JSON.parse(raw) as Task[]) : []
}

function titles() {
  return screen
    .getAllByRole('listitem')
    .map((item) => item.querySelector('.task-item__title')?.textContent ?? '')
}

async function addTasks(user: ReturnType<typeof userEvent.setup>, ...names: string[]) {
  const input = screen.getByLabelText('New task')
  for (const name of names) {
    await user.clear(input)
    await user.type(input, `${name}{Enter}`)
  }
}

beforeEach(() => {
  window.localStorage.clear()
})

describe('Task Tracker', () => {
  it('starts with an empty state and no tasks', () => {
    render(<App />)
    expect(screen.getByText(/No tasks yet/i)).toBeInTheDocument()
    expect(screen.queryAllByRole('listitem')).toHaveLength(0)
    expect(screen.getByText('All done')).toBeInTheDocument()
  })

  it('adds tasks, clears the field and shows the pending count', async () => {
    const user = userEvent.setup()
    render(<App />)

    const input = screen.getByLabelText('New task')
    await user.type(input, 'Buy milk{Enter}')

    expect(screen.getByText('Buy milk')).toBeInTheDocument()
    expect(input).toHaveValue('')
    expect(screen.getByText('1 task left')).toBeInTheDocument()
  })

  it('keeps the add button disabled for blank input', async () => {
    const user = userEvent.setup()
    render(<App />)

    const addButton = screen.getByRole('button', { name: 'Add' })
    expect(addButton).toBeDisabled()

    await user.type(screen.getByLabelText('New task'), '   ')
    expect(addButton).toBeDisabled()

    await user.type(screen.getByLabelText('New task'), 'Real task')
    expect(addButton).toBeEnabled()
  })

  it('shows newest tasks first', async () => {
    const user = userEvent.setup()
    render(<App />)
    await addTasks(user, 'First', 'Second', 'Third')

    expect(titles()).toEqual(['Third', 'Second', 'First'])
  })

  it('marks a task as completed and back to pending', async () => {
    const user = userEvent.setup()
    render(<App />)
    await addTasks(user, 'Walk the dog')

    const checkbox = screen.getByRole('checkbox', { name: /Mark "Walk the dog" as completed/ })
    await user.click(checkbox)

    expect(checkbox).toBeChecked()
    expect(screen.getByText('All done')).toBeInTheDocument()
    expect(readStored()[0].completed).toBe(true)

    await user.click(screen.getByRole('checkbox', { name: /Mark "Walk the dog" as pending/ }))
    expect(screen.getByText('1 task left')).toBeInTheDocument()
    expect(readStored()[0].completed).toBe(false)
  })

  it('deletes a task', async () => {
    const user = userEvent.setup()
    render(<App />)
    await addTasks(user, 'Keep me', 'Delete me')

    await user.click(screen.getByRole('button', { name: 'Delete "Delete me"' }))

    expect(screen.queryByText('Delete me')).not.toBeInTheDocument()
    expect(titles()).toEqual(['Keep me'])
    expect(readStored().map((task) => task.title)).toEqual(['Keep me'])
  })

  it('filters between all, pending and completed', async () => {
    const user = userEvent.setup()
    render(<App />)
    await addTasks(user, 'Done task', 'Pending task')

    await user.click(screen.getByRole('checkbox', { name: /Mark "Done task" as completed/ }))

    const filterGroup = screen.getByRole('group', { name: 'Filter tasks' })
    const pendingFilter = within(filterGroup).getByRole('button', { name: /Pending/ })
    const completedFilter = within(filterGroup).getByRole('button', { name: /Completed/ })
    const allFilter = within(filterGroup).getByRole('button', { name: /All/ })

    await user.click(pendingFilter)
    expect(titles()).toEqual(['Pending task'])

    await user.click(completedFilter)
    expect(titles()).toEqual(['Done task'])

    await user.click(allFilter)
    expect(titles()).toEqual(['Pending task', 'Done task'])
  })

  it('shows a contextual empty state per filter', async () => {
    const user = userEvent.setup()
    render(<App />)
    await addTasks(user, 'Only pending')

    await user.click(screen.getByRole('button', { name: /Completed/ }))
    expect(screen.getByText(/No completed tasks yet/i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Pending/ }))
    expect(screen.queryByText(/Nothing pending/i)).not.toBeInTheDocument()
  })

  it('clears completed tasks', async () => {
    const user = userEvent.setup()
    render(<App />)
    await addTasks(user, 'One', 'Two')
    await user.click(screen.getByRole('checkbox', { name: /Mark "One" as completed/ }))

    await user.click(screen.getByRole('button', { name: /Clear completed \(1\)/ }))

    expect(titles()).toEqual(['Two'])
    expect(screen.queryByRole('button', { name: /Clear completed/ })).not.toBeInTheDocument()
  })

  it('persists tasks across a remount', async () => {
    const user = userEvent.setup()
    const { unmount } = render(<App />)
    await addTasks(user, 'Survive refresh')
    await user.click(screen.getByRole('checkbox', { name: /Mark "Survive refresh" as completed/ }))

    expect(readStored()).toHaveLength(1)
    unmount()

    render(<App />)
    expect(screen.getByText('Survive refresh')).toBeInTheDocument()
    expect(screen.getByRole('checkbox')).toBeChecked()
  })

  it('loads previously stored tasks on first render', () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([{ id: 'x', title: 'From storage', completed: true, createdAt: 1 }]),
    )
    render(<App />)

    expect(screen.getByText('From storage')).toBeInTheDocument()
    expect(screen.getByRole('checkbox')).toBeChecked()
  })
})
