import { useState } from 'react'
import { Check, X } from 'lucide-react'
import { useTaskStore } from '../../stores/useTaskStore'
import { taskInstanceSchema } from '../../schemas/taskSchemas'

const AddTaskCard = ({ onSave, onCancel, domains = [], projectId, scheduledDate }) => {
  const { createTask } = useTaskStore()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)
  // Form state
  const [taskName, setTaskName] = useState('')
  const [description, setDescription] = useState('')
  const [selectedDomain, setSelectedDomain] = useState('')
  const [version, setVersion] = useState('')

  // Target state
  const [targetValue, setTargetValue] = useState('')
  const [targetMeasure, setTargetMeasure] = useState('unit')
  const [targetUnit, setTargetUnit] = useState('unit')

  // Timebox state
  const [timeboxValue, setTimeboxValue] = useState('')
  const [timeboxUnit, setTimeboxUnit] = useState('mins')

  const handleSave = async () => {
    try {
      setIsSubmitting(true)
      setError(null)

      // Prepare task data
      const taskData = {
        taskName,
        description: description || null,
        notes: null,
        projectId,
        domainId: selectedDomain,
        version: version || null,
        measureType: targetMeasure === 'unit' ? 'unit' : targetMeasure === '%' ? 'percentage' : targetMeasure,
        measureUnit: targetMeasure === 'unit' ? targetUnit : null,
        scheduledDate: scheduledDate || null,
        targetValue: targetValue ? parseFloat(targetValue) : null,
        timeboxValue: timeboxValue ? parseFloat(timeboxValue) : null,
        timeboxUnit: timeboxUnit || null
      }

      console.log('Task data before validation:', taskData)

      // Validate with Zod
      const validated = taskInstanceSchema.parse(taskData)

      console.log('Validated task data:', validated)

      // Call edge function via store
      const result = await createTask(validated)

      if (result.success) {
        onSave(result.data)
        // Reset form
        setTaskName('')
        setDescription('')
        setSelectedDomain('')
        setVersion('')
        setTargetValue('')
        setTargetUnit('unit')
        setTimeboxValue('')
      } else {
        setError(result.error || 'Failed to create task')
      }
    } catch (err) {
      console.error('Error saving task:', err)
      if (err.errors) {
        // Zod validation error
        setError(err.errors[0]?.message || 'Validation error')
      } else {
        setError(err.message || 'Failed to save task')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-[var(--container-subtle)] rounded-lg p-6 mb-4">
      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 rounded bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
          {error}
        </div>
      )}

      {/* Task Name Input */}
      <input
        type="text"
        value={taskName}
        onChange={(e) => setTaskName(e.target.value)}
        placeholder="Add Task.."
        className="w-full bg-transparent border-none outline-none text-[var(--text-primary)] text-xl font-medium mb-2 placeholder:text-[var(--text-secondary)]"
      />

      {/* Description Input */}
      <input
        type="text"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Add Task Description"
        className="w-full bg-transparent border-none outline-none text-[var(--text-secondary)] text-sm mb-6 placeholder:text-[var(--text-secondary)]"
      />

      {/* Tags Row with Action Icons */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-wrap gap-3">
        {/* Domain Picker */}
        <div className="inline-flex items-center">
          <select
            value={selectedDomain}
            onChange={(e) => setSelectedDomain(e.target.value)}
            className="bg-[var(--container-medium)] text-[var(--text-primary)] text-sm px-3 py-1.5 rounded border-none outline-none cursor-pointer appearance-none pr-8"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23ffffff' opacity='0.6' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 8px center'
            }}
          >
            <option value="">Domain</option>
            {domains.map((domain) => (
              <option key={domain.id} value={domain.id}>
                {domain.name}
              </option>
            ))}
          </select>
        </div>

        {/* Version */}
        <div className="inline-flex items-center bg-[var(--container-medium)] rounded px-3 py-1.5">
          <span className="text-[var(--text-secondary)] text-sm mr-2">V</span>
          <input
            type="text"
            value={version}
            onChange={(e) => setVersion(e.target.value)}
            className="bg-transparent border-none outline-none text-[var(--text-primary)] text-sm w-12"
            placeholder="-"
          />
        </div>

        {/* Target */}
        <div className="inline-flex items-center bg-[var(--container-medium)] rounded px-3 py-1.5 gap-2">
          <input
            type="number"
            value={targetValue}
            onChange={(e) => setTargetValue(e.target.value)}
            placeholder="Target"
            className="bg-transparent border-none outline-none text-[var(--text-primary)] text-sm w-16"
            step="0.01"
          />
          <select
            value={targetMeasure}
            onChange={(e) => {
              setTargetMeasure(e.target.value)
              if (e.target.value === 'unit') {
                setTargetUnit('unit')
              }
            }}
            className="bg-transparent text-[var(--text-primary)] text-sm border-none outline-none cursor-pointer"
          >
            <option value="unit">unit</option>
            <option value="%">%</option>
            <option value="revisions">revisions</option>
          </select>
          {/* Show editable unit input only when "unit" is selected */}
          {targetMeasure === 'unit' && (
            <input
              type="text"
              value={targetUnit}
              onChange={(e) => setTargetUnit(e.target.value)}
              className="bg-transparent border-none outline-none text-[var(--text-primary)] text-sm w-20"
              placeholder="unit name"
            />
          )}
        </div>

        {/* Timebox */}
        <div className="inline-flex items-center bg-[var(--container-medium)] rounded px-3 py-1.5 gap-2">
          <input
            type="number"
            value={timeboxValue}
            onChange={(e) => setTimeboxValue(e.target.value)}
            placeholder="Timebox"
            className="bg-transparent border-none outline-none text-[var(--text-primary)] text-sm w-16"
            min="0"
          />
          <select
            value={timeboxUnit}
            onChange={(e) => setTimeboxUnit(e.target.value)}
            className="bg-transparent text-[var(--text-primary)] text-sm border-none outline-none cursor-pointer"
          >
            <option value="mins">mins</option>
            <option value="hrs">hrs</option>
          </select>
        </div>
        </div>

        {/* Action Icons - Right aligned */}
        <div className="flex gap-2 ml-auto">
          <button
            onClick={handleSave}
            disabled={isSubmitting}
            className="p-2 rounded bg-[var(--container-medium)] text-[var(--text-primary)] hover:bg-[var(--accent-primary)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Save task"
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-[var(--text-primary)] border-t-transparent rounded-full animate-spin" />
            ) : (
              <Check className="w-4 h-4" strokeWidth={2} />
            )}
          </button>
          <button
            onClick={onCancel}
            className="p-2 rounded bg-[var(--container-medium)] text-[var(--text-secondary)] hover:bg-[var(--container-intense)] transition-colors"
            aria-label="Cancel"
          >
            <X className="w-4 h-4" strokeWidth={2} />
          </button>
        </div>
      </div>
    </div>
  )
}

export default AddTaskCard
