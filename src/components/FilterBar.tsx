import type { Filter } from '../types'
import type { TaskCounts } from '../tasksReducer'

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Pending' },
  { value: 'completed', label: 'Completed' },
]

interface FilterBarProps {
  value: Filter
  counts: TaskCounts
  onChange: (filter: Filter) => void
}

export function FilterBar({ value, counts, onChange }: FilterBarProps) {
  return (
    <div className="filter-bar" role="group" aria-label="Filter tasks">
      {FILTERS.map((filter) => (
        <button
          key={filter.value}
          type="button"
          className={`filter-bar__button${value === filter.value ? ' filter-bar__button--active' : ''}`}
          aria-pressed={value === filter.value}
          onClick={() => onChange(filter.value)}
        >
          {filter.label}
          <span className="filter-bar__count">{counts[filter.value]}</span>
        </button>
      ))}
    </div>
  )
}
