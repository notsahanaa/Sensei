import { useState } from 'react'
import { X, Trash2, ArrowLeft } from 'lucide-react'

const CheckInModal = ({ task, onClose, onBack, onDelete, onComplete, projects = [], domains = [] }) => {
  const [timeTaken, setTimeTaken] = useState('')
  const [timeUnit, setTimeUnit] = useState('mins')
  const [workCompleted, setWorkCompleted] = useState('')
  const [version, setVersion] = useState(task.version || '')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Editable fields for right section
  const [editingField, setEditingField] = useState(null)
  const [projectId, setProjectId] = useState(task.project_id)
  const [domainId, setDomainId] = useState(task.domain_id)
  const [scheduledDate, setScheduledDate] = useState(task.scheduled_date)
  const [timeboxValue, setTimeboxValue] = useState(task.timebox_value || '')
  const [timeboxUnit, setTimeboxUnit] = useState(task.timebox_unit || 'mins')
  const [targetValue, setTargetValue] = useState(task.target_value || '')
  const [measureType, setMeasureType] = useState(task.measure_type || 'unit')
  const [measureUnit, setMeasureUnit] = useState(task.measure_unit || 'unit')

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      onDelete(task.id)
      onClose()
    }
  }

  const handleLogCompletion = async () => {
    setIsSubmitting(true)

    const completionData = {
      status: 'completed',
      completed_at: new Date().toISOString(),
      actual_time_spent: timeTaken ? parseFloat(timeTaken) : null,
      actual_work_completed: workCompleted || null,
      notes: notes || task.notes || null,
      version: version || null
    }

    await onComplete(task.id, completionData)
    setIsSubmitting(false)
    onClose()
  }

  const handleFieldUpdate = (field, value) => {
    // This would update the task fields if needed
    setEditingField(null)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-[var(--container-subtle)] rounded-lg w-[84%] h-[84%] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - 10% */}
        <div className="h-[10%] px-8 flex items-center justify-between border-b border-[var(--container-medium)]">
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                onClick={onBack}
                className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                aria-label="Go back"
              >
                <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
              </button>
            )}
            <h2 className="text-base font-medium text-[var(--text-primary)]">
              Task <span className="text-[var(--text-secondary)]">//</span> Complete Task
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleDelete}
              className="p-2 text-[var(--text-secondary)] hover:text-red-500 transition-colors"
              aria-label="Delete task"
            >
              <Trash2 className="w-4 h-4" strokeWidth={1.5} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" strokeWidth={1.5} />
            </button>
          </div>
        </div>

        {/* Content - 90% split into 76% + 24% */}
        <div className="h-[90%] flex">
          {/* Left Section - 76% */}
          <div className="w-[76%] p-8 flex flex-col border-r border-[var(--container-medium)]">
            {/* First Section - Task Info */}
            <div className="mb-6">
              <h3 className="text-xl font-medium text-[var(--text-primary)] mb-2">
                {task.task_name}
              </h3>
              <p className="text-sm text-[var(--text-secondary)]">
                {task.description || 'No description'}
              </p>
            </div>

            {/* Divider */}
            <div className="w-full h-px bg-[var(--container-medium)] mb-6" />

            {/* Second Section - Completion Details */}
            <div className="mb-6">
              {/* Time Taken */}
              <div className="mb-4">
                <label className="text-sm text-[var(--text-secondary)] mb-2 block">
                  Time Taken
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={timeTaken}
                    onChange={(e) => setTimeTaken(e.target.value)}
                    placeholder="Enter time"
                    className="flex-1 px-3 py-2 rounded bg-[var(--container-medium)] text-[var(--text-primary)] text-sm border-none outline-none"
                    min="0"
                    step="0.5"
                  />
                  <select
                    value={timeUnit}
                    onChange={(e) => setTimeUnit(e.target.value)}
                    className="px-3 py-2 rounded bg-[var(--container-medium)] text-[var(--text-primary)] text-sm border-none outline-none"
                  >
                    <option value="mins">mins</option>
                    <option value="hrs">hrs</option>
                  </select>
                </div>
              </div>

              {/* Work Completed */}
              <div className="mb-4">
                <label className="text-sm text-[var(--text-secondary)] mb-2 block">
                  Work Completed
                </label>
                <input
                  type="text"
                  value={workCompleted}
                  onChange={(e) => setWorkCompleted(e.target.value)}
                  placeholder="e.g., 2 scripts written"
                  className="w-full px-3 py-2 rounded bg-[var(--container-medium)] text-[var(--text-primary)] text-sm border-none outline-none"
                />
              </div>

              {/* Version */}
              <div className="mb-4">
                <label className="text-sm text-[var(--text-secondary)] mb-2 block">
                  Version
                </label>
                <input
                  type="text"
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  placeholder="Version number"
                  className="w-full px-3 py-2 rounded bg-[var(--container-medium)] text-[var(--text-primary)] text-sm border-none outline-none"
                />
              </div>
            </div>

            {/* Divider */}
            <div className="w-full h-px bg-[var(--container-medium)] mb-6" />

            {/* Third Section - Notes */}
            <div className="flex-1 mb-6">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add Notes (Optional)..."
                className="w-full h-full bg-transparent border-none outline-none text-[var(--text-secondary)] text-sm resize-none placeholder:italic placeholder:text-[var(--text-secondary)]"
              />
            </div>

            {/* Log Completion Button */}
            <button
              onClick={handleLogCompletion}
              disabled={isSubmitting}
              className="w-full py-3 rounded bg-[var(--accent-primary)] text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Logging...' : 'Log Completion'}
            </button>
          </div>

          {/* Right Section - 24% (Same as Task Modal) */}
          <div className="w-[24%] p-8 flex flex-col gap-6">
            {/* Project Details */}
            <div>
              <h4 className="text-sm font-medium text-[var(--text-primary)] mb-4">Project Details</h4>

              {/* Project */}
              <div className="mb-4">
                <label className="text-xs text-[var(--text-secondary)] mb-1 block">Project</label>
                {editingField === 'project' ? (
                  <select
                    value={projectId}
                    onChange={(e) => {
                      setProjectId(e.target.value)
                      handleFieldUpdate('project_id', e.target.value)
                    }}
                    onBlur={() => setEditingField(null)}
                    autoFocus
                    className="w-full bg-transparent text-[var(--text-primary)] text-sm border-none outline-none"
                  >
                    {projects.map(project => (
                      <option key={project.id} value={project.id}>{project.name}</option>
                    ))}
                  </select>
                ) : (
                  <div
                    onDoubleClick={() => setEditingField('project')}
                    className="text-sm text-[var(--text-primary)] cursor-pointer hover:text-[var(--accent-primary)]"
                  >
                    {projects.find(p => p.id === projectId)?.name || 'Select project'}
                  </div>
                )}
                <div className="w-[80%] h-px bg-[var(--container-medium)] mt-2" />
              </div>

              {/* Domain */}
              <div className="mb-4">
                <label className="text-xs text-[var(--text-secondary)] mb-1 block">Domain</label>
                {editingField === 'domain' ? (
                  <select
                    value={domainId}
                    onChange={(e) => {
                      setDomainId(e.target.value)
                      handleFieldUpdate('domain_id', e.target.value)
                    }}
                    onBlur={() => setEditingField(null)}
                    autoFocus
                    className="w-full bg-transparent text-[var(--text-primary)] text-sm border-none outline-none"
                  >
                    {domains.map(domain => (
                      <option key={domain.id} value={domain.id}>{domain.name}</option>
                    ))}
                  </select>
                ) : (
                  <div
                    onDoubleClick={() => setEditingField('domain')}
                    className="text-sm text-[var(--text-primary)] cursor-pointer hover:text-[var(--accent-primary)]"
                  >
                    {task.domain?.name || 'Select domain'}
                  </div>
                )}
                <div className="w-[80%] h-px bg-[var(--container-medium)] mt-2" />
              </div>

              {/* Day */}
              <div className="mb-4">
                <label className="text-xs text-[var(--text-secondary)] mb-1 block">Day</label>
                {editingField === 'day' ? (
                  <input
                    type="date"
                    value={scheduledDate || ''}
                    onChange={(e) => {
                      setScheduledDate(e.target.value)
                      handleFieldUpdate('scheduled_date', e.target.value)
                    }}
                    onBlur={() => setEditingField(null)}
                    autoFocus
                    className="w-full bg-transparent text-[var(--text-primary)] text-sm border-none outline-none"
                  />
                ) : (
                  <div
                    onDoubleClick={() => setEditingField('day')}
                    className="text-sm text-[var(--text-primary)] cursor-pointer hover:text-[var(--accent-primary)]"
                  >
                    {scheduledDate ? new Date(scheduledDate).toLocaleDateString() : 'Today'}
                  </div>
                )}
                <div className="w-[80%] h-px bg-[var(--container-medium)] mt-2" />
              </div>
            </div>

            {/* Divider between sections */}
            <div className="w-full h-px bg-[var(--container-medium)]" />

            {/* Project Goals */}
            <div>
              <h4 className="text-sm font-medium text-[var(--text-primary)] mb-4">Project Goals</h4>

              {/* Timebox */}
              <div className="mb-4">
                <label className="text-xs text-[var(--text-secondary)] mb-1 block">Timebox</label>
                <div className="text-sm text-[var(--text-primary)]">
                  {timeboxValue ? `${timeboxValue} ${timeboxUnit}` : 'No timebox set'}
                </div>
                <div className="w-[80%] h-px bg-[var(--container-medium)] mt-2" />
              </div>

              {/* Target */}
              <div className="mb-4">
                <label className="text-xs text-[var(--text-secondary)] mb-1 block">Target</label>
                <div className="text-sm text-[var(--text-primary)]">
                  {targetValue ? `${targetValue} ${measureUnit || measureType}` : 'No target set'}
                </div>
                <div className="w-[80%] h-px bg-[var(--container-medium)] mt-2" />
              </div>

              {/* Version */}
              <div className="mb-4">
                <label className="text-xs text-[var(--text-secondary)] mb-1 block">Version</label>
                <div className="text-sm text-[var(--text-primary)]">
                  {task.version ? `Version ${task.version}` : 'No version set'}
                </div>
                <div className="w-[80%] h-px bg-[var(--container-medium)] mt-2" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CheckInModal
