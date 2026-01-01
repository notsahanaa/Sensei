import { useState } from 'react'
import { Circle, CheckCircle2, Target, GripVertical, Trash2 } from 'lucide-react'

const TaskCard = ({ task, onDelete, onToggleComplete, onClick }) => {
  const [isHovered, setIsHovered] = useState(false)

  const handleDelete = (e) => {
    e.stopPropagation()
    onDelete(task.id)
  }

  const handleToggleComplete = (e) => {
    e.stopPropagation()
    onToggleComplete(task.id)
  }

  const handleClick = () => {
    if (onClick) {
      onClick(task)
    }
  }

  const isCompleted = task.status === 'completed'

  return (
    <div
      className={`relative bg-[var(--container-subtle)] rounded-lg p-4 transition-all cursor-pointer ${
        isCompleted ? 'opacity-50' : ''
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      <div className="flex items-start gap-3">
        {/* Left side: Drag handle (visible on hover) + Checkbox */}
        <div className="flex items-center gap-2 mt-0.5">
          <button
            className={`text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all cursor-grab active:cursor-grabbing ${
              isHovered ? 'opacity-100' : 'opacity-0'
            }`}
            aria-label="Drag to reorder"
          >
            <GripVertical className="w-4 h-4" strokeWidth={1.5} />
          </button>
          <button
            onClick={handleToggleComplete}
            className="text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-colors"
            aria-label={isCompleted ? 'Mark as incomplete' : 'Mark as complete'}
          >
            {isCompleted ? (
              <CheckCircle2 className="w-5 h-5 text-[var(--accent-primary)] fill-[var(--accent-primary)]" strokeWidth={2} />
            ) : (
              <Circle className="w-5 h-5" strokeWidth={1.5} />
            )}
          </button>
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <h3 className="text-[var(--text-primary)] font-medium mb-1">
            {task.task_name}
          </h3>
          <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
            {task.domain && <span>{task.domain.name}</span>}
            {task.domain && task.version && <span>|</span>}
            {task.version && <span>V {task.version}</span>}
          </div>
        </div>

        {/* Right side: Target/Timebox + Delete (visible on hover) */}
        <div className="flex items-center gap-3">
          {/* Target and Timebox */}
          {(task.target_value || task.timebox_value) && (
            <div className="text-right">
              {task.target_value && (
                <div className="flex items-center gap-1 text-[var(--text-primary)] text-sm font-medium justify-end">
                  <Target className="w-4 h-4" strokeWidth={1.5} />
                  <span>
                    {task.target_value} {task.measure_unit || task.measure_type}
                  </span>
                </div>
              )}
              {task.timebox_value && (
                <div className="text-xs text-[var(--text-secondary)] mt-1">
                  {task.timebox_value} {task.timebox_unit}
                </div>
              )}
            </div>
          )}

          {/* Delete icon (always takes up space, visible on hover) */}
          <button
            onClick={handleDelete}
            className={`text-[var(--text-secondary)] hover:text-red-500 transition-all ${
              isHovered ? 'opacity-100' : 'opacity-0'
            }`}
            aria-label="Delete task"
          >
            <Trash2 className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </div>
  )
}

export default TaskCard
